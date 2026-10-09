import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import type { Build } from '../data/types';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { rawHit } from './combat';
import { createDummyWorld } from './dummy';
import type { SimEvent } from './types';
import { stepWorld } from './world';

/** Tests of the spirit plan's S1 (docs/SPIRIT.md): gems that did nothing, or less than their text said. */

/** A melee build (Crushing Blow in a mace) with `support` and `spells` socketed in the body armour. */
function meleeWith(support: string, spells: string[]): Build {
  const run = newRun('vanguard', 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = 40;
  const weapon = makeItem(uid, 'mace2_3', 40, 1);
  weapon.sockets = [makeGem(uid, 'crushingBlow')];
  b.equipment.mainHand = weapon;
  delete b.equipment.offHand;
  const body = makeItem(uid, 'body_ar_1', 40, spells.length + 1);
  body.sockets = [support, ...spells].map((g) => makeGem(uid, g));
  b.equipment.body = body;
  b.primaryGem = weapon.sockets[0]!.uid;
  b.flasks = [null, null, null, null, null];
  return b;
}

const triggers = (events: readonly SimEvent[]) => events.filter((e) => e.t === 'trigger').length;

describe('Cast on Melee Kill (slayersEcho)', () => {
  it('links the spells beside it, and its trigger waits for a melee kill', () => {
    const c = new Character(meleeWith('slayersEcho', ['arcChain']), {});
    expect(c.triggers).toHaveLength(1);
    expect(c.triggers[0].def).toMatchObject({ on: 'kill', tags: ['melee'] });
    expect(c.triggers[0].skills.map((s) => s.skill.id)).toEqual(['arcChain']);
  });

  it('casts the spell when a melee hit kills, and not when something else kills', () => {
    const b = meleeWith('slayersEcho', ['arcChain']);
    // A melee hit that kills.
    const a = createDummyWorld(b, { distance: 1.6 });
    a.dummy.life = 1;
    let melee = 0;
    for (let i = 0; i < 6 * 60 && a.world.status === 'running' && a.dummy.alive; i++) {
      stepWorld(a.world);
      melee += triggers(a.world.events);
    }
    expect(a.dummy.alive).toBe(false);
    expect(melee).toBeGreaterThan(0);
    // The same kill by a minion, or by damage over time, casts nothing.
    for (const by of ['minion', 'player'] as const) {
      const x = createDummyWorld(b, { distance: 1.6 });
      x.world.player.stunT = 1e9; // it does not strike
      rawHit(x.world, x.dummy, 1e13, 0, 'Test', by);
      expect(x.dummy.alive).toBe(false);
      expect(triggers(x.world.events)).toBe(0);
    }
  });
});
