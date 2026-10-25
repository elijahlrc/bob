/**
 * Paintings kept between sessions (docs/MENU-SPEED.md 3.2): a painting is the same for the same key and size, so what
 * was painted once is stored in IndexedDB and read back when the game starts, and only new sizes are painted again.
 * Entries carry the painter's version (a hash of its source, `__LEAF_VERSION__`); a deploy that changes the painter
 * drops them. Without IndexedDB (a private window, blocked storage) the cache lives in memory only, as before.
 */

const DB = 'bob-leaf';
const STORE = 'paintings';
/** The most the stored paintings may hold, in characters of their data URLs. */
const CAP = 20_000_000;

type Row = { k: string; v: string; t: number };

/** In the dev server only with `?leafcache` (the painter changes under it without a new version). */
function enabled(): boolean {
  if (typeof indexedDB === 'undefined') return false;
  if (import.meta.env.DEV) return new URLSearchParams(location.search).has('leafcache');
  return true;
}

let dbp: Promise<IDBDatabase | null> | null = null;
function open(): Promise<IDBDatabase | null> {
  dbp ??= new Promise((done) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'k' });
      req.onsuccess = () => done(req.result);
      req.onerror = () => done(null);
      req.onblocked = () => done(null);
    } catch {
      done(null);
    }
  });
  return dbp;
}

// A dev server started before the version was defined has none: its paintings are 'dev' ones.
const prefix = () => `${typeof __LEAF_VERSION__ === 'string' ? __LEAF_VERSION__ : 'dev'}|`;

/** The stored paintings of this painter version, by cache key; older versions' are deleted. */
export async function loadPaintings(): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!enabled()) return out;
  const db = await open();
  if (!db) return out;
  return new Promise((done) => {
    try {
      const tx = db.transaction(STORE, 'readwrite');
      const st = tx.objectStore(STORE);
      const req = st.getAll();
      req.onsuccess = () => {
        const rows = (req.result as Row[]).sort((a, b) => b.t - a.t);
        const pre = prefix();
        let size = 0;
        for (const r of rows) {
          // Another version's, or past the cap (the oldest go first): gone.
          if (!r.k.startsWith(pre) || size + r.v.length > CAP) {
            st.delete(r.k);
            continue;
          }
          size += r.v.length;
          out.set(r.k.slice(pre.length), r.v);
        }
      };
      tx.oncomplete = () => done(out);
      tx.onerror = () => done(out);
      tx.onabort = () => done(out);
    } catch {
      done(out);
    }
  });
}

const pending = new Map<string, string>();
let timer: ReturnType<typeof setTimeout> | null = null;

/** Store a new painting, with others made about the same time, once the page has been quiet for a moment. */
export function savePainting(key: string, url: string): void {
  if (!enabled() || !url) return;
  pending.set(key, url);
  if (timer === null) timer = setTimeout(flush, 1500);
}

async function flush(): Promise<void> {
  timer = null;
  try {
    await write();
  } catch {
    /* storage full or gone: the paintings stay in memory */
  }
}

async function write(): Promise<void> {
  if (!pending.size) return;
  const rows = [...pending];
  pending.clear();
  const db = await open();
  if (!db) return;
  try {
    const tx = db.transaction(STORE, 'readwrite');
    const st = tx.objectStore(STORE);
    const t = Date.now();
    const pre = prefix();
    for (const [k, v] of rows) st.put({ k: pre + k, v, t } satisfies Row);
  } catch {
    /* storage full or gone: the paintings stay in memory */
  }
}

if (typeof window !== 'undefined') window.addEventListener('pagehide', () => void flush());
