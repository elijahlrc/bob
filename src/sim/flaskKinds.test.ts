import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import { COLD } from '../calc/skill';
import { makeFlask, makeItem } from '../gen/items';
import { mod } from '../mods/types';
import { newRun } from '../run/run';
import { createDummyWorld } from './dummy';
import { stepWorld } from './world';

/**
 * The utility flask kinds the reference game has and Bob gained with the base audit (docs/AUDIT-ITEM-BASES.md): a flask that
 * leaves ground, one that holds a buff, one that makes critical strikes lucky, one that lets a share of cold hits by.
 */

function withFlask(id: string) {
  const run = newRun('vanguard', 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = 60;
  b.flasks = [null, null, makeFlask(uid, id, 60), null, null];
  return b;
}

/** A character with the flask in front of a rare dummy, stepped until the flask is drunk and a little after. */
function drink(id: string) {
  const { world } = createDummyWorld(withFlask(id), { distance: 2.5, maxTime: 30, rarity: 'rare' });
  const side = world.sides[0];
  const flask = side.flasks.find((f) => f.spec.kind === 'utility')!;
  for (let i = 0; i < 60 * 10 && flask.uses === 0; i++) stepWorld(world);
  stepWorld(world);
  stepWorld(world);
  return { world, side, flask };
}

describe('the utility flask kinds of the reference game', () => {
  it('the Sanctum Draught leaves consecrated ground where it is drunk, for as long as it runs', () => {
    const { side, flask } = drink('flask_sanctum');
    expect(flask.uses).toBe(1);
    const f = side.fields.find((x) => x.kind === 'consecrated');
    expect(f).toBeDefined();
    expect(f!.total).toBeCloseTo(flask.spec.duration, 5);
    expect(Math.hypot(f!.x - side.player.x, f!.y - side.player.y)).toBeLessThan(1);
  });

  it('the Chillwake Draught leaves chilled ground that chills, and a chance to take no cold from a hit', () => {
    const { side, flask } = drink('flask_chillwake');
    expect(flask.uses).toBe(1);
    expect(side.fields.some((x) => x.kind === 'chilling' && x.chill === 0.1)).toBe(true);
    expect(side.player.def.avoidHit[COLD]).toBeCloseTo(0.2, 9);
  });

  it('the Smokeveil Draught leaves a smoke cloud', () => {
    const { side } = drink('flask_smokeveil');
    expect(side.fields.some((x) => x.kind === 'smoke' && x.dps > 0)).toBe(true);
  });

  it('the Onrush Draught holds Quickened for as long as it runs, and counts as a source of it', () => {
    const { side, flask } = drink('flask_onrush');
    expect(flask.uses).toBe(1);
    expect(side.char.buffSource.onslaught).toBe(true);
    expect(side.buffT.onslaught).toBeGreaterThan(flask.spec.duration - 0.2);
  });

  it('a lucky critical strike chance is the better of two rolls', () => {
    const run = newRun('vanguard', 1);
    const uid = () => run.nextUid++;
    const b = run.build;
    b.level = 60;
    const sword = makeItem(uid, 'sword_l60', 60);
    const plain = new Character({ ...b, equipment: { ...b.equipment, mainHand: sword } });
    const c0 = plain.profile(plain.primary).hands[0].critChance;
    expect(c0).toBeGreaterThan(0);
    expect(c0).toBeLessThan(1);
    const lucky = new Character({
      ...b,
      equipment: {
        ...b.equipment,
        mainHand: { ...sword, uniqueMods: [mod('critLucky', 'flag', 1)] },
      },
    });
    expect(lucky.profile(lucky.primary).hands[0].critChance).toBeCloseTo(
      1 - (1 - c0) * (1 - c0),
      9,
    );
  });
});
