// @ts-nocheck -- a one-off tool of the attrition rework (docs/tree/design/R-state.md), run with npx tsx; absolute paths.
// Nodes of a region (argv: place region, e.g. strider) that no class start reaches, and dead-end chains of road nodes.
const R = 'file:///E:/Proj/Auto/.claude/worktrees/flask-scarcity/src/';
const { buildAll } = await import(R + 'data/passives/index.ts');
const ids = (
  await import('file:///E:/Proj/Auto/.claude/worktrees/flask-scarcity/src/data/passives/ids.json', {
    with: { type: 'json' },
  })
).default as Record<string, number>;
const b = buildAll({ allowNew: true });
const { nodes } = b.tree;
const name = new Map<number, string>();
for (const [k, v] of Object.entries(ids)) name.set(v, k);
const reg = process.argv[2];
const seen = new Set<number>();
const q: number[] = [];
nodes.forEach((n: any, i: number) => {
  if (n.classStart) {
    seen.add(i);
    q.push(i);
  }
});
while (q.length) {
  const a = q.shift()!;
  for (const c of nodes[a].links) if (!seen.has(c)) (seen.add(c), q.push(c));
}
const lost = nodes
  .map((_: any, i: number) => i)
  .filter((i: number) => b.place[i]?.region === reg && !seen.has(i));
console.log(
  `${reg}: ${lost.length} unreachable`,
  lost.map((i: number) => name.get(i) ?? i).join(', '),
);
const roadEnds = nodes
  .map((n: any, i: number) => i)
  .filter(
    (i: number) =>
      b.place[i]?.region === reg && nodes[i].kind === 'attribute' && nodes[i].links.length < 2,
  );
console.log(
  `road dead ends: ${roadEnds.map((i: number) => name.get(i) ?? i).join(', ') || 'none'}`,
);
