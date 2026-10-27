import { describe, expect, it } from 'vitest';
import { attributeEffects } from './attributes';

describe('attributeEffects', () => {
  const attrs = { str: 100, dex: 50, int: 20 };
  it('gives each attribute its own stats', () => {
    const e = attributeEffects(attrs, { strongarm: false, noEvasion: false });
    const of = (a: string) => e.filter((x) => x.attr === a).map((x) => x.mod.stat);
    expect(of('str')).toEqual(['life', 'damage']);
    expect(of('dex')).toEqual(['accuracy', 'evasion']);
    expect(of('int')).toEqual(['mana', 'es']);
  });
  it('drops dexterity evasion and adds strength to projectile attacks when asked', () => {
    const e = attributeEffects(attrs, { strongarm: true, noEvasion: true });
    expect(e.some((x) => x.mod.stat === 'evasion')).toBe(false);
    expect(e.filter((x) => x.attr === 'str')).toHaveLength(3);
  });
});
