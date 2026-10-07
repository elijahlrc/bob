import { levelValue } from '../calc/gems';
import type { SkillChoice } from '../calc/character';
import { minionBody } from '../calc/minion';
import type { SkillProfile } from '../calc/skill';
import { spellBaseDamage } from '../data/constants';
import { MINIONS, MINION_ENEMY_RES, type MinionId } from '../data/minions';
import { DAMAGE_TYPES } from '../mods/types';
import { newActor } from './actor';
import { rawHit, tickActor } from './combat';
import type { Actor, World } from './types';

/**
 * Minions in the sim (COVERAGE C6, made mortal afterwards): see src/data/minions.ts. A minion is an actor of the
 * player's side that is kept in `w.minions`, not in `w.actors`: it has life and defences, and enemy attacks, projectiles
 * and area effects can hit and kill it. It follows the player, runs at the nearest enemy and strikes it; a time-limited
 * one ends when its time is up, and a fallen one is summoned again when the skill is cast again.
 */
export type Minion = Actor & {
  /** The summoning skill (its choice key). */
  key: string;
  kind: MinionId;
  /** Seconds left; Infinity until the map ends. */
  t: number;
  atkT: number;
  /** The summoning gem's level, and the multipliers of the minion modifiers when it was summoned. */
  level: number;
  dmg: number;
  speed: number;
};

const SEEK = 14;
const FOLLOW = 3.5;
const TELEPORT = 20;

export function minionCount(w: World, key: string): number {
  let n = 0;
  for (const m of w.minions) if (m.key === key && m.alive) n++;
  return n;
}

/** How many minions a summon skill keeps standing. */
export function summonCount(c: SkillChoice, prof: SkillProfile): number {
  const u = c.skill.utility;
  if (u?.kind !== 'summon') return 0;
  return Math.max(1, Math.round(levelValue(u.count, c.skill.level)) + prof.minionCount);
}

/** Seconds a summon skill waits after a cast before it can be cast again. */
export function summonRespawn(c: SkillChoice): number {
  const u = c.skill.utility;
  return u?.kind === 'summon' ? MINIONS[u.minion].respawn : 1;
}

/** The summon lands: the skill's minions that stand are renewed, and new ones fill the places of those that fell. */
export function summonMinions(w: World, c: SkillChoice, prof: SkillProfile): void {
  const u = c.skill.utility;
  if (u?.kind !== 'summon') return;
  const n = summonCount(c, prof);
  const have = minionCount(w, c.key);
  for (const m of w.minions) if (m.key === c.key && m.alive) m.t = u.seconds ?? Infinity;
  const p = w.player;
  const def = MINIONS[u.minion];
  const body = minionBody(
    u.minion,
    w.plan.areaLevel,
    prof.minionLife,
    prof.minionTaken,
    prof.minionRegen,
  );
  for (let i = have; i < n; i++) {
    const ang = (i / n) * Math.PI * 2;
    const spot = w.grid.collide(p.x + Math.cos(ang) * 1.2, p.y + Math.sin(ang) * 1.2, def.r);
    const m = newActor(w.nextId++, false, spot.x, spot.y, def.r) as Minion;
    m.faction = 0;
    m.def = body.def;
    m.life = body.life;
    m.name = def.name;
    m.rarity = 'normal';
    m.noReward = true;
    // Always awake, so nothing treats it as a sleeping monster.
    m.state = 'chase';
    m.key = c.key;
    m.kind = u.minion;
    m.t = u.seconds ?? Infinity;
    m.atkT = 0;
    m.level = c.skill.level;
    m.dmg = prof.minionDamage;
    m.speed = prof.minionSpeed;
    w.minions.push(m);
    w.events.push({ t: 'summon', id: m.id });
  }
}

function step(w: World, m: Minion, tx: number, ty: number, dt: number, speed: number): void {
  const d = Math.hypot(tx - m.x, ty - m.y);
  if (d < 1e-6 || speed <= 0) return;
  const len = Math.min(d, speed * dt);
  const spot = w.grid.collide(m.x + ((tx - m.x) / d) * len, m.y + ((ty - m.y) / d) * len, m.r);
  m.x = spot.x;
  m.y = spot.y;
  m.moving = true;
}

export function tickMinions(w: World, dt: number): void {
  if (w.minions.length === 0) return;
  const p = w.player;
  const foes = w.actors.filter(
    (e) => !e.isPlayer && e.alive && e.phaseT <= 0 && e.state !== 'idle',
  );
  let j = 0;
  for (const m of w.minions) {
    m.t -= dt;
    if (!m.alive || m.t <= 0) continue;
    // Damage over time, regeneration and ailment timers.
    tickActor(w, m, dt);
    if (!m.alive) continue;
    w.minions[j++] = m;
    const def = MINIONS[m.kind];
    m.moving = false;
    m.atkT -= dt;
    if (Math.hypot(p.x - m.x, p.y - m.y) > TELEPORT) {
      m.x = p.x;
      m.y = p.y;
    }
    // A stunned or frozen minion does nothing; a chilled one is slow.
    if (m.stunT > 0 || m.ail.freezeT > 0) continue;
    let best = null as (typeof foes)[number] | null;
    let bd = SEEK;
    for (const e of foes) {
      const d = Math.hypot(e.x - m.x, e.y - m.y);
      if (d < bd) {
        best = e;
        bd = d;
      }
    }
    const speed = def.speed * m.speed * (1 - m.ail.chill);
    if (!best) {
      if (Math.hypot(p.x - m.x, p.y - m.y) > FOLLOW) step(w, m, p.x, p.y, dt, speed);
      continue;
    }
    m.facing = Math.atan2(best.y - m.y, best.x - m.x);
    if (bd > def.reach + best.r) {
      step(w, m, best.x, best.y, dt, speed);
      continue;
    }
    if (m.atkT > 0 || def.dmg <= 0) continue;
    m.atkT = 1 / (def.rate * m.speed * (1 - m.ail.chill));
    const hit = spellBaseDamage(m.level) * def.dmg * m.dmg * MINION_ENEMY_RES;
    const t = DAMAGE_TYPES.indexOf(def.dtype);
    rawHit(w, best, hit, t, 'Minion');
    if (def.splash > 0)
      for (const e of foes)
        if (e !== best && e.alive && Math.hypot(e.x - best.x, e.y - best.y) <= def.splash + e.r)
          rawHit(w, e, hit * 0.5, t, 'Minion');
  }
  w.minions.length = j;
}
