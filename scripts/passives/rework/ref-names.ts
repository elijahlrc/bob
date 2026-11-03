// @ts-nocheck -- a one-off tool of the attrition rework (docs/tree/design/R-state.md), run with npx tsx; absolute paths.
// Tree names that match a reference notable or keystone name (local data), exactly or ignoring case, spaces, punctuation
// and a leading "The". The repo never names the reference game's proper nouns (CLAUDE.md), so every hit is renamed.
// Prints only our names and the region, never the reference list.
import fs from 'fs';
const R = 'file:///E:/Proj/Auto/.claude/worktrees/flask-scarcity/src/';
const { buildAll } = await import(R + 'data/passives/index.ts');
const ref = JSON.parse(
  fs.readFileSync(
    'E:/Proj/Auto/.claude/worktrees/flask-scarcity/reference/tree/ref-tree.json',
    'utf8',
  ),
);
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/^the /, '')
    .replace(/[^a-z]/g, '');
const refNames = new Set(
  Object.values(ref.nodes)
    .filter((n: any) => n.kind === 'notable' || n.kind === 'keystone')
    .map((n: any) => norm(n.name)),
);
const b = buildAll({ allowNew: true });
const hits: string[] = [];
b.tree.nodes.forEach((n: any, i: number) => {
  if ((n.kind === 'notable' || n.kind === 'keystone') && n.name && refNames.has(norm(n.name)))
    hits.push(`${b.place[i]?.region}: ${n.name}`);
});
console.log(hits.length ? hits.join('\n') : 'no matches');
