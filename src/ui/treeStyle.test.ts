import { describe, expect, it } from 'vitest';
import { mod } from '../mods/types';
import { edgePath, NODE_RADIUS, shapeScale, toneOf } from './treeStyle';

describe('how the passive tree is drawn', () => {
  it('draws a road across rings as a line, a stretch of ring and a loop as arcs', () => {
    expect(edgePath({ x: 1000, y: 0 }, { x: 1300, y: 0 })).toMatch(/L/);
    expect(edgePath({ x: 1000, y: 0 }, { x: 990, y: 140 })).toMatch(/A99\d\.\d /);
    const loop = edgePath(
      { x: 1100, y: 10, orbit: [1000, 10] },
      { x: 1000, y: 110, orbit: [1000, 10] },
    );
    expect(loop).toMatch(/A100\.0 100\.0 0 0 1/);
    // Near the middle of the tree nothing is a ring.
    expect(edgePath({ x: 200, y: 0 }, { x: 190, y: 90 })).toMatch(/L/);
  });

  it('turns an arc the way the angle runs', () => {
    const up = edgePath({ x: 1000, y: 0 }, { x: 990, y: 140 });
    const down = edgePath({ x: 990, y: 140 }, { x: 1000, y: 0 });
    expect(up).toMatch(/ 0 0 1 /);
    expect(down).toMatch(/ 0 0 0 /);
  });

  it('colours a node by its first line that is not an attribute', () => {
    expect(toneOf({ kind: 'small', mods: [mod('life', 'inc', 5)] })).toBe('life');
    expect(toneOf({ kind: 'travel', mods: [mod('dex', 'base', 10)] })).toBe('dex');
    expect(
      toneOf({ kind: 'notable', mods: [mod('int', 'base', 10), mod('critChance', 'inc', 20)] }),
    ).toBe('crit');
    expect(
      toneOf({ kind: 'small', mods: [mod('damage', 'inc', 10, { damageTypes: ['cold'] })] }),
    ).toBe('cold');
  });

  it('keeps a floor on the size of a node on screen, and grows nothing that is already large enough', () => {
    expect(shapeScale('small', 0.22) * NODE_RADIUS.small * 0.22).toBeGreaterThanOrEqual(2.99);
    expect(shapeScale('notable', 1)).toBe(1);
    expect(shapeScale('keystone', 0.1) * NODE_RADIUS.keystone * 0.1).toBeGreaterThan(
      shapeScale('notable', 0.1) * NODE_RADIUS.notable * 0.1,
    );
  });
});
