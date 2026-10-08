/**
 * Difficulty settings (docs/ENEMIES.md section 8): how monster strength grows with the level, a flat multiplier on
 * it, and a seeded spread between maps and packs. Headless and pure.
 */
export type Difficulty = {
  /** Monster strength grows this many "stat levels" per area level. 1 is the old curve. */
  scaling: number;
  /** A flat multiplier on the hardness (life times damage) of every monster at every level. 1 is the old curve. */
  base: number;
  /** Seeded spread of hardness between maps and between packs: 0 is none, 0.6 is the most. */
  variance: number;
};

/** The curve every run used before the difficulty settings existed. */
export const LEGACY: Difficulty = { scaling: 1, base: 1, variance: 0 };

/** What a new run starts with: substantially harder than the legacy curve (docs/ENEMIES.md 8.4). */
export const DEFAULT: Difficulty = { scaling: 1.75, base: 1.8, variance: 0.3 };

export const SCALING_RANGE = { min: 0.5, max: 2.5, step: 0.05 } as const;
export const BASE_RANGE = { min: 0.25, max: 4, step: 0.05 } as const;
export const VARIANCE_RANGE = { min: 0, max: 0.6, step: 0.05 } as const;

/** Whether two settings are the same. */
export function sameDifficulty(a: Difficulty, b: Difficulty): boolean {
  return a.scaling === b.scaling && a.base === b.base && a.variance === b.variance;
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Settings pulled into their ranges (a bad number from a form or an old save never reaches the sim). */
export function clampDifficulty(d: Partial<Difficulty> | undefined | null): Difficulty {
  const num = (x: unknown, fallback: number) =>
    typeof x === 'number' && Number.isFinite(x) ? x : fallback;
  return {
    scaling: clamp(num(d?.scaling, DEFAULT.scaling), SCALING_RANGE.min, SCALING_RANGE.max),
    base: clamp(num(d?.base, DEFAULT.base), BASE_RANGE.min, BASE_RANGE.max),
    variance: clamp(num(d?.variance, DEFAULT.variance), VARIANCE_RANGE.min, VARIANCE_RANGE.max),
  };
}

/** The level the monster life and damage curves are read at, on an area of this level. */
export function statLevel(area: number, d: Difficulty): number {
  return 1 + d.scaling * (area - 1);
}

/** The share of each of life and damage that the flat multiplier takes (it is split as a square root). */
export function baseShare(d: Difficulty): number {
  return Math.sqrt(d.base);
}

/** The weight of the map's own draw in the spread; the pack's draw takes the rest. */
export const MAP_NOISE_SHARE = 0.6;

/**
 * The hardness multiplier (life times damage) for a map draw and a pack draw, each in [-1, 1], at this variance.
 * Always positive: the variance is capped at 0.6.
 */
export function packPower(d: Difficulty, mapNoise: number, packNoise: number): number {
  const noise = MAP_NOISE_SHARE * mapNoise + (1 - MAP_NOISE_SHARE) * packNoise;
  return Math.round((1 + d.variance * noise) * 20) / 20;
}

/** The tier a map's own draw falls in, for the offer card; null when there is no variance to show. */
export type MapTier = 'gentle' | 'even' | 'fierce';
export function mapTier(d: Difficulty, mapNoise: number): MapTier | null {
  if (d.variance <= 0) return null;
  const x = MAP_NOISE_SHARE * mapNoise * d.variance;
  return x < -0.04 ? 'gentle' : x > 0.04 ? 'fierce' : 'even';
}

/** How much harder than the legacy curve a normal monster is at this area level (life times damage; the ease cancels). */
export function relativeHardness(
  area: number,
  d: Difficulty,
  life: (m: number) => number,
  hit: (m: number) => number,
): number {
  const s = statLevel(area, d);
  return (d.base * (life(s) * hit(s))) / (life(area) * hit(area));
}

/** A short line for the summary and the debug panel. */
export function difficultyText(d: Difficulty): string {
  return `scaling ${d.scaling.toFixed(2)}, base ${d.base.toFixed(2)}, variance ${d.variance.toFixed(2)}`;
}
