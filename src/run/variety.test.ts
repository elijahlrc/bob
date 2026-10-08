import { describe, expect, it } from 'vitest';
import { DEFAULT, LEGACY } from '../data/difficulty';
import { botRun } from './bot';
import { Controller } from './controller';
import { MemoryStore } from './save';
import { varietyReport } from './report';

describe('the variety report (docs/ENEMIES.md section 9)', () => {
  it('shares by faction add up, and a long stretch of one faction is reported', () => {
    const rep = varietyReport([
      {
        maps: [
          { map: 1, met: { warrior: 6, archer: 2 } },
          { map: 2, met: { warrior: 8 } },
          { map: 3, met: { shambler: 5, warrior: 1 } },
          { map: 4, met: { shambler: 4 } },
          { map: 11, met: { gnawer: 10 } },
        ],
      },
    ]).join('\n');
    expect(rep).toContain('| 1–10 | 4 |');
    expect(rep).toContain('Skeleton Warrior');
    expect(rep).toContain('| 11–20 | 1 | 0% | 0% | 0% | 0% | 100% | 0% |');
    expect(rep).toContain('Longest stretch of maps led (over 60%) by one faction: 2');
  });

  it('says so when there is nothing to report', () => {
    expect(varietyReport([{ maps: [] }]).join('')).toContain('no maps played');
  });

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
    expect(c.run!.difficulty).toEqual({ scaling: 1.5, base: 1, variance: 0 });
  });

  it('changes at camp apply to the run, are clamped, and are ignored outside camp', () => {
    const c = new Controller(new MemoryStore());
    c.startRun('vanguard', 1);
    c.setDifficulty({ scaling: 99, base: 2 });
    expect(c.run!.difficulty.scaling).toBe(2.5);
    expect(c.run!.difficulty.base).toBe(2);
    c.goTo('title');
    c.setDifficulty({ base: 3 });
    expect(c.run!.difficulty.base).toBe(2);
  });
});
