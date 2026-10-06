import { resolveHit, type HitResult, type TargetState } from '../calc/combat';
import { levelPenalty } from '../calc/formulas';
import type { SkillProfile } from '../calc/skill';
import {
  BLEED_MOVING_MULT,
  FLASK_CHARGES_ON_KILL,
  LEECH_RATE_CAP,
  LEECH_RATE_PER_INSTANCE,
  LOW_LIFE,
  RECENT,
  STUN_GRACE,
  WOUND_DANCE_STACKS,
} from '../data/constants';
import { condBit } from '../mods/types';
import type { Actor, Dot, World } from './types';

const CHAOS = 4;
const OVERLOAD_TIME = 8;

export function lifeCap(w: World, a: Actor): number {
  return a.isPlayer ? Math.max(1, a.def.maxLife - w.char.reservedLife) : a.def.maxLife;
}

/** Bitmask of the player's active conditions (§7.3), optionally against a target. */
export function playerConds(w: World, target: Actor | null): number {
  const p = w.player;
  let c = 0;
  const cap = lifeCap(w, p);
  if (p.life >= cap - 0.5) c |= condBit('onFullLife');
  if (p.life <= cap * LOW_LIFE) c |= condBit('onLowLife');
  if (p.tKill < RECENT) c |= condBit('killedRecently');
  if (p.tCrit < RECENT) c |= condBit('critRecently');
  if (p.tHit < RECENT) c |= condBit('hitRecently');
  if (p.tFlask < RECENT) c |= condBit('usedFlaskRecently');
  if (w.flasks.some((f) => f.activeT > 0)) c |= condBit('flaskActive');
  if (w.char.dualWielding) c |= condBit('dualWielding');
  if (w.char.holdingShield) c |= condBit('holdingShield');
  if (p.tStunEnemy < RECENT) c |= condBit('stunnedRecently');
  if (p.tOverload < OVERLOAD_TIME) c |= condBit('overloadActive');
  if (p.tBlock < RECENT) c |= condBit('blockedRecently');
  if (target) c |= targetConds(target, p);
  return c;
}

export function targetConds(t: Actor, from: Actor): number {
  let c = 0;
  if (t.ail.ignites.length) c |= condBit('targetIgnited');
  if (t.ail.shock > 0) c |= condBit('targetShocked');
  if (t.ail.chill > 0) c |= condBit('targetChilled');
  if (t.ail.freezeT > 0) c |= condBit('targetFrozen');
  if (t.ail.bleeds.length) c |= condBit('targetBleeding');
  if (t.ail.poisons.length) c |= condBit('targetPoisoned');
  if (t.stunT > 0) c |= condBit('targetStunned');
  if (t.rarity === 'rare' || t.rarity === 'miniboss' || t.rarity === 'boss')
    c |= condBit('targetRareOrUnique');
  if (Math.hypot(t.x - from.x, t.y - from.y) <= 2 + t.r) c |= condBit('targetNearby');
  return c;
}

export function monsterConds(a: Actor): number {
  return a.life <= a.def.maxLife * LOW_LIFE ? condBit('onLowLife') : 0;
}

export function flaskMask(w: World): number {
  let m = 0;
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
  return { def: a.def, shock: a.ail.shock, resShift: a.resShift };
}

/**
 * Route damage per type into ES / mana / life (§6.3). Chaos bypasses ES. Returns total dealt.
 */
export function applyDamage(w: World, dst: Actor, dmg: number[]): number {
  if (!dst.alive) return 0;
  let total = 0;
  for (let i = 0; i < 5; i++) total += dmg[i];
  if (total <= 0) return 0;
  const def = dst.def;
  let rest = total - dmg[CHAOS];
  let chaos = dmg[CHAOS];
  if (def.immuneChaos) chaos = 0;
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
  if (res.outcome === 'block') {
    w.events.push({ t: 'block', src: src.id, dst: dst.id });
    dst.tBlock = 0;
    if (dst.def.lifeOnBlockPct > 0)
      dst.life = Math.min(lifeCap(w, dst), dst.life + dst.def.maxLife * dst.def.lifeOnBlockPct);
    wake(w, dst);
    return;
  }
  let dtype = 0;
  for (let i = 1; i < 5; i++) if (res.dmg[i] > res.dmg[dtype]) dtype = i;
  w.events.push({ t: 'hit', src: src.id, dst: dst.id, amount: res.total, crit: res.crit, dtype });
  src.tHit = 0;
  if (res.crit) {
    src.tCrit = 0;
    if (p.overload) src.tOverload = 0;
  }
  // Leech and life on hit.
  const instant = src.def.instantLeech;
  let ll = 0;
  let lm = 0;
  for (let i = 0; i < 5; i++) {
    ll += res.dmg[i] * p.leechLife[i];
    lm += res.dmg[i] * p.leechMana[i];
  }
  if (src.def.leechToEs && instant) src.es = Math.min(src.def.maxEs, src.es + ll);
  else addLeech(src, 'leechLife', ll, instant);
  addLeech(src, 'leechMana', lm, instant);
  if (p.lifeOnHit > 0) src.life = Math.min(lifeCap(w, src), src.life + p.lifeOnHit);

  const wasAlive = dst.alive;
  applyDamage(w, dst, res.dmg);
  wake(w, dst);
  // Prismatic Balance: shift the target's elemental resistances.
  if (p.prismaticBalance) {
    for (let i = 1; i <= 3; i++) dst.resShift[i] = res.dmg[i] > 0 ? 25 : -50;
    dst.resShiftT = 5;
  }
  if (!wasAlive || !dst.alive) return;
  applyAilments(w, dst, res, p);
  if (res.stun > 0) {
    dst.stunT = res.stun;
    dst.action = null;
    src.tStunEnemy = 0;
    w.events.push({ t: 'stun', dst: dst.id, dur: res.stun });
  }
}

function pushDot(list: Dot[], d: Dot, cap = 30): void {
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
  if (a.ignite > 0) {
    pushDot(ail.ignites, { dps: a.ignite, t: p.ignite.dur });
    w.events.push({ t: 'ailment', dst: dst.id, kind: 'ignite' });
  }
  if (a.bleed > 0) {
    pushDot(ail.bleeds, { dps: a.bleed, t: p.bleed.dur, stack: p.woundDance });
    w.events.push({ t: 'ailment', dst: dst.id, kind: 'bleed' });
  }
  if (a.poison > 0) {
    pushDot(ail.poisons, { dps: a.poison, t: p.poison.dur }, 400);
    w.events.push({ t: 'ailment', dst: dst.id, kind: 'poison' });
  }
  if (a.shock > 0 && a.shock >= ail.shock) {
    ail.shock = a.shock;
    ail.shockT = p.shock.dur;
    w.events.push({ t: 'ailment', dst: dst.id, kind: 'shock' });
  }
  if (a.chill > 0 && a.chill >= ail.chill) {
    ail.chill = a.chill;
    ail.chillT = p.chill.dur;
  }
  if (a.freeze > 0 && a.freeze > ail.freezeT) {
    ail.freezeT = a.freeze;
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

/** Raw damage of one type that ignores evasion and block (explosions, slams). */
export function rawHit(w: World, dst: Actor, amount: number, type: number): void {
  const dmg = [0, 0, 0, 0, 0];
  dmg[type] = amount;
  const def = dst.def;
  if (type === 0) {
    const red = Math.min(0.9, def.armour / (def.armour + 10 * amount) + def.physReduction);
    dmg[0] *= 1 - red;
  } else {
    const r = Math.max(-200, Math.min(def.res[type] + dst.resShift[type], def.maxRes[type]));
    dmg[type] *= 1 - r / 100;
  }
  dmg[type] *= def.damageTakenMult * (1 + dst.ail.shock);
  w.events.push({ t: 'hit', src: 0, dst: dst.id, amount: dmg[type], crit: false, dtype: type });
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

export function killActor(w: World, a: Actor): void {
  if (!a.alive) return;
  a.alive = false;
  a.life = 0;
  a.action = null;
  w.events.push({ t: 'death', id: a.id });
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
        const pos = w.grid.collide(a.x + Math.cos(ang) * 0.6, a.y + Math.sin(ang) * 0.6, 0.2);
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
  a.tOverload += dt;
  a.sinceDamaged += dt;
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
  const taken = def.damageTakenMult * (1 + ail.shock);
  let dotPhys = 0;
  let dotFire = 0;
  let dotChaos = 0;
  if (ail.ignites.length) {
    let best = 0;
    for (const d of ail.ignites) if (d.dps > best) best = d.dps;
    dotFire += best;
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
      if (a.moving) b *= BLEED_MOVING_MULT;
    }
    dotPhys += b;
    decay(ail.bleeds, dt);
  }
  if (ail.poisons.length) {
    for (const d of ail.poisons) dotChaos += d.dps;
    decay(ail.poisons, dt);
  }
  if (dotPhys + dotFire + dotChaos > 0) {
    const dmg = [dotPhys * taken * dt, 0, 0, dotFire * taken * dt, dotChaos * taken * dt];
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
    );
  }
  if (def.leechToEs)
    leechTick(
      a.leechLife,
      (x) => (a.es = Math.min(def.maxEs, a.es + x)),
      def.maxLife,
      dt,
      a.es >= def.maxEs,
    );
  else
    leechTick(
      a.leechLife,
      (x) => (a.life = Math.min(cap, a.life + x)),
      def.maxLife,
      dt,
      a.life >= cap,
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
): void {
  if (!list.length) return;
  if (full) {
    list.length = 0;
    return;
  }
  const per = LEECH_RATE_PER_INSTANCE * max;
  const scale = Math.min(1, LEECH_RATE_CAP / (LEECH_RATE_PER_INSTANCE * list.length));
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
