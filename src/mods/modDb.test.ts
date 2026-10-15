import { describe, expect, it } from 'vitest';
import { CondIndex, makeCtx, ModDB } from './modDb';
import { modsText, modText } from './text';
import {
  CONDITIONS,
  maskAnd,
  maskIntersects,
  maskOr,
  maskSubset,
  mod,
  SKILL_TAGS,
  tagBit,
} from './types';

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
    expect(db.more('damage', makeCtx({ cond: db.cond, conds: ['onLowLife'] }))).toBeCloseTo(1.3);
    expect(db.sum('inc', 'damage', makeCtx({}))).toBe(20);
    expect(db.sum('inc', 'damage', makeCtx({ cond: db.cond, conds: ['onFullLife'] }))).toBe(0);
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

describe('ModDB.extend (docs/PERFORMANCE.md)', () => {
  const base = [
    mod('damage', 'inc', 20),
    mod('damage', 'inc', 15, { tags: ['spell'] }),
    mod('damage', 'more', 10, { condition: { id: 'onLowLife' } }),
    mod('critMulti', 'override', 100),
    mod('neverCrit', 'flag', 1),
  ];
  const extra = [
    mod('damage', 'inc', 5),
    mod('damage', 'more', 30),
    mod('critMulti', 'override', 150),
    mod('alwaysHit', 'flag', 1),
    mod('life', 'base', 40, { condition: { id: 'onFullLife', not: true } }),
  ];

  it('answers as one database built from all the mods, in order', () => {
    const flat = new ModDB([...base, ...extra]);
    const parent = new ModDB(base, flat.cond);
    const child = parent.extend(extra);
    const ctxs = [
      makeCtx({}),
      makeCtx({ tags: ['spell'] }),
      makeCtx({ cond: child.cond, conds: ['onLowLife'] }),
      makeCtx({ cond: child.cond, conds: ['onFullLife'] }),
    ];
    for (const ctx of ctxs) {
      expect(child.sum('inc', 'damage', ctx)).toBe(flat.sum('inc', 'damage', ctx));
      expect(child.more('damage', ctx)).toBe(flat.more('damage', ctx));
      expect(child.calc('damage', ctx)).toBe(flat.calc('damage', ctx));
      expect(child.calc('critMulti', ctx)).toBe(150);
      expect(child.sum('base', 'life', ctx)).toBe(flat.sum('base', 'life', ctx));
      expect(child.flag('neverCrit', ctx)).toBe(true);
      expect(child.flag('alwaysHit', ctx)).toBe(true);
    }
    expect(child.has('neverCrit')).toBe(true);
    expect(child.has('alwaysHit')).toBe(true);
    expect(child.has('nothing')).toBe(false);
    expect(child.mods()).toEqual(flat.mods());
    expect(child.isConditional('damage')).toBe(true);
    expect(child.isConditional('life')).toBe(true);
    expect(child.condsUsed()).toBe(flat.condsUsed());
  });

  it('leaves the database it extends as it was', () => {
    const parent = new ModDB(base);
    parent.extend(extra);
    expect(parent.mods()).toEqual(base);
    expect(parent.sum('inc', 'damage')).toBe(20);
    expect(parent.flag('alwaysHit')).toBe(false);
    expect(parent.calc('critMulti')).toBe(100);
  });

  it('can be extended again', () => {
    const parent = new ModDB(base);
    const grandchild = parent.extend(extra).extend([mod('damage', 'inc', 1)]);
    expect(grandchild.sum('inc', 'damage')).toBe(26);
    expect(grandchild.mods()).toHaveLength(base.length + extra.length + 1);
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

describe('wide masks (tags and conditions beyond bit 31)', () => {
  it('combine, intersect and compare past 32 bits', () => {
    const hi = tagBit('warcry');
    const lo = tagBit('melee');
    expect(hi).toBeGreaterThan(2 ** 32);
    const both = maskOr(hi, lo);
    expect(maskSubset(hi, both)).toBe(true);
    expect(maskSubset(lo, both)).toBe(true);
    expect(maskSubset(both, lo)).toBe(false);
    expect(maskAnd(both, hi)).toBe(hi);
    expect(maskAnd(lo, hi)).toBe(0);
    expect(maskIntersects(both, tagBit('totem'))).toBe(false);
    expect(maskOr(2 ** 31, 1)).toBe(2 ** 31 + 1);
  });

  it('a mod tagged with a high tag matches only skills that have it', () => {
    const db = new ModDB([mod('damage', 'inc', 30, { tags: ['totem', 'projectile'] })]);
    expect(db.sum('inc', 'damage', makeCtx({ tags: ['totem', 'projectile', 'attack'] }))).toBe(30);
    expect(db.sum('inc', 'damage', makeCtx({ tags: ['totem', 'attack'] }))).toBe(0);
    expect(db.sum('inc', 'damage', makeCtx({ tags: ['projectile'] }))).toBe(0);
  });

  it('every tag has its own bit, and conditions get theirs from the index in use', () => {
    const idx = new CondIndex();
    const bits = CONDITIONS.slice(0, 30).map((c) => idx.bit(c));
    expect(new Set(bits).size).toBe(30);
    expect(idx.peek(CONDITIONS[31])).toBe(0);
    expect(idx.all).toBe(2 ** 30 - 1);
    expect(() => {
      const big = new CondIndex();
      for (let i = 0; i < 53; i++) big.bit(`c${i}` as never);
    }).toThrow();
    expect(new Set(SKILL_TAGS.map((t) => tagBit(t))).size).toBe(SKILL_TAGS.length);
    expect(new Set(CONDITIONS).size).toBe(CONDITIONS.length);
    expect(SKILL_TAGS.length).toBeLessThanOrEqual(52);
  });
});
