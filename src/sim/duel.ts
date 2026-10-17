import { Hasher } from '../core/hash';
import { Rng } from '../core/rng';
import { biomeDef, biomeFor } from '../data/biomes';
import { classDef } from '../data/classes';
import { DUEL_DAMAGE_SCALE } from '../data/constants';
import { densityDef } from '../data/density';
import { LEGACY } from '../data/difficulty';
import { THEMES } from '../data/themes';
import type { Build } from '../data/types';
import { BOSS_ARENA_RADIUS, carveArena } from '../gen/bossArena';
import type { Room } from '../gen/labyrinth';
import type { MapPlan } from '../gen/mapPlan';
import { lifeCap } from './combat';
import type { Ledger } from './ledger';
import { buildRecap } from './recap';
import { hashEvents } from './runMap';
import type { DeathRecap, World } from './types';
import { createWorld, stepWorld } from './world';

/**
 * A duel (docs/DUEL.md): two characters in one world, fought to the death. The rules that make it a game of its own are here: the
 * duel option of the sides (they engage at any distance, never loot or leave), the ends (a death, the time cap, a stall), and the
 * damage scale; the order of the sides is drawn tick by tick in `stepWorld`.
 */

/** The width and height of the duel's arena in tiles: the boss arena's round room (`BOSS_ARENA_RADIUS`) and a ring of wall. */
export const DUEL_ARENA_SIZE = BOSS_ARENA_RADIUS * 2 + 3;
/** How far apart the characters start, in tiles: outside the stock AI's engage range (9), so it is the duel option that makes them fight. */
export const DUEL_GAP = 10;
/** Seconds after which a fight that nobody has won is a draw. */
export const DUEL_MAX_TIME = 90;
/** Seconds without either character taking damage after which a fight is a draw. */
export const DUEL_STALL_TIME = 15;

export type DuelOpts = {
  /** Seconds after which a fight nobody has won is a draw (default `DUEL_MAX_TIME`). */
  maxTime?: number;
  /** Seconds without damage to either character after which the fight is a draw (default `DUEL_STALL_TIME`). */
  stallTime?: number;
  /** What the damage each character takes is multiplied by (default `DUEL_DAMAGE_SCALE`). */
  damageScale?: number;
  /** What the two characters are called on the screen (default: their classes). It changes nothing in the fight. */
  names?: [string, string];
};

/** What one side has to show of the fight: the life it has left, what it dealt and took, and how it died if it did. */
export type DuelSide = {
  /** The share of its life (after what its gear reserves) the character has left; 0 for the dead. */
  lifeLeft: number;
  ledger: Ledger;
  recap?: DeathRecap;
};

export type DuelResult = {
  /** The side that won (0 is `a`, 1 is `b`); null when both fell in one tick, time ran out or the fight stalled. */
  winner: 0 | 1 | null;
  /** A death (a draw if both fell in one tick), the time cap, or a stall: neither character took damage for `DUEL_STALL_TIME`. */
  how: 'death' | 'time' | 'stall';
  /** Seconds the fight lasted. */
  time: number;
  sides: [DuelSide, DuelSide];
};

/**
 * The arena of a duel (docs/DUEL.md 4.2): the boss arena's round room of `BOSS_ARENA_RADIUS` tiles on its own, in a biome and a
 * theme rolled from the seed, so that it is drawn like any map (tiles, light, props). No monsters, no chests and an exit tucked
 * on the north rim that never opens. `lab.start` is the west character's place; the room's middle is the point both stand about.
 */
export function duelPlan(seed: number, areaLevel: number): MapPlan {
  const size = DUEL_ARENA_SIZE;
  const mid = BOSS_ARENA_RADIUS + 1;
  const tiles = new Uint8Array(size * size);
  carveArena(tiles, size, size, mid, mid, BOSS_ARENA_RADIUS);
  const room: Room = {
    id: 0,
    kind: 'end',
    rect: { x: mid - BOSS_ARENA_RADIUS, y: mid - BOSS_ARENA_RADIUS, w: size - 2, h: size - 2 },
    cx: mid,
    cy: mid,
    pathIndex: 0,
  };
  // The biome follows the seed, from every biome there is (a duel is on no map number); a biome forced from the Debug panel wins.
  const biome = biomeFor(seed, 100, 0, 'plain');
  const theme = new Rng(seed).fork('duelTheme').pick(THEMES);
  const start = { x: mid + 0.5 - DUEL_GAP / 2, y: mid + 0.5 };
  return {
    seed,
    map: 1,
    areaLevel,
    resistPenalty: 0,
    theme,
    biome: biomeDef(biome),
    density: densityDef('standard'),
    affixes: [],
    type: 'plain',
    difficulty: LEGACY,
    segment: 0,
    segments: 1,
    xpMult: theme.xpMult,
    endKind: 'rare',
    lab: {
      w: size,
      h: size,
      tiles,
      rooms: [room],
      mainPath: [0],
      waypoints: [{ ...start, room: 0 }],
      start,
      exit: { x: mid + 0.5, y: mid - BOSS_ARENA_RADIUS + 2.5 },
    },
    pop: { monsters: [], chests: [] },
  };
}

/**
 * The world of a duel: the arena (`duelPlan`), the characters `DUEL_GAP` tiles apart on its middle row, mirror images about its
 * middle and facing each other, each at its own level with the vitals full and no map to take away its resistances. Both sides
 * have the duel option and the damage scale. The exit never opens (nothing here is to be cleared): the duel option keeps the
 * characters from walking to it, `noExit` keeps it from showing open.
 */
export function createDuelWorld(a: Build, b: Build, seed: number, opts: DuelOpts = {}): World {
  const plan = duelPlan(seed, a.level);
  const maxTime = opts.maxTime ?? DUEL_MAX_TIME;
  const duel = { damageScale: opts.damageScale ?? DUEL_DAMAGE_SCALE };
  // The floor is symmetric about the middle of the room's middle tile.
  const midX = plan.lab.rooms[0].cx + 0.5;
  const midY = plan.lab.rooms[0].cy + 0.5;
  const w = createWorld({
    plan,
    sides: [
      {
        build: a,
        x: midX - DUEL_GAP / 2,
        y: midY,
        areaLevel: a.level,
        name: opts.names?.[0] ?? classDef(a.classId).name,
        opts: { duel },
      },
      {
        build: b,
        x: midX + DUEL_GAP / 2,
        y: midY,
        areaLevel: b.level,
        name: opts.names?.[1] ?? classDef(b.classId).name,
        opts: { duel },
      },
    ],
    // (The world's own cap is a tick beyond the duel's, so that the duel is what ends the fight.)
    opts: { maxTime: maxTime + 1, autoAbandonAt: Infinity, noExit: true },
  });
  // The order of the two sides is drawn tick by tick from the seed (see `World.orderSeed`).
  w.orderSeed = seed | 0;
  return w;
}

/** How a fight ended (`DuelResult.how`): a character fell, the time cap, or a stall. */
export type DuelEnd = DuelResult['how'];

/** What the end of a duel remembers from tick to tick: its two limits, and when the characters last took damage. */
export type DuelWatch = {
  maxTime: number;
  stallTime: number;
  /** What the two characters had taken between them at the last tick that they took any, and when that was. */
  taken: number;
  hurtAt: number;
};

/** A fresh watch for a duel with these options. */
export function duelWatch(opts: DuelOpts = {}): DuelWatch {
  return {
    maxTime: opts.maxTime ?? DUEL_MAX_TIME,
    stallTime: opts.stallTime ?? DUEL_STALL_TIME,
    taken: 0,
    hurtAt: 0,
  };
}

/**
 * How the fight has ended by now, or null while it goes on: a character has fallen (both in one tick is a draw, `duelResult`), a
 * stall (neither character has taken damage for `stallTime` seconds) or the time cap. Called after every tick, in this order, by the
 * headless runner (`playDuel`) and by the controller, so that they stop at the same tick. The map's own end reads side 0 alone
 * (`status` goes 'dead' when its character falls): a duel reads both.
 */
export function duelEnd(w: World, watch: DuelWatch): DuelEnd | null {
  const [a, b] = w.sides;
  if (!a.player.alive || !b.player.alive) return 'death';
  const now = a.stats.damageTaken + b.stats.damageTaken;
  if (now !== watch.taken) {
    watch.taken = now;
    watch.hurtAt = w.t;
  } else if (w.t - watch.hurtAt >= watch.stallTime) return 'stall';
  return w.t >= watch.maxTime ? 'time' : null;
}

/**
 * What a duel came to, read off its world: who is alive, how much life they have left, and their ledgers and recaps. `end` is how
 * a fight with both alive ended (the time cap, or a stall).
 */
export function duelResult(w: World, end: DuelEnd = 'time'): DuelResult {
  const [a, b] = w.sides;
  const dead = [!a.player.alive, !b.player.alive];
  const side = (i: 0 | 1): DuelSide => {
    const s = w.sides[i];
    return {
      lifeLeft: s.player.alive ? Math.max(0, s.player.life) / lifeCap(s.player) : 0,
      ledger: s.ledger,
      ...(dead[i] ? { recap: buildRecap(w, s) } : {}),
    };
  };
  const over = dead[0] || dead[1];
  return {
    winner: over && !(dead[0] && dead[1]) ? (dead[0] ? 1 : 0) : null,
    how: over ? 'death' : end,
    time: w.t,
    sides: [side(0), side(1)],
  };
}

/**
 * Fight a duel to its end and return the result, the hash of every event of every tick (the proof that a duel is a pure function
 * of the two builds and the seed) and the world it was fought in. The end is watched here, not in `stepWorld` (a map knows
 * nothing of it), by `duelEnd`: a death, the time cap, or a stall of `stallTime` seconds in which neither character took damage.
 */
export function playDuel(
  a: Build,
  b: Build,
  seed: number,
  opts: DuelOpts = {},
): { result: DuelResult; hash: number; world: World } {
  const w = createDuelWorld(a, b, seed, opts);
  const h = new Hasher();
  const watch = duelWatch(opts);
  let end = duelEnd(w, watch);
  while (!end) {
    stepWorld(w);
    hashEvents(h, w);
    end = duelEnd(w, watch);
  }
  for (const s of w.sides) h.num(s.player.x).num(s.player.y).num(s.player.life);
  return { result: duelResult(w, end), hash: h.digest(), world: w };
}

/** Fight a duel (docs/DUEL.md 4.3): `a` is side 0 and `b` side 1; a character that falls loses, the time cap and a stall are draws. */
export function runDuel(a: Build, b: Build, seed: number, opts: DuelOpts = {}): DuelResult {
  return playDuel(a, b, seed, opts).result;
}

/** The hash of a duel's events (see `playDuel`), for the determinism tests. */
export function duelHash(a: Build, b: Build, seed: number, opts: DuelOpts = {}): number {
  return playDuel(a, b, seed, opts).hash;
}
