import type { MonsterTypeId } from './monsters';

/**
 * The six bosses (docs/BOSSES.md): one on each of maps 10, 30, 50, 70 and 90, and the last on map 100. Each asks the build one
 * question, and its brief says in a line or two what it does, so a player can get ready from five maps out.
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
  /** The warning at camp: one to three lines that describe the boss and say nothing of how to fight it. */
  brief: string[];
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
    brief: [
      'Rings a bell every ten seconds, and each ring is lightning.',
      'Behind his armour, he is never quite the same after.',
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
    brief: ['A rider that never stands still.', 'Fire follows its hooves.'],
    stunMult: 4,
    curseEffect: 0.67,
  },
  magistrate: {
    id: 'magistrate',
    map: 50,
    type: 'magistrate',
    name: 'the Magistrate',
    test: 'One huge hit, and clearing the room to make it smaller.',
    brief: [
      'Court is in session.',
      'The Magistrate passes sentence, and his witnesses stand to speak.',
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
    brief: [
      'A warden in a shell of crystal.',
      'It turns from fire to frost to lightning, and back.',
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
    brief: ['She carries every affliction there is,', 'and she does not keep them to herself.'],
    stunMult: 4,
    curseEffect: 1,
  },
  unmaker: {
    id: 'unmaker',
    map: 100,
    type: 'unmaker',
    name: 'the Unmaker',
    test: 'Build depth: it steals the best of your build.',
    brief: ['It unmakes what you have made.', 'And it wears what it takes.'],
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
