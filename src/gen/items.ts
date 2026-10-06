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
    baseId,
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
  return { kind: 'flask', uid: uid(), baseId, ilvl, name: flaskBase(baseId).name, affixes: [] };
}
