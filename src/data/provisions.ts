import { mod } from '../mods/types';
import type { MapAffixDef } from './mapAffixes';

/**
 * Provisions (docs/WAYSIDE.md section 6): items armed at camp that burn when the next map starts and help for that map only.
 * Each is carried out as a hidden map affix (`affix`), so the map's mods, its rewards and the threat preview already read it
 * with no new machinery. Every name and text here is ours.
 *
 * Staples are small and always right; bets are strong and cost something; specialists pay only against a particular kind
 * of map (the map's offer must match, or the provision is spent for nothing).
 */
export type ProvisionKind = 'staple' | 'bet' | 'specialist';

export type ProvisionId =
  'whettedPowder' | 'wardOil' | 'bloodsalt' | 'glassDraught' | 'greedyLantern' | 'rushingTonic';

export type ProvisionDef = {
  id: ProvisionId;
  name: string;
  kind: ProvisionKind;
  /** What it does for the one map, in a line (the card, the Satchel and the map's own list). */
  text: string;
  /** Base price in Bone Dust before the level factor (data/market.ts). */
  base: number;
  /** Weight among the provisions a stock draws. */
  weight: number;
  /** The first map it is sold on. */
  from: number;
  /** A specialist: the map type it needs. */
  needsType?: string;
  /** The hidden affix that carries the effect. */
  affix: Omit<MapAffixDef, 'id' | 'name' | 'text' | 'fixed' | 'chalkOnly'>;
};

export const PROVISIONS: ProvisionDef[] = [
  {
    id: 'whettedPowder',
    name: 'Whetted Powder',
    kind: 'staple',
    text: '+12% damage',
    base: 5,
    weight: 30,
    from: 1,
    affix: { playerMods: [mod('damage', 'more', 12)], reward: {} },
  },
  {
    id: 'wardOil',
    name: 'Ward-oil',
    kind: 'staple',
    text: '+12% to all resistances',
    base: 5,
    weight: 30,
    from: 5,
    affix: {
      playerMods: [mod('resist.allEle', 'base', 12), mod('resist.chaos', 'base', 12)],
      reward: {},
    },
  },
  {
    id: 'bloodsalt',
    name: 'Bloodsalt',
    kind: 'staple',
    text: '2% of damage dealt is leeched as life',
    base: 5,
    weight: 24,
    from: 5,
    affix: { playerMods: [mod('leech.life', 'base', 2)], reward: {} },
  },
  {
    id: 'glassDraught',
    name: 'Glass Draught',
    kind: 'bet',
    text: '+60% damage, but you take 40% more damage',
    base: 10,
    weight: 14,
    from: 10,
    affix: {
      playerMods: [mod('damage', 'more', 60), mod('damageTaken', 'more', 40)],
      reward: {},
    },
  },
  {
    id: 'greedyLantern',
    name: 'Greedy Lantern',
    kind: 'bet',
    text: '+30% item quantity, but 15% less maximum life',
    base: 10,
    weight: 14,
    from: 10,
    affix: { playerMods: [mod('life', 'more', -15)], reward: { quantity: 0.3 } },
  },
  {
    id: 'rushingTonic',
    name: 'Rushing Tonic',
    kind: 'bet',
    text: '+15% movement speed and +10% attack and cast speed, but monsters move 10% faster',
    base: 10,
    weight: 12,
    from: 10,
    affix: {
      playerMods: [
        mod('moveSpeed', 'inc', 15),
        mod('attackSpeed', 'inc', 10),
        mod('castSpeed', 'inc', 10),
      ],
      monsterMods: [mod('moveSpeed', 'inc', 10)],
      reward: {},
    },
  },
];

export const provisionDef = (id: string): ProvisionDef => {
  const d = PROVISIONS.find((p) => p.id === id);
  if (!d) throw new Error(`unknown provision ${id}`);
  return d;
};

/** The id of the hidden map affix that carries a provision's effect. */
export const provisionAffixId = (id: string): string => `provision.${id}`;
export const isProvisionAffix = (affixId: string): boolean => affixId.startsWith('provision.');

/** The hidden affixes, for the map affix table (they are never rolled: `chalkOnly`, and `fixed`, so they do not follow the level band). */
export const PROVISION_AFFIXES: MapAffixDef[] = PROVISIONS.map((p) => ({
  id: provisionAffixId(p.id),
  name: p.name,
  text: p.text,
  chalkOnly: true,
  fixed: true,
  ...p.affix,
}));

/** How many provisions may be armed for one map, and how many the Pouch holds in all. */
export const PROVISIONS_PER_MAP = 2;
export const POUCH_LIMIT = 6;
