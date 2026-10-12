/**
 * A picture of the passive tree (docs/TREE-REDESIGN.md, T0): the review tool of every layout change and the map the simulated
 * players use. Writes a PNG.
 *
 *   npm run tree:pic -- out.png [--region int|dexint|dex|strdex|str|strint|hub] [--box cx,cy,w,h] [--width 1800]
 *                       [--build build.json] [--labels all|notables|keystones|none] [--ids]
 *
 * Colour is what the node gives, as in the game (`explore legend` lists them). A small node is a dot, a notable a ring, a keystone a
 * large disc. With `--build` the nodes of that allocation are drawn gold. `--ids` writes the node number after each name so a
 * picture can be read with `explore`.
 */
import { readFileSync } from 'node:fs';
import { Canvas, hex, type Rgb } from './png';
import { layout, nodes, regionOf, tree } from './lib';
import { REGIONS, type RegionId } from '../../src/data/tree/spec';
import { TONE_COLOR, toneOf } from '../../src/ui/treeStyle';

const argv = process.argv.slice(2);
const arg = (k: string, d = ''): string => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const out = argv.find((a) => a.endsWith('.png'));
if (!out)
  throw new Error(
    'usage: tree:pic -- out.png [--region id] [--box cx,cy,w,h] [--width px] [--build file] [--labels ..] [--ids]',
  );

const region = arg('region');
const width = Number(arg('width', '1800'));
const labels = arg('labels', 'notables');
const showIds = argv.includes('--ids');
const taken = new Set<number>();
if (arg('build')) {
  const b = JSON.parse(readFileSync(arg('build'), 'utf8')) as { allocated: number[] };
  for (const id of b.allocated) taken.add(id);
}

// The view.
let box: [number, number, number, number]; // cx, cy, w, h
if (arg('box')) box = arg('box').split(',').map(Number) as [number, number, number, number];
else {
  const inView = region ? nodes.filter((n) => regionOf(n) === (region as RegionId | 'hub')) : nodes;
  const xs = inView.map((n) => n.x);
  const ys = inView.map((n) => n.y);
  const pad = region ? 140 : 200;
  const x0 = Math.min(...xs) - pad;
  const x1 = Math.max(...xs) + pad;
  const y0 = Math.min(...ys) - pad;
  const y1 = Math.max(...ys) + pad;
  box = [(x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0];
}
const scale = width / box[2];
const height = Math.round(box[3] * scale);
const X = (x: number) => (x - box[0]) * scale + width / 2;
const Y = (y: number) => (y - box[1]) * scale + height / 2;

const BG: Rgb = [17, 15, 22];
const cv = new Canvas(width, height, BG);

// The wedges: faint lines on the boundary between regions, and the name of each class start.
for (const r of REGIONS) {
  const a = ((r.angle + 30) * Math.PI) / 180;
  cv.line(X(0), Y(0), X(4200 * Math.cos(a)), Y(4200 * Math.sin(a)), 1, [60, 56, 76], 0.7);
}

const gold: Rgb = [240, 200, 90];
const radius = { small: 1.8, travel: 1.4, notable: 3.6, keystone: 5.5, start: 5, hub: 3 } as const;
const grow = Math.max(1, Math.min(3, scale * 6));
const colourOf = (id: number): Rgb => {
  const n = nodes[id];
  if (n.kind === 'start') return [235, 235, 235];
  if (n.kind === 'travel') return [120, 116, 140];
  return hex(TONE_COLOR[toneOf(n)]);
};

for (const n of nodes)
  for (const m of n.links)
    if (m > n.id) {
      const both = taken.has(n.id) && taken.has(m);
      cv.line(
        X(n.x),
        Y(n.y),
        X(nodes[m].x),
        Y(nodes[m].y),
        both ? 2 : 1,
        both ? gold : [88, 84, 108],
        both ? 1 : 0.8,
      );
    }

for (const n of nodes) {
  const x = X(n.x);
  const y = Y(n.y);
  if (x < -20 || y < -20 || x > width + 20 || y > height + 20) continue;
  const r = radius[n.kind] * grow;
  const c = colourOf(n.id);
  const on = taken.has(n.id) || n.kind === 'start';
  if (n.kind === 'notable') {
    cv.disc(x, y, r * 0.55, c);
    cv.ring(x, y, r, 1.2, on ? gold : [200, 170, 100]);
  } else if (n.kind === 'keystone') {
    cv.disc(x, y, r, c);
    cv.ring(x, y, r + 1.5, 1.5, on ? gold : [170, 110, 220]);
  } else {
    cv.disc(x, y, r, c);
    if (on) cv.ring(x, y, r + 1, 1, gold);
  }
}

const fontPx = Math.max(1, Math.round(width / 900));
// Labels: starts and keystones first, then notables, and a label that would lie on one already drawn is left out (the ids in the
// region pictures and `explore find` tell the rest).
type Label = { text: string; x: number; y: number; rank: number; colour: Rgb };
const wanted: Label[] = [];
for (const n of nodes) {
  const x = X(n.x);
  const y = Y(n.y);
  if (x < 0 || y < 0 || x > width || y > height) continue;
  const text =
    n.kind === 'start'
      ? `${(n.classStart ?? '').toUpperCase()} START`
      : (n.kind === 'notable' && (labels === 'all' || labels === 'notables')) ||
          (n.kind === 'keystone' && labels !== 'none')
        ? n.name + (showIds ? ` ${n.id}` : '')
        : '';
  if (!text) continue;
  const off = radius[n.kind] * grow + 4;
  wanted.push({
    text,
    x: x + off,
    y,
    rank: n.kind === 'start' ? 0 : n.kind === 'keystone' ? 1 : 2,
    colour: n.kind === 'keystone' ? [220, 190, 255] : [225, 220, 205],
  });
}
wanted.sort((p, q) => p.rank - q.rank);
const boxes: [number, number, number, number][] = [];
for (const l of wanted) {
  const w = l.text.length * 6 * fontPx;
  const h = 8 * fontPx;
  const box: [number, number, number, number] = [
    l.x - 2,
    l.y - h / 2 - 1,
    l.x + w + 2,
    l.y + h / 2 + 1,
  ];
  if (boxes.some((o) => box[0] < o[2] && box[2] > o[0] && box[1] < o[3] && box[3] > o[1])) continue;
  boxes.push(box);
  cv.text(l.text, l.x, l.y, fontPx, l.colour);
}

cv.save(out);
if (layout) {
  console.log(`dropped roads: ${layout.dropped.length} ${layout.dropped.slice(0, 12).join(' | ')}`);
  console.log(
    `unplaced clusters: ${layout.unplaced.length} ${layout.unplaced.slice(0, 12).join(' | ')}`,
  );
}
console.log(
  `${out}: ${width}x${height}, box ${box.map(Math.round).join(',')}, ${tree.nodes.length} nodes in the tree`,
);
