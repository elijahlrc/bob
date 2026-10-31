// @ts-nocheck -- a one-off tool of the attrition rework (docs/tree/design/R-state.md), run with npx tsx; absolute paths.
// A picture of the reference tree's layout, for study only (stays in the scratchpad, never in the repository): node
// positions from the local reference data's groups and orbits, links from the summary, the six class starts marked, and
// rings at 4, 8 and 12 steps from one start (argv[3]) so the skeleton near a start can be read.
import fs from 'fs';
import { Canvas, hex } from 'file:///E:/Proj/Auto/.claude/worktrees/flask-scarcity/scripts/tree/png.ts';
const raw = fs.readFileSync('E:/Proj/Auto/.claude/worktrees/flask-scarcity/reference/pob/x/PathOfBuilding-1.4.155/TreeData/3_9/tree.lua', 'utf8');
const ref = JSON.parse(fs.readFileSync('E:/Proj/Auto/.claude/worktrees/flask-scarcity/reference/tree/ref-tree.json', 'utf8'));
const radii = [0, 82, 162, 335, 493];
const per = [1, 6, 12, 12, 40];
const groups = new Map<number, [number, number]>();
const gi = raw.indexOf('["groups"]={');
const gre = /\[(\d+)\]=\{\["x"\]=(-?[\d.]+),\["y"\]=(-?[\d.]+)/g;
gre.lastIndex = gi;
let m: RegExpExecArray | null;
while ((m = gre.exec(raw)) && m.index < gi + 400000) groups.set(Number(m[1]), [Number(m[2]), Number(m[3])]);
const pos = new Map<number, [number, number]>();
const nre = /\["id"\]=(\d+),[^\[]*?(?:\[[^\]]*\][^\[]*?)*?\["g"\]=(\d+),\["o"\]=(\d+),\["oidx"\]=(\d+)/g;
const starts = [47175, 50459, 54447, 50986, 61525, 44683];
for (const id of [...Object.values(ref.nodes).map((n: any) => n.id), ...starts]) {
  const i = raw.indexOf(`["id"]=${id},`);
  if (i < 0) continue;
  const seg = raw.slice(i, i + 4000);
  const g = seg.match(/\["g"\]=(\d+),\["o"\]=(\d+),\["oidx"\]=(\d+)/);
  if (!g) continue;
  const [gx, gy] = groups.get(Number(g[1])) ?? [0, 0];
  const o = Number(g[2]);
  const a = (2 * Math.PI * Number(g[3])) / per[o];
  pos.set(id, [gx + radii[o] * Math.sin(a), gy - radii[o] * Math.cos(a)]);
}
void nre;
const focus = Number(process.argv[3] ?? starts[1]);
const box = (process.argv[4] ?? '').split(',').map(Number);
const [x0, y0, x1, y1] = box.length === 4 ? box : [-10600, -7900, 9700, 8400];
const W = 2000;
const sc = W / (x1 - x0);
const H = Math.round((y1 - y0) * sc);
const cv = new Canvas(W, H, hex('#0d0f14'));
const P = (id: number) => {
  const [x, y] = pos.get(id)!;
  return [(x - x0) * sc, (y - y0) * sc] as const;
};
// Steps from the focus start (other starts are not a way through).
const adj = new Map<number, number[]>();
const add = (a: number, b: number) => {
  if (!adj.has(a)) adj.set(a, []);
  adj.get(a)!.push(b);
};
for (const n of Object.values(ref.nodes) as any[]) for (const l of n.links) if (pos.has(l) && pos.has(n.id)) (add(n.id, l), add(l, n.id));
const d = new Map<number, number>([[focus, 0]]);
const q = [focus];
while (q.length) {
  const a = q.shift()!;
  for (const b of adj.get(a) ?? []) if (!d.has(b) && !(starts.includes(b) && b !== focus)) (d.set(b, d.get(a)! + 1), q.push(b));
}
for (const [a, bs] of adj) for (const b of bs) if (a < b) {
  const [ax, ay] = P(a);
  const [bx, by] = P(b);
  cv.line(ax, ay, bx, by, 1.5, hex('#5a6070'), 0.8);
}
const colour = (k: number | undefined) =>
  k === undefined ? hex('#444a55') : k <= 4 ? hex('#ffffff') : k <= 8 ? hex('#ffd23c') : k <= 12 ? hex('#ff7a3c') : hex('#6f7890');
for (const n of Object.values(ref.nodes) as any[]) {
  if (!pos.has(n.id)) continue;
  const [x, y] = P(n.id);
  const r = n.kind === 'keystone' ? 7 : n.kind === 'notable' ? 5 : 2.5;
  cv.disc(x, y, r, colour(d.get(n.id)));
}
for (const s of starts) if (pos.has(s)) {
  const [x, y] = P(s);
  cv.ring(x, y, 10, 3, hex('#3cff8c'));
}
cv.save(process.argv[2]);
console.log(`${W}x${H}, ${pos.size} placed`);
