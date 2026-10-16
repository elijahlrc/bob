import { describe, expect, it } from 'vitest';
import { CLASSES } from '../data/classes';
import { Controller } from './controller';

describe('showcase mode', () => {
  it('starts an invulnerable map and cycles through every class', () => {
    const c = new Controller(null);
    c.startShowcase(false);
    expect(c.screen).toBe('map');
    expect(c.world?.sides[0].opts.godMode).toBe(true);
    const seen = new Set([c.run!.classId]);
    for (let i = 0; i < CLASSES.length - 1; i++) {
      c.nextShowcaseClass();
      seen.add(c.run!.classId);
    }
    expect(seen.size).toBe(CLASSES.length);
    c.exitShowcase();
    expect(c.screen).toBe('title');
    expect(c.showcase).toBeNull();
  });

  it('the boss showcase starts a boss map', () => {
    const c = new Controller(null);
    c.startShowcase(true);
    expect(c.world!.plan.endKind).toBe('boss');
  });

  it('an invulnerable player survives a stretch of the map', () => {
    const c = new Controller(null);
    c.startShowcase(false);
    for (let i = 0; i < 300; i++) c.bus.emit('frame', { dtMs: 100 });
    expect(c.world?.sides[0].player.alive ?? true).toBe(true);
  });
});
