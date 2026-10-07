import { describe, expect, it } from 'vitest';
import { ACTIVE_GEMS, AURA_GEMS, GRANTED_GEMS } from '../data/gems';
import { DELIVERIES, activeLook, auraLook, ELEMENT_COLOR } from './skillLook';

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

  it('every aura gem looks like an aura or a herald', () => {
    for (const a of AURA_GEMS) expect(['aura', 'herald']).toContain(auraLook(a).delivery);
  });

  it('the language is used: every delivery is taken by some gem', () => {
    const used = new Set<string>([
      ...actives.map((g) => activeLook(g).delivery),
      ...AURA_GEMS.map((a) => auraLook(a).delivery),
    ]);
    const missing = DELIVERIES.filter((d) => !used.has(d));
    // A delivery nothing uses is harmless but is probably a mistake in the table.
    expect(missing).toEqual([]);
  });

  it('every element is dealt by some gem', () => {
    const seen = new Set(actives.filter((g) => !g.utility).map((g) => activeLook(g).element));
    for (let e = 0; e < 5; e++) expect(seen.has(e), `element ${e}`).toBe(true);
  });
});
