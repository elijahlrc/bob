/**
 * The authoring types of the hand-written passive tree (docs/tree/design/D-method.md). An area file is a list of clusters,
 * every node with its lines, every link with its reason. Tools place coordinates and draw; they never add a node or a link.
 */
import type { Mod } from '../../mods/types';

/** Which vocabulary function made a line, and with what: `{ fn: 'bowDamage', args: [10] }`. What the editor edits and saves. */
export type LineSpec = { fn: string; args: unknown[] };

/** A line a node carries: the engine's mods plus the value in units (the small node of that stat = 1). */
export type Line = {
  mods: Mod[];
  units: number;
  /** Short authoring label, for listings. */ label: string;
  spec?: LineSpec;
};

export type NodeKind = 'small' | 'notable' | 'keystone' | 'attribute';

export type NodeSpec = {
  /** Local id inside the cluster ('a', 'b', 'n'); the full id is `<area>.<cluster>.<node>`. */
  id: string;
  kind: NodeKind;
  /** Required on a notable or keystone; a small node without a name is named after its lines. */
  name?: string;
  lines: Line[];
  /** Why this node carries these lines, when it is not the obvious one for its cluster. */
  why?: string;
  /** Hand position (tree units), overriding the cluster's shape. */
  at?: [number, number];
};

export type Shape =
  /** Nodes evenly round the anchor at `r`, from `a0` degrees (0 = east, clockwise). */
  | { kind: 'ring'; r: number; a0?: number }
  /** Nodes along a heading (degrees) from the anchor, `gap` apart. */
  | { kind: 'line'; heading: number; gap?: number }
  /** By hand: every node has `at`. */
  | { kind: 'hand' };

export type ClusterSpec = {
  /** Local id inside the area. */
  id: string;
  /** The idea in a word or two; a notable cluster is usually named by its notable. */
  name: string;
  why: string;
  /** Anchor in tree units. */
  at: [number, number];
  shape: Shape;
  nodes: NodeSpec[];
  /** Links inside the cluster, by local node id. */
  links: [string, string][];
};

export type LinkSpec = {
  /** `cluster.node` inside this area, or a full `area.cluster.node` id anywhere. */
  from: string;
  to: string;
  why: string;
};

export type RegionId = 'mystic' | 'shade' | 'strider' | 'reaver' | 'vanguard' | 'zealot' | 'centre';

export type AreaSpec = {
  /** `<region>.<area>`; `wall.rampart`. The region word is the theme name (wall, spire...), not the class. */
  id: string;
  region: RegionId;
  /** The in-game label drawn behind the clusters. */
  name: string;
  why: string;
  /** Where the label goes. */
  at: [number, number];
  clusters: ClusterSpec[];
  /** Links between clusters of this area and to other areas. A link is written once, in either area. */
  links: LinkSpec[];
};

/** A class start: the one node per class with no lines; its links are written by the home area. */
export type StartSpec = { classId: string; region: RegionId; id: string; at: [number, number] };
