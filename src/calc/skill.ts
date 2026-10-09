import { clamp } from '../core/math';
import {
  BASE_CRIT_MULTI,
  BLEED_DURATION,
  CHILL_DURATION,
  DUAL_WIELD_MORE_APS,
  IMPALE_HITS,
  IMPALE_MAX,
  IMPALE_SHARE,
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
  type Mod,
  type SkillTag,
  type StatId,
  maskAnd,
  maskOr,
} from '../mods/types';
import type { DotSpec } from '../data/gems';
import { levelValue, type SkillDef } from './gems';
import {
  FLEE_CHANCE,
  STATUSES,
  STATUS_IDS,
  statusChance,
  statusExtra,
  statusMagnitude,
  statusSeconds,
  type StatusId,
} from '../data/statuses';

/** A status a hit of a skill can inflict: how likely, how long, and how strong. */
export type StatusRoll = { id: StatusId; chance: number; seconds: number; v: number; x: number };

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

/**
 * A chunk's base damage before scaling, with the multiplier each damaging ailment applies to it. Ailments are
 * calculated from base damage separately from hits: attack, spell, melee, projectile, area and weapon modifiers never
 * reach them, only damage-over-time, ailment-tagged, damage-type and generic ones (3.9, AUDIT-3.9).
 */
export type AilChunk = {
  type: number;
  min: number;
  max: number;
  /** Multipliers for ignite, bleed and poison (damage modifiers and the damage over time multiplier). */
  k: [number, number, number];
};

export type HandProfile = {
  /** Post-scaling ranges (step 4): the hit's damage "H" before crit and mitigation. */
  chunks: Chunk[];
  /** The same chunks as damaging ailments see them (parallel to `chunks`). */
  ailChunks: AilChunk[];
  /** Extra multiplier on hit damage only (mods tagged 'hit'). */
  hitMult: number;
  critChance: number;
  critMulti: number;
  accuracy: number;
  /** Seconds per use with this hand (before action-speed modifiers). */
  time: number;
  range: number;
};

export type AilmentSpec = { chance: number; dur: number };

/** A skill's own damage over time (docs/SPIRIT.md S7): what it deals a second once the character's modifiers are on it, and how long. */
export type SkillDotProfile = { spec: DotSpec; type: number; dps: number; seconds: number };

export type SkillProfile = {
  skill: SkillDef;
  isAttack: boolean;
  tagMask: number;
  hands: HandProfile[];
  /** Average seconds per use. */
  useTime: number;
  /** Extra times the skill fires after each use (Echoing Cast): a use lands 1 + repeats times. */
  repeats: number;
  /** Times one use hits a target that stays put: more than one for a zone that pulses (rain, a cloud). */
  pulses: number;
  /** What the character's minion modifiers do to minions this skill summons: damage and speed multipliers, extra minions. */
  minionDamage: number;
  /** Multiplier on how long a deployable, a timed minion or a zone lasts. */
  skillDuration: number;
  minionSpeed: number;
  /** Multipliers on their life and on the damage they take. */
  minionLife: number;
  minionTaken: number;
  /** Percent of its life a minion mends each second (minions have none of their own). */
  minionRegen: number;
  /** Percent of physical damage reduction and chance to block that the minions have. */
  minionPhysReduction: number;
  minionBlock: number;
  minionCount: number;
  /** How many totems or brands can stand, or traps or mines go off, at once (1 and the support mods). */
  deployCount: number;
  cost: number;
  /** Ignite: `max` ignites can burn at once (the strongest count); `speed` makes them deal their damage faster. */
  ignite: AilmentSpec & { max: number; speed: number };
  bleed: AilmentSpec & { speed: number };
  poison: AilmentSpec & { speed: number };
  /** Damage over time the skill inflicts as a debuff of its own, and Decay's flat damage over time on every hit. */
  skillDot: SkillDotProfile | null;
  decay: { dps: number; seconds: number } | null;
  /** More damage with hits for each poison on the target, in percent, up to this many poisons (Vile Toxins). */
  perPoison: { per: number; max: number } | null;
  /** The tiles around an afflicted enemy to which its ignite, and its other elemental ailments, spread. */
  spreadAil: { ignite: number; ele: number };
  /** Seconds a support makes what the skill puts down stand (Blastchain and High-Impact Mine: five). */
  deploySeconds: number;
  /** Percent more damage for each mine that has gone off before in the sequence (Chained Charges). */
  mineChain: number;
  /** The percent chance to deal double damage that each mine adds to hits against enemies near it (High-Impact Mine). */
  mineDouble: number;
  /** Chance (fraction) that a hit deals double damage. */
  doubleChance: number;
  /** Percentage points (fraction) taken off the physical damage reduction of what the skill hits. */
  enemyPhysRed: number;
  /** The share (fraction) by which the skill lowers the chance of what it hits to block. */
  enemyBlockLess: number;
  /** The statuses a hit of the skill can inflict (docs/SPIRIT.md S3), with their chances, lengths and magnitudes. */
  statuses: StatusRoll[];
  /** How the projectiles go: one after another, each able to hit the same enemy, side by side, down in a ring, scattering, forking. */
  projMode: {
    sequential: boolean;
    shotgun: boolean;
    parallel: boolean;
    nova: boolean;
    tornado: boolean;
    fork: boolean;
  };
  /** Chance (fraction) that a hit exposes the enemy to the element it took the most damage from. */
  exposure: number;
  /** Chance (fraction) that a hit makes a monster flee. */
  fleeChance: number;
  shock: { chance: number; effect: number; dur: number };
  chill: { effect: number; dur: number };
  freeze: { chance: number; dur: number };
  cannotInflictEle: boolean;
  /**
   * Impale: the chance a hit impales, the share of its physical damage each impale records, how many hits each lasts, and
   * how many can be on one target (3.9).
   */
  impale: { chance: number; share: number; hits: number; max: number };
  /** A hit that leaves the target at 10% life or less kills it. */
  culling: boolean;
  /** Damage types (indices) that can inflict each ailment: its own, plus any a rule allows. */
  ailmentFrom: { ignite: number[]; shock: number[]; chill: number[]; freeze: number[] };
  alwaysFreezeOnCrit: boolean;
  /** Leech from critical strikes is instant. */
  instantLeechOnCrit: boolean;
  /** All leech from this skill's hits is instant. */
  instantLeechAlways: boolean;
  /** Extra reach of melee skills, in tiles. */
  rangeBonus: number;
  /** Mods of the skill and its supports that give charges, buffs, rage or recovery on events (set by the Character). */
  gains: Mod[];
  leechLife: number[];
  leechMana: number[];
  lifeOnHit: number;
  manaOnHit: number;
  /** Energy shield gained for each hit. */
  esOnHit: number;
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
/** How long Decay lasts, in seconds (3.9: eight). */
const DECAY_SECONDS = 8;
/** Skills that are put down or summoned rather than used by the character. */
const DEPLOYED_TAGS = tagMask(['totem', 'trap', 'mine', 'brand', 'minion']);

/**
 * The keywords of a skill that reach the damage of its ailments (3.9): what kind of skill it is, the element it is, and
 * what it is put down or summoned as. The modifiers that scale hits (attack, spell, melee, projectile, area, and the
 * weapon held) are not among them; "ailment damage while wielding a sword" is a condition instead.
 */
const AILMENT_KEYWORDS = tagMask([
  'attackSkill',
  'totem',
  'trap',
  'mine',
  'brand',
  'minion',
  'aura',
  'curse',
  'warcry',
  'herald',
  'guard',
  'movement',
  'channelling',
  'fire',
  'cold',
  'lightning',
  'chaos',
  'physical',
]);

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
  const baseTags = maskOr(
    maskOr(tagMask(skill.tags), tagMask(inp.extraTags)),
    isAttack ? tagBit('attackSkill') : 0,
  );
  const baseCtx = ctxOf(baseTags, conds, statValue);
  const avatar = db.flag('avatarOfFire', baseCtx);
  const neverCrit = db.flag('neverCrit', baseCtx);
  const overload = db.flag('feverPitch', baseCtx);
  const noEle = db.flag('noElementalDamage', baseCtx);
  const noPhys = db.flag('noPhysicalDamage', baseCtx);
  const noChaos = db.flag('noChaosDamage', baseCtx);
  const spellBit = tagBit('spell');
  const idleHands = db.flag('idleHands', baseCtx);
  const spellIncOnAttacks = isAttack && db.flag('spellIncAppliesToAttacks', baseCtx);

  function handProfile(hand: HandStats | null): HandProfile {
    const tags = maskOr(baseTags, hand ? tagMask(hand.tags) : 0);
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
    // Idle Hands: only what is put down or summoned deals damage.
    if (idleHands && maskAnd(tags, DEPLOYED_TAGS) === 0) chunks = [];
    if (noEle) chunks = chunks.filter((c) => c.type === PHYS || c.type === CHAOS);
    if (noPhys) chunks = chunks.filter((c) => c.type !== PHYS);
    if (noChaos) chunks = chunks.filter((c) => c.type !== CHAOS);
    // Step 4: scaling.
    const hitTag = tagBit('hit');
    let hitMultAcc = 0;
    let hitW = 0;
    const ailChunks: AilChunk[] = [];
    // Only conditions about the player reach damage over time.
    const ownConds = maskAnd(conds, db.cond.all - db.cond.targetMask());
    const ailTags = (tag: SkillTag) =>
      maskOr(maskOr(DOT_TAGS, tagBit(tag)), maskAnd(tags, AILMENT_KEYWORDS));
    // "Damage over Time Multiplier": added to the ailment's damage as a share of it.
    const ak = (tag: SkillTag, anc: number) => {
      const c = ctxOf(ailTags(tag), ownConds, statValue, anc);
      return db.mult('damage', c) * (1 + Math.max(-0.9, db.sum('base', 'dotMulti', c) / 100));
    };
    for (const c of chunks) {
      const cctx = { ...ctx, ancestry: c.anc };
      // An ailment takes the modifiers of the type it deals (ignite fire, bleed physical, poison chaos), whatever type
      // the hit was, and no condition on the target (3.9).
      ailChunks.push({
        type: c.type,
        min: c.min,
        max: c.max,
        k: [ak('ignite', 1 << FIRE), ak('bleed', 1 << PHYS), ak('poison', 1 << CHAOS)],
      });
      let m = db.mult('damage', cctx);
      if (spellIncOnAttacks) {
        // Increases and reductions to spell damage also apply (not "more" mods).
        const inc = db.inc('damage', { ...cctx, tags: maskOr(tags, spellBit) });
        m = Math.max(0, 1 + inc) * db.more('damage', cctx);
      }
      c.min *= m * db.mult('minDamage', cctx);
      c.max *= m * db.mult('maxDamage', cctx);
      const hm = db.mult('damage', { ...cctx, tags: maskOr(tags, hitTag) }, hitTag);
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
      ailChunks,
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

  const ailment = (chanceStat: string, durStat: string, baseDur: number) => ({
    chance: clamp(db.sum('base', chanceStat, baseCtx) / 100, 0, 1),
    dur: baseDur * db.mult(durStat, baseCtx),
  });

  /** Ignites can burn faster (more damage a second, for less time) and, rarely, more than one at once. */
  const igniteSpec = () => {
    const raw = ailment('chance.ignite', 'duration.ignite', IGNITE_DURATION);
    const speed = Math.max(0.1, 1 + db.inc('ignite.speed', baseCtx));
    return {
      ...raw,
      dur: raw.dur / speed,
      speed,
      max: 1 + Math.max(0, Math.floor(db.sum('base', 'ignite.extra', baseCtx))),
    };
  };

  /** Bleeding and poison can also deal their damage faster, for a shorter time. */
  const timed = (kind: 'bleed' | 'poison', raw: AilmentSpec) => {
    const speed = Math.max(0.1, 1 + db.inc(`${kind}.speed`, baseCtx));
    return { ...raw, dur: raw.dur / speed, speed };
  };

  // Damage over time of its own: the table's damage a second, scaled by damage over time, the skill's keywords and its type.
  const ownConds = maskAnd(conds, db.cond.all - db.cond.targetMask());
  const dotMult = (type: number, scales: number) => {
    const c = ctxOf(
      maskOr(maskOr(DOT_TAGS, maskAnd(baseTags, AILMENT_KEYWORDS)), scales),
      ownConds,
      statValue,
      1 << type,
    );
    return db.mult('damage', c) * (1 + Math.max(-0.9, db.sum('base', 'dotMulti', c) / 100));
  };
  const lasting = skill.tags.includes('duration') ? db.mult('skillDuration', baseCtx) : 1;
  const skillDot: SkillDotProfile | null = skill.dot
    ? {
        spec: skill.dot,
        type: DAMAGE_TYPES.indexOf(skill.dot.type),
        dps:
          levelValue(skill.dot.dps, skill.level, true) *
          dotMult(DAMAGE_TYPES.indexOf(skill.dot.type), tagMask(skill.dot.scales ?? [])),
        seconds: skill.dot.seconds * lasting,
      }
    : null;
  const decayBase = db.sum('base', 'dot.decay', baseCtx);
  const perPoisonPer = db.sum('base', 'perPoison.more', baseCtx);

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
    pulses:
      beh.kind === 'ground'
        ? Math.max(1, Math.floor((beh.duration * db.mult('skillDuration', baseCtx)) / beh.interval))
        : 1,
    deployCount: Math.max(1, Math.round(1 + db.sum('base', 'deployCount', baseCtx))),
    deploySeconds: db.sum('base', 'deploySeconds', baseCtx),
    mineChain: db.sum('base', 'mine.chain', baseCtx),
    mineDouble: db.sum('base', 'mine.double', baseCtx),
    minionDamage: db.mult('minionDamage', baseCtx),
    skillDuration: db.mult('skillDuration', baseCtx),
    minionSpeed: db.mult('minionSpeed', baseCtx),
    minionLife: db.mult('minionLife', baseCtx),
    minionTaken: db.mult('minionTaken', baseCtx),
    minionRegen: db.sum('base', 'minionRegen', baseCtx),
    minionPhysReduction: db.sum('base', 'minionPhysReduction', baseCtx),
    minionBlock: db.sum('base', 'minionBlock', baseCtx),
    minionCount: Math.round(db.sum('base', 'minionCount', baseCtx)),
    cost: Math.max(
      0,
      Math.round(
        skill.cost * inp.costMult * db.mult('cost', baseCtx) + db.sum('base', 'costFlat', baseCtx),
      ),
    ),
    ignite: igniteSpec(),
    bleed: timed(
      'bleed',
      isAttack
        ? ailment('chance.bleed', 'duration.bleed', BLEED_DURATION)
        : { chance: 0, dur: BLEED_DURATION },
    ),
    poison: timed('poison', ailment('chance.poison', 'duration.poison', POISON_DURATION)),
    doubleChance: clamp(db.sum('base', 'doubleDamage', baseCtx) / 100, 0, 1),
    enemyPhysRed: db.sum('base', 'enemyPhysReduction', baseCtx) / 100,
    enemyBlockLess: clamp(db.sum('base', 'enemyBlockReduction', baseCtx) / 100, 0, 1),
    statuses: STATUS_IDS.flatMap((id): StatusRoll[] => {
      const chance = db.sum('base', statusChance(id), baseCtx) / 100;
      if (chance <= 0) return [];
      const d = STATUSES[id];
      return [
        {
          id,
          chance: clamp(chance, 0, 1),
          seconds:
            (db.sum('base', statusSeconds(id), baseCtx) || d.seconds) *
            db.mult('statusDuration', baseCtx),
          v: db.sum('base', statusMagnitude(id), baseCtx) || d.v,
          x: db.sum('base', statusExtra(id), baseCtx),
        },
      ];
    }),
    exposure: clamp(db.sum('base', 'status.exposure.chance', baseCtx) / 100, 0, 1),
    projMode: {
      sequential: db.flag('projectilesSequential', baseCtx),
      shotgun: db.flag('projectilesShotgun', baseCtx),
      parallel: db.flag('projectilesParallel', baseCtx),
      nova: db.flag('arrowNova', baseCtx),
      tornado: db.flag('tornadoShot', baseCtx),
      fork: db.flag('projectilesFork', baseCtx),
    },
    fleeChance: clamp(db.sum('base', FLEE_CHANCE, baseCtx) / 100, 0, 1),
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
    skillDot,
    decay:
      decayBase > 0
        ? { dps: decayBase * dotMult(CHAOS, 0), seconds: DECAY_SECONDS * lasting }
        : null,
    perPoison:
      perPoisonPer > 0
        ? { per: perPoisonPer, max: Math.round(db.sum('base', 'perPoison.max', baseCtx)) }
        : null,
    spreadAil: {
      ignite: db.sum('base', 'spread.ignite', baseCtx),
      ele: db.sum('base', 'spread.ele', baseCtx),
    },
    impale: {
      chance: clamp(db.sum('base', 'chance.impale', baseCtx) / 100, 0, 1),
      share: IMPALE_SHARE * Math.max(0, 1 + db.inc('impaleEffect', baseCtx)),
      hits: IMPALE_HITS + Math.round(db.sum('base', 'impaleHits', baseCtx)),
      max: IMPALE_MAX + Math.round(db.sum('base', 'maxImpale', baseCtx)),
    },
    culling: db.flag('cullingStrike', baseCtx),
    ailmentFrom: {
      ignite: ailmentSources('Ignite', FIRE),
      shock: ailmentSources('Shock', LIGHT),
      chill: ailmentSources('Chill', COLD),
      freeze: ailmentSources('Freeze', COLD),
    },
    alwaysFreezeOnCrit: db.flag('alwaysFreezeOnCrit', baseCtx),
    instantLeechOnCrit: db.flag('instantLeechOnCrit', baseCtx),
    instantLeechAlways: db.flag('instantLeechAlways', baseCtx),
    gains: [],
    rangeBonus: beh.kind === 'melee' ? db.sum('base', 'meleeRange', baseCtx) : 0,
    leechLife: perType('leech.life').map((v) => v * db.mult('leechRecovery', baseCtx)),
    leechMana: perType('leech.mana').map((v) => v * db.mult('leechRecovery', baseCtx)),
    lifeOnHit: db.sum('base', 'lifeOnHit', baseCtx),
    manaOnHit: db.sum('base', 'manaOnHit', baseCtx),
    esOnHit: db.sum('base', 'esOnHit', baseCtx),
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

const formedCache = new WeakMap<SkillProfile, SkillProfile>();
/** A projectile that has changed form (Frost Lance): the same skill with its far better chance to crit and its bigger multiplier. */
export function formedProfile(p: SkillProfile): SkillProfile {
  const f = p.skill.form;
  if (!f) return p;
  let q = formedCache.get(p);
  if (!q) {
    const add = levelValue(f.critMulti, p.skill.level) / 100;
    q = {
      ...p,
      hands: p.hands.map((h) => ({
        ...h,
        critChance: Math.min(1, h.critChance * (1 + f.critMore / 100)),
        critMulti: h.critMulti + add,
      })),
    };
    formedCache.set(p, q);
  }
  return q;
}

/** Distance-based damage multiplier for projectile skills (Close Quarters, falloff). */
export function distanceMult(p: SkillProfile, d: number): number {
  let m = 1;
  const b = p.skill.behaviour;
  if (b.kind === 'projectile') {
    if (p.closeQuarters && p.isAttack) m *= 1.3 - (0.8 * (clamp(d, 1, 8) - 1)) / 7;
    if (b.falloff !== undefined && b.range) m *= 1 - (1 - b.falloff) * clamp(d / b.range, 0, 1);
  }
  return m;
}

export function typeIndex(t: DamageType): number {
  return DAMAGE_TYPES.indexOf(t);
}
