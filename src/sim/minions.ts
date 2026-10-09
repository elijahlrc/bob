import { levelValue } from '../calc/gems';
import type { SkillChoice } from '../calc/character';
import type { Defence } from '../calc/combat';
import { weaponStats } from '../calc/items';
import { minionBody } from '../calc/minion';
import type { SkillProfile } from '../calc/skill';
import { isWeaponClass, itemBase } from '../data/bases';
import { MINIONS, type MinionDef, type MinionId } from '../data/minions';
import { MONSTER_TYPES, type MonsterTypeId } from '../data/monsters';
import type { Item } from '../data/types';
import { newActor } from './actor';
import { rawHit, tickActor } from './combat';
import { takeCorpse, type Corpse } from './factions';
import { auraNow, minionStrike, refreshMinionDef, wearItem } from './minionFx';
import type { MinionSup } from './minionSup';
import type { Actor, Drop, World } from './types';

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
  /** The level its blows are read at (the summoning gem's, or a spectre's), and the multipliers of the minion modifiers. */
  level: number;
  dmg: number;
  speed: number;
  /** Volatile Servants: it has burst already. */
  boomed?: boolean;
  /** A spectre: the kind of monster it was. */
  mtype?: MonsterTypeId;
  /** An animated weapon or a Guardian: what each blow deals before the minion modifiers, and how often it strikes. */
  fixedHit?: number;
  fixedRate?: number;
  /** What the supports of its skill give it. */
  sup: MinionSup;
  /** Meat Shield: it stays near the character, goes for the enemies near it, and hits those harder. */
  defensive?: boolean;
  nearMore?: number;
  /** A golem: the added physical damage it gives the other minions, and how much harder it hits for each of them near. */
  golem?: { min: number; max: number; perNearby: number; cap: number };
  /** A Guardian: the items it wears, by place. */
  gear?: Map<string, Item>;
  gearKey?: string;
  /** Its defence before the offering, the supports and the gear, and the signature of what it has now. */
  bodyDef?: Defence;
  defKey?: string;
};

const SEEK = 14;
/** Volatile Servants: the share of life at which a minion bursts, and how far the burst reaches (tiles). */
const LOW_LIFE = 0.2;
const BURST_RADIUS = 2.5;
const FOLLOW = 3.5;
const FOLLOW_CLOSE = 2;
const DEFEND = 6;
const TELEPORT = 20;

/** The numbers of a minion's blows: its kind's, or, for a spectre, those of the monster it was. */
function statsOf(m: Minion): MinionDef {
  const base = MINIONS[m.kind];
  if (!m.mtype) return base;
  const t = MONSTER_TYPES[m.mtype];
  return {
    ...base,
    dmg: t.dmgMult,
    rate: 1 / Math.max(0.3, t.attackTime),
    reach: t.attack === 'melee' ? t.range + 0.3 : Math.min(8, t.range),
    speed: Math.max(2.5, Math.min(5, t.speed)),
    ranged: t.attack !== 'melee',
    r: t.radius,
  };
}

export function minionCount(w: World, key: string): number {
  let n = 0;
  for (const m of w.minions) if (m.key === key && m.alive) n++;
  return n;
}

/** How many minions a summon skill keeps standing. */
export function summonCount(c: SkillChoice, prof: SkillProfile): number {
  const u = c.skill.utility;
  if (u?.kind !== 'summon') return 0;
  // A spectre: one at first, a second from the thirteenth level of the gem.
  if (u.corpse) return Math.max(1, (c.skill.level >= 13 ? 2 : 1) + prof.minionCount);
  if (u.warden) return 1;
  return Math.max(1, Math.round(levelValue(u.count, c.skill.level)) + prof.minionCount);
}

/** Seconds a summon skill waits after a cast before it can be cast again. */
export function summonRespawn(c: SkillChoice): number {
  const u = c.skill.utility;
  return u?.kind === 'summon' ? MINIONS[u.minion].respawn : 1;
}

type Make = {
  /** The level its body is made at (the map's by default) and the level its blows are read at (the gem's by default). */
  bodyLevel?: number;
  blowLevel?: number;
  lifeMult?: number;
  seconds?: number;
  mtype?: MonsterTypeId;
  r?: number;
  name?: string;
};

/** A minion of a skill, put down at a spot with the numbers of the skill's modifiers and supports. */
function makeMinion(
  w: World,
  c: SkillChoice,
  prof: SkillProfile,
  kind: MinionId,
  x: number,
  y: number,
  o: Make = {},
): Minion {
  const def = MINIONS[kind];
  const body = minionBody(
    kind,
    o.bodyLevel ?? w.plan.areaLevel,
    prof.minionLife * (o.lifeMult ?? 1),
    prof.minionTaken,
    prof.minionRegen,
    prof.minionPhysReduction,
    prof.minionBlock,
  );
  const r = o.r ?? def.r;
  const spot = w.grid.collide(x, y, r);
  const m = newActor(w.nextId++, false, spot.x, spot.y, r) as Minion;
  m.faction = 0;
  m.def = body.def;
  m.bodyDef = body.def;
  m.life = body.life;
  m.name = o.name ?? def.name;
  m.rarity = 'normal';
  m.noReward = true;
  // Always awake, so nothing treats it as a sleeping monster.
  m.state = 'chase';
  m.key = c.key;
  m.kind = kind;
  m.mtype = o.mtype;
  m.t = o.seconds === undefined ? Infinity : o.seconds * prof.skillDuration;
  m.atkT = 0;
  m.level = o.blowLevel ?? c.skill.level;
  m.dmg = prof.minionDamage;
  m.speed = prof.minionSpeed;
  m.sup = prof.minionSup;
  m.defensive = prof.minionDefensive;
  m.nearMore = prof.minionNearMore;
  w.minions.push(m);
  w.events.push({ t: 'summon', id: m.id });
  refreshMinionDef(m, auraNow(w));
  return m;
}

/** The summon lands: the skill's minions that stand are renewed, and new ones fill the places of those that fell. */
export function summonMinions(w: World, c: SkillChoice, prof: SkillProfile): void {
  const u = c.skill.utility;
  if (u?.kind !== 'summon') return;
  const n = summonCount(c, prof);
  const have = minionCount(w, c.key);
  const seconds = u.seconds === undefined ? Infinity : u.seconds * prof.skillDuration;
  for (const m of w.minions) if (m.key === c.key && m.alive) m.t = seconds;
  const p = w.player;
  for (let i = have; i < n; i++) {
    const ang = (i / n) * Math.PI * 2;
    const g = u.golem;
    const m = makeMinion(
      w,
      c,
      prof,
      u.minion,
      p.x + Math.cos(ang) * 1.2,
      p.y + Math.sin(ang) * 1.2,
      {
        seconds: u.seconds,
        lifeMult: g ? 1 + levelValue(g.life, c.skill.level) / 100 : 1,
      },
    );
    if (g)
      m.golem = {
        min: levelValue(g.addMin, c.skill.level),
        max: levelValue(g.addMax, c.skill.level),
        perNearby: g.perNearby,
        cap: g.cap,
      };
  }
}

/** Raise the corpse as a spectre: the monster it was, at the gem's level, with the minion modifiers of the skill. */
export function raiseSpectre(w: World, c: SkillChoice, prof: SkillProfile, corpse: Corpse): void {
  const u = c.skill.utility;
  if (u?.kind !== 'summon' || !u.corpse) return;
  takeCorpse(w, corpse);
  const t = MONSTER_TYPES[corpse.spec.type];
  const level = Math.round(levelValue(u.corpse.level, c.skill.level));
  makeMinion(w, c, prof, u.minion, corpse.x, corpse.y, {
    bodyLevel: level,
    blowLevel: level,
    lifeMult: t.lifeMult,
    mtype: corpse.spec.type,
    r: t.radius,
    name: corpse.name,
  });
}

/**
 * A melee weapon lying near the character that the character would not miss: a normal or magic one (a rare or a unique is kept),
 * not above the level the gem allows.
 */
export function animatableDrop(w: World, c: SkillChoice, reach: number): Drop | null {
  const u = c.skill.utility;
  if (u?.kind !== 'summon' || !u.animate) return null;
  const cap = levelValue(u.animate.maxIlvl, c.skill.level);
  const p = w.player;
  for (const d of w.drops) {
    const it = d.item;
    if (it.kind !== 'item' || (it.rarity !== 'normal' && it.rarity !== 'magic') || it.ilvl > cap)
      continue;
    const base = itemBase(it.baseId);
    if (
      !base.weapon ||
      !isWeaponClass(base.itemClass) ||
      base.itemClass === 'bow' ||
      base.itemClass === 'wand'
    )
      continue;
    if (Math.hypot(d.x - p.x, d.y - p.y) <= reach) return d;
  }
  return null;
}

/** A weapon lying on the ground is animated: it is used up, and a flying blade strikes with its damage and the gem's. */
export function animateWeapon(w: World, c: SkillChoice, prof: SkillProfile, drop: Drop): void {
  const u = c.skill.utility;
  if (u?.kind !== 'summon' || !u.animate) return;
  const item = drop.item as Item;
  const i = w.drops.indexOf(drop);
  if (i >= 0) w.drops.splice(i, 1);
  const hand = weaponStats(item);
  const lvl = c.skill.level;
  let min = levelValue(u.animate.addMin, lvl);
  let max = levelValue(u.animate.addMax, lvl);
  for (const [a, b] of hand.flats) {
    min += a;
    max += b;
  }
  const p = w.player;
  const m = makeMinion(
    w,
    c,
    prof,
    u.minion,
    p.x + w.rngTrig.float(-1, 1),
    p.y + w.rngTrig.float(-1, 1),
    { seconds: u.seconds ?? 37.5, name: 'Animated weapon', blowLevel: w.plan.areaLevel },
  );
  m.fixedHit = (min + max) / 2;
  m.fixedRate = hand.aps * (1 + levelValue(u.animate.speed, lvl) / 100);
}

/** Animate Guardian: the item lying on the ground is put on the one Guardian, which is made if there is none. */
export function animateGuardian(w: World, c: SkillChoice, prof: SkillProfile, drop: Drop): void {
  const u = c.skill.utility;
  if (u?.kind !== 'summon' || !u.warden) return;
  const p = w.player;
  wearItem(w, c, drop, () =>
    makeMinion(w, c, prof, u.minion, p.x + 0.8, p.y, {
      lifeMult: 1 + levelValue(u.warden!.life, c.skill.level) / 100,
      name: 'Warden',
    }),
  );
}

/** One minion put down at a spot (the clone a Blink Arrow leaves where the character stood). */
export function summonAt(
  w: World,
  c: SkillChoice,
  prof: SkillProfile,
  kind: MinionId,
  seconds: number,
  x: number,
  y: number,
): void {
  makeMinion(w, c, prof, kind, x, y, { seconds });
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
  const unstable = w.char.db.flag('minionInstability');
  const aura = auraNow(w);
  let j = 0;
  for (const m of w.minions) {
    m.t -= dt;
    if (!m.alive || m.t <= 0) continue;
    // The offering, the golem and the supports show in its defence.
    refreshMinionDef(m, aura);
    // Damage over time, regeneration and ailment timers.
    tickActor(w, m, dt);
    if (!m.alive) continue;
    // Volatile Servants: at low life a minion bursts for a third of its life as fire, once.
    if (unstable && !m.boomed && m.life <= m.def.maxLife * LOW_LIFE) {
      m.boomed = true;
      for (const e of foes)
        if (e.alive && Math.hypot(e.x - m.x, e.y - m.y) <= BURST_RADIUS + e.r)
          rawHit(w, e, m.def.maxLife / 3, 3, 'Minion burst', 'minion');
      w.events.push({ t: 'explode', x: m.x, y: m.y, r: BURST_RADIUS, dtype: 3 });
    }
    w.minions[j++] = m;
    const def = statsOf(m);
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
      // A defensive minion goes only for what is near its owner.
      if (m.defensive && Math.hypot(e.x - p.x, e.y - p.y) > DEFEND) continue;
      const d = Math.hypot(e.x - m.x, e.y - m.y);
      if (d < bd) {
        best = e;
        bd = d;
      }
    }
    const speed = def.speed * m.speed * (1 + aura.move / 100) * (1 - m.ail.chill);
    if (!best) {
      if (Math.hypot(p.x - m.x, p.y - m.y) > (m.defensive ? FOLLOW_CLOSE : FOLLOW))
        step(w, m, p.x, p.y, dt, speed);
      continue;
    }
    m.facing = Math.atan2(best.y - m.y, best.x - m.x);
    if (bd > def.reach + best.r) {
      step(w, m, best.x, best.y, dt, speed);
      continue;
    }
    if (m.atkT > 0 || def.dmg <= 0) continue;
    m.atkT = 1 / ((m.fixedRate ?? def.rate) * m.speed * (1 + aura.atk / 100) * (1 - m.ail.chill));
    minionStrike(w, m, def, best, foes, aura);
  }
  w.minions.length = j;
}
