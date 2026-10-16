import type { World } from './types';
import type { Side } from './side';

/** The mana held back from the character: its auras' reservation, and a banner while it is carried (src/sim/banners.ts). */
export function reservedMana(w: World, s: Side): number {
  const b = s.banner;
  return w.char.reservedMana + (b && !b.placed ? b.reserve : 0);
}
