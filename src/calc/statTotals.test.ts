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
    expect(t).toHaveLength(1);
    expect(t[0].mult).toBeCloseTo(1.5 * 1.1 * 1.1);
    expect(t[0].group).toBe('offence');
  });

  it('keeps lines apart by damage type and tags, and sorts the biggest effect first', () => {
    const t = totalsOf([
      { stat: 'damage', kind: 'inc', value: 20, damageTypes: ['physical'] },
      { stat: 'damage', kind: 'inc', value: 80, damageTypes: ['fire'] },
      { stat: 'damage', kind: 'inc', value: 40, tags: ['spell'] },
      { stat: 'life', kind: 'inc', value: -50 },
    ]);
    expect(t.map((x) => x.mult)).toEqual([0.5, 1.8, 1.4, 1.2]);
    expect(t[0].group).toBe('defence');
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
    expect(t).toHaveLength(2);
    const plain = t.find((x) => !x.mod.condition)!;
    expect(plain.mult).toBeCloseTo(1.25);
    expect(t.find((x) => x.mod.condition)!.mod.condition!.id).toBe('onLowLife');
  });
});
