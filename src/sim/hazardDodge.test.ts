import { describe, expect, it } from 'vitest';
import { botCamp } from '../run/bot';
import { newRun, planFor, setMap, worldOptsFor } from '../run/run';
import { runMap } from './runMap';

describe('the character dodging a warning on the ground', () => {
  it('does not run in circles shoving the monster that made it (a Skeleton Brute, map 5)', () => {
    // Before the fix the way out of a brute's cone led through the brute: the body pushed it along, the cone went with it,
    // and the character ran back and forth for as long as the brute kept swinging.
    const run = newRun('vanguard', 2);
    setMap(run, 5);
    botCamp(run);
    const plan = planFor(run, run.offers[0]);
    let px = 0;
    let py = 0;
    let lx = 0;
    let ly = 0;
    let reversals = 0;
    let worst = 0;
    let windowEnd = 10;
    runMap(plan, run.build, run.xp, worldOptsFor(run, plan), undefined, (w) => {
      const p = w.player;
      const vx = p.x - px;
      const vy = p.y - py;
      px = p.x;
      py = p.y;
      if (Math.hypot(vx, vy) > 1e-4) {
        if (lx * vx + ly * vy < 0) reversals++;
        lx = vx;
        ly = vy;
      }
      if (w.t >= windowEnd) {
        worst = Math.max(worst, reversals);
        reversals = 0;
        windowEnd += 10;
      }
    });
    // Thirty turns in ten seconds before; a normal fight has a handful.
    expect(worst).toBeLessThan(10);
  });
});
