import { describe, expect, it } from 'vitest';
import { family, familyMods } from '../data/affixes';
import { itemBase } from '../data/bases';
import type { AffixRoll, Item } from '../data/types';
import { makeItem } from '../gen/items';
import { lineMarks, weaponLine } from './ItemCard';

let n = 92000;
const uid = () => n++;

/** An item with an affix of a family at a tier, rolled to the top of its range. */
function withAffix(baseId: string, familyId: string, tier?: number): Item {
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
  const it = makeItem(uid, baseId, 84, 3, 'rare');
  it.affixes = [roll];
  return it;
}

describe('the item card', () => {
  it('the card line is the weapon after its mods, with what changed marked', () => {
    const plain = weaponLine(makeItem(uid, 'sword_5', 84))!;
    expect(plain.aug).toEqual([false, false, false]);
    expect(plain.extra).toEqual([]);
    const fast = weaponLine(withAffix('sword_5', 'aspdLocal'))!;
    expect(fast.aug).toEqual([false, true, false]);
    const hard = weaponLine(withAffix('sword_5', 'physLocal'))!;
    expect(hard.aug[0]).toBe(true);
    const base = itemBase('sword_5').weapon!;
    expect(hard.phys).not.toBe(`${base.min}–${base.max} physical`);
    const fire = weaponLine(withAffix('sword_5', 'addFireLocal'))!;
    expect(fire.extra[0]).toMatch(/fire$/);
    expect(weaponLine(makeItem(uid, 'body_ar_1', 1))).toBeNull();
  });

  it('a stat that keeps its text and changes its number is marked as changed, not as lost and gained', () => {
    const a = withAffix('sword_5', 'aspdLocal', 3);
    const b = withAffix('sword_5', 'aspdLocal', 6);
    const marks = lineMarks(b, a, 'new');
    expect([...marks.values()]).toEqual(['diff']);
  });
});
