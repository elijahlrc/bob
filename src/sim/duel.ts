import { Hasher } from '../core/hash';
import { Rng } from '../core/rng';
import { biomeDef, biomeFor } from '../data/biomes';
import { classDef } from '../data/classes';
import { clamp } from '../core/math';
import {
  DUEL_DAMAGE_SCALE,
  DUEL_LIFE_MULT_TOP,
  DUEL_LIFE_STAGES,
  DUEL_REPRIEVES,
} from '../data/constants';
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
 * duel option of the sides (they engage at any distance, never loot or leave), the ends (a death, the time cap, a stall), the
 * damage scale, and the balance of docs/DUEL-BALANCE.md (three Bargain Coins a side, life and energy shield multiplied by the
 * opponent's level, the time cap broken by the reprieves used); the order of the sides is drawn tick by tick in `stepWorld`.
 */

/** The width and height of the duel's arena in tiles: the boss arena's round room (`BOSS_ARENA_RADIUS`) and a ring of wall. */
export const DUEL_ARENA_SIZE = BOSS_ARENA_RADIUS * 2 + 3;
/** How far apart the characters start, in tiles: outside the stock AI's engage range (9), so it is the duel option that makes them fight. */
export const DUEL_GAP = 10;
/**
 * Seconds after which a fight ends on time: the side that used fewer reprieves wins it, an equal number is a draw. 250 s (the owner,
 * 2026-10-20) after 19% of the measured fights reached a cap of 180 s (docs/DUEL-BALANCE.md 8.1).
 */
export const DUEL_MAX_TIME = 250;
/** The reprieve each side carries into a duel, `DUEL_REPRIEVES` of them (docs/DUEL-BALANCE.md 2). Its curse never reaches a duel. */
export const DUEL_REPRIEVE = 'bargainCoin';
/** Seconds without either character taking damage after which a fight is a draw. */
export const DUEL_STALL_TIME = 15;

export type DuelOpts = {
  /** Seconds after which the fight ends on time (default `DUEL_MAX_TIME`). */
  maxTime?: number;
  /** Seconds without damage to either character after which the fight is a draw (default `DUEL_STALL_TIME`). */
  stallTime?: number;
  /** What the damage each character takes is multiplied by (default `DUEL_DAMAGE_SCALE`). */
  damageScale?: number;
  /** How many Bargain Coins each side carries (default `DUEL_REPRIEVES`). */
  reprieves?: number;
  /** Multiply each side's life and energy shield by the curve of the other side's level (default true; `duelLifeMult`). */
  lifeCurve?: boolean;
  /**
   * The share of the damage scale and the life multiplier a side has on each of its lives (default `DUEL_LIFE_STAGES`); null for
   * all of them on every life.
   */
  stages?: readonly number[] | null;
  /** What the two characters are called on the screen (default: their classes). It changes nothing in the fight. */
  names?: [string, string];
};

/** What one side has to show of the fight: the life it has left, what it dealt and took, and how it died if it did. */
export type DuelSide = {
  /** The share of its life (after what its gear reserves) the character has left; 0 for the dead. */
  lifeLeft: number;
  /** The reprieves it used, and the ones it carried in. */
  reprieves: number;
  reprievesHeld: number;
  ledger: Ledger;
  recap?: DeathRecap;
};

export type DuelResult = {
  /**
   * The side that won (0 is `a`, 1 is `b`); null when both fell in one tick, when time ran out with as many reprieves used on each
   * side, or when the fight stalled.
   */
  winner: 0 | 1 | null;
  /**
   * A death (a draw if both fell in one tick), the time cap (won by the side that used fewer reprieves), or a stall: neither
   * character took damage for `DUEL_STALL_TIME`.
   */
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
 * What a character's life and energy shield are multiplied by in a duel against an opponent of `level` (docs/DUEL-BALANCE.md 4.1):
 * a straight line from 1 at level 1 to `DUEL_LIFE_MULT_TOP` at level 100. A side's factor is read from the other side's level,
 * so the lower-level character has the larger one.
 */
export function duelLifeMult(level: number): number {
  return 1 + ((DUEL_LIFE_MULT_TOP - 1) * (clamp(level, 1, 100) - 1)) / 99;
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
  const damageScale = opts.damageScale ?? DUEL_DAMAGE_SCALE;
  const curve = opts.lifeCurve ?? true;
  // Each side's life is multiplied by the curve of the other's level; both carry the same reprieves, and each life takes its
  // share of the two modifiers (weakest on the first, strongest on the last).
  const stages = opts.stages === undefined ? DUEL_LIFE_STAGES : (opts.stages ?? undefined);
  const duelOf = (other: Build) => ({
    damageScale,
    lifeMult: curve ? duelLifeMult(other.level) : 1,
    stages,
  });
  const reprieves = new Array<string>(opts.reprieves ?? DUEL_REPRIEVES).fill(DUEL_REPRIEVE);
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
        opts: { duel: duelOf(b), reprieves },
      },
      {
        build: b,
        x: midX + DUEL_GAP / 2,
        y: midY,
        areaLevel: b.level,
        name: opts.names?.[1] ?? classDef(b.classId).name,
        opts: { duel: duelOf(a), reprieves },
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
 * What a duel came to, read off its world: who is alive, how much life they have left, the reprieves they used, and their ledgers
 * and recaps. `end` is how a fight with both alive ended: the time cap (the side that used fewer reprieves wins; life left is not
 * counted, docs/DUEL-BALANCE.md 5) or a stall (a draw).
 */
export function duelResult(w: World, end: DuelEnd = 'time'): DuelResult {
  const [a, b] = w.sides;
  const dead = [!a.player.alive, !b.player.alive];
  const side = (i: 0 | 1): DuelSide => {
    const s = w.sides[i];
    return {
      lifeLeft: s.player.alive ? Math.max(0, s.player.life) / lifeCap(s.player) : 0,
      reprieves: s.reprieve.fired.length,
      reprievesHeld: s.reprieve.held.length,
      ledger: s.ledger,
      ...(dead[i] ? { recap: buildRecap(w, s) } : {}),
    };
  };
  const over = dead[0] || dead[1];
  const used = [a.reprieve.fired.length, b.reprieve.fired.length];
  const onTime =
    !over && end === 'time' && used[0] !== used[1] ? (used[0] < used[1] ? 0 : 1) : null;
  return {
    winner: over ? (!(dead[0] && dead[1]) ? (dead[0] ? 1 : 0) : null) : onTime,
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

/**
 * Fight a duel (docs/DUEL.md 4.3, docs/DUEL-BALANCE.md): `a` is side 0 and `b` side 1; a character that falls with no reprieve left
 * loses, the time cap goes to the side that used fewer reprieves (else a draw), and a stall is a draw.
 */
export function runDuel(a: Build, b: Build, seed: number, opts: DuelOpts = {}): DuelResult {
  return playDuel(a, b, seed, opts).result;
}

/** The hash of a duel's events (see `playDuel`), for the determinism tests. */
export function duelHash(a: Build, b: Build, seed: number, opts: DuelOpts = {}): number {
  return playDuel(a, b, seed, opts).hash;
}
