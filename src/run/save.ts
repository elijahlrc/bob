import { stampAll } from './found';
import { SAVE_VERSION, type RunState } from './run';

/** The subset of the Web Storage API the game needs (injected so `run/` stays headless). */
export type KeyValueStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export const SAVE_KEY = 'bob.save';

export type LoadResult =
  { status: 'none' } | { status: 'incompatible' } | { status: 'ok'; run: RunState };

/** §5.5: `{ version: 1, run }` under `bob.save`. */
export function saveRun(store: KeyValueStore, run: RunState): void {
  store.setItem(SAVE_KEY, JSON.stringify({ version: SAVE_VERSION, run }));
}

export function loadRun(store: KeyValueStore): LoadResult {
  const raw = store.getItem(SAVE_KEY);
  if (!raw) return { status: 'none' };
  try {
    const data = JSON.parse(raw) as { version?: number; run?: RunState };
    if (data.version === undefined || !data.run) return { status: 'incompatible' };
    const run = migrate(data.version, data.run);
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
  if (version === 6) {
    const old = run as RunState & { newLoot?: number[] };
    delete old.newLoot;
    old.version = SAVE_VERSION;
    old.unseen = [];
    old.acquired = {};
    old.favourites = [];
    // Nothing is known about when these were found: everything counts as found now, so nothing is old on day one.
    stampAll(old);
    return old;
  }
  return null;
}

export function clearSave(store: KeyValueStore): void {
  store.removeItem(SAVE_KEY);
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
