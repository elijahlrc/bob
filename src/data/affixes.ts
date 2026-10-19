import type { DamageType, Mod, ModKind, SkillTag } from '../mods/types';
import { ARMOUR_FAMILY_DEFS } from './armourAffixes';
import { tabled } from './tierTables';
import type { TierTable } from './tierTables';
import * as W from './weaponTables';

/**
 * Item affix families (DESIGN.md §11.3). Each family is authored compactly — a stat template,
 * the value range at its first and last tier, and the item levels where tiers unlock — and the
 * tiers are generated. All names and numbers are ours.
 */

/** Tags an item base can carry for affix eligibility. */
export type SlotTag =
  | 'weapon'
  | 'oneHand'
  | 'twoHand'
  | 'casterWeapon'
  | 'attackWeapon'
  /** A weapon that rolls the minion affixes (the Beckoning Wand). */
  | 'minionWeapon'
  | 'sword'
  | 'axe'
  | 'mace'
  | 'sceptre'
  | 'dagger'
  | 'claw'
  | 'wand'
  | 'bow'
  | 'staff'
  | 'helmet'
  | 'gloves'
  | 'boots'
  | 'body'
  | 'shield'
  | 'quiver'
  | 'ring'
  | 'amulet'
  | 'belt'
  | 'armourPiece'
  | 'ar'
  | 'ev'
  | 'es'
  /** An armour piece or shield that gives two defences. */
  | 'hybrid'
  /** A shield that gives armour, evasion or energy shield (alone or with another). */
  | 'arShield'
  | 'evShield'
  | 'esShield';

export type ModTemplate = {
  stat: string;
  kind: ModKind;
  /** Values at the first and last tier: [min, max] each. */
  first: [number, number];
  last: [number, number];
  damageTypes?: DamageType[];
  tags?: SkillTag[];
  local?: boolean;
  /** Decimal places for rolled values (default 0). */
  dec?: number;
  /** Takes the value rolled for the mod before it (one roll that feeds two stats). */
  same?: boolean;
};

export type FamilyDef = {
  id: string;
  type: 'prefix' | 'suffix';
  /** The item must carry at least one of these tags. */
  slots: SlotTag[];
  /** The item must carry all of these tags (e.g. a defence type for local defence affixes). */
  requires?: SlotTag[];
  /** The item must carry none of these tags (a two-handed table that is not the bow's). */
  not?: SlotTag[];
  /** Minimum item level of each tier (its length is the tier count). */
  ilvls: number[];
  /** Explicit values of every tier (see `tabled`); without it the tiers interpolate between the first and last range of each mod. */
  table?: TierTable;
  mods: ModTemplate[];
  /** Magic-item names from weakest to strongest tier group. */
  names: [string, string, string];
  rareOnly?: boolean;
  /** The family a variant belongs to when one mod has a ladder for each set of slots (the bench and essences name the group). */
  group?: string;
  /** Base weight multiplier (default 1). */
  weight?: number;
  /** Weight multiplier on items with a tag (the first tag the item has): a family rarer on weapons than on armour. */
  weights?: Partial<Record<SlotTag, number>>;
};

export type Tier = { tier: number; minIlvl: number; weight: number; ranges: [number, number][] };
export type Family = FamilyDef & { tiers: Tier[] };

const ARMOUR: SlotTag[] = ['armourPiece'];
const CASTER: SlotTag[] = ['casterWeapon'];
const ELE: DamageType[] = ['fire', 'cold', 'lightning'];

const T8 = [1, 10, 20, 30, 42, 54, 68, 82];
const T7 = [1, 11, 23, 35, 48, 62, 76];
const T6 = [2, 14, 28, 42, 58, 74];
const T5 = [4, 18, 34, 52, 70];
const T4 = [6, 26, 48, 72];

const local = (
  stat: string,
  kind: ModKind,
  first: [number, number],
  last: [number, number],
  extra: Partial<ModTemplate> = {},
): ModTemplate => ({
  stat,
  kind,
  first,
  last,
  local: true,
  ...extra,
});
const g = (
  stat: string,
  kind: ModKind,
  first: [number, number],
  last: [number, number],
  extra: Partial<ModTemplate> = {},
): ModTemplate => ({
  stat,
  kind,
  first,
  last,
  ...extra,
});

/** The minimum and maximum of flat damage of one type. */
const flat = (
  type: DamageType,
  extra: Partial<ModTemplate> = {},
): Omit<ModTemplate, 'first' | 'last'>[] => [
  { stat: 'damage.min', kind: 'base', damageTypes: [type], ...extra },
  { stat: 'damage.max', kind: 'base', damageTypes: [type], ...extra },
];

const added = (
  type: DamageType,
  lo: [number, number],
  hi: [number, number],
  extra: Partial<ModTemplate> = {},
): ModTemplate[] => [
  {
    stat: 'damage.min',
    kind: 'base',
    first: [lo[0], lo[0] + 1],
    last: [lo[1], Math.round(lo[1] * 1.25)],
    damageTypes: [type],
    ...extra,
  },
  {
    stat: 'damage.max',
    kind: 'base',
    first: [hi[0], hi[0] + 2],
    last: [hi[1], Math.round(hi[1] * 1.15)],
    damageTypes: [type],
    ...extra,
  },
];

const HAND_DEFS: FamilyDef[] = [
  // ---- Prefixes --------------------------------------------------------------------------
  {
    id: 'mana',
    type: 'prefix',
    slots: ['casterWeapon', 'claw', 'dagger'],
    ilvls: T8,
    mods: [g('mana', 'base', [8, 15], [70, 80])],
    names: ['Inked', 'Wellspring', 'Deepwell'],
  },
  {
    id: 'physLocal',
    type: 'prefix',
    slots: ['weapon'],
    ilvls: T8,
    mods: [local('damage', 'inc', [20, 34], [150, 179], { damageTypes: ['physical'] })],
    names: ['Honed', 'Serrated', 'Merciless'],
    weight: 0.7,
  },
  {
    id: 'addPhysLocal',
    type: 'prefix',
    slots: ['oneHand'],
    ...tabled(W.PHYS_1H, flat('physical', { local: true })),
    names: ['Weighted', 'Brutal', 'Ruinous'],
  },
  {
    id: 'addPhysLocal2h',
    type: 'prefix',
    slots: ['twoHand'],
    ...tabled(W.PHYS_2H, flat('physical', { local: true })),
    names: ['Weighted', 'Brutal', 'Ruinous'],
  },
  {
    id: 'addFireLocal',
    type: 'prefix',
    slots: ['oneHand'],
    ...tabled(W.FIRE_1H, flat('fire', { local: true })),
    names: ['Smouldering', 'Blazing', 'Infernal'],
    weight: 1.4,
    weights: { casterWeapon: 0.5 },
  },
  {
    id: 'addFireLocal2h',
    type: 'prefix',
    slots: ['twoHand'],
    not: ['bow'],
    ...tabled(W.FIRE_2H, flat('fire', { local: true })),
    names: ['Smouldering', 'Blazing', 'Infernal'],
    weight: 1.4,
    weights: { casterWeapon: 0.5 },
  },
  {
    id: 'addFireLocalBow',
    type: 'prefix',
    slots: ['bow'],
    ...tabled(W.FIRE_BOW, flat('fire', { local: true })),
    names: ['Smouldering', 'Blazing', 'Infernal'],
    weight: 1.4,
  },
  {
    id: 'addColdLocal',
    type: 'prefix',
    slots: ['oneHand'],
    ...tabled(W.COLD_1H, flat('cold', { local: true })),
    names: ['Chilled', 'Frostbitten', 'Glacial'],
    weight: 1.4,
    weights: { casterWeapon: 0.5 },
  },
  {
    id: 'addColdLocal2h',
    type: 'prefix',
    slots: ['twoHand'],
    not: ['bow'],
    ...tabled(W.COLD_2H, flat('cold', { local: true })),
    names: ['Chilled', 'Frostbitten', 'Glacial'],
    weight: 1.4,
    weights: { casterWeapon: 0.5 },
  },
  {
    id: 'addColdLocalBow',
    type: 'prefix',
    slots: ['bow'],
    ...tabled(W.COLD_BOW, flat('cold', { local: true })),
    names: ['Chilled', 'Frostbitten', 'Glacial'],
    weight: 1.4,
  },
  {
    id: 'addLightLocal',
    type: 'prefix',
    slots: ['oneHand'],
    ...tabled(W.LIGHTNING_1H, flat('lightning', { local: true })),
    names: ['Crackling', 'Arcing', 'Tempestuous'],
    weight: 1.4,
    weights: { casterWeapon: 0.5 },
  },
  {
    id: 'addLightLocal2h',
    type: 'prefix',
    slots: ['twoHand'],
    not: ['bow'],
    ...tabled(W.LIGHTNING_2H, flat('lightning', { local: true })),
    names: ['Crackling', 'Arcing', 'Tempestuous'],
    weight: 1.4,
    weights: { casterWeapon: 0.5 },
  },
  {
    id: 'addLightLocalBow',
    type: 'prefix',
    slots: ['bow'],
    ...tabled(W.LIGHTNING_BOW, flat('lightning', { local: true })),
    names: ['Crackling', 'Arcing', 'Tempestuous'],
    weight: 1.4,
  },
  {
    id: 'addFireSpells',
    type: 'prefix',
    slots: CASTER,
    requires: ['oneHand'],
    ...tabled(W.SPELL_FIRE_1H, flat('fire', { tags: ['spell'] })),
    names: ['Kindled', 'Pyric', 'Volcanic'],
    weight: 1.4,
  },
  {
    id: 'addFireSpells2h',
    type: 'prefix',
    slots: CASTER,
    requires: ['twoHand'],
    ...tabled(W.SPELL_FIRE_2H, flat('fire', { tags: ['spell'] })),
    names: ['Kindled', 'Pyric', 'Volcanic'],
    weight: 1.4,
  },
  {
    id: 'addColdSpells',
    type: 'prefix',
    slots: CASTER,
    requires: ['oneHand'],
    ...tabled(W.SPELL_COLD_1H, flat('cold', { tags: ['spell'] })),
    names: ['Frigid', 'Rimed', 'Polar'],
    weight: 1.4,
  },
  {
    id: 'addColdSpells2h',
    type: 'prefix',
    slots: CASTER,
    requires: ['twoHand'],
    ...tabled(W.SPELL_COLD_2H, flat('cold', { tags: ['spell'] })),
    names: ['Frigid', 'Rimed', 'Polar'],
    weight: 1.4,
  },
  {
    id: 'addLightSpells',
    type: 'prefix',
    slots: CASTER,
    requires: ['oneHand'],
    ...tabled(W.SPELL_LIGHTNING_1H, flat('lightning', { tags: ['spell'] })),
    names: ['Humming', 'Galvanic', 'Stormwrought'],
    weight: 1.4,
  },
  {
    id: 'addLightSpells2h',
    type: 'prefix',
    slots: CASTER,
    requires: ['twoHand'],
    ...tabled(W.SPELL_LIGHTNING_2H, flat('lightning', { tags: ['spell'] })),
    names: ['Humming', 'Galvanic', 'Stormwrought'],
    weight: 1.4,
  },
  {
    id: 'spellDamageWeapon',
    type: 'prefix',
    slots: CASTER,
    requires: ['oneHand'],
    ...tabled(W.SPELL_DAMAGE_1H, [{ stat: 'damage', kind: 'inc', tags: ['spell'] }]),
    names: ['Chanting', 'Incanting', 'Archmage'],
  },
  {
    id: 'spellDamageWeapon2h',
    type: 'prefix',
    slots: CASTER,
    requires: ['twoHand'],
    ...tabled(W.SPELL_DAMAGE_2H, [{ stat: 'damage', kind: 'inc', tags: ['spell'] }]),
    names: ['Chanting', 'Incanting', 'Archmage'],
  },
  {
    id: 'eleAttacks',
    type: 'prefix',
    slots: ['weapon'],
    ilvls: T6,
    mods: [g('damage', 'inc', [5, 10], [35, 42], { damageTypes: ELE, tags: ['attack'] })],
    names: ['Charged', 'Elemental', 'Prismatic'],
    weight: 0.3,
  },
  {
    id: 'gemLevel',
    type: 'prefix',
    slots: [], // retired: not a reference mod; items that have it keep it
    ilvls: [60, 75],
    mods: [local('socketedGemLevel', 'base', [1, 1], [2, 2])],
    names: ['Resonating', 'Resonating', 'Choral'],
    rareOnly: true,
    weight: 0.4,
  },
  {
    id: 'weaponGemLevel',
    type: 'prefix',
    slots: ['attackWeapon'],
    ilvls: [50],
    mods: [local('socketedGemLevel', 'base', [1, 1], [1, 1])],
    names: ['Resonating', 'Resonating', 'Resonating'],
    weight: 0.5,
  },
  // ---- Suffixes --------------------------------------------------------------------------
  {
    id: 'fireRes',
    type: 'suffix',
    slots: [...ARMOUR, 'ring', 'amulet', 'belt', 'quiver', 'weapon'],
    ilvls: T8,
    mods: [g('resist.fire', 'base', [6, 11], [44, 48])],
    names: ['of Embers', 'of the Kiln', 'of the Pyre'],
    weights: { weapon: 0.49 },
  },
  {
    id: 'coldRes',
    type: 'suffix',
    slots: [...ARMOUR, 'ring', 'amulet', 'belt', 'quiver', 'weapon'],
    ilvls: T8,
    mods: [g('resist.cold', 'base', [6, 11], [44, 48])],
    names: ['of Wool', 'of the Thaw', 'of the Hearth'],
    weights: { weapon: 0.49 },
  },
  {
    id: 'lightRes',
    type: 'suffix',
    slots: [...ARMOUR, 'ring', 'amulet', 'belt', 'quiver', 'weapon'],
    ilvls: T8,
    mods: [g('resist.lightning', 'base', [6, 11], [44, 48])],
    names: ['of Grounding', 'of the Rod', 'of the Lodestone'],
    weights: { weapon: 0.49 },
  },
  {
    id: 'chaosRes',
    type: 'suffix',
    slots: [...ARMOUR, 'ring', 'amulet', 'belt', 'quiver', 'weapon'],
    ilvls: T6,
    mods: [g('resist.chaos', 'base', [5, 10], [31, 35])],
    names: ['of Antidotes', 'of Purging', 'of the Clean Grave'],
    weight: 0.25,
    weights: { weapon: 1.2 },
  },
  {
    id: 'str',
    type: 'suffix',
    slots: ['sword', 'axe', 'mace', 'sceptre', 'staff'],
    ilvls: T8,
    mods: [g('str', 'base', [8, 12], [51, 55])],
    names: ['of the Ox', 'of the Boulder', 'of the Mountain'],
  },
  {
    id: 'dex',
    type: 'suffix',
    slots: ['sword', 'axe', 'claw', 'dagger', 'bow'],
    ilvls: T8,
    mods: [g('dex', 'base', [8, 12], [51, 55])],
    names: ['of the Hare', 'of the Lynx', 'of the Falcon'],
  },
  {
    id: 'int',
    type: 'suffix',
    slots: ['wand', 'dagger', 'claw', 'staff', 'sceptre'],
    ilvls: T8,
    mods: [g('int', 'base', [8, 12], [51, 55])],
    names: ['of the Owl', 'of the Archive', 'of the Oracle'],
  },
  {
    id: 'aspdLocal',
    type: 'suffix',
    slots: ['weapon'],
    not: ['wand', 'bow'],
    ...tabled(W.ATTACK_SPEED, [{ stat: 'attackSpeed', kind: 'inc', local: true }]),
    names: ['of Quickness', 'of Fervour', 'of the Whirlwind'],
  },
  {
    id: 'aspdLocalRanged',
    type: 'suffix',
    slots: ['wand', 'bow'],
    ...tabled(W.ATTACK_SPEED_RANGED, [{ stat: 'attackSpeed', kind: 'inc', local: true }]),
    names: ['of Quickness', 'of Fervour', 'of the Whirlwind'],
  },
  {
    id: 'castSpeedWeapon',
    type: 'suffix',
    slots: CASTER,
    requires: ['oneHand'],
    ...tabled(W.CAST_SPEED_1H, [{ stat: 'castSpeed', kind: 'inc' }]),
    names: ['of Talent', 'of Mastery', 'of Sorcery'],
  },
  {
    id: 'castSpeedWeapon2h',
    type: 'suffix',
    slots: CASTER,
    requires: ['twoHand'],
    ...tabled(W.CAST_SPEED_2H, [{ stat: 'castSpeed', kind: 'inc' }]),
    names: ['of Talent', 'of Mastery', 'of Sorcery'],
  },
  {
    id: 'critLocal',
    type: 'suffix',
    slots: ['weapon'],
    ilvls: T6,
    mods: [local('critChance', 'inc', [10, 14], [35, 38])],
    names: ['of Needling', 'of Precision', 'of the Surgeon'],
  },
  {
    id: 'critMulti',
    type: 'suffix',
    slots: ['weapon'],
    ilvls: T6,
    mods: [g('critMulti', 'base', [8, 12], [35, 38])],
    names: ['of Ire', 'of Fury', 'of Butchery'],
  },
  {
    id: 'manaRegen',
    type: 'suffix',
    slots: [...CASTER, 'claw', 'dagger'],
    ilvls: T6,
    mods: [g('manaRegen', 'inc', [10, 19], [60, 69])],
    names: ['of Excitement', 'of Zeal', 'of Euphoria'],
  },
  {
    id: 'lifeOnHit',
    type: 'suffix',
    slots: ['weapon'],
    ilvls: T5,
    mods: [g('lifeOnHit', 'base', [1, 2], [8, 10], { tags: ['attack'] })],
    names: ['of Feeding', 'of Gorging', 'of the Glutton'],
  },
  {
    id: 'moveSpeed',
    type: 'suffix',
    slots: [], // retired: now a prefix, bootsMoveSpeed; items that have it keep it
    ilvls: [1, 15, 30, 45, 60],
    mods: [g('moveSpeed', 'inc', [8, 10], [28, 30])],
    names: ['of the Courier', 'of the Hare', 'of the Comet'],
    weight: 1.5,
  },
  {
    id: 'igniteChance',
    type: 'suffix',
    slots: [], // retired: weapons only now; items that have it keep it
    ilvls: T4,
    mods: [g('chance.ignite', 'base', [5, 8], [20, 25])],
    names: ['of Kindling', 'of Arson', 'of the Inferno'],
    weight: 0.7,
  },
  {
    id: 'igniteChanceWeapon',
    type: 'suffix',
    slots: ['wand', 'sceptre'],
    ...tabled(W.CHANCE_1H, [{ stat: 'chance.ignite', kind: 'base' }]),
    names: ['of Kindling', 'of Arson', 'of the Inferno'],
  },
  {
    id: 'igniteChanceWeapon2h',
    type: 'suffix',
    slots: ['staff'],
    ...tabled(W.CHANCE_2H, [{ stat: 'chance.ignite', kind: 'base' }]),
    names: ['of Kindling', 'of Arson', 'of the Inferno'],
  },
  {
    id: 'bleedChance',
    type: 'suffix',
    slots: [], // retired: weapons only now; items that have it keep it
    ilvls: T4,
    mods: [g('chance.bleed', 'base', [5, 8], [20, 25])],
    names: ['of Nicking', 'of Lacerations', 'of the Abattoir'],
    weight: 0.7,
  },
  {
    id: 'bleedWeapon',
    type: 'suffix',
    slots: ['sword', 'axe', 'mace', 'bow'],
    ...tabled(W.BLEED_HYBRID, [
      { stat: 'chance.bleed', kind: 'base' },
      { stat: 'damage', kind: 'inc', tags: ['bleed'] },
    ]),
    names: ['of Nicking', 'of Lacerations', 'of the Abattoir'],
  },
  {
    id: 'poisonChance',
    type: 'suffix',
    slots: [], // retired: weapons only now; items that have it keep it
    ilvls: T4,
    mods: [g('chance.poison', 'base', [5, 8], [20, 25])],
    names: ['of Venom', 'of Blight', 'of the Viper'],
    weight: 0.7,
  },
  {
    id: 'poisonWeapon',
    type: 'suffix',
    slots: ['claw', 'dagger', 'sword', 'bow'],
    ...tabled(W.POISON_HYBRID, [
      { stat: 'chance.poison', kind: 'base' },
      { stat: 'damage', kind: 'inc', tags: ['poison'] },
    ]),
    names: ['of Venom', 'of Blight', 'of the Viper'],
  },
  {
    id: 'shockChance',
    type: 'suffix',
    slots: [], // retired: weapons only now; items that have it keep it
    ilvls: T4,
    mods: [g('chance.shock', 'base', [5, 8], [20, 25])],
    names: ['of Static', 'of Thunderheads', 'of the Tempest'],
    weight: 0.7,
  },
  {
    id: 'shockChanceWeapon',
    type: 'suffix',
    slots: ['wand', 'sceptre'],
    ...tabled(W.CHANCE_1H, [{ stat: 'chance.shock', kind: 'base' }]),
    names: ['of Static', 'of Thunderheads', 'of the Tempest'],
  },
  {
    id: 'shockChanceWeapon2h',
    type: 'suffix',
    slots: ['staff'],
    ...tabled(W.CHANCE_2H, [{ stat: 'chance.shock', kind: 'base' }]),
    names: ['of Static', 'of Thunderheads', 'of the Tempest'],
  },
  {
    id: 'freezeChance',
    type: 'suffix',
    slots: [], // retired: weapons only now; items that have it keep it
    ilvls: T4,
    mods: [g('chance.freeze', 'base', [5, 8], [20, 25])],
    names: ['of Rime', 'of Whiteout', 'of the Glacier'],
    weight: 0.7,
  },
  {
    id: 'freezeChanceWeapon',
    type: 'suffix',
    slots: ['wand', 'sceptre'],
    ...tabled(W.CHANCE_1H, [{ stat: 'chance.freeze', kind: 'base' }]),
    names: ['of Rime', 'of Whiteout', 'of the Glacier'],
  },
  {
    id: 'freezeChanceWeapon2h',
    type: 'suffix',
    slots: ['staff'],
    ...tabled(W.CHANCE_2H, [{ stat: 'chance.freeze', kind: 'base' }]),
    names: ['of Rime', 'of Whiteout', 'of the Glacier'],
  },
  {
    id: 'reservation',
    type: 'suffix',
    slots: [], // retired: no reference counterpart on these items; items that have it keep it
    ilvls: [30, 55, 78],
    mods: [g('reducedReservation', 'base', [4, 6], [10, 12])],
    names: ['of Restraint', 'of Restraint', 'of Serenity'],
    rareOnly: true,
    weight: 0.5,
  },
  {
    id: 'addChaosAttacks',
    type: 'prefix',
    slots: [], // retired: no reference counterpart on these items; items that have it keep it
    ilvls: T6,
    mods: added('chaos', [1, 12], [3, 22], { tags: ['attack'] }),
    names: ['Tainted', 'Befouled', 'Rotted'],
    weight: 0.6,
  },
  {
    id: 'auraEffect',
    type: 'suffix',
    slots: [], // retired: no reference counterpart on these items; items that have it keep it
    ilvls: [30, 55, 78],
    mods: [g('auraEffect', 'inc', [4, 6], [10, 14])],
    names: ['of Radiance', 'of Radiance', 'of the Beacon'],
    rareOnly: true,
    weight: 0.5,
  },
  {
    id: 'areaEffect',
    type: 'suffix',
    slots: [], // retired: no reference counterpart on these items; items that have it keep it
    ilvls: T5,
    mods: [g('aoe', 'inc', [5, 8], [16, 22])],
    names: ['of Reach', 'of Sweep', 'of Breadth'],
    weight: 0.6,
  },
  {
    id: 'stunDuration',
    type: 'suffix',
    slots: ['weapon'],
    ilvls: T5,
    mods: [g('stunDuration', 'inc', [10, 15], [35, 40])],
    names: ['of Dazing', 'of Stupor', 'of the Concussion'],
    weight: 0.7,
  },
  {
    id: 'enemyStunThreshold',
    type: 'suffix',
    slots: ['sword', 'axe', 'mace', 'sceptre', 'staff'],
    ...tabled(W.STUN_THRESHOLD, [{ stat: 'enemyStunThreshold', kind: 'base' }]),
    names: ['of Rattling', 'of Staggering', 'of Toppling'],
    weight: 0.6,
  },
  {
    id: 'stunThreshold',
    type: 'suffix',
    slots: [], // retired: no reference counterpart on these items; items that have it keep it
    ilvls: T5,
    mods: [g('stunThreshold', 'inc', [10, 15], [36, 40])],
    names: ['of Grit', 'of Fortitude', 'of the Bulwark'],
    weight: 0.7,
  },
  // ---- Weapons: the rest of the pool a weapon rolls in the reference game (docs/AUDIT-WEAPON-AFFIXES.md) ----------
  {
    id: 'physAcc',
    type: 'prefix',
    slots: ['weapon'],
    ilvls: T8,
    mods: [
      local('damage', 'inc', [10, 16], [62, 72], { damageTypes: ['physical'] }),
      local('accuracy', 'base', [8, 14], [110, 130]),
    ],
    names: ['Whetted', 'Barbed-edge', 'Needlepoint'],
    weight: 0.7,
  },
  {
    id: 'accuracyLocal',
    type: 'suffix',
    slots: ['weapon'],
    ilvls: T8,
    mods: [local('accuracy', 'base', [10, 30], [380, 450])],
    names: ['of Aim', 'of the Sightline', 'of the Sharpshooter'],
  },
  {
    id: 'accuracyPct',
    type: 'suffix',
    slots: ['weapon'],
    ilvls: [8, 15, 30],
    mods: [g('accuracy', 'inc', [9, 11], [16, 20])],
    names: ['of Seeing', 'of Sighting', 'of the Eagle'],
    weight: 0.5,
  },
  {
    id: 'lifeLeechPhys',
    type: 'prefix',
    slots: ['weapon'],
    ilvls: [30, 50, 70],
    mods: [
      g('leech.life', 'base', [0.2, 0.4], [0.7, 0.9], {
        damageTypes: ['physical'],
        tags: ['attack'],
        dec: 1,
      }),
    ],
    names: ['Hungering', 'Draining', 'Ravenous'],
    weight: 0.5,
  },
  {
    id: 'manaLeechPhys',
    type: 'prefix',
    slots: ['weapon'],
    ilvls: [50, 70],
    mods: [
      g('leech.mana', 'base', [0.2, 0.3], [0.3, 0.5], {
        damageTypes: ['physical'],
        tags: ['attack'],
        dec: 1,
      }),
    ],
    names: ['Siphoning', 'Tapping', 'Draught-drinking'],
    weight: 0.4,
  },
  {
    id: 'lifeOnKill',
    type: 'suffix',
    slots: ['weapon'],
    ilvls: [1, 20, 40],
    mods: [g('lifeOnKill', 'base', [3, 6], [11, 14])],
    names: ['of Reaping', 'of Harvest', 'of the Culling'],
    weight: 0.7,
  },
  {
    id: 'manaOnKill',
    type: 'suffix',
    slots: ['weapon'],
    ilvls: [1, 20, 40],
    mods: [g('manaOnKill', 'base', [1, 2], [4, 6])],
    names: ['of Sipping', 'of Quaffing', 'of the Draught'],
    weight: 0.6,
  },
  {
    id: 'addChaosLocal',
    type: 'prefix',
    slots: ['oneHand', 'bow'],
    ...tabled(W.CHAOS_1H, flat('chaos', { local: true })),
    names: ['Noxious', 'Corroding', 'Abyssal'],
    weight: 0.4,
  },
  {
    id: 'addChaosLocal2h',
    type: 'prefix',
    slots: ['twoHand'],
    not: ['bow'],
    ...tabled(W.CHAOS_2H, flat('chaos', { local: true })),
    names: ['Noxious', 'Corroding', 'Abyssal'],
    weight: 0.4,
  },
  {
    id: 'reqReduction',
    type: 'suffix',
    slots: ['weapon'],
    ilvls: [36, 60],
    mods: [local('reqReduction', 'base', [18, 18], [32, 32])],
    names: ['of Ease', 'of Ease', 'of Easy Fit'],
    weight: 0.5,
  },
  {
    id: 'dotMulti',
    type: 'suffix',
    slots: ['weapon'],
    ilvls: [44, 56, 68, 80],
    mods: [g('dotMulti', 'base', [5, 8], [20, 24])],
    names: ['of Festering', 'of Rot', 'of the Slow Death'],
    weight: 0.5,
  },
  // Spell weapons (a wand, a sceptre, a staff, a rune dagger).
  {
    id: 'spellMana',
    type: 'prefix',
    slots: CASTER,
    ilvls: T7,
    mods: [
      g('damage', 'inc', [5, 8], [40, 48], { tags: ['spell'] }),
      g('mana', 'base', [8, 12], [45, 55]),
    ],
    names: ['Studious', 'Scholarly', 'Erudite'],
    weight: 0.8,
  },
  {
    id: 'fireDamage',
    type: 'prefix',
    slots: CASTER,
    ilvls: T8,
    mods: [g('damage', 'inc', [8, 12], [75, 89], { damageTypes: ['fire'] })],
    names: ['Heated', 'Seething', 'Cremating'],
    weight: 0.35,
  },
  {
    id: 'coldDamage',
    type: 'prefix',
    slots: CASTER,
    ilvls: T8,
    mods: [g('damage', 'inc', [8, 12], [75, 89], { damageTypes: ['cold'] })],
    names: ['Wintry', 'Numbing', 'Hibernal'],
    weight: 0.35,
  },
  {
    id: 'lightDamage',
    type: 'prefix',
    slots: CASTER,
    ilvls: T8,
    mods: [g('damage', 'inc', [8, 12], [75, 89], { damageTypes: ['lightning'] })],
    names: ['Voltaic', 'Surging', 'Thunderous'],
    weight: 0.35,
  },
  {
    id: 'fireDamageSfx',
    type: 'suffix',
    slots: ['wand', 'sceptre', 'staff'],
    ilvls: T6,
    mods: [g('damage', 'inc', [3, 7], [27, 30], { damageTypes: ['fire'] })],
    names: ['of Heat', 'of the Furnace', 'of the Forge'],
  },
  {
    id: 'coldDamageSfx',
    type: 'suffix',
    slots: ['wand', 'sceptre', 'staff'],
    ilvls: T6,
    mods: [g('damage', 'inc', [3, 7], [27, 30], { damageTypes: ['cold'] })],
    names: ['of Chill', 'of the Floe', 'of Permafrost'],
  },
  {
    id: 'lightDamageSfx',
    type: 'suffix',
    slots: ['wand', 'sceptre', 'staff'],
    ilvls: T6,
    mods: [g('damage', 'inc', [3, 7], [27, 30], { damageTypes: ['lightning'] })],
    names: ['of Sparks', 'of the Conductor', 'of the Storm-cell'],
  },
  {
    id: 'spellCrit',
    type: 'suffix',
    slots: CASTER,
    ilvls: T6,
    mods: [g('critChance', 'inc', [15, 25], [60, 70], { tags: ['spell'] })],
    names: ['of Insight', 'of Clarity', 'of the Seer'],
  },
  {
    id: 'burnDamage',
    type: 'suffix',
    slots: CASTER,
    ilvls: [20, 35, 48, 60],
    mods: [g('damage', 'inc', [16, 20], [41, 50], { tags: ['ignite'] })],
    names: ['of Cinders', 'of Smelting', 'of Conflagration'],
    weight: 0.8,
  },
  {
    id: 'projectileSpeed',
    type: 'suffix',
    slots: ['wand', 'bow'],
    ilvls: T5,
    mods: [g('projectileSpeed', 'inc', [10, 17], [42, 46])],
    names: ['of Flight', 'of the Dart', 'of the Swift Shaft'],
  },
  {
    id: 'fireDot',
    type: 'prefix',
    slots: CASTER,
    ilvls: T5,
    mods: [g('dotMulti', 'base', [10, 14], [30, 36], { damageTypes: ['fire'] })],
    names: ['Cindering', 'Scalding', 'Consuming'],
    weight: 0.35,
  },
  {
    id: 'coldDot',
    type: 'prefix',
    slots: CASTER,
    ilvls: T5,
    mods: [g('dotMulti', 'base', [10, 14], [30, 36], { damageTypes: ['cold'] })],
    names: ['Creeping', 'Gnawing', 'Biting'],
    weight: 0.35,
  },
  {
    id: 'chaosDot',
    type: 'prefix',
    slots: [...CASTER, 'dagger'],
    ilvls: T5,
    mods: [g('dotMulti', 'base', [10, 14], [30, 36], { damageTypes: ['chaos'] })],
    names: ['Rotting', 'Wasting', 'Necrotic'],
    weight: 0.45,
  },
  {
    id: 'physAsChaos',
    type: 'prefix',
    slots: [...CASTER, 'dagger'],
    ilvls: [66, 72, 80],
    mods: [g('gain.physical.chaos', 'base', [5, 7], [11, 13])],
    names: ['Tainting', 'Fouling', 'Defiling'],
    weight: 0.35,
  },
  {
    id: 'fireAsChaos',
    type: 'prefix',
    slots: [...CASTER, 'dagger'],
    ilvls: [66, 72, 80],
    mods: [g('gain.fire.chaos', 'base', [5, 7], [11, 13])],
    names: ['Blackened', 'Sooty', 'Charred'],
    weight: 0.35,
  },
  {
    id: 'coldAsChaos',
    type: 'prefix',
    slots: [...CASTER, 'dagger'],
    ilvls: [66, 72, 80],
    mods: [g('gain.cold.chaos', 'base', [5, 7], [11, 13])],
    names: ['Livid', 'Bruised', 'Necrosed'],
    weight: 0.35,
  },
  {
    id: 'lightAsChaos',
    type: 'prefix',
    slots: [...CASTER, 'dagger'],
    ilvls: [66, 72, 80],
    mods: [g('gain.lightning.chaos', 'base', [5, 7], [11, 13])],
    names: ['Singed', 'Fused', 'Slagged'],
    weight: 0.35,
  },
  // Gem levels.
  {
    id: 'spellGemLevel',
    type: 'prefix',
    slots: CASTER,
    ilvls: [55],
    mods: [g('gemLevel', 'base', [1, 1], [1, 1], { tags: ['spell'] })],
    names: ['Rune-lit', 'Rune-lit', 'Rune-lit'],
    rareOnly: true,
    weight: 0.1,
  },
  {
    id: 'fireGemLevel',
    type: 'prefix',
    slots: CASTER,
    ilvls: [30, 77],
    mods: [g('gemLevel', 'base', [1, 1], [2, 2], { tags: ['fire', 'spell'] })],
    names: ['Ember-lit', 'Ember-lit', 'Furnace-lit'],
    rareOnly: true,
    weight: 0.3,
  },
  {
    id: 'coldGemLevel',
    type: 'prefix',
    slots: CASTER,
    ilvls: [30, 77],
    mods: [g('gemLevel', 'base', [1, 1], [2, 2], { tags: ['cold', 'spell'] })],
    names: ['Rime-lit', 'Rime-lit', 'Glacier-lit'],
    rareOnly: true,
    weight: 0.3,
  },
  {
    id: 'lightGemLevel',
    type: 'prefix',
    slots: CASTER,
    ilvls: [30, 77],
    mods: [g('gemLevel', 'base', [1, 1], [2, 2], { tags: ['lightning', 'spell'] })],
    names: ['Spark-lit', 'Spark-lit', 'Storm-lit'],
    rareOnly: true,
    weight: 0.3,
  },
  {
    id: 'chaosGemLevel',
    type: 'prefix',
    slots: CASTER,
    ilvls: [30, 77],
    mods: [g('gemLevel', 'base', [1, 1], [2, 2], { tags: ['chaos', 'spell'] })],
    names: ['Blight-lit', 'Blight-lit', 'Void-lit'],
    rareOnly: true,
    weight: 0.25,
  },
  {
    id: 'physGemLevel',
    type: 'prefix',
    slots: CASTER,
    ilvls: [30, 77],
    mods: [g('gemLevel', 'base', [1, 1], [2, 2], { tags: ['physical', 'spell'] })],
    names: ['Bone-lit', 'Bone-lit', 'Marrow-lit'],
    rareOnly: true,
    weight: 0.25,
  },
  {
    id: 'meleeGemLevel',
    type: 'prefix',
    slots: ['sword', 'axe', 'mace', 'sceptre', 'dagger', 'claw', 'staff'],
    ilvls: [10, 60],
    mods: [local('socketedGemLevel', 'base', [1, 1], [2, 2], { tags: ['melee'] })],
    names: ['Martial', 'Martial', 'Warlike'],
    weight: 0.5,
  },
  {
    id: 'bowGemLevel',
    type: 'prefix',
    slots: ['bow'],
    ilvls: [10, 60],
    mods: [local('socketedGemLevel', 'base', [1, 1], [2, 2], { tags: ['bow'] })],
    names: ['Quivering', 'Quivering', "Bowyer's"],
    weight: 0.5,
  },
  {
    id: 'extraArrow',
    type: 'suffix',
    slots: ['bow'],
    ilvls: [86],
    mods: [g('projectiles', 'base', [1, 1], [1, 1], { tags: ['attack'] })],
    names: ['of the Twin Shaft', 'of the Twin Shaft', 'of the Twin Shaft'],
    rareOnly: true,
    weight: 0.3,
  },
];

/**
 * The minion affixes of the one weapon base that rolls them (the Beckoning Wand, `ItemBase.minionWeapon`), with the 3.9
 * tiers (docs/AUDIT-ITEM-BASES.md): minion damage, damage with mana, attack and cast speed (Bob's one minion speed stat),
 * minion life and the minion gem level. Minion resistances and accuracy have no stat here and are left out.
 */
const MINION_WEAPON_DEFS: FamilyDef[] = [
  {
    id: 'minionDamageWand',
    type: 'prefix',
    slots: ['minionWeapon'],
    ...tabled(
      [
        [2, [10, 19]],
        [11, [20, 29]],
        [23, [30, 39]],
        [35, [40, 49]],
        [46, [50, 59]],
        [58, [60, 69]],
        [64, [70, 74]],
        [84, [75, 79]],
      ],
      [{ stat: 'minionDamage', kind: 'inc' }],
    ),
    names: ['Herding', 'Marshalling', 'Commanding'],
  },
  {
    id: 'minionDamageManaWand',
    type: 'prefix',
    slots: ['minionWeapon'],
    ...tabled(
      [
        [2, [17, 20], [5, 9]],
        [11, [21, 24], [10, 14]],
        [23, [25, 28], [15, 19]],
        [35, [29, 33], [20, 24]],
        [46, [34, 37], [25, 29]],
        [58, [38, 41], [30, 34]],
        [80, [42, 45], [35, 39]],
      ],
      [
        { stat: 'mana', kind: 'base' },
        { stat: 'minionDamage', kind: 'inc' },
      ],
    ),
    names: ['Attendant', 'Steward', 'Regent'],
  },
  {
    id: 'minionGemLevelWand',
    type: 'prefix',
    slots: ['minionWeapon'],
    ...tabled([[60, [1, 1]]], [{ stat: 'gemLevel', kind: 'base', tags: ['minion'] }]),
    names: ['Shepherding', 'Shepherding', 'Shepherding'],
  },
  {
    id: 'minionSpeedWand',
    type: 'suffix',
    slots: ['minionWeapon'],
    ...tabled(
      [
        [2, [5, 7]],
        [15, [8, 10]],
        [30, [11, 13]],
        [40, [14, 16]],
        [55, [17, 19]],
        [72, [20, 22]],
        [83, [23, 25]],
      ],
      [{ stat: 'minionSpeed', kind: 'inc' }],
    ),
    names: ['of Urging', 'of Driving', 'of Goading'],
  },
  {
    id: 'minionLifeWand',
    type: 'suffix',
    slots: ['minionWeapon'],
    ...tabled(
      [
        [10, [13, 17]],
        [26, [18, 22]],
        [42, [23, 27]],
        [58, [28, 32]],
        [74, [33, 36]],
        [82, [37, 40]],
      ],
      [{ stat: 'minionLife', kind: 'inc' }],
    ),
    names: ['of the Keeper', 'of the Warden', 'of the Overseer'],
  },
];

export const FAMILY_DEFS: FamilyDef[] = [
  ...HAND_DEFS,
  ...ARMOUR_FAMILY_DEFS,
  ...MINION_WEAPON_DEFS,
];

function round(v: number, dec = 0): number {
  const f = Math.pow(10, dec);
  return Math.round(v * f) / f;
}

/**
 * How likely the top tier of a family is next to its lowest. A single run finds far fewer items than the reference game's
 * trade economy, so the best rolls are kept within reach: a quarter as likely, where it was half.
 */
export const TOP_TIER_WEIGHT = 0.25;

/** Expand a family definition into tiers. Values interpolate geometrically between first and last. */
export function expandFamily(def: FamilyDef): Family {
  const n = def.ilvls.length;
  const tiers: Tier[] = def.ilvls.map((minIlvl, i) => {
    const t = n > 1 ? i / (n - 1) : 1;
    const ranges = def.table
      ? (def.table[i].slice(1) as [number, number][])
      : def.mods.map((m): [number, number] => {
          const lerp = (a: number, b: number) =>
            a > 0 && b > 0 ? a * Math.pow(b / a, t) : a + (b - a) * t;
          let lo = round(lerp(m.first[0], m.last[0]), m.dec);
          let hi = round(lerp(m.first[1], m.last[1]), m.dec);
          if (hi < lo) [lo, hi] = [hi, lo];
          return [lo, hi];
        });
    // Higher tiers are rarer: the top tier weighs TOP_TIER_WEIGHT of the lowest, the others fall evenly between.
    const weight = Math.round(
      1000 * (def.weight ?? 1) * (n > 1 ? 1 - (1 - TOP_TIER_WEIGHT) * (i / (n - 1)) : 1),
    );
    return { tier: i + 1, minIlvl, weight, ranges };
  });
  return { ...def, tiers };
}

/** The weight multiplier of a family on an item with these tags. */
export function slotWeight(f: FamilyDef, tags: ReadonlySet<SlotTag>): number {
  if (!f.weights) return 1;
  for (const [t, w] of Object.entries(f.weights)) if (tags.has(t as SlotTag)) return w;
  return 1;
}

export const FAMILIES: Family[] = FAMILY_DEFS.map(expandFamily);
const BY_ID = new Map(FAMILIES.map((f) => [f.id, f]));

export function family(id: string): Family {
  const f = BY_ID.get(id);
  if (!f) throw new Error(`unknown affix family ${id}`);
  return f;
}

/** Build the concrete mods of a family tier from rolled values. */
export function familyMods(f: Family, values: number[]): Mod[] {
  return f.mods.map((m, i) => ({
    stat: m.stat,
    kind: m.kind,
    value: m.same ? values[i - 1] : values[i],
    ...(m.damageTypes ? { damageTypes: m.damageTypes } : {}),
    ...(m.tags ? { tags: m.tags } : {}),
    ...(m.local ? { local: true } : {}),
  }));
}

/** Rare item name parts. */
export const RARE_FIRST = [
  'Grim',
  'Hollow',
  'Ashen',
  'Bone',
  'Dusk',
  'Gloom',
  'Rust',
  'Thorn',
  'Wraith',
  'Crypt',
  'Ember',
  'Frost',
  'Storm',
  'Pale',
  'Bleak',
  'Marrow',
  'Sorrow',
  'Iron',
  'Raven',
  'Shroud',
  'Tomb',
  'Vigil',
  'Dread',
  'Cinder',
  'Woe',
  'Mire',
  'Gale',
  'Blight',
  'Sable',
  'Night',
];
export const RARE_SECOND: Record<string, string[]> = {
  weapon: ['Bite', 'Edge', 'Fang', 'Song', 'Thirst', 'Reaver', 'Hew', 'Spike', 'Knell', 'Mangler'],
  armour: [
    'Shell',
    'Ward',
    'Mantle',
    'Carapace',
    'Veil',
    'Bulwark',
    'Husk',
    'Shelter',
    'Coat',
    'Guard',
  ],
  jewellery: [
    'Coil',
    'Loop',
    'Knot',
    'Locket',
    'Charm',
    'Band',
    'Eye',
    'Token',
    'Spiral',
    'Circle',
  ],
  belt: ['Cord', 'Clasp', 'Strap', 'Girdle', 'Binding', 'Buckle', 'Lash', 'Tether'],
  quiver: ['Nest', 'Sheaf', 'Bundle', 'Hoard', 'Stock'],
  shield: ['Wall', 'Aegis', 'Bastion', 'Rampart', 'Brace', 'Screen'],
};
