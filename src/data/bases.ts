import { mod, type DamageType, type Mod, type SkillTag } from '../mods/types';
import type { ArmourSlot, Attrs, DefenceType, ItemBase, ItemClass, WeaponClass } from './types';

/**
 * Item bases (DESIGN.md §11.2), generated from authored tables. Names and numbers are ours.
 */

type WeaponClassDef = {
  cls: WeaponClass;
  /** Base id prefix when the family shares a class with another (a rune dagger is a dagger); default the class. */
  idPrefix?: string;
  hands: 1 | 2;
  crit: number;
  aps: number;
  /** Tier-1 physical range; later tiers scale by TIER_DAMAGE. */
  min: number;
  max: number;
  range: number;
  attrs: (keyof Attrs)[];
  tags: SkillTag[];
  /** Built for spells (default: wands, sceptres and staves). Decides whether the weapon rolls spell affixes. */
  spell?: boolean;
  implicit: (tier: number) => Mod[];
  names: [string, string, string, string, string];
};

export const WEAPON_TIER_LEVELS = [1, 15, 30, 45, 60] as const;
/** Damage scales roughly ×1.9 per base tier (tunable). */
export const TIER_DAMAGE = 1.9;
/** One-handed weapons get a base-damage bonus (they give up a hand; tunable, bot-balanced). */
export const ONE_HAND_DAMAGE = 1.6;

const t = (tier: number, a: number, b: number) => Math.round(a + ((b - a) * tier) / 4);

/** The implicit of each of the five tiers of a type, as the 3.9 base of that level has it (mid-range for rolled values). */
const ELEMENTAL = ['fire', 'cold', 'lightning'] as const;
const accuracyPct = (v: number) => mod('accuracy', 'inc', v);
const accuracyFlat = (v: number) => mod('accuracy', 'base', v, { local: true });

export const WEAPON_CLASS_DEFS: WeaponClassDef[] = [
  {
    cls: 'sword',
    hands: 1,
    crit: 5,
    aps: 1.45,
    min: 4,
    max: 9,
    range: 1.3,
    attrs: ['str', 'dex'],
    tags: ['sword', 'oneHand'],
    implicit: (k) => [
      [accuracyPct(40), accuracyPct(40), accuracyFlat(190), accuracyPct(40), accuracyPct(40)][k],
    ],
    names: [
      'Notched Shortsword',
      'Bone-hilt Sword',
      'Ossuary Blade',
      'Wardsteel Sword',
      'Starmetal Sword',
    ],
  },
  {
    cls: 'axe',
    hands: 1,
    crit: 5,
    aps: 1.3,
    min: 5,
    max: 11,
    range: 1.3,
    attrs: ['str', 'dex'],
    tags: ['axe', 'oneHand'],
    implicit: () => [],
    names: [
      'Chipped Hatchet',
      'Bearded Axe',
      "Gravedigger's Axe",
      'Splitting Axe',
      'Moonsteel Axe',
    ],
  },
  {
    cls: 'mace',
    hands: 1,
    crit: 5,
    aps: 1.25,
    min: 6,
    max: 10,
    range: 1.3,
    attrs: ['str'],
    tags: ['mace', 'oneHand'],
    implicit: (k) => [mod('enemyStunThreshold', 'base', [10, 15, 15, 10, 15][k])],
    names: ['Knobbed Club', 'Flanged Mace', 'Bonecrusher Mace', 'Cinder Mace', 'Monolith Mace'],
  },
  {
    cls: 'sceptre',
    hands: 1,
    crit: 6,
    aps: 1.25,
    min: 5,
    max: 8,
    range: 1.3,
    attrs: ['str', 'int'],
    tags: ['sceptre', 'oneHand'],
    implicit: (k) => [
      mod('damage', 'inc', [10, 20, 16, 22, 40][k], { damageTypes: [...ELEMENTAL] }),
    ],
    names: [
      'Carved Rod',
      "Acolyte's Sceptre",
      'Lantern Sceptre',
      'Reliquary Sceptre',
      'Sunspoke Sceptre',
    ],
  },
  {
    cls: 'dagger',
    hands: 1,
    crit: 6.5,
    aps: 1.5,
    min: 4,
    max: 9,
    range: 1.2,
    attrs: ['dex', 'int'],
    tags: ['dagger', 'oneHand'],
    implicit: () => [mod('critChance', 'inc', 30)],
    names: ['Bone Shiv', 'Skinning Knife', 'Wavy Kris', 'Needle Dirk', 'Nightglass Dagger'],
  },
  {
    cls: 'claw',
    hands: 1,
    crit: 6.3,
    aps: 1.5,
    min: 4,
    max: 8,
    range: 1.2,
    attrs: ['dex', 'int'],
    tags: ['claw', 'oneHand'],
    implicit: (k) => [mod('lifeOnHit', 'base', [3, 8, 15, 44, 40][k], { tags: ['attack'] })],
    names: ['Bent Talon', 'Hooked Claw', 'Ghoul Claw', 'Raptor Gauntlet', 'Wyrmtooth Claw'],
  },
  {
    cls: 'wand',
    hands: 1,
    crit: 7,
    aps: 1.4,
    min: 3,
    max: 7,
    range: 1.2,
    attrs: ['int'],
    tags: ['wand', 'oneHand'],
    implicit: (k) => [mod('damage', 'inc', [10, 13, 19, 31, 35][k], { tags: ['spell'] })],
    names: ['Willow Twig', 'Knuckle Wand', 'Ember Reed', 'Glyph Wand', 'Lodestar Wand'],
  },
  {
    cls: 'sword2',
    hands: 2,
    crit: 5,
    aps: 1.35,
    min: 8,
    max: 16,
    range: 1.5,
    attrs: ['str', 'dex'],
    tags: ['sword', 'twoHand'],
    implicit: (k) => [
      [accuracyPct(40), accuracyFlat(120), accuracyPct(30), accuracyFlat(305), accuracyPct(40)][k],
    ],
    names: [
      'Rusted Greatsword',
      "Executioner's Blade",
      'Barrow Claymore',
      'Twinsteel Greatblade',
      'Dawnforged Greatsword',
    ],
  },
  {
    cls: 'axe2',
    hands: 2,
    crit: 5,
    aps: 1.25,
    min: 9,
    max: 18,
    range: 1.5,
    attrs: ['str', 'dex'],
    tags: ['axe', 'twoHand'],
    implicit: () => [],
    names: [
      "Woodcutter's Axe",
      'Broad Cleaver',
      "Headsman's Axe",
      'Crescent Greataxe',
      'Titanbone Axe',
    ],
  },
  {
    cls: 'mace2',
    hands: 2,
    crit: 5,
    aps: 1.1,
    min: 10,
    max: 19,
    range: 1.5,
    attrs: ['str'],
    tags: ['mace', 'twoHand'],
    implicit: (k) => [mod('stunDuration', 'inc', [30, 45, 30, 45, 30][k])],
    names: ['Oak Maul', 'Iron Sledge', 'Barrow Hammer', 'Grave Maul', 'Colossus Maul'],
  },
  {
    cls: 'staff',
    hands: 2,
    crit: 6.5,
    aps: 1.2,
    min: 8,
    max: 15,
    range: 1.5,
    attrs: ['str', 'int'],
    tags: ['staff', 'twoHand'],
    implicit: () => [mod('blockAttack', 'base', 18)],
    names: [
      'Walking Stick',
      'Bound Staff',
      "Pilgrim's Staff",
      'Runic Quarterstaff',
      'Starcaller Staff',
    ],
  },
  // Families inside an existing class (COVERAGE C2): they use the class's skills and slots.
  {
    cls: 'dagger',
    idPrefix: 'runedagger',
    hands: 1,
    crit: 6,
    aps: 1.3,
    min: 3,
    max: 7,
    range: 1.2,
    attrs: ['dex', 'int'],
    tags: ['dagger', 'oneHand'],
    spell: true,
    implicit: (k) => [mod('damage', 'inc', t(k, 18, 38), { tags: ['spell'] })],
    names: [
      'Etched Bone Knife',
      'Rune-cut Dirk',
      'Glyph Kris',
      'Sigil Stiletto',
      'Cairn-script Blade',
    ],
  },
  {
    cls: 'sword',
    idPrefix: 'thrust',
    hands: 1,
    crit: 5.5,
    aps: 1.55,
    min: 3,
    max: 8,
    range: 1.6,
    attrs: ['dex'],
    tags: ['sword', 'oneHand'],
    implicit: () => [mod('critMulti', 'base', 25)],
    names: ['Splinter Foil', 'Needle Rapier', 'Bone Estoc', 'Wardsteel Rapier', 'Starmetal Foil'],
  },
  {
    cls: 'staff',
    idPrefix: 'warstaff',
    hands: 2,
    crit: 6,
    aps: 1.3,
    min: 9,
    max: 17,
    range: 1.6,
    attrs: ['str', 'dex'],
    tags: ['staff', 'twoHand'],
    spell: false,
    implicit: (k) => [
      mod('blockAttack', 'base', t(k, 12, 18)),
      mod('damage', 'inc', t(k, 12, 30), { tags: ['melee'] }),
    ],
    names: [
      "Brawler's Pole",
      'Iron-shod Staff',
      "Pilgrim's Warstaff",
      'Grave-keeper Pike',
      'Colossus Warstaff',
    ],
  },
  {
    cls: 'bow',
    hands: 2,
    crit: 5.5,
    aps: 1.4,
    min: 5,
    max: 13,
    range: 9,
    attrs: ['dex'],
    tags: ['bow', 'twoHand'],
    implicit: (k) =>
      [
        [],
        [mod('critMulti', 'base', 20)],
        [mod('damage', 'inc', 22, { damageTypes: [...ELEMENTAL], tags: ['attack'] })],
        [mod('critMulti', 'base', 20)],
        [],
      ][k],
    names: ['Sapling Bow', "Hunter's Stave Bow", 'Sinew Bow', 'Gravewood Bow', 'Skyline Longbow'],
  },
];

function attrReq(level: number, attrs: (keyof Attrs)[]): Attrs {
  const full = Math.round(8 + level * 1.6);
  const each = attrs.length > 1 ? Math.round(full * 0.65) : full;
  const r: Attrs = { str: 0, dex: 0, int: 0 };
  for (const a of attrs) r[a] = each;
  return r;
}

function weaponBases(): ItemBase[] {
  const out: ItemBase[] = [];
  for (const d of WEAPON_CLASS_DEFS) {
    d.names.forEach((name, tier) => {
      const level = WEAPON_TIER_LEVELS[tier];
      const f =
        Math.pow(TIER_DAMAGE, tier) *
        (d.hands === 1 && d.cls !== 'wand' ? ONE_HAND_DAMAGE : d.cls === 'bow' ? 1.3 : 1);
      out.push({
        id: `${d.idPrefix ?? d.cls}_${tier + 1}`,
        name,
        itemClass: d.cls,
        level,
        req: attrReq(level, d.attrs),
        implicits: d.implicit(tier),
        weapon: {
          min: Math.round(d.min * f),
          max: Math.round(d.max * f),
          aps: d.aps,
          crit: d.crit,
          range: d.range,
        },
        tags: d.tags,
        hands: d.hands,
        spellWeapon: d.spell ?? (d.cls === 'wand' || d.cls === 'sceptre' || d.cls === 'staff'),
      });
    });
  }
  return out;
}

// --- Armour --------------------------------------------------------------------------------------

export const ARMOUR_TIER_LEVELS = [1, 20, 40, 60] as const;
const DEF_TYPES: DefenceType[] = ['ar', 'ev', 'es', 'arev', 'ares', 'eves'];

/** Body-armour base values per tier for a pure type (tunable). */
const BODY_AR = [24, 110, 260, 480];
const BODY_ES = [12, 45, 95, 170];
const SLOT_FRAC: Record<ArmourSlot, number> = { body: 1, helmet: 0.5, gloves: 0.35, boots: 0.35 };

const ARMOUR_NOUNS: Record<ArmourSlot, Record<DefenceType, string>> = {
  helmet: { ar: 'Helm', ev: 'Cowl', es: 'Circlet', arev: 'Visor', ares: 'Crown', eves: 'Veil' },
  gloves: {
    ar: 'Gauntlets',
    ev: 'Grips',
    es: 'Wraps',
    arev: 'Bracers',
    ares: 'Handguards',
    eves: 'Mitts',
  },
  boots: {
    ar: 'Sabatons',
    ev: 'Striders',
    es: 'Slippers',
    arev: 'Treads',
    ares: 'Sollerets',
    eves: 'Footwraps',
  },
  body: {
    ar: 'Plate',
    ev: 'Jerkin',
    es: 'Vestment',
    arev: 'Brigandine',
    ares: 'Hauberk',
    eves: 'Shroud',
  },
};
const TIER_ADJ: Record<DefenceType, [string, string, string, string]> = {
  ar: ['Dented', 'Riveted', 'Blackiron', 'Dreadsteel'],
  ev: ['Patched', 'Stitched', 'Duskhide', 'Wraithskin'],
  es: ['Threadbare', 'Embroidered', 'Moonsilk', 'Starwoven'],
  arev: ['Scuffed', 'Studded', 'Barbed', 'Warlord'],
  ares: ['Tarnished', 'Gilded', 'Sanctified', 'Hallowed'],
  eves: ['Faded', 'Shadowed', 'Gloaming', 'Eclipse'],
};

function defenceValues(type: DefenceType, frac: number, tier: number) {
  const ar = BODY_AR[tier] * frac;
  const es = BODY_ES[tier] * frac;
  const h = 0.55;
  switch (type) {
    case 'ar':
      return { armour: Math.round(ar) };
    case 'ev':
      return { evasion: Math.round(ar) };
    case 'es':
      return { es: Math.round(es) };
    case 'arev':
      return { armour: Math.round(ar * h), evasion: Math.round(ar * h) };
    case 'ares':
      return { armour: Math.round(ar * h), es: Math.round(es * h) };
    case 'eves':
      return { evasion: Math.round(ar * h), es: Math.round(es * h) };
  }
}

function defAttrs(type: DefenceType): (keyof Attrs)[] {
  return {
    ar: ['str'],
    ev: ['dex'],
    es: ['int'],
    arev: ['str', 'dex'],
    ares: ['str', 'int'],
    eves: ['dex', 'int'],
  }[type] as (keyof Attrs)[];
}

function armourBases(): ItemBase[] {
  const out: ItemBase[] = [];
  for (const slot of ['helmet', 'gloves', 'boots', 'body'] as ArmourSlot[]) {
    for (const type of DEF_TYPES) {
      for (let tier = 0; tier < 4; tier++) {
        const level = ARMOUR_TIER_LEVELS[tier];
        out.push({
          id: `${slot}_${type}_${tier + 1}`,
          name: `${TIER_ADJ[type][tier]} ${ARMOUR_NOUNS[slot][type]}`,
          itemClass: slot,
          level,
          req: attrReq(level, defAttrs(type)),
          implicits: [],
          defence: defenceValues(type, SLOT_FRAC[slot], tier),
          defenceType: type,
          tags: [],
        });
      }
    }
  }
  return out;
}

/** The implicit of each tier of a shield type, as the reference shields have it (a round shield's block recovery has no stat here). */
const SHIELD_IMPLICIT: Record<DefenceType, (tier: number) => Mod[]> = {
  ar: (k) => (k === 0 ? [] : [mod('life', 'base', [0, 20, 30, 35][k])]),
  ev: (k) => [mod('moveSpeed', 'inc', [3, 6, 6, 9][k])],
  es: (k) => [mod('damage', 'inc', [8, 12, 15, 18][k], { tags: ['spell'] })],
  arev: () => [],
  ares: (k) => [mod('resist.allEle', 'base', [4, 4, 8, 12][k])],
  eves: (k) => [mod(k % 2 === 0 ? 'dodgeAttack' : 'dodgeSpell', 'base', k < 2 ? 2 : 4)],
};

const SHIELD_NAMES: Record<DefenceType, [string, string, string, string]> = {
  ar: ['Plank Shield', 'Iron Kite', 'Bastion Shield', 'Rampart Shield'],
  ev: ['Hide Buckler', 'Ringed Buckler', 'Thornwood Buckler', 'Shadowmesh Buckler'],
  es: ['Bone Ward', 'Spirit Ward', 'Lantern Ward', 'Aurora Ward'],
  arev: ['Rawhide Roundel', 'Studded Roundel', 'Marauder Roundel', 'Warden Roundel'],
  ares: ['Votive Plate', 'Reliquary Plate', 'Cathedral Plate', 'Halo Plate'],
  eves: ['Barbed Targe', 'Spiked Targe', 'Thorned Targe', 'Briar Targe'],
};

/** Block chance of the first tier and the gain per tier. */
const SHIELD_BLOCK: Record<DefenceType, [number, number]> = {
  ar: [26, 0.6],
  ev: [22, 0.6],
  es: [20, 1],
  arev: [24, 0.6],
  ares: [23, 0.6],
  eves: [21, 0.8],
};

function shieldBases(): ItemBase[] {
  const out: ItemBase[] = [];
  for (const type of DEF_TYPES) {
    for (let tier = 0; tier < 4; tier++) {
      const level = ARMOUR_TIER_LEVELS[tier];
      const [first, step] = SHIELD_BLOCK[type];
      out.push({
        id: `shield_${type}_${tier + 1}`,
        name: SHIELD_NAMES[type][tier],
        itemClass: 'shield',
        level,
        req: attrReq(level, defAttrs(type)),
        implicits: SHIELD_IMPLICIT[type](tier),
        defence: { ...defenceValues(type, 0.6, tier), block: Math.round(first + tier * step) },
        defenceType: type,
        tags: [],
      });
    }
  }
  return out;
}

function jewelleryBases(): ItemBase[] {
  const none: Attrs = { str: 0, dex: 0, int: 0 };
  const b = (
    id: string,
    name: string,
    itemClass: ItemClass,
    level: number,
    implicits: Mod[],
  ): ItemBase => ({ id, name, itemClass, level, req: none, implicits, tags: [] });
  const flatAtk = (type: DamageType, lo: number, hi: number, tags: SkillTag[] = ['attack']) => [
    mod('damage.min', 'base', lo, { damageTypes: [type], tags }),
    mod('damage.max', 'base', hi, { damageTypes: [type], tags }),
  ];
  return [
    b('ring_mana', 'Glass Ring', 'ring', 1, [mod('mana', 'base', 20)]),
    b('ring_life', 'Heartwood Ring', 'ring', 1, [mod('life', 'base', 25)]),
    b('ring_phys', 'Spiked Ring', 'ring', 1, flatAtk('physical', 1, 4)),
    b('ring_defences', 'Bulwark Ring', 'ring', 1, [mod('globalDefences', 'inc', 8)]),
    b('ring_fire', 'Cinder Ring', 'ring', 5, [mod('resist.fire', 'base', 20)]),
    b('ring_cold', 'Rime Ring', 'ring', 5, [mod('resist.cold', 'base', 20)]),
    b('ring_light', 'Spark Ring', 'ring', 5, [mod('resist.lightning', 'base', 20)]),
    b('ring_attrs', 'Triple Band', 'ring', 12, [mod('allAttr', 'base', 10)]),
    b('ring_es', 'Veil Ring', 'ring', 20, [mod('es', 'base', 20)]),
    b('ring_crit', 'Keen Ring', 'ring', 20, [mod('critChance', 'inc', 25)]),
    b('ring_fire_cold', 'Ember-Rime Ring', 'ring', 20, [
      mod('resist.fire', 'base', 14),
      mod('resist.cold', 'base', 14),
    ]),
    b('ring_fire_light', 'Ember-Spark Ring', 'ring', 20, [
      mod('resist.fire', 'base', 14),
      mod('resist.lightning', 'base', 14),
    ]),
    b('ring_cold_light', 'Rime-Spark Ring', 'ring', 20, [
      mod('resist.cold', 'base', 14),
      mod('resist.lightning', 'base', 14),
    ]),
    b('ring_chaos', 'Mire Ring', 'ring', 30, [mod('resist.chaos', 'base', 11)]),
    b('ring_all', 'Triad Ring', 'ring', 40, [mod('resist.allEle', 'base', 10)]),
    b('ring_heavy', 'Steelbound Ring', 'ring', 80, flatAtk('physical', 3, 12)),
    b('ring_ele', 'Shard Ring', 'ring', 80, [
      mod('damage', 'inc', 20, { damageTypes: [...ELEMENTAL] }),
    ]),
    b('ring_lifepct', 'Crimson Signet', 'ring', 80, [mod('life', 'inc', 6)]),
    b('ring_manapct', 'Azure Signet', 'ring', 80, [mod('mana', 'inc', 9)]),
    b('amulet_str', 'Knucklebone Charm', 'amulet', 1, [mod('str', 'base', 20)]),
    b('amulet_dex', 'Feather Charm', 'amulet', 1, [mod('dex', 'base', 20)]),
    b('amulet_int', 'Inkstone Charm', 'amulet', 1, [mod('int', 'base', 20)]),
    b('amulet_manaregen', 'Wellspring Charm', 'amulet', 1, [mod('manaRegen', 'inc', 25)]),
    b('amulet_liferegen', 'Mending Charm', 'amulet', 1, [mod('lifeRegen', 'base', 3)]),
    b('amulet_fire', 'Ember Charm', 'amulet', 1, [mod('resist.fire', 'base', 25)]),
    b('amulet_ele', 'Spectrum Charm', 'amulet', 12, [mod('resist.allEle', 'base', 10)]),
    b('amulet_str_dex', 'Stag Charm', 'amulet', 16, [
      mod('str', 'base', 20),
      mod('dex', 'base', 20),
    ]),
    b('amulet_str_int', 'Heron Charm', 'amulet', 16, [
      mod('str', 'base', 20),
      mod('int', 'base', 20),
    ]),
    b('amulet_dex_int', 'Magpie Charm', 'amulet', 16, [
      mod('dex', 'base', 20),
      mod('int', 'base', 20),
    ]),
    b('amulet_all', 'Prism Charm', 'amulet', 30, [mod('allAttr', 'base', 12)]),
    b('amulet_liferegen_pct', 'Verdant Charm', 'amulet', 74, [mod('lifeRegenPct', 'base', 1.4)]),
    b('amulet_manaregen_high', 'Tidal Charm', 'amulet', 77, [mod('manaRegen', 'inc', 52)]),
    b('belt_phys', "Brawler's Sash", 'belt', 1, [
      mod('damage', 'inc', 18, { damageTypes: ['physical'] }),
    ]),
    b('belt_life', 'Rope Sash', 'belt', 1, [mod('life', 'base', 25)]),
    b('belt_str', 'Ironbound Belt', 'belt', 8, [mod('str', 'base', 30)]),
    b('belt_armour', 'Plated Girdle', 'belt', 10, [mod('armour', 'base', 120)]),
    b('belt_stun', 'Sturdy Wrap', 'belt', 16, [mod('stunDurationOnSelf', 'base', 20)]),
    b('belt_stunner', 'Hammerhand Belt', 'belt', 16, [mod('stunDuration', 'inc', 25)]),
    b('belt_es', 'Silk Cord', 'belt', 20, [mod('es', 'base', 20)]),
    b('belt_duelist', 'Duelist Girdle', 'belt', 78, [
      mod('armour', 'base', 290),
      mod('evasion', 'base', 290),
    ]),
    b('belt_es2', 'Prism Cord', 'belt', 79, [mod('es', 'base', 70)]),
    b('quiver_acc', 'Feathered Quiver', 'quiver', 1, [mod('accuracy', 'base', 60)]),
    b('quiver_fire', 'Cinder Quiver', 'quiver', 1, flatAtk('fire', 2, 4)),
    b('quiver_cold', 'Frostbite Quiver', 'quiver', 1, flatAtk('cold', 2, 3)),
    b('quiver_light', 'Storm Quiver', 'quiver', 1, flatAtk('lightning', 1, 5)),
    b('quiver_accpct', 'Hawk Quiver', 'quiver', 4, [mod('accuracy', 'inc', 25)]),
    b('quiver_attack', 'Thorned Quiver', 'quiver', 5, flatAtk('physical', 1, 4)),
    b('quiver_hit', "Hunter's Quiver", 'quiver', 10, [
      mod('lifeOnHit', 'base', 3, { tags: ['attack'] }),
    ]),
    b('quiver_dex', 'Falconer Quiver', 'quiver', 12, [mod('dex', 'base', 35)]),
    b('quiver_stun', 'Blunted Quiver', 'quiver', 16, [mod('stunDuration', 'inc', 30)]),
    b('quiver_phys', 'Barbed Quiver', 'quiver', 20, flatAtk('physical', 1, 4, ['attack', 'bow'])),
    b('quiver_fire_bow', 'Pyre Quiver', 'quiver', 22, flatAtk('fire', 4, 8, ['attack', 'bow'])),
    b(
      'quiver_phys_bow',
      'Sundering Quiver',
      'quiver',
      28,
      flatAtk('physical', 6, 12, ['attack', 'bow']),
    ),
    b('quiver_pierce', 'Skewering Quiver', 'quiver', 36, [mod('pierce', 'base', 1)]),
    b('quiver_crit', 'Stormwatch Quiver', 'quiver', 45, [mod('critChance', 'inc', 25)]),
  ];
}

/** Bases only uniques use. */
function uniqueBases(): ItemBase[] {
  return [
    {
      id: 'body_rags',
      name: 'Grave Rags',
      itemClass: 'body',
      level: 1,
      req: { str: 0, dex: 0, int: 0 },
      implicits: [],
      tags: [],
      uniqueOnly: true,
    },
  ];
}

export const ITEM_BASES: ItemBase[] = [
  ...weaponBases(),
  ...armourBases(),
  ...shieldBases(),
  ...jewelleryBases(),
  ...uniqueBases(),
];

const BASE_BY_ID = new Map(ITEM_BASES.map((b) => [b.id, b]));

export function itemBase(id: string): ItemBase {
  const b = BASE_BY_ID.get(id);
  if (!b) throw new Error(`unknown item base ${id}`);
  return b;
}

/** What a weapon of each class is called on its card: the type that skills ask for ("needs a bow", "a sword or a dagger"). */
export const WEAPON_TYPE_NAME: Record<WeaponClass, string> = {
  sword: 'One-Handed Sword',
  axe: 'One-Handed Axe',
  mace: 'One-Handed Mace',
  sceptre: 'Sceptre',
  dagger: 'Dagger',
  claw: 'Claw',
  wand: 'Wand',
  sword2: 'Two-Handed Sword',
  axe2: 'Two-Handed Axe',
  mace2: 'Two-Handed Mace',
  staff: 'Staff',
  bow: 'Bow',
};

export function isWeaponClass(c: ItemClass): c is WeaponClass {
  return WEAPON_CLASS_DEFS.some((d) => d.cls === c);
}
