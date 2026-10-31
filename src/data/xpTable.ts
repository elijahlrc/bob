import { MAP_XP } from './mapXp';

/**
 * §5.4 level curve: xpToNext(L) = round(expectedMapXp(L) · k(L)).
 *
 * `MAP_XP[L - 1]` is the experience of every monster on a map at area level L, all of them killed, over the offers the game
 * rolls (`npm run xp:emit`, built from the generated maps since 2026-10-30; the bot measured it before). So a level costs one
 * map at the character's level. A level the table does not hold falls back on the doc's estimate.
 */
export const MAP_XP_BY_LEVEL: (number | null)[] = Array.from(
  { length: 100 },
  (_, i) => MAP_XP[i] || null,
);

export const MAX_LEVEL = 100;

function baseXp(m: number): number {
  return Math.round(6 + 1.6 * Math.pow(m, 1.55));
}

export function estimatedMapXp(level: number): number {
  const rooms = 4 + Math.floor(level / 25);
  return rooms * 5.5 * baseXp(level) * 1.6;
}

export function expectedMapXp(level: number): number {
  return MAP_XP_BY_LEVEL[level - 1] ?? estimatedMapXp(level);
}

export function kFactor(level: number): number {
  if (level < 90) return 1;
  return 1 + (0.3 * (level - 89)) / 10;
}

export function xpToNext(level: number): number {
  if (level >= MAX_LEVEL) return Infinity;
  return Math.round(expectedMapXp(level) * kFactor(level));
}
