import type { DamageType, Mod, SkillTag } from '../mods/types';

export type Attrs = { str: number; dex: number; int: number };

export const WEAPON_CLASSES = [
  'sword',
  'axe',
  'mace',
  'sceptre',
  'dagger',
  'claw',
  'wand',
  'sword2',
  'axe2',
  'mace2',
  'staff',
  'bow',
] as const;
export type WeaponClass = (typeof WEAPON_CLASSES)[number];

export const ARMOUR_SLOTS = ['helmet', 'gloves', 'boots', 'body'] as const;
export type ArmourSlot = (typeof ARMOUR_SLOTS)[number];

export type ItemClass = WeaponClass | 'shield' | 'quiver' | ArmourSlot | 'ring' | 'amulet' | 'belt';

export const EQUIP_SLOTS = [
  'mainHand',
  'offHand',
  'helmet',
  'body',
  'gloves',
  'boots',
  'amulet',
  'ring1',
  'ring2',
  'belt',
] as const;
export type EquipSlot = (typeof EQUIP_SLOTS)[number];

export type DefenceType = 'ar' | 'ev' | 'es' | 'arev' | 'ares' | 'eves';

export type WeaponBaseStats = {
  min: number;
  max: number;
  aps: number;
  /** Percent, e.g. 5 = 5%. */
  crit: number;
  /** Melee reach in tiles (bows: unused). */
  range: number;
};

export type ItemBase = {
  id: string;
  name: string;
  itemClass: ItemClass;
  level: number;
  req: Attrs;
  implicits: Mod[];
  weapon?: WeaponBaseStats;
  defence?: { armour?: number; evasion?: number; es?: number; block?: number };
  defenceType?: DefenceType;
  /** Weapon tags contributed to skill uses ('mace', 'twoHand', ...). */
  tags: SkillTag[];
  hands?: 1 | 2;
};

export type Rarity = 'normal' | 'magic' | 'rare' | 'unique';

export type AffixRoll = { family: string; tier: number; mods: Mod[] };

export type GemItem = { kind: 'gem'; uid: number; gemId: string };

export type Item = {
  kind: 'item';
  uid: number;
  baseId: string;
  rarity: Rarity;
  name: string;
  ilvl: number;
  /** Rolled implicit mods. */
  implicits: Mod[];
  /** Explicit affixes (magic and rare). */
  affixes: AffixRoll[];
  /** Unique id and its rolled mods. */
  uniqueId?: string;
  uniqueMods?: Mod[];
  /** Socket contents; length = socket count. */
  sockets: (GemItem | null)[];
};

export type FlaskItem = {
  kind: 'flask';
  uid: number;
  baseId: string;
  ilvl: number;
  name: string;
  affixes: AffixRoll[];
};

export type AnyItem = Item | GemItem | FlaskItem;

/** A character build: everything the calc engine needs. */
export type Build = {
  classId: string;
  level: number;
  allocated: number[];
  equipment: Partial<Record<EquipSlot, Item>>;
  flasks: (FlaskItem | null)[];
  /** uid of the primary active gem, if chosen. */
  primaryGem?: number;
};

export type ClassDef = {
  id: string;
  name: string;
  attrs: Attrs;
  color: number;
  startWeapons: string[];
  startOffHand?: string;
  startSkill: string;
  startSupport: string;
};

export type DamageRange = { type: DamageType; min: number; max: number };
