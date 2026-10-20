import { PASSIVE_TREE } from '../passives/baked';
import type { Tree, TreeNode } from './types';

export type { Tree, TreeNode, TreeNodeKind } from './types';

/**
 * The passive tree: the hand-written one (src/data/passives, docs/PASSIVE-TREE.md), baked at build time by
 * `npm run passives:bake` with the tree editor's patch applied. The old generated tree (`treeBaked.ts`, `layout.ts`) is no
 * longer loaded by the game; its pipeline and tests remain until they are cleaned up.
 */
export function getTree(): Tree {
  return PASSIVE_TREE;
}

/** Whether a node is part of the tree, not a hole left by a retired id. */
export const isLive = (n: TreeNode | undefined): n is TreeNode => !!n && !n.retired;
