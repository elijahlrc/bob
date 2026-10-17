import {
  STEP_FROM,
  STEP_INTERVAL,
  STEP_OF_VARIANT,
  STEP_TO,
  STEPS,
  type StepId,
} from '../data/steps';
import { monsterHitOf } from './combat';
import type { Actor, GroundEffect, World } from './types';
import { hunted } from './side';

/**
 * A monster's teleport (data/steps.ts): the spot where the character stands is marked on the ground, the monster holds still
 * for the warning, then it is there, with the burst and ground of the spell. A Blinking monster does it on a clock; some
 * types have one for a sidearm. The state is kept here, not on the actor: it is a few seconds long and few monsters have it.
 */
type Wind = { t: number; x: number; y: number; id: StepId; marks: number[] };

const winds = new WeakMap<Actor, Wind>();

/** Whether a monster is holding still for a step (the AI leaves it alone until it lands). */
export const stepping = (m: Actor): boolean => winds.has(m);

/** The slot of a Blinking monster's timer in `abT`, past the abilities of any type and the Charging mod's. */
const SLOT = 10;

function mark(
  w: World,
  m: Actor,
  x: number,
  y: number,
  radius: number,
  mult: number,
  id: StepId,
  landing: boolean,
): number {
  const s = STEPS[id];
  const hit = monsterHitOf(m);
  const e: GroundEffect = {
    id: w.nextId++,
    x,
    y,
    radius,
    t: s.warn,
    total: s.warn,
    kind: 'slam',
    shape: 'circle',
    damage: mult * hit,
    dtype: s.dtype,
    team: 1,
    label: s.name,
    owner: m.id,
  };
  if (landing && s.leaves) e.leaves = { ...s.leaves, dps: s.leaves.dps * hit };
  w.effects.push(e);
  return e.id;
}

/**
 * The monster begins a step onto the character. Returns whether it did (it does not while it is acting, stunned, phased out
 * or already stepping).
 */
export function beginStep(w: World, m: Actor, id: StepId): boolean {
  if (winds.has(m) || m.action || m.stunT > 0 || m.phaseT > 0 || m.blinkT > 0 || m.dash.t > 0) {
    return false;
  }
  const p = hunted(w, m);
  const s = STEPS[id];
  const marks = [mark(w, m, p.x, p.y, s.radius, s.mult, id, true)];
  if (s.departs) marks.push(mark(w, m, m.x, m.y, s.departs.radius, s.departs.mult, id, false));
  winds.set(m, { t: s.warn, x: p.x, y: p.y, id, marks });
  m.facing = Math.atan2(p.y - m.y, p.x - m.x);
  w.events.push({ t: 'blink', id: m.id, x: m.x, y: m.y, end: false, dtype: s.dtype });
  return true;
}

/** A step that did not happen (the monster was stunned or died): its marks are wiped off the ground. */
export function cancelStep(w: World, m: Actor): void {
  const s = winds.get(m);
  if (!s) return;
  winds.delete(m);
  w.effects = w.effects.filter((e) => !s.marks.includes(e.id));
}

/** Run a step for one tick: a stun breaks it, and when the warning is over the monster is on the spot. */
export function tickStep(w: World, m: Actor, dt: number): void {
  const s = winds.get(m);
  if (!s) return;
  if (m.stunT > 0) {
    cancelStep(w, m);
    return;
  }
  s.t -= dt;
  if (s.t > 0) return;
  winds.delete(m);
  const to = w.grid.collide(s.x, s.y, m.r);
  m.x = to.x;
  m.y = to.y;
  // A veiled monster that lands beside the character is seen.
  m.revealT = 1.5;
  w.events.push({ t: 'blink', id: m.id, x: m.x, y: m.y, end: true, dtype: STEPS[s.id].dtype });
}

/**
 * The Blinking mod: if the character is in sight and neither too near nor too far, it steps, every few seconds. The first is soon
 * after it sets out, so that it pounces as a pack comes in; one that is already at arm's length has no use for it.
 */
export function tickBlinking(w: World, m: Actor, dt: number): void {
  if (winds.has(m)) return;
  m.abT[SLOT] = (m.abT[SLOT] ?? w.rngAi.float(0.5, 3)) - dt;
  if (m.abT[SLOT] > 0) return;
  const p = hunted(w, m);
  const d = Math.hypot(p.x - m.x, p.y - m.y);
  if (d < STEP_FROM || d > STEP_TO || !w.grid.los(m.x, m.y, p.x, p.y)) return;
  // Not now (it is in the middle of a blow, or stunned): ask again soon.
  m.abT[SLOT] = beginStep(w, m, STEP_OF_VARIANT[m.mon!.spec.variant]) ? STEP_INTERVAL : 0.5;
}
