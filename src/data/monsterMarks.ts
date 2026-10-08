import type { MonsterModId, MonsterRarity } from './monsters';

/** How an enemy affix is shown: a coloured shape (map pips, inspect chips) and a plain-language effect. */
export type ModShape = 'circle' | 'diamond' | 'square' | 'triUp' | 'triDown' | 'ring';

export type ModMark = {
  color: number;
  shape: ModShape;
  /** Draws a faint aura on the ground under the monster. */
  aura: boolean;
  desc: string;
};

export const MOD_MARKS: Record<MonsterModId, ModMark> = {
  hasted: {
    color: 0xffe040,
    shape: 'triUp',
    aura: false,
    desc: '+25% movement, attack and cast speed.',
  },
  armoured: {
    color: 0xb8c0d0,
    shape: 'square',
    aura: false,
    desc: '+200% armour: physical hits are heavily reduced.',
  },
  elusive: {
    color: 0x70e8a8,
    shape: 'diamond',
    aura: false,
    desc: '+200% evasion: many attacks miss it.',
  },
  prismatic: {
    color: 0xff88ff,
    shape: 'ring',
    aura: true,
    desc: '+30% to all elemental resistances.',
  },
  fireBound: {
    color: 0xff6a28,
    shape: 'circle',
    aura: true,
    desc: 'Gains 50% of physical damage as extra fire.',
  },
  frostBound: {
    color: 0x6ac8ff,
    shape: 'circle',
    aura: true,
    desc: 'Gains 50% of physical damage as extra cold.',
  },
  stormBound: {
    color: 0xfff060,
    shape: 'diamond',
    aura: true,
    desc: 'Gains 50% of physical damage as extra lightning.',
  },
  vampiric: {
    color: 0xc01838,
    shape: 'triDown',
    aura: false,
    desc: 'Leeches 10% of damage dealt as life.',
  },
  regenerating: {
    color: 0x58d858,
    shape: 'square',
    aura: false,
    desc: 'Regenerates 1% of its life per second.',
  },
  fortified: {
    color: 0xe0a830,
    shape: 'square',
    aura: true,
    desc: '100% more life.',
  },
  volatile: {
    color: 0xff3030,
    shape: 'triDown',
    aura: true,
    desc: 'Explodes when it dies.',
  },
  raiser: {
    color: 0xa868e8,
    shape: 'diamond',
    aura: true,
    desc: 'Periodically raises more monsters.',
  },
  frenzied: {
    color: 0xff9040,
    shape: 'triUp',
    aura: false,
    desc: '50% more damage while on low life.',
  },
  rimeAura: {
    color: 0xa8f4ff,
    shape: 'ring',
    aura: true,
    desc: 'Chills nearby enemies with a freezing aura.',
  },
  unshakable: {
    color: 0x9098a8,
    shape: 'circle',
    aura: false,
    desc: 'Cannot be stunned.',
  },
  bloodless: {
    color: 0x8a1c2c,
    shape: 'ring',
    aura: false,
    desc: 'Cannot be leeched from: life and mana leech do nothing.',
  },
  unyielding: {
    color: 0xd0d0d8,
    shape: 'diamond',
    aura: false,
    desc: 'Immune to ailments: no ignite, bleed, poison, shock, chill or freeze.',
  },
  deflecting: {
    color: 0x58c0a0,
    shape: 'triUp',
    aura: false,
    desc: '+50% chance to evade projectile attacks.',
  },
  spellwarded: {
    color: 0x6878e8,
    shape: 'square',
    aura: false,
    desc: '+40% chance to block spells.',
  },
  fireWarded: {
    color: 0xff9a50,
    shape: 'ring',
    aura: true,
    desc: 'Immune to fire damage and ignite.',
  },
  frostWarded: {
    color: 0x90e0ff,
    shape: 'square',
    aura: true,
    desc: 'Immune to cold damage, chill and freeze.',
  },
  stormWarded: {
    color: 0xffff90,
    shape: 'triDown',
    aura: true,
    desc: 'Immune to lightning damage and shock.',
  },
  bulwarked: {
    color: 0x9a8868,
    shape: 'circle',
    aura: false,
    desc: '30% additional physical damage reduction.',
  },
  keenEyed: {
    color: 0xf0f0a0,
    shape: 'circle',
    aura: false,
    desc: 'Its hits cannot be evaded.',
  },
  sundering: {
    color: 0xc88060,
    shape: 'triUp',
    aura: false,
    desc: 'Its hits ignore half of your armour.',
  },
  siphoning: {
    color: 0x4060d0,
    shape: 'triDown',
    aura: false,
    desc: 'Its hits drain 5% of your maximum mana.',
  },
  rotTouched: {
    color: 0x80a030,
    shape: 'diamond',
    aura: true,
    desc: 'Gains 30% of its damage as extra chaos.',
  },
  shrouded: {
    color: 0xb0a0e8,
    shape: 'square',
    aura: true,
    desc: 'An energy shield shell worth 25% of its life, recharging when left alone.',
  },
  splitting: {
    color: 0xe8c0a0,
    shape: 'diamond',
    aura: false,
    desc: 'Splits into two weaker copies when it dies.',
  },
  thorned: {
    color: 0xd04040,
    shape: 'ring',
    aura: false,
    desc: 'Reflects 10% of melee hit damage back as physical damage.',
  },
  festering: {
    color: 0x9ad04a,
    shape: 'circle',
    aura: false,
    desc: 'Its hits have a 30% chance to poison you.',
  },
  carrionMother: {
    color: 0x9ad04a,
    shape: 'ring',
    aura: true,
    desc: 'Raises every corpse in the room every 10 seconds, and bursts into four caustic pools at half life.',
  },
  unremembered: {
    color: 0xb0d0ff,
    shape: 'ring',
    aura: true,
    desc: 'Phases out of sight for 2 seconds after each 20% of its life lost, then reappears behind you.',
  },
  precentor: {
    color: 0xe0a060,
    shape: 'ring',
    aura: true,
    desc: 'Cycles all four hexes on you, heals itself, and calls a Choirmaster at half life.',
  },
  zealous: {
    color: 0xe08a50,
    shape: 'triUp',
    aura: false,
    desc: 'When it dies, nearby allies deal 20% more damage for 6 seconds.',
  },
  hexWarded: {
    color: 0xb0b0c8,
    shape: 'square',
    aura: false,
    desc: 'Cannot be hexed.',
  },
  hexcaller: {
    color: 0xc070e0,
    shape: 'diamond',
    aura: true,
    desc: 'Its hits hex you with a random hex (4 second cooldown).',
  },
  gnawingQueen: {
    color: 0xd0b070,
    shape: 'ring',
    aura: true,
    desc: 'Burrows out of sight, emerges under you after a warning, and raises Nests.',
  },
  reliquarian: {
    color: 0xb0b8c8,
    shape: 'ring',
    aura: true,
    desc: 'Changes its core element at every quarter of its life, and is immune to the current one.',
  },
  huntsmaster: {
    color: 0xc8984a,
    shape: 'ring',
    aura: true,
    desc: 'Whistles up three Kennel Hounds every 10 seconds, and rushes at you in a line.',
  },
  treasurer: {
    color: 0xf0c848,
    shape: 'ring',
    aura: true,
    desc: 'Stops your regeneration and leech near it, takes flask charges, and calls two Cutpurses at half life.',
  },
  cinderTyrant: {
    color: 0xe8782a,
    shape: 'ring',
    aura: true,
    desc: 'A ring of fire goes out from it every ten seconds, and three Cinderlings are lit at half life.',
  },
  tidewarden: {
    color: 0x5ab8c8,
    shape: 'ring',
    aura: true,
    desc: 'Hooks you and drags you to it every ten seconds, and calls three Brine Leeches at half life.',
  },
  charging: {
    color: 0xe09a50,
    shape: 'triUp',
    aura: false,
    desc: 'Every 8 seconds it lowers its head and rushes at you in a line.',
  },
  flaskTaker: {
    color: 0xd8c050,
    shape: 'diamond',
    aura: false,
    desc: "Its hits take a fifth of a flask's charges from you.",
  },
  hobbling: {
    color: 0x90a0c0,
    shape: 'square',
    aura: false,
    desc: 'Its hits slow you by 30% for 2 seconds.',
  },
  boneWarden: {
    color: 0xe8e0c8,
    shape: 'ring',
    aura: true,
    desc: 'Raises a ring of four Skeleton Warriors at two thirds and at one third of its life.',
  },
  brood: {
    color: 0xc8a060,
    shape: 'circle',
    aura: false,
    desc: 'Splits into three Gnawers when it dies.',
  },
  wardingPulse: {
    color: 0x90c0e8,
    shape: 'ring',
    aura: true,
    desc: 'Every 8 seconds a ring goes out from it that throws you back three tiles: step out of it, or be moved.',
  },
  mirrored: {
    color: 0xb8b0f0,
    shape: 'triDown',
    aura: false,
    desc: 'A twin stands elsewhere. Kill one and the other has three seconds to follow before it is made whole.',
  },
  putrid: {
    color: 0x6a9a2a,
    shape: 'diamond',
    aura: true,
    desc: 'Leaves a caustic cloud where it dies: chaos damage over time to anyone standing in it.',
  },
};

export const RARITY_COLOR: Record<MonsterRarity, number> = {
  normal: 0xcfcfcf,
  magic: 0x8888ff,
  rare: 0xffd860,
  miniboss: 0xff9040,
  boss: 0xff4a40,
};

export function hex(c: number): string {
  return '#' + c.toString(16).padStart(6, '0');
}
