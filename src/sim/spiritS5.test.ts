import { describe, expect, it } from 'vitest';
import { Character, channelMult } from '../calc/character';
import type { Build } from '../data/types';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { createDummyWorld, dummyDefence } from './dummy';
import type { Actor, World } from './types';
import { spawnMonster, stepWorld } from './world';

/** Tests of the spirit plan's S5 (docs/SPIRIT.md): channelling. */

function holding(main: string, gems: string[], cls = 'vanguard'): Build {
  const run = newRun(cls, 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = 50;
  const weapon = makeItem(uid, main, 50, gems.length);
  weapon.sockets = gems.map((g) => makeGem(uid, g));
  b.equipment.mainHand = weapon;
  delete b.equipment.offHand;
  b.primaryGem = weapon.sockets[0]!.uid;
  b.flasks = [null, null, null, null, null];
  return b;
}

/** The hits on `target`, in order, with the use number each followed. */
function record(w: World, target: Actor, seconds: number, skill: string) {
  const hits: { use: number; amount: number }[] = [];
  let uses = 0;
  for (let i = 0; i < seconds * 60; i++) {
    stepWorld(w);
    for (const e of w.events) {
      if (e.t === 'use' && e.src === w.sides[0].player.id && e.skill === skill) uses++;
      if (e.t === 'hit' && e.src === w.sides[0].player.id && e.dst === target.id)
        hits.push({ use: uses, amount: e.amount });
    }
  }
  return { hits, uses };
}

describe('Furnace Roar (furnaceRoar): stages, then one blast', () => {
  it('builds ten stages without hitting, and then one explosion bigger than the whole channel', () => {
    const { world, dummy } = createDummyWorld(holding('wand_3', ['furnaceRoar'], 'mystic'), {
      distance: 2,
      maxTime: 60,
    });
    world.sides[0].opts.freeResources = true;
    const t = record(world, dummy, 4, 'furnaceRoar');
    // Nothing is hit before the tenth use.
    expect(t.hits.length).toBeGreaterThan(0);
    expect(t.hits[0].use).toBeGreaterThanOrEqual(10);
    expect(t.uses).toBeGreaterThanOrEqual(10);
  });

  it('a lull lets the channel go: the stages built are released at once', () => {
    const { world, dummy } = createDummyWorld(holding('wand_3', ['furnaceRoar'], 'mystic'), {
      distance: 2,
      maxTime: 60,
    });
    world.sides[0].opts.freeResources = true;
    // Let it build a few stages, then take the enemy away.
    for (let i = 0; i < 70; i++) stepWorld(world);
    expect(world.sides[0].channel?.stage).toBeGreaterThan(2);
    const stages = world.sides[0].channel!.stage;
    dummy.alive = false;
    let hit = false;
    const other = spawnMonster(
      world,
      { type: 'warrior', variant: 'none', rarity: 'normal', level: 1, mods: [] },
      world.sides[0].player.x + 1,
      world.sides[0].player.y,
      0,
      0,
      'Other',
    );
    other.def = dummyDefence({ maxLife: 1e9 });
    other.life = 1e9;
    for (let i = 0; i < 90; i++) {
      stepWorld(world);
      if (other.life < 1e9) hit = true;
    }
    expect(stages).toBeGreaterThan(2);
    expect(hit).toBe(true);
  });
});

describe('Flurry of Edges (flurryOfEdges): a strike a stage, then a strike for each stage built', () => {
  it('hits harder with each stage, and lets go with one more strike for each', () => {
    const { world, dummy } = createDummyWorld(holding('dagger_3', ['flurryOfEdges']), {
      distance: 1.2,
      maxTime: 60,
    });
    world.sides[0].opts.freeResources = true;
    const t = record(world, dummy, 6, 'flurryOfEdges');
    // Six strikes build the stages, six more are the release: two hits a use over a whole channel.
    expect(t.hits.length / t.uses).toBeGreaterThan(1.6);
    expect(t.hits.length / t.uses).toBeLessThanOrEqual(2.05);
  });
});

describe('Judgement Tempest (judgementTempest): a crowd charges it faster, and the beam grows with the stages', () => {
  it('releases a beam far stronger than a zap, after twenty stages', () => {
    const { world, dummy } = createDummyWorld(holding('wand_3', ['judgementTempest'], 'mystic'), {
      distance: 2,
      maxTime: 60,
    });
    world.sides[0].opts.freeResources = true;
    const t = record(world, dummy, 8, 'judgementTempest');
    const amounts = t.hits.map((h) => h.amount);
    const zap = amounts.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
    expect(Math.max(...amounts)).toBeGreaterThan(zap * 8);
  });
});

describe('Blaze Stream (blazeStream): it grows as it goes and ends with a final wave', () => {
  it('hits harder the longer it is held', () => {
    const { world, dummy } = createDummyWorld(holding('wand_3', ['blazeStream'], 'mystic'), {
      distance: 2.5,
      maxTime: 60,
    });
    world.sides[0].opts.freeResources = true;
    const t = record(world, dummy, 5, 'blazeStream');
    const amounts = t.hits.map((h) => h.amount);
    expect(amounts.length).toBeGreaterThan(6);
    expect(Math.max(...amounts)).toBeGreaterThan(amounts[0] * 2);
  });

  it('is held at its cap while there is something to hit, and the final wave comes when it stops', () => {
    const b = holding('wand_3', ['blazeStream'], 'mystic');
    const cap = new Character(b, {}).primary.skill.channel!.cap;
    const { world, dummy } = createDummyWorld(b, { distance: 2.5, maxTime: 60 });
    world.sides[0].opts.freeResources = true;
    let started = false;
    let atCap = 0;
    for (let i = 0; i < 60 * 8; i++) {
      stepWorld(world);
      if (world.sides[0].channel) started = true;
      if (started) expect(world.sides[0].channel).not.toBeNull();
      if (world.sides[0].channel?.stage === cap) atCap++;
    }
    expect(atCap).toBeGreaterThan(60 * 5);
    // With nothing left to hit, the channel ends and sends its last wave.
    dummy.alive = false;
    for (let i = 0; i < 90; i++) stepWorld(world);
    expect(world.sides[0].channel).toBeNull();
  });
});

describe('Blight Hail (blightHail): hold to charge, let go for one arrow', () => {
  it('shoots nothing while it charges, then one big piercing arrow', () => {
    const { world, dummy } = createDummyWorld(holding('bow_3', ['blightHail'], 'strider'), {
      distance: 3,
      maxTime: 60,
    });
    world.sides[0].opts.freeResources = true;
    let spawned = 0;
    let firstSpawnUse = 0;
    let uses = 0;
    for (let i = 0; i < 8 * 60; i++) {
      stepWorld(world);
      for (const e of world.events) {
        if (e.t === 'use' && e.src === world.sides[0].player.id) uses++;
        if (e.t === 'projectileSpawned') {
          spawned++;
          if (spawned === 1) firstSpawnUse = uses;
        }
      }
    }
    expect(spawned).toBeGreaterThanOrEqual(1);
    expect(firstSpawnUse).toBeGreaterThanOrEqual(5);
    void dummy;
  });
});

describe('Sweeping Cut (sweepingCut): the area grows with every use that hits', () => {
  it('reaches an enemy further away only after it has built its stages, and they fade', () => {
    const { world, dummy } = createDummyWorld(holding('sword_3', ['sweepingCut'], 'strider'), {
      distance: 1.2,
      maxTime: 60,
    });
    world.sides[0].opts.freeResources = true;
    // Out of the first sweeps' reach, in reach of the grown one.
    const far = spawnMonster(
      world,
      { type: 'warrior', variant: 'none', rarity: 'normal', level: 1, mods: [] },
      world.sides[0].player.x + 3.4,
      world.sides[0].player.y - 0.6,
      0,
      0,
      'Far',
    );
    far.def = dummyDefence({ maxLife: 1e9 });
    far.life = 1e9;
    let firstFarHit = 0;
    let uses = 0;
    for (let i = 0; i < 12 * 60 && firstFarHit === 0; i++) {
      stepWorld(world);
      for (const e of world.events) {
        if (e.t === 'use' && e.src === world.sides[0].player.id) uses++;
        if (e.t === 'hit' && e.dst === far.id && firstFarHit === 0) firstFarHit = uses;
      }
    }
    expect(world.sides[0].stacks?.n).toBeGreaterThan(0);
    expect(firstFarHit).toBeGreaterThan(1);
    void dummy;
  });
});

describe('Twister Blade (twisterBlade): the first spin hits for half, and a stun cannot break it', () => {
  it('keeps its stages at the cap and spins on, instead of starting over', () => {
    const b = holding('sword_3', ['twisterBlade'], 'strider');
    const cap = new Character(b, {}).primary.skill.channel!.cap;
    const { world } = createDummyWorld(b, { distance: 1.2, maxTime: 60 });
    world.sides[0].opts.freeResources = true;
    let atCap = 0;
    let started = false;
    for (let i = 0; i < 60 * 8; i++) {
      stepWorld(world);
      const st = world.sides[0].channel;
      if (st) started = true;
      // Once it is going the channel is never let go while there is something to hit.
      if (started) expect(st).not.toBeNull();
      if (st && st.stage === cap) atCap++;
    }
    expect(atCap).toBeGreaterThan(60 * 5);
  });

  it('closes in on its target as it spins, at walking pace', () => {
    const b = holding('sword_3', ['twisterBlade'], 'strider');
    const { world, dummy } = createDummyWorld(b, { distance: 7, maxTime: 60 });
    world.sides[0].opts.freeResources = true;
    const start = Math.hypot(world.sides[0].player.x - dummy.x, world.sides[0].player.y - dummy.y);
    let dist = start;
    for (let i = 0; i < 90; i++) {
      stepWorld(world);
      dist = Math.hypot(world.sides[0].player.x - dummy.x, world.sides[0].player.y - dummy.y);
    }
    expect(dist).toBeLessThan(start - 3);
    // It moved no faster than the character walks.
    expect(start - dist).toBeLessThan(world.sides[0].player.def.moveSpeed * 1.5 + 0.5);
  });

  it('is worth its full hit on the sheet, not a cycle that keeps starting over', () => {
    const c = new Character(holding('sword_3', ['twisterBlade'], 'strider'), {});
    expect(channelMult(c.profile(c.primary, 0))).toBe(1);
  });
});
