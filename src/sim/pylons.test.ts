import { describe, expect, it } from 'vitest';
import type { MonsterSpec } from '../calc/monster';
import { PYLON_OFF, PYLON_ON } from '../data/abilities';
import type { MonsterTypeId } from '../data/monsters';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { createDummyWorld } from './dummy';
import { pylonsUp, shieldedByPylon } from './factions';
import type { Actor, World } from './types';
import { spawnMonster, stepWorld } from './world';

/** A level 30 Vanguard that cannot die, alone in an open arena. */
function arena(): World {
  const run = newRun('vanguard', 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = 30;
  b.equipment.mainHand = makeItem(uid, 'mace2_3', 30, 1);
  b.equipment.mainHand.sockets = [makeGem(uid, 'crushingBlow')];
  b.primaryGem = b.equipment.mainHand.sockets[0]!.uid;
  delete b.equipment.offHand;
  const { world } = createDummyWorld(b, { distance: 20 });
  world.sides[0].opts.godMode = true;
  for (const a of world.actors) if (a.dummy) a.alive = false;
  return world;
}

function put(world: World, type: MonsterTypeId, dx: number): Actor {
  const spec: MonsterSpec = { type, variant: 'none', rarity: 'normal', level: 30, mods: [] };
  const p = world.sides[0].player;
  const m = spawnMonster(world, spec, p.x + dx, p.y, 0, 0, type);
  m.state = 'chase';
  return m;
}

/** A Warden Pylon's ward drops for a second in every six, and the character never aims at what it guards (docs/PLAYER-AI.md). */
describe('Warden Pylons', () => {
  it('the ward holds five seconds, then drops for one', () => {
    const w = arena();
    const mon = put(w, 'warrior', 3);
    put(w, 'pylon', 6);
    for (const [t, up] of [
      [0, true],
      [PYLON_ON - 0.1, true],
      [PYLON_ON + 0.5, false],
      [PYLON_ON + PYLON_OFF + 0.1, true],
    ] as const) {
      w.t = t;
      expect(pylonsUp(w), `t ${t}`).toBe(up);
      expect(shieldedByPylon(w, mon), `t ${t}`).toBe(up);
    }
  });

  it('the character never aims at a monster the ward holds, even with nothing else in reach', () => {
    const w = arena();
    // The pylon stands past the character's reach, the monster it guards close by.
    const mon = put(w, 'warrior', 5);
    put(w, 'pylon', 9.5);
    const s = w.sides[0];
    let aimedInGap = false;
    for (let f = 0; f < 60 * 12; f++) {
      stepWorld(w);
      // A blow already under way is let finish (the character chooses again once it is free).
      if (s.player.action || s.ai.targetId !== mon.id) continue;
      expect(shieldedByPylon(w, mon), `aimed at a warded monster at t ${w.t.toFixed(2)}`).toBe(
        false,
      );
      aimedInGap = true;
    }
    // Out of the ward (in its off second, or when the monster walks clear of it) it is fair game.
    expect(aimedInGap).toBe(true);
  });
});
