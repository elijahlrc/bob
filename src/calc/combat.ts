import type { Rng } from '../core/rng';
import {
  BLEED_DPS_FRAC,
  CHILL_CAP,
  CRIT_AILMENT_MULT,
  FREEZE_MAX,
  FREEZE_PER_R,
  IGNITE_DPS_FRAC,
  MIN_FREEZE,
  MIN_SHOCK_CHILL,
  MONSTER_BLEED_DPS_FRAC,
  POISON_DPS_FRAC,
  SHOCK_CAP,
  STUN_BASE_DURATION,
  STUN_ES_IGNORE,
  STUN_MELEE_PHYS,
  STUN_MIN_CHANCE,
  STUN_NON_MELEE_NON_PHYS,
} from '../data/constants';
import { DAMAGE_TYPES, maskIntersects, tagBit } from '../mods/types';
import { armourReduction, effectiveRes, hitChance, mag, stunChance } from './formulas';
import {
  CHAOS,
  COLD,
  distanceMult,
  FIRE,
  LIGHT,
  PHYS,
  type HandProfile,
  type SkillProfile,
} from './skill';

const NT = DAMAGE_TYPES.length;

/** Resolved defensive stats of any combatant (player, monster, training dummy). */
export type AilmentName = 'ignite' | 'shock' | 'chill' | 'freeze' | 'bleed' | 'poison';
export const AILMENT_NAMES: AilmentName[] = [
  'ignite',
  'shock',
  'chill',
  'freeze',
  'bleed',
  'poison',
];

export type Defence = {
  /** The player (ailments from monsters differ: a monster's bleed deals less). */
  isPlayer: boolean;
  maxLife: number;
  maxEs: number;
  maxMana: number;
  armour: number;
  evasion: number;
  /** Fractions 0..1 (already capped). */
  blockAttack: number;
  blockSpell: number;
  /** Raw resistance per type (percent) before the cap. */
  res: number[];
  maxRes: number[];
  /** Additional physical damage reduction, fraction. */
  physReduction: number;
  /** Multiplier on damage taken (before shock). */
  damageTakenMult: number;
  /** Multiplier on damage taken from hits only, not from damage over time (Fortify). */
  hitTakenMult: number;
  ailmentThreshold: number;
  stunThreshold: number;
  /** Fraction 0..1. */
  stunAvoid: number;
  /** Multiplier on stun duration suffered. */
  stunDurOnSelf: number;
  cannotBeStunned: boolean;
  cannotEvade: boolean;
  evadeProj: number;
  evadeMelee: number;
  immuneChaos: boolean;
  manaBeforeLife: number;
  cannotBeChilled: boolean;
  cannotBeFrozen: boolean;
  lifeRegen: number;
  esRecharge: number;
  esDelay: number;
  manaRegen: number;
  lifeOnBlockPct: number;
  moveSpeed: number;
  /** Energy shield protects mana instead of life (and pays costs). */
  esProtectsMana: boolean;
  noLifeRegen: boolean;
  instantLeech: boolean;
  leechToEs: boolean;
  regenToEs: boolean;
  /** Chaos damage hits energy shield before life. */
  chaosHitsEs: boolean;
  /** Share (fraction) of physical hit damage taken as each type; index = damage type. */
  physTakenAs: number[];
  /** More or less damage taken of each type; index = damage type. */
  damageTakenType: number[];
  /** Shock does nothing to this actor. */
  unaffectedByShock: boolean;
  /** Hits against it leech nothing. */
  cannotBeLeechedFrom: boolean;
  /** No ailments at all. */
  immuneAilments: boolean;
  /** Immune to this element (index = damage type): no damage and no matching ailment. */
  immune: boolean[];
  /** Chance (fraction) to avoid each ailment when it would be inflicted. */
  avoid: Record<AilmentName, number>;
  /** Multiplier on how long each ailment lasts on this actor. */
  durOnSelf: Record<AilmentName, number>;
  /** Flat damage taken from each attack hit, by type (negative: less). */
  flatTakenAttack: number[];
  /** Damage dealt back to a melee attacker per hit, by type, and the share of the physical damage taken that is reflected. */
  reflect: number[];
  reflectPhysPct: number;
  /** Multiplier on how fast leech is recovered (increased Life Leeched per second). */
  leechRate: number;
  /** Moving while bleeding does not make the bleed hurt more. */
  noMovingBleed: boolean;
  /** Chance (fraction) to dodge an attack hit, and a spell hit: the hit does nothing, apart from evasion. */
  dodgeAttack: number;
  dodgeSpell: number;
};

/** Dynamic state of the target at hit time. */
export type TargetState = {
  def: Defence;
  /** Current shock (increased damage taken, fraction). */
  shock: number;
  /** Energy shield the target has right now (a stun is sometimes ignored while it is up). */
  es?: number;
  /** Prismatic Balance resistance shifts per type, percent. */
  resShift: number[];
  /** Open Wounds: increased physical damage taken, as a fraction. */
  vuln?: number;
  /** Increased damage taken of every type, as a fraction (curses and marks). */
  vulnAll?: number;
};

export const NO_SHIFT: readonly number[] = [0, 0, 0, 0, 0];

export type HitOutcome = 'miss' | 'block' | 'hit';

export type AilmentResult = {
  ignite: number;
  bleed: number;
  poison: number;
  shock: number;
  chill: number;
  freeze: number;
};

/** Base damage per damage type as each damaging ailment sees it (see `AilChunk`). */
export type AilBase = { ignite: number[]; bleed: number[]; poison: number[] };

export function emptyAilBase(): AilBase {
  return { ignite: [0, 0, 0, 0, 0], bleed: [0, 0, 0, 0, 0], poison: [0, 0, 0, 0, 0] };
}

export type HitResult = {
  outcome: HitOutcome;
  crit: boolean;
  /** Post-mitigation damage per type (before routing to ES/life). */
  dmg: number[];
  /** Physical damage after crit, before mitigation: what an impale records. */
  rawPhys?: number;
  total: number;
  /** Rolled pre-crit, pre-mitigation damage per type ("H"). */
  H: number[];
  /** The same roll as the damaging ailments see it. */
  HA?: AilBase;
  ailments: AilmentResult;
  stun: number;
};

export function emptyAilments(): AilmentResult {
  return { ignite: 0, bleed: 0, poison: 0, shock: 0, chill: 0, freeze: 0 };
}

/** Chance that an attack from this hand hits (evasion and evade bonuses). */
export function attackHitChance(p: SkillProfile, hand: HandProfile, def: Defence): number {
  if (!p.isAttack || p.alwaysHit || def.cannotEvade) return 1;
  let c = hitChance(hand.accuracy, def.evasion);
  const isProj = p.skill.behaviour.kind === 'projectile';
  const bonus = isProj ? def.evadeProj : def.evadeMelee;
  if (bonus) c = Math.min(1, Math.max(0.05, c * (1 - bonus)));
  return c * (1 - def.dodgeAttack);
}

export function blockChance(p: SkillProfile, def: Defence): number {
  return p.isAttack ? def.blockAttack : def.blockSpell;
}

/** Move the "taken as" share of a physical hit into other types, before mitigation. Mutates `dmg`. */
export function takenAs(def: Defence, dmg: number[]): number[] {
  const phys = dmg[PHYS];
  if (phys <= 0) return dmg;
  let moved = 0;
  for (let i = 1; i < NT; i++) {
    const s = def.physTakenAs[i];
    if (s > 0) {
      dmg[i] += phys * s;
      moved += s;
    }
  }
  if (moved > 0) dmg[PHYS] = phys * (1 - moved);
  return dmg;
}

/** The damage multiplier from shock on a target (shock does nothing to those unaffected by it). */
export function shockTaken(def: Defence, shock: number): number {
  return def.unaffectedByShock ? 1 : 1 + shock;
}

/** Mitigate one hit's per-type damage (crit already applied). Mutates and returns `dmg`. */
export function mitigate(p: SkillProfile, t: TargetState, dmg: number[]): number[] {
  const def = t.def;
  takenAs(def, dmg);
  if (p.isAttack)
    for (let i = 0; i < NT; i++)
      if (dmg[i] > 0 && def.flatTakenAttack[i] !== 0)
        dmg[i] = Math.max(0, dmg[i] + def.flatTakenAttack[i]);
  const taken = def.damageTakenMult * def.hitTakenMult * shockTaken(def, t.shock);
  for (let i = 0; i < NT; i++) {
    if (dmg[i] <= 0) continue;
    if (def.immune[i]) {
      dmg[i] = 0;
      continue;
    }
    if (i === PHYS) {
      const armour = def.armour * (1 - p.armourIgnore);
      const red = Math.min(
        0.9,
        armourReduction(armour, dmg[i]) + def.physReduction - p.enemyPhysRed,
      );
      dmg[i] *= 1 - red;
    } else if (i === CHAOS && def.immuneChaos) {
      dmg[i] = 0;
    } else {
      const r = effectiveRes(def.res[i] + t.resShift[i], def.maxRes[i], p.pen[i]);
      dmg[i] *= 1 - r / 100;
    }
    dmg[i] *= taken * def.damageTakenType[i];
    if (i === PHYS && t.vuln) dmg[i] *= 1 + t.vuln;
    if (t.vulnAll) dmg[i] *= 1 + t.vulnAll;
  }
  return dmg;
}

/** §6.6 ailment magnitudes from one hit. H is pre-crit, pre-mitigation. */
export function ailmentsFromHit(
  p: SkillProfile,
  hand: HandProfile,
  H: number[],
  HA: AilBase,
  crit: boolean,
  t: TargetState,
  roll: (chance: number) => boolean,
): AilmentResult {
  const def = t.def;
  const a = emptyAilments();
  if (def.immuneAilments) return a;
  // 3.9: ailments from a critical strike carry a fixed 150%, whatever the critical strike multiplier.
  const agony = crit ? (p.cruelAgony ? hand.critMulti : CRIT_AILMENT_MULT) : 1;
  const resMult = (i: number) => {
    if (def.immune[i] || (i === CHAOS && def.immuneChaos)) return 0;
    // Penetration does not apply to damage over time (3.9).
    const r = effectiveRes(def.res[i] + t.resShift[i], def.maxRes[i]);
    return 1 - r / 100;
  };
  // The damage that can inflict an ailment: its own type, plus any type a rule allows.
  const from = (types: number[]) => types.reduce((s, i) => s + H[i], 0);
  const thresh = Math.max(1, def.ailmentThreshold);
  const ele = !p.cannotInflictEle;
  const ignH = p.ailmentFrom.ignite.reduce((s, i) => s + HA.ignite[i], 0);
  if (ele && ignH > 0 && !def.immune[FIRE] && (crit || roll(p.ignite.chance))) {
    const hm = p.ailmentFrom.ignite.reduce((s, i) => s + HA.ignite[i] * resMult(i), 0);
    a.ignite = IGNITE_DPS_FRAC * hm * agony * p.ignite.speed;
  }
  if (p.isAttack && HA.bleed[PHYS] > 0 && roll(p.bleed.chance)) {
    a.bleed =
      (def.isPlayer ? MONSTER_BLEED_DPS_FRAC : BLEED_DPS_FRAC) *
      HA.bleed[PHYS] *
      agony *
      p.bleed.speed;
  }
  const poisonH = HA.poison[PHYS] + HA.poison[CHAOS];
  if (poisonH > 0 && roll(p.poison.chance)) {
    a.poison = POISON_DPS_FRAC * poisonH * agony * resMult(CHAOS) * p.poison.speed;
  }
  const shockH = from(p.ailmentFrom.shock);
  if (
    ele &&
    shockH > 0 &&
    !def.immune[LIGHT] &&
    !def.unaffectedByShock &&
    (crit || roll(p.shock.chance))
  ) {
    const e = mag(shockH / thresh, SHOCK_CAP, p.shock.effect);
    if (e >= MIN_SHOCK_CHILL) a.shock = e / 100;
  }
  if (ele && !def.immune[COLD]) {
    const chillH = from(p.ailmentFrom.chill);
    if (chillH > 0 && !def.cannotBeChilled) {
      const e = mag(chillH / thresh, CHILL_CAP, p.chill.effect);
      if (e >= MIN_SHOCK_CHILL) a.chill = e / 100;
    }
    const freezeH = from(p.ailmentFrom.freeze);
    const freezeCrit = crit || (p.alwaysFreezeOnCrit && crit);
    if (freezeH > 0 && !def.cannotBeFrozen && (freezeCrit || roll(p.freeze.chance))) {
      const d = Math.min(FREEZE_MAX, FREEZE_PER_R * (freezeH / thresh)) * p.freeze.dur;
      if (d >= MIN_FREEZE) a.freeze = d;
    }
  }
  return a;
}

/** §6.6a stun: returns the stun duration (0 if no stun). `canStun` covers grace and immunity. */
export function stunFromHit(
  p: SkillProfile,
  dmg: number[],
  def: Defence,
  canStun: boolean,
  rng: Rng | null,
  esUp = false,
): { chance: number; duration: number } {
  if (!canStun || def.cannotBeStunned) return { chance: 0, duration: 0 };
  // 3.9: melee physical damage stuns best (x1.25), non-melee non-physical worst (x0.75).
  const melee = maskIntersects(p.tagMask, tagBit('melee'));
  let s = 0;
  for (let i = 0; i < NT; i++) {
    const w = i === PHYS ? (melee ? STUN_MELEE_PHYS : 1) : melee ? 1 : STUN_NON_MELEE_NON_PHYS;
    s += dmg[i] * w;
  }
  s *= p.stunDamageMult;
  const eff = def.stunThreshold * (1 - p.enemyStunThreshRed);
  const chance = stunChance(s, eff, STUN_MIN_CHANCE);
  const duration = STUN_BASE_DURATION * p.stunDurMult * def.stunDurOnSelf;
  // While energy shield is up, half of all stuns are ignored (not with Eldritch Battery-style rules).
  const ignore = esUp && !def.esProtectsMana ? STUN_ES_IGNORE : 0;
  if (!rng) return { chance: chance * (1 - def.stunAvoid) * (1 - ignore), duration };
  if (chance <= 0 || !rng.chance(chance)) return { chance, duration: 0 };
  if (def.stunAvoid > 0 && rng.chance(def.stunAvoid)) return { chance, duration: 0 };
  if (ignore > 0 && rng.chance(ignore)) return { chance, duration: 0 };
  return { chance, duration };
}

/** Resolve one hit with rolls (sim). */
export function resolveHit(
  rng: Rng,
  p: SkillProfile,
  hand: HandProfile,
  t: TargetState,
  dist: number,
  canStun: boolean,
  isSpellHit = !p.isAttack,
): HitResult {
  const res: HitResult = {
    outcome: 'hit',
    crit: false,
    dmg: [0, 0, 0, 0, 0],
    total: 0,
    H: [0, 0, 0, 0, 0],
    HA: undefined,
    ailments: emptyAilments(),
    stun: 0,
  };
  if (!isSpellHit && !rng.chance(attackHitChance(p, hand, t.def))) {
    res.outcome = 'miss';
    return res;
  }
  if (isSpellHit && t.def.dodgeSpell > 0 && rng.chance(t.def.dodgeSpell)) {
    res.outcome = 'miss';
    return res;
  }
  const blk = blockChance(p, t.def);
  if (blk > 0 && rng.chance(blk)) {
    res.outcome = 'block';
    return res;
  }
  const dm = distanceMult(p, dist);
  const ha = emptyAilBase();
  res.HA = ha;
  for (let i = 0; i < hand.chunks.length; i++) {
    const c = hand.chunks[i];
    const u = rng.next();
    res.H[c.type] += (c.min + u * (c.max - c.min)) * dm;
    const ac = hand.ailChunks[i];
    const base = (ac.min + u * (ac.max - ac.min)) * dm;
    ha.ignite[c.type] += base * ac.k[0];
    ha.bleed[c.type] += base * ac.k[1];
    ha.poison[c.type] += base * ac.k[2];
  }
  // 3.9: an attack must also pass an accuracy check to confirm a critical strike.
  res.crit =
    hand.critChance > 0 &&
    rng.chance(hand.critChance) &&
    (isSpellHit || rng.chance(attackHitChance(p, hand, t.def)));
  let cm = (res.crit ? hand.critMulti * (p.cruelAgony ? 0.7 : 1) : 1) * hand.hitMult;
  // Double damage doubles the hit before it is mitigated (and rolls only when something gives the chance).
  if (p.doubleChance > 0 && rng.chance(p.doubleChance)) cm *= 2;
  for (let i = 0; i < NT; i++) res.dmg[i] = res.H[i] * cm;
  res.rawPhys = res.dmg[PHYS];
  mitigate(p, t, res.dmg);
  for (let i = 0; i < NT; i++) res.total += res.dmg[i];
  res.ailments = ailmentsFromHit(
    p,
    hand,
    res.H,
    res.HA,
    res.crit,
    t,
    (c) => c > 0 && rng.chance(c),
  );
  res.stun = stunFromHit(p, res.dmg, t.def, canStun, rng, (t.es ?? 0) > 0).duration;
  return res;
}

// ---------------------------------------------------------------------------------------------
// Expected values (calc engine). Same formulas as above, averaged instead of rolled.

export type ExpectedHit = {
  hitChance: number;
  blockChance: number;
  /** Expected post-mitigation damage per landed hit (crit-weighted), per type. */
  perType: number[];
  /** Expected damage per use attempt (includes hit and block chance). */
  perUse: number;
  avgHitNonCrit: number;
  avgH: number[];
  /** The average hit as the damaging ailments see it. */
  avgHA: AilBase;
  /** Chance that a landed hit is a critical strike (an attack must also confirm it with a second hit roll). */
  critGivenHit: number;
  stunChance: number;
};

export function expectedHit(
  p: SkillProfile,
  hand: HandProfile,
  t: TargetState,
  dist: number,
): ExpectedHit {
  const dm = distanceMult(p, dist);
  const avgH = [0, 0, 0, 0, 0];
  const avgHA = emptyAilBase();
  hand.chunks.forEach((c, i) => {
    avgH[c.type] += ((c.min + c.max) / 2) * dm;
    const ac = hand.ailChunks[i];
    const base = ((ac.min + ac.max) / 2) * dm;
    avgHA.ignite[c.type] += base * ac.k[0];
    avgHA.bleed[c.type] += base * ac.k[1];
    avgHA.poison[c.type] += base * ac.k[2];
  });
  // Double damage, on average, scales the hit before it is mitigated.
  const dbl = 1 + p.doubleChance;
  const nonCrit = mitigate(
    p,
    t,
    avgH.map((h) => h * hand.hitMult * dbl),
  );
  const critM = hand.critMulti * (p.cruelAgony ? 0.7 : 1);
  const crit = mitigate(
    p,
    t,
    avgH.map((h) => h * hand.hitMult * critM * dbl),
  );
  const hc = p.isAttack ? attackHitChance(p, hand, t.def) : 1 - t.def.dodgeSpell;
  // An attack confirms a critical strike with a second accuracy check (3.9).
  const cc = hand.critChance * (p.isAttack ? hc : 1);
  const perType = nonCrit.map((n, i) => n * (1 - cc) + crit[i] * cc);
  // Impale: each landed hit also deals the damage the impales on the target recorded, as reflected physical damage.
  if (p.impale.chance > 0 && avgH[PHYS] > 0) {
    const stacks = Math.min(p.impale.max, p.impale.hits * p.impale.chance);
    const rawPhys = avgH[PHYS] * hand.hitMult * (1 + cc * (critM - 1));
    const extra = mitigate(p, t, [stacks * p.impale.share * rawPhys, 0, 0, 0, 0]);
    perType[PHYS] += extra[PHYS];
  }
  const bc = blockChance(p, t.def);
  const total = perType.reduce((a, b) => a + b, 0);
  const esUp = (t.es ?? 0) > 0;
  const sNon = stunFromHit(p, nonCrit, t.def, true, null, esUp).chance;
  const sCrit = stunFromHit(p, crit, t.def, true, null, esUp).chance;
  return {
    hitChance: hc,
    blockChance: bc,
    perType,
    perUse: total * hc * (1 - bc),
    avgHitNonCrit: nonCrit.reduce((a, b) => a + b, 0),
    avgH,
    avgHA,
    critGivenHit: cc,
    stunChance: sNon * (1 - cc) + sCrit * cc,
  };
}

/**
 * Ignites burning at once, on average, when each of `n` hits in an ignite's lifetime ignites with
 * chance `ign` and at most `max` count. For one ignite this is the chance that at least one burns;
 * for more, the same hits are counted as a Poisson stream.
 */
export function expectedIgnites(ign: number, n: number, max: number): number {
  if (ign <= 0 || n <= 0) return 0;
  if (max <= 1) return 1 - Math.pow(1 - ign, n);
  if (ign >= 1) return Math.min(max, n);
  const mean = -n * Math.log(1 - ign);
  let term = Math.exp(-mean);
  let cdf = term; // P(K <= 0)
  let sum = 0;
  for (let k = 1; k <= max; k++) {
    sum += 1 - cdf; // P(K >= k)
    term *= mean / k;
    cdf += term;
  }
  return sum;
}

export type ExpectedAilments = {
  igniteDps: number;
  bleedDps: number;
  poisonDps: number;
  /** Average poison stacks at steady state. */
  poisonStacks: number;
};

/**
 * Steady-state ailment DPS against a stationary target (§8.1). Ignite and bleed: chance-weighted
 * uptime with only the strongest applying. Poison: stacking steady state.
 */
export function expectedAilments(
  p: SkillProfile,
  hand: HandProfile,
  t: TargetState,
  dist: number,
  usesPerSec: number,
  landChance: number,
): ExpectedAilments {
  const ex = expectedHit(p, hand, t, dist);
  const H = ex.avgH;
  const cc = ex.critGivenHit;
  const always = () => true;
  const non = ailmentsFromHit(p, hand, H, ex.avgHA, false, t, always);
  const cr = ailmentsFromHit(p, hand, H, ex.avgHA, true, t, always);
  const lands = usesPerSec * landChance;
  // Ignite: crits always ignite.
  const ign = p.cannotInflictEle ? 0 : cc + (1 - cc) * p.ignite.chance;
  const ignAvg = cc * cr.ignite + (1 - cc) * p.ignite.chance * non.ignite;
  const ignPer = ign > 0 ? ignAvg / ign : 0;
  const ignUptime = expectedIgnites(ign, lands * p.ignite.dur, p.ignite.max);
  const bl = p.bleed.chance;
  const blPer = cc * cr.bleed + (1 - cc) * non.bleed;
  const stacks = p.woundDance ? Math.min(8, lands * bl * p.bleed.dur) : 0;
  const blUptime = 1 - Math.pow(1 - bl, lands * p.bleed.dur);
  const bleedDps = p.woundDance ? blPer * stacks : blPer * blUptime;
  const po = p.poison.chance;
  const poPer = cc * cr.poison + (1 - cc) * non.poison;
  const poisonStacks = lands * po * p.poison.dur;
  return {
    igniteDps: ignPer * ignUptime,
    bleedDps,
    poisonDps: poPer * poisonStacks,
    poisonStacks,
  };
}

/** An ailment base where every ailment sees the same damage (tests and simple callers). */
export function ailBaseOf(H: number[]): AilBase {
  return { ignite: [...H], bleed: [...H], poison: [...H] };
}
