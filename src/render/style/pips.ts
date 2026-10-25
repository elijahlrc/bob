import { MOD_MARKS, type ModShape } from '../../data/monsterMarks';
import { thornsShare } from '../../sim/combat';
import type { Actor } from '../../sim/types';

/** One pip above an enemy's life bar. */
export type Pip = { color: number; shape: ModShape };

/**
 * The pips an enemy wears, one per affix, and one more for what it does with no affix to name it: a monster whose kind throws back
 * a share of a melee hit (the Gilded Guard) wears the Thorned pip, so that the player can tell which will reflect before hitting it.
 */
export function pipsOf(a: Actor): Pip[] {
  const out: Pip[] = a.modIds.map((id) => ({
    color: MOD_MARKS[id].color,
    shape: MOD_MARKS[id].shape,
  }));
  if (reflectsUnmarked(a))
    out.push({ color: MOD_MARKS.thorned.color, shape: MOD_MARKS.thorned.shape });
  return out;
}

/** Whether the actor reflects by its kind and not by the Thorned affix (which has its pip already). */
export function reflectsUnmarked(a: Actor): boolean {
  return !!a.mon && !a.modIds.includes('thorned') && thornsShare(a) > 0;
}
