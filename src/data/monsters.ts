import { mod, type Element, type Mod } from '../mods/types';

/** DESIGN.md §12. */

export type MonsterTypeId = 'warrior' | 'brute' | 'archer' | 'mage';

export type MonsterTypeDef = {
  id: MonsterTypeId;
  name: string;
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
};

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
  | 'unshakable';

export type MonsterModDef = { id: MonsterModId; name: string; magic: boolean; mods: Mod[] };

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
