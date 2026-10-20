/**
 * Hand edits to the hand-written tree, made in the tree editor (`npm run passives:edit`, tree-editor.html?tree=next) and
 * saved as a patch in `edits.json`: the same patch format as the old tree's (`src/data/tree/edits.ts`), keyed by the
 * registry numbers of `ids.json`, which never change (so the patch survives any rewrite of the area files that keeps the
 * node ids), plus `lines`: the changed nodes' lines in the vocabulary of lines.ts, from which their mods and (for a small
 * or attribute node) their name are rebuilt here. `buildAll` applies it, so the listing, the picture and the audit show
 * the edited tree.
 *
 * The patch is meant as a scratch layer: what a reviewer moved, cut, joined or re-lined in the editor, to be folded back
 * into the area files (with their reasons) once agreed. A node added in the editor has no area file and no reason; it is
 * kept as `edit.<number>` until it gets one.
 */
import { applyEditsStable, type TreeEdits } from '../tree/edits';
import type { TreeNode } from '../tree/types';
import type { Built } from './build';
import type { LineSpec } from './types';
import { makeLine, nameOfLines } from './vocab';

export type { TreeEdits };

/** The built tree with the patch applied, ids unchanged: a removed node becomes a retired hole, an added one is appended. */
export function applyPassiveEdits(built: Built, edits: TreeEdits): Built {
  const empty =
    !Object.keys(edits.nodes ?? {}).length &&
    !edits.add?.length &&
    !edits.remove?.length &&
    !edits.linkAdd?.length &&
    !edits.linkRemove?.length &&
    !Object.keys(edits.lines ?? {}).length;
  if (empty) return built;
  const edited = applyEditsStable(built.tree, edits);
  const count = Math.max(built.tree.nodes.length, ...edited.map((n) => n.id + 1));
  const nodes: TreeNode[] = new Array(count);
  const ids = [...built.ids];
  const place = [...built.place];
  const lines: LineSpec[][] = [...built.lines];
  for (const n of edited) nodes[n.id] = n;
  for (let i = 0; i < count; i++) {
    if (nodes[i]) {
      if (i >= built.ids.length) {
        // A node made in the editor: named after its number, placed in the region of the first node it is joined to.
        ids[i] = `edit.${i}`;
        const near = nodes[i].links.map((m) => built.place[m]).find((p) => p && p.region);
        place[i] = { area: 'edit', cluster: 'edit', region: near?.region ?? '' };
        nodes[i].region = near?.region as never;
        lines[i] = [];
      }
      continue;
    }
    nodes[i] = { id: i, kind: 'small', name: '(retired)', mods: [], x: 0, y: 0, links: [] };
    ids[i] = '(retired)';
    place[i] = { area: '', cluster: '', region: '' };
    lines[i] = [];
  }
  // Lines changed in the editor: the mods, and a small or attribute node's name, follow the lines.
  for (const [id, specs] of Object.entries(edits.lines ?? {})) {
    const n = nodes[Number(id)];
    if (!n || n.name === '(retired)' || n.kind === 'keystone' || n.kind === 'start') continue;
    const made = specs.map(makeLine).filter((l): l is NonNullable<typeof l> => l !== null);
    lines[n.id] = specs;
    n.mods = made.flatMap((l) => l.mods);
    if (n.kind === 'small' || n.kind === 'travel') n.name = nameOfLines(made);
  }
  return {
    ...built,
    tree: { nodes, starts: built.tree.starts, areas: built.tree.areas },
    ids,
    place,
    lines,
  };
}
