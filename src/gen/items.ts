import { itemBase } from '../data/bases';
import { flaskBase } from '../data/flasks';
import type { FlaskItem, GemItem, Item, Rarity } from '../data/types';

export type UidSource = () => number;

/** A plain item of a base with empty sockets. */
export function makeItem(
  uid: UidSource,
  baseId: string,
  ilvl: number,
  sockets = 0,
  rarity: Rarity = 'normal',
): Item {
  const base = itemBase(baseId);
  return {
    kind: 'item',
    uid: uid(),
    // An old tier id stands for a base of today; a new item carries that base's own id.
    baseId: base.id,
    rarity,
    name: base.name,
    ilvl,
    implicits: base.implicits.map((m) => ({ ...m })),
    affixes: [],
    sockets: new Array(sockets).fill(null),
  };
}

export function makeGem(uid: UidSource, gemId: string): GemItem {
  return { kind: 'gem', uid: uid(), gemId };
}

export function makeFlask(uid: UidSource, baseId: string, ilvl: number): FlaskItem {
  const base = flaskBase(baseId);
  return { kind: 'flask', uid: uid(), baseId: base.id, ilvl, name: base.name, affixes: [] };
}
