import { mod, type Mod } from '../mods/types';
import { BASE_ROWS } from './baseTables';
import type { BuffId } from './buffs';

/**
 * DESIGN.md §11.6. The flask bases are the reference game's (docs/AUDIT-ITEM-BASES.md): twelve life and twelve mana
 * tiers, six hybrids and fifteen utility kinds, with their amounts, seconds and charges; the rows are `baseTables.ts`.
 */
export type FlaskKind = 'life' | 'mana' | 'hybrid' | 'utility';

/** The ground a utility flask leaves where the character stands when it is drunk. */
export type FlaskGround = 'consecrated' | 'chilling' | 'smoke';

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
  /** Utility buff mods, granted while the flask runs. */
  buff: Mod[];
  /** Ground left on use, lasting as long as the flask. */
  ground?: FlaskGround;
  /** A buff of the buff layer (src/data/buffs.ts) held for as long as the flask runs. */
  grants?: BuffId;
  /** Never drops on its own; only a unique flask uses it. */
  uniqueOnly?: boolean;
};

/** What each utility kind does while it runs (the reference flasks' lines; phasing is not modelled). */
const UTILITY: Record<string, Pick<FlaskBase, 'buff' | 'ground' | 'grants'>> = {
  flask_haste: { buff: [mod('moveSpeed', 'inc', 40)] },
  flask_prism: { buff: [mod('resist.allEle', 'base', 35)] },
  flask_smokeveil: { buff: [mod('evasion', 'inc', 100)], ground: 'smoke' },
  flask_ember: { buff: [mod('resist.fire', 'base', 50), mod('maxResist.fire', 'base', 6)] },
  flask_frost: { buff: [mod('resist.cold', 'base', 50), mod('maxResist.cold', 'base', 6)] },
  flask_storm: {
    buff: [mod('resist.lightning', 'base', 50), mod('maxResist.lightning', 'base', 6)],
  },
  flask_mire: { buff: [mod('resist.chaos', 'base', 35)] },
  flask_onrush: { buff: [], grants: 'onslaught' },
  flask_keen: { buff: [mod('critLucky', 'flag', 1)] },
  flask_bulwark: { buff: [mod('armour', 'base', 3000)] },
  flask_ghoststep: { buff: [mod('dodgeAttack', 'base', 10), mod('dodgeSpell', 'base', 10)] },
  flask_mist: { buff: [mod('evasion', 'base', 3000)] },
  flask_chillwake: { buff: [mod('avoidHit.cold', 'base', 20)], ground: 'chilling' },
  flask_sanctum: { buff: [mod('damage', 'inc', 40)], ground: 'consecrated' },
  flask_stonehide: {
    buff: [mod('physReduction', 'base', 20), mod('reflectPhysPct', 'base', 20)],
  },
};

function flasksOf(kind: FlaskKind): FlaskBase[] {
  return (BASE_ROWS[`flask_${kind}`] ?? []).map((r) => {
    const [life, mana, duration, maxCharges, perUse] = r.flask!;
    const u = kind === 'utility' ? UTILITY[r.id] : undefined;
    if (kind === 'utility' && !u) throw new Error(`utility flask ${r.id} has no effect`);
    return {
      id: r.id,
      name: r.name,
      kind,
      level: r.level,
      life,
      mana,
      maxCharges,
      perUse,
      duration,
      buff: u?.buff ?? [],
      ...(u?.ground ? { ground: u.ground } : {}),
      ...(u?.grants ? { grants: u.grants } : {}),
    };
  });
}

const util = (id: string, name: string, level: number): FlaskBase => ({
  id,
  name,
  kind: 'utility',
  level,
  life: 0,
  mana: 0,
  maxCharges: 50,
  perUse: 25,
  duration: 6,
  buff: [],
  uniqueOnly: true,
});

/** The bases of the unique flasks (their effect comes from the unique, not the base). */
const UNIQUE_BASES: FlaskBase[] = [
  util('flask_hoarfrost', 'Hoarfrost Draught', 26),
  util('flask_lastlight', 'Last Light Flask', 40),
  util('flask_rotwine', 'Rotwine Flask', 35),
  util('flask_stonebrew', 'Stonebrew Flask', 20),
  util('flask_tonic', "Gambler's Tonic", 22),
  util('flask_martyr', "Martyr's Draught", 30),
  util('flask_penitent', 'Penitent Draught', 35),
  util('flask_hollowoak', 'Hollow Oak Draught', 8),
  util('flask_brimming', 'Brimming Cup', 35),
  util('flask_emberwell', 'Emberwell Urn', 22),
  util('flask_venomvein', 'Venomvein Phial', 27),
  util('flask_steadfast', 'Steadfast Tonic', 22),
  util('flask_unbound', 'Unbound Draught', 50),
  util('flask_bellowing', 'Bellowing Draught', 27),
  util('flask_swiftgut', 'Swiftgut Flask', 40),
  util('flask_ashen', 'Ashen Tonic', 14),
  util('flask_thunderblood', 'Thunderblood Vial', 68),
  util('flask_hexfire', 'Hexfire Brew', 48),
];

export const FLASK_BASES: FlaskBase[] = [
  ...flasksOf('life'),
  ...flasksOf('mana'),
  ...flasksOf('hybrid'),
  ...flasksOf('utility'),
  ...UNIQUE_BASES,
];

const BY_ID = new Map(FLASK_BASES.map((f) => [f.id, f]));

/** The base of a kind nearest a level (the lower one when two are as near). */
function nearestFlask(kind: FlaskKind, level: number): FlaskBase | undefined {
  let best: FlaskBase | undefined;
  for (const f of FLASK_BASES)
    if (f.kind === kind && !f.uniqueOnly)
      if (!best || Math.abs(f.level - level) < Math.abs(best.level - level)) best = f;
  return best;
}

/** The ids of the flask tiers the game had before the reference ladders (2026-10-18): each stands for the tier nearest its level. */
const LEGACY_IDS: Map<string, string> = (() => {
  const m = new Map<string, string>();
  const add = (kind: FlaskKind, levels: number[]) =>
    levels.forEach((level, i) => {
      const f = nearestFlask(kind, level);
      if (f) m.set(`flask_${kind}_${i + 1}`, f.id);
    });
  add('life', [1, 8, 18, 30, 42, 54, 66, 78]);
  add('mana', [1, 10, 22, 36, 50, 64]);
  add('hybrid', [10, 35, 60]);
  return m;
})();

export function flaskBase(id: string): FlaskBase {
  const f = BY_ID.get(id) ?? BY_ID.get(LEGACY_IDS.get(id) ?? '');
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
  // The rest of the 3.9 cleansing suffixes (docs/BOSSES.md 11.2): each also keeps its ailment off while the flask runs.
  {
    id: 'flaskRemovePoison',
    type: 'suffix',
    name: 'of the Antidote',
    kinds: [],
    minIlvl: 16,
    weight: 100,
    mods: [{ stat: 'removePoison', kind: 'flag', min: 1, max: 1 }],
  },
  {
    id: 'flaskRemoveShock',
    type: 'suffix',
    name: 'of Earthing',
    kinds: [],
    minIlvl: 10,
    weight: 100,
    mods: [{ stat: 'removeShock', kind: 'flag', min: 1, max: 1 }],
  },
  {
    id: 'flaskRemoveCurse',
    type: 'suffix',
    name: 'of Unbinding',
    kinds: [],
    minIlvl: 18,
    weight: 80,
    mods: [{ stat: 'removeCurse', kind: 'flag', min: 1, max: 1 }],
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
