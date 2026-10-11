/**
 * The primitives the tree is built from: nodes, links, clearance checks and the road between two places. Shared by the layout of
 * the clusters (`build.ts`) and the layout of the districts (`layout.ts`).
 */
import { mod, type Mod } from '../../mods/types';
import type { Attr } from './spec';
import type { TreeNode, TreeNodeKind } from './types';

/** Minimum distance between any two nodes (§9.3). */
export const MIN_NODE_DIST = 40;
/** A node closer than this to an edge it is not part of counts as "on" the edge. */
export const EDGE_CLEARANCE = 22;
/** The spacing of the attribute nodes on an old-style road between clusters. */
export const TRAVEL_SPACING = 170;

export const ATTR_NAME: Record<Attr, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  int: 'Intelligence',
};

export type Builder = {
  nodes: TreeNode[];
  edges: [number, number][];
};

export function addNode(
  b: Builder,
  kind: TreeNodeKind,
  name: string,
  mods: Mod[],
  x: number,
  y: number,
  cluster?: string,
  district?: string,
): number {
  const id = b.nodes.length;
  const n: TreeNode = {
    id,
    kind,
    name,
    mods,
    x: Math.round(x),
    y: Math.round(y),
    links: [],
    cluster,
  };
  if (district) n.district = district;
  b.nodes.push(n);
  return id;
}

export function link(b: Builder, a: number, c: number): void {
  if (a === c || b.nodes[a].links.includes(c)) return;
  b.nodes[a].links.push(c);
  b.nodes[c].links.push(a);
  b.edges.push([a, c]);
}

export function segDist(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy;
  let t = l2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function segmentClear(
  b: Builder,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  skip: Set<number>,
): boolean {
  for (const nd of b.nodes) {
    if (skip.has(nd.id)) continue;
    if (segDist(nd.x, nd.y, ax, ay, bx, by) < EDGE_CLEARANCE) return false;
  }
  return true;
}

export function pointClear(b: Builder, x: number, y: number): boolean {
  for (const nd of b.nodes) if (Math.hypot(nd.x - x, nd.y - y) < MIN_NODE_DIST) return false;
  for (const [p, q] of b.edges) {
    const A = b.nodes[p];
    const B = b.nodes[q];
    if (segDist(x, y, A.x, A.y, B.x, B.y) < EDGE_CLEARANCE) return false;
  }
  return true;
}

/** Whether the line between two places is a stretch of ring: both far from the middle and at about the same distance. */
export function isRingRoad(a: { x: number; y: number }, b: { x: number; y: number }): boolean {
  const ra = Math.hypot(a.x, a.y);
  const rb = Math.hypot(b.x, b.y);
  return Math.min(ra, rb) > 600 && Math.abs(ra - rb) < 0.05 * Math.max(ra, rb);
}

/** One kind of small node a road is made of. */
export type RoadStat = { name: string; mods: Mod[] };

export type RoadOptions = {
  /** The attributes of the attribute nodes on the road, in turn. */
  attrs: Attr[];
  /**
   * Generic small nodes (docs/TREE-REDESIGN.md 3.1): when given, the road is straight and made of these and attribute nodes in turn,
   * and its small nodes belong to no cluster. Without it the road is the old kind (attribute nodes only, bending with a ring).
   */
  pool?: RoadStat[];
  /** The distance between nodes of the road (the pool kind is denser). */
  spacing?: number;
  /** The district the road lies in, if it lies in one. */
  district?: string;
  /** A place to write why a road could not be made (a tool of review). */
  why?: string[];
};

/** A number from 0 to 2^32 for a name, to choose the same way every time. */
export function hashOf(key: string): number {
  let h = 7;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h;
}

/** Whether the segment (a to b) properly crosses an existing edge that does not end at `p` or `q`. */
export function crossesEdge(
  b: Builder,
  a: [number, number],
  c: [number, number],
  p: number,
  q: number,
): boolean {
  const orient = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) =>
    (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  for (const [i, j] of b.edges) {
    if (i === p || i === q || j === p || j === q) continue;
    const A = b.nodes[i];
    const B = b.nodes[j];
    const d1 = orient(a[0], a[1], c[0], c[1], A.x, A.y);
    const d2 = orient(a[0], a[1], c[0], c[1], B.x, B.y);
    const d3 = orient(A.x, A.y, B.x, B.y, a[0], a[1]);
    const d4 = orient(A.x, A.y, B.x, B.y, c[0], c[1]);
    if (d1 * d2 < 0 && d3 * d4 < 0) return true;
  }
  return false;
}

/** Try to connect two attach sets with a straight road; false if the way is blocked. */
export function travel(b: Builder, from: number[], to: number[], o: RoadOptions): boolean {
  const spacing = o.spacing ?? TRAVEL_SPACING;
  const attrs = o.attrs;
  const pairs: [number, number, number][] = [];
  for (const p of from)
    for (const q of to) {
      const A = b.nodes[p];
      const B = b.nodes[q];
      pairs.push([p, q, Math.hypot(A.x - B.x, A.y - B.y)]);
    }
  pairs.sort((x, y) => x[2] - y[2] || x[0] - y[0] || x[1] - y[1]);
  for (const [p, q, len] of pairs.slice(0, 12)) {
    const A = b.nodes[p];
    const B = b.nodes[q];
    if (!segmentClear(b, A.x, A.y, B.x, B.y, new Set([p, q]))) {
      o.why?.push(`${p}-${q}: a node is on the line`);
      continue;
    }
    if (o.pool && crossesEdge(b, [A.x, A.y], [B.x, B.y], p, q)) {
      o.why?.push(`${p}-${q}: crosses a road`);
      continue;
    }
    const count = Math.max(0, Math.round(len / spacing) - 1);
    const pts: [number, number][] = [];
    let ok = true;
    // An old-style road between two places at the same distance from the middle bends with the ring, as the line is drawn.
    const ra = Math.hypot(A.x, A.y);
    const rb = Math.hypot(B.x, B.y);
    const onRing = !o.pool && isRingRoad(A, B);
    const turn = onRing ? Math.atan2(A.x * B.y - A.y * B.x, A.x * B.x + A.y * B.y) : 0;
    const base = Math.atan2(A.y, A.x);
    for (let i = 1; i <= count; i++) {
      const t = i / (count + 1);
      const x = onRing ? (ra + (rb - ra) * t) * Math.cos(base + turn * t) : A.x + (B.x - A.x) * t;
      const y = onRing ? (ra + (rb - ra) * t) * Math.sin(base + turn * t) : A.y + (B.y - A.y) * t;
      if (!pointClear(b, x, y)) {
        o.why?.push(`${p}-${q}: no room at ${Math.round(x)},${Math.round(y)}`);
        ok = false;
        break;
      }
      pts.push([x, y]);
    }
    if (!ok) continue;
    let prev = p;
    pts.forEach(([x, y], i) => {
      let id: number;
      if (o.pool && i % 2 === 0) {
        const s = o.pool[hashOf(`${o.district ?? ''}:${p}:${q}:${i}`) % o.pool.length];
        id = addNode(
          b,
          'small',
          s.name,
          s.mods.map((m) => ({ ...m })),
          x,
          y,
          undefined,
          o.district,
        );
      } else {
        const at = attrs[(o.pool ? (i - 1) / 2 : i) % attrs.length];
        id = addNode(
          b,
          'travel',
          ATTR_NAME[at],
          [mod(at, 'base', 10)],
          x,
          y,
          undefined,
          o.district,
        );
      }
      link(b, prev, id);
      prev = id;
    });
    link(b, prev, q);
    return true;
  }
  return false;
}
