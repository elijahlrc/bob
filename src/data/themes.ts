import type { FactionId, MonsterModId, MonsterTypeId, Variant } from './monsters';

/** DESIGN.md §12.6 map themes. */
export type ThemeDef = {
  id: string;
  name: string;
  elementWeights: Partial<Record<Variant, number>>;
  typeWeights: Partial<Record<MonsterTypeId, number>>;
  /** The share of each faction's monsters (default: all Ossuary). */
  factions?: Partial<Record<FactionId, number>>;
  /** Not offered before this map (default 1). */
  fromMap?: number;
  /** Extra essences the map pays out (EXPANSION 7.4). */
  extraEssence?: number;
  /** A currency the miniboss of this map always drops one more of (EXPANSION 7.4), by id. */
  bonusCurrency?: string;
  /** Extra currency items the map pays out (EXPANSION 7.4), as a multiple of the usual rate. */
  extraCurrency?: number;
  /** The champion that leads the mini-boss of this theme, and the type it is built from. */
  chief?: { mod: MonsterModId; type: MonsterTypeId };
  itemQuantity: number;
  rareWeightMult: number;
  xpMult: number;
  extraRarePacks: number;
  extraChests: number;
  bonusText: string;
  floor: number;
  wall: number;
};

export const THEMES: ThemeDef[] = [
  {
    id: 'ashenCrypt',
    name: 'Ashen Crypt',
    elementWeights: { fire: 3 },
    typeWeights: {},
    itemQuantity: 0.2,
    rareWeightMult: 1,
    xpMult: 1,
    extraRarePacks: 0,
    extraChests: 0,
    bonusText: '+20% item quantity',
    floor: 0x3a2c26,
    wall: 0x1c1410,
  },
  {
    id: 'rimedCatacomb',
    name: 'Rimed Catacomb',
    elementWeights: { cold: 3 },
    typeWeights: {},
    itemQuantity: 0,
    rareWeightMult: 1.2,
    xpMult: 1,
    extraRarePacks: 0,
    extraChests: 0,
    bonusText: '+20% item rarity',
    floor: 0x2c3640,
    wall: 0x141a20,
  },
  {
    id: 'thunderVault',
    name: 'Thunder Vault',
    elementWeights: { lightning: 3 },
    typeWeights: {},
    itemQuantity: 0,
    rareWeightMult: 1,
    xpMult: 1.15,
    extraRarePacks: 0,
    extraChests: 0,
    bonusText: '+15% experience',
    floor: 0x332c40,
    wall: 0x18141f,
  },
  {
    id: 'bonePits',
    name: 'Bone Pits',
    elementWeights: { none: 2 },
    typeWeights: { brute: 2 },
    itemQuantity: 0,
    rareWeightMult: 1,
    xpMult: 1,
    extraRarePacks: 1,
    extraChests: 0,
    bonusText: '+1 rare pack',
    floor: 0x3a3628,
    wall: 0x1c1a12,
  },
  {
    id: 'archersGallery',
    name: "Archer's Gallery",
    elementWeights: {},
    typeWeights: { archer: 3, shieldbearer: 3 },
    itemQuantity: 0,
    rareWeightMult: 1,
    xpMult: 1,
    extraRarePacks: 0,
    extraChests: 1,
    bonusText: '+1 chest',
    floor: 0x2e3a2c,
    wall: 0x151c14,
  },
];

THEMES.push(
  {
    id: 'gnawingWarrens',
    name: 'Gnawing Warrens',
    elementWeights: {},
    typeWeights: {},
    factions: { swarm: 70, ossuary: 30 },
    fromMap: 12,
    chief: { mod: 'gnawingQueen', type: 'beetle' },
    itemQuantity: 0.3,
    rareWeightMult: 1,
    xpMult: 1,
    extraRarePacks: 0,
    extraChests: 0,
    bonusText: '+30% item quantity',
    floor: 0x3a3022,
    wall: 0x1a150e,
  },
  {
    id: 'reliquaryVault',
    name: 'Reliquary Vault',
    elementWeights: {},
    typeWeights: {},
    factions: { reliquary: 50, ossuary: 50 },
    fromMap: 35,
    chief: { mod: 'reliquarian', type: 'golem' },
    bonusCurrency: 'auger',
    itemQuantity: 0,
    rareWeightMult: 1,
    xpMult: 1,
    extraRarePacks: 0,
    extraChests: 0,
    bonusText: '+1 Socket Auger',
    floor: 0x30343c,
    wall: 0x14161c,
  },
  {
    id: 'ashenNave',
    name: 'Ashen Nave',
    elementWeights: { fire: 2, lightning: 2 },
    typeWeights: {},
    factions: { choir: 60, ossuary: 40 },
    fromMap: 25,
    chief: { mod: 'precentor', type: 'hexer' },
    extraCurrency: 1,
    itemQuantity: 0,
    rareWeightMult: 1,
    xpMult: 1,
    extraRarePacks: 0,
    extraChests: 0,
    bonusText: '+1 currency item',
    floor: 0x3a2a24,
    wall: 0x1a1210,
  },
  {
    id: 'charnelPits',
    name: 'Charnel Pits',
    elementWeights: {},
    typeWeights: {},
    factions: { rot: 70, ossuary: 30 },
    fromMap: 8,
    extraEssence: 1,
    chief: { mod: 'carrionMother', type: 'shambler' },
    itemQuantity: 0,
    rareWeightMult: 1,
    xpMult: 1,
    extraRarePacks: 0,
    extraChests: 0,
    bonusText: '+1 essence',
    floor: 0x2c3a26,
    wall: 0x131a10,
  },
  {
    id: 'hollowVigil',
    name: 'Hollow Vigil',
    elementWeights: { cold: 2 },
    typeWeights: {},
    factions: { hollow: 70, ossuary: 30 },
    fromMap: 15,
    chief: { mod: 'unremembered', type: 'gloomstalker' },
    itemQuantity: 0,
    rareWeightMult: 1.2,
    xpMult: 1,
    extraRarePacks: 0,
    extraChests: 0,
    bonusText: '+20% item rarity',
    floor: 0x26303c,
    wall: 0x10141c,
  },
);

/**
 * Mixed themes (EXPANSION 7.4), from map 40: two of the new factions at 50/50, with the stronger bonus of the two.
 * Generated from the faction-led themes, so each pair is its own theme with an id of `mix:<a>+<b>`.
 */
const LED = ['charnelPits', 'hollowVigil', 'ashenNave', 'gnawingWarrens', 'reliquaryVault'];
const reward = (t: ThemeDef) =>
  0.5 * t.itemQuantity +
  0.3 * (t.rareWeightMult - 1) +
  0.6 * (t.xpMult - 1) +
  (t.extraEssence ?? 0) * 0.2;
function makeMixed(aId: string, bId: string): ThemeDef {
  const a = THEMES.find((t) => t.id === aId)!;
  const b = THEMES.find((t) => t.id === bId)!;
  const better = reward(a) >= reward(b) ? a : b;
  const fac = (t: ThemeDef) => Object.keys(t.factions ?? {}).find((f) => f !== 'ossuary')!;
  return {
    ...better,
    id: `mix:${aId}+${bId}`,
    name: `${a.name} and ${b.name}`,
    factions: { [fac(a)]: 50, [fac(b)]: 50 },
    elementWeights: { ...a.elementWeights, ...b.elementWeights },
    typeWeights: {},
    fromMap: 40,
    floor: a.floor,
    wall: b.wall,
  };
}
export const MIXED_THEMES: ThemeDef[] = LED.flatMap((a, i) =>
  LED.slice(i + 1).map((b) => makeMixed(a, b)),
);
THEMES.push(...MIXED_THEMES);

/** The themes that can be offered on a map. */
export function themesFor(map: number): ThemeDef[] {
  return THEMES.filter((t) => (t.fromMap ?? 1) <= map);
}

export function themeDef(id: string): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
