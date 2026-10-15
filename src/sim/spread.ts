import type { SkillProfile } from '../calc/skill';

/**
 * Where the areas of one skill use go so that none lies on another: no skill and no support puts two areas of the same use
 * on one spot. A set of traps leans its areas toward the traps (src/sim/deploy.ts); a repeat lands a little off the last; the
 * balls and arrows a use throws keep their distance from each other.
 */

/** The angle that turns a spot round a centre without ever coming back to a place it has been (the golden angle). */
export const GOLDEN = 2.399963;

/** The radius of the area a profile puts at its target, or null for a skill that does not (a plain shot, a line, a nova at the caster). */
export function areaRadiusOf(prof: SkillProfile): number | null {
  const b = prof.skill.behaviour;
  if (b.kind === 'burst' && b.origin !== 'self') return b.radius * prof.radiusMult;
  if (b.kind === 'ground' && b.line === undefined) return b.radius * prof.radiusMult;
  // A skull that bursts where it ends, and a slow orb that strikes about itself as it drifts to the aim.
  if (b.kind === 'projectile' && prof.skill.leaves?.creep !== undefined)
    return (b.explodeRadius ?? 1.4) * prof.radiusMult;
  if (b.kind === 'projectile' && prof.skill.pulse) return prof.skill.pulse.radius * prof.radiusMult;
  return null;
}

/** How far off its target a repeat of an area lands, as a share of the area's radius (the target stays well inside it). */
const REPEAT_OFF = 0.45;

/** Where the `n`th repeat of an area aimed at (x, y) lands: round the aim, turned by the golden angle each time. */
export function repeatSpot(
  x: number,
  y: number,
  r: number,
  n: number,
  seed: number,
): { x: number; y: number } {
  const ang = seed * 0.37 + n * GOLDEN;
  return { x: x + Math.cos(ang) * REPEAT_OFF * r, y: y + Math.sin(ang) * REPEAT_OFF * r };
}
