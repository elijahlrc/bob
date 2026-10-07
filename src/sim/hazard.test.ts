import { describe, expect, it } from 'vitest';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { hazardAt } from './ai';
import { createDummyWorld } from './dummy';
import { openZone } from './factions';
import type { World } from './types';
import { spawnMonster, stepWorld } from './world';

/** A bow-wielding player in an open arena, with a skeleton warrior a few tiles away. */
function arena(distance: number): World {
  const run = newRun('strider', 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = 40;
  b.equipment.mainHand = makeItem(uid, 'bow_3', 40, 1);
  b.equipment.mainHand.sockets = [makeGem(uid, 'splitVolley')];
  b.primaryGem = b.equipment.mainHand.sockets[0]!.uid;
  delete b.equipment.offHand;
  const { world } = createDummyWorld(b, { distance });
  return world;
}

describe('the hazard-aware player AI (EXPANSION 5.8)', () => {
  it('knows what is a hazard: a zone covers its circle, a telegraphed blast about to land does too', () => {
    const w = arena(5);
    const { x, y } = w.player;
    expect(hazardAt(w, x, y)).toBeNull();
    openZone(w, x, y, 2, 4, 'caustic', 10);
    expect(hazardAt(w, x + 1.5, y)).not.toBeNull();
    expect(hazardAt(w, x + 2.5, y)).toBeNull();
    expect(hazardAt(w, x + 2.3, y, 0.5)).not.toBeNull();
    w.effects.length = 0;
    w.effects.push({
      id: 999,
      x,
      y,
      radius: 3,
      t: 1,
      total: 1.2,
      kind: 'slam',
      damage: 50,
      dtype: 0,
      faction: 1,
    });
    expect(hazardAt(w, x, y)).not.toBeNull();
  });

  it('steps out of a caustic cloud while the target stays in reach', () => {
    const w = arena(5);
    openZone(w, w.player.x, w.player.y, 2, 6, 'caustic', 30);
    let hits = 0;
    for (let i = 0; i < 180; i++) {
      stepWorld(w);
      for (const e of w.events) if (e.t === 'hit' && e.dst === w.player.id && e.dtype === 4) hits++;
    }
    expect(hazardAt(w, w.player.x, w.player.y)).toBeNull();
    // Standing in it for the whole three seconds would be twelve pulses; it left after the first few.
    expect(hits).toBeLessThanOrEqual(3);
  });

  it('does not leave the fight if no clear spot keeps the target in reach', () => {
    const w = arena(30);
    const m = spawnMonster(
      w,
      { type: 'warrior', variant: 'none', rarity: 'normal', level: 30, mods: [] },
      w.player.x + 1,
      w.player.y,
      0,
      0,
      'w',
    );
    m.state = 'chase';
    // A huge cloud: nowhere near enough to step out of, so the player just keeps fighting.
    openZone(w, w.player.x, w.player.y, 40, 3, 'caustic', 1);
    const x0 = w.player.x;
    const y0 = w.player.y;
    for (let i = 0; i < 20; i++) stepWorld(w);
    expect(Math.hypot(w.player.x - x0, w.player.y - y0)).toBeLessThan(2);
  });
});
