import { describe, expect, it } from 'vitest';
import { makeCtx, ModDB } from './modDb';
import { modsText, modText } from './text';
import { mod } from './types';

describe('ModDB', () => {
  it('sums increased additively and multiplies more', () => {
    const db = new ModDB([
      mod('life', 'base', 100),
      mod('life', 'inc', 20),
      mod('life', 'inc', 30),
      mod('life', 'more', 10),
      mod('life', 'more', 20),
    ]);
    expect(db.sum('inc', 'life')).toBe(50);
    expect(db.more('life')).toBeCloseTo(1.1 * 1.2);
    expect(db.calc('life')).toBeCloseTo(100 * 1.5 * 1.32);
  });

  it('reduced/less are negative values', () => {
    const db = new ModDB([
      mod('life', 'base', 100),
      mod('life', 'inc', -30),
      mod('life', 'more', -50),
    ]);
    expect(db.calc('life')).toBeCloseTo(35);
  });

  it('filters by tags (mod tags must be a subset of the use)', () => {
    const db = new ModDB([
      mod('damage', 'inc', 10),
      mod('damage', 'inc', 20, { tags: ['attack'] }),
      mod('damage', 'inc', 40, { tags: ['attack', 'melee'] }),
      mod('damage', 'inc', 80, { tags: ['spell'] }),
    ]);
    expect(db.sum('inc', 'damage', makeCtx({ tags: ['attack', 'projectile'] }))).toBe(30);
    expect(db.sum('inc', 'damage', makeCtx({ tags: ['attack', 'melee', 'strike'] }))).toBe(70);
    expect(db.sum('inc', 'damage', makeCtx({ tags: ['spell'] }))).toBe(90);
  });

  it('filters by damage-type ancestry', () => {
    const db = new ModDB([
      mod('damage', 'inc', 10, { damageTypes: ['physical'] }),
      mod('damage', 'inc', 20, { damageTypes: ['fire'] }),
      mod('damage', 'inc', 40, { damageTypes: ['fire', 'cold', 'lightning'] }),
      mod('damage', 'inc', 5),
    ]);
    // Pure physical chunk.
    expect(db.sum('inc', 'damage', makeCtx({ ancestry: ['physical'] }))).toBe(15);
    // Physical converted to fire: ancestry {physical, fire} — every mod applies.
    expect(db.sum('inc', 'damage', makeCtx({ ancestry: ['physical', 'fire'] }))).toBe(75);
    // Cold chunk: elemental + generic.
    expect(db.sum('inc', 'damage', makeCtx({ ancestry: ['cold'] }))).toBe(45);
  });

  it('evaluates conditions, including negated ones', () => {
    const db = new ModDB([
      mod('damage', 'more', 30, { condition: { id: 'onLowLife' } }),
      mod('damage', 'inc', 20, { condition: { id: 'onFullLife', not: true } }),
    ]);
    expect(db.more('damage', makeCtx({}))).toBe(1);
    expect(db.more('damage', makeCtx({ conds: ['onLowLife'] }))).toBeCloseTo(1.3);
    expect(db.sum('inc', 'damage', makeCtx({}))).toBe(20);
    expect(db.sum('inc', 'damage', makeCtx({ conds: ['onFullLife'] }))).toBe(0);
    expect(db.isConditional('damage')).toBe(true);
  });

  it('supports per-stat scaling', () => {
    const db = new ModDB([mod('damage', 'inc', 1, { per: { stat: 'str', div: 10 } })]);
    const ctx = makeCtx({ statValue: (s) => (s === 'str' ? 157 : 0) });
    expect(db.sum('inc', 'damage', ctx)).toBe(15);
  });

  it('flags and overrides', () => {
    const db = new ModDB([mod('neverCrit', 'flag', 1), mod('critMulti', 'override', 100)]);
    expect(db.flag('neverCrit')).toBe(true);
    expect(db.flag('alwaysHit')).toBe(false);
    expect(db.calc('critMulti')).toBe(100);
  });
});

describe('mod text', () => {
  it('renders common phrasings', () => {
    expect(modText(mod('life', 'base', 40))).toBe('+40 to maximum Life');
    expect(modText(mod('life', 'inc', 8))).toBe('8% increased maximum Life');
    expect(modText(mod('attackSpeed', 'inc', -15))).toBe('15% reduced Attack Speed');
    expect(modText(mod('damage', 'inc', 20, { damageTypes: ['fire'] }))).toBe(
      '20% increased Fire Damage',
    );
    expect(
      modText(mod('damage', 'more', 30, { tags: ['spell'], condition: { id: 'onLowLife' } })),
    ).toBe('30% more Damage with Spells while on Low Life');
    expect(modText(mod('resist.fire', 'base', 30))).toBe('+30% to Fire Resistance');
    expect(modText(mod('convert.physical.fire', 'base', 50))).toBe(
      '50% of Physical Damage Converted to Fire Damage',
    );
  });

  it('merges added damage ranges', () => {
    expect(
      modsText([
        mod('damage.min', 'base', 3, { damageTypes: ['fire'], tags: ['attack'] }),
        mod('damage.max', 'base', 7, { damageTypes: ['fire'], tags: ['attack'] }),
      ]),
    ).toEqual(['Adds 3 to 7 Fire Damage to Attacks']);
  });
});
