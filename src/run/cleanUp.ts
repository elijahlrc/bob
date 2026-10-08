import type { InventoryItem } from '../data/types';
import { salvage, salvageValue } from './craft';
import { ageOf, oldItems, type CleanOpts, type CleanPlan } from './found';
import type { RunState } from './run';

/** What the clean-up panel shows and what its button does, from one source so they cannot disagree. */
export type CleanSummary = {
  plan: CleanPlan;
  count: number;
  /** Bone Dust the salvage pays. */
  dust: number;
  /** Rows of the preview, oldest first. */
  rows: { item: InventoryItem; age: number; dust: number }[];
  /** "37 items found more than 10 levels ago, for 410 Bone Dust". */
  headline: string;
  /** "Kept: 12 favourites, 5 not yet looked at, 3 newer", or ''. */
  kept: string;
};

const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`;

export function cleanSummary(run: RunState, opts: CleanOpts): CleanSummary {
  const plan = oldItems(run, opts);
  const rows = plan.items
    .map((item) => ({ item, age: ageOf(run, item.uid), dust: salvageValue(item) }))
    .sort((a, b) => b.age - a.age || a.item.uid - b.item.uid);
  const dust = rows.reduce((n, r) => n + r.dust, 0);
  const k = plan.kept;
  const kept = [
    k.favourite ? plural(k.favourite, 'favourite') : '',
    k.unseen ? `${k.unseen} not yet looked at` : '',
    k.young ? `${k.young} newer` : '',
  ].filter(Boolean);
  return {
    plan,
    count: rows.length,
    dust,
    rows,
    headline: `${plural(rows.length, 'item')} found more than ${plural(opts.olderThan, 'level')} ago, for ${dust} Bone Dust`,
    kept: kept.length ? `Kept: ${kept.join(', ')}` : '',
  };
}

/** Salvage what `cleanSummary` lists. Like every salvage it is final (the caller uses `Controller.craft`). */
export function applyClean(run: RunState, opts: CleanOpts): { count: number; dust: number } {
  const s = cleanSummary(run, opts);
  const before = run.dust;
  for (const r of s.rows) salvage(run, r.item.uid);
  return { count: s.count, dust: run.dust - before };
}
