import { describe, expect, it } from 'vitest';
import { family, familyMods } from '../data/affixes';
import type { AffixRoll } from '../data/types';
import { makeItem } from '../gen/items';
import { lineSummary, shortLine } from './affixText';

describe('mod lines for a bag row', () => {
  it('shortens the long forms and keeps the numbers', () => {
    expect(shortLine('+42 to maximum Life')).toBe('+42 Life');
    expect(shortLine('+14 to Dexterity')).toBe('+14 Dexterity');
    expect(shortLine('+28% to Fire Resistance')).toBe('+28% Fire Res');
    expect(shortLine('11% increased Evasion Rating')).toBe('11% Evasion Rating');
    expect(shortLine('Cannot be Frozen')).toBe('Cannot be Frozen');
  });

  it('shows the first lines of the item and says how many more there are', () => {
    let n = 94000;
    const it = makeItem(() => n++, 'body_ar_4', 60, 0, 'rare');
    const roll = (id: string): AffixRoll => {
      const f = family(id);
      const t = f.tiers[f.tiers.length - 1];
      return {
        family: id,
        tier: t.tier,
        mods: familyMods(
          f,
          t.ranges.map((r) => r[1]),
        ),
      };
    };
    it.affixes = [roll('life'), roll('fireRes'), roll('coldRes')];
    const one = lineSummary(it, 1);
    expect(one).toMatch(/Life/);
    expect(one).toMatch(/\+2$/);
    expect(lineSummary(it, 3)).not.toMatch(/\+\d+$/);
    expect(
      lineSummary(
        makeItem(() => n++, 'body_ar_4', 1),
        2,
      ),
    ).toBe('');
  });
});
