import { mod, type Element, type Mod } from '../mods/types';

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
  | 'pylon';

/** The monster families (EXPANSION 7.3). The Choir, the Swarm and the Reliquary join in later milestones. */
export type FactionId = 'ossuary' | 'rot' | 'hollow' | 'choir' | 'swarm' | 'reliquary';

export const FACTION_NAMES: Record<FactionId, string> = {
  ossuary: 'Ossuary',
  rot: 'the Rot',
  hollow: 'the Hollow',
  choir: 'the Ashen Choir',
  swarm: 'the Swarm',
  reliquary: 'the Reliquary',
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
  | 'pylon';

export type MonsterTypeDef = {
  id: MonsterTypeId;
  name: string;
  faction: FactionId;
  /** The figure it is drawn with. */
  body: BodyKind;
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
    faction: 'ossuary',
    body: 'warrior',
    name: 'Skeleton Warrior',
    lifeMult: 1,
    dmgMult: 1,
    range: 1.2,
    attack: 'melee',
    speed: 3.0,
    attackTime: 1.2,
    radius: 0.4,
    mods: [],
  },
  brute: {
    id: 'brute',
    faction: 'ossuary',
    body: 'brute',
    name: 'Skeleton Brute',
    lifeMult: 1.7,
    dmgMult: 1.9,
    range: 1.5,
    attack: 'melee',
    speed: 2.4,
    attackTime: 1.9,
    radius: 0.6,
    mods: [mod('stunDamage', 'inc', 50)],
  },
  archer: {
    id: 'archer',
    faction: 'ossuary',
    body: 'archer',
    name: 'Skeleton Archer',
    lifeMult: 0.7,
    dmgMult: 0.8,
    range: 7,
    attack: 'projectile',
    speed: 3.0,
    attackTime: 1.3,
    radius: 0.4,
    mods: [],
  },
  mage: {
    id: 'mage',
    faction: 'ossuary',
    body: 'mage',
    name: 'Skeleton Mage',
    lifeMult: 0.6,
    dmgMult: 1.1,
    range: 7,
    attack: 'spell',
    speed: 2.8,
    attackTime: 1.5,
    radius: 0.4,
    mods: [],
  },
  shieldbearer: {
    id: 'shieldbearer',
    name: 'Skeleton Shieldbearer',
    faction: 'ossuary',
    body: 'warrior',
    lifeMult: 1.4,
    dmgMult: 0.8,
    range: 1.2,
    attack: 'melee',
    speed: 2.6,
    attackTime: 1.4,
    radius: 0.5,
    // The shield bash staggers.
    mods: [mod('stunDamage', 'inc', 150)],
  },
  shambler: {
    id: 'shambler',
    name: 'Shambler',
    faction: 'rot',
    body: 'warrior',
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
    name: 'Bloater',
    faction: 'rot',
    body: 'brute',
    innate: true,
    lifeMult: 1.2,
    dmgMult: 0.5,
    range: 1.0,
    attack: 'melee',
    speed: 2.0,
    attackTime: 1.5,
    radius: 0.6,
    mods: [],
  },
  spitter: {
    id: 'spitter',
    name: 'Spitter',
    faction: 'rot',
    body: 'archer',
    innate: true,
    lifeMult: 0.7,
    dmgMult: 0.75,
    range: 6,
    attack: 'projectile',
    speed: 3.0,
    attackTime: 1.5,
    radius: 0.4,
    mods: [mod('convert.physical.chaos', 'base', 100), mod('chance.poison', 'base', 40)],
  },
  hag: {
    id: 'hag',
    name: 'Carrion Hag',
    faction: 'rot',
    body: 'mage',
    innate: true,
    lifeMult: 1.0,
    dmgMult: 0.5,
    range: 7,
    attack: 'spell',
    speed: 2.6,
    attackTime: 1.6,
    radius: 0.4,
    mods: [mod('convert.physical.chaos', 'base', 100)],
  },
  gloomstalker: {
    id: 'gloomstalker',
    name: 'Gloomstalker',
    faction: 'hollow',
    body: 'warrior',
    lifeMult: 0.8,
    dmgMult: 1.0,
    range: 1.2,
    attack: 'melee',
    speed: 3.4,
    attackTime: 1.1,
    radius: 0.4,
    // Twice the normal evasion.
    mods: [mod('evasion', 'inc', 100)],
  },
  wailer: {
    id: 'wailer',
    name: 'Wailer',
    faction: 'hollow',
    body: 'mage',
    innate: true,
    lifeMult: 0.7,
    dmgMult: 1.0,
    range: 7,
    attack: 'spell',
    speed: 2.8,
    attackTime: 1.5,
    radius: 0.4,
    mods: [mod('convert.physical.cold', 'base', 100), mod('resist.cold', 'base', 40)],
  },
  wisp: {
    id: 'wisp',
    name: 'Mana Wisp',
    faction: 'hollow',
    body: 'warrior',
    lifeMult: 0.4,
    dmgMult: 0.5,
    range: 1.0,
    attack: 'melee',
    speed: 4.0,
    attackTime: 1.0,
    radius: 0.3,
    mods: [mod('manaDrain', 'base', 8)],
  },
  hexer: {
    id: 'hexer',
    name: 'Hexer',
    faction: 'choir',
    body: 'mage',
    innate: true,
    lifeMult: 0.7,
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
    name: 'Censer-bearer',
    faction: 'choir',
    body: 'warrior',
    innate: true,
    lifeMult: 0.8,
    dmgMult: 0.5,
    range: 1.2,
    attack: 'melee',
    speed: 2.8,
    attackTime: 1.3,
    radius: 0.45,
    mods: [],
  },
  flagellant: {
    id: 'flagellant',
    name: 'Flagellant',
    faction: 'choir',
    body: 'brute',
    innate: true,
    lifeMult: 1.2,
    dmgMult: 1.1,
    range: 1.3,
    attack: 'melee',
    speed: 3.2,
    attackTime: 1.4,
    radius: 0.5,
    mods: [],
  },
  choirmaster: {
    id: 'choirmaster',
    name: 'Choirmaster',
    faction: 'choir',
    body: 'mage',
    innate: true,
    lifeMult: 1.5,
    dmgMult: 0.7,
    range: 7,
    attack: 'spell',
    speed: 2.4,
    attackTime: 1.7,
    radius: 0.45,
    mods: [],
  },
  gnawer: {
    id: 'gnawer',
    name: 'Gnawer',
    faction: 'swarm',
    body: 'gnawer',
    innate: true,
    lifeMult: 0.3,
    dmgMult: 0.35,
    range: 1.0,
    attack: 'melee',
    speed: 4.5,
    attackTime: 1.0,
    radius: 0.3,
    mods: [mod('chance.bleed', 'base', 10)],
  },
  bat: {
    id: 'bat',
    name: 'Carrion Bat',
    faction: 'swarm',
    body: 'bat',
    innate: true,
    flies: true,
    lifeMult: 0.3,
    dmgMult: 0.4,
    range: 1.0,
    attack: 'melee',
    speed: 4.0,
    attackTime: 1.1,
    radius: 0.3,
    mods: [],
  },
  beetle: {
    id: 'beetle',
    name: 'Bone Beetle',
    faction: 'swarm',
    body: 'beetle',
    innate: true,
    lifeMult: 0.6,
    dmgMult: 0.5,
    range: 1.1,
    attack: 'melee',
    speed: 3.0,
    attackTime: 1.3,
    radius: 0.45,
    mods: [],
  },
  nest: {
    id: 'nest',
    name: 'Nest',
    faction: 'swarm',
    body: 'nest',
    innate: true,
    stationary: true,
    noAttack: true,
    lifeMult: 3.0,
    dmgMult: 0.1,
    range: 1.0,
    attack: 'melee',
    speed: 0,
    attackTime: 2,
    radius: 0.7,
    mods: [],
  },
  sentinel: {
    id: 'sentinel',
    name: 'Sentinel',
    faction: 'reliquary',
    body: 'sentinel',
    innate: true,
    lifeMult: 1.4,
    dmgMult: 1.1,
    range: 1.5,
    attack: 'melee',
    speed: 2.0,
    attackTime: 1.8,
    radius: 0.65,
    // x2 armour (x4 was a wall for physical builds), x3 stun threshold.
    mods: [mod('armour', 'inc', 100), mod('stunThreshold', 'inc', 200)],
  },
  arbalest: {
    id: 'arbalest',
    name: 'Arbalest',
    faction: 'reliquary',
    body: 'arbalest',
    innate: true,
    stationary: true,
    lifeMult: 1.0,
    dmgMult: 0.9,
    range: 8,
    attack: 'projectile',
    speed: 0,
    attackTime: 2.0,
    radius: 0.5,
    // The bolt pierces everything in its line.
    mods: [mod('pierce', 'base', 99)],
  },
  golem: {
    id: 'golem',
    name: 'Core Golem',
    faction: 'reliquary',
    body: 'golem',
    elemental: true,
    lifeMult: 1.2,
    dmgMult: 1.0,
    range: 1.3,
    attack: 'melee',
    speed: 2.4,
    attackTime: 1.6,
    radius: 0.6,
    mods: [],
  },
  pylon: {
    id: 'pylon',
    name: 'Warden Pylon',
    faction: 'reliquary',
    body: 'pylon',
    innate: true,
    stationary: true,
    noAttack: true,
    lifeMult: 0.8,
    dmgMult: 0.1,
    range: 1.0,
    attack: 'melee',
    speed: 0,
    attackTime: 2,
    radius: 0.5,
    mods: [mod('armour', 'inc', 200)],
  },
  wight: {
    id: 'wight',
    name: 'Lantern Wight',
    faction: 'hollow',
    body: 'mage',
    innate: true,
    lifeMult: 1.2,
    dmgMult: 0.6,
    range: 7,
    attack: 'spell',
    speed: 2.4,
    attackTime: 1.6,
    radius: 0.45,
    mods: [mod('convert.physical.cold', 'base', 100)],
  },
};

/** Faction mods (EXPANSION 7.3): on every monster of the faction. */
export const FACTION_MODS: Partial<Record<FactionId, Mod[]>> = {
  // Ethereal: 50% less physical damage taken. (They also cannot bleed: see `cannotBleed`.)
  hollow: [mod('physReduction', 'base', 50)],
};

/** Whether monsters of this faction cannot be made to bleed. */
export function cannotBleed(type: MonsterTypeId): boolean {
  return MONSTER_TYPES[type].faction === 'hollow';
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
  | 'brood'
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
