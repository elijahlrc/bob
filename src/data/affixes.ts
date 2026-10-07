import type { DamageType, Mod, ModKind, SkillTag } from '../mods/types';

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
  /** Minimum item level of each tier (its length is the tier count). */
  ilvls: number[];
  mods: ModTemplate[];
  /** Magic-item names from weakest to strongest tier group. */
  names: [string, string, string];
  rareOnly?: boolean;
  /** Base weight multiplier (default 1). */
  weight?: number;
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
    slots: [...JEWEL, 'belt', 'helmet', 'gloves', 'boots', 'casterWeapon'],
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
    weight: 1.3,
  },
  {
    id: 'addPhysLocal',
    type: 'prefix',
    slots: ['weapon'],
    ilvls: T8,
    mods: added('physical', [1, 22], [3, 40], { local: true }),
    names: ['Weighted', 'Brutal', 'Ruinous'],
  },
  {
    id: 'addFireLocal',
    type: 'prefix',
    slots: ['weapon'],
    ilvls: T8,
    mods: added('fire', [1, 50], [4, 95], { local: true }),
    names: ['Smouldering', 'Blazing', 'Infernal'],
  },
  {
    id: 'addColdLocal',
    type: 'prefix',
    slots: ['weapon'],
    ilvls: T8,
    mods: added('cold', [1, 45], [4, 85], { local: true }),
    names: ['Chilled', 'Frostbitten', 'Glacial'],
  },
  {
    id: 'addLightLocal',
    type: 'prefix',
    slots: ['weapon'],
    ilvls: T8,
    mods: added('lightning', [1, 8], [6, 170], { local: true }),
    names: ['Crackling', 'Arcing', 'Tempestuous'],
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
    ilvls: T7,
    mods: added('fire', [1, 28], [3, 52], { tags: ['spell'] }),
    names: ['Kindled', 'Pyric', 'Volcanic'],
  },
  {
    id: 'addColdSpells',
    type: 'prefix',
    slots: CASTER,
    ilvls: T7,
    mods: added('cold', [1, 24], [3, 46], { tags: ['spell'] }),
    names: ['Frigid', 'Rimed', 'Polar'],
  },
  {
    id: 'addLightSpells',
    type: 'prefix',
    slots: CASTER,
    ilvls: T7,
    mods: added('lightning', [1, 5], [6, 96], { tags: ['spell'] }),
    names: ['Humming', 'Galvanic', 'Stormwrought'],
  },
  {
    id: 'spellDamage',
    type: 'prefix',
    slots: [...CASTER, 'amulet'],
    ilvls: T8,
    mods: [g('damage', 'inc', [8, 12], [75, 89], { tags: ['spell'] })],
    names: ['Chanting', 'Incanting', 'Archmage'],
  },
  {
    id: 'eleAttacks',
    type: 'prefix',
    slots: [...ATTACK_JEWEL, 'weapon'],
    ilvls: T6,
    mods: [g('damage', 'inc', [5, 10], [35, 42], { damageTypes: ELE, tags: ['attack'] })],
    names: ['Charged', 'Elemental', 'Prismatic'],
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
    slots: ['helmet', 'body', 'twoHand'],
    ilvls: [60, 75],
    mods: [local('socketedGemLevel', 'base', [1, 1], [2, 2])],
    names: ['Resonating', 'Resonating', 'Choral'],
    rareOnly: true,
    weight: 0.4,
  },
  // ---- Suffixes --------------------------------------------------------------------------
  {
    id: 'fireRes',
    type: 'suffix',
    slots: [...ARMOUR, ...JEWEL, 'belt'],
    ilvls: T8,
    mods: [g('resist.fire', 'base', [6, 11], [44, 48])],
    names: ['of Embers', 'of the Kiln', 'of the Pyre'],
    weight: 1.4,
  },
  {
    id: 'coldRes',
    type: 'suffix',
    slots: [...ARMOUR, ...JEWEL, 'belt'],
    ilvls: T8,
    mods: [g('resist.cold', 'base', [6, 11], [44, 48])],
    names: ['of Wool', 'of the Thaw', 'of the Hearth'],
    weight: 1.4,
  },
  {
    id: 'lightRes',
    type: 'suffix',
    slots: [...ARMOUR, ...JEWEL, 'belt'],
    ilvls: T8,
    mods: [g('resist.lightning', 'base', [6, 11], [44, 48])],
    names: ['of Grounding', 'of the Rod', 'of the Lodestone'],
    weight: 1.4,
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
    slots: [...ARMOUR, ...JEWEL, 'belt'],
    ilvls: T6,
    mods: [g('resist.chaos', 'base', [5, 10], [31, 35])],
    names: ['of Antidotes', 'of Purging', 'of the Clean Grave'],
    weight: 0.6,
  },
  {
    id: 'str',
    type: 'suffix',
    slots: ['weapon', ...ARMOUR, ...JEWEL, 'belt'],
    ilvls: T8,
    mods: [g('str', 'base', [8, 12], [51, 55])],
    names: ['of the Ox', 'of the Boulder', 'of the Mountain'],
  },
  {
    id: 'dex',
    type: 'suffix',
    slots: ['weapon', ...ARMOUR, ...JEWEL, 'quiver'],
    ilvls: T8,
    mods: [g('dex', 'base', [8, 12], [51, 55])],
    names: ['of the Hare', 'of the Lynx', 'of the Falcon'],
  },
  {
    id: 'int',
    type: 'suffix',
    slots: ['weapon', ...ARMOUR, ...JEWEL],
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
    ilvls: T7,
    mods: [local('attackSpeed', 'inc', [5, 7], [24, 27])],
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
    slots: [...CASTER, 'amulet', 'ring'],
    ilvls: T6,
    mods: [g('castSpeed', 'inc', [5, 8], [26, 29])],
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
    slots: ['helmet', 'gloves', 'ring', 'quiver', 'weapon'],
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
    slots: [...JEWEL, ...CASTER, 'shield'],
    ilvls: T6,
    mods: [g('manaRegen', 'inc', [10, 19], [60, 69])],
    names: ['of Excitement', 'of Zeal', 'of Euphoria'],
  },
  {
    id: 'lifeOnHit',
    type: 'suffix',
    slots: ['gloves', 'ring', 'weapon', 'quiver'],
    ilvls: T5,
    mods: [g('lifeOnHit', 'base', [1, 2], [8, 10])],
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
    slots: ['weapon', 'gloves'],
    ilvls: T4,
    mods: [g('chance.ignite', 'base', [5, 8], [20, 25])],
    names: ['of Kindling', 'of Arson', 'of the Inferno'],
    weight: 0.7,
  },
  {
    id: 'bleedChance',
    type: 'suffix',
    slots: ['weapon', 'gloves'],
    ilvls: T4,
    mods: [g('chance.bleed', 'base', [5, 8], [20, 25])],
    names: ['of Nicking', 'of Lacerations', 'of the Abattoir'],
    weight: 0.7,
  },
  {
    id: 'poisonChance',
    type: 'suffix',
    slots: ['weapon', 'gloves'],
    ilvls: T4,
    mods: [g('chance.poison', 'base', [5, 8], [20, 25])],
    names: ['of Venom', 'of Blight', 'of the Viper'],
    weight: 0.7,
  },
  {
    id: 'shockChance',
    type: 'suffix',
    slots: ['weapon', 'gloves'],
    ilvls: T4,
    mods: [g('chance.shock', 'base', [5, 8], [20, 25])],
    names: ['of Static', 'of Thunderheads', 'of the Tempest'],
    weight: 0.7,
  },
  {
    id: 'freezeChance',
    type: 'suffix',
    slots: ['weapon', 'gloves'],
    ilvls: T4,
    mods: [g('chance.freeze', 'base', [5, 8], [20, 25])],
    names: ['of Rime', 'of Whiteout', 'of the Glacier'],
    weight: 0.7,
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
    slots: ['weapon', 'gloves', 'amulet', 'belt'],
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
    slots: ['weapon'],
    ilvls: T4,
    mods: [g('enemyStunThreshold', 'base', [5, 7], [14, 15])],
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
];

function round(v: number, dec = 0): number {
  const f = Math.pow(10, dec);
  return Math.round(v * f) / f;
}

/** Expand a family definition into tiers. Values interpolate geometrically between first and last. */
export function expandFamily(def: FamilyDef): Family {
  const n = def.ilvls.length;
  const tiers: Tier[] = def.ilvls.map((minIlvl, i) => {
    const t = n > 1 ? i / (n - 1) : 1;
    const ranges = def.mods.map((m): [number, number] => {
      const lerp = (a: number, b: number) =>
        a > 0 && b > 0 ? a * Math.pow(b / a, t) : a + (b - a) * t;
      let lo = round(lerp(m.first[0], m.last[0]), m.dec);
      let hi = round(lerp(m.first[1], m.last[1]), m.dec);
      if (hi < lo) [lo, hi] = [hi, lo];
      return [lo, hi];
    });
    // Higher tiers are rarer.
    const weight = Math.round((1000 * (def.weight ?? 1) * (n - i * 0.6)) / n);
    return { tier: i + 1, minIlvl, weight, ranges };
  });
  return { ...def, tiers };
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
