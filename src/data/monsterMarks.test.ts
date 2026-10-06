import { describe, expect, it } from 'vitest';
import { MOD_MARKS, RARITY_COLOR } from './monsterMarks';
import { MONSTER_MODS } from './monsters';

describe('enemy affix marks', () => {
  it('every monster affix has a mark and a description', () => {
    for (const m of MONSTER_MODS) {
      expect(MOD_MARKS[m.id], m.id).toBeDefined();
      expect(MOD_MARKS[m.id].desc.length).toBeGreaterThan(5);
    }
  });

  it('affixes are distinguishable by colour or shape', () => {
    const seen = new Set<string>();
    for (const m of MONSTER_MODS) {
      const k = `${MOD_MARKS[m.id].color}/${MOD_MARKS[m.id].shape}`;
      expect(seen.has(k), m.id).toBe(false);
      seen.add(k);
    }
  });

  it('has a colour for every rarity', () => {
    for (const r of ['normal', 'magic', 'rare', 'miniboss', 'boss'] as const)
      expect(RARITY_COLOR[r]).toBeGreaterThan(0);
  });
});
