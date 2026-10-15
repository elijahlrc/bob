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

  it('a support says which skills it will not take, so "any skill" is true', () => {
    for (const def of ALL_GEMS) {
      if (def.kind !== 'support' || !def.excludes?.length) continue;
      const line = gemCardData(def, 1).stats.find((l) => l.startsWith('Not '));
      expect(line, def.id).toBeDefined();
    }
    const innervate = gemCardData(
      ALL_GEMS.find((g) => g.id === 'livewire')!,
      1,
    ).stats;
    expect(innervate).toContain('Supports any skill');
    expect(innervate.some((l) => l.startsWith('Not '))).toBe(false);
  });

  it('scales values with level', () => {
    const def = ALL_GEMS.find((g) => g.kind === 'active')!;
    const lo = gemCardData(def, 1).stats.join('|');
    const hi = gemCardData(def, 20).stats.join('|');
    expect(hi).not.toBe(lo);
  });

  it('says what a guard does with the charges it spends', () => {
    const def = ALL_GEMS.find((g) => g.id === 'deathlessCall')!;
    const d = gemCardData(def, 1);
    expect(d.stats.join('|')).toContain(
      'Spends up to 5 Endurance charges: each adds 20% to how long it lasts and takes 15% off the physical damage you take',
    );
  });
});
