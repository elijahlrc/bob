import type { DamageType, Mod, SkillTag } from '../mods/types';
import type { TriggerDef } from './triggers';

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
  /** Never drops on its own; only a unique uses it. */
  uniqueOnly?: boolean;
  /** Weapon tags contributed to skill uses ('mace', 'twoHand', ...). */
  tags: SkillTag[];
  hands?: 1 | 2;
};

export type Rarity = 'normal' | 'magic' | 'rare' | 'unique';

export type AffixRoll = {
  family: string;
  tier: number;
  mods: Mod[];
  /** Added at the Workbench for Bone Dust (one per item, removable for free). */
  bench?: boolean;
};

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
  /** Triggers the item carries (EXPANSION 5.5). */
  uniqueTriggers?: TriggerDef[];
  /** Attributes a unique needs beyond its base's. */
  uniqueReq?: Partial<Attrs>;
  /** The socket count is part of the unique's identity and cannot be changed. */
  fixedSockets?: boolean;
  /** Sealed: it can never be changed again (EXPANSION 8.2). */
  sealed?: boolean;
  /** Families of the affixes raised to their tier maximum (at most two). */
  polished?: string[];
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
  /** Set on unique flasks. Their fixed mods are in `affixes`. */
  uniqueId?: string;
};

/**
 * A currency drop: a stack of crafting currency, or tablets for a unique (id `tablet:<unique id>`).
 * It is picked up like an item but goes into the pouch, never the inventory (EXPANSION 8.4).
 */
export type CurrencyItem = { kind: 'currency'; uid: number; id: string; count: number };

/** What the inventory can hold. */
export type InventoryItem = Item | GemItem | FlaskItem;

/** Anything that can drop or be offered: an inventory item or currency. */
export type AnyItem = InventoryItem | CurrencyItem;

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
  /** Extra mods on the starting weapon and body armour only (the bases are shared with drops). */
  startMods?: { weapon?: Mod[]; body?: Mod[] };
};

export type DamageRange = { type: DamageType; min: number; max: number };
