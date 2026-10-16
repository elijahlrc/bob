import { describe, expect, it } from 'vitest';
import { ACTIVE_GEMS } from '../data/gems';
import { buildForActive } from './gemKit';
import { createDummyWorld, dummyDefence } from './dummy';
import { stepWorld } from './world';

/**
 * A skill that deals no hit of its own (a debuff of damage over time) still lands on the enemies it reaches, and what a hit
 * gives the character has to follow it: charges (Static Snares), buffs and rage. Checked for every such skill.
 */

const HITLESS = ACTIVE_GEMS.filter((g) => g.dot?.hitless && !g.tags.includes('curse'));

describe('skills that deal no hit of their own still count as landing', () => {
  it('the filter finds some (so the loop below is not empty)', () => {
    expect(HITLESS.length).toBeGreaterThan(0);
  });

  for (const def of HITLESS) {
    it(`${def.name} gives the charges and buffs a hit gives`, () => {
      const b = buildForActive(def);
      b.equipment.body!.uniqueMods = [
        ...(b.equipment.body!.uniqueMods ?? []),
        { stat: 'chargeOn.hit.fervour', kind: 'base', value: 100 },
        { stat: 'buffOn.hit.onslaught', kind: 'base', value: 100 },
      ];
      const run = createDummyWorld(b, { distance: 3, maxTime: 60 });
      const w = run.world;
      w.sides[0].opts.freeResources = true;
      w.sides[0].opts.godMode = true;
      run.dummy.def = dummyDefence({ maxLife: 1e9 });
      run.dummy.life = 1e9;
      let charged = 0;
      let buffed = 0;
      for (let i = 0; i < 60 * 30; i++) {
        stepWorld(w);
        charged = Math.max(charged, w.char.charges.fervour);
        buffed = Math.max(buffed, w.sides[0].buffT.onslaught);
      }
      // Something was inflicted at all (the scenario works)...
      expect(run.dummy.sdots.length > 0 || charged > 0).toBe(true);
      // ...and a charge came with it.
      expect(charged).toBeGreaterThan(0);
      expect(buffed).toBeGreaterThan(0);
    });
  }
});
