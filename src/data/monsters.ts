import { mod, type Element, type Mod } from '../mods/types';
import type { ArchetypeId } from './archetypes';
import type { DefenceProfile } from './defence';
import type { MoveSpec, Senses } from './movement';
import type { PhaseSpec } from './phases';
import type { ShapeSpec } from './shapes';

/** DESIGN.md §12. */

export type MonsterTypeId =
  | 'warrior'
  | 'brute'
  | 'archer'
  | 'mage'
  | 'shieldbearer'
  // The Rot (EXPANSION 7.3)
  | 'shambler'
  | 'bloater'
  | 'spitter'
  | 'hag'
  // The Hollow
  | 'gloomstalker'
  | 'wailer'
  | 'wisp'
  | 'wight'
  // The Ashen Choir
  | 'hexer'
  | 'censer'
  | 'flagellant'
  | 'choirmaster'
  // The Swarm
  | 'gnawer'
  | 'bat'
  | 'beetle'
  | 'nest'
  // The Reliquary
  | 'sentinel'
  | 'arbalest'
  | 'golem'
  | 'pylon'
  // The Kennel (docs/ENEMIES.md 7.4)
  | 'hound'
  | 'boar'
  | 'handler'
  | 'cat'
  // The Gilded
  | 'cutpurse'
  | 'guard'
  | 'bursar'
  | 'slinger'
  // Additions to the factions that exist (docs/ROSTER.md 7.1)
  | 'crawler'
  | 'heap'
  | 'gorger'
  | 'watcher'
  | 'bell'
  | 'spinner'
  | 'coffer'
  // The Drowned (docs/ROSTER.md 7.2)
  | 'tidecaller'
  | 'wrack'
  | 'leech'
  | 'drowner';

/** The monster families (EXPANSION 7.3). The Choir, the Swarm and the Reliquary join in later milestones. */
export type FactionId =
  'ossuary' | 'rot' | 'hollow' | 'choir' | 'swarm' | 'reliquary' | 'kennel' | 'gilded' | 'drowned';

export const FACTION_NAMES: Record<FactionId, string> = {
  ossuary: 'Ossuary',
  rot: 'the Rot',
  hollow: 'the Hollow',
  choir: 'the Ashen Choir',
  swarm: 'the Swarm',
  reliquary: 'the Reliquary',
  kennel: 'the Kennel',
  gilded: 'the Gilded',
  drowned: 'the Drowned',
};

/** The body a type is drawn with (humanoid factions reuse the figure rig with a new palette). */
export type BodyKind =
  | 'warrior'
  | 'brute'
  | 'archer'
  | 'mage'
  | 'gnawer'
  | 'bat'
  | 'beetle'
  | 'nest'
  | 'sentinel'
  | 'arbalest'
  | 'golem'
  | 'pylon'
  | 'hound'
  | 'boar'
  | 'cat'
  // Bodies of the Rot and the Hollow that are not a person (docs/ROSTER.md 4.2).
  | 'bloat'
  | 'toad'
  | 'orb'
  | 'crawler'
  | 'heap'
  | 'bell'
  | 'spider'
  | 'chest'
  | 'worm';

/**
 * The pose family of an attack (docs/ROSTER.md 4.3): how the body moves when it strikes, apart from which rig it is. A type
 * that sets none gets the family its body implies (an `archer` body draws a bow, a `mage` body casts, the rest strike).
 */
export type Stance = 'strike' | 'bow' | 'cast' | 'throw' | 'lash' | 'none';

/**
 * What a humanoid body is made of (docs/ROSTER.md 4.1): `bone` is the Ossuary's skeleton (a skull, ribs, bone limbs), `flesh`
 * a solid body in a garment with a face, and `spectre` a body with no legs that hangs in the air. Bone is the Ossuary's
 * alone, so that the player can learn that a skull means the Ossuary.
 */
export type BodyStyle = 'bone' | 'flesh' | 'spectre';

/**
 * What a type is for in a pack (docs/ENEMIES.md 4.2): `front` holds the line, `ranged` shoots from behind it, `support` heals,
 * buffs or shields, `special` has a trick of its own (bursting, blinking, spawning), `swarm` comes in numbers.
 */
export type Role = 'front' | 'ranged' | 'support' | 'special' | 'swarm';

export type MonsterTypeDef = {
  id: MonsterTypeId;
  role: Role;
  name: string;
  faction: FactionId;
  /** The figure it is drawn with. */
  body: BodyKind;
  /** A rhythm of blows: each beat is a multiple of its attack time, with the damage to match (docs/ROSTER.md 6.5). */
  pattern?: number[];
  /** Things it does once, at a share of its life (docs/ROSTER.md 6.5). */
  phases?: PhaseSpec[];
  /** How it moves, on top of the walk (docs/ROSTER.md 6.3). */
  movement?: MoveSpec[];
  /** What it notices and whom it goes for, where it is not the usual (docs/ROSTER.md 6.4). */
  senses?: Senses;
  /** What combat role it is (docs/ROSTER.md 6.1): its stats, defence lean, movement and engagement come from the archetype. */
  archetype: ArchetypeId;
  /** What it is hard and soft to, on top of its faction's (docs/ROSTER.md 6.2). */
  defence?: DefenceProfile;
  /** How it attacks, when it is not a plain strike (docs/ROSTER.md section 5). */
  shape?: ShapeSpec;
  /** The pose family of its attack, when it is not the one its body implies (docs/ROSTER.md 4.3). */
  stance?: Stance;
  /** Not met on maps below this level (a heavy type is no match for the first maps). */
  minLevel?: number;
  /** Its hits slow the character by 30% for 2 seconds (the Hobbling mod, as a trait of the type). */
  hobbles?: boolean;
  /** What it drops is this many times the usual (a chest that is found pays). */
  bonusLoot?: number;
  /** Leaves no body when it dies (a spectre unravels, a flame goes out): nothing for a Hag to raise or a Shambler to rise from. */
  noBody?: boolean;
  /** What its body is made of, when it is not its faction's (docs/ROSTER.md 4.1). Only meaningful on a humanoid rig. */
  style?: BodyStyle;
  /** A caster is always elemental or chaos by nature, and never rolls an element variant. */
  innate?: boolean;
  /** Always carries an element (a Core Golem is fire, cold or lightning, never plain). */
  elemental?: boolean;
  /** Never moves: it fights, spawns or shields from where it stands. */
  stationary?: boolean;
  /** Does not attack at all (a nest, a pylon). */
  noAttack?: boolean;
  /** Moves over walls, though it still needs line of sight to shoot. */
  flies?: boolean;
  lifeMult: number;
  dmgMult: number;
  /** Attack reach (melee) or preferred range (ranged), tiles. */
  range: number;
  attack: 'melee' | 'projectile' | 'spell';
  speed: number;
  attackTime: number;
  radius: number;
  mods: Mod[];
};

export const MONSTER_TYPES: Record<MonsterTypeId, MonsterTypeDef> = {
  warrior: {
    id: 'warrior',
    role: 'front',
    faction: 'ossuary',
    body: 'warrior',
    archetype: 'brawler',
    name: 'Skeleton Warrior',
    lifeMult: 1,
    dmgMult: 1,
    range: 1.2,
    attack: 'melee',
    speed: 3,
    attackTime: 1.2,
    radius: 0.4,
    mods: [],
  },
  brute: {
    id: 'brute',
    role: 'front',
    faction: 'ossuary',
    body: 'brute',
    archetype: 'bruiser',
    movement: [{ id: 'momentum', from: 0.5, to: 1.5, seconds: 2.5 }],
    senses: { aggro: 7 },
    defence: { armour: 80, stun: 100 },
    shape: { id: 'swing', arc: 150, radius: 2.4, lock: 0.3 },
    name: 'Skeleton Brute',
    lifeMult: 1.7,
    dmgMult: 1.9,
    range: 1.5,
    attack: 'melee',
    speed: 2.2,
    attackTime: 1.9,
    radius: 0.6,
    mods: [mod('stunDamage', 'inc', 50)],
  },
  archer: {
    id: 'archer',
    role: 'ranged',
    faction: 'ossuary',
    body: 'archer',
    archetype: 'gunner',
    pattern: [0.7, 0.7, 1.6],
    defence: { armour: -30, evasion: -40 },
    shape: { id: 'salvo', count: 2, mult: 0.5 },
    name: 'Skeleton Archer',
    lifeMult: 0.7,
    dmgMult: 0.8,
    range: 7,
    attack: 'projectile',
    speed: 3,
    attackTime: 1.3,
    radius: 0.4,
    mods: [],
  },
  mage: {
    id: 'mage',
    role: 'ranged',
    faction: 'ossuary',
    body: 'mage',
    archetype: 'artillery',
    defence: { armour: -30, es: 0.4, res: { chaos: -30 } },
    shape: { id: 'orb', speed: 0.5, mult: 0.9 },
    name: 'Skeleton Mage',
    lifeMult: 0.6,
    dmgMult: 1.1,
    range: 9,
    attack: 'spell',
    speed: 1.6,
    attackTime: 1.5,
    radius: 0.4,
    mods: [],
  },
  shieldbearer: {
    id: 'shieldbearer',
    role: 'front',
    name: 'Skeleton Shieldbearer',
    faction: 'ossuary',
    body: 'warrior',
    archetype: 'bulwark',
    movement: [{ id: 'tether', anchors: ['archer', 'mage'], radius: 6 }],
    defence: { armour: 120 },
    lifeMult: 1.4,
    dmgMult: 0.8,
    range: 1.2,
    attack: 'melee',
    speed: 2.2,
    attackTime: 1.4,
    radius: 0.5,
    // The shield bash staggers.
    mods: [mod('stunDamage', 'inc', 150)],
  },
  shambler: {
    id: 'shambler',
    role: 'front',
    name: 'Shambler',
    faction: 'rot',
    body: 'warrior',
    archetype: 'brawler',
    movement: [{ id: 'lurch', go: 1, pace: 1.6, stop: 0.8 }],
    innate: true,
    lifeMult: 1.6,
    dmgMult: 0.9,
    range: 1.2,
    attack: 'melee',
    speed: 2.2,
    attackTime: 1.4,
    radius: 0.5,
    mods: [mod('convert.physical.chaos', 'base', 30)],
  },
  bloater: {
    id: 'bloater',
    role: 'special',
    name: 'Bloater',
    faction: 'rot',
    body: 'bloat',
    archetype: 'bomber',
    movement: [{ id: 'kamikaze' }],
    defence: { res: { fire: -30 } },
    innate: true,
    lifeMult: 1.2,
    dmgMult: 0.5,
    range: 1,
    attack: 'melee',
    speed: 1.6,
    attackTime: 1.5,
    radius: 0.6,
    mods: [],
  },
  spitter: {
    id: 'spitter',
    role: 'ranged',
    name: 'Spitter',
    faction: 'rot',
    body: 'toad',
    archetype: 'artillery',
    shape: { id: 'lob', radius: 1.6, zone: 'caustic', seconds: 4, dps: 0.35, mult: 0.5, lock: 0.3 },
    stance: 'throw',
    innate: true,
    lifeMult: 0.7,
    dmgMult: 0.75,
    range: 8.5,
    attack: 'projectile',
    speed: 2,
    attackTime: 1.5,
    radius: 0.4,
    mods: [mod('convert.physical.chaos', 'base', 100), mod('chance.poison', 'base', 40)],
  },
  hag: {
    id: 'hag',
    role: 'support',
    name: 'Carrion Hag',
    faction: 'rot',
    body: 'mage',
    archetype: 'summoner',
    phases: [{ at: 0.3, do: 'flee', seconds: 4 }],
    defence: { es: 0.3 },
    shape: { id: 'lob', radius: 1.8, zone: 'caustic', seconds: 4, dps: 0.5, mult: 0.6, lock: 0.3 },
    innate: true,
    lifeMult: 1,
    dmgMult: 0.5,
    range: 7,
    attack: 'spell',
    speed: 2.4,
    attackTime: 1.6,
    radius: 0.4,
    mods: [mod('convert.physical.chaos', 'base', 100)],
  },
  gloomstalker: {
    id: 'gloomstalker',
    role: 'special',
    name: 'Gloomstalker',
    faction: 'hollow',
    body: 'warrior',
    archetype: 'cutthroat',
    movement: [{ id: 'phase' }],
    senses: { leash: 0, veil: 2.5 },
    defence: { evasion: 150 },
    lifeMult: 0.6,
    dmgMult: 1.5,
    range: 1.2,
    attack: 'melee',
    speed: 3.5,
    attackTime: 1.1,
    radius: 0.4,
    // Twice the normal evasion.
    mods: [],
  },
  wailer: {
    id: 'wailer',
    role: 'ranged',
    name: 'Wailer',
    faction: 'hollow',
    body: 'mage',
    archetype: 'controller',
    movement: [{ id: 'phase' }],
    senses: { leash: 3 },
    defence: { res: { cold: 10 } },
    shape: { id: 'nova', radius: 3, mult: 1.1 },
    innate: true,
    lifeMult: 0.8,
    dmgMult: 1,
    range: 3,
    attack: 'spell',
    speed: 2.4,
    attackTime: 1.5,
    radius: 0.4,
    mods: [mod('convert.physical.cold', 'base', 100)],
  },
  wisp: {
    id: 'wisp',
    role: 'swarm',
    name: 'Mana Wisp',
    faction: 'hollow',
    body: 'orb',
    archetype: 'bomber',
    movement: [{ id: 'orbit', ring: 3.2, seconds: 1.6 }, { id: 'kamikaze' }],
    noBody: true,
    lifeMult: 0.25,
    dmgMult: 0.5,
    range: 1,
    attack: 'melee',
    speed: 5.5,
    attackTime: 1.0,
    radius: 0.3,
    mods: [mod('manaDrain', 'base', 8)],
  },
  hexer: {
    id: 'hexer',
    role: 'ranged',
    name: 'Hexer',
    faction: 'choir',
    body: 'mage',
    archetype: 'controller',
    defence: { es: 0.5 },
    innate: true,
    lifeMult: 0.8,
    dmgMult: 0.8,
    range: 7,
    attack: 'spell',
    speed: 2.8,
    attackTime: 1.6,
    radius: 0.4,
    mods: [],
  },
  censer: {
    id: 'censer',
    role: 'support',
    name: 'Censer-bearer',
    faction: 'choir',
    body: 'warrior',
    archetype: 'bulwark',
    movement: [{ id: 'tether', anchors: ['choirmaster'], radius: 7 }],
    defence: { armour: 85 },
    innate: true,
    lifeMult: 1.5,
    dmgMult: 0.5,
    range: 2.5,
    attack: 'melee',
    speed: 2,
    attackTime: 1.3,
    radius: 0.45,
    mods: [],
  },
  flagellant: {
    id: 'flagellant',
    role: 'front',
    name: 'Flagellant',
    faction: 'choir',
    body: 'brute',
    archetype: 'rager',
    pattern: [0.55, 0.55, 1.9],
    phases: [{ at: 0.5, do: 'enrage' }],
    defence: { immune: ['bleed'] },
    shape: { id: 'swing', arc: 150, radius: 3, count: 2, mult: 0.6, lock: 0.3 },
    stance: 'lash',
    innate: true,
    lifeMult: 1,
    dmgMult: 1,
    range: 2.2,
    attack: 'melee',
    speed: 3.2,
    attackTime: 1.4,
    radius: 0.5,
    mods: [],
  },
  choirmaster: {
    id: 'choirmaster',
    role: 'support',
    name: 'Choirmaster',
    faction: 'choir',
    body: 'mage',
    archetype: 'support',
    movement: [{ id: 'follow' }],
    defence: { es: 0.6 },
    innate: true,
    lifeMult: 1.5,
    dmgMult: 0.5,
    range: 7,
    attack: 'spell',
    speed: 2.4,
    attackTime: 1.7,
    radius: 0.45,
    mods: [],
  },
  gnawer: {
    id: 'gnawer',
    role: 'swarm',
    name: 'Gnawer',
    faction: 'swarm',
    body: 'gnawer',
    archetype: 'skirmisher',
    movement: [{ id: 'skitter', angle: 35, every: 0.4 }],
    senses: { alert: 12 },
    defence: { evasion: 100 },
    innate: true,
    lifeMult: 0.25,
    dmgMult: 0.35,
    range: 1,
    attack: 'melee',
    speed: 5,
    attackTime: 1.0,
    radius: 0.3,
    mods: [mod('chance.bleed', 'base', 10)],
  },
  bat: {
    id: 'bat',
    role: 'swarm',
    name: 'Carrion Bat',
    faction: 'swarm',
    body: 'bat',
    archetype: 'skirmisher',
    movement: [{ id: 'swoop', back: 3 }],
    defence: { evasion: 50 },
    innate: true,
    flies: true,
    lifeMult: 0.3,
    dmgMult: 0.4,
    range: 1,
    attack: 'melee',
    speed: 4.4,
    attackTime: 1.1,
    radius: 0.3,
    mods: [],
  },
  beetle: {
    id: 'beetle',
    role: 'front',
    name: 'Bone Beetle',
    faction: 'swarm',
    body: 'beetle',
    archetype: 'bulwark',
    movement: [{ id: 'tether', anchors: ['nest'], radius: 7 }],
    defence: { armour: 150, res: { lightning: -50 } },
    innate: true,
    lifeMult: 1.5,
    dmgMult: 0.5,
    range: 1.2,
    attack: 'melee',
    speed: 2.2,
    attackTime: 1.3,
    radius: 0.45,
    mods: [],
  },
  nest: {
    id: 'nest',
    role: 'special',
    name: 'Nest',
    faction: 'swarm',
    body: 'nest',
    archetype: 'summoner',
    senses: { alert: 12 },
    defence: { res: { fire: -20 } },
    innate: true,
    stationary: true,
    noAttack: true,
    lifeMult: 3,
    dmgMult: 0.1,
    range: 1,
    attack: 'melee',
    speed: 0,
    attackTime: 2,
    radius: 0.7,
    mods: [],
  },
  sentinel: {
    id: 'sentinel',
    role: 'front',
    name: 'Sentinel',
    faction: 'reliquary',
    body: 'sentinel',
    archetype: 'bruiser',
    movement: [{ id: 'momentum', from: 0.6, to: 1.4, seconds: 3 }],
    defence: { armour: 100, stun: 200, hitCap: 0.2 },
    shape: { id: 'nova', radius: 2.2, mult: 1.3 },
    innate: true,
    lifeMult: 2,
    dmgMult: 1.1,
    range: 1.5,
    attack: 'melee',
    speed: 1.8,
    attackTime: 1.8,
    radius: 0.65,
    // x2 armour (x4 was a wall for physical builds), x3 stun threshold.
    mods: [],
  },
  arbalest: {
    id: 'arbalest',
    role: 'ranged',
    name: 'Arbalest',
    faction: 'reliquary',
    body: 'arbalest',
    archetype: 'sniper',
    senses: { aggro: 14 },
    shape: { id: 'lance', length: 12, width: 0.9, mult: 1.6, lock: 0.25 },
    innate: true,
    stationary: true,
    lifeMult: 0.8,
    dmgMult: 1,
    range: 9,
    attack: 'projectile',
    speed: 0,
    attackTime: 2.0,
    radius: 0.5,
    // The bolt pierces everything in its line.
    mods: [],
  },
  golem: {
    id: 'golem',
    role: 'front',
    name: 'Core Golem',
    faction: 'reliquary',
    body: 'golem',
    archetype: 'bruiser',
    movement: [{ id: 'momentum', from: 0.5, to: 1.5, seconds: 3 }],
    defence: { stun: 100 },
    elemental: true,
    lifeMult: 1.6,
    dmgMult: 1,
    range: 1.3,
    attack: 'melee',
    speed: 1.6,
    attackTime: 1.6,
    radius: 0.6,
    mods: [],
  },
  pylon: {
    id: 'pylon',
    role: 'support',
    name: 'Warden Pylon',
    faction: 'reliquary',
    body: 'pylon',
    archetype: 'bulwark',
    defence: {
      armour: 200,
      immune: ['stun', 'freeze', 'ignite', 'shock', 'chill', 'bleed', 'poison'],
    },
    innate: true,
    stationary: true,
    noAttack: true,
    lifeMult: 0.8,
    dmgMult: 0.1,
    range: 1,
    attack: 'melee',
    speed: 0,
    attackTime: 2,
    radius: 0.5,
    mods: [],
  },
  hound: {
    id: 'hound',
    role: 'swarm',
    name: 'Kennel Hound',
    faction: 'kennel',
    body: 'hound',
    archetype: 'hunter',
    pattern: [0.8, 0.8, 1.4],
    movement: [{ id: 'swoop', back: 3 }],
    senses: { leash: 0, target: 'minions' },
    defence: { evasion: 30 },
    innate: true,
    lifeMult: 0.45,
    dmgMult: 0.6,
    range: 1,
    attack: 'melee',
    speed: 3.6,
    attackTime: 1.0,
    radius: 0.35,
    mods: [],
  },
  boar: {
    id: 'boar',
    role: 'front',
    name: 'Rend-boar',
    faction: 'kennel',
    body: 'boar',
    archetype: 'bruiser',
    phases: [{ at: 0.4, do: 'enrage' }],
    movement: [{ id: 'momentum', from: 0.5, to: 1.4, seconds: 2.5 }],
    defence: { armour: 30 },
    shape: { id: 'swing', arc: 100, radius: 1.9, lock: 0.3 },
    innate: true,
    lifeMult: 1.7,
    dmgMult: 1.2,
    range: 1.3,
    attack: 'melee',
    speed: 2,
    attackTime: 1.6,
    radius: 0.6,
    // The tusks stagger.
    mods: [mod('stunDamage', 'inc', 150)],
  },
  handler: {
    id: 'handler',
    role: 'support',
    name: 'Kennel Handler',
    faction: 'kennel',
    body: 'archer',
    archetype: 'summoner',
    phases: [{ at: 0.3, do: 'flee', seconds: 4 }],
    defence: { evasion: 40 },
    stance: 'lash',
    innate: true,
    lifeMult: 0.8,
    dmgMult: 0.5,
    range: 6,
    attack: 'projectile',
    speed: 2.8,
    attackTime: 1.5,
    radius: 0.4,
    mods: [],
  },
  cat: {
    id: 'cat',
    role: 'special',
    name: 'Stalker Cat',
    faction: 'kennel',
    body: 'cat',
    archetype: 'ambusher',
    movement: [{ id: 'cover', back: 4 }],
    defence: { evasion: 50 },
    innate: true,
    lifeMult: 0.8,
    dmgMult: 1.4,
    range: 1.2,
    attack: 'melee',
    speed: 3.8,
    attackTime: 1.1,
    radius: 0.4,
    mods: [],
  },
  cutpurse: {
    id: 'cutpurse',
    role: 'special',
    name: 'Cutpurse',
    faction: 'gilded',
    body: 'warrior',
    archetype: 'thief',
    defence: { evasion: 150 },
    innate: true,
    lifeMult: 0.7,
    dmgMult: 0.4,
    range: 1,
    attack: 'melee',
    speed: 4.5,
    attackTime: 1.0,
    radius: 0.4,
    mods: [],
  },
  guard: {
    id: 'guard',
    role: 'front',
    name: 'Gilded Guard',
    faction: 'gilded',
    body: 'brute',
    archetype: 'bulwark',
    movement: [{ id: 'tether', anchors: ['bursar'], radius: 6 }],
    defence: { armour: 100 },
    innate: true,
    lifeMult: 1.8,
    dmgMult: 0.95,
    range: 1.4,
    attack: 'melee',
    speed: 2,
    attackTime: 1.7,
    radius: 0.55,
    mods: [],
  },
  bursar: {
    id: 'bursar',
    role: 'support',
    name: 'Bursar',
    faction: 'gilded',
    body: 'mage',
    archetype: 'support',
    movement: [{ id: 'follow' }],
    defence: { es: 0.4, res: { chaos: -30 } },
    innate: true,
    lifeMult: 1.1,
    dmgMult: 0.45,
    range: 6,
    attack: 'spell',
    speed: 2.6,
    attackTime: 1.6,
    radius: 0.4,
    mods: [],
  },
  slinger: {
    id: 'slinger',
    role: 'ranged',
    name: 'Gilt Slinger',
    faction: 'gilded',
    body: 'archer',
    archetype: 'gunner',
    pattern: [0.7, 0.7, 1.6],
    defence: { evasion: 50 },
    shape: { id: 'salvo', count: 2, mult: 0.5 },
    stance: 'throw',
    innate: true,
    lifeMult: 0.7,
    dmgMult: 0.7,
    range: 7,
    attack: 'projectile',
    speed: 3,
    attackTime: 1.3,
    radius: 0.4,
    mods: [],
  },
  wight: {
    id: 'wight',
    role: 'support',
    name: 'Lantern Wight',
    faction: 'hollow',
    body: 'mage',
    archetype: 'support',
    movement: [{ id: 'phase' }, { id: 'follow' }],
    innate: true,
    lifeMult: 1.2,
    dmgMult: 0.5,
    range: 7,
    attack: 'spell',
    speed: 2.4,
    attackTime: 1.6,
    radius: 0.45,
    mods: [mod('convert.physical.cold', 'base', 100)],
  },

  // Additions to the factions that exist (docs/ROSTER.md 7.1): each on a body that is not a person.
  crawler: {
    id: 'crawler',
    role: 'swarm',
    name: 'Bone Crawler',
    faction: 'ossuary',
    body: 'crawler',
    archetype: 'skirmisher',
    movement: [{ id: 'skitter', angle: 40, every: 0.35 }],
    defence: { evasion: 60, armour: -60, res: { fire: -30 } },
    hobbles: true,
    minLevel: 4,
    lifeMult: 0.25,
    dmgMult: 0.35,
    range: 1,
    attack: 'melee',
    speed: 4.4,
    attackTime: 1,
    radius: 0.3,
    mods: [],
  },
  heap: {
    id: 'heap',
    role: 'front',
    name: 'Charnel Heap',
    faction: 'ossuary',
    body: 'heap',
    archetype: 'bruiser',
    movement: [{ id: 'momentum', from: 0.6, to: 1.2, seconds: 3 }],
    defence: { armour: 60, immune: ['bleed'], hitCap: 0.25 },
    shape: { id: 'slam', radius: 2.2, mult: 1.6, lock: 0.3 },
    phases: [{ at: 0, do: 'split', into: 'crawler', count: 3 }],
    minLevel: 18,
    lifeMult: 3,
    dmgMult: 1.5,
    range: 1.8,
    attack: 'melee',
    speed: 1.4,
    attackTime: 2.4,
    radius: 0.8,
    mods: [],
  },
  gorger: {
    id: 'gorger',
    role: 'front',
    name: 'Gorger',
    faction: 'rot',
    body: 'bloat',
    archetype: 'bruiser',
    shape: { id: 'swing', arc: 140, radius: 2.4, lock: 0.3 },
    innate: true,
    minLevel: 10,
    lifeMult: 2,
    dmgMult: 1.3,
    range: 1.6,
    attack: 'melee',
    speed: 2,
    attackTime: 1.8,
    radius: 0.7,
    mods: [],
  },
  watcher: {
    id: 'watcher',
    role: 'ranged',
    name: 'Hollow Watcher',
    faction: 'hollow',
    body: 'orb',
    archetype: 'sniper',
    movement: [{ id: 'cover', back: 4 }],
    senses: { aggro: 12 },
    shape: { id: 'lance', length: 12, width: 0.9, mult: 1.5, lock: 0.3 },
    innate: true,
    noBody: true,
    minLevel: 14,
    lifeMult: 0.6,
    dmgMult: 1.1,
    range: 9,
    attack: 'spell',
    speed: 1.2,
    attackTime: 2.2,
    radius: 0.4,
    mods: [],
  },
  bell: {
    id: 'bell',
    role: 'support',
    name: 'Tolling Bell',
    faction: 'choir',
    body: 'bell',
    archetype: 'support',
    defence: { armour: 100, es: 0.4 },
    shape: { id: 'nova', radius: 3.2, mult: 1 },
    stationary: true,
    flies: true,
    innate: true,
    noBody: true,
    minLevel: 22,
    lifeMult: 1.4,
    dmgMult: 0.5,
    range: 2.8,
    attack: 'melee',
    speed: 0,
    attackTime: 4,
    radius: 0.6,
    mods: [mod('stunDamage', 'inc', 200)],
  },
  spinner: {
    id: 'spinner',
    role: 'ranged',
    name: 'Silkspinner',
    faction: 'swarm',
    body: 'spider',
    archetype: 'controller',
    stance: 'throw',
    defence: { evasion: 30 },
    shape: {
      id: 'lob',
      radius: 1.7,
      zone: 'chilling',
      zoneName: 'web',
      seconds: 4,
      dps: 0.12,
      mult: 0.4,
      lock: 0.3,
    },
    innate: true,
    minLevel: 12,
    lifeMult: 0.9,
    dmgMult: 0.6,
    range: 6,
    attack: 'projectile',
    speed: 2.6,
    attackTime: 1.8,
    radius: 0.45,
    mods: [],
  },
  coffer: {
    id: 'coffer',
    role: 'special',
    name: 'Lurking Coffer',
    faction: 'gilded',
    body: 'chest',
    archetype: 'ambusher',
    defence: { armour: 80 },
    bonusLoot: 2.5,
    minLevel: 8,
    lifeMult: 1,
    dmgMult: 1.6,
    range: 1.2,
    attack: 'melee',
    speed: 3.2,
    attackTime: 1.2,
    radius: 0.55,
    mods: [],
  },

  // The Drowned (docs/ROSTER.md 7.2): being held.
  tidecaller: {
    id: 'tidecaller',
    role: 'support',
    name: 'Tidecaller',
    faction: 'drowned',
    body: 'mage',
    style: 'spectre',
    archetype: 'controller',
    defence: { es: 0.3 },
    shape: { id: 'lance', length: 11, width: 0.8, mult: 0.8, lock: 0.3, pull: 3.5 },
    innate: true,
    minLevel: 20,
    lifeMult: 0.9,
    dmgMult: 0.6,
    range: 8,
    attack: 'spell',
    speed: 2.4,
    attackTime: 2.6,
    radius: 0.4,
    mods: [],
  },
  wrack: {
    id: 'wrack',
    role: 'front',
    name: 'Wrack',
    faction: 'drowned',
    body: 'brute',
    archetype: 'bruiser',
    movement: [{ id: 'lurch', go: 1.1, pace: 1.5, stop: 0.7 }],
    defence: { armour: 40 },
    shape: { id: 'swing', arc: 150, radius: 2.4, lock: 0.3 },
    hobbles: true,
    innate: true,
    minLevel: 20,
    lifeMult: 2.2,
    dmgMult: 1.2,
    range: 1.5,
    attack: 'melee',
    speed: 1.8,
    attackTime: 2,
    radius: 0.6,
    mods: [],
  },
  leech: {
    id: 'leech',
    role: 'swarm',
    name: 'Brine Leech',
    faction: 'drowned',
    body: 'toad',
    archetype: 'skirmisher',
    movement: [{ id: 'hop', go: 0.8, pace: 2.2, stop: 0.5 }],
    defence: { evasion: 40 },
    hobbles: true,
    innate: true,
    minLevel: 20,
    lifeMult: 0.3,
    dmgMult: 0.35,
    range: 1,
    attack: 'melee',
    speed: 3.8,
    attackTime: 1,
    radius: 0.3,
    mods: [mod('leech.life', 'base', 8)],
  },
  drowner: {
    id: 'drowner',
    role: 'special',
    name: 'Drowner',
    faction: 'drowned',
    body: 'worm',
    archetype: 'ambusher',
    movement: [{ id: 'burrow', dive: 8, seconds: 2.2 }],
    shape: { id: 'slam', radius: 2, mult: 1.2, lock: 0.3 },
    innate: true,
    noBody: true,
    minLevel: 22,
    lifeMult: 1,
    dmgMult: 1.6,
    range: 1.2,
    attack: 'melee',
    speed: 3.2,
    attackTime: 1.4,
    radius: 0.5,
    mods: [],
  },
};

/** Faction mods (EXPANSION 7.3): on every monster of the faction. */
/** Faction-wide mods that are not defences (the Hollow's ethereal rule is in `FACTION_DEFENCE`). */
export const FACTION_MODS: Partial<Record<FactionId, Mod[]>> = {};

/** Whether monsters of this faction cannot be made to bleed. */
export function cannotBleed(type: MonsterTypeId): boolean {
  return MONSTER_TYPES[type].faction === 'hollow';
}

/** The body style of a faction's people: bone for the Ossuary, a spectre for the Hollow, flesh for the rest. */
const FACTION_STYLE: Partial<Record<FactionId, BodyStyle>> = { ossuary: 'bone', hollow: 'spectre' };

/** What a type's humanoid body is made of: its own style, or its faction's. A bare body (no type) is a skeleton. */
export function bodyStyleOf(type: MonsterTypeId | undefined): BodyStyle {
  if (!type) return 'bone';
  const t = MONSTER_TYPES[type];
  return t.style ?? FACTION_STYLE[t.faction] ?? 'flesh';
}

/** Whether a dead monster of this type leaves a body behind. */
export function leavesBody(type: MonsterTypeId): boolean {
  return !MONSTER_TYPES[type].noBody && bodyStyleOf(type) !== 'spectre';
}

/** The faction a monster belongs to. */
export function factionOfSpec(spec: { type: MonsterTypeId }): FactionId {
  return MONSTER_TYPES[spec.type].faction;
}

export type Variant = 'none' | Element;

export const VARIANT_NAMES: Record<Variant, string> = {
  none: '',
  fire: 'Burning',
  cold: 'Frozen',
  lightning: 'Storm',
};

/** §12.4 variant mods. Mages convert 100%. */
export function variantMods(v: Variant, isMage: boolean): Mod[] {
  if (v === 'none') return [];
  const conv = isMage ? 100 : 60;
  const ailment: Mod =
    v === 'fire'
      ? mod('chance.ignite', 'base', 15)
      : v === 'cold'
        ? mod('chance.freeze', 'base', 20)
        : mod('chance.shock', 'base', 20);
  return [mod(`convert.physical.${v}`, 'base', conv), mod(`resist.${v}`, 'base', 40), ailment];
}

export type MonsterRarity = 'normal' | 'magic' | 'rare' | 'miniboss' | 'boss';

export const RARITY_MULTS: Record<
  MonsterRarity,
  { life: number; dmg: number; xp: number; mods: [number, number] }
> = {
  normal: { life: 1, dmg: 1, xp: 1, mods: [0, 0] },
  magic: { life: 2, dmg: 1.15, xp: 2, mods: [1, 2] },
  rare: { life: 4.5, dmg: 1.35, xp: 5, mods: [2, 4] },
  miniboss: { life: 6.75, dmg: 1.5, xp: 8, mods: [4, 4] },
  boss: { life: 30, dmg: 2, xp: 30, mods: [0, 0] },
};

export type MonsterModId =
  | 'hasted'
  | 'armoured'
  | 'elusive'
  | 'prismatic'
  | 'fireBound'
  | 'frostBound'
  | 'stormBound'
  | 'vampiric'
  | 'regenerating'
  | 'fortified'
  | 'volatile'
  | 'raiser'
  | 'frenzied'
  | 'rimeAura'
  | 'unshakable'
  // Counterplay mods (EXPANSION 7.2): each punishes one strategy.
  | 'bloodless'
  | 'unyielding'
  | 'deflecting'
  | 'spellwarded'
  | 'fireWarded'
  | 'frostWarded'
  | 'stormWarded'
  | 'bulwarked'
  | 'keenEyed'
  | 'sundering'
  | 'siphoning'
  | 'rotTouched'
  | 'shrouded'
  | 'splitting'
  | 'thorned'
  // Faction mods (EXPANSION 7.3), rolled only on their own faction's monsters.
  | 'festering'
  | 'putrid'
  // Champions (EXPANSION 7.3): never rolled, set on the mini-boss of a faction's own theme.
  | 'carrionMother'
  | 'unremembered'
  | 'precentor'
  | 'gnawingQueen'
  | 'reliquarian'
  | 'boneWarden'
  | 'huntsmaster'
  | 'treasurer'
  | 'tidewarden'
  // New counterplay mods (docs/ENEMIES.md 7.2)
  | 'charging'
  | 'flaskTaker'
  | 'hobbling'
  | 'brood'
  | 'wardingPulse'
  | 'mirrored'
  // The Choir's faction mod, and the hex mods (EXPANSION 7.2).
  | 'zealous'
  | 'hexWarded'
  | 'hexcaller';

export type MonsterModDef = {
  id: MonsterModId;
  name: string;
  /** Can roll on magic monsters (otherwise rare and mini-boss monsters only). */
  magic: boolean;
  mods: Mod[];
  /** Does not roll before this area level. */
  minLevel?: number;
  /** Rolls only on monsters of this faction. */
  faction?: FactionId;
  /** A champion: set by the theme on its mini-boss, never rolled, and it renames the monster. */
  chief?: boolean;
};

/** §12.5. Behavioural mods (volatile, raiser, rime aura) are handled by the sim. */
export const MONSTER_MODS: MonsterModDef[] = [
  {
    id: 'hasted',
    name: 'Hasted',
    magic: true,
    mods: [mod('moveSpeed', 'inc', 25), mod('attackSpeed', 'inc', 25), mod('castSpeed', 'inc', 25)],
  },
  { id: 'armoured', name: 'Armoured', magic: true, mods: [mod('armour', 'inc', 200)] },
  { id: 'elusive', name: 'Elusive', magic: true, mods: [mod('evasion', 'inc', 200)] },
  { id: 'prismatic', name: 'Prismatic', magic: true, mods: [mod('resist.allEle', 'base', 30)] },
  {
    id: 'fireBound',
    name: 'Fire-bound',
    magic: true,
    mods: [mod('gain.physical.fire', 'base', 50)],
  },
  {
    id: 'frostBound',
    name: 'Frost-bound',
    magic: true,
    mods: [mod('gain.physical.cold', 'base', 50)],
  },
  {
    id: 'stormBound',
    name: 'Storm-bound',
    magic: true,
    mods: [mod('gain.physical.lightning', 'base', 50)],
  },
  { id: 'vampiric', name: 'Vampiric', magic: true, mods: [mod('leech.life', 'base', 10)] },
  { id: 'regenerating', name: 'Regenerating', magic: true, mods: [mod('lifeRegenPct', 'base', 1)] },
  { id: 'fortified', name: 'Fortified', magic: false, mods: [mod('life', 'more', 100)] },
  { id: 'volatile', name: 'Volatile', magic: true, mods: [] },
  { id: 'raiser', name: 'Raiser', magic: false, mods: [] },
  {
    id: 'frenzied',
    name: 'Frenzied',
    magic: true,
    mods: [mod('damage', 'more', 50, { condition: { id: 'onLowLife' } })],
  },
  { id: 'rimeAura', name: 'Rime Aura', magic: false, mods: [] },
  {
    id: 'unshakable',
    name: 'Unshakable',
    magic: true,
    mods: [mod('cannotBeStunned', 'flag', 1)],
  },
];

/** Counterplay mods (EXPANSION 7.2). Splitting, Thorned and Siphoning are handled by the sim. */
MONSTER_MODS.push(
  {
    id: 'bloodless',
    name: 'Bloodless',
    magic: true,
    minLevel: 15,
    mods: [mod('cannotBeLeechedFrom', 'flag', 1)],
  },
  {
    id: 'unyielding',
    name: 'Unyielding',
    magic: false,
    minLevel: 20,
    mods: [mod('immuneAilments', 'flag', 1)],
  },
  {
    id: 'deflecting',
    name: 'Deflecting',
    magic: true,
    minLevel: 15,
    mods: [mod('evadeBonus.projectile', 'base', 50)],
  },
  {
    id: 'spellwarded',
    name: 'Spellwarded',
    magic: true,
    minLevel: 15,
    mods: [mod('blockSpell', 'base', 40)],
  },
  {
    id: 'fireWarded',
    name: 'Fire-warded',
    magic: false,
    minLevel: 30,
    mods: [mod('immune.fire', 'flag', 1)],
  },
  {
    id: 'frostWarded',
    name: 'Frost-warded',
    magic: false,
    minLevel: 30,
    mods: [mod('immune.cold', 'flag', 1)],
  },
  {
    id: 'stormWarded',
    name: 'Storm-warded',
    magic: false,
    minLevel: 30,
    mods: [mod('immune.lightning', 'flag', 1)],
  },
  {
    id: 'bulwarked',
    name: 'Bulwarked',
    magic: true,
    minLevel: 15,
    mods: [mod('physReduction', 'base', 30)],
  },
  {
    id: 'keenEyed',
    name: 'Keen-eyed',
    magic: true,
    minLevel: 15,
    mods: [mod('alwaysHit', 'flag', 1)],
  },
  {
    id: 'sundering',
    name: 'Sundering',
    magic: false,
    minLevel: 20,
    mods: [mod('armourIgnore', 'base', 50)],
  },
  {
    id: 'siphoning',
    name: 'Siphoning',
    magic: true,
    minLevel: 15,
    mods: [mod('manaDrain', 'base', 5)],
  },
  {
    id: 'rotTouched',
    name: 'Rot-touched',
    magic: true,
    minLevel: 15,
    mods: [mod('gain.physical.chaos', 'base', 30)],
  },
  { id: 'shrouded', name: 'Shrouded', magic: true, minLevel: 15, mods: [] },
  { id: 'splitting', name: 'Splitting', magic: false, minLevel: 20, mods: [] },
  { id: 'thorned', name: 'Thorned', magic: false, minLevel: 40, mods: [] },
);

/** Faction mods of the Rot (EXPANSION 7.3). Putrid is handled by the sim (a caustic cloud on death). */
MONSTER_MODS.push(
  {
    id: 'festering',
    name: 'Festering',
    magic: true,
    minLevel: 8,
    faction: 'rot',
    mods: [mod('chance.poison', 'base', 30)],
  },
  { id: 'putrid', name: 'Putrid', magic: true, minLevel: 8, faction: 'rot', mods: [] },
);

/** The champions of the Rot and the Hollow. Their behaviour is in the sim (sim/factions.ts). */
MONSTER_MODS.push(
  { id: 'carrionMother', name: 'The Carrion Mother', magic: false, chief: true, mods: [] },
  { id: 'unremembered', name: 'The Unremembered', magic: false, chief: true, mods: [] },
  { id: 'precentor', name: 'The Precentor', magic: false, chief: true, mods: [] },
  { id: 'gnawingQueen', name: 'The Gnawing Queen', magic: false, chief: true, mods: [] },
  { id: 'reliquarian', name: 'The Reliquarian', magic: false, chief: true, mods: [] },
  { id: 'boneWarden', name: 'The Bone Warden', magic: false, chief: true, mods: [] },
  { id: 'huntsmaster', name: 'The Huntsmaster', magic: false, chief: true, mods: [] },
  { id: 'treasurer', name: 'The Treasurer', magic: false, chief: true, mods: [] },
  { id: 'tidewarden', name: 'The Tidewarden', magic: false, chief: true, mods: [] },
  // Counterplay mods: a rush that punishes kiting, a thief of flask charges, a hobbling touch.
  { id: 'charging', name: 'Charging', magic: true, minLevel: 12, mods: [] },
  { id: 'flaskTaker', name: 'Flask-taker', magic: true, minLevel: 20, mods: [] },
  { id: 'hobbling', name: 'Hobbling', magic: true, minLevel: 15, mods: [] },
);
// Mods that apply to every faction: a pulse that throws the character back, and a twin that must fall with it (docs/ROSTER.md 7.5).
MONSTER_MODS.push(
  { id: 'wardingPulse', name: 'Warding Pulse', magic: false, minLevel: 20, mods: [] },
  { id: 'mirrored', name: 'Mirrored', magic: false, minLevel: 25, mods: [] },
);
MONSTER_MODS.push({
  id: 'brood',
  name: 'Brood',
  magic: true,
  minLevel: 12,
  faction: 'swarm',
  mods: [],
});

/** The Choir's faction mod, and the two hex mods of the counterplay list (EXPANSION 7.2). */
MONSTER_MODS.push(
  { id: 'zealous', name: 'Zealous', magic: true, minLevel: 25, faction: 'choir', mods: [] },
  { id: 'hexWarded', name: 'Hex-warded', magic: true, minLevel: 25, mods: [] },
  { id: 'hexcaller', name: 'Hexcaller', magic: false, minLevel: 25, mods: [] },
);

export function monsterModDef(id: MonsterModId): MonsterModDef {
  return MONSTER_MODS.find((m) => m.id === id)!;
}

export const BOSS_NAME = 'the Ossuary Regent';

/** Word lists for generated rare monster names. */
export const RARE_MONSTER_FIRST = [
  'Grim',
  'Hollow',
  'Rattle',
  'Marrow',
  'Ash',
  'Bleak',
  'Dust',
  'Cinder',
  'Gloom',
  'Sorrow',
  'Knell',
  'Pale',
  'Dread',
  'Crypt',
  'Thorn',
  'Wither',
];
export const RARE_MONSTER_SECOND = [
  'jaw',
  'shank',
  'skull',
  'rib',
  'gnasher',
  'walker',
  'reaper',
  'binder',
  'wail',
  'grin',
  'spine',
  'husk',
  'claw',
  'shroud',
  'knuckle',
  'socket',
];
