import type { SkillProfile } from '../calc/skill';
import { spellBaseDamage } from '../data/constants';
import type { ChargeKind } from '../calc/charges';
import { applyStatus } from './statuses';
import { gainCharge } from './charges';
import { hit, lifeCap, rawHit } from './combat';
import { scaleProfile } from './shots';
import type { Action, Actor, World } from './types';

/**
 * Lasting ground the player's skills leave, and the things that stand in the world and do their work from there
 * (docs/SPIRIT.md S6): consecrated ground (life back for the character in it, a better chance to crit what stands on it), chilling
 * ground that burns with cold and gives a Frenzy charge to a kill inside it, a frost crystal that exposes what is near and then
 * bursts, a storm of bolts that follows the character, a wall of ice that blocks the way.
 */

export type FieldKind = 'consecrated' | 'chilling' | 'crystal' | 'storm' | 'wall';

export type Field = {
  id: number;
  owner: number;
  kind: FieldKind;
  x: number;
  y: number;
  /** The radius it began with, how many times larger it ends, and the radius now. */
  r0: number;
  grow: number;
  radius: number;
  t: number;
  total: number;
  profile?: SkillProfile;
  hand: number;
  pulseT: number;
  interval: number;
  /** Chilling ground: the share of a hit it deals in a second. A storm: the damage of a bolt. */
  dps: number;
  killCharge?: { kind: ChargeKind; chance: number };
  /** A storm: the enemies it has struck lately (so none is struck twice within 0.4 s). */
  recent?: Map<number, number>;
  dtype: number;
  /** A wall: the tiles it holds shut. */
  tiles?: number[];
};

const REGEN_CONSECRATED = 0.06;
const CRIT_ON_CONSECRATED = 2;

function dominantType(p: SkillProfile): number {
  let dtype = 0;
  let best = -1;
  for (const c of p.hands[0]?.chunks ?? [])
    if (c.max > best) {
      best = c.max;
      dtype = c.type;
    }
  return dtype;
}

/** A skill that leaves ground behind it does so where it lands. */
export function leaveGround(w: World, a: Actor, act: Action): void {
  const p = act.profile;
  const spec = p.skill.leaves;
  if (!spec || !a.isPlayer) return;
  const b = p.skill.behaviour;
  const atSelf = (b.kind === 'burst' && b.origin === 'self') || b.kind === 'melee';
  const x = atSelf ? a.x : act.aimX;
  const y = atSelf ? a.y : act.aimY;
  const r = spec.radius * p.radiusMult;
  w.fields.push({
    id: w.nextId++,
    owner: a.id,
    kind: spec.kind,
    x,
    y,
    r0: r,
    grow: spec.grow ?? 1,
    radius: r,
    t: spec.seconds,
    total: spec.seconds,
    profile: p,
    hand: act.hand,
    pulseT: 0,
    interval: 0.5,
    dps: spec.dps ?? 0,
    killCharge: spec.killCharge,
    dtype: dominantType(p),
  });
  w.events.push({ t: 'explode', x, y, r, dtype: dominantType(p) });
}

/** A frost crystal: it stands for a moment, exposing what is near it, and bursts when its time is up. */
export function placeCrystal(w: World, a: Actor, act: Action): void {
  const p = act.profile;
  const spec = p.skill.crystal!;
  const r = spec.radius * p.radiusMult;
  w.fields.push({
    id: w.nextId++,
    owner: a.id,
    kind: 'crystal',
    x: act.aimX,
    y: act.aimY,
    r0: r,
    grow: 1,
    radius: r,
    t: spec.seconds,
    total: spec.seconds,
    profile: p,
    hand: act.hand,
    pulseT: 0,
    interval: spec.interval,
    dps: 0,
    dtype: dominantType(p),
  });
}

/** A storm of bolts that follows the character (Herald of Thunder after a kill). */
export function startStorm(
  w: World,
  seconds: number,
  interval: number,
  radius: number,
  effectiveness: number,
  dtype: number,
): void {
  const level = Math.max(1, Math.min(20, 1 + Math.floor(w.plan.areaLevel / 5)));
  w.fields.push({
    id: w.nextId++,
    owner: w.player.id,
    kind: 'storm',
    x: w.player.x,
    y: w.player.y,
    r0: radius,
    grow: 1,
    radius,
    t: seconds,
    total: seconds,
    hand: 0,
    pulseT: 0,
    interval,
    dps: (spellBaseDamage(level) * effectiveness) / 100,
    dtype,
    recent: new Map(),
  });
}

function enemiesIn(w: World, x: number, y: number, r: number): Actor[] {
  return w.actors.filter(
    (e) => !e.isPlayer && e.alive && e.phaseT <= 0 && Math.hypot(e.x - x, e.y - y) <= r + e.r,
  );
}

/** Whether a point is on consecrated ground of the player's. */
export function consecratedAt(w: World, x: number, y: number): boolean {
  for (const f of w.fields)
    if (f.kind === 'consecrated' && Math.hypot(x - f.x, y - f.y) <= f.radius) return true;
  return false;
}

/** An enemy dies on chilling ground that gives charges: roll the chance. */
export function fieldKill(w: World, dead: Actor): void {
  for (const f of w.fields)
    if (
      f.killCharge &&
      Math.hypot(dead.x - f.x, dead.y - f.y) <= f.radius + dead.r &&
      w.rngTrig.chance(f.killCharge.chance / 100)
    )
      gainCharge(w, f.killCharge.kind);
}

/** Run the fields: they pulse, they grow, they end. */
export function tickFields(w: World, dt: number): void {
  if (w.fields.length === 0) return;
  const p = w.player;
  let j = 0;
  for (const f of w.fields) {
    f.t -= dt;
    f.radius = f.r0 * (1 + (f.grow - 1) * (1 - Math.max(0, f.t) / f.total));
    if (f.kind === 'storm') {
      f.x = p.x;
      f.y = p.y;
    }
    f.pulseT -= dt;
    const pulse = f.pulseT <= 0;
    if (pulse) f.pulseT += f.interval;
    if (f.kind === 'consecrated') {
      if (p.alive && Math.hypot(p.x - f.x, p.y - f.y) <= f.radius + p.r)
        p.life = Math.min(lifeCap(w, p), p.life + p.def.maxLife * REGEN_CONSECRATED * dt);
    } else if (f.kind === 'chilling' && pulse && f.profile) {
      const q = scaleProfile(f.profile, f.dps * f.interval);
      for (const e of enemiesIn(w, f.x, f.y, f.radius))
        hit(w, p, e, q, f.hand, Math.hypot(e.x - p.x, e.y - p.y));
    } else if (f.kind === 'crystal' && f.profile) {
      const spec = f.profile.skill.crystal!;
      if (pulse)
        for (const e of enemiesIn(w, f.x, f.y, f.radius)) {
          applyStatus(w, e, 'exposedCold', { seconds: spec.debuffSeconds, v: spec.exposure });
          applyStatus(w, e, 'regenLess', { seconds: spec.debuffSeconds, v: spec.regenLess });
        }
      if (f.t <= 0) {
        w.events.push({ t: 'explode', x: f.x, y: f.y, r: f.radius, dtype: f.dtype });
        for (const e of enemiesIn(w, f.x, f.y, f.radius))
          hit(w, p, e, f.profile, f.hand, Math.hypot(e.x - p.x, e.y - p.y));
      }
    } else if (f.kind === 'storm' && pulse && f.recent) {
      const near = enemiesIn(w, p.x, p.y, f.radius).filter(
        (e) => (f.recent!.get(e.id) ?? -1) < w.t - 0.4,
      );
      if (near.length) {
        const e = near[w.rngTrig.int(0, near.length - 1)];
        f.recent.set(e.id, w.t);
        w.events.push({ t: 'beam', x: e.x, y: e.y - 3, x2: e.x, y2: e.y, dtype: f.dtype });
        rawHit(w, e, f.dps * (0.5 + w.rngTrig.float(0, 1)), f.dtype, 'Herald');
      }
    }
    if (f.t > 0) w.fields[j++] = f;
    else if (f.kind === 'wall') endWall(w, f);
  }
  w.fields.length = j;
}

// ---- walls

/** Raise a wall of ice: the tiles across the way become wall, and what stands there is pushed back. */
export function raiseWall(w: World, a: Actor, act: Action): void {
  const p = act.profile;
  const spec = p.skill.wall!;
  const len = spec.length * p.radiusMult;
  const ang = Math.atan2(act.aimY - a.y, act.aimX - a.x) + Math.PI / 2;
  const tiles: number[] = [];
  const steps = Math.max(1, Math.round(len / 0.5));
  for (let i = 0; i <= steps; i++) {
    const off = (i / steps - 0.5) * len;
    const tx = Math.floor(act.aimX + Math.cos(ang) * off);
    const ty = Math.floor(act.aimY + Math.sin(ang) * off);
    const idx = ty * w.grid.w + tx;
    if (tiles.includes(idx) || w.grid.tiles[idx] !== 1) continue;
    // Never wall in the character, or a body.
    if (Math.floor(a.x) === tx && Math.floor(a.y) === ty) continue;
    if (w.actors.some((e) => e.alive && Math.floor(e.x) === tx && Math.floor(e.y) === ty)) continue;
    tiles.push(idx);
  }
  if (tiles.length === 0) return;
  for (const idx of tiles) w.grid.tiles[idx] = 0;
  w.grid.refreshOpen();
  const f: Field = {
    id: w.nextId++,
    owner: a.id,
    kind: 'wall',
    x: act.aimX,
    y: act.aimY,
    r0: len / 2,
    grow: 1,
    radius: len / 2,
    t: spec.seconds,
    total: spec.seconds,
    profile: p,
    hand: act.hand,
    pulseT: 0,
    interval: 1,
    dps: 0,
    dtype: dominantType(p),
    tiles,
  };
  w.fields.push(f);
  w.events.push({ t: 'explode', x: act.aimX, y: act.aimY, r: len / 2, dtype: f.dtype });
  // What stood under the wall takes the hit, and is thrown back from the line.
  for (const e of enemiesIn(w, act.aimX, act.aimY, len / 2 + 0.4)) {
    hit(w, a, e, p, act.hand, Math.hypot(e.x - a.x, e.y - a.y));
    const dx = e.x - act.aimX;
    const dy = e.y - act.aimY;
    const side =
      Math.sign(dx * Math.cos(ang - Math.PI / 2) + dy * Math.sin(ang - Math.PI / 2)) || 1;
    const spot = w.grid.collide(
      e.x + Math.cos(ang - Math.PI / 2) * side * spec.push,
      e.y + Math.sin(ang - Math.PI / 2) * side * spec.push,
      e.r,
    );
    e.x = spot.x;
    e.y = spot.y;
  }
}

function endWall(w: World, f: Field): void {
  for (const idx of f.tiles ?? []) w.grid.tiles[idx] = 1;
  w.grid.refreshOpen();
}

export { CRIT_ON_CONSECRATED };
