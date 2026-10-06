import { mod, type Mod } from '../mods/types';

/** DESIGN.md §11.6. */
export type FlaskKind = 'life' | 'mana' | 'hybrid' | 'utility';

export type FlaskBase = {
  id: string;
  name: string;
  kind: FlaskKind;
  level: number;
  life: number;
  mana: number;
  maxCharges: number;
  perUse: number;
  duration: number;
  /** Utility buff mods; `scale` mods are multiplied by (1 + 0.04 · ilvl). */
  buff: Mod[];
  scaleWithIlvl?: boolean;
};

const LIFE_AMOUNTS = [70, 150, 270, 450, 700, 1000, 1400, 1900];
const LIFE_REQS = [1, 8, 18, 30, 42, 54, 66, 78];
const MANA_AMOUNTS = [50, 110, 200, 320, 460, 620];
const MANA_REQS = [1, 10, 22, 36, 50, 64];
const TIER_WORDS = [
  'Cracked',
  'Corked',
  'Stoppered',
  'Sealed',
  'Gilded',
  'Runed',
  'Hallowed',
  'Everfull',
];

function lifeFlasks(): FlaskBase[] {
  return LIFE_AMOUNTS.map((life, i) => ({
    id: `flask_life_${i + 1}`,
    name: `${TIER_WORDS[i]} Life Draught`,
    kind: 'life',
    level: LIFE_REQS[i],
    life,
    mana: 0,
    maxCharges: 21,
    perUse: 7,
    duration: 4,
    buff: [],
  }));
}

function manaFlasks(): FlaskBase[] {
  return MANA_AMOUNTS.map((mana, i) => ({
    id: `flask_mana_${i + 1}`,
    name: `${TIER_WORDS[i]} Mana Draught`,
    kind: 'mana',
    level: MANA_REQS[i],
    life: 0,
    mana,
    maxCharges: 24,
    perUse: 6,
    duration: 4,
    buff: [],
  }));
}

function hybridFlasks(): FlaskBase[] {
  const tiers = [
    { life: 1, mana: 1, level: 10, word: 'Murky' },
    { life: 3, mana: 3, level: 35, word: 'Twilight' },
    { life: 5, mana: 5, level: 60, word: 'Dawnlit' },
  ];
  return tiers.map((t, i) => ({
    id: `flask_hybrid_${i + 1}`,
    name: `${t.word} Blended Draught`,
    kind: 'hybrid',
    level: t.level,
    life: Math.round(LIFE_AMOUNTS[t.life] * 0.6),
    mana: Math.round(MANA_AMOUNTS[t.mana] * 0.6),
    maxCharges: 30,
    perUse: 10,
    duration: 5,
    buff: [],
  }));
}

const util = (id: string, name: string, level: number, buff: Mod[], scale = false): FlaskBase => ({
  id,
  name,
  kind: 'utility',
  level,
  life: 0,
  mana: 0,
  maxCharges: 50,
  perUse: 25,
  duration: 4,
  buff,
  scaleWithIlvl: scale,
});

export const FLASK_BASES: FlaskBase[] = [
  ...lifeFlasks(),
  ...manaFlasks(),
  ...hybridFlasks(),
  util('flask_bulwark', 'Bulwark Draught', 6, [mod('armour', 'base', 1500)], true),
  util('flask_mist', 'Mist Draught', 6, [mod('evasion', 'base', 1500)], true),
  util('flask_haste', 'Haste Draught', 12, [mod('moveSpeed', 'inc', 40)]),
  util('flask_ember', 'Ember Draught', 16, [
    mod('resist.fire', 'base', 50),
    mod('maxResist.fire', 'base', 5),
  ]),
  util('flask_frost', 'Frost Draught', 16, [
    mod('resist.cold', 'base', 50),
    mod('maxResist.cold', 'base', 5),
  ]),
  util('flask_storm', 'Storm Draught', 16, [
    mod('resist.lightning', 'base', 50),
    mod('maxResist.lightning', 'base', 5),
  ]),
];

const BY_ID = new Map(FLASK_BASES.map((f) => [f.id, f]));
export function flaskBase(id: string): FlaskBase {
  const f = BY_ID.get(id);
  if (!f) throw new Error(`unknown flask ${id}`);
  return f;
}

/** Magic flask affixes (one prefix, one suffix). Stats prefixed `flask.` are local to the flask. */
export type FlaskAffixDef = {
  id: string;
  type: 'prefix' | 'suffix';
  name: string;
  /** Only for these flask kinds (empty: all). */
  kinds: FlaskKind[];
  minIlvl: number;
  weight: number;
  mods: { stat: string; kind: Mod['kind']; min: number; max: number }[];
};

export const FLASK_AFFIXES: FlaskAffixDef[] = [
  {
    id: 'flaskAmount',
    type: 'prefix',
    name: 'Brimming',
    kinds: ['life', 'mana', 'hybrid'],
    minIlvl: 1,
    weight: 100,
    mods: [{ stat: 'flask.amount', kind: 'inc', min: 20, max: 40 }],
  },
  {
    id: 'flaskCharges',
    type: 'prefix',
    name: 'Deep',
    kinds: [],
    minIlvl: 1,
    weight: 100,
    mods: [{ stat: 'flask.maxCharges', kind: 'inc', min: 30, max: 60 }],
  },
  {
    id: 'flaskBrisk',
    type: 'prefix',
    name: 'Brisk',
    kinds: ['life', 'mana', 'hybrid'],
    minIlvl: 6,
    weight: 80,
    mods: [
      { stat: 'flask.duration', kind: 'inc', min: -33, max: -33 },
      { stat: 'flask.amount', kind: 'more', min: 10, max: 15 },
    ],
  },
  {
    id: 'flaskInstant',
    type: 'prefix',
    name: 'Bursting',
    kinds: ['life'],
    minIlvl: 15,
    weight: 60,
    mods: [
      { stat: 'flask.instant', kind: 'flag', min: 1, max: 1 },
      { stat: 'flask.amount', kind: 'more', min: -25, max: -25 },
    ],
  },
  {
    id: 'flaskUtilDuration',
    type: 'prefix',
    name: 'Lasting',
    kinds: ['utility'],
    minIlvl: 1,
    weight: 100,
    mods: [{ stat: 'flask.duration', kind: 'inc', min: 20, max: 40 }],
  },
  {
    id: 'flaskRemoveIgnite',
    type: 'suffix',
    name: 'of Dousing',
    kinds: [],
    minIlvl: 4,
    weight: 100,
    mods: [{ stat: 'removeIgnite', kind: 'flag', min: 1, max: 1 }],
  },
  {
    id: 'flaskRemoveFreeze',
    type: 'suffix',
    name: 'of Thawing',
    kinds: [],
    minIlvl: 4,
    weight: 100,
    mods: [{ stat: 'removeFreeze', kind: 'flag', min: 1, max: 1 }],
  },
  {
    id: 'flaskRemoveBleed',
    type: 'suffix',
    name: 'of Stanching',
    kinds: [],
    minIlvl: 8,
    weight: 100,
    mods: [{ stat: 'removeBleed', kind: 'flag', min: 1, max: 1 }],
  },
  {
    id: 'flaskArmour',
    type: 'suffix',
    name: 'of the Rampart',
    kinds: [],
    minIlvl: 10,
    weight: 80,
    mods: [{ stat: 'armour', kind: 'inc', min: 30, max: 60 }],
  },
];
