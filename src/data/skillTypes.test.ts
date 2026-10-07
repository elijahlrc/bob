import { describe, expect, it } from 'vitest';
import { resolveSupports, typesAllow, typesWhy, type SupportRules } from './skillTypes';

const sup = (name: string, r: Partial<SupportRules>) => ({ name, supports: [], ...r });

describe('support rules', () => {
  it('require any of, all of, and none of', () => {
    const types = new Set(['attack', 'melee'] as const);
    expect(typesAllow(sup('any', {}), types)).toBe(true);
    expect(typesAllow(sup('a', { supports: ['spell', 'melee'] }), types)).toBe(true);
    expect(typesAllow(sup('b', { supports: ['spell'] }), types)).toBe(false);
    expect(typesAllow(sup('c', { needs: ['attack', 'melee'] }), types)).toBe(true);
    expect(typesAllow(sup('d', { needs: ['attack', 'projectile'] }), types)).toBe(false);
    expect(typesAllow(sup('e', { excludes: ['totem'] }), types)).toBe(true);
    expect(typesAllow(sup('f', { excludes: ['melee'] }), types)).toBe(false);
    expect(typesWhy(sup('g', { supports: ['spell'] }), types)).toBe('needs a spell skill');
    expect(typesWhy(sup('h', { excludes: ['melee'] }), types)).toBe('cannot support melee skills');
    expect(typesWhy(sup('i', {}), types)).toBeNull();
  });

  it('a support that adds a type changes what the others may do', () => {
    const totem = sup('totem', { supports: ['totemable'], adds: ['totem'] });
    const noTotem = sup('noTotem', { excludes: ['totem'] });
    const needsTotem = sup('needsTotem', { supports: ['totem'] });
    const fire = ['spell', 'totemable'] as const;
    // Alone: the exclusion applies, the totem-only support does not.
    let r = resolveSupports(fire, [noTotem, needsTotem]);
    expect(r.applied.map((s) => s.name)).toEqual(['noTotem']);
    // With the totem support: the totem-only support applies and the exclusion no longer does.
    r = resolveSupports(fire, [noTotem, needsTotem, totem]);
    expect(r.applied.map((s) => s.name)).toEqual(['needsTotem', 'totem']);
    expect(r.types.has('totem')).toBe(true);
    // A support never satisfies its own requirement with what it adds.
    r = resolveSupports(['spell'], [sup('self', { supports: ['totem'], adds: ['totem'] })]);
    expect(r.applied).toEqual([]);
    // Order does not matter.
    r = resolveSupports(fire, [totem, needsTotem, noTotem]);
    expect(r.applied.map((s) => s.name).sort()).toEqual(['needsTotem', 'totem']);
  });

  it('a skill that cannot be a totem gets no totem support', () => {
    const totem = sup('totem', { supports: ['totemable'], adds: ['totem'] });
    expect(resolveSupports(['attack', 'melee'], [totem]).applied).toEqual([]);
  });
});
