import { mod } from '../mods/types';
import type { MapAffixDef } from './mapAffixes';

/**
 * The Shrine's blessings (docs/WAYSIDE.md 5.2): a modest standing edge that lasts until the next stop is taken. One at a time; a
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
    text: '+12% maximum life',
    affix: { playerMods: [mod('life', 'more', 12)], reward: {} },
  },
  {
    id: 'fury',
    name: 'Blessing of Fury',
    text: '+8% damage',
    affix: { playerMods: [mod('damage', 'more', 8)], reward: {} },
  },
  {
    id: 'ward',
    name: 'Blessing of Warding',
    text: '+15% to all resistances',
    affix: {
      playerMods: [mod('resist.allEle', 'base', 15), mod('resist.chaos', 'base', 15)],
      reward: {},
    },
  },
  {
    id: 'swift',
    name: 'Blessing of Swiftness',
    text: '+10% movement speed',
    affix: { playerMods: [mod('moveSpeed', 'inc', 10)], reward: {} },
  },
  {
    id: 'grit',
    name: 'Blessing of Grit',
    text: '+20% armour and evasion',
    affix: { playerMods: [mod('armour', 'more', 20), mod('evasion', 'more', 20)], reward: {} },
  },
  {
    id: 'fortune',
    name: 'Blessing of Fortune',
    text: '+10% item quantity',
    affix: { reward: { quantity: 0.1 } },
  },
  {
    id: 'cadence',
    name: 'Blessing of Cadence',
    text: '+8% attack and cast speed',
    affix: { playerMods: [mod('attackSpeed', 'inc', 8), mod('castSpeed', 'inc', 8)], reward: {} },
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
