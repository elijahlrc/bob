import type { DamageType, ModKind, SkillTag } from '../mods/types';

/**
 * Hexes (EXPANSION 5.7): debuffs with an effect value, lasting 6 seconds and re-applied by their source. A target
 * holds at most as many of the player's hexes as the hex limit; the player holds one monster hex at a time.
 * Curses and marks of the coverage plan (C4) are hexes too: the character casts them (a utility skill), and a mark
 * also gives the character a bonus against the marked enemy (`selfMods`).
 */
export type HexId =
  | 'brittleDoom'
  | 'leadenLimbs'
  | 'feebleGrip'
  | 'openWounds'
  | 'fireSap'
  | 'coldSap'
  | 'shockSap'
  | 'chaosSap'
  | 'hardTimes'
  | 'rotBane'
  | 'critMark'
  | 'flaskMark'
  | 'huntMark'
  | 'stunMark';

/** The hexes monsters put on the player, and the ones a unique grants through `hexOnHit.*`. */
export const HEX_IDS: HexId[] = ['brittleDoom', 'leadenLimbs', 'feebleGrip', 'openWounds'];
/** Every hex there is (the curses and marks the character casts included). */
export const ALL_HEX_IDS: HexId[] = [
  ...HEX_IDS,
  'fireSap',
  'coldSap',
  'shockSap',
  'chaosSap',
  'hardTimes',
  'rotBane',
  'critMark',
  'flaskMark',
  'huntMark',
  'stunMark',
];

export const HEX_SECONDS = 6;
/** Bosses take a third less effect from curses (3.9). */
export const BOSS_CURSE_EFFECT = 0.67;
/** How many of the player's hexes a target holds at once, before items and the tree. */
export const BASE_HEX_LIMIT = 1;

/** What a hex does to the one it is on, with its effect value in percent. */
export type HexFx = {
  /** Lowers these resistances (indices of the damage types: fire 1, cold 2, lightning 3, chaos 4). */
  res?: number[];
  /** Increased physical damage taken. */
  vulnPhys?: boolean;
  /** Increased damage taken of every type. */
  vulnAll?: boolean;
  /** Less damage dealt. */
  dmg?: boolean;
  /** Reduced action and movement speed. */
  speed?: boolean;
};

/** A bonus the character has against an enemy under this hex, scaled from gem level 1 to level 20. */
export type HexSelfMod = {
  stat: string;
  kind: ModKind;
  low: number;
  high: number;
  tags?: SkillTag[];
  damageTypes?: DamageType[];
};

export type HexDef = {
  id: HexId;
  name: string;
  /** The effect, in percent, at gem level 1 and level 20. */
  low: number;
  high: number;
  /** What the effect is, with a %. */
  text: string;
  fx: HexFx;
  selfMods?: HexSelfMod[];
};

export const HEXES: Record<HexId, HexDef> = {
  brittleDoom: {
    id: 'brittleDoom',
    name: 'Brittle Doom',
    low: 20,
    high: 35,
    text: 'to all elemental resistances',
    fx: { res: [1, 2, 3] },
  },
  leadenLimbs: {
    id: 'leadenLimbs',
    name: 'Leaden Limbs',
    low: 15,
    high: 25,
    text: 'reduced action and movement speed',
    fx: { speed: true },
  },
  feebleGrip: {
    id: 'feebleGrip',
    name: 'Feeble Grip',
    low: 15,
    high: 25,
    text: 'less damage dealt',
    fx: { dmg: true },
  },
  openWounds: {
    id: 'openWounds',
    name: 'Open Wounds',
    low: 20,
    high: 35,
    text: 'increased physical damage taken',
    fx: { vulnPhys: true },
  },
  fireSap: {
    id: 'fireSap',
    name: 'Tinder Sap',
    low: 25,
    high: 44,
    text: 'to fire resistance',
    fx: { res: [1] },
  },
  coldSap: {
    id: 'coldSap',
    name: 'Rime Sap',
    low: 25,
    high: 44,
    text: 'to cold resistance',
    fx: { res: [2] },
  },
  shockSap: {
    id: 'shockSap',
    name: 'Static Sap',
    low: 25,
    high: 44,
    text: 'to lightning resistance',
    fx: { res: [3] },
  },
  chaosSap: {
    id: 'chaosSap',
    name: 'Void Sap',
    low: 20,
    high: 39,
    text: 'to chaos resistance',
    fx: { res: [4] },
  },
  hardTimes: {
    id: 'hardTimes',
    name: 'Hard Times',
    low: 10,
    high: 19,
    text: 'increased damage taken',
    fx: { vulnAll: true },
  },
  rotBane: {
    id: 'rotBane',
    name: 'Rot Bane',
    low: 12,
    high: 21,
    text: 'to chaos resistance and increased damage taken',
    fx: { res: [4], vulnAll: true },
  },
  critMark: {
    id: 'critMark',
    name: 'Mark of Ruin',
    low: 6,
    high: 15,
    text: 'increased damage taken',
    fx: { vulnAll: true },
    selfMods: [
      { stat: 'critChance', kind: 'inc', low: 40, high: 85 },
      { stat: 'critMulti', kind: 'base', low: 15, high: 40 },
    ],
  },
  flaskMark: {
    id: 'flaskMark',
    name: 'Mark of Plenty',
    low: 6,
    high: 15,
    text: 'increased damage taken',
    fx: { vulnAll: true },
    selfMods: [{ stat: 'chargeOn.kill.fervour', kind: 'base', low: 20, high: 35 }],
  },
  huntMark: {
    id: 'huntMark',
    name: 'Mark of the Hunt',
    low: 6,
    high: 15,
    text: 'increased damage taken',
    fx: { vulnAll: true },
    selfMods: [
      { stat: 'damage', kind: 'more', low: 12, high: 25, tags: ['projectile'] },
      { stat: 'accuracy', kind: 'inc', low: 20, high: 45 },
    ],
  },
  stunMark: {
    id: 'stunMark',
    name: 'Mark of the Warlord',
    low: 6,
    high: 15,
    text: 'increased damage taken',
    fx: { vulnAll: true },
    selfMods: [
      { stat: 'stunDuration', kind: 'inc', low: 40, high: 90 },
      { stat: 'leech.life', kind: 'base', low: 0.4, high: 1.2, tags: ['melee'] },
    ],
  },
};

/** The effect of a hex at a gem level, before curse effect: a straight line from level 1 to level 20. */
export function hexEffect(id: HexId, level: number): number {
  const h = HEXES[id];
  const t = Math.max(0, Math.min(1, (level - 1) / 19));
  return Math.round((h.low + (h.high - h.low) * t) * 10) / 10;
}

/** What a set of hexes with their effects does, in the form the damage code reads. */
export function hexTotals(hexes: readonly { id: HexId; effect: number }[]): {
  res: number[];
  vulnPhys: number;
  vulnAll: number;
  damageMult: number;
  speedMult: number;
} {
  const res = [0, 0, 0, 0, 0];
  let vulnPhys = 0;
  let vulnAll = 0;
  let damageMult = 1;
  let speedMult = 1;
  for (const h of hexes) {
    const fx = HEXES[h.id].fx;
    for (const i of fx.res ?? []) res[i] += h.effect;
    if (fx.vulnPhys) vulnPhys += h.effect / 100;
    if (fx.vulnAll) vulnAll += h.effect / 100;
    if (fx.dmg) damageMult *= 1 - h.effect / 100;
    if (fx.speed) speedMult *= 1 - h.effect / 100;
  }
  return { res, vulnPhys, vulnAll, damageMult, speedMult };
}

/** One line of the hex at a level, for gem cards and the inspect panel: "−20% to all elemental resistances". */
export function hexText(id: HexId, effect: number): string {
  const sign = HEXES[id].fx.res ? '−' : '';
  return `${sign}${Math.round(effect * 10) / 10}% ${HEXES[id].text}`;
}
