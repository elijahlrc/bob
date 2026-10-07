import { describe, expect, it } from 'vitest';
import { resolveHit } from '../calc/combat';
import { Rng } from '../core/rng';
import type { Build } from '../data/types';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { applyHit, flaskMask, playerConds, targetState } from './combat';
import { createDummyWorld } from './dummy';

/** Supports that grant buffs and charges when their skill hits or casts (C3). */
function build(gems: string[], classId: string, main?: string): Build {
  const b = newRun(classId, 1).build;
  b.level = 40;
  if (main) b.equipment.mainHand = makeItem(() => 70000, main, 40, 1);
  const body = makeItem(() => 70001, 'body_ar_1', 40, gems.length);
  body.sockets = gems.map((g, i) => makeGem(() => 70100 + i, g));
  b.equipment.body = body;
  b.primaryGem = body.sockets[0]?.uid;
  b.flasks = [null, null, null, null, null];
  return b;
}

describe('gem-granted gains in the sim', () => {
  it('Bulwark Strikes: a melee hit fortifies the character', () => {
    const {
      world: w,
      dummy,
      player,
    } = createDummyWorld(build(['crushingBlow', 'bulwarkStrikes'], 'vanguard', 'mace2_3'), {
      distance: 1.5,
    });
    const prof = w.char.profile(w.primary, playerConds(w, dummy), flaskMask(w));
    expect(w.buffT.fortify).toBe(0);
    const res = resolveHit(new Rng(1), prof, prof.hands[0], targetState(dummy), 1, false);
    res.outcome = 'hit';
    applyHit(w, w.player, dummy, prof, res);
    expect(w.buffT.fortify).toBeGreaterThan(0);
  });

  it('Stagger Resolve: a melee stun grants a Grit charge', () => {
    const {
      world: w,
      dummy,
      player,
    } = createDummyWorld(build(['crushingBlow', 'staggerResolve'], 'vanguard', 'mace2_3'), {
      distance: 1.5,
    });
    const prof = w.char.profile(w.primary, playerConds(w, dummy), flaskMask(w));
    const res = resolveHit(new Rng(2), prof, prof.hands[0], targetState(dummy), 1, false);
    res.outcome = 'hit';
    res.stun = 0.35;
    expect(w.char.charges.grit).toBe(0);
    applyHit(w, w.player, dummy, prof, res);
    expect(w.char.charges.grit).toBe(1);
  });
});
