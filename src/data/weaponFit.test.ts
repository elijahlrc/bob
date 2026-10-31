import { describe, expect, it } from 'vitest';
import type { SkillTag } from '../mods/types';
import { ACTIVE_GEMS, GRANTED_GEMS } from './gems';
import { weaponBar, type WeaponHold } from './weaponFit';

const hold = (tags: SkillTag[], dualWielding = false): WeaponHold => ({
  tags: new Set(tags),
  dualWielding,
  holdingShield: false,
});

describe('weapon rules', () => {
  it('a melee attack is not used with a bow or wands, unless a bow or a wand makes it a shot', () => {
    for (const g of [...ACTIVE_GEMS, ...GRANTED_GEMS]) {
      if (g.skillType !== 'attack' || !g.tags.includes('melee')) continue;
      const b = g.behaviour;
      const shot = b.kind === 'projectile' && b.meleeUnless ? [b.meleeUnless].flat() : [];
      if (!shot.includes('bow')) expect(weaponBar(g, hold(['bow'])), `${g.id}`).not.toBeNull();
      if (!shot.includes('wand'))
        expect(weaponBar(g, hold(['wand', 'oneHand'], true)), `${g.id}`).not.toBeNull();
    }
  });
});
