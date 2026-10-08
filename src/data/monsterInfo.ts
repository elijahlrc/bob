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
  kennel: 'being caught: leaps, charges and ambushes',
  gilded: 'recovery: flasks, regeneration and leech',
  drowned: 'being held: hooks, slows and shock',
};

/** What every monster of a faction does, where the faction has such a rule. */
export const FACTION_RULES: Partial<Record<FactionId, string>> = {
  hollow: 'Ethereal: takes 50% less physical damage and cannot bleed.',
  reliquary: 'Core Golems are immune to one element and its ailments.',
  kennel: 'Hounds leap from a distance; Handlers speed the pack up.',
  gilded: 'Cutpurses steal flask charges; Bursars stop your recovery.',
  drowned:
    'Tidecallers hook you and drag you in; Wracks and Leeches slow you; Drowners come up under you.',
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
  kennel: 0xc89a68,
  gilded: 0xf0c848,
  drowned: 0x5ab8c8,
};
export const FACTION_GLYPH: Record<FactionId, string> = {
  ossuary: '◆',
  rot: '●',
  hollow: '◇',
  choir: '▲',
  swarm: '▪',
  reliquary: '■',
  kennel: '▼',
  gilded: '★',
  drowned: '≈',
};

/** One clause on what a type does, for tooltips and the inspect card. */
export const TYPE_BLURBS: Record<MonsterTypeId, string> = {
  warrior: 'A plain melee fighter.',
  brute: 'Slow and heavy: swings a wide arc that staggers.',
  archer: 'Looses two arrows in quick succession; they can be evaded or blocked.',
  mage: 'Casts a large, slow orb from range.',
  shieldbearer: 'A tower shield stops arrows from the front; its bash staggers.',
  shambler: 'Slow; rises once more soon after it dies.',
  bloater: 'Walks up to you and bursts into a caustic cloud.',
  spitter: 'Lobs caustic poison onto the ground where you stand.',
  hag: 'Keeps her distance, lobs rot onto the ground and raises nearby corpses.',
  gloomstalker: 'Fast and evasive; blinks next to you.',
  wailer: 'Wails in a ring of cold around itself; stay out of reach or step away.',
  wisp: 'Fast and fragile; every hit drains your mana.',
  wight: 'Wraps nearby allies in energy shield.',
  hexer: 'Hexes you every few seconds.',
  censer: 'Its aura speeds up and strengthens allies nearby.',
  flagellant: 'Lashes in two quick arcs, and grows more frenzied each time an ally dies.',
  choirmaster: 'Channels a heal for nearby allies; a stun interrupts it.',
  gnawer: 'Comes in packs of a dozen; its bites can bleed.',
  bat: 'Flies over walls and weaves as it closes in.',
  beetle: 'Curls up when hit and takes far less physical damage.',
  nest: 'Stands still and spawns Gnawers until it is destroyed.',
  sentinel: 'Slow and armoured; slams the ground where you stand, and pulses a ring.',
  arbalest: 'Stands still, marks a line on the ground and strikes everything on it.',
  golem: 'Immune to its element; leaves burning, chilled or shocked ground.',
  pylon: 'While it stands, allies near it take no damage.',
  hound: 'Fast; crouches, then leaps onto you from a distance.',
  boar: 'Lowers its head and rushes in a line, then gores in an arc; its tusks stagger.',
  handler: 'Keeps its distance and whistles the pack into a faster, harder-hitting pack.',
  cat: 'Lies in wait, then pounces for a big hit.',
  cutpurse: 'Steals flask charges and runs; kill it to get them back.',
  guard: 'Armoured; throws back part of the melee damage it takes.',
  bursar: 'While it stands, your regeneration, leech and energy shield recharge stop near it.',
  slinger: 'Slings two stones in quick succession and backs away as you close in.',
  crawler: 'The top half of a skeleton on its hands: fast and fragile, and its grip slows you.',
  heap: 'A slow mound of fused bone that slams the ground, and falls apart into Bone Crawlers.',
  gorger: 'Eats the bodies of the dead to heal, and swings its arms in a wide arc.',
  watcher: 'A floating eye that hangs back, marks a line and strikes along it, and curses you.',
  bell: 'Hangs in the air and tolls: a ring that staggers, and an aura that drives its allies on.',
  spinner: 'Keeps behind the swarm and lobs webs onto the ground that slow you.',
  coffer: 'Lies still as a chest until you come close, then springs open and bites; it pays well.',
  tidecaller:
    'A drifting shade with a hook: marks a line, and drags what stands in it toward itself.',
  wrack: 'A sodden, heavy corpse that lurches in and swings in a wide arc; its blows slow you.',
  leech: 'Hops onto you and drains your life as it clings; its grip slows you.',
  drowner: 'Sinks out of sight and comes up under you with a slam.',
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
  | 'reflectors'
  | 'ground'
  | 'salvos'
  | 'lanes';

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
  'ground',
  'salvos',
  'lanes',
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
  ground: {
    name: 'Ground attacks',
    text: 'Wedges, rings and pools shown on the ground before they land: the character steps out of them, so speed and reach help.',
  },
  salvos: {
    name: 'Salvos',
    text: 'Shots come in pairs: evasion and block help, and so does closing the distance.',
  },
  lanes: {
    name: 'Lanes',
    text: 'A line is marked, then struck: movement beats evasion here.',
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
  crawler: ['swarm', 'holders'],
  wrack: ['holders'],
  leech: ['swarm', 'holders', 'drains'],
  drowner: ['blinkers'],
  heap: ['armoured'],
  spinner: ['holders'],
  wailer: ['ailments'],
};
