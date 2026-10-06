import { describe, expect, it } from 'vitest';
import { CLASSES } from '../data/classes';
import { makeItem } from '../gen/items';
import { mod } from '../mods/types';
import { newRun } from '../run/run';
import { computeCharacter, diffSheets } from './character';

describe('computeCharacter (§8.1)', () => {
  for (const cls of CLASSES) {
    it(`${cls.name} starting build produces a full sheet`, () => {
      const run = newRun(cls.id, 1);
      const s = computeCharacter(run.build);
      expect(s.attrs).toEqual(cls.attrs);
      expect(s.life).toBe(Math.round(38 + 12 + cls.attrs.str * 0.5));
      expect(s.mana).toBe(Math.round(34 + 6 + cls.attrs.int * 0.5));
      expect(s.skill.isDefault).toBe(false);
      expect(s.skill.totalDps).toBeGreaterThan(0);
      expect(s.ehp).toBeGreaterThan(s.life);
      expect(s.res).toEqual([0, 0, 0, 0, 0]);
    });
  }

  it('applies the resist penalty and caps resistances', () => {
    const run = newRun('vanguard', 1);
    const ring = makeItem(() => run.nextUid++, 'ring_fire', 10);
    ring.implicits = [mod('resist.fire', 'base', 120)];
    run.build.equipment.ring1 = ring;
    const s = computeCharacter(run.build, { resistPenalty: 30 });
    expect(s.res[3]).toBe(75);
    expect(s.res[2]).toBe(-30);
  });

  it('diffSheets reports deltas', () => {
    const run = newRun('vanguard', 1);
    const a = computeCharacter(run.build);
    const ring = makeItem(() => run.nextUid++, 'ring_fire', 10);
    run.build.equipment.ring1 = ring;
    const b = computeCharacter(run.build);
    const d = diffSheets(a, b);
    expect(d.res[3]).toBe(20);
    expect(d.ehp).toBeGreaterThan(0);
  });

  it('computes in under 5 ms', () => {
    const run = newRun('mystic', 1);
    run.build.level = 60;
    computeCharacter(run.build);
    const t0 = performance.now();
    for (let i = 0; i < 20; i++) computeCharacter(run.build);
    expect((performance.now() - t0) / 20).toBeLessThan(5);
  });
});
