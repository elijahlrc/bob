import { clamp } from '../core/math';
import {
  ARMOUR_CAP,
  MIN_HIT_CHANCE,
  MONSTER_HIT_BASE,
  MONSTER_HIT_COEF,
  MONSTER_HIT_EXP,
  MONSTER_LIFE_BASE,
  MONSTER_LIFE_GROWTH,
  MONSTER_LIFE_LINEAR,
  RES_FLOOR,
} from '../data/constants';

/** §6.3 Hit chance of an attack. */
export function hitChance(accuracy: number, evasion: number): number {
  if (evasion <= 0) return 1;
  const acc = Math.max(0, accuracy);
  return clamp(acc / (acc + Math.pow(evasion / 4, 0.8)), MIN_HIT_CHANCE, 1);
}

/** §6.3 Physical damage reduction from armour against a hit of `damage` physical. */
export function armourReduction(armour: number, damage: number): number {
  if (armour <= 0 || damage <= 0) return 0;
  return Math.min(ARMOUR_CAP, armour / (armour + 10 * damage));
}

/** §6.3 Effective resistance (percent) after the cap, penetration and the floor. */
export function effectiveRes(res: number, maxRes: number, pen = 0): number {
  return Math.max(RES_FLOOR, Math.min(res, maxRes) - pen);
}

/** §6.6 Ailment magnitude: `cap · min(1, sqrt(2r))`. */
export function mag(r: number, cap: number): number {
  if (r <= 0) return 0;
  return cap * Math.min(1, Math.sqrt(2 * r));
}

/** §6.6a Stun chance from stun damage and the effective threshold. */
export function stunChance(stunDamage: number, threshold: number, minChance: number): number {
  if (threshold <= 0) return 1;
  const c = clamp((2 * stunDamage) / threshold, 0, 1);
  return c < minChance ? 0 : c;
}

/** §5.4 Experience. */
export function baseXp(monLevel: number): number {
  return Math.round(6 + 1.6 * Math.pow(monLevel, 1.55));
}

export function levelPenalty(playerLevel: number, monLevel: number): number {
  const safe = 3 + Math.floor(playerLevel / 16);
  const excess = Math.max(0, Math.abs(playerLevel - monLevel) - safe);
  return Math.max(0.05, 1 - 0.12 * excess);
}

/** §12.1 Monster level scaling. */
export function monsterLife(m: number): number {
  return Math.round(MONSTER_LIFE_BASE * Math.pow(MONSTER_LIFE_GROWTH, m) + MONSTER_LIFE_LINEAR * m);
}
export function monsterHit(m: number): number {
  return MONSTER_HIT_BASE + MONSTER_HIT_COEF * Math.pow(m, MONSTER_HIT_EXP);
}
export function monsterAccuracy(m: number): number {
  return 20 + 14 * m;
}
export function monsterEvasion(m: number): number {
  return 30 + 12 * m;
}
export function monsterArmour(m: number): number {
  return 20 + 10 * m;
}
