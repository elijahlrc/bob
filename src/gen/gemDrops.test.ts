import { describe, expect, it } from 'vitest';
import { Rng } from '../core/rng';
import { ALL_GEMS, gemDef } from '../data/gems';
import { EARLY_MAPS, gemWeight, rollGem } from './loot';

let n = 1;
const uid = () => n++;

describe('gem drops', () => {
  it('the first maps offer only plain skills and supports', () => {
    const rng = new Rng(3);
    for (let i = 0; i < 400; i++) {
      const g = gemDef(rollGem(rng, uid, { classId: 'mystic', ilvl: EARLY_MAPS }).gemId);
      expect(gemWeight(g, 'mystic', EARLY_MAPS), g.id).toBeGreaterThan(0);
      if (g.kind === 'active') {
        expect(g.utility, g.id).toBeUndefined();
        expect(
          g.tags.includes('totem') || g.tags.includes('minion') || g.tags.includes('curse'),
          g.id,
        ).toBe(false);
      }
    }
  });

  it("the character's own attribute drops about twice as often", () => {
    const rng = new Rng(5);
    const counts = { str: 0, dex: 0, int: 0 };
    for (let i = 0; i < 4000; i++) {
      const g = gemDef(rollGem(rng, uid, { classId: 'mystic', ilvl: 60 }).gemId);
      for (const a of ['str', 'dex', 'int'] as const) if (g.attr === a) counts[a]++;
    }
    expect(counts.int).toBeGreaterThan(counts.str * 1.3);
    expect(counts.int).toBeGreaterThan(counts.dex * 1.3);
  });

  it('every gem can drop later in the run', () => {
    for (const g of ALL_GEMS) expect(gemWeight(g, 'vanguard', 60), g.id).toBeGreaterThan(0);
  });
});
