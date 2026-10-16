import { describe, expect, it } from 'vitest';
import { DEFAULT, LEGACY } from '../data/difficulty';
import { botRun } from './bot';
import { Controller } from './controller';
import { MemoryStore } from './save';

describe('the variety report (docs/ENEMIES.md section 9)', () => {
  it('a bot run records the monsters it met on each map it played', () => {
    const r = botRun('vanguard', 3, 4, { difficulty: LEGACY });
    const played = r.maps.filter((m) => m.status !== 'respite');
    expect(played.length).toBeGreaterThan(0);
    for (const m of played)
      expect(Object.values(m.met).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
  });
});

describe('the difficulty settings in the controller', () => {
  it('a new run starts at the settings chosen on the title screen', () => {
    const c = new Controller(new MemoryStore());
    expect(c.startDifficulty).toEqual(DEFAULT);
    c.setStartDifficulty({ scaling: 1.5, variance: 0 });
    c.startRun('vanguard', 1);
    expect(c.run!.difficulty).toEqual({ scaling: 1.5, base: DEFAULT.base, variance: 0 });
  });

  it('changes at camp apply to the run, are clamped, and are ignored outside camp', () => {
    const c = new Controller(new MemoryStore());
    c.startRun('vanguard', 1);
    c.setDifficulty({ scaling: 99, base: 2 });
    expect(c.run!.difficulty.scaling).toBeLessThan(99);
    expect(c.run!.difficulty.base).toBe(2);
    c.goTo('title');
    c.setDifficulty({ base: 3 });
    expect(c.run!.difficulty.base).toBe(2);
  });
});
