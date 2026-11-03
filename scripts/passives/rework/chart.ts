// @ts-nocheck -- a one-off tool of the attrition rework (docs/tree/design/R-state.md), run with npx tsx; absolute paths.
// The notables chart for a region's review: every notable and keystone with its area, its step from the class start,
// its lines now (the snapshot before the rework, matched by name or by cluster and node) and as built, its units, and
// its why (the hook). Run: npx tsx chart.ts <folder> <place region> <out.md>   e.g. chart.ts bow strider R-bow-chart.md
import fs from 'fs';
const ROOT = 'E:/Proj/Auto/.claude/worktrees/flask-scarcity/';
const R = 'file:///' + ROOT + 'src/';
const [folder, reg, out] = process.argv.slice(2);
const { buildAll, AREAS } = await import(R + 'data/passives/index.ts');
const whyOf = new Map<string, string>();
for (const a of AREAS)
  for (const c of a.clusters)
    for (const n of c.nodes) if (n.why) whyOf.set(`${a.id}.${c.id}.${n.id}`, n.why);
const { makeLine } = await import(R + 'data/passives/vocab.ts');
const ids = JSON.parse(fs.readFileSync(ROOT + 'src/data/passives/ids.json', 'utf8'));
const snap = JSON.parse(
  fs.readFileSync(ROOT + `scripts/passives/rework/before/${folder}.json`, 'utf8'),
);
const b = buildAll({ allowNew: true });
const { nodes } = b.tree;
const name = new Map<number, string>();
for (const [k, v] of Object.entries(ids)) name.set(v as number, k);
const before = new Map<string, string>();
for (const a of snap)
  for (const c of a.clusters)
    for (const n of c.nodes) if (n.name) before.set(n.name, n.lines.join(', '));
// Steps from the class start (other starts are not a way through).
const start = nodes.findIndex((n: any) => n.classStart === reg);
const d = new Array(nodes.length).fill(Infinity);
d[start] = 0;
const q = [start];
while (q.length) {
  const a = q.shift()!;
  for (const c of nodes[a].links)
    if (d[c] === Infinity && !(nodes[c].classStart && c !== start)) ((d[c] = d[a] + 1), q.push(c));
}
const label = (i: number) =>
  (b.lines[i] ?? []).map((s: any) => makeLine(s)?.label ?? s.fn).join('; ');
const units = (i: number) =>
  (b.lines[i] ?? []).reduce((t: number, s: any) => t + (makeLine(s)?.units ?? 0), 0);
const rows = nodes
  .map((n: any, i: number) => i)
  .filter(
    (i: number) =>
      b.place[i]?.region === reg && (nodes[i].kind === 'notable' || nodes[i].kind === 'keystone'),
  )
  .sort((x: number, y: number) => d[x] - d[y]);
const area = (i: number) => (b.place[i]?.area ?? '').split('.').pop();
const lines = [
  `# ${folder}: notables as built (${rows.filter((i: number) => nodes[i].kind === 'notable').length} notables, ${rows.filter((i: number) => nodes[i].kind === 'keystone').length} keystones)`,
  '',
  '| Step | Area | Notable | Before | Now | Units | Hook (why) |',
  '| --- | --- | --- | --- | --- | --- | --- |',
];
for (const i of rows) {
  const n = nodes[i];
  const was = before.get(n.name) ?? 'new';
  const why = (whyOf.get(name.get(i) ?? '') ?? '').toString().replace(/\|/g, '/').slice(0, 160);
  lines.push(
    `| ${d[i]} | ${area(i)} | ${n.kind === 'keystone' ? 'K ' : ''}${n.name} | ${was === label(i) ? 'same' : was} | ${label(i)} | ${units(i).toFixed(1)} | ${why} |`,
  );
}
fs.writeFileSync(out, lines.join('\n') + '\n');
console.log('written', out, rows.length);
