/**
 * Draws a sketch of planned changes over the hand-written network (docs/tree/design/G-growth.md, G1b and G2): new
 * clusters, new roads, new links, cut links and moved nodes, from a JSON file. It changes nothing in the network; a
 * sketch is a picture for the user's review before any node is written.
 *
 *   npx tsx scripts/passives/sketch.ts sketch.json out.png [--box x0,y0,x1,y1] [--width 2000]
 *
 * sketch.json:
 *   {
 *     "title": "Mystic: the new skeleton",
 *     "region": "mystic",                       // optional: frames the picture on this region (and its borders)
 *     "clusters": [{ "id": "MY-1", "label": "spell damage + crit multiplier", "at": [x, y], "nodes": 4 }],
 *     "roads": [{ "label": "north rim road", "points": [[x, y], "spire.belfry.road.r3", [x, y]], "nodes": 9 }],
 *     "links": [{ "from": "MY-1", "to": "knife.stair.road.s2", "label": "crossing: spell crit" }],
 *     "cuts": [["spire.cloister.wheel.a", "spire.cloister.wheel.b"]],
 *     "moves": [{ "id": "spire.cloister.quick.n", "to": [x, y] }]
 *   }
 * A point is [x, y] in tree units, a full node id, or the id of a cluster in this sketch.
 */
import { readFileSync } from 'node:fs';
import { AREAS, buildAll } from '../../src/data/passives';
import { Canvas, hex } from '../tree/png';

type Point = [number, number] | string;
type Sketch = {
  title?: string;
  region?: string;
  clusters?: { id: string; label?: string; at: Point; nodes?: number }[];
  roads?: { label?: string; points: Point[]; nodes?: number }[];
  links?: { from: Point; to: Point; label?: string }[];
  cuts?: [string, string][];
  moves?: { id: string; to: Point }[];
};

const argv = process.argv.slice(2);
const file = argv.find((a) => a.endsWith('.json'));
const out = argv.find((a) => a.endsWith('.png'));
if (!file || !out) {
  console.error('usage: sketch.ts sketch.json out.png [--box x0,y0,x1,y1] [--width 2000]');
  process.exit(1);
}
const opt = (k: string) => {
  const i = argv.indexOf(k);
  return i >= 0 ? argv[i + 1] : undefined;
};
const sk = JSON.parse(readFileSync(file, 'utf8')) as Sketch;
const built = buildAll({ allowNew: true });
const { nodes } = built.tree;
const live = (i: number) => nodes[i].name !== '(retired)';
const byId = new Map(built.ids.map((id, i) => [id, i]));
const clusterAt = new Map<string, Point>((sk.clusters ?? []).map((c) => [c.id, c.at]));
const problems: string[] = [];
function pos(p: Point, depth = 0): [number, number] | null {
  if (Array.isArray(p)) return p;
  const n = byId.get(p);
  if (n !== undefined) return [nodes[n].x, nodes[n].y];
  const c = clusterAt.get(p);
  if (c && depth < 3) return pos(c, depth + 1);
  problems.push(`unknown point: ${p}`);
  return null;
}

// ---- Frame: the region and its neighbours' near edge, the sketch's own points, or a box.
const pts: [number, number][] = [];
for (let i = 0; i < nodes.length; i++)
  if (live(i) && (!sk.region || built.place[i].region === sk.region))
    pts.push([nodes[i].x, nodes[i].y]);
for (const c of sk.clusters ?? []) {
  const q = pos(c.at);
  if (q) pts.push(q);
}
for (const r of sk.roads ?? [])
  for (const p of r.points) {
    const q = pos(p);
    if (q) pts.push(q);
  }
let [minX, minY, maxX, maxY] = [
  Math.min(...pts.map((p) => p[0])) - 400,
  Math.min(...pts.map((p) => p[1])) - 400,
  Math.max(...pts.map((p) => p[0])) + 400,
  Math.max(...pts.map((p) => p[1])) + 400,
];
const box = opt('--box');
if (box) [minX, minY, maxX, maxY] = box.split(',').map(Number);
const width = Number(opt('--width') ?? 2000);
const scale = width / (maxX - minX);
const cv = new Canvas(width, Math.round((maxY - minY) * scale), hex('#0f1016'));
const X = (x: number) => (x - minX) * scale,
  Y = (y: number) => (y - minY) * scale;
const font = Math.max(1, Math.round(width / 1100));

// ---- Today's network, the sketched region brighter.
const REGION_COLOUR: Record<string, string> = {
  mystic: '#6a8cf0',
  shade: '#c45ad6',
  strider: '#6cc070',
  reaver: '#d8c07a',
  vanguard: '#d8654a',
  zealot: '#e6b060',
  centre: '#8a90a0',
};
const mine = (i: number) => !sk.region || built.place[i].region === sk.region;
for (const n of nodes)
  for (const k of n.links)
    if (k > n.id && live(n.id) && live(k))
      cv.line(
        X(n.x),
        Y(n.y),
        X(nodes[k].x),
        Y(nodes[k].y),
        1,
        hex('#8a90a0'),
        mine(n.id) || mine(k) ? 0.7 : 0.3,
      );
const R: Record<string, number> = {
  start: 34,
  keystone: 38,
  notable: 24,
  small: 10,
  travel: 9,
  hub: 10,
};
for (const n of nodes) {
  if (!live(n.id)) continue;
  const c =
    n.kind === 'start' ? hex('#ffffff') : hex(REGION_COLOUR[built.place[n.id].region] ?? '#ffffff');
  cv.disc(X(n.x), Y(n.y), Math.max(1.5, R[n.kind] * scale), c, mine(n.id) ? 0.9 : 0.35);
  if ((n.kind === 'notable' || n.kind === 'keystone') && mine(n.id))
    cv.text(n.name, X(n.x), Y(n.y) + R[n.kind] * scale + 7 * font, font, hex('#b8bcc8'), 'middle');
}
for (const a of AREAS)
  if (a.region !== 'centre' && (!sk.region || a.region === sk.region))
    cv.text(a.name, X(a.at[0]), Y(a.at[1]), font + 1, hex(REGION_COLOUR[a.region]), 'middle');

// ---- The sketch.
const NEW = hex('#ffb347'),
  ROAD = hex('#5fd4e8'),
  LINK = hex('#7ee08a'),
  CUT = hex('#ff4a5a'),
  MOVE = hex('#f6e05e');
for (const r of sk.roads ?? []) {
  const ps = r.points.map((p) => pos(p)).filter((q): q is [number, number] => !!q);
  for (let i = 1; i < ps.length; i++)
    cv.line(X(ps[i - 1][0]), Y(ps[i - 1][1]), X(ps[i][0]), Y(ps[i][1]), 3, ROAD, 0.9);
  // Its nodes, spread evenly along the line.
  const len = ps.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - ps[i][0], q[1] - ps[i][1]), 0);
  const count = r.nodes ?? 0;
  for (let k = 1; k <= count; k++) {
    let d = (len * k) / (count + 1);
    for (let i = 1; i < ps.length; i++) {
      const seg = Math.hypot(ps[i][0] - ps[i - 1][0], ps[i][1] - ps[i - 1][1]);
      if (d <= seg) {
        const t = d / seg;
        cv.ring(
          X(ps[i - 1][0] + t * (ps[i][0] - ps[i - 1][0])),
          Y(ps[i - 1][1] + t * (ps[i][1] - ps[i - 1][1])),
          9 * scale + 2,
          2,
          ROAD,
          1,
        );
        break;
      }
      d -= seg;
    }
  }
  if (r.label && ps.length) {
    const m = ps[Math.floor(ps.length / 2)];
    cv.text(r.label, X(m[0]), Y(m[1]) - 10 * font, font + 1, ROAD, 'middle');
  }
}
for (const l of sk.links ?? []) {
  const a = pos(l.from),
    b = pos(l.to);
  if (!a || !b) continue;
  cv.line(X(a[0]), Y(a[1]), X(b[0]), Y(b[1]), 3, LINK, 0.9);
  if (l.label)
    cv.text(l.label, X((a[0] + b[0]) / 2), Y((a[1] + b[1]) / 2) - 8 * font, font, LINK, 'middle');
}
for (const [x, y] of sk.cuts ?? []) {
  const a = pos(x),
    b = pos(y);
  if (!a || !b) continue;
  const mx = X((a[0] + b[0]) / 2),
    my = Y((a[1] + b[1]) / 2),
    s = 10;
  cv.line(mx - s, my - s, mx + s, my + s, 4, CUT, 1);
  cv.line(mx - s, my + s, mx + s, my - s, 4, CUT, 1);
}
for (const m of sk.moves ?? []) {
  const a = pos(m.id),
    b = pos(m.to);
  if (!a || !b) continue;
  cv.line(X(a[0]), Y(a[1]), X(b[0]), Y(b[1]), 2, MOVE, 0.9);
  cv.disc(X(b[0]), Y(b[1]), 24 * scale + 2, MOVE, 0.9);
}
for (const c of sk.clusters ?? []) {
  const q = pos(c.at);
  if (!q) continue;
  const r = Math.max(6, 70 * scale);
  cv.ring(X(q[0]), Y(q[1]), r, 3, NEW, 1);
  cv.disc(X(q[0]), Y(q[1]), Math.max(3, 24 * scale), NEW, 0.9);
  cv.text(c.id, X(q[0]), Y(q[1]) - r - 6 * font, font + 1, NEW, 'middle');
  if (c.label) cv.text(c.label, X(q[0]), Y(q[1]) + r + 8 * font, font, NEW, 'middle');
}
cv.text(
  `${sk.title ?? 'sketch'}   orange: new clusters  cyan: new roads  green: new links  red X: cut  yellow: moved`,
  10,
  10 + 8 * font,
  font + 1,
  hex('#e8e4d8'),
  'start',
);
cv.save(out);
console.log(
  `${out}: ${width}x${Math.round((maxY - minY) * scale)}${problems.length ? `\n  ${problems.join('\n  ')}` : ''}`,
);
