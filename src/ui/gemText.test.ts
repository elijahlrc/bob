import { describe, expect, it } from 'vitest';
import { ALL_GEMS } from '../data/gems';
import { gemCardData } from './gemText';

describe('gemCardData', () => {
  it('describes every gem at levels 1 and 20 without blanks', () => {
    for (const def of ALL_GEMS)
      for (const level of [1, 20]) {
        const d = gemCardData(def, level);
        expect(d.name).toBe(def.name);
        expect(d.stats.length + d.effects.length).toBeGreaterThan(0);
        for (const l of [...d.stats, ...d.effects]) expect(l).not.toMatch(/undefined|NaN|\[object/);
      }
  });

  it('scales values with level', () => {
    const def = ALL_GEMS.find((g) => g.kind === 'active')!;
    const lo = gemCardData(def, 1).stats.join('|');
    const hi = gemCardData(def, 20).stats.join('|');
    expect(hi).not.toBe(lo);
  });
});
