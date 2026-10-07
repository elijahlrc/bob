import type { UniqueDef, UniqueMod } from './uniques';

/**
 * Wave 3 of the depth expansion (EXPANSION 6.4): uniques that need charges, hexes or a timed buff layer.
 * Every name, flavour line and number is ours. Values are _tunable_.
 */

const m = (
  stat: string,
  kind: UniqueMod['kind'],
  min: number,
  max = min,
  extra: Partial<UniqueMod> = {},
): UniqueMod => ({ stat, kind, min, max, ...extra });
const flag = (stat: string) => m(stat, 'flag', 1);

export const WAVE3_UNIQUES: UniqueDef[] = [
  {
    id: 'lullabySilks',
    name: 'Lullaby Silks',
    baseId: 'gloves_es_3',
    level: 42,
    mods: [m('hexOnHit.leadenLimbs', 'base', 11)],
    triggers: [
      {
        on: 'kill',
        targetHas: 'hex',
        chance: 100,
        cooldown: 0,
        effect: { kind: 'explode', pctOfMaxLife: 25, dtype: 'chaos', radius: 2.5 },
      },
    ],
    factions: ['choir'],
    notes: {
      pairsWith: ['clustered packs, where the chaos blasts chain', 'curse effect on the tree'],
      weakAgainst: ['Hex-warded monsters, which are never hexed and never explode'],
    },
    flavour: 'Sung softly enough, the whole room sleeps.',
  },
  {
    id: 'twiceHexedRing',
    name: 'Twice-Hexed Ring',
    baseId: 'ring_mana',
    level: 40,
    mods: [m('hexLimit', 'base', 1), m('curseEffect', 'inc', 10, 15)],
    factions: ['choir'],
    notes: {
      pairsWith: ['two hex sources: Hexing Strikes with hex gems, plus Lullaby Silks'],
      weakAgainst: ['builds with only one hex source, where the ring does nothing'],
    },
    flavour: 'Two curses, one finger, no peace.',
  },
  {
    id: 'bandOfEndlessGrit',
    name: 'Band of Endless Grit',
    baseId: 'ring_fire',
    level: 36,
    mods: [
      m('maxCharges.grit', 'base', 1),
      m('lifeRegenPct', 'base', 0.4, 0.4, { per: { stat: 'charges.grit', div: 1 } }),
      m('str', 'base', 20, 30),
    ],
    factions: ['reliquary'],
    notes: {
      pairsWith: ['a Grit source: Bulwark of Habit, or blocking often'],
      weakAgainst: ['builds with no way to gain Grit, which see only the Strength'],
    },
    flavour: 'It does not heal you. It refuses to let you stop.',
  },
  {
    id: 'ferventStride',
    name: 'Fervent Stride',
    baseId: 'boots_ev_2',
    level: 30,
    mods: [
      m('maxCharges.fervour', 'base', 1),
      m('chargeOn.kill.fervour', 'base', 20),
      m('moveSpeed', 'inc', 10),
    ],
    factions: ['choir'],
    notes: {
      pairsWith: ['packs of weak monsters, where a kill every second keeps the charges up'],
      weakAgainst: ['bosses, where there is nothing to kill and the charges lapse'],
    },
    flavour: 'The faster the dead fall, the faster you run.',
  },
  {
    id: 'trophyCord',
    name: 'The Trophy Cord',
    baseId: 'belt_life',
    level: 40,
    mods: [flag('trophyMods'), m('life', 'base', 30, 40)],
    factions: ['hollow'],
    notes: {
      pairsWith: ['map affixes that add rare packs', 'themes with many rares'],
      weakAgainst: ['maps with few rares, where it is only a belt'],
    },
    flavour: 'Every rare you kill leaves you a little more like it.',
  },
];
