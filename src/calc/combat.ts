import type { Rng } from '../core/rng';
import {
  BLEED_DPS_FRAC,
  CHILL_CAP,
  FREEZE_MAX,
  FREEZE_PER_R,
  IGNITE_DPS_FRAC,
  MIN_FREEZE,
  MIN_SHOCK_CHILL,
  POISON_DPS_FRAC,
  SHOCK_CAP,
  STUN_BASE_DURATION,
  STUN_MIN_CHANCE,
  STUN_NON_PHYS,
} from '../data/constants';
import { DAMAGE_TYPES } from '../mods/types';
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
export type Defence = {
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
};

/** Dynamic state of the target at hit time. */
export type TargetState = {
  def: Defence;
  /** Current shock (increased damage taken, fraction). */
  shock: number;
  /** Prismatic Balance resistance shifts per type, percent. */
  resShift: number[];
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

export type HitResult = {
  outcome: HitOutcome;
  crit: boolean;
  /** Post-mitigation damage per type (before routing to ES/life). */
  dmg: number[];
  total: number;
  /** Rolled pre-crit, pre-mitigation damage per type ("H"). */
  H: number[];
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
  return c;
}

export function blockChance(p: SkillProfile, def: Defence): number {
  return p.isAttack ? def.blockAttack : def.blockSpell;
}

/** Mitigate one hit's per-type damage (crit already applied). Mutates and returns `dmg`. */
export function mitigate(p: SkillProfile, t: TargetState, dmg: number[]): number[] {
  const def = t.def;
  const taken = def.damageTakenMult * (1 + t.shock);
  for (let i = 0; i < NT; i++) {
    if (dmg[i] <= 0) continue;
    if (i === PHYS) {
      const red = Math.min(0.9, armourReduction(def.armour, dmg[i]) + def.physReduction);
      dmg[i] *= 1 - red;
    } else if (i === CHAOS && def.immuneChaos) {
      dmg[i] = 0;
    } else {
      const r = effectiveRes(def.res[i] + t.resShift[i], def.maxRes[i], p.pen[i]);
      dmg[i] *= 1 - r / 100;
    }
    dmg[i] *= taken;
  }
  return dmg;
}

/** §6.6 ailment magnitudes from one hit. H is pre-crit, pre-mitigation. */
export function ailmentsFromHit(
  p: SkillProfile,
  hand: HandProfile,
  H: number[],
  crit: boolean,
  t: TargetState,
  roll: (chance: number) => boolean,
): AilmentResult {
  const def = t.def;
  const a = emptyAilments();
  const agony = p.cruelAgony && crit ? hand.critMulti : 1;
  const resMult = (i: number) => {
    if (i === CHAOS && def.immuneChaos) return 0;
    const r = effectiveRes(def.res[i] + t.resShift[i], def.maxRes[i], p.pen[i]);
    return 1 - r / 100;
  };
  const thresh = Math.max(1, def.ailmentThreshold);
  const ele = !p.cannotInflictEle;
  if (ele && H[FIRE] > 0 && (crit || roll(p.ignite.chance))) {
    a.ignite = IGNITE_DPS_FRAC * H[FIRE] * p.ignite.mult * agony * resMult(FIRE);
  }
  if (p.isAttack && H[PHYS] > 0 && roll(p.bleed.chance)) {
    a.bleed = BLEED_DPS_FRAC * H[PHYS] * p.bleed.mult * agony;
  }
  if (H[PHYS] + H[CHAOS] > 0 && roll(p.poison.chance)) {
    a.poison = POISON_DPS_FRAC * (H[PHYS] + H[CHAOS]) * p.poison.mult * agony * resMult(CHAOS);
  }
  if (ele && H[LIGHT] > 0 && (crit || roll(p.shock.chance))) {
    const e = mag(H[LIGHT] / thresh, SHOCK_CAP) * p.shock.effect;
    if (e >= MIN_SHOCK_CHILL) a.shock = e / 100;
  }
  if (ele && H[COLD] > 0) {
    if (!def.cannotBeChilled) {
      const e = mag(H[COLD] / thresh, CHILL_CAP) * p.chill.effect;
      if (e >= MIN_SHOCK_CHILL) a.chill = e / 100;
    }
    const freezeCrit = crit || (p.alwaysFreezeOnCrit && crit);
    if (!def.cannotBeFrozen && (freezeCrit || roll(p.freeze.chance))) {
      const d = Math.min(FREEZE_MAX, FREEZE_PER_R * (H[COLD] / thresh)) * p.freeze.dur;
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
): { chance: number; duration: number } {
  if (!canStun || def.cannotBeStunned) return { chance: 0, duration: 0 };
  let s = 0;
  for (let i = 0; i < NT; i++) s += i === PHYS ? dmg[i] : dmg[i] * STUN_NON_PHYS;
  s *= p.stunDamageMult;
  const eff = def.stunThreshold * (1 - p.enemyStunThreshRed);
  const chance = stunChance(s, eff, STUN_MIN_CHANCE);
  const duration = STUN_BASE_DURATION * p.stunDurMult * def.stunDurOnSelf;
  if (!rng) return { chance: chance * (1 - def.stunAvoid), duration };
  if (chance <= 0 || !rng.chance(chance)) return { chance, duration: 0 };
  if (def.stunAvoid > 0 && rng.chance(def.stunAvoid)) return { chance, duration: 0 };
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
    ailments: emptyAilments(),
    stun: 0,
  };
  if (!isSpellHit && !rng.chance(attackHitChance(p, hand, t.def))) {
    res.outcome = 'miss';
    return res;
  }
  const blk = blockChance(p, t.def);
  if (blk > 0 && rng.chance(blk)) {
    res.outcome = 'block';
    return res;
  }
  const dm = distanceMult(p, dist);
  for (const c of hand.chunks) res.H[c.type] += (c.min + rng.next() * (c.max - c.min)) * dm;
  res.crit = hand.critChance > 0 && rng.chance(hand.critChance);
  const cm = (res.crit ? hand.critMulti * (p.cruelAgony ? 0.7 : 1) : 1) * hand.hitMult;
  for (let i = 0; i < NT; i++) res.dmg[i] = res.H[i] * cm;
  mitigate(p, t, res.dmg);
  for (let i = 0; i < NT; i++) res.total += res.dmg[i];
  res.ailments = ailmentsFromHit(p, hand, res.H, res.crit, t, (c) => c > 0 && rng.chance(c));
  res.stun = stunFromHit(p, res.dmg, t.def, canStun, rng).duration;
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
  for (const c of hand.chunks) avgH[c.type] += ((c.min + c.max) / 2) * dm;
  const nonCrit = mitigate(
    p,
    t,
    avgH.map((h) => h * hand.hitMult),
  );
  const critM = hand.critMulti * (p.cruelAgony ? 0.7 : 1);
  const crit = mitigate(
    p,
    t,
    avgH.map((h) => h * hand.hitMult * critM),
  );
  const cc = hand.critChance;
  const perType = nonCrit.map((n, i) => n * (1 - cc) + crit[i] * cc);
  const hc = p.isAttack ? attackHitChance(p, hand, t.def) : 1;
  const bc = blockChance(p, t.def);
  const total = perType.reduce((a, b) => a + b, 0);
  const sNon = stunFromHit(p, nonCrit, t.def, true, null).chance;
  const sCrit = stunFromHit(p, crit, t.def, true, null).chance;
  return {
    hitChance: hc,
    blockChance: bc,
    perType,
    perUse: total * hc * (1 - bc),
    avgHitNonCrit: nonCrit.reduce((a, b) => a + b, 0),
    avgH,
    stunChance: sNon * (1 - cc) + sCrit * cc,
  };
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
  const cc = hand.critChance;
  const always = () => true;
  const non = ailmentsFromHit(p, hand, H, false, t, always);
  const cr = ailmentsFromHit(p, hand, H, true, t, always);
  const lands = usesPerSec * landChance;
  // Ignite: crits always ignite.
  const ign = p.cannotInflictEle ? 0 : cc + (1 - cc) * p.ignite.chance;
  const ignAvg = cc * cr.ignite + (1 - cc) * p.ignite.chance * non.ignite;
  const ignPer = ign > 0 ? ignAvg / ign : 0;
  const ignUptime = 1 - Math.pow(1 - ign, lands * p.ignite.dur);
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
