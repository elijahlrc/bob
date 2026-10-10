import { describe, expect, it } from 'vitest';
import type { MonsterSpec } from '../calc/monster';
import type { MonsterTypeId } from '../data/monsters';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { createDummyWorld } from './dummy';
import { activeRings, RING_RADIUS } from './packPlays';
import type { Actor, World } from './types';
import { spawnMonster, stepWorld } from './world';

/** A level 40 character in an open arena, fixed to the spot, with no dummies. */
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

const spec = (type: MonsterTypeId): MonsterSpec => ({
  type,
  variant: 'none',
  rarity: 'normal',
  level: 40,
  mods: [],
});

function put(w: World, type: MonsterTypeId, dx: number, dy: number, pack: number): Actor {
  const m = spawnMonster(w, spec(type), w.player.x + dx, w.player.y + dy, 0, pack, type);
  m.state = 'chase';
  return m;
}

describe('pack plays (docs/ENCOUNTERS.md 8)', () => {
  it('archers of a pack that can see the character loose together, each down a lane shown first', () => {
    const w = arena();
    const a = [put(w, 'archer', 7, -1, 5), put(w, 'archer', 7, 1, 5)];
    let lanes = 0;
    for (let i = 0; i < 300 && lanes < 2; i++) {
      stepWorld(w);
      lanes = w.effects.filter((e) => e.label === 'Loosing call').length;
    }
    expect(lanes).toBe(2);
    // They hold while the lanes show, and the lanes run from each of them toward the character.
    expect(a.every((m) => m.windT > 0)).toBe(true);
    for (const e of w.effects.filter((x) => x.label === 'Loosing call'))
      expect(a.some((m) => Math.hypot(m.x - e.x, m.y - e.y) < 0.1)).toBe(true);
    for (let i = 0; i < 60; i++) stepWorld(w);
    expect(a.every((m) => m.windT === 0)).toBe(true);
  });

  it('a lone archer does not call', () => {
    const w = arena();
    put(w, 'archer', 7, 0, 6);
    for (let i = 0; i < 300; i++) stepWorld(w);
    expect(w.effects.some((e) => e.label === 'Loosing call')).toBe(false);
  });

  it('hounds of a pack hold a ring round the character, then leap together', () => {
    const w = arena();
    const h = [0, 1, 2].map((i) => put(w, 'hound', 8, i - 1, 7));
    let ring = false;
    for (let i = 0; i < 300 && !ring; i++) {
      stepWorld(w);
      ring = activeRings(w).length > 0;
    }
    expect(ring).toBe(true);
    for (let i = 0; i < 100; i++) stepWorld(w);
    // On the ring, more or less.
    const p = w.player;
    for (const m of h)
      expect(Math.abs(Math.hypot(m.x - p.x, m.y - p.y) - RING_RADIUS)).toBeLessThan(2);
    let leapt = 0;
    for (let i = 0; i < 40; i++) {
      stepWorld(w);
      leapt = Math.max(leapt, h.filter((m) => m.windT > 0 || m.dashT > 0).length);
    }
    expect(leapt).toBe(3);
  });

  it("a Nest's brood converges: faster and harder for a moment", () => {
    const w = arena();
    const nest = put(w, 'nest', 9, 0, 8);
    const brood = [0, 1, 2, 3].map((i) => put(w, 'gnawer', 8, i - 1.5, 8));
    let on = false;
    for (let i = 0; i < 300 && !on; i++) {
      stepWorld(w);
      on = brood.every((g) => !g.alive || g.buffT > 0);
    }
    expect(on).toBe(true);
    expect(nest.alive).toBe(true);
  });
});
