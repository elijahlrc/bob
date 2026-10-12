import { stampAll } from './found';
import { releaseStrandedGems } from './inventory';
import { LEGACY } from '../data/difficulty';
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

/** §5.5: `{ version, run }` under the given key (a slot's, see `slotKey`). */
export function saveRun(store: KeyValueStore, run: RunState, key: string = SAVE_KEY): void {
  store.setItem(key, JSON.stringify({ version: SAVE_VERSION, run }));
}

export function loadRun(store: KeyValueStore, key: string = SAVE_KEY): LoadResult {
  const raw = store.getItem(key);
  if (!raw) return { status: 'none' };
  try {
    const data = JSON.parse(raw) as { version?: number; run?: RunState };
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
  // Version 10 has the passive tree of before docs/TREE-REDESIGN.md (roads, districts), version 11 the one of before its
  // iteration 3 (crossings between regions, forks from the middle) and version 12 the one of before iteration 4 (two roads out of
  // each start) and version 13 the one of before iteration 5 (tiers, starter kits, shapes): their node ids mean other nodes now, so the allocated passives are handed back as unspent points.
  if (version === 10 || version === 11 || version === 12 || version === 13) {
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
export type SlotSummary = { id: SlotId; result: LoadResult };

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
  const out = index.slots.map((id) => ({ id, result: loadRun(store, slotKey(id)) }));
  const kept = out.filter((s) => s.result.status !== 'none');
  if (kept.length !== index.slots.length) {
    index.slots = kept.map((s) => s.id);
    writeIndex(store, index);
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
