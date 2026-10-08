import type { MoveSpec, Senses } from '../data/movement';
import { MONSTER_TYPES } from '../data/monsters';
import { flankPoint, frontOf } from './packs';
import type { Actor, World } from './types';

/**
 * How a monster moves and whom it goes for (docs/ROSTER.md 6.3 and 6.4). The pathing and the stepping stay in `ai.ts`; a
 * style here decides where to steer, how fast, or whether to move at all this tick, from a little state on the actor
 * (`m.mv`). Randomness is a hash of the actor's id and a counter, never `Math.random`, so a reload plays the same map.
 */

export type MoveState = {
  /** Seconds left in the current phase of a style (a lunge or a pause, a zig or a zag, a withdrawal, a hiding). */
  t: number;
  /** 0 moving or approaching, 1 still or withdrawing. */
  phase: number;
  /** Which way a skitter zigs, and which way an orbit goes (1 or -1). */
  sign: number;
  /** How many times a hash has been asked for. */
  n: number;
  /** A momentum's current speed multiple. */
  ramp: number;
  /** It has struck since the movement last looked (the cue for a swoop or for cover). */
  attacked: boolean;
  /** Seconds a circle has left. A negative value means it is not yet in a circle's reach. */
  orbitT: number;
  /** Where it hides. */
  coverX: number;
  coverY: number;
  /** The monster it keeps to, and when it looks for one again. */
  anchorId: number;
  anchorT: number;
  /** A tether: seconds it has held its ground (it comes out after three), or, below nought, seconds left of coming out. */
  holdT: number;
  /** Whether it could see its target when it last looked (a skitter looks at each turn, not each tick). */
  seen: boolean;
};

export function newMoveState(): MoveState {
  return {
    t: 0,
    phase: 0,
    sign: 1,
    n: 0,
    ramp: 1,
    attacked: false,
    orbitT: -1,
    coverX: 0,
    coverY: 0,
    anchorId: 0,
    anchorT: 0,
    holdT: 0,
    seen: false,
  };
}

/** A number in [0, 1) from the actor and a counter: the same every time the map is played. */
function hash01(id: number, n: number): number {
  let h = (Math.imul(id + 1, 0x9e3779b1) ^ Math.imul(n + 7, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39) >>> 0;
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

const NO_STYLES: MoveSpec[] = [];

/** A ranged member of a pack that is not a kiter keeps behind the front of it. */
function isHoldingLine(m: Actor): boolean {
  const t = m.mon!.kind;
  return (
    t.role === 'ranged' &&
    t.attack !== 'melee' &&
    !t.stationary &&
    t.id !== 'slinger' &&
    t.id !== 'handler'
  );
}
const styles = (m: Actor): MoveSpec[] => m.mon!.kind.movement ?? NO_STYLES;
const NO_SENSES: Senses = Object.freeze({});
export const senseOf = (m: Actor): Senses => m.mon!.kind.senses ?? NO_SENSES;
const style = (m: Actor, id: MoveSpec['id']): MoveSpec | undefined =>
  styles(m).find((s) => s.id === id);

/** Whether the character can see this monster (a veiled one is seen only close up, or just after it strikes or is struck). */
export function revealed(w: World, m: Actor): boolean {
  const veil = m.mon ? senseOf(m).veil : undefined;
  if (!veil || m.revealT > 0) return true;
  return Math.hypot(m.x - w.player.x, m.y - w.player.y) <= veil;
}

/** The nearest living monster of the given types (or, with none given, a front-line one) near `m`. */
function nearestAlly(
  w: World,
  m: Actor,
  types: string[] | undefined,
  within: number,
): Actor | null {
  let best: Actor | null = null;
  let bd = within;
  for (const o of w.actors) {
    if (o === m || o.isPlayer || !o.alive || !o.mon) continue;
    const t = o.mon.spec.type;
    if (types ? !types.includes(t) : MONSTER_TYPES[t].role !== 'front') continue;
    const d = Math.hypot(o.x - m.x, o.y - m.y);
    if (d < bd) {
      bd = d;
      best = o;
    }
  }
  return best;
}

/** The anchor of a tether or a follow: looked for twice a second, kept while it lives. */
function anchorOf(w: World, m: Actor, s: MoveSpec, dt: number): Actor | null {
  const mv = m.mv;
  mv.anchorT -= dt;
  const kept = mv.anchorId ? w.actors.find((a) => a.id === mv.anchorId && a.alive) : undefined;
  if (kept && mv.anchorT > 0) return kept;
  if (mv.anchorT > 0 && !kept) return null;
  mv.anchorT = 0.5;
  const found = nearestAlly(w, m, s.anchors, 14);
  mv.anchorId = found ? found.id : 0;
  return found;
}

/** A spot near `m` that the target cannot see, reachable in a straight line; null where there is none. */
function findCover(
  w: World,
  m: Actor,
  from: Actor,
  reach: number,
): { x: number; y: number } | null {
  let best: { x: number; y: number; d: number } | null = null;
  const base = hash01(m.id, m.mv.n++) * Math.PI * 2;
  for (let k = 0; k < 12; k++) {
    const a = base + (k / 12) * Math.PI * 2;
    for (const r of [reach * 0.5, reach]) {
      const x = m.x + Math.cos(a) * r;
      const y = m.y + Math.sin(a) * r;
      if (!w.grid.isFloor(Math.floor(x), Math.floor(y))) continue;
      if (!w.grid.los(m.x, m.y, x, y) || w.grid.los(x, y, from.x, from.y)) continue;
      if (!best || r < best.d) best = { x, y, d: r };
    }
  }
  return best;
}

/** Where a monster that is hiding goes, if it is. */
export function hidingSpot(m: Actor): { x: number; y: number } | null {
  return m.mv.t > 0 && m.mv.phase === 2 ? { x: m.mv.coverX, y: m.mv.coverY } : null;
}

/**
 * After a blow: a swoop withdraws, cover hides, a momentum starts again from nothing. Looked at before the monster decides
 * whether to strike again, or it would never get the chance.
 */
export function afterBlow(w: World, m: Actor, tgt: Actor): void {
  const mv = m.mv;
  if (!mv.attacked || m.action) return;
  mv.attacked = false;
  if (styles(m) === NO_STYLES) return;
  const sw = style(m, 'swoop');
  if (sw) {
    mv.phase = 1;
    mv.t = (sw.back ?? 3) / (m.def.moveSpeed * 1.2);
  }
  const co = style(m, 'cover');
  if (co) {
    const spot = findCover(w, m, tgt, co.back ?? 4);
    if (spot) {
      mv.coverX = spot.x;
      mv.coverY = spot.y;
      mv.phase = 2;
      mv.t = 1.3;
    }
  }
  const mo = style(m, 'momentum');
  if (mo) mv.ramp = mo.from ?? 0.5;
}

/** A stunned monster has lost its momentum (called while it cannot act, when the styles are not being asked). */
export function whileStunned(m: Actor): void {
  if (m.stunT <= 0 && m.ail.freezeT <= 0) return;
  const mo = m.mon && style(m, 'momentum');
  if (mo && (m.stunT > 0 || m.ail.freezeT > 0)) m.mv.ramp = mo.from ?? 0.5;
}

/** Whether a monster is withdrawing or hiding after a blow, and so does not strike. */
export function withdrawing(m: Actor): boolean {
  const mv = m.mv;
  if (mv.t <= 0) return false;
  return mv.t > 0 && (mv.phase === 2 || (mv.phase === 1 && !!style(m, 'swoop')));
}

/** What a style wants this tick: a point to steer to and a share of its speed, or nothing (stand still). */
export type Steer = { x: number; y: number; pace: number } | null;

/**
 * Update the timers of a monster's styles and say where it should go to reach `tgt`: the target by default, something else
 * when a style says so. `d` is its distance to the target.
 */
export function steer(w: World, m: Actor, tgt: Actor, d: number, dt: number): Steer {
  const mv = m.mv;
  const list = styles(m);
  let sx = tgt.x;
  let sy = tgt.y;
  // A pack: a melee member takes a slot round the target, a ranged one keeps behind its front (docs/ROSTER.md 6.7).
  if (m.pack >= 0 && d > 4) {
    const slot = flankPoint(w, m, tgt, d);
    if (slot) {
      sx = slot.x;
      sy = slot.y;
    } else if (list.length === 0 && isHoldingLine(m)) {
      const front = frontOf(w, m);
      if (front) {
        const dx = front.x - tgt.x;
        const dy = front.y - tgt.y;
        const l = Math.hypot(dx, dy) || 1;
        sx = front.x + (dx / l) * 2.5;
        sy = front.y + (dy / l) * 2.5;
        if (Math.hypot(sx - m.x, sy - m.y) < 1.2) return null;
      }
    }
  }
  // Most monsters have no style: the target (or their place in the pack), at their own pace, with nothing more worked out.
  if (list.length === 0) return { x: sx, y: sy, pace: 1 };
  let pace = 1;
  let seen: boolean | undefined;
  const los = (): boolean => (seen ??= w.grid.los(m.x, m.y, tgt.x, tgt.y));

  const mo = style(m, 'momentum');
  if (mo && (m.stunT > 0 || m.ail.chill > 0.2 || m.ail.freezeT > 0)) mv.ramp = mo.from ?? 0.5;

  for (const s of list) {
    switch (s.id) {
      case 'lurch':
      case 'hop': {
        // Moves in bursts and stands still between them.
        mv.t -= dt;
        if (mv.phase === 1) {
          if (mv.t <= 0) {
            mv.phase = 0;
            mv.t = s.go ?? 1;
          }
          return null;
        }
        if (mv.t <= 0) {
          mv.phase = 1;
          mv.t = s.stop ?? 0.8;
          return null;
        }
        pace *= s.pace ?? 1.6;
        break;
      }
      case 'momentum': {
        const from = s.from ?? 0.5;
        const to = s.to ?? 1.5;
        if (mv.ramp < from) mv.ramp = from;
        mv.ramp = Math.min(to, mv.ramp + ((to - from) / (s.seconds ?? 2.5)) * dt);
        pace *= mv.ramp;
        break;
      }
      case 'kamikaze':
        pace *= 1.4;
        break;
      case 'skitter': {
        if (d > 2.4 && d < 9) {
          mv.t -= dt;
          if (mv.t <= 0) {
            mv.t = s.every ?? 0.4;
            mv.sign = hash01(m.id, mv.n++) < 0.5 ? -1 : 1;
            mv.seen = los();
          }
          if (!mv.seen) break;
          const a =
            Math.atan2(tgt.y - m.y, tgt.x - m.x) + (mv.sign * (s.angle ?? 35) * Math.PI) / 180;
          sx = m.x + Math.cos(a) * 4;
          sy = m.y + Math.sin(a) * 4;
        }
        break;
      }
      case 'swoop': {
        if (mv.phase === 1) {
          mv.t -= dt;
          if (mv.t <= 0) mv.phase = 0;
          else {
            const dx = m.x - tgt.x;
            const dy = m.y - tgt.y;
            const l = Math.hypot(dx, dy) || 1;
            return { x: m.x + (dx / l) * 5, y: m.y + (dy / l) * 5, pace: 1.2 };
          }
        }
        break;
      }
      case 'orbit': {
        const ring = s.ring ?? 3.5;
        if (d > ring * 2.6) mv.orbitT = -1;
        else if (mv.orbitT < 0 && d <= ring * 1.6) {
          mv.orbitT = s.seconds ?? 1.6;
          mv.sign = hash01(m.id, mv.n++) < 0.5 ? -1 : 1;
        }
        if (mv.orbitT > 0 && los()) {
          mv.orbitT -= dt;
          const a =
            Math.atan2(m.y - tgt.y, m.x - tgt.x) + (mv.sign * (m.def.moveSpeed * dt)) / ring;
          sx = tgt.x + Math.cos(a) * ring;
          sy = tgt.y + Math.sin(a) * ring;
        }
        break;
      }
      case 'tether': {
        const a = anchorOf(w, m, s, dt);
        if (!a) break;
        const r = s.radius ?? 6;
        if (Math.hypot(tgt.x - a.x, tgt.y - a.y) <= r + 1) {
          mv.holdT = 0;
          break;
        }
        // Out of the pack's ground it holds, but not for ever (a shield that is only shot at is a standoff): after three
        // seconds it comes out, for six.
        if (mv.holdT < 0) {
          mv.holdT = Math.min(0, mv.holdT + dt);
          break;
        }
        mv.holdT += dt;
        if (mv.holdT > 3) {
          mv.holdT = -6;
          break;
        }
        // The target is outside the pack's ground: go home, and stand there.
        if (Math.hypot(a.x - m.x, a.y - m.y) <= 2) return null;
        sx = a.x;
        sy = a.y;
        break;
      }
      case 'follow': {
        const a = anchorOf(w, m, s, dt);
        if (!a) break;
        // A little behind the front of the pack, on the far side from the target.
        const dx = a.x - tgt.x;
        const dy = a.y - tgt.y;
        const l = Math.hypot(dx, dy) || 1;
        sx = a.x + (dx / l) * 2.5;
        sy = a.y + (dy / l) * 2.5;
        if (Math.hypot(sx - m.x, sy - m.y) < 1.2) return null;
        break;
      }
      case 'cover': {
        if (mv.phase === 2) {
          mv.t -= dt;
          if (mv.t <= 0) mv.phase = 0;
          else {
            if (Math.hypot(mv.coverX - m.x, mv.coverY - m.y) < 0.4) return null;
            return { x: mv.coverX, y: mv.coverY, pace: 1 };
          }
        }
        break;
      }
      default:
        break;
    }
  }
  return { x: sx, y: sy, pace };
}

/** Whom a monster goes for: the character, or (for a hunter) the nearest of the character's minions first. */
export function targetOf(w: World, m: Actor): Actor {
  if (senseOf(m).target !== 'minions' || w.minions.length === 0) return w.player;
  let best: Actor | null = null;
  let bd = 12;
  for (const v of w.minions) {
    if (!v.alive) continue;
    const d = Math.hypot(v.x - m.x, v.y - m.y);
    if (d < bd) {
      bd = d;
      best = v;
    }
  }
  return best ?? w.player;
}
