import { describe, expect, it } from 'vitest';
import {
  clampK,
  fitView,
  K_MAX,
  K_MIN,
  nearestNode,
  pinchView,
  zoomAt,
  type View,
} from './treeHit';

const nodes = [
  { id: 1, x: 0, y: 0, r: 12 },
  { id: 2, x: 110, y: 0, r: 10 },
  { id: 3, x: 0, y: 500, r: 22 },
];

describe('nearestNode', () => {
  const v: View = { x: 100, y: 100, k: 0.22 }; // a small node is about 5 px across here
  it('finds a node a finger misses by a few pixels', () => {
    // node 1 is drawn at (100, 100) with a radius of 2.6 px; the finger lands 12 px away
    expect(nearestNode(nodes, v, 112, 100, 22)).toBe(1);
  });
  it('is null on empty space', () => {
    expect(nearestNode(nodes, v, 300, 300, 22)).toBeNull();
  });
  it('picks the closer of two nodes in reach', () => {
    // nodes 1 and 2 are 24 px apart on screen: a point nearer to node 2 means node 2
    expect(nearestNode(nodes, v, 120, 100, 22)).toBe(2);
    expect(nearestNode(nodes, v, 105, 100, 22)).toBe(1);
  });
  it('uses the drawn radius when it is larger than the minimum', () => {
    const big: View = { x: 0, y: 0, k: 1.5 };
    expect(nearestNode(nodes, big, 0, 500 * 1.5 + 30, 10)).toBe(3); // 30 px away, radius 33 px
    expect(nearestNode(nodes, big, 0, 500 * 1.5 + 40, 10)).toBeNull();
  });
});

describe('pinchView', () => {
  const v: View = { x: 50, y: 20, k: 0.5 };
  it('keeps the tree point under the midpoint when only the distance changes', () => {
    const from: [{ x: number; y: number }, { x: number; y: number }] = [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
    ];
    const to: [{ x: number; y: number }, { x: number; y: number }] = [
      { x: 50, y: 100 },
      { x: 250, y: 100 },
    ];
    const out = pinchView(v, from, to);
    expect(out.k).toBeCloseTo(1, 6);
    // the tree point under (150, 100) before is still under (150, 100) after
    const tx = (150 - v.x) / v.k;
    expect(tx * out.k + out.x).toBeCloseTo(150, 6);
    expect(((100 - v.y) / v.k) * out.k + out.y).toBeCloseTo(100, 6);
  });
  it('moves with the fingers when the distance is unchanged', () => {
    const from: [{ x: number; y: number }, { x: number; y: number }] = [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
    ];
    const to: [{ x: number; y: number }, { x: number; y: number }] = [
      { x: 130, y: 120 },
      { x: 230, y: 120 },
    ];
    const out = pinchView(v, from, to);
    expect(out.k).toBeCloseTo(v.k, 6);
    expect(out.x).toBeCloseTo(v.x + 30, 6);
    expect(out.y).toBeCloseTo(v.y + 20, 6);
  });
  it('clamps the scale', () => {
    const far: [{ x: number; y: number }, { x: number; y: number }] = [
      { x: 0, y: 0 },
      { x: 1000, y: 0 },
    ];
    const near: [{ x: number; y: number }, { x: number; y: number }] = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ];
    expect(pinchView(v, near, far).k).toBe(K_MAX);
    expect(pinchView(v, far, near).k).toBe(K_MIN);
  });
});

describe('zoomAt and fitView', () => {
  it('zooms around a point', () => {
    const v: View = { x: 10, y: 10, k: 0.4 };
    const out = zoomAt(v, 2, 200, 150);
    expect(((200 - v.x) / v.k) * out.k + out.x).toBeCloseTo(200, 6);
    expect(out.k).toBeCloseTo(0.8, 6);
  });
  it('clamps', () => {
    expect(clampK(100)).toBe(K_MAX);
    expect(clampK(0)).toBe(K_MIN);
  });
  it('fits a box into the area, centred', () => {
    const v = fitView({ minX: -100, minY: -100, maxX: 100, maxY: 100 }, 400, 800, 100);
    expect(v.k).toBeCloseTo(1, 6); // 400 px wide for 400 tree units
    expect(v.x).toBeCloseTo(200, 6);
    expect(v.y).toBeCloseTo(400, 6);
  });
});
