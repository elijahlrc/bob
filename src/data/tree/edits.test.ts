import { describe, expect, it } from 'vitest';
import { checkTree } from '../../treeEditor/check';
import edits from './treeEdits.json';
import { applyEditsStable, applyTreeEdits, diffTree, type TreeEdits } from './edits';
import { getTree } from './index';
import { BAKED_TREE } from './treeBaked';

describe('hand edits to the tree', () => {
  it('a diff applied to the base gives the edited tree back (moves, kinds, new nodes, links, removals)', () => {
    const nodes = applyEditsStable(BAKED_TREE, { version: 1 });
    const [a, b, c] = nodes.filter((n) => n.kind === 'small');
    a.x += 40;
    delete a.orbit;
    b.kind = 'notable';
    b.name = 'Hand made';
    const fresh = { ...c, id: BAKED_TREE.nodes.length, x: 5, y: 6, links: [a.id] };
    nodes.push(fresh);
    a.links.push(fresh.id);
    const gone = nodes.find(
      (n) => n.kind === 'small' && n.id !== a.id && n.id !== b.id && n.id !== c.id,
    )!;
    for (const m of gone.links)
      nodes
        .find((n) => n.id === m)!
        .links.splice(nodes.find((n) => n.id === m)!.links.indexOf(gone.id), 1);
    nodes.splice(nodes.indexOf(gone), 1);
    const patch = diffTree(BAKED_TREE, nodes);
    expect(patch.remove).toEqual([gone.id]);
    expect(applyEditsStable(BAKED_TREE, JSON.parse(JSON.stringify(patch)) as TreeEdits)).toEqual(
      nodes,
    );
  });

  it('packs ids so tree.nodes[id] is the node, and links and class starts follow', () => {
    const t = applyTreeEdits(BAKED_TREE, { version: 1, remove: [20] });
    expect(t.nodes).toHaveLength(BAKED_TREE.nodes.length - 1);
    t.nodes.forEach((n, i) => {
      expect(n.id).toBe(i);
      for (const m of n.links) expect(t.nodes[m].links).toContain(i);
    });
    for (const id of Object.values(t.starts)) expect(t.nodes[id].kind).toBe('start');
  });

  it('the saved edits leave a tree every class can walk all of', () => {
    expect(edits.version).toBe(1);
    const t = getTree();
    const c = checkTree(t.nodes, t.starts);
    expect(c.unreachable).toEqual(Object.fromEntries(Object.keys(t.starts).map((k) => [k, 0])));
    expect(c.loose).toEqual([]);
  });
});
