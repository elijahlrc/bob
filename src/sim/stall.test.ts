import { describe, expect, it } from 'vitest';
import { newRun, planFor, worldOptsFor } from '../run/run';
import { botCamp } from '../run/bot';
import { finishMap } from '../run/run';
import { runMap } from './runMap';
import { createWorld, stepWorld } from './world';

describe('stall breaker', () => {
  it('drops a target that cannot be damaged, and the run carries on', () => {
    const run = newRun('strider', 3);
    const plan = planFor(run, run.offers[0]);
    const w = createWorld({ plan, build: run.build, xp: 0, opts: worldOptsFor(run, plan) });
    // Make every monster's life snap back each tick: nothing can ever be killed.
    let sawEngage = false;
    for (let i = 0; i < 60 * 120 && w.status === 'running'; i++) {
      for (const m of w.actors) if (!m.isPlayer && m.alive) m.life = m.def.maxLife;
      stepWorld(w);
      if (w.ai.mode === 'engage') sawEngage = true;
    }
    expect(sawEngage).toBe(true);
    expect(w.stats.stalls).toBeGreaterThan(0);
  });
});

describe('aggro', () => {
  it('monsters near an attacking player wake up', () => {
    const run = newRun('strider', 5);
    const plan = planFor(run, run.offers[0]);
    const w = createWorld({ plan, build: run.build, xp: 0, opts: worldOptsFor(run, plan) });
    const idle = () => w.actors.filter((a) => !a.isPlayer && a.alive && a.state === 'idle').length;
    const before = idle();
    for (let i = 0; i < 60 * 60 && w.player.action === null; i++) stepWorld(w);
    expect(before).toBeGreaterThan(0);
    expect(idle()).toBeLessThan(before);
  });
});

describe('bow campaign regression', () => {
  it('a strider never stands shooting at something it cannot hit (multi-arrow fans used to miss at range)', () => {
    // Seed 7001 used to stall repeatedly from map 11: an even arrow fan passed either side of targets ~7 tiles away.
    const run = newRun('strider', 7001);
    let stalls = 0;
    while (run.phase === 'camp' && run.map <= 16) {
      botCamp(run);
      const plan = planFor(run, run.offers[0]);
      const res = runMap(plan, run.build, run.xp, worldOptsFor(run, plan), undefined, (w) => {
        for (const e of w.events) if (e.t === 'stall') stalls++;
      });
      finishMap(run, res);
    }
    expect(stalls).toBe(0);
    // A sixteen-map campaign is a second or two of work, but the default five seconds is too tight on a busy machine.
  }, 60000);
});
