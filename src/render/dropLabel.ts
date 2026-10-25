import { currencyLabel } from '../data/currency';
import { MAP_RARITY } from '../data/palette';
import { gemDef } from '../data/gems';
import type { AnyItem } from '../data/types';

/** Rarity key of a dropped item: the colour and beam class it is shown with. */
export function dropRarity(item: AnyItem): string {
  if (item.kind === 'item') return item.rarity;
  if (item.kind === 'flask') return item.uniqueId ? 'unique' : 'flask';
  return item.kind;
}

/** The ground label of a drop: the item's name, with a stack count on currency. */
export function dropLabel(item: AnyItem): string {
  switch (item.kind) {
    case 'gem':
      return gemDef(item.gemId).name;
    case 'currency':
      return item.count > 1 ? `${currencyLabel(item.id)} ×${item.count}` : currencyLabel(item.id);
    default:
      return item.name;
  }
}

/** Colours for ground labels and beams, by drop rarity: the map's rarity colours (data/palette.ts). */
export const DROP_COLOR: Record<string, number> = MAP_RARITY;
