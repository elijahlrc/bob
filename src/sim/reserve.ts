import type { World } from './types';

/** The mana held back from the character: its auras' reservation, and a banner while it is carried (src/sim/banners.ts). */
export function reservedMana(w: World): number {
  const b = w.banner;
  return w.char.reservedMana + (b && !b.placed ? b.reserve : 0);
}
