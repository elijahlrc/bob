import { COLLAPSE_SPEED, COLLAPSE_START } from '../data/mapTypes';
import type { Labyrinth } from '../gen/labyrinth';
import { rawHit } from './combat';
import type { World } from './types';

/**
 * Collapse (docs/MAPS.md 9.2): after a minute the way behind the character starts to fall in, from the entrance
 * onward. The front moves along the main path at a steady speed; a character caught behind it is crushed. It cannot
 * be fought: the map is a race to the exit.
 */
export type PathMeasure = {
  pts: { x: number; y: number }[];
  /** Distance along the path to each point. */
  cum: number[];
  total: number;
};

const cache = new WeakMap<Labyrinth, PathMeasure>();

/** The way through the map: the entrance, the centre of each room on the main path, and the exit. */
export function measurePath(lab: Labyrinth): PathMeasure {
  const hit = cache.get(lab);
  if (hit) return hit;
  const pts = [
    { x: lab.start.x, y: lab.start.y },
    ...lab.mainPath.map((id) => ({ x: lab.rooms[id].cx + 0.5, y: lab.rooms[id].cy + 0.5 })),
    { x: lab.exit.x, y: lab.exit.y },
  ];
  const cum = [0];
  for (let i = 1; i < pts.length; i++)
    cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const m = { pts, cum, total: cum[cum.length - 1] };
  cache.set(lab, m);
  return m;
}

/** How far along the path the nearest point to (x, y) is. */
export function pathProgress(m: PathMeasure, x: number, y: number): number {
  let best = Infinity;
  let at = 0;
  for (let i = 1; i < m.pts.length; i++) {
    const a = m.pts[i - 1];
    const b = m.pts[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    const t = len2 > 0 ? Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / len2)) : 0;
    const d = Math.hypot(a.x + t * dx - x, a.y + t * dy - y);
    if (d < best) {
      best = d;
      at = m.cum[i - 1] + t * Math.sqrt(len2);
    }
  }
  return at;
}

/** How far along the path the collapse has reached at a time in the map (0 before it starts). */
export function collapseFront(t: number): number {
  return Math.max(0, (t - COLLAPSE_START) * COLLAPSE_SPEED);
}

/** Each tick on a Collapse map: move the front, and crush a character that is behind it. */
export function tickCollapse(w: World): void {
  if (w.plan.type !== 'collapse' || w.status !== 'running') return;
  w.collapseFront = collapseFront(w.t);
  if (w.collapseFront <= 0) return;
  const p = w.player;
  const m = measurePath(w.plan.lab);
  w.collapseGap = pathProgress(m, p.x, p.y) - w.collapseFront;
  if (w.collapseGap < 0 && p.alive) rawHit(w, p, 1e9, 0, 'The Collapse');
}
