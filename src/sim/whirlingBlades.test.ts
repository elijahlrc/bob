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
  w.sides[0].opts.freeResources = true;
  w.sides[0].opts.godMode = true;
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

describe('Spinning Dash', () => {
  it('is a spin that takes time: the character runs, it does not blink', () => {
    const { w } = arena(['spinningDash'], 8);
    const x0 = w.sides[0].player.x;
    let blinks = 0;
    let moved = 0;
    let lastX = x0;
    let steps = 0;
    for (let i = 0; i < 60 * 1.2; i++) {
      stepWorld(w);
      blinks += w.events.filter((e) => e.t === 'blink').length;
      const dx = Math.abs(w.sides[0].player.x - lastX);
      if (dx > 1e-6) moved++;
      // No step carries it more than a fast run's reach.
      expect(dx).toBeLessThan(0.5);
      lastX = w.sides[0].player.x;
      steps++;
    }
    expect(blinks).toBe(0);
    expect(w.sides[0].player.x - x0).toBeGreaterThan(5);
    // The dash is spread over a good many steps, not one jump.
    expect(moved).toBeGreaterThan(15);
    expect(steps).toBeGreaterThan(0);
  });

  it('hits everything on the way once a use, and the target when it arrives', () => {
    const { w, dummy } = arena(['spinningDash'], 9, true);
    const mid = neighbour(w, w.sides[0].player.x + 4, w.sides[0].player.y + 0.4);
    mid.life = 1e10;
    const useTime = w.sides[0].char.profile(w.sides[0].primary, 0).useTime;
    // One use's time: each enemy on the path is hit once, as in the reference game.
    const [onWay, atEnd] = hitsOn(w, [mid, dummy], useTime - 2 / 60);
    expect(onWay).toBe(1);
    expect(atEnd).toBe(1);
  });

  it("takes the time of a weapon attack and the dash's own on top", () => {
    const { w } = arena(['spinningDash'], 2);
    const ch = w.sides[0].char;
    const p = ch.profile(w.sides[0].primary, 0);
    const plain = ch.profile(ch.defaultAttack, 0);
    // The dash adds its seconds to the weapon's time (the skill and the plain attack have the same attack speed here).
    expect(p.useTime).toBeCloseTo(plain.useTime + p.skill.addedAttackTime!, 2);
  });
});
