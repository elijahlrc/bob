/**
 * Draws the macro map of the passive tree design brief (docs/tree/design/C-brief.md) from its own data
 * (docs/tree/design/C-sketch.json): the six regions as tinted shapes, their areas, keystones, roads and crossings.
 * A sketch of places, not a layout of nodes.
 *
 *   npx tsx scripts/tree/sketch.ts [out.png] [--width 2000]
 */
import { readFileSync } from 'node:fs';
import { Canvas, hex, type Rgb } from './png';

type Pt = [number, number];
type Region = {
  id: string;
  name: string;
  class: string;
  colour: string;
  start: Pt;
  discs: [number, number, number][];
  areas: { name: string; at: Pt }[];
  keystones: { name: string; at: Pt }[];
  roads: Pt[][];
  /** Where the region's name is written. */
  label?: Pt;
};
type Sketch = {
  ring: number;
  regions: Region[];
  /** Generic clusters inside the ring. */
  centre?: { areas: { name: string; at: Pt }[] };
  /** Bridges between neighbouring regions: `near` (between the areas closest to the homes) or `dear` (far out). */
  crossings: { between: string; kind?: 'near' | 'dear'; serves?: string; from: Pt; to: Pt }[];
};

const argv = process.argv.slice(2);
const out = argv.find((a) => a.endsWith('.png')) ?? 'docs/tree/design/C-sketch.png';
const wi = argv.indexOf('--width');
const width = wi >= 0 ? Number(argv[wi + 1]) : 2000;

const sk = JSON.parse(readFileSync('docs/tree/design/C-sketch.json', 'utf8')) as Sketch;

// The view: every disc and keystone, with a margin.
let minX = 0,
  maxX = 0,
  minY = 0,
  maxY = 0;
for (const r of sk.regions) {
  for (const [x, y, rad] of r.discs) {
    minX = Math.min(minX, x - rad);
    maxX = Math.max(maxX, x + rad);
    minY = Math.min(minY, y - rad);
    maxY = Math.max(maxY, y + rad);
  }
  for (const k of r.keystones) {
    minX = Math.min(minX, k.at[0] - 200);
    maxX = Math.max(maxX, k.at[0] + 200);
    minY = Math.min(minY, k.at[1] - 200);
    maxY = Math.max(maxY, k.at[1] + 200);
  }
}
const margin = 500;
minX -= margin;
maxX += margin;
minY -= margin;
maxY += margin;
const scale = width / (maxX - minX);
const height = Math.round((maxY - minY) * scale);
const X = (x: number) => (x - minX) * scale;
const Y = (y: number) => (y - minY) * scale;

const BG = hex('#0f1016');
const cv = new Canvas(width, height, BG);
const mix = (c: Rgb, t: number): Rgb => [
  Math.round(BG[0] + (c[0] - BG[0]) * t),
  Math.round(BG[1] + (c[1] - BG[1]) * t),
  Math.round(BG[2] + (c[2] - BG[2]) * t),
];

// Regions: a soft union of discs (drawn opaque in a dim tint so overlaps do not darken or brighten).
for (const r of sk.regions) {
  const tint = mix(hex(r.colour), 0.22);
  for (const [x, y, rad] of r.discs) cv.disc(X(x), Y(y), rad * scale, tint, 1);
}
// The centre ring and the spokes to the starts.
const grey = hex('#5a6070');
cv.ring(X(0), Y(0), sk.ring * scale, 2, grey, 0.9);
for (const r of sk.regions) {
  // The spoke from the start to the ring (the start is beside the ring, never on it).
  const d = Math.hypot(r.start[0], r.start[1]);
  const [rx, ry] = [(r.start[0] / d) * sk.ring, (r.start[1] / d) * sk.ring];
  cv.line(X(r.start[0]), Y(r.start[1]), X(rx), Y(ry), 2, grey, 0.9);
}
// Roads.
for (const r of sk.regions)
  for (const road of r.roads)
    for (let i = 1; i < road.length; i++)
      cv.line(
        X(road[i - 1][0]),
        Y(road[i - 1][1]),
        X(road[i][0]),
        Y(road[i][1]),
        3,
        hex('#aab0c0'),
        0.8,
      );
// Crossings: near bridges light blue, dear bridges orange.
const NEAR = hex('#7fd0ff');
const DEAR = hex('#ff9a6a');
for (const c of sk.crossings)
  cv.line(
    X(c.from[0]),
    Y(c.from[1]),
    X(c.to[0]),
    Y(c.to[1]),
    2,
    c.kind === 'dear' ? DEAR : NEAR,
    0.8,
  );

const fontPx = Math.max(2, Math.round(width / 900));
// The centre's generic clusters.
for (const a of sk.centre?.areas ?? []) {
  cv.ring(X(a.at[0]), Y(a.at[1]), 90 * scale, 2, grey, 0.9);
  cv.text(
    a.name,
    X(a.at[0]),
    Y(a.at[1]) + 90 * scale + 6 * fontPx,
    fontPx,
    hex('#c8c4b8'),
    'middle',
  );
}
// Legend.
cv.line(X(minX + 300), Y(maxY - 320), X(minX + 700), Y(maxY - 320), 2, NEAR, 0.9);
cv.text('NEAR BRIDGE', X(minX + 760), Y(maxY - 320) + 3 * fontPx, fontPx, hex('#e8e4d8'), 'start');
cv.line(X(minX + 300), Y(maxY - 200), X(minX + 700), Y(maxY - 200), 2, DEAR, 0.9);
cv.text('DEAR BRIDGE', X(minX + 760), Y(maxY - 200) + 3 * fontPx, fontPx, hex('#e8e4d8'), 'start');
// Areas: a ring and a name.
for (const r of sk.regions) {
  const c = hex(r.colour);
  for (const a of r.areas) {
    cv.ring(X(a.at[0]), Y(a.at[1]), 130 * scale, 2, c, 0.9);
    cv.text(
      a.name,
      X(a.at[0]),
      Y(a.at[1]) + 130 * scale + 8 * fontPx,
      fontPx,
      hex('#e8e4d8'),
      'middle',
    );
  }
  // Keystones: a filled disc with a bright ring, labelled.
  for (const k of r.keystones) {
    cv.disc(X(k.at[0]), Y(k.at[1]), 70 * scale, c, 1);
    cv.ring(X(k.at[0]), Y(k.at[1]), 70 * scale, 3, hex('#ffffff'), 0.9);
    cv.text(
      k.name,
      X(k.at[0]),
      Y(k.at[1]) - 70 * scale - 6 * fontPx,
      fontPx,
      hex('#ffd98a'),
      'middle',
    );
  }
  // The start and the region's name.
  cv.disc(X(r.start[0]), Y(r.start[1]), 80 * scale, hex('#ffffff'), 1);
  cv.text(
    `${r.class} start`,
    X(r.start[0]),
    Y(r.start[1]) + 80 * scale + 8 * fontPx,
    fontPx,
    hex('#ffffff'),
    'middle',
  );
  const [cx, cy] = r.label ?? r.discs[Math.floor(r.discs.length / 2)];
  cv.text(r.name, X(cx), Y(cy), fontPx * 2, mix(c, 0.9), 'middle');
}
cv.save(out);
console.log(
  `${out}: ${width}x${height}, tree box ${Math.round(minX)},${Math.round(minY)} to ${Math.round(maxX)},${Math.round(maxY)}`,
);
