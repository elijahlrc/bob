import { describe, expect, it } from 'vitest';
import { ACTIVE_GEMS, GRANTED_GEMS } from '../data/gems';
import type { DamageType } from '../mods/types';
import { activeGem, buildForActive } from '../sim/gemKit';
import { Character } from './character';
import { DELIVERIES, activeLook, ELEMENT_COLOR, initialsOf, profileElement } from './skillLook';

describe('icon initials', () => {
  it('skip the small joining words', () => {
    expect(initialsOf('Standard of Dread')).toBe('SD');
    expect(initialsOf('Veil of Grace')).toBe('VG');
    expect(initialsOf('Rime Drift')).toBe('RD');
  });
});

describe('skill look', () => {
  const actives = [...ACTIVE_GEMS, ...GRANTED_GEMS];

  it('every active gem has a delivery and a colour', () => {
    for (const g of actives) {
      const look = activeLook(g);
      expect(DELIVERIES, g.id).toContain(look.delivery);
      expect(look.color, g.id).toBeGreaterThan(0);
      expect(look.initials.length, g.id).toBeGreaterThan(0);
      // Damage skills carry an element, utility skills do not.
      if (g.utility) expect(look.element, g.id).toBe(-1);
      else expect(ELEMENT_COLOR[look.element], g.id).toBeDefined();
    }
  });
});

describe('the element a skill is drawn in', () => {
  const drawn = (id: string, added?: DamageType): number => {
    const b = buildForActive(activeGem(id));
    if (added)
      b.equipment.body!.uniqueMods = [
        { stat: 'damage.min', kind: 'base', value: 3, damageTypes: [added] },
        { stat: 'damage.max', kind: 'base', value: 6, damageTypes: [added] },
      ];
    const c = new Character(b, { areaLevel: 50 });
    const choice = c.actives.find((a) => a.skill.id === id)!;
    return profileElement(c.profile(choice, 0));
  };

  it('a skill that never hits is drawn in its damage over time, whatever its gear adds', () => {
    expect(drawn('searingLance', 'lightning')).toBe(3);
    expect(drawn('creepingPlague', 'cold')).toBe(4);
  });

  it('a skill that converts half its physical is drawn in the element it converts to', () => {
    expect(drawn('stormQuill')).toBe(1);
    expect(drawn('venomCut')).toBe(4);
    expect(drawn('boltCleave')).toBe(1);
  });
});
