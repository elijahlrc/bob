import type { BuffId } from './buffs';
import type { CondId, DamageType, ModKind, SkillTag } from '../mods/types';

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
  /** Lowers these resistances (indices of the damage types: lightning 1, cold 2, fire 3, chaos 4). */
  res?: number[];
  /** Increased physical damage taken. */
  vulnPhys?: boolean;
  /** Increased damage taken of every type. */
  vulnAll?: boolean;
  /** Less damage dealt. */
  dmg?: boolean;
  /** Reduced action and movement speed. */
  speed?: boolean;
  /** The share of the effect that rare and unique enemies take (Enfeeble and Temporal Chains: half). */
  rarityShare?: number;
  /** Increased physical damage over time taken, as a multiple of the effect. */
  dotPhys?: number;
  /** Increased damage over time taken of every type, as a multiple of the effect. */
  dotAll?: number;
  /** Reduced accuracy, as a multiple of the effect. */
  acc?: number;
  /** Reduced critical strike chance, in percent. */
  critChance?: number;
  /** Reduced critical strike multiplier, as a multiple of the effect. */
  critMulti?: number;
  /** Less evasion: the effect, in percent. */
  evasion?: boolean;
  /** Points off the physical damage reduction of the enemy. */
  physRed?: number;
  /** Chance, in percent, to be bled and to be maimed when hit by attacks. */
  bleedHit?: number;
  maimHit?: number;
  /** Other effects on the enemy expire this much slower, in percent. */
  expireSlow?: number;
  /** Additional chance, in percent, to be stunned. */
  stun?: number;
};

/** What a hex gives the character when the enemy it is on is killed by the character: recovery, a charge, more flask charges. */
export type HexKill = {
  life?: [number, number];
  mana?: [number, number];
  charge?: { kind: 'grit' | 'fervour' | 'insight'; chance: [number, number] };
  flasks?: number;
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
  /** Seconds the hex lasts at gem level 1 and level 20 (the reference gems': nine to eleven for a curse, six to ten for a mark). */
  seconds?: [number, number];
  /** The condition that is true while the target carries this hex: what `selfMods` wait for (default: any hex). */
  selfCond?: CondId;
  /** What the character gets when it kills an enemy under this hex. */
  onKill?: HexKill;
  /** A melee hit against an enemy under this hex grants the character this buff (Punishment). */
  meleeBuff?: BuffId;
  /** Recovery on each attack hit against an enemy under this hex. */
  onHit?: { life?: [number, number]; mana?: [number, number] };
};

export const HEXES: Record<HexId, HexDef> = {
  brittleDoom: {
    id: 'brittleDoom',
    name: 'Brittle Doom',
    low: 20,
    high: 39,
    text: 'to all elemental resistances',
    fx: { res: [1, 2, 3] },
    seconds: [9, 10.9],
  },
  leadenLimbs: {
    id: 'leadenLimbs',
    name: 'Leaden Limbs',
    low: 20,
    high: 29,
    text: 'less action speed, and effects on them expire 40% slower',
    fx: { speed: true, rarityShare: 0.5, expireSlow: 40 },
    seconds: [5, 5.95],
  },
  feebleGrip: {
    id: 'feebleGrip',
    name: 'Feeble Grip',
    low: 21,
    high: 30,
    text: 'less damage dealt, with less accuracy, critical strike chance and multiplier',
    fx: { dmg: true, rarityShare: 0.5, acc: 0.55, critChance: 25, critMulti: 1 },
    seconds: [9, 10.9],
  },
  openWounds: {
    id: 'openWounds',
    name: 'Open Wounds',
    low: 30,
    high: 39,
    text: 'increased physical damage taken, and a chance to be bled and maimed by attacks',
    fx: { vulnPhys: true, dotPhys: 1, bleedHit: 20, maimHit: 20 },
    seconds: [9, 10.9],
  },
  fireSap: {
    id: 'fireSap',
    name: 'Tinder Sap',
    low: 25,
    high: 44,
    text: 'to fire resistance',
    fx: { res: [3] },
    seconds: [9, 10.9],
  },
  coldSap: {
    id: 'coldSap',
    name: 'Rime Sap',
    low: 25,
    high: 44,
    text: 'to cold resistance',
    fx: { res: [2] },
    seconds: [9, 10.9],
  },
  shockSap: {
    id: 'shockSap',
    name: 'Static Sap',
    low: 25,
    high: 44,
    text: 'to lightning resistance',
    fx: { res: [1] },
    seconds: [9, 10.9],
  },
  chaosSap: {
    id: 'chaosSap',
    name: 'Void Sap',
    low: 20,
    high: 29,
    text: 'to chaos resistance, and more damage over time taken',
    fx: { res: [4], dotAll: 0.85 },
    selfMods: [
      { stat: 'damage.min', kind: 'base', low: 9, high: 46, damageTypes: ['chaos'] },
      { stat: 'damage.max', kind: 'base', low: 12, high: 57, damageTypes: ['chaos'] },
    ],
    selfCond: 'cursedDespair',
    seconds: [9, 10.9],
  },
  hardTimes: {
    id: 'hardTimes',
    name: 'Hard Times',
    low: 20,
    high: 20,
    text: 'less physical damage reduction; hitting them in melee makes you a Punisher',
    fx: { physRed: 20 },
    meleeBuff: 'punisher',
    seconds: [9, 10.9],
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
    low: 1.5,
    high: 2.5,
    text: 'to critical strike chance against it, with more critical damage taken',
    fx: {},
    selfMods: [
      { stat: 'critChance', kind: 'base', low: 1.5, high: 2.5 },
      { stat: 'critMulti', kind: 'base', low: 30, high: 30 },
    ],
    selfCond: 'markedRuin',
    onKill: { life: [16, 25], mana: [16, 25], charge: { kind: 'insight', chance: [21, 30] } },
    seconds: [6, 9.8],
  },
  flaskMark: {
    id: 'flaskMark',
    name: 'Mark of Plenty',
    low: 30,
    high: 49,
    text: 'less evasion; hitting it restores life and mana, and killing it fills flasks',
    fx: { evasion: true },
    onHit: { life: [5, 24], mana: [5, 12] },
    onKill: { flasks: 1, charge: { kind: 'fervour', chance: [21, 30] } },
    seconds: [6, 9.8],
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
    low: 21,
    high: 30,
    text: 'reduced stun recovery and a greater chance to be stunned; your attacks leech from it',
    fx: { stun: 10 },
    selfMods: [
      { stat: 'leech.life', kind: 'base', low: 2, high: 2, tags: ['attack'] },
      { stat: 'leech.mana', kind: 'base', low: 2, high: 2, tags: ['attack'] },
    ],
    selfCond: 'markedWarlord',
    onKill: { charge: { kind: 'grit', chance: [21, 30] } },
    seconds: [6, 9.8],
  },
};

/** The effect of a hex at a gem level, before curse effect: a straight line from level 1 to level 20. */
export function hexEffect(id: HexId, level: number): number {
  const h = HEXES[id];
  const t = Math.max(0, Math.min(1, (level - 1) / 19));
  return Math.round((h.low + (h.high - h.low) * t) * 10) / 10;
}

/** The seconds a hex lasts at a gem level: a straight line from level 1 to level 20. */
export function hexSeconds(id: HexId, level: number): number {
  const sec = HEXES[id].seconds;
  if (!sec) return HEX_SECONDS;
  const t = Math.max(0, Math.min(1, (level - 1) / 19));
  return Math.round((sec[0] + (sec[1] - sec[0]) * t) * 100) / 100;
}

/** The value of a range at a gem level. */
export function atLevel(range: readonly [number, number], level: number): number {
  const t = Math.max(0, Math.min(1, (level - 1) / 19));
  return range[0] + (range[1] - range[0]) * t;
}

export type HexTotals = {
  res: number[];
  vulnPhys: number;
  vulnAll: number;
  damageMult: number;
  speedMult: number;
  /** Increased damage over time taken, as fractions: physical, and of every type. */
  dotPhys: number;
  dotAll: number;
  /** Reduced accuracy and critical strike chance (fractions of them), and reduced critical multiplier (fraction). */
  acc: number;
  critChance: number;
  critMulti: number;
  /** Less evasion (fraction), points off physical damage reduction (fraction), and chances to be bled, maimed or stunned. */
  evasion: number;
  physRed: number;
  bleedHit: number;
  maimHit: number;
  stun: number;
  /** Other effects on the enemy expire this much slower (fraction). */
  expireSlow: number;
};

/** What a set of hexes with their effects does, in the form the damage code reads; rare and unique enemies take some of them in part. */
export function hexTotals(
  hexes: readonly { id: HexId; effect: number }[],
  rarity: string = 'normal',
): HexTotals {
  const res = [0, 0, 0, 0, 0];
  let vulnPhys = 0;
  let vulnAll = 0;
  let damageMult = 1;
  let speedMult = 1;
  const t: HexTotals = {
    res,
    vulnPhys: 0,
    vulnAll: 0,
    damageMult: 1,
    speedMult: 1,
    dotPhys: 0,
    dotAll: 0,
    acc: 0,
    critChance: 0,
    critMulti: 0,
    evasion: 0,
    physRed: 0,
    bleedHit: 0,
    maimHit: 0,
    stun: 0,
    expireSlow: 0,
  };
  const tough = rarity !== 'normal' && rarity !== 'magic';
  for (const h of hexes) {
    const fx = HEXES[h.id].fx;
    const e = tough && fx.rarityShare !== undefined ? h.effect * fx.rarityShare : h.effect;
    for (const i of fx.res ?? []) res[i] += h.effect;
    if (fx.vulnPhys) vulnPhys += h.effect / 100;
    if (fx.vulnAll) vulnAll += h.effect / 100;
    if (fx.dmg) damageMult *= 1 - e / 100;
    if (fx.speed) speedMult *= 1 - Math.min(75, e) / 100;
    if (fx.dotPhys) t.dotPhys += (h.effect * fx.dotPhys) / 100;
    if (fx.dotAll) t.dotAll += (h.effect * fx.dotAll) / 100;
    if (fx.acc) t.acc += Math.min(75, h.effect * fx.acc) / 100;
    if (fx.critChance) t.critChance += fx.critChance / 100;
    if (fx.critMulti) t.critMulti += Math.min(75, h.effect * fx.critMulti) / 100;
    if (fx.evasion) t.evasion += h.effect / 100;
    if (fx.physRed) t.physRed += fx.physRed / 100;
    if (fx.bleedHit) t.bleedHit += fx.bleedHit / 100;
    if (fx.maimHit) t.maimHit += fx.maimHit / 100;
    if (fx.stun) t.stun += fx.stun / 100;
    if (fx.expireSlow) t.expireSlow += fx.expireSlow / 100;
  }
  t.vulnPhys = vulnPhys;
  t.vulnAll = vulnAll;
  t.damageMult = damageMult;
  t.speedMult = speedMult;
  return t;
}

/** One line of the hex at a level, for gem cards and the inspect panel: "−20% to all elemental resistances". */
export function hexText(id: HexId, effect: number): string {
  const sign = HEXES[id].fx.res ? '−' : '';
  return `${sign}${Math.round(effect * 10) / 10}% ${HEXES[id].text}`;
}
