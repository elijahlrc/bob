import type { UniqueDef, UniqueMod } from './uniques';

/**
 * Wave 1 of the depth expansion (EXPANSION 6.4): uniques that change a rule, built on the engine
 * verbs of X2. Every name, flavour line and number is ours; the reference-game item each one is
 * modelled on is named in docs/EXPANSION.md only. Values are _tunable_.
 */

const m = (
  stat: string,
  kind: UniqueMod['kind'],
  min: number,
  max = min,
  extra: Partial<UniqueMod> = {},
): UniqueMod => ({ stat, kind, min, max, ...extra });
const L = { local: true };
const flag = (stat: string) => m(stat, 'flag', 1);
const ATTACK = ['attack' as const];

export const WAVE1_UNIQUES: UniqueDef[] = [
  {
    id: 'walledHeart',
    name: 'The Walled Heart',
    baseId: 'body_ar_3',
    level: 48,
    sockets: 0,
    mods: [m('life', 'base', 300, 380), m('damage', 'inc', 20, 30, { damageTypes: ['fire'] })],
    factions: ['reliquary'],
    notes: {
      pairsWith: ['a six-socket two-hander or helmet to carry the main skill', 'Socket Augers'],
      weakAgainst: ['builds that keep their main skill on the body armour'],
    },
    flavour: 'It beats once a year, and the whole vault shakes.',
  },
  {
    id: 'gravediggersSmock',
    name: "Gravedigger's Smock",
    baseId: 'body_rags',
    level: 3,
    sockets: 6,
    mods: [],
    factions: ['ossuary'],
    notes: {
      pairsWith: ['any leveling build that wants a full link early', 'a flask-heavy defence'],
      weakAgainst: ['everything that hits hard: it gives no defence at all'],
    },
    flavour: 'Nothing to stitch, nothing to hold. Only room for the work.',
  },
  {
    id: 'embalmersWraps',
    name: "Embalmer's Wraps",
    baseId: 'body_es_3',
    level: 45,
    mods: [
      flag('chaosNotBypassEs'),
      m('es', 'inc', 100, 140, L),
      m('resist.lightning', 'base', 20, 30),
    ],
    factions: ['rot'],
    notes: {
      pairsWith: ['Hollow Vessel-style low-life builds', 'large energy shield pools'],
      weakAgainst: ['builds without energy shield, which gain nothing'],
    },
    flavour: 'The salt keeps the rot out of the cloth. The rot disagrees.',
  },
  {
    id: 'thunderwireHauberk',
    name: 'Thunderwire Hauberk',
    baseId: 'body_arev_3',
    level: 42,
    mods: [
      m('physTakenAs.lightning', 'base', 30, 50),
      m('life', 'base', 50, 70),
      m('maxResist.lightning', 'base', -15),
    ],
    factions: ['reliquary'],
    notes: {
      pairsWith: [
        'lightning resistance gear and flasks',
        'armour, which still helps against what remains',
      ],
      weakAgainst: ['lightning-leaning maps while lightning resistance is low'],
    },
    flavour: 'Every link hums. Every blow arrives as lightning.',
  },
  {
    id: 'steadfastCassock',
    name: 'The Steadfast Cassock',
    baseId: 'body_eves_2',
    level: 30,
    mods: [
      flag('grantsKeystone.mindBulwark'),
      m('mana', 'base', 60, 80),
      m('manaRegen', 'inc', 30, 40),
    ],
    factions: ['hollow'],
    notes: {
      pairsWith: ['mana regeneration and leech', 'Clear Mind-style cost reduction'],
      weakAgainst: [
        'mana-draining enemies (Hollow wisps), which reach your life through your mana',
      ],
    },
    flavour: 'It is vowed to patience. What gets through is paid for in thought.',
  },
  {
    id: 'spellswornCirclet',
    name: 'Spellsworn Circlet',
    baseId: 'helmet_es_2',
    level: 30,
    mods: [flag('spellIncAppliesToAttacks'), m('es', 'base', 40, 60, L)],
    factions: ['hollow'],
    notes: {
      pairsWith: [
        'tree notables that raise spell damage',
        'a staff or sceptre with spell implicits',
      ],
      weakAgainst: ['builds that take no spell damage: the circlet then does nothing'],
    },
    flavour: 'It swore the vow of the caster, and the sword heard it too.',
  },
  {
    id: 'bareVisor',
    name: 'The Bare Visor',
    baseId: 'helmet_ar_3',
    level: 46,
    mods: [
      m('damage.min', 'base', 12, 18, { damageTypes: ['physical'], tags: ATTACK }),
      m('damage.max', 'base', 26, 34, { damageTypes: ['physical'], tags: ATTACK }),
      m('critMulti', 'base', 60, 80),
      m('damageTaken.physical', 'more', 40, 50),
    ],
    factions: ['ossuary'],
    notes: {
      pairsWith: ['crit notables', 'fast attacks that multiply the added damage'],
      weakAgainst: ['physical hitters: Brutes, Sentinels and anything that is not elemental'],
    },
    flavour: 'No ornament, no hinge, no mercy. It shows you the way to the blow.',
  },
  {
    id: 'cantorsHood',
    name: "Cantor's Hood",
    baseId: 'helmet_eves_2',
    level: 28,
    mods: [
      m('socketedGemLevel', 'base', 2, 2, { tags: ['aura'] }),
      flag('cannotBeFrozen'),
      m('reducedReservation', 'base', 8),
    ],
    factions: ['choir'],
    notes: {
      pairsWith: ['two or three aura gems socketed in the hood', 'reservation-reduction notables'],
      weakAgainst: ['builds that need the hood sockets for supports'],
    },
    flavour: 'A choir of one, and all the harmonies at once.',
  },
  {
    id: 'knuckleboneBindings',
    name: 'Knucklebone Bindings',
    baseId: 'gloves_ev_1',
    level: 12,
    mods: [
      m('damage', 'more', 500, 700, { damageTypes: ['physical'], tags: ['attack', 'unarmed'] }),
      m('critMulti', 'base', 20, 30),
    ],
    factions: ['ossuary'],
    notes: {
      pairsWith: ['attack speed and crit notables', 'life leech'],
      weakAgainst: [
        'any weapon at all: it works only bare-handed, so weapon mods and sockets are lost',
      ],
    },
    flavour: 'Wound tight around the hand, they teach the fist what it was for.',
  },
  {
    id: 'rimeclaspGloves',
    name: 'Rimeclasp Gloves',
    baseId: 'gloves_arev_2',
    level: 22,
    mods: [m('convert.physical.cold', 'base', 100), m('resist.cold', 'base', 20, 30)],
    notes: {
      pairsWith: [
        'cold damage and freeze notables',
        'Ember Infusion-style support to add a second element',
      ],
      weakAgainst: ['cold-immune enemies, and bleeding, which needs physical damage'],
    },
    flavour: 'The frost grips from the inside out.',
  },
  {
    id: 'bloodquickGauntlets',
    name: 'Bloodquick Gauntlets',
    baseId: 'gloves_ar_3',
    level: 40,
    mods: [
      flag('instantLeechOnCrit'),
      m('leech.life', 'base', 2, 2, { damageTypes: ['physical'], tags: ATTACK }),
      m('critChance', 'inc', 30, 40),
    ],
    notes: {
      pairsWith: ['crit chance and multiplier gear', 'fast attacks'],
      weakAgainst: ['monsters that cannot be leeched from'],
    },
    flavour: 'They drink before the wound has finished opening.',
  },
  {
    id: 'meteoriteEdge',
    name: 'Meteorite Edge',
    baseId: 'sword2_4',
    level: 52,
    mods: [
      m('damage', 'inc', 300, 380, { damageTypes: ['physical'], local: true }),
      flag('canShock.physical'),
      flag('noElementalDamage'),
      m('aoe', 'inc', 20),
    ],
    factions: ['reliquary'],
    notes: {
      pairsWith: ['shock effect and shock-chance gear', 'area notables'],
      weakAgainst: ['elemental auras, supports and conversion, which add nothing'],
    },
    flavour: 'It fell from a clear sky and kept falling.',
  },
  {
    id: 'unblinkingLongbow',
    name: 'Unblinking Longbow',
    baseId: 'bow_2',
    level: 24,
    mods: [
      flag('alwaysHit'),
      m('damage', 'inc', 150, 200, { damageTypes: ['physical'], local: true }),
    ],
    factions: ['ossuary'],
    notes: {
      pairsWith: ['accuracy-free builds', 'Hollow and other evasive enemies'],
      weakAgainst: ['crit builds: the bow is slow and carries no crit bonus'],
    },
    flavour: 'Its string never closes its eye.',
  },
  {
    id: 'thousandRibs',
    name: 'The Thousand Ribs',
    baseId: 'bow_4',
    level: 56,
    mods: [
      m('projectiles', 'base', 4, 4, { tags: ['attack', 'projectile'] }),
      m('damage', 'inc', 100, 140, { damageTypes: ['physical'], local: true }),
    ],
    factions: ['swarm'],
    notes: {
      pairsWith: ['pierce and area notables', 'Swarm and other many-small-enemy rooms'],
      weakAgainst: ['single targets: extra arrows add coverage, not damage on one enemy'],
    },
    flavour: 'Each rib is a promise made to someone else.',
  },
  {
    id: 'ashenHeartstone',
    name: 'Ashen Heartstone',
    baseId: 'amulet_str',
    level: 44,
    mods: [
      flag('grantsKeystone.searingAvatar'),
      m('penetration', 'base', 10, 10, { damageTypes: ['fire'] }),
      m('str', 'base', 20, 30),
    ],
    notes: {
      pairsWith: ['fire skills and fire-damage notables', 'Kindling Halo'],
      weakAgainst: [
        'fire-immune and fire-resistant enemies, and the keystone deals no non-fire damage',
      ],
    },
    flavour: 'The coal inside has not cooled since the first fire.',
  },
  {
    id: 'orreryOfBone',
    name: 'Orrery of Bone',
    baseId: 'amulet_all',
    level: 50,
    mods: [m('allAttr', 'base', 60, 80)],
    factions: ['ossuary'],
    notes: {
      pairsWith: ['gem-heavy builds that need every attribute', 'high-requirement uniques'],
      weakAgainst: ['nothing else on the slot: it carries no other bonus'],
    },
    flavour: 'Small bones circle a larger one. The arithmetic is sound.',
  },
  {
    id: 'rotheartBand',
    name: 'Rot-heart Band',
    baseId: 'ring_mana',
    level: 30,
    mods: [
      m('damage.min', 'base', 10, 15, { damageTypes: ['chaos'], tags: ATTACK }),
      m('damage.max', 'base', 20, 28, { damageTypes: ['chaos'], tags: ATTACK }),
      m('resist.chaos', 'base', 17, 23),
      m('life', 'inc', -15, -10),
    ],
    factions: ['rot'],
    notes: {
      pairsWith: ['fast attacks and added-damage scaling', 'poison and chaos-resistance gear'],
      weakAgainst: ['glass builds, which lose life for it'],
    },
    flavour: 'It keeps the finger warm by taking something in exchange.',
  },
  {
    id: 'wideCinch',
    name: 'The Wide Cinch',
    baseId: 'belt_armour',
    level: 28,
    mods: [
      m('maxDamage', 'more', 30, 40, { damageTypes: ['physical'], tags: ATTACK }),
      m('minDamage', 'more', -40, -30, { damageTypes: ['physical'], tags: ATTACK }),
    ],
    notes: {
      pairsWith: ['stun and freeze builds, which like spiky hits', 'high-crit builds'],
      weakAgainst: ['damage floors: the average hit barely changes'],
    },
    flavour: 'Pulled tight, it pushes the best blows outward.',
  },
];
