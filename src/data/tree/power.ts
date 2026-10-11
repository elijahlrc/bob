import type { Mod } from '../../mods/types';

/**
 * The strength of a passive node (docs/TREE-REDESIGN.md section 4). A small node is one unit. A stat's unit is the value its small
 * nodes give (the median over the tree's small nodes of the same kind of line), so "a notable is worth three small nodes" is a
 * measurement and not a promise. Headless data and arithmetic only: the emitter (`scripts/tree/balance.ts`) uses it to repair the
 * generated clusters and `tree.test.ts` to check them.
 */
export type Priced = Pick<Mod, 'stat' | 'kind' | 'value' | 'tags' | 'damageTypes' | 'condition'>;

/** A notable is worth at least this many small nodes; one with a single line, at least `NOTABLE_SINGLE_LINE`. */
export const NOTABLE_FLOOR = 2.5;
export const NOTABLE_SINGLE_LINE = 3;

/**
 * What +1 of a counted stat is worth, in small nodes: one more charge, totem, minion or hex is a mechanic and has no small-node
 * equivalent to measure it against.
 */
const COUNT_POWER: [RegExp, number][] = [
  [/^maxCharges\./, 3],
  [/^deployCount$/, 2],
  [/^minionCount$/, 2],
  [/^hexLimit$/, 3],
  [/^maxResist\./, 3],
  [/^doubleDamage$/, 0.5],
];

/**
 * The unit of a stat that no small node gives (so there is nothing in the tree to measure it against): what a small node of it
 * would give. Tried in order; the first that matches is used.
 */
const FALLBACK_UNIT: [RegExp, number][] = [
  [/^[a-zA-Z.]+\|more$/, 4],
  [/^auraEffect\|inc$/, 4],
  [/^penetration\|base$/, 3],
  [/^enemyPhysReduction\|base$/, 5],
  [/^(?:effect|duration)\.[a-z]+\|inc$/, 10],
  [/^(?:bleed|poison|ignite)\.speed\|inc$/, 5],
  [/^chance\.[a-z]+\|base$/, 8],
  [/^(?:gain|convert|convertSkill)\.[a-zA-Z.]+\|base$/, 5],
  [/^resist\.[a-zA-Z]+\|base$/, 5],
  [/^damageTaken\.[a-z]+\|inc$/, -3],
  [/^minion[A-Za-z]*\|base$/, 5],
  [/^(?:str|dex|int)\|inc$/, 4],
  [/^stun[A-Za-z]*\|(?:base|inc)$/, 10],
  [/^flask[A-Za-z]*\|inc$/, 10],
  [/^chargeOn\.[a-zA-Z.]+\|base$/, 2],
];
const fallbackUnit = (m: Priced): number | undefined =>
  FALLBACK_UNIT.find(([re]) => re.test(`${m.stat}|${m.kind}`))?.[1];

/** The identity of a line for pricing: what it changes and for whom, not how much. */
export const modKey = (m: Priced): string =>
  [
    m.stat,
    m.kind,
    (m.tags ?? []).join('+'),
    (m.damageTypes ?? []).join('+'),
    m.condition?.id ?? '',
  ].join('|');
const statKind = (m: Priced): string => `${m.stat}|${m.kind}`;

/** A value as a player would like to read it: halves below 5, whole numbers below 20, fives above. */
export function niceValue(v: number): number {
  const a = Math.abs(v);
  const r =
    a < 1
      ? Math.max(0.1, Math.round(a * 10) / 10)
      : a < 5
        ? Math.round(a * 2) / 2
        : a < 20
          ? Math.round(a)
          : Math.round(a / 5) * 5;
  return v < 0 ? -r : r;
}

const median = (a: number[]): number => [...a].sort((x, y) => x - y)[a.length >> 1];

export type Units = {
  /** Per exact line (stat, kind, tags, damage types, condition). */
  byKey: Map<string, number>;
  /** Per stat and kind, for a line with no small node of its own: the median of the units above. */
  byStat: Map<string, number>;
};

/** The units of a set of small-node lines. */
export function unitsOf(smalls: readonly Priced[]): Units {
  const group = new Map<string, number[]>();
  for (const m of smalls) {
    if (m.kind === 'flag' || !m.value) continue;
    const k = modKey(m);
    (group.get(k) ?? group.set(k, []).get(k)!).push(m.value);
  }
  const byKey = new Map<string, number>();
  const stat = new Map<string, number[]>();
  for (const [k, v] of group) {
    const u = niceValue(median(v));
    byKey.set(k, u);
    const sk = k.split('|').slice(0, 2).join('|');
    (stat.get(sk) ?? stat.set(sk, []).get(sk)!).push(u);
  }
  return { byKey, byStat: new Map([...stat].map(([k, v]) => [k, median(v)])) };
}

/** The strength of one line in small nodes. A line nothing can be compared with counts as one. */
export function powerOfMod(m: Priced, u: Units): number {
  if (m.kind === 'flag') return 3;
  for (const [re, per] of COUNT_POWER) if (re.test(m.stat)) return m.value * per;
  const unit = u.byKey.get(modKey(m)) ?? u.byStat.get(statKind(m)) ?? fallbackUnit(m);
  return unit ? m.value / unit : 1;
}

export const powerOf = (mods: readonly Priced[], u: Units): number =>
  mods.reduce((s, m) => s + powerOfMod(m, u), 0);

/** Whether a line is priced against a unit (and so can be scaled), not by count or by a flag. */
export const isScalable = (m: Priced, u: Units): boolean =>
  m.kind !== 'flag' &&
  !COUNT_POWER.some(([re]) => re.test(m.stat)) &&
  (u.byKey.has(modKey(m)) || u.byStat.has(statKind(m)) || fallbackUnit(m) !== undefined);

/** What a notable has to be worth: three small nodes for one line, two and a half for several. */
export const floorFor = (lines: number): number =>
  lines === 1 ? NOTABLE_SINGLE_LINE : NOTABLE_FLOOR;
