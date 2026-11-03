// @ts-nocheck -- a one-off tool of the attrition rework (docs/tree/design/R-state.md), run with npx tsx; absolute paths.
// Snapshots a region's area files as they stand (every cluster: nodes with their line specs, absolute positions and why,
// links inside, and the area's links out) into before/<region>.json, so a region generator can be rerun from the region
// as it was before its rework. Run once per region before its generator first writes: npx tsx snapshot.ts spire
import fs from 'fs';
const ROOT = 'E:/Proj/Auto/.claude/worktrees/flask-scarcity/';
const R = 'file:///' + ROOT + 'src/';
const region = process.argv[2];
const out = ROOT + `scripts/passives/rework/before/${region}.json`;
if (fs.existsSync(out) && !process.argv.includes('--force'))
  throw new Error('snapshot exists: ' + out);
const { buildAll } = await import(R + 'data/passives/index.ts');
const built = buildAll({ allowNew: true });
const dir = ROOT + `src/data/passives/${region}/`;
const areas: any[] = [];
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.ts') || f === 'frame.ts') continue;
  const mod = await import(R + `data/passives/${region}/${f}`);
  for (const [exp, v] of Object.entries(mod) as [string, any][]) {
    if (exp === 'START') continue;
    if (!v || !Array.isArray(v.clusters)) continue;
    areas.push({
      file: f.replace('.ts', ''),
      export: exp,
      id: v.id,
      name: v.name,
      why: v.why,
      start: mod.START ?? null,
      clusters: v.clusters.map((c: any) => ({
        id: c.id,
        name: c.name,
        why: c.why,
        nodes: c.nodes.map((n: any) => {
          const full = `${v.id}.${c.id}.${n.id}`;
          const i = built.registry[full];
          const at = i === undefined ? n.at : [built.tree.nodes[i].x, built.tree.nodes[i].y];
          return {
            id: n.id,
            kind: n.kind,
            name: n.name,
            why: n.why,
            lines: n.lines.map((l: any) =>
              l.spec
                ? `${l.spec.fn}(${l.spec.args.map((a: unknown) => JSON.stringify(a)).join(', ')})`
                : '?' + l.label,
            ),
            at,
          };
        }),
        links: c.links,
      })),
      links: v.links,
    });
  }
}
fs.mkdirSync(ROOT + 'scripts/passives/rework/before', { recursive: true });
fs.writeFileSync(out, JSON.stringify(areas, null, 1));
console.log(
  region,
  areas.length,
  'areas',
  areas.reduce((s, a) => s + a.clusters.length, 0),
  'clusters',
);
