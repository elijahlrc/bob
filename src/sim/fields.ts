import type { SkillProfile } from '../calc/skill';
import { spellBaseDamage } from '../data/constants';
import type { ChargeKind } from '../calc/charges';
import { segmentDist } from './actions';
import { tickBladestorm } from './stances';
import { corpseNear, takeCorpse } from './factions';
import { applySkillDot } from './skillDots';
import { applyStatus } from './statuses';
import { gainCharge } from './charges';
import { hit, lifeCap, rawHit } from './combat';
import { creepToward } from './skillFx';
import { scaleProfile } from './shots';
import type { Action, Actor, World } from './types';

/**
 * Lasting ground the player's skills leave, and the things that stand in the world and do their work from there
 * (docs/SPIRIT.md S6): consecrated ground (life back for the character in it, a better chance to crit what stands on it), chilling
 * ground that burns with cold and gives a Frenzy charge to a kill inside it, a frost crystal that exposes what is near and then
 * bursts, a storm of bolts that follows the character, a wall of ice that blocks the way.
 */

export type FieldKind =
  | 'consecrated'
  | 'chilling'
  | 'caustic'
  | 'pod'
  | 'crystal'
  | 'storm'
  | 'wall'
  | 'orb'
  | 'zap'
  | 'trail'
  | 'ghost'
  | 'bladestorm'
  | 'geyser'
  | 'smoke';

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
  /** An orb: the skill it belongs to, the stages built, and how fast they fade once the channel has ended. A zap: the place it jumps about. */
  skill?: string;
  /** A trail: the far end of the segment it lies along. A ghost: how far it has run. */
  x2?: number;
  y2?: number;
  moved?: number;
  /** Chilling ground that creeps toward the nearest enemy: tiles a second. */
  creep?: number;
  /** A bladestorm: the way it drifts, and the stance it was made in. */
  vx?: number;
  vy?: number;
  stance?: 'blood' | 'sand';
  stages?: number;
  decay?: number;
  tx?: number;
  ty?: number;
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
  // Ground that creeps is left where the projectile bursts, not at the aim.
  if (!spec || !a.isPlayer || spec.creep !== undefined) return;
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
    t: spec.seconds * p.skillDuration,
    total: spec.seconds * p.skillDuration,
    profile: p,
    hand: act.hand,
    pulseT: 0,
    interval: spec.kind === 'caustic' ? 0.25 : 0.5,
    dps: spec.dps ?? 0,
    killCharge: spec.killCharge,
    dtype: dominantType(p),
  });
  w.events.push({ t: 'explode', x, y, r, dtype: dominantType(p) });
}

/** Arrows fall around the target and each leaves a spore pod (Toxic Rain). */
export function placePods(w: World, a: Actor, act: Action): void {
  const p = act.profile;
  const spec = p.skill.pods!;
  const n = Math.max(1, p.projectiles);
  // More arrows spread the pods over a wider place rather than piling them up.
  const spread = spec.spread * Math.sqrt(n / 5) * p.radiusMult;
  for (let i = 0; i < n; i++) {
    const ang = w.rngTrig.float(0, Math.PI * 2);
    const d = spread * Math.sqrt(w.rngTrig.float(0, 1));
    const spot = w.grid.collide(act.aimX + Math.cos(ang) * d, act.aimY + Math.sin(ang) * d, 0.3);
    const r = spec.radius * p.radiusMult;
    w.fields.push({
      id: w.nextId++,
      owner: a.id,
      kind: 'pod',
      x: spot.x,
      y: spot.y,
      r0: r,
      grow: 1,
      radius: r,
      t: spec.seconds * p.skillDuration,
      total: spec.seconds * p.skillDuration,
      profile: p,
      hand: act.hand,
      pulseT: 0,
      interval: 0.25,
      dps: 0,
      dtype: dominantType(p),
    });
  }
  w.events.push({ t: 'explode', x: act.aimX, y: act.aimY, r: spread, dtype: dominantType(p) });
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
    t: spec.seconds * p.skillDuration,
    total: spec.seconds * p.skillDuration,
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

/** An orb skill is used while channelling: a frost orb is made or fed, a storm orb is made at a spot near the target place. */
export function orbUse(w: World, a: Actor, act: Action, stage: number): void {
  const p = act.profile;
  const spec = p.skill.orb;
  if (!spec || !a.isPlayer) return;
  const dur = w.char.db.mult('skillDuration');
  if (spec.kind === 'frost') {
    const total = spec.seconds * dur * (1 + (spec.secondsPerStage * stage) / 100);
    const have = w.fields.find((f) => f.kind === 'orb' && f.skill === p.skill.id);
    if (have) {
      have.stages = stage;
      have.t = have.total = total;
      have.profile = p;
      have.decay = undefined;
      return;
    }
    w.fields.push({
      id: w.nextId++,
      owner: a.id,
      kind: 'orb',
      x: a.x,
      y: a.y,
      r0: spec.radius * p.radiusMult,
      grow: 1,
      radius: spec.radius * p.radiusMult,
      t: total,
      total,
      profile: p,
      hand: act.hand,
      pulseT: 0.3,
      interval: spec.interval,
      dps: 0,
      dtype: dominantType(p),
      skill: p.skill.id,
      stages: stage,
    });
    return;
  }
  if (spec.kind === 'illusion') {
    let g = w.fields.find((f) => f.kind === 'ghost' && f.skill === p.skill.id);
    if (!g) {
      const r = spec.radius * p.radiusMult;
      g = {
        id: w.nextId++,
        owner: a.id,
        kind: 'ghost',
        x: a.x,
        y: a.y,
        tx: act.aimX,
        ty: act.aimY,
        r0: r,
        grow: 1,
        radius: r,
        t: 60,
        total: 60,
        profile: p,
        hand: act.hand,
        pulseT: 0,
        interval: 1,
        dps: 0,
        dtype: dominantType(p),
        skill: p.skill.id,
        moved: 0,
        stages: 0,
      };
      w.fields.push(g);
    }
    g.tx = act.aimX;
    g.ty = act.aimY;
    g.profile = p;
    g.stages = stage;
    // A wave of damage for each so many stages, harder once the illusion has stopped.
    if (stage % spec.waveStages === 0) {
      const still =
        (g.moved ?? 0) >= spec.distance || Math.hypot((g.tx ?? 0) - g.x, (g.ty ?? 0) - g.y) < 0.3;
      const k = (spec.finalPerStage * stage) / 100;
      const q = scaleProfile(p, still ? k * (1 + spec.stillMore / 100) : k);
      blast(w, { ...g, profile: q }, g.x, g.y, g.radius);
    }
    return;
  }
  const ang = w.rngTrig.float(0, Math.PI * 2);
  const d = spec.spread * Math.sqrt(w.rngTrig.float(0, 1));
  const spot = w.grid.collide(act.aimX + Math.cos(ang) * d, act.aimY + Math.sin(ang) * d, 0.3);
  const total = spec.seconds * dur;
  w.fields.push({
    id: w.nextId++,
    owner: a.id,
    kind: 'zap',
    x: spot.x,
    y: spot.y,
    tx: act.aimX,
    ty: act.aimY,
    r0: spec.radius * p.radiusMult,
    grow: 1,
    radius: spec.radius * p.radiusMult,
    t: total,
    total,
    profile: p,
    hand: act.hand,
    pulseT: spec.jump,
    interval: spec.jump,
    dps: 0,
    dtype: dominantType(p),
    skill: p.skill.id,
  });
}

/** The channel of a storm-orb skill ends: every orb that is left explodes, harder for each jump it still had. */
export function releaseZaps(w: World, skill: string): void {
  const p = w.player;
  let j = 0;
  for (const f of w.fields) {
    if (f.kind !== 'zap' || f.skill !== skill || !f.profile) {
      w.fields[j++] = f;
      continue;
    }
    const spec = f.profile.skill.orb;
    if (spec?.kind !== 'zap') continue;
    const left = Math.max(0, Math.floor(f.t / spec.jump + 1e-6));
    const q = scaleProfile(f.profile, 1 + (spec.releaseMore * left) / 100);
    const r = spec.releaseRadius * f.profile.radiusMult;
    w.events.push({ t: 'explode', x: f.x, y: f.y, r, dtype: f.dtype });
    for (const e of enemiesIn(w, f.x, f.y, r))
      hit(w, p, e, q, f.hand, Math.hypot(e.x - p.x, e.y - p.y));
  }
  w.fields.length = j;
}

/**
 * The channel of an illusion skill ends. Let go, the character joins the illusion and a last wave breaks there, harder for each
 * stage built; stunned or frozen, the illusion is just gone.
 */
export function releaseGhost(w: World, skill: string, interrupted: boolean): void {
  const i = w.fields.findIndex((f) => f.kind === 'ghost' && f.skill === skill);
  if (i < 0) return;
  const g = w.fields[i];
  w.fields.splice(i, 1);
  const spec = g.profile?.skill.orb;
  if (interrupted || spec?.kind !== 'illusion' || !g.profile) return;
  const a = w.player;
  const spot = w.grid.collide(g.x, g.y, a.r);
  w.events.push({ t: 'blink', id: a.id, x: a.x, y: a.y, end: false });
  a.x = spot.x;
  a.y = spot.y;
  w.events.push({ t: 'blink', id: a.id, x: a.x, y: a.y, end: true });
  const f = (spec.finalPerStage * (g.stages ?? 0)) / 100;
  blast(w, { ...g, profile: scaleProfile(g.profile, f) }, a.x, a.y, g.radius * 1.3);
}

/**
 * Pyre Burst: the corpse nearest the target bursts for a share of its life as fire, and becomes a geyser that sends projectiles
 * down about it for a while. Three at most; the oldest gives way. With no corpse nothing happens.
 */
export function placeGeyser(w: World, a: Actor, act: Action): void {
  const p = act.profile;
  const spec = p.skill.geyser;
  if (!spec || !a.isPlayer) return;
  const corpse = corpseNear(w, act.aimX, act.aimY, 6);
  if (!corpse) return;
  takeCorpse(w, corpse);
  const r = spec.explodeRadius * p.radiusMult;
  w.events.push({ t: 'explode', x: corpse.x, y: corpse.y, r, dtype: 3 });
  for (const e of enemiesIn(w, corpse.x, corpse.y, r))
    rawHit(w, e, (corpse.life * spec.explodePct) / 100, 3, 'Corpse');
  const mine = w.fields.filter((f) => f.kind === 'geyser');
  if (mine.length >= spec.max) {
    const oldest = mine.reduce((x, y) => (x.t < y.t ? x : y));
    w.fields.splice(w.fields.indexOf(oldest), 1);
  }
  const reach = spec.radius * p.radiusMult;
  w.fields.push({
    id: w.nextId++,
    owner: a.id,
    kind: 'geyser',
    x: corpse.x,
    y: corpse.y,
    r0: reach,
    grow: 1,
    radius: reach,
    t: spec.seconds * p.skillDuration,
    total: spec.seconds,
    profile: p,
    hand: act.hand,
    pulseT: spec.interval,
    interval: spec.interval,
    dps: 0,
    dtype: dominantType(p),
  });
}

/** Blasts at a spot: the enemies in its radius are hit. */
function blast(w: World, f: Field, x: number, y: number, r: number): void {
  const p = w.player;
  w.events.push({ t: 'explode', x, y, r, dtype: f.dtype });
  for (const e of enemiesIn(w, x, y, r))
    hit(w, p, e, f.profile!, f.hand, Math.hypot(e.x - p.x, e.y - p.y));
}

/** One run of a frost orb: a volley of explosions on the ground near the character, where the enemies are. */
function volley(w: World, f: Field): void {
  const spec = f.profile!.skill.orb;
  if (spec?.kind !== 'frost') return;
  const p = w.player;
  const near = enemiesIn(w, p.x, p.y, spec.range);
  for (let i = 0; i < spec.count; i++) {
    let x: number;
    let y: number;
    if (near.length) {
      const e = near[w.rngTrig.int(0, near.length - 1)];
      x = e.x + w.rngTrig.float(-0.6, 0.6);
      y = e.y + w.rngTrig.float(-0.6, 0.6);
    } else {
      const ang = w.rngTrig.float(0, Math.PI * 2);
      const d = spec.range * Math.sqrt(w.rngTrig.float(0, 1)) * 0.6;
      x = p.x + Math.cos(ang) * d;
      y = p.y + Math.sin(ang) * d;
    }
    blast(w, f, x, y, f.radius);
  }
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
    if (f.creep) creepToward(w, f, dt);
    if (f.kind === 'orb') {
      f.x = p.x;
      f.y = p.y;
      // Stages hold while the channel goes on and then fade over what is left of the orb's time.
      const live = w.channel?.key === f.skill;
      if (live) f.stages = w.channel!.stage;
      else {
        f.decay ??= (f.stages ?? 0) / Math.max(0.5, f.t);
        f.stages = Math.max(0, (f.stages ?? 0) - f.decay * dt);
      }
      const spec = f.profile!.skill.orb;
      if (spec?.kind === 'frost') {
        // Cast speed quickens the volleys too.
        const cast = (f.profile!.skill.castTime ?? 0.5) / Math.max(0.05, f.profile!.useTime);
        const rate =
          (1 + (spec.speedPerStage * (f.stages ?? 0)) / 100) *
          (live ? 1 + spec.channelMore / 100 : 1) *
          cast;
        f.pulseT -= dt * rate;
        if (f.pulseT <= 0) {
          f.pulseT += spec.interval;
          volley(w, f);
        }
      }
      if (f.t > 0) w.fields[j++] = f;
      continue;
    }
    if (f.kind === 'ghost') {
      const spec = f.profile!.skill.orb;
      if (spec?.kind !== 'illusion' || w.channel?.key !== f.skill) continue;
      // It runs ahead toward the target place, faster than the character, and stops where it has run far enough.
      const dx = (f.tx ?? f.x) - f.x;
      const dy = (f.ty ?? f.y) - f.y;
      const d = Math.hypot(dx, dy);
      const step = Math.min(
        d,
        p.def.moveSpeed * spec.speed * dt,
        Math.max(0, spec.distance - (f.moved ?? 0)),
      );
      if (step > 1e-6) {
        const spot = w.grid.collide(f.x + (dx / d) * step, f.y + (dy / d) * step, 0.3);
        f.moved = (f.moved ?? 0) + Math.hypot(spot.x - f.x, spot.y - f.y);
        f.x = spot.x;
        f.y = spot.y;
      }
      w.fields[j++] = f;
      continue;
    }
    if (f.kind === 'geyser') {
      // One projectile after another comes down somewhere about the geyser, and bursts.
      const spec = f.profile!.skill.geyser!;
      f.pulseT -= dt;
      while (f.pulseT <= 0) {
        f.pulseT += f.interval;
        const ang = w.rngTrig.float(0, Math.PI * 2);
        const d = f.radius * Math.sqrt(w.rngTrig.float(0, 1));
        blast(
          w,
          f,
          f.x + Math.cos(ang) * d,
          f.y + Math.sin(ang) * d,
          spec.blast * f.profile!.radiusMult,
        );
      }
      if (f.t > 0) w.fields[j++] = f;
      continue;
    }
    if (f.kind === 'bladestorm') {
      tickBladestorm(w, f, dt);
      if (f.t > 0) w.fields[j++] = f;
      continue;
    }
    if (f.kind === 'trail') {
      f.pulseT -= dt;
      if (f.pulseT <= 0 && f.t > 0) {
        f.pulseT += f.interval;
        for (const e of w.actors)
          if (
            !e.isPlayer &&
            e.alive &&
            e.phaseT <= 0 &&
            segmentDist(e.x, e.y, f.x, f.y, f.x2!, f.y2!) <= f.radius + e.r
          )
            applySkillDot(w, e, f.profile!, { seconds: 0.5 });
      }
      if (f.t > 0) w.fields[j++] = f;
      continue;
    }
    if (f.kind === 'zap') {
      f.pulseT -= dt;
      if (f.pulseT <= 0 && f.t > 0) {
        f.pulseT += f.interval;
        const spec = f.profile!.skill.orb;
        if (spec?.kind === 'zap') {
          // It jumps to a new spot near the target place and blasts there.
          const ang = w.rngTrig.float(0, Math.PI * 2);
          const d = spec.spread * Math.sqrt(w.rngTrig.float(0, 1));
          const spot = w.grid.collide(f.tx! + Math.cos(ang) * d, f.ty! + Math.sin(ang) * d, 0.3);
          f.x = spot.x;
          f.y = spot.y;
          blast(w, f, f.x, f.y, f.radius);
        }
      }
      if (f.t > 0) w.fields[j++] = f;
      continue;
    }
    f.pulseT -= dt;
    const pulse = f.pulseT <= 0;
    if (pulse) f.pulseT += f.interval;
    if (f.kind === 'consecrated') {
      if (p.alive && Math.hypot(p.x - f.x, p.y - f.y) <= f.radius + p.r)
        p.life = Math.min(lifeCap(w, p), p.life + p.def.maxLife * REGEN_CONSECRATED * dt);
    } else if (f.kind === 'pod' && f.profile) {
      const spec = f.profile.skill.pods!;
      if (pulse)
        for (const e of enemiesIn(w, f.x, f.y, f.radius)) {
          applySkillDot(w, e, f.profile, { seconds: 0.5 });
          // Each pod that reaches it slows it a little, up to a limit.
          const reached = w.fields.filter(
            (o) => o.kind === 'pod' && Math.hypot(e.x - o.x, e.y - o.y) <= o.radius + e.r,
          ).length;
          applyStatus(w, e, 'hinder', {
            seconds: 0.5,
            v: Math.min(spec.slowMax, spec.slow * reached),
          });
        }
      if (f.t <= 0) {
        const r = spec.burstRadius * f.profile.radiusMult;
        w.events.push({ t: 'explode', x: f.x, y: f.y, r, dtype: f.dtype });
        for (const e of enemiesIn(w, f.x, f.y, r))
          hit(w, p, e, f.profile, f.hand, Math.hypot(e.x - p.x, e.y - p.y));
      }
    } else if (f.kind === 'caustic' && pulse && f.profile) {
      // Caustic ground renews the debuff of whoever stands in it, in short spans: patches do not add up.
      for (const e of enemiesIn(w, f.x, f.y, f.radius))
        applySkillDot(w, e, f.profile, { seconds: 0.5 });
    } else if (f.kind === 'chilling' && pulse && f.profile && f.dps <= 0) {
      // Chilled ground that deals no damage (Frostblink) only chills what stands on it.
      for (const e of enemiesIn(w, f.x, f.y, f.radius)) {
        if (e.def.cannotBeChilled) continue;
        e.ail.chill = Math.max(e.ail.chill, f.profile.chill.effect);
        e.ail.chillT = Math.max(e.ail.chillT, f.interval * 2);
      }
    } else if (f.kind === 'chilling' && pulse && f.profile) {
      const q = scaleProfile(f.profile, f.dps * f.interval);
      for (const e of enemiesIn(w, f.x, f.y, f.radius))
        hit(w, p, e, q, f.hand, Math.hypot(e.x - p.x, e.y - p.y));
    } else if (f.kind === 'smoke' && pulse) {
      // Smoke blinds what stands in it.
      for (const e of enemiesIn(w, f.x, f.y, f.radius))
        applyStatus(w, e, 'blind', { seconds: f.interval * 2, v: f.dps });
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
    t: spec.seconds * p.skillDuration,
    total: spec.seconds * p.skillDuration,
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
