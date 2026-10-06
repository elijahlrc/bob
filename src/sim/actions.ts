import { angleDiff } from '../core/math';
import { HIT_AT, PROJECTILE_SPEED } from '../data/constants';
import type { SkillProfile } from '../calc/skill';
import { hit } from './combat';
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
    targetId: target.id,
    aimX: target.x,
    aimY: target.y,
  };
  a.carry = 0;
  a.facing = Math.atan2(target.y - a.y, target.x - a.x);
  w.events.push({ t: 'use', src: a.id, skill: p.skill.id });
}

export function actorById(w: World, id: number): Actor | undefined {
  // Actors are stored in id order for monsters spawned at map start; summons append.
  for (const a of w.actors) if (a.id === id) return a;
  return undefined;
}

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
  act.elapsed += dt * (1 - a.ail.chill);
  if (!act.fired && act.elapsed >= HIT_AT * act.duration) {
    act.fired = true;
    fire(w, a, act);
  }
  if (act.elapsed >= act.duration) {
    a.carry = act.elapsed - act.duration;
    a.action = null;
    a.handIdx++;
  }
}

function enemiesOf(w: World, a: Actor): Actor[] {
  if (a.isPlayer) return w.actors.filter((o) => !o.isPlayer && o.alive);
  return w.player.alive ? [w.player] : [];
}

function fire(w: World, a: Actor, act: Action): void {
  const p = act.profile;
  const b = p.skill.behaviour;
  const target = actorById(w, act.targetId);
  if (b.kind === 'melee') {
    if (b.arc) {
      const radius = (b.radius ?? b.range) * p.radiusMult;
      const half = ((b.arc / 2) * Math.PI) / 180;
      for (const e of enemiesOf(w, a)) {
        const d = Math.hypot(e.x - a.x, e.y - a.y);
        if (d > radius + e.r) continue;
        const ang = Math.atan2(e.y - a.y, e.x - a.x);
        if (d > e.r && Math.abs(angleDiff(a.facing, ang)) > half) continue;
        if (p.bothHands) for (let h = 0; h < p.hands.length; h++) hit(w, a, e, p, h, d);
        else hit(w, a, e, p, act.hand, d);
      }
      return;
    }
    if (!target || !target.alive) return;
    const d = Math.hypot(target.x - a.x, target.y - a.y);
    if (d > b.range + target.r + a.r + 0.4) return;
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
    const ang = base + (i - (n - 1) / 2) * step;
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
  if (!owner) return;
  for (const e of w.actors) {
    if (!e.alive || e.faction === pr.faction) continue;
    if (Math.hypot(e.x - x, e.y - y) <= pr.explodeRadius + e.r)
      hit(w, owner, e, pr.profile, pr.hand, Math.hypot(e.x - pr.startX, e.y - pr.startY));
  }
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
      if (!w.grid.isFloor(Math.floor(pr.x), Math.floor(pr.y))) {
        if (pr.explodeRadius > 0)
          explode(w, owner, pr, pr.x - (pr.vx * dt) / steps, pr.y - (pr.vy * dt) / steps);
        alive = false;
        break;
      }
      if (pr.travelled >= pr.maxRange) {
        alive = false;
        break;
      }
      for (const e of w.actors) {
        if (!e.alive || e.faction === pr.faction || pr.hitIds.includes(e.id)) continue;
        const rr = e.r + pr.r;
        const dx = e.x - pr.x;
        const dy = e.y - pr.y;
        if (dx * dx + dy * dy > rr * rr) continue;
        pr.hitIds.push(e.id);
        if (pr.explodeRadius > 0) {
          explode(w, owner, pr, pr.x, pr.y);
          alive = false;
          break;
        }
        if (owner)
          hit(w, owner, e, pr.profile, pr.hand, Math.hypot(e.x - pr.startX, e.y - pr.startY));
        if (pr.pierceLeft > 0) pr.pierceLeft--;
        else {
          alive = false;
          break;
        }
      }
    }
    if (alive) list[j++] = pr;
  }
  list.length = j;
}
