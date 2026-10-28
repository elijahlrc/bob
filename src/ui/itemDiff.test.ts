import { describe, expect, it } from 'vitest';
import { family, familyMods } from '../data/affixes';
import type { AffixRoll, Item } from '../data/types';
import { makeFlask, makeItem } from '../gen/items';
import { compareGroups, pairSideBySide, statGroups } from './itemDiff';

let n = 93000;
const uid = () => n++;

function withAffixes(baseId: string, rolls: [string, number?][]): Item {
  const it = makeItem(uid, baseId, 84, 3, 'rare');
  it.affixes = rolls.map(([familyId, tier]) => {
    const f = family(familyId);
    const t = f.tiers[(tier ?? f.tiers.length) - 1];
    const roll: AffixRoll = {
      family: familyId,
      tier: t.tier,
      mods: familyMods(
        f,
        t.ranges.map((r) => r[1]),
      ),
    };
    return roll;
  });
  return it;
}

describe('the side-by-side compare of two items', () => {
  it('puts a stat both items have on one row, better or worse by its numbers', () => {
    expect(pairSideBySide(['+42 to maximum Life'], ['+38 to maximum Life'])).toEqual([
      { a: '+42 to maximum Life', b: '+38 to maximum Life', mark: 'better' },
    ]);
    expect(pairSideBySide(['Adds 2 to 4 Fire Damage'], ['Adds 3 to 7 Fire Damage'])[0].mark).toBe(
      'worse',
    );
    expect(pairSideBySide(['+5 to Dexterity'], ['+5 to Dexterity'])[0].mark).toBe('same');
  });

  it('fills the rows with the stats only one has, side by side, after the shared ones and with no empty rows', () => {
    const rows = pairSideBySide(
      ['+28% to Fire Resistance', '+42 to maximum Life', '+7 to Evasion Rating'],
      ['+38 to maximum Life', '+9% to Cold Resistance'],
    );
    expect(rows).toEqual([
      { a: '+42 to maximum Life', b: '+38 to maximum Life', mark: 'better' },
      { a: '+28% to Fire Resistance', b: '+9% to Cold Resistance', mark: 'apart' },
      { a: '+7 to Evasion Rating', b: undefined, mark: 'apart' },
    ]);
  });

  it("splits an item's stats into what its base gives and what its affixes give", () => {
    const plain = makeItem(uid, 'sword_5', 84, 3, 'normal');
    const fast = withAffixes('sword_5', [['aspdLocal']]);
    const g = statGroups(fast);
    expect(g.base.some((l) => /APS/.test(l))).toBe(true);
    expect(g.affix.length).toBeGreaterThan(0);
    expect(statGroups(plain).affix).toEqual([]);
    // A weapon is compared by its numbers after its own mods: the speed differs, the damage does not.
    const rows = compareGroups(fast, plain).base;
    expect(rows.find((r) => /APS/.test(r.a ?? ''))!.mark).toBe('better');
    expect(rows.find((r) => /physical/.test(r.a ?? ''))!.mark).toBe('same');
  });

  it('flasks keep what they recover apart from their affixes', () => {
    const small = makeFlask(uid, 'flask_life_1', 20);
    const big = makeFlask(uid, 'flask_life_3', 20);
    const rows = compareGroups(big, small).base;
    expect(rows[0].mark).toBe('better');
    expect(rows[0].a).toMatch(/^Recovers \d+ life$/);
  });
});
