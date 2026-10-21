import type { Side } from './side';

/** The mana held back from the character: its auras' reservation, and a banner while it is carried (src/sim/banners.ts). */
export function reservedMana(s: Side): number {
  const b = s.banner;
  return s.char.reservedMana + (b && !b.placed ? b.reserve : 0);
}

/**
 * The life held back by the character's auras, in the sim's pool: the sheet's reservation (a share of life), multiplied with the
 * pool in a duel (docs/DUEL-BALANCE.md 4.2), so that a reserving build keeps the same share of a larger pool.
 */
export function reservedLife(s: Side): number {
  return s.char.reservedLife * s.lifeMult;
}
