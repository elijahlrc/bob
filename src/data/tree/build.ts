import { mod, type Mod } from '../../mods/types';
import { keystoneDef } from './keystones';
import { THEMES } from './notableThemes';
import { buildClusterSpecs, REGIONS, START_RADIUS, type Attr, type ClusterSpec } from './spec';
import type { Tree, TreeNode, TreeNodeKind } from './types';

/** Minimum distance between any two nodes (§9.3). */
export const MIN_NODE_DIST = 40;
/** A node closer than this to an edge it is not part of counts as "on" the edge. */
export const EDGE_CLEARANCE = 22;
const TRAVEL_SPACING = 110;
const WHEEL_RADIUS = 100;
const CHAIN_STEP = 70;
const SPUR_STEP = 65;

const ATTR_NAME: Record<Attr, string> = { str: 'Strength', dex: 'Dexterity', int: 'Intelligence' };

type Builder = {
  nodes: TreeNode[];
  edges: [number, number][];
};

function addNode(
  b: Builder,
  kind: TreeNodeKind,
  name: string,
  mods: Mod[],
  x: number,
  y: number,
  cluster?: string,
): number {
  const id = b.nodes.length;
  b.nodes.push({ id, kind, name, mods, x: Math.round(x), y: Math.round(y), links: [], cluster });
  return id;
}

function link(b: Builder, a: number, c: number): void {
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

/** Lay out one cluster's nodes. Returns the node ids that travel paths may attach to. */
function layoutCluster(b: Builder, c: ClusterSpec): number[] {
  const a = (c.a * Math.PI) / 180;
  const cx = c.r * Math.cos(a);
  const cy = c.r * Math.sin(a);
  const ux = c.r > 0 ? Math.cos(a) : 1;
  const uy = c.r > 0 ? Math.sin(a) : 0;
  const tx = -uy;
  const ty = ux;
  const theme = THEMES[c.theme];
  if (!theme) throw new Error(`unknown theme ${c.theme}`);
  const smallMods = c.gen ? c.gen.small.mods : theme.small;
  const smallName = c.gen ? c.gen.small.name : theme.smallName;
  const small = () => smallMods.map((m) => ({ ...m }));
  const smalls: number[] = [];
  const n = c.smallCount;
  const finalNode = (x: number, y: number): number => {
    if (c.keystone) {
      const k = keystoneDef(c.keystone);
      return addNode(
        b,
        'keystone',
        k.name,
        k.mods.map((m) => ({ ...m })),
        x,
        y,
        c.id,
      );
    }
    if (c.gen)
      return addNode(
        b,
        'notable',
        c.gen.notable.name,
        c.gen.notable.mods.map((m) => ({ ...m })),
        x,
        y,
        c.id,
      );
    return addNode(b, 'notable', c.notable!.name, theme.notable(c.notable!.strength), x, y, c.id);
  };
  switch (c.kind) {
    case 'wheel': {
      for (let i = 0; i < n; i++) {
        const th = a + (2 * Math.PI * i) / n;
        smalls.push(
          addNode(
            b,
            'small',
            smallName,
            small(),
            cx + WHEEL_RADIUS * Math.cos(th),
            cy + WHEEL_RADIUS * Math.sin(th),
            c.id,
          ),
        );
      }
      for (let i = 0; i < n; i++) link(b, smalls[i], smalls[(i + 1) % n]);
      const nb = finalNode(cx, cy);
      link(b, nb, smalls[0]);
      return smalls;
    }
    case 'chain': {
      for (let i = 0; i < n; i++) {
        const o = (i - (n - 1) / 2) * CHAIN_STEP;
        smalls.push(addNode(b, 'small', smallName, small(), cx + tx * o, cy + ty * o, c.id));
        if (i > 0) link(b, smalls[i - 1], smalls[i]);
      }
      const nb = finalNode(cx + ux * 80, cy + uy * 80);
      link(b, nb, smalls[Math.floor(n / 2)]);
      return smalls;
    }
    case 'spur':
    case 'keystone': {
      const start = c.kind === 'spur' ? -SPUR_STEP : -40;
      for (let i = 0; i < n; i++) {
        const o = start + i * SPUR_STEP;
        smalls.push(addNode(b, 'small', smallName, small(), cx + ux * o, cy + uy * o, c.id));
        if (i > 0) link(b, smalls[i - 1], smalls[i]);
      }
      const o = start + n * SPUR_STEP + (c.kind === 'keystone' ? 10 : 0);
      const nb = finalNode(cx + ux * o, cy + uy * o);
      link(b, nb, smalls[n - 1]);
      // Keystone clusters are dead ends: only the innermost small node takes travel paths.
      return c.kind === 'keystone' ? [smalls[0]] : smalls.slice(0, Math.max(1, n - 1));
    }
  }
}

function segmentClear(
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

function pointClear(b: Builder, x: number, y: number): boolean {
  for (const nd of b.nodes) if (Math.hypot(nd.x - x, nd.y - y) < MIN_NODE_DIST) return false;
  for (const [p, q] of b.edges) {
    const A = b.nodes[p];
    const B = b.nodes[q];
    if (segDist(x, y, A.x, A.y, B.x, B.y) < EDGE_CLEARANCE) return false;
  }
  return true;
}

/** Try to connect two attach sets with a straight travel path. */
function travel(b: Builder, from: number[], to: number[], attrs: Attr[]): boolean {
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
    if (!segmentClear(b, A.x, A.y, B.x, B.y, new Set([p, q]))) continue;
    const count = Math.max(0, Math.round(len / TRAVEL_SPACING) - 1);
    const pts: [number, number][] = [];
    let ok = true;
    for (let i = 1; i <= count; i++) {
      const t = i / (count + 1);
      const x = A.x + (B.x - A.x) * t;
      const y = A.y + (B.y - A.y) * t;
      if (!pointClear(b, x, y)) {
        ok = false;
        break;
      }
      pts.push([x, y]);
    }
    if (!ok) continue;
    let prev = p;
    pts.forEach(([x, y], i) => {
      const at = attrs[i % attrs.length];
      const id = addNode(b, 'travel', ATTR_NAME[at], [mod(at, 'base', 10)], x, y);
      link(b, prev, id);
      prev = id;
    });
    link(b, prev, q);
    return true;
  }
  return false;
}

/** Build the passive tree from the spec. Pure and deterministic. */
export function buildTree(
  clusters: ClusterSpec[] = buildClusterSpecs(),
): Tree & { dropped: string[] } {
  const b: Builder = { nodes: [], edges: [] };
  const attach = new Map<string, number[]>();
  const starts: Record<string, number> = {};
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
    starts[reg.classId] = id;
    attach.set(`start_${reg.id}`, [id]);
  }
  for (const c of clusters) attach.set(c.id, layoutCluster(b, c));
  const dropped: string[] = [];
  const byId = new Map(clusters.map((c) => [c.id, c]));
  for (const c of clusters) {
    for (const l of c.links) {
      const from = attach.get(c.id)!;
      const to = attach.get(l);
      if (!to) throw new Error(`cluster ${c.id} links to unknown ${l}`);
      const attrs =
        byId.get(l)?.region === c.region
          ? c.attrs
          : [...c.attrs, ...(byId.get(l)?.attrs ?? c.attrs)];
      if (!travel(b, from, to, attrs)) dropped.push(`${c.id}->${l}`);
    }
  }
  // Fallback: a cluster cut off from the class starts links to its nearest connected cluster.
  const center = (c: ClusterSpec) => [
    c.r * Math.cos((c.a * Math.PI) / 180),
    c.r * Math.sin((c.a * Math.PI) / 180),
  ];
  for (let pass = 0; pass < 3; pass++) {
    const reach = reachable(b, Object.values(starts)[0]);
    for (const c of clusters) {
      const own = attach.get(c.id)!;
      if (reach[own[0]]) continue;
      const [x, y] = center(c);
      const others = clusters
        .filter((o) => o.id !== c.id && o.kind !== 'keystone' && reach[attach.get(o.id)![0]])
        .map((o) => {
          const [ox, oy] = center(o);
          return { o, d: Math.hypot(ox - x, oy - y) };
        })
        .sort((p, q) => p.d - q.d || (p.o.id < q.o.id ? -1 : 1));
      for (const { o } of others.slice(0, 6)) {
        if (travel(b, own, attach.get(o.id)!, c.attrs)) {
          dropped.push(`${c.id}~>${o.id}`);
          break;
        }
      }
    }
  }
  return { nodes: b.nodes, starts, dropped };
}

function reachable(b: Builder, from: number): Uint8Array {
  const seen = new Uint8Array(b.nodes.length);
  const q = [from];
  seen[from] = 1;
  for (let h = 0; h < q.length; h++)
    for (const m of b.nodes[q[h]].links)
      if (!seen[m]) {
        seen[m] = 1;
        q.push(m);
      }
  return seen;
}
