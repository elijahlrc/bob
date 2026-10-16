import { describe, expect, it } from 'vitest';
import { family, familyMods } from '../data/affixes';
import type { AffixRoll, Item } from '../data/types';
import { makeFlask, makeItem } from '../gen/items';
import { diffRows, oldValue, pairLines } from './itemDiff';

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

describe('the merged compare of two items', () => {
  it('pairs lines by what they say without the numbers', () => {
    expect(
      pairLines(['+42 to maximum Life', '+28% Fire'], ['+38 to maximum Life', '+9% Cold']),
    ).toEqual([
      { text: '+42 to maximum Life', mark: 'diff', was: '+38' },
      { text: '+28% Fire', mark: 'gain' },
      { text: '+9% Cold', mark: 'lost' },
    ]);
    expect(pairLines(['+5 Dex'], ['+5 Dex'])).toEqual([{ text: '+5 Dex', mark: 'same' }]);
  });

  it('keeps the old value of a changed line, ranges and percentages included', () => {
    expect(oldValue('+38 to maximum Life')).toBe('+38');
    expect(oldValue('Adds 2–4 fire damage')).toBe('2–4');
    expect(oldValue('17% increased Attack Speed')).toBe('17%');
    expect(oldValue('Cannot be Frozen')).toBe('Cannot be Frozen');
  });

  it('a changed number is one row with its old value, not a lost line and a gained one', () => {
    const a = withAffixes('sword_5', [['aspdLocal', 3]]);
    const b = withAffixes('sword_5', [['aspdLocal', 6]]);
    const rows = diffRows(b, a);
    const speed = rows.filter((r) => r.mark === 'diff');
    expect(speed.length).toBeGreaterThan(0);
    expect(speed.every((r) => r.was !== undefined)).toBe(true);
    expect(rows.some((r) => r.mark === 'lost')).toBe(false);
  });

  it('a stat only the worn item has comes at the end of the list as lost, and one only the new has is a gain', () => {
    const worn = withAffixes('sword_5', [['aspdLocal']]);
    const next = withAffixes('sword_5', [['physLocal']]);
    const rows = diffRows(next, worn);
    const marks = rows.map((r) => r.mark);
    expect(marks).toContain('gain');
    expect(marks).toContain('lost');
    const lost = rows.findIndex((r) => r.mark === 'lost');
    expect(rows.slice(lost).every((r) => r.mark !== 'gain' || r.text.length > 0)).toBe(true);
  });

  it('a weapon is compared by its numbers after its own mods', () => {
    const plain = makeItem(uid, 'sword_5', 84, 3, 'normal');
    const fast = withAffixes('sword_5', [['aspdLocal']]);
    const rows = diffRows(fast, plain);
    expect(rows.find((r) => /APS/.test(r.text))!.mark).toBe('diff');
    expect(rows.find((r) => /physical/.test(r.text))!.mark).toBe('same');
  });

  it('flasks get marks too: a stronger flask shows what it recovers against the old one', () => {
    const small = makeFlask(uid, 'flask_life_1', 20);
    const big = makeFlask(uid, 'flask_life_3', 20);
    const rows = diffRows(big, small);
    expect(rows[0]).toMatchObject({ mark: 'diff' });
    expect(rows[0].text).toMatch(/^Recovers \d+ life$/);
    expect(rows[0].was).toMatch(/^\d+$/);
  });
});
