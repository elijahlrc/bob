import { mod, type Mod } from '../../mods/types';
import { GRAFT_RES, PYRE_MULT, type RunRewardId } from '../runRewards';
import type { Build, TreeRelics } from '../types';
import { isLive, type Tree, type TreeNode } from './index';

/**
 * The rules of the passive tree, with what the tree's relics change (docs/ATTRITION.md, relics 7 to 13). Headless and shared:
 * the calc reads the passives' mods here, the run allocates and refunds by these rules, and the Tree tab, the bots and the
 * scripts ask them what can be taken. The baked tree is never changed: a relic's link or burnt node is an overlay worked out
 * from the build.
 *
 * - A **root** is where passives grow from: the class's start, another class's start (relic 12), a grafted root (relic 10).
 * - A node **conducts** when a path may pass through it: an allocated node, a hollowed path (relic 7), a burnt node (9, 11).
 * - A **floating** notable (relic 8) is allocated with no path to it; it conducts, but is not reached from a root until a path
 *   joins it.
 */
export type TreeBuild = Pick<Build, 'classId' | 'allocated' | 'treeRelics' | 'relics'>;

type Graph = {
  roots: Set<number>;
  allocated: Set<number>;
  burned: Set<number>;
  ghosts: Set<number>;
  floating: Set<number>;
  anchors: Set<number>;
  conductive: Set<number>;
  /** Links a relic adds (relic 9), both ways. */
  extra: Map<number, number[]>;
  /** Reached from a root through conducting nodes. */
  connected: Set<number>;
  foreignStarts: boolean;
};

const graphs = new WeakMap<readonly number[], { key: string; tree: Tree; g: Graph }>();

const relicKey = (b: TreeBuild) =>
  `${b.classId}|${JSON.stringify(b.treeRelics ?? {})}|${b.relics?.crownsOfTheFallen ?? 0}`;

/** Breadth-first reach from `from` over nodes in `through`. */
function reach(
  tree: Tree,
  from: Iterable<number>,
  through: Set<number>,
  extra: Map<number, number[]>,
) {
  const seen = new Set<number>(from);
  const q = [...seen];
  for (let h = 0; h < q.length; h++) {
    const n = q[h];
    for (const m of linksOf(tree, extra, n))
      if (through.has(m) && !seen.has(m)) {
        seen.add(m);
        q.push(m);
      }
  }
  return seen;
}

function linksOf(tree: Tree, extra: Map<number, number[]>, id: number): readonly number[] {
  const own = tree.nodes[id]?.links ?? [];
  const more = extra.get(id);
  return more ? [...own, ...more] : own;
}

/** The small nodes of a notable's cluster (relic 11). */
export function clusterSmalls(tree: Tree, notable: number): number[] {
  const n = tree.nodes[notable];
  if (!n?.cluster) return [];
  return tree.nodes
    .filter((x) => isLive(x) && x.cluster === n.cluster && x.kind === 'small')
    .map((x) => x.id);
}

/** Whether a notable's cluster can be hollowed (relic 11): it is the cluster's one notable, with two or more small nodes. */
export function hollowable(tree: Tree, notable: number): boolean {
  const n = tree.nodes[notable];
  if (!isLive(n) || n.kind !== 'notable' || !n.cluster) return false;
  const notables = tree.nodes.filter(
    (x) => isLive(x) && x.cluster === n.cluster && x.kind === 'notable',
  ).length;
  return notables === 1 && clusterSmalls(tree, notable).length >= 2;
}

export function graphOf(b: TreeBuild, tree: Tree): Graph {
  const key = relicKey(b);
  const hit = graphs.get(b.allocated);
  if (hit && hit.key === key && hit.tree === tree) return hit.g;
  const r: TreeRelics = b.treeRelics ?? {};
  const roots = new Set<number>([tree.starts[b.classId]]);
  for (const cls of r.roots ?? []) if (tree.starts[cls] !== undefined) roots.add(tree.starts[cls]);
  const anchors = new Set(r.anchors ?? []);
  for (const a of anchors) roots.add(a);
  const burned = new Set<number>();
  const extra = new Map<number, number[]>();
  for (const { from, to } of r.bridges ?? []) {
    burned.add(from);
    extra.set(from, [...(extra.get(from) ?? []), to]);
    extra.set(to, [...(extra.get(to) ?? []), from]);
  }
  for (const n of r.hollowed ?? []) for (const s of clusterSmalls(tree, n)) burned.add(s);
  const allocated = new Set(b.allocated);
  const ghosts = new Set((r.ghosts ?? []).filter((g) => !allocated.has(g)));
  const conductive = new Set<number>([...allocated, ...ghosts, ...burned, ...roots]);
  const g: Graph = {
    roots,
    allocated,
    burned,
    ghosts,
    floating: new Set(r.floating ?? []),
    anchors,
    conductive,
    extra,
    connected: reach(tree, roots, conductive, extra),
    foreignStarts: (b.relics?.crownsOfTheFallen ?? 0) > 0,
  };
  graphs.set(b.allocated, { key, tree, g });
  return g;
}

/**
 * The build with its passives handed back, for a save from before the tree changed: the allocated nodes and every relic record
 * that names a node go, so the relics' uses come back (they are counted from these records). Another class's start is kept by
 * class, and outlives any change of the tree.
 */
export function resetTree<B extends TreeBuild>(b: B): B {
  const roots = b.treeRelics?.roots;
  return { ...b, allocated: [], treeRelics: roots?.length ? { roots } : undefined };
}

function canTake(g: Graph, tree: Tree, id: number): boolean {
  const n = tree.nodes[id];
  if (!isLive(n)) return false;
  if (g.allocated.has(id) || g.burned.has(id) || g.roots.has(id)) return false;
  if (n.kind === 'start') return g.foreignStarts;
  return true;
}

/** Whether a node can be taken at all (reached or not): live, not held, not burnt, not a root; a start only with relic 13. */
export function takeable(b: TreeBuild, tree: Tree, id: number): boolean {
  return canTake(graphOf(b, tree), tree, id);
}

/** The links of a node, a relic's among them. */
export function nodeLinks(b: TreeBuild, tree: Tree, id: number): readonly number[] {
  return linksOf(tree, graphOf(b, tree).extra, id);
}

/**
 * The cheapest path of nodes to take to reach `target`, ending with it: passing through conducting nodes costs nothing, a node
 * to take costs a point. Empty when it is held; null when it cannot be reached or taken.
 */
export function pathTo(b: TreeBuild, target: number, tree: Tree): number[] | null {
  const g = graphOf(b, tree);
  if (g.allocated.has(target)) return [];
  if (!canTake(g, tree, target)) return null;
  // 0-1 breadth-first search from everything reached.
  const cost = new Map<number, number>();
  const prev = new Map<number, number>();
  const dq: number[] = [];
  for (const id of g.connected) {
    cost.set(id, 0);
    prev.set(id, -1);
    dq.push(id);
  }
  // A simple deque: zero-cost steps go to the front.
  let head = 0;
  const front: number[] = [];
  const next = (): number | undefined => (front.length ? front.pop() : dq[head++]);
  for (let n = next(); n !== undefined; n = next()) {
    if (n === target) break;
    const c = cost.get(n)!;
    for (const m of linksOf(tree, g.extra, n)) {
      const free = g.conductive.has(m) && m !== target;
      if (!free && !canTake(g, tree, m)) continue;
      const step = free ? 0 : 1;
      const cm = c + step;
      if (cost.has(m) && cost.get(m)! <= cm) continue;
      cost.set(m, cm);
      prev.set(m, n);
      if (step === 0) front.push(m);
      else dq.push(m);
    }
  }
  if (!prev.has(target)) return null;
  const path: number[] = [];
  for (let n = target; n !== -1 && !g.connected.has(n); n = prev.get(n)!)
    if (!g.conductive.has(n) || n === target) path.push(n);
  // A hollowed path that is reached is taken back on its own.
  if (g.connected.has(target)) return [target];
  return path.reverse();
}

/** Every node a point can be spent on now: a takeable node next to a node reached from a root. */
export function frontier(b: TreeBuild, tree: Tree): Set<number> {
  const g = graphOf(b, tree);
  const out = new Set<number>();
  for (const id of g.connected) {
    if (g.ghosts.has(id)) out.add(id);
    for (const m of linksOf(tree, g.extra, id)) if (canTake(g, tree, m)) out.add(m);
  }
  return out;
}

/**
 * Whether `node` can be refunded: every other held node (but a floating notable) must still be reached from a root. A grafted
 * root (relic 10) stays.
 */
export function canRemove(b: TreeBuild, node: number, tree: Tree): boolean {
  const g = graphOf(b, tree);
  if (!g.allocated.has(node) || g.anchors.has(node)) return false;
  const through = new Set(g.conductive);
  through.delete(node);
  const roots = [...g.roots].filter((r) => r !== node);
  const seen = reach(tree, roots, through, g.extra);
  for (const id of g.allocated)
    if (id !== node && !g.floating.has(id) && !seen.has(id)) return false;
  return true;
}

/** How far from the middle the farthest node stands (relic 9 reaches a third of it). */
const radii = new WeakMap<Tree, number>();
export function treeRadius(tree: Tree): number {
  let r = radii.get(tree);
  if (r === undefined) {
    r = 0;
    for (const n of tree.nodes) if (isLive(n)) r = Math.max(r, Math.hypot(n.x, n.y));
    radii.set(tree, r);
  }
  return r;
}
export const BRIDGE_REACH = 1 / 3;

/** The nodes a tree relic may be used on now (`from`: the node relic 9 burns, once chosen). */
export function relicTargets(
  b: TreeBuild,
  relic: RunRewardId,
  tree: Tree,
  from?: number,
): Set<number> {
  const g = graphOf(b, tree);
  const out = new Set<number>();
  const live = tree.nodes.filter(isLive);
  const held = (id: number) => g.allocated.has(id);
  switch (relic) {
    case 'hollowedPaths':
      for (const id of g.allocated)
        if (!g.anchors.has(id) && !g.floating.has(id) && tree.nodes[id].kind !== 'start')
          out.add(id);
      break;
    case 'strayStar':
      for (const n of live) if (n.kind === 'notable' && canTake(g, tree, n.id)) out.add(n.id);
      break;
    case 'burntRoad':
      if (from === undefined) {
        // A burnt node still carries the paths through it, so any held node will do.
        for (const id of g.allocated)
          if (!g.anchors.has(id) && !g.floating.has(id) && tree.nodes[id].kind !== 'start')
            out.add(id);
      } else {
        const f = tree.nodes[from];
        const r = treeRadius(tree) * BRIDGE_REACH;
        for (const n of live)
          if (
            n.id !== from &&
            Math.hypot(n.x - f.x, n.y - f.y) <= r &&
            !f.links.includes(n.id) &&
            (canTake(g, tree, n.id) || held(n.id))
          )
            out.add(n.id);
      }
      break;
    case 'graftedRoot':
      for (const n of live)
        if (
          (n.kind === 'small' || n.kind === 'travel') &&
          !g.burned.has(n.id) &&
          !g.roots.has(n.id)
        )
          out.add(n.id);
      break;
    case 'pyreOfTheLesser':
      for (const n of live)
        if (!(b.treeRelics?.hollowed ?? []).includes(n.id) && hollowable(tree, n.id)) out.add(n.id);
      break;
    case 'strangersThreshold':
      for (const [cls, id] of Object.entries(tree.starts))
        if (cls !== b.classId && !g.roots.has(id)) out.add(id);
      break;
  }
  return out;
}

/** What another class's start gives when it is taken as a notable (relic 13). */
export const FOREIGN_START_MODS: Mod[] = [
  mod('resist.allEle', 'base', 8),
  mod('resist.chaos', 'base', 8),
  mod('attackSpeed', 'inc', 10),
  mod('castSpeed', 'inc', 10),
  mod('life', 'inc', 10),
  mod('mana', 'inc', 10),
];

const stamped = new WeakMap<object, Mod[]>();
const tripled = new WeakMap<object, Mod[]>();

/** A node's mods with their source (the same objects every time: the tree never changes). */
function stamp(n: TreeNode, mods: readonly Mod[], cache: WeakMap<object, Mod[]>, mult = 1): Mod[] {
  let out = cache.get(n);
  if (!out)
    cache.set(
      n,
      (out = mods.map((m) => ({
        ...m,
        value: m.kind === 'flag' || m.kind === 'override' ? m.value : m.value * mult,
        source: { kind: 'tree' as const, id: String(n.id) },
      }))),
    );
  return out;
}

/**
 * How many held nodes grow from a grafted root alone (relic 10): those reached from every root but not once the grafted roots
 * are left out. Each costs resistances.
 */
export function graftedCount(b: TreeBuild, tree: Tree): number {
  // Most builds have no grafted root: no search for them (every character the calc makes asks).
  if (!b.treeRelics?.anchors?.length) return 0;
  const g = graphOf(b, tree);
  const others = [...g.roots].filter((r) => !g.anchors.has(r));
  const without = reach(tree, others, g.conductive, g.extra);
  let n = 0;
  for (const id of g.allocated)
    if (!g.anchors.has(id) && g.connected.has(id) && !without.has(id)) n++;
  return n;
}

/** The mods a node gives on this build: three times as much for a hollowed notable, and a start's when taken as a notable. */
export function nodeModsFor(b: TreeBuild, tree: Tree, id: number): Mod[] {
  const n = tree.nodes[id];
  if (!n) return [];
  if (n.kind === 'start')
    return n.classStart === b.classId ? [] : stamp(n, FOREIGN_START_MODS, stamped);
  if ((b.treeRelics?.hollowed ?? []).includes(id)) return stamp(n, n.mods, tripled, PYRE_MULT);
  return stamp(n, n.mods, stamped);
}

/** Every mod the build's passives give (the calc's), the grafted root's price among them. */
export function passiveMods(b: TreeBuild, tree: Tree): Mod[] {
  const out: Mod[] = [];
  for (const id of b.allocated) out.push(...nodeModsFor(b, tree, id));
  const grafted = graftedCount(b, tree);
  if (grafted)
    for (const s of ['resist.allEle', 'resist.chaos'])
      out.push(
        mod(s, 'base', -GRAFT_RES * grafted, { source: { kind: 'relic', id: 'graftedRoot' } }),
      );
  return out;
}

/** Which relic each part of `TreeRelics` belongs to, and how many uses it takes: what is left of a relic is its uses less these. */
export function relicUsesSpent(r: TreeRelics | undefined, relic: RunRewardId): number {
  switch (relic) {
    case 'hollowedPaths':
      return r?.ghosts?.length ?? 0;
    case 'strayStar':
      return r?.floating?.length ?? 0;
    case 'burntRoad':
      return r?.bridges?.length ?? 0;
    case 'graftedRoot':
      return r?.anchors?.length ?? 0;
    case 'pyreOfTheLesser':
      return r?.hollowed?.length ?? 0;
    case 'strangersThreshold':
      return r?.roots?.length ?? 0;
    default:
      return 0;
  }
}

/** The relics used on the tree, in the order the Tree tab lists them. */
export const TREE_RELICS: RunRewardId[] = [
  'hollowedPaths',
  'strayStar',
  'burntRoad',
  'graftedRoot',
  'pyreOfTheLesser',
  'strangersThreshold',
];
