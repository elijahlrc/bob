import { EXPOSURE_TYPE, STATUSES } from '../data/statuses';
import type { DotSpec } from '../data/gems';
import { levelValue } from './gems';
import type { SkillProfile } from './skill';

/**
 * Skills whose damage does not all come from the use itself (docs/SHEET-AUDIT.md section 5): a channel that leaves pods behind, a
 * blade that circles for seconds, a mote that strikes on its own beat, orbs that jump about, ground that goes on hurting. The sim
 * carries each out apart from the use (`src/sim/channel.ts`, `skillFx.ts`, `fields.ts`); this file says how many hits of the
 * skill one target takes from them, so that the sheet's DPS counts what the sim deals. Everything is the steady state of a
 * skill used again and again against one target that stands in reach.
 */

/** Half the width of the target the sheet shoots at, in tiles (a training dummy; `volleyHits` shotguns with the same). */
export const TARGET_RADIUS = 0.5;
/** The radius of a projectile in flight (`launch`, `src/sim/shots.ts`). */
const PROJECTILE_RADIUS = 0.15;

// ---- Scourge Arrow: the pods the released arrow leaves, and the thorns they bloom into

/**
 * The share of a fan of `arrows` projectiles, set off evenly all round from a point `gap` tiles from the target and flying
 * `range` tiles, that touches a target `reach` tiles wide (its half-width and the projectile's).
 */
function fanShare(gap: number, reach: number, range: number): number {
  if (gap <= reach) return 1;
  if (gap - reach > range) return 0;
  // The ray at angle a from the line to the target first touches it at gap*cos(a) - sqrt(reach^2 - gap^2*sin(a)^2), which grows
  // with the angle up to the tangent; find the widest angle that is still within range.
  const tangent = Math.asin(reach / gap);
  const touch = (a: number) =>
    gap * Math.cos(a) - Math.sqrt(Math.max(0, reach * reach - (gap * Math.sin(a)) ** 2));
  let wide = tangent;
  if (touch(tangent) > range) {
    let lo = 0;
    let hi = tangent;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      if (touch(mid) > range) hi = mid;
      else lo = mid;
    }
    wide = lo;
  }
  return wide / Math.PI;
}

/**
 * How many thorns of one released channel reach a single target `distance` tiles away: the pods lie along the arrow's way, one for
 * each stage built, and each blooms into a ring of thorns that fly a short way and cannot hit one enemy twice.
 */
export function sporeHits(p: SkillProfile, distance: number): number {
  const spec = p.skill.sporePods;
  const c = p.skill.channel;
  if (!spec || !c?.release) return 0;
  const far = Math.max(3, Math.min(9, distance + 2));
  const reach = TARGET_RADIUS + PROJECTILE_RADIUS;
  let hits = 0;
  for (let i = 1; i <= c.cap; i++)
    hits += spec.arrows * fanShare(Math.abs((far * i) / (c.cap + 1) - distance), reach, spec.range);
  return hits;
}

/**
 * The thorns of a channelled arrow, as hits of the skill's first hit for each use of the channel. A thorn deals what the released
 * arrow does (the stages' damage included) less the pod's share.
 */
export function sporeMult(p: SkillProfile, distance: number): number {
  const spec = p.skill.sporePods;
  const c = p.skill.channel;
  if (!spec || !c?.release) return 0;
  const r = c.release;
  const released = Math.max(0, 1 + (r.base ?? 0) / 100 + (r.perStage * c.cap) / 100);
  return (released * (1 - spec.less / 100) * sporeHits(p, distance)) / c.cap;
}

// ---- Thunder Spiral: orbs that jump about the target place and blast where they land

/**
 * Hits of the skill one target takes from each orb of a storm-orb channel. An orb blasts at each of its jumps but the last (it is
 * gone at the moment of that one), each at a place chosen evenly over a disc of `spread` tiles round the target place; the target is
 * hit when the blast reaches it.
 */
export function zapMult(p: SkillProfile): number {
  const o = p.skill.orb;
  if (o?.kind !== 'zap') return 0;
  const jumps = Math.max(1, Math.ceil((o.seconds * p.skillDuration) / o.jump - 1e-6) - 1);
  const reach = o.radius * p.radiusMult + TARGET_RADIUS;
  return jumps * Math.min(1, (reach / Math.max(1e-6, o.spread)) ** 2);
}

// ---- Skills whose damage is dealt by something the use sets going

export type StandingHits = {
  /** The profile the hits are dealt with (a blade round hits harder than the blade's cast). */
  profile: SkillProfile;
  /** Hits a second on one target, however often the skill is used. */
  hitsPerSec: number;
};

/**
 * A skill whose use deals nothing itself but sets something going that does:
 * - Orbiting Blades: a cast adds a blade (the most at once, each for a while); every round, which comes sooner for every blade,
 *   hits everything in reach together, harder and likelier to crit for every blade;
 * - Tempest Mote: a cast sets a mote (the last one gives way); it strikes the nearest enemy on its own beat.
 * `usesPerSec` is how often the skill is used. Returns null for any other skill.
 */
export function standingHits(p: SkillProfile, usesPerSec: number): StandingHits | null {
  const v = p.skill.vortex;
  if (v) {
    const blades = Math.min(v.max, usesPerSec * (1 + p.repeats) * v.seconds * p.skillDuration);
    if (blades <= 0) return { profile: p, hitsPerSec: 0 };
    const q: SkillProfile = {
      ...p,
      hands: p.hands.map((h) => ({
        ...h,
        hitMult: h.hitMult * (1 + (v.more / 100) * blades),
        critChance: Math.min(1, h.critChance * (1 + (v.crit / 100) * blades)),
      })),
    };
    return { profile: q, hitsPerSec: (1 + (v.hitRate / 100) * blades) / v.spin };
  }
  const o = p.skill.stormOrb;
  if (o) {
    // Quicker casting makes it strike sooner; it keeps its count to the next bolt from one mote to the next.
    const interval =
      levelValue(o.interval, p.skill.level) * (p.useTime / Math.max(0.05, p.skill.castTime));
    const uptime = Math.min(1, usesPerSec * o.seconds * p.skillDuration);
    return { profile: p, hitsPerSec: uptime / interval };
  }
  return null;
}

// ---- Scorching Ray: the exposure at the top stage

/**
 * Points off the resistance of the type a damage-over-time debuff deals, from the exposure it inflicts at its top stage (zero for a
 * debuff that exposes another type or none).
 */
export function exposureShift(spec: DotSpec, type: number): number {
  const id = spec.exposure;
  return id && EXPOSURE_TYPE[id] === type ? -STATUSES[id].v : 0;
}
