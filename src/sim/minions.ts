import { levelValue } from '../calc/gems';
import type { SkillChoice } from '../calc/character';
import type { SkillProfile } from '../calc/skill';
import { spellBaseDamage } from '../data/constants';
import { MINIONS, MINION_ENEMY_RES, type MinionId } from '../data/minions';
import { DAMAGE_TYPES } from '../mods/types';
import { rawHit } from './combat';
import type { World } from './types';

/**
 * Minions in the sim (COVERAGE C6): see src/data/minions.ts. A minion follows the player, runs at the nearest enemy
 * and strikes it; a time-limited one ends when its time is up. Nothing hurts them.
 */
export type Minion = {
  id: number;
  /** The summoning skill (its choice key). */
  key: string;
  kind: MinionId;
  x: number;
  y: number;
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
const MINION_R = 0.3;

export function minionCount(w: World, key: string): number {
  let n = 0;
  for (const m of w.minions) if (m.key === key) n++;
  return n;
}

/** How many minions a summon skill keeps standing. */
export function summonCount(c: SkillChoice, prof: SkillProfile): number {
  const u = c.skill.utility;
  if (u?.kind !== 'summon') return 0;
  return Math.max(1, Math.round(levelValue(u.count, c.skill.level)) + prof.minionCount);
}

/** The summon lands: the skill's minions replace any it already has. */
export function summonMinions(w: World, c: SkillChoice, prof: SkillProfile): void {
  const u = c.skill.utility;
  if (u?.kind !== 'summon') return;
  w.minions = w.minions.filter((m) => m.key !== c.key);
  const n = summonCount(c, prof);
  const p = w.player;
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2;
    const spot = w.grid.collide(p.x + Math.cos(ang) * 1.2, p.y + Math.sin(ang) * 1.2, MINION_R);
    w.minions.push({
      id: ++w.minionSeq,
      key: c.key,
      kind: u.minion,
      x: spot.x,
      y: spot.y,
      t: u.seconds ?? Infinity,
      atkT: 0,
      level: c.skill.level,
      dmg: prof.minionDamage,
      speed: prof.minionSpeed,
    });
  }
}

function step(w: World, m: Minion, tx: number, ty: number, dt: number, speed: number): void {
  const d = Math.hypot(tx - m.x, ty - m.y);
  if (d < 1e-6 || speed <= 0) return;
  const len = Math.min(d, speed * dt);
  const spot = w.grid.collide(m.x + ((tx - m.x) / d) * len, m.y + ((ty - m.y) / d) * len, MINION_R);
  m.x = spot.x;
  m.y = spot.y;
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
    if (m.t <= 0) continue;
    w.minions[j++] = m;
    const def = MINIONS[m.kind];
    m.atkT -= dt;
    if (Math.hypot(p.x - m.x, p.y - m.y) > TELEPORT) {
      m.x = p.x;
      m.y = p.y;
    }
    let best = null as (typeof foes)[number] | null;
    let bd = SEEK;
    for (const e of foes) {
      const d = Math.hypot(e.x - m.x, e.y - m.y);
      if (d < bd) {
        best = e;
        bd = d;
      }
    }
    const speed = def.speed * m.speed;
    if (!best) {
      if (Math.hypot(p.x - m.x, p.y - m.y) > FOLLOW) step(w, m, p.x, p.y, dt, speed);
      continue;
    }
    if (bd > def.reach + best.r) {
      step(w, m, best.x, best.y, dt, speed);
      continue;
    }
    if (m.atkT > 0 || def.dmg <= 0) continue;
    m.atkT = 1 / (def.rate * m.speed);
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
