/**
 * The sustain pass (the owner, 2026-11-02, docs/SUSTAIN.md), applied where the data is made so that what a node, item or
 * gem card says is what it gives: flat life and mana grow (`LIFE_SCALE`, `MANA_SCALE`), self-recovery that can heal to
 * full is cut by where it comes from (`TREE_RECOVERY_SCALE` and the others), and "while leeching" lines grow
 * (`WHILE_LEECHING_SCALE`). Life leech, life on hit and life on kill keep their numbers: they are replenish, capped in the fight
 * (src/sim/replenish.ts). Items keep what they rolled (the owner, the same day); only new rolls follow.
 */
import type { Condition, Mod, ModKind } from '../mods/types';
import {
  GEM_RECOVERY_SCALE,
  ITEM_RECOVERY_SCALE,
  LIFE_SCALE,
  MANA_SCALE,
  TREE_RECOVERY_SCALE,
  WHILE_LEECHING_SCALE,
} from './constants';

/** Where a line comes from, which sets its recovery cut. */
export type SustainSource = 'tree' | 'gem' | 'item';

const CUT: Record<SustainSource, number> = {
  tree: TREE_RECOVERY_SCALE,
  gem: GEM_RECOVERY_SCALE,
  item: ITEM_RECOVERY_SCALE,
};

/** Life on a kill, flat or a share, is replenish like life on hit (sim/replenish.ts) and keeps its number. */
const ON_KILL = /^recover(Pct)?\.(kill|killIgnited)\.life$/;
/** Flat recovery cut by the source's scale: regeneration a second (to a tenth), life on block and on an event (whole). */
const flatDec = (stat: string): number | null =>
  stat === 'lifeRegen'
    ? 1
    : stat === 'lifeOnBlock' || (/^recover\.[A-Za-z]+\.life$/.test(stat) && !ON_KILL.test(stat))
      ? 0
      : null;
/** Shares of life recovered (to a twentieth of a percent). */
const isPctRecovery = (stat: string): boolean =>
  /^(lifeRegenPct|lifeOnBlockPct|recoverPct\.[A-Za-z]+\.life)$/.test(stat) && !ON_KILL.test(stat);

type Rule = { k: number; step: number };

/** What the pass does to one line, if anything: the multiple and the step its result is rounded to. */
function ruleOf(
  stat: string,
  kind: ModKind,
  condition: Pick<Condition, 'id' | 'not'> | undefined,
  src: SustainSource,
): Rule | null {
  if (kind === 'base') {
    if (stat === 'life') return { k: LIFE_SCALE, step: 1 };
    if (stat === 'mana') return { k: MANA_SCALE, step: 1 };
    const fd = flatDec(stat);
    if (fd !== null) return { k: CUT[src], step: fd ? 0.1 : 1 };
    if (isPctRecovery(stat)) return { k: CUT[src], step: 0.05 };
  }
  if ((kind === 'inc' || kind === 'more') && condition?.id === 'leeching' && !condition.not)
    return { k: WHILE_LEECHING_SCALE, step: 1 };
  return null;
}

/** A value under a rule: rounded to the step, never rounded away to nothing (a line keeps at least one step). */
function apply(v: number, r: Rule): number {
  if (v === 0) return 0;
  const x = v * r.k;
  const n = Math.max(1, Math.round(Math.abs(x) / r.step));
  // Rounded through the step's decimals so 0.15000000000000002 reads 0.15.
  return Math.sign(x) * Number((n * r.step).toFixed(2));
}

/** One value of a line, after the pass. */
export function sustainValue(
  stat: string,
  kind: ModKind,
  condition: Pick<Condition, 'id' | 'not'> | undefined,
  v: number,
  src: SustainSource,
): number {
  const r = ruleOf(stat, kind, condition, src);
  return r ? apply(v, r) : v;
}

/** The decimals a rolled value of the stat needs after the pass (affix rolls round to their `dec`). */
export function sustainDec(stat: string, kind: ModKind, dec = 0): number {
  if (kind !== 'base') return dec;
  const fd = flatDec(stat);
  if (fd !== null) return Math.max(dec, fd);
  if (isPctRecovery(stat)) return Math.max(dec, 2);
  return dec;
}

/** Mods after the pass (a mod the pass leaves alone is returned as it is). */
export function sustainMods(mods: readonly Mod[], src: SustainSource): Mod[] {
  return mods.map((m) => {
    const r = ruleOf(m.stat, m.kind, m.condition, src);
    return r ? { ...m, value: apply(m.value, r) } : m;
  });
}

/** A [min, max] range after the pass. */
export function sustainRange(
  stat: string,
  kind: ModKind,
  condition: Pick<Condition, 'id' | 'not'> | undefined,
  range: readonly [number, number],
  src: SustainSource,
): [number, number] {
  const r = ruleOf(stat, kind, condition, src);
  return r ? [apply(range[0], r), apply(range[1], r)] : [range[0], range[1]];
}

/**
 * Every line inside a data object after the pass: any object with `stat`, `kind` and a `value` (a number, a [first, last]
 * pair or a `{ table }`) or a `min`/`max` pair, however deep (a gem's buffs, auras and utility skills nest them).
 */
export function sustainDeep<T>(x: T, src: SustainSource): T {
  if (Array.isArray(x)) {
    let changed = false;
    const out = x.map((e) => {
      const y = sustainDeep(e, src);
      if (y !== e) changed = true;
      return y;
    });
    return (changed ? out : x) as T;
  }
  if (!x || typeof x !== 'object') return x;
  const o = x as Record<string, unknown>;
  let out: Record<string, unknown> | null = null;
  if (typeof o.stat === 'string' && typeof o.kind === 'string') {
    const r = ruleOf(o.stat, o.kind as ModKind, o.condition as Condition | undefined, src);
    if (r) {
      out = { ...o };
      const v = o.value;
      if (typeof v === 'number') out.value = apply(v, r);
      else if (Array.isArray(v)) out.value = v.map((e: number) => apply(e, r));
      else if (v && typeof v === 'object' && Array.isArray((v as { table?: number[] }).table))
        out.value = { table: (v as { table: number[] }).table.map((e) => apply(e, r)) };
      if (typeof o.min === 'number') out.min = apply(o.min, r);
      if (typeof o.max === 'number') out.max = apply(o.max, r);
    }
  }
  for (const [key, val] of Object.entries(o)) {
    if (key === 'value' || val === null || typeof val !== 'object') continue;
    const y = sustainDeep(val, src);
    if (y !== val) (out ??= { ...o })[key] = y;
  }
  return (out ?? o) as T;
}
