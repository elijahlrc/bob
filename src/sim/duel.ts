import { Hasher } from '../core/hash';
import { classDef } from '../data/classes';
import { DUEL_DAMAGE_SCALE } from '../data/constants';
import type { Build } from '../data/types';
import { lifeCap } from './combat';
import { arenaPlan } from './dummy';
import type { Ledger } from './ledger';
import { buildRecap } from './recap';
import { hashEvents } from './runMap';
import type { DeathRecap, World } from './types';
import { createWorld, stepWorld } from './world';

/**
 * A duel (docs/DUEL.md): two characters in one world, fought to the death. The rules that make it a game of its own are here: the
 * duel option of the sides (they engage at any distance, never loot or leave), the ends (a death, the time cap, a stall), and the
 * damage scale; the order of the sides alternates by tick parity in `stepWorld`.
 */

/** The arena the duel is fought in: the training dummy's open floor (docs/DUEL.md 4.2; the round arena is F5's). */
export const DUEL_ARENA_SIZE = 30;
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
 * The world of a duel: the arena, the characters `DUEL_GAP` tiles apart on its middle row, mirror images about its middle
 * column and facing each other, each at its own level with the vitals full and no map to take away its resistances. Both sides
 * have the duel option and the damage scale. The exit never opens (nothing here is to be cleared): the duel option keeps the
 * characters from walking to it, `noExit` keeps it from showing open.
 */
export function createDuelWorld(a: Build, b: Build, seed: number, opts: DuelOpts = {}): World {
  const plan = arenaPlan(seed, DUEL_ARENA_SIZE, a.level);
  const maxTime = opts.maxTime ?? DUEL_MAX_TIME;
  const duel = { damageScale: opts.damageScale ?? DUEL_DAMAGE_SCALE };
  const mid = DUEL_ARENA_SIZE / 2;
  const w = createWorld({
    plan,
    sides: [
      {
        build: a,
        x: mid - DUEL_GAP / 2,
        y: mid,
        areaLevel: a.level,
        name: classDef(a.classId).name,
        opts: { duel },
      },
      {
        build: b,
        x: mid + DUEL_GAP / 2,
        y: mid,
        areaLevel: b.level,
        name: classDef(b.classId).name,
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

/**
 * What a duel came to, read off its world: who is alive, how much life they have left, and their ledgers and recaps. `end` is how
 * a fight with both alive ended (the time cap, or a stall).
 */
export function duelResult(w: World, end: 'time' | 'stall' = 'time'): DuelResult {
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
 * nothing of it): a death, the time cap, or a stall of `stallTime` seconds in which neither character took damage.
 */
export function playDuel(
  a: Build,
  b: Build,
  seed: number,
  opts: DuelOpts = {},
): { result: DuelResult; hash: number; world: World } {
  const maxTime = opts.maxTime ?? DUEL_MAX_TIME;
  const stallTime = opts.stallTime ?? DUEL_STALL_TIME;
  const w = createDuelWorld(a, b, seed, opts);
  const h = new Hasher();
  const [sa, sb] = w.sides;
  let end: 'time' | 'stall' = 'time';
  // What the characters had taken between them at the last tick that they took any.
  let taken = 0;
  let hurtAt = 0;
  // The map's own end reads side 0 alone (`status` goes 'dead' when its character falls): a duel reads both.
  while (w.t < maxTime && sa.player.alive && sb.player.alive) {
    stepWorld(w);
    hashEvents(h, w);
    const now = sa.stats.damageTaken + sb.stats.damageTaken;
    if (now !== taken) {
      taken = now;
      hurtAt = w.t;
    } else if (w.t - hurtAt >= stallTime) {
      end = 'stall';
      break;
    }
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
