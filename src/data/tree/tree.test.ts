import { describe, expect, it } from 'vitest';
import { CLASSES } from '../classes';
import { buildTree, EDGE_CLEARANCE, MIN_NODE_DIST, segDist } from './build';
import { KEYSTONES } from './keystones';
import { buildClusterSpecs } from './spec';

const tree = buildTree();
const nodes = tree.nodes;

function bfs(start: number): number[] {
  const d = new Array(nodes.length).fill(-1);
  d[start] = 0;
  const q = [start];
  for (let h = 0; h < q.length; h++)
    for (const m of nodes[q[h]].links)
      if (d[m] < 0) {
        d[m] = d[q[h]] + 1;
        q.push(m);
      }
  return d;
}

describe('passive tree invariants (§9.3)', () => {
  it('has 1,250–1,350 nodes and exactly 21 keystones', () => {
    expect(nodes.length).toBeGreaterThanOrEqual(1250);
    expect(nodes.length).toBeLessThanOrEqual(1350);
    expect(nodes.filter((n) => n.kind === 'keystone')).toHaveLength(21);
    const ksNames = nodes
      .filter((n) => n.kind === 'keystone')
      .map((n) => n.name)
      .sort();
    expect(ksNames).toEqual(KEYSTONES.map((k) => k.name).sort());
  });

  it('has about 130 notables', () => {
    const n = nodes.filter((x) => x.kind === 'notable').length;
    expect(n).toBeGreaterThanOrEqual(120);
    expect(n).toBeLessThanOrEqual(145);
  });

  it('is connected: every node is reachable from every class start', () => {
    for (const c of CLASSES) {
      const d = bfs(tree.starts[c.id]);
      expect(d.filter((x) => x < 0)).toHaveLength(0);
    }
  });

  it('links are symmetric', () => {
    for (const n of nodes) for (const m of n.links) expect(nodes[m].links).toContain(n.id);
  });

  it('no two nodes are closer than 40 units', () => {
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++) {
        const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
        if (d < MIN_NODE_DIST)
          throw new Error(`${nodes[i].name}#${i} and ${nodes[j].name}#${j} are ${d} apart`);
      }
  });

  it('no edge passes through a node it is not attached to', () => {
    const clear = EDGE_CLEARANCE - 2;
    for (const a of nodes)
      for (const bId of a.links) {
        if (bId < a.id) continue;
        const b = nodes[bId];
        for (const n of nodes) {
          if (n.id === a.id || n.id === b.id) continue;
          const d = segDist(n.x, n.y, a.x, a.y, b.x, b.y);
          if (d < clear) throw new Error(`edge ${a.id}-${b.id} passes through node ${n.id} (${d})`);
        }
      }
  });

  it('every cluster link references an existing cluster or class start', () => {
    const specs = buildClusterSpecs();
    const ids = new Set(specs.map((c) => c.id));
    for (const c of specs)
      for (const l of c.links)
        expect(ids.has(l) || l.startsWith('start_'), `${c.id} → ${l}`).toBe(true);
  });

  it('each class start reaches ≥ 4 keystones within 40 points and ≥ 15 notables within 30', () => {
    for (const c of CLASSES) {
      const d = bfs(tree.starts[c.id]);
      const ks = nodes.filter((n) => n.kind === 'keystone' && d[n.id] <= 40).length;
      const nt = nodes.filter((n) => n.kind === 'notable' && d[n.id] <= 30).length;
      expect(ks, c.id).toBeGreaterThanOrEqual(4);
      expect(nt, c.id).toBeGreaterThanOrEqual(15);
    }
  });

  it('notable names are unique and at most 3 notables share a mod set', () => {
    const notables = nodes.filter((n) => n.kind === 'notable');
    const names = notables.map((n) => n.name);
    expect(new Set(names).size).toBe(names.length);
    const sig = (n: (typeof nodes)[number]) =>
      n.mods
        .map((m) => `${m.stat}|${m.kind}|${(m.tags ?? []).join()}|${(m.damageTypes ?? []).join()}`)
        .sort()
        .join(';');
    const counts = new Map<string, number>();
    for (const n of notables) counts.set(sig(n), (counts.get(sig(n)) ?? 0) + 1);
    for (const [s, c] of counts) expect(c, s).toBeLessThanOrEqual(3);
  });

  it('is deterministic and pinned (snapshot)', () => {
    const again = buildTree();
    expect(again.nodes.length).toBe(nodes.length);
    const edges = nodes.reduce((s, n) => s + n.links.length, 0) / 2;
    expect({
      nodes: nodes.length,
      edges,
      keystones: nodes
        .filter((n) => n.kind === 'keystone')
        .map((n) => ({ id: n.id, name: n.name, x: n.x, y: n.y })),
    }).toMatchSnapshot();
  });
});
