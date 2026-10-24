/**
 * The geometry check of the hand-written tree (CONSTRAINTS §11): link crossings (must be zero), nodes drawn over each
 * other, and the bends worth a look: a node with two links whose chain turns at it.
 *
 *   npx tsx scripts/passives/geometry.ts [--region vanguard] [--bends]
 *
 * Without `--region` it checks the whole tree; with it, only what touches that region's nodes. `--bends` lists every
 * small or road node with two links that turns by more than 20 degrees, with the angle (a straight run is 0).
 */
import { buildAll } from '../../src/data/passives';
import { drawnOver } from '../../src/data/passives/build';

const argv = process.argv.slice(2);
const ri = argv.indexOf('--region');
const region = ri >= 0 ? argv[ri + 1] : null;

const built = buildAll({ allowNew: true });
const { nodes } = built.tree;
const live = (i: number) => nodes[i] && nodes[i].name !== '(retired)';
const mine = (i: number) => !region || built.place[i].region === region;
const name = (i: number) =>
  `${built.ids[i]}${nodes[i].kind === 'notable' || nodes[i].kind === 'keystone' ? ` (${nodes[i].name})` : ''}`;

const edges: [number, number][] = [];
for (let i = 0; i < nodes.length; i++)
  if (live(i)) for (const j of nodes[i].links) if (j > i) edges.push([i, j]);
type Pt = { x: number; y: number };
const o = (u: Pt, v: Pt, w: Pt) => Math.sign((v.x - u.x) * (w.y - u.y) - (v.y - u.y) * (w.x - u.x));
const crosses: string[] = [];
for (let e = 0; e < edges.length; e++)
  for (let f = e + 1; f < edges.length; f++) {
    const [a, b] = edges[e];
    const [c, d] = edges[f];
    if (a === c || a === d || b === c || b === d) continue;
    if (!(mine(a) || mine(b) || mine(c) || mine(d))) continue;
    const [p, q, r, s] = [nodes[a], nodes[b], nodes[c], nodes[d]];
    if (o(p, q, r) !== o(p, q, s) && o(r, s, p) !== o(r, s, q))
      crosses.push(`${name(a)}–${name(b)} crosses ${name(c)}–${name(d)}`);
  }
const over: string[] = [];
for (let i = 0; i < nodes.length; i++)
  if (live(i))
    for (let j = i + 1; j < nodes.length; j++) {
      if (!live(j) || !(mine(i) || mine(j))) continue;
      const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
      if (drawnOver(nodes[i].kind, nodes[j].kind, d))
        over.push(`${name(i)} and ${name(j)}: ${d.toFixed(0)} apart`);
    }
console.log(`crossings: ${crosses.length}`);
for (const c of crosses) console.log('  ' + c);
console.log(`drawn over each other: ${over.length}`);
for (const c of over) console.log('  ' + c);

if (argv.includes('--bends')) {
  const bends: [number, string][] = [];
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (!live(i) || !mine(i) || n.links.length !== 2 || (n.kind !== 'small' && n.kind !== 'travel'))
      continue;
    const [a, b] = n.links.map((j) => nodes[j]);
    const t =
      Math.abs(
        ((Math.atan2(n.y - a.y, n.x - a.x) - Math.atan2(b.y - n.y, b.x - n.x) + 3 * Math.PI) %
          (2 * Math.PI)) -
          Math.PI,
      ) *
      (180 / Math.PI);
    if (t > 20)
      bends.push([
        t,
        `${name(i)} turns ${t.toFixed(0)}° between ${name(n.links[0])} and ${name(n.links[1])}`,
      ]);
  }
  bends.sort((x, y) => y[0] - x[0]);
  console.log(`bends over 20°: ${bends.length}`);
  for (const [, b] of bends) console.log('  ' + b);
}
