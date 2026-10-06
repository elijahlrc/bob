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
    if (data.version !== SAVE_VERSION || !data.run) return { status: 'incompatible' };
    return { status: 'ok', run: data.run };
  } catch {
    return { status: 'incompatible' };
  }
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
