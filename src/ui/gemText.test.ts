import { describe, expect, it } from 'vitest';
import { ALL_GEMS } from '../data/gems';
import { gemCardData } from './gemText';

describe('gemCardData', () => {
  it('a support says which skills it will not take, so "any skill" is true', () => {
    for (const def of ALL_GEMS) {
      if (def.kind !== 'support' || !def.excludes?.length) continue;
      const line = gemCardData(def, 1).stats.find((l) => l.startsWith('Not '));
      expect(line, def.id).toBeDefined();
    }
  });

  it('scales values with level', () => {
    const def = ALL_GEMS.find((g) => g.kind === 'active')!;
    const lo = gemCardData(def, 1).stats.join('|');
    const hi = gemCardData(def, 20).stats.join('|');
    expect(hi).not.toBe(lo);
  });
});
