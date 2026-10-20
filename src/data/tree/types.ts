import type { Mod } from '../../mods/types';
import type { RegionId } from './spec';

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
  /** The district (docs/TREE-REDESIGN.md) a node of the new layout stands in; a hub, wayside or old-layout node has none. */
  district?: string;
  /** The region a node of the new layout stands in (the middle is 'hub'). */
  region?: RegionId | 'hub';
  /** The centre of the loop this node stands on, so the lines between neighbours on it can be drawn as arcs. */
  orbit?: [number, number];
};

export type Tree = {
  nodes: TreeNode[];
  /** Class id → start node id. */
  starts: Record<string, number>;
  /** The names of the tree's areas and where they are drawn (the hand-written tree; the old tree has none). */
  areas?: { name: string; region: string; x: number; y: number }[];
};

/** A generated cluster (src/data/tree/clustersGen.ts): a notable and the small nodes beside it. */
export type GenCluster = {
  id: string;
  region: RegionId;
  /** What the cluster is about: clusters of one family sit side by side on the tree. */
  family: string;
  /** How deep in the reference tree the cluster was (0 near the middle, 1 at the rim): deeper sits further out. */
  depth: number;
  smallCount: number;
  notable: { name: string; mods: Mod[] };
  small: { name: string; mods: Mod[] };
};
