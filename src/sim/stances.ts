import { levelValue } from '../calc/gems';
import { applyDamage, hit } from './combat';
import { scaleProfile } from './shots';
import { applyStatus } from './statuses';
import type { Action, Actor, World } from './types';
import { eachEnemy, enemiesWithin, livingEnemiesOf } from './side';
import type { Side } from './side';

/**
 * Stances, rage-fed buffs and the storms of a stance (docs/SPIRIT.md S9).
 *
 * A stance gem (Dune Stance, Stone Stance) holds two sets of effects and the character is in one of them at a time; the
 * stance is shared by every stance gem and by the skills that read it (Whirlwind Cleave). The character swaps by the policy of
 * docs/SPIRIT.md section 5: the stance for a crowd when three or more enemies are near, the other otherwise, at most every two
 * seconds. Rampage Call needs rage, drains it faster each second and ends when it is gone; Surge of Blood costs life every second, is
 * renewed by a kill, and the character lets it go when life runs low.
 */

export type Stance = 'blood' | 'sand';

const SWAP_EVERY = 2;
const AURA_EVERY = 0.5;
const PACK_RADIUS = 7;
const PACK_SIZE = 3;
/** Surge of Blood is let go below this share of life. */
const BLOOD_RAGE_FLOOR = 0.25;

export function stanceOf(s: Side): Stance {
  return s.buffT.sandStance > 0 ? 'sand' : 'blood';
}

export function setStance(w: World, side: Side, s: Stance): void {
  side.buffT.bloodStance = s === 'blood' ? 1e9 : 0;
  side.buffT.sandStance = s === 'sand' ? 1e9 : 0;
  w.events.push({ t: 'buff', id: s === 'blood' ? 'bloodStance' : 'sandStance' });
}

const stanceAuras = (s: Side) => s.char.auras.filter((a) => a.active && a.def.stance);

/** Percent less damage the character takes from attacks by enemies that are not near, in the stance it is in (Stone Stance). */
export function stanceFarLess(sd: Side): { less: number; radius: number } | null {
  const s = stanceOf(sd);
  for (const a of stanceAuras(sd)) {
    const side = a.def.stance![s];
    if (side.farLess)
      return { less: levelValue(side.farLess, a.gem.level) / 100, radius: a.def.stance!.radius };
  }
  return null;
}

/** The stance swaps by policy, and the stance's effects on the enemies near the character are renewed. */
export function tickStance(w: World, sd: Side): void {
  const auras = stanceAuras(sd);
  if (auras.length === 0) return;
  const p = sd.player;
  if ((sd.utilityReady['@stance'] ?? 0) <= w.t) {
    let near = 0;
    for (const e of livingEnemiesOf(w, sd.team))
      if (Math.hypot(e.x - p.x, e.y - p.y) <= PACK_RADIUS) near++;
    const want: Stance = near >= PACK_SIZE ? 'sand' : 'blood';
    if (want !== stanceOf(sd)) setStance(w, sd, want);
    sd.utilityReady['@stance'] = w.t + SWAP_EVERY;
  }
  if (Math.floor(w.t / AURA_EVERY) === Math.floor((w.t - 1 / 60) / AURA_EVERY)) return;
  const s = stanceOf(sd);
  for (const a of auras) {
    const side = a.def.stance![s];
    if (!side.enemies) continue;
    const e0 = side.enemies;
    const v = levelValue(e0.v, a.gem.level);
    const x = e0.x === undefined ? 0 : levelValue(e0.x, a.gem.level);
    for (const e of enemiesWithin(w, sd.team, p.x, p.y, a.def.stance!.radius, true))
      applyStatus(w, e, e0.id, { seconds: e0.seconds, v, x });
  }
}

// ---- Whirlwind Cleave

type Blades = NonNullable<import('../calc/gems').SkillDef['stanceStorm']>;

/** A spin that makes a storm in the stance the character is in: a still one that quickens attacks, a drifting one that quickens feet. */
export function placeStanceStorm(w: World, a: Actor, act: Action): void {
  const p = act.profile;
  const spec = p.skill.stanceStorm as Blades | undefined;
  if (!spec || !a.isPlayer) return;
  const s = stanceOf(a.side!);
  const mine = a.side!.fields.filter((f) => f.kind === 'stanceStorm');
  if (mine.length >= spec.max) {
    const oldest = mine.reduce((x, y) => (x.t < y.t ? x : y));
    a.side!.fields.splice(a.side!.fields.indexOf(oldest), 1);
  }
  const r = spec.radius * p.radiusMult;
  const drift = s === 'sand' ? spec.drift : 0;
  a.side!.fields.push({
    id: w.nextId++,
    owner: a.id,
    kind: 'stanceStorm',
    x: a.x,
    y: a.y,
    vx: Math.cos(a.facing) * drift,
    vy: Math.sin(a.facing) * drift,
    r0: r,
    grow: 1,
    radius: r,
    t: spec.seconds * p.skillDuration,
    total: spec.seconds * p.skillDuration,
    profile: scaleProfile(p, (1 + spec.more / 100) * (p.skill.spin?.hits ?? 1)),
    hand: act.hand,
    pulseT: spec.interval,
    interval: spec.interval,
    dps: 0,
    dtype: 0,
    stance: s,
  });
  w.events.push({ t: 'explode', x: a.x, y: a.y, r, dtype: 0, skill: p.skill.id });
}

export function tickStanceStorm(w: World, s: Side, f: import('./fields').Field, dt: number): void {
  const p = s.player;
  const spec = f.profile!.skill.stanceStorm as Blades;
  if (f.vx || f.vy) {
    const spot = w.grid.collide(f.x + f.vx! * dt, f.y + f.vy! * dt, 0.3);
    f.x = spot.x;
    f.y = spot.y;
  }
  // The character in the storm gains what the stance it was made in gives.
  if (p.alive && Math.hypot(p.x - f.x, p.y - f.y) <= f.radius + p.r) {
    const id = f.stance === 'sand' ? spec.sand : spec.blood;
    s.buffT[id] = Math.max(s.buffT[id], 0.3);
  }
  f.pulseT -= dt;
  if (f.pulseT > 0) return;
  f.pulseT += f.interval;
  eachEnemy(w, s.team, (e) => {
    if (e.phaseT <= 0 && Math.hypot(e.x - f.x, e.y - f.y) <= f.radius + e.r)
      hit(w, p, e, f.profile!, f.hand, Math.hypot(e.x - p.x, e.y - p.y));
  });
}

// ---- Rampage Call, Surge of Blood

/** The rage a Rampage Call spends, faster each second, and the end when none is left. */
export function tickBerserk(w: World, s: Side, dt: number): void {
  for (const c of s.char.utilities) {
    const u = c.skill.utility;
    if (u?.kind !== 'buff' || !u.rage || s.buffT[u.buff] <= 0) continue;
    s.berserkT += dt;
    s.rageT = 0;
    s.rage -= u.rage.drain * Math.pow(1 + u.rage.accel / 100, s.berserkT) * dt;
    if (s.rage > 0) continue;
    s.rage = 0;
    s.berserkT = 0;
    s.buffT[u.buff] = 0;
    // The skill's own cooldown starts when it ends.
    s.utilityReady[c.key] = w.t + (u.cooldown ?? 0);
  }
}

/** Surge of Blood: the life and energy shield it costs each second, and the character lets it go when life runs low. */
export function tickDegen(w: World, s: Side, dt: number): void {
  const p = s.player;
  for (const c of s.char.utilities) {
    const u = c.skill.utility;
    if (u?.kind !== 'buff' || !u.degen || s.buffT[u.buff] <= 0) continue;
    if (p.life < p.def.maxLife * BLOOD_RAGE_FLOOR) {
      s.buffT[u.buff] = 0;
      continue;
    }
    // Physical damage over time: physical damage reduction answers to it, armour does not.
    // (What a character takes is scaled in a duel, docs/DUEL.md 4.4: this is damage it does itself, and so is the energy shield.)
    const k = s.damageScale;
    const share = (u.degen / 100) * dt * (1 - p.def.physReduction) * k;
    applyDamage(w, p, [share * p.def.maxLife, 0, 0, 0, 0], { name: c.skill.name, kind: 'effect' });
    p.es = Math.max(0, p.es - (u.degen / 100) * p.def.maxEs * dt * k);
  }
}

/** A kill renews the buffs that a kill renews (Surge of Blood). */
export function refreshOnKill(s: Side): void {
  for (const c of s.char.utilities) {
    const u = c.skill.utility;
    if (u?.kind === 'buff' && u.refreshOnKill && s.buffT[u.buff] > 0)
      s.buffT[u.buff] = Math.max(s.buffT[u.buff], u.seconds * s.char.db.mult('buffDuration'));
  }
}
