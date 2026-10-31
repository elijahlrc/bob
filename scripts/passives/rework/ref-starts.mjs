// The reference's first two steps out of each class start (local data, study only): each node's stat lines.
import fs from 'fs';
const ref = JSON.parse(fs.readFileSync('E:/Proj/Auto/.claude/worktrees/flask-scarcity/reference/tree/ref-tree.json', 'utf8'));
const byId = new Map(Object.values(ref.nodes).map((n) => [n.id, n]));
const adj = new Map();
const add = (a, b) => { if (!adj.has(a)) adj.set(a, new Set()); adj.get(a).add(b); };
for (const n of byId.values()) for (const l of n.links) { add(n.id, l); add(l, n.id); }
const starts = { str: [47175, [31628, 50904]], dex: [50459, [39821, 45035, 58427, 64111, 56856]], int: [54447, [57264]], 'str/dex': [50986, [39725, 32730, 24984, 33795]], 'str/int': [61525, [63965]], 'dex/int': [44683, [45272, 58229, 55236, 18635]] };
const startIds = new Set(Object.values(starts).map((s) => s[0]));
for (const [c, [s, outs]] of Object.entries(starts)) {
  for (const o of outs) add(s, o), add(o, s);
  console.log(`\n# ${c}`);
  const first = [...adj.get(s)].filter((x) => byId.has(x));
  for (const f of first) {
    const n = byId.get(f);
    console.log(`  1: ${n.kind} ${n.name} | ${n.lines.join('; ')}`);
    for (const g of adj.get(f) ?? []) {
      if (g === s || startIds.has(g) || !byId.has(g)) continue;
      const m = byId.get(g);
      console.log(`     2: ${m.kind} ${m.name} | ${m.lines.join('; ')}`);
    }
  }
}
