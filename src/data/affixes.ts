import type { DamageType, Mod, ModKind, SkillTag } from '../mods/types';
import * as W from './weaponTables';
import type { TierTable } from './weaponTables';

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
  | 'es';

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
  /** Base weight multiplier (default 1). */
  weight?: number;
  /** Weight multiplier on items with a tag (the first tag the item has): a family rarer on weapons than on armour. */
  weights?: Partial<Record<SlotTag, number>>;
};

export type Tier = { tier: number; minIlvl: number; weight: number; ranges: [number, number][] };
export type Family = FamilyDef & { tiers: Tier[] };

const ARMOUR: SlotTag[] = ['armourPiece'];
const JEWEL: SlotTag[] = ['ring', 'amulet'];
const ATTACK_JEWEL: SlotTag[] = ['ring', 'amulet', 'gloves', 'quiver'];
const CASTER: SlotTag[] = ['casterWeapon'];
const ELE: DamageType[] = ['fire', 'cold', 'lightning'];

const T9 = [1, 8, 16, 25, 34, 44, 54, 66, 80];
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

/** A family whose tiers are written out: its item levels and the first and last values of each mod come from the table. */
const tabled = (
  table: TierTable,
  mods: Omit<ModTemplate, 'first' | 'last'>[],
): Pick<FamilyDef, 'ilvls' | 'mods' | 'table'> => {
  const first = table[0].slice(1) as [number, number][];
  const last = table[table.length - 1].slice(1) as [number, number][];
  return {
    ilvls: table.map((r) => r[0]),
    table,
    mods: mods.map((m, i) => ({ ...m, first: first[i], last: last[i] })),
  };
};

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

export const FAMILY_DEFS: FamilyDef[] = [
  // ---- Prefixes --------------------------------------------------------------------------
  {
    id: 'life',
    type: 'prefix',
    slots: [...ARMOUR, ...JEWEL, 'belt'],
    ilvls: T9,
    mods: [g('life', 'base', [5, 12], [95, 110])],
    names: ['Sinewed', 'Marrowed', 'Gravehale'],
    weight: 1.5,
  },
  {
    id: 'mana',
    type: 'prefix',
    slots: [...JEWEL, 'belt', 'helmet', 'gloves', 'boots', 'casterWeapon', 'claw', 'dagger'],
    ilvls: T8,
    mods: [g('mana', 'base', [8, 15], [70, 80])],
    names: ['Inked', 'Wellspring', 'Deepwell'],
  },
  {
    id: 'esGlobal',
    type: 'prefix',
    slots: [...JEWEL, 'belt'],
    ilvls: T6,
    mods: [g('es', 'base', [3, 6], [38, 46])],
    names: ['Shimmering', 'Haloed', 'Aureate'],
  },
  {
    id: 'esLocal',
    type: 'prefix',
    slots: ARMOUR,
    requires: ['es'],
    ilvls: T8,
    mods: [local('es', 'base', [3, 6], [60, 75])],
    names: ['Glimmering', 'Warded', 'Radiant'],
  },
  {
    id: 'armourLocal',
    type: 'prefix',
    slots: ARMOUR,
    requires: ['ar'],
    ilvls: T8,
    mods: [local('armour', 'base', [6, 12], [260, 320])],
    names: ['Riveted', 'Bolted', 'Bastioned'],
  },
  {
    id: 'evasionLocal',
    type: 'prefix',
    slots: ARMOUR,
    requires: ['ev'],
    ilvls: T8,
    mods: [local('evasion', 'base', [6, 12], [260, 320])],
    names: ['Supple', 'Fleeting', 'Wraithlike'],
  },
  {
    id: 'incArmour',
    type: 'prefix',
    slots: ARMOUR,
    requires: ['ar'],
    ilvls: T7,
    mods: [local('armour', 'inc', [10, 18], [92, 110])],
    names: ['Plated', 'Ironclad', 'Immovable'],
  },
  {
    id: 'incEvasion',
    type: 'prefix',
    slots: ARMOUR,
    requires: ['ev'],
    ilvls: T7,
    mods: [local('evasion', 'inc', [10, 18], [92, 110])],
    names: ['Lithe', 'Mistborne', 'Phantom'],
  },
  {
    id: 'incEs',
    type: 'prefix',
    slots: ARMOUR,
    requires: ['es'],
    ilvls: T7,
    mods: [local('es', 'inc', [10, 18], [92, 110])],
    names: ['Humming', 'Thrumming', 'Resonant'],
  },
  {
    id: 'incArEv',
    type: 'prefix',
    slots: ARMOUR,
    requires: ['ar', 'ev'],
    ilvls: T6,
    mods: [local('armour', 'inc', [10, 16], [80, 95]), local('evasion', 'inc', [10, 16], [80, 95])],
    names: ['Scaled', 'Brigand', 'Warlord'],
  },
  {
    id: 'incArEs',
    type: 'prefix',
    slots: ARMOUR,
    requires: ['ar', 'es'],
    ilvls: T6,
    mods: [local('armour', 'inc', [10, 16], [80, 95]), local('es', 'inc', [10, 16], [80, 95])],
    names: ['Blessed', 'Consecrated', 'Hallowed'],
  },
  {
    id: 'incEvEs',
    type: 'prefix',
    slots: ARMOUR,
    requires: ['ev', 'es'],
    ilvls: T6,
    mods: [local('evasion', 'inc', [10, 16], [80, 95]), local('es', 'inc', [10, 16], [80, 95])],
    names: ['Dusky', 'Gloaming', 'Eclipsed'],
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
    id: 'addPhysAttacks',
    type: 'prefix',
    slots: ATTACK_JEWEL,
    ilvls: T6,
    mods: added('physical', [1, 8], [2, 14], { tags: ['attack'] }),
    names: ['Gritty', 'Jagged', 'Rending'],
  },
  {
    id: 'addFireAttacks',
    type: 'prefix',
    slots: ATTACK_JEWEL,
    ilvls: T6,
    mods: added('fire', [1, 16], [3, 30], { tags: ['attack'] }),
    names: ['Warm', 'Scorching', 'Cindered'],
  },
  {
    id: 'addColdAttacks',
    type: 'prefix',
    slots: ATTACK_JEWEL,
    ilvls: T6,
    mods: added('cold', [1, 14], [3, 26], { tags: ['attack'] }),
    names: ['Nippy', 'Bitter', 'Hoarfrost'],
  },
  {
    id: 'addLightAttacks',
    type: 'prefix',
    slots: ATTACK_JEWEL,
    ilvls: T6,
    mods: added('lightning', [1, 3], [5, 55], { tags: ['attack'] }),
    names: ['Static', 'Sparking', 'Thundering'],
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
    id: 'spellDamage',
    type: 'prefix',
    slots: ['amulet'],
    ilvls: T8,
    mods: [g('damage', 'inc', [8, 12], [75, 89], { tags: ['spell'] })],
    names: ['Chanting', 'Incanting', 'Archmage'],
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
    slots: [...ATTACK_JEWEL, 'weapon'],
    ilvls: T6,
    mods: [g('damage', 'inc', [5, 10], [35, 42], { damageTypes: ELE, tags: ['attack'] })],
    names: ['Charged', 'Elemental', 'Prismatic'],
    weights: { weapon: 0.3 },
  },
  {
    id: 'lifeLeech',
    type: 'prefix',
    slots: ATTACK_JEWEL,
    ilvls: T4,
    mods: [g('leech.life', 'base', [0.2, 0.4], [0.8, 1.0], { tags: ['attack'], dec: 1 })],
    names: ['Thirsting', 'Vampiric', 'Exsanguinating'],
  },
  {
    id: 'gemLevel',
    type: 'prefix',
    slots: ['helmet', 'body'],
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
    slots: [...ARMOUR, ...JEWEL, 'belt', 'weapon'],
    ilvls: T8,
    mods: [g('resist.fire', 'base', [6, 11], [44, 48])],
    names: ['of Embers', 'of the Kiln', 'of the Pyre'],
    weight: 1.4,
    weights: { weapon: 0.35 },
  },
  {
    id: 'coldRes',
    type: 'suffix',
    slots: [...ARMOUR, ...JEWEL, 'belt', 'weapon'],
    ilvls: T8,
    mods: [g('resist.cold', 'base', [6, 11], [44, 48])],
    names: ['of Wool', 'of the Thaw', 'of the Hearth'],
    weight: 1.4,
    weights: { weapon: 0.35 },
  },
  {
    id: 'lightRes',
    type: 'suffix',
    slots: [...ARMOUR, ...JEWEL, 'belt', 'weapon'],
    ilvls: T8,
    mods: [g('resist.lightning', 'base', [6, 11], [44, 48])],
    names: ['of Grounding', 'of the Rod', 'of the Lodestone'],
    weight: 1.4,
    weights: { weapon: 0.35 },
  },
  {
    id: 'allRes',
    type: 'suffix',
    slots: [...JEWEL, 'shield'],
    ilvls: T5,
    mods: [g('resist.allEle', 'base', [3, 5], [15, 18])],
    names: ['of Balance', 'of the Prism', 'of the Spectrum'],
  },
  {
    id: 'chaosRes',
    type: 'suffix',
    slots: [...ARMOUR, ...JEWEL, 'belt', 'weapon'],
    ilvls: T6,
    mods: [g('resist.chaos', 'base', [5, 10], [31, 35])],
    names: ['of Antidotes', 'of Purging', 'of the Clean Grave'],
    weight: 0.6,
    weights: { weapon: 0.5 },
  },
  {
    id: 'str',
    type: 'suffix',
    slots: ['sword', 'axe', 'mace', 'sceptre', 'staff', ...ARMOUR, ...JEWEL, 'belt'],
    ilvls: T8,
    mods: [g('str', 'base', [8, 12], [51, 55])],
    names: ['of the Ox', 'of the Boulder', 'of the Mountain'],
  },
  {
    id: 'dex',
    type: 'suffix',
    slots: ['sword', 'axe', 'claw', 'dagger', 'bow', ...ARMOUR, ...JEWEL, 'quiver'],
    ilvls: T8,
    mods: [g('dex', 'base', [8, 12], [51, 55])],
    names: ['of the Hare', 'of the Lynx', 'of the Falcon'],
  },
  {
    id: 'int',
    type: 'suffix',
    slots: ['wand', 'dagger', 'claw', 'staff', 'sceptre', ...ARMOUR, ...JEWEL],
    ilvls: T8,
    mods: [g('int', 'base', [8, 12], [51, 55])],
    names: ['of the Owl', 'of the Archive', 'of the Oracle'],
  },
  {
    id: 'allAttr',
    type: 'suffix',
    slots: JEWEL,
    ilvls: T5,
    mods: [g('allAttr', 'base', [1, 4], [21, 24])],
    names: ['of the Wanderer', 'of the Pilgrim', 'of the Saint'],
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
    id: 'aspdGlobal',
    type: 'suffix',
    slots: ['gloves', 'quiver', 'ring'],
    ilvls: T4,
    mods: [g('attackSpeed', 'inc', [5, 7], [14, 16])],
    names: ['of Haste', 'of Alacrity', 'of the Gale'],
  },
  {
    id: 'castSpeed',
    type: 'suffix',
    slots: ['amulet', 'ring'],
    ilvls: T6,
    mods: [g('castSpeed', 'inc', [5, 8], [26, 29])],
    names: ['of Talent', 'of Mastery', 'of Sorcery'],
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
    id: 'critGlobal',
    type: 'suffix',
    slots: ['amulet', 'quiver', 'helmet', 'ring'],
    ilvls: T6,
    mods: [g('critChance', 'inc', [10, 14], [35, 38])],
    names: ['of Menace', 'of Malice', 'of Cruelty'],
  },
  {
    id: 'critMulti',
    type: 'suffix',
    slots: ['weapon', 'amulet', 'quiver'],
    ilvls: T6,
    mods: [g('critMulti', 'base', [8, 12], [35, 38])],
    names: ['of Ire', 'of Fury', 'of Butchery'],
  },
  {
    id: 'accuracy',
    type: 'suffix',
    slots: ['helmet', 'gloves', 'ring', 'quiver'],
    ilvls: T8,
    mods: [g('accuracy', 'base', [10, 30], [380, 450])],
    names: ['of Calm', 'of Focus', 'of the Hawkeye'],
  },
  {
    id: 'lifeRegen',
    type: 'suffix',
    slots: [...ARMOUR, ...JEWEL, 'belt'],
    ilvls: T7,
    mods: [g('lifeRegen', 'base', [1, 2], [26, 32], { dec: 1 })],
    names: ['of Mending', 'of Renewal', 'of the Phoenix'],
  },
  {
    id: 'manaRegen',
    type: 'suffix',
    slots: [...JEWEL, ...CASTER, 'claw', 'dagger', 'shield'],
    ilvls: T6,
    mods: [g('manaRegen', 'inc', [10, 19], [60, 69])],
    names: ['of Excitement', 'of Zeal', 'of Euphoria'],
  },
  {
    id: 'lifeOnHit',
    type: 'suffix',
    slots: ['gloves', 'ring', 'weapon', 'quiver'],
    ilvls: T5,
    mods: [g('lifeOnHit', 'base', [1, 2], [8, 10], { tags: ['attack'] })],
    names: ['of Feeding', 'of Gorging', 'of the Glutton'],
  },
  {
    id: 'moveSpeed',
    type: 'suffix',
    slots: ['boots'],
    ilvls: [1, 15, 30, 45, 60],
    mods: [g('moveSpeed', 'inc', [8, 10], [28, 30])],
    names: ['of the Courier', 'of the Hare', 'of the Comet'],
    weight: 1.5,
  },
  {
    id: 'block',
    type: 'suffix',
    slots: ['shield'],
    ilvls: T5,
    mods: [g('blockAttack', 'base', [1, 2], [8, 9])],
    names: ['of the Wall', 'of the Rampart', 'of the Citadel'],
  },
  {
    id: 'igniteChance',
    type: 'suffix',
    slots: ['gloves'],
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
    slots: ['gloves'],
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
    slots: ['gloves'],
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
    slots: ['gloves'],
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
    slots: ['gloves'],
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
    slots: ['amulet'],
    ilvls: [30, 55, 78],
    mods: [g('reducedReservation', 'base', [4, 6], [10, 12])],
    names: ['of Restraint', 'of Restraint', 'of Serenity'],
    rareOnly: true,
    weight: 0.5,
  },
  {
    id: 'addChaosAttacks',
    type: 'prefix',
    slots: ATTACK_JEWEL,
    ilvls: T6,
    mods: added('chaos', [1, 12], [3, 22], { tags: ['attack'] }),
    names: ['Tainted', 'Befouled', 'Rotted'],
    weight: 0.6,
  },
  {
    id: 'auraEffect',
    type: 'suffix',
    slots: ['amulet', 'belt'],
    ilvls: [30, 55, 78],
    mods: [g('auraEffect', 'inc', [4, 6], [10, 14])],
    names: ['of Radiance', 'of Radiance', 'of the Beacon'],
    rareOnly: true,
    weight: 0.5,
  },
  {
    id: 'areaEffect',
    type: 'suffix',
    slots: ['gloves', 'amulet', 'belt'],
    ilvls: T5,
    mods: [g('aoe', 'inc', [5, 8], [16, 22])],
    names: ['of Reach', 'of Sweep', 'of Breadth'],
    weight: 0.6,
  },
  {
    id: 'stunDuration',
    type: 'suffix',
    slots: ['weapon', 'gloves'],
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
    id: 'stunAvoid',
    type: 'suffix',
    slots: ['body', 'boots', 'belt'],
    ilvls: T5,
    mods: [g('stunAvoid', 'base', [8, 12], [30, 35])],
    names: ['of Footing', 'of Steadiness', 'of the Anchor'],
    weight: 0.7,
  },
  {
    id: 'stunThreshold',
    type: 'suffix',
    slots: ['belt', 'body'],
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
    value: values[i],
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
