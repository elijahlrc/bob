import { DEFAULT_MAX_RES } from '../data/constants';
import type { DefenceProfile, Element, Immunity } from '../data/defence';
import {
  armourReduction,
  effectiveRes,
  hitChance,
  monsterAccuracy,
  monsterArmour,
  monsterEvasion,
  monsterHit,
} from './formulas';

/**
 * The build matrix (docs/ROSTER.md 6.2): how much longer a type takes to kill than a plain monster of its level, under each
 * of a handful of reference damage profiles at the same damage per second. It is computed from the same formulas combat
 * uses (`armourReduction`, `hitChance`, `effectiveRes`), so it cannot drift from the game, and it is what keeps a defence
 * paid for in life: a monster's life is its stated toughness divided by its mean durability here, so a type that is hard to
 * one build is soft to another and no harder on the whole.
 */
export type Probe = {
  id: string;
  name: string;
  /** Damage type index: 0 physical, 1 lightning, 2 cold, 3 fire, 4 chaos. */
  dtype: number;
  /** An attack must hit (evasion applies); a spell does not. */
  attack: boolean;
  /** The size of a hit as a multiple of a monster's hit at the level (armour works on it). */
  hit: number;
  /** Damage over time: no armour, no evasion; the ailments it comes from. */
  dot?: boolean;
};

export const PROBES: Probe[] = [
  { id: 'physical', name: 'Physical hits', dtype: 0, attack: true, hit: 3 },
  { id: 'flurry', name: 'Physical flurry', dtype: 0, attack: true, hit: 0.25 },
  { id: 'fire', name: 'Fire spells', dtype: 3, attack: false, hit: 1 },
  { id: 'cold', name: 'Cold spells', dtype: 2, attack: false, hit: 1 },
  { id: 'lightning', name: 'Lightning spells', dtype: 1, attack: false, hit: 1 },
  { id: 'chaos', name: 'Chaos spells', dtype: 4, attack: false, hit: 1 },
  { id: 'elemental', name: 'Elemental attacks', dtype: 3, attack: true, hit: 1 },
  { id: 'dot', name: 'Damage over time', dtype: 4, attack: false, hit: 1, dot: true },
];

/** How much more accurate than a monster of its level the reference character is. */
const REF_ACCURACY = 0.6;
/** The most a probe can be made softer or harder than plain (an immunity counts as this). */
export const MAX_FACTOR = 3;

type Numbers = {
  armour: number;
  evasion: number;
  /** Resistance percent by damage type index (physical is 0). */
  res: number[];
  physReduction: number;
  /** Energy shield as a share of life. */
  es: number;
  avoid: Record<Immunity, boolean>;
};

const ELEMENT_INDEX: Record<Element, number> = { lightning: 1, cold: 2, fire: 3, chaos: 4 };

/** The defence numbers a profile gives a monster of a level (the same arithmetic as the mods it becomes). */
function numbers(p: DefenceProfile, level: number): Numbers {
  const res = [0, 0, 0, 0, 0];
  for (const [el, v] of Object.entries(p.res ?? {}) as [Element, number][])
    res[ELEMENT_INDEX[el]] = v;
  const avoid = {
    stun: false,
    freeze: false,
    ignite: false,
    shock: false,
    chill: false,
    bleed: false,
    poison: false,
  };
  for (const i of p.immune ?? []) avoid[i] = true;
  return {
    armour: monsterArmour(level) * Math.max(0, 1 + (p.armour ?? 0) / 100),
    evasion: monsterEvasion(level) * Math.max(0, 1 + (p.evasion ?? 0) / 100),
    res,
    physReduction: Math.min(0.9, (p.physReduction ?? 0) / 100),
    es: p.es ?? 0,
    avoid,
  };
}

/** The share of a probe's damage that gets through (1 is all of it), before the energy shield. */
function taken(n: Numbers, pr: Probe, level: number): number {
  if (pr.dot) {
    // Poison (chaos), ignite (fire) and bleed (physical, which armour does not stop): a third each.
    const poison = n.avoid.poison ? 0 : 1 - effectiveRes(n.res[4], DEFAULT_MAX_RES) / 100;
    const ignite = n.avoid.ignite ? 0 : 1 - effectiveRes(n.res[3], DEFAULT_MAX_RES) / 100;
    const bleed = n.avoid.bleed ? 0 : 1 - n.physReduction;
    return (poison + ignite + bleed) / 3;
  }
  let f = 1;
  if (pr.attack) f *= hitChance(monsterAccuracy(level) * REF_ACCURACY, n.evasion);
  if (pr.dtype === 0) {
    const red = Math.min(
      0.9,
      armourReduction(n.armour, pr.hit * monsterHit(level)) + n.physReduction,
    );
    f *= 1 - red;
  } else {
    f *= 1 - effectiveRes(n.res[pr.dtype], DEFAULT_MAX_RES) / 100;
  }
  return f;
}

/** How many times longer than a plain monster of the level this profile takes to kill under a probe. */
export function durability(p: DefenceProfile, pr: Probe, level: number): number {
  const plain = taken(numbers({}, level), pr, level);
  const mine = numbers(p, level);
  const t = taken(mine, pr, level);
  let d = t <= 1e-6 ? MAX_FACTOR : plain / t;
  // An energy shield is more life against everything it covers (not chaos, not damage over time).
  if (pr.dtype !== 4 && !pr.dot) d *= 1 + mine.es;
  return Math.min(MAX_FACTOR, d);
}

/** The factor under every probe. */
export function durabilityTable(p: DefenceProfile, level: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const pr of PROBES) out[pr.id] = durability(p, pr, level);
  return out;
}

const cache = new Map<string, number>();

/** The mean factor over the probes: what a type's raw life is divided by to keep its toughness as stated. */
export function meanDurability(p: DefenceProfile, level: number): number {
  const key = `${level}|${JSON.stringify(p)}`;
  let m = cache.get(key);
  if (m === undefined) {
    m = PROBES.reduce((s, pr) => s + durability(p, pr, level), 0) / PROBES.length;
    cache.set(key, m);
  }
  return m;
}
