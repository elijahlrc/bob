import { mod } from '../mods/types';
import type { MapAffixDef } from './mapAffixes';

/**
 * The Shrine's blessings (docs/WAYSIDE.md 5.2): a real standing edge (the size of a node or two of the passive tree, so that the
 * Shrine is worth a level) that lasts `BLESSING_LEVELS` levels. One at a time; a
 * Shrine's blessing replaces the one held. Each is a hidden map affix, like a provision (data/provisions.ts). Every name and text
 * here is ours.
 */
export type BlessingId = 'vigour' | 'fury' | 'ward' | 'swift' | 'grit' | 'fortune' | 'cadence';

export type BlessingDef = {
  id: BlessingId;
  name: string;
  text: string;
  affix: Omit<MapAffixDef, 'id' | 'name' | 'text' | 'fixed' | 'chalkOnly'>;
};

export const BLESSINGS: BlessingDef[] = [
  {
    id: 'vigour',
    name: 'Blessing of Vigour',
    text: '+22% maximum life',
    affix: { playerMods: [mod('life', 'more', 22)], reward: {} },
  },
  {
    id: 'fury',
    name: 'Blessing of Fury',
    text: '+15% damage',
    affix: { playerMods: [mod('damage', 'more', 15)], reward: {} },
  },
  {
    id: 'ward',
    name: 'Blessing of Warding',
    text: '+26% to all resistances',
    affix: {
      playerMods: [mod('resist.allEle', 'base', 26), mod('resist.chaos', 'base', 26)],
      reward: {},
    },
  },
  {
    id: 'swift',
    name: 'Blessing of Swiftness',
    text: '+18% movement speed',
    affix: { playerMods: [mod('moveSpeed', 'inc', 18)], reward: {} },
  },
  {
    id: 'grit',
    name: 'Blessing of Grit',
    text: '+36% armour and evasion',
    affix: { playerMods: [mod('armour', 'more', 36), mod('evasion', 'more', 36)], reward: {} },
  },
  {
    id: 'fortune',
    name: 'Blessing of Fortune',
    text: '+18% item quantity',
    affix: { reward: { quantity: 0.18 } },
  },
  {
    id: 'cadence',
    name: 'Blessing of Cadence',
    text: '+15% attack and cast speed',
    affix: { playerMods: [mod('attackSpeed', 'inc', 15), mod('castSpeed', 'inc', 15)], reward: {} },
  },
];

export const blessingDef = (id: string): BlessingDef => {
  const d = BLESSINGS.find((b) => b.id === id);
  if (!d) throw new Error(`unknown blessing ${id}`);
  return d;
};

export const blessingAffixId = (id: string): string => `blessing.${id}`;

/** The hidden map affixes that carry the blessings (never rolled, never offered by Chalk). */
export const BLESSING_AFFIXES: MapAffixDef[] = BLESSINGS.map((b) => ({
  id: blessingAffixId(b.id),
  name: b.name,
  text: b.text,
  chalkOnly: true,
  fixed: true,
  ...b.affix,
}));

/** How many blessings a Shrine offers. */
export const SHRINE_CHOICES = 3;
/** A blessing holds for this many levels after its Shrine (docs/ATTRITION.md, 2026-10-29; it held until the next stop). */
export const BLESSING_LEVELS = 5;
