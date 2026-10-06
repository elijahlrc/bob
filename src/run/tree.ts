import { getTree, type Tree } from '../data/tree';
import { passivePoints, type RunState } from './run';

/** Shortest path of unallocated nodes from the allocated set (or class start) to `target`. */
export function pathTo(
  allocated: readonly number[],
  classId: string,
  target: number,
  tree: Tree = getTree(),
): number[] | null {
  const start = tree.starts[classId];
  const have = new Set(allocated);
  have.add(start);
  if (have.has(target)) return [];
  const tn = tree.nodes[target];
  if (!tn || tn.kind === 'start') return null;
  const prev = new Map<number, number>();
  const q: number[] = [];
  for (const id of have) {
    q.push(id);
    prev.set(id, -1);
  }
  for (let h = 0; h < q.length; h++) {
    const n = q[h];
    if (n === target) break;
    for (const m of tree.nodes[n].links) {
      if (prev.has(m)) continue;
      if (tree.nodes[m].kind === 'start') continue;
      prev.set(m, n);
      q.push(m);
    }
  }
  if (!prev.has(target)) return null;
  const path: number[] = [];
  for (let n = target; !have.has(n); n = prev.get(n)!) path.push(n);
  return path.reverse();
}

/** Whether removing `node` keeps every other allocated node connected to the class start. */
export function canRemove(
  allocated: readonly number[],
  classId: string,
  node: number,
  tree: Tree = getTree(),
): boolean {
  if (!allocated.includes(node)) return false;
  const rest = new Set(allocated.filter((n) => n !== node));
  const start = tree.starts[classId];
  const seen = new Set<number>([start]);
  const q = [start];
  for (let h = 0; h < q.length; h++)
    for (const m of tree.nodes[q[h]].links)
      if (rest.has(m) && !seen.has(m)) {
        seen.add(m);
        q.push(m);
      }
  return seen.size - 1 === rest.size;
}

/** Allocate the path to a node if enough points remain. Returns the nodes allocated. */
export function allocate(run: RunState, target: number): number[] {
  const path = pathTo(run.build.allocated, run.classId, target);
  if (!path || path.length === 0 || path.length > passivePoints(run)) return [];
  run.build = { ...run.build, allocated: [...run.build.allocated, ...path] };
  return path;
}

/** Refund one node (costs a refund point; the tree must stay connected). */
export function refund(run: RunState, node: number): boolean {
  if (run.refundPoints <= 0 || !canRemove(run.build.allocated, run.classId, node)) return false;
  run.refundPoints -= 1;
  run.build = { ...run.build, allocated: run.build.allocated.filter((n) => n !== node) };
  return true;
}
