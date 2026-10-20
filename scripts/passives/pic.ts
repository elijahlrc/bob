/**
 * Draws the hand-written tree, or one region of it, for review: links, nodes by kind, notable and keystone names, area
 * names, starts.
 *
 *   npx tsx scripts/passives/pic.ts out.png [--region vanguard] [--width 2000] [--ids] [--text] [--no-areas]
 *
 * `--text` writes every node's lines beside it (and a keystone's text), for a reviewer who wants to read the whole tree
 * from one picture; use a large `--width` with it.
 */
import { AREAS, buildAll } from '../../src/data/passives';
import type { NodeSpec } from '../../src/data/passives/types';
import { KEYSTONES } from '../../src/data/tree/keystones';
import { areaLabelWidth } from '../../src/ui/treeStyle';
import { Canvas, hex, type Rgb } from '../tree/png';

const argv = process.argv.slice(2);
const out = argv.find((a) => a.endsWith('.png')) ?? 'passives.png';
const ri = argv.indexOf('--region');
const region = ri >= 0 ? argv[ri + 1] : null;
const wi = argv.indexOf('--width');
const width = wi >= 0 ? Number(argv[wi + 1]) : 2000;
const showIds = argv.includes('--ids');
const showText = argv.includes('--text');
/** `--no-areas` leaves the area names out, so the node names underneath can be read. */
const showAreas = !argv.includes('--no-areas');
const bi = argv.indexOf('--box');
/** `--box x0,y0,x1,y1` restricts the view to a box in tree units (for checking a detail at full size). */
const box =
  bi >= 0 ? (argv[bi + 1].split(',').map(Number) as [number, number, number, number]) : null;
const spec = new Map<string, NodeSpec>();
for (const a of AREAS)
  for (const c of a.clusters) for (const n of c.nodes) spec.set(`${a.id}.${c.id}.${n.id}`, n);
const clusterAt = new Map<string, [number, number]>();
for (const a of AREAS) for (const c of a.clusters) clusterAt.set(`${a.id}.${c.id}`, c.at);

const built = buildAll({ allowNew: true });
const { nodes } = built.tree;
const inView = (i: number) => {
  const p = built.place[i];
  if (!region) return nodes[i].name !== '(retired)';
  return p.region === region || p.region === 'centre' || nodes[i].kind === 'start';
};

let minX = Infinity,
  maxX = -Infinity,
  minY = Infinity,
  maxY = -Infinity;
for (let i = 0; i < nodes.length; i++) {
  if (
    !inView(i) ||
    (region &&
      built.place[i].region === 'centre' &&
      !nodes[i].links.some((j) => built.place[j].region === region))
  )
    continue;
  minX = Math.min(minX, nodes[i].x);
  maxX = Math.max(maxX, nodes[i].x);
  minY = Math.min(minY, nodes[i].y);
  maxY = Math.max(maxY, nodes[i].y);
}
// Area labels can sit outside the nodes' box; keep them in the picture.
for (const a of AREAS) {
  if (!showAreas) break;
  if (a.region === 'centre' || (region && a.region !== region)) continue;
  const half = areaLabelWidth(a.name) / 2;
  minX = Math.min(minX, a.at[0] - half);
  maxX = Math.max(maxX, a.at[0] + half);
  minY = Math.min(minY, a.at[1]);
  maxY = Math.max(maxY, a.at[1]);
}
const margin = 350;
minX -= margin;
maxX += margin;
minY -= margin;
maxY += margin;
if (box) [minX, minY, maxX, maxY] = box;
const scale = width / (maxX - minX);
const height = Math.round((maxY - minY) * scale);
const X = (x: number) => (x - minX) * scale;
const Y = (y: number) => (y - minY) * scale;

const BG = hex('#0f1016');
const cv = new Canvas(width, height, BG);
const REGION_COLOUR: Record<string, string> = {
  mystic: '#6a8cf0',
  shade: '#c45ad6',
  strider: '#6cc070',
  reaver: '#d8c07a',
  vanguard: '#d8654a',
  zealot: '#e6b060',
  centre: '#8a90a0',
};
const fontPx = Math.max(2, Math.round(width / 1000));

// Links.
for (const n of nodes)
  for (const m of n.links)
    if (m > n.id && inView(n.id) && inView(m))
      cv.line(X(n.x), Y(n.y), X(nodes[m].x), Y(nodes[m].y), 2, hex('#8a90a0'), 0.8);
// Nodes.
const R: Record<string, number> = {
  start: 34,
  keystone: 38,
  notable: 24,
  small: 10,
  travel: 9,
  hub: 10,
};
for (const n of nodes) {
  if (!inView(n.id)) continue;
  const c: Rgb = hex(REGION_COLOUR[built.place[n.id].region] ?? '#ffffff');
  const r = R[n.kind] * scale;
  if (n.kind === 'travel') {
    cv.ring(X(n.x), Y(n.y), r, 2, hex('#e8e4d8'), 0.9);
  } else if (n.kind === 'start') {
    cv.disc(X(n.x), Y(n.y), r, hex('#ffffff'), 1);
  } else {
    cv.disc(X(n.x), Y(n.y), r, c, n.kind === 'small' ? 0.8 : 1);
    if (n.kind === 'keystone') cv.ring(X(n.x), Y(n.y), r, 3, hex('#ffffff'), 0.9);
    if (n.kind === 'notable') cv.ring(X(n.x), Y(n.y), r, 2, hex('#ffffff'), 0.7);
  }
  // With --text, names are one size above the lines beside them, not scaled to the picture, so they do not bury the lines.
  const nameFont = showText ? (scale >= 0.85 ? 3 : 2) : fontPx;
  if (n.kind === 'notable' || n.kind === 'keystone' || n.kind === 'start')
    cv.text(
      n.name,
      X(n.x),
      Y(n.y) + r + 6 * nameFont,
      nameFont,
      n.kind === 'keystone' ? hex('#ffd98a') : hex('#e8e4d8'),
      'middle',
    );
  if (showIds)
    cv.text(
      built.ids[n.id].split('.').slice(-2).join('.'),
      X(n.x),
      Y(n.y) - r - 8 * fontPx,
      fontPx,
      hex('#8a90a0'),
      'middle',
    );
  if (showText && n.kind !== 'start') {
    const sp = spec.get(built.ids[n.id]);
    const rows =
      n.kind === 'keystone'
        ? (KEYSTONES.find((k) => k.name === n.name)?.description ?? '')
            .split('. ')
            .map((t) => t.replace(/\.$/, ''))
        : (sp?.lines ?? []).map((l) => l.label);
    // Text size follows the drawing scale, so neighbouring nodes' lines do not run into each other.
    const size = scale >= 0.85 ? 2 : 1;
    const lh = 9 * size;
    // On the outward side of the node's cluster, so the labels of a ring do not run into one another.
    const at = clusterAt.get(built.ids[n.id].split('.').slice(0, 3).join('.'));
    const leftward = at ? n.x < at[0] - 15 : false;
    const y0 = Y(n.y) - ((rows.length - 1) * lh) / 2;
    const colour = n.kind === 'keystone' ? hex('#ffd98a') : hex('#b8c0cc');
    rows.forEach((t, i) => {
      const w = t.length * 6 * size - size;
      const x0 = leftward ? X(n.x) - r - 3 * size - w : X(n.x) + r + 3 * size;
      cv.text(t, x0, y0 + i * lh, size, colour, 'start');
    });
  }
}
// Area names.
for (const a of AREAS) {
  if (!showAreas) break;
  if (region && a.region !== region) continue;
  if (a.region === 'centre' && region) continue;
  // As wide as the game draws it (AREA_LABEL, in tree units), in the bitmap font's six-cell letters.
  const cell = Math.max(1, (areaLabelWidth(a.name) * scale) / (a.name.length * 6));
  cv.text(a.name, X(a.at[0]), Y(a.at[1]), cell, hex(REGION_COLOUR[a.region]), 'middle');
}
cv.save(out);
console.log(
  `${out}: ${width}x${height}; ${built.problems.length} problems${built.problems.length ? ':\n  ' + built.problems.join('\n  ') : ''}`,
);
