/**
 * How connected the reference tree is (docs/TREE.md, "Look and density"): the links of `docs/tree/pob-tree.json` are
 * one-directional, so they are made symmetric before counting edges, loops, degrees and the links that leave a group.
 * `npm run tree:refmix`.
 */
import { readFileSync } from 'node:fs';

type R = {
  id: number;
  name: string;
  kind: string;
  lines: string[];
  group: number;
  links: number[];
};
const ref = JSON.parse(readFileSync('docs/tree/pob-tree.json', 'utf8')) as { nodes: R[] };
const ids = new Set(ref.nodes.map((n) => n.id));
const adj = new Map<number, Set<number>>();
for (const n of ref.nodes) adj.set(n.id, new Set());
for (const n of ref.nodes)
  for (const l of n.links)
    if (l !== n.id && ids.has(l)) {
      adj.get(n.id)!.add(l);
      adj.get(l)!.add(n.id);
    }
const N = ref.nodes.length;
let E = 0;
const deg: Record<number, number> = {};
for (const [, s] of adj) {
  E += s.size;
  deg[s.size] = (deg[s.size] ?? 0) + 1;
}
E /= 2;
console.log('nodes', N, 'edges', E, 'mean degree', ((2 * E) / N).toFixed(2), 'loops', E - N + 1);
console.log('degree', deg);
const pct = (x: number) => ((100 * x) / N).toFixed(1) + '%';
const d3 = ref.nodes.filter((n) => adj.get(n.id)!.size >= 3).length;
console.log('degree>=3', d3, pct(d3), ' degree 1', deg[1] ?? 0, pct(deg[1] ?? 0));
for (const kind of ['notable', 'keystone', 'small']) {
  const ns = ref.nodes.filter((n) => n.kind === kind);
  const dd: Record<number, number> = {};
  for (const n of ns) dd[adj.get(n.id)!.size] = (dd[adj.get(n.id)!.size] ?? 0) + 1;
  console.log(
    kind,
    ns.length,
    'degree',
    dd,
    'share with degree>=2',
    ((100 * ns.filter((n) => adj.get(n.id)!.size >= 2).length) / ns.length).toFixed(0) + '%',
  );
}
// components
const seen = new Set<number>();
let comps = 0;
for (const n of ref.nodes) {
  if (seen.has(n.id)) continue;
  comps++;
  const q = [n.id];
  seen.add(n.id);
  for (let h = 0; h < q.length; h++)
    for (const m of adj.get(q[h])!)
      if (!seen.has(m)) {
        seen.add(m);
        q.push(m);
      }
}
console.log('components', comps);
// groups: size, attach points
const groups = new Map<number, R[]>();
for (const n of ref.nodes) {
  if (!groups.has(n.group)) groups.set(n.group, []);
  groups.get(n.group)!.push(n);
}
const attach: Record<number, number> = {};
const gsize: Record<number, number> = {};
for (const [g, ns] of groups) {
  let a = 0;
  for (const n of ns)
    for (const m of adj.get(n.id)!)
      if (ref.nodes.find((x) => x.id === m)!.group !== g) {
        a++;
        break;
      }
  attach[a] = (attach[a] ?? 0) + 1;
  gsize[ns.length] = (gsize[ns.length] ?? 0) + 1;
}
console.log('groups', groups.size, 'sizes', gsize);
console.log('attach nodes per group (nodes with an outside link)', attach);
// outside links per group (edges leaving)
const out: Record<number, number> = {};
const byId = new Map(ref.nodes.map((n) => [n.id, n]));
for (const [g, ns] of groups) {
  let e = 0;
  for (const n of ns) for (const m of adj.get(n.id)!) if (byId.get(m)!.group !== g) e++;
  out[e] = (out[e] ?? 0) + 1;
}
console.log('edges leaving a group', out);
