import type { MonsterSpec } from '../calc/monster';
import { HEX_IDS, hexEffect, type HexId } from '../data/hexes';
import { MONSTER_TYPES } from '../data/monsters';
import { monsterHitOf, rawHit } from './combat';
import { monsterHexesPlayer } from './hexes';
import type { Actor, GroundEffect, World } from './types';
import { spawnMonster } from './world';

/**
 * Behaviours of the Rot and the Hollow (EXPANSION 5.8, 5.9 and 7.3): corpses and what uses them, ground zones,
 * blinking, mana drain and energy shield shells. Everything here is driven by the monster type or a faction
 * mod, never by the build of the player.
 */

export const CORPSE_LIFE = 10;
/** A Shambler rises this long after it dies. */
export const SHAMBLER_RISE_TIME = 3;
export const HAG_RAISE_INTERVAL = 8;
export const HAG_RAISE_MAX = 3;
export const HAG_RAISE_RANGE = 12;
export const BLINK_INTERVAL = 6;
export const BLINK_TELEGRAPH = 0.4;
export const MOTHER_RAISE_INTERVAL = 10;
export const PHASE_TIME = 2;
/** The Unremembered phases out at each of these shares of life lost. */
export const PHASE_STEP = 0.2;
export const WIGHT_RANGE = 6;
export const CENSER_RANGE = 5;
export const CENSER_SPEED = 0.2;
export const CENSER_DAMAGE = 0.15;
export const FLAGELLANT_RANGE = 6;
export const FERVOUR_MAX = 5;
export const FERVOUR_STEP = 0.04;
export const FERVOUR_SECONDS = 10;
export const HEXER_INTERVAL = 6;
export const CHOIR_HEAL_INTERVAL = 7;
export const CHOIR_HEAL_RANGE = 6;
export const CHOIR_HEAL_SHARE = 0.2;
export const CHANNEL_TIME = 1;
export const ZEAL_DAMAGE = 0.2;
export const ZEAL_RANGE = 6;
export const ZEAL_SECONDS = 6;
export const PRECENTOR_HEX_INTERVAL = 5;
export const NEST_INTERVAL = 4;
export const NEST_SPAWN = 2;
export const NEST_MAX_ALIVE = 8;
export const SENTINEL_SLAM_INTERVAL = 4;
export const SENTINEL_SLAM_RADIUS = 2;
export const PYLON_RANGE = 5;
export const QUEEN_BURROW_INTERVAL = 12;
export const QUEEN_BURROW_TIME = 2;
export const QUEEN_NESTS = 2;
export const RELIQUARIAN_STEP = 0.25;
export const BROOD_SPLIT = 3;
export const GOLEM_ZONE_SECONDS = 6;
export const WIGHT_SHELL = 0.3;
/** Zone damage is dealt in pulses this far apart (seconds). */
const ZONE_PULSE = 0.25;
/** A raised monster comes back with this share of its life. */
const RAISED_LIFE = 0.5;

/** Everything that speeds an actor up or slows it down: hexes, the censer aura and Fervour. */
export function speedMult(a: Actor): number {
  return a.hexSpeed * (a.buffT > 0 ? 1 + CENSER_SPEED : 1) * (1 + FERVOUR_STEP * a.fervour);
}

/** Everything that raises or lowers the damage an actor deals. */
export function damageMult(a: Actor): number {
  return (
    a.hexDmg *
    (a.buffT > 0 ? 1 + CENSER_DAMAGE : 1) *
    (a.zealT > 0 ? 1 + ZEAL_DAMAGE : 1) *
    (1 + FERVOUR_STEP * a.fervour)
  );
}

/** The level of a hex a monster casts: it rises with the area level, one step every five levels. */
function monsterHexEffect(w: World, id: HexId): number {
  return hexEffect(id, Math.max(1, Math.min(20, Math.floor(w.plan.areaLevel / 5) + 1)));
}

/** A monster hexes the player with one of the four hexes. */
export function hexPlayer(w: World, id: HexId): void {
  monsterHexesPlayer(w, id, monsterHexEffect(w, id));
}

export function hexPlayerAtRandom(w: World): void {
  hexPlayer(w, HEX_IDS[w.rngAi.int(0, HEX_IDS.length - 1)]);
}

/** Whether a Warden Pylon within range keeps this monster from taking damage. */
export function shieldedByPylon(w: World, a: Actor): boolean {
  if (a.mon?.spec.type === 'pylon') return false;
  for (const o of w.actors)
    if (
      o.alive &&
      !o.isPlayer &&
      o.mon?.spec.type === 'pylon' &&
      Math.hypot(o.x - a.x, o.y - a.y) <= PYLON_RANGE
    )
      return true;
  return false;
}

/** Spawn a monster of the Swarm beside another: it gives no experience or loot. */
function spawnBeside(w: World, m: Actor, type: MonsterSpec['type'], spread = 1.2): Actor {
  const spec: MonsterSpec = {
    type,
    variant: 'none',
    rarity: 'normal',
    level: m.mon!.spec.level,
    mods: [],
  };
  const ang = w.rngAi.float(0, Math.PI * 2);
  const pos = w.grid.collide(m.x + Math.cos(ang) * spread, m.y + Math.sin(ang) * spread, 0.4);
  const a = spawnMonster(w, spec, pos.x, pos.y, m.room, m.pack, MONSTER_TYPES[type].name);
  a.noReward = true;
  a.summonedBy = m.id;
  a.state = 'chase';
  w.events.push({ t: 'summon', id: a.id });
  return a;
}

/** A body left by a dead monster. */
export type Corpse = {
  id: number;
  x: number;
  y: number;
  /** The seconds it has lain there. */
  age: number;
  spec: MonsterSpec;
  room: number;
  pack: number;
  name: string;
};

export type ZoneKind = 'caustic' | 'burning' | 'chilling' | 'shocking';
export const ZONE_KINDS: ZoneKind[] = ['caustic', 'burning', 'chilling', 'shocking'];

/** Whether a ground effect is a lasting zone (as opposed to a telegraphed blast). */
export function isZone(e: GroundEffect): boolean {
  return (ZONE_KINDS as string[]).includes(e.kind);
}

/** Open a lasting zone on the ground. `dps` is the damage per second to a player standing in it. */
export function openZone(
  w: World,
  x: number,
  y: number,
  radius: number,
  seconds: number,
  kind: ZoneKind,
  dps: number,
): void {
  w.effects.push({
    id: w.nextId++,
    x,
    y,
    radius,
    t: seconds,
    total: seconds,
    kind,
    damage: dps,
    dtype: kind === 'caustic' ? 4 : kind === 'burning' ? 3 : kind === 'chilling' ? 2 : 1,
    faction: 1,
    acc: 0,
  });
}

/** An explosion happened: corpses it catches within a second of death are destroyed (EXPANSION 5.8). */
export function registerBlast(w: World, x: number, y: number, r: number): void {
  w.blasts.push({ x, y, r, t: w.t });
  if (w.blasts.length > 32) w.blasts.shift();
  w.corpses = w.corpses.filter((c) => c.age > 1 || Math.hypot(c.x - x, c.y - y) > r);
}

function caughtInBlast(w: World, a: Actor): boolean {
  return w.blasts.some((b) => w.t - b.t <= 1 && Math.hypot(a.x - b.x, a.y - b.y) <= b.r + a.r);
}

/** A dead monster may leave a corpse: not if it shattered frozen, burned away ignited, or was blown up. */
function leaveCorpse(w: World, a: Actor): void {
  if (!a.mon || a.risen || a.dummy) return;
  if (a.ail.freezeT > 0 || a.ail.ignites.length > 0 || caughtInBlast(w, a)) return;
  w.corpses.push({
    id: a.id,
    x: a.x,
    y: a.y,
    age: 0,
    spec: a.mon.spec,
    room: a.room,
    pack: a.pack,
    name: a.name,
  });
}

/** Bring a corpse back as a weaker monster that gives no experience or loot, and cannot rise again. */
function raise(w: World, c: Corpse): Actor {
  const spec: MonsterSpec = {
    type: c.spec.type,
    variant: c.spec.variant,
    rarity: 'normal',
    level: c.spec.level,
    mods: [],
  };
  const a = spawnMonster(w, spec, c.x, c.y, c.room, c.pack, c.name);
  a.life = a.def.maxLife * RAISED_LIFE;
  a.noReward = true;
  a.risen = true;
  a.state = 'chase';
  w.events.push({ t: 'summon', id: a.id });
  return a;
}

/** What a monster does when it dies: leave a corpse, a cloud or a nova, or stop shielding its allies. */
export function onMonsterDeath(w: World, a: Actor): void {
  if (!a.mon) return;
  const type = a.mon.spec.type;
  leaveCorpse(w, a);
  // A Core Golem leaves burning, chilled or shocked ground behind (6 s).
  if (type === 'golem' && a.mon.spec.variant !== 'none') {
    const kind =
      a.mon.spec.variant === 'fire'
        ? 'burning'
        : a.mon.spec.variant === 'cold'
          ? 'chilling'
          : 'shocking';
    openZone(w, a.x, a.y, 2, GOLEM_ZONE_SECONDS, kind, monsterHitOf(a) * 0.8);
  }
  // A Brood monster splits into Gnawers.
  if (a.modIds.includes('brood'))
    for (let i = 0; i < BROOD_SPLIT; i++) spawnBeside(w, a, 'gnawer', 0.8);
  if (type === 'bloater' || a.modIds.includes('putrid'))
    openZone(w, a.x, a.y, 2, 4, 'caustic', monsterHitOf(a) * 0.8);
  if (type === 'wisp') {
    // A nova that drains a fifth of the mana of the player.
    w.events.push({ t: 'explode', x: a.x, y: a.y, r: 2.5, dtype: 2 });
    const p = w.player;
    if (Math.hypot(p.x - a.x, p.y - a.y) <= 2.5 + p.r)
      p.mana = Math.max(0, p.mana - p.def.maxMana * 0.2);
  }
  // The Choir: a death feeds Flagellants and, with Zealous, spurs the allies around it.
  for (const o of w.actors) {
    if (!o.alive || o === a || o.isPlayer || !o.mon) continue;
    const d = Math.hypot(o.x - a.x, o.y - a.y);
    if (o.mon.spec.type === 'flagellant' && d <= FLAGELLANT_RANGE) {
      o.fervour = Math.min(FERVOUR_MAX, o.fervour + 1);
      o.fervourT = FERVOUR_SECONDS;
    }
    if (a.modIds.includes('zealous') && d <= ZEAL_RANGE) o.zealT = ZEAL_SECONDS;
  }
  if (type === 'wight')
    for (const o of w.actors)
      if (o.alive && o.shellBy === a.id) {
        o.shellBy = 0;
        o.es = Math.min(o.es, o.def.maxEs);
      }
}

/** Age corpses, let Shamblers rise and let old bodies crumble. */
export function tickCorpses(w: World, dt: number): void {
  if (!w.corpses.length) return;
  let j = 0;
  for (const c of w.corpses) {
    c.age += dt;
    if (c.spec.type === 'shambler' && c.age >= SHAMBLER_RISE_TIME && w.player.alive) {
      raise(w, c);
      continue;
    }
    if (c.age < CORPSE_LIFE) w.corpses[j++] = c;
  }
  w.corpses.length = j;
}

/** Lasting zones hurt the player standing in them, in pulses. */
export function tickZones(w: World, dt: number): void {
  const p = w.player;
  for (const e of w.effects) {
    if (!isZone(e) || !p.alive) continue;
    if (Math.hypot(p.x - e.x, p.y - e.y) > e.radius + p.r) continue;
    if (e.kind === 'chilling' && !p.def.cannotBeChilled) {
      p.ail.chill = Math.max(p.ail.chill, 0.3);
      p.ail.chillT = Math.max(p.ail.chillT, 0.5);
    } else if (e.kind === 'shocking') {
      p.ail.shock = Math.max(p.ail.shock, 0.2);
      p.ail.shockT = Math.max(p.ail.shockT, 0.5);
    }
    e.acc = (e.acc ?? 0) + dt;
    while (e.acc >= ZONE_PULSE) {
      e.acc -= ZONE_PULSE;
      if (e.kind === 'caustic' || e.kind === 'burning')
        rawHit(
          w,
          p,
          e.damage * ZONE_PULSE,
          e.dtype,
          e.kind === 'caustic' ? 'Caustic cloud' : 'Burning ground',
        );
    }
  }
}

/**
 * Whether a Shieldbearer turns a projectile arriving at (px, py) with its shield (the front 90 degrees).
 * The shield is down while it swings or is stunned: that is the opening for ranged builds.
 */
export function shieldBlocks(w: World, m: Actor, px: number, py: number): boolean {
  if (m.mon?.spec.type !== 'shieldbearer' || m.action || m.stunT > 0) return false;
  const p = w.player;
  const toPlayer = Math.atan2(p.y - m.y, p.x - m.x);
  const toShot = Math.atan2(py - m.y, px - m.x);
  let d = Math.abs(toPlayer - toShot);
  if (d > Math.PI) d = 2 * Math.PI - d;
  return d <= Math.PI / 4;
}

/** The Gloomstalker reappears on the far side of the player. */
function blinkBehind(w: World, m: Actor): void {
  const p = w.player;
  const away = Math.atan2(p.y - m.y, p.x - m.x);
  const pos = w.grid.collide(p.x + Math.cos(away) * 1.2, p.y + Math.sin(away) * 1.2, m.r);
  m.x = pos.x;
  m.y = pos.y;
  w.events.push({ t: 'blink', id: m.id, x: m.x, y: m.y, end: true });
}

/** The two champions (EXPANSION 7.3). */
function tickChampion(w: World, m: Actor, dt: number): void {
  const frac = m.life / m.def.maxLife;
  const p = w.player;
  const d = Math.hypot(p.x - m.x, p.y - m.y);
  if (m.modIds.includes('carrionMother')) {
    m.raiserT -= dt;
    if (m.raiserT <= 0) {
      m.raiserT = MOTHER_RAISE_INTERVAL;
      const mine = w.corpses.filter((c) => c.room === m.room);
      for (const c of mine) {
        raise(w, c);
        w.corpses.splice(w.corpses.indexOf(c), 1);
      }
    }
    if (m.bossPhase === 0 && frac <= 0.5) {
      m.bossPhase = 1;
      const dps = monsterHitOf(m) * 1.2;
      for (const [dx, dy] of [
        [2.5, 0],
        [-2.5, 0],
        [0, 2.5],
        [0, -2.5],
      ]) {
        const pos = w.grid.collide(m.x + dx, m.y + dy, 0.4);
        openZone(w, pos.x, pos.y, 2, 6, 'caustic', dps);
      }
    }
  }
  if (m.modIds.includes('gnawingQueen')) {
    if (m.phaseT > 0) {
      m.phaseT -= dt;
      if (m.phaseT <= 0) {
        // She comes up where you were: the warning circle lands now.
        const pos = w.grid.collide(m.markX, m.markY, m.r);
        m.x = pos.x;
        m.y = pos.y;
        w.events.push({ t: 'blink', id: m.id, x: m.x, y: m.y, end: true });
        let nests = 0;
        for (const o of w.actors) if (o.alive && o.mon?.spec.type === 'nest') nests++;
        if (nests < QUEEN_NESTS) {
          const nest = spawnBeside(w, m, 'nest', 2);
          nest.summonedBy = 0;
        }
      }
    } else {
      m.raiserT -= dt;
      if (m.raiserT <= 0 && d < 14) {
        m.raiserT = QUEEN_BURROW_INTERVAL;
        m.phaseT = QUEEN_BURROW_TIME;
        m.action = null;
        m.markX = p.x;
        m.markY = p.y;
        w.events.push({ t: 'blink', id: m.id, x: m.x, y: m.y, end: false });
        w.effects.push({
          id: w.nextId++,
          x: p.x,
          y: p.y,
          radius: 2,
          t: QUEEN_BURROW_TIME,
          total: QUEEN_BURROW_TIME,
          kind: 'slam',
          damage: 3 * monsterHitOf(m),
          dtype: 0,
          faction: 1,
        });
      }
    }
  }
  if (m.modIds.includes('reliquarian')) {
    // Immune to the current core element; the core changes at every quarter of its life lost.
    const steps = Math.floor((1 - frac) / RELIQUARIAN_STEP + 1e-9);
    if (m.bossPhase < steps || m.def.immune.every((x) => !x)) {
      m.bossPhase = Math.max(m.bossPhase, steps);
      const element = 1 + ((m.id + m.bossPhase) % 3);
      const immune = [false, false, false, false, false];
      immune[element] = true;
      m.def = { ...m.def, immune };
      w.events.push({ t: 'blink', id: m.id, x: m.x, y: m.y, end: true });
    }
  }
  if (m.modIds.includes('precentor')) {
    // Cycles the four hexes, heals itself now and then, and calls a Choirmaster at half life.
    m.raiserT -= dt;
    if (m.raiserT <= 0) {
      m.raiserT = PRECENTOR_HEX_INTERVAL;
      hexPlayer(w, HEX_IDS[m.slamT++ % HEX_IDS.length]);
      if (Math.floor(m.slamT) % 2 === 0)
        m.life = Math.min(m.def.maxLife, m.life + m.def.maxLife * 0.05);
    }
    if (m.bossPhase === 0 && frac <= 0.5) {
      m.bossPhase = 1;
      const pos = w.grid.collide(m.x + 1.5, m.y, 0.45);
      const a = spawnMonster(
        w,
        {
          type: 'choirmaster',
          variant: 'none',
          rarity: 'normal',
          level: m.mon!.spec.level,
          mods: [],
        },
        pos.x,
        pos.y,
        m.room,
        m.pack,
        'Choirmaster',
      );
      a.noReward = true;
      a.state = 'chase';
      w.events.push({ t: 'summon', id: a.id });
    }
  }
  if (m.modIds.includes('unremembered')) {
    if (m.phaseT > 0) {
      m.phaseT -= dt;
      if (m.phaseT <= 0) blinkBehind(w, m);
    } else if (m.bossPhase < 5 && frac <= 1 - PHASE_STEP * (m.bossPhase + 1)) {
      m.bossPhase++;
      m.phaseT = PHASE_TIME;
      m.action = null;
      w.events.push({ t: 'blink', id: m.id, x: m.x, y: m.y, end: false });
    }
  }
}

/** Per-tick behaviour of a chasing monster of the Rot or the Hollow. */
export function tickFactionBehaviour(w: World, m: Actor, dt: number): void {
  if (!m.mon) return;
  if (m.rarity === 'miniboss') tickChampion(w, m, dt);
  const p = w.player;
  const d = Math.hypot(p.x - m.x, p.y - m.y);
  switch (m.mon.spec.type) {
    case 'hag': {
      m.skillT -= dt;
      if (m.skillT > 0 || d > 16) break;
      m.skillT = HAG_RAISE_INTERVAL;
      const near = w.corpses
        .filter((c) => Math.hypot(c.x - m.x, c.y - m.y) <= HAG_RAISE_RANGE)
        .slice(0, HAG_RAISE_MAX);
      for (const c of near) {
        raise(w, c);
        w.corpses.splice(w.corpses.indexOf(c), 1);
      }
      break;
    }
    case 'gloomstalker': {
      if (m.modIds.includes('unremembered')) break;
      if (m.blinkT > 0) {
        m.blinkT -= dt;
        if (m.blinkT <= 0) blinkBehind(w, m);
        break;
      }
      m.skillT -= dt;
      if (m.skillT <= 0 && d > 3 && d < 14 && w.grid.los(m.x, m.y, p.x, p.y) && !m.action) {
        m.skillT = BLINK_INTERVAL;
        m.blinkT = BLINK_TELEGRAPH;
        w.events.push({ t: 'blink', id: m.id, x: m.x, y: m.y, end: false });
      }
      break;
    }
    case 'nest': {
      m.skillT -= dt;
      if (m.skillT > 0) break;
      m.skillT = NEST_INTERVAL;
      let alive = 0;
      for (const o of w.actors) if (o.alive && o.summonedBy === m.id) alive++;
      for (let i = 0; i < NEST_SPAWN && alive < NEST_MAX_ALIVE; i++, alive++)
        spawnBeside(w, m, 'gnawer', 1.2);
      break;
    }
    case 'sentinel': {
      m.skillT -= dt;
      if (m.skillT <= 0 && d <= 3 && !m.action && w.grid.los(m.x, m.y, p.x, p.y)) {
        m.skillT = SENTINEL_SLAM_INTERVAL;
        // A telegraphed slam on the spot where you stand.
        w.effects.push({
          id: w.nextId++,
          x: p.x,
          y: p.y,
          radius: SENTINEL_SLAM_RADIUS,
          t: 1,
          total: 1,
          kind: 'slam',
          damage: 2 * monsterHitOf(m),
          dtype: 0,
          faction: 1,
        });
      }
      break;
    }
    case 'censer': {
      for (const o of w.actors)
        if (!o.isPlayer && o.alive && Math.hypot(o.x - m.x, o.y - m.y) <= CENSER_RANGE)
          o.buffT = 0.3;
      break;
    }
    case 'hexer': {
      m.skillT -= dt;
      if (m.skillT <= 0 && d < 12 && w.grid.los(m.x, m.y, p.x, p.y)) {
        m.skillT = HEXER_INTERVAL;
        hexPlayerAtRandom(w);
      }
      break;
    }
    case 'choirmaster': {
      if (m.channelT > 0) {
        m.channelT -= dt;
        // A stun interrupts the channel.
        if (m.stunT > 0) {
          m.channelT = 0;
          m.skillT = CHOIR_HEAL_INTERVAL;
        } else if (m.channelT <= 0) {
          m.skillT = CHOIR_HEAL_INTERVAL;
          for (const o of w.actors)
            if (!o.isPlayer && o.alive && Math.hypot(o.x - m.x, o.y - m.y) <= CHOIR_HEAL_RANGE)
              o.life = Math.min(o.def.maxLife, o.life + o.def.maxLife * CHOIR_HEAL_SHARE);
        }
        break;
      }
      m.skillT -= dt;
      if (m.skillT <= 0 && !m.action && m.stunT <= 0) {
        const hurt = w.actors.some(
          (o) =>
            !o.isPlayer &&
            o.alive &&
            o.life < o.def.maxLife * 0.9 &&
            Math.hypot(o.x - m.x, o.y - m.y) <= CHOIR_HEAL_RANGE,
        );
        if (hurt) m.channelT = CHANNEL_TIME;
        else m.skillT = 1;
      }
      break;
    }
    case 'wight': {
      for (const o of w.actors) {
        if (o.isPlayer || !o.alive || o === m || o.mon?.spec.type === 'wight') continue;
        if (o.shellBy || Math.hypot(o.x - m.x, o.y - m.y) > WIGHT_RANGE) continue;
        o.shellBy = m.id;
        o.es = Math.max(o.es, o.def.maxLife * WIGHT_SHELL);
      }
      break;
    }
    default:
      break;
  }
}

/** A Bloater that reaches the player bursts: it is gone and its cloud opens where it stood. */
export function bloaterBurst(w: World, m: Actor): void {
  m.noReward = true;
  m.life = 0;
  m.alive = false;
  m.action = null;
  w.events.push({ t: 'death', id: m.id });
  onMonsterDeath(w, m);
}
