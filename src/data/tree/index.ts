import { buildLayoutTree } from './layout';
import type { Tree } from './types';

export type { Tree, TreeNode, TreeNodeKind } from './types';

let memo: Tree | null = null;

/** The passive tree, built once from the spec and memoised. */
export function getTree(): Tree {
  if (!memo) {
    const t = buildLayoutTree();
    memo = { nodes: t.nodes, starts: t.starts };
  }
  return memo;
}
