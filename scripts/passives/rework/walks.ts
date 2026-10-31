// @ts-nocheck -- a one-off tool of the attrition rework (docs/tree/design/R-state.md), run with npx tsx; absolute paths.
// For each class start: every notable and keystone within 20 points (other starts are not a way through), with its lines,
// the area it is in, and which of the start's exits reaches it cheapest (ties name every such exit). Also, per exit, how
// many notables it reaches first within 8 and 14 points: an exit that reaches almost everything is a rail.
const R = 'file:///E:/Proj/Auto/.claude/worktrees/flask-scarcity/src/';
const { buildAll } = await import(R + 'data/passives/index.ts');
const { makeLine } = await import(R + 'data/passives/vocab.ts');
const built = buildAll({ allowNew: true });
const { nodes } = built.tree;
const N = nodes.length;
const starts = nodes.map((n: any, i: number) => [n.classStart, i] as const).filter(([c]: any) => c);
const label = (i: number) => (built.lines[i] ?? []).map((s: any) => makeLine(s).label).join('; ');
function bfs(src: number, first?: number): number[] {
  const d = new Array(N).fill(Infinity);
  d[src] = 0;
  const q = [src];
  if (first !== undefined) {
    d[first] = 1;
    q.length = 0;
    q.push(first);
  }
  while (q.length) {
    const a = q.shift()!;
    for (const b of nodes[a].links) {
      if (b === src || (nodes[b].classStart && b !== src)) continue;
      if (d[b] === Infinity) {
        d[b] = d[a] + 1;
        q.push(b);
      }
    }
  }
  return d;
}
for (const [cls, s] of starts as [string, number][]) {
  const d = bfs(s);
  const exits = nodes[s].links.filter((b: number) => !nodes[b].classStart);
  const viaExit = exits.map((e: number) => bfs(s, e));
  const exitName = (e: number) => `${built.place[e]?.area ?? '?'}:${label(e) || nodes[e].name}`;
  console.log(`\n# ${cls} (exits: ${exits.length})`);
  exits.forEach((e: number, k: number) => {
    const firstOf = (lim: number) =>
      nodes.filter((n: any, i: number) => n.kind === 'notable' && d[i] <= lim && viaExit[k][i] === d[i]).length;
    console.log(`exit ${k}: ${exitName(e)} | notables first within 8: ${firstOf(8)}, within 14: ${firstOf(14)}`);
  });
  const near = nodes
    .map((n: any, i: number) => ({ n, i }))
    .filter(({ n, i }: any) => (n.kind === 'notable' || n.kind === 'keystone') && d[i] <= 20)
    .sort((a: any, b: any) => d[a.i] - d[b.i]);
  for (const { n, i } of near) {
    const ex = exits.map((_: number, k: number) => k).filter((k: number) => viaExit[k][i] === d[i]);
    console.log(`${String(d[i]).padStart(2)} ${n.kind === 'keystone' ? 'K' : 'N'} ${n.name} [${built.place[i]?.area}] exit ${ex.join('/')} | ${label(i)}`);
  }
}
