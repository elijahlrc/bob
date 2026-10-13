import { applyTreeEdits, type TreeEdits } from './edits';
import edits from './treeEdits.json';
import { BAKED_TREE } from './treeBaked';
import type { Tree } from './types';

export type { Tree, TreeNode, TreeNodeKind } from './types';

let cached: Tree | null = null;

/**
 * The passive tree. It is laid out once, at build time (`npm run tree:bake` writes `treeBaked.ts` from `layout.ts`), not in the browser:
 * the layout takes seconds. The tools that want a fresh layout call `buildLayoutTree` themselves. Hand edits made in the tree editor
 * (`npm run tree:edit`, saved to `treeEdits.json`) are applied on top of the baked tree.
 */
export function getTree(): Tree {
  return (cached ??= applyTreeEdits(BAKED_TREE, edits as TreeEdits));
}
