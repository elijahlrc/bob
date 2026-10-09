import { describe, expect, it } from 'vitest';
import type { Build } from '../data/types';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { gainCharge } from './charges';
import { killActor } from './combat';
import { createDummyWorld, dummyDefence } from './dummy';
import { consecratedAt } from './fields';
import type { Actor, World } from './types';
import { spawnMonster, stepWorld } from './world';

/** Tests of the spirit plan's S6 (docs/SPIRIT.md): ground and lasting things the player's skills leave. */

function holding(main: string, gems: string[], cls = 'vanguard', body: string[] = []): Build {
  const run = newRun(cls, 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = 50;
  const weapon = makeItem(uid, main, 50, Math.max(1, gems.length));
  weapon.sockets = gems.map((g) => makeGem(uid, g));
  b.equipment.mainHand = weapon;
  delete b.equipment.offHand;
  if (body.length) {
    const armour = makeItem(uid, 'body_ar_1', 50, body.length);
    armour.sockets = body.map((g) => makeGem(uid, g));
    b.equipment.body = armour;
  }
  b.primaryGem = weapon.sockets[0]!.uid;
  b.flasks = [null, null, null, null, null];
  return b;
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
  return m;
}

describe('consecrated ground (blessedTrail)', () => {
  it('is left where the slam lands: life back for the character on it, a better chance to crit what stands on it', () => {
    const { world, dummy } = createDummyWorld(holding('mace_3', ['blessedTrail']), {
      distance: 3,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    for (let i = 0; i < 3 * 60 && world.fields.length === 0; i++) stepWorld(world);
    expect(world.fields.some((f) => f.kind === 'consecrated')).toBe(true);
    expect(consecratedAt(world, dummy.x, dummy.y)).toBe(true);
    // The character regenerates on it.
    world.opts.godMode = true;
    const f = world.fields.find((x) => x.kind === 'consecrated')!;
    world.player.x = f.x;
    world.player.y = f.y;
    world.player.life = 1;
    world.player.stunT = 1e9;
    for (let i = 0; i < 60; i++) stepWorld(world);
    expect(world.player.life).toBeGreaterThan(world.player.def.maxLife * 0.04);
    // It ends.
    for (let i = 0; i < 5 * 60; i++) stepWorld(world);
    expect(world.fields.some((x) => x.kind === 'consecrated')).toBe(false);
  });
});

describe('Cold Snap (suddenFrost): chilled ground', () => {
  it('leaves ground that grows and hurts, and a kill on it may give a Fervour charge', () => {
    const { world, dummy } = createDummyWorld(holding('wand_3', ['suddenFrost'], 'mystic'), {
      distance: 3,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    let hits = 0;
    let start = 0;
    for (let i = 0; i < 4 * 60; i++) {
      stepWorld(world);
      const f = world.fields.find((x) => x.kind === 'chilling');
      if (f && start === 0) start = f.radius;
      for (const e of world.events) if (e.t === 'hit' && e.dst === dummy.id) hits++;
    }
    expect(start).toBeGreaterThan(0);
    // The burst and then the pulses of the ground.
    expect(hits).toBeGreaterThan(3);
    const f = world.fields.find((x) => x.kind === 'chilling');
    if (f) expect(f.radius).toBeGreaterThan(f.r0);
  });

  it('gives a charge for a kill inside it', () => {
    let got = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const { world, dummy } = createDummyWorld(holding('wand_3', ['suddenFrost'], 'mystic'), {
        distance: 3,
        maxTime: 60,
        seed,
      });
      world.opts.freeResources = true;
      for (let i = 0; i < 3 * 60 && !world.fields.some((x) => x.kind === 'chilling'); i++)
        stepWorld(world);
      dummy.noReward = false;
      const f = world.fields.find((x) => x.kind === 'chilling')!;
      dummy.x = f.x;
      dummy.y = f.y;
      killActor(world, dummy);
      got += world.char.charges.fervour;
    }
    expect(got).toBeGreaterThan(0);
  });
});

describe('Earthquake (faultline): the aftershock', () => {
  it('hits again a moment later, harder', () => {
    const { world, dummy } = createDummyWorld(holding('mace_3', ['faultline']), {
      distance: 1.4,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    const hits: { t: number; amount: number }[] = [];
    for (let i = 0; i < 3 * 60; i++) {
      stepWorld(world);
      for (const e of world.events)
        if (e.t === 'hit' && e.dst === dummy.id) hits.push({ t: world.t, amount: e.amount });
    }
    expect(hits.length).toBeGreaterThanOrEqual(2);
    expect(hits[1].t - hits[0].t).toBeGreaterThan(0.7);
    expect(hits[1].t - hits[0].t).toBeLessThan(1.6);
  });
});

describe('Tectonic Slam (magmaCrack): a charge now and then', () => {
  it('spends a Grit charge on some of its uses', () => {
    const { world } = createDummyWorld(holding('mace_3', ['magmaCrack']), {
      distance: 1.4,
      maxTime: 400,
    });
    world.opts.freeResources = true;
    let spent = 0;
    let uses = 0;
    for (let i = 0; i < 300 * 60; i++) {
      if (world.char.charges.grit === 0) gainCharge(world, 'grit');
      stepWorld(world);
      for (const e of world.events) {
        if (e.t === 'spend') spent++;
        if (e.t === 'use' && e.skill === 'magmaCrack') uses++;
      }
    }
    expect(uses).toBeGreaterThan(20);
    expect(spent).toBeGreaterThan(0);
    expect(spent).toBeLessThan(uses);
  });
});

describe('Frost Wall (glacierWall)', () => {
  it('shuts tiles for a few seconds and opens them again', () => {
    const { world } = createDummyWorld(holding('wand_3', ['glacierWall'], 'mystic'), {
      distance: 3,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    const before = Array.from(world.grid.tiles).filter((t) => t === 1).length;
    let walled = 0;
    for (let i = 0; i < 2 * 60; i++) {
      stepWorld(world);
      walled = Math.max(
        walled,
        before - Array.from(world.grid.tiles).filter((t) => t === 1).length,
      );
      if (walled > 0) world.player.stunT = 1e9; // one wall only
    }
    expect(walled).toBeGreaterThan(1);
    for (let i = 0; i < 8 * 60; i++) stepWorld(world);
    expect(Array.from(world.grid.tiles).filter((t) => t === 1).length).toBe(before);
  });
});

describe('Frost Bomb (rimeCore)', () => {
  it('exposes what is near it, then bursts when its time is up', () => {
    const { world, dummy } = createDummyWorld(holding('wand_3', ['rimeCore'], 'mystic'), {
      distance: 3,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    let exposedAt = -1;
    let burstAt = -1;
    let castAt = -1;
    for (let i = 0; i < 4 * 60; i++) {
      stepWorld(world);
      if (castAt < 0 && world.fields.some((f) => f.kind === 'crystal')) castAt = world.t;
      if (exposedAt < 0 && dummy.fx.exposedCold) exposedAt = world.t;
      for (const e of world.events) if (e.t === 'explode' && burstAt < 0) burstAt = world.t;
    }
    expect(castAt).toBeGreaterThan(0);
    expect(exposedAt).toBeGreaterThanOrEqual(castAt);
    expect(dummy.fx.regenLess).toBeDefined();
    expect(burstAt - castAt).toBeGreaterThan(1.8);
    expect(burstAt - castAt).toBeLessThan(2.2);
  });
});

describe('Righteous Fire (searingMantle)', () => {
  it('burns the character through its fire resistance and never to death', () => {
    const b = holding('sword_3', ['crushingBlow'], 'vanguard', ['searingMantle']);
    const { world } = createDummyWorld(b, { distance: 9, maxTime: 60 });
    world.opts.freeResources = false;
    world.player.stunT = 1e9;
    const max = world.player.def.maxLife;
    for (let i = 0; i < 10 * 60; i++) stepWorld(world);
    expect(world.player.life).toBeLessThan(max * 0.9);
    expect(world.player.life).toBeGreaterThanOrEqual(1);
    expect(world.player.alive).toBe(true);
  });
});

describe('Herald of Thunder (stormHerald)', () => {
  it('calls bolts down on the enemies around when a shocked enemy is killed', () => {
    const b = holding('sword_3', ['crushingBlow'], 'vanguard', ['stormHerald']);
    const { world, dummy } = createDummyWorld(b, { distance: 1.4, maxTime: 60 });
    world.opts.freeResources = true;
    const other = neighbour(world, world.player.x + 2, world.player.y + 0.5);
    world.player.stunT = 1e9;
    dummy.ail.shock = 0.2;
    dummy.ail.shockT = 5;
    dummy.def = dummyDefence({ maxLife: 10 });
    dummy.life = 1;
    killActor(world, dummy);
    expect(world.fields.some((f) => f.kind === 'storm')).toBe(true);
    for (let i = 0; i < 3 * 60; i++) stepWorld(world);
    expect(other.life).toBeLessThan(1e9);
  });
});
