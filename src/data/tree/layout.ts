/**
 * The district layout of the passive tree (docs/TREE-REDESIGN.md, T3 to T5): roads first, clusters hung from them.
 *
 * A **district** (charter.ts) has a template, a small table of junctions, the roads between them and the slots clusters hang from
 * (this file), and a placement (plan.ts). The builder lays the junctions down as attribute nodes, joins them with roads of generic
 * small nodes, and hangs each cluster from one junction by its single entrance. The roads that join districts, the keystones at
 * a district's tip and the wayside clusters beside a road come after, in that order. Pure and deterministic.
 */
import { mod } from '../../mods/types';
import {
  addNode,
  ATTR_NAME,
  type RoadStat,
  EDGE_CLEARANCE,
  hashOf,
  MIN_NODE_DIST,
  pointClear,
  segDist,
  travel,
  type Builder,
  type RoadOptions,
} from './builder';
import { DISTRICTS, districtOf, type District } from './charter';
import { GEN_CLUSTERS } from './clustersGen';
import { PLACEMENT, REGION_LINKS } from './plan';
import { THEMES } from './notableThemes';
import { modKey, unitsOf } from './power';
import { ROAD_POOLS } from './roads';
import { placeCluster } from './shapes';
import {
  EXTRA_NOTABLES,
  REGIONS,
  START_RADIUS,
  HUB,
  HUB_RADIUS,
  type Attr,
  type ClusterSpec,
  type RegionDef,
  type RegionId,
} from './spec';
import type { Tree } from './types';

/** The distance between clusters along a road, from a road to the centre of a cluster, the side of a knot's cell, the spacing of road nodes. */
const PITCH = 300;
const SIDE = 150;
const HEX = 215;
const ROAD_STEP = 215;
const RUNG = 300;

type Vec = [number, number];
type Member = { id: string; role: string };
type Slot = { member: Member; j: number; face?: Vec; at?: Vec; hug?: boolean };
export type Shape = {
  junctions: Vec[];
  edges: [number, number][];
  slots: Slot[];
  gates: Record<string, number>;
  /** Junctions a keystone may hang from, best first. */
  tips: number[];
};

const rot = (v: Vec, deg: number): Vec => {
  const r = (deg * Math.PI) / 180;
  return [v[0] * Math.cos(r) - v[1] * Math.sin(r), v[0] * Math.sin(r) + v[1] * Math.cos(r)];
};
const chain = (from: number, count: number): [number, number][] =>
  Array.from({ length: Math.max(0, count - 1) }, (_, i) => [from + i, from + i + 1]);

// --- the templates (section 5.2) --------------------------------------------------------------------------------------

/** A road with clusters on both sides, one pair a junction. */
function avenue(ms: Member[]): Shape {
  const K = Math.ceil(ms.length / 2);
  const junctions: Vec[] = Array.from({ length: K }, (_, k) => [
    (k - (K - 1) / 2) * PITCH,
    70 * Math.sin(k * 1.2),
  ]);
  return {
    junctions,
    edges: chain(0, K),
    slots: ms.map((m, i) => ({
      member: m,
      j: Math.floor(i / 2),
      face: [0, i % 2 === 0 ? 1 : -1] as Vec,
    })),
    gates: { in: 0, out: K - 1 },
    tips: [K - 1],
  };
}

/** A loop road with clusters outside and inside and the nexus at the centre, on a spoke. */
function ring(ms: Member[]): Shape {
  const nexus = ms.filter((m) => m.role === 'nexus');
  const rest = ms.filter((m) => m.role !== 'nexus');
  const O = Math.ceil(rest.length * 0.58);
  let M = O + 2;
  if (M % 2) M++;
  const R = Math.max(400, (M * PITCH) / (2 * Math.PI));
  const junctions: Vec[] = [];
  const dir: Vec[] = [];
  for (let k = 0; k < M; k++) {
    const th = Math.PI + (2 * Math.PI * k) / M;
    dir.push([Math.cos(th), Math.sin(th)]);
    junctions.push([R * Math.cos(th), R * Math.sin(th)]);
  }
  const free = Array.from({ length: M - 2 }, (_, i) => (i < M / 2 - 1 ? i + 1 : i + 2));
  const spread = (n: number) =>
    Array.from({ length: n }, (_, i) => free[Math.floor((i * free.length) / n)]);
  const outside = rest.slice(0, O);
  const inside = rest.slice(O);
  const slots: Slot[] = [
    ...spread(outside.length).map((j, i) => ({ member: outside[i], j, face: dir[j] })),
    ...spread(inside.length).map((j, i) => ({
      member: inside[i],
      j: free[(Math.floor((i * free.length) / Math.max(1, inside.length)) + 2) % free.length],
      face: [-dir[j][0], -dir[j][1]] as Vec,
    })),
  ];
  const quarter = free[Math.floor(free.length / 4)];
  for (const m of nexus) slots.push({ member: m, j: quarter, at: [0, 0] });
  const edges: [number, number][] = [...chain(0, M), [M - 1, 0]];
  return {
    junctions,
    edges,
    slots,
    gates: { in: 0, out: M / 2, left: Math.round(M / 4), right: Math.round((3 * M) / 4) },
    tips: [M / 2],
  };
}

/** A stem that splits into one arm for each group, the nexus on the stem where they part. */
function fork(ms: Member[], groups: string[]): Shape {
  const used = groups.filter((g) => ms.some((m) => m.role === g));
  const k = used.length;
  const angles: number[][] = [[0], [0], [-42, 42], [-55, 0, 55], [-62, -21, 21, 62]];
  const junctions: Vec[] = [
    [-2 * PITCH, 0],
    [-PITCH, 0],
    [0, 0],
  ];
  const edges: [number, number][] = [
    [0, 1],
    [1, 2],
  ];
  const slots: Slot[] = [];
  const gates: Record<string, number> = { in: 0 };
  const tips: number[] = [];
  used.forEach((g, a) => {
    const dir = rot([1, 0], angles[k][a]);
    const mem = ms.filter((m) => m.role === g);
    const J = Math.ceil(mem.length / 2);
    const first = junctions.length;
    for (let m = 1; m <= J; m++) junctions.push([dir[0] * m * PITCH, dir[1] * m * PITCH]);
    edges.push([2, first], ...chain(first, J));
    mem.forEach((m, i) =>
      slots.push({
        member: m,
        j: first + Math.floor(i / 2),
        face: rot(dir, i % 2 === 0 ? 90 : -90),
      }),
    );
    gates[`arm${a}`] = first + J - 1;
    tips.push(first + J - 1);
  });
  for (const m of ms.filter((x) => x.role === 'nexus'))
    slots.push({ member: m, j: 1, face: [0, 1] });
  gates.out = tips[Math.floor(tips.length / 2)];
  return {
    junctions,
    edges,
    slots,
    gates,
    tips: [gates.out, ...tips.filter((t) => t !== gates.out)],
  };
}

/** A honeycomb of roads with a cluster in each cell, hung from a corner of it: dense on purpose. */
function knot(ms: Member[]): Shape {
  const N = ms.length;
  // Hexagonal cells in axial coordinates (flat-topped), the nearest N to the middle, a little wider than deep.
  const centreOf = (q: number, r: number): Vec => [HEX * 1.5 * q, HEX * Math.sqrt(3) * (r + q / 2)];
  const cells: [number, number][] = [];
  for (let q = -4; q <= 4; q++) for (let r = -4; r <= 4; r++) cells.push([q, r]);
  const dist = ([q, r]: [number, number]) => {
    const [x, y] = centreOf(q, r);
    return x * x * 0.8 + y * y * 1.25;
  };
  cells.sort((a, b) => dist(a) - dist(b) || a[0] - b[0] || a[1] - b[1]);
  const chosen = cells.slice(0, N);
  const [centre, ...round] = chosen;
  round.sort((p, q) => {
    const [px, py] = centreOf(p[0], p[1]);
    const [qx, qy] = centreOf(q[0], q[1]);
    return Math.atan2(py, px) - Math.atan2(qy, qx);
  });
  // The middle cell is the nexus if there is one; the groups go round it, one after another.
  const order = [centre, ...round];
  const who: Member[] = [
    ...ms.filter((m) => m.role === 'nexus'),
    ...ms.filter((m) => m.role !== 'nexus'),
  ];
  const junctions: Vec[] = [];
  const vertex = (p: Vec): number => {
    // A corner another cell already made, within a few units (the same place by another sum).
    const found = junctions.findIndex((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 8);
    if (found >= 0) return found;
    junctions.push(p);
    return junctions.length - 1;
  };
  const seen = new Set<string>();
  const edges: [number, number][] = [];
  const slots: Slot[] = [];
  order.forEach(([q, r], n) => {
    const [cx, cy] = centreOf(q, r);
    const corners = Array.from({ length: 6 }, (_, k) =>
      vertex([cx + HEX * Math.cos((k * Math.PI) / 3), cy + HEX * Math.sin((k * Math.PI) / 3)]),
    );
    for (let k = 0; k < 6; k++) {
      const a = corners[k];
      const c = corners[(k + 1) % 6];
      const key = a < c ? `${a}-${c}` : `${c}-${a}`;
      if (!seen.has(key)) {
        seen.add(key);
        edges.push([a, c]);
      }
    }
    // Hang from the corner nearest the middle of the knot (the middle cell's by a hash), the cluster leaning into the cell.
    const ranked = [...corners].sort(
      (p, s) => Math.hypot(...junctions[p]) - Math.hypot(...junctions[s]) || p - s,
    );
    const pick = n === 0 ? corners[hashOf(who[0]?.id ?? 'x') % 6] : ranked[0];
    if (who[n]) slots.push({ member: who[n], j: pick, at: [cx, cy], hug: true });
  });
  // Not every side of every cell is a road (a full mesh made every way as good as another): a tree through the corners and about a
  // third of the other sides, chosen by a hash; then corners left as empty dead ends are dropped.
  const parent = junctions.map((_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const byHash = [...edges].sort(
    (p, q) => hashOf(`side ${p[0]}-${p[1]}`) - hashOf(`side ${q[0]}-${q[1]}`) || p[0] - q[0],
  );
  let kept: [number, number][] = byHash.filter(([a, c]) => {
    const ra = find(a);
    const rc = find(c);
    if (ra !== rc) {
      parent[ra] = rc;
      return true;
    }
    return hashOf(`loop ${a}-${c}`) % 100 < 34;
  });
  const hung = new Set(slots.map((s) => s.j));
  for (let before = -1; kept.length !== before;) {
    before = kept.length;
    const deg = junctions.map(() => 0);
    for (const [a, c] of kept) {
      deg[a]++;
      deg[c]++;
    }
    kept = kept.filter(
      ([a, c]) => !((deg[a] === 1 && !hung.has(a)) || (deg[c] === 1 && !hung.has(c))),
    );
  }
  const used = new Set(kept.flat());
  for (const j of hung) used.add(j);
  const newId = new Map<number, number>();
  const kj: Vec[] = [];
  junctions.forEach((p, i) => {
    if (used.has(i)) {
      newId.set(i, kj.length);
      kj.push(p);
    }
  });
  junctions.length = 0;
  junctions.push(...kj);
  edges.length = 0;
  edges.push(...kept.map(([a, c]) => [newId.get(a)!, newId.get(c)!] as [number, number]));
  for (const s of slots) s.j = newId.get(s.j)!;
  const best = (f: (a: Vec) => number) =>
    junctions.reduce((m, p, id) => (f(p) < f(junctions[m]) ? id : m), 0);
  const gates = {
    in: best((p) => p[0] * 1000 + Math.abs(p[1])),
    out: best((p) => -p[0] * 1000 + Math.abs(p[1])),
    left: best((p) => p[1] * 1000 + Math.abs(p[0])),
    right: best((p) => -p[1] * 1000 + Math.abs(p[0])),
  };
  return { junctions, edges, slots, gates, tips: [gates.out, gates.left, gates.right] };
}

/** Two rails with rungs, clusters hung outside both: sparse, a corridor. */
function ladder(ms: Member[]): Shape {
  const K = Math.ceil(ms.length / 2);
  const junctions: Vec[] = [];
  for (const v of [-RUNG / 2, RUNG / 2])
    for (let k = 0; k < K; k++) junctions.push([(k - (K - 1) / 2) * PITCH, v]);
  const edges: [number, number][] = [...chain(0, K), ...chain(K, K)];
  for (let k = 0; k < K; k += 2) edges.push([k, K + k]);
  if (K % 2 === 0) edges.push([K - 1, 2 * K - 1]);
  const slots = ms.map((m, i) => ({
    member: m,
    j: i % 2 === 0 ? Math.floor(i / 2) : K + Math.floor(i / 2),
    face: [0, i % 2 === 0 ? -1 : 1] as Vec,
  }));
  return {
    junctions,
    edges,
    slots,
    gates: { in: 0, inB: K, out: K - 1, outB: 2 * K - 1 },
    tips: [K - 1, 2 * K - 1],
  };
}

/** The clusters of a district in the order they hang: the groups in turn, the nexus after the first. */
function membersOf(d: District): Member[] {
  const out: Member[] = [];
  Object.entries(d.groups).forEach(([role, ids], g) => {
    for (const id of ids) out.push({ id, role });
    if (g === 0) for (const id of d.nexus) out.push({ id, role: 'nexus' });
  });
  if (!Object.keys(d.groups).length) for (const id of d.nexus) out.push({ id, role: 'nexus' });
  return out;
}

/** Where a district's own coordinates fall on the tree: its centre, and the maps of a point and of a direction. */
export function frameOf(
  reg: RegionDef,
  pl: { r: number; a: number; turn: number },
): { centre: Vec; to: (p: Vec) => Vec; dir: (p: Vec) => Vec } {
  const th = ((reg.angle + pl.a) * Math.PI) / 180;
  const centre: Vec = [pl.r * Math.cos(th), pl.r * Math.sin(th)];
  const phi = th + (pl.turn * Math.PI) / 180;
  const eu: Vec = [Math.cos(phi), Math.sin(phi)];
  const ev: Vec = [-Math.sin(phi), Math.cos(phi)];
  const dir = (p: Vec): Vec => [eu[0] * p[0] + ev[0] * p[1], eu[1] * p[0] + ev[1] * p[1]];
  return { centre, to: (p) => [centre[0] + dir(p)[0], centre[1] + dir(p)[1]], dir };
}

export function shapeOfDistrict(d: District): Shape {
  const ms = membersOf(d);
  switch (d.template) {
    case 'avenue':
      return avenue(ms);
    case 'ring':
      return ring(ms);
    case 'fork':
      return fork(ms, Object.keys(d.groups));
    case 'knot':
      return knot(ms);
    case 'ladder':
      return ladder(ms);
  }
}

// --- the clusters ---------------------------------------------------------------------------------------------------

const specs = new Map<string, ClusterSpec>();
function specOf(id: string, region: RegionDef): ClusterSpec {
  let s = specs.get(id);
  if (!s) {
    const g = GEN_CLUSTERS.find((x) => x.id === id);
    if (!g) throw new Error(`no cluster ${id}`);
    s = {
      id,
      region: g.region,
      kind: g.smallCount >= 4 ? 'wheel' : g.smallCount === 3 ? 'chain' : 'spur',
      theme: region.keystoneTheme,
      smallCount: g.smallCount,
      gen: g,
      attrs: region.attrs,
    };
    specs.set(id, s);
  }
  return s;
}

function rollback(b: Builder, L: number, E: number): void {
  b.nodes.length = L;
  b.edges.length = E;
  for (const n of b.nodes) n.links = n.links.filter((m) => m < L);
}

/** Whether the nodes and edges added since (L, E) keep clear of what was there before. */
function clusterClear(b: Builder, L: number, E: number): boolean {
  for (let i = L; i < b.nodes.length; i++) {
    const n = b.nodes[i];
    for (let j = 0; j < L; j++) {
      const m = b.nodes[j];
      if (Math.hypot(n.x - m.x, n.y - m.y) < MIN_NODE_DIST + 8) return false;
    }
    for (let e = 0; e < E; e++) {
      const [p, q] = b.edges[e];
      if (
        segDist(n.x, n.y, b.nodes[p].x, b.nodes[p].y, b.nodes[q].x, b.nodes[q].y) <
        EDGE_CLEARANCE + 6
      )
        return false;
    }
  }
  for (let e = E; e < b.edges.length; e++) {
    const [p, q] = b.edges[e];
    for (let j = 0; j < L; j++)
      if (
        segDist(
          b.nodes[j].x,
          b.nodes[j].y,
          b.nodes[p].x,
          b.nodes[p].y,
          b.nodes[q].x,
          b.nodes[q].y,
        ) <
        EDGE_CLEARANCE + 6
      )
        return false;
  }
  return true;
}

type Candidate = { centre: Vec; face: Vec };
type Ctx = { b: Builder; attrs: Attr[]; pool: RoadStat[]; centres: Vec[] };

/** Hang a cluster from a junction at the first candidate that fits; the entrance's id, or null. */
function hang(
  ctx: Ctx,
  spec: ClusterSpec,
  junction: number,
  cands: Candidate[],
  district?: string,
): number | null {
  const { b } = ctx;
  const J = b.nodes[junction];
  for (const c of cands) {
    const L = b.nodes.length;
    const E = b.edges.length;
    const { entrance } = placeCluster(
      b,
      spec,
      c.centre[0],
      c.centre[1],
      c.face,
      [J.x, J.y],
      district,
    );
    if (
      clusterClear(b, L, E) &&
      travel(b, [junction], [entrance], {
        attrs: ctx.attrs,
        pool: ctx.pool,
        spacing: ROAD_STEP,
        district,
      })
    ) {
      ctx.centres.push(c.centre);
      return entrance;
    }
    rollback(b, L, E);
  }
  return null;
}

/** The places a cluster could hang from a road node at `p`, facing `face`: beside it, nearer and further, then the other side. */
function around(p: Vec, face: Vec, wide = false): Candidate[] {
  const out: Candidate[] = [];
  const fan: [number, number][] = wide
    ? [0, 45, -45, 90, -90, 135, -135, 180].flatMap((deg) =>
        [SIDE, SIDE * 1.4, SIDE * 1.9].map((d) => [deg, d] as [number, number]),
      )
    : [];
  for (const [deg, d] of [
    ...fan,
    [0, SIDE],
    [0, SIDE * 1.3],
    [180, SIDE],
    [180, SIDE * 1.3],
    [35, SIDE * 1.2],
    [-35, SIDE * 1.2],
    [0, SIDE * 1.7],
    [180, SIDE * 1.7],
  ] as [number, number][]) {
    const f = rot(face, deg);
    out.push({ centre: [p[0] + f[0] * d, p[1] + f[1] * d], face: f });
  }
  return out;
}

// --- the tree ---------------------------------------------------------------------------------------------------------

export type LayoutTree = Tree & { dropped: string[]; unplaced: string[] };

/** The region's districts, roads, keystones and wayside clusters, laid out; appended to `b`. */
/**
 * A junction of a road: an attribute node every third one, the rest small nodes of the road's generic stats, so that a road gives
 * what the region wants and not +10 of one attribute node after another.
 */
function junctionNode(
  b: Builder,
  attrs: Attr[],
  pool: RoadStat[],
  i: number,
  at: Vec,
  district: string,
): number {
  if (i % 3 === 0) {
    const a = attrs[Math.floor(i / 3) % attrs.length];
    return addNode(
      b,
      'travel',
      ATTR_NAME[a],
      [mod(a, 'base', 10)],
      at[0],
      at[1],
      undefined,
      district,
    );
  }
  const s = pool[hashOf(`${district}:j${i}`) % pool.length];
  return addNode(
    b,
    'small',
    s.name,
    s.mods.map((m) => ({ ...m })),
    at[0],
    at[1],
    undefined,
    district,
  );
}

/** A road between two nodes: straight if it can be, else bending round what is in the way through one junction to the side. */
function connect(b: Builder, from: number, to: number, opts: RoadOptions): boolean {
  if (travel(b, [from], [to], opts)) return true;
  const A = b.nodes[from];
  const B = b.nodes[to];
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const len = Math.hypot(dx, dy) || 1;
  const [nx, ny] = [-dy / len, dx / len];
  for (const off of [
    140, -140, 260, -260, 400, -400, 560, -560, 760, -760, 1000, -1000, 1300, -1300,
  ])
    for (const t of [0.5, 0.35, 0.65, 0.25, 0.75, 0.15, 0.85, 0.05, 0.95]) {
      const wx = A.x + dx * t + nx * off;
      const wy = A.y + dy * t + ny * off;
      if (!pointClear(b, wx, wy)) continue;
      const L = b.nodes.length;
      const E = b.edges.length;
      const at = opts.attrs[L % opts.attrs.length];
      const w = addNode(
        b,
        'travel',
        ATTR_NAME[at],
        [mod(at, 'base', 10)],
        wx,
        wy,
        undefined,
        opts.district,
      );
      if (travel(b, [from], [w], opts) && travel(b, [w], [to], opts)) return true;
      rollback(b, L, E);
    }
  return false;
}

/**
 * A node a new road may join: a road node (not of a cluster, not a start) on at most two roads, and with at most three links in
 * all (a cluster hung from it counts), so that no node becomes a star.
 */
const joinable = (b: Builder, id: number): boolean => {
  const n = b.nodes[id];
  if (n.cluster || (n.kind !== 'small' && n.kind !== 'travel') || n.links.length > 3) return false;
  return n.links.filter((m) => !b.nodes[m].cluster).length <= 2;
};

/** Distances in steps from a node, as far as `limit`. */
function graphSteps(b: Builder, from: number, limit: number): Map<number, number> {
  const d = new Map<number, number>([[from, 0]]);
  const q = [from];
  for (let h = 0; h < q.length; h++) {
    const x = q[h];
    if (d.get(x)! >= limit) continue;
    for (const m of b.nodes[x].links)
      if (!d.has(m)) {
        d.set(m, d.get(x)! + 1);
        q.push(m);
      }
  }
  return d;
}

/** A road from a node to the nearest of `cands` that is near on the map but far by road (iteration 3: a way in from the side). */
function sideDoor(b: Builder, from: number, cands: number[], opts: RoadOptions): boolean {
  const near = graphSteps(b, from, 9);
  const F = b.nodes[from];
  return cands
    .filter((i) => !near.has(i))
    .map((i) => ({ i, d: Math.hypot(b.nodes[i].x - F.x, b.nodes[i].y - F.y) }))
    .filter((c) => c.d <= 900)
    .sort((p, q) => p.d - q.d || p.i - q.i)
    .slice(0, 8)
    .some((c) => connect(b, from, c.i, opts));
}

/**
 * Long roads with nothing along them (nine nodes or more, each on two roads only) get a road from their middle to the nearest
 * road near by, in whichever region it is. Run once the whole tree is laid, so that the crossings between regions count too.
 */
function chainDoors(b: Builder): void {
  const isRoad = (i: number) => !b.nodes[i].cluster && b.nodes[i].kind !== 'start';
  const roadNbrs = (i: number) => b.nodes[i].links.filter(isRoad);
  const seen = new Set<number>();
  const chains: number[][] = [];
  for (let i = 0; i < b.nodes.length; i++) {
    if (!isRoad(i) || b.nodes[i].region === 'hub' || seen.has(i) || roadNbrs(i).length !== 2)
      continue;
    // Walk both ways along nodes on two roads.
    const sides: number[][] = [];
    seen.add(i);
    for (const dir of roadNbrs(i)) {
      let prev = i;
      let cur = dir;
      const part: number[] = [];
      while (isRoad(cur) && !seen.has(cur) && roadNbrs(cur).length === 2) {
        seen.add(cur);
        part.push(cur);
        const next = roadNbrs(cur).find((m) => m !== prev)!;
        prev = cur;
        cur = next;
      }
      sides.push(part);
    }
    const chain = [...(sides[0] ?? []).reverse(), i, ...(sides[1] ?? [])];
    if (chain.length >= 9) chains.push(chain);
  }
  for (const chain of chains) {
    const set = new Set(chain);
    // The middle first, then its neighbours along the road.
    const mid = Math.floor(chain.length / 2);
    const order = [0, 1, -1, 2, -2].map((o) => chain[mid + o]).filter((x) => x !== undefined);
    const cands = b.nodes
      .filter((n) => !set.has(n.id) && n.region !== 'hub' && joinable(b, n.id))
      .map((n) => n.id);
    for (const from of order) {
      const reg = REGIONS.find((r) => r.id === b.nodes[from].region);
      if (!reg) continue;
      const before = b.nodes.length;
      const ok = sideDoor(b, from, cands, {
        attrs: reg.attrs,
        pool: ROAD_POOLS[reg.id],
        spacing: ROAD_STEP,
      });
      for (let k = before; k < b.nodes.length; k++) b.nodes[k].region = reg.id;
      if (ok) break;
    }
  }
}

function layoutRegion(
  b: Builder,
  reg: RegionDef,
  start: number,
  dropped: string[],
  unplaced: string[],
): void {
  const L0 = b.nodes.length;
  const pool = ROAD_POOLS[reg.id];
  const ctx: Ctx = { b, attrs: reg.attrs, pool, centres: [] };
  const junctionIds = new Map<string, number[]>();
  const shapes = new Map<
    string,
    { shape: Shape; to: (p: Vec) => Vec; dir: (p: Vec) => Vec; centre: Vec }
  >();
  const roads: number[] = [];
  const road = (from: number, to: number, district?: string, tag = '', quiet = false): boolean => {
    const before = b.nodes.length;
    const why: string[] = [];
    const ok = connect(b, from, to, { attrs: reg.attrs, pool, spacing: ROAD_STEP, district, why });
    if (!ok && !quiet) dropped.push(`${tag} ${from}-${to} (${why[0] ?? '?'})`);
    for (let i = before; i < b.nodes.length; i++) roads.push(i);
    return ok;
  };

  type Failed = {
    spec: ClusterSpec;
    slot: Slot;
    ids: number[];
    shape: Shape;
    to: (p: Vec) => Vec;
    centre: Vec;
  };
  const failed: Failed[] = [];
  for (const d of DISTRICTS.filter((x) => x.region === reg.id)) {
    const pl = PLACEMENT[d.id];
    if (!pl) throw new Error(`no placement for ${d.id}`);
    const shape = shapeOfDistrict(d);
    const { centre, to, dir } = frameOf(reg, pl);
    const [cx, cy] = centre;
    shapes.set(d.id, { shape, to, dir, centre: [cx, cy] });
    const ids = shape.junctions.map((p, i) => junctionNode(b, reg.attrs, pool, i, to(p), d.id));
    junctionIds.set(d.id, ids);
    for (const [i, j] of shape.edges) road(ids[i], ids[j], d.id, d.id);
    for (const s of shape.slots) {
      const spec = specOf(s.member.id, reg);
      const J = shape.junctions[s.j];
      let cands: Candidate[];
      if (s.at && s.hug) {
        // Leaning into the cell from the corner it hangs from, then the middle of the cell.
        const dx = s.at[0] - J[0];
        const dy = s.at[1] - J[1];
        const len = Math.hypot(dx, dy) || 1;
        const l: Vec = [dx / len, dy / len];
        const f = dir(l);
        cands = [SIDE * 1.15, SIDE * 1.4, len].map((dd) => ({
          centre: to([J[0] + l[0] * dd, J[1] + l[1] * dd]),
          face: f,
        }));
      } else if (s.at) {
        const c = to(s.at);
        const f = dir(s.at.map((x, i) => x - J[i]) as Vec);
        const len = Math.hypot(f[0], f[1]) || 1;
        cands = [{ centre: c, face: [f[0] / len, f[1] / len] }];
      } else {
        const f = dir(s.face!);
        const g = to(J);
        cands = around(g, f);
      }
      if (hang(ctx, spec, ids[s.j], cands, d.id) === null)
        failed.push({ spec, slot: s, ids, shape, to, centre });
    }
  }
  // A slot that found no room at its own junction tries the nearest junctions of its district, in every direction.
  for (const f of failed) {
    const home = f.shape.junctions[f.slot.j];
    const order = f.shape.junctions
      .map((p, i) => ({ i, d: Math.hypot(p[0] - home[0], p[1] - home[1]) }))
      .sort((a, c) => a.d - c.d);
    let ok = false;
    for (const o of order) {
      const g = f.to(f.shape.junctions[o.i]);
      const out: Vec = [g[0] - f.centre[0], g[1] - f.centre[1]];
      const len = Math.hypot(out[0], out[1]) || 1;
      if (
        hang(
          ctx,
          f.spec,
          f.ids[o.i],
          around(g, [out[0] / len, out[1] / len], true),
          f.slot.member.id.startsWith('hub') ? 'hub' : undefined,
        ) !== null
      ) {
        ok = true;
        break;
      }
    }
    if (!ok) unplaced.push(`${f.spec.id}@${f.slot.member.role}`);
  }

  // The roads between the districts of the region, and from its class start.
  const ref = (name: string): number => {
    if (name === 'start') return start;
    const [d, gate] = name.split(':');
    const sh = shapes.get(d);
    const ids = junctionIds.get(d);
    if (!sh || !ids || sh.shape.gates[gate] === undefined) throw new Error(`no gate ${name}`);
    return ids[sh.shape.gates[gate]];
  };
  for (const [from, to] of REGION_LINKS[reg.id] ?? [])
    road(ref(from), ref(to), undefined, `${from}>${to}`);
  const regionRoads = (): number[] => {
    const out: number[] = [];
    for (let i = L0; i < b.nodes.length; i++) if (joinable(b, i)) out.push(i);
    return out;
  };

  // Side doors. A long district (a ladder, an avenue) entered only at its ends gets a road from the junction farthest from its
  // entries to the nearest road outside it (long roads get theirs once the whole tree is laid: chainDoors).
  for (const d of DISTRICTS.filter((x) => x.region === reg.id)) {
    const ids = junctionIds.get(d.id)!;
    const pts = ids.map((i) => b.nodes[i]);
    const extent = Math.max(
      ...pts.flatMap((p) => pts.map((q) => Math.hypot(p.x - q.x, p.y - q.y))),
    );
    if (extent < 1100) continue;
    const entries = ids.filter((i) =>
      b.nodes[i].links.some((m) => !b.nodes[m].cluster && b.nodes[m].district !== d.id),
    );
    if (entries.length >= 3) continue;
    const far = [...ids]
      .filter((i) => b.nodes[i].links.length <= 3)
      .sort((p, q) => {
        const gap = (i: number) =>
          Math.min(
            ...entries.map((e) =>
              Math.hypot(b.nodes[i].x - b.nodes[e].x, b.nodes[i].y - b.nodes[e].y),
            ),
            1e9,
          );
        return gap(q) - gap(p);
      })[0];
    if (far !== undefined) {
      const before = b.nodes.length;
      const cands = regionRoads().filter((i) => b.nodes[i].district !== d.id);
      sideDoor(b, far, cands, { attrs: reg.attrs, pool, spacing: ROAD_STEP });
      for (let i = before; i < b.nodes.length; i++) roads.push(i);
    }
  }
  // Keystones at the tip of their district: each takes the junction farthest from the middle that has room, and its own.
  const taken = new Set<number>();
  for (const d of DISTRICTS.filter((x) => x.region === reg.id)) {
    const sh = shapes.get(d.id)!;
    const ids = junctionIds.get(d.id)!;
    const radius = (j: number) => Math.hypot(b.nodes[ids[j]].x, b.nodes[ids[j]].y);
    const tipOrder = [...new Set([...sh.shape.tips, ...Object.values(sh.shape.gates)])].sort(
      (p, q) => radius(q) - radius(p) || p - q,
    );
    d.keystones.forEach((k) => {
      const theme = SPUR[k]?.theme ?? reg.keystoneTheme;
      const spec: ClusterSpec = {
        id: `${reg.id}_k_${k}`,
        region: reg.id,
        kind: 'keystone',
        theme,
        smallCount: SPUR_LENGTH,
        keystone: k,
        attrs: reg.attrs,
      };
      const lend = SPUR[k]?.gen && GEN_CLUSTERS.find((g) => g.id === SPUR[k].gen);
      if (lend) spec.gen = lend;
      else {
        // The theme's small node, at the value every small node of that stat has.
        spec.smallMods = THEMES[theme].small.map((m) => ({
          ...m,
          value: UNITS.byKey.get(modKey(m)) ?? m.value,
        }));
        spec.smallName = THEMES[theme].smallName;
      }
      let placed = false;
      for (const tip of tipOrder) {
        if (taken.has(ids[tip])) continue;
        const J = b.nodes[ids[tip]];
        const away: Vec = [J.x - sh.centre[0], J.y - sh.centre[1]];
        const la = Math.hypot(away[0], away[1]) || 1;
        const lr = Math.hypot(J.x, J.y) || 1;
        // Outward from the district, and outward from the middle of the tree.
        const mix: Vec = [away[0] / la + (J.x / lr) * 1.2, away[1] / la + (J.y / lr) * 1.2];
        const lm = Math.hypot(mix[0], mix[1]) || 1;
        const base: Vec = [mix[0] / lm, mix[1] / lm];
        const cands: Candidate[] = [0, 15, -15, 30, -30, 50, -50].flatMap((deg) =>
          [250, 330].map((dist) => {
            const f = rot(base, deg);
            return { centre: [J.x + f[0] * dist, J.y + f[1] * dist] as Vec, face: f };
          }),
        );
        if (hang(ctx, spec, ids[tip], cands, d.id) !== null) {
          taken.add(ids[tip]);
          placed = true;
          break;
        }
      }
      if (!placed) unplaced.push(`${k}@${d.id}`);
    });
  }

  // Wayside clusters: the region's clusters that belong to no district, and its hand-made notables, beside the roads.
  const way: ClusterSpec[] = [
    ...GEN_CLUSTERS.filter((g) => g.region === reg.id && !districtOf(g.id)).map((g) =>
      specOf(g.id, reg),
    ),
    ...EXTRA_NOTABLES.filter((e) => e.region === reg.id).map((e, i) => ({
      id: `${reg.id}_x${i}`,
      region: reg.id,
      kind: 'chain' as const,
      theme: e.theme,
      smallCount: 3,
      notable: { name: e.name, strength: 1 },
      attrs: reg.attrs,
    })),
  ];
  // Any road node of the region can carry one; first with room round it, then with less.
  const carriers: number[] = [];
  for (let i = L0; i < b.nodes.length; i++) {
    const n = b.nodes[i];
    if (!n.cluster && (n.kind === 'travel' || n.kind === 'small') && n.links.length >= 2)
      carriers.push(i);
  }
  void roads;
  for (const spec of way) {
    let placed = false;
    const n = carriers.length;
    const startAt = n ? hashOf(spec.id) % n : 0;
    for (const room of [215, 170, 130]) {
      for (let k = 0; k < n && !placed; k++) {
        const node = b.nodes[carriers[(startAt + k * 7) % n]];
        const p: Vec = [node.x, node.y];
        if (ctx.centres.some((c) => Math.hypot(c[0] - p[0], c[1] - p[1]) < room)) continue;
        const a = b.nodes[node.links[0]];
        const c = b.nodes[node.links[1]];
        const t: Vec = [c.x - a.x, c.y - a.y];
        const len = Math.hypot(t[0], t[1]) || 1;
        const normal: Vec = [-t[1] / len, t[0] / len];
        // Sides in the order of a hash, so a road is not lined with clusters on one side.
        const flip = hashOf(`${spec.id}:${node.id}`) % 2 ? 1 : -1;
        const f: Vec = [normal[0] * flip, normal[1] * flip];
        if (hang(ctx, spec, node.id, around(p, f, room < 215)) !== null) placed = true;
      }
      if (placed) break;
    }
    if (!placed) unplaced.push(`${spec.id}@wayside`);
  }
  for (let i = L0; i < b.nodes.length; i++) b.nodes[i].region = reg.id;
}

const HUB_R = HUB_RADIUS;
/** The middle's notables are as strong as a region's median one (about five small nodes), or nobody would walk there. */
const HUB_STRENGTH = 1.6;

/** What one small node gives, by stat, as the generated clusters give it. */
const UNITS = unitsOf(GEN_CLUSTERS.flatMap((g) => g.small.mods));

/** How many small nodes lead to a keystone: its peninsula. */
const SPUR_LENGTH = 4;
/**
 * What the small nodes leading to a keystone give: the theme (notableThemes.ts) or the small node of a generated cluster of the
 * subject, so that the approach is about what the keystone is. A dead end, so it may be as niche as the keystone.
 */
const SPUR: Record<string, { theme?: string; gen?: string }> = {
  unerringDiscipline: { theme: 'accuracy' },
  hollowVessel: { theme: 'es' },
  bloodRite: { theme: 'lifePct' },
  platedHide: { theme: 'armour' },
  mindBulwark: { theme: 'mana' },
  searingAvatar: { theme: 'fireDamage' },
  closeQuarters: { theme: 'projectile' },
  feverPitch: { theme: 'critChance' },
  rootedStance: { theme: 'stunThreshold' },
  prismaticBalance: { theme: 'elemental' },
  livingWard: { theme: 'lifeRegen' },
  shadeLeech: { theme: 'lifeLeech' },
  woundDance: { theme: 'bleed' },
  cruelAgony: { theme: 'poison' },
  manaBastion: { theme: 'es' },
  arrowWeave: { theme: 'evasion' },
  shieldwall: { theme: 'block' },
  nimbleGambit: { theme: 'moveSpeed' },
  spellslip: { theme: 'castSpeed' },
  steadyDraw: { theme: 'bow' },
  volatileServants: { gen: 'g132' },
  idleHands: { gen: 'g339' },
  sigilWarden: { gen: 'g155' },
  loneVow: { gen: 'g175' },
};
/** The middle's roads are finer than a region's, so that crossing it costs what a class's own corner does. */
const HUB_STEP = 100;

/**
 * The open middle of the tree (docs/TREE-REDESIGN.md 3.4): a ring road joined to the six class starts, a hub cluster between each
 * pair of class directions and not in line with either, three keystones on the inner side of the ring, and a wheel at the centre
 * that the six starts reach by a spoke each. Its small nodes are generic; none of it belongs to one attribute.
 */
function layoutHub(
  b: Builder,
  starts: Record<string, number>,
  dropped: string[],
  unplaced: string[],
): number[] {
  const L0 = b.nodes.length;
  const attrs: Attr[] = ['str', 'dex', 'int'];
  const pool = ROAD_POOLS.hub;
  const ctx: Ctx = { b, attrs, pool, centres: [] };
  const road = (from: number, to: number, tag: string): void => {
    const why: string[] = [];
    if (!travel(b, [from], [to], { attrs, pool, spacing: HUB_STEP, district: 'hub', why }))
      dropped.push(`hub ${tag} (${why[0] ?? '?'})`);
  };
  const ring: number[] = [];
  const at = (k: number): Vec => [
    HUB_R * Math.cos((k * Math.PI) / 6),
    HUB_R * Math.sin((k * Math.PI) / 6),
  ];
  for (let k = 0; k < 12; k++) ring.push(junctionNode(b, attrs, pool, k, at(k), 'hub'));
  for (let k = 0; k < 12; k++) road(ring[k], ring[(k + 1) % 12], `ring ${k}`);
  const axisIndex = (deg: number): number => ((Math.round(deg / 30) % 12) + 12) % 12;
  REGIONS.forEach((reg, i) => {
    const k = axisIndex(reg.angle);
    road(ring[k], starts[reg.classId], `start ${reg.id}`);
    // The hub cluster of the region sits on the boundary after it, inside the ring, so that the way out of the ring is free for a road.
    const kb = (k + 1) % 12;
    const out: Vec = [-Math.cos((kb * Math.PI) / 6), -Math.sin((kb * Math.PI) / 6)];
    const spec: ClusterSpec = {
      id: `hub_${reg.id}`,
      region: 'hub',
      kind: 'wheel',
      theme: HUB.themes[1 + i],
      smallCount: 4,
      notable: { name: HUB.notables[1 + i], strength: HUB_STRENGTH },
      attrs,
    };
    if (hang(ctx, spec, ring[kb], around(at(kb), out), 'hub') === null)
      unplaced.push(spec.id + '@hub');
    // Three of the classes' junctions also carry a keystone on the inner side (the ones without a spoke), so that every junction
    // between two classes is free for a road into the region beside it.
    if (i % 2 === 1) {
      const n = (i - 1) / 2;
      const ks: ClusterSpec = {
        id: `hubks_${n}`,
        region: 'hub',
        kind: 'keystone',
        theme: 'allAttr',
        smallCount: 2,
        keystone: HUB.keystones[n],
        attrs,
      };
      const inward: Vec = [-Math.cos((k * Math.PI) / 6), -Math.sin((k * Math.PI) / 6)];
      const cands = [0, 12, -12].flatMap((deg) =>
        [175, 215].map((d) => {
          const f = rot(inward, deg);
          return { centre: [at(k)[0] + f[0] * d, at(k)[1] + f[1] * d] as Vec, face: f };
        }),
      );
      if (hang(ctx, ks, ring[k], cands, 'hub') === null) unplaced.push(ks.id + '@hub');
    }
  });
  // The wheel at the middle, and a spoke from it to each class's junction of the ring.
  const wheel: ClusterSpec = {
    id: 'hub_c',
    region: 'hub',
    kind: 'wheel',
    theme: HUB.themes[0],
    smallCount: 7,
    notable: { name: HUB.notables[0], strength: HUB_STRENGTH },
    attrs,
  };
  const { ids } = placeCluster(b, wheel, 0, 0, [0, -1], [0, 0], 'hub');
  // Three spokes, to every other class, so that the middle is not a regular star.
  for (const reg of REGIONS.filter((_, i) => i % 2 === 0)) {
    const j = ring[axisIndex(reg.angle)];
    const J = b.nodes[j];
    const near = [...ids].sort(
      (p, q) =>
        Math.hypot(b.nodes[p].x - J.x, b.nodes[p].y - J.y) -
        Math.hypot(b.nodes[q].x - J.x, b.nodes[q].y - J.y),
    )[0];
    road(j, near, `spoke ${reg.id}`);
  }
  for (let i = L0; i < b.nodes.length; i++) b.nodes[i].region = 'hub';
  return ring;
}

/** Build the passive tree from the charter and the plan (all regions, or the ones asked for: a tool of review). */
export function buildLayoutTree(opts: { regions?: RegionId[] } = {}): LayoutTree {
  const b: Builder = { nodes: [], edges: [] };
  const starts: Record<string, number> = {};
  const dropped: string[] = [];
  const unplaced: string[] = [];
  for (const reg of REGIONS) {
    const a = (reg.angle * Math.PI) / 180;
    const id = addNode(
      b,
      'start',
      `${reg.classId} start`,
      [],
      START_RADIUS * Math.cos(a),
      START_RADIUS * Math.sin(a),
    );
    b.nodes[id].classStart = reg.classId;
    b.nodes[id].region = reg.id;
    starts[reg.classId] = id;
  }
  const ring = layoutHub(b, starts, dropped, unplaced);
  for (const reg of REGIONS)
    if (!opts.regions || opts.regions.includes(reg.id))
      layoutRegion(b, reg, starts[reg.classId], dropped, unplaced);
  gateways(b, ring, starts, dropped, opts.regions);
  bridges(b, opts.regions);
  chainDoors(b);
  return { nodes: b.nodes, starts, dropped, unplaced };
}

/**
 * The middle's ring reaches the regions besides their class starts (a start cannot be walked through). From each junction of the
 * ring between two classes, one road goes straight out along the line between the two regions to a fork, and from the fork a short
 * road enters each of the two regions at its nearest road with room, away from its start. Iteration 3: two roads from each such
 * junction, one to each region, ran as long diagonals beside the class starts, three nearly parallel lines meeting past every start.
 */
const FORK_RADII = [1100, 1200, 1000, 1300, 1400];
function gateways(
  b: Builder,
  ring: number[],
  starts: Record<string, number>,
  dropped: string[],
  only?: RegionId[],
): void {
  const enter = (from: number, reg: RegionDef): boolean => {
    const F = b.nodes[from];
    const S = b.nodes[starts[reg.classId]];
    const cands = b.nodes
      .filter(
        (n) => n.region === reg.id && joinable(b, n.id) && Math.hypot(n.x - S.x, n.y - S.y) >= 350,
      )
      .sort(
        (p, q) =>
          Math.hypot(p.x - F.x, p.y - F.y) - Math.hypot(q.x - F.x, q.y - F.y) || p.id - q.id,
      );
    const pool = ROAD_POOLS[reg.id];
    if (
      cands
        .slice(0, 12)
        .some((c) => connect(b, from, c.id, { attrs: reg.attrs, pool, spacing: ROAD_STEP }))
    ) {
      return true;
    }
    return false;
  };
  const attrs: Attr[] = ['str', 'dex', 'int'];
  for (let k = 0; k < 12; k += 2) {
    const deg = k * 30;
    const sides = REGIONS.filter((r) => {
      const gap = ((((r.angle - deg) % 360) + 540) % 360) - 180;
      return Math.abs(Math.abs(gap) - 30) < 1;
    }).filter((r) => !only || only.includes(r.id));
    if (!sides.length) continue;
    // The fork: the first point along the line, as near the ring as there is room, from which both regions can be entered.
    const L = b.nodes.length;
    const E = b.edges.length;
    const tryFork = (x: number, y: number): RegionDef[] | null => {
      const at = attrs[(k / 2) % 3];
      const w = addNode(b, 'travel', ATTR_NAME[at], [mod(at, 'base', 10)], x, y, undefined, 'hub');
      const trunk = { attrs, pool: ROAD_POOLS.hub, spacing: ROAD_STEP, district: 'hub' };
      if (!travel(b, [ring[k]], [w], trunk)) return null;
      for (let i = w; i < b.nodes.length; i++) b.nodes[i].region = 'hub';
      const missed: RegionDef[] = [];
      for (const reg of sides) {
        const before = b.nodes.length;
        if (!enter(w, reg)) missed.push(reg);
        for (let i = before; i < b.nodes.length; i++) b.nodes[i].region = reg.id;
      }
      return missed;
    };
    let best: { x: number; y: number; missed: number } | null = null;
    let missed: RegionDef[] | null = null;
    search: for (const r of FORK_RADII)
      for (const tilt of [0, 4, -4, 8, -8]) {
        const ang = ((deg + tilt) * Math.PI) / 180;
        const [x, y] = [r * Math.cos(ang), r * Math.sin(ang)];
        if (!pointClear(b, x, y)) continue;
        missed = tryFork(x, y);
        if (missed && !missed.length) break search;
        if (missed && missed.length < sides.length && (!best || missed.length < best.missed))
          best = { x, y, missed: missed.length };
        rollback(b, L, E);
        missed = null;
      }
    if (!missed && best) missed = tryFork(best.x, best.y);
    // What the fork could not reach (or every side, without a fork) is entered straight from the ring.
    for (const reg of missed ?? sides) {
      const before = b.nodes.length;
      if (!enter(ring[k], reg)) dropped.push(`hub ${k} into ${reg.id}: no road`);
      for (let i = before; i < b.nodes.length; i++) b.nodes[i].region = reg.id;
    }
  }
}

/**
 * The crossings between neighbouring regions (iteration 3, the user: "the pie slices only connect in the middle"): one road half way
 * out and one near the rim between each pair of neighbours, joining the nearest road nodes of the two sides that have room. The
 * roads are made of both regions' stats.
 */
const BANDS: [number, number][] = [
  [1700, 3000],
  [3300, 6000],
];
function bridges(b: Builder, only?: RegionId[]): void {
  REGIONS.forEach((A, i) => {
    const B = REGIONS[(i + 1) % REGIONS.length];
    if (only && !(only.includes(A.id) && only.includes(B.id))) return;
    for (const [lo, hi] of BANDS) {
      const side = (r: RegionId) =>
        b.nodes
          .filter((n) => n.region === r && joinable(b, n.id))
          .filter((n) => {
            const rr = Math.hypot(n.x, n.y);
            return rr >= lo && rr <= hi;
          });
      const as = side(A.id);
      const bs = side(B.id);
      const pairs = as
        .flatMap((p) => bs.map((q) => ({ p: p.id, q: q.id, d: Math.hypot(p.x - q.x, p.y - q.y) })))
        .filter((x) => x.d <= (lo > 3000 ? 2000 : 1700))
        .sort((x, y) => x.d - y.d || x.p - y.p || x.q - y.q);
      const attrs = [...new Set([...A.attrs, ...B.attrs])];
      const pool = [...ROAD_POOLS[A.id], ...ROAD_POOLS[B.id]];
      const L = b.nodes.length;
      const made = pairs
        .slice(0, 40)
        .find((x) => connect(b, x.p, x.q, { attrs, pool, spacing: ROAD_STEP }));
      if (!made) continue;
      // The new road nodes belong to the nearer region.
      const P = b.nodes[made.p];
      const Q = b.nodes[made.q];
      for (let k = L; k < b.nodes.length; k++) {
        const n = b.nodes[k];
        n.region =
          Math.hypot(n.x - P.x, n.y - P.y) <= Math.hypot(n.x - Q.x, n.y - Q.y) ? A.id : B.id;
      }
    }
  });
}
