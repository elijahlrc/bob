import { levelValue } from '../calc/gems';
import { applyDamage, hit } from './combat';
import { scaleProfile } from './shots';
import { applyStatus } from './statuses';
import type { Action, Actor, World } from './types';

/**
 * Stances, rage-fed buffs and the storms of a stance (docs/SPIRIT.md S9).
 *
 * A stance gem (Blood and Sand, Flesh and Stone) holds two sets of effects and the character is in one of them at a time; the
 * stance is shared by every stance gem and by the skills that read it (Bladestorm). The character swaps by the policy of
 * docs/SPIRIT.md section 5: the stance for a crowd when three or more enemies are near, the other otherwise, at most every two
 * seconds. Berserk needs rage, drains it faster each second and ends when it is gone; Blood Rage costs life every second, is
 * renewed by a kill, and the character lets it go when life runs low.
 */

export type Stance = 'blood' | 'sand';

const SWAP_EVERY = 2;
const AURA_EVERY = 0.5;
const PACK_RADIUS = 7;
const PACK_SIZE = 3;
/** Blood Rage is let go below this share of life. */
const BLOOD_RAGE_FLOOR = 0.25;

export function stanceOf(w: World): Stance {
  return w.buffT.sandStance > 0 ? 'sand' : 'blood';
}

export function setStance(w: World, s: Stance): void {
  w.buffT.bloodStance = s === 'blood' ? 1e9 : 0;
  w.buffT.sandStance = s === 'sand' ? 1e9 : 0;
  w.events.push({ t: 'buff', id: s === 'blood' ? 'bloodStance' : 'sandStance' });
}

const stanceAuras = (w: World) => w.char.auras.filter((a) => a.active && a.def.stance);

/** Percent less damage the character takes from attacks by enemies that are not near, in the stance it is in (Flesh and Stone). */
export function stanceFarLess(w: World): { less: number; radius: number } | null {
  const s = stanceOf(w);
  for (const a of stanceAuras(w)) {
    const side = a.def.stance![s];
    if (side.farLess)
      return { less: levelValue(side.farLess, a.gem.level) / 100, radius: a.def.stance!.radius };
  }
  return null;
}

/** The stance swaps by policy, and the stance's effects on the enemies near the character are renewed. */
export function tickStance(w: World): void {
  const auras = stanceAuras(w);
  if (auras.length === 0) return;
  const p = w.player;
  if ((w.utilityReady['@stance'] ?? 0) <= w.t) {
    let near = 0;
    for (const e of w.actors)
      if (!e.isPlayer && e.alive && Math.hypot(e.x - p.x, e.y - p.y) <= PACK_RADIUS) near++;
    const want: Stance = near >= PACK_SIZE ? 'sand' : 'blood';
    if (want !== stanceOf(w)) setStance(w, want);
    w.utilityReady['@stance'] = w.t + SWAP_EVERY;
  }
  if (Math.floor(w.t / AURA_EVERY) === Math.floor((w.t - 1 / 60) / AURA_EVERY)) return;
  const s = stanceOf(w);
  for (const a of auras) {
    const side = a.def.stance![s];
    if (!side.enemies) continue;
    const e0 = side.enemies;
    const v = levelValue(e0.v, a.gem.level);
    const x = e0.x === undefined ? 0 : levelValue(e0.x, a.gem.level);
    for (const e of w.actors)
      if (
        !e.isPlayer &&
        e.alive &&
        e.phaseT <= 0 &&
        Math.hypot(e.x - p.x, e.y - p.y) <= a.def.stance!.radius + e.r
      )
        applyStatus(w, e, e0.id, { seconds: e0.seconds, v, x });
  }
}

// ---- Bladestorm

type Blades = NonNullable<import('../calc/gems').SkillDef['bladestorm']>;

/** A spin that makes a storm in the stance the character is in: a still one that quickens attacks, a drifting one that quickens feet. */
export function placeBladestorm(w: World, a: Actor, act: Action): void {
  const p = act.profile;
  const spec = p.skill.bladestorm as Blades | undefined;
  if (!spec || !a.isPlayer) return;
  const s = stanceOf(w);
  const mine = w.fields.filter((f) => f.kind === 'bladestorm');
  if (mine.length >= spec.max) {
    const oldest = mine.reduce((x, y) => (x.t < y.t ? x : y));
    w.fields.splice(w.fields.indexOf(oldest), 1);
  }
  const r = spec.radius * p.radiusMult;
  const drift = s === 'sand' ? spec.drift : 0;
  w.fields.push({
    id: w.nextId++,
    owner: a.id,
    kind: 'bladestorm',
    x: a.x,
    y: a.y,
    vx: Math.cos(a.facing) * drift,
    vy: Math.sin(a.facing) * drift,
    r0: r,
    grow: 1,
    radius: r,
    t: spec.seconds,
    total: spec.seconds,
    profile: scaleProfile(p, 1 + spec.more / 100),
    hand: act.hand,
    pulseT: spec.interval,
    interval: spec.interval,
    dps: 0,
    dtype: 0,
    stance: s,
  });
  w.events.push({ t: 'explode', x: a.x, y: a.y, r, dtype: 0 });
}

export function tickBladestorm(w: World, f: import('./fields').Field, dt: number): void {
  const p = w.player;
  const spec = f.profile!.skill.bladestorm as Blades;
  if (f.vx || f.vy) {
    const spot = w.grid.collide(f.x + f.vx! * dt, f.y + f.vy! * dt, 0.3);
    f.x = spot.x;
    f.y = spot.y;
  }
  // The character in the storm gains what the stance it was made in gives.
  if (p.alive && Math.hypot(p.x - f.x, p.y - f.y) <= f.radius + p.r) {
    const id = f.stance === 'sand' ? spec.sand : spec.blood;
    w.buffT[id] = Math.max(w.buffT[id], 0.3);
  }
  f.pulseT -= dt;
  if (f.pulseT > 0) return;
  f.pulseT += f.interval;
  for (const e of w.actors)
    if (
      !e.isPlayer &&
      e.alive &&
      e.phaseT <= 0 &&
      Math.hypot(e.x - f.x, e.y - f.y) <= f.radius + e.r
    )
      hit(w, p, e, f.profile!, f.hand, Math.hypot(e.x - p.x, e.y - p.y));
}

// ---- Berserk, Blood Rage

/** The rage a Berserk spends, faster each second, and the end when none is left. */
export function tickBerserk(w: World, dt: number): void {
  for (const c of w.char.utilities) {
    const u = c.skill.utility;
    if (u?.kind !== 'buff' || !u.rage || w.buffT[u.buff] <= 0) continue;
    w.berserkT += dt;
    w.rageT = 0;
    w.rage -= u.rage.drain * Math.pow(1 + u.rage.accel / 100, w.berserkT) * dt;
    if (w.rage > 0) continue;
    w.rage = 0;
    w.berserkT = 0;
    w.buffT[u.buff] = 0;
    // The skill's own cooldown starts when it ends.
    w.utilityReady[c.key] = w.t + (u.cooldown ?? 0);
  }
}

/** Blood Rage: the life and energy shield it costs each second, and the character lets it go when life runs low. */
export function tickDegen(w: World, dt: number): void {
  const p = w.player;
  for (const c of w.char.utilities) {
    const u = c.skill.utility;
    if (u?.kind !== 'buff' || !u.degen || w.buffT[u.buff] <= 0) continue;
    if (p.life < p.def.maxLife * BLOOD_RAGE_FLOOR) {
      w.buffT[u.buff] = 0;
      continue;
    }
    // Physical damage over time: physical damage reduction answers to it, armour does not.
    const share = (u.degen / 100) * dt * (1 - p.def.physReduction);
    applyDamage(w, p, [share * p.def.maxLife, 0, 0, 0, 0]);
    p.es = Math.max(0, p.es - (u.degen / 100) * p.def.maxEs * dt);
  }
}

/** A kill renews the buffs that a kill renews (Blood Rage). */
export function refreshOnKill(w: World): void {
  for (const c of w.char.utilities) {
    const u = c.skill.utility;
    if (u?.kind === 'buff' && u.refreshOnKill && w.buffT[u.buff] > 0)
      w.buffT[u.buff] = Math.max(w.buffT[u.buff], u.seconds * w.char.db.mult('buffDuration'));
  }
}
