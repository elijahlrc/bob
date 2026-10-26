import { PROJECTILE_SPEED } from '../data/constants';
import { MINION_ENEMY_RES } from '../data/minions';
import type { HandStats, SkillProfile } from './skill';

/**
 * Projectile patterns: skills that fire many projectiles, rains, volleys and drifting shots, where how many land on one
 * target decides the damage (docs/SHEET-AUDIT.md section 5). The sheet is single-target, so these work out what one target
 * standing in the middle of the pattern takes from one use.
 */

/** Half the width of the enemy the sheet is worked out for: the sim's training dummy is 0.5 tiles in radius. */
export const TARGET_RADIUS = 0.5;

/** Radius of a projectile in the air (the sim's `launch`): it touches an enemy when it passes within this and the enemy's radius. */
const PROJECTILE_RADIUS = 0.15;

/**
 * How many projectiles of one scattering use (Splinter Volley, Scatter Bow) hit a target that stands where it was aimed, at
 * `distance` tiles. A fan keeps one projectile pointed at the aim (the others lie off it by the step of the fan, an even
 * count shifting a half step from one use to the next), so the target is hit by every projectile whose line passes within its
 * width at that distance, and by at least the one aimed at it.
 */
export function shotgunHits(p: SkillProfile, distance: number): number {
  const b = p.skill.behaviour;
  const n = p.projectiles;
  if (b.kind !== 'projectile' || n <= 1) return 1;
  const step = ((b.count > 1 && b.spread > 0 ? b.spread / (b.count - 1) : 10) * Math.PI) / 180;
  const width = TARGET_RADIUS + PROJECTILE_RADIUS;
  const reach = Math.asin(Math.min(1, width / Math.max(width, distance)));
  const centres = n % 2 === 0 ? [n / 2, n / 2 - 1] : [(n - 1) / 2];
  let total = 0;
  for (const c of centres)
    for (let i = 0; i < n; i++) if (Math.abs((i - c) * step) <= reach + 1e-6) total++;
  return Math.max(1, total / centres.length);
}

/**
 * The share more that the hits of a skill deal because of the debuffs the skill itself leaves on the target (Snare Shot: an
 * ensnared enemy takes more from projectile attack hits). A hit renews the debuff, so the hits that come within its length
 * of an earlier one find it on; `hitsPerSec` is the rate at which the skill's hits land on the target.
 */
export function ownDebuffMore(p: SkillProfile, hitsPerSec: number): number {
  let more = 0;
  for (const s of p.statuses) {
    if (s.id !== 'ensnared' || s.x <= 0 || s.chance <= 0) continue;
    if (!p.isAttack || !p.skill.tags.includes('projectile')) continue;
    const n = hitsPerSec * s.seconds;
    const on = n >= 1 ? 1 - (1 - s.chance) ** n : s.chance * n;
    more += (s.x / 100) * on;
  }
  return more;
}

/** The share of the uses of a skill that picks fire, cold or lightning for each use that are of one element. */
export const ELEMENT_SHARE = 1 / 3;

/**
 * How many pods of one use burst on the target (Venom Shower). The pods fall evenly over a disc around the target (wider with
 * more arrows and with more area), and one bursts on the target when it falls within the burst radius of the target's edge.
 */
export function podHits(p: SkillProfile): number {
  const pods = p.skill.pods;
  if (!pods) return 1;
  const spread = pods.spread * Math.sqrt(p.projectiles / 5) * p.radiusMult;
  const reach = pods.burstRadius * p.radiusMult + TARGET_RADIUS;
  return Math.max(1, p.projectiles * Math.min(1, (reach / Math.max(0.5, spread)) ** 2));
}

/**
 * The damage of one clone a skill leaves (Mirror Quiver): it fires with the character's weapon, the weapon's damage as it
 * stands (flat parts only, the character's increases do not reach it) and a share more, at the weapon's speed, for as long as
 * it stands, and strikes as it appears. The figure is all the blows of one clone against one target in reach.
 */
export function cloneDamage(
  hand: HandStats,
  spec: { seconds: number; more: number },
  p: SkillProfile,
): number {
  let flat = 0;
  for (const [lo, hi] of hand.flats) flat += (lo + hi) / 2;
  const rate = hand.aps * p.minionSpeed;
  const life = spec.seconds * p.skillDuration;
  const blows = rate > 0 ? Math.floor(life * rate + 1e-9) + 1 : 0;
  return blows * flat * (1 + spec.more / 100) * p.minionDamage * MINION_ENEMY_RES;
}

/**
 * How many pulses of a drifting orb reach a target `distance` tiles away on its way (Drifting Storm). The orb is loosed toward
 * the target and drifts slowly on for a tile past it at most, striking everything within its reach at each beat, the first
 * as it leaves; the beats are on the clock from the moment it is loosed, so the count is that of the beats while it is
 * within reach of the target.
 */
export function orbHits(p: SkillProfile, distance: number): number {
  const spec = p.skill.pulse;
  if (!spec) return 1;
  const b = p.skill.behaviour;
  const range = (b.kind === 'projectile' ? (b.range ?? 9) : 9) + 2;
  const path = Math.max(3, Math.min(range, distance + 1));
  const reach = spec.radius * p.radiusMult + TARGET_RADIUS;
  const enter = Math.max(0, distance - reach);
  const exit = Math.min(path, distance + reach);
  if (exit <= enter) return 0;
  const speed = PROJECTILE_SPEED * p.projSpeedMult * spec.speed;
  const first = Math.ceil(enter / speed / spec.interval - 1e-9);
  const last = Math.floor(exit / speed / spec.interval + 1e-9);
  return Math.max(0, last - first + 1);
}

/** Seconds between the pulses of ground that hurts what stands on it (the sim's `tickFields`). */
const GROUND_INTERVAL = 0.5;

/**
 * The hits (in whole hits of the skill) that the chilled ground one use leaves deals to a target on it, and so what a use is
 * worth beyond its burst (Rime Drift). The ground pulses for a share of a hit a second for as long as it lasts; the patches of
 * several uses add up, but only so many stand at once, the oldest giving way. `patchesPerSec` is how many patches the
 * character leaves a second.
 */
export function groundHits(p: SkillProfile, patchesPerSec: number, distance: number): number {
  const g = p.skill.leaves;
  if (!g || g.kind !== 'chilling' || !g.dps) return 0;
  const radius = g.radius * p.radiusMult * (g.grow ?? 1);
  // Ground put down at the character's feet reaches only a target that close; ground that creeps goes to its target.
  const b = p.skill.behaviour;
  const atSelf = (b.kind === 'burst' && b.origin === 'self') || b.kind === 'melee';
  if (atSelf && g.creep === undefined && distance > radius + TARGET_RADIUS) return 0;
  const life = g.seconds * p.skillDuration;
  // Pulses come at the start and then every interval: half a pulse more than the time holds, on average. Patches that overlap
  // hurt a target as one, so it takes no more than the ground's damage a second however many are down.
  const perPatch = g.dps * (life + GROUND_INTERVAL / 2);
  return patchesPerSec > 0 ? Math.min(perPatch, g.dps / patchesPerSec) : perPatch;
}

/**
 * What the volleys of one use are worth to a target that stands where it was aimed, in volleys of full weight (Rain of Steel).
 * They fall one after another on a line leading on from the aim, each wider, and weaker and less likely to crit than the
 * last, and the next falls a width further on, so only the first few reach a target at the aim: the others land beyond it.
 */
export function volleysHits(p: SkillProfile): number {
  const spec = p.skill.volleys;
  if (!spec) return 1;
  const b = p.skill.behaviour;
  const r0 = (b.kind === 'burst' ? b.radius : 2) * p.radiusMult;
  const h = p.hands[0];
  const cm = h?.critMulti ?? 1;
  const cc = Math.min(1, h?.critChance ?? 0);
  const first = 1 + cc * (cm - 1);
  let along = 0;
  let total = 0;
  for (let k = 0; k <= spec.extra; k++) {
    const r = r0 * (1 + (spec.widen / 100) * k);
    if (along <= r + TARGET_RADIUS) {
      const ck = Math.min(1, cc * Math.max(0, 1 - (spec.critLessPer / 100) * k));
      total += ((1 - spec.lessPer / 100) ** k * (1 + ck * (cm - 1))) / first;
    }
    along += r * 0.9;
  }
  return total;
}
