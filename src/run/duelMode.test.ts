import { describe, expect, it } from 'vitest';
import type { Build } from '../data/types';
import { runDuel, type DuelOpts } from '../sim/duel';
import { Controller } from './controller';
import { newRun } from './run';

/**
 * The controller's duel mode (docs/DUEL.md 5): a duel is a world of its own on the map screen. Its end is read after every tick by
 * the rules the headless runner has, it goes to its own result screen, and the run the player is on is not touched.
 */

const starter = (cls: string, seed = 1): Build => newRun(cls, seed).build;

/** The rules of F4 (no reprieves, no life curve, 90 s): two level 1 starters take minutes to go through four lives each. */
const F4: DuelOpts = { reprieves: 0, lifeCurve: false, maxTime: 90 };

/** A controller at camp with a run, as the Debug panel finds it. */
function atCamp(): Controller {
  const c = new Controller(null);
  c.startRun('vanguard', 1);
  return c;
}

/** Frames of the renderer until the duel ends (or `limit` of them have passed). */
function frames(c: Controller, dtMs: number, limit = 20000): number {
  let n = 0;
  while (c.screen === 'map' && n < limit) {
    c.bus.emit('frame', { dtMs });
    n++;
  }
  return n;
}

describe('a duel on the map screen', () => {
  it('starts a two-side world on the map screen, and steps it to an end on the result screen', () => {
    const c = atCamp();
    const a = c.run!.build;
    const b = starter('strider', 2);
    const seen: string[] = [];
    c.bus.on('mapStart', () => seen.push('start'));
    c.bus.on('mapEnd', () => seen.push('end'));
    c.startDuel(a, b, 3);
    expect(c.screen).toBe('map');
    expect(c.world!.sides).toHaveLength(2);
    expect(c.duel!.from).toBe('camp');
    expect(c.lastDuel).toBeNull();
    frames(c, 100);
    expect(c.screen).toBe('duelResult');
    expect(c.world).toBeNull();
    expect(seen).toEqual(['start', 'end']);
    const out = c.lastDuel!;
    expect(out.reports).toHaveLength(2);
    expect(out.reports[0].dealt.length).toBeGreaterThan(0);
    expect(out.seed).toBe(3);
  });

  it('ends where the headless runner ends it: the same winner, the same time, at any speed and frame size', () => {
    const a = starter('vanguard', 1);
    const b = starter('strider', 2);
    const want = runDuel(a, b, 3, F4);
    expect(want.how).toBe('death');
    for (const [speed, dtMs] of [
      [1, 16],
      [8, 100],
      [4, 55],
    ] as const) {
      const c = atCamp();
      c.startDuel(a, b, 3, F4);
      c.setSpeed(speed);
      frames(c, dtMs);
      const got = c.lastDuel!.result;
      expect(got.winner, `speed ${speed}`).toBe(want.winner);
      expect(got.how).toBe(want.how);
      // The very tick: a read once a frame would step up to a second past the end at 8×.
      expect(got.time, `speed ${speed}`).toBe(want.time);
      expect(got.sides.map((s) => s.lifeLeft)).toEqual(want.sides.map((s) => s.lifeLeft));
    }
  });

  it('ends a fight that nobody wins by the same rules too: a stall, as runDuel has it', () => {
    const a = starter('vanguard', 1);
    const b = starter('strider', 2);
    const opts = { damageScale: 0 };
    const want = runDuel(a, b, 3, opts);
    expect(want.how).not.toBe('death');
    const c = atCamp();
    c.startDuel(a, b, 3, opts);
    c.setSpeed(8);
    frames(c, 100);
    const got = c.lastDuel!.result;
    expect([got.winner, got.how, got.time]).toEqual([want.winner, want.how, want.time]);
  });

  it('leaves the run as it was: the same object, phase, map and xp, no map finished, no run ended', () => {
    const c = atCamp();
    const run = c.run!;
    const before = JSON.stringify({
      phase: run.phase,
      map: run.map,
      xp: run.xp,
      history: run.history.length,
      build: run.build,
    });
    let ended = 0;
    c.onRunEnd = () => ended++;
    c.setSpeed(8);
    c.startDuel(run.build, starter('reaver', 4), 5);
    frames(c, 100);
    expect(c.screen).toBe('duelResult');
    expect(c.run).toBe(run);
    expect(ended).toBe(0);
    expect(
      JSON.stringify({
        phase: run.phase,
        map: run.map,
        xp: run.xp,
        history: run.history.length,
        build: run.build,
      }),
    ).toBe(before);
    expect(c.lastResult).toBeNull();
    c.leaveDuel();
    expect(c.run).toBe(run);
    expect(run.phase).toBe('camp');
  });

  it('fights the same two builds again on the next seed', () => {
    const a = starter('vanguard', 1);
    const b = starter('strider', 2);
    const c = atCamp();
    c.setSpeed(8);
    c.startDuel(a, b, 10, F4);
    frames(c, 100);
    const first = c.lastDuel!;
    expect(first.seed).toBe(10);
    c.againDuel();
    expect(c.screen).toBe('map');
    expect(c.lastDuel).toBeNull();
    expect(c.duel!.seed).toBe(11);
    expect(c.world!.plan.seed).toBe(11);
    expect(c.world!.orderSeed).toBe(11);
    frames(c, 100);
    const second = c.lastDuel!;
    expect(second.seed).toBe(11);
    // A new seed is a new fight, and a fight is a pure function of its builds and seed.
    const want = runDuel(a, b, 11, F4);
    expect([second.result.winner, second.result.time]).toEqual([want.winner, want.time]);
    expect(second.result.time).not.toBe(first.result.time);
    c.againDuel();
    expect(c.duel!.seed).toBe(12);
  });

  it('Leave ends the duel with no result and goes back to camp, and so does Back from the result', () => {
    const c = atCamp();
    c.startDuel(c.run!.build, starter('strider', 2), 1);
    for (let i = 0; i < 20; i++) c.bus.emit('frame', { dtMs: 100 });
    expect(c.screen).toBe('map');
    c.leaveDuel();
    expect(c.screen).toBe('camp');
    expect(c.world).toBeNull();
    expect(c.duel).toBeNull();
    expect(c.lastDuel).toBeNull();
    // Frames after it do nothing.
    for (let i = 0; i < 5; i++) c.bus.emit('frame', { dtMs: 100 });
    expect(c.screen).toBe('camp');
    c.startDuel(c.run!.build, starter('strider', 2), 1);
    c.setSpeed(8);
    frames(c, 100);
    expect(c.screen).toBe('duelResult');
    c.leaveDuel();
    expect(c.screen).toBe('camp');
    expect(c.lastDuel).toBeNull();
  });

  it('started with no run, it goes back to the title screen and leaves no run behind', () => {
    const c = new Controller(null);
    c.startDuel(starter('mystic', 1), starter('zealot', 2), 1);
    c.setSpeed(8);
    expect(c.duel!.from).toBe('title');
    frames(c, 100);
    expect(c.screen).toBe('duelResult');
    expect(c.run).toBeNull();
    c.leaveDuel();
    expect(c.screen).toBe('title');
    expect(c.run).toBeNull();
  });

  it('plays on copies of the builds: a duel changes nobody', () => {
    const c = atCamp();
    const a = c.run!.build;
    const snapshot = JSON.stringify(a);
    c.startDuel(a, a, 2);
    c.setSpeed(8);
    frames(c, 100);
    expect(JSON.stringify(a)).toBe(snapshot);
    expect(c.duel!.a).not.toBe(a);
  });

  it('starts every fight at 1× and unpaused, Again included, and leaving puts back the speed the run had', () => {
    const c = atCamp();
    c.setSpeed(8);
    c.togglePause();
    c.startDuel(c.run!.build, starter('strider', 2), 1);
    expect([c.speed, c.paused]).toEqual([1, false]);
    c.setSpeed(4);
    frames(c, 100);
    expect(c.screen).toBe('duelResult');
    c.againDuel();
    expect([c.speed, c.paused]).toEqual([1, false]);
    c.leaveDuel();
    expect(c.screen).toBe('camp');
    expect([c.speed, c.paused]).toEqual([8, true]);
  });

  it('names the two characters (the boss bar shows the rival by it) and a map after a duel is a map again', () => {
    const c = atCamp();
    c.startDuel(c.run!.build, starter('strider', 2), 1, { names: ['You', 'Mirror'] });
    expect(c.world!.sides.map((s) => s.player.name)).toEqual(['You', 'Mirror']);
    c.leaveDuel();
    c.startMap(0);
    expect(c.screen).toBe('map');
    expect(c.duel).toBeNull();
    expect(c.world!.sides).toHaveLength(1);
  });
});
