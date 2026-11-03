// A one-off tool of the attrition rework (docs/tree/design/R-state.md). The reference's notables and keystones in one
// sector (local data, study only; output goes to the scratchpad, never the repo): node count by kind, and each notable's
// lines with its depth (0 centre, 1 rim). Run: node ref-sector.mjs <sector 0-5>
import fs from 'fs';
const ref = JSON.parse(
  fs.readFileSync(
    'E:/Proj/Auto/.claude/worktrees/flask-scarcity/reference/tree/ref-tree.json',
    'utf8',
  ),
);
const sec = Number(process.argv[2]);
if (process.argv[3]) {
  const lines = [];
  console.log = (...a) => lines.push(a.join(' '));
  process.on('exit', () => fs.writeFileSync(process.argv[3], lines.join('\n') + '\n'));
}
const ns = Object.values(ref.nodes).filter((n) => n.sector === sec);
const by = {};
for (const n of ns) by[n.kind] = (by[n.kind] || 0) + 1;
console.log(`sector ${sec} (${ref.sectors[sec]}):`, JSON.stringify(by));
for (const k of ['keystone', 'notable']) {
  console.log(`\n## ${k}s`);
  for (const n of ns.filter((x) => x.kind === k).sort((a, b) => a.depth - b.depth))
    console.log(`${n.depth.toFixed(2)} ${n.name} | ${n.lines.join('; ')}`);
}
