import type { SkillChoice } from '../calc/character';
import { reservedMana } from './reserve';
import type { TriggerDef, TriggerEffect } from '../data/triggers';
import { DAMAGE_TYPES, maskOr, maskSubset, tagBit, type DamageType } from '../mods/types';
import { applyFlatDot } from './skillDots';
import { fire } from './actions';
import { registerBlast } from './factions';
import { startStorm } from './fields';
import { flaskMask, lifeCap, playerConds, playerCtx, pushDot, rawHit, wake } from './combat';
import type { Actor, Action, World } from './types';
import { eachEnemy, livingEnemiesOf } from './side';
import type { Side } from './side';

/**
 * Triggers (EXPANSION 5.5). Rules, as in the reference game (the mechanics audit):
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
  | { on: 'stunned' }
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
export function fireTriggers(w: World, s: Side, ev: TriggerEvent): void {
  const triggers = s.char.triggers;
  if (triggers.length === 0 || s.trig.busy || !s.player.alive) return;
  if ('tags' in ev && (ev.tags & TRIGGERED) !== 0) return;
  for (const src of triggers) {
    const d = src.def;
    if (!matches(d, ev, src.tagMask)) continue;
    if (d.on === 'hitTaken' && ev.on === 'hitTaken') {
      s.trig.taken[src.key] = (s.trig.taken[src.key] ?? 0) + ev.damage;
      if (s.trig.taken[src.key] < ((d.threshold ?? 0) / 100) * s.player.def.maxLife) continue;
    }
    // The next spell in socket order; its own cooldown, not the source's (as in the reference game).
    const turn = s.trig.next[src.key] ?? 0;
    const skill = src.skills.length ? src.skills[turn % src.skills.length] : undefined;
    const cdKey = skill ? `${src.key}:${skill.key}` : src.key;
    if ((s.trig.cooldown[cdKey] ?? 0) > 0) continue;
    if (d.chance < 100 && !w.rngTrig.chance(d.chance / 100)) continue;
    if (!perform(w, s, d.effect, ev, skill)) continue;
    s.trig.cooldown[cdKey] = d.cooldown;
    s.trig.next[src.key] = turn + 1;
    if (d.on === 'hitTaken') s.trig.taken[src.key] = 0;
  }
}

/** Run a trigger's effect. Returns whether it happened (so the cooldown starts). */
function perform(
  w: World,
  s: Side,
  e: TriggerEffect,
  ev: TriggerEvent,
  skill: SkillChoice | undefined,
): boolean {
  switch (e.kind) {
    case 'castSocketed':
    case 'castGranted':
      return skill ? castTriggered(w, s, skill, ev) : false;
    case 'explode':
      return ev.on === 'kill' && explode(w, s, e, ev.target);
    case 'spread':
      return ev.on === 'kill' && spread(w, e, ev.target);
    case 'overkillBurn':
      return ev.on === 'kill' && overkillBurn(w, s, e, ev.target);
    case 'storm':
      if (ev.on !== 'kill') return false;
      startStorm(
        w,
        s,
        e.seconds,
        e.interval,
        e.radius,
        e.effectiveness,
        DAMAGE_TYPES.indexOf(e.dtype),
      );
      return true;
    case 'recover':
      return recover(s, e);
    case 'sacrifice':
      return sacrifice(s, e);
  }
}

function nearestEnemy(w: World, s: Side): Actor | null {
  const p = s.player;
  let best: Actor | null = null;
  let bd = 12;
  for (const a of livingEnemiesOf(w, s.team)) {
    const d = Math.hypot(a.x - p.x, a.y - p.y);
    if (d < bd) {
      bd = d;
      best = a;
    }
  }
  return best;
}

function castTriggered(w: World, s: Side, choice: SkillChoice, ev: TriggerEvent): boolean {
  // A spell cast on a kill goes to the next enemy, or lands where the dead one fell.
  const target =
    ('target' in ev && ev.target.alive ? ev.target : null) ??
    nearestEnemy(w, s) ??
    (ev.on === 'kill' ? ev.target : null);
  if (!target) return false;
  // A triggered blink would carry the character off at the trigger's whim: only the other utility kinds are cast this way.
  if (choice.skill.utility?.kind === 'blink') return false;
  const prof = s.char.profile(choice, playerConds(w, s, target), flaskMask(s));
  const act: Action = {
    profile: prof,
    // A buff, curse, shout, summon or offering is carried out as the character's own cast of it is (src/sim/utility.ts).
    which: choice.skill.utility ? 'utility' : 'triggered',
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
  s.trig.busy = true;
  try {
    fire(w, s.player, act);
  } finally {
    s.trig.busy = false;
  }
  return true;
}

/** An enemy that dies under a status that makes it explode (a war cry's): a blast of a share of its own life. */
export function corpseBlast(
  w: World,
  s: Side,
  dead: Actor,
  pctOfMaxLife: number,
  dtype: DamageType,
  radius: number,
): void {
  explode(w, s, { kind: 'explode', pctOfMaxLife, dtype, radius }, dead);
}

/** A kill that went past the enemy's life sets the enemies near it burning, by the damage it had to spare. */
function overkillBurn(
  w: World,
  s: Side,
  e: Extract<TriggerEffect, { kind: 'overkillBurn' }>,
  dead: Actor,
): boolean {
  const over = dead.overkill ?? 0;
  if (over <= 0) return false;
  const ctx = playerCtx(
    w,
    s,
    maskOr(tagBit('dot'), tagBit('fire')),
    1 << DAMAGE_TYPES.indexOf('fire'),
  );
  const dps = (over * e.pct * s.char.db.mult('damage', ctx)) / 100;
  for (const o of livingEnemiesOf(w, s.team)) {
    if (Math.hypot(o.x - dead.x, o.y - dead.y) > e.radius + o.r) continue;
    applyFlatDot(w, o, '@herald', 3, dps, e.seconds, s);
  }
  return true;
}

function explode(
  w: World,
  s: Side,
  e: Extract<TriggerEffect, { kind: 'explode' }>,
  dead: Actor,
): boolean {
  s.trig.queue.push({
    x: dead.x,
    y: dead.y,
    r: e.radius,
    type: DAMAGE_TYPES.indexOf(e.dtype),
    amount: (dead.def.maxLife * e.pctOfMaxLife) / 100,
    from: dead.id,
  });
  drainExplosions(w, s);
  return true;
}

/**
 * Detonate queued explosions, at most MAX_EXPLOSIONS_PER_TICK a tick. A kill inside an explosion
 * queues the next one, so a chain runs on from tick to tick instead of recursing.
 */
function drainExplosions(w: World, s: Side): void {
  const t = s.trig;
  if (t.draining) return;
  t.draining = true;
  try {
    while (t.queue.length > 0 && t.explosions < MAX_EXPLOSIONS_PER_TICK) {
      const q = t.queue.shift()!;
      t.explosions++;
      w.events.push({ t: 'explode', x: q.x, y: q.y, r: q.r, dtype: q.type });
      registerBlast(w, q.x, q.y, q.r);
      eachEnemy(w, s.team, (o) => {
        if (o.id === q.from) return;
        if (Math.hypot(o.x - q.x, o.y - q.y) > q.r + o.r) return;
        wake(w, o);
        rawHit(w, o, q.amount, q.type, s, 'Explosion');
      });
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

function sacrifice(s: Side, e: Extract<TriggerEffect, { kind: 'sacrifice' }>): boolean {
  const p = s.player;
  const amount = Math.min(Math.max(0, p.life - 1), (e.pctOfLife / 100) * p.def.maxLife);
  if (amount <= 0) return false;
  p.life -= amount;
  if (e.pool === 'es') p.es = Math.min(p.def.maxEs, p.es + amount);
  else p.mana = Math.min(p.def.maxMana - reservedMana(s), p.mana + amount);
  return true;
}

function recover(s: Side, e: Extract<TriggerEffect, { kind: 'recover' }>): boolean {
  const p = s.player;
  const amount = (e.value / 100) * (e.pctOf === 'armour' ? p.def.armour : p.def.maxLife);
  if (amount <= 0) return false;
  if (e.pool === 'life') p.life = Math.min(lifeCap(p), p.life + amount);
  else if (e.pool === 'es') p.es = Math.min(p.def.maxEs, p.es + amount);
  else p.mana = Math.min(p.def.maxMana - reservedMana(s), p.mana + amount);
  return true;
}

/** Per-tick upkeep: cooldowns run down, and the explosion budget refills. */
export function tickTriggers(w: World, s: Side, dt: number): void {
  s.trig.explosions = 0;
  const cd = s.trig.cooldown;
  for (const k of Object.keys(cd)) if (cd[k] > 0) cd[k] = Math.max(0, cd[k] - dt);
  drainExplosions(w, s);
}
