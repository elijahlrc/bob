/**
 * The geometry of the passive tree view on a touch screen (docs/MOBILE.md 3.4): which node a finger means, what a
 * two-finger pinch does to the view, and how to fit the view to an area. Pure functions, no DOM.
 */
export type Pt = { x: number; y: number };
/** The view: tree units are scaled by `k` and moved by (`x`, `y`) pixels. */
export type View = { x: number; y: number; k: number };
export type HitNode = { id: number; x: number; y: number; r: number };

export const K_MIN = 0.05;
export const K_MAX = 1.5;

export const clampK = (k: number): number => Math.max(K_MIN, Math.min(K_MAX, k));

/** The node a tap at screen point (`sx`, `sy`) means: the closest one within its reach, or null. A node's reach is its
 * drawn radius, but never less than `minPx` on screen, so a fingertip does not need to land on a 5 px dot. */
export function nearestNode(
  nodes: readonly HitNode[],
  v: View,
  sx: number,
  sy: number,
  minPx: number,
): number | null {
  let best: number | null = null;
  let bestD = Infinity;
  for (const n of nodes) {
    const d = Math.hypot(n.x * v.k + v.x - sx, n.y * v.k + v.y - sy);
    if (d <= Math.max(n.r * v.k, minPx) && d < bestD) {
      bestD = d;
      best = n.id;
    }
  }
  return best;
}

/** The view after a pinch: the tree point that was under the first midpoint ends under the second one, and the scale
 * follows the change of distance between the two fingers. */
export function pinchView(v0: View, from: [Pt, Pt], to: [Pt, Pt]): View {
  const d0 = Math.hypot(from[0].x - from[1].x, from[0].y - from[1].y) || 1;
  const d1 = Math.hypot(to[0].x - to[1].x, to[0].y - to[1].y);
  const k = clampK(v0.k * (d1 / d0));
  const m0 = { x: (from[0].x + from[1].x) / 2, y: (from[0].y + from[1].y) / 2 };
  const m1 = { x: (to[0].x + to[1].x) / 2, y: (to[0].y + to[1].y) / 2 };
  const tx = (m0.x - v0.x) / v0.k;
  const ty = (m0.y - v0.y) / v0.k;
  return { k, x: m1.x - tx * k, y: m1.y - ty * k };
}

/** Zoom by a factor around a screen point (the wheel, and the + and − buttons). */
export function zoomAt(v: View, factor: number, sx: number, sy: number): View {
  const k = clampK(v.k * factor);
  return { k, x: sx - ((sx - v.x) * k) / v.k, y: sy - ((sy - v.y) * k) / v.k };
}

/** The view that shows a box of tree units in a `w` × `h` pixel area, with a margin of `pad` tree units. */
export function fitView(
  box: { minX: number; minY: number; maxX: number; maxY: number },
  w: number,
  h: number,
  pad: number,
): View {
  const bw = box.maxX - box.minX + 2 * pad;
  const bh = box.maxY - box.minY + 2 * pad;
  const k = clampK(Math.min(w / bw, h / bh));
  const cx = (box.minX + box.maxX) / 2;
  const cy = (box.minY + box.maxY) / 2;
  return { k, x: w / 2 - cx * k, y: h / 2 - cy * k };
}
