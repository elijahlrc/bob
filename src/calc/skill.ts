import { clamp } from '../core/math';
import {
  BASE_CRIT_MULTI,
  BLEED_DURATION,
  CHILL_DURATION,
  DUAL_WIELD_MORE_APS,
  IGNITE_DURATION,
  POISON_DURATION,
  SHOCK_DURATION,
} from '../data/constants';
import type { ModCtx, ModDB } from '../mods/modDb';
import {
  DAMAGE_TYPES,
  tagBit,
  tagMask,
  type DamageType,
  type SkillTag,
  type StatId,
} from '../mods/types';
import type { SkillDef } from './gems';

export const PHYS = 0;
export const LIGHT = 1;
export const COLD = 2;
export const FIRE = 3;
export const CHAOS = 4;
const NT = DAMAGE_TYPES.length;

/** A weapon resolved with its local mods. `flats[t]` = [min, max] for damage type index t. */
export type HandStats = {
  flats: [number, number][];
  aps: number;
  /** Percent. */
  crit: number;
  range: number;
  tags: SkillTag[];
  /** Local accuracy added by this weapon. */
  accuracy?: number;
};

/** A damage chunk: type index, ancestry bitmask, and a range. */
export type Chunk = { type: number; anc: number; min: number; max: number };

export type HandProfile = {
  /** Post-scaling ranges (step 4). These are "H" for ailments before crit and mitigation. */
  chunks: Chunk[];
  /** Extra multiplier on hit damage only (mods tagged 'hit'). */
  hitMult: number;
  critChance: number;
  critMulti: number;
  accuracy: number;
  /** Seconds per use with this hand (before action-speed modifiers). */
  time: number;
  range: number;
};

export type AilmentSpec = { chance: number; mult: number; dur: number };

export type SkillProfile = {
  skill: SkillDef;
  isAttack: boolean;
  tagMask: number;
  hands: HandProfile[];
  /** Average seconds per use. */
  useTime: number;
  /** Extra times the skill fires after each use (Echoing Cast): a use lands 1 + repeats times. */
  repeats: number;
  cost: number;
  /** Ignite: `max` ignites can burn at once (the strongest count); `speed` makes them deal their damage faster. */
  ignite: AilmentSpec & { max: number; speed: number };
  bleed: AilmentSpec;
  poison: AilmentSpec;
  shock: { chance: number; effect: number; dur: number };
  chill: { effect: number; dur: number };
  freeze: { chance: number; dur: number };
  cannotInflictEle: boolean;
  /** Damage types (indices) that can inflict each ailment: its own, plus any a rule allows. */
  ailmentFrom: { ignite: number[]; shock: number[]; chill: number[]; freeze: number[] };
  alwaysFreezeOnCrit: boolean;
  /** Leech from critical strikes is instant. */
  instantLeechOnCrit: boolean;
  leechLife: number[];
  leechMana: number[];
  lifeOnHit: number;
  manaOnHit: number;
  /** Fraction of the target's armour this skill ignores (Sundering monsters). */
  armourIgnore: number;
  /** Percent of the target's maximum mana each hit drains (Siphoning monsters). */
  manaDrain: number;
  stunDamageMult: number;
  enemyStunThreshRed: number;
  stunDurMult: number;
  pen: number[];
  projectiles: number;
  pierce: number;
  chains: number;
  radiusMult: number;
  projSpeedMult: number;
  alwaysHit: boolean;
  closeQuarters: boolean;
  overload: boolean;
  cruelAgony: boolean;
  woundDance: boolean;
  prismaticBalance: boolean;
  /** Sweep while dual wielding: each use hits with both weapons. */
  bothHands: boolean;
};

export type ProfileInput = {
  skill: SkillDef;
  /** Global mods plus the skill's and its supports' mods. */
  db: ModDB;
  /** Attacks: [main] or [main, off]. Spells: []. */
  hands: HandStats[];
  /** Tags contributed by the loadout ('dualWield', 'shield'). */
  extraTags: SkillTag[];
  costMult: number;
  conds: number;
  statValue: (s: StatId) => number;
};

const DOT_TAGS = tagBit('dot');

function ctxOf(tags: number, conds: number, statValue: (s: StatId) => number, anc = 0): ModCtx {
  return { tags, ancestry: anc, conds, statValue };
}

/** §6.5 step 3: conversion and gain with ancestry. */
export function convertChunks(base: Chunk[], db: ModDB, ctx: ModCtx): Chunk[] {
  const pending: Chunk[][] = Array.from({ length: NT }, () => []);
  for (const c of base) pending[c.type].push(c);
  const out: Chunk[] = [];
  for (let t = 0; t < NT; t++) {
    if (pending[t].length === 0) continue;
    const from = DAMAGE_TYPES[t];
    const skill: number[] = new Array(NT).fill(0);
    const other: number[] = new Array(NT).fill(0);
    const gain: number[] = new Array(NT).fill(0);
    let skillTotal = 0;
    let otherTotal = 0;
    for (let u = t + 1; u < NT; u++) {
      const to = DAMAGE_TYPES[u];
      skill[u] = Math.max(0, db.sum('base', `convertSkill.${from}.${to}`, ctx));
      other[u] = Math.max(0, db.sum('base', `convert.${from}.${to}`, ctx));
      gain[u] = Math.max(0, db.sum('base', `gain.${from}.${to}`, ctx));
      skillTotal += skill[u];
      otherTotal += other[u];
    }
    if (skillTotal > 100) {
      for (let u = t + 1; u < NT; u++) skill[u] *= 100 / skillTotal;
      skillTotal = 100;
    }
    const room = 100 - skillTotal;
    if (otherTotal > room) {
      for (let u = t + 1; u < NT; u++) other[u] *= otherTotal > 0 ? room / otherTotal : 0;
      otherTotal = room;
    }
    const keep = 1 - (skillTotal + otherTotal) / 100;
    for (const c of pending[t]) {
      for (let u = t + 1; u < NT; u++) {
        const conv = (skill[u] + other[u]) / 100;
        const g = gain[u] / 100;
        const anc = c.anc | (1 << u);
        if (conv > 0) pending[u].push({ type: u, anc, min: c.min * conv, max: c.max * conv });
        if (g > 0) pending[u].push({ type: u, anc, min: c.min * g, max: c.max * g });
      }
      if (keep > 0) out.push({ type: t, anc: c.anc, min: c.min * keep, max: c.max * keep });
    }
  }
  return out;
}

function addedFlats(db: ModDB, ctx: ModCtx, eff: number): [number, number][] {
  const out: [number, number][] = [];
  for (let t = 0; t < NT; t++) {
    const c = { ...ctx, ancestry: 1 << t };
    out.push([db.sum('base', 'damage.min', c) * eff, db.sum('base', 'damage.max', c) * eff]);
  }
  return out;
}

/** Build a skill profile (§6.5 steps 1–4, §6.7) for one condition mask. */
export function buildProfile(inp: ProfileInput): SkillProfile {
  const { skill, db, conds, statValue } = inp;
  const isAttack = skill.type === 'attack';
  const baseTags = tagMask(skill.tags) | tagMask(inp.extraTags);
  const baseCtx = ctxOf(baseTags, conds, statValue);
  const avatar = db.flag('avatarOfFire', baseCtx);
  const neverCrit = db.flag('neverCrit', baseCtx);
  const overload = db.flag('feverPitch', baseCtx);
  const noEle = db.flag('noElementalDamage', baseCtx);
  const noPhys = db.flag('noPhysicalDamage', baseCtx);
  const spellBit = tagBit('spell');
  const spellIncOnAttacks = isAttack && db.flag('spellIncAppliesToAttacks', baseCtx);

  function handProfile(hand: HandStats | null): HandProfile {
    const tags = baseTags | (hand ? tagMask(hand.tags) : 0);
    const ctx = ctxOf(tags, conds, statValue);
    // Step 1: base damage.
    const base: Chunk[] = [];
    const eff = isAttack ? 1 : skill.effectiveness / 100;
    const added = addedFlats(db, ctx, eff);
    for (let t = 0; t < NT; t++) {
      let min = added[t][0];
      let max = added[t][1];
      if (hand) {
        min += hand.flats[t][0];
        max += hand.flats[t][1];
      }
      if (!isAttack) {
        for (const d of skill.spellDamage)
          if (DAMAGE_TYPES.indexOf(d.type) === t) {
            min += d.min;
            max += d.max;
          }
      }
      if (max > 0) base.push({ type: t, anc: 1 << t, min, max });
    }
    // Step 2: skill base multiplier (attacks).
    if (isAttack) {
      const m = skill.baseMult / 100;
      for (const c of base) {
        c.min *= m;
        c.max *= m;
      }
    }
    // Step 3: conversion and gain.
    let chunks = convertChunks(base, db, ctx);
    if (avatar) chunks = chunks.filter((c) => c.type === FIRE);
    if (noEle) chunks = chunks.filter((c) => c.type === PHYS || c.type === CHAOS);
    if (noPhys) chunks = chunks.filter((c) => c.type !== PHYS);
    // Step 4: scaling.
    const hitTag = tagBit('hit');
    let hitMultAcc = 0;
    let hitW = 0;
    for (const c of chunks) {
      const cctx = { ...ctx, ancestry: c.anc };
      let m = db.mult('damage', cctx);
      if (spellIncOnAttacks) {
        // Increases and reductions to spell damage also apply (not "more" mods).
        const inc = db.inc('damage', { ...cctx, tags: tags | spellBit });
        m = Math.max(0, 1 + inc) * db.more('damage', cctx);
      }
      c.min *= m * db.mult('minDamage', cctx);
      c.max *= m * db.mult('maxDamage', cctx);
      const hm = db.mult('damage', { ...cctx, tags: tags | hitTag }, hitTag);
      hitMultAcc += hm * (c.min + c.max);
      hitW += c.min + c.max;
    }
    const hitMult = hitW > 0 ? hitMultAcc / hitW : 1;
    // Crit.
    const baseCrit = isAttack ? (hand?.crit ?? 0) : skill.crit;
    let critChance = 0;
    if (!neverCrit) {
      const c = (baseCrit + db.sum('base', 'critChance', ctx)) * db.mult('critChance', ctx);
      // 3.6 removed the 5% minimum and 95% maximum.
      critChance = clamp(c / 100, 0, 1);
    }
    const critMulti = overload ? 1 : (BASE_CRIT_MULTI + db.sum('base', 'critMulti', ctx)) / 100;
    // Accuracy.
    const accuracy = db.calc('accuracy', ctx, hand?.accuracy ?? 0);
    // Speed.
    let time: number;
    if (isAttack) {
      const aps = (hand?.aps ?? 1) * db.mult('attackSpeed', ctx);
      const dw = inp.hands.length > 1 ? 1 + DUAL_WIELD_MORE_APS / 100 : 1;
      time = 1 / Math.max(0.01, aps * dw);
    } else {
      time = skill.castTime / Math.max(0.01, db.mult('castSpeed', ctx));
    }
    return {
      chunks,
      hitMult,
      critChance,
      critMulti,
      accuracy,
      time,
      range: hand?.range ?? 1.3,
    };
  }

  const hands = isAttack ? inp.hands.map((h) => handProfile(h)) : [handProfile(null)];
  const useTime = hands.reduce((s, h) => s + h.time, 0) / hands.length;

  const ailment = (
    tag: SkillTag,
    chanceStat: string,
    durStat: string,
    baseDur: number,
    anc: number,
  ) => {
    const t = baseTags | DOT_TAGS | tagBit(tag);
    const ctx = ctxOf(t, conds, statValue, anc);
    return {
      chance: clamp(db.sum('base', chanceStat, baseCtx) / 100, 0, 1),
      mult: db.mult('damage', ctx, DOT_TAGS | tagBit(tag)),
      dur: baseDur * db.mult(durStat, baseCtx),
    };
  };

  /** Ignites can burn faster (more damage a second, for less time) and, rarely, more than one at once. */
  const igniteSpec = () => {
    const raw = ailment('ignite', 'chance.ignite', 'duration.ignite', IGNITE_DURATION, 1 << FIRE);
    const speed = Math.max(0.1, 1 + db.inc('ignite.speed', baseCtx));
    return {
      ...raw,
      dur: raw.dur / speed,
      speed,
      max: 1 + Math.max(0, Math.floor(db.sum('base', 'ignite.extra', baseCtx))),
    };
  };

  const perType = (stat: string, div = 100) =>
    DAMAGE_TYPES.map((_, t) => db.sum('base', stat, { ...baseCtx, ancestry: 1 << t }) / div);

  const beh = skill.behaviour;
  const aoeMult = db.mult('aoe', baseCtx);
  const ailEffect = db.inc('ailmentEffect', baseCtx);
  const cannotInflictEle = db.flag('cannotInflictEle', baseCtx);
  /** "Your physical damage can shock": the types, beyond its own, that can inflict an ailment. */
  const ailmentSources = (ail: string, own: number): number[] => {
    const out = [own];
    for (let t = 0; t < NT; t++)
      if (t !== own && db.flag(`can${ail}.${DAMAGE_TYPES[t]}`, baseCtx)) out.push(t);
    return out;
  };

  return {
    skill,
    isAttack,
    tagMask: baseTags,
    hands,
    useTime,
    repeats: Math.max(0, Math.round(db.sum('base', 'repeats', baseCtx))),
    cost: Math.round(skill.cost * inp.costMult * db.mult('cost', baseCtx)),
    ignite: igniteSpec(),
    bleed: isAttack
      ? ailment('bleed', 'chance.bleed', 'duration.bleed', BLEED_DURATION, 1 << PHYS)
      : { chance: 0, mult: 1, dur: BLEED_DURATION },
    poison: ailment('poison', 'chance.poison', 'duration.poison', POISON_DURATION, 1 << CHAOS),
    shock: {
      chance: clamp(db.sum('base', 'chance.shock', baseCtx) / 100, 0, 1),
      effect: Math.max(0, 1 + db.inc('effect.shock', baseCtx) + ailEffect),
      dur: SHOCK_DURATION * db.mult('duration.shock', baseCtx),
    },
    chill: {
      effect: Math.max(0, 1 + db.inc('effect.chill', baseCtx) + ailEffect),
      dur: CHILL_DURATION * db.mult('duration.chill', baseCtx),
    },
    freeze: {
      chance: clamp(db.sum('base', 'chance.freeze', baseCtx) / 100, 0, 1),
      dur: db.mult('duration.freeze', baseCtx),
    },
    cannotInflictEle,
    ailmentFrom: {
      ignite: ailmentSources('Ignite', FIRE),
      shock: ailmentSources('Shock', LIGHT),
      chill: ailmentSources('Chill', COLD),
      freeze: ailmentSources('Freeze', COLD),
    },
    alwaysFreezeOnCrit: db.flag('alwaysFreezeOnCrit', baseCtx),
    instantLeechOnCrit: db.flag('instantLeechOnCrit', baseCtx),
    leechLife: perType('leech.life').map((v) => v * db.mult('leechRecovery', baseCtx)),
    leechMana: perType('leech.mana').map((v) => v * db.mult('leechRecovery', baseCtx)),
    lifeOnHit: db.sum('base', 'lifeOnHit', baseCtx),
    manaOnHit: db.sum('base', 'manaOnHit', baseCtx),
    armourIgnore: clamp(db.sum('base', 'armourIgnore', baseCtx) / 100, 0, 1),
    manaDrain: db.sum('base', 'manaDrain', baseCtx),
    stunDamageMult: isAttack ? db.mult('stunDamage', baseCtx) : 1,
    enemyStunThreshRed: clamp(db.sum('base', 'enemyStunThreshold', baseCtx) / 100, 0, 0.9),
    stunDurMult: db.mult('stunDuration', baseCtx),
    pen: perType('penetration', 1),
    projectiles:
      beh.kind === 'projectile'
        ? Math.max(1, beh.count + db.sum('base', 'projectiles', baseCtx))
        : 1,
    pierce: (beh.kind === 'projectile' ? (beh.pierce ?? 0) : 0) + db.sum('base', 'pierce', baseCtx),
    chains: (beh.kind === 'chain' ? beh.chains : 0) + db.sum('base', 'chains', baseCtx),
    radiusMult: Math.sqrt(aoeMult),
    projSpeedMult: db.mult('projectileSpeed', baseCtx),
    alwaysHit: db.flag('alwaysHit', baseCtx),
    closeQuarters: db.flag('closeQuarters', baseCtx),
    overload,
    cruelAgony: db.flag('cruelAgony', baseCtx),
    woundDance: db.flag('woundDance', baseCtx),
    prismaticBalance: db.flag('prismaticBalance', baseCtx),
    bothHands: !!skill.bothWeapons && inp.hands.length > 1,
  };
}

/** Distance-based damage multiplier for projectile skills (Close Quarters, falloff). */
export function distanceMult(p: SkillProfile, d: number): number {
  let m = 1;
  const b = p.skill.behaviour;
  if (b.kind === 'projectile') {
    if (p.closeQuarters && p.isAttack) m *= 1.5 - (clamp(d, 1, 8) - 1) / 7;
    if (b.falloff !== undefined && b.range) m *= 1 - (1 - b.falloff) * clamp(d / b.range, 0, 1);
  }
  return m;
}

export function typeIndex(t: DamageType): number {
  return DAMAGE_TYPES.indexOf(t);
}
