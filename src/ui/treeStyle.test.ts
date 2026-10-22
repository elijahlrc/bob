import { describe, expect, it } from 'vitest';
import { mod } from '../mods/types';
import {
  AREA_K_GONE,
  areaLabelAlpha,
  edgePath,
  LABEL_K_KEYSTONE,
  LABEL_K_NOTABLE,
  MIN_SCREEN_R,
  NODE_RADIUS,
  NODE_TEXT,
  shapeScale,
  textZoom,
  toneOf,
  wrapLine,
} from './treeStyle';

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
    expect(shapeScale('small', 0.22) * NODE_RADIUS.small * 0.22).toBeGreaterThanOrEqual(
      MIN_SCREEN_R.small - 0.01,
    );
    expect(shapeScale('notable', 1)).toBe(1);
    expect(shapeScale('keystone', 0.1) * NODE_RADIUS.keystone * 0.1).toBeGreaterThan(
      shapeScale('notable', 0.1) * NODE_RADIUS.notable * 0.1,
    );
  });

  it('shows area names zoomed out and fades them before the notable names appear', () => {
    expect(areaLabelAlpha(0.05)).toBe(1);
    expect(areaLabelAlpha(LABEL_K_KEYSTONE)).toBe(1);
    const mid = areaLabelAlpha((LABEL_K_KEYSTONE + AREA_K_GONE) / 2);
    expect(mid).toBeGreaterThan(0.3);
    expect(mid).toBeLessThan(0.7);
    expect(areaLabelAlpha(AREA_K_GONE)).toBe(0);
    expect(AREA_K_GONE).toBeLessThan(LABEL_K_NOTABLE);
    for (let k = 0.1; k < 0.4; k += 0.01)
      expect(areaLabelAlpha(k + 0.01)).toBeLessThanOrEqual(areaLabelAlpha(k));
  });

  it("wraps a node's lines at spaces and shows them once they fit beside its nearest neighbour", () => {
    expect(wrapLine('12% increased Armour')).toEqual(['12% increased Armour']);
    const rows = wrapLine('15% increased Critical Strike Chance with Spells');
    expect(rows).toEqual(['15% increased Critical', 'Strike Chance with', 'Spells']);
    expect(Math.max(...rows.map((r) => r.length))).toBeLessThanOrEqual(NODE_TEXT.wrap);
    expect(wrapLine('Unbreakablewordthatislongerthanarow x')).toEqual([
      'Unbreakablewordthatislongerthanarow',
      'x',
    ]);
    // 120 px of text beside a neighbour 150 tree units away fits from a zoom of 0.8; a close neighbour waits longer,
    // and the closest zoom shows every node's lines.
    expect(textZoom(120, 150, 2)).toBeCloseTo(0.8);
    expect(textZoom(120, 100, 2)).toBeCloseTo(1.2);
    expect(textZoom(120, 400, 2)).toBeCloseTo(120 / NODE_TEXT.fit);
    expect(textZoom(120, 20, 2)).toBe(2);
  });
});
