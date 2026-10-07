import { EQUIP_SLOTS } from '../data/types';
import type { RunState } from './run';
import type { KeyValueStore } from './save';

/**
 * The Codex remembers which gems and uniques the player has ever held (per browser, across runs). Storage may be
 * unavailable; nothing here throws.
 */
const KEY = 'bob.codex.v1';

export function loadFound(store: KeyValueStore | null): Set<string> {
  try {
    const raw = store?.getItem(KEY) ?? null;
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

/** The gem and unique ids a run holds right now: worn, socketed or in the bag. */
export function heldIds(run: RunState): string[] {
  const out: string[] = [];
  for (const slot of EQUIP_SLOTS) {
    const it = run.build.equipment[slot];
    if (!it) continue;
    if (it.uniqueId) out.push(it.uniqueId);
    for (const g of it.sockets) if (g) out.push(g.gemId);
  }
  for (const f of run.build.flasks) if (f?.uniqueId) out.push(f.uniqueId);
  for (const it of run.inventory) {
    if (it.kind === 'gem') out.push(it.gemId);
    else if (it.kind === 'item' || it.kind === 'flask') {
      if (it.uniqueId) out.push(it.uniqueId);
      if (it.kind === 'item') for (const g of it.sockets) if (g) out.push(g.gemId);
    }
  }
  return out;
}

/** Add what the run holds to the Codex. */
export function recordFound(store: KeyValueStore | null, run: RunState): void {
  if (!store) return;
  try {
    const found = loadFound(store);
    const before = found.size;
    for (const id of heldIds(run)) found.add(id);
    if (found.size !== before) store.setItem(KEY, JSON.stringify([...found]));
  } catch {
    // The Codex is a convenience only.
  }
}
