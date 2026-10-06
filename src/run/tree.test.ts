import { describe, expect, it } from 'vitest';
import { getTree } from '../data/tree';
import { newRun, passivePoints } from './run';
import { allocate, canRemove, pathTo, refund } from './tree';

const tree = getTree();

describe('tree allocation (§5.3)', () => {
  it('paths start from the class start and skip other starts', () => {
    const start = tree.starts.vanguard;
    const nb = tree.nodes[start].links[0];
    expect(pathTo([], 'vanguard', nb)).toEqual([nb]);
    const ks = tree.nodes.find((n) => n.kind === 'keystone')!;
    const p = pathTo([], 'vanguard', ks.id)!;
    expect(p[p.length - 1]).toBe(ks.id);
    for (const id of p) expect(tree.nodes[id].kind).not.toBe('start');
    expect(pathTo([], 'vanguard', tree.starts.mystic)).toBeNull();
  });

  it('allocation spends passive points; refunds need refund points and connectivity', () => {
    const run = newRun('vanguard', 1);
    run.build.level = 6;
    expect(passivePoints(run)).toBe(5);
    const target = tree.nodes.find((n) => pathTo([], 'vanguard', n.id)?.length === 3)!;
    const got = allocate(run, target.id);
    expect(got.length).toBeGreaterThan(0);
    expect(passivePoints(run)).toBe(5 - got.length);
    // A node in the middle of the path cannot be refunded; the end can.
    if (got.length > 1) expect(canRemove(run.build.allocated, 'vanguard', got[0])).toBe(false);
    expect(refund(run, target.id)).toBe(false);
    run.refundPoints = 1;
    expect(refund(run, target.id)).toBe(true);
    expect(run.refundPoints).toBe(0);
  });

  it('cannot allocate beyond available points', () => {
    const run = newRun('vanguard', 1);
    const far = tree.nodes.find((n) => n.kind === 'keystone')!;
    expect(allocate(run, far.id)).toEqual([]);
  });
});
