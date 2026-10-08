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

/** The mini-boss of an Ossuary theme (docs/ENEMIES.md 4.2, rule 6): a brute that raises a ring of Warriors twice. */
const OSSUARY_CHIEF: ThemeDef['chief'] = { mod: 'boneWarden', type: 'brute' };

export const THEMES: ThemeDef[] = [
  {
    id: 'ashenCrypt',
    name: 'Ashen Crypt',
    elementWeights: { fire: 3 },
    typeWeights: {},
    chief: OSSUARY_CHIEF,
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
    chief: OSSUARY_CHIEF,
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
    chief: OSSUARY_CHIEF,
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
    chief: OSSUARY_CHIEF,
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
    chief: OSSUARY_CHIEF,
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
    factions: { swarm: 85, ossuary: 15 },
    fromMap: 6,
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
    factions: { reliquary: 85, ossuary: 15 },
    fromMap: 25,
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
    factions: { choir: 85, ossuary: 15 },
    fromMap: 15,
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
    factions: { rot: 85, ossuary: 15 },
    fromMap: 4,
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
    factions: { hollow: 85, ossuary: 15 },
    fromMap: 9,
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
 * A second (and for the Rot a third) theme for each faction (docs/ENEMIES.md 4.2), so that an offer set drawn for
 * different leading factions still has something to choose between: each leans to different types, as the Ossuary
 * themes do, and pays a different bonus.
 */
THEMES.push(
  {
    id: 'sporefen',
    name: 'Sporefen',
    elementWeights: {},
    typeWeights: { spitter: 3, hag: 3 },
    factions: { rot: 85, ossuary: 15 },
    fromMap: 4,
    chief: { mod: 'carrionMother', type: 'shambler' },
    itemQuantity: 0,
    rareWeightMult: 1,
    xpMult: 1.15,
    extraRarePacks: 0,
    extraChests: 0,
    bonusText: '+15% experience',
    floor: 0x34402a,
    wall: 0x161d12,
  },
  {
    id: 'plaguewalk',
    name: 'Plaguewalk',
    elementWeights: {},
    typeWeights: { shambler: 2, bloater: 2.5 },
    factions: { rot: 85, ossuary: 15 },
    fromMap: 7,
    chief: { mod: 'carrionMother', type: 'shambler' },
    itemQuantity: 0.2,
    rareWeightMult: 1,
    xpMult: 1,
    extraRarePacks: 0,
    extraChests: 0,
    bonusText: '+20% item quantity',
    floor: 0x3a4028,
    wall: 0x1a1c10,
  },
  {
    id: 'chitinGalleries',
    name: 'Chitin Galleries',
    elementWeights: {},
    typeWeights: { beetle: 3, bat: 3, gnawer: 0.4, nest: 0.5 },
    factions: { swarm: 85, ossuary: 15 },
    fromMap: 8,
    chief: { mod: 'gnawingQueen', type: 'beetle' },
    itemQuantity: 0,
    rareWeightMult: 1,
    xpMult: 1,
    extraRarePacks: 0,
    extraChests: 1,
    bonusText: '+1 chest',
    floor: 0x403626,
    wall: 0x1c160e,
  },
  {
    id: 'lamplitCloister',
    name: 'Lamplit Cloister',
    elementWeights: {},
    typeWeights: { wisp: 2, wight: 3 },
    factions: { hollow: 85, ossuary: 15 },
    fromMap: 12,
    chief: { mod: 'unremembered', type: 'gloomstalker' },
    itemQuantity: 0,
    rareWeightMult: 1,
    xpMult: 1,
    extraRarePacks: 1,
    extraChests: 0,
    bonusText: '+1 rare pack',
    floor: 0x2c3444,
    wall: 0x12161e,
  },
  {
    id: 'scourgeCourt',
    name: 'Scourge Court',
    elementWeights: { fire: 2 },
    typeWeights: { flagellant: 3, censer: 2 },
    factions: { choir: 85, ossuary: 15 },
    fromMap: 20,
    chief: { mod: 'precentor', type: 'hexer' },
    itemQuantity: 0,
    rareWeightMult: 1,
    xpMult: 1.15,
    extraRarePacks: 0,
    extraChests: 0,
    bonusText: '+15% experience',
    floor: 0x40302a,
    wall: 0x1c1412,
  },
  {
    id: 'forgeAnnex',
    name: 'Forge Annex',
    elementWeights: { fire: 3 },
    typeWeights: { sentinel: 2, golem: 2, arbalest: 0.5 },
    factions: { reliquary: 85, ossuary: 15 },
    fromMap: 28,
    chief: { mod: 'reliquarian', type: 'golem' },
    itemQuantity: 0.2,
    rareWeightMult: 1,
    xpMult: 1,
    extraRarePacks: 0,
    extraChests: 0,
    bonusText: '+20% item quantity',
    floor: 0x38343a,
    wall: 0x18161a,
  },
);

/** The Kennel and the Gilded (docs/ENEMIES.md 7.4): two themes each. */
THEMES.push(
  {
    id: 'kennelRun',
    name: 'Kennel Run',
    elementWeights: {},
    typeWeights: { hound: 2 },
    factions: { kennel: 85, ossuary: 15 },
    fromMap: 11,
    chief: { mod: 'huntsmaster', type: 'boar' },
    itemQuantity: 0,
    rareWeightMult: 1.15,
    xpMult: 1,
    extraRarePacks: 0,
    extraChests: 0,
    bonusText: '+15% item rarity',
    floor: 0x3c3226,
    wall: 0x1a140e,
  },
  {
    id: 'boarPit',
    name: 'Boar Pit',
    elementWeights: {},
    typeWeights: { boar: 3, cat: 2.5 },
    factions: { kennel: 85, ossuary: 15 },
    fromMap: 14,
    chief: { mod: 'huntsmaster', type: 'boar' },
    itemQuantity: 0,
    rareWeightMult: 1,
    xpMult: 1,
    extraRarePacks: 1,
    extraChests: 0,
    bonusText: '+1 rare pack',
    floor: 0x44362a,
    wall: 0x1e160f,
  },
  {
    id: 'giltHall',
    name: 'Gilt Hall',
    elementWeights: {},
    typeWeights: { guard: 1.5 },
    factions: { gilded: 85, ossuary: 15 },
    fromMap: 18,
    chief: { mod: 'treasurer', type: 'guard' },
    extraCurrency: 1,
    itemQuantity: 0,
    rareWeightMult: 1,
    xpMult: 1,
    extraRarePacks: 0,
    extraChests: 0,
    bonusText: '+1 currency item',
    floor: 0x45402a,
    wall: 0x1e1b10,
  },
  {
    id: 'countingHouse',
    name: 'Counting House',
    elementWeights: {},
    typeWeights: { cutpurse: 2.5, slinger: 2, bursar: 2 },
    factions: { gilded: 85, ossuary: 15 },
    fromMap: 22,
    chief: { mod: 'treasurer', type: 'guard' },
    itemQuantity: 0,
    rareWeightMult: 1,
    xpMult: 1.15,
    extraRarePacks: 0,
    extraChests: 0,
    bonusText: '+15% experience',
    floor: 0x3a3a30,
    wall: 0x181812,
  },
);

/**
 * Mixed themes (EXPANSION 7.4), from map 30: two of the new factions at 50/50, with the stronger bonus of the two.
 * Generated from the faction-led themes, so each pair is its own theme with an id of `mix:<a>+<b>`.
 */
/** Mixed themes join the pool at this map. */
export const MIXED_FROM_MAP = 30;
const LED = [
  'charnelPits',
  'hollowVigil',
  'ashenNave',
  'gnawingWarrens',
  'reliquaryVault',
  'kennelRun',
  'giltHall',
];
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
    fromMap: MIXED_FROM_MAP,
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

/** The faction with the largest share of a theme's monsters (the first listed on a tie); the Ossuary when none is named. */
export function leaderOf(t: Pick<ThemeDef, 'factions'>): FactionId {
  let best: FactionId = 'ossuary';
  let bestShare = -1;
  for (const [f, share] of Object.entries(t.factions ?? { ossuary: 1 }) as [FactionId, number][])
    if (share > bestShare) {
      best = f;
      bestShare = share;
    }
  return best;
}

/** Whether skeletons lead the theme. */
export function ossuaryLed(t: Pick<ThemeDef, 'factions'>): boolean {
  return leaderOf(t) === 'ossuary';
}

/** Ossuary themes weigh 1 until this map, fall to OSSUARY_MID_WEIGHT by OSSUARY_MID_MAP, then to OSSUARY_LOW_WEIGHT by OSSUARY_LOW_MAP. */
export const OSSUARY_FULL_UNTIL = 3;
export const OSSUARY_MID_MAP = 10;
export const OSSUARY_MID_WEIGHT = 0.5;
export const OSSUARY_LOW_MAP = 25;
export const OSSUARY_LOW_WEIGHT = 0.25;
/** From this map an offer set holds at most one Ossuary-led theme (when the pool has others). */
export const OSSUARY_CAP_FROM = 4;

/**
 * How likely a theme is to be drawn into an offer set on this map (docs/ENEMIES.md 4.2, rule 1). Themes led by a faction
 * weigh 1. Ossuary-led themes thin out as the run goes on, so a skeleton map is still possible at map 60 but is rare.
 */
export function themeWeight(t: Pick<ThemeDef, 'factions'>, map: number): number {
  if (!ossuaryLed(t) || map <= OSSUARY_FULL_UNTIL) return 1;
  if (map >= OSSUARY_LOW_MAP) return OSSUARY_LOW_WEIGHT;
  if (map <= OSSUARY_MID_MAP) {
    const k = (map - OSSUARY_FULL_UNTIL) / (OSSUARY_MID_MAP - OSSUARY_FULL_UNTIL);
    return 1 + (OSSUARY_MID_WEIGHT - 1) * k;
  }
  const k = (map - OSSUARY_MID_MAP) / (OSSUARY_LOW_MAP - OSSUARY_MID_MAP);
  return OSSUARY_MID_WEIGHT + (OSSUARY_LOW_WEIGHT - OSSUARY_MID_WEIGHT) * k;
}
