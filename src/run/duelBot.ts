import type { Build } from '../data/types';
import { botRun } from './bot';
import { newRun, type RunState } from './run';

/**
 * Bot builds for a duel (docs/DUEL.md 8.3): a class played by the bot to a map and taken as it stands there. The Debug panel's Bot
 * button and the duel scripts (`scripts/duel-lib.ts`) both read them from here.
 */

/** A character taken from a bot run: the class and seed it was played from, the map it was taken at and its level there. */
export type Snap = { cls: string; seed: number; map: number; level: number; build: Build };

/** The seed the bot is played with for a run that is named by `seed` (as `scripts/ladder-probe.ts` has always made it). */
export const botSeed = (seed: number): number => seed * 1000 + 7;

/** The difficulty the probe's `--legacy` plays (the default one kills the bot on maps 10 to 20). */
export const LEGACY_PLAY = { scaling: 1, base: 1, variance: 0 };

/**
 * Play the bot from `cls` and `seed` to the end of map `map`: the character as it stands as it starts that map (null when the
 * bot died on an earlier map), and the one it ended the run with (the last one it had; null when the run was not played to its end).
 */
function play(
  cls: string,
  seed: number,
  map: number,
  legacy: boolean,
): { at: Snap | null; last: Snap | null } {
  const take = (run: RunState): Snap => ({
    cls,
    seed,
    map: run.map,
    level: run.build.level,
    build: structuredClone(run.build),
  });
  let at: Snap | null = null;
  let last: Snap | null = null;
  botRun(cls, botSeed(seed), map, {
    ...(legacy ? { difficulty: LEGACY_PLAY } : {}),
    onTick: (_w, run) => {
      if (!at && run.map >= map) at = take(run);
    },
    onEnd: (run) => {
      last = take(run);
    },
  });
  return { at, last };
}

/**
 * Play the bot from `cls` and `seed` until it starts map `map`, and take the character as it stands there. The run goes on to the
 * end of that map. Null when the bot died on an earlier map.
 */
export function snapshotBuild(cls: string, seed: number, map: number, legacy = false): Snap | null {
  return play(cls, seed, map, legacy).at;
}

/**
 * The same, for a duel that wants a character whatever happens: when the bot dies before it starts map `map`, the build it fell
 * with (`fell`, and `map` is the one it fell on). Takes seconds: a run of the bot, 5 to 45 s of wall time to maps 20 to 40.
 */
export function botBuild(
  cls: string,
  seed: number,
  map: number,
  legacy = true,
): Snap & { fell: boolean } {
  const { at, last } = play(cls, seed, map, legacy) as { at: Snap | null; last: Snap | null };
  if (at) return { ...at, fell: false };
  if (last) return { ...last, fell: true };
  // (A run that neither fell nor reached the map has no build to speak of: the class as it starts.)
  const run = newRun(cls, botSeed(seed));
  return { cls, seed, map: run.map, level: run.build.level, build: run.build, fell: true };
}
