/**
 * The Market (docs/WAYSIDE.md section 4): what a level's stock is made of and what it costs. Bone Dust is the money (what salvage
 * pays), and every price scales with the level the way salvage does, `1 + level / 50`, so a salvaged rare buys the same share of a
 * ware on every level of the run. Every number is a first guess.
 */

/** Base prices in Bone Dust, before the level factor. One salvaged rare is worth 5. */
export const WARE_BASE = {
  /** A rare of the level just played. */
  gear: 30,
  /** A gem the run does not hold yet. */
  gem: 12,
  /** A magic utility flask. */
  flask: 15,
  /** A bundle of two or three of one currency. */
  currency: 15,
  /** A provision: its own base price is used (data/provisions.ts); this key keeps the kinds of ware complete. */
  provision: 5,
} as const;

/** What a price comes to at a level. */
export function priceAt(base: number, level: number): number {
  return Math.max(1, Math.round(base * (1 + level / 50)));
}

/** The Quartermaster's sale: this share off. */
export const QUARTERMASTER_OFF = 0.25;
/** The size of an ordinary Market and of the Quartermaster's. */
export const MARKET_SIZE = 6;
export const QUARTERMASTER_SIZE = 12;
