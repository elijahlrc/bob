import type { UniqueDef, UniqueMod } from './uniques';

/**
 * Wave 2 of the depth expansion (EXPANSION 6.4): uniques built on triggers and a few new sim hooks.
 * Every name, flavour line and number is ours. Values are _tunable_.
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

export const WAVE2_UNIQUES: UniqueDef[] = [
  {
    id: 'thunderknell',
    name: 'Thunderknell',
    baseId: 'mace_3',
    level: 40,
    sockets: 3,
    req: { int: 120 },
    mods: [m('damage', 'inc', 60, 90, { damageTypes: ['physical'], ...L }), m('chains', 'base', 1)],
    triggers: [
      {
        on: 'hit',
        chance: 100,
        cooldown: 0.5,
        effect: { kind: 'castSocketed', spellTags: ['lightning'] },
      },
    ],
    notes: {
      pairsWith: ['lightning spells and shock effect', 'Arc Chain, which gains a chain from it'],
      weakAgainst: [
        'strength builds that cannot reach 120 Intelligence',
        'mana-starved characters',
      ],
    },
    flavour: 'Each blow rings a bell somewhere far above.',
  },
  {
    id: 'frostwrit',
    name: 'Frostwrit',
    baseId: 'sword_4',
    level: 46,
    sockets: 3,
    req: { int: 160 },
    mods: [
      m('damage.min', 'base', 40, 50, { damageTypes: ['cold'], ...L }),
      m('damage.max', 'base', 80, 100, { damageTypes: ['cold'], ...L }),
      flag('noPhysicalDamage'),
      m('critChance', 'inc', 60, 60, { condition: { id: 'targetChilled' } }),
    ],
    triggers: [
      {
        on: 'crit',
        tags: ['melee'],
        chance: 100,
        cooldown: 0.25,
        effect: { kind: 'castSocketed', spellTags: ['cold'] },
      },
    ],
    notes: {
      pairsWith: [
        'Frost Lance (chills, so the sword crits more)',
        'crit notables, which pay twice',
      ],
      weakAgainst: [
        'cold-immune enemies',
        'physical-only supports and bleeding, which lose their base',
      ],
    },
    flavour: 'Every word on the blade is a different way to say stop.',
  },
  {
    id: 'gravescribe',
    name: 'Gravescribe',
    baseId: 'wand_2',
    level: 24,
    sockets: 3,
    mods: [m('socketedGemLevel', 'base', 1, 1, { per: { stat: 'level', div: 25 } })],
    triggers: [{ on: 'attack', chance: 100, cooldown: 0.25, effect: { kind: 'castSocketed' } }],
    notes: {
      pairsWith: ['a strong spell socketed in the wand', 'attack speed, which triggers more often'],
      weakAgainst: ['builds that want the wand sockets for supports'],
    },
    flavour: 'It writes nothing down. Everything it touches is remembered.',
  },
  {
    id: 'cinderfallAxe',
    name: 'Cinderfall Axe',
    baseId: 'axe_4',
    level: 50,
    mods: [
      m('convert.physical.fire', 'base', 60),
      m('damage', 'inc', 80, 110, { damageTypes: ['physical'], ...L }),
    ],
    triggers: [
      {
        on: 'hit',
        tags: ['melee'],
        chance: 20,
        cooldown: 0.25,
        effect: { kind: 'castGranted', skillId: 'emberBurst', level: 20 },
      },
    ],
    notes: {
      pairsWith: ['fire damage notables and penetration', 'melee area skills'],
      weakAgainst: [
        'bleed builds, which lose most of their physical base',
        'fire-resistant enemies',
      ],
    },
    flavour: 'Where it lands, the ground remembers being a forge.',
  },
  {
    id: 'stormsplitJerkin',
    name: 'Stormsplit Jerkin',
    baseId: 'body_eves_2',
    level: 38,
    mods: [flag('unaffectedByShock'), m('life', 'base', 60, 80)],
    triggers: [
      {
        on: 'kill',
        targetHas: 'shock',
        chance: 100,
        cooldown: 0,
        effect: { kind: 'explode', pctOfMaxLife: 5, dtype: 'lightning', radius: 2.5 },
      },
    ],
    factions: ['swarm'],
    notes: {
      pairsWith: [
        'shock chance and shock effect',
        'Kindred Sparks, which shocks the neighbours first',
      ],
      weakAgainst: ['single targets, where an explosion has nothing to hit'],
    },
    flavour: 'The coat was stitched by lightning, and it is still working.',
  },
  {
    id: 'kindredSparks',
    name: 'Kindred Sparks',
    baseId: 'ring_mana',
    level: 32,
    mods: [],
    triggers: [
      {
        on: 'kill',
        targetHas: 'shock',
        chance: 100,
        cooldown: 0,
        effect: { kind: 'spread', ailment: 'shock', radius: 3 },
      },
      {
        on: 'kill',
        targetHas: 'ignite',
        chance: 100,
        cooldown: 0,
        effect: { kind: 'spread', ailment: 'ignite', radius: 3 },
      },
    ],
    factions: ['swarm'],
    notes: {
      pairsWith: ['reliable shock or ignite sources', 'Stormsplit Jerkin and other kill payoffs'],
      weakAgainst: ['sparse rooms and bosses, and enemies that cannot be shocked or ignited'],
    },
    flavour: 'What one of them feels, they all feel.',
  },
  {
    id: 'twinPyreBand',
    name: 'Twin Pyre Band',
    baseId: 'ring_fire',
    level: 36,
    mods: [
      m('ignite.extra', 'base', 1),
      m('ignite.speed', 'inc', 40),
      m('damage', 'more', -40, -40, { tags: ['ignite'] }),
    ],
    notes: {
      pairsWith: ['high ignite chance (Flame Bolt, crits)', 'fast, many-hit skills'],
      weakAgainst: ['single slow hits: each ignite deals less'],
    },
    flavour: 'Two flames, side by side, each a little shorter than the last.',
  },
  {
    id: 'lanternBulwark',
    name: 'The Lantern Bulwark',
    baseId: 'shield_ar_3',
    level: 44,
    mods: [m('armour', 'inc', 60, 80, L), m('es', 'base', 60, 90, L)],
    triggers: [
      {
        on: 'block',
        chance: 100,
        cooldown: 0.5,
        effect: { kind: 'recover', pool: 'es', pctOf: 'armour', value: 2 },
      },
    ],
    factions: ['reliquary'],
    notes: {
      pairsWith: ['block chance and block notables', 'large armour pools'],
      weakAgainst: ['builds without block, which never trigger it'],
    },
    flavour: 'A small light, held steady, turns the dark aside.',
  },
  {
    id: 'bloodglassWard',
    name: 'Bloodglass Ward',
    baseId: 'shield_es_2',
    level: 34,
    mods: [
      flag('rule.socketedGemsUseLife'),
      m('socketedReducedReservation', 'base', 25),
      m('allAttr', 'base', 15, 20),
    ],
    factions: ['hollow'],
    notes: {
      pairsWith: [
        'Pain Conduit and Last Breath, which want low life',
        "Embalmer's Wraps and a large energy shield",
      ],
      weakAgainst: ['constant small hits, which stop energy shield from recharging'],
    },
    flavour: 'The glass is clear because it holds nothing but blood.',
  },
  {
    id: 'pickpocketsLament',
    name: "Pickpocket's Lament",
    baseId: 'ring_cold',
    level: 34,
    mods: [
      m('lifeOnHit', 'base', 10, 15, { tags: ATTACK }),
      m('manaOnHit', 'base', 5, 8, { tags: ATTACK }),
      m('curseEffectOnSelf', 'inc', -50),
      m('resist.allEle', 'base', 12, 16),
      flag('rule.noOtherRing'),
    ],
    factions: ['choir'],
    notes: {
      pairsWith: [
        'fast attacks, which trigger the leech per hit',
        'resistance caps that need the extra points',
      ],
      weakAgainst: ['spell builds, and the lost second ring slot'],
    },
    flavour: 'The thief left it behind, and the hand stayed with it.',
  },
];
