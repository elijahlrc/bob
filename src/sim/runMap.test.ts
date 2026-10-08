import { describe, expect, it } from 'vitest';
import { newRun, planFor } from '../run/run';
import { runMap } from './runMap';

describe('runMap determinism (§15.3)', () => {
  for (const cls of ['vanguard', 'mystic', 'strider']) {
    it(`${cls}: same seed and build give an identical event log`, () => {
      const run = newRun(cls, 4242);
      const a = runMap(planFor(run, run.offers[0]), run.build, 0);
      const b = runMap(planFor(run, run.offers[0]), run.build, 0);
      expect(a.status).not.toBe('timeout');
      expect(a.eventHash).toBe(b.eventHash);
      expect(a.ticks).toBe(b.ticks);
    });
  }

  it('different seeds diverge', () => {
    const r1 = newRun('vanguard', 1);
    const r2 = newRun('vanguard', 2);
    const a = runMap(planFor(r1, r1.offers[0]), r1.build, 0);
    const b = runMap(planFor(r2, r2.offers[0]), r2.build, 0);
    expect(a.eventHash).not.toBe(b.eventHash);
  });
});
