import { angleDiff } from '../core/math';
import { BLOCK_WINDOW, ECHO_GAP, HIT_AT, PROJECTILE_SPEED, SHOT_ALERT } from '../data/constants';
import type { SkillProfile } from '../calc/skill';
import { rollGains } from './buffs';
import { rollCharges } from './charges';
import { hit } from './combat';
import { registerBlast, shieldBlocks, speedMult } from './factions';
import { fireTriggers } from './triggers';
import { placeDeployable } from './deploy';
import { applyUtility } from './utility';
import type { Action, Actor, World } from './types';

/** Begin an action (attack or cast). The previous action's overflow time carries over. */
export function startAction(
  w: World,
  a: Actor,
  which: Action['which'],
  p: SkillProfile,
  target: Actor,
): void {
  const n = p.hands.length;
  const hand = n > 1 ? a.handIdx % n : 0;
  const duration = p.isAttack && n > 1 && !p.bothHands ? p.hands[hand].time : p.useTime;
  a.action = {
    profile: p,
    which,
    hand,
    duration,
    elapsed: a.carry,
    fired: false,
    echoes: 0,
    targetId: target.id,
    aimX: target.x,
    aimY: target.y,
  };
  a.carry = 0;
  a.facing = Math.atan2(target.y - a.y, target.x - a.x);
  w.events.push({ t: 'use', src: a.id, skill: p.skill.id });
  if (a.isPlayer && p.isAttack) fireTriggers(w, { on: 'attack', target, tags: p.tagMask });
  if (a.isPlayer && !p.isAttack) {
    fireTriggers(w, { on: 'cast', target, tags: p.tagMask });
    rollGains(w, 'cast', p.gains);
    rollCharges(w, 'cast', p.gains);
  }
  // Fighting is noisy: idle monsters nearby come running even if they have not seen the player.
  if (a.isPlayer)
    for (const m of w.actors)
      if (
        !m.isPlayer &&
        m.alive &&
        m.state === 'idle' &&
        Math.hypot(m.x - a.x, m.y - a.y) <= SHOT_ALERT
      ) {
        m.state = 'chase';
        m.lostT = 0;
      }
}

/**
 * Aim angle of arrow `i` of an `n`-arrow fan. With an even count a symmetric fan has no arrow on the aim
 * line, and every arrow can pass either side of a small target at range, so the fan is shifted by half a
 * step (alternating sides) to keep one arrow flying true.
 */
export function fanAngle(base: number, i: number, n: number, step: number, tick: number): number {
  const centre = (n - 1) / 2 + (n % 2 === 0 ? (tick % 2 === 0 ? 0.5 : -0.5) : 0);
  return base + (i - centre) * step;
}

export function actorById(w: World, id: number): Actor | undefined {
  // Actors are stored in id order for monsters spawned at map start; summons append.
  for (const a of w.actors) if (a.id === id) return a;
  for (const m of w.minions) if (m.id === id) return m;
  return undefined;
}

/** When the next echo lands: a share of the use time after the first (and each earlier echo). */
const echoeAt = (act: Action) => (HIT_AT + ECHO_GAP * (act.echoes + 1)) * act.duration;

/** Advance the current action; fire it at 60% of its use time. */
export function updateAction(w: World, a: Actor, dt: number): void {
  const act = a.action;
  if (!act) return;
  if (a.stunT > 0) {
    a.action = null;
    return;
  }
  if (a.ail.freezeT > 0) return;
  const t = actorById(w, act.targetId);
  if (t && t.alive && !act.fired) {
    act.aimX = t.x;
    act.aimY = t.y;
    a.facing = Math.atan2(t.y - a.y, t.x - a.x);
  }
  act.elapsed += dt * (1 - a.ail.chill) * speedMult(a);
  if (!act.fired && act.elapsed >= HIT_AT * act.duration) {
    act.fired = true;
    fire(w, a, act);
  }
  // Echoes: the same use lands again a moment after the first, without a new wind-up or a new cost.
  if (
    act.which !== 'utility' &&
    act.fired &&
    act.echoes < act.profile.repeats &&
    act.elapsed >= echoeAt(act)
  ) {
    act.echoes++;
    const t2 = actorById(w, act.targetId);
    if (t2 && t2.alive) {
      act.aimX = t2.x;
      act.aimY = t2.y;
    }
    fire(w, a, act);
    w.events.push({ t: 'echo', src: a.id, skill: act.profile.skill.id });
  }
  if (act.elapsed >= act.duration) {
    a.carry = act.elapsed - act.duration;
    a.action = null;
    a.handIdx++;
  }
}

function enemiesOf(w: World, a: Actor): Actor[] {
  if (a.isPlayer) return w.actors.filter((o) => !o.isPlayer && o.alive);
  if (!w.player.alive) return [];
  // A monster's area attack catches the player's minions too.
  return w.minions.length === 0 ? [w.player] : [w.player, ...w.minions.filter((m) => m.alive)];
}

/** The damage type of a skill's biggest chunk (what an effect looks like). */
function dominantType(p: SkillProfile, hand: number): number {
  let dtype = 0;
  let best = -1;
  for (const c of p.hands[Math.min(hand, p.hands.length - 1)].chunks)
    if (c.max > best) {
      best = c.max;
      dtype = c.type;
    }
  return dtype;
}

/** Distance from a point to a line segment. */
export function segmentDist(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  const t = len2 > 0 ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2)) : 0;
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

/** Zones a skill left on the ground pulse, and end (rain, a cloud, a wall). */
export function tickSkillZones(w: World, dt: number): void {
  if (w.zones.length === 0) return;
  let j = 0;
  for (const z of w.zones) {
    const owner = actorById(w, z.owner);
    if (!owner || !owner.alive) continue;
    if (z.delayT > 0) {
      z.delayT -= dt;
      w.zones[j++] = z;
      continue;
    }
    z.pulseT -= dt;
    if (z.pulseT <= 0) {
      z.pulseT += z.interval;
      z.pulsesLeft--;
      w.events.push({
        t: 'explode',
        x: z.x2 === undefined ? z.x : (z.x + z.x2) / 2,
        y: z.y2 === undefined || z.y === undefined ? z.y : (z.y + z.y2) / 2,
        r: z.radius,
        dtype: z.dtype,
      });
      for (const e of enemiesOf(w, owner)) {
        const d =
          z.x2 === undefined || z.y2 === undefined
            ? Math.hypot(e.x - z.x, e.y - z.y)
            : segmentDist(e.x, e.y, z.x, z.y, z.x2, z.y2);
        if (d > z.radius + e.r) continue;
        hit(w, owner, e, z.profile, z.hand, Math.hypot(e.x - owner.x, e.y - owner.y));
      }
    }
    if (z.pulsesLeft > 0) w.zones[j++] = z;
  }
  w.zones.length = j;
}

/** Resolve an action's effect: strikes, chains or projectiles. Triggers call it with no wind-up. */
export function fire(w: World, a: Actor, act: Action): void {
  if (act.which === 'utility') {
    applyUtility(w, a, act);
    return;
  }
  if (a.isPlayer && act.which !== 'deployed' && act.which !== 'default') {
    const c = w.char.actives.find((x) => x.skill.id === act.profile.skill.id);
    if (c?.deploy) {
      placeDeployable(w, a, act);
      return;
    }
  }
  const p = act.profile;
  const b = p.skill.behaviour;
  const target = actorById(w, act.targetId);
  // A travelling skill (a leap, a charge) carries the caster toward the target before it lands.
  if (p.skill.travel && target && target.alive) {
    const d = Math.hypot(target.x - a.x, target.y - a.y);
    const step = Math.max(0, Math.min(p.skill.travel, d - (target.r + a.r + 0.8)));
    if (step > 0.05) {
      const spot = w.grid.collide(
        a.x + ((target.x - a.x) / d) * step,
        a.y + ((target.y - a.y) / d) * step,
        a.r,
      );
      w.events.push({ t: 'blink', id: a.id, x: a.x, y: a.y, end: false });
      a.x = spot.x;
      a.y = spot.y;
      w.events.push({ t: 'blink', id: a.id, x: a.x, y: a.y, end: true });
    }
  }
  if (b.kind === 'melee') {
    const reach = b.range + p.rangeBonus;
    if (b.arc) {
      const radius = (b.radius ?? reach) * p.radiusMult;
      const half = ((b.arc / 2) * Math.PI) / 180;
      for (const e of enemiesOf(w, a)) {
        const d = Math.hypot(e.x - a.x, e.y - a.y);
        if (d > radius + e.r + a.r + 0.4) continue;
        const ang = Math.atan2(e.y - a.y, e.x - a.x);
        if (d > e.r && Math.abs(angleDiff(a.facing, ang)) > half) continue;
        if (p.bothHands) for (let h = 0; h < p.hands.length; h++) hit(w, a, e, p, h, d);
        else hit(w, a, e, p, act.hand, d);
      }
      return;
    }
    if (!target || !target.alive) return;
    const d = Math.hypot(target.x - a.x, target.y - a.y);
    if (d > reach + target.r + a.r + 0.4) return;
    hit(w, a, target, p, act.hand, d);
    return;
  }
  if (b.kind === 'chain') {
    if (!target || !target.alive) return;
    const hitIds: number[] = [];
    let cur = target;
    let from: Actor = a;
    for (let i = 0; i <= p.chains; i++) {
      const d = Math.hypot(cur.x - a.x, cur.y - a.y);
      hit(w, a, cur, p, act.hand, d);
      w.events.push({ t: 'chain', from: from.id, to: cur.id });
      hitIds.push(cur.id);
      if (i === p.chains) break;
      let best: Actor | null = null;
      let bd = b.chainRange;
      for (const e of enemiesOf(w, a)) {
        if (hitIds.includes(e.id)) continue;
        const dd = Math.hypot(e.x - cur.x, e.y - cur.y);
        if (dd <= bd && w.grid.los(cur.x, cur.y, e.x, e.y)) {
          bd = dd;
          best = e;
        }
      }
      if (!best) break;
      from = cur;
      cur = best;
    }
    return;
  }
  if (b.kind === 'burst') {
    // Around the target (a slam, an item skill) or, as a nova, around the caster.
    const cx = b.origin === 'self' ? a.x : act.aimX;
    const cy = b.origin === 'self' ? a.y : act.aimY;
    const radius = b.radius * p.radiusMult;
    let dominant = 0;
    let best = -1;
    for (const c of p.hands[0].chunks)
      if (c.max > best) {
        best = c.max;
        dominant = c.type;
      }
    w.events.push({ t: 'explode', x: cx, y: cy, r: radius, dtype: dominant });
    for (const e of enemiesOf(w, a)) {
      if (Math.hypot(e.x - cx, e.y - cy) > radius + e.r) continue;
      hit(w, a, e, p, act.hand, Math.hypot(e.x - a.x, e.y - a.y));
    }
    return;
  }
  if (b.kind === 'beam') {
    // Everything on the line from the caster toward the target.
    const len = b.length * p.radiusMult;
    const ang = Math.atan2(act.aimY - a.y, act.aimX - a.x);
    const x2 = a.x + Math.cos(ang) * len;
    const y2 = a.y + Math.sin(ang) * len;
    w.events.push({ t: 'beam', x: a.x, y: a.y, x2, y2, dtype: dominantType(p, act.hand) });
    for (const e of enemiesOf(w, a)) {
      if (segmentDist(e.x, e.y, a.x, a.y, x2, y2) > (b.width * p.radiusMult) / 2 + e.r) continue;
      hit(w, a, e, p, act.hand, Math.hypot(e.x - a.x, e.y - a.y));
    }
    return;
  }
  if (b.kind === 'ground') {
    const line = b.line !== undefined;
    const ang = Math.atan2(act.aimY - a.y, act.aimX - a.x);
    w.zones.push({
      id: w.nextId++,
      owner: a.id,
      profile: p,
      hand: act.hand,
      x: line ? a.x : act.aimX,
      y: line ? a.y : act.aimY,
      x2: line ? a.x + Math.cos(ang) * (b.line as number) * p.radiusMult : undefined,
      y2: line ? a.y + Math.sin(ang) * (b.line as number) * p.radiusMult : undefined,
      radius: b.radius * p.radiusMult,
      delayT: b.delay ?? 0,
      interval: b.interval,
      pulseT: 0,
      pulsesLeft: Math.max(1, Math.floor(b.duration / b.interval)),
      dtype: dominantType(p, act.hand),
    });
    return;
  }
  // Projectiles.
  const n = p.projectiles;
  const base = Math.atan2(act.aimY - a.y, act.aimX - a.x);
  const baseCount = b.count;
  const step = ((b.spread > 0 && baseCount > 1 ? b.spread / (baseCount - 1) : 10) * Math.PI) / 180;
  const speed = PROJECTILE_SPEED * p.projSpeedMult;
  let dtype = 0;
  const h = p.hands[Math.min(act.hand, p.hands.length - 1)];
  let best = -1;
  for (const c of h.chunks)
    if (c.max > best) {
      best = c.max;
      dtype = c.type;
    }
  // All projectiles of one use share a hit list: a use hits each target at most once.
  const useHits: number[] = [];
  for (let i = 0; i < n; i++) {
    const ang = fanAngle(base, i, n, step, w.tick);
    const id = w.nextId++;
    w.projectiles.push({
      id,
      owner: a.id,
      faction: a.faction,
      x: a.x,
      y: a.y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      r: 0.15,
      travelled: 0,
      maxRange: (b.range ?? 9) + 2,
      profile: p,
      hand: act.hand,
      hitIds: useHits,
      pierceLeft: p.pierce,
      aimId: act.targetId,
      minDist: Infinity,
      lastHitId: 0,
      explodeRadius: (b.explodeRadius ?? 0) * p.radiusMult,
      startX: a.x,
      startY: a.y,
      dtype,
    });
    w.events.push({ t: 'projectileSpawned', id });
  }
}

function explode(
  w: World,
  owner: Actor | undefined,
  pr: World['projectiles'][number],
  x: number,
  y: number,
): void {
  w.events.push({ t: 'explode', x, y, r: pr.explodeRadius, dtype: pr.dtype });
  registerBlast(w, x, y, pr.explodeRadius);
  if (!owner) return;
  for (const e of w.actors) {
    if (!e.alive || e.faction === pr.faction) continue;
    if (Math.hypot(e.x - x, e.y - y) <= pr.explodeRadius + e.r)
      hit(w, owner, e, pr.profile, pr.hand, Math.hypot(e.x - pr.startX, e.y - pr.startY));
  }
  if (pr.faction === 1)
    for (const e of w.minions)
      if (e.alive && Math.hypot(e.x - x, e.y - y) <= pr.explodeRadius + e.r)
        hit(w, owner, e, pr.profile, pr.hand, Math.hypot(e.x - pr.startX, e.y - pr.startY));
}

/** Fates reported in `projectileEnd` events: 0 wall, 1 out of range, 2 spent on an enemy, 3 exploded. */
function endProjectile(w: World, pr: World['projectiles'][number], fate: 0 | 1 | 2 | 3): void {
  w.events.push({
    t: 'projectileEnd',
    id: pr.id,
    owner: pr.owner,
    aim: pr.aimId,
    fate,
    closest: Number.isFinite(pr.minDist) ? pr.minDist : -1,
    lastHit: pr.lastHitId,
  });
}

/** Move projectiles, resolve wall and enemy collisions. */
export function updateProjectiles(w: World, dt: number): void {
  const list = w.projectiles;
  let j = 0;
  for (let i = 0; i < list.length; i++) {
    const pr = list[i];
    let alive = true;
    const steps = 2;
    for (let s = 0; s < steps && alive; s++) {
      pr.x += (pr.vx * dt) / steps;
      pr.y += (pr.vy * dt) / steps;
      pr.travelled += (Math.hypot(pr.vx, pr.vy) * dt) / steps;
      const owner = actorById(w, pr.owner);
      const aim = pr.aimId ? actorById(w, pr.aimId) : undefined;
      if (aim) pr.minDist = Math.min(pr.minDist, Math.hypot(aim.x - pr.x, aim.y - pr.y));
      if (!w.grid.isFloor(Math.floor(pr.x), Math.floor(pr.y))) {
        if (owner?.isPlayer) {
          w.stats.wallBlocked++;
          if (w.t - w.ai.blockedT > BLOCK_WINDOW) w.ai.blocked = 0;
          if (w.ai.blocked === 0) w.ai.blockedT = w.t;
          w.ai.blocked++;
        }
        if (pr.explodeRadius > 0)
          explode(w, owner, pr, pr.x - (pr.vx * dt) / steps, pr.y - (pr.vy * dt) / steps);
        endProjectile(w, pr, 0);
        alive = false;
        break;
      }
      if (pr.travelled >= pr.maxRange) {
        const b = pr.profile.skill.behaviour;
        if (b.kind === 'projectile' && b.returns && !pr.back && owner?.alive) {
          // Turn around and fly back to the owner, hitting everything again on the way.
          const dx = owner.x - pr.x;
          const dy = owner.y - pr.y;
          const d = Math.hypot(dx, dy) || 1;
          const speed = Math.hypot(pr.vx, pr.vy);
          pr.vx = (dx / d) * speed;
          pr.vy = (dy / d) * speed;
          pr.back = true;
          pr.travelled = 0;
          pr.maxRange = d + 1;
          pr.hitIds = [];
          pr.pierceLeft = pr.profile.pierce;
        } else {
          endProjectile(w, pr, 1);
          alive = false;
          break;
        }
      }
      if (pr.back && owner && Math.hypot(owner.x - pr.x, owner.y - pr.y) < 0.8) {
        endProjectile(w, pr, 1);
        alive = false;
        break;
      }
      // Monster projectiles stop at the player's minions as well.
      const na = w.actors.length;
      const nm = pr.faction === 1 ? w.minions.length : 0;
      for (let k = 0; k < na + nm; k++) {
        const e = k < na ? w.actors[k] : w.minions[k - na];
        if (!e.alive || e.faction === pr.faction || pr.hitIds.includes(e.id)) continue;
        const rr = e.r + pr.r;
        const dx = e.x - pr.x;
        const dy = e.y - pr.y;
        if (dx * dx + dy * dy > rr * rr) continue;
        pr.hitIds.push(e.id);
        pr.lastHitId = e.id;
        if (pr.explodeRadius > 0) {
          explode(w, owner, pr, pr.x, pr.y);
          endProjectile(w, pr, 3);
          alive = false;
          break;
        }
        // A Shieldbearer turns away what arrives at its front.
        if (shieldBlocks(w, e, pr.x, pr.y)) {
          w.events.push({ t: 'block', src: pr.owner, dst: e.id });
          endProjectile(w, pr, 2);
          alive = false;
          break;
        }
        if (owner)
          hit(w, owner, e, pr.profile, pr.hand, Math.hypot(e.x - pr.startX, e.y - pr.startY));
        if (pr.pierceLeft > 0) pr.pierceLeft--;
        else {
          endProjectile(w, pr, 2);
          alive = false;
          break;
        }
      }
    }
    if (alive) list[j++] = pr;
  }
  list.length = j;
}
