/**
 * Assembles the hand-written areas (docs/tree/design/D-method.md) into the game's `Tree`: resolves ids, places nodes by
 * each cluster's shape, joins the links, and checks what a reviewer would otherwise find by eye. Adds nothing: every node
 * and every link comes from an area file.
 */
import { KEYSTONES } from '../tree/keystones';
import type { Tree, TreeNode } from '../tree/types';
import type { AreaSpec, ClusterSpec, LineSpec, NodeSpec, StartSpec } from './types';

export type Registry = Record<string, number>;

export type Built = {
  tree: Tree;
  /** Full string id of every node, by baked id. */
  ids: string[];
  /** The area and cluster each node belongs to. */
  place: { area: string; cluster: string; region: string }[];
  /** Links as written, with their reasons. */
  links: { a: string; b: string; why: string }[];
  /** Every node's lines in the vocabulary (`{ fn, args }`), by baked id; a start, a retired hole or a keystone has none. */
  lines: LineSpec[][];
  problems: string[];
  /** Registry after new ids were given numbers (same object as passed when nothing is new). */
  registry: Registry;
};

const fullId = (area: AreaSpec, cluster: ClusterSpec, node: NodeSpec): string =>
  `${area.id}.${cluster.id}.${node.id}`;

/** Resolves a link endpoint written inside `area`: `cluster.node` or a full `area.cluster.node`. */
function resolve(ref: string, area: AreaSpec, known: Set<string>): string | null {
  if (known.has(ref)) return ref;
  const local = `${area.id}.${ref}`;
  if (known.has(local)) return local;
  return null;
}

function placeCluster(c: ClusterSpec): Map<string, [number, number]> {
  const out = new Map<string, [number, number]>();
  const n = c.nodes.length;
  c.nodes.forEach((node, i) => {
    if (node.at) {
      out.set(node.id, node.at);
      return;
    }
    const s = c.shape;
    if (s.kind === 'ring') {
      const a = (((s.a0 ?? -90) + (360 * i) / n) * Math.PI) / 180;
      out.set(node.id, [
        Math.round(c.at[0] + s.r * Math.cos(a)),
        Math.round(c.at[1] + s.r * Math.sin(a)),
      ]);
    } else if (s.kind === 'line') {
      const a = (s.heading * Math.PI) / 180;
      const gap = s.gap ?? 120;
      out.set(node.id, [
        Math.round(c.at[0] + gap * i * Math.cos(a)),
        Math.round(c.at[1] + gap * i * Math.sin(a)),
      ]);
    } else {
      out.set(node.id, c.at);
    }
  });
  return out;
}

/** The name a small node shows: its lines' labels. */
function smallName(node: NodeSpec): string {
  return node.name ?? node.lines.map((l) => l.label).join(', ');
}

export function buildPassives(
  areas: AreaSpec[],
  starts: StartSpec[],
  registry: Registry,
  opts: { allowNew: boolean },
): Built {
  const problems: string[] = [];
  const reg: Registry = { ...registry };
  let next = Math.max(-1, ...Object.values(reg)) + 1;
  const number = (id: string): number => {
    if (reg[id] === undefined) {
      if (!opts.allowNew)
        problems.push(`new id not in the registry (run passives:bake to register it): ${id}`);
      reg[id] = next++;
    }
    return reg[id];
  };

  // 1. Every node gets its id and number.
  type Pending = {
    id: string;
    node: NodeSpec;
    area: AreaSpec;
    cluster: ClusterSpec;
    at: [number, number];
  };
  const pending: Pending[] = [];
  const known = new Set<string>();
  for (const s of starts) {
    known.add(s.id);
    number(s.id);
  }
  for (const area of areas)
    for (const cluster of area.clusters) {
      const at = placeCluster(cluster);
      for (const node of cluster.nodes) {
        const id = fullId(area, cluster, node);
        if (known.has(id)) problems.push(`duplicate node id ${id}`);
        known.add(id);
        number(id);
        pending.push({ id, node, area, cluster, at: at.get(node.id)! });
        if ((node.kind === 'notable' || node.kind === 'keystone') && !node.name)
          problems.push(`${id}: a ${node.kind} needs a name`);
        if (node.kind === 'keystone' && !KEYSTONES.some((k) => k.name === node.name))
          problems.push(`${id}: no keystone named ${node.name}`);
      }
    }

  // 2. Links, each once, with a reason.
  const links: Built['links'] = [];
  const seen = new Set<string>();
  const addLink = (a: string, b: string, why: string, where: string) => {
    if (a === b) return problems.push(`${where}: a link from ${a} to itself`);
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (seen.has(key)) return problems.push(`${where}: the link ${a} - ${b} is written twice`);
    seen.add(key);
    if (!why) problems.push(`${where}: the link ${a} - ${b} has no reason`);
    links.push({ a, b, why });
  };
  for (const area of areas) {
    for (const cluster of area.clusters) {
      const base = `${area.id}.${cluster.id}`;
      for (const [x, y] of cluster.links) {
        const a = `${base}.${x}`,
          b = `${base}.${y}`;
        if (!known.has(a) || !known.has(b)) {
          problems.push(`${base}: a link names a node that is not in the cluster: ${x} - ${y}`);
          continue;
        }
        addLink(a, b, `inside ${cluster.name}`, base);
      }
    }
    for (const l of area.links) {
      const a = resolve(l.from, area, known),
        b = resolve(l.to, area, known);
      if (!a || !b) {
        problems.push(`${area.id}: a link names an unknown node: ${l.from} - ${l.to}`);
        continue;
      }
      addLink(a, b, l.why, area.id);
    }
  }

  // 3. The tree.
  const count = Object.keys(reg).length;
  const nodes: TreeNode[] = new Array(count);
  const ids: string[] = new Array(count);
  const place: Built['place'] = new Array(count);
  const lines: LineSpec[][] = Array.from({ length: count }, () => []);
  const treeStarts: Record<string, number> = {};
  for (const s of starts) {
    const n = reg[s.id];
    nodes[n] = {
      id: n,
      kind: 'start',
      name: `${s.classId} start`,
      mods: [],
      x: s.at[0],
      y: s.at[1],
      links: [],
      classStart: s.classId,
    };
    ids[n] = s.id;
    place[n] = { area: 'start', cluster: 'start', region: s.region };
    treeStarts[s.classId] = n;
  }
  for (const p of pending) {
    const n = reg[p.id];
    const kind = p.node.kind === 'attribute' ? 'travel' : p.node.kind;
    const mods =
      p.node.kind === 'keystone'
        ? (KEYSTONES.find((k) => k.name === p.node.name)?.mods ?? [])
        : p.node.lines.flatMap((l) => l.mods);
    nodes[n] = {
      id: n,
      kind,
      name:
        p.node.kind === 'small' || p.node.kind === 'attribute' ? smallName(p.node) : p.node.name!,
      mods,
      x: p.at[0],
      y: p.at[1],
      links: [],
      cluster: `${p.area.id}.${p.cluster.id}`,
      district: p.area.id,
      region: p.area.region as never,
    };
    ids[n] = p.id;
    place[n] = { area: p.area.id, cluster: p.cluster.id, region: p.area.region };
    if (p.node.kind !== 'keystone')
      lines[n] = p.node.lines.flatMap((l) => (l.spec ? [l.spec] : []));
  }
  // Ids retired from the registry leave holes: fill them with nothing the game can reach (kept for save compatibility).
  for (let i = 0; i < count; i++)
    if (!nodes[i]) {
      nodes[i] = { id: i, kind: 'small', name: '(retired)', mods: [], x: 0, y: 0, links: [] };
      ids[i] = '(retired)';
      place[i] = { area: '', cluster: '', region: '' };
    }
  for (const l of links) {
    nodes[reg[l.a]].links.push(reg[l.b]);
    nodes[reg[l.b]].links.push(reg[l.a]);
  }

  // 4. Checks a reviewer would otherwise make by eye.
  for (const n of nodes) {
    if (n.name === '(retired)') continue;
    // A start with no home yet is not a problem while the regions are being written one at a time.
    if (n.links.length === 0 && n.kind !== 'start')
      problems.push(`${ids[n.id]} is linked to nothing`);
    if (n.kind === 'keystone' && n.links.length !== 1)
      problems.push(`${ids[n.id]}: a keystone is a dead end (has ${n.links.length} links)`);
  }
  for (let i = 0; i < nodes.length; i++)
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].name === '(retired)' || nodes[j].name === '(retired)') continue;
      const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
      if (d < 60) problems.push(`${ids[i]} and ${ids[j]} are ${Math.round(d)} units apart`);
    }

  const areaNames = areas.map((a) => ({ name: a.name, region: a.region, x: a.at[0], y: a.at[1] }));
  return {
    tree: { nodes, starts: treeStarts, areas: areaNames },
    ids,
    place,
    links,
    lines,
    problems,
    registry: reg,
  };
}
