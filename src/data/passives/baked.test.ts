import { describe, expect, it } from 'vitest';
import { buildAll } from '.';
import { PASSIVE_TREE } from './baked';

describe('the baked passive tree', () => {
  it('is the tree the area files and the editor patch build (run `npm run passives:bake` after changing them)', () => {
    const built = buildAll({ allowNew: false });
    expect(built.problems).toEqual([]);
    expect(JSON.stringify(PASSIVE_TREE)).toBe(JSON.stringify(built.tree));
  });

  it('gives every class a start, and leaves retired ids unreachable', () => {
    for (const id of ['mystic', 'shade', 'strider', 'reaver', 'vanguard', 'zealot'])
      expect(PASSIVE_TREE.nodes[PASSIVE_TREE.starts[id]].classStart).toBe(id);
    for (const n of PASSIVE_TREE.nodes)
      if (n.retired) expect(PASSIVE_TREE.nodes.some((m) => m.links.includes(n.id))).toBe(false);
  });
});
