import { describe, expect, it } from 'vitest';
import { MOD_MARKS } from './monsterMarks';
import { MONSTER_MODS } from './monsters';

describe('enemy affix marks', () => {
  it('affixes are distinguishable by colour or shape', () => {
    const seen = new Set<string>();
    for (const m of MONSTER_MODS) {
      const k = `${MOD_MARKS[m.id].color}/${MOD_MARKS[m.id].shape}`;
      expect(seen.has(k), m.id).toBe(false);
      seen.add(k);
    }
  });
});
