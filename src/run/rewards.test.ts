import { describe, expect, it } from 'vitest';
import { themeDef } from '../data/themes';
import { offerRewards } from './rewards';
import { newRun, setMap } from './run';
import { offersFor } from './preview';

describe('offer rewards', () => {
  it('counts the monsters of the map and totals the percentages over a plain map', () => {
    const run = newRun('vanguard', 5);
    setMap(run, 12);
    for (const o of run.offers) {
      if (o.kind !== 'map') continue;
      const r = offerRewards(run, o)!;
      const theme = themeDef(o.themeId);
      expect(r.monsters.total).toBeGreaterThan(0);
      expect(r.monsters.magic + r.monsters.rare + r.monsters.boss).toBeLessThanOrEqual(
        r.monsters.total,
      );
      // With no affixes or type, the figures are the theme's own.
      if (!o.affixes.length && o.type === 'plain') {
        expect(r.quantity).toBeCloseTo(theme.itemQuantity);
        expect(r.rarity).toBeCloseTo(theme.rareWeightMult - 1);
        expect(r.experience).toBeCloseTo(theme.xpMult - 1);
      }
    }
  });

  it('is stable for an offer and reaches the preview; a Respite has none', () => {
    const run = newRun('mystic', 9);
    setMap(run, 6);
    const a = offersFor(run);
    const b = offersFor(run);
    for (let i = 0; i < a.length; i++) {
      expect(a[i].rewards).toEqual(b[i].rewards);
      expect(a[i].kind === 'map').toBe(!!a[i].rewards);
    }
  });
});
