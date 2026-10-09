import { describe, expect, it } from 'vitest';
import { ABANDON_SECONDS, AUTO_ABANDON_AFTER, DT } from '../data/constants';
import { newRun, planFor, setMap, worldOptsFor } from '../run/run';
import { woundedAbandonPolicy, canAbandon, cancelAbandon, requestAbandon } from './abandon';
import { killActor } from './combat';
import { runMap } from './runMap';
import type { World } from './types';
import { createWorld, stepWorld } from './world';

function worldAt(map: number, opts = {}): World {
  const run = newRun('vanguard', 5);
  setMap(run, map);
  const plan = planFor(run, run.offers[0]);
  return createWorld({
    plan,
    build: run.build,
    xp: 0,
    opts: { ...worldOptsFor(run, plan), ...opts },
  });
}

const steps = (w: World, seconds: number) => {
  for (let t = 0; t < seconds / DT && w.status === 'running'; t++) stepWorld(w);
};

describe('abandon (docs/MAPS.md section 7)', () => {
  it('is not available on the first four maps, on every tenth map, or once the exit is open', () => {
    for (const map of [1, 2, 3, 4, 10, 20, 50, 100])
      expect(canAbandon(worldAt(map)), `map ${map}`).toBe(false);
    for (const map of [5, 9, 11, 37, 99]) expect(canAbandon(worldAt(map)), `map ${map}`).toBe(true);
    const w = worldAt(7);
    w.exitOpen = true;
    expect(canAbandon(w)).toBe(false);
    expect(requestAbandon(w)).toBe(false);
    expect(w.abandonT).toBeNull();
  });

  it('starts a timer, keeps the map running meanwhile, and ends it as abandoned when it runs out', () => {
    const w = worldAt(7);
    expect(requestAbandon(w)).toBe(true);
    expect(w.abandonT).toBe(ABANDON_SECONDS);
    expect(requestAbandon(w)).toBe(false); // already leaving
    steps(w, ABANDON_SECONDS - 1);
    expect(w.status).toBe('running');
    expect(w.abandonT!).toBeGreaterThan(0);
    expect(w.abandonT!).toBeLessThan(1.1);
    steps(w, 2);
    expect(w.status).toBe('abandoned');
    expect(w.t).toBeCloseTo(ABANDON_SECONDS, 0);
  });

  it('can be cancelled before it finishes', () => {
    const w = worldAt(7);
    requestAbandon(w);
    steps(w, 2);
    expect(cancelAbandon(w)).toBe(true);
    expect(w.abandonT).toBeNull();
    steps(w, 6);
    expect(w.status).toBe('running');
    expect(cancelAbandon(w)).toBe(false);
  });

  it('a death during the timer is still a death', () => {
    const w = worldAt(7);
    requestAbandon(w);
    steps(w, 2);
    killActor(w, w.player);
    expect(w.status).toBe('dead');
    steps(w, 6);
    expect(w.status).toBe('dead');
  });

  it('a policy can start it, and the result keeps what was picked and the state left', () => {
    const run = newRun('vanguard', 5);
    setMap(run, 7);
    const plan = planFor(run, run.offers[0]);
    const res = runMap(plan, run.build, run.xp, {
      ...worldOptsFor(run, plan),
      abandonPolicy: () => true,
    });
    expect(res.status).toBe('abandoned');
    expect(res.time).toBeGreaterThan(ABANDON_SECONDS - 0.1);
    expect(res.time).toBeLessThan(ABANDON_SECONDS + 0.2);
    expect(res.vitals.life).toBeGreaterThan(0);
  });

  it('a policy that never fires leaves a map alone, and a plain timeout is still a timeout', () => {
    const run = newRun('vanguard', 5);
    setMap(run, 7);
    const plan = planFor(run, run.offers[0]);
    const res = runMap(plan, run.build, run.xp, {
      ...worldOptsFor(run, plan),
      abandonPolicy: () => false,
      maxTime: 3,
    });
    expect(res.status).toBe('timeout');
  });

  it('the wounded policy fires only below its life threshold', () => {
    const w = worldAt(7);
    const policy = woundedAbandonPolicy(0.3);
    expect(policy(w)).toBe(false);
    w.player.life = w.player.def.maxLife * 0.2;
    expect(policy(w)).toBe(true);
  });
});

describe('a map that drags on is left on its own', () => {
  it('after 500 seconds, on any map, with the usual few seconds to go and no way to call it off', () => {
    for (const map of [1, 10, 7]) {
      const w = worldAt(map, { godMode: true });
      w.t = AUTO_ABANDON_AFTER - 1;
      steps(w, 0.5);
      expect(w.abandonT, `map ${map}`).toBeNull();
      steps(w, 2);
      expect(w.abandonT).not.toBeNull();
      expect(w.abandonAuto).toBe(true);
      expect(cancelAbandon(w)).toBe(false);
      steps(w, ABANDON_SECONDS + 1);
      expect(w.status, `map ${map}`).toBe('abandoned');
      expect(w.t).toBeCloseTo(AUTO_ABANDON_AFTER + ABANDON_SECONDS, 0);
    }
  });

  it('not when the exit is open, and not when the map opts out', () => {
    const open = worldAt(7, { godMode: true });
    open.exitOpen = true;
    open.t = AUTO_ABANDON_AFTER + 10;
    steps(open, 1);
    expect(open.abandonT).toBeNull();
    const never = worldAt(7, { godMode: true, autoAbandonAt: Infinity });
    never.t = AUTO_ABANDON_AFTER + 10;
    steps(never, 1);
    expect(never.abandonT).toBeNull();
  });

  it('a player who is already leaving keeps the choice to stay', () => {
    const w = worldAt(7, { godMode: true });
    w.t = AUTO_ABANDON_AFTER - 3;
    expect(requestAbandon(w)).toBe(true);
    expect(w.abandonAuto).toBe(false);
    expect(cancelAbandon(w)).toBe(true);
  });
});
