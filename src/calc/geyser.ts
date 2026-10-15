/**
 * A corpse made into a geyser (Pyre Burst, `SkillDef.geyser`): the use does not hit once, the geyser it leaves blasts the ground
 * about it every `interval` seconds for as long as it stands, each blast a hit of the skill. The sim's side is `placeGeyser` and
 * the `geyser` field (src/sim/fields.ts).
 */
import { TARGET_RADIUS } from './dot';
import type { SkillProfile } from './skill';

/**
 * Hits on one target that a use of the skill is worth, at the uses a second given. Each use puts a geyser down for its length,
 * and only `max` stand at once (the oldest gives way), so a character that uses the skill faster than that gives each geyser
 * only the time the others leave it. A geyser blasts once each `interval` it stands, anywhere on the disc it covers; the target is
 * hit by the blasts whose burst reaches it (the sheet puts it at the geyser, where the corpse it was made of lay). One for a
 * skill with no geyser.
 */
export function geyserHits(p: SkillProfile, usesPerSec: number): number {
  const g = p.skill.geyser;
  if (!g || usesPerSec <= 1e-9) return 1;
  const stands = Math.min(g.seconds * p.skillDuration, g.max / usesPerSec);
  const blasts = Math.max(1, Math.floor(stands / g.interval + 1e-6));
  const reach = g.radius * p.radiusMult;
  const covered = Math.min(1, ((g.blast * p.radiusMult + TARGET_RADIUS) / reach) ** 2);
  return blasts * covered;
}
