// @ts-nocheck -- a one-off tool of the attrition rework (docs/tree/design/R-state.md), run with npx tsx; absolute paths.
// Further out: the reference tree (local data) against Bob's, from each class start to 20 steps. Per band of steps: nodes,
// notables, keystones; loops and dead ends in the ball; mean links per node; steps to the neighbouring starts; and the
// share of notables a single exit holds behind it.
import fs from 'fs';
type G = { adj: Map<number, Set<number>>; kind: Map<number, string>; starts: [string, number][] };
const link = (g: G, a: number, b: number) => {
  if (a === b) return;
  for (const [x, y] of [
    [a, b],
    [b, a],
  ]) {
    if (!g.adj.has(x)) g.adj.set(x, new Set());
    g.adj.get(x)!.add(y);
  }
};
function dist(g: G, s: number, cut = -1): Map<number, number> {
  const starts = new Set(g.starts.map(([, x]) => x));
  const d = new Map<number, number>([[s, 0]]);
  const q = [s];
  while (q.length) {
    const a = q.shift()!;
    for (const b of g.adj.get(a) ?? []) {
      if (b === cut || (starts.has(b) && b !== s)) continue;
      if (!d.has(b)) {
        d.set(b, d.get(a)! + 1);
        q.push(b);
      }
    }
  }
  return d;
}
function measure(name: string, g: G) {
  console.log(`\n## ${name}`);
  const bands = [
    [1, 4],
    [5, 8],
    [9, 12],
    [13, 16],
    [17, 20],
  ];
  console.log(
    'start | nodes per band 1-4,5-8,9-12,13-16,17-20 | notables per band | keystones (steps) | loops ≤10 / ≤15 / ≤20 | dead ends ≤15 | mean links ≤15 | other starts (steps) | notables ≤14 behind each exit',
  );
  const startIds = new Set(g.starts.map(([, s]) => s));
  for (const [cls, s] of g.starts) {
    const d = dist(g, s);
    const inBand = (lo: number, hi: number, k?: string) =>
      [...d].filter(([n, v]) => v >= lo && v <= hi && (!k || g.kind.get(n) === k)).length;
    const ball = (k: number) => new Set([...d].filter(([, v]) => v <= k).map(([n]) => n));
    const loops = (k: number) => {
      const b = ball(k);
      let l = 0;
      for (const n of b) for (const m of g.adj.get(n) ?? []) if (b.has(m) && n < m) l++;
      return l - b.size + 1;
    };
    const b15 = ball(15);
    const deg = (n: number) =>
      [...(g.adj.get(n) ?? [])].filter((m) => !startIds.has(m) || m === s).length;
    const dead = [...b15].filter((n) => n !== s && deg(n) === 1).length;
    const mean = [...b15].reduce((t, n) => t + deg(n), 0) / b15.size;
    const keys = [...d]
      .filter(([n, v]) => g.kind.get(n) === 'keystone' && v <= 20)
      .map(([, v]) => v)
      .sort((a, b) => a - b);
    // Steps to the other starts, through the tree (another start may be passed through for this one).
    const all = new Map<number, number>([[s, 0]]);
    const q = [s];
    while (q.length) {
      const a = q.shift()!;
      for (const b of g.adj.get(a) ?? []) if (!all.has(b)) (all.set(b, all.get(a)! + 1), q.push(b));
    }
    const others = g.starts
      .filter(([, x]) => x !== s)
      .map(([, x]) => all.get(x) ?? -1)
      .sort((a, b) => a - b);
    const notables14 = [...d]
      .filter(([n, v]) => g.kind.get(n) === 'notable' && v <= 14)
      .map(([n]) => n);
    const exits = [...(g.adj.get(s) ?? [])].filter((m) => !startIds.has(m) && g.kind.has(m));
    const behind = exits.map((e) => {
      const dc = dist(g, s, e);
      return notables14.filter((n) => (dc.get(n) ?? 99) - d.get(n)! >= 3).length;
    });
    console.log(
      `${cls} | ${bands.map(([a, b]) => inBand(a, b)).join(', ')} | ${bands.map(([a, b]) => inBand(a, b, 'notable')).join(', ')} | ${keys.join(' ')} | ${loops(10)} / ${loops(15)} / ${loops(20)} | ${dead} | ${mean.toFixed(2)} | ${others.join(' ')} | ${behind.join(' / ')} of ${notables14.length}`,
    );
  }
}
const ref = JSON.parse(
  fs.readFileSync(
    'E:/Proj/Auto/.claude/worktrees/flask-scarcity/reference/tree/ref-tree.json',
    'utf8',
  ),
);
const refG: G = { adj: new Map(), kind: new Map(), starts: [] };
const refStarts: [string, number, number[]][] = [
  ['str', 47175, [31628, 50904]],
  ['dex', 50459, [39821, 45035, 58427, 64111, 56856]],
  ['int', 54447, [57264]],
  ['str/dex', 50986, [39725, 32730, 24984, 33795]],
  ['str/int', 61525, [63965]],
  ['dex/int', 44683, [45272, 58229, 55236, 18635]],
];
const ids = new Set<number>(Object.values(ref.nodes).map((n: any) => n.id));
for (const [, s] of refStarts) ids.add(s);
for (const n of Object.values(ref.nodes) as any[]) {
  refG.kind.set(n.id, n.kind);
  for (const l of n.links) if (ids.has(l)) link(refG, n.id, l);
}
for (const [c, s, outs] of refStarts) {
  refG.starts.push([c, s]);
  refG.kind.set(s, 'start');
  for (const o of outs) if (ids.has(o)) link(refG, s, o);
}
measure('reference', refG);
const R = 'file:///E:/Proj/Auto/.claude/worktrees/flask-scarcity/src/';
const { buildAll } = await import(R + 'data/passives/index.ts');
const { nodes } = buildAll({ allowNew: true }).tree;
const bob: G = { adj: new Map(), kind: new Map(), starts: [] };
nodes.forEach((n: any, i: number) => {
  bob.kind.set(i, n.kind === 'travel' ? 'small' : n.kind);
  for (const b of n.links) link(bob, i, b);
  if (n.classStart) bob.starts.push([n.classStart, i]);
});
measure('Bob', bob);
// The whole of each: nodes, notables, keystones, mean links.
for (const [name, g] of [
  ['reference', refG],
  ['Bob', bob],
] as const) {
  const c: Record<string, number> = {};
  for (const k of g.kind.values()) c[k] = (c[k] ?? 0) + 1;
  let l = 0;
  for (const s of g.adj.values()) l += s.size;
  console.log(`${name}: ${JSON.stringify(c)}, mean links ${(l / g.adj.size).toFixed(2)}`);
}
