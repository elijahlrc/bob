import { CLASSES } from '../classes';
import type { Tree } from './types';

export type { Tree, TreeNode, TreeNodeKind } from './types';

let memo: Tree | null = null;

/** The passive tree, built once and memoised. */
export function getTree(): Tree {
  if (memo) return memo;
  const nodes = CLASSES.map((c, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 3;
    return {
      id: i,
      kind: 'start' as const,
      name: c.name,
      mods: [],
      x: Math.cos(a) * 300,
      y: Math.sin(a) * 300,
      links: [],
      classStart: c.id,
    };
  });
  memo = { nodes, starts: Object.fromEntries(CLASSES.map((c, i) => [c.id, i])) };
  return memo;
}
