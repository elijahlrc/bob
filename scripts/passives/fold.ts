/**
 * Folds the tree editor's patch (src/data/passives/edits.json) back into a region's area files, so that what was moved,
 * cut, joined, re-lined or added in the editor becomes the hand-written source (docs/tree/design/D-method.md, "Editing by
 * hand"). Every cluster is rewritten as a hand-placed one; the area, cluster, node and link reasons already in the files
 * are kept; nodes made in the editor go into an `added` cluster of the area they are joined to, with their provisional
 * names, and links made in the editor get a dated reason, for the author to replace.
 *
 *   npx tsx scripts/passives/fold.ts <region>        (then empty edits.json to { "version": 1 } and run passives:register)
 *
 * It overwrites src/data/passives/<theme>/<area>.ts for every area of the region. Verify with `npm run passives:pic`.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AREAS, buildAll } from '../../src/data/passives';
import type { LineSpec } from '../../src/data/passives/types';
import { START_AT } from '../../src/data/passives/bow/frame';
import edits from '../../src/data/passives/edits.json';

const region = process.argv[2];
if (!region) throw new Error('usage: fold.ts <region>');
const built = buildAll({ allowNew: true });
const { nodes } = built.tree;
const live = (i: number) => nodes[i] && nodes[i].name !== '(retired)';

// ---- what the files already say, by id
const clusterText = new Map<string, { name: string; why: string }>();
const nodeText = new Map<string, { name?: string; why?: string }>();
for (const a of AREAS)
  for (const c of a.clusters) {
    clusterText.set(`${a.id}.${c.id}`, { name: c.name, why: c.why });
    for (const n of c.nodes) nodeText.set(`${a.id}.${c.id}.${n.id}`, { name: n.name, why: n.why });
  }
const linkWhy = new Map<string, string>();
for (const l of built.links) linkWhy.set(l.a < l.b ? `${l.a}|${l.b}` : `${l.b}|${l.a}`, l.why);

// ---- which area each live node belongs to (added nodes: the area of the nearest base neighbour, by search)
const idOf = (i: number) => built.ids[i];
const areaOf = new Map<number, string>();
for (let i = 0; i < nodes.length; i++)
  if (live(i) && built.place[i].area && built.place[i].area !== 'edit')
    areaOf.set(i, built.place[i].area);
let changed = true;
while (changed) {
  changed = false;
  for (let i = 0; i < nodes.length; i++) {
    if (!live(i) || areaOf.has(i) || nodes[i].kind === 'start') continue;
    const near = nodes[i].links.find(
      (m) => areaOf.has(m) && (built.place[m].region === region || idOf(m).startsWith('edit.')),
    );
    if (near !== undefined) {
      areaOf.set(i, areaOf.get(near)!);
      changed = true;
    }
  }
}

const areas = AREAS.filter((a) => a.region === region);
// The patch may touch nodes outside this region (the user moved a Yard junction while editing the Strider): say so, since only this region's files are rewritten.
for (const id of Object.keys((edits as { nodes?: Record<string, unknown> }).nodes ?? {}))
  if (built.place[Number(id)]?.region && built.place[Number(id)].region !== region)
    console.log(
      `NOTE: the patch also changes ${built.ids[Number(id)]} (${built.place[Number(id)].region}); fold that region too or apply it by hand.`,
    );
const isAdded = (i: number) => idOf(i).startsWith('edit.');
const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const argCode = (a: unknown): string =>
  typeof a === 'string' ? q(a) : Array.isArray(a) ? `[${a.map(argCode).join(', ')}]` : String(a);
const lineCode = (l: LineSpec) => `${l.fn}(${l.args.map(argCode).join(', ')})`;
const C = Math.cos(Math.PI / 6),
  S = Math.sin(Math.PI / 6);
/** Strider positions go back into the (out, side) frame; other regions keep tree units. */
const atCode = (x: number, y: number) => {
  if (region !== 'strider') return `[${x}, ${y}]`;
  const dx = x - START_AT[0],
    dy = y - START_AT[1];
  return `P(${Math.round(dx * C + dy * S)}, ${Math.round(-dx * S + dy * C)})`;
};

for (const area of areas) {
  const members = [...areaOf.entries()].filter(([, a]) => a === area.id).map(([i]) => i);
  const byCluster = new Map<string, number[]>();
  for (const i of members) {
    const c = isAdded(i) ? 'added' : idOf(i).split('.')[2];
    if (!byCluster.has(c)) byCluster.set(c, []);
    byCluster.get(c)!.push(i);
  }
  // Keep the file's cluster order; `added` last.
  const order = [
    ...area.clusters.map((c) => c.id).filter((c) => byCluster.has(c)),
    ...(byCluster.has('added') ? ['added'] : []),
  ];
  const fns = new Set<string>();
  const localId = (i: number) => (isAdded(i) ? `n${i}` : idOf(i).split('.')[3]);
  const clusterOf = (i: number) => (isAdded(i) ? 'added' : idOf(i).split('.')[2]);
  const refOf = (i: number) =>
    nodes[i].kind === 'start'
      ? idOf(i)
      : areaOf.get(i) === area.id
        ? `${clusterOf(i)}.${localId(i)}`
        : `${areaOf.get(i)}.${clusterOf(i)}.${localId(i)}`;
  const out: string[] = [];
  const seenLinks = new Set<string>();
  for (const cid of order) {
    const ids = byCluster.get(cid)!.sort((a, b) => a - b);
    const text = clusterText.get(`${area.id}.${cid}`) ?? {
      name: 'Added in the editor',
      why: 'Nodes added by the user in the tree editor (2026-10-19); names and reasons provisional.',
    };
    out.push(
      `    {`,
      `      id: ${q(cid)},`,
      `      name: ${q(text.name)},`,
      `      why: ${q(text.why)},`,
    );
    const cx = Math.round(ids.reduce((s, i) => s + nodes[i].x, 0) / ids.length),
      cy = Math.round(ids.reduce((s, i) => s + nodes[i].y, 0) / ids.length);
    out.push(`      at: ${atCode(cx, cy)},`, `      shape: { kind: 'hand' },`, `      nodes: [`);
    for (const i of ids) {
      const n = nodes[i];
      const t = nodeText.get(idOf(i)) ?? {};
      const kind = n.kind === 'travel' ? 'attribute' : n.kind;
      const specs = n.kind === 'keystone' ? [] : (built.lines[i] ?? []);
      for (const l of specs) fns.add(l.fn);
      const name = kind === 'notable' || kind === 'keystone' ? n.name : t.name;
      const parts = [`id: ${q(localId(i))}`, `kind: ${q(kind)}`];
      if (name !== undefined) parts.push(`name: ${q(name)}`);
      parts.push(`lines: [${specs.map(lineCode).join(', ')}]`, `at: ${atCode(n.x, n.y)}`);
      if (t.why) parts.push(`why: ${q(t.why)}`);
      else if (isAdded(i)) parts.push(`why: 'Added in the editor (2026-10-19).'`);
      out.push(`        { ${parts.join(', ')} },`);
    }
    out.push(`      ],`, `      links: [`);
    for (const i of ids)
      for (const m of nodes[i].links) {
        if (m <= i || clusterOf(m) !== cid || areaOf.get(m) !== area.id) continue;
        seenLinks.add(`${i}|${m}`);
        out.push(`        [${q(localId(i))}, ${q(localId(m))}],`);
      }
    out.push(`      ],`, `    },`);
  }
  // Area links: to other clusters of this area, to other areas (written once: by the area whose node has the lower id when both are areas of this region, else by this area), and to starts.
  const links: string[] = [];
  for (const i of members)
    for (const m of nodes[i].links) {
      if (!live(m)) continue;
      const sameArea = areaOf.get(m) === area.id;
      if (sameArea) {
        if (m <= i || seenLinks.has(`${i}|${m}`)) continue;
      } else {
        const other = areaOf.get(m);
        const otherInRegion = other && areas.some((a) => a.id === other);
        if (otherInRegion && m < i) continue;
        if (nodes[m].kind === 'start' && m > i) {
          /* the start has no file: this area writes it */
        }
      }
      const a = idOf(i),
        b = nodes[m].kind === 'start' ? idOf(m) : idOf(m);
      const why =
        linkWhy.get(a < b ? `${a}|${b}` : `${b}|${a}`) ?? 'Added in the editor (2026-10-19).';
      links.push(`    { from: ${q(refOf(i))}, to: ${q(refOf(m))}, why: ${q(why)} },`);
    }
  const path = resolve(
    import.meta.dirname,
    `../../src/data/passives/${area.id.replace('.', '/')}.ts`,
  );
  const exportName = area.id.split('.')[1];
  let header = `/**\n * ${area.name} (${area.id}): rewritten by scripts/passives/fold.ts from the editor's patch.\n */`;
  if (existsSync(path)) {
    const old = readFileSync(path, 'utf8');
    const m = /^\/\*\*[\s\S]*?\*\//.exec(old);
    if (m) header = m[0];
  }
  const imports = [...fns].sort().join(', ');
  const file = [
    header,
    `import { ${imports} } from '../lines';`,
    `import type { AreaSpec } from '../types';`,
    ...(region === 'strider' ? [`import { P } from './frame';`] : []),
    '',
    ...(area.id === 'bow.home'
      ? [
          `export const START = { classId: 'strider', region: 'strider' as const, id: 'start.strider', at: [866, 500] as [number, number] };`,
          '',
        ]
      : []),
    `export const ${exportName}: AreaSpec = {`,
    `  id: ${q(area.id)},`,
    `  region: ${q(area.region)},`,
    `  name: ${q(area.name)},`,
    `  why: ${q(area.why)},`,
    `  at: ${atCode(area.at[0], area.at[1])},`,
    `  clusters: [`,
    ...out,
    `  ],`,
    `  links: [`,
    ...links,
    `  ],`,
    `};`,
    '',
  ].join('\n');
  writeFileSync(path, file);
  console.log(
    `${path}: ${members.length} nodes, ${order.length} clusters, ${links.length} area links`,
  );
}
