import { describe, expect, it } from 'vitest';
import { Character, volleyHits } from '../calc/character';
import type { Build } from '../data/types';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { createDummyWorld, dummyDefence } from './dummy';
import type { Actor, World } from './types';
import { spawnMonster, stepWorld } from './world';

/** Tests of the spirit plan's S4 (docs/SPIRIT.md): the projectile shapes. */

function holding(main: string, gems: string[], cls = 'strider'): Build {
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

/** Another enemy that soaks up damage, put in the world. */
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

/** Uses of the primary and hits on `target` over `seconds`. */
function tally(w: World, target: Actor, seconds: number, skill: string) {
  let uses = 0;
  let hits = 0;
  let spawned = 0;
  for (let i = 0; i < seconds * 60; i++) {
    stepWorld(w);
    for (const e of w.events) {
      if (e.t === 'use' && e.src === w.player.id && e.skill === skill) uses++;
      if (e.t === 'hit' && e.src === w.player.id && e.dst === target.id) hits++;
      if (e.t === 'projectileSpawned') spawned++;
    }
  }
  return { uses, hits, spawned };
}

describe('Barrage (quiverRush): the projectiles come one after another and each can hit the same enemy', () => {
  it('lands several hits on one enemy in a single use', () => {
    const { world, dummy } = createDummyWorld(holding('bow_3', ['quiverRush']), {
      distance: 2.5,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    const t = tally(world, dummy, 10, 'quiverRush');
    expect(t.uses).toBeGreaterThan(3);
    expect(t.hits / t.uses).toBeGreaterThan(3);
  });

  it('the sheet counts every projectile as a hit on the target', () => {
    const c = new Character(holding('bow_3', ['quiverRush']), {});
    const p = c.profile(c.primary, 0);
    expect(p.projMode.sequential).toBe(true);
    expect(volleyHits(p, 3)).toBe(p.projectiles);
    expect(p.projectiles).toBe(5);
  });

  it('Barrage Support makes the projectiles of another skill sequential, three more, much weaker', () => {
    const c = new Character(holding('bow_3', ['snareShot', 'rollingVolleys']), {});
    const p = c.profile(c.primary, 0);
    expect(p.projectiles).toBe(4);
    expect(p.projMode.sequential).toBe(true);
    const { world, dummy } = createDummyWorld(holding('bow_3', ['snareShot', 'rollingVolleys']), {
      distance: 2.5,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    const t = tally(world, dummy, 10, 'snareShot');
    expect(t.hits / t.uses).toBeGreaterThan(2.5);
  });
});

describe('the once-per-target rule, and its exceptions', () => {
  it('projectiles fired together hit an enemy once, even side by side or in a fan', () => {
    const { world, dummy } = createDummyWorld(holding('bow_3', ['snareShot', 'twinSalvo']), {
      distance: 2.5,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    const t = tally(world, dummy, 10, 'snareShot');
    expect(t.uses).toBeGreaterThan(3);
    expect(t.hits / t.uses).toBeLessThanOrEqual(1.05);
    expect(t.spawned / t.uses).toBeGreaterThanOrEqual(3);
  });

  it('a skill flagged to shotgun hits one enemy with several shards at close range', () => {
    const { world, dummy } = createDummyWorld(holding('sword_3', ['splinterVolley']), {
      distance: 0.9,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    const t = tally(world, dummy, 10, 'splinterVolley');
    expect(t.hits / t.uses).toBeGreaterThan(1.5);
    const c = new Character(holding('sword_3', ['splinterVolley']), {});
    const p = c.profile(c.primary, 0);
    expect(volleyHits(p, 1)).toBeGreaterThan(1.5);
    expect(volleyHits(p, 6)).toBeLessThan(volleyHits(p, 1));
  });
});

describe('Fork, Chain, Arrow Nova and Tornado Shot', () => {
  it('Fork splits the projectile in two when it hits', () => {
    const { world, dummy } = createDummyWorld(holding('bow_3', ['snareShot', 'splitShot']), {
      distance: 3,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    const t = tally(world, dummy, 8, 'snareShot');
    // The arrow, and the two it forks into when it hits.
    expect(t.spawned / t.uses).toBeGreaterThan(2);
  });

  it('Chain sends the projectile on to the next enemy', () => {
    const { world, dummy } = createDummyWorld(holding('bow_3', ['snareShot', 'ricochet']), {
      distance: 3,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    const other = neighbour(world, dummy.x + 1.5, dummy.y + 2);
    tally(world, dummy, 8, 'snareShot');
    expect(other.life).toBeLessThan(1e9);
  });

  it('Arrow Nova lands the shot at the target and sends a ring from there', () => {
    const { world, dummy } = createDummyWorld(holding('bow_3', ['snareShot', 'arrowTempest']), {
      distance: 4,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    const other = neighbour(world, dummy.x + 1.8, dummy.y);
    const behind = neighbour(world, dummy.x, dummy.y - 2.2);
    tally(world, dummy, 8, 'snareShot');
    expect(other.life).toBeLessThan(1e9);
    expect(behind.life).toBeLessThan(1e9);
  });

  it('Tornado Shot flies to the target and scatters arrows all round when it gets there', () => {
    const { world, dummy } = createDummyWorld(holding('bow_3', ['whirlShot']), {
      distance: 4,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    const others = [
      neighbour(world, dummy.x + 1.8, dummy.y),
      neighbour(world, dummy.x, dummy.y + 1.8),
      neighbour(world, dummy.x, dummy.y - 1.8),
      neighbour(world, dummy.x + 1.3, dummy.y + 1.3),
    ];
    tally(world, dummy, 12, 'whirlShot');
    expect(others.some((o) => o.life < 1e9)).toBe(true);
  });
});

describe('the strikes that send more out, and the cone', () => {
  it('Lightning Strike sends bolts from the weapon in an arc when it hits', () => {
    const { world, dummy } = createDummyWorld(holding('sword_3', ['boltCleave'], 'vanguard'), {
      distance: 1.4,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    // Twenty degrees off the line to the target, where one of the five bolts of the arc flies.
    const aside = neighbour(world, world.player.x + 3.7, world.player.y + 1.43);
    const t = tally(world, dummy, 6, 'boltCleave');
    expect(t.uses).toBeGreaterThan(2);
    expect(aside.life).toBeLessThan(1e9);
  });

  it('Frost Blades fly out from behind the struck enemy at the others near it', () => {
    const { world, dummy } = createDummyWorld(holding('sword_3', ['rimeSplinter']), {
      distance: 1.4,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    const near = neighbour(world, dummy.x + 1.5, dummy.y + 1.5);
    tally(world, dummy, 6, 'rimeSplinter');
    expect(near.life).toBeLessThan(1e9);
  });

  it('Molten Strike throws balls to the ground around the struck enemy, which burst there', () => {
    const { world, dummy } = createDummyWorld(holding('sword_3', ['slagBlow'], 'vanguard'), {
      distance: 1.4,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    const near = neighbour(world, dummy.x + 1.2, dummy.y + 0.5);
    let bursts = 0;
    for (let i = 0; i < 6 * 60; i++) {
      stepWorld(world);
      for (const e of world.events) if (e.t === 'explode') bursts++;
    }
    expect(bursts).toBeGreaterThan(2);
    expect(near.life).toBeLessThan(1e9);
  });

  it('Galvanic Arrow bursts in a cone with each shot, hitting everything in it at once', () => {
    const { world, dummy } = createDummyWorld(holding('bow_3', ['stormQuill']), {
      distance: 5,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    const beside = neighbour(world, world.player.x + 2.5, world.player.y + 0.5);
    let both = false;
    for (let i = 0; i < 3 * 60 && !both; i++) {
      stepWorld(world);
      const burst = world.events.some((e) => e.t === 'swing');
      const hitIds = world.events.flatMap((e) => (e.t === 'hit' ? [e.dst] : []));
      both = burst && hitIds.includes(beside.id) && hitIds.includes(dummy.id);
    }
    expect(both).toBe(true);
  });
});
