import type { TreeNode } from '../data/tree/types';

export type TreeCheck = {
  /** Per class start: how many nodes it cannot reach. */
  unreachable: Record<string, number>;
  /** Nodes with no links. */
  loose: number[];
  keystones: number;
  /** Pairs of nodes standing closer than `minDist`. */
  crowded: [number, number][];
};

/** Facts about a tree that a hand edit can break: every node reachable from every class start, no node adrift, no two on top of each other. */
export function checkTree(
  nodes: TreeNode[],
  starts: Record<string, number>,
  minDist = 14,
): TreeCheck {
  const by = new Map(nodes.map((n) => [n.id, n]));
  const unreachable: Record<string, number> = {};
  for (const [cls, s] of Object.entries(starts)) {
    const seen = new Set<number>([s]);
    const q = [s];
    for (let h = 0; h < q.length; h++)
      for (const m of by.get(q[h])?.links ?? [])
        if (!seen.has(m)) {
          seen.add(m);
          q.push(m);
        }
    unreachable[cls] = nodes.length - seen.size;
  }
  const cell = minDist * 2;
  const grid = new Map<string, TreeNode[]>();
  const crowded: [number, number][] = [];
  for (const n of nodes) {
    const cx = Math.floor(n.x / cell);
    const cy = Math.floor(n.y / cell);
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (const o of grid.get(`${cx + dx},${cy + dy}`) ?? [])
          if (Math.hypot(o.x - n.x, o.y - n.y) < minDist) crowded.push([o.id, n.id]);
    const k = `${cx},${cy}`;
    grid.set(k, [...(grid.get(k) ?? []), n]);
  }
  return {
    unreachable,
    loose: nodes.filter((n) => !n.links.length).map((n) => n.id),
    keystones: nodes.filter((n) => n.kind === 'keystone').length,
    crowded,
  };
}
