import { describe, expect, it } from 'vitest';
import type { MonsterSpec } from '../calc/monster';
import type { MonsterTypeId } from '../data/monsters';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { killActor } from './combat';
import { createDummyWorld } from './dummy';
import { isZone } from './factions';
import { telegraphs } from './telegraph';
import type { Actor, World } from './types';
import { spawnMonster, stepWorld } from './world';

/** A level 40 character, frozen to the spot and deathless, in an open arena with no dummies. */
function arena(): World {
  const run = newRun('vanguard', 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = 40;
  b.equipment.mainHand = makeItem(uid, 'mace2_3', 40, 1);
  b.equipment.mainHand.sockets = [makeGem(uid, 'crushingBlow')];
  b.primaryGem = b.equipment.mainHand.sockets[0]!.uid;
  delete b.equipment.offHand;
  const { world } = createDummyWorld(b, { distance: 30 });
  world.player.stunT = 1e9;
  world.opts.godMode = true;
  for (const a of world.actors) if (a.dummy) a.alive = false;
  return world;
}

function put(
  w: World,
  type: MonsterTypeId,
  dx: number,
  dy = 0,
  over: Partial<MonsterSpec> = {},
): Actor {
  const spec: MonsterSpec = {
    type,
    variant: 'none',
    rarity: 'normal',
    level: 30,
    mods: [],
    ...over,
  };
  const m = spawnMonster(w, spec, w.player.x + dx, w.player.y + dy, 0, 0, type);
  m.state = 'chase';
  return m;
}

const run = (w: World, seconds: number) => {
  for (let i = 0; i < seconds * 60; i++) stepWorld(w);
};

describe('the Emberborn in play', () => {
  it('a Slag Brute leaves burning ground behind it as it walks', () => {
    const w = arena();
    put(w, 'slagbrute', 14);
    run(w, 5);
    const pools = w.effects.filter((e) => isZone(e) && e.kind === 'burning');
    expect(pools.length).toBeGreaterThanOrEqual(2);
  });

  it('a Cinderling burns out where it falls', () => {
    const w = arena();
    const c = put(w, 'cinderling', 10);
    expect(w.effects.some((e) => e.kind === 'burning')).toBe(false);
    killActor(w, c);
    expect(w.effects.some((e) => e.kind === 'burning')).toBe(true);
    expect(w.corpses).toHaveLength(0);
  });

  it('a Pyre Priest sets fire to the ground where the character stands, and the ground is a hazard first', () => {
    const w = arena();
    put(w, 'pyrepriest', 7);
    let ring = false;
    for (let i = 0; i < 6 * 60; i++) {
      stepWorld(w);
      if (telegraphs(w).some((t) => t.kind === 'ring')) ring = true;
    }
    expect(ring).toBe(true);
    expect(w.effects.some((e) => e.kind === 'burning')).toBe(true);
  });

  it('a Slagworm dives and comes up in a ring of fire', () => {
    const w = arena();
    const worm = put(w, 'slagworm', 9);
    worm.mv.burrowCd = 0;
    stepWorld(w);
    expect(worm.burrowT).toBeGreaterThan(0);
    run(w, 3.2);
    expect(worm.burrowT).toBe(0);
    expect(Math.hypot(worm.x - w.player.x, worm.y - w.player.y)).toBeLessThan(3.5);
  });

  it('the Cinder Tyrant sends a ring of fire out every ten seconds and lights Cinderlings at half life', () => {
    const w = arena();
    const chief = put(w, 'slagbrute', 6, 0, { rarity: 'miniboss', mods: ['cinderTyrant'] });
    chief.raiserT = 0.05;
    run(w, 0.3);
    const ring = w.effects.find((e) => e.kind === 'slam');
    expect(ring).toBeDefined();
    expect(ring!.dtype).toBe(3);
    const lit = () => w.actors.filter((a) => a.alive && a.mon?.spec.type === 'cinderling').length;
    expect(lit()).toBe(0);
    chief.life = chief.def.maxLife * 0.4;
    run(w, 0.3);
    expect(lit()).toBeGreaterThan(0);
  });
});
