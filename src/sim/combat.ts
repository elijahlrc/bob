import {
  AILMENT_NAMES,
  resolveHit,
  shockTaken,
  takenAs,
  type HitResult,
  type TargetState,
} from '../calc/combat';
import { levelPenalty } from '../calc/formulas';
import type { SkillProfile } from '../calc/skill';
import {
  BLEED_MOVING_MULT,
  CULLING_SHARE,
  FLASK_CHARGES_ON_KILL,
  LEECH_INSTANCE_MAX,
  LEECH_RATE_CAP,
  LEECH_RATE_PER_INSTANCE,
  LOW_LIFE,
  RECENT,
  STUN_GRACE,
  WOUND_DANCE_STACKS,
} from '../data/constants';
import { cannotBleed } from '../data/monsters';
import { BUFFS, BUFF_IDS, DYN_SHIFT } from '../data/buffs';
import { MONSTER_CONDS } from '../calc/monster';
import { WIELD_CONDS } from '../calc/staticConds';
import { maskOr, type CondId } from '../mods/types';
import { rollGains } from './buffs';
import { gainTrophy, rollCharges } from './charges';
import { applyPlayerHexes, tickHexes } from './hexes';
import { damageMult, hexPlayerAtRandom, onMonsterDeath, shieldedByPylon } from './factions';
import { fireTriggers } from './triggers';
import { spawnMonster } from './world';
import type { Actor, Dot, World } from './types';

const CHAOS = 4;
/** Seconds of damage kept for the death recap. */
const DAMAGE_LOG_TIME = 6;
/** Share of a melee hit that a Thorned monster reflects as physical damage. */
const THORNS_SHARE = 0.1;
const OVERLOAD_TIME = 8;

export function lifeCap(w: World, a: Actor): number {
  return a.isPlayer ? Math.max(1, a.def.maxLife - w.char.reservedLife) : a.def.maxLife;
}

/** What makes each condition true for the player; a condition is only evaluated when this character's mods use it. */
type PlayerTest = (w: World, p: Actor) => boolean;
const PLAYER_TESTS: Partial<Record<CondId, PlayerTest>> = {
  onFullLife: (w, p) => p.life >= lifeCap(w, p) - 0.5,
  onLowLife: (_w, p) => p.life <= p.def.maxLife * LOW_LIFE,
  killedRecently: (_w, p) => p.tKill < RECENT,
  critRecently: (_w, p) => p.tCrit < RECENT,
  hitRecently: (_w, p) => p.tHit < RECENT,
  usedFlaskRecently: (_w, p) => p.tFlask < RECENT,
  flaskActive: (w) => w.flasks.some((f) => f.activeT > 0),
  dualWielding: (w) => w.char.dualWielding,
  holdingShield: (w) => w.char.holdingShield,
  stunnedRecently: (_w, p) => p.tStunEnemy < RECENT,
  overloadActive: (_w, p) => p.tOverload < OVERLOAD_TIME,
  blockedRecently: (_w, p) => p.tBlock < RECENT,
  beenHitRecently: (_w, p) => p.tBeenHit < RECENT,
  leeching: (_w, p) => p.leechLife.length > 0,
  esFull: (_w, p) => p.def.maxEs > 0 && p.es >= p.def.maxEs - 0.5,
  onLowMana: (w, p) => p.mana <= Math.max(1, p.def.maxMana - w.char.reservedMana) * LOW_LIFE,
  cursed: (_w, p) => p.hexes.length > 0,
  stationary: (_w, p) => !p.moving,
  ignited: (_w, p) => p.ail.ignites.length > 0,
  shocked: (_w, p) => p.ail.shock > 0,
  chilled: (_w, p) => p.ail.chill > 0,
  frozen: (_w, p) => p.ail.freezeT > 0,
  bleeding: (_w, p) => p.ail.bleeds.length > 0,
  poisoned: (_w, p) => p.ail.poisons.length > 0,
};
for (const [id, tag] of WIELD_CONDS) PLAYER_TESTS[id] = (w) => w.char.weaponTags.has(tag);
for (const id of BUFF_IDS) {
  const cond = BUFFS[id].cond;
  PLAYER_TESTS[cond] = (w) => w.buffT[id] > 0;
}

type TargetTest = (t: Actor, from: Actor) => boolean;
const TARGET_TESTS: Partial<Record<CondId, TargetTest>> = {
  targetCursed: (t) => t.hexes.length > 0,
  targetIgnited: (t) => t.ail.ignites.length > 0,
  targetShocked: (t) => t.ail.shock > 0,
  targetChilled: (t) => t.ail.chill > 0,
  targetFrozen: (t) => t.ail.freezeT > 0,
  targetBleeding: (t) => t.ail.bleeds.length > 0,
  targetPoisoned: (t) => t.ail.poisons.length > 0,
  targetStunned: (t) => t.stunT > 0,
  targetLowLife: (t) => t.life <= t.def.maxLife * LOW_LIFE,
  targetRareOrUnique: (t) => t.rarity === 'rare' || t.rarity === 'miniboss' || t.rarity === 'boss',
  targetNearby: (t, from) => Math.hypot(t.x - from.x, t.y - from.y) <= 2 + t.r,
};

type Compiled = { n: number; player: [number, PlayerTest][]; target: [number, TargetTest][] };
const compiled = new WeakMap<object, Compiled>();

/** The tests of the conditions a character's mods use, with their bits (rebuilt if it registers more). */
function condTests(w: World): Compiled {
  const idx = w.char.cond;
  let c = compiled.get(idx);
  if (!c || c.n !== idx.ids.length) {
    c = { n: idx.ids.length, player: [], target: [] };
    idx.ids.forEach((id, i) => {
      const pt = PLAYER_TESTS[id];
      const tt = TARGET_TESTS[id];
      if (pt) c!.player.push([2 ** i, pt]);
      else if (tt) c!.target.push([2 ** i, tt]);
    });
    compiled.set(idx, c);
  }
  return c;
}

/** Bitmask of the player's active conditions (§7.3), optionally against a target. Bits are the character's own. */
export function playerConds(w: World, target: Actor | null): number {
  const p = w.player;
  const t = condTests(w);
  let c = 0;
  for (const [bit, test] of t.player) if (test(w, p)) c = maskOr(c, bit);
  if (target) for (const [bit, test] of t.target) if (test(target, p)) c = maskOr(c, bit);
  return c;
}

/** The conditions about a target, as a mask in the character's own bits. */
export function targetConds(w: World, t: Actor, from: Actor): number {
  let c = 0;
  for (const [bit, test] of condTests(w).target) if (test(t, from)) c = maskOr(c, bit);
  return c;
}

export function monsterConds(a: Actor): number {
  return a.life <= a.def.maxLife * LOW_LIFE ? MONSTER_CONDS.peek('onLowLife') : 0;
}

export function flaskMask(w: World): number {
  let m = w.rage << DYN_SHIFT;
  w.flasks.forEach((f, i) => {
    if (f.activeT > 0 && f.spec.buff.length) m |= 1 << i;
  });
  return m;
}

/** Refresh the player's cached defence for the current conditions and flasks. */
export function refreshPlayerDefence(w: World): void {
  const p = w.player;
  p.def = w.char.defence(playerConds(w, null), flaskMask(w));
  const cap = lifeCap(w, p);
  if (p.life > cap) p.life = cap;
  if (p.es > p.def.maxEs) p.es = p.def.maxEs;
  if (p.mana > p.def.maxMana - w.char.reservedMana)
    p.mana = Math.max(0, p.def.maxMana - w.char.reservedMana);
}

export function targetState(a: Actor): TargetState {
  // Brittle Doom lowers the three elemental resistances; Open Wounds adds physical vulnerability.
  const resShift = a.hexRes
    ? a.resShift.map((r, i) => (i >= 1 && i <= 3 ? r - a.hexRes : r))
    : a.resShift;
  return { def: a.def, shock: a.ail.shock, resShift, vuln: a.hexVuln, es: a.es };
}

/**
 * Route damage per type into ES / mana / life (§6.3). Chaos bypasses ES. Returns total dealt.
 */
export function applyDamage(w: World, dst: Actor, dmg: number[]): number {
  if (!dst.alive || dst.phaseT > 0) return 0;
  if (!dst.isPlayer && dst.mon) {
    // A Bone Beetle curled up takes 80% less physical damage; a Warden Pylon makes its allies untouchable.
    if (dst.curlT > 0) dmg[0] *= 0.2;
    if (w.hasPylons && shieldedByPylon(w, dst)) return 0;
  }
  let total = 0;
  for (let i = 0; i < 5; i++) total += dmg[i];
  if (total <= 0) return 0;
  const def = dst.def;
  let rest = total - dmg[CHAOS];
  let chaos = dmg[CHAOS];
  if (def.immuneChaos) chaos = 0;
  // Embalmer-style rule: chaos damage hits energy shield like any other damage.
  if (def.chaosHitsEs) {
    rest += chaos;
    chaos = 0;
  }
  // ES absorbs non-chaos damage first (unless it protects mana instead).
  if (!def.esProtectsMana && dst.es > 0) {
    const a = Math.min(dst.es, rest);
    dst.es -= a;
    rest -= a;
  }
  let lifeDmg = rest + chaos;
  if (def.manaBeforeLife > 0 && dst.mana > 0) {
    const m = Math.min(dst.mana, lifeDmg * def.manaBeforeLife);
    dst.mana -= m;
    lifeDmg -= m;
  }
  dst.life -= lifeDmg;
  dst.sinceDamaged = 0;
  if (dst.isPlayer && w.opts.godMode && dst.life <= 0) dst.life = 1;
  if (dst.isPlayer) w.stats.damageTaken += total;
  else w.stats.damageDealt += total;
  if (dst.life <= 0) killActor(w, dst);
  return total;
}

function addLeech(
  src: Actor,
  list: 'leechLife' | 'leechMana',
  amount: number,
  instant: boolean,
): void {
  if (amount <= 0) return;
  amount = Math.min(
    amount,
    LEECH_INSTANCE_MAX * (list === 'leechLife' ? src.def.maxLife : src.def.maxMana),
  );
  if (instant) {
    if (list === 'leechLife') src.life += amount;
    else src.mana += amount;
    return;
  }
  const arr = src[list];
  if (arr.length < 40) arr.push(amount);
}

/** Apply a resolved hit from `src` to `dst`, including leech, ailments, stun and kill effects. */
export function applyHit(w: World, src: Actor, dst: Actor, p: SkillProfile, res: HitResult): void {
  if (res.outcome === 'miss') {
    w.events.push({ t: 'miss', src: src.id, dst: dst.id });
    wake(w, dst);
    return;
  }
  // Feeble Grip makes a hexed attacker deal less; the auras and Fervour of the Choir make its monsters deal more.
  const dealt = damageMult(src);
  if (dealt !== 1 && res.outcome !== 'block') {
    for (let i = 0; i < res.dmg.length; i++) res.dmg[i] *= dealt;
    res.total *= dealt;
  }
  if (src.modIds.includes('hexcaller') && dst.isPlayer && res.outcome === 'hit' && src.hexCd <= 0) {
    src.hexCd = 4;
    hexPlayerAtRandom(w);
  }
  if (res.outcome === 'block') {
    w.events.push({ t: 'block', src: src.id, dst: dst.id });
    dst.tBlock = 0;
    if (dst.isPlayer) {
      rollCharges(w, 'block');
      rollGains(w, 'block');
    }
    if (dst.def.lifeOnBlockPct > 0)
      dst.life = Math.min(lifeCap(w, dst), dst.life + dst.def.maxLife * dst.def.lifeOnBlockPct);
    wake(w, dst);
    if (dst.isPlayer) fireTriggers(w, { on: 'block' });
    return;
  }
  let dtype = 0;
  for (let i = 1; i < 5; i++) if (res.dmg[i] > res.dmg[dtype]) dtype = i;
  w.events.push({ t: 'hit', src: src.id, dst: dst.id, amount: res.total, crit: res.crit, dtype });
  if (dst.isPlayer) logDamage(w, src, src.name, dtype, res.total);
  src.tHit = 0;
  dst.tBeenHit = 0;
  if (src.isPlayer) {
    rollGains(w, 'hit', p.gains);
    rollCharges(w, 'hit', p.gains);
    if (p.skill.behaviour.kind === 'melee') {
      rollGains(w, 'meleeHit', p.gains);
      rollCharges(w, 'meleeHit', p.gains);
    }
  }
  if (dst.isPlayer) rollGains(w, 'hitTaken');
  if (res.crit) {
    src.tCrit = 0;
    if (src.isPlayer) {
      rollCharges(w, 'crit', p.gains);
      rollGains(w, 'crit', p.gains);
    }
    if (p.overload) src.tOverload = 0;
  }
  // Leech and life on hit. Some monsters cannot be leeched from; some gear makes crit leech instant.
  const instant =
    src.def.instantLeech || p.instantLeechAlways || (res.crit && p.instantLeechOnCrit);
  let ll = 0;
  let lm = 0;
  if (!dst.def.cannotBeLeechedFrom)
    for (let i = 0; i < 5; i++) {
      ll += res.dmg[i] * p.leechLife[i];
      lm += res.dmg[i] * p.leechMana[i];
    }
  if (src.def.leechToEs && instant) src.es = Math.min(src.def.maxEs, src.es + ll);
  else addLeech(src, 'leechLife', ll, instant);
  addLeech(src, 'leechMana', lm, instant);
  if (p.lifeOnHit > 0) src.life = Math.min(lifeCap(w, src), src.life + p.lifeOnHit);
  if (p.manaOnHit > 0 && src.isPlayer)
    src.mana = Math.min(Math.max(0, src.def.maxMana - w.char.reservedMana), src.mana + p.manaOnHit);

  const wasAlive = dst.alive;
  if (src.isPlayer) applyPlayerHexes(w, dst);
  applyDamage(w, dst, res.dmg);
  if (wasAlive && dst.alive) {
    payImpales(w, dst);
    recordImpale(w, dst, p, res);
    reflectBack(w, src, dst, p, res);
    // Culling strike: a hit that leaves the target at 10% life or less finishes it.
    if (p.culling && !dst.isPlayer && dst.life <= dst.def.maxLife * CULLING_SHARE)
      killActor(w, dst);
  }
  // A beetle that is hit curls up for a moment (then cannot again for three seconds).
  if (wasAlive && dst.alive && dst.mon?.spec.type === 'beetle' && dst.skillT <= 0) {
    dst.curlT = 1.5;
    dst.skillT = 3;
  }
  wake(w, dst);
  // Siphoning monsters drain the player's mana; Thorned monsters reflect part of a melee hit.
  if (p.manaDrain > 0 && dst.isPlayer)
    dst.mana = Math.max(0, dst.mana - (dst.def.maxMana * p.manaDrain) / 100);
  if (
    src.isPlayer &&
    wasAlive &&
    dst.modIds.includes('thorned') &&
    p.skill.behaviour.kind === 'melee' &&
    res.total > 0
  )
    rawHit(w, src, res.total * THORNS_SHARE, 0);
  const afterHit = () => {
    if (src.isPlayer) fireTriggers(w, { on: 'hit', target: dst, tags: p.tagMask, crit: res.crit });
    if (dst.isPlayer) fireTriggers(w, { on: 'hitTaken', damage: res.total });
  };
  // Prismatic Balance: shift the target's elemental resistances.
  if (p.prismaticBalance) {
    for (let i = 1; i <= 3; i++) dst.resShift[i] = res.dmg[i] > 0 ? 25 : -50;
    dst.resShiftT = 5;
  }
  if (!wasAlive || !dst.alive) {
    afterHit();
    return;
  }
  applyAilments(w, dst, res, p);
  if (res.stun > 0) {
    dst.stunT = res.stun;
    dst.action = null;
    src.tStunEnemy = 0;
    w.events.push({ t: 'stun', dst: dst.id, dur: res.stun });
    if (src.isPlayer) {
      rollGains(w, 'stun', p.gains);
      rollCharges(w, 'stun', p.gains);
    }
  }
  afterHit();
}

export function pushDot(list: Dot[], d: Dot, cap = 30): void {
  list.push(d);
  if (list.length > cap) {
    let wi = 0;
    for (let i = 1; i < list.length; i++) if (list[i].dps < list[wi].dps) wi = i;
    list.splice(wi, 1);
  }
}

function applyAilments(w: World, dst: Actor, res: HitResult, p: SkillProfile): void {
  const a = res.ailments;
  const ail = dst.ail;
  const d = dst.def;
  // Chances to avoid an ailment, and how long each lasts on this actor.
  for (const name of AILMENT_NAMES)
    if (a[name] > 0 && d.avoid[name] > 0 && w.rngCombat.chance(d.avoid[name])) a[name] = 0;
  if (a.ignite > 0) {
    pushDot(ail.ignites, { dps: a.ignite, t: p.ignite.dur * d.durOnSelf.ignite });
    ail.igniteMax = p.ignite.max;
    w.events.push({ t: 'ailment', dst: dst.id, kind: 'ignite' });
  }
  if (a.bleed > 0 && !(dst.mon && cannotBleed(dst.mon.spec.type))) {
    pushDot(ail.bleeds, { dps: a.bleed, t: p.bleed.dur * d.durOnSelf.bleed, stack: p.woundDance });
    w.events.push({ t: 'ailment', dst: dst.id, kind: 'bleed' });
  }
  if (a.poison > 0) {
    pushDot(ail.poisons, { dps: a.poison, t: p.poison.dur * d.durOnSelf.poison }, 400);
    w.events.push({ t: 'ailment', dst: dst.id, kind: 'poison' });
  }
  if (a.shock > 0 && a.shock >= ail.shock) {
    ail.shock = a.shock;
    ail.shockT = p.shock.dur * d.durOnSelf.shock;
    w.events.push({ t: 'ailment', dst: dst.id, kind: 'shock' });
  }
  if (a.chill > 0 && a.chill >= ail.chill) {
    ail.chill = a.chill;
    ail.chillT = p.chill.dur * d.durOnSelf.chill;
  }
  if (a.freeze > 0 && a.freeze > ail.freezeT) {
    ail.freezeT = a.freeze * d.durOnSelf.freeze;
    w.events.push({ t: 'ailment', dst: dst.id, kind: 'freeze' });
  }
}

/** Resolve and apply a hit from src to dst. */
export function hit(
  w: World,
  src: Actor,
  dst: Actor,
  p: SkillProfile,
  hand: number,
  dist: number,
): void {
  const canStun = dst.stunT <= 0 && dst.graceT <= 0;
  const h = p.hands[Math.min(hand, p.hands.length - 1)];
  const res = resolveHit(w.rngCombat, p, h, targetState(dst), dist, canStun);
  applyHit(w, src, dst, p, res);
}

/** Remember damage the player took, for the death recap. */
export function logDamage(
  w: World,
  src: Pick<Actor, 'name' | 'rarity' | 'modIds'> | null,
  label: string,
  dtype: number,
  amount: number,
): void {
  if (amount <= 0) return;
  const log = w.dmgLog;
  log.push({
    t: w.t,
    name: src ? src.name : label,
    rarity: src ? src.rarity : 'effect',
    mods: src ? [...src.modIds] : [],
    dtype,
    amount,
  });
  while (log.length > 0 && w.t - log[0].t > DAMAGE_LOG_TIME) log.shift();
}

/** Raw damage of one type that ignores evasion and block (explosions, slams). */
/** A player hit by a monster's melee attack deals damage back to it (reflect). */
function reflectBack(w: World, src: Actor, dst: Actor, p: SkillProfile, res: HitResult): void {
  if (!dst.isPlayer || src.isPlayer || !src.alive || p.skill.behaviour.kind !== 'melee') return;
  const d = dst.def;
  for (let t = 0; t < 5; t++) if (d.reflect[t] > 0) rawHit(w, src, d.reflect[t], t, 'Reflect');
  if (d.reflectPhysPct > 0 && res.dmg[0] > 0 && src.alive)
    rawHit(w, src, res.dmg[0] * d.reflectPhysPct, 0, 'Reflect');
}

/** Every impale on the target deals what it recorded as reflected physical damage, and uses up one of its hits. */
function payImpales(w: World, dst: Actor): void {
  if (dst.impales.length === 0) return;
  let stored = 0;
  let j = 0;
  for (const imp of dst.impales) {
    stored += imp.dmg;
    if (--imp.hits > 0) dst.impales[j++] = imp;
  }
  dst.impales.length = j;
  rawHit(w, dst, stored, 0, 'Impale');
}

/** A hit that impales records a share of its physical damage on the target. */
function recordImpale(w: World, dst: Actor, p: SkillProfile, res: HitResult): void {
  const imp = p.impale;
  if (imp.chance <= 0 || !dst.alive || (res.rawPhys ?? 0) <= 0) return;
  if (!w.rngCombat.chance(imp.chance)) return;
  dst.impales.push({ dmg: (res.rawPhys ?? 0) * imp.share, hits: imp.hits });
  while (dst.impales.length > imp.max) dst.impales.shift();
}

export function rawHit(
  w: World,
  dst: Actor,
  amount: number,
  type: number,
  label = 'Explosion',
): void {
  const dmg = [0, 0, 0, 0, 0];
  dmg[type] = amount;
  const def = dst.def;
  takenAs(def, dmg);
  const taken = def.damageTakenMult * def.hitTakenMult * shockTaken(def, dst.ail.shock);
  for (let i = 0; i < 5; i++) {
    if (dmg[i] <= 0) continue;
    if (def.immune[i] || (i === CHAOS && def.immuneChaos)) {
      dmg[i] = 0;
      continue;
    }
    if (i === 0) {
      const red = Math.min(0.9, def.armour / (def.armour + 10 * dmg[0]) + def.physReduction);
      dmg[0] *= 1 - red;
    } else {
      const shift = dst.resShift[i] - (i <= 3 ? dst.hexRes : 0);
      const r = Math.max(-200, Math.min(def.res[i] + shift, def.maxRes[i]));
      dmg[i] *= 1 - r / 100;
    }
    dmg[i] *= taken * def.damageTakenType[i];
    if (i === 0) dmg[i] *= 1 + dst.hexVuln;
  }
  const total = dmg[0] + dmg[1] + dmg[2] + dmg[3] + dmg[4];
  w.events.push({ t: 'hit', src: 0, dst: dst.id, amount: total, crit: false, dtype: type });
  if (dst.isPlayer) logDamage(w, null, label, type, total);
  applyDamage(w, dst, dmg);
}

/** Wake a monster that took damage (and its pack). */
export function wake(w: World, a: Actor): void {
  if (a.isPlayer || a.state !== 'idle') return;
  a.state = 'chase';
  a.lostT = 0;
  for (const o of w.actors)
    if (!o.isPlayer && o.alive && o.state === 'idle' && Math.hypot(o.x - a.x, o.y - a.y) <= 6)
      o.state = 'chase';
}

/** A drop must land on floor: a flier that dies over a wall drops its loot where it can be reached. */
function dropSpot(w: World, a: Actor, pos: { x: number; y: number }): { x: number; y: number } {
  if (!a.flies || w.grid.isFloor(Math.floor(pos.x), Math.floor(pos.y))) return pos;
  const p = w.player;
  let best = { x: p.x, y: p.y };
  let bd = Infinity;
  for (let dy = -4; dy <= 4; dy++)
    for (let dx = -4; dx <= 4; dx++) {
      const tx = Math.floor(a.x) + dx;
      const ty = Math.floor(a.y) + dy;
      if (!w.grid.isFloor(tx, ty)) continue;
      const d = dx * dx + dy * dy;
      if (d < bd) {
        bd = d;
        best = { x: tx + 0.5, y: ty + 0.5 };
      }
    }
  return best;
}

export function killActor(w: World, a: Actor): void {
  if (!a.alive) return;
  a.alive = false;
  a.life = 0;
  a.action = null;
  w.events.push({ t: 'death', id: a.id });
  if (!a.isPlayer && !a.noReward) {
    rollCharges(w, 'kill');
    rollGains(w, 'kill');
  }
  if (!a.isPlayer && a.rarity === 'rare') gainTrophy(w, a.modIds);
  if (a.isPlayer) {
    w.status = 'dead';
    w.events.push({ t: 'playerDied' });
    return;
  }
  const p = w.player;
  if (!a.noReward) {
    w.stats.kills++;
    p.tKill = 0;
    const xp =
      (a.mon?.xp ?? 0) * levelPenalty(w.build.level, a.mon?.spec.level ?? 1) * w.plan.theme.xpMult;
    w.xp += xp;
    w.stats.xpGained += xp;
    const kind =
      a.rarity === 'boss' || a.rarity === 'miniboss'
        ? 'unique'
        : a.rarity === 'rare'
          ? 'rare'
          : a.rarity === 'magic'
            ? 'magic'
            : 'normal';
    const gain = FLASK_CHARGES_ON_KILL[kind] * w.char.db.mult('flaskCharges');
    for (const f of w.flasks) f.charges = Math.min(f.spec.maxCharges, f.charges + gain);
    const lok =
      w.char.db.sum('base', 'lifeOnKill') +
      (w.char.db.sum('base', 'lifeOnKillPct') / 100) * p.def.maxLife;
    if (lok > 0) p.life = Math.min(lifeCap(w, p), p.life + lok);
    const mok = w.char.db.sum('base', 'manaOnKill');
    if (mok > 0) p.mana = Math.min(p.def.maxMana - w.char.reservedMana, p.mana + mok);
    if (w.opts.loot) {
      for (const item of w.opts.loot(w, a)) {
        const id = w.nextId++;
        const ang = w.rngLoot.float(0, Math.PI * 2);
        const pos = dropSpot(
          w,
          a,
          w.grid.collide(a.x + Math.cos(ang) * 0.6, a.y + Math.sin(ang) * 0.6, 0.2),
        );
        w.drops.push({ id, x: pos.x, y: pos.y, item });
        w.events.push({ t: 'drop', id });
      }
    }
  }
  if (a.modIds.includes('volatile')) {
    w.effects.push({
      id: w.nextId++,
      x: a.x,
      y: a.y,
      radius: 2,
      t: 1,
      total: 1,
      kind: 'volatile',
      damage: 3 * monsterHitOf(a),
      dtype: 3,
      faction: 1,
    });
  }
  if (a.modIds.includes('splitting') && a.mon) splitInTwo(w, a);
  onMonsterDeath(w, a);
  fireTriggers(w, { on: 'kill', target: a });
}

/** A Splitting monster leaves two weaker copies behind (no XP or loot, and they do not split). */
function splitInTwo(w: World, a: Actor): void {
  const spec = a.mon!.spec;
  for (const dx of [-0.6, 0.6]) {
    const pos = w.grid.collide(a.x + dx, a.y, 0.4);
    const c = spawnMonster(
      w,
      { type: spec.type, variant: spec.variant, rarity: 'normal', level: spec.level, mods: [] },
      pos.x,
      pos.y,
      a.room,
      a.pack,
      a.name,
    );
    c.noReward = true;
    c.state = 'chase';
    w.events.push({ t: 'summon', id: c.id });
  }
}

export function monsterHitOf(a: Actor): number {
  const p = a.mon?.profile(0);
  if (!p) return 0;
  let s = 0;
  for (const c of p.hands[0].chunks) s += (c.min + c.max) / 2;
  return s;
}

/** Per-tick upkeep: DoTs, regeneration, leech, ES recharge, timers. */
export function tickActor(w: World, a: Actor, dt: number): void {
  if (!a.alive) return;
  const ail = a.ail;
  const def = a.def;
  // Timers.
  a.tKill += dt;
  a.tCrit += dt;
  a.tHit += dt;
  a.tFlask += dt;
  a.tStunEnemy += dt;
  a.tBlock += dt;
  a.tBeenHit += dt;
  a.tOverload += dt;
  a.sinceDamaged += dt;
  tickHexes(a, dt);
  if (a.curlT > 0) a.curlT -= dt;
  if (a.buffT > 0) a.buffT -= dt;
  if (a.zealT > 0) a.zealT -= dt;
  if (a.hexCd > 0) a.hexCd -= dt;
  // A beetle counts down the wait before it can curl up again (nothing else uses its faction timer).
  if (a.skillT > 0 && a.mon?.spec.type === 'beetle') a.skillT -= dt;
  if (a.fervourT > 0) {
    a.fervourT -= dt;
    if (a.fervourT <= 0) a.fervour = 0;
  }
  if (a.resShiftT > 0) {
    a.resShiftT -= dt;
    if (a.resShiftT <= 0) a.resShift.fill(0);
  }
  if (a.stunT > 0) {
    a.stunT -= dt;
    if (a.stunT <= 0) a.graceT = STUN_GRACE;
  } else if (a.graceT > 0) a.graceT -= dt;
  if (ail.freezeT > 0) ail.freezeT -= dt;
  if (ail.shockT > 0) {
    ail.shockT -= dt;
    if (ail.shockT <= 0) ail.shock = 0;
  }
  if (ail.chillT > 0) {
    ail.chillT -= dt;
    if (ail.chillT <= 0) ail.chill = 0;
  }
  // Damage over time.
  const taken = def.damageTakenMult * shockTaken(def, ail.shock);
  let dotPhys = 0;
  let dotFire = 0;
  let dotChaos = 0;
  if (ail.ignites.length) {
    // The strongest `igniteMax` ignites burn.
    if (ail.igniteMax <= 1) {
      let best = 0;
      for (const d of ail.ignites) if (d.dps > best) best = d.dps;
      dotFire += best;
    } else {
      const top = ail.ignites.map((d) => d.dps).sort((x, y) => y - x);
      for (let i = 0; i < Math.min(ail.igniteMax, top.length); i++) dotFire += top[i];
    }
    decay(ail.ignites, dt);
  }
  if (ail.bleeds.length) {
    const stacking = ail.bleeds.some((d) => d.stack);
    let b = 0;
    if (stacking) {
      const sorted = ail.bleeds.map((d) => d.dps).sort((x, y) => y - x);
      for (let i = 0; i < Math.min(WOUND_DANCE_STACKS, sorted.length); i++) b += sorted[i];
    } else {
      for (const d of ail.bleeds) if (d.dps > b) b = d.dps;
      if (a.moving && !def.noMovingBleed) b *= BLEED_MOVING_MULT;
    }
    dotPhys += b;
    decay(ail.bleeds, dt);
  }
  if (ail.poisons.length) {
    for (const d of ail.poisons) dotChaos += d.dps;
    decay(ail.poisons, dt);
  }
  if (dotPhys + dotFire + dotChaos > 0) {
    const tt = def.damageTakenType;
    const dmg = [
      dotPhys * taken * tt[0] * dt,
      0,
      0,
      dotFire * taken * tt[3] * dt,
      dotChaos * taken * tt[4] * dt,
    ];
    if (a.isPlayer) {
      logDamage(w, null, 'Burning', 3, dmg[3]);
      logDamage(w, null, 'Bleeding', 0, dmg[0]);
      logDamage(w, null, 'Poison', 4, dmg[4]);
    }
    applyDamage(w, a, dmg);
    if (!a.alive) return;
  }
  // Regeneration.
  const cap = lifeCap(w, a);
  if (def.lifeRegen > 0) {
    if (def.regenToEs) a.es = Math.min(def.maxEs, a.es + def.lifeRegen * dt);
    else a.life = Math.min(cap, a.life + def.lifeRegen * dt);
  }
  if (a.isPlayer) {
    const manaCap = Math.max(0, def.maxMana - w.char.reservedMana);
    a.mana = Math.min(manaCap, a.mana + def.manaRegen * dt);
    leechTick(
      a.leechMana,
      (x) => (a.mana = Math.min(manaCap, a.mana + x)),
      def.maxMana,
      dt,
      a.mana >= manaCap,
      def.leechRate,
    );
  }
  if (def.leechToEs)
    leechTick(
      a.leechLife,
      (x) => (a.es = Math.min(def.maxEs, a.es + x)),
      def.maxLife,
      dt,
      a.es >= def.maxEs,
      def.leechRate,
    );
  else
    leechTick(
      a.leechLife,
      (x) => (a.life = Math.min(cap, a.life + x)),
      def.maxLife,
      dt,
      a.life >= cap,
      def.leechRate,
    );
  // ES recharge.
  if (def.maxEs > 0 && a.es < def.maxEs && a.sinceDamaged >= def.esDelay)
    a.es = Math.min(def.maxEs, a.es + def.esRecharge * dt);
}

function decay(list: Dot[], dt: number): void {
  let j = 0;
  for (let i = 0; i < list.length; i++) {
    list[i].t -= dt;
    if (list[i].t > 0) list[j++] = list[i];
  }
  list.length = j;
}

function leechTick(
  list: number[],
  gain: (x: number) => void,
  max: number,
  dt: number,
  full: boolean,
  rate = 1,
): void {
  if (!list.length) return;
  if (full) {
    list.length = 0;
    return;
  }
  const per = LEECH_RATE_PER_INSTANCE * max * rate;
  const scale = Math.min(
    1,
    (LEECH_RATE_CAP * rate) / (LEECH_RATE_PER_INSTANCE * rate * list.length),
  );
  let total = 0;
  let j = 0;
  for (let i = 0; i < list.length; i++) {
    const take = Math.min(list[i], per * scale * dt);
    total += take;
    list[i] -= take;
    if (list[i] > 1e-6) list[j++] = list[i];
  }
  list.length = j;
  gain(total);
}
