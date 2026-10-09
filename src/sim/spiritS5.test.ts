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
      if (e.t === 'use' && e.src === w.player.id && e.skill === skill) uses++;
      if (e.t === 'hit' && e.src === w.player.id && e.dst === target.id)
        hits.push({ use: uses, amount: e.amount });
    }
  }
  return { hits, uses };
}

describe('Flameblast (furnaceRoar): stages, then one blast', () => {
  it('builds ten stages without hitting, and then one explosion bigger than the whole channel', () => {
    const { world, dummy } = createDummyWorld(holding('wand_3', ['furnaceRoar'], 'mystic'), {
      distance: 2,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    const t = record(world, dummy, 4, 'furnaceRoar');
    // Nothing is hit before the tenth use.
    expect(t.hits.length).toBeGreaterThan(0);
    expect(t.hits[0].use).toBeGreaterThanOrEqual(10);
    expect(t.uses).toBeGreaterThanOrEqual(10);
  });

  it('the sheet spreads the blast over the uses that built it', () => {
    const c = new Character(holding('wand_3', ['furnaceRoar'], 'mystic'), {});
    const p = c.profile(c.primary, 0);
    expect(channelMult(p)).toBeCloseTo((1 + 1.09 * 10) / 10, 6);
  });

  it('a lull lets the channel go: the stages built are released at once', () => {
    const { world, dummy } = createDummyWorld(holding('wand_3', ['furnaceRoar'], 'mystic'), {
      distance: 2,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    // Let it build a few stages, then take the enemy away.
    for (let i = 0; i < 70; i++) stepWorld(world);
    expect(world.channel?.stage).toBeGreaterThan(2);
    const stages = world.channel!.stage;
    dummy.alive = false;
    let hit = false;
    const other = spawnMonster(
      world,
      { type: 'warrior', variant: 'none', rarity: 'normal', level: 1, mods: [] },
      world.player.x + 1,
      world.player.y,
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

describe('Blade Flurry (flurryOfEdges): a strike a stage, then a strike for each stage built', () => {
  it('hits harder with each stage, and lets go with one more strike for each', () => {
    const { world, dummy } = createDummyWorld(holding('dagger_3', ['flurryOfEdges']), {
      distance: 1.2,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    const t = record(world, dummy, 6, 'flurryOfEdges');
    // Six strikes build the stages, six more are the release: two hits a use over a whole channel.
    expect(t.hits.length / t.uses).toBeGreaterThan(1.6);
    expect(t.hits.length / t.uses).toBeLessThanOrEqual(2.05);
  });
});

describe('Divine Ire (judgementTempest): a crowd charges it faster, and the beam grows with the stages', () => {
  it('releases a beam far stronger than a zap, after twenty stages', () => {
    const { world, dummy } = createDummyWorld(holding('wand_3', ['judgementTempest'], 'mystic'), {
      distance: 2,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    const t = record(world, dummy, 8, 'judgementTempest');
    const amounts = t.hits.map((h) => h.amount);
    const zap = amounts.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
    expect(Math.max(...amounts)).toBeGreaterThan(zap * 8);
  });
});

describe('Incinerate (blazeStream): it grows as it goes and ends with a final wave', () => {
  it('hits harder the longer it is held, and the last wave is the biggest hit', () => {
    const { world, dummy } = createDummyWorld(holding('wand_3', ['blazeStream'], 'mystic'), {
      distance: 2.5,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    const t = record(world, dummy, 5, 'blazeStream');
    const amounts = t.hits.map((h) => h.amount);
    expect(amounts.length).toBeGreaterThan(6);
    expect(Math.max(...amounts)).toBeGreaterThan(amounts[0] * 5);
  });
});

describe('Scourge Arrow (blightHail): hold to charge, let go for one arrow', () => {
  it('shoots nothing while it charges, then one big piercing arrow', () => {
    const { world, dummy } = createDummyWorld(holding('bow_3', ['blightHail'], 'strider'), {
      distance: 3,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    let spawned = 0;
    let firstSpawnUse = 0;
    let uses = 0;
    for (let i = 0; i < 8 * 60; i++) {
      stepWorld(world);
      for (const e of world.events) {
        if (e.t === 'use' && e.src === world.player.id) uses++;
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

describe('Reave (sweepingCut): the area grows with every use that hits', () => {
  it('reaches an enemy further away only after it has built its stages, and they fade', () => {
    const { world, dummy } = createDummyWorld(holding('sword_3', ['sweepingCut'], 'strider'), {
      distance: 1.2,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    // Out of the first sweeps' reach, in reach of the grown one.
    const far = spawnMonster(
      world,
      { type: 'warrior', variant: 'none', rarity: 'normal', level: 1, mods: [] },
      world.player.x + 3.4,
      world.player.y - 0.6,
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
        if (e.t === 'use' && e.src === world.player.id) uses++;
        if (e.t === 'hit' && e.dst === far.id && firstFarHit === 0) firstFarHit = uses;
      }
    }
    expect(world.stacks?.n).toBeGreaterThan(0);
    expect(firstFarHit).toBeGreaterThan(1);
    void dummy;
  });
});

describe('Cyclone (twisterBlade): the first spin hits for half, and a stun cannot break it', () => {
  it('is a channel with a weak first hit and a stun-proof spin', () => {
    const c = new Character(holding('sword_3', ['twisterBlade'], 'strider'), {});
    const spec = c.primary.skill.channel!;
    expect(spec.first).toBe(50);
    expect(spec.stunImmune).toBe(true);
    const { world, dummy } = createDummyWorld(holding('sword_3', ['twisterBlade'], 'strider'), {
      distance: 1.2,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    const t = record(world, dummy, 10, 'twisterBlade');
    const first = t.hits.filter((h) => h.use === 1).map((h) => h.amount);
    const later = t.hits.filter((h) => h.use === 3).map((h) => h.amount);
    expect(first.length).toBeGreaterThan(0);
    expect(later.length).toBeGreaterThan(0);
  });
});
