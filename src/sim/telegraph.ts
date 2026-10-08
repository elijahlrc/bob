import { angleDiff } from '../core/math';
import { HIT_AT } from '../data/constants';
import { segmentDist } from './actions';
import type { World } from './types';

/**
 * The warnings of monsters' area attacks (docs/ROSTER.md 5.3). A monster's sweep, slam, lob, nova or lance winds up for 60%
 * of its use time before it lands; while it does, the shape it will hit is known (its aim stops following the target a way
 * in). This reads that shape off the monster's action, for two readers: the renderer, which draws it on the ground, and the
 * character's auto-dodge, which steps out of it (`hazardAt` in `ai.ts`). Nothing is stored: the action is the state.
 */
export type Telegraph =
  /** A wedge in front of the monster. */
  | {
      kind: 'arc';
      x: number;
      y: number;
      facing: number;
      half: number;
      radius: number;
      progress: number;
      dtype: number;
    }
  /** A circle: round the monster (a nova) or at the place it aims (a slam, a lob). */
  | { kind: 'ring'; x: number; y: number; radius: number; progress: number; dtype: number }
  /** A strip from the monster along its aim. */
  | {
      kind: 'lane';
      x: number;
      y: number;
      x2: number;
      y2: number;
      width: number;
      progress: number;
      dtype: number;
    };

/** The damage type of the biggest chunk of a hit (the colour of its warning). */
function dominant(p: { hands: { chunks: { type: number; max: number }[] }[] }): number {
  let dtype = 0;
  let best = -1;
  for (const c of p.hands[0]?.chunks ?? [])
    if (c.max > best) {
      best = c.max;
      dtype = c.type;
    }
  return dtype;
}

const NONE: Telegraph[] = [];
const cache = new WeakMap<World, { tick: number; list: Telegraph[] }>();

/**
 * The warnings in force now: every monster action that has not landed and has a shape worth leaving. Read once a tick (the
 * character's dodge asks for it many times while it looks for a safe spot).
 */
export function telegraphs(w: World): Telegraph[] {
  const hit = cache.get(w);
  if (hit && hit.tick === w.tick) return hit.list;
  const list = buildTelegraphs(w);
  cache.set(w, { tick: w.tick, list });
  return list;
}

function buildTelegraphs(w: World): Telegraph[] {
  let out: Telegraph[] = NONE;
  for (const a of w.actors) {
    const act = a.action;
    if (a.isPlayer || !a.alive || !act || act.fired || act.which !== 'monster') continue;
    const b = act.profile.skill.behaviour;
    const progress = Math.max(0, Math.min(1, act.elapsed / (HIT_AT * act.duration)));
    if (out === NONE) out = [];
    const dtype = dominant(act.profile);
    const scale = act.profile.radiusMult;
    if (b.kind === 'melee' && b.arc) {
      out.push({
        kind: 'arc',
        x: a.x,
        y: a.y,
        facing: a.facing,
        half: ((b.arc / 2) * Math.PI) / 180,
        radius: (b.radius ?? b.range) * scale + a.r,
        progress,
        dtype,
      });
    } else if (b.kind === 'burst') {
      const self = b.origin === 'self';
      out.push({
        kind: 'ring',
        x: self ? a.x : act.aimX,
        y: self ? a.y : act.aimY,
        radius: b.radius * scale,
        progress,
        dtype,
      });
    } else if (b.kind === 'beam') {
      const ang = Math.atan2(act.aimY - a.y, act.aimX - a.x);
      const len = b.length * scale;
      out.push({
        kind: 'lane',
        x: a.x,
        y: a.y,
        x2: a.x + Math.cos(ang) * len,
        y2: a.y + Math.sin(ang) * len,
        width: b.width * scale,
        progress,
        dtype,
      });
    }
  }
  return out;
}

/** Whether a point (with a margin, for a body's radius) is inside a warning. */
export function inTelegraph(t: Telegraph, x: number, y: number, margin = 0): boolean {
  switch (t.kind) {
    case 'ring':
      return Math.hypot(x - t.x, y - t.y) <= t.radius + margin;
    case 'lane':
      return segmentDist(x, y, t.x, t.y, t.x2, t.y2) <= t.width / 2 + margin;
    case 'arc': {
      const d = Math.hypot(x - t.x, y - t.y);
      if (d > t.radius + margin) return false;
      if (d <= margin + 0.3) return true;
      // A body of radius `margin` at distance d spans about margin / d radians more.
      return Math.abs(angleDiff(t.facing, Math.atan2(y - t.y, x - t.x))) <= t.half + margin / d;
    }
  }
}
