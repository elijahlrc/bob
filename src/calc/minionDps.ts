import { spellBaseDamage } from '../data/constants';
import { MINION_ENEMY_RES, type MinionDef } from '../data/minions';
import { levelValue, type SkillDef } from './gems';
import type { SkillProfile } from './skill';

/**
 * The sheet's minion damage (docs/SHEET-AUDIT.md): what the summoning skills keep standing deal to one target a second, worked
 * out the way the sim's minions strike (src/sim/minions.ts, minionFx.ts, skillFx.ts `relicNova`). Pure numbers, so that
 * `Character.minionDps` only has to say which skills, how many attacks the character makes and how long the minions stand.
 */

export type Summon = Extract<NonNullable<SkillDef['utility']>, { kind: 'summon' }>;

/** How many minions a summon skill keeps: the gem's count, or, for a spectre, one and a second from the thirteenth level. */
export function summonCountOf(u: Summon, level: number, extra: number): number {
  if (u.corpse) return Math.max(1, (level >= 13 ? 2 : 1) + extra);
  return Math.max(1, Math.round(levelValue(u.count, level)) + extra);
}

/** The nearest an enemy may be to the character for the minions of a guarding support to count it as near (tiles). */
export const NEAR_ENEMY = 3.5;

/**
 * The damage of one blow of a minion before the target's defences: the gem level's curve, the kind's share and the minion
 * modifiers, and a support's extra elemental damage or its extra damage near the owner. A single target: the blow's splash
 * (what it does to the others standing near the target) is a crowd's damage, which the sheet does not count.
 */
export function minionBlow(
  def: MinionDef,
  level: number,
  p: Pick<SkillProfile, 'minionDamage' | 'minionNearMore' | 'minionSup'>,
  targetDistance: number,
): number {
  let hit = spellBaseDamage(level) * def.dmg * p.minionDamage * MINION_ENEMY_RES;
  const elemental = def.dtype === 'lightning' || def.dtype === 'cold' || def.dtype === 'fire';
  if (elemental && p.minionSup.eleMore > 0) hit *= 1 + p.minionSup.eleMore / 100;
  // Elemental Army: a blow exposes the enemy to its element, which takes that many points off its resistance (the sheet's
  // minions meet no resistance of their own, so a point of exposure is a point of damage).
  if (elemental && p.minionSup.exposure > 0) hit *= 1 + p.minionSup.exposure / 100;
  if (p.minionNearMore > 0 && targetDistance <= NEAR_ENEMY) hit *= 1 + p.minionNearMore / 100;
  return hit;
}

/**
 * Novas a second from a relic: it sets one off when the character's attack hits, and not again within its cooldown, so with hits
 * `r` a second in a regular rhythm it answers every hit, or every second one, and so on while the cooldown outlasts the pause.
 */
export function relicNovasPerSec(hitsPerSec: number, cooldown: number): number {
  if (hitsPerSec <= 0) return 0;
  return hitsPerSec / Math.max(1, Math.ceil(cooldown * hitsPerSec - 1e-9));
}

/** The damage of one nova of a relic (the kind's `nova` share of the curve, with the minion damage modifiers). */
export function relicNova(
  def: MinionDef,
  level: number,
  p: Pick<SkillProfile, 'minionDamage'>,
): number {
  return spellBaseDamage(level) * (def.nova ?? 0) * p.minionDamage * MINION_ENEMY_RES;
}

/**
 * How far past the nova's own radius an enemy may stand and still be hit: the relic keeps beside the character, a tile or so
 * off, and the sim's relic does not follow it toward the enemy.
 */
export const RELIC_BESIDE = 1.5;

/** How much of a use of the summoning skill passes before its minions land (the sim's cast lands at this share of the use time). */
const SUMMON_LANDS_AT = 0.6;

/**
 * The share of the time minions that last `seconds` stand, when the skill is cast again as they end: the character is busy with
 * what it was doing when they ended (half an action on average), and then the cast takes its time to land.
 */
export function timedDuty(seconds: number, useTime: number, otherUseTime: number): number {
  const gap = SUMMON_LANDS_AT * useTime + 0.5 * otherUseTime;
  return seconds / Math.max(1e-6, seconds + gap);
}

/**
 * The flat physical damage a golem's presence adds to each blow of another minion: the middle of its range, with that minion's
 * damage modifiers.
 */
export function golemAdded(
  g: NonNullable<Summon['golem']>,
  golemLevel: number,
  p: Pick<SkillProfile, 'minionDamage'>,
): number {
  return (
    ((levelValue(g.addMin, golemLevel) + levelValue(g.addMax, golemLevel)) / 2) *
    p.minionDamage *
    MINION_ENEMY_RES
  );
}
