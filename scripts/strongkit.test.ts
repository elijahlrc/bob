import { describe, expect, it } from 'vitest';
import { scoreBuild } from '../src/run/bot';
import { newRun } from '../src/run/run';
import { getsKit, giveStrongKit, keepRival, KIT_ILVL } from './strongkit';

describe('the strong kit for seeded bot rivals (npm run sim -- --strong-kit)', () => {
  it('goes to exactly the share asked for of any run of consecutive runs', () => {
    const of = (share: number, n: number, from = 0) =>
      Array.from({ length: n }, (_, i) => getsKit(from + i, share)).filter(Boolean).length;
    expect(of(5 / 9, 9)).toBe(5);
    expect(of(0.56, 9)).toBe(5);
    expect(of(0.5, 10, 7)).toBe(5);
    expect(of(0, 20)).toBe(0);
    expect(of(1, 20)).toBe(20);
  });

  it('keeps a kitted character only if it died below level 100; a plain one always', () => {
    const run = newRun('vanguard', 1);
    run.phase = 'dead';
    run.build.level = 64;
    expect(keepRival(run, true)).toBe(true);
    run.build.level = 100;
    expect(keepRival(run, true)).toBe(false);
    run.build.level = 80;
    run.phase = 'victory';
    expect(keepRival(run, true)).toBe(false);
    expect(keepRival(run, false)).toBe(true);
  });

  it('dresses a level 1 character in strong rares it can wear, keeps its gems, and leaves nothing of the kit in the bag', () => {
    for (const cls of ['strider', 'shade']) {
      const run = newRun(cls, 3);
      const before = scoreBuild(run, run.build);
      const gems = (run.build.equipment.mainHand?.sockets ?? []).filter((g) => g !== null).length;
      const bag = run.inventory.length;
      giveStrongKit(run);
      const worn = Object.values(run.build.equipment).filter((i) => i !== undefined);
      expect(
        worn.filter((i) => i.rarity === 'rare' && i.ilvl === KIT_ILVL).length,
      ).toBeGreaterThanOrEqual(7);
      expect(run.build.equipment.mainHand?.rarity).toBe('rare');
      expect(run.build.equipment.mainHand!.sockets.filter((g) => g !== null).length).toBe(gems);
      expect(run.inventory.filter((i) => i.kind === 'item' && i.ilvl === KIT_ILVL)).toEqual([]);
      expect(run.inventory.length).toBeLessThanOrEqual(bag + worn.length);
      expect(scoreBuild(run, run.build)).toBeGreaterThan(before * 2);
    }
  });
});
