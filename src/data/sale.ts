/**
 * What the Quartermaster sells and what it costs (docs/WAYSIDE.md 5.2). Bone Dust is the money (what salvage pays), and every price
 * scales with the level the way salvage does, `1 + level / 50`, so a salvaged rare buys the same share of a ware on every level of
 * the run. Every number is a first guess. (A Market of every level was built and cut on 2026-10-14: too much to sort through after
 * every short level; the Quartermaster is the one place wares are for sale.)
 */

/** Base prices in Bone Dust, before the level factor. One salvaged rare is worth 5. */
export const WARE_BASE = {
  /** A rare of the level being played. */
  gear: 30,
  /** A gem the run does not hold yet. */
  gem: 12,
  /** A magic utility flask. */
  flask: 15,
  /** A bundle of two or three of one currency. */
  currency: 15,
} as const;

/** What a price comes to at a level. */
export function priceAt(base: number, level: number): number {
  return Math.max(1, Math.round(base * (1 + level / 50)));
}

/** How many wares the Quartermaster lays out. */
export const QUARTERMASTER_SIZE = 12;
