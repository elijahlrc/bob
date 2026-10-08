/**
 * What the passive tree is made of (docs/TREE.md, "Look and density"): the share of each kind of node, how many routes
 * the builder could not draw, dead ends, and how many notables a road runs through. `npm run tree:mix`.
 */
import { buildTree } from '../../src/data/tree/build';

const t = buildTree();
const n = t.nodes.length;
const pct = (x: number) => `${((100 * x) / n).toFixed(1)}%`;
const count = (kind: string) => t.nodes.filter((x) => x.kind === kind).length;
console.log(`nodes ${n}`);
for (const kind of ['notable', 'keystone', 'small', 'travel', 'start'])
  console.log(`  ${kind.padEnd(9)} ${String(count(kind)).padStart(5)}  ${pct(count(kind))}`);
const ends = t.nodes.filter((x) => x.links.length === 1).length;
const notables = t.nodes.filter((x) => x.kind === 'notable');
const inline = notables.filter((x) => x.links.length >= 2).length;
console.log(
  `dead ends ${ends} (${pct(ends)}), notables on a road ${inline} of ${notables.length} (${((100 * inline) / notables.length).toFixed(0)}%)`,
);
console.log(`routes the builder could not draw: ${t.dropped.length}`);
let edges = 0;
let len = 0;
let reach = 0;
for (const a of t.nodes) {
  reach = Math.max(reach, Math.hypot(a.x, a.y));
  for (const m of a.links)
    if (m > a.id) {
      edges++;
      len += Math.hypot(a.x - t.nodes[m].x, a.y - t.nodes[m].y);
    }
}
const junctions = t.nodes.filter((x) => x.links.length >= 3).length;
console.log(`edges ${edges}, mean length ${(len / edges).toFixed(0)}, radius ${reach.toFixed(0)}`);
console.log(
  `mean degree ${((2 * edges) / n).toFixed(2)}, loops ${edges - n + 1}, nodes with 3+ links ${junctions} (${pct(junctions)})`,
);
