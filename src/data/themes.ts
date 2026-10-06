import type { MonsterTypeId, Variant } from './monsters';

/** DESIGN.md §12.6 map themes. */
export type ThemeDef = {
  id: string;
  name: string;
  elementWeights: Partial<Record<Variant, number>>;
  typeWeights: Partial<Record<MonsterTypeId, number>>;
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
    typeWeights: { archer: 3 },
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

export function themeDef(id: string): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
