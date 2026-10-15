import type { DeployKind, SkillChoice } from './character';
import type { SkillProfile } from './skill';

/**
 * What a totem, brand, trap or mine is, in numbers the calc sheet and the sim share (docs/SPIRIT.md S10): how long each stands, how
 * many may stand, how often one shoots. The sim carries them out (`src/sim/deploy.ts`); the sheet's rotation plans with them.
 */

/** How long each kind of deployable stands, in seconds (the skill bar counts down over this). */
export const DEPLOY_SECONDS: Record<DeployKind, number> = {
  totem: 10,
  brand: 12,
  trap: 8,
  mine: 14,
};

/** How many sets of traps or mines can lie about at once (a set is as many as the skill puts down together). */
export const DEPLOY_SETS = 3;

/** How many of a deploying skill's totems, brands, traps or mines may stand at once. */
export function deployCap(c: SkillChoice, prof: SkillProfile): number {
  return c.deploy === 'totem' || c.deploy === 'brand'
    ? prof.deployCount
    : prof.deployCount * DEPLOY_SETS;
}

/** How long what a skill puts down stands: its own length, or a support's, or the kind's usual. */
export function deploySecondsOf(c: SkillChoice, prof: SkillProfile): number {
  const base =
    prof.deploySeconds > 0
      ? prof.deploySeconds
      : (c.skill.deploySeconds ?? DEPLOY_SECONDS[c.deploy!]);
  return c.deploy === 'trap' || c.deploy === 'mine' ? base : base * prof.skillDuration;
}

/** Seconds a new totem or brand waits before its first shot. */
export const TOTEM_FIRST_SHOT = 0.4;
/** The least time between the shots of one totem or brand. */
export const TOTEM_MIN_INTERVAL = 0.2;

/** Seconds between the shots of one totem or brand: its skill's use time, doubled for a ballista, never under the least. */
export function totemInterval(c: SkillChoice, prof: SkillProfile): number {
  return Math.max(TOTEM_MIN_INTERVAL, prof.useTime * (c.skill.ballista ? 2 : 1));
}
