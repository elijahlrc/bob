import { abilitiesOf } from '../data/abilities';
import { skillRange, type SkillChoice } from '../calc/character';
import type { Defence } from '../calc/combat';
import type { SkillProfile } from '../calc/skill';
import {
  ENGAGE_RANGE,
  BLOCK_LIMIT,
  BLOCK_WINDOW,
  LEASH_TIME,
  LOOT_RANGE,
  AMBUSH_RANGE,
  MONSTER_AGGRO,
  PATROL_SPEED,
  PACK_ALERT,
  REPATH_INTERVAL,
  REPOSITION_DIST,
  REPOSITION_TIME,
  RETREAT_COOLDOWN,
  RETREAT_TIME,
  SKIP_TIME,
  STALL_TIME,
  STUCK_TIME,
} from '../data/constants';
import { MONSTER_TYPES } from '../data/monsters';
import { actorById, startAction } from './actions';
import { bloaterBurst, corpseNear, isZone, moveMult } from './factions';
import { flaskMask, monsterConds, playerConds } from './combat';
import { hasChargesToSpend, offCooldown, skillReady, useSkill } from './cooldowns';
import { canPay, payCost } from './cost';
import { deployFull } from './deploy';
import { inTelegraph, telegraphs } from './telegraph';
import {
  afterBlow,
  revealed,
  senseOf,
  steer,
  targetOf,
  whileStunned,
  withdrawing,
} from './movement';
import { running } from './blinks';
import { chooseUtility, contactRange } from './utility';
import type { Actor, World } from './types';

function canAct(a: Actor): boolean {
  return a.alive && !a.action && a.stunT <= 0 && a.ail.freezeT <= 0;
}

/** Move an actor toward a point at its speed, sliding along walls. */
export function step(w: World, a: Actor, dx: number, dy: number, dt: number): void {
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return;
  const speed = a.def.moveSpeed * (1 - a.ail.chill) * moveMult(a);
  const d = Math.min(len, speed * dt);
  const nx = a.x + (dx / len) * d;
  const ny = a.y + (dy / len) * d;
  // Fliers cross walls; they only stay inside the map.
  const c =
    a.flies || a.phases
      ? {
          x: Math.max(0.5, Math.min(w.grid.w - 0.5, nx)),
          y: Math.max(0.5, Math.min(w.grid.h - 0.5, ny)),
        }
      : w.grid.collide(nx, ny, a.r);
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

/** Seconds the player will chase one drop or chest before it gives up on it. */
const LOOT_GIVE_UP = 20;

/** Types the player shoots first when they are within reach (EXPANSION 5.9). */
const SUPPORT_TYPES = new Set(['nest', 'pylon']);
const SUPPORT_PRIORITY = 4;

function findTarget(w: World): Actor | null {
  const p = w.player;
  let best: Actor | null = null;
  let bd = Infinity;
  for (const m of w.actors) {
    if (m.isPlayer || !m.alive || m.phaseT > 0) continue;
    if (m.id === w.ai.skipId && w.t < w.ai.skipUntil) continue;
    const real = Math.hypot(m.x - p.x, m.y - p.y);
    if (real > ENGAGE_RANGE) continue;
    // Spawners and shield-givers come first: a nest feeds the pack and a pylon makes it untouchable.
    if (!revealed(w, m)) continue;
    const support = !!m.mon && SUPPORT_TYPES.has(m.mon.spec.type);
    const d = real - (support ? SUPPORT_PRIORITY : 0);
    if (d > bd + 1e-9) continue;
    if (Math.abs(d - bd) <= 1e-9 && best && m.life >= best.life) continue;
    // Out of sight is no reason to ignore a pylon: everything around it is untouchable until it falls.
    if (!support && !w.grid.los(p.x, p.y, m.x, m.y)) continue;
    if (support && m.mon!.spec.type === 'nest' && !w.grid.los(p.x, p.y, m.x, m.y)) continue;
    best = m;
    bd = d;
  }
  return best;
}

/** A debuff that is renewed, not stacked, is cast again when it is about to end, not while it holds (Contagion). */
function alreadyAfflicted(p: SkillProfile, target: Actor): boolean {
  const sd = p.skillDot;
  if (!sd || sd.spec.stack !== 'refresh' || !sd.spec.hitless) return false;
  return target.sdots.some((d) => d.src === p.skill.id && d.t > 0.8);
}

/** A skill that needs a corpse waits for one near the target, in reach of the character. */
function corpseReady(w: World, p: SkillProfile, target: Actor): boolean {
  if (!p.skill.needsCorpse) return true;
  const pl = w.player;
  const c = corpseNear(w, target.x, target.y, 6);
  return !!c && Math.hypot(c.x - pl.x, c.y - pl.y) <= skillRange(p) + 2;
}

/** Whether a skill can hurt a target at all: some of its damage is of a type the target is not immune to. */
export function canHurt(p: SkillProfile, def: Defence): boolean {
  const sd = p.skillDot;
  if (sd && !def.immune[sd.type] && !(sd.type === 4 && def.immuneChaos)) return true;
  return p.hands.some((h) =>
    h.chunks.some((c) => c.max > 0 && !def.immune[c.type] && !(c.type === 4 && def.immuneChaos)),
  );
}

/** Whether the player, from where it stands, can use a skill on the target. */
function inReach(w: World, prof: SkillProfile, target: Actor): boolean {
  const p = w.player;
  const melee = prof.skill.behaviour.kind === 'melee';
  const reach = skillRange(prof) + target.r + (melee ? p.r : 0);
  const d = Math.hypot(target.x - p.x, target.y - p.y);
  return d <= reach && (melee || w.grid.los(p.x, p.y, target.x, target.y));
}

function chooseSkill(w: World, target: Actor) {
  const conds = playerConds(w, target);
  // Secondary casts first (EXPANSION 5.5a): the ready one with the longest cooldown.
  let second: {
    prof: SkillProfile;
    costsLife: boolean;
    key: string;
    cd: number;
    choice: SkillChoice;
  } | null = null;
  for (const c of w.char.secondaries) {
    // A skill with a cooldown of its own waits for a use (or the charges that stand in for one).
    if (!hasChargesToSpend(w, c)) continue;
    if (c.skill.cooldown !== undefined ? !offCooldown(w, c) : (w.secondaryReady[c.key] ?? 0) > w.t)
      continue;
    const prof = w.char.profile(c, conds, flaskMask(w));
    if (!canHurt(prof, target.def) || !canPay(w, c.costsLife, prof.cost)) continue;
    if (deployFull(w, c, prof) || !inReach(w, prof, target) || !corpseReady(w, prof, target))
      continue;
    const cd = w.char.cooldownOf(c, conds);
    if (!second || cd > second.cd)
      second = { prof, costsLife: c.costsLife, key: c.key, cd, choice: c };
  }
  if (second) return { which: 'secondary' as const, ...second };
  if (w.primary.usable && w.primary.gemUid !== null && skillReady(w, w.primary)) {
    const prof = w.char.profile(w.primary, conds, flaskMask(w));
    // Against a target immune to everything the skill deals, fall back to the weapon.
    if (
      canHurt(prof, target.def) &&
      !alreadyAfflicted(prof, target) &&
      corpseReady(w, prof, target) &&
      canPay(w, w.primary.costsLife, prof.cost) &&
      !deployFull(w, w.primary, prof)
    )
      return {
        which: 'primary' as const,
        prof,
        costsLife: w.primary.costsLife,
        key: '',
        cd: 0,
        choice: w.primary,
      };
  }
  return {
    which: 'default' as const,
    prof: w.char.profile(w.char.defaultAttack, conds, flaskMask(w)),
    costsLife: false,
    key: '',
    cd: 0,
    choice: w.char.defaultAttack,
  };
}

/**
 * A lasting zone, a blast about to land or a monster's area attack winding up that covers a point, if any (with a margin in
 * tiles). The warnings of docs/ROSTER.md 5.3 (a wedge, a ring, a lane) count as much as a ground effect.
 */
export function hazardAt(
  w: World,
  x: number,
  y: number,
  margin = 0,
): { x: number; y: number; radius: number } | null {
  for (const e of w.effects) {
    const lands = !isZone(e) && e.faction === 1 && e.t > 0;
    if ((isZone(e) || lands) && Math.hypot(x - e.x, y - e.y) <= e.radius + margin) return e;
  }
  for (const t of telegraphs(w))
    if (inTelegraph(t, x, y, margin))
      return { x: t.x, y: t.y, radius: 'radius' in t ? t.radius : t.width / 2 };
  return null;
}

/**
 * Step out of a hazard (EXPANSION 5.8): the nearest clear spot, but only one from which the target is still in
 * reach, so the player never walks out of the fight. Returns whether it moved.
 */
function avoidHazard(w: World, dt: number): boolean {
  const p = w.player;
  if (!hazardAt(w, p.x, p.y, p.r)) return false;
  const target = w.ai.targetId ? actorById(w, w.ai.targetId) : undefined;
  const prof = w.primary.usable
    ? w.char.profile(w.primary, 0)
    : w.char.profile(w.char.defaultAttack, 0);
  const melee = prof.skill.behaviour.kind === 'melee';
  const reach = skillRange(prof) + (target ? target.r : 0) + (melee ? p.r : 0);
  let best: { x: number; y: number; d: number } | null = null;
  for (let k = 0; k < 16; k++) {
    const ang = (k / 16) * Math.PI * 2;
    for (const len of [1.5, 2.5, 3.5]) {
      const c = w.grid.collide(p.x + Math.cos(ang) * len, p.y + Math.sin(ang) * len, p.r);
      if (Math.hypot(c.x - p.x, c.y - p.y) < len - 0.2) continue;
      if (hazardAt(w, c.x, c.y, p.r + 0.3) || !w.grid.los(p.x, p.y, c.x, c.y)) continue;
      if (target && target.alive) {
        const d = Math.hypot(target.x - c.x, target.y - c.y);
        if (d > reach || (!melee && !w.grid.los(c.x, c.y, target.x, target.y))) continue;
      }
      if (!best || len < best.d) best = { x: c.x, y: c.y, d: len };
      break;
    }
  }
  if (!best) return false;
  moveTo(w, p, best.x, best.y, dt);
  return true;
}

export function playerAI(w: World, dt: number): void {
  const p = w.player;
  const ai = w.ai;
  p.moving = false;
  if (!canAct(p)) return;
  if (avoidHazard(w, dt)) return;

  // Engage.
  let target = ai.targetId ? actorById(w, ai.targetId) : undefined;
  if (target && (!target.alive || Math.hypot(target.x - p.x, target.y - p.y) > ENGAGE_RANGE + 3))
    target = undefined;
  ai.scanT -= dt;
  if (!target || ai.scanT <= 0) {
    ai.scanT = 0.1;
    target = findTarget(w) ?? undefined;
  }
  if (target && target.id === ai.skipId && w.t < ai.skipUntil) target = undefined;
  // Withering Step and Phase Run are run in: no attack until they are over (a skill used would end them).
  if (target && running(w)) target = undefined;
  if (target) {
    // Stall breaker: a target that takes no damage for a long time is dropped for a while, so the
    // run moves on (and the monster, if it is chasing, comes to the player instead).
    if (ai.watchId !== target.id || target.life < ai.watchLife - 1e-6) {
      ai.watchId = target.id;
      ai.watchLife = target.life;
      ai.watchT = w.t;
    } else if (w.t - ai.watchT > STALL_TIME) {
      ai.skipId = target.id;
      ai.skipUntil = w.t + SKIP_TIME;
      ai.watchId = 0;
      ai.targetId = 0;
      w.stats.stalls++;
      w.events.push({ t: 'stall', id: target.id });
      return;
    }
    ai.targetId = target.id;
    ai.mode = 'engage';
    const util = chooseUtility(w, target);
    if (util) {
      payCost(w, util.choice.costsLife, util.prof.cost);
      w.utilityReady[util.choice.key] = w.t + util.cd;
      useSkill(w, util.choice);
      startAction(w, p, 'utility', util.prof, target);
      return;
    }
    const { which, prof, costsLife, key, cd, choice } = chooseSkill(w, target);
    const melee = prof.skill.behaviour.kind === 'melee';
    // A burning aura or circling blades only reach what is close: walk in among the enemies, whatever the attack's range.
    const contact = contactRange(w);
    const reach0 = skillRange(prof) + target.r + (melee ? p.r : 0);
    const reach = contact > 0 ? Math.min(reach0, contact + target.r) : reach0;
    const d = Math.hypot(target.x - p.x, target.y - p.y);
    const inRange = d <= reach && (melee || w.grid.los(p.x, p.y, target.x, target.y));
    // Arrows keep hitting walls (a wide fan in a narrow corridor): close in for a clearer shot.
    if (!melee && ai.repoT <= 0 && ai.blocked >= BLOCK_LIMIT && w.t - ai.blockedT <= BLOCK_WINDOW) {
      ai.repoT = REPOSITION_TIME;
      ai.blocked = 0;
    }
    if (ai.repoT > 0) {
      ai.repoT -= dt;
      if (d > REPOSITION_DIST) {
        moveTo(w, p, target.x, target.y, dt);
        return;
      }
    }
    if (inRange) {
      if (which === 'primary' || which === 'secondary') payCost(w, costsLife, prof.cost);
      if (which === 'secondary' && choice.skill.cooldown === undefined)
        w.secondaryReady[key] = w.t + cd;
      if (which === 'primary' || which === 'secondary') useSkill(w, choice);
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
  // A hunt for something that cannot be reached is given up after a while, rather than for ever.
  if (lootKind) {
    const id = lootKind === 'drop' ? w.drops[lootIdx].id : w.chests[lootIdx].id;
    if (ai.lootId !== id) {
      ai.lootId = id;
      ai.lootSince = w.t;
    } else if (w.t - ai.lootSince > LOOT_GIVE_UP) {
      if (lootKind === 'drop') w.drops.splice(lootIdx, 1);
      else w.chests[lootIdx].opened = true;
      ai.lootId = 0;
      lootKind = null;
    }
  }
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
      // A Quarry's champions count wherever they stand.
      const hunted = m.room === w.endRoom || (w.plan.type === 'quarry' && m.rarity === 'miniboss');
      if (m.isPlayer || !m.alive || !hunted) continue;
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
  if (m.stationary) return;
  const d = Math.hypot(tx - m.x, ty - m.y);
  if (m.flies || m.phases) {
    // Straight at the target, weaving from side to side.
    const wob = Math.sin(w.t * 5 + m.id) * 0.7;
    const dx = tx - m.x;
    const dy = ty - m.y;
    step(w, m, dx - dy * wob * 0.5, dy + dx * wob * 0.5, dt);
    return;
  }
  if (d < 8 && w.grid.los(m.x, m.y, tx, ty)) {
    step(w, m, tx - m.x, ty - m.y, dt);
    return;
  }
  const dir = w.grid.flowDir(m.x, m.y);
  if (dir) step(w, m, dir.x, dir.y, dt);
  else step(w, m, tx - m.x, ty - m.y, dt);
}

export function alertPack(w: World, m: Actor): void {
  const reach = (m.mon && senseOf(m).alert) ?? PACK_ALERT;
  for (const o of w.actors) {
    if (o.isPlayer || !o.alive || o.state !== 'idle') continue;
    if (Math.hypot(o.x - m.x, o.y - m.y) <= reach) {
      o.state = 'chase';
      o.hold = false;
      o.lostT = 0;
    }
  }
}

/** Seconds a chasing monster must be held up before it turns on a minion in its way. */
const BLOCKED_TIME = 0.35;

/** The nearest standing minion a melee monster can strike from where it stands. */
function minionInReach(w: World, m: Actor, range: number): Actor | null {
  let best: Actor | null = null;
  let bd = Infinity;
  for (const v of w.minions) {
    if (!v.alive) continue;
    const d = Math.hypot(v.x - m.x, v.y - m.y);
    if (d <= range + v.r + m.r && d < bd) {
      best = v;
      bd = d;
    }
  }
  return best;
}

/** The nearest standing minion a ranged monster can shoot at: in range and in sight. */
function minionInSight(w: World, m: Actor, range: number): Actor | null {
  let best: Actor | null = null;
  let bd = Infinity;
  for (const v of w.minions) {
    if (!v.alive) continue;
    const d = Math.hypot(v.x - m.x, v.y - m.y);
    if (d <= range && d < bd && w.grid.los(m.x, m.y, v.x, v.y)) {
      best = v;
      bd = d;
    }
  }
  return best;
}

/**
 * Walk toward the player, noting whether it gets anywhere. A monster that keeps trying to walk and barely moves is held
 * up (by the minions, or by the crowd around it); `blockT` counts the seconds.
 */
function chaseStep(w: World, m: Actor, tx: number, ty: number, dt: number, pace = 1): void {
  if (m.tryTick === w.tick - 1) {
    const moved = Math.hypot(m.x - m.prevX, m.y - m.prevY);
    const want = m.def.moveSpeed * (1 - m.ail.chill) * moveMult(m) * dt * pace;
    if (moved < want * 0.4) m.blockT += dt;
    else m.blockT = Math.max(0, m.blockT - 2 * dt);
  }
  m.tryTick = w.tick;
  m.prevX = m.x;
  m.prevY = m.y;
  monsterMove(w, m, tx, ty, dt * pace);
}

/** A patrol walks from one of its two points to the other and back, slowly, until it notices the character. */
function patrolStep(w: World, m: Actor, dt: number): void {
  const to = m.patrol![m.patrolI];
  if (Math.hypot(to.x - m.x, to.y - m.y) < 1.2) {
    m.patrolI = 1 - m.patrolI;
    m.pathT = 0;
    return;
  }
  m.pathT -= dt;
  if (m.pathT <= 0) {
    m.pathT = 0.4;
    const n = w.grid.astar(m.x, m.y, to.x, to.y)?.[0];
    m.nextX = n ? n.x : to.x;
    m.nextY = n ? n.y : to.y;
  }
  step(w, m, m.nextX - m.x, m.nextY - m.y, dt * PATROL_SPEED);
}

export function monsterAI(w: World, m: Actor, dt: number): void {
  m.moving = false;
  if (m.dummy) return;
  whileStunned(m);
  if (!canAct(m)) return;
  // A Gloomstalker stands still while its blink gathers.
  if (m.blinkT > 0 || m.phaseT > 0 || m.channelT > 0 || m.windT > 0 || m.dashT > 0) return;
  const p = w.player;
  if (!p.alive) return;
  const d = Math.hypot(p.x - m.x, p.y - m.y);
  if (m.state === 'idle') {
    // An ambush lies still until the character is close, wherever the character is looking.
    if (m.hold) {
      if (d <= AMBUSH_RANGE) {
        m.hold = false;
        m.state = 'chase';
        m.lostT = 0;
        alertPack(w, m);
      }
      return;
    }
    m.noticeT -= dt;
    if (m.noticeT <= 0) {
      m.noticeT = 0.25;
      // Phase Run halves how far the character is noticed from.
      const seen = (senseOf(m).aggro ?? MONSTER_AGGRO) * (w.buffT.phaseRun > 0 ? 0.5 : 1);
      if (d <= seen && w.grid.los(m.x, m.y, p.x, p.y)) {
        m.state = 'chase';
        m.lostT = 0;
        alertPack(w, m);
        return;
      }
    }
    if (m.patrol && !m.stationary) patrolStep(w, m, dt);
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
    // Some give up sooner, and a hunter never does (a leash of nought).
    const leash = senseOf(m).leash ?? LEASH_TIME;
    if (leash > 0 && m.lostT > leash && m.rarity !== 'boss') {
      m.state = 'leash';
      return;
    }
  }
  // A thief that has taken something runs from the character with it.
  if (m.fleeT > 0) {
    m.fleeT -= dt;
    const away = w.grid.collide(m.x - (p.x - m.x), m.y - (p.y - m.y), m.r);
    step(w, m, away.x - m.x, away.y - m.y, dt);
    return;
  }
  // Nests and pylons do nothing but what the faction code gives them.
  if (MONSTER_TYPES[m.mon!.spec.type].noAttack) return;
  const prof = m.mon!.profile(monsterConds(m));
  const range = m.mon!.range;
  // Whom it goes for: the character, or (a hunter) its minions first.
  const tg = targetOf(w, m);
  const dtg = tg === p ? d : Math.hypot(tg.x - m.x, tg.y - m.y);
  const tlos = tg === p ? los : w.grid.los(m.x, m.y, tg.x, tg.y);
  // A monster that has struck and is withdrawing, or hiding behind a wall, does not strike until it has had its time.
  afterBlow(w, m, tg);
  if (withdrawing(m)) {
    const s = steer(w, m, tg, dtg, dt);
    if (s) chaseStep(w, m, s.x, s.y, dt, s.pace);
    return;
  }
  // Whether it fights at arm's length is the type's, not its shape's: a Sentinel's nova is still a melee blow.
  if (MONSTER_TYPES[m.mon!.spec.type].attack !== 'melee') {
    if (m.stationary) {
      if (d <= range && los) startAction(w, m, 'monster', prof, p);
      else {
        // It cannot reach the player: a minion in sight will do.
        const v = w.minions.length > 0 ? minionInSight(w, m, range) : null;
        if (v) startAction(w, m, 'monster', prof, v);
      }
      return;
    }
    // Retreat when crowded: short half-speed bursts with a cooldown, so they don't kite forever. A kiter (a Slinger, a
    // Handler) backs off sooner, faster and more often.
    const kites = abilitiesOf(m.mon!.spec.type).some((a) => a.id === 'kite');
    m.retreatCd -= dt;
    if (d < (kites ? 4.5 : 2) && m.retreatT <= 0 && m.retreatCd <= 0) {
      m.retreatT = kites ? RETREAT_TIME * 1.5 : RETREAT_TIME;
      m.retreatCd = kites ? 1.2 : RETREAT_COOLDOWN;
    }
    if (m.retreatT > 0) {
      m.retreatT -= dt;
      const away = w.grid.collide(m.x - (p.x - m.x), m.y - (p.y - m.y), m.r);
      step(w, m, away.x - m.x, away.y - m.y, dt * (kites ? 0.8 : 0.5));
      return;
    }
    if (dtg <= range && tlos) {
      startAction(w, m, 'monster', prof, tg);
      return;
    }
    // It cannot hit the player from here: a minion in range and in sight is shot instead.
    const v = w.minions.length > 0 ? minionInSight(w, m, range) : null;
    if (v) {
      startAction(w, m, 'monster', prof, v);
      return;
    }
    const s = steer(w, m, tg, dtg, dt);
    if (s) chaseStep(w, m, s.x, s.y, dt, s.pace);
    return;
  }
  if (dtg <= range + tg.r + m.r) {
    m.blockT = 0;
    // A Bloater does not strike: it bursts on contact.
    if (m.mon!.spec.type === 'bloater') bloaterBurst(w, m);
    else startAction(w, m, 'monster', prof, tg);
    return;
  }
  // Held up on the way to the player (by minions, say): whatever minion is in reach gets hit instead.
  if (m.blockT >= BLOCKED_TIME && w.minions.length > 0) {
    const v = minionInReach(w, m, range);
    if (v) {
      startAction(w, m, 'monster', prof, v);
      return;
    }
  }
  const s = steer(w, m, tg, dtg, dt);
  if (s) chaseStep(w, m, s.x, s.y, dt, s.pace);
}

/** No two actors can touch from further apart than this (the largest radius, a boss, twice over). */
const MAX_ACTOR_REACH = 2;

/** Soft separation between nearby actors. */
export function separate(w: World): void {
  const p = w.player;
  // Dead actors stay in the world's list, so look only at the living (a big map has hundreds of the dead).
  const list: Actor[] = [];
  for (const m of w.actors) if (m.alive && !m.isPlayer) list.push(m);
  // Sorted by x, the inner loop can stop as soon as the next actor is too far to the right to touch.
  list.sort((a, b) => a.x - b.x);
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (a.state === 'idle' || a.stationary) continue;
    for (let j = i + 1; j < list.length; j++) {
      const b = list[j];
      const dx = b.x - a.x;
      const rr = a.r + b.r;
      if (dx > MAX_ACTOR_REACH) break;
      const dy = b.y - a.y;
      if (dy > rr || dy < -rr || dx > rr) continue;
      const d2 = dx * dx + dy * dy;
      if (d2 >= rr * rr || d2 < 1e-9) continue;
      const d = Math.sqrt(d2);
      // A stationary monster does not budge: the other one gives way entirely.
      const push = b.stationary ? rr - d : (rr - d) / 2;
      const nx = dx / d;
      const ny = dy / d;
      // Away from the walls (nearly everywhere) a push needs no wall check.
      const ax = a.x - nx * push;
      const ay = a.y - ny * push;
      if (w.grid.clear(ax, ay)) {
        a.x = ax;
        a.y = ay;
      } else {
        const ca = w.grid.collide(ax, ay, a.r);
        a.x = ca.x;
        a.y = ca.y;
      }
      if (!b.stationary) {
        const bx = b.x + nx * push;
        const by = b.y + ny * push;
        if (w.grid.clear(bx, by)) {
          b.x = bx;
          b.y = by;
        } else {
          const cb = w.grid.collide(bx, by, b.r);
          b.x = cb.x;
          b.y = cb.y;
        }
      }
    }
    // Player vs monster: the monster yields most of the overlap; under Phase Run the character passes through.
    if (w.buffT.phaseRun > 0) continue;
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
  if (w.minions.length > 0) separateMinions(w, list);
}

/**
 * Minions are bodies like any other: monsters cannot walk through them, so they hold a corridor and draw blows. A
 * monster that is awake and free to move gives way half; one that sleeps or never moves gives none, and the minion
 * yields instead. The player pushes minions aside.
 */
function separateMinions(w: World, list: Actor[]): void {
  const p = w.player;
  const ms = w.minions;
  const nudge = (a: Actor, dx: number, dy: number): void => {
    const x = a.x + dx;
    const y = a.y + dy;
    if (w.grid.clear(x, y)) {
      a.x = x;
      a.y = y;
    } else {
      const c = w.grid.collide(x, y, a.r);
      a.x = c.x;
      a.y = c.y;
    }
  };
  for (let i = 0; i < ms.length; i++) {
    const m = ms[i];
    if (!m.alive) continue;
    for (const a of list) {
      const dx = a.x - m.x;
      const rr = a.r + m.r;
      if (dx > rr || dx < -rr) continue;
      const dy = a.y - m.y;
      if (dy > rr || dy < -rr) continue;
      const d2 = dx * dx + dy * dy;
      if (d2 >= rr * rr || d2 < 1e-9) continue;
      const d = Math.sqrt(d2);
      const gap = rr - d;
      const holds = a.state === 'idle' || a.stationary;
      const nx = dx / d;
      const ny = dy / d;
      nudge(m, -nx * (holds ? gap : gap / 2), -ny * (holds ? gap : gap / 2));
      if (!holds) nudge(a, nx * (gap / 2), ny * (gap / 2));
    }
    for (let j = i + 1; j < ms.length; j++) {
      const o = ms[j];
      if (!o.alive) continue;
      const dx = o.x - m.x;
      const dy = o.y - m.y;
      const rr = o.r + m.r;
      const d2 = dx * dx + dy * dy;
      if (d2 >= rr * rr || d2 < 1e-9) continue;
      const d = Math.sqrt(d2);
      const half = (rr - d) / 2;
      nudge(m, (-dx / d) * half, (-dy / d) * half);
      nudge(o, (dx / d) * half, (dy / d) * half);
    }
    const dx = m.x - p.x;
    const dy = m.y - p.y;
    const rr = m.r + p.r;
    const d2 = dx * dx + dy * dy;
    if (d2 < rr * rr && d2 > 1e-9) {
      const d = Math.sqrt(d2);
      nudge(m, (dx / d) * (rr - d), (dy / d) * (rr - d));
    }
  }
}
