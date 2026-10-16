import { describe, expect, it } from 'vitest';
import type { MonsterSpec } from '../calc/monster';
import type { MonsterTypeId } from '../data/monsters';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { logDamage, rawHit } from './combat';
import { createDummyWorld } from './dummy';
import { buildRecap, RECAP_HITS } from './recap';
import type { Actor, World } from './types';
import { spawnMonster, stepWorld } from './world';

/** A level 40 character in an open arena with no dummies. */
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
  world.sides[0].opts.godMode = true;
  for (const a of world.actors) if (a.dummy) a.alive = false;
  return world;
}

const spec = (type: MonsterTypeId, rarity: MonsterSpec['rarity'] = 'normal'): MonsterSpec => ({
  type,
  variant: 'none',
  rarity,
  level: 30,
  mods: [],
});

function put(w: World, type: MonsterTypeId, dx: number, rarity?: MonsterSpec['rarity']): Actor {
  const m = spawnMonster(
    w,
    spec(type, rarity),
    w.sides[0].player.x + dx,
    w.sides[0].player.y,
    0,
    0,
    type,
  );
  m.state = 'chase';
  return m;
}

describe('the death recap (the record a death sends)', () => {
  it('lists the hits in order with how long before, and the life and shield the player had before each', () => {
    const w = arena();
    const m = put(w, 'warrior', 30);
    const p = w.sides[0].player;
    p.life = 500;
    p.es = 40;
    w.t = 10;
    logDamage(w, w.sides[0].player, m, m.name, 0, 100);
    w.t = 12;
    p.life = 400;
    logDamage(w, w.sides[0].player, null, 'Reflect', 3, 50);
    w.t = 15;
    const r = buildRecap(w);
    expect(r.hits!.map((h) => h.name)).toEqual([m.name, 'Reflect']);
    expect(r.hits![0]).toMatchObject({ ago: 5, rarity: 'normal', dtype: 0, amount: 100, hp: 540 });
    expect(r.hits![1]).toMatchObject({ ago: 3, rarity: 'effect', hp: 440 });
  });

  it('keeps damage over time as a total in the lines, not as a hit each tick', () => {
    const w = arena();
    w.t = 3;
    for (let i = 0; i < 20; i++) logDamage(w, w.sides[0].player, null, 'Burning', 3, 5);
    logDamage(w, w.sides[0].player, null, 'Crush', 0, 70);
    const r = buildRecap(w);
    expect(r.hits!.map((h) => h.name)).toEqual(['Crush']);
    expect(r.lines.find((l) => l.name === 'Burning')?.amount).toBe(100);
  });

  it('keeps no more than the latest hits, and nothing older than ten seconds', () => {
    const w = arena();
    for (let i = 0; i < 30; i++) {
      w.t = 20 + i * 0.1;
      logDamage(w, w.sides[0].player, null, `h${i}`, 0, 10);
    }
    w.t = 25;
    const r = buildRecap(w);
    expect(r.hits).toHaveLength(RECAP_HITS);
    expect(r.hits![RECAP_HITS - 1].name).toBe('h29');
    w.t = 40;
    expect(buildRecap(w).hits).toHaveLength(0);
  });

  it('names the monster behind a slam, which the effect itself hides', () => {
    const w = arena();
    const m = put(w, 'warrior', 25, 'rare');
    w.effects.push({
      id: w.nextId++,
      x: w.sides[0].player.x,
      y: w.sides[0].player.y,
      radius: 2,
      t: 0.1,
      total: 0.1,
      kind: 'slam',
      damage: 300,
      dtype: 0,
      team: 1,
      owner: m.id,
    });
    for (let i = 0; i < 20; i++) stepWorld(w);
    const slam = buildRecap(w).hits!.find((h) => h.name === 'Crushing slam');
    expect(slam?.via).toBe(m.name);
  });

  it('says what the character had: defences, flasks drunk, and who was near', () => {
    const w = arena();
    put(w, 'warrior', 3);
    put(w, 'warrior', 4, 'rare');
    put(w, 'warrior', 5, 'magic');
    put(w, 'warrior', 30);
    rawHit(w, w.sides[0].player, 10, 0, 'Test');
    const r = buildRecap(w);
    expect(r.near).toEqual({ all: 3, magic: 1, rare: 1, boss: 0 });
    expect(r.defence!.armour).toBe(w.sides[0].player.def.armour);
    expect(r.vitals!.life).toBe(w.sides[0].player.life);
    expect(r.flasks).toHaveLength(w.sides[0].flasks.length);
    for (const f of r.flasks!) expect(f.uses).toBe(0);
  });
});
