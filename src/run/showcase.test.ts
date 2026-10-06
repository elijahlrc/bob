import { describe, expect, it } from 'vitest';
import { CLASSES } from '../data/classes';
import { Controller } from './controller';
import { MemoryStore } from './save';

describe('showcase mode', () => {
  it('starts an invulnerable map and cycles through every class', () => {
    const c = new Controller(null);
    c.startShowcase(false);
    expect(c.screen).toBe('map');
    expect(c.world?.opts.godMode).toBe(true);
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

  it('the boss showcase is a level 100 character on map 100', () => {
    const c = new Controller(null);
    c.startShowcase(true);
    expect(c.run!.map).toBe(100);
    expect(c.world!.plan.endKind).toBe('boss');
    expect(c.world!.build.level).toBe(100);
  });

  it('an invulnerable player survives a stretch of the map', () => {
    const c = new Controller(null);
    c.startShowcase(false);
    for (let i = 0; i < 300; i++) c.bus.emit('frame', { dtMs: 100 });
    expect(c.world?.player.alive ?? true).toBe(true);
  });
});

describe('visual style preference', () => {
  it('is remembered and announced', () => {
    const store = new MemoryStore();
    const c = new Controller(store);
    const seen: string[] = [];
    c.bus.on('style', ({ id }) => seen.push(id));
    expect(c.styleId).toBe('grim');
    c.setStyle('ink');
    expect(seen).toEqual(['ink']);
    expect(new Controller(store).styleId).toBe('ink');
    store.setItem('bob.style', 'nonsense');
    expect(new Controller(store).styleId).toBe('grim');
  });
});
