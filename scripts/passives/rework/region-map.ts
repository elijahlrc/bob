// @ts-nocheck -- a one-off tool of the attrition rework (docs/tree/design/R-state.md), run with npx tsx; absolute paths.
// The Knife's structure in compact form, for planning its rebuild: per area and cluster, every node (local id, kind,
// name, lines) with its position in the Knife's frame (out, side from the start), the links inside the cluster, and
// every link leaving the cluster (to where).
const R = 'file:///E:/Proj/Auto/.claude/worktrees/flask-scarcity/src/';
const { buildAll } = await import(R + 'data/passives/index.ts');
const { makeLine } = await import(R + 'data/passives/vocab.ts');
const ids = (await import('file:///E:/Proj/Auto/.claude/worktrees/flask-scarcity/src/data/passives/ids.json', { with: { type: 'json' } })).default as Record<string, number>;
const b = buildAll({ allowNew: true });
const { nodes } = b.tree;
const name = new Map<number, string>();
for (const [k, v] of Object.entries(ids)) name.set(v, k);
const REG = process.argv[2] ?? 'shade';
const si = nodes.findIndex((n: any) => n.classStart === REG);
const [sx, sy] = [nodes[si].x, nodes[si].y];
const TH = Math.atan2(sy, sx);
const C = Math.cos(TH), S = Math.sin(TH);
const frame = (x: number, y: number) => {
  const dx = x - sx, dy = y - sy;
  return [Math.round(C * dx + S * dy), Math.round(-S * dx + C * dy)];
};
const label = (i: number) => (b.lines[i] ?? []).map((s: any) => makeLine(s).label).join('; ');
const knife = nodes.map((_: any, i: number) => i).filter((i: number) => b.place[i]?.region === REG && nodes[i].kind);
const byCluster = new Map<string, number[]>();
for (const i of knife) {
  const k = `${b.place[i].area}.${b.place[i].cluster}`;
  if (!byCluster.has(k)) byCluster.set(k, []);
  byCluster.get(k)!.push(i);
}
for (const [k, list] of byCluster) {
  console.log(`\n${k}`);
  const set = new Set(list);
  for (const i of list) {
    const [o, s] = frame(nodes[i].x, nodes[i].y);
    const local = (name.get(i) ?? String(i)).split('.').pop();
    const out = nodes[i].links.filter((j: number) => !set.has(j)).map((j: number) => name.get(j) ?? j);
    const inn = nodes[i].links.filter((j: number) => set.has(j)).map((j: number) => (name.get(j) ?? String(j)).split('.').pop());
    console.log(`  ${local} ${nodes[i].kind}${nodes[i].name ? ' ' + nodes[i].name : ''} @(${o},${s}) | ${label(i)} | in: ${inn.join(',')}${out.length ? ' | OUT: ' + out.join(', ') : ''}`);
  }
}
