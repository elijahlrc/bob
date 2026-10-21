import { describe, expect, it } from 'vitest';
import { ACTIVE_GEMS } from '../data/gems';
import { createDummyWorld, dummyDefence } from './dummy';
import { buildFor, classFor, weaponFor } from './gemKit';
import type { Actor, World } from './types';
import { spawnMonster, stepWorld } from './world';

/** Skills whose travel takes time: the leap, the charge, the run and the hook (and the spin of Whirlwind Cleave). */

function arena(id: string, distance: number, lowest = false) {
  const def = ACTIVE_GEMS.find((g) => g.id === id)!;
  const build = buildFor(
    [id],
    weaponFor(def),
    classFor(def.attr),
    def.needsShield ? 'shield' : 'none',
  );
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
  m.def = dummyDefence({ maxLife: 1e10 });
  m.life = 1e10;
  m.stationary = true;
  return m;
}

/** The first use of the skill: how it moved, whether it blinked, and when the target was first hurt. */
function firstUse(w: World, dummy: Actor, seconds = 1.5) {
  const x0 = w.sides[0].player.x;
  const target0 = dummy.x;
  let lastX = x0;
  let moved = 0;
  let maxStep = 0;
  let blinks = 0;
  let hurtAt = -1;
  let gapAtHit = Infinity;
  for (let i = 0; i < 60 * seconds; i++) {
    stepWorld(w);
    blinks += w.events.filter((e) => e.t === 'blink').length;
    const dx = Math.abs(w.sides[0].player.x - lastX);
    if (dx > 1e-6) moved++;
    maxStep = Math.max(maxStep, dx);
    lastX = w.sides[0].player.x;
    if (hurtAt < 0 && dummy.life < 1e9 - 1e-6) {
      hurtAt = i / 60;
      gapAtHit = target0 - w.sides[0].player.x;
    }
  }
  return { travelled: w.sides[0].player.x - x0, moved, maxStep, blinks, hurtAt, gapAtHit };
}

describe.each(['skyfallLeap', 'bulwarkRush', 'blessedTrail', 'snagLash'])(
  '%s takes time to arrive',
  (id) => {
    it('runs at its target over the wind-up, with no blink, and the blow lands on arrival', () => {
      const { w, dummy } = arena(id, 7);
      const r = firstUse(w, dummy);
      expect(r.blinks).toBe(0);
      expect(r.travelled).toBeGreaterThan(3);
      expect(r.moved).toBeGreaterThan(8);
      expect(r.maxStep).toBeLessThan(0.6);
      // The blow comes when it has got there, not before.
      expect(r.hurtAt).toBeGreaterThan(0.15);
      expect(r.gapAtHit).toBeLessThan(2.6);
    });
  },
);

describe('Bulwark Rush', () => {
  it('hits what it runs into on the way, once, and the target when it arrives', () => {
    const { w, dummy } = arena('bulwarkRush', 9, true);
    const mid = neighbour(w, w.sides[0].player.x + 4, w.sides[0].player.y + 0.2);
    let hitsOnWay = 0;
    let last = mid.life;
    for (let i = 0; i < 60 * 0.45; i++) {
      stepWorld(w);
      if (mid.life < last - 1e-6) hitsOnWay++;
      last = mid.life;
    }
    expect(hitsOnWay).toBe(1);
    for (let i = 0; i < 60 * 0.6; i++) stepWorld(w);
    expect(dummy.life).toBeLessThan(1e9);
  });
});

describe('Whirlwind Cleave', () => {
  it('is a spin on the spot: several hits in a use, and one storm of blades', () => {
    const { w, dummy } = arena('whirlwindCleave', 1.6);
    const pulses = w.sides[0].char.profile(w.sides[0].primary, 0).pulses;
    expect(pulses).toBeGreaterThan(1);
    let hitSteps = 0;
    let last = dummy.life;
    let storms = 0;
    let uses = 0;
    for (let i = 0; i < 60 * 0.95; i++) {
      stepWorld(w);
      uses += w.events.filter((e) => e.t === 'use' && e.src === w.sides[0].player.id).length;
      storms = Math.max(storms, w.sides[0].fields.filter((f) => f.kind === 'stanceStorm').length);
      if (dummy.life < last - 1e-6) hitSteps++;
      last = dummy.life;
    }
    expect(uses).toBe(1);
    expect(storms).toBe(1);
    expect(hitSteps).toBeGreaterThanOrEqual(pulses);
  });
});

describe('a channel that pulses round the character (Twister Blade)', () => {
  it('hurts every tick but draws no burst for each: its ring stays on the character', () => {
    const { w, dummy } = arena('twisterBlade', 1.6);
    let explodes = 0;
    let hitSteps = 0;
    let last = dummy.life;
    for (let i = 0; i < 60 * 3; i++) {
      stepWorld(w);
      explodes += w.events.filter((e) => e.t === 'explode').length;
      if (dummy.life < last - 1e-6) hitSteps++;
      last = dummy.life;
    }
    expect(hitSteps).toBeGreaterThanOrEqual(5);
    expect(explodes).toBe(0);
    expect(w.sides[0].channel?.key).toBe('twisterBlade');
  });
});
