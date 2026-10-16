import { describe, expect, it } from 'vitest';
import { FREEZE_GRACE } from '../data/constants';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { afflictPlayer } from './afflict';
import { createDummyWorld } from './dummy';
import type { World } from './types';
import { stepWorld } from './world';

/** A level 40 character in an open arena, deathless, with no dummies. */
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

const run = (w: World, seconds: number) => {
  for (let i = 0; i < Math.round(seconds * 60); i++) stepWorld(w);
};

describe('a freeze on the character is followed by a recovery', () => {
  it('is not lengthened while it lasts', () => {
    const w = arena();
    expect(afflictPlayer(w, 'freeze', 0, 1)).toBe(true);
    run(w, 0.5);
    const left = w.player.ail.freezeT;
    expect(afflictPlayer(w, 'freeze', 0, 3)).toBe(false);
    expect(w.player.ail.freezeT).toBe(left);
  });

  it('cannot be frozen again for a second after it ends, and then can', () => {
    const w = arena();
    afflictPlayer(w, 'freeze', 0, 1);
    run(w, 1.1);
    expect(w.player.ail.freezeT).toBeLessThanOrEqual(0);
    expect(afflictPlayer(w, 'freeze', 0, 1)).toBe(false);
    run(w, FREEZE_GRACE * 0.8);
    expect(afflictPlayer(w, 'freeze', 0, 1)).toBe(false);
    run(w, FREEZE_GRACE * 0.4);
    expect(afflictPlayer(w, 'freeze', 0, 1)).toBe(true);
  });
});
