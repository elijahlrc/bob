/**
 * Hand edits to the passive tree. The tree editor (`npm run tree:edit`, tree-editor.html) saves what the user changed as a patch
 * against the baked tree (`treeEdits.json`); `getTree()` applies it. Nodes keep their ids inside the editor; when the patch is
 * applied for the game the ids are packed again, because the game reads `tree.nodes[id]`.
 */
import type { Mod } from '../../mods/types';
import type { Tree, TreeNode, TreeNodeKind } from './types';

/** What can change on a node. `orbit: null` drops the arc centre (a moved node is no longer on its loop). */
export type NodeEdit = Partial<{
  x: number;
  y: number;
  kind: TreeNodeKind;
  name: string;
  mods: Mod[];
  orbit: null;
}>;

export type TreeEdits = {
  version: 1;
  /** Changes to nodes of the baked tree, by id. */
  nodes?: Record<string, NodeEdit>;
  /** Nodes made by hand. Their ids start at the baked tree's length. Links are given by `links` below. */
  add?: Omit<TreeNode, 'links'>[];
  /** Ids of baked nodes taken out (and the links to them). */
  remove?: number[];
  /** Links added and taken away, as id pairs. */
  linkAdd?: [number, number][];
  linkRemove?: [number, number][];
};

export const NO_EDITS: TreeEdits = { version: 1 };

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const key = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

/** The base tree with the edits applied, ids unchanged (so a node taken out leaves a gap). */
export function applyEditsStable(base: Tree, edits: TreeEdits): TreeNode[] {
  const map = new Map<number, TreeNode>();
  for (const n of base.nodes) map.set(n.id, clone(n));
  for (const [id, e] of Object.entries(edits.nodes ?? {})) {
    const n = map.get(Number(id));
    if (!n) continue;
    if (e.x !== undefined) n.x = e.x;
    if (e.y !== undefined) n.y = e.y;
    if (e.kind) n.kind = e.kind;
    if (e.name !== undefined) n.name = e.name;
    if (e.mods) n.mods = clone(e.mods);
    if (e.orbit === null) delete n.orbit;
  }
  for (const a of edits.add ?? []) map.set(a.id, { ...clone(a), links: [] });
  const link = (a: number, b: number, on: boolean) => {
    const na = map.get(a);
    const nb = map.get(b);
    if (!na || !nb || a === b) return;
    na.links = na.links.filter((x) => x !== b);
    nb.links = nb.links.filter((x) => x !== a);
    if (on) {
      na.links.push(b);
      nb.links.push(a);
    }
  };
  for (const [a, b] of edits.linkRemove ?? []) link(a, b, false);
  for (const [a, b] of edits.linkAdd ?? []) link(a, b, true);
  for (const id of edits.remove ?? []) {
    const n = map.get(id);
    if (!n) continue;
    for (const m of n.links) {
      const o = map.get(m);
      if (o) o.links = o.links.filter((x) => x !== id);
    }
    map.delete(id);
  }
  return [...map.values()].sort((p, q) => p.id - q.id);
}

/** Packs the ids to 0..n-1 in order (links and class starts follow). */
export function packTree(nodes: TreeNode[], starts: Record<string, number>): Tree {
  const to = new Map<number, number>();
  nodes.forEach((n, i) => to.set(n.id, i));
  const packed = nodes.map((n, i) => ({
    ...n,
    id: i,
    links: n.links.map((m) => to.get(m)!).filter((m) => m !== undefined),
  }));
  const out: Record<string, number> = {};
  for (const [c, id] of Object.entries(starts)) out[c] = to.get(id) ?? id;
  return { nodes: packed, starts: out };
}

/** The tree the game uses: the base with the edits applied and the ids packed. With no edits it is the base itself. */
export function applyTreeEdits(base: Tree, edits: TreeEdits): Tree {
  const empty =
    !Object.keys(edits.nodes ?? {}).length &&
    !edits.add?.length &&
    !edits.remove?.length &&
    !edits.linkAdd?.length &&
    !edits.linkRemove?.length;
  if (empty) return base;
  return packTree(applyEditsStable(base, edits), base.starts);
}

/** The patch that turns `base` into `edited` (a list of nodes with stable ids, as `applyEditsStable` returns). */
export function diffTree(base: Tree, edited: TreeNode[]): TreeEdits {
  const baseBy = new Map(base.nodes.map((n) => [n.id, n]));
  const editedBy = new Map(edited.map((n) => [n.id, n]));
  const out: TreeEdits = { version: 1 };
  const nodes: Record<string, NodeEdit> = {};
  const add: Omit<TreeNode, 'links'>[] = [];
  const baseLinks = new Set<string>();
  const nowLinks = new Set<string>();
  for (const n of base.nodes) for (const m of n.links) baseLinks.add(key(n.id, m));
  for (const n of edited) for (const m of n.links) nowLinks.add(key(n.id, m));
  for (const n of edited) {
    const b = baseBy.get(n.id);
    if (!b) {
      const { links: _links, ...rest } = n;
      add.push(clone(rest));
      continue;
    }
    const e: NodeEdit = {};
    if (n.x !== b.x) e.x = n.x;
    if (n.y !== b.y) e.y = n.y;
    if (n.kind !== b.kind) e.kind = n.kind;
    if (n.name !== b.name) e.name = n.name;
    if (JSON.stringify(n.mods) !== JSON.stringify(b.mods)) e.mods = clone(n.mods);
    if (b.orbit && !n.orbit) e.orbit = null;
    if (Object.keys(e).length) nodes[String(n.id)] = e;
  }
  const remove = base.nodes.filter((n) => !editedBy.has(n.id)).map((n) => n.id);
  const gone = new Set(remove);
  const pair = (k: string) => k.split('-').map(Number) as [number, number];
  const linkAdd = [...nowLinks].filter((k) => !baseLinks.has(k)).map(pair);
  const linkRemove = [...baseLinks]
    .filter((k) => !nowLinks.has(k))
    .map(pair)
    // Links to a removed node go with it.
    .filter(([a, b]) => !gone.has(a) && !gone.has(b));
  if (Object.keys(nodes).length) out.nodes = nodes;
  if (add.length) out.add = add;
  if (remove.length) out.remove = remove;
  if (linkAdd.length) out.linkAdd = linkAdd;
  if (linkRemove.length) out.linkRemove = linkRemove;
  return out;
}
