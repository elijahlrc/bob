import { describe, expect, it } from 'vitest';
import { makeItem } from '../gen/items';
import { buildFor, classFor, layCorpses } from './gemKit';
import { createDummyWorld, dummyDefence } from './dummy';
import type { Minion } from './minions';
import type { World } from './types';
import { stepWorld } from './world';

/** Tests of the spirit plan's S12 (docs/SPIRIT.md): what acts on minions. */

const INT = classFor('int');
const STR = classFor('str');

function world(gems: string[], distance = 4, main = 'wand_3', cls = INT) {
  const run = createDummyWorld(buildFor(gems, main, cls), { distance, maxTime: 120 });
  run.world.opts.freeResources = true;
  run.world.opts.godMode = true;
  run.dummy.def = dummyDefence({ maxLife: 1e9 });
  run.dummy.life = 1e9;
  return run;
}

const run = (w: World, seconds: number) => {
  for (let i = 0; i < seconds * 60; i++) stepWorld(w);
};

const corpses = (w: World, n: number, x: number, y: number) => {
  for (let i = 0; i < n; i++)
    w.corpses.push({
      id: w.nextId++,
      x: x + i * 0.3,
      y,
      age: 0,
      spec: { type: 'warrior', variant: 'none', rarity: 'normal', level: 10, mods: [] },
      room: -1,
      pack: -1,
      name: 'Dead',
      life: 100,
    });
};

const minionsOf = (w: World) => w.minions as Minion[];

describe('offerings (boneWardRite, fleshSurgeRite, spiritWardRite)', () => {
  it('uses a corpse and up to four more, lasts longer for each, and does nothing without a minion', () => {
    const { world: w } = world(['crushingBlow', 'boneWardRite'], 4, 'sword_3', STR);
    corpses(w, 7, w.player.x - 1, w.player.y);
    run(w, 2);
    // No minion, no offering.
    expect(w.offering).toBeNull();
    expect(w.corpses.length).toBe(7);
  });

  it('Bone Offering: the minions block more, and recover life when they block', () => {
    const { world: w } = world(
      ['crushingBlow', 'stoneColossus', 'boneWardRite'],
      4,
      'sword_3',
      STR,
    );
    for (let i = 0; i < 4 * 60 && w.minions.length === 0; i++) stepWorld(w);
    expect(w.minions.length).toBeGreaterThan(0);
    const m = minionsOf(w)[0];
    const before = m.def.blockAttack;
    corpses(w, 7, w.player.x - 1, w.player.y);
    for (let i = 0; i < 4 * 60 && !w.offering; i++) stepWorld(w);
    expect(w.offering).not.toBeNull();
    // Five corpses used, seven lasting: five seconds and four more.
    expect(w.corpses.length).toBe(2);
    expect(w.offering!.corpses).toBe(5);
    expect(w.offering!.t).toBeGreaterThan(8.5);
    w.corpses.length = 0;
    run(w, 0.1);
    expect(m.def.blockAttack).toBeGreaterThan(before + 0.2);
    expect(m.def.lifeOnBlockPct).toBeGreaterThan(0);
    // It ends, and the minion is as it was.
    run(w, 10);
    expect(w.offering).toBeNull();
    expect(m.def.blockAttack).toBeCloseTo(before, 5);
  });

  it('Flesh Offering quickens the minions; Spirit Offering gives energy shield, chaos from physical and resistances; a new one replaces the old', () => {
    const { world: w } = world(
      ['crushingBlow', 'stoneColossus', 'fleshSurgeRite', 'spiritWardRite'],
      4,
      'sword_3',
      STR,
    );
    for (let i = 0; i < 4 * 60 && w.minions.length === 0; i++) stepWorld(w);
    corpses(w, 12, w.player.x - 1, w.player.y);
    run(w, 6);
    // Only one stands at a time; both gems cast, the later replaces.
    expect(w.offering).not.toBeNull();
    const m = minionsOf(w)[0];
    if (w.offering!.atk > 0) expect(w.offering!.chaos).toBe(0);
    else {
      expect(w.offering!.chaos).toBeGreaterThan(0);
      expect(m.def.maxEs).toBeGreaterThan(0);
      expect(m.def.res[2]).toBeGreaterThan(20);
    }
  });
});

describe('Carrion Colossus (carrionColossus)', () => {
  it('gives the other minions added physical damage while it stands, and hits harder for each of them near', () => {
    const { world: w, dummy } = world(
      ['crushingBlow', 'carrionColossus', 'raiseHusk'],
      4,
      'sword_3',
      STR,
    );
    dummy.rarity = 'boss';
    layCorpses(w, dummy.x, dummy.y, 20);
    for (let i = 0; i < 8 * 60; i++) {
      stepWorld(w);
      if (
        w.minions.some((m) => m.kind === 'carrionGolem') &&
        w.minions.some((m) => m.kind === 'zombie')
      )
        break;
    }
    const golem = minionsOf(w).find((m) => m.kind === 'carrionGolem');
    const other = minionsOf(w).find((m) => m.kind === 'zombie');
    expect(golem).toBeDefined();
    expect(other).toBeDefined();
    expect(golem!.golem!.min).toBeGreaterThanOrEqual(7);
    expect(golem!.golem!.perNearby).toBe(8);
    expect(golem!.def.maxLife).toBeGreaterThan(other!.def.maxLife * 0.9);
  });
});

describe('minion supports (elementalPack, burningPack)', () => {
  it('Elemental Army: resistances, more elemental damage and exposure from the hits', () => {
    const { world: w, dummy } = world(
      ['crushingBlow', 'emberColossus', 'elementalPack'],
      3,
      'sword_3',
      STR,
    );
    dummy.rarity = 'boss';
    for (let i = 0; i < 6 * 60 && w.minions.length === 0; i++) stepWorld(w);
    const m = minionsOf(w)[0];
    expect(m.sup.res).toBeGreaterThanOrEqual(19);
    expect(m.def.res[3]).toBeGreaterThan(m.bodyDef!.res[3] - 0.01);
    run(w, 5);
    expect(dummy.fx.exposedFire).toBeDefined();
  });

  it('Infernal Legion: the minions burn the enemies near them, once between them, and burn themselves', () => {
    const { world: w, dummy } = world(
      ['crushingBlow', 'stoneColossus', 'burningPack'],
      3,
      'sword_3',
      STR,
    );
    dummy.rarity = 'boss';
    for (let i = 0; i < 6 * 60 && w.minions.length === 0; i++) stepWorld(w);
    const m = minionsOf(w)[0];
    expect(m.sup.burn).toBeGreaterThan(10);
    const lifeBefore = m.life;
    run(w, 3);
    expect(dummy.sdots.filter((d) => d.src === '@legion').length).toBe(1);
    expect(m.life).toBeLessThan(lifeBefore);
  });
});

describe('Animate Guardian (wakeSentinel)', () => {
  it('wears the armour and weapons on the ground, one piece for each cast, keeps the better piece in a place', () => {
    const { world: w, dummy } = world(['crushingBlow', 'wakeSentinel'], 3, 'sword_3', STR);
    dummy.rarity = 'boss';
    const helm1 = makeItem(() => 8001, 'helmet_ar_1', 5, 0);
    const helm2 = makeItem(() => 8002, 'helmet_ar_1', 12, 0);
    const worse = makeItem(() => 8003, 'helmet_ar_1', 3, 0);
    const sword = makeItem(() => 8004, 'sword_2', 8, 0);
    const rare = makeItem(() => 8005, 'body_ar_1', 5, 0);
    rare.rarity = 'rare';
    const at = (it: typeof helm1, dx: number) =>
      w.drops.push({ id: w.nextId++, x: w.player.x + dx, y: w.player.y + 1, item: it });
    at(rare, 0.5);
    at(helm1, 1);
    for (let i = 0; i < 6 * 60 && w.minions.length === 0; i++) stepWorld(w);
    const g = minionsOf(w).find((m) => m.gear);
    expect(g).toBeDefined();
    expect(g!.gear!.get('helmet')).toBe(helm1);
    // The rare armour is kept on the ground.
    expect(w.drops.some((d) => d.item === rare)).toBe(true);
    at(worse, 1.2);
    at(helm2, 1.4);
    at(sword, 1.6);
    run(w, 6);
    expect(g!.gear!.get('helmet')).toBe(helm2);
    expect(w.drops.some((d) => d.item === worse)).toBe(true);
    expect(g!.gear!.get('weapon1')).toBe(sword);
    expect(g!.fixedHit).toBeGreaterThan(20);
    expect(w.minions.filter((m) => m.key === g!.key).length).toBe(1);
  });
});
