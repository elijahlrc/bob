import type { SkillDotProfile, SkillProfile } from '../calc/skill';
import { effectiveRes } from '../calc/formulas';
import { statusTaken } from './statuses';
import { applyStatus } from './statuses';
import type { Actor, World } from './types';

/**
 * Damage over time that a skill inflicts as a debuff of its own (docs/SPIRIT.md S7): Contagion, Blight, Essence Drain, Scorching
 * Ray, the ground of Caustic Arrow, Bane, the burning of a Torch Arrow, and the Decay a support puts on every hit. It is not an
 * ailment. The enemy's resistance is taken off when the debuff lands; its damage taken and the curses' effects when it ticks.
 */
export type SkillDot = {
  /** The skill that inflicted it, so a second use renews it (or adds a layer) rather than adding a second kind. */
  src: string;
  /** Damage a second after the enemy's resistance, and before the enemy's damage taken. */
  dps: number;
  /** The tooltip damage a second: what a regeneration is a share of. */
  raw: number;
  type: number;
  t: number;
  /** One of several layers of the same skill (each runs on its own time). */
  layer: boolean;
  /** Stages built (Scorching Ray). */
  n: number;
  /** The radius around the enemy it passes on to when it dies, in tiles; 0 for none. 'carry' ones go along with one that spreads. */
  spreadR: number;
  carry: boolean;
  /** Percent of `raw` the caster mends a second. */
  regen: number;
};

/** A hit's worth of damage over time lands on an enemy: after its resistance. */
function afterResist(dst: Actor, type: number, dps: number): number {
  const def = dst.def;
  if (def.immune[type] || (type === 4 && def.immuneChaos)) return 0;
  if (type === 0) return dps;
  const st = statusTaken(dst);
  const shift = dst.resShift[type] - dst.hexRes[type] - st.res[type];
  return dps * (1 - effectiveRes(def.res[type] + shift, def.maxRes[type]) / 100);
}

function radiusOf(p: SkillProfile): number {
  const b = p.skill.behaviour;
  const r = b.kind === 'burst' ? b.radius : b.kind === 'ground' ? b.radius : 2;
  return r * p.radiusMult;
}

/**
 * Put a skill's damage over time on an enemy. `seconds` and `dps` are the profile's unless the caller gives its own (a patch of
 * ground renews it in short spans; a curse linked to Bane lengthens it). Returns whether it was inflicted.
 */
export function applySkillDot(
  w: World,
  dst: Actor,
  p: SkillProfile,
  over: { seconds?: number; more?: number } = {},
): boolean {
  const sd = p.skillDot;
  if (!sd || !dst.alive || dst.isPlayer) return false;
  const spec = sd.spec;
  const raw = sd.dps * (1 + (over.more ?? 0) / 100);
  const dps = afterResist(dst, sd.type, raw);
  const seconds = over.seconds ?? sd.seconds;
  const id = p.skill.id;
  const mine = dst.sdots.filter((d) => d.src === id);
  const fresh: SkillDot = {
    src: id,
    dps,
    raw,
    type: sd.type,
    t: seconds,
    layer: spec.stack === 'layers',
    n: 1,
    spreadR: spec.spread === true ? radiusOf(p) : 0,
    carry: spec.spread === 'carry',
    regen: spec.regen ?? 0,
  };
  if (spec.hinder && mine.length === 0)
    applyStatus(w, dst, 'hinder', { seconds: spec.hinder.seconds, v: spec.hinder.v });
  if (spec.stack === 'refresh') {
    const have = mine[0];
    if (have) {
      have.dps = dps;
      have.raw = raw;
      have.t = Math.max(have.t, seconds);
    } else dst.sdots.push(fresh);
  } else if (spec.stack === 'layers') {
    const cap = spec.cap ?? 20;
    if (mine.length >= cap) {
      // The oldest layer (the least time left) gives way.
      let oldest = mine[0];
      for (const d of mine) if (d.t < oldest.t) oldest = d;
      Object.assign(oldest, fresh);
    } else dst.sdots.push(fresh);
  } else {
    // Stages: one debuff that gains a stage with each use and renews its time.
    const cap = spec.cap ?? 8;
    const have = mine[0];
    const pct = (spec.stagePct ?? 0) / 100;
    if (have) {
      have.n = Math.min(cap, have.n + 1);
      have.raw = raw * (1 + pct * (have.n - 1));
      have.dps = afterResist(dst, sd.type, have.raw);
      have.t = Math.max(have.t, seconds);
      if (have.n >= cap && spec.exposure) applyStatus(w, dst, spec.exposure, {});
    } else dst.sdots.push(fresh);
  }
  w.events.push({ t: 'dot', dst: dst.id, id });
  return true;
}

/** A flat damage over time from a named source: one at a time, renewed (Decay, the burn of a Herald of Ash). */
export function applyFlatDot(
  w: World,
  dst: Actor,
  src: string,
  type: number,
  amount: number,
  seconds: number,
): void {
  if (!dst.alive || dst.isPlayer) return;
  const dps = afterResist(dst, type, amount);
  const have = dst.sdots.find((d) => d.src === src);
  if (have) {
    have.dps = dps;
    have.raw = amount;
    have.t = Math.max(have.t, seconds);
    return;
  }
  dst.sdots.push({
    src,
    dps,
    raw: amount,
    type,
    t: seconds,
    layer: false,
    n: 1,
    spreadR: 0,
    carry: false,
    regen: 0,
  });
  w.events.push({ t: 'dot', dst: dst.id, id: src });
}

/** Decay: a flat chaos damage over time on a hit. */
export function applyDecay(w: World, dst: Actor, decay: { dps: number; seconds: number }): void {
  applyFlatDot(w, dst, '@decay', 4, decay.dps, decay.seconds);
}

/** A burning debuff from an ignite (Torch Arrow): a share of the ignite's damage a second, for a time, several at once. */
export function applyBurning(
  w: World,
  dst: Actor,
  dps: number,
  seconds: number,
  cap: number,
): void {
  if (!dst.alive || dst.isPlayer || dps <= 0) return;
  const mine = dst.sdots.filter((d) => d.src === '@burning');
  const fresh: SkillDot = {
    src: '@burning',
    dps,
    raw: dps,
    type: 3,
    t: seconds,
    layer: true,
    n: 1,
    spreadR: 0,
    carry: false,
    regen: 0,
  };
  if (mine.length >= cap) {
    let oldest = mine[0];
    for (const d of mine) if (d.t < oldest.t) oldest = d;
    Object.assign(oldest, fresh);
  } else dst.sdots.push(fresh);
  w.events.push({ t: 'dot', dst: dst.id, id: '@burning' });
}

/** The damage a second, by type, of the enemy's skill debuffs; and the life the character mends from them. */
export function sumSkillDots(w: World, a: Actor, out: number[], dt: number): void {
  const p = w.player;
  for (const d of a.sdots) {
    out[d.type] += d.dps;
    if (d.regen > 0 && p.alive && !a.isPlayer)
      p.life = Math.min(p.def.maxLife, p.life + (d.raw * d.regen * dt) / 100);
  }
}

/** Count the times down. */
export function decaySkillDots(a: Actor, dt: number): void {
  let j = 0;
  for (const d of a.sdots) {
    d.t -= dt;
    if (d.t > 0) a.sdots[j++] = d;
  }
  a.sdots.length = j;
}

/**
 * An enemy that dies with a spreading debuff passes it on, with the time it had left, to those near it that do not carry it;
 * one that goes along with a spreading debuff (Essence Drain, beside Contagion) is passed on too.
 */
export function spreadSkillDots(w: World, dead: Actor): void {
  if (dead.sdots.length === 0) return;
  const radius = dead.sdots.reduce((r, d) => Math.max(r, d.spreadR), 0);
  if (radius <= 0) return;
  for (const e of w.actors) {
    if (e === dead || e.isPlayer || !e.alive || e.faction !== dead.faction) continue;
    if (Math.hypot(e.x - dead.x, e.y - dead.y) > radius + e.r) continue;
    for (const d of dead.sdots) {
      if (d.spreadR <= 0 && !d.carry) continue;
      if (d.layer) continue;
      if (e.sdots.some((x) => x.src === d.src)) continue;
      e.sdots.push({
        ...d,
        dps: afterResist(e, d.type, d.raw),
        // A passed-on debuff does not itself pass on again from a carrier that is only along for the ride.
        spreadR: d.spreadR,
      });
      w.events.push({ t: 'dot', dst: e.id, id: d.src });
    }
  }
}

export type { SkillDotProfile };
