import { UNIQUE_FLASKS } from './uniqueFlasks';
import { UNIQUES } from './uniques';
/**
 * Currency (EXPANSION section 8). Single player has no trade economy, so currency exists to give the
 * player agency over items: each one names a verb, and the player chooses what it is pointed at.
 * Every name and text here is ours.
 */
export type CurrencyId =
  | 'ember'
  | 'pearl'
  | 'thread'
  | 'whetstone'
  | 'auger'
  | 'die'
  | 'seal'
  | 'chalk'
  | 'plagueIchor'
  | 'ectoplasm'
  | 'censerAsh'
  | 'chitin'
  | 'reliquarySlag'
  | 'houndtooth'
  | 'giltDust'
  | 'brineSalt'
  | 'emberAsh';

export type CurrencyDef = {
  id: CurrencyId;
  name: string;
  /** What it does, in a line. */
  text: string;
  /** Does not drop before this map. */
  minMap: number;
  /** Weight among the currencies that drop at random (essences drop only from their faction). */
  weight: number;
  /** Essences: the affix families the player may choose from. */
  families?: string[];
  /** Essences: the faction whose monsters drop it. */
  faction?: string;
};

export const CURRENCIES: CurrencyDef[] = [
  {
    id: 'ember',
    name: 'Reforging Ember',
    text: 'Pin the affixes to keep, then pick one of three alternatives for the rest (or the original).',
    minMap: 10,
    weight: 30,
  },
  {
    id: 'pearl',
    name: 'Marrow Pearl',
    text: 'Add an affix of a family you choose to an item with room for it.',
    minMap: 20,
    weight: 14,
  },
  {
    id: 'thread',
    name: 'Unravelling Thread',
    text: 'Remove an affix of your choice.',
    minMap: 15,
    weight: 10,
  },
  {
    id: 'whetstone',
    name: 'Whetstone',
    text: "Raise one affix's value to the maximum of its tier. At most two per item.",
    minMap: 15,
    weight: 10,
  },
  {
    id: 'auger',
    name: 'Socket Auger',
    text: 'Set the number of sockets of an item. The 4th, 5th and 6th socket cost 1, 2 and 3.',
    minMap: 5,
    weight: 24,
  },
  {
    id: 'die',
    name: 'Knucklebone Die',
    text: 'Throw a normal item: magic (60%), rare (30%) or a unique of its base (10%).',
    minMap: 10,
    weight: 10,
  },
  {
    id: 'seal',
    name: 'Rot Seal',
    text: 'Seal an item for good: an implicit, new sockets, a new rare, or nothing, 25% each.',
    minMap: 25,
    weight: 4,
  },
  {
    id: 'chalk',
    name: "Wayfinder's Chalk",
    text: 'On an offered map: add one of three affixes, or remove one (costs 2).',
    minMap: 20,
    weight: 18,
  },
  {
    id: 'plagueIchor',
    name: 'Plague Ichor',
    text: 'Add a chaos affix of your choice: chaos resistance, poison chance or added chaos damage.',
    minMap: 8,
    weight: 0,
    families: ['chaosRes', 'poisonChance', 'addChaosAttacks'],
    faction: 'rot',
  },
  {
    id: 'ectoplasm',
    name: 'Ectoplasm',
    text: 'Add an affix of your choice: energy shield, evasion or maximum mana.',
    minMap: 15,
    weight: 0,
    families: ['esGlobal', 'esLocal', 'evasionLocal', 'mana'],
    faction: 'hollow',
  },
  {
    id: 'censerAsh',
    name: 'Censer Ash',
    text: 'Add an affix of your choice: reduced mana reserved, or aura effect.',
    minMap: 25,
    weight: 0,
    families: ['reservation', 'auraEffect'],
    faction: 'choir',
  },
  {
    id: 'chitin',
    name: 'Chitin',
    text: 'Add an affix of your choice: attack speed, life on hit, or area of effect.',
    minMap: 12,
    weight: 0,
    families: ['aspdGlobal', 'aspdLocal', 'lifeOnHit', 'areaEffect'],
    faction: 'swarm',
  },
  {
    id: 'reliquarySlag',
    name: 'Reliquary Slag',
    text: 'Add an affix of your choice: armour, physical damage or stun threshold.',
    minMap: 35,
    weight: 0,
    families: ['armourLocal', 'physLocal', 'stunThreshold'],
    faction: 'reliquary',
  },
  {
    id: 'houndtooth',
    name: 'Hound-tooth',
    text: 'Add an affix of your choice: movement speed, accuracy or stun avoidance.',
    minMap: 11,
    weight: 0,
    families: ['moveSpeed', 'accuracy', 'stunAvoid'],
    faction: 'kennel',
  },
  {
    id: 'giltDust',
    name: 'Gilt Dust',
    text: 'Add an affix of your choice: life regeneration, mana regeneration or life leech.',
    minMap: 18,
    weight: 0,
    families: ['lifeRegen', 'manaRegen', 'lifeLeech'],
    faction: 'gilded',
  },
  {
    id: 'brineSalt',
    name: 'Brine Salt',
    text: 'Add an affix of your choice: lightning resistance, cold resistance or stun avoidance.',
    minMap: 20,
    weight: 0,
    families: ['lightRes', 'coldRes', 'stunAvoid'],
    faction: 'drowned',
  },
  {
    id: 'emberAsh',
    name: 'Ember Ash',
    text: 'Add an affix of your choice: fire resistance, added fire damage to attacks or chance to ignite.',
    minMap: 26,
    weight: 0,
    families: ['fireRes', 'addFireAttacks', 'igniteChance'],
    faction: 'emberborn',
  },
];

export function currencyDef(id: string): CurrencyDef {
  const c = CURRENCIES.find((x) => x.id === id);
  if (!c) throw new Error(`unknown currency ${id}`);
  return c;
}

export function isCurrencyId(id: string): id is CurrencyId {
  return CURRENCIES.some((c) => c.id === id);
}

/**
 * Epitaph tablets (EXPANSION 6.2): each faction's monsters drop tablets for a few named uniques.
 * A complete set is exchanged in camp for that unique, so a planned unique can be pursued.
 */
export const TABLET_SETS: Record<string, { unique: string; tablets: number }[]> = {
  ossuary: [
    { unique: 'gravediggersSmock', tablets: 3 },
    { unique: 'knuckleboneBindings', tablets: 3 },
    { unique: 'unblinkingLongbow', tablets: 4 },
    { unique: 'orreryOfBone', tablets: 5 },
  ],
  rot: [
    { unique: 'embalmersWraps', tablets: 4 },
    { unique: 'rotwineFlask', tablets: 3 },
    { unique: 'rotheartBand', tablets: 4 },
    { unique: 'martyrsDraught', tablets: 5 },
  ],
  hollow: [
    { unique: 'steadfastCassock', tablets: 4 },
    { unique: 'spellswornCirclet', tablets: 4 },
    { unique: 'bloodglassWard', tablets: 5 },
  ],
  choir: [
    { unique: 'cantorsHood', tablets: 4 },
    { unique: 'pickpocketsLament', tablets: 5 },
  ],
  swarm: [
    { unique: 'thousandRibs', tablets: 5 },
    { unique: 'stormsplitJerkin', tablets: 4 },
    { unique: 'kindredSparks', tablets: 5 },
    { unique: 'lastLightFlask', tablets: 4 },
  ],
  reliquary: [
    { unique: 'walledHeart', tablets: 5 },
    { unique: 'meteoriteEdge', tablets: 6 },
    { unique: 'lanternBulwark', tablets: 5 },
    { unique: 'thunderwireHauberk', tablets: 5 },
  ],
  kennel: [
    { unique: 'footlooseShoes', tablets: 4 },
    { unique: 'brawlStrap', tablets: 4 },
  ],
  emberborn: [
    { unique: 'emberSignet', tablets: 3 },
    { unique: 'embertoothTotem', tablets: 4 },
    { unique: 'emberwritCirclet', tablets: 5 },
    { unique: 'cinderstormBand', tablets: 6 },
  ],
  drowned: [
    { unique: 'brinewrackCollar', tablets: 4 },
    { unique: 'tideturnGauntlets', tablets: 5 },
    { unique: 'tidewallPlate', tablets: 6 },
  ],
  gilded: [
    { unique: 'pennyCap', tablets: 3 },
    { unique: 'hoardersSash', tablets: 4 },
    { unique: 'pileOfOdds', tablets: 5 },
  ],
};

/** How many tablets a unique needs, or 0 if it has no tablets. */
export function tabletsNeeded(uniqueId: string): number {
  for (const list of Object.values(TABLET_SETS))
    for (const t of list) if (t.unique === uniqueId) return t.tablets;
  return 0;
}

export const TABLET_PREFIX = 'tablet:';

/** Socket Augers needed to add the nth socket (the first three are free). */
export function augerCost(nth: number): number {
  return nth <= 3 ? 0 : nth - 3;
}

/** Bench recipes paid in Bone Dust (EXPANSION 8.3): the always-available floor under the currency. */
export type BenchRecipe =
  | { kind: 'add'; family: string; label: string; dust: number; minMap: number }
  | { kind: 'remove'; label: string; dust: number; minMap: number }
  | { kind: 'socket'; nth: number; label: string; dust: number; minMap: number };

export const BENCH_RECIPES: BenchRecipe[] = [
  { kind: 'add', family: 'life', label: 'Maximum life', dust: 20, minMap: 10 },
  { kind: 'add', family: 'fireRes', label: 'Fire resistance', dust: 15, minMap: 10 },
  { kind: 'add', family: 'coldRes', label: 'Cold resistance', dust: 15, minMap: 10 },
  { kind: 'add', family: 'lightRes', label: 'Lightning resistance', dust: 15, minMap: 10 },
  { kind: 'remove', label: 'Remove one chosen affix', dust: 25, minMap: 10 },
  { kind: 'add', family: 'chaosRes', label: 'Chaos resistance', dust: 40, minMap: 25 },
  { kind: 'socket', nth: 4, label: 'Fourth socket', dust: 40, minMap: 25 },
  { kind: 'add', family: 'aspdGlobal', label: 'Attack speed', dust: 30, minMap: 40 },
  { kind: 'add', family: 'castSpeed', label: 'Cast speed', dust: 30, minMap: 40 },
  { kind: 'socket', nth: 5, label: 'Fifth socket', dust: 120, minMap: 40 },
  { kind: 'socket', nth: 6, label: 'Sixth socket', dust: 300, minMap: 60 },
];

/** Bone Dust from salvaging: by kind, times (1 + item level / 50). */
export const SALVAGE_BASE = { normal: 1, magic: 2, rare: 5, unique: 15, gem: 4, flask: 1 };

/** The player-facing name of a pouch entry: a currency, or "Tablet: <unique>". */
export function currencyLabel(id: string): string {
  if (id.startsWith(TABLET_PREFIX)) {
    const u = id.slice(TABLET_PREFIX.length);
    const name =
      UNIQUES.find((x) => x.id === u)?.name ?? UNIQUE_FLASKS.find((x) => x.id === u)?.name;
    return `Tablet: ${name ?? u}`;
  }
  return currencyDef(id).name;
}

/** What a pouch entry does, in a line. */
export function currencyText(id: string): string {
  if (id.startsWith(TABLET_PREFIX)) {
    const u = id.slice(TABLET_PREFIX.length);
    return `A set of ${tabletsNeeded(u)} is exchanged at the Workbench for this unique.`;
  }
  return currencyDef(id).text;
}
