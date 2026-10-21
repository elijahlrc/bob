import { describe, expect, it } from 'vitest';
import { ACTIVE_GEMS, GRANTED_GEMS } from '../data/gems';
import { DELIVERIES, activeLook, ELEMENT_COLOR, initialsOf } from './skillLook';

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
