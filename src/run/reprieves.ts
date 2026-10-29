import {
  CURSE_LEVELS,
  curseAffixId,
  reprieveDef,
  type CurseId,
  type ReprieveId,
} from '../data/reprieves';
import { blessingAffixId } from '../data/blessings';
import type { CraftResult } from './craft';
import { addProvision, pouchRoom } from './provisions';
import type { RunState } from './run';
import { waysideOf } from './wayside';

/** Why the character cannot take another reprieve now (the pouch is full), or null when it can. */
export function reprieveBlocker(run: RunState): string | null {
  return pouchRoom(run) ? null : 'Your pouch is full';
}

/** Take a reprieve (picked, bought or given): it goes in the pouch with the other provisions. */
export function acquireReprieve(run: RunState, id: ReprieveId): CraftResult {
  reprieveDef(id);
  const why = reprieveBlocker(run);
  if (why) return { ok: false, reason: why };
  addProvision(run, id);
  return { ok: true };
}

/** Start a curse: it holds for the next five levels. */
export function addCurse(run: RunState, id: CurseId): void {
  const w = waysideOf(run);
  w.curses = w.curses.filter((c) => c.until >= run.map && c.id !== id);
  w.curses.push({ id, until: run.map + CURSE_LEVELS });
}

/** The hidden affixes of the standing effects: the curses carried, and the Shrine's blessing held (docs/WAYSIDE.md 5.2). */
export function standingAffixes(run: RunState): string[] {
  const w = waysideOf(run);
  const blessed = w.blessing && (w.blessingUntil === null || w.blessingUntil >= run.map);
  return [...curseAffixes(run), ...(blessed ? [blessingAffixId(w.blessing!)] : [])];
}

/** The hidden affixes of the curses the character carries on the level about to be played. */
export function curseAffixes(run: RunState): string[] {
  return waysideOf(run)
    .curses.filter((c) => c.until >= run.map)
    .map((c) => curseAffixId(c.id));
}

/**
 * A reprieve fired on a map: it is used up, and its curse (if it has one) starts. Safe to call twice for one map (a Crawl spends
 * its reprieves at the end of a segment, and the run finishes the combined result): a reprieve already spent is not in the pouch.
 */
export function spendReprieve(run: RunState, id: string): void {
  const w = waysideOf(run);
  if ((w.pouch[id] ?? 0) <= 0) return;
  w.pouch[id]--;
  if (w.pouch[id] <= 0) delete w.pouch[id];
  const def = reprieveDef(id);
  if (def.curse) addCurse(run, def.curse);
}
