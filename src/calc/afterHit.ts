import { levelValue } from './gems';
import { projectilePath } from './reach';
import type { SkillProfile } from './skill';

/**
 * The hits of one use that land on a single target, beyond the first, for the skills that send more out after a hit or that
 * burst more than once (docs/SHEET-AUDIT.md, section 5): the bolts, blades and balls of a strike, the arrows a Whirl Shot
 * scatters where it ends, the bursts of an orb that bounces on. `volleyHits` (character.ts) adds them to the use's hits.
 *
 * The sheet is for one target the size of the measuring dummy, hit dead centre, so the geometry below is the sim's own: the
 * scatter, spacing and radii are the ones `afterStrike` (src/sim/shots.ts) and `bounceOrbs` (src/sim/skillFx.ts) use. Calc cannot
 * import the sim, so the numbers are repeated here; `sheetVsSim.afterhit.test.ts` plays both and fails when they part.
 */

/** Half the width of the target, in tiles (the training dummy; the sheet's shotgun count assumes the same). */
export const TARGET_RADIUS = 0.5;
/** The radius of a projectile in flight (`launch`, src/sim/shots.ts). */
const PROJECTILE_RADIUS = 0.15;
/** Balls of a strike land this far from the struck enemy, evenly from the nearest to the farthest (src/sim/shots.ts). */
const BALL_NEAREST = 0.6;
const BALL_SPREAD = 1.6;
/** A ball bursts in this radius when its skill does not name one. */
const BALL_RADIUS = 1.2;
/** An orb that bounces on bursts in this radius when its skill is not a burst. */
const BOUNCE_RADIUS = 1.4;

/**
 * The hits a Whirl Shot lands on one target: the piercing arrow, and then the scatter where it ends (a target at the end of
 * its flight is struck by one of the arrows of the scatter; they share a hit list, so extra projectiles add arrows but no
 * hits). Null for any other skill. The sim takes this path before any other projectile mode (src/sim/shots.ts,
 * `fireProjectiles`), so a barrage or a shotgun on the skill changes nothing here.
 */
export function tornadoHits(p: SkillProfile): number | null {
  return projectilePath(p.skill) === 'tornado' ? 2 : null;
}

/**
 * The hits a skill adds to a use on one target, each counted as the share of the use's own hit it deals (a ball that does half
 * a strike's damage and lands counts a half). `hitChance` is the chance that an attack hit lands on the target: what a strike
 * sends out comes only after a hit, and has to hit itself.
 */
export function afterHitTargetHits(p: SkillProfile, distance: number, hitChance = 1): number {
  return strikeFollowUp(p, distance, hitChance) + bounceHits(p);
}

/** What a strike sends out after it (the bolts of an arc, the blades from behind the target, the balls on the ground). */
function strikeFollowUp(p: SkillProfile, distance: number, hitChance: number): number {
  const spec = p.skill.afterHit;
  if (!spec) return 0;
  const share = spec.mult / 100;
  const sent = spec.count + Math.max(0, p.projectiles - 1);
  switch (spec.kind) {
    case 'bolts': {
      // Bolts leave the character in an arc about the line to the target; they share a hit list, so the target takes the one
      // that flies true enough to touch it, and no more.
      if (sent < 1) return 0;
      const b = p.skill.behaviour;
      const reach = b.kind === 'melee' ? b.range + p.rangeBonus : distance;
      const d = Math.max(TARGET_RADIUS, Math.min(distance, reach));
      const arc = ((spec.arc ?? 85) * Math.PI) / 180;
      // With an odd count one flies straight at the target; with an even one the two nearest are half a step off.
      const off = sent % 2 === 1 || sent < 2 ? 0 : arc / (2 * (sent - 1));
      const touches = d * Math.sin(off) <= TARGET_RADIUS + PROJECTILE_RADIUS;
      return touches ? share * hitChance : 0;
    }
    case 'balls': {
      // Balls land on the ground about the struck enemy and burst where they land; each that bursts within reach of the target
      // is a hit of its own, the struck enemy not spared.
      const radius = (spec.explodeRadius ?? BALL_RADIUS) * p.radiusMult;
      const within = (radius + TARGET_RADIUS - BALL_NEAREST) / BALL_SPREAD;
      return sent * Math.max(0, Math.min(1, within)) * share * hitChance;
    }
    // Blades fly out at the others near the struck enemy, and the sheet is for one target. (The sim launches them from the
    // struck enemy's own spot with an empty hit list, so one of them strikes it again; the gem says they fly at the others near
    // it, so that is a fault of the sim and not something for the sheet to count.)
    default:
      return 0;
  }
}

/** The bursts of an orb that bounces on after the first, whether or not an enemy is there, that reach the target. */
function bounceHits(p: SkillProfile): number {
  const spec = p.skill.bounces;
  if (!spec) return 0;
  const b = p.skill.behaviour;
  const radius = (b.kind === 'burst' ? b.radius : BOUNCE_RADIUS) * p.radiusMult;
  const n = Math.round(levelValue(spec.chains, p.skill.level));
  let hits = 0;
  for (let i = 1; i <= n; i++) if (spec.spacing * i <= radius + TARGET_RADIUS) hits++;
  return hits;
}
