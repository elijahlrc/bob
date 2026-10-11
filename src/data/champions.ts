import { MONSTER_TYPES } from './monsters';
import type { ThemeDef } from './themes';

/**
 * A theme's champion (`ThemeDef.chief`) ends an ordinary map in the place of its end-of-map rare, from this map on (the first
 * four maps are gentle). A boss ends every tenth map (docs/BOSSES.md 19), so these are what is left of the champions' maps.
 * The champion has the power of a rare, with its own type and its signature mod.
 */
export const CHAMPION_FROM_MAP = 5;

/** The champion that ends a map of this theme, if one does: a plain end (not a boss's, a Quarry's or a Crawl's), late enough. */
export function endChampion(
  theme: ThemeDef,
  map: number,
  areaLevel: number,
  endKind: 'rare' | 'miniboss' | 'boss',
): ThemeDef['chief'] | undefined {
  const c = theme.chief;
  if (!c || endKind !== 'rare' || map < CHAMPION_FROM_MAP) return undefined;
  return areaLevel >= (MONSTER_TYPES[c.type].minLevel ?? 0) ? c : undefined;
}
