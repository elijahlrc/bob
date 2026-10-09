import type { SkillChoice } from '../calc/character';
import type { SkillProfile } from '../calc/skill';
import type { BuffId } from '../data/buffs';
import { levelValue } from '../calc/gems';
import { launch, scaleProfile } from './shots';
import { cloneOfPlayer, makeMinion, summonAt } from './minions';
import { enemiesOf } from './actions';
import { hit, playerConds, rawHit } from './combat';
import { corpseBlast } from './triggers';
import { MINIONS, MINION_ENEMY_RES } from '../data/minions';
import { spellBaseDamage } from '../data/constants';
import { applySkillDot } from './skillDots';
import type { Field } from './fields';
import type { Action, Actor, Projectile, World } from './types';

/**
 * What single skills do beyond the common machinery (docs/SPIRIT.md S13): a line wave that sets off shockwaves, and the like.
 * The data of each lies in the gem (`SkillFx` in src/data/gems.ts).
 */

/** The type index a skill is mostly made of, for the picture of it. */
function mainType(act: Action): number {
  let best = -1;
  let type = 0;
  for (const c of act.profile.hands[0].chunks)
    if (c.max > best) {
      best = c.max;
      type = c.type;
    }
  return type;
}

/**
 * A wave along the ground from the caster toward the target hits everything on its way; then a shockwave goes out, about each
 * enemy the wave struck (Sunder) or about the target (Purifying Flame), at a share of the damage. An enemy is hit at most once
 * by the shockwaves of a use, and not by them if the wave hit it.
 */
export function lineWave(w: World, a: Actor, act: Action): void {
  const p = act.profile;
  const spec = p.skill.wave!;
  const ang = Math.atan2(act.aimY - a.y, act.aimX - a.x);
  const cos = Math.cos(ang);
  const sin = Math.sin(ang);
  const len = spec.length * p.radiusMult;
  const wide = spec.width * p.radiusMult;
  const dtype = mainType(act);
  w.events.push({ t: 'beam', x: a.x, y: a.y, x2: a.x + cos * len, y2: a.y + sin * len, dtype });
  const struck = new Set<number>();
  const landed: Actor[] = [];
  for (const e of enemiesOf(w, a)) {
    if (e.phaseT > 0) continue;
    const dx = e.x - a.x;
    const dy = e.y - a.y;
    const along = dx * cos + dy * sin;
    const side = Math.abs(-dx * sin + dy * cos);
    if (along < -e.r || along > len + e.r || side > wide / 2 + e.r) continue;
    w.lastOutcome = null;
    hit(w, a, e, p, act.hand, Math.hypot(dx, dy));
    struck.add(e.id);
    if (w.lastOutcome === 'hit') landed.push(e);
  }
  if (spec.burst) {
    const r = spec.burst * p.radiusMult;
    w.events.push({ t: 'explode', x: act.aimX, y: act.aimY, r, dtype });
    for (const e of enemiesOf(w, a))
      if (!struck.has(e.id) && Math.hypot(e.x - act.aimX, e.y - act.aimY) <= r + e.r) {
        struck.add(e.id);
        hit(w, a, e, p, act.hand, Math.hypot(e.x - a.x, e.y - a.y));
      }
  }
  const q = scaleProfile(p, spec.shockMult / 100);
  const centres = spec.shockAt === 'target' ? [{ x: act.aimX, y: act.aimY }] : landed;
  const r = spec.shockRadius * p.radiusMult;
  for (const c of centres) {
    w.events.push({ t: 'explode', x: c.x, y: c.y, r, dtype });
    for (const e of enemiesOf(w, a))
      if (!struck.has(e.id) && Math.hypot(e.x - c.x, e.y - c.y) <= r + e.r) {
        struck.add(e.id);
        hit(w, a, e, q, act.hand, Math.hypot(e.x - a.x, e.y - a.y));
      }
  }
}

// ---- Soulrend: a projectile that turns toward enemies and puts a debuff on all about it

/** A projectile of a homing or debuff-carrying skill, once a step: it turns toward the nearest enemy ahead, and afflicts those about it. */
export function projectileFx(w: World, pr: Projectile, dt: number): void {
  const sk = pr.profile.skill;
  if (sk.homing) {
    const heading = Math.atan2(pr.vy, pr.vx);
    let best: Actor | null = null;
    let bd = sk.homing.radius;
    for (const e of w.actors) {
      if (e.isPlayer || !e.alive || e.phaseT > 0 || pr.hitIds.includes(e.id)) continue;
      const d = Math.hypot(e.x - pr.x, e.y - pr.y);
      if (d >= bd) continue;
      // Only what lies ahead of it, within a quarter turn either side.
      let diff = Math.atan2(e.y - pr.y, e.x - pr.x) - heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) > Math.PI / 2) continue;
      bd = d;
      best = e;
    }
    if (best) {
      let diff = Math.atan2(best.y - pr.y, best.x - pr.x) - heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const turn = Math.max(-sk.homing.turn * dt, Math.min(sk.homing.turn * dt, diff));
      const speed = Math.hypot(pr.vx, pr.vy);
      pr.vx = Math.cos(heading + turn) * speed;
      pr.vy = Math.sin(heading + turn) * speed;
    }
  }
  // A drifting orb hurts what is about it every so often.
  if (sk.pulse) {
    pr.pulseT = (pr.pulseT ?? 0) - dt;
    if (pr.pulseT <= 0) {
      pr.pulseT += sk.pulse.interval;
      const r = sk.pulse.radius * pr.profile.radiusMult;
      w.events.push({ t: 'explode', x: pr.x, y: pr.y, r, dtype: 1 });
      for (const e of w.actors)
        if (
          !e.isPlayer &&
          e.alive &&
          e.phaseT <= 0 &&
          Math.hypot(e.x - pr.x, e.y - pr.y) <= r + e.r
        )
          hit(w, w.player, e, pr.profile, pr.hand, Math.hypot(e.x - w.player.x, e.y - w.player.y));
    }
  }
  // A wanderer turns this way and that.
  if (sk.wander) {
    const heading = Math.atan2(pr.vy, pr.vx) + w.rngCombat.float(-1, 1) * sk.wander.turn * dt;
    const speed = Math.hypot(pr.vx, pr.vy);
    pr.vx = Math.cos(heading) * speed;
    pr.vy = Math.sin(heading) * speed;
  }
  const carried = pr.profile.skillDot?.spec.carried;
  if (carried)
    for (const e of w.actors)
      if (
        !e.isPlayer &&
        e.alive &&
        Math.hypot(e.x - pr.x, e.y - pr.y) <= carried * pr.profile.radiusMult + e.r
      )
        applySkillDot(w, e, pr.profile);
}

// ---- Static Strike: a buff that stacks with hits, and beams while it lasts

/** A hit of the skill gives a stack of the buff: up to the most, each with its own time; at the most, the oldest is renewed. */
export function gainBeamStack(w: World, p: SkillProfile): void {
  const spec = p.skill.beams;
  if (!spec) return;
  let st = w.staticFx;
  if (!st || st.key !== p.skill.id) st = w.staticFx = { key: p.skill.id, stacks: [], acc: 0 };
  if (st.stacks.length < spec.max) st.stacks.push(spec.seconds);
  else {
    let k = 0;
    for (let i = 1; i < st.stacks.length; i++) if (st.stacks[i] < st.stacks[k]) k = i;
    st.stacks[k] = spec.seconds;
  }
}

/** While the buff lasts, beams of lightning strike the enemies near the character, faster for each stack. */
function tickBeams(w: World, dt: number): void {
  const st = w.staticFx;
  if (!st) return;
  let j = 0;
  for (const t of st.stacks) if (t - dt > 0) st.stacks[j++] = t - dt;
  st.stacks.length = j;
  if (j === 0) {
    w.staticFx = null;
    return;
  }
  const c = w.char.actives.find((x) => x.skill.id === st.key);
  if (!c || !c.usable || !w.player.alive) return;
  const base = w.char.profile(c, 0);
  const spec = base.skill.beams!;
  const interval = spec.interval / (1 + (spec.perStack / 100) * j);
  st.acc += dt;
  while (st.acc >= interval) {
    st.acc -= interval;
    pulseBeams(w, c, spec);
  }
}

type BeamSpec = NonNullable<SkillProfile['skill']['beams']>;

function pulseBeams(w: World, c: SkillChoice, spec: BeamSpec): void {
  const p = w.player;
  const level = c.skill.level;
  const near = w.actors
    .filter((e) => !e.isPlayer && e.alive && e.phaseT <= 0)
    .map((e) => ({ e, d: Math.hypot(e.x - p.x, e.y - p.y) }))
    .sort((a, b) => a.d - b.d);
  if (near.length === 0) return;
  const prof = w.char.profile(c, playerConds(w, near[0].e));
  const reach = spec.radius * prof.radiusMult;
  const less = levelValue(p.moving ? spec.lessMoving : spec.lessStill, level);
  const q = scaleProfile(prof, 1 - less / 100);
  const count = Math.round(levelValue(spec.count, level));
  const picked = near.filter((n) => n.d <= reach + n.e.r).slice(0, count);
  w.inFx = true;
  const done = new Set(picked.map((n) => n.e.id));
  for (const n of picked) {
    w.events.push({ t: 'chain', from: p.id, to: n.e.id, dtype: 1 });
    hit(w, p, n.e, q, 0, n.d);
    // The beam leaps once more, to the nearest enemy it has not struck.
    let best: Actor | null = null;
    let bd = 3.5;
    for (const o of near) {
      if (done.has(o.e.id)) continue;
      const d = Math.hypot(o.e.x - n.e.x, o.e.y - n.e.y);
      if (d < bd) {
        bd = d;
        best = o.e;
      }
    }
    if (best) {
      done.add(best.id);
      w.events.push({ t: 'chain', from: n.e.id, to: best.id, dtype: 1 });
      hit(w, p, best, q, 0, Math.hypot(best.x - p.x, best.y - p.y));
    }
  }
  w.inFx = false;
}

// ---- Infernal Blow: a debuff that charges with hits and bursts

/** A hit of the skill puts a charge on the enemy (renewing the time); the most charges set it off at once. */
export function chargeEnemy(w: World, dst: Actor, p: SkillProfile): void {
  const spec = p.skill.charge;
  if (!spec || !dst.alive) return;
  const st = (w.charged[dst.id] ??= { n: 0, t: 0, key: p.skill.id });
  st.n = Math.min(spec.max, st.n + 1);
  st.t = spec.seconds * p.skillDuration;
  if (st.n >= spec.max) detonate(w, dst);
}

/** The charged debuff goes off: an area about the enemy, hard for each charge it had. */
function detonate(w: World, e: Actor): void {
  const st = w.charged[e.id];
  if (!st) return;
  delete w.charged[e.id];
  const c = w.char.actives.find((x) => x.skill.id === st.key);
  if (!c || !c.usable) return;
  const prof = w.char.profile(c, 0);
  const spec = prof.skill.charge!;
  const q = scaleProfile(prof, (st.n * spec.perCharge) / 100);
  const r = spec.radius * prof.radiusMult;
  w.events.push({ t: 'explode', x: e.x, y: e.y, r, dtype: mainTypeOf(prof) });
  w.inFx = true;
  if (e.alive) hit(w, w.player, e, q, 0, Math.hypot(e.x - w.player.x, e.y - w.player.y));
  for (const o of w.actors)
    if (!o.isPlayer && o.alive && o !== e && Math.hypot(o.x - e.x, o.y - e.y) <= r + o.r)
      hit(w, w.player, o, q, 0, Math.hypot(o.x - w.player.x, o.y - w.player.y));
  w.inFx = false;
}

function mainTypeOf(p: SkillProfile): number {
  let best = -1;
  let type = 0;
  for (const c of p.hands[0].chunks)
    if (c.max > best) {
      best = c.max;
      type = c.type;
    }
  return type;
}

/** An enemy with the debuff dies: it goes off, and the body bursts for a share of its life as fire. */
export function chargedDeath(w: World, dead: Actor): void {
  const st = w.charged[dead.id];
  if (!st) return;
  const c = w.char.actives.find((x) => x.skill.id === st.key);
  const spec = c?.usable ? w.char.profile(c, 0).skill.charge : undefined;
  detonate(w, dead);
  if (spec) corpseBlast(w, dead, spec.deathPct, 'fire', spec.radius);
}

function tickCharged(w: World, dt: number): void {
  for (const key in w.charged) {
    const id = Number(key);
    const st = w.charged[id];
    st.t -= dt;
    if (st.t > 0) continue;
    const e = w.actors.find((x) => x.id === id);
    if (e && e.alive) detonate(w, e);
    else delete w.charged[id];
  }
}

/** Every step: the buffs and debuffs the single skills keep. */
export function tickSkillFx(w: World, dt: number): void {
  if (w.relicRegen.t > 0) tickRelicRegen(w, dt);
  if (w.shell) tickShell(w);
  if (w.staticFx) tickBeams(w, dt);
  if (w.char.frostSpec) tickFrostTrail(w, dt);
  if (w.virulence > 0) tickAgony(w, dt);
  tickSiphon(w, dt);
  if (w.minions.length > 0) tickBots(w, dt);
  if (w.vortex) tickVortex(w, dt);
  if (w.markers.length > 0) tickMarkers(w, dt);
  if (w.stormOrb) tickOrb(w, dt);
  if (w.fuses.length > 0) tickFuses(w, dt);
  if (w.spores.length > 0) tickSpores(w, dt);
  for (const _ in w.charged) {
    tickCharged(w, dt);
    break;
  }
}

// ---- Blade Vortex: blades that orbit the caster and hit everything about it together

/** A cast adds a blade (up to the most; at the most the oldest is replaced). */
export function addBlade(w: World, p: SkillProfile): void {
  const spec = p.skill.vortex;
  if (!spec) return;
  let v = w.vortex;
  if (!v || v.key !== p.skill.id) v = w.vortex = { key: p.skill.id, blades: [], acc: 0 };
  const t = spec.seconds * p.skillDuration;
  if (v.blades.length < spec.max) v.blades.push(t);
  else {
    let k = 0;
    for (let i = 1; i < v.blades.length; i++) if (v.blades[i] < v.blades[k]) k = i;
    v.blades[k] = t;
  }
}

function tickVortex(w: World, dt: number): void {
  const v = w.vortex;
  if (!v) return;
  let j = 0;
  for (const t of v.blades) if (t - dt > 0) v.blades[j++] = t - dt;
  v.blades.length = j;
  if (j === 0) {
    w.vortex = null;
    return;
  }
  const c = w.char.actives.find((x) => x.skill.id === v.key);
  if (!c || !c.usable || !w.player.alive) return;
  const spec = c.skill.vortex!;
  // Each blade makes the round come sooner.
  const interval = spec.spin / (1 + (spec.hitRate / 100) * j);
  v.acc += dt;
  while (v.acc >= interval) {
    v.acc -= interval;
    const p = w.player;
    let near: Actor | null = null;
    let bd = Infinity;
    for (const e of w.actors)
      if (!e.isPlayer && e.alive) {
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        if (d < bd) {
          bd = d;
          near = e;
        }
      }
    const base = w.char.profile(c, near ? playerConds(w, near) : 0);
    // Each blade: more damage and a better chance to crit, for the whole round.
    const q: SkillProfile = {
      ...base,
      hands: base.hands.map((h) => ({
        ...h,
        hitMult: h.hitMult * (1 + (spec.more / 100) * j),
        critChance: Math.min(1, h.critChance * (1 + (spec.crit / 100) * j)),
      })),
    };
    const r = spec.radius * base.radiusMult;
    w.events.push({ t: 'explode', x: p.x, y: p.y, r, dtype: mainTypeOf(base) });
    for (const e of w.actors)
      if (!e.isPlayer && e.alive && e.phaseT <= 0 && Math.hypot(e.x - p.x, e.y - p.y) <= r + e.r)
        hit(w, p, e, q, 0, Math.hypot(e.x - p.x, e.y - p.y));
  }
}

// ---- Storm Call: markers that all go off together

/** A cast sets a marker where it is aimed. */
export function placeMarker(w: World, act: Action): void {
  const p = act.profile;
  const spec = p.skill.markers!;
  w.markers.push({ x: act.aimX, y: act.aimY, t: spec.delay, profile: p, hand: act.hand });
  w.events.push({ t: 'explode', x: act.aimX, y: act.aimY, r: 0.35, dtype: 1 });
}

function tickMarkers(w: World, dt: number): void {
  let due = false;
  for (const m of w.markers) {
    m.t -= dt;
    if (m.t <= 0) due = true;
  }
  if (!due) return;
  // When one is struck, every marker is.
  const list = w.markers;
  w.markers = [];
  for (const m of list) {
    const r = m.profile.skill.markers!.radius * m.profile.radiusMult;
    w.events.push({ t: 'explode', x: m.x, y: m.y, r, dtype: mainTypeOf(m.profile) });
    for (const e of w.actors)
      if (!e.isPlayer && e.alive && e.phaseT <= 0 && Math.hypot(e.x - m.x, e.y - m.y) <= r + e.r)
        hit(w, w.player, e, m.profile, m.hand, Math.hypot(e.x - w.player.x, e.y - w.player.y));
  }
}

// ---- Orb of Storms: an orb that strikes with lightning that splits

/** A cast puts an orb next to the character, in place of the one before. */
export function placeOrb(w: World, a: Actor, act: Action): void {
  const p = act.profile;
  const spec = p.skill.stormOrb!;
  const ang = Math.atan2(act.aimY - a.y, act.aimX - a.x);
  const spot = w.grid.collide(a.x + Math.cos(ang) * 0.9, a.y + Math.sin(ang) * 0.9, 0.3);
  // The new orb takes up where the old one was in its count to the next bolt.
  w.stormOrb = {
    x: spot.x,
    y: spot.y,
    t: spec.seconds * p.skillDuration,
    acc: w.stormOrb?.acc ?? 0,
    profile: p,
    hand: act.hand,
  };
  w.events.push({ t: 'explode', x: spot.x, y: spot.y, r: 0.5, dtype: 1 });
}

/** A bolt from the orb, or from the character who cast a lightning skill inside it: the nearest enemy, and others it splits to. */
function orbBolt(
  w: World,
  fromX: number,
  fromY: number,
  orb: NonNullable<World['stormOrb']>,
): void {
  const p = orb.profile;
  const spec = p.skill.stormOrb!;
  const level = p.skill.level;
  const reach = spec.radius * p.radiusMult;
  const alive = w.actors.filter((e) => !e.isPlayer && e.alive && e.phaseT <= 0);
  const first = alive
    .map((e) => ({ e, d: Math.hypot(e.x - fromX, e.y - fromY) }))
    .filter((n) => n.d <= reach + n.e.r)
    .sort((a, b) => a.d - b.d)[0];
  if (!first) return;
  const splits = Math.round(levelValue(spec.split, level));
  const rest = alive
    .filter((e) => e !== first.e)
    .map((e) => ({ e, d: Math.hypot(e.x - first.e.x, e.y - first.e.y) }))
    .filter((n) => n.d <= spec.reach)
    .sort((a, b) => a.d - b.d)
    .slice(0, splits);
  for (const n of [first, ...rest]) {
    w.events.push({ t: 'chain', from: 0, to: n.e.id, dtype: 1 });
    hit(w, w.player, n.e, p, orb.hand, Math.hypot(n.e.x - w.player.x, n.e.y - w.player.y));
  }
}

function tickOrb(w: World, dt: number): void {
  const o = w.stormOrb;
  if (!o) return;
  o.t -= dt;
  if (o.t <= 0) {
    w.stormOrb = null;
    return;
  }
  const spec = o.profile.skill.stormOrb!;
  // Quicker casting makes it strike sooner.
  const interval =
    levelValue(spec.interval, o.profile.skill.level) *
    (o.profile.useTime / Math.max(0.05, o.profile.skill.castTime));
  o.acc += dt;
  while (o.acc >= interval) {
    o.acc -= interval;
    orbBolt(w, o.x, o.y, o);
  }
}

/** A lightning skill cast inside the orb makes it strike once more, from where the character stands. */
export function orbAnswers(w: World, p: SkillProfile): void {
  const o = w.stormOrb;
  if (!o || p.skill.id === o.profile.skill.id || !p.skill.tags.includes('lightning')) return;
  const r = o.profile.skill.stormOrb!.radius * o.profile.radiusMult;
  if (Math.hypot(w.player.x - o.x, w.player.y - o.y) > r) return;
  orbBolt(w, w.player.x, w.player.y, o);
}

// ---- Rolling Magma: the orb bounces on and bursts again

/** After the first burst, the orb bounces on the same way, bursting again a moment later, whether or not an enemy is there. */
export function bounceOrbs(w: World, a: Actor, act: Action): void {
  const p = act.profile;
  const spec = p.skill.bounces;
  if (!spec || !a.isPlayer) return;
  const b = p.skill.behaviour;
  const n = Math.round(levelValue(spec.chains, p.skill.level));
  const ang = Math.atan2(act.aimY - a.y, act.aimX - a.x);
  for (let i = 1; i <= n; i++) {
    const spot = w.grid.collide(
      act.aimX + Math.cos(ang) * spec.spacing * i,
      act.aimY + Math.sin(ang) * spec.spacing * i,
      0.3,
    );
    w.zones.push({
      id: w.nextId++,
      owner: a.id,
      profile: p,
      hand: act.hand,
      x: spot.x,
      y: spot.y,
      x2: undefined,
      y2: undefined,
      radius: (b.kind === 'burst' ? b.radius : 1.4) * p.radiusMult,
      delayT: spec.delay * i,
      interval: 1,
      pulseT: 0,
      pulsesLeft: 1,
      dtype: mainTypeOf(p),
    });
  }
}

// ---- Explosive Arrow: arrows that stick, and the first to explode takes the rest with it

/** An arrow has struck an enemy (or a wall, with `target` null): it sticks, and the fuse starts if none is burning there. */
export function stickArrow(w: World, pr: Projectile, target: Actor | null): void {
  const p = pr.profile;
  const spec = p.skill.fuse!;
  const key = target ? target.id : 0;
  let f = key ? w.fuses.find((x) => x.target === key) : undefined;
  if (!f) {
    f = {
      target: key,
      x: target ? target.x : pr.x,
      y: target ? target.y : pr.y,
      t: spec.seconds * p.skillDuration,
      arrows: [],
    };
    w.fuses.push(f);
  }
  f.arrows.push({ profile: p, hand: pr.hand });
}

function tickFuses(w: World, dt: number): void {
  let j = 0;
  for (const f of w.fuses) {
    f.t -= dt;
    if (f.t > 0) {
      w.fuses[j++] = f;
      continue;
    }
    const tgt = f.target ? w.actors.find((e) => e.id === f.target) : undefined;
    if (tgt && tgt.alive) {
      f.x = tgt.x;
      f.y = tgt.y;
    }
    const n = f.arrows.length;
    const p0 = f.arrows[0].profile;
    const spec = p0.skill.fuse!;
    // Each arrow in widens the blast and, for the ignite, makes it hit harder.
    const extra = Math.min(levelValue(spec.maxExtra, p0.skill.level), spec.radiusPer * (n - 1));
    const r = (spec.radius + extra) * p0.radiusMult;
    w.events.push({ t: 'explode', x: f.x, y: f.y, r, dtype: 3 });
    const grow = 1 + (spec.ignitePer / 100) * (n - 1);
    const hands = new Map<SkillProfile, SkillProfile>();
    for (const a of f.arrows) {
      let q = hands.get(a.profile);
      if (!q) {
        q = {
          ...a.profile,
          hands: a.profile.hands.map((h) => ({
            ...h,
            ailChunks: h.ailChunks.map((c) => ({
              ...c,
              k: [c.k[0] * grow, c.k[1], c.k[2]] as [number, number, number],
            })),
          })),
        };
        hands.set(a.profile, q);
      }
      for (const e of w.actors)
        if (!e.isPlayer && e.alive && e.phaseT <= 0 && Math.hypot(e.x - f.x, e.y - f.y) <= r + e.r)
          hit(w, w.player, e, q, a.hand, Math.hypot(e.x - w.player.x, e.y - w.player.y));
    }
  }
  w.fuses.length = j;
}

// ---- Scourge Arrow: pods along the arrow's way that bloom into thorns

/** The released arrow leaves a pod for each stage along its path; each, a moment later, blooms into thorn arrows. */
export function scatterSpores(w: World, a: Actor, act: Action, stages: number): void {
  const p = act.profile;
  const spec = p.skill.sporePods;
  if (!spec || stages <= 0) return;
  const ang = Math.atan2(act.aimY - a.y, act.aimX - a.x);
  const far = Math.max(3, Math.min(9, Math.hypot(act.aimX - a.x, act.aimY - a.y) + 2));
  const q = scaleProfile(p, 1 - spec.less / 100);
  for (let i = 1; i <= stages; i++) {
    const d = (far * i) / (stages + 1);
    const spot = w.grid.collide(a.x + Math.cos(ang) * d, a.y + Math.sin(ang) * d, 0.2);
    w.spores.push({
      x: spot.x,
      y: spot.y,
      t: spec.delay,
      profile: q,
      hand: act.hand,
      arrows: spec.arrows,
      range: spec.range,
    });
    w.events.push({ t: 'explode', x: spot.x, y: spot.y, r: 0.3, dtype: 4 });
  }
}

function tickSpores(w: World, dt: number): void {
  let j = 0;
  for (const s of w.spores) {
    s.t -= dt;
    if (s.t > 0) {
      w.spores[j++] = s;
      continue;
    }
    const phase = w.rngCombat.float(0, Math.PI * 2);
    for (let i = 0; i < s.arrows; i++)
      launch(w, w.player, s.profile, s.hand, s.x, s.y, phase + (i / s.arrows) * Math.PI * 2, {
        hitIds: [],
        aimId: 0,
        range: s.range,
        pierce: 0,
      });
  }
  w.spores.length = j;
}

// ---- Rimeplate: the trail of chilled ground the character leaves while it moves

function tickFrostTrail(w: World, dt: number): void {
  const fr = w.char.frostSpec;
  const p = w.player;
  if (!fr || !p.alive || !p.moving) return;
  w.trailT -= dt;
  if (w.trailT > 0) return;
  w.trailT = 0.4;
  const prof = w.char.profile(w.primary, 0);
  const q = { ...prof, chill: { ...prof.chill, effect: fr.slow / 100 } };
  w.fields.push({
    id: w.nextId++,
    owner: p.id,
    kind: 'chilling',
    x: p.x,
    y: p.y,
    r0: fr.radius,
    grow: 1,
    radius: fr.radius,
    t: fr.trail,
    total: fr.trail,
    profile: q,
    hand: 0,
    pulseT: 0,
    interval: 0.5,
    dps: 0,
    dtype: 2,
  });
}

/** An enemy that hits the character under Rimeplate is chilled a moment. */
export function frostBite(w: World, attacker: Actor): void {
  const fr = w.char.frostSpec;
  if (!fr || attacker.isPlayer || attacker.def.cannotBeChilled) return;
  attacker.ail.chill = Math.max(attacker.ail.chill, fr.slow / 100);
  attacker.ail.chillT = Math.max(attacker.ail.chillT, fr.seconds);
}

// ---- Herald of Agony: Virulence, and the crawler that follows it

/** A poison the character's hit put on an enemy while the herald stands: a point of Virulence, and the crawler if none lives. */
export function gainVirulence(w: World): void {
  const ag = w.char.agonySpec;
  if (!ag || !w.player.alive) return;
  w.virulence = Math.min(ag.max, w.virulence + 1);
  if (w.minions.some((m) => m.kind === 'crawler' && m.alive)) return;
  const c = w.char.primary;
  const prof = w.char.profile(c, 0);
  const m = makeMinion(w, c, prof, 'crawler', w.player.x, w.player.y, {
    blowLevel: ag.level,
    seconds: undefined,
  });
  m.key = 'agony';
}

function tickAgony(w: World, dt: number): void {
  const ag = w.char.agonySpec;
  if (w.virulence <= 0) return;
  if (!ag) {
    w.virulence = 0;
  } else {
    // The more it holds, the faster it goes.
    w.virulence = Math.max(0, w.virulence - (0.4 + 0.12 * w.virulence) * dt);
  }
  const n = Math.ceil(w.virulence);
  for (const m of w.minions)
    if (m.kind === 'crawler' && m.alive) {
      if (n <= 0) {
        // With no Virulence left, it is gone.
        m.alive = false;
        m.life = 0;
        continue;
      }
      // It cannot be hurt, and is as strong as the Virulence it follows.
      m.life = m.def.maxLife;
      m.dmg = 1 + (n * (ag?.dmgPer ?? 0)) / 100;
      m.speed = 1 + (n * (ag?.atkPer ?? 0)) / 100;
    }
}

// ---- Siphoning Trap: life and mana for the character from each enemy the beams hold

function tickSiphon(w: World, dt: number): void {
  const p = w.player;
  if (!p.alive) return;
  for (const c of w.char.actives) {
    const sp = c.usable ? c.skill.siphon : undefined;
    if (!sp) continue;
    let n = 0;
    for (const e of w.actors)
      if (!e.isPlayer && e.alive && e.sdots.some((d) => d.src === c.skill.id)) n++;
    if (n === 0) continue;
    const lv = c.skill.level;
    const life = levelValue(sp.life, lv) + n * levelValue(sp.lifeEach, lv);
    const mana = levelValue(sp.mana, lv) + n * levelValue(sp.manaEach, lv);
    p.life = Math.min(Math.max(1, p.def.maxLife - w.char.reservedLife), p.life + life * dt);
    p.mana = Math.min(p.def.maxMana - w.char.reservedMana, p.mana + mana * dt);
  }
}

// ---- Skitterbots: their auras chill and shock the enemies near them

function tickBots(w: World, dt: number): void {
  for (const m of w.minions) {
    if (!m.alive || !m.bot) continue;
    if ((m.botCd ?? 0) > 0) m.botCd = m.botCd! - dt;
    const sk = m.bot;
    for (const e of w.actors) {
      if (e.isPlayer || !e.alive || e.phaseT > 0) continue;
      if (Math.hypot(e.x - m.x, e.y - m.y) > sk.radius + e.r) continue;
      if (sk.kind === 'chill' && !e.def.cannotBeChilled) {
        e.ail.chill = Math.max(e.ail.chill, sk.v / 100);
        e.ail.chillT = Math.max(e.ail.chillT, 0.5);
      } else if (sk.kind === 'shock') {
        e.ail.shock = Math.max(e.ail.shock, sk.v);
        e.ail.shockT = Math.max(e.ail.shockT, 0.5);
      }
    }
  }
}

// ---- Molten Shell: a pool that takes the damage, and goes off as fire

type ShellSpec = NonNullable<
  Extract<NonNullable<SkillChoice['skill']['utility']>, { kind: 'buff' }>['shell']
>;

/** The shell goes up: its pool is a share of the armour (the gem's armour counted), and it has not yet taken anything. */
export function startShell(
  w: World,
  buff: BuffId,
  spec: ShellSpec,
  level: number,
  profile: SkillProfile,
): void {
  const pool = Math.min(spec.capMax, (w.player.def.armour * spec.capPct) / 100);
  w.shell = {
    left: pool,
    taken: 0,
    absorb: spec.absorb / 100,
    reflect: levelValue(spec.reflect, level),
    radius: spec.radius,
    buff,
    profile,
  };
}

/** Part of a hit goes into the shell: the share it takes, up to what is left of it. */
export function shellTakes(w: World, total: number): number {
  const s = w.shell;
  if (!s || s.left <= 0) return 0;
  const taken = Math.min(s.left, total * s.absorb);
  s.left -= taken;
  s.taken += taken;
  return taken;
}

/** When the buff ends or the pool is spent, what the shell took goes out as fire to the enemies about. */
function tickShell(w: World): void {
  const s = w.shell;
  if (!s) return;
  if (s.left > 0 && w.buffT[s.buff] > 0) return;
  w.shell = null;
  const dmg = (s.taken * s.reflect) / 100;
  if (dmg <= 0) return;
  const p = w.player;
  w.events.push({ t: 'explode', x: p.x, y: p.y, r: s.radius, dtype: 3 });
  for (const e of w.actors)
    if (
      !e.isPlayer &&
      e.alive &&
      e.phaseT <= 0 &&
      Math.hypot(e.x - p.x, e.y - p.y) <= s.radius + e.r
    )
      rawHit(w, e, dmg, 3, 'Molten Shell');
}

// ---- Holy Relic: a nova when the character hits with an attack, and regeneration for those it helps

/** The character hit with an attack: a relic that stands sets off its nova (not more than once in its cooldown). */
export function relicNova(w: World): void {
  const relic = w.minions.find((m) => m.kind === 'relic' && m.alive);
  if (!relic) return;
  const c = w.char.utilities.find((x) => x.key === relic.key);
  const u = c?.skill.utility;
  if (!c || u?.kind !== 'summon' || !u.relic) return;
  if (w.t - w.relicT < u.relic.cooldown) return;
  w.relicT = w.t;
  const spec = u.relic;
  const level = c.skill.level;
  const r = spec.radius * w.char.profile(c, 0).radiusMult;
  w.events.push({ t: 'explode', x: relic.x, y: relic.y, r, dtype: 0 });
  const amount =
    spellBaseDamage(relic.level) * (MINIONS.relic.nova ?? 0) * relic.dmg * MINION_ENEMY_RES;
  for (const e of w.actors)
    if (
      !e.isPlayer &&
      e.alive &&
      e.phaseT <= 0 &&
      Math.hypot(e.x - relic.x, e.y - relic.y) <= r + e.r
    )
      rawHit(w, e, amount, 0, 'Relic', 'minion');
  w.relicRegen = {
    t: spec.seconds,
    me: levelValue(spec.regen, level),
    minions: levelValue(spec.minionRegen, level),
  };
}

function tickRelicRegen(w: World, dt: number): void {
  const g = w.relicRegen;
  g.t -= dt;
  const p = w.player;
  if (p.alive)
    p.life = Math.min(Math.max(1, p.def.maxLife - w.char.reservedLife), p.life + g.me * dt);
  for (const m of w.minions) if (m.alive) m.life = Math.min(m.def.maxLife, m.life + g.minions * dt);
}

// ---- Ice Nova: cast on the character's Frostbolt projectiles

/** The spell is cast on the character's projectiles of the named skill, when there are any: a burst about each (up to the most). */
export function novaOnBolts(w: World, a: Actor, act: Action): boolean {
  const p = act.profile;
  const spec = p.skill.castOn!;
  const bolts = w.projectiles
    .filter((pr) => pr.owner === a.id && pr.profile.skill.id === spec.skill)
    .slice(0, spec.max);
  if (bolts.length === 0) return false;
  const b = p.skill.behaviour;
  const r = (b.kind === 'burst' ? b.radius : 2) * p.radiusMult * (1 - spec.areaLess / 100);
  const struck = new Set<number>();
  for (const pr of bolts) {
    w.events.push({ t: 'explode', x: pr.x, y: pr.y, r, dtype: mainType(act) });
    for (const e of enemiesOf(w, a))
      if (!struck.has(e.id) && e.phaseT <= 0 && Math.hypot(e.x - pr.x, e.y - pr.y) <= r + e.r) {
        struck.add(e.id);
        hit(w, a, e, p, act.hand, Math.hypot(e.x - a.x, e.y - a.y));
      }
  }
  return true;
}

// ---- Mirror Arrow: a clone where the arrow ends

/** The arrow has ended: the character's clone stands there for a few seconds and fires with the character's bow. */
export function mirrorLanded(w: World, pr: Projectile): void {
  const spec = pr.profile.skill.mirror;
  const c = w.char.actives.find((x) => x.skill.id === pr.profile.skill.id);
  if (!spec || !c) return;
  const m = summonAt(
    w,
    c,
    pr.profile,
    'clone',
    spec.seconds * pr.profile.skillDuration,
    pr.x,
    pr.y,
  );
  cloneOfPlayer(w, m, spec.more);
}

// ---- Bladefall: volleys that widen and weaken

/** The volleys land one after another, each a ring wider and weaker (and less likely to crit) than the one before, and a wave beyond it. */
export function fireVolleys(w: World, a: Actor, act: Action): void {
  const p = act.profile;
  const spec = p.skill.volleys!;
  const b = p.skill.behaviour;
  const r0 = (b.kind === 'burst' ? b.radius : 2) * p.radiusMult;
  const ang = Math.atan2(act.aimY - a.y, act.aimX - a.x);
  let along = 0;
  for (let k = 0; k <= spec.extra; k++) {
    const r = r0 * (1 + (spec.widen / 100) * k);
    const cx = act.aimX + Math.cos(ang) * along;
    const cy = act.aimY + Math.sin(ang) * along;
    // The next volley falls one width further on, so the waves meet.
    along += r * 0.9;
    const f = Math.pow(1 - spec.lessPer / 100, k);
    const q: SkillProfile = {
      ...p,
      hands: p.hands.map((h) => ({
        ...h,
        hitMult: h.hitMult * f,
        critChance: h.critChance * Math.max(0, 1 - (spec.critLessPer / 100) * k),
      })),
    };
    const spot = w.grid.collide(cx, cy, 0.3);
    w.zones.push({
      id: w.nextId++,
      owner: a.id,
      profile: q,
      hand: act.hand,
      x: spot.x,
      y: spot.y,
      x2: undefined,
      y2: undefined,
      radius: r,
      delayT: spec.delay * k,
      interval: 1,
      pulseT: 0,
      pulsesLeft: 1,
      dtype: mainTypeOf(p),
    });
  }
}

// ---- Creeping Frost: chilled ground that creeps toward enemies

/** The skull has burst: the chilled ground it leaves, at most so many patches at once. */
export function leaveCreeping(
  w: World,
  owner: Actor | undefined,
  pr: Projectile,
  x: number,
  y: number,
): void {
  const spec = pr.profile.skill.leaves;
  if (!spec || !owner || spec.creep === undefined) return;
  const mine = w.fields.filter((f) => f.kind === 'chilling' && f.skill === pr.profile.skill.id);
  if (spec.max && mine.length >= spec.max) {
    const oldest = mine.reduce((m, f) => (f.t < m.t ? f : m));
    w.fields.splice(w.fields.indexOf(oldest), 1);
  }
  const r = spec.radius * pr.profile.radiusMult;
  const t = spec.seconds * pr.profile.skillDuration;
  w.fields.push({
    id: w.nextId++,
    owner: owner.id,
    kind: 'chilling',
    x,
    y,
    r0: r,
    grow: spec.grow ?? 1,
    radius: r,
    t,
    total: t,
    profile: pr.profile,
    hand: pr.hand,
    pulseT: 0,
    interval: 0.5,
    dps: spec.dps ?? 0,
    dtype: 2,
    skill: pr.profile.skill.id,
    creep: spec.creep,
  });
}

/** Chilled ground that creeps drifts toward the nearest enemy within reach. */
export function creepToward(w: World, f: Field, dt: number): void {
  let best: Actor | null = null;
  let bd = 7;
  for (const e of w.actors) {
    if (e.isPlayer || !e.alive || e.phaseT > 0) continue;
    const d = Math.hypot(e.x - f.x, e.y - f.y);
    if (d < bd) {
      bd = d;
      best = e;
    }
  }
  if (!best || bd < 0.3) return;
  const step = Math.min(bd, (f.creep ?? 0) * dt);
  const spot = w.grid.collide(
    f.x + ((best.x - f.x) / bd) * step,
    f.y + ((best.y - f.y) / bd) * step,
    0.3,
  );
  f.x = spot.x;
  f.y = spot.y;
}
