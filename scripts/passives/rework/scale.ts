// @ts-nocheck -- a one-off tool of the attrition rework (docs/tree/design/R-state.md), run with npx tsx; absolute paths.
// Prints `over` entries that scale the named notables' current lines up to about `target` units (numbers rounded), for a
// region generator's table. Run: npx tsx scale.ts <target units> "Name A" "Name B" ...
const R = 'file:///E:/Proj/Auto/.claude/worktrees/flask-scarcity/src/';
const { buildAll } = await import(R + 'data/passives/index.ts');
const { makeLine } = await import(R + 'data/passives/vocab.ts');
const ids = (
  await import('file:///E:/Proj/Auto/.claude/worktrees/flask-scarcity/src/data/passives/ids.json', {
    with: { type: 'json' },
  })
).default as Record<string, number>;
const name = new Map<number, string>();
for (const [k, v] of Object.entries(ids)) name.set(v, k);
const b = buildAll({ allowNew: true });
const [target, ...names] = process.argv.slice(2);
const round = (x: number) =>
  x >= 10 ? Math.round(x) : x >= 2 ? Math.round(x) : Math.round(x * 10) / 10;
for (const nm of names) {
  const i = b.tree.nodes.findIndex((n: any) => n.name === nm);
  if (i < 0) {
    console.log('// no node ' + nm);
    continue;
  }
  const specs = b.lines[i];
  const units = specs.reduce((t: number, s: any) => t + (makeLine(s)?.units ?? 0), 0);
  const k = Number(target) / units;
  const out = specs.map(
    (s: any) =>
      `${s.fn}(${s.args.map((a: any) => (typeof a === 'number' ? round(a * k) : JSON.stringify(a).replace(/"/g, "'"))).join(', ')})`,
  );
  console.log(`  '${name.get(i)}': { lines: ${JSON.stringify(out.join(', '))} },`);
}
