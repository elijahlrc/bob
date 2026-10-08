import { mod, type Mod } from '../../mods/types';
import { keystoneDef } from './keystones';
import { THEMES } from './notableThemes';
import { buildClusterSpecs, REGIONS, START_RADIUS, type Attr, type ClusterSpec } from './spec';
import type { Tree, TreeNode, TreeNodeKind } from './types';

/** Minimum distance between any two nodes (§9.3). */
export const MIN_NODE_DIST = 40;
/** A node closer than this to an edge it is not part of counts as "on" the edge. */
export const EDGE_CLEARANCE = 22;
const TRAVEL_SPACING = 150;
/** The spacing of the nodes of a cluster along a road, and of a wheel's loop; the least radius of a wheel; the length of a notable's stalk. */
const CHAIN_STEP = 62;
const WHEEL_CHORD = 58;
const WHEEL_MIN_RADIUS = 62;
const STALK = 74;
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

/** The name of a small node as shown: "Lesser armour" reads as "Armour" (the node says what it gives, as a name). */
function tidyName(name: string): string {
  const bare = name.replace(/^Lesser /, '');
  return bare.charAt(0).toUpperCase() + bare.slice(1);
}

/** A small number from a cluster id, to vary shapes the same way every time. */
function hashId(id: string): number {
  let h = 7;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
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
  const smallName = tidyName(c.gen ? c.gen.small.name : theme.smallName);
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
  /** A line of the cluster's nodes along the ring with the notable among them: roads run through it (an inline cluster). */
  const inline = (): number[] => {
    const at = Math.ceil(n / 2);
    const ids: number[] = [];
    for (let j = 0; j <= n; j++) {
      const o = (j - n / 2) * CHAIN_STEP;
      const x = cx + tx * o;
      const y = cy + ty * o;
      ids.push(j === at ? finalNode(x, y) : addNode(b, 'small', smallName, small(), x, y, c.id));
      if (j > 0) link(b, ids[j - 1], ids[j]);
    }
    return [ids[0], ids[n]];
  };
  switch (c.kind) {
    case 'wheel': {
      // A loop of the smalls and the notable (which faces outward); roads enter and leave at the two sides.
      const m = n + 1;
      const radius = Math.max(WHEEL_MIN_RADIUS, WHEEL_CHORD / (2 * Math.sin(Math.PI / m)));
      const ids: number[] = [];
      for (let i = 0; i < m; i++) {
        const th = a + (2 * Math.PI * i) / m;
        const x = cx + radius * Math.cos(th);
        const y = cy + radius * Math.sin(th);
        ids.push(i === 0 ? finalNode(x, y) : addNode(b, 'small', smallName, small(), x, y, c.id));
      }
      for (let i = 0; i < m; i++) link(b, ids[i], ids[(i + 1) % m]);
      const side = Math.max(1, Math.round(m / 4));
      return [ids[side], ids[m - side]];
    }
    case 'chain':
      return inline();
    case 'spur': {
      // Half the two-small clusters are inline; the others are a pair with the notable on a stalk beside it.
      const h = hashId(c.id);
      if (h % 2 === 0) return inline();
      const sign = h & 4 ? 1 : -1;
      const first = addNode(
        b,
        'small',
        smallName,
        small(),
        cx - tx * (CHAIN_STEP / 2),
        cy - ty * (CHAIN_STEP / 2),
        c.id,
      );
      const second = addNode(
        b,
        'small',
        smallName,
        small(),
        cx + tx * (CHAIN_STEP / 2),
        cy + ty * (CHAIN_STEP / 2),
        c.id,
      );
      link(b, first, second);
      const root = h & 2 ? second : first;
      const rx = b.nodes[root].x;
      const ry = b.nodes[root].y;
      link(b, finalNode(rx + ux * STALK * sign, ry + uy * STALK * sign), root);
      return [first, second];
    }
    case 'keystone': {
      // A dead end leaving the ring: two smalls and the keystone, only the innermost small takes roads.
      for (let i = 0; i < n; i++) {
        const o = -40 + i * SPUR_STEP;
        smalls.push(addNode(b, 'small', smallName, small(), cx + ux * o, cy + uy * o, c.id));
        if (i > 0) link(b, smalls[i - 1], smalls[i]);
      }
      const o = -40 + n * SPUR_STEP + 10;
      link(b, finalNode(cx + ux * o, cy + uy * o), smalls[n - 1]);
      return [smalls[0]];
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
