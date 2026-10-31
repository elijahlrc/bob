import { getTree, type Tree } from '../data/tree';
import {
  canRemove as canRemoveFor,
  hollowable,
  clusterSmalls,
  pathTo as pathFor,
  relicTargets,
  relicUsesSpent,
  type TreeBuild,
} from '../data/tree/rules';
import { relicDef, type RunRewardId } from '../data/runRewards';
import type { TreeRelics } from '../data/types';
import { passivePoints, type RunState } from './run';
import { heldReward } from './wayside';

export { pathFor };

/** Shortest path of unallocated nodes from the allocated set (or class start) to `target`, on a tree with no relics. */
export function pathTo(
  allocated: readonly number[],
  classId: string,
  target: number,
  tree: Tree = getTree(),
): number[] | null {
  return pathFor({ classId, allocated: [...allocated] }, target, tree);
}

/** Whether removing `node` keeps every other allocated node connected to the class start, on a tree with no relics. */
export function canRemove(
  allocated: readonly number[],
  classId: string,
  node: number,
  tree: Tree = getTree(),
): boolean {
  return canRemoveFor({ classId, allocated: [...allocated] }, node, tree);
}

/** Whether a node of the build can be refunded (the tree's relics counted). */
export const canRefund = (b: TreeBuild, node: number, tree: Tree = getTree()): boolean =>
  canRemoveFor(b, node, tree);

/** Allocate the path to a node if enough points remain. Returns the nodes allocated. */
export function allocate(run: RunState, target: number): number[] {
  const path = pathFor(run.build, target, getTree());
  if (!path || path.length === 0 || path.length > passivePoints(run)) return [];
  // A hollowed path taken back is an ordinary node again (relic 7).
  const r = run.build.treeRelics;
  const ghosts = r?.ghosts?.filter((g) => !path.includes(g));
  run.build = {
    ...run.build,
    allocated: [...run.build.allocated, ...path],
    ...(r && ghosts && ghosts.length !== r.ghosts!.length ? { treeRelics: { ...r, ghosts } } : {}),
  };
  return path;
}

/** Refund one node (costs a refund point; the tree must stay connected). A notable taken anywhere gives its relic's use back. */
export function refund(run: RunState, node: number): boolean {
  if (run.refundPoints <= 0 || !canRemoveFor(run.build, node, getTree())) return false;
  run.refundPoints -= 1;
  const r = run.build.treeRelics;
  run.build = {
    ...run.build,
    allocated: run.build.allocated.filter((n) => n !== node),
    ...(r?.floating?.includes(node)
      ? { treeRelics: { ...r, floating: r.floating.filter((n) => n !== node) } }
      : {}),
  };
  return true;
}

// ---- The tree's relics (docs/ATTRITION.md, relics 7 to 12) ------------------------------------------------------------------

/** How many uses of a tree relic the run has left: what the relics held give, less what the build records. */
export function relicUsesLeft(run: RunState, relic: RunRewardId): number {
  const uses = relicDef(relic).uses ?? 0;
  const r = run.build.treeRelics;
  const spent = relic === 'hollowedPaths' ? (r?.ghostUses ?? 0) : relicUsesSpent(r, relic);
  return Math.max(0, heldReward(run, relic) * uses - spent);
}

/** Why a tree relic cannot be used on a node now (null: it can). `from` is the burnt node, for the Burnt Road's second pick. */
export function relicProblem(
  run: RunState,
  relic: RunRewardId,
  node: number,
  from?: number,
): string | null {
  if (relicUsesLeft(run, relic) <= 0) return 'No use of that relic is left';
  const tree = getTree();
  if (
    relic === 'burntRoad' &&
    from !== undefined &&
    !relicTargets(run.build, relic, tree).has(from)
  )
    return 'That passive cannot be burnt';
  if (!relicTargets(run.build, relic, tree, from).has(node)) return 'Not on that passive';
  const held = run.build.allocated.includes(node);
  if ((relic === 'strayStar' || (relic === 'graftedRoot' && !held)) && passivePoints(run) <= 0)
    return 'That needs a passive point';
  return null;
}

const withRelics = (run: RunState, patch: (r: TreeRelics) => TreeRelics, allocated?: number[]) => {
  run.build = {
    ...run.build,
    ...(allocated ? { allocated } : {}),
    treeRelics: patch({ ...run.build.treeRelics }),
  };
};

/**
 * Use a tree relic on a node: hollow a held path (7), take a notable anywhere (8), burn a held node and link it to a node near
 * (9: `node` is the far end, `from` the burnt one), graft a root (10), burn a cluster's small nodes (11), or root another
 * class's start (12, `node` is that start). Nothing changes unless it is allowed.
 */
export function spendTreeRelic(
  run: RunState,
  relic: RunRewardId,
  node: number,
  from?: number,
): string | null {
  const why = relicProblem(run, relic, node, from);
  if (why) return why;
  const tree = getTree();
  const alloc = run.build.allocated;
  switch (relic) {
    case 'hollowedPaths':
      withRelics(
        run,
        (r) => ({
          ...r,
          ghosts: [...(r.ghosts ?? []), node],
          ghostUses: (r.ghostUses ?? 0) + 1,
        }),
        alloc.filter((n) => n !== node),
      );
      break;
    case 'strayStar':
      withRelics(run, (r) => ({ ...r, floating: [...(r.floating ?? []), node] }), [...alloc, node]);
      break;
    case 'burntRoad':
      withRelics(
        run,
        (r) => ({ ...r, bridges: [...(r.bridges ?? []), { from: from!, to: node }] }),
        alloc.filter((n) => n !== from),
      );
      break;
    case 'graftedRoot':
      withRelics(
        run,
        (r) => ({ ...r, anchors: [...(r.anchors ?? []), node] }),
        alloc.includes(node) ? undefined : [...alloc, node],
      );
      break;
    case 'pyreOfTheLesser': {
      if (!hollowable(tree, node)) return 'Not on that cluster';
      const smalls = new Set(clusterSmalls(tree, node));
      withRelics(
        run,
        (r) => ({ ...r, hollowed: [...(r.hollowed ?? []), node] }),
        alloc.filter((n) => !smalls.has(n)),
      );
      break;
    }
    case 'strangersThreshold': {
      const cls = tree.nodes[node]?.classStart;
      if (!cls) return 'Not a start';
      withRelics(run, (r) => ({ ...r, roots: [...(r.roots ?? []), cls] }));
      break;
    }
    default:
      return 'Not a relic of the tree';
  }
  return null;
}
