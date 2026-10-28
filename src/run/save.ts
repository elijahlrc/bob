import { stampAll } from './found';
import { releaseStrandedGems } from './inventory';
import { LEGACY } from '../data/difficulty';
import { pack, unpack } from './pack';
import { SAVE_VERSION, type RunState } from './run';

/** The subset of the Web Storage API the game needs (injected so `run/` stays headless). */
export type KeyValueStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

/** The key of the one save the game had before save slots; adopted as slot 1 the first time slots are listed. */
export const SAVE_KEY = 'bob.save';
/** The list of slots: `{ next, slots }`, newest first. */
export const SLOTS_KEY = 'bob.saves';

export type LoadResult =
  { status: 'none' } | { status: 'incompatible' } | { status: 'ok'; run: RunState };

/** A stored save starting with this is packed (pack.ts); one starting with `{` is plain JSON, as saves were before packing. */
const PACKED = '~';

/** The JSON text of a stored save, whether it was stored packed or plain; null when there is none. */
export function savedJson(store: KeyValueStore, key: string = SAVE_KEY): string | null {
  const raw = store.getItem(key);
  if (raw === null) return null;
  return raw.startsWith(PACKED) ? unpack(raw.slice(PACKED.length)) : raw;
}

/**
 * §5.5: `{ version, run }` under the given key (a slot's, see `slotKey`), packed: a browser keeps about five million
 * characters for a page, the save of a long run is hundreds of thousands, and every run has its own.
 */
export function saveRun(store: KeyValueStore, run: RunState, key: string = SAVE_KEY): void {
  store.setItem(key, PACKED + pack(JSON.stringify({ version: SAVE_VERSION, run })));
}

export function loadRun(store: KeyValueStore, key: string = SAVE_KEY): LoadResult {
  if (!store.getItem(key)) return { status: 'none' };
  try {
    const data = JSON.parse(savedJson(store, key) ?? '') as { version?: number; run?: RunState };
    if (data.version === undefined || !data.run) return { status: 'incompatible' };
    const run = migrate(data.version, data.run);
    // A gem left inside a carried item (an older save) is set free: it would be lost with the item.
    if (run) releaseStrandedGems(run);
    return run ? { status: 'ok', run } : { status: 'incompatible' };
  } catch {
    return { status: 'incompatible' };
  }
}

/**
 * Bring a saved run up to the current version, or null if it is too old. Older saves are normally rejected (the game is
 * still changing); version 6 is carried over because it only lacks the found, seen and favourite lists (found.ts).
 */
export function migrate(version: number, run: RunState): RunState | null {
  if (version === SAVE_VERSION) return run;
  // Version 20 has the hand-written tree before the growth of docs/tree/design/G-growth.md, version 21 the grown tree
  // before G4 fix pass 1 and version 22 before fix pass 2: nodes were moved and retired, so the allocated passives are
  // handed back as unspent points.
  if (version === 20 || version === 21 || version === 22) {
    run.version = SAVE_VERSION;
    run.build = { ...run.build, allocated: [] };
    return run;
  }
  // Versions 18 and 19 have the generated passive tree, before the hand-written one (docs/PASSIVE-TREE.md, phase F): their
  // node ids mean other nodes now, so the allocated passives are handed back as unspent points. Version 18 also lacks the
  // Wayside state (docs/WAYSIDE.md), which every reader fills in with `waysideOf`.
  if (version === 18 || version === 19) {
    run.version = SAVE_VERSION;
    run.build = { ...run.build, allocated: [] };
    return run;
  }
  // Versions 10 to 16 have a passive tree of before one of the iterations of docs/TREE-REDESIGN.md (10: roads and districts; 11: before
  // crossings and forks; 12: before two roads out of each start; 13: before tiers, kits and shapes; 14: before threads and basic
  // clusters round the starts; 15: before pods and attribute highways; 16: before links between clusters; 17: before the starts were joined directly to their clusters): their node ids mean other
  // nodes now, so the allocated passives are handed back as unspent points.
  if (version >= 10 && version <= 17) {
    run.version = SAVE_VERSION;
    run.build = { ...run.build, allocated: [] };
    return run;
  }
  // Versions 8 and 9 have a passive tree of before docs/TREE.md "Look and density" and its second pass: their node ids mean
  // other nodes now, so the allocated passives are handed back as unspent points.
  if (version === 8 || version === 9) {
    run.version = SAVE_VERSION;
    run.build = { ...run.build, allocated: [] };
    return run;
  }
  // Version 7 only lacks the difficulty settings: a run in progress keeps the curve it was balanced on.
  if (version === 7) {
    const old = run as RunState;
    old.version = SAVE_VERSION;
    old.build = { ...old.build, allocated: [] };
    old.difficulty = { ...LEGACY };
    return old;
  }
  if (version === 6) {
    const old = run as RunState & { newLoot?: number[] };
    delete old.newLoot;
    old.version = SAVE_VERSION;
    old.build = { ...old.build, allocated: [] };
    old.unseen = [];
    old.acquired = {};
    old.favourites = [];
    // Nothing is known about when these were found: everything counts as found now, so nothing is old on day one.
    stampAll(old);
    old.difficulty = { ...LEGACY };
    return old;
  }
  return null;
}

export function clearSave(store: KeyValueStore, key: string = SAVE_KEY): void {
  store.removeItem(key);
}

// ---- Save slots (§5.5): each run has its own save, so starting a new run never replaces an older one. ----

export type SlotId = number;

/** What the title screen needs to show one slot. */
export type SlotSummary = {
  id: SlotId;
  result: LoadResult;
  /** Characters the save takes in the browser's storage. */
  size: number;
};

type SlotIndex = { next: number; slots: SlotId[] };

export function slotKey(id: SlotId): string {
  return `${SAVE_KEY}.${id}`;
}

function readIndex(store: KeyValueStore): SlotIndex {
  const legacy = store.getItem(SAVE_KEY);
  let index: SlotIndex | null = null;
  try {
    const raw = store.getItem(SLOTS_KEY);
    const data = raw ? (JSON.parse(raw) as Partial<SlotIndex>) : null;
    if (data && Array.isArray(data.slots) && typeof data.next === 'number')
      index = { next: data.next, slots: data.slots.filter((s) => Number.isInteger(s)) };
  } catch {
    // An unreadable list starts empty; the saves themselves are not touched.
  }
  index ??= { next: 1, slots: [] };
  // The single save from before slots becomes a slot of its own (copied first, so a failure loses nothing).
  if (legacy !== null) {
    try {
      const id = allocate(store, index);
      store.setItem(slotKey(id), legacy);
      index.slots.push(id);
      writeIndex(store, index);
      store.removeItem(SAVE_KEY);
    } catch {
      // A full store: the old save stays where it is and is adopted on a later start.
    }
  }
  return index;
}

function writeIndex(store: KeyValueStore, index: SlotIndex): void {
  store.setItem(SLOTS_KEY, JSON.stringify(index));
}

/** The next unused id (an id whose save exists is never reused, even if the list was lost). */
function allocate(store: KeyValueStore, index: SlotIndex): SlotId {
  while (index.slots.includes(index.next) || store.getItem(slotKey(index.next)) !== null)
    index.next++;
  return index.next++;
}

/** Every slot, the most recently saved first. A slot whose save is gone is dropped from the list. */
export function listSlots(store: KeyValueStore): SlotSummary[] {
  const index = readIndex(store);
  const out = index.slots.map((id) => ({
    id,
    result: loadRun(store, slotKey(id)),
    size: store.getItem(slotKey(id))?.length ?? 0,
  }));
  const kept = out.filter((s) => s.result.status !== 'none');
  if (kept.length !== index.slots.length) {
    index.slots = kept.map((s) => s.id);
    try {
      writeIndex(store, index);
    } catch {
      // A full store: the list is tidied on a later start.
    }
  }
  return kept;
}

/** Reserve a slot for a new run. It shows in the list once the run has been saved. */
export function newSlot(store: KeyValueStore): SlotId {
  const index = readIndex(store);
  const id = allocate(store, index);
  writeIndex(store, index);
  return id;
}

/** Save the run into its slot and make that slot the first in the list. */
export function saveSlot(store: KeyValueStore, id: SlotId, run: RunState): void {
  saveRun(store, run, slotKey(id));
  const index = readIndex(store);
  if (index.slots[0] === id) return;
  index.slots = [id, ...index.slots.filter((s) => s !== id)];
  writeIndex(store, index);
}

export function deleteSlot(store: KeyValueStore, id: SlotId): void {
  clearSave(store, slotKey(id));
  const index = readIndex(store);
  if (!index.slots.includes(id)) return;
  index.slots = index.slots.filter((s) => s !== id);
  writeIndex(store, index);
}

/** An in-memory store (tests, headless bot). */
export class MemoryStore implements KeyValueStore {
  private m = new Map<string, string>();
  getItem(k: string): string | null {
    return this.m.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    this.m.set(k, v);
  }
  removeItem(k: string): void {
    this.m.delete(k);
  }
}
