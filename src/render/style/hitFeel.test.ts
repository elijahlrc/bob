import { describe, expect, it } from 'vitest';
import { MOD_MARKS } from '../../data/monsterMarks';
import type { MonsterSpec } from '../../calc/monster';
import type { MonsterTypeId } from '../../data/monsters';
import { newRun } from '../../run/run';
import { createDummyWorld } from '../../sim/dummy';
import type { Actor, World } from '../../sim/types';
import { spawnMonster } from '../../sim/world';
import { AnimTrack } from './anim';
import { pipsOf, reflectsUnmarked } from './pips';

function arena(): World {
  const { world } = createDummyWorld(newRun('vanguard', 1).build, { distance: 30 });
  for (const a of world.actors) if (a.dummy) a.alive = false;
  return world;
}

function put(w: World, type: MonsterTypeId, over: Partial<MonsterSpec> = {}): Actor {
  const spec: MonsterSpec = {
    type,
    variant: 'none',
    rarity: 'normal',
    level: 20,
    mods: [],
    ...over,
  };
  return spawnMonster(w, spec, w.sides[0].player.x + 5, w.sides[0].player.y, 0, 0, type);
}

describe('which monsters wear the reflect pip', () => {
  it('a Gilded Guard wears the Thorned pip, which a plain monster does not', () => {
    const w = arena();
    const guard = put(w, 'guard');
    expect(reflectsUnmarked(guard)).toBe(true);
    expect(pipsOf(guard)).toEqual([
      { color: MOD_MARKS.thorned.color, shape: MOD_MARKS.thorned.shape },
    ]);
    const plain = put(w, 'warrior');
    expect(reflectsUnmarked(plain)).toBe(false);
    expect(pipsOf(plain)).toEqual([]);
  });

  it('a Thorned monster has one such pip, never two', () => {
    const w = arena();
    const thorned = put(w, 'warrior', { rarity: 'rare', mods: ['thorned'] });
    expect(pipsOf(thorned)).toHaveLength(1);
    const both = put(w, 'guard', { rarity: 'rare', mods: ['thorned', 'hasted'] });
    expect(pipsOf(both)).toHaveLength(2);
    expect(reflectsUnmarked(both)).toBe(false);
  });
});

describe('a knocked-back figure slides', () => {
  const actor = (x: number, y: number) => ({ x, y, alive: true, action: null, stunT: 0 }) as never;

  it('eases to where it landed over a few frames instead of snapping, and does not walk', () => {
    const t = new AnimTrack();
    const a = actor(10, 10) as { x: number; y: number };
    t.update(a as never, 1 / 60);
    a.x = 13;
    t.knocked();
    t.update(a as never, 1 / 60);
    // After one frame it has hardly moved (the walk's own chase would be a third of the way).
    expect(t.rx).toBeGreaterThan(10);
    expect(t.rx).toBeLessThan(10.7);
    expect(t.speed).toBe(0);
    let frames = 1;
    while (frames < 60 && 13 - t.rx > 0.05) {
      t.update(a as never, 1 / 60);
      frames++;
    }
    // It arrives in about a fifth to a third of a second.
    expect(frames).toBeGreaterThan(8);
    expect(frames).toBeLessThan(30);
  });

  it('a teleport that is not a knockback still snaps', () => {
    const t = new AnimTrack();
    const a = actor(10, 10) as { x: number; y: number };
    t.update(a as never, 1 / 60);
    a.x = 20;
    t.update(a as never, 1 / 60);
    expect(t.rx).toBe(20);
  });
});
