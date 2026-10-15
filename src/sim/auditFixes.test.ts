import { describe, expect, it } from 'vitest';
import { createDummyWorld } from './dummy';
import { activeGem, buildForActive, runGem } from './gemKit';
import { stepWorld } from './world';

/** Two things the sheet audit (docs/SHEET-AUDIT.md) found in the sim and put right. */
describe('the sim, after the sheet audit', () => {
  it('Whirring Motes shock what they stand near by a fraction, not a hundred times that', () => {
    const run = runGem(activeGem('whirringMotes'), 6);
    expect(run.dummy.ail.shock).toBeGreaterThan(0);
    expect(run.dummy.ail.shock).toBeLessThan(0.5);
  });

  it('a fixed training dummy is not pushed along by a wall of ice', () => {
    const { world, dummy } = createDummyWorld(buildForActive(activeGem('glacierWall')), {
      distance: 2.5,
      fixed: true,
      maxTime: 15,
    });
    world.opts.freeResources = true;
    const x = dummy.x;
    const y = dummy.y;
    while (world.status === 'running' && world.t < 12) stepWorld(world);
    expect(Math.hypot(dummy.x - x, dummy.y - y)).toBeLessThan(0.01);
  });
});
