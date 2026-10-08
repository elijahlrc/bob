import { MONSTER_TYPES, type MonsterTypeId } from '../../data/monsters';
import { buildFigure, poseForType, type AnimName, type Prim } from './figure';

/**
 * Silhouettes (docs/ROSTER.md 4.5 and 8). The old "no two types share a silhouette" test compared the primitives as text,
 * so two skeletons that differ by one hat passed it. This rasterises a figure to a coarse mask, ignoring colour, so two
 * figures can be compared by how much of their outline they share: what a player sees at a glance.
 */

/** The window in design units (feet at the origin, up is -y) and the size of one mask cell. */
export const WIN = { x0: -48, x1: 48, y0: -112, y1: 8, cell: 2 };
export const MASK_W = (WIN.x1 - WIN.x0) / WIN.cell;
export const MASK_H = (WIN.y1 - WIN.y0) / WIN.cell;

const segDist = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
};

const side = (px: number, py: number, ax: number, ay: number, bx: number, by: number) =>
  (px - bx) * (ay - by) - (ax - bx) * (py - by);

/** Whether a point is inside a primitive. */
function inside(p: Prim, x: number, y: number): boolean {
  switch (p.k) {
    case 'circ':
      return Math.hypot(x - p.x, y - p.y) <= p.r;
    case 'cap':
      return segDist(x, y, p.x1, p.y1, p.x2, p.y2) <= p.r;
    case 'box': {
      const c = Math.cos(-p.rot);
      const s = Math.sin(-p.rot);
      const lx = (x - p.x) * c - (y - p.y) * s;
      const ly = (x - p.x) * s + (y - p.y) * c;
      return Math.abs(lx) <= p.w / 2 && Math.abs(ly) <= p.h / 2;
    }
    case 'tri': {
      const [ax, ay, bx, by, cx, cy] = p.pts;
      const d1 = side(x, y, ax, ay, bx, by);
      const d2 = side(x, y, bx, by, cx, cy);
      const d3 = side(x, y, cx, cy, ax, ay);
      const neg = d1 < 0 || d2 < 0 || d3 < 0;
      const pos = d1 > 0 || d2 > 0 || d3 > 0;
      return !(neg && pos);
    }
  }
}

/** The filled cells of a figure: one byte per cell, 1 where any primitive covers the cell centre. */
export function maskOf(prims: Prim[]): Uint8Array {
  const m = new Uint8Array(MASK_W * MASK_H);
  for (const p of prims) {
    // Bound the work to the primitive's box.
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    const grow = (x: number, y: number, r = 0) => {
      x0 = Math.min(x0, x - r);
      x1 = Math.max(x1, x + r);
      y0 = Math.min(y0, y - r);
      y1 = Math.max(y1, y + r);
    };
    if (p.k === 'circ') grow(p.x, p.y, p.r);
    else if (p.k === 'cap') {
      grow(p.x1, p.y1, p.r);
      grow(p.x2, p.y2, p.r);
    } else if (p.k === 'box') grow(p.x, p.y, Math.hypot(p.w, p.h) / 2);
    else {
      grow(p.pts[0], p.pts[1]);
      grow(p.pts[2], p.pts[3]);
      grow(p.pts[4], p.pts[5]);
    }
    const cx0 = Math.max(0, Math.floor((x0 - WIN.x0) / WIN.cell));
    const cx1 = Math.min(MASK_W - 1, Math.floor((x1 - WIN.x0) / WIN.cell));
    const cy0 = Math.max(0, Math.floor((y0 - WIN.y0) / WIN.cell));
    const cy1 = Math.min(MASK_H - 1, Math.floor((y1 - WIN.y0) / WIN.cell));
    for (let cy = cy0; cy <= cy1; cy++)
      for (let cx = cx0; cx <= cx1; cx++) {
        const wx = WIN.x0 + (cx + 0.5) * WIN.cell;
        const wy = WIN.y0 + (cy + 0.5) * WIN.cell;
        if (inside(p, wx, wy)) m[cy * MASK_W + cx] = 1;
      }
  }
  return m;
}

/** Intersection over union of two masks: 1 for the same outline, 0 for none shared. */
export function iou(a: Uint8Array, b: Uint8Array): number {
  let i = 0;
  let u = 0;
  for (let k = 0; k < a.length; k++) {
    if (a[k] && b[k]) i++;
    if (a[k] || b[k]) u++;
  }
  return u === 0 ? 1 : i / u;
}

/** The poses a type is compared in: standing, and mid-stride. */
const POSES: [AnimName, number][] = [
  ['idle', 0],
  ['walk', 0.25],
];

/** The outline of a monster type in each pose (a normal monster, no rarity scale). */
export function typeMasks(id: MonsterTypeId): Uint8Array[] {
  const body = MONSTER_TYPES[id].body;
  return POSES.map(([anim, t]) => maskOf(buildFigure(body, poseForType(id, anim, t), id, t)));
}

/** How alike two types look: the larger overlap of their outlines over the poses (1 is identical). */
export function similarity(a: Uint8Array[], b: Uint8Array[]): number {
  let best = 0;
  for (let k = 0; k < a.length; k++) best = Math.max(best, iou(a[k], b[k]));
  return best;
}

export type PairScore = { a: MonsterTypeId; b: MonsterTypeId; sim: number; sameFaction: boolean };

/** Every pair of types, most alike first. */
export function pairScores(
  ids: MonsterTypeId[] = Object.keys(MONSTER_TYPES) as MonsterTypeId[],
): PairScore[] {
  const masks = new Map(ids.map((id) => [id, typeMasks(id)]));
  const out: PairScore[] = [];
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++)
      out.push({
        a: ids[i],
        b: ids[j],
        sim: similarity(masks.get(ids[i])!, masks.get(ids[j])!),
        sameFaction: MONSTER_TYPES[ids[i]].faction === MONSTER_TYPES[ids[j]].faction,
      });
  return out.sort((x, y) => y.sim - x.sim);
}
