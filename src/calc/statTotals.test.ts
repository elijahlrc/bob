import { describe, expect, it } from 'vitest';
import { ModDB } from '../mods/modDb';
import type { CondId, Mod } from '../mods/types';
import { statTotals } from './statTotals';

/** The Character tab's modifier totals: one multiplier per line, increases added and more multipliers multiplied. */

const totalsOf = (mods: Mod[], held: CondId[] = []) => {
  const db = new ModDB(mods);
  let conds = 0;
  for (const id of held) conds |= db.cond.peek(id);
  return statTotals(db, conds, () => 0);
};

describe('the modifier totals of the Character tab', () => {
  it('adds increases and multiplies more multipliers on the same line', () => {
    const t = totalsOf([
      { stat: 'attackSpeed', kind: 'inc', value: 30 },
      { stat: 'attackSpeed', kind: 'inc', value: 20 },
      { stat: 'attackSpeed', kind: 'more', value: 10 },
      { stat: 'attackSpeed', kind: 'more', value: 10 },
    ]);
    const as = t.find((x) => x.mod.stat === 'attackSpeed')!;
    expect(as.mult).toBeCloseTo(1.5 * 1.1 * 1.1);
    expect(as.group).toBe('offence');
  });

  it('shows the fixed lines in their order at ×1 when nothing touches them, and keeps lines apart by type and tags', () => {
    const none = totalsOf([]);
    expect(none.length).toBeGreaterThan(10);
    expect(none.every((x) => x.mult === 1)).toBe(true);
    const t = totalsOf([
      { stat: 'damage', kind: 'inc', value: 20, damageTypes: ['physical'] },
      { stat: 'damage', kind: 'inc', value: 80, damageTypes: ['fire'] },
      { stat: 'damage', kind: 'inc', value: 40, tags: ['spell'] },
      { stat: 'life', kind: 'inc', value: -50 },
    ]);
    expect(t.map((x) => x.mod.stat)).toEqual(none.map((x) => x.mod.stat));
    const off = t.filter((x) => x.group === 'offence').map((x) => x.mult);
    expect(off.slice(0, 6)).toEqual([1, 1, 1.4, 1.2, 1, 1.8]);
    expect(t.find((x) => x.mod.stat === 'life')!.mult).toBe(0.5);
  });

  it('puts a line the build has after the last fixed line of its stat, and drops it when it comes to nothing', () => {
    const t = totalsOf([
      { stat: 'damage', kind: 'inc', value: 12, tags: ['wand'] },
      { stat: 'attackSpeed', kind: 'inc', value: 10, tags: ['bow'] },
      { stat: 'attackSpeed', kind: 'inc', value: -10, tags: ['bow'] },
    ]);
    const off = t.filter((x) => x.group === 'offence');
    const wand = off.findIndex((x) => x.mod.tags?.includes('wand'));
    expect(off[wand - 1].mod.tags).toEqual(['dot']);
    expect(off[wand + 1].mod.stat).toBe('attackSpeed');
    expect(off[wand].mult).toBeCloseTo(1.12);
    expect(t.some((x) => x.mod.tags?.includes('bow'))).toBe(false);
  });

  it('drops a condition the sheet takes to hold, keeps one it does not, and leaves out local mods and nothing lines', () => {
    const t = totalsOf(
      [
        { stat: 'castSpeed', kind: 'inc', value: 10 },
        { stat: 'castSpeed', kind: 'inc', value: 15, condition: { id: 'onFullLife' } },
        { stat: 'castSpeed', kind: 'inc', value: 25, condition: { id: 'onLowLife' } },
        { stat: 'armour', kind: 'inc', value: 100, local: true },
        { stat: 'evasion', kind: 'inc', value: 10 },
        { stat: 'evasion', kind: 'inc', value: -10 },
      ],
      ['onFullLife'],
    );
    const cast = t.filter((x) => x.mod.stat === 'castSpeed');
    expect(cast).toHaveLength(2);
    expect(cast[0].mult).toBeCloseTo(1.25);
    expect(cast[1].mod.condition!.id).toBe('onLowLife');
    expect(t.find((x) => x.mod.stat === 'armour')!.mult).toBe(1);
    expect(t.find((x) => x.mod.stat === 'evasion')!.mult).toBe(1);
  });
});
