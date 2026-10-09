import { describe, expect, it } from 'vitest';
import { buildFor, classFor } from './gemKit';
import { killActor } from './combat';
import { createDummyWorld, dummyDefence } from './dummy';
import type { Actor, World } from './types';
import { spawnMonster, stepWorld } from './world';

/** Tests of the spirit plan's S11 (docs/SPIRIT.md): skills that use corpses and the weapons lying on the ground. */

const INT = classFor('int');
const DEX = classFor('dex');
const STR = classFor('str');

function monster(w: World, x: number, y: number, type = 'warrior'): Actor {
  const m = spawnMonster(
    w,
    { type: type as 'warrior', variant: 'none', rarity: 'normal', level: 10, mods: [] },
    x,
    y,
    0,
    0,
    'Dead one',
  );
  return m;
}

function world(gems: string[], distance: number, main: string, cls: string) {
  const run = createDummyWorld(buildFor(gems, main, cls), { distance, maxTime: 120 });
  run.world.opts.freeResources = true;
  run.world.opts.godMode = true;
  return run;
}

const corpseAt = (w: World, x: number, y: number, life = 400) => {
  w.corpses.push({
    id: w.nextId++,
    x,
    y,
    age: 0,
    spec: { type: 'warrior', variant: 'none', rarity: 'normal', level: 10, mods: [] },
    room: -1,
    pack: -1,
    name: 'Dead warrior',
    life,
  });
  return w.corpses[w.corpses.length - 1];
};

const run = (w: World, seconds: number) => {
  for (let i = 0; i < seconds * 60; i++) stepWorld(w);
};

describe('corpses', () => {
  it('a monster that dies leaves a corpse with the life it had', () => {
    const { world: w } = world(['crushingBlow'], 8, 'sword_3', STR);
    const m = monster(w, w.player.x + 3, w.player.y);
    const max = m.def.maxLife;
    killActor(w, m);
    const c = w.corpses.find((x) => x.id === m.id);
    expect(c).toBeDefined();
    expect(c!.life).toBe(max);
  });
});

describe('Raise Spectre (bindShade)', () => {
  it("needs a corpse, raises that monster at the gem's level, and uses the corpse up", () => {
    const { world: w, dummy } = world(['crushingBlow', 'bindShade'], 3, 'sword_3', INT);
    dummy.rarity = 'boss';
    run(w, 3);
    expect(w.minions.length).toBe(0);
    corpseAt(w, w.player.x - 1, w.player.y);
    run(w, 3);
    expect(w.minions.length).toBe(1);
    const s = w.minions[0];
    expect(s.mtype).toBe('warrior');
    expect(s.level).toBeGreaterThanOrEqual(31);
    expect(w.corpses.length).toBe(0);
  });

  it('keeps one at the first level of the gem', () => {
    const { world: w, dummy } = world(['crushingBlow', 'bindShade'], 3, 'sword_3', INT);
    dummy.rarity = 'boss';
    corpseAt(w, w.player.x - 1, w.player.y);
    corpseAt(w, w.player.x - 1.5, w.player.y);
    run(w, 6);
    expect(w.minions.length).toBe(1);
  });

  it('a spectre strikes as the monster did', () => {
    const { world: w, dummy } = world(['crushingBlow', 'bindShade'], 3, 'sword_3', INT);
    dummy.rarity = 'boss';
    corpseAt(w, w.player.x - 1, w.player.y);
    run(w, 3);
    const before = dummy.life;
    run(w, 4);
    expect(dummy.life).toBeLessThan(before);
  });
});

describe('Bodyswap (shadowSwap)', () => {
  it('goes to a corpse with enemies about it: fire bursts at both ends, the corpse bursts and is used up', () => {
    const { world: w } = world(['crushingBlow', 'shadowSwap'], 20, 'sword_3', DEX);
    const start = { x: w.player.x, y: w.player.y };
    const c = corpseAt(w, w.player.x + 6, w.player.y, 1000);
    const near = monster(w, c.x + 1, c.y);
    near.def = dummyDefence({ maxLife: 1e9 });
    near.life = 1e9;
    const near2 = monster(w, c.x - 1, c.y);
    near2.def = dummyDefence({ maxLife: 1e9 });
    near2.life = 1e9;
    let bursts = 0;
    let wide = 0;
    for (let i = 0; i < 3 * 60; i++) {
      stepWorld(w);
      for (const e of w.events)
        if (e.t === 'explode') {
          bursts++;
          wide = Math.max(wide, e.r);
        }
    }
    expect(Math.hypot(w.player.x - start.x, w.player.y - start.y)).toBeGreaterThan(4);
    expect(w.corpses.includes(c)).toBe(false);
    expect(bursts).toBeGreaterThanOrEqual(3);
    // 300% more area: twice the radius of the plain burst.
    expect(wide).toBeGreaterThan(2.5);
    // The corpse burst: 6% of 1000 life as fire on what was near.
    expect(near.life).toBeLessThan(1e9);
  });

  it('with no corpse it is a blink toward the target, with a burst where it left', () => {
    const { world: w, dummy } = world(['crushingBlow', 'shadowSwap'], 7, 'sword_3', DEX);
    const start = { x: w.player.x, y: w.player.y };
    run(w, 2);
    expect(Math.hypot(w.player.x - start.x, w.player.y - start.y)).toBeGreaterThan(2);
    expect(Math.hypot(w.player.x - dummy.x, w.player.y - dummy.y)).toBeLessThan(5);
  });
});

describe('Pyre Burst (pyreBurst)', () => {
  it('cannot be used without a corpse', () => {
    const { world: w } = world(['pyreBurst'], 4, 'wand_3', DEX);
    let uses = 0;
    for (let i = 0; i < 4 * 60; i++) {
      stepWorld(w);
      for (const e of w.events) if (e.t === 'use' && e.skill === 'pyreBurst') uses++;
    }
    expect(uses).toBe(0);
  });

  it('a corpse bursts and becomes a geyser that fires projectiles one after another for eight seconds', () => {
    const { world: w, dummy } = world(['pyreBurst'], 4, 'wand_3', DEX);
    const c = corpseAt(w, w.player.x + 3.5, w.player.y, 500);
    let geyser = false;
    let bursts = 0;
    let hits = 0;
    for (let i = 0; i < 6 * 60; i++) {
      stepWorld(w);
      if (w.fields.some((f) => f.kind === 'geyser')) geyser = true;
      for (const e of w.events) {
        if (e.t === 'explode') bursts++;
        if (e.t === 'hit' && e.dst === dummy.id) hits++;
      }
    }
    expect(geyser).toBe(true);
    expect(w.corpses.includes(c)).toBe(false);
    // About five a second for a few seconds.
    expect(bursts).toBeGreaterThan(15);
    expect(hits).toBeGreaterThan(2);
  });

  it('three geysers at most', () => {
    const { world: w } = world(['pyreBurst'], 4, 'wand_3', DEX);
    let most = 0;
    for (let i = 0; i < 20 * 60; i++) {
      if (i % 120 === 0) corpseAt(w, w.player.x + 3.5, w.player.y);
      stepWorld(w);
      most = Math.max(most, w.fields.filter((f) => f.kind === 'geyser').length);
    }
    expect(most).toBeLessThanOrEqual(3);
    expect(most).toBeGreaterThanOrEqual(1);
  });
});
