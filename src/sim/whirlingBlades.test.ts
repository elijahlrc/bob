import { describe, expect, it } from 'vitest';
import { createDummyWorld, dummyDefence } from './dummy';
import { buildFor, classFor } from './gemKit';
import type { Actor, World } from './types';
import { spawnMonster, stepWorld } from './world';

const DEX = classFor('dex');

function arena(gems: string[], distance: number, lowest = false) {
  const build = buildFor(gems, 'dagger_3', DEX);
  // The weakest enemy first, so a stronger one on the way is passed, not fought.
  if (lowest) build.strategy = { target: 'lowest' };
  const run = createDummyWorld(build, { distance, maxTime: 120 });
  const w = run.world;
  w.opts.freeResources = true;
  w.opts.godMode = true;
  run.dummy.def = dummyDefence({ maxLife: 1e9 });
  run.dummy.life = 1e9;
  return { w, dummy: run.dummy };
}

function neighbour(w: World, x: number, y: number): Actor {
  const m = spawnMonster(
    w,
    { type: 'warrior', variant: 'none', rarity: 'normal', level: 1, mods: [] },
    x,
    y,
    0,
    0,
    'Neighbour',
  );
  m.def = dummyDefence({ maxLife: 1e9 });
  m.life = 1e9;
  m.stationary = true;
  return m;
}

/** Run for `seconds`, returning how many steps each actor lost life in. */
function hitsOn(w: World, actors: Actor[], seconds: number): number[] {
  const last = actors.map((a) => a.life);
  const n = actors.map(() => 0);
  for (let i = 0; i < 60 * seconds; i++) {
    stepWorld(w);
    actors.forEach((a, k) => {
      if (a.life < last[k] - 1e-6) n[k]++;
      last[k] = a.life;
    });
  }
  return n;
}

describe('Spinning Dash (Whirling Blades)', () => {
  it('is a spin that takes time: the character runs, it does not blink', () => {
    const { w } = arena(['spinningDash'], 8);
    const x0 = w.player.x;
    let blinks = 0;
    let moved = 0;
    let lastX = x0;
    let steps = 0;
    for (let i = 0; i < 60 * 1.2; i++) {
      stepWorld(w);
      blinks += w.events.filter((e) => e.t === 'blink').length;
      const dx = Math.abs(w.player.x - lastX);
      if (dx > 1e-6) moved++;
      // No step carries it more than a fast run's reach.
      expect(dx).toBeLessThan(0.5);
      lastX = w.player.x;
      steps++;
    }
    expect(blinks).toBe(0);
    expect(w.player.x - x0).toBeGreaterThan(5);
    // The dash is spread over a good many steps, not one jump.
    expect(moved).toBeGreaterThan(15);
    expect(steps).toBeGreaterThan(0);
  });

  it('hits again and again as it goes: everything on the way, and the target when it arrives', () => {
    const { w, dummy } = arena(['spinningDash'], 9, true);
    const mid = neighbour(w, w.player.x + 4, w.player.y + 0.4);
    mid.life = 1e10;
    const [onWay, atEnd] = hitsOn(w, [mid, dummy], 1.4);
    expect(onWay).toBeGreaterThanOrEqual(2);
    expect(atEnd).toBeGreaterThanOrEqual(3);
  });

  it('keeps spinning on the spot at a target it has reached: a use is six hits', () => {
    const { w, dummy } = arena(['spinningDash'], 2);
    const [n] = hitsOn(w, [dummy], 10);
    // About 15 uses in ten seconds, six hits each (a few more or fewer at the edges of the run).
    expect(n).toBeGreaterThan(60);
    expect(n).toBeLessThan(110);
  });

  it('out-damages the plain weapon attack on a single target', () => {
    const dps = (gems: string[]) => {
      const { w, dummy } = arena(gems, 2);
      const before = dummy.life;
      for (let i = 0; i < 60 * 10; i++) stepWorld(w);
      return (before - dummy.life) / 10;
    };
    expect(dps(['spinningDash'])).toBeGreaterThan(dps([]) * 1.25);
  });

  it('counts its six hits in the character sheet', () => {
    const { w } = arena(['spinningDash'], 2);
    expect(w.char.profile(w.primary, 0).pulses).toBe(6);
  });
});
