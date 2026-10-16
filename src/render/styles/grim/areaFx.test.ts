import { describe, expect, it } from 'vitest';
import type { Projectile } from '../../../sim/types';
import { outlinePoints, shapeOfExplode, type AreaHost } from './areaFx';
import { isLob, lobHeight } from './projectileFx';

const host: AreaHost = { project: (x, y) => ({ x, y }), rpx: (r) => r * 10, squash: () => 0.5 };

describe('the shape of an area', () => {
  it('an explode event is a circle, or the band of a strip', () => {
    expect(shapeOfExplode({ x: 3, y: 4, r: 2 })).toEqual({ kind: 'circle', x: 3, y: 4, r: 2 });
    expect(shapeOfExplode({ x: 5, y: 4, r: 1.5, strip: [3, 4, 7, 4] })).toEqual({
      kind: 'lane',
      x: 3,
      y: 4,
      x2: 7,
      y2: 4,
      half: 1.5,
    });
  });

  it('a lane has four corners, half its width either side of the line', () => {
    const q = outlinePoints(host, { kind: 'lane', x: 0, y: 0, x2: 4, y2: 0, half: 1 });
    expect(q).toHaveLength(4);
    expect(q.map((p) => [p.x, p.y])).toEqual([
      [0, 1],
      [4, 1],
      [4, -1],
      [0, -1],
    ]);
  });

  it('a wedge starts at its point and reaches its radius across its arc', () => {
    const q = outlinePoints(host, {
      kind: 'wedge',
      x: 1,
      y: 1,
      r: 2,
      facing: 0,
      half: Math.PI / 4,
    });
    expect(q[0]).toEqual({ x: 1, y: 1 });
    // Every rim point lies on the circle of the radius.
    for (const p of q.slice(1)) expect(Math.hypot(p.x - 1, p.y - 1)).toBeCloseTo(2, 5);
  });
});

const proj = (over: Partial<Projectile>, type: 'attack' | 'spell' = 'attack'): Projectile =>
  ({
    id: 1,
    x: 0,
    y: 0,
    vx: 12,
    vy: 0,
    travelled: 0,
    maxRange: 6,
    profile: { skill: { type } },
    ...over,
  }) as unknown as Projectile;

describe('what a projectile looks like', () => {
  it('a mortar shell and a nova arrow are lobs: up and down, on the ground at both ends', () => {
    expect(isLob(proj({ kind: 'mortar' }))).toBe(true);
    expect(isLob(proj({ kind: 'nova' }))).toBe(true);
    expect(isLob(proj({}))).toBe(false);
    const at = (u: number) => lobHeight(proj({ kind: 'mortar', travelled: 6 * u }));
    expect(at(0)).toBe(0);
    expect(at(1)).toBe(0);
    expect(at(0.5)).toBeGreaterThan(at(0.2));
    expect(at(0.5)).toBeGreaterThan(at(0.8));
  });
});
