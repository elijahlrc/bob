import type { FactionId, MonsterTypeId } from './monsters';

/**
 * What the player is told about the monsters before and during a map (docs/ENEMIES.md section 5). All text here is our
 * own. A new type needs a blurb (a test checks), and any tags it carries.
 */

/** One line per faction: the question it asks of a build (EXPANSION 7.3). */
export const FACTION_ASKS: Record<FactionId, string> = {
  ossuary: 'stuns, blocks and arrows',
  rot: 'chaos damage, poison and corpses',
  hollow: 'physical damage that stops working; mana and accuracy',
  choir: 'hexes, buffs and heals: what do you kill first?',
  swarm: 'numbers',
  reliquary: 'armour and immunity',
};

/** What every monster of a faction does, where the faction has such a rule. */
export const FACTION_RULES: Partial<Record<FactionId, string>> = {
  hollow: 'Ethereal: takes 50% less physical damage and cannot bleed.',
  reliquary: 'Core Golems are immune to one element and its ailments.',
  swarm: 'Gnawers come in packs of a dozen or more.',
  rot: 'Dead Shamblers rise again; Bloaters leave clouds.',
};

/** The colour a faction is drawn in (the chips on the camp card and the monsters on the map), and a glyph that does not need it. */
export const FACTION_COLOR: Record<FactionId, number> = {
  ossuary: 0xe8e0c8,
  rot: 0x9fd07a,
  hollow: 0x8fb8e8,
  choir: 0xe0a070,
  swarm: 0xd8b880,
  reliquary: 0xa8b0c0,
};
export const FACTION_GLYPH: Record<FactionId, string> = {
  ossuary: '◆',
  rot: '●',
  hollow: '◇',
  choir: '▲',
  swarm: '▪',
  reliquary: '■',
};

/** One clause on what a type does, for tooltips and the inspect card. */
export const TYPE_BLURBS: Record<MonsterTypeId, string> = {
  warrior: 'A plain melee fighter.',
  brute: 'Slow and heavy: hits hard and staggers.',
  archer: 'Shoots from range; its arrows can be evaded or blocked.',
  mage: 'Casts elemental bolts from range.',
  shieldbearer: 'A tower shield stops arrows from the front; its bash staggers.',
  shambler: 'Slow; rises once more soon after it dies.',
  bloater: 'Walks up to you and bursts into a caustic cloud.',
  spitter: 'Spits chaos bolts that poison.',
  hag: 'Keeps her distance and raises nearby corpses.',
  gloomstalker: 'Fast and evasive; blinks next to you.',
  wailer: 'Casts chilling bolts from range.',
  wisp: 'Fast and fragile; every hit drains your mana.',
  wight: 'Wraps nearby allies in energy shield.',
  hexer: 'Hexes you every few seconds.',
  censer: 'Its aura speeds up and strengthens allies nearby.',
  flagellant: 'Grows more frenzied each time an ally dies.',
  choirmaster: 'Channels a heal for nearby allies; a stun interrupts it.',
  gnawer: 'Comes in packs of a dozen; its bites can bleed.',
  bat: 'Flies over walls and weaves as it closes in.',
  beetle: 'Curls up when hit and takes far less physical damage.',
  nest: 'Stands still and spawns Gnawers until it is destroyed.',
  sentinel: 'Slow and armoured; slams the ground where you stand.',
  arbalest: 'Stands still and fires piercing bolts down a line.',
  golem: 'Immune to its element; leaves burning, chilled or shocked ground.',
  pylon: 'While it stands, allies near it take no damage.',
};

/**
 * Threat tags (docs/ENEMIES.md 5.1): what a map asks of a build, in a fixed order. `ranged` is derived from the attack kind of
 * a type; the rest are listed here per type.
 */
export type ThreatTag =
  | 'ranged'
  | 'swarm'
  | 'hexes'
  | 'summoners'
  | 'spawners'
  | 'fliers'
  | 'blinkers'
  | 'healers'
  | 'ailments'
  | 'immunities'
  | 'drains'
  | 'armoured'
  | 'clouds'
  | 'chargers'
  | 'thieves'
  | 'suppressors'
  | 'holders'
  | 'reflectors';

export const TAG_ORDER: ThreatTag[] = [
  'ranged',
  'swarm',
  'hexes',
  'summoners',
  'spawners',
  'fliers',
  'blinkers',
  'healers',
  'ailments',
  'immunities',
  'drains',
  'armoured',
  'clouds',
  'chargers',
  'thieves',
  'suppressors',
  'holders',
  'reflectors',
];

export const TAG_INFO: Record<ThreatTag, { name: string; text: string }> = {
  ranged: { name: 'Ranged', text: 'Many shoot from a distance: evasion, block and reach help.' },
  swarm: {
    name: 'Swarm',
    text: 'Large packs: area damage and armour help; single-target builds struggle.',
  },
  hexes: { name: 'Hexes', text: 'Curses you: high resistances and reduced curse effect help.' },
  summoners: {
    name: 'Summoners',
    text: 'Raises the dead: kill them first, and burn or burst the corpses.',
  },
  spawners: { name: 'Spawners', text: 'Nests keep spawning until destroyed: kill them first.' },
  fliers: { name: 'Fliers', text: 'Fly over walls and weave: area damage helps.' },
  blinkers: { name: 'Blinkers', text: 'Appear next to you: do not rely on keeping your distance.' },
  healers: {
    name: 'Healers',
    text: 'Heal, shield or empower their allies: kill them first, or stun them.',
  },
  ailments: {
    name: 'Ailments',
    text: 'Poison, bleed and chill: ailment avoidance and regeneration help.',
  },
  immunities: {
    name: 'Immunities',
    text: 'Some are immune to an element: bring a second damage type.',
  },
  drains: { name: 'Drains', text: 'Drains your mana: mana regeneration or leech helps.' },
  armoured: {
    name: 'Armoured',
    text: 'Heavily armoured: elemental, chaos or armour-piercing damage helps.',
  },
  chargers: {
    name: 'Chargers',
    text: 'Leap or rush at you from a distance: tough defences and stun resistance help; kiting does not.',
  },
  thieves: {
    name: 'Thieves',
    text: 'Take flask charges and run: kill them before they get away, or do not rely on flasks.',
  },
  suppressors: {
    name: 'Suppressors',
    text: 'Stop your life, mana and energy shield from recovering near them: kill them first.',
  },
  holders: {
    name: 'Holders',
    text: 'Pull or slow you: do not count on staying out of reach.',
  },
  reflectors: {
    name: 'Reflectors',
    text: 'Throw back part of the damage dealt to them: ranged and damage over time help.',
  },
  clouds: {
    name: 'Clouds',
    text: 'Leaves harmful ground: keep moving, and watch your chaos resistance.',
  },
};

/** The tags each type carries (besides `ranged`, which follows from how it attacks). */
export const TYPE_TAGS: Partial<Record<MonsterTypeId, ThreatTag[]>> = {
  gnawer: ['swarm', 'ailments'],
  bat: ['swarm', 'fliers'],
  wisp: ['swarm', 'drains'],
  hexer: ['hexes'],
  hag: ['summoners'],
  nest: ['spawners', 'swarm'],
  gloomstalker: ['blinkers'],
  choirmaster: ['healers'],
  wight: ['healers'],
  pylon: ['healers', 'armoured'],
  sentinel: ['armoured'],
  golem: ['immunities', 'clouds'],
  bloater: ['clouds'],
  spitter: ['ailments'],
  wailer: ['ailments'],
};
