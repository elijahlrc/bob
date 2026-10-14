import { Rng } from '../core/rng';
import {
  CURSE_LEVELS,
  REPRIEVE_CAP,
  REPRIEVE_FROM,
  REPRIEVES,
  curseAffixId,
  reprieveDef,
  type CurseId,
  type ReprieveDef,
  type ReprieveId,
} from '../data/reprieves';
import type { CraftResult } from './craft';
import type { RunState } from './run';
import { waysideOf } from './wayside';

/** The Reprieve the character holds, if any. */
export function heldReprieve(run: RunState): ReprieveDef | null {
  const id = waysideOf(run).reprieve;
  return id ? reprieveDef(id) : null;
}

/** Why the character cannot take another Reprieve now, or null when it can. */
export function reprieveBlocker(run: RunState): string | null {
  const w = waysideOf(run);
  if (w.reprieve) return 'You already hold a reprieve';
  if (w.reprieves >= REPRIEVE_CAP) return `A run allows ${REPRIEVE_CAP} reprieves in all`;
  return null;
}

/** Take a Reprieve (bought, picked or given): one held at a time, three in a run. */
export function acquireReprieve(run: RunState, id: ReprieveId, swap = false): CraftResult {
  reprieveDef(id);
  const w = waysideOf(run);
  if (!swap) {
    const why = reprieveBlocker(run);
    if (why) return { ok: false, reason: why };
  } else if (w.reprieves >= REPRIEVE_CAP) {
    return { ok: false, reason: `A run allows ${REPRIEVE_CAP} reprieves in all` };
  }
  w.reprieve = id;
  w.reprieves++;
  return { ok: true };
}

/** Start a curse: it holds for the next five levels. */
export function addCurse(run: RunState, id: CurseId): void {
  const w = waysideOf(run);
  w.curses = w.curses.filter((c) => c.until >= run.map && c.id !== id);
  w.curses.push({ id, until: run.map + CURSE_LEVELS });
}

/** The hidden affixes of the curses the character carries on the level about to be played. */
export function curseAffixes(run: RunState): string[] {
  return waysideOf(run)
    .curses.filter((c) => c.until >= run.map)
    .map((c) => curseAffixId(c.id));
}

/**
 * A Reprieve fired on a map: it is gone from the character, and its curse (if it has one) starts. Safe to call twice for one map
 * (a Crawl spends it at the end of its segment, and the run finishes the combined result): only the Reprieve held counts.
 */
export function spendReprieve(run: RunState, id: string): void {
  const w = waysideOf(run);
  if (w.reprieve !== id) return;
  w.reprieve = null;
  const def = reprieveDef(id);
  if (def.curse) addCurse(run, def.curse);
}

/**
 * The Reprieve a Market sells on a level, if any: from level 20, about one level in five, never two in a row, drawn from the run
 * seed alone (so the same on every visit and in every reload).
 */
export function reprieveOnSale(seed: number, map: number): ReprieveId | null {
  const hit = (m: number) =>
    m >= REPRIEVE_FROM && new Rng(seed).fork(`reprievesale${m}`).chance(0.2);
  if (!hit(map) || hit(map - 1)) return null;
  return new Rng(seed).fork(`reprievekind${map}`).weighted(REPRIEVES, (r) => r.weight).id;
}
