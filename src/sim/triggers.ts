import type { SkillChoice } from '../calc/character';
import { reservedMana } from './reserve';
import type { TriggerDef, TriggerEffect } from '../data/triggers';
import { DAMAGE_TYPES, maskSubset, tagBit, type DamageType } from '../mods/types';
import { fire } from './actions';
import { registerBlast } from './factions';
import { startStorm } from './fields';
import { flaskMask, lifeCap, playerConds, pushDot, rawHit, wake } from './combat';
import type { Actor, Action, World } from './types';

/**
 * Triggers (EXPANSION 5.5). Rules, as in the reference game (AUDIT-3.9):
 * - each triggered skill has its own cooldown, and a source with several spells casts them in turn;
 * - a triggered skill costs no mana (and needs none) and takes no action time;
 * - nothing triggers from a triggered skill (its hits carry the 'triggered' tag).
 * Kill explosions are capped per tick, so a dense pack cannot stall the sim.
 */

export type TriggerEvent =
  | { on: 'hit'; target: Actor; tags: number; crit: boolean }
  | { on: 'attack'; target: Actor; tags: number }
  | { on: 'cast'; target: Actor; tags: number }
  | { on: 'kill'; target: Actor; tags: number }
  | { on: 'block' }
  | { on: 'hitTaken'; damage: number };

export const MAX_EXPLOSIONS_PER_TICK = 20;
const TRIGGERED = tagBit('triggered');

function matches(d: TriggerDef, ev: TriggerEvent, tagMask: number): boolean {
  if (d.on !== ev.on && !(ev.on === 'hit' && ev.crit && d.on === 'crit')) return false;
  if ('tags' in ev && !maskSubset(tagMask, ev.tags)) return false;
  if (ev.on === 'kill' && d.targetHas) {
    const t = ev.target;
    const has =
      d.targetHas === 'shock'
        ? t.ail.shock > 0
        : d.targetHas === 'hex'
          ? t.hexes.length > 0
          : d.targetHas === 'freeze'
            ? t.ail.freezeT > 0
            : d.targetHas === 'poison'
              ? t.ail.poisons.length > 0
              : d.targetHas === 'bleed'
                ? t.ail.bleeds.length > 0
                : t.ail.ignites.length > 0;
    if (!has) return false;
  }
  return true;
}

/** Offer an event to every trigger the player has. Cheap when there are none. */
export function fireTriggers(w: World, ev: TriggerEvent): void {
  const triggers = w.char.triggers;
  if (triggers.length === 0 || w.trig.busy || !w.player.alive) return;
  if ('tags' in ev && (ev.tags & TRIGGERED) !== 0) return;
  for (const src of triggers) {
    const d = src.def;
    if (!matches(d, ev, src.tagMask)) continue;
    if (d.on === 'hitTaken' && ev.on === 'hitTaken') {
      w.trig.taken[src.key] = (w.trig.taken[src.key] ?? 0) + ev.damage;
      if (w.trig.taken[src.key] < ((d.threshold ?? 0) / 100) * w.player.def.maxLife) continue;
    }
    // The next spell in socket order; its own cooldown, not the source's (3.9).
    const turn = w.trig.next[src.key] ?? 0;
    const skill = src.skills.length ? src.skills[turn % src.skills.length] : undefined;
    const cdKey = skill ? `${src.key}:${skill.key}` : src.key;
    if ((w.trig.cooldown[cdKey] ?? 0) > 0) continue;
    if (d.chance < 100 && !w.rngTrig.chance(d.chance / 100)) continue;
    if (!perform(w, d.effect, ev, skill)) continue;
    w.trig.cooldown[cdKey] = d.cooldown;
    w.trig.next[src.key] = turn + 1;
    if (d.on === 'hitTaken') w.trig.taken[src.key] = 0;
  }
}

/** Run a trigger's effect. Returns whether it happened (so the cooldown starts). */
function perform(
  w: World,
  e: TriggerEffect,
  ev: TriggerEvent,
  skill: SkillChoice | undefined,
): boolean {
  switch (e.kind) {
    case 'castSocketed':
    case 'castGranted':
      return skill ? castTriggered(w, skill, ev) : false;
    case 'explode':
      return ev.on === 'kill' && explode(w, e, ev.target);
    case 'spread':
      return ev.on === 'kill' && spread(w, e, ev.target);
    case 'storm':
      if (ev.on !== 'kill') return false;
      startStorm(
        w,
        e.seconds,
        e.interval,
        e.radius,
        e.effectiveness,
        DAMAGE_TYPES.indexOf(e.dtype),
      );
      return true;
    case 'recover':
      return recover(w, e);
    case 'sacrifice':
      return sacrifice(w, e);
  }
}

function nearestEnemy(w: World): Actor | null {
  const p = w.player;
  let best: Actor | null = null;
  let bd = 12;
  for (const a of w.actors) {
    if (a.isPlayer || !a.alive) continue;
    const d = Math.hypot(a.x - p.x, a.y - p.y);
    if (d < bd) {
      bd = d;
      best = a;
    }
  }
  return best;
}

function castTriggered(w: World, choice: SkillChoice, ev: TriggerEvent): boolean {
  // A spell cast on a kill goes to the next enemy, or lands where the dead one fell.
  const target =
    ('target' in ev && ev.target.alive ? ev.target : null) ??
    nearestEnemy(w) ??
    (ev.on === 'kill' ? ev.target : null);
  if (!target) return false;
  const prof = w.char.profile(choice, playerConds(w, target), flaskMask(w));
  const act: Action = {
    profile: prof,
    which: 'triggered',
    hand: 0,
    duration: 0,
    elapsed: 0,
    fired: true,
    echoes: 0,
    targetId: target.id,
    aimX: target.x,
    aimY: target.y,
  };
  w.events.push({ t: 'trigger', skill: prof.skill.id, kind: ev.on });
  w.trig.busy = true;
  try {
    fire(w, w.player, act);
  } finally {
    w.trig.busy = false;
  }
  return true;
}

/** An enemy that dies under a status that makes it explode (Abyssal Cry): a blast of a share of its own life. */
export function corpseBlast(
  w: World,
  dead: Actor,
  pctOfMaxLife: number,
  dtype: DamageType,
  radius: number,
): void {
  explode(w, { kind: 'explode', pctOfMaxLife, dtype, radius }, dead);
}

function explode(w: World, e: Extract<TriggerEffect, { kind: 'explode' }>, dead: Actor): boolean {
  w.trig.queue.push({
    x: dead.x,
    y: dead.y,
    r: e.radius,
    type: DAMAGE_TYPES.indexOf(e.dtype),
    amount: (dead.def.maxLife * e.pctOfMaxLife) / 100,
    from: dead.id,
  });
  drainExplosions(w);
  return true;
}

/**
 * Detonate queued explosions, at most MAX_EXPLOSIONS_PER_TICK a tick. A kill inside an explosion
 * queues the next one, so a chain runs on from tick to tick instead of recursing.
 */
function drainExplosions(w: World): void {
  const t = w.trig;
  if (t.draining) return;
  t.draining = true;
  try {
    while (t.queue.length > 0 && t.explosions < MAX_EXPLOSIONS_PER_TICK) {
      const q = t.queue.shift()!;
      t.explosions++;
      w.events.push({ t: 'explode', x: q.x, y: q.y, r: q.r, dtype: q.type });
      registerBlast(w, q.x, q.y, q.r);
      for (const o of w.actors) {
        if (o.isPlayer || !o.alive || o.id === q.from) continue;
        if (Math.hypot(o.x - q.x, o.y - q.y) > q.r + o.r) continue;
        wake(w, o);
        rawHit(w, o, q.amount, q.type);
      }
    }
  } finally {
    t.draining = false;
  }
}

function spread(w: World, e: Extract<TriggerEffect, { kind: 'spread' }>, dead: Actor): boolean {
  let any = false;
  for (const o of w.actors) {
    if (o.isPlayer || !o.alive || o.id === dead.id) continue;
    if (Math.hypot(o.x - dead.x, o.y - dead.y) > e.radius + o.r) continue;
    if (e.ailment === 'shock' && dead.ail.shock > 0) {
      if (o.ail.shock < dead.ail.shock) {
        o.ail.shock = dead.ail.shock;
        o.ail.shockT = Math.max(o.ail.shockT, dead.ail.shockT);
        w.events.push({ t: 'ailment', dst: o.id, kind: 'shock' });
      }
      any = true;
    } else if (e.ailment === 'ignite' && dead.ail.ignites.length > 0) {
      let best = dead.ail.ignites[0];
      for (const d of dead.ail.ignites) if (d.dps > best.dps) best = d;
      pushDot(o.ail.ignites, { dps: best.dps, t: best.t });
      w.events.push({ t: 'ailment', dst: o.id, kind: 'ignite' });
      any = true;
    }
  }
  return any;
}

function sacrifice(w: World, e: Extract<TriggerEffect, { kind: 'sacrifice' }>): boolean {
  const p = w.player;
  const amount = Math.min(Math.max(0, p.life - 1), (e.pctOfLife / 100) * p.def.maxLife);
  if (amount <= 0) return false;
  p.life -= amount;
  if (e.pool === 'es') p.es = Math.min(p.def.maxEs, p.es + amount);
  else p.mana = Math.min(p.def.maxMana - reservedMana(w), p.mana + amount);
  return true;
}

function recover(w: World, e: Extract<TriggerEffect, { kind: 'recover' }>): boolean {
  const p = w.player;
  const amount = (e.value / 100) * (e.pctOf === 'armour' ? p.def.armour : p.def.maxLife);
  if (amount <= 0) return false;
  if (e.pool === 'life') p.life = Math.min(lifeCap(w, p), p.life + amount);
  else if (e.pool === 'es') p.es = Math.min(p.def.maxEs, p.es + amount);
  else p.mana = Math.min(p.def.maxMana - reservedMana(w), p.mana + amount);
  return true;
}

/** Per-tick upkeep: cooldowns run down, and the explosion budget refills. */
export function tickTriggers(w: World, dt: number): void {
  w.trig.explosions = 0;
  const cd = w.trig.cooldown;
  for (const k of Object.keys(cd)) if (cd[k] > 0) cd[k] = Math.max(0, cd[k] - dt);
  drainExplosions(w);
}
