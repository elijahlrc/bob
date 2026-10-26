import { moveFactor } from './statuses';
import { scaleOf, type MonsterSpec } from '../calc/monster';
import { HEX_IDS, hexEffect, type HexId } from '../data/hexes';
import { PYLON_OFF, PYLON_ON, PYLON_RANGE } from '../data/abilities';
import { MONSTER_TYPES, leavesBody } from '../data/monsters';
import { ENRAGE_DAMAGE, ENRAGE_SPEED } from '../data/phases';
import { monsterHitOf, rawHit } from './combat';
import { cue, healed } from './cues';
import { rally } from './packs';
import { monsterHexesPlayer } from './hexes';
import { encDamageMult, encMoveMult, onEncounterDeath } from './encounters';
import { flaskWards } from './afflict';
import type { Actor, GroundEffect, World } from './types';
import { spawnMonster } from './world';
import { hunted } from './side';
import type { Side } from './side';

/**
 * Behaviours of the Rot and the Hollow (EXPANSION 5.8, 5.9 and 7.3): corpses and what uses them, ground zones,
 * blinking, mana drain and energy shield shells. Everything here is driven by the monster type or a faction
 * mod, never by the build of the player.
 */

export {
  BLINK_INTERVAL,
  BLINK_TELEGRAPH,
  CENSER_RANGE,
  CHANNEL_TIME,
  CHOIR_HEAL_INTERVAL,
  CHOIR_HEAL_RANGE,
  CHOIR_HEAL_SHARE,
  HAG_RAISE_INTERVAL,
  HAG_RAISE_MAX,
  HAG_RAISE_RANGE,
  HEXER_INTERVAL,
  NEST_INTERVAL,
  NEST_MAX_ALIVE,
  NEST_SPAWN,
  PYLON_RANGE,
  SENTINEL_SLAM_INTERVAL,
  SENTINEL_SLAM_RADIUS,
  WIGHT_RANGE,
  WIGHT_SHELL,
} from '../data/abilities';

export const CORPSE_LIFE = 10;
/** A Shambler rises this long after it dies. */
export const SHAMBLER_RISE_TIME = 3;
export const MOTHER_RAISE_INTERVAL = 10;
export const PHASE_TIME = 2;
/** The Unremembered phases out at each of these shares of life lost. */
export const PHASE_STEP = 0.2;
export const CENSER_SPEED = 0.2;
export const CENSER_DAMAGE = 0.15;
export const FLAGELLANT_RANGE = 6;
export const FERVOUR_MAX = 5;
export const FERVOUR_STEP = 0.04;
export const FERVOUR_SECONDS = 10;
export const ZEAL_DAMAGE = 0.2;
export const ZEAL_RANGE = 6;
export const ZEAL_SECONDS = 6;
export const PRECENTOR_HEX_INTERVAL = 5;
export const QUEEN_BURROW_INTERVAL = 12;
export const QUEEN_BURROW_TIME = 2;
export const QUEEN_NESTS = 2;
export const RELIQUARIAN_STEP = 0.25;
export const BROOD_SPLIT = 3;
export const GOLEM_ZONE_SECONDS = 6;
/** The Bone Warden raises a ring of Warriors at each of these shares of life lost. */
export const WARDEN_STEP = 1 / 3;
export const WARDEN_RING = 4;
export const HUNTSMASTER_INTERVAL = 10;
export const TREASURER_RANGE = 7;
/** Zone damage is dealt in pulses this far apart (seconds). */
const ZONE_PULSE = 0.25;
/** A raised monster comes back with this share of its life. */
const RAISED_LIFE = 0.5;

/** Everything that speeds an actor up or slows it down: hexes, the censer aura and Fervour. */
export function speedMult(a: Actor): number {
  return (
    a.hex.speed *
    (a.choir.buffT > 0 ? 1 + CENSER_SPEED : 1) *
    (1 + FERVOUR_STEP * a.choir.fervour) *
    (a.rhythm.enraged ? ENRAGE_SPEED : 1) *
    (a.enc ? encMoveMult(a) : 1)
  );
}

/** The speed an actor walks at: all of that, and hindering, maiming, shackles and snares (docs/SPIRIT.md S3). */
export function moveMult(a: Actor): number {
  return speedMult(a) * moveFactor(a);
}

/** Everything that raises or lowers the damage an actor deals. */
export function damageMult(a: Actor): number {
  return (
    a.hex.dmg *
    (a.choir.buffT > 0 ? 1 + CENSER_DAMAGE : 1) *
    (a.choir.zealT > 0 ? 1 + ZEAL_DAMAGE : 1) *
    (1 + FERVOUR_STEP * a.choir.fervour) *
    (a.rhythm.enraged ? ENRAGE_DAMAGE : 1) *
    (a.enc ? encDamageMult(a) : 1) *
    a.rhythm.patMult
  );
}

/** The level of a hex a monster casts: it rises with the area level, one step every five levels. */
export function monsterHexEffect(w: World, id: HexId): number {
  return hexEffect(id, Math.max(1, Math.min(20, Math.floor(w.plan.areaLevel / 5) + 1)));
}

/** A monster (`from`: none for a sigil on the ground) hexes the player with one of the four hexes. */
export function hexPlayer(w: World, s: Side, id: HexId, from?: Actor): void {
  monsterHexesPlayer(w, s, id, monsterHexEffect(w, id), from);
}

export function hexPlayerAtRandom(w: World, s: Side, from?: Actor): void {
  hexPlayer(w, s, HEX_IDS[w.rngAi.int(0, HEX_IDS.length - 1)], from);
}

/** Whether the Warden Pylons' ward is up now: PYLON_ON seconds of every PYLON_ON + PYLON_OFF, on the world's clock. */
export function pylonsUp(w: World): boolean {
  return w.t % (PYLON_ON + PYLON_OFF) < PYLON_ON;
}

/** Whether a Warden Pylon within range keeps this monster from taking damage (never in the ward's off second). */
export function shieldedByPylon(w: World, a: Actor): boolean {
  if (a.mon?.spec.type === 'pylon' || !pylonsUp(w)) return false;
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
export function spawnBeside(w: World, m: Actor, type: MonsterSpec['type'], spread = 1.2): Actor {
  const spec: MonsterSpec = {
    type,
    variant: 'none',
    rarity: 'normal',
    level: m.mon!.spec.level,
    mods: [],
    ...scaleOf(m.mon!.spec),
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
  /** The life the monster had at most: what a corpse explosion is a share of. */
  life: number;
};

export type ZoneKind = 'caustic' | 'burning' | 'chilling' | 'shocking' | 'sigil';
export const ZONE_KINDS: ZoneKind[] = ['caustic', 'burning', 'chilling', 'shocking', 'sigil'];
/** Seconds between two hexes from a Hexer's sigil to whoever stands in it (docs/ENCOUNTERS.md 7). */
export const SIGIL_EVERY = 1.5;

/**
 * Drag the character toward a monster (a Tidecaller's hook): up to `tiles`, never into it, and the character is staggered
 * for a moment (a pulled character does not walk back into the pack the instant it lands).
 */
export function pullPlayer(w: World, s: Side, from: Actor, tiles: number): void {
  const p = s.player;
  if (!p.alive) return;
  const to = pullLanding(w, p, from, tiles);
  if (!to) return;
  const x0 = p.x;
  const y0 = p.y;
  p.x = to.x;
  p.y = to.y;
  p.stunT = Math.max(p.stunT, 0.3);
  // The renderer draws the chain and the reel-in from this (a blink's flash at the landing would come before the figure does).
  w.events.push({
    t: 'pull',
    src: from.id,
    dst: p.id,
    x: x0,
    y: y0,
    x2: p.x,
    y2: p.y,
    hx: from.x,
    hy: from.y,
  });
}

/** Where a pull of `tiles` toward `from` would leave `p` (null when it would not move it): the drag and its warning agree. */
export function pullLanding(
  w: World,
  p: Actor,
  from: Actor,
  tiles: number,
): { x: number; y: number } | null {
  const d = Math.hypot(from.x - p.x, from.y - p.y);
  const k = Math.min(tiles, Math.max(0, d - (from.r + p.r + 0.6)));
  if (k <= 0.05) return null;
  return w.grid.collide(p.x + ((from.x - p.x) / d) * k, p.y + ((from.y - p.y) / d) * k, p.r);
}

/** Tiles a Tidewarden's hook drags the character, how often it is thrown, and the warning the renderer shows before it. */
export const TIDEWARDEN_PULL = 4;
export const HOOK_TELL = 0.8;

/**
 * The warning of a Tidewarden's hook (it is thrown when its timer runs out and the character is 3 to 14 tiles away, so the
 * warning is read off the timer and changes nothing): how far the timer has run (`progress`, 1 when the hook is ready and waits for
 * the character to come into range), whether the character is in range, and where the drag would leave it. Null when no hook is coming.
 */
export function hookTell(
  w: World,
  m: Actor,
): {
  progress: number;
  ready: boolean;
  inRange: boolean;
  land: { x: number; y: number } | null;
} | null {
  if (
    !m.alive ||
    m.state !== 'chase' ||
    m.rarity !== 'miniboss' ||
    !m.modIds.includes('tidewarden')
  )
    return null;
  if (m.raiserT > HOOK_TELL) return null;
  const p = hunted(w, m);
  if (!p.alive) return null;
  const d = Math.hypot(p.x - m.x, p.y - m.y);
  const inRange = d > 3 && d < 14;
  return {
    progress: m.raiserT <= 0 ? 1 : 1 - m.raiserT / HOOK_TELL,
    ready: m.raiserT <= 0,
    inRange,
    land: inRange ? pullLanding(w, p, m, TIDEWARDEN_PULL) : null,
  };
}

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
    dtype:
      kind === 'caustic' || kind === 'sigil'
        ? 4
        : kind === 'burning'
          ? 3
          : kind === 'chilling'
            ? 2
            : 1,
    team: 1,
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
  if (!a.mon || a.risen || a.dummy || !leavesBody(a.mon.spec.type)) return;
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
    life: a.def.maxLife,
  });
}

/** The corpse nearest to a point within a reach, if there is one. */
export function corpseNear(w: World, x: number, y: number, reach: number): Corpse | null {
  let best: Corpse | null = null;
  let bd = reach;
  for (const c of w.corpses) {
    const d = Math.hypot(c.x - x, c.y - y);
    if (d <= bd) {
      bd = d;
      best = c;
    }
  }
  return best;
}

/** A corpse is used up. */
export function takeCorpse(w: World, c: Corpse): void {
  const i = w.corpses.indexOf(c);
  if (i >= 0) w.corpses.splice(i, 1);
}

/** Bring a corpse back as a weaker monster that gives no experience or loot, and cannot rise again. */
export function raise(w: World, c: Corpse): Actor {
  const spec: MonsterSpec = {
    type: c.spec.type,
    variant: c.spec.variant,
    rarity: 'normal',
    level: c.spec.level,
    mods: [],
    ...scaleOf(c.spec),
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
  onEncounterDeath(w, a);
  // The pack reacts to the fall of its leader (docs/ROSTER.md 6.7), and a Mirrored twin's survivor has three seconds.
  rally(w, a);
  if (a.mirror.id) {
    const twin = w.actors.find((o) => o.id === a.mirror.id && o.alive);
    if (twin) twin.mirror.t = 3;
  }
  // A thief that dies gives back what it took.
  if (a.theft.stolen > 0) {
    const f = hunted(w, a).side!.flasks.find((x) => x.spec.uid === a.theft.stolenFlask);
    if (f) f.charges = Math.min(f.spec.maxCharges, f.charges + a.theft.stolen);
    a.theft.stolen = 0;
  }
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
  // A type that breaks apart when it dies (a phase at nought of its life).
  for (const ph of a.mon.kind.phases ?? [])
    if (ph.do === 'split' && ph.at === 0 && ph.into)
      for (let i = 0; i < (ph.count ?? 3); i++) spawnBeside(w, a, ph.into, 0.9);
  // A Brood monster splits into Gnawers.
  if (a.modIds.includes('brood'))
    for (let i = 0; i < BROOD_SPLIT; i++) spawnBeside(w, a, 'gnawer', 0.8);
  if (type === 'bloater' || a.modIds.includes('putrid'))
    openZone(w, a.x, a.y, 2, 4, 'caustic', monsterHitOf(a) * 0.8);
  // A Cinderling burns out where it falls.
  if (type === 'cinderling') openZone(w, a.x, a.y, 1.3, 3, 'burning', monsterHitOf(a) * 0.5);
  if (type === 'wisp') {
    // A nova that drains a fifth of the mana of the player.
    w.events.push({ t: 'explode', x: a.x, y: a.y, r: 2.5, dtype: 2 });
    for (const s of w.sides) {
      const p = s.player;
      if (s.team !== a.team && Math.hypot(p.x - a.x, p.y - a.y) <= 2.5 + p.r)
        p.mana = Math.max(0, p.mana - p.def.maxMana * 0.2);
    }
  }
  // The Choir: a death feeds Flagellants and, with Zealous, spurs the allies around it.
  let spurred = false;
  for (const o of w.actors) {
    if (!o.alive || o === a || o.isPlayer || !o.mon) continue;
    const d = Math.hypot(o.x - a.x, o.y - a.y);
    if (o.mon.spec.type === 'flagellant' && d <= FLAGELLANT_RANGE) {
      o.choir.fervour = Math.min(FERVOUR_MAX, o.choir.fervour + 1);
      o.choir.fervourT = FERVOUR_SECONDS;
    }
    if (a.modIds.includes('zealous') && d <= ZEAL_RANGE) {
      o.choir.zealT = ZEAL_SECONDS;
      spurred = true;
    }
  }
  if (spurred) cue(w, 'zeal', a, ZEAL_RANGE);
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
    if (c.spec.type === 'shambler' && c.age >= SHAMBLER_RISE_TIME && hunted(w, c).alive) {
      raise(w, c);
      continue;
    }
    if (c.age < CORPSE_LIFE) w.corpses[j++] = c;
  }
  w.corpses.length = j;
}

/** Whether a chilling or shocking zone leaves this actor alone (docs/BOSSES.md 11.2). */
function zoneWarded(a: Actor, kind: 'chill' | 'shock'): boolean {
  const d = a.def;
  if (d.immuneAilments || d.avoid[kind] >= 1) return true;
  if (kind === 'chill')
    return d.cannotBeChilled || d.immune[2] || (a.isPlayer && flaskWards(a.side!, 'freeze'));
  return d.immune[1] || d.unaffectedByShock || (a.isPlayer && flaskWards(a.side!, 'shock'));
}

/** Lasting zones hurt the player and the player's minions standing in them, in pulses. */
export function tickZones(w: World, dt: number): void {
  for (const e of w.effects) {
    if (!isZone(e)) continue;
    const inside = (a: Actor) => a.alive && Math.hypot(a.x - e.x, a.y - e.y) <= e.radius + a.r;
    // A Hexer's sigil hexes the character who stands in it, once in a while (docs/ENCOUNTERS.md 7).
    if (e.kind === 'sigil') {
      e.acc = (e.acc ?? 0) + dt;
      for (const s of w.sides)
        if (s.team !== e.team && inside(s.player) && e.acc >= SIGIL_EVERY) {
          e.acc = 0;
          hexPlayerAtRandom(w, s);
        }
      continue;
    }
    // A character and its minions are caught by a monster's zone alike.
    const caught: Actor[] = [];
    for (const s of w.sides) {
      if (s.team === e.team) continue;
      if (inside(s.player)) caught.push(s.player);
      for (const m of s.minions) if (inside(m)) caught.push(m);
    }
    if (caught.length === 0) continue;
    for (const a of caught) {
      // Ground that chills or shocks does nothing to what cannot be (an immunity, a cleansing flask running).
      if (e.kind === 'chilling' && !zoneWarded(a, 'chill')) {
        a.ail.chill = Math.max(a.ail.chill, 0.3);
        a.ail.chillT = Math.max(a.ail.chillT, 0.5);
      } else if (e.kind === 'shocking' && !zoneWarded(a, 'shock')) {
        a.ail.shock = Math.max(a.ail.shock, 0.2);
        a.ail.shockT = Math.max(a.ail.shockT, 0.5);
      }
    }
    e.acc = (e.acc ?? 0) + dt;
    while (e.acc >= ZONE_PULSE) {
      e.acc -= ZONE_PULSE;
      if (e.kind === 'caustic' || e.kind === 'burning')
        for (const a of caught)
          rawHit(
            w,
            a,
            e.damage * ZONE_PULSE,
            e.dtype,
            null,
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
  const p = hunted(w, m);
  const toPlayer = Math.atan2(p.y - m.y, p.x - m.x);
  const toShot = Math.atan2(py - m.y, px - m.x);
  let d = Math.abs(toPlayer - toShot);
  if (d > Math.PI) d = 2 * Math.PI - d;
  return d <= Math.PI / 4;
}

/** The Gloomstalker reappears on the far side of the player. */
export function blinkBehind(w: World, m: Actor): void {
  const p = hunted(w, m);
  const away = Math.atan2(p.y - m.y, p.x - m.x);
  const pos = w.grid.collide(p.x + Math.cos(away) * 1.2, p.y + Math.sin(away) * 1.2, m.r);
  m.x = pos.x;
  m.y = pos.y;
  // A veiled monster that blinks beside the character is seen.
  m.revealT = 1.5;
  w.events.push({ t: 'blink', id: m.id, x: m.x, y: m.y, end: true });
}

/** The two champions (EXPANSION 7.3). */
function tickChampion(w: World, m: Actor, dt: number): void {
  const frac = m.life / m.def.maxLife;
  const p = hunted(w, m);
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
        cue(w, 'pools', { id: m.id, x: pos.x, y: pos.y }, 2);
      }
    }
  }
  if (m.modIds.includes('gnawingQueen')) {
    if (m.phaseT > 0) {
      m.phaseT -= dt;
      if (m.phaseT <= 0) {
        // She comes up where you were: the warning circle lands now.
        const pos = w.grid.collide(m.mark.x, m.mark.y, m.r);
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
        m.mark.x = p.x;
        m.mark.y = p.y;
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
          team: 1,
          owner: m.id,
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
      cue(w, 'immune', m, 0, element);
    }
  }
  if (m.modIds.includes('huntsmaster')) {
    // Whistles up three hounds every ten seconds (it is a boar, and rushes like one).
    m.raiserT -= dt;
    if (m.raiserT <= 0 && d < 16) {
      m.raiserT = HUNTSMASTER_INTERVAL;
      for (let i = 0; i < 3; i++) spawnBeside(w, m, 'hound', 1.4);
    }
  }
  if (m.modIds.includes('cinderTyrant')) {
    // A ring of fire goes out from it every ten seconds (a telegraphed blast), and three Cinderlings are lit at half life.
    m.raiserT -= dt;
    if (m.raiserT <= 0 && d < 12) {
      m.raiserT = 10;
      w.effects.push({
        id: w.nextId++,
        x: m.x,
        y: m.y,
        radius: 3.5,
        t: 1,
        total: 1,
        kind: 'slam',
        damage: 3 * monsterHitOf(m),
        dtype: 3,
        team: 1,
        owner: m.id,
      });
    }
    if (m.bossPhase === 0 && frac <= 0.5) {
      m.bossPhase = 1;
      for (let i = 0; i < 3; i++) spawnBeside(w, m, 'cinderling', 1.4);
    }
  }
  if (m.modIds.includes('tidewarden')) {
    // Hooks the character in every ten seconds, and calls three Brine Leeches at half life.
    m.raiserT -= dt;
    if (m.raiserT <= 0 && d > 3 && d < 14) {
      m.raiserT = 10;
      pullPlayer(w, hunted(w, m).side!, m, TIDEWARDEN_PULL);
    }
    if (m.bossPhase === 0 && frac <= 0.5) {
      m.bossPhase = 1;
      for (let i = 0; i < 3; i++) spawnBeside(w, m, 'leech', 1.4);
    }
  }
  if (m.modIds.includes('treasurer')) {
    // Nothing recovers near it; its hits take flask charges; two Cutpurses come at half life.
    if (d <= TREASURER_RANGE) p.suppressT = 0.25;
    if (m.bossPhase === 0 && frac <= 0.5) {
      m.bossPhase = 1;
      for (let i = 0; i < 2; i++) spawnBeside(w, m, 'cutpurse', 1.6);
    }
  }
  if (m.modIds.includes('boneWarden')) {
    // A ring of Warriors rises at each third of its life lost.
    const steps = Math.min(2, Math.floor((1 - frac) / WARDEN_STEP + 1e-9));
    while (m.bossPhase < steps) {
      m.bossPhase++;
      for (let i = 0; i < WARDEN_RING; i++) {
        const ang = (i / WARDEN_RING) * Math.PI * 2 + m.bossPhase;
        const pos = w.grid.collide(m.x + Math.cos(ang) * 2.2, m.y + Math.sin(ang) * 2.2, 0.4);
        const a = spawnMonster(
          w,
          {
            type: 'warrior',
            variant: 'none',
            rarity: 'normal',
            level: m.mon!.spec.level,
            mods: [],
            ...scaleOf(m.mon!.spec),
          },
          pos.x,
          pos.y,
          m.room,
          m.pack,
          MONSTER_TYPES.warrior.name,
        );
        a.noReward = true;
        a.summonedBy = m.id;
        a.state = 'chase';
        w.events.push({ t: 'summon', id: a.id });
      }
    }
  }
  if (m.modIds.includes('precentor')) {
    // Cycles the four hexes, heals itself now and then, and calls a Choirmaster at half life.
    m.raiserT -= dt;
    if (m.raiserT <= 0) {
      m.raiserT = PRECENTOR_HEX_INTERVAL;
      hexPlayer(w, hunted(w, m).side!, HEX_IDS[m.slamT++ % HEX_IDS.length], m);
      if (Math.floor(m.slamT) % 2 === 0) {
        const before = m.life;
        m.life = Math.min(m.def.maxLife, m.life + m.def.maxLife * 0.05);
        if (m.life > before) healed(w, m);
      }
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
          ...scaleOf(m.mon!.spec),
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
