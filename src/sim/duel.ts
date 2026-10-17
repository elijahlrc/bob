import { Hasher } from '../core/hash';
import { classDef } from '../data/classes';
import type { Build } from '../data/types';
import { lifeCap } from './combat';
import { arenaPlan } from './dummy';
import type { Ledger } from './ledger';
import { buildRecap } from './recap';
import { hashEvents } from './runMap';
import type { DeathRecap, World } from './types';
import { createWorld, stepWorld } from './world';

/**
 * A duel (docs/DUEL.md): two characters in one world, fought to the death. This is the headless fight; the rules that make it a
 * game of its own (the duel option, the stall and the shorter cap, the order of the sides, the damage scale) are F4's.
 */

/** The arena the duel is fought in: the training dummy's open floor (docs/DUEL.md 4.2; the round arena is F5's). */
export const DUEL_ARENA_SIZE = 30;
/** How far apart the characters start, in tiles: inside the stock AI's engage range (9), so they fight with no duel option. */
export const DUEL_GAP = 8;
/** Seconds after which a fight that nobody has won is a draw. */
export const DUEL_MAX_TIME = 120;

export type DuelOpts = {
  /** Seconds after which a fight nobody has won is a draw (default `DUEL_MAX_TIME`). */
  maxTime?: number;
};

/** What one side has to show of the fight: the life it has left, what it dealt and took, and how it died if it did. */
export type DuelSide = {
  /** The share of its life (after what its gear reserves) the character has left; 0 for the dead. */
  lifeLeft: number;
  ledger: Ledger;
  recap?: DeathRecap;
};

export type DuelResult = {
  /** The side that won (0 is `a`, 1 is `b`); null when both fell in one tick or time ran out. */
  winner: 0 | 1 | null;
  how: 'death' | 'time';
  /** Seconds the fight lasted. */
  time: number;
  sides: [DuelSide, DuelSide];
};

/**
 * The world of a duel: the arena, `a` in the dummy arena's start and `b` `DUEL_GAP` tiles east on the same row, facing each
 * other, each at its own level with the vitals full and no map to take away its resistances. The exit never opens (nothing
 * here is to be cleared), and nothing ends the fight but a death and the time cap.
 */
export function createDuelWorld(a: Build, b: Build, seed: number, opts: DuelOpts = {}): World {
  const plan = arenaPlan(seed, DUEL_ARENA_SIZE, a.level);
  const { x, y } = plan.lab.start;
  const maxTime = opts.maxTime ?? DUEL_MAX_TIME;
  return createWorld({
    plan,
    sides: [
      { build: a, x, y, areaLevel: a.level, name: classDef(a.classId).name },
      { build: b, x: x + DUEL_GAP, y, areaLevel: b.level, name: classDef(b.classId).name },
    ],
    // (The world's own cap is a tick beyond the duel's, so that the duel is what ends the fight.)
    opts: { maxTime: maxTime + 1, autoAbandonAt: Infinity, noExit: true },
  });
}

/** What a duel came to, read off its world: who is alive, how much life they have left, and their ledgers and recaps. */
export function duelResult(w: World): DuelResult {
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
    how: over ? 'death' : 'time',
    time: w.t,
    sides: [side(0), side(1)],
  };
}

/**
 * Fight a duel to its end and return the result, the hash of every event of every tick (the proof that a duel is a pure function
 * of the two builds and the seed) and the world it was fought in.
 */
export function playDuel(
  a: Build,
  b: Build,
  seed: number,
  opts: DuelOpts = {},
): { result: DuelResult; hash: number; world: World } {
  const maxTime = opts.maxTime ?? DUEL_MAX_TIME;
  const w = createDuelWorld(a, b, seed, opts);
  const h = new Hasher();
  // The map's own end reads side 0 alone (`status` goes 'dead' when its character falls): a duel reads both.
  while (w.t < maxTime && w.sides[0].player.alive && w.sides[1].player.alive) {
    stepWorld(w);
    hashEvents(h, w);
  }
  for (const s of w.sides) h.num(s.player.x).num(s.player.y).num(s.player.life);
  return { result: duelResult(w), hash: h.digest(), world: w };
}

/** Fight a duel (docs/DUEL.md 4.3): `a` is side 0 and `b` side 1; a character that falls loses, and the time cap is a draw. */
export function runDuel(a: Build, b: Build, seed: number, opts: DuelOpts = {}): DuelResult {
  return playDuel(a, b, seed, opts).result;
}

/** The hash of a duel's events (see `playDuel`), for the determinism tests. */
export function duelHash(a: Build, b: Build, seed: number, opts: DuelOpts = {}): number {
  return playDuel(a, b, seed, opts).hash;
}
