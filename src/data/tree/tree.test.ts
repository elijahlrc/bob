import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bare } from '../../../scripts/coverage/reference';
import { CLASSES } from '../classes';
import { EDGE_CLEARANCE, MIN_NODE_DIST, segDist } from './builder';
import { GEN_CLUSTERS } from './clustersGen';
import { KEYSTONES } from './keystones';
import { buildLayoutTree } from './layout';
import { floorFor, modKey, powerOf, unitsOf } from './power';

const tree = buildLayoutTree();
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

/**
 * What is a fact of the tree, as opposed to a matter of taste (docs/TREE-REDESIGN.md section 8): the tree works, nothing
 * overlaps, every cluster hangs from one road, roads are generic, notables are worth more than small nodes. How it looks is
 * judged by the pictures (`npm run tree:pic`) and the audit (`npm run tree:audit`), not here.
 */
describe('passive tree invariants (§9.3)', () => {
  it('has exactly 27 keystones, named as the keystone list, and about 370 notables', () => {
    const ks = nodes.filter((n) => n.kind === 'keystone');
    expect(ks).toHaveLength(27);
    expect(ks.map((n) => n.name).sort()).toEqual(KEYSTONES.map((k) => k.name).sort());
    const n = nodes.filter((x) => x.kind === 'notable').length;
    expect(n).toBeGreaterThanOrEqual(330);
    expect(n).toBeLessThanOrEqual(400);
  });

  it('lays out every cluster and every road', () => {
    expect(tree.dropped).toEqual([]);
    expect(tree.unplaced).toEqual([]);
  });

  it('is connected: every node is reachable from every class start', () => {
    for (const c of CLASSES) {
      const d = bfs(tree.starts[c.id]);
      expect(d.filter((x) => x < 0)).toHaveLength(0);
    }
  });

  it('can be walked: a class reaches every node but the other starts without passing through one (a start cannot be taken)', () => {
    for (const c of CLASSES) {
      const start = tree.starts[c.id];
      const seen = new Set<number>([start]);
      const q = [start];
      for (let h = 0; h < q.length; h++)
        for (const m of nodes[q[h]].links)
          if (!seen.has(m) && nodes[m].kind !== 'start') {
            seen.add(m);
            q.push(m);
          }
      const lost = nodes.filter((n) => n.kind !== 'start' && !seen.has(n.id));
      expect(
        lost.map((n) => n.name),
        c.id,
      ).toEqual([]);
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

  it('every keystone is a dead end', () => {
    for (const k of nodes.filter((n) => n.kind === 'keystone'))
      expect(k.links, k.name).toHaveLength(1);
  });

  it('every cluster hangs from one entrance: a road never runs through it (the middle wheel has its two spokes and three keystones)', () => {
    const outside = new Map<string, number>();
    for (const n of nodes)
      if (n.cluster)
        for (const m of n.links)
          if (nodes[m].cluster !== n.cluster)
            outside.set(n.cluster, (outside.get(n.cluster) ?? 0) + 1);
    const ids = new Set(nodes.filter((n) => n.cluster).map((n) => n.cluster!));
    for (const id of ids) expect(outside.get(id), id).toBe(id === 'hub_c' ? 5 : 1);
  });

  it('roads are generic: no small node on a road names a weapon, a skill type or a condition', () => {
    const roads = nodes.filter((n) => n.kind === 'small' && !n.cluster);
    expect(roads.length).toBeGreaterThan(100);
    const niche = [
      'sword',
      'axe',
      'mace',
      'staff',
      'wand',
      'bow',
      'claw',
      'dagger',
      'sceptre',
      'twoHand',
      'oneHand',
      'minion',
      'totem',
      'trap',
      'mine',
      'brand',
      'curse',
      'warcry',
      'aura',
      'channelling',
    ];
    for (const n of roads)
      for (const m of n.mods) {
        expect(
          (m.tags ?? []).filter((t) => niche.includes(t)),
          n.name,
        ).toEqual([]);
        expect(m.condition, n.name).toBeUndefined();
      }
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

  it('each class start has the spoke into the middle and two roads out into its region, and a start to start way round the middle', () => {
    for (const c of CLASSES) {
      const s = tree.starts[c.id];
      const out = nodes[s].links.filter((m) => nodes[m].region !== 'hub');
      expect(nodes[s].links.length, c.id).toBe(3);
      expect(out.length, c.id).toBe(2);
      // The first steps are the basics: two basic notables, one on each way out, within 8 steps (never through another start).
      const d = new Map<number, number>([[s, 0]]);
      const q = [s];
      for (let h = 0; h < q.length; h++)
        for (const m of nodes[q[h]].links)
          if (!d.has(m) && nodes[m].kind !== 'start' && d.get(q[h])! < 8) {
            d.set(m, d.get(q[h])! + 1);
            q.push(m);
          }
      const near = [...d.keys()].filter((i) => nodes[i].kind === 'notable').length;
      expect(near, c.id).toBeGreaterThanOrEqual(3);
      // No keystone is at the doorstep: they change how you play, and are not the very core.
      expect(
        [...d.keys()].filter((i) => nodes[i].kind === 'keystone').map((i) => nodes[i].name),
        c.id,
      ).toEqual([]);
    }
  });

  it('the first steps from a start are core and the next ones offer options: at least 3 notables within 8 steps and 15 within 14', () => {
    for (const c of CLASSES) {
      const d = bfs(tree.starts[c.id]);
      const within = (k: number) =>
        nodes.filter((n) => n.kind === 'notable' && d[n.id] <= k).length;
      expect(within(8), c.id).toBeGreaterThanOrEqual(3);
      expect(within(14), c.id).toBeGreaterThanOrEqual(15);
    }
  });

  it('each class start reaches both neighbouring regions without using the middle, within 20 steps', () => {
    for (const c of CLASSES) {
      const s = tree.starts[c.id];
      const own = nodes[s].region;
      const d = new Map<number, number>([[s, 0]]);
      const q = [s];
      for (let h = 0; h < q.length; h++)
        for (const m of nodes[q[h]].links)
          if (!d.has(m) && nodes[m].kind !== 'start' && nodes[m].region !== 'hub') {
            d.set(m, d.get(q[h])! + 1);
            q.push(m);
          }
      const reached = new Set<string>();
      for (const [i, v] of d)
        if (v <= 20 && nodes[i].region !== own) reached.add(String(nodes[i].region));
      expect(reached.size, `${c.id}: ${[...reached]}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('notable names are unique and at most 4 notables share a mod set', () => {
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
    for (const [s, c] of counts) expect(c, s).toBeLessThanOrEqual(4);
  });

  it('no notable or keystone is named like a passive of the reference tree (docs/tree/pob-tree.json)', () => {
    const ref = JSON.parse(
      readFileSync(new URL('../../../docs/tree/pob-tree.json', import.meta.url), 'utf8'),
    ) as { nodes: { name: string; kind: string }[] };
    const denied = new Set(ref.nodes.filter((n) => n.kind !== 'small').map((n) => bare(n.name)));
    const bad = nodes
      .filter((n) => n.kind === 'notable' || n.kind === 'keystone')
      .filter((n) => denied.has(bare(n.name)))
      .map((n) => n.name);
    expect(bad).toEqual([]);
  });

  it('a notable is worth more than a small node (docs/TREE-REDESIGN.md section 4)', () => {
    const units = unitsOf(nodes.filter((n) => n.kind === 'small').flatMap((n) => n.mods));
    const weak = nodes
      .filter((n) => n.kind === 'notable')
      .map((n) => ({ n, p: powerOf(n.mods, units) }))
      .filter(({ n, p }) => p < floorFor(n.mods.length) - 1e-9)
      .map(({ n, p }) => `${n.name} ${p.toFixed(2)}`);
    expect(weak).toEqual([]);
  });

  it('the small nodes of a stat give one value, across the generated clusters and the roads', () => {
    const seen = new Map<string, number>();
    const odd: string[] = [];
    for (const g of GEN_CLUSTERS)
      for (const m of g.small.mods) {
        const k = modKey(m);
        if (seen.has(k) && seen.get(k) !== m.value) odd.push(`${g.small.name}: ${k}`);
        seen.set(k, m.value);
      }
    for (const n of nodes.filter((x) => x.kind === 'small' && !x.cluster))
      for (const m of n.mods) {
        const v = seen.get(modKey(m));
        if (v !== undefined && v !== m.value)
          odd.push(`road ${n.name}: ${modKey(m)} is ${m.value}, not ${v}`);
      }
    expect(odd).toEqual([]);
  });

  it('the hub gives what any build wants: no weapon, skill-type or condition in its small nodes', () => {
    const hub = nodes.filter((n) => n.kind === 'small' && n.cluster?.startsWith('hub'));
    expect(hub.length).toBeGreaterThan(0);
    for (const n of hub)
      for (const m of n.mods) {
        expect(m.tags ?? [], n.name).toEqual([]);
        expect(m.condition, n.name).toBeUndefined();
      }
  });

  it('is deterministic and pinned (snapshot)', () => {
    const again = buildLayoutTree();
    expect(again.nodes.length).toBe(nodes.length);
    expect(again.nodes.map((n) => [n.x, n.y])).toEqual(nodes.map((n) => [n.x, n.y]));
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
