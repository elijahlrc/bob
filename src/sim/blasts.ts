import { angleDiff } from '../core/math';
import { PATTERNS, type PatternId } from '../data/encounters';
import { segmentDist } from './actions';
import type { Action, Actor, GroundEffect, World } from './types';

/**
 * Shaped blasts (docs/ENCOUNTERS.md 4): a telegraphed blast on the ground may be a circle, a lane, a wedge or a donut (safe
 * inside). One test says what a blast covers, so the landing, the character's dodge (`hazardAt`) and the drawing agree.
 */
export function inBlast(e: GroundEffect, x: number, y: number, margin = 0): boolean {
  switch (e.shape) {
    case 'lane':
      return segmentDist(x, y, e.x, e.y, e.x2!, e.y2!) <= e.width! / 2 + margin;
    case 'donut': {
      const d = Math.hypot(x - e.x, y - e.y);
      return d + margin > e.inner! && d - margin <= e.radius;
    }
    case 'wedge': {
      const d = Math.hypot(x - e.x, y - e.y);
      if (d > e.radius + margin) return false;
      if (d <= margin + 0.3) return true;
      return Math.abs(angleDiff(e.facing!, Math.atan2(y - e.y, x - e.x))) <= e.half! + margin / d;
    }
    default:
      return Math.hypot(x - e.x, y - e.y) <= e.radius + margin;
  }
}

/** Whether a blast is waiting to show its warning (a later step of a pattern). */
export const pending = (e: GroundEffect) => e.delay !== undefined && e.delay > 0;

/** The average hit of a profile and the damage type of its biggest part. */
function hitOf(act: Action): { hit: number; dtype: number } {
  let hit = 0;
  let dtype = 0;
  let best = -1;
  for (const c of act.profile.hands[0]?.chunks ?? []) {
    hit += (c.min + c.max) / 2;
    if (c.max > best) {
      best = c.max;
      dtype = c.type;
    }
  }
  return { hit, dtype };
}

/** The end of a lane from (x, y) along `ang`, stopped by the first wall within `len`. */
function laneEnd(
  w: World,
  x: number,
  y: number,
  ang: number,
  len: number,
): { x: number; y: number } {
  const step = 0.4;
  let d = step;
  for (; d <= len; d += step) {
    const px = x + Math.cos(ang) * d;
    const py = y + Math.sin(ang) * d;
    if (!w.grid.isFloor(Math.floor(px), Math.floor(py))) break;
  }
  d = Math.min(len, d - step);
  return { x: x + Math.cos(ang) * d, y: y + Math.sin(ang) * d };
}

/** Lay a pattern's blasts, as a monster's cast fires: each step with its own delay, shape and place. */
export function castPattern(w: World, a: Actor, act: Action, id: PatternId): void {
  const spec = PATTERNS[id];
  const { hit, dtype } = hitOf(act);
  const base = Math.atan2(act.aimY - a.y, act.aimX - a.x);
  const gap = spec.gapFrom !== undefined ? w.rngAi.int(spec.gapFrom, spec.steps.length - 1) : -1;
  for (const [i, s] of spec.steps.entries()) {
    if (i === gap) continue;
    const ox = s.from === 'self' ? a.x : act.aimX;
    const oy = s.from === 'self' ? a.y : act.aimY;
    const ang = base + ((s.angle ?? 0) * Math.PI) / 180;
    const x = ox + Math.cos(ang) * (s.dist ?? 0);
    const y = oy + Math.sin(ang) * (s.dist ?? 0);
    const warn = s.warn ?? 0.8;
    const e: GroundEffect = {
      id: w.nextId++,
      x,
      y,
      radius: s.radius ?? 1.5,
      t: warn,
      total: warn,
      kind: 'slam',
      damage: hit * (s.mult ?? 1),
      dtype,
      faction: 1,
      shape: s.shape,
      delay: s.at > 0 ? s.at : undefined,
      label: spec.name,
      owner: a.id,
      pull: s.pull,
    };
    if (s.shape === 'lane') {
      const end = laneEnd(w, x, y, ang, s.length ?? 8);
      e.x2 = end.x;
      e.y2 = end.y;
      e.width = s.width ?? 1;
      e.radius = Math.hypot(end.x - x, end.y - y) / 2;
    } else if (s.shape === 'donut') e.inner = s.inner ?? 2;
    else if (s.shape === 'wedge') {
      e.facing = ang;
      e.half = (((s.arc ?? 90) / 2) * Math.PI) / 180;
    }
    if (s.zone) e.leaves = { kind: s.zone, seconds: s.zoneSeconds ?? 3, dps: hit * 0.2 };
    w.effects.push(e);
  }
}
