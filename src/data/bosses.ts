import type { MonsterTypeId } from './monsters';

/**
 * The six bosses (docs/BOSSES.md): one on each of maps 10, 30, 50, 70 and 90, and the last on map 100. Each asks the build one
 * question, and its card says what it is hard and soft to and what it deals, so a player can get ready from five maps out.
 * The fights are `sim/bosses.ts`; the numbers that tune them are here.
 */
export type BossId =
  'tollkeeper' | 'courser' | 'magistrate' | 'prismWarden' | 'rotwife' | 'unmaker';

export type BossDef = {
  id: BossId;
  /** The map it ends. */
  map: number;
  /** Its monster type (its body, its stats). */
  type: MonsterTypeId;
  name: string;
  /** The question it asks, in a phrase. */
  test: string;
  /** What it deals, what it resists and what it is weak to, in a word or two each (the card's head). */
  deals: string;
  resists: string;
  weak: string;
  /** The card: what it takes to kill it, and what it takes to survive it. */
  kill: string[];
  survive: string[];
  /** Its stun threshold, as a multiple of a normal monster's (bosses are 4 times). */
  stunMult: number;
  /** How much of a curse's effect it takes (3.9 bosses take a third less). */
  curseEffect: number;
};

export const BOSSES: Record<BossId, BossDef> = {
  tollkeeper: {
    id: 'tollkeeper',
    map: 10,
    type: 'tollkeeper',
    name: 'the Tollkeeper',
    test: 'Single-target damage: it grows stronger with every toll.',
    deals: 'lightning, physical',
    resists: 'physical (armour), lightning',
    weak: 'cold',
    kill: [
      'Heavy armour: physical hits do less, small ones much less',
      'Lightning resistance +30%',
      'Cold −30%; chill and freeze slow its clock',
      'Can be stunned; a stun in the swing cancels the toll',
    ],
    survive: [
      'Every 10 seconds it tolls: rings of lightning that shock',
      'Each toll adds damage and speed, for good',
      'Light physical melee between tolls',
    ],
    stunMult: 1.5,
    curseEffect: 0.67,
  },
  courser: {
    id: 'courser',
    map: 30,
    type: 'courser',
    name: 'the Courser',
    test: 'Mobility and reach: it never stops moving.',
    deals: 'fire attacks',
    resists: 'fire, attacks (evasion)',
    weak: 'cold (chill and freeze slow it)',
    kill: [
      'Very evasive: attacks need accuracy; spells always hit',
      'Fire resistance +40%',
      'Cold −25%; chill slows it twice as much, freeze holds it',
      'Cannot be stunned at a gallop',
    ],
    survive: [
      'Fire attacks as it passes: evasion and block work',
      'Burning lanes across the floor',
      'A charge back along a lane shown first',
    ],
    stunMult: 4,
    curseEffect: 0.67,
  },
  magistrate: {
    id: 'magistrate',
    map: 50,
    type: 'magistrate',
    name: 'the Magistrate',
    test: 'One huge hit, and clearing the room to make it smaller.',
    deals: 'physical',
    resists: 'curses, a share of spells',
    weak: 'lightning',
    kill: [
      'Immune to curses',
      'Blocks 25% of spells',
      'Lightning −25%',
      'Its Witnesses are frail: kill them first',
    ],
    survive: [
      'The Sentence: one huge physical blow; no evasion, no block',
      'The Sentence stuns: stun avoidance matters',
      'Witnesses curse you and make the Sentence heavier',
    ],
    stunMult: 4,
    curseEffect: 0,
  },
  prismWarden: {
    id: 'prismWarden',
    map: 70,
    type: 'prismWarden',
    name: 'the Prism Warden',
    test: 'All three elemental resistances, and more than one element.',
    deals: 'fire, cold and lightning spells, in turn',
    resists: 'the element it is attuned to',
    weak: 'the element it just left; chaos',
    kill: [
      'Immune to the element it is attuned to',
      'Fractured (+40% taken) by the element it just left',
      'A crystal shield worth half its life; chaos goes past it',
      'Physical and chaos are never resisted',
    ],
    survive: [
      'Spells of one element at a time: spell block and spell dodge work',
      "That element's ailment, often: ignite, freeze, shock",
      'A pattern for each element: a ring, lanes, a cross',
    ],
    stunMult: 4,
    curseEffect: 0.67,
  },
  rotwife: {
    id: 'rotwife',
    map: 90,
    type: 'rotwife',
    name: 'the Rotwife',
    test: 'Ailments, and chaos resistance.',
    deals: 'chaos and physical, every ailment',
    resists: 'chaos',
    weak: 'fire; curses at full effect',
    kill: [
      'Chaos resistance +25% (never immune)',
      'Regrows, but not while she burns, bleeds or is poisoned',
      'Fire −25%',
      'Curses at full effect',
    ],
    survive: [
      'Every ailment, in turn: bleed, poison, ignite, freeze, shock',
      'Chaos, at most half of her damage; rot on the floor',
      'Cleansing flasks and ailment immunities are the answer',
    ],
    stunMult: 4,
    curseEffect: 1,
  },
  unmaker: {
    id: 'unmaker',
    map: 100,
    type: 'unmaker',
    name: 'the Unmaker',
    test: 'Build depth: it steals the best of your build.',
    deals: 'what it has stolen',
    resists: 'the damage you deal it most',
    weak: 'breaking its shards',
    kill: [
      'Hardens against the damage type you deal it most',
      'No hit takes more than 10% of its life',
      'Breaking a shard returns the piece and exposes it',
      'Cannot be stunned, except by breaking a shard',
    ],
    survive: [
      'It steals your best resistance, defence, supports and flasks',
      'It hits in the element it stole',
      'It drinks your stolen flasks',
    ],
    stunMult: 4,
    curseEffect: 0.67,
  },
};

export const BOSS_IDS = Object.keys(BOSSES) as BossId[];

/** The boss that ends a map, if one does. */
export function bossForMap(map: number): BossId | null {
  return BOSS_IDS.find((id) => BOSSES[id].map === map) ?? null;
}

/** The boss of a monster type, if it is one. */
export function bossOfType(type: MonsterTypeId): BossDef | undefined {
  return BOSSES[type as BossId];
}

/** The camp shows the next boss's card from this many maps before its map. */
export const BOSS_CARD_AHEAD = 5;

/** The next boss at or after this map, and how many maps away it is, if it is near enough to show. */
export function bossAhead(map: number): { boss: BossDef; maps: number } | null {
  const id = BOSS_IDS.find((b) => BOSSES[b].map >= map);
  if (!id) return null;
  const maps = BOSSES[id].map - map;
  return maps <= BOSS_CARD_AHEAD ? { boss: BOSSES[id], maps } : null;
}

/** After a boss freezes or stuns the character, it cannot again for this long (docs/BOSSES.md rule 6). */
export const BOSS_LOCK_SECONDS = 4;

// The Tollkeeper (section 4).
export const TOLL_EVERY = 10;
export const TOLL_TELL = 2;
/** What each toll adds, for good: damage, speed, and a ring to the next toll's waves. */
export const TOLL_DAMAGE = 0.1;
export const TOLL_SPEED = 0.06;
export const TOLL_RINGS = 3;
/** The toll's rings: the first's radius, the gap between rings, how wide each is, and the time between them. */
export const TOLL_RING_START = 2;
export const TOLL_RING_STEP = 2.2;
export const TOLL_RING_WIDTH = 1.1;
export const TOLL_RING_DELAY = 0.45;
/** A toll's ring hits for this many of its blows, and shocks. */
export const TOLL_RING_MULT = 0.9;
export const TOLL_SHOCK = 0.2;

// The Courser (section 5).
/** It circles the character this far out (inside melee reach), at a canter of this many tiles a second. */
export const CANTER_RADIUS = 2.1;
export const CANTER_SPEED = 4;
/** How long it canters, then gallops, and how far each gallop runs. */
export const CANTER_SECONDS = 5.5;
export const GALLOP_LENGTH = 11;
export const GALLOP_SPEED = 9;
/** The lane is shown this long before it runs, and burns this long after. */
export const GALLOP_TELL = 0.7;
export const LANE_BURN_SECONDS = 6;
export const LANE_WIDTH = 1.4;
/** Chill slows it twice as much as it slows anything else. */
export const COURSER_CHILL = 2;

// The Magistrate (section 6).
export const SENTENCE_EVERY = 15;
export const SENTENCE_TELL = 3;
/** The Sentence is this many of its own blows, and each living Witness adds a share. */
export const SENTENCE_MULT = 3.2;
export const WITNESS_WEIGHT = 0.15;
export const WITNESSES = 4;
/** Each Witness after the first adds this to the hex the character carries. */
export const WITNESS_HEX_STEP = 0.1;
export const SENTENCE_STUN = 1.2;

// The Prism Warden (section 7).
export const ATTUNE_SECONDS = 8;
export const ATTUNE_SHIFT = 1.5;
export const FRACTURE_SECONDS = 3;
export const FRACTURE_TAKEN = 0.4;
export const PRISM_PATTERN_EVERY = 4.5;

// The Rotwife (section 8).
export const ROT_REGEN = 0.004;
export const ROT_PATCH_EVERY = 1.4;
export const ROT_PATCH_SECONDS = 8;
export const ROT_ROTATION = ['bleed', 'poison', 'ignite', 'freeze', 'shock'] as const;
export type RotAilment = (typeof ROT_ROTATION)[number];

// The Unmaker (section 9).
export const THEFT_AT = [0.8, 0.6, 0.4, 0.2];
export type TheftKind = 'resistance' | 'defence' | 'supports' | 'flasks';
export const THEFT_ORDER: TheftKind[] = ['resistance', 'defence', 'supports', 'flasks'];
export const THEFT_RES = 50;
export const SHARD_LIFE = 0.04;
export const SHARD_ORBIT = 2.6;
export const STAGGER_SECONDS = 2;
export const EXPOSED_SECONDS = 4;
export const EXPOSED_TAKEN = 0.2;
export const ADAPT_WINDOW = 8;
export const ADAPT_MAX = 0.4;
/** While it holds the flasks it heals this share of its life a second. */
export const DRINK_REGEN = 0.008;
