// @ts-nocheck -- a one-off tool of the attrition rework (docs/tree/design/R-state.md), run with npx tsx; absolute paths.
// Steps between each pair of named notables (other class starts are no way through). Run: npx tsx steps.ts "Name A" "Name B" ...
const R = 'file:///E:/Proj/Auto/.claude/worktrees/flask-scarcity/src/';
const { buildAll } = await import(R + 'data/passives/index.ts');
const b = buildAll({ allowNew: true });
const { nodes } = b.tree;
const names = process.argv.slice(2);
const idx = names.map((n) => nodes.findIndex((x: any) => x.name === n));
const bfs = (s: number) => {
  const d = new Array(nodes.length).fill(Infinity);
  d[s] = 0;
  const q = [s];
  while (q.length) {
    const a = q.shift()!;
    for (const c of nodes[a].links) if (d[c] === Infinity && !nodes[c].classStart) (d[c] = d[a] + 1, q.push(c));
  }
  return d;
};
for (let i = 0; i < names.length; i++) {
  if (idx[i] < 0) {
    console.log('no node ' + names[i]);
    continue;
  }
  const d = bfs(idx[i]);
  for (let j = i + 1; j < names.length; j++) if (idx[j] >= 0) console.log(`${names[i]} – ${names[j]}: ${d[idx[j]]}`);
}
