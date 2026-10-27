import { DAMAGE_TYPES } from '../mods/types';
import type { Character, Scenario, SkillSheet } from './character';
import { scenarioDps } from './character';

/** Where a row of the breakdown comes from. */
export type BreakdownRole = 'main' | 'periodic' | 'weapon' | 'trigger';

/** One skill's part in the damage the Strategy tab shows: how often it is used and what it does a second. */
export type BreakdownRow = {
  key: string;
  name: string;
  role: BreakdownRole;
  /** Uses a second the rotation gives it (the shots of a totem or brand, the ones put down for the rest). */
  usesPerSec: number;
  /** Hits that land with one use (projectiles, pulses, repeats), the damage of one hit, the chance it lands and the chance it is a critical strike. */
  hitsPerUse: number;
  avgHit: number;
  hitChance: number;
  critChance: number;
  /** Damage a second from its hits, by type, in the order of `DAMAGE_TYPES`. */
  perType: number[];
  /** Damage a second over time: ignite, bleed, poison and the skill's own debuffs. */
  overTime: number;
  dps: number;
  /** Its share of the whole. */
  share: number;
};

export type Breakdown = {
  scenario: Scenario;
  rows: BreakdownRow[];
  /** What the minions and clones add, a second. */
  minions: number;
  total: number;
};

/**
 * The damage of the rotation, skill by skill: the same figures the sheet adds up (`scenarioDps`), laid out so that a player can
 * see which skills are used, how often, and what each deals. The hits of a skill are shared out by type as its average hit is.
 */
export function dpsBreakdown(ch: Character, scenario: Scenario): Breakdown {
  const sheet = ch.sheet(undefined, scenario);
  const total = scenarioDps(sheet);
  const row = (key: string, role: BreakdownRole, s: SkillSheet): BreakdownRow => ({
    key,
    name: s.name,
    role,
    usesPerSec: s.usesPerSec,
    hitsPerUse:
      s.usesPerSec > 0 && s.avgHit > 0 && s.hitChance > 0
        ? s.hitDps / (s.usesPerSec * s.avgHit * s.hitChance)
        : 0,
    avgHit: s.avgHit,
    hitChance: s.hitChance,
    critChance: s.critChance,
    perType: DAMAGE_TYPES.map((_, k) => (s.avgHit > 0 ? (s.hitDps * s.perType[k]) / s.avgHit : 0)),
    overTime: s.ailmentDps,
    dps: s.totalDps,
    share: total > 0 ? s.totalDps / total : 0,
  });
  const rows: BreakdownRow[] = [
    row('main', sheet.skill.isDefault ? 'weapon' : 'main', sheet.skill),
    ...sheet.secondary.map((t) =>
      row(
        t.key,
        t.skill.isDefault
          ? 'weapon'
          : ch.mains.some((e) => e.choice.key === t.key)
            ? 'main'
            : 'periodic',
        t.skill,
      ),
    ),
    ...sheet.triggered.map((t) => row(t.key, 'trigger', t.skill)),
  ];
  return { scenario, rows, minions: sheet.minionDps, total };
}
