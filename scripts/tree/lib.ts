/** Helpers shared by the tree tools (audit, pictures, explore). */
import { getTree, type TreeNode } from '../../src/data/tree';
import { buildLayoutTree } from '../../src/data/tree/layout';
import { REGIONS, type RegionId } from '../../src/data/tree/spec';

/** `TREE=new` reads the district layout (docs/TREE-REDESIGN.md) instead of the tree the game uses; `TREE_REGIONS=int,dex` limits it to some regions. */
export const layout =
  process.env.TREE === 'new'
    ? buildLayoutTree({ regions: process.env.TREE_REGIONS?.split(',') as never })
    : null;
export const tree = layout ?? getTree();
export const nodes = tree.nodes;

/** Which region a node stands in: by direction from the middle; the middle itself is the hub. */
export function regionOf(n: Pick<TreeNode, 'x' | 'y' | 'region'>): RegionId | 'hub' {
  if (n.region) return n.region;
  if (Math.hypot(n.x, n.y) < 700) return 'hub';
  const a = (Math.atan2(n.y, n.x) * 180) / Math.PI;
  let best: RegionId = REGIONS[0].id;
  let bd = Infinity;
  for (const r of REGIONS) {
    let d = Math.abs(a - r.angle) % 360;
    if (d > 180) d = 360 - d;
    if (d < bd) {
      bd = d;
      best = r.id;
    }
  }
  return best;
}

/** Steps (links) from the nearest of `from` to every node; -1 where unreachable. */
export function steps(from: readonly number[]): number[] {
  const d = new Array<number>(nodes.length).fill(-1);
  const q: number[] = [];
  for (const f of from) {
    d[f] = 0;
    q.push(f);
  }
  for (let h = 0; h < q.length; h++)
    for (const m of nodes[q[h]].links)
      if (d[m] < 0) {
        d[m] = d[q[h]] + 1;
        q.push(m);
      }
  return d;
}

/** The class id whose region is `region`. */
export function classOf(region: RegionId): string {
  return REGIONS.find((r) => r.id === region)!.classId;
}

export const pct = (a: number, b: number): string => `${((100 * a) / (b || 1)).toFixed(0)}%`;

/** Steps from a class start to every node by the ways a player can take: never through another class's start. */
export function playerSteps(start: number): number[] {
  const d = new Array<number>(nodes.length).fill(-1);
  d[start] = 0;
  const q = [start];
  for (let h = 0; h < q.length; h++)
    for (const m of nodes[q[h]].links)
      if (d[m] < 0 && nodes[m].kind !== 'start') {
        d[m] = d[q[h]] + 1;
        q.push(m);
      }
  return d;
}
