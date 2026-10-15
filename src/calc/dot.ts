/**
 * What the sheet needs to know about the debuffs of damage over time that skills put on a target (`SkillProfile.skillDot`,
 * docs/SHEET-AUDIT.md): how long one stays on after a use, and how often the character has to use the skill to keep it there.
 * The sim's side is `applySkillDot` (src/sim/skillDots.ts), `projectileFx` (src/sim/skillFx.ts) and `alreadyAfflicted`
 * (src/sim/ai.ts).
 */
import { PROJECTILE_SPEED } from '../data/constants';
import type { SkillProfile } from './skill';

/** The radius of the enemy the sheet prices a skill against: the training dummy of the audit tools. */
export const TARGET_RADIUS = 0.5;

/** The seconds of a renewed debuff left at which the character casts it again (`alreadyAfflicted`, src/sim/ai.ts). */
export const RENEW_AT = 0.8;

/** The share of a use that goes by before its effect lands on the target (the rotation plan's `LANDS_AT`; a burst at 0.6). */
export const LANDS_SHARE = 0.6;

/**
 * Seconds a projectile that carries its debuff (`dot.carried`) keeps it on a target, on top of the debuff's own length: the sim
 * puts the debuff on every enemy within `carried` tiles of the projectile, every moment of its flight (Spirit Saw), so each pass
 * through the target renews it for as long as the projectile is near. The projectile starts at the character, so a target
 * closer than the zone is crossed in a shorter stretch; one that comes back crosses it a second time.
 */
export function carriedSeconds(p: SkillProfile, distance: number): number {
  const reach = p.skillDot?.spec.carried;
  const b = p.skill.behaviour;
  if (!reach || b.kind !== 'projectile') return 0;
  const zone = reach * p.radiusMult + TARGET_RADIUS;
  const inside = distance + zone - Math.max(0, distance - zone);
  const passes = b.returns && p.pierce > 0 ? 2 : 1;
  return (passes * inside) / (PROJECTILE_SPEED * p.projSpeedMult);
}

/**
 * Seconds between the uses of a skill whose only work is a renewed debuff (`stack: 'refresh'`, `hitless`: Creeping Plague, Ruin
 * Ritual), when the character keeps the debuff on and does not cast it again while it holds: the debuff lands part of the way
 * through the use, lasts its length, and the character casts again when `RENEW_AT` seconds are left. A skill with a debuff that
 * is not renewed this way (stacked, or with a hit of its own) has no such gap and gives undefined. `seconds` is the debuff's
 * length when it differs from the profile's (Bane with curses linked).
 */
export function renewalGap(p: SkillProfile, seconds?: number): number | undefined {
  const sd = p.skillDot;
  if (!sd || sd.spec.stack !== 'refresh' || !sd.spec.hitless) return undefined;
  return Math.max(p.useTime, LANDS_SHARE * p.useTime + (seconds ?? sd.seconds) - RENEW_AT);
}
