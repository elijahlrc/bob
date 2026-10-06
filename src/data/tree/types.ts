import type { Mod } from '../../mods/types';

export type TreeNodeKind = 'start' | 'small' | 'notable' | 'keystone' | 'travel' | 'hub';

export type TreeNode = {
  id: number;
  kind: TreeNodeKind;
  name: string;
  mods: Mod[];
  x: number;
  y: number;
  links: number[];
  /** Class id for start nodes. */
  classStart?: string;
  cluster?: string;
};

export type Tree = {
  nodes: TreeNode[];
  /** Class id → start node id. */
  starts: Record<string, number>;
};
