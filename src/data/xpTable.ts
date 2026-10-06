/**
 * §5.4 level curve: xpToNext(L) = round(expectedMapXp(L) · k(L)).
 *
 * `MEASURED_MAP_XP[L - 1]` is the mean XP the headless bot earned clearing a map at area level L
 * (30 seeds). Until measured, entries are null and the doc's estimate is used.
 */
export const MEASURED_MAP_XP: (number | null)[] = new Array(100).fill(null);

export const MAX_LEVEL = 100;

function baseXp(m: number): number {
  return Math.round(6 + 1.6 * Math.pow(m, 1.55));
}

export function estimatedMapXp(level: number): number {
  const rooms = 4 + Math.floor(level / 25);
  return rooms * 5.5 * baseXp(level) * 1.6;
}

export function expectedMapXp(level: number): number {
  return MEASURED_MAP_XP[level - 1] ?? estimatedMapXp(level);
}

export function kFactor(level: number): number {
  if (level < 90) return 1;
  return 1 + (0.3 * (level - 89)) / 10;
}

export function xpToNext(level: number): number {
  if (level >= MAX_LEVEL) return Infinity;
  return Math.round(expectedMapXp(level) * kFactor(level));
}
