import { skillRange } from '../calc/character';
import {
  ENGAGE_RANGE,
  LEASH_TIME,
  LOOT_RANGE,
  MONSTER_AGGRO,
  PACK_ALERT,
  REPATH_INTERVAL,
  STUCK_TIME,
} from '../data/constants';
import { actorById, startAction } from './actions';
import { monsterConds, playerConds } from './combat';
import type { Actor, World } from './types';

function canAct(a: Actor): boolean {
  return a.alive && !a.action && a.stunT <= 0 && a.ail.freezeT <= 0;
}

/** Move an actor toward a point at its speed, sliding along walls. */
export function step(w: World, a: Actor, dx: number, dy: number, dt: number): void {
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return;
  const speed = a.def.moveSpeed * (1 - a.ail.chill);
  const d = Math.min(len, speed * dt);
  const nx = a.x + (dx / len) * d;
  const ny = a.y + (dy / len) * d;
  const c = w.grid.collide(nx, ny, a.r);
  a.x = c.x;
  a.y = c.y;
  a.moving = true;
}

/** Walk toward a point using direct movement when visible, otherwise A*. */
function moveTo(w: World, a: Actor, tx: number, ty: number, dt: number): void {
  const ai = w.ai;
  if (w.grid.los(a.x, a.y, tx, ty) && clearPath(w, a.x, a.y, tx, ty, a.r)) {
    ai.path = [];
    step(w, a, tx - a.x, ty - a.y, dt);
    return;
  }
  const key = `${Math.floor(tx)},${Math.floor(ty)}`;
  ai.pathT -= dt;
  if (key !== ai.pathKey || ai.pathT <= 0 || ai.path.length === 0) {
    ai.pathKey = key;
    ai.pathT = REPATH_INTERVAL;
    ai.path = w.grid.astar(a.x, a.y, tx, ty) ?? [];
  }
  // Skip ahead to the farthest visible path node (up to a few) for smoother motion.
  while (
    ai.path.length > 1 &&
    w.grid.los(a.x, a.y, ai.path[1].x, ai.path[1].y) &&
    clearPath(w, a.x, a.y, ai.path[1].x, ai.path[1].y, a.r)
  )
    ai.path.shift();
  const next = ai.path[0];
  if (!next) {
    step(w, a, tx - a.x, ty - a.y, dt);
    return;
  }
  if (Math.hypot(next.x - a.x, next.y - a.y) < 0.15) ai.path.shift();
  step(w, a, next.x - a.x, next.y - a.y, dt);
}

/** LOS with clearance: checks parallel rays offset by the radius. */
function clearPath(w: World, x0: number, y0: number, x1: number, y1: number, r: number): boolean {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const ox = (-dy / len) * r * 0.9;
  const oy = (dx / len) * r * 0.9;
  return (
    w.grid.los(x0 + ox, y0 + oy, x1 + ox, y1 + oy) && w.grid.los(x0 - ox, y0 - oy, x1 - ox, y1 - oy)
  );
}

function findTarget(w: World): Actor | null {
  const p = w.player;
  let best: Actor | null = null;
  let bd = Infinity;
  for (const m of w.actors) {
    if (m.isPlayer || !m.alive) continue;
    const d = Math.hypot(m.x - p.x, m.y - p.y);
    if (d > ENGAGE_RANGE) continue;
    if (d > bd + 1e-9) continue;
    if (Math.abs(d - bd) <= 1e-9 && best && m.life >= best.life) continue;
    if (!w.grid.los(p.x, p.y, m.x, m.y)) continue;
    best = m;
    bd = d;
  }
  return best;
}

function chooseSkill(w: World, target: Actor) {
  const p = w.player;
  const conds = playerConds(w, target);
  if (w.primary.usable && w.primary.gemUid !== null) {
    const prof = w.char.profile(w.primary, conds);
    const costLife = w.char.db.flag('skillsCostLife');
    const pool = costLife ? p.life - 1 : p.def.esProtectsMana ? p.mana + p.es : p.mana;
    if (pool >= prof.cost) return { which: 'primary' as const, prof };
  }
  return { which: 'default' as const, prof: w.char.profile(w.char.defaultAttack, conds) };
}

function payCost(w: World, cost: number): void {
  const p = w.player;
  if (cost <= 0) return;
  if (w.char.db.flag('skillsCostLife')) {
    p.life -= cost;
    return;
  }
  if (p.def.esProtectsMana && p.es > 0) {
    const a = Math.min(p.es, cost);
    p.es -= a;
    cost -= a;
  }
  p.mana -= cost;
}

export function playerAI(w: World, dt: number): void {
  const p = w.player;
  const ai = w.ai;
  p.moving = false;
  if (!canAct(p)) return;

  // Engage.
  let target = ai.targetId ? actorById(w, ai.targetId) : undefined;
  if (target && (!target.alive || Math.hypot(target.x - p.x, target.y - p.y) > ENGAGE_RANGE + 3))
    target = undefined;
  ai.scanT -= dt;
  if (!target || ai.scanT <= 0) {
    ai.scanT = 0.1;
    target = findTarget(w) ?? undefined;
  }
  if (target) {
    ai.targetId = target.id;
    ai.mode = 'engage';
    const { which, prof } = chooseSkill(w, target);
    const melee = prof.skill.behaviour.kind === 'melee';
    const reach = skillRange(prof) + target.r + (melee ? p.r : 0);
    const d = Math.hypot(target.x - p.x, target.y - p.y);
    const inRange = d <= reach && (melee || w.grid.los(p.x, p.y, target.x, target.y));
    if (inRange) {
      if (which === 'primary') payCost(w, prof.cost);
      startAction(w, p, which, prof, target);
      return;
    }
    moveTo(w, p, target.x, target.y, dt);
    return;
  }
  ai.targetId = 0;

  // Loot.
  let lootX = 0;
  let lootY = 0;
  let lootD = LOOT_RANGE;
  let lootKind: 'drop' | 'chest' | null = null;
  let lootIdx = -1;
  w.drops.forEach((d, i) => {
    const dd = Math.hypot(d.x - p.x, d.y - p.y);
    if (dd < lootD) {
      lootD = dd;
      lootX = d.x;
      lootY = d.y;
      lootKind = 'drop';
      lootIdx = i;
    }
  });
  w.chests.forEach((c, i) => {
    if (c.opened) return;
    const dd = Math.hypot(c.x - p.x, c.y - p.y);
    if (dd < lootD) {
      lootD = dd;
      lootX = c.x;
      lootY = c.y;
      lootKind = 'chest';
      lootIdx = i;
    }
  });
  if (lootKind) {
    ai.mode = 'loot';
    if (lootD < 0.7) {
      if (lootKind === 'drop') {
        const d = w.drops[lootIdx];
        w.drops.splice(lootIdx, 1);
        w.picked.push(d.item);
        w.stats.picked++;
        w.events.push({ t: 'pickup', id: d.id });
      } else {
        const c = w.chests[lootIdx];
        c.opened = true;
        w.events.push({ t: 'chest', id: c.id });
        for (const item of w.opts.chestLoot?.(w, c) ?? []) {
          const id = w.nextId++;
          w.drops.push({
            id,
            x: c.x + w.rngLoot.float(-0.4, 0.4),
            y: c.y + w.rngLoot.float(-0.4, 0.4),
            item,
          });
          w.events.push({ t: 'drop', id });
        }
      }
      return;
    }
    moveTo(w, p, lootX, lootY, dt);
    return;
  }

  // Exit, or advance along the waypoints.
  const wps = w.plan.lab.waypoints;
  if (ai.wp >= wps.length) {
    if (w.exitOpen) {
      ai.mode = 'exit';
      const ex = w.plan.lab.exit;
      if (Math.hypot(ex.x - p.x, ex.y - p.y) < 0.6) {
        w.status = 'cleared';
        w.events.push({ t: 'cleared' });
        return;
      }
      moveTo(w, p, ex.x, ex.y, dt);
      return;
    }
    // End room not yet clear: hunt the nearest remaining end-room monster.
    let best: Actor | null = null;
    let bd = Infinity;
    for (const m of w.actors) {
      if (m.isPlayer || !m.alive || m.room !== w.endRoom) continue;
      const d = Math.hypot(m.x - p.x, m.y - p.y);
      if (d < bd) {
        bd = d;
        best = m;
      }
    }
    if (best) {
      if (best.state === 'idle') best.state = 'chase';
      moveTo(w, p, best.x, best.y, dt);
    }
    return;
  }
  ai.mode = 'advance';
  const wp = wps[ai.wp];
  if (Math.hypot(wp.x - p.x, wp.y - p.y) < 1) {
    ai.wp++;
    ai.stuckT = 0;
    ai.stuckX = p.x;
    ai.stuckY = p.y;
    return;
  }
  ai.stuckT += dt;
  if (ai.stuckT >= STUCK_TIME) {
    if (Math.hypot(p.x - ai.stuckX, p.y - ai.stuckY) < 1) {
      p.x = wp.x;
      p.y = wp.y;
      ai.wp++;
      w.stats.stuck++;
      w.events.push({ t: 'stuck' });
    }
    ai.stuckT = 0;
    ai.stuckX = p.x;
    ai.stuckY = p.y;
  }
  moveTo(w, p, wp.x, wp.y, dt);
}

function monsterMove(w: World, m: Actor, tx: number, ty: number, dt: number): void {
  const d = Math.hypot(tx - m.x, ty - m.y);
  if (d < 8 && w.grid.los(m.x, m.y, tx, ty)) {
    step(w, m, tx - m.x, ty - m.y, dt);
    return;
  }
  const dir = w.grid.flowDir(m.x, m.y);
  if (dir) step(w, m, dir.x, dir.y, dt);
  else step(w, m, tx - m.x, ty - m.y, dt);
}

export function alertPack(w: World, m: Actor): void {
  for (const o of w.actors) {
    if (o.isPlayer || !o.alive || o.state !== 'idle') continue;
    if (Math.hypot(o.x - m.x, o.y - m.y) <= PACK_ALERT) {
      o.state = 'chase';
      o.lostT = 0;
    }
  }
}

export function monsterAI(w: World, m: Actor, dt: number): void {
  m.moving = false;
  if (m.dummy || !canAct(m)) return;
  const p = w.player;
  if (!p.alive) return;
  const d = Math.hypot(p.x - m.x, p.y - m.y);
  if (m.state === 'idle') {
    m.noticeT -= dt;
    if (m.noticeT > 0) return;
    m.noticeT = 0.25;
    if (d <= MONSTER_AGGRO && w.grid.los(m.x, m.y, p.x, p.y)) {
      m.state = 'chase';
      m.lostT = 0;
      alertPack(w, m);
    }
    return;
  }
  if (m.state === 'leash') {
    if (Math.hypot(m.homeX - m.x, m.homeY - m.y) < 0.5) {
      m.state = 'idle';
      m.life = m.def.maxLife;
      return;
    }
    const path = w.grid.astar(m.x, m.y, m.homeX, m.homeY);
    const n = path?.[0];
    if (n) step(w, m, n.x - m.x, n.y - m.y, dt);
    else step(w, m, m.homeX - m.x, m.homeY - m.y, dt);
    return;
  }
  const los = d < 16 && w.grid.los(m.x, m.y, p.x, p.y);
  if (los) m.lostT = 0;
  else {
    m.lostT += dt;
    if (m.lostT > LEASH_TIME && m.rarity !== 'boss') {
      m.state = 'leash';
      return;
    }
  }
  const prof = m.mon!.profile(monsterConds(m));
  const kind = prof.skill.behaviour.kind;
  const range = m.mon!.range;
  if (kind !== 'melee') {
    if (d < 2) {
      const away = w.grid.collide(m.x - (p.x - m.x), m.y - (p.y - m.y), m.r);
      step(w, m, away.x - m.x, away.y - m.y, dt);
      return;
    }
    if (d <= range && los) {
      startAction(w, m, 'monster', prof, p);
      return;
    }
    monsterMove(w, m, p.x, p.y, dt);
    return;
  }
  if (d <= range + p.r + m.r) {
    startAction(w, m, 'monster', prof, p);
    return;
  }
  monsterMove(w, m, p.x, p.y, dt);
}

/** Soft separation between nearby actors. */
export function separate(w: World): void {
  const list = w.actors;
  const p = w.player;
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (!a.alive || a.isPlayer || a.state === 'idle') continue;
    for (let j = i + 1; j < list.length; j++) {
      const b = list[j];
      if (!b.alive || b.isPlayer) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const rr = a.r + b.r;
      const d2 = dx * dx + dy * dy;
      if (d2 >= rr * rr || d2 < 1e-9) continue;
      const d = Math.sqrt(d2);
      const push = (rr - d) / 2;
      const nx = dx / d;
      const ny = dy / d;
      const ca = w.grid.collide(a.x - nx * push, a.y - ny * push, a.r);
      a.x = ca.x;
      a.y = ca.y;
      const cb = w.grid.collide(b.x + nx * push, b.y + ny * push, b.r);
      b.x = cb.x;
      b.y = cb.y;
    }
    // Player vs monster: the monster yields most of the overlap.
    const dx = a.x - p.x;
    const dy = a.y - p.y;
    const rr = a.r + p.r;
    const d2 = dx * dx + dy * dy;
    if (d2 < rr * rr && d2 > 1e-9) {
      const d = Math.sqrt(d2);
      const push = rr - d;
      const ca = w.grid.collide(a.x + (dx / d) * push * 0.8, a.y + (dy / d) * push * 0.8, a.r);
      a.x = ca.x;
      a.y = ca.y;
      const cp = w.grid.collide(p.x - (dx / d) * push * 0.2, p.y - (dy / d) * push * 0.2, p.r);
      p.x = cp.x;
      p.y = cp.y;
    }
  }
}
