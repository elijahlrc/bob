import { ECHO_GAP, HIT_AT, SCATTER_RADIUS } from '../data/constants';
import type { SkillChoice } from './character';
import { shockTaken, type TargetState } from './combat';
import { deployCap } from './deploy';
import { effectiveRes } from './formulas';
import { levelValue } from './gems';
import type { SkillProfile } from './skill';

/**
 * What one shot, trap or mine of a deploying skill is worth (docs/SHEET-AUDIT.md, totems/traps/mines/walls): the hits one go lands on a
 * single target, and what its mine adds to every hit near it. The sim carries them out (`src/sim/deploy.ts`, `src/sim/shots.ts`); the
 * numbers it uses are copied here, since the calc cannot read the sim. How often a deployable goes off is the rotation's say
 * (`Character.planned`), not this file's.
 */

/** Radius of the training dummy and of a typical enemy, tiles: a burst reaches it from this much beyond its own edge. */
export const TARGET_RADIUS = 0.5;
/** Tiles ahead of the character a totem is put down, toward the target (`TOTEM_OFFSET`, src/sim/deploy.ts). */
export const TOTEM_AHEAD = 1.5;
/** Tiles from the target of a mine that lies in a ring of several (`placeDeployable`, src/sim/deploy.ts). */
export const MINE_RING = 1.2;
/** Arrows of a mortar that come down along a line land at least this far apart, in tiles (`MORTAR_APART`, src/sim/shots.ts). */
export const MORTAR_APART = 0.45;
/**
 * Seconds from a mine landing to its being armed (`MINE_ARM`: none, as in the reference, where a mine can be set off as soon as it
 * lands), and from its being set off to its going (`DETONATION`).
 */
export const MINE_ARM = 0;
export const MINE_DETONATION = 0.25;
/** The mean distance of a mine laid at random over the wide place of Snare Cluster from the target, tiles (a disc's mean is 2/3 of its radius). */
const SCATTER_MEAN = (2 / 3) * SCATTER_RADIUS;

/** How many tiles from the target the shooter of a skill stands: a totem stands ahead of the character, toward the target. */
export function shooterDistance(choice: SkillChoice, distance: number): number {
  return choice.deploy === 'totem' ? Math.max(0.5, distance - TOTEM_AHEAD) : distance;
}

/**
 * How many of the arrows of a mortar skill (Mortar Bow) burst on a target `aim` tiles from the shooter. They are lobbed in a line
 * toward it and each bursts where it comes down, from `from` of the way there (at least a tile from the shooter) to the target
 * itself, so a target is under the burst of every arrow that comes down within the burst's reach of it.
 */
export function mortarHits(p: SkillProfile, aim: number): number {
  const m = p.skill.mortar;
  if (!m) return 1;
  const n = Math.max(1, Math.round(p.projectiles));
  const reach = m.radius * p.radiusMult + TARGET_RADIUS;
  let hits = 0;
  let lands = 0;
  for (let i = 0; i < n; i++) {
    const frac = n > 1 ? m.from + ((1 - m.from) * i) / (n - 1) : 1;
    // Each lands further on than the one before, by at least a little, so that no two burst on one spot.
    lands = Math.max(1, aim * frac, i > 0 ? lands + MORTAR_APART : 0);
    if (Math.abs(aim - lands) <= reach) hits++;
  }
  return Math.max(1, hits);
}

/** The area of the part of a disc of radius `r` that lies inside a disc of radius `big` whose centre is `d` away. */
function overlap(big: number, r: number, d: number): number {
  if (d >= big + r) return 0;
  if (d <= Math.abs(big - r)) return Math.PI * Math.min(big, r) ** 2;
  const a = Math.acos((d * d + big * big - r * r) / (2 * d * big));
  const b = Math.acos((d * d + r * r - big * big) / (2 * d * r));
  return big * big * (a - Math.sin(2 * a) / 2) + r * r * (b - Math.sin(2 * b) / 2);
}

/** How far from the target the mines of a skill lie, tiles. */
function mineDistance(p: SkillProfile): number {
  if (p.deployScatter) return SCATTER_MEAN;
  return p.deployCount > 1 ? MINE_RING : 0;
}

/**
 * The hits a mine's or trap's rain lands on the target, beyond its burst: it sends `count` small bursts (more for each mine that went before
 * it in the sequence) down at random over a disc round the mine, and one that comes down within its reach of the target hits it.
 */
export function mineRainHits(choice: SkillChoice, p: SkillProfile): number {
  const rain = choice.skill.mineRain;
  const b = choice.skill.behaviour;
  if ((choice.deploy !== 'mine' && choice.deploy !== 'trap') || !rain || b.kind !== 'burst')
    return 0;
  // The mines of a set go in order; the later ones rain more. A set is the mines laid together.
  const set = Math.max(1, p.deployCount);
  const count = Math.round(levelValue(rain.count, choice.skill.level));
  let bursts = 0;
  for (let seq = 0; seq < set; seq++)
    bursts += count + (rain.perPrior ? Math.floor(seq / rain.perPrior) : 0);
  bursts /= set;
  const reach = b.radius * rain.radius * p.radiusMult + TARGET_RADIUS;
  const chance =
    rain.spread > 0
      ? overlap(rain.spread, reach, mineDistance(p)) / (Math.PI * rain.spread ** 2)
      : 1;
  return bursts * Math.min(1, chance);
}

/** How long a mine lies from landing to going off, seconds. */
export function mineLife(choice: SkillChoice): number {
  return MINE_ARM + (choice.skill.detonation ?? MINE_DETONATION);
}

/**
 * The mines of a skill that lie near the target while a hit lands, on average: as many as are laid in the time one lies, and at
 * least the one going off. A mine that rains bursts after it goes (Mortar Charge) counts itself for its own burst only: the rain
 * comes down among the others, after it has gone. No more than may lie at once.
 */
export function minesNear(choice: SkillChoice, p: SkillProfile, fires: number): number {
  // An echo of the use lays a set of mines again.
  const laid = fires * (choice.triggered ? 1 : 1 + p.repeats);
  const lying = laid * mineLife(choice);
  const rain = mineRainHits(choice, p);
  const near = rain > 0 ? lying + 1 / (1 + rain) : Math.max(1, lying);
  return Math.min(deployCap(choice, p), near);
}

/**
 * What the mines near an enemy add to every hit against it (`mineAuraAt`): raw fire damage a hit, from each mine, the sum of them no
 * more than the cap (not scaled by the character: it takes only the enemy's fire defences), and more damage taken from each mine, up to
 * a cap. Returns the damage added a hit, and the multiplier on the damage of the hit itself.
 */
export function mineAura(
  choice: SkillChoice,
  p: SkillProfile,
  t: TargetState,
  fires: number,
): { add: number; more: number } {
  const a = choice.skill.mineAura;
  if (choice.deploy !== 'mine' || !a) return { add: 0, more: 1 };
  const near = minesNear(choice, p, fires);
  const level = choice.skill.level;
  const min = levelValue(a.min, level) * near;
  const max = levelValue(a.max, level) * near;
  const cap = levelValue(a.cap, level);
  const k = cap > 0 && max > cap ? cap / max : 1;
  let add = ((k * (min + max)) / 2) * fireTaken(t);
  if (max <= 0) add = 0;
  const taken = (a.taken ?? 0) * near;
  const more = 1 + ((a.takenCap ?? 0) > 0 ? Math.min(a.takenCap ?? 0, taken) : taken) / 100;
  return { add, more };
}

/** The share of a raw fire hit that gets through the target's defences (the sim's `rawHit`: no penetration, no character scaling). */
function fireTaken(t: TargetState): number {
  const def = t.def;
  if (def.immune[3]) return 0;
  const r = effectiveRes(def.res[3] + (t.resShift[3] ?? 0), def.maxRes[3]);
  return (
    (1 - r / 100) *
    def.damageTakenMult *
    def.hitTakenMult *
    shockTaken(def, t.shock) *
    def.damageTakenType[3] *
    (1 + (t.vulnAll ?? 0)) *
    (1 + (t.vulnType?.[3] ?? 0))
  );
}

/**
 * What a deployed skill's one shot lands on a single target, and what it adds, for `skillSheet`: `hits` multiplies the hits of a use
 * (a mortar's arrows, a mine's or trap's burst and its rain), `add` is raw damage added to every hit, and `more` multiplies the hits themselves.
 */
export function deployedEffects(
  choice: SkillChoice,
  p: SkillProfile,
  t: TargetState,
  distance: number,
  fires: number,
): { hits: number; add: number; more: number } {
  if (p.skill.mortar)
    return { hits: mortarHits(p, shooterDistance(choice, distance)), add: 0, more: 1 };
  if (choice.deploy === 'trap') return { hits: 1 + mineRainHits(choice, p), add: 0, more: 1 };
  if (choice.deploy !== 'mine') return { hits: 1, add: 0, more: 1 };
  const aura = mineAura(choice, p, t, fires);
  return { hits: 1 + mineRainHits(choice, p), add: aura.add, more: aura.more };
}

/** Seconds from a trap landing to its being armed (`fireT` of a new trap, src/sim/deploy.ts). */
export const TRAP_ARM = 0.3;
/** The share of a use by which the last echo of a repeating skill has landed (`updateAction`, src/sim/actions.ts). */
const LAST_ECHO = 0.98;

/**
 * A trap or a mine as the rotation plan sees it (`PlanSkill.standing`): it stands from landing until it goes off, and the character
 * lays no more while as many as `deployCap` stand, using its weapon meanwhile. A use puts down `deployCount` of them, and each echo
 * of a repeating skill (which ignores the cap) as many again. `count` is how many standing uses fill the cap.
 */
export function setStanding(
  choice: SkillChoice,
  p: SkillProfile,
): { count: number; seconds: number; firstShot: number; interval: number } {
  const per = Math.max(1, p.deployCount) * (1 + p.repeats);
  const echoes = p.repeats > 0 ? Math.min(ECHO_GAP * p.repeats, LAST_ECHO - HIT_AT) * p.useTime : 0;
  const arm = choice.deploy === 'mine' ? mineLife(choice) : TRAP_ARM;
  return {
    count: Math.max(1, Math.ceil(deployCap(choice, p) / per)),
    seconds: echoes + arm,
    firstShot: 1e9,
    interval: 1e9,
  };
}
