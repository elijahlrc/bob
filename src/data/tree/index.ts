import { BAKED_TREE } from './treeBaked';
import type { Tree } from './types';

export type { Tree, TreeNode, TreeNodeKind } from './types';

/**
 * The passive tree. It is laid out once, at build time (`npm run tree:bake` writes `treeBaked.ts` from `layout.ts`), not in the browser:
 * the layout takes seconds. The tools that want a fresh layout call `buildLayoutTree` themselves.
 */
export function getTree(): Tree {
  return BAKED_TREE;
}
