import { mod } from '../mods/types';
import type { MapAffixDef } from './mapAffixes';
import { REPRIEVES, type ReprieveId } from './reprieves';

/**
 * Provisions (docs/WAYSIDE.md section 6): items the character carries in its pouch (three at most, of any kind). A **staple** or a
 * **bet** is armed at camp and burns when the next map starts, helping for that map only; it is carried out as a hidden map affix
 * (`affix`), so the map's mods, its rewards and the threat preview already read it. A **reprieve** (data/reprieves.ts) is the third
 * kind: it needs no arming, is always ready, and is used up only when it saves the character. Every name and text here is ours.
 *
 * Staples are small and always right; bets are strong and cost something. A provision may well make the character stronger for a
 * map than any item it could find: that is what it is for.
 */
export type ProvisionKind = 'staple' | 'bet' | 'reprieve';

export type EffectProvisionId =
  | 'whettedPowder'
  | 'wardOil'
  | 'bloodsalt'
  | 'glassDraught'
  | 'greedyLantern'
  | 'rushingTonic'
  | 'hunterBell';

export type ProvisionId = EffectProvisionId | ReprieveId;

export type ProvisionDef = {
  id: ProvisionId;
  name: string;
  kind: ProvisionKind;
  /** What it does, in a line (the card, the Satchel and the map's own list). */
  text: string;
  /** Base price in Bone Dust before the level factor (data/sale.ts). */
  base: number;
  /** Weight among the provisions a stock or a find draws. */
  weight: number;
  /** The first map it turns up on. */
  from: number;
  /** The hidden affix that carries the effect (a staple or a bet; a reprieve has none). */
  affix?: Omit<MapAffixDef, 'id' | 'name' | 'text' | 'fixed' | 'chalkOnly'>;
};

const EFFECTS: (ProvisionDef & { id: EffectProvisionId })[] = [
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
    from: 3,
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
    from: 3,
    affix: { playerMods: [mod('leech.life', 'base', 2)], reward: {} },
  },
  {
    id: 'glassDraught',
    name: 'Glass Draught',
    kind: 'bet',
    text: '+60% damage, but you take 40% more damage',
    base: 10,
    weight: 14,
    from: 5,
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
    from: 5,
    affix: { playerMods: [mod('life', 'more', -15)], reward: { quantity: 0.3 } },
  },
  {
    id: 'rushingTonic',
    name: 'Rushing Tonic',
    kind: 'bet',
    text: '+15% movement speed and +10% attack and cast speed, but monsters move 10% faster',
    base: 10,
    weight: 12,
    from: 5,
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
  {
    id: 'hunterBell',
    name: "Hunter's Bell",
    kind: 'bet',
    text: 'Three more rare packs, each with its champion; +25% experience and +20% item quantity',
    base: 10,
    weight: 10,
    from: 5,
    affix: { extraRarePacks: 3, reward: { experience: 0.25, quantity: 0.2 }, pressure: 1.15 },
  },
];

/** The reprieves are provisions of a third kind: no arming, always ready, used up when one saves the character. */
const REPRIEVE_PROVISIONS: ProvisionDef[] = REPRIEVES.map((r) => ({
  id: r.id,
  name: r.name,
  kind: 'reprieve' as const,
  text: r.text,
  base: r.base,
  weight: r.weight,
  from: r.from,
}));

export const PROVISIONS: ProvisionDef[] = [...EFFECTS, ...REPRIEVE_PROVISIONS];

export const provisionDef = (id: string): ProvisionDef => {
  const d = PROVISIONS.find((p) => p.id === id);
  if (!d) throw new Error(`unknown provision ${id}`);
  return d;
};

/** Whether an id is a reprieve (carried in the pouch, but never armed). */
export const isReprieveId = (id: string): id is ReprieveId => REPRIEVES.some((r) => r.id === id);

/** The id of the hidden map affix that carries a provision's effect. */
export const provisionAffixId = (id: string): string => `provision.${id}`;
export const isProvisionAffix = (affixId: string): boolean => affixId.startsWith('provision.');

/** The hidden affixes, for the map affix table (they are never rolled: `chalkOnly`, and `fixed`, so they do not follow the level band). */
export const PROVISION_AFFIXES: MapAffixDef[] = EFFECTS.map((p) => ({
  id: provisionAffixId(p.id),
  name: p.name,
  text: p.text,
  chalkOnly: true,
  fixed: true,
  ...p.affix!,
}));

/** A cleared map may leave a provision in the pouch: from this level, with this chance (the first time for certain). */
export const FORAGE_FROM = 3;
export const FORAGE_CHANCE = 0.4;

/** How many provisions the pouch holds in all (a reprieve counts), and how many of them may be armed for one map: any of them. */
export const POUCH_LIMIT = 3;
export const PROVISIONS_PER_MAP = POUCH_LIMIT;
