import type { SkillChoice } from '../calc/character';
import { levelValue } from '../calc/gems';
import type { SkillProfile } from '../calc/skill';
import { PROJECTILE_SPEED } from '../data/constants';
import type { UtilityDef } from '../data/gems';
import { gainBuff } from './buffs';
import { cooldownSeconds } from './cooldowns';
import { hit, rawHit } from './combat';
import { takeCorpse, type Corpse } from './factions';
import { cloneOfPlayer, summonAt } from './minions';
import { applyStatus } from './statuses';
import type { Actor, World } from './types';

/**
 * Blink and travel (docs/SPIRIT.md S8). A blink skill carries the character to a spot beside its target; around it the
 * reference game's blinks do their work: Flame Dash burns the ground it crossed and the enemies where it lands, Frostblink hurts
 * and chills where the character left, Lightning Warp takes the time the run would have taken and bursts at both ends, Withering
 * Step wraps the character in an Elusive buff and withers the enemies that come near until another skill is used, and a Blink
 * Arrow flies first, then takes the character to where it landed and leaves a clone where it stood.
 */
export type BlinkSpec = Extract<UtilityDef, { kind: 'blink' }>;

/** A teleport that waits for the character to have run the distance. */
export type WarpState = {
  key: string;
  toX: number;
  toY: number;
  t: number;
  profile: SkillProfile;
};

/** Withering Step: enemies that come within the radius are withered, the first time each does; any other skill ends it. */
export type WitherState = {
  skill: string;
  radius: number;
  stacks: number;
  seconds: number;
  seen: number[];
};

/** Projectiles a returning skill has caught (Venom Gyre) and the time they are kept. */
export type CaughtState = { profile: SkillProfile; hand: number; n: number; t: number };

type BlinkChoice = { c: SkillChoice; u: BlinkSpec };

const blinkOf = (c: SkillChoice): BlinkChoice | null => {
  const u = c.skill.utility;
  return u?.kind === 'blink' ? { c, u } : null;
};

/** The blink skills share one cooldown: after one is used the others wait for its use to come back. */
const GROUP = '@blink#';

export function blinkGroupBusy(w: World, c: SkillChoice): boolean {
  for (const key in w.utilityReady)
    if (key.startsWith(GROUP) && key !== GROUP + c.key && w.utilityReady[key] > w.t) return true;
  return false;
}

export function noteBlinkUsed(w: World, c: SkillChoice): void {
  w.utilityReady[GROUP + c.key] = w.t + (c.skill.cooldown ? cooldownSeconds(w, c) : 0);
}

/** The enemies near a point. */
function enemiesAt(w: World, x: number, y: number, r: number): Actor[] {
  return w.actors.filter(
    (e) => !e.isPlayer && e.alive && e.phaseT <= 0 && Math.hypot(e.x - x, e.y - y) <= r + e.r,
  );
}

function burstRadius(p: SkillProfile): number {
  const b = p.skill.behaviour;
  return (b.kind === 'burst' ? b.radius : 1.5) * p.radiusMult;
}

/** The skill's damage lands around a spot. */
function burstAt(w: World, a: Actor, p: SkillProfile, x: number, y: number, u?: BlinkSpec): void {
  if (p.hands[0].chunks.length === 0) return;
  const r = burstRadius(p);
  w.events.push({ t: 'explode', x, y, r, dtype: p.hands[0].chunks[0].type });
  const own = u?.corpse && u.corpse.lifePct > 0 ? (a.def.maxLife * u.corpse.lifePct) / 100 : 0;
  for (const e of enemiesAt(w, x, y, r)) {
    hit(w, a, e, p, 0, Math.hypot(e.x - a.x, e.y - a.y));
    // Bodyswap adds a share of the character's own life to what it deals.
    if (own > 0 && e.alive) rawHit(w, e, own, p.hands[0].chunks[0].type, 'Bodyswap');
  }
}

/** The blink skill is cast at the target: either the character goes now, or it is on its way. */
export function blinkCast(
  w: World,
  a: Actor,
  p: SkillProfile,
  c: SkillChoice,
  target: Actor,
): void {
  const b = blinkOf(c);
  if (!b) return;
  const { u } = b;
  if (u.escape) {
    escapeCast(w, a, p, c, u);
    return;
  }
  // A blink that prefers a corpse goes to the one with the most enemies about it, if there is one within reach.
  let corpse: Corpse | null = null;
  if (u.corpse) {
    let best = 0;
    for (const c0 of w.corpses) {
      if (Math.hypot(c0.x - a.x, c0.y - a.y) > u.distance + 1) continue;
      const n = enemiesAt(w, c0.x, c0.y, 2.5).length;
      if (n > best) {
        best = n;
        corpse = c0;
      }
    }
  }
  const goal = corpse ?? target;
  const d = Math.hypot(goal.x - a.x, goal.y - a.y);
  const step = corpse
    ? Math.min(u.distance, d)
    : Math.max(0, Math.min(u.distance, d - (target.r + a.r + 1)));
  const spot = w.grid.collide(
    a.x + ((goal.x - a.x) / Math.max(d, 1e-6)) * step,
    a.y + ((goal.y - a.y) / Math.max(d, 1e-6)) * step,
    a.r,
  );
  if (corpse && u.corpse) {
    // The corpse bursts for a share of its life, and the bursts are larger.
    const big = { ...p, radiusMult: p.radiusMult * Math.sqrt(1 + u.corpse.areaMore / 100) };
    takeCorpse(w, corpse);
    const r = burstRadius(big);
    w.events.push({ t: 'explode', x: corpse.x, y: corpse.y, r, dtype: 3 });
    for (const e of enemiesAt(w, corpse.x, corpse.y, r))
      rawHit(w, e, (corpse.life * u.corpse.explodePct) / 100, 3, 'Corpse');
    noteBlinkUsed(w, c);
    arrive(w, a, big, c, u, spot.x, spot.y);
    return;
  }
  noteBlinkUsed(w, c);
  if (u.warp) {
    // The teleport waits as long as the run would take; the character may act meanwhile (a new cast queues behind it).
    const run = Math.hypot(spot.x - a.x, spot.y - a.y);
    const t =
      'speed' in u.warp
        ? run / (PROJECTILE_SPEED * u.warp.speed * p.projSpeedMult)
        : (run / Math.max(0.5, a.def.moveSpeed)) *
          (1 - levelValue(u.warp.lessDuration, c.skill.level) / 100);
    if (w.warp) w.warp.t += t;
    else w.warp = { key: c.key, toX: spot.x, toY: spot.y, t, profile: p };
    if (w.warp.key === c.key) {
      w.warp.toX = spot.x;
      w.warp.toY = spot.y;
    }
    return;
  }
  arrive(w, a, p, c, u, spot.x, spot.y);
}

/** Smoke Mine: the character goes to the safest spot in reach, smoke at both ends, and the buff that follows. */
function escapeCast(w: World, a: Actor, p: SkillProfile, c: SkillChoice, u: BlinkSpec): void {
  const esc = u.escape!;
  const foes = enemiesAt(w, a.x, a.y, 12);
  let best: { x: number; y: number } | null = null;
  let bd = -1;
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * Math.PI * 2;
    const spot = w.grid.collide(
      a.x + Math.cos(ang) * u.distance,
      a.y + Math.sin(ang) * u.distance,
      a.r,
    );
    if (Math.hypot(spot.x - a.x, spot.y - a.y) < 2.5 || !w.grid.los(a.x, a.y, spot.x, spot.y))
      continue;
    let near = 99;
    for (const e of foes) near = Math.min(near, Math.hypot(e.x - spot.x, e.y - spot.y));
    if (near > bd) {
      bd = near;
      best = spot;
    }
  }
  if (!best) return;
  noteBlinkUsed(w, c);
  const sm = esc.smoke;
  for (const [x, y] of [
    [a.x, a.y],
    [best.x, best.y],
  ]) {
    const r = sm.radius * p.radiusMult;
    w.fields.push({
      id: w.nextId++,
      owner: a.id,
      kind: 'smoke',
      x,
      y,
      r0: r,
      grow: 1,
      radius: r,
      t: sm.seconds * p.skillDuration,
      total: sm.seconds * p.skillDuration,
      hand: 0,
      pulseT: 0,
      interval: 0.5,
      dps: sm.blind,
      dtype: 0,
    });
  }
  w.events.push({ t: 'blink', id: a.id, x: a.x, y: a.y, end: false });
  a.x = best.x;
  a.y = best.y;
  w.events.push({ t: 'blink', id: a.id, x: a.x, y: a.y, end: true });
  gainBuff(w, esc.buff);
}

/** The character goes: the skill's burst and ground at the point left, the way across, the burst where it lands. */
function arrive(
  w: World,
  a: Actor,
  p: SkillProfile,
  c: SkillChoice,
  u: BlinkSpec,
  x: number,
  y: number,
): void {
  const fx = a.x;
  const fy = a.y;
  if (u.burst === 'depart' || u.burst === 'both' || u.warp) burstAt(w, a, p, fx, fy, u);
  if (u.chill) w.fields.push(chillGround(w, a, p, fx, fy, u.chill));
  if (u.trail) w.fields.push(trailGround(w, a, p, fx, fy, x, y, u.trail));
  w.events.push({ t: 'blink', id: a.id, x: a.x, y: a.y, end: false });
  a.x = x;
  a.y = y;
  w.events.push({ t: 'blink', id: a.id, x: a.x, y: a.y, end: true });
  if (u.burst === 'arrive' || u.burst === 'both' || u.warp) burstAt(w, a, p, x, y, u);
  if (u.clone) cloneOfPlayer(w, summonAt(w, c, p, u.clone.minion, u.clone.seconds, fx, fy), 75);
  if (u.elusive) {
    // Elusive is renewed in full, and enemies that come near are withered until the character does something else.
    w.buffT.elusive = Math.max(0, 5 * w.char.db.mult('buffDuration'));
    w.events.push({ t: 'buff', id: 'elusive' });
    w.wither = {
      skill: c.skill.id,
      radius: levelValue(u.elusive.radius, c.skill.level) * p.radiusMult,
      stacks: Math.round(levelValue(u.elusive.stacks, c.skill.level)),
      seconds: u.elusive.seconds,
      seen: [],
    };
    // Those already near the landing are withered at once, not only the ones that come after.
    tickWither(w);
  }
}

function chillGround(
  w: World,
  a: Actor,
  p: SkillProfile,
  x: number,
  y: number,
  g: { seconds: number; radius: number },
) {
  const r = g.radius * p.radiusMult;
  return {
    id: w.nextId++,
    owner: a.id,
    kind: 'chilling' as const,
    x,
    y,
    r0: r,
    grow: 1,
    radius: r,
    t: g.seconds,
    total: g.seconds,
    profile: p,
    hand: 0,
    pulseT: 0,
    interval: 0.5,
    dps: 0,
    dtype: 2,
  };
}

function trailGround(
  w: World,
  a: Actor,
  p: SkillProfile,
  x: number,
  y: number,
  x2: number,
  y2: number,
  g: { seconds: number; radius: number },
) {
  const r = g.radius * p.radiusMult;
  return {
    id: w.nextId++,
    owner: a.id,
    kind: 'trail' as const,
    x,
    y,
    x2,
    y2,
    r0: r,
    grow: 1,
    radius: r,
    t: g.seconds,
    total: g.seconds,
    profile: p,
    hand: 0,
    pulseT: 0,
    interval: 0.25,
    dps: 0,
    dtype: 3,
  };
}

/** A warp in the air: when the run is over, the character goes. */
export function tickWarp(w: World, dt: number): void {
  const s = w.warp;
  if (!s) return;
  s.t -= dt;
  if (s.t > 0) return;
  w.warp = null;
  const a = w.player;
  const c = w.char.utilities.find((x) => x.key === s.key);
  const u = c && blinkOf(c)?.u;
  if (!a.alive || !c || !u) return;
  arrive(w, a, s.profile, c, u, s.toX, s.toY);
}

/** Withering Step: enemies that come within the radius are withered, the first time each does. Ends with the Elusive buff. */
export function tickWither(w: World): void {
  const s = w.wither;
  if (!s) return;
  if (w.buffT.elusive <= 0) {
    w.wither = null;
    return;
  }
  const p = w.player;
  for (const e of enemiesAt(w, p.x, p.y, s.radius)) {
    if (s.seen.includes(e.id)) continue;
    s.seen.push(e.id);
    applyStatus(w, e, 'withered', { seconds: s.seconds, stacks: s.stacks });
  }
}

/** The character uses a skill: Withering Step ends (the buff and its aura), unless the skill is the blink itself. */
export function skillUsed(w: World, skillId: string): void {
  if (!w.wither || w.wither.skill === skillId) return;
  w.buffT.elusive = 0;
  w.wither = null;
}

/** A returning projectile that reaches its owner is caught, up to a limit, and kept for a while. */
export function catchProjectile(w: World, p: SkillProfile, hand: number): void {
  const limit = p.skill.catches ?? 0;
  if (limit <= 0) return;
  const c = w.caught;
  if (c && c.profile.skill.id === p.skill.id) {
    c.n = Math.min(limit, c.n + 1);
    c.t = CAUGHT_SECONDS;
  } else w.caught = { profile: p, hand, n: 1, t: CAUGHT_SECONDS };
}

export const CAUGHT_SECONDS = 12;

export function tickCaught(w: World, dt: number): void {
  const c = w.caught;
  if (!c) return;
  c.t -= dt;
  if (c.t <= 0) w.caught = null;
}
