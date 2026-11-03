// A one-off tool of the attrition rework (docs/tree/design/R-state.md). From a walks.ts output, a region's own notables
// within 8, 10 and 14 steps by the exit that reaches them cheapest. Run: node exits.mjs <walks.txt> <class> <area prefix>
// e.g. node exits.mjs walks.txt vanguard wall
import fs from 'fs';
const [file, cls, prefix] = process.argv.slice(2);
const text = fs.readFileSync(file, 'utf8');
const start = text.indexOf(`# ${cls} `);
const end = text.indexOf('\n# ', start + 1);
const rows = text
  .slice(start, end < 0 ? undefined : end)
  .split('\n')
  .filter((l) => / N /.test(l) && l.includes(`[${prefix}.`));
for (const n of [8, 10, 14]) {
  const r = rows.filter((l) => Number(l.trim().split(' ')[0]) <= n);
  const c = (k) => r.filter((l) => l.includes(`exit ${k} `) || l.endsWith(`exit ${k}`)).length;
  console.log(
    `within ${n}: exit 0 ${c('0')}, exit 1 ${c('1')}, both ${c('0/1')}, total ${r.length}`,
  );
}
