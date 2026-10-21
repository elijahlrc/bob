import { describe, expect, it } from 'vitest';
import { DUEL_LIFE_MULT_TOP, DUEL_REPRIEVES } from '../data/constants';
import { reprieveDef } from '../data/reprieves';
import type { Build } from '../data/types';
import { newRun } from '../run/run';
import { lifeCap, rawHit } from './combat';
import {
  createDuelWorld,
  DUEL_REPRIEVE,
  duelEnd,
  duelLifeMult,
  duelResult,
  duelWatch,
} from './duel';
import { activeGem, buildForActive } from './gemKit';
import { makeMinion } from './minions';
import type { Side } from './side';
import type { World } from './types';

/**
 * The balance of a duel (docs/DUEL-BALANCE.md): three Bargain Coins a side, life and energy shield multiplied by the curve of the
 * other side's level (minions not), and the time cap won by the side that used fewer reprieves.
 */

const vanguard = (level = 1, seed = 1): Build => {
  const b = newRun('vanguard', seed).build;
  b.level = level;
  return b;
};

/** A blow no character survives, from nobody. */
const fell = (w: World, s: Side): void => rawHit(w, s.player, 1e9, 0, null, 'Test');

describe('the reprieves of a duel', () => {
  it('are three Bargain Coins on each side', () => {
    expect(DUEL_REPRIEVES).toBe(3);
    expect(DUEL_REPRIEVE).toBe('bargainCoin');
    const w = createDuelWorld(vanguard(), vanguard(1, 2), 1);
    for (const s of w.sides) expect(s.reprieve.held).toEqual(Array(3).fill('bargainCoin'));
  });

  it('stand a character up three times, at half its life and safe for a moment, and it falls on the fourth', () => {
    const w = createDuelWorld(vanguard(), vanguard(1, 2), 1);
    const [sa] = w.sides;
    const coin = reprieveDef('bargainCoin');
    const watch = duelWatch();
    for (let i = 1; i <= 3; i++) {
      fell(w, sa);
      expect(sa.player.alive).toBe(true);
      expect(sa.player.life).toBeCloseTo(coin.life * lifeCap(sa.player), 6);
      expect(sa.reprieve.invulnT).toBe(coin.invuln);
      expect(sa.reprieve.fired).toHaveLength(i);
      expect(duelEnd(w, watch)).toBeNull();
      // A blow while it is safe does nothing.
      fell(w, sa);
      expect(sa.reprieve.fired).toHaveLength(i);
      sa.reprieve.invulnT = 0;
    }
    fell(w, sa);
    expect(sa.player.alive).toBe(false);
    expect(duelEnd(w, watch)).toBe('death');
    const r = duelResult(w, 'death');
    expect(r.winner).toBe(1);
    expect([r.sides[0].reprieves, r.sides[0].reprievesHeld]).toEqual([3, 3]);
    expect([r.sides[1].reprieves, r.sides[1].reprievesHeld]).toEqual([0, 3]);
  });

  it('carry no curse: the arena has no affix, and the life after the third is still half of the whole', () => {
    const w = createDuelWorld(vanguard(), vanguard(1, 2), 1);
    const [sa] = w.sides;
    const max = sa.player.def.maxLife;
    for (let i = 0; i < 3; i++) {
      fell(w, sa);
      sa.reprieve.invulnT = 0;
    }
    expect(w.plan.affixes).toEqual([]);
    expect(sa.player.def.maxLife).toBe(max);
    expect(sa.player.life).toBeCloseTo(0.5 * lifeCap(sa.player), 6);
  });

  it('can be left out (the measurement compares with the old rules)', () => {
    const w = createDuelWorld(vanguard(), vanguard(1, 2), 1, { reprieves: 0 });
    fell(w, w.sides[0]);
    expect(w.sides[0].player.alive).toBe(false);
  });
});

describe('the life curve', () => {
  it('runs on a straight line from 1 at level 1 to 10 at level 100', () => {
    expect(DUEL_LIFE_MULT_TOP).toBe(10);
    expect(duelLifeMult(1)).toBe(1);
    expect(duelLifeMult(100)).toBe(10);
    expect(duelLifeMult(50)).toBeCloseTo(1 + (9 * 49) / 99, 9);
    expect(duelLifeMult(0)).toBe(1);
    expect(duelLifeMult(120)).toBe(10);
  });

  it('multiplies each side’s life and energy shield by the curve of the other side’s level', () => {
    const w = createDuelWorld(vanguard(30), vanguard(70, 2), 1);
    const [sa, sb] = w.sides;
    expect(sa.lifeMult).toBeCloseTo(duelLifeMult(70), 9);
    expect(sb.lifeMult).toBeCloseTo(duelLifeMult(30), 9);
    for (const s of w.sides) {
      // The sheet's own numbers, as the Character tab shows them.
      const sheet = s.char.defence();
      expect(Math.abs(s.player.def.maxLife - sheet.maxLife * s.lifeMult)).toBeLessThanOrEqual(
        s.lifeMult,
      );
      expect(Math.abs(s.player.def.maxEs - sheet.maxEs * s.lifeMult)).toBeLessThanOrEqual(
        s.lifeMult,
      );
      // It starts full.
      expect(s.player.life).toBeCloseTo(lifeCap(s.player), 6);
    }
    // The lower level has the larger factor.
    expect(sa.lifeMult).toBeGreaterThan(sb.lifeMult);
  });

  it('gives equal levels equal factors', () => {
    const w = createDuelWorld(vanguard(40), vanguard(40, 2), 1);
    expect(w.sides[0].lifeMult).toBe(w.sides[1].lifeMult);
    expect(w.sides[0].lifeMult).toBeCloseTo(duelLifeMult(40), 9);
  });

  it('leaves the sheet, the flasks and life on hit as they are, and is 1 on a map or with the curve off', () => {
    const a = vanguard(30);
    const b = vanguard(70, 2);
    const on = createDuelWorld(a, b, 1);
    const off = createDuelWorld(a, b, 1, { lifeCurve: false });
    expect(off.sides.map((s) => s.lifeMult)).toEqual([1, 1]);
    expect(off.sides[0].player.def.maxLife).toBe(on.sides[0].char.defence().maxLife);
    expect(on.sides[0].flasks.map((f) => f.spec)).toEqual(off.sides[0].flasks.map((f) => f.spec));
    // Percent recharge and regeneration are shares of the pool; the thresholds follow the pool too.
    const [d1, dk] = [off.sides[0].player.def, on.sides[0].player.def];
    const k = on.sides[0].lifeMult;
    expect(dk.esRecharge).toBeCloseTo((d1.esRecharge * dk.maxEs) / Math.max(1, d1.maxEs), 6);
    expect(dk.ailmentThreshold).toBe(dk.maxLife + dk.maxEs);
    expect(dk.stunThreshold / d1.stunThreshold).toBeCloseTo(k, 1);
  });

  it('makes a reprieve’s half a half of the larger pool', () => {
    const w = createDuelWorld(vanguard(30), vanguard(70, 2), 1);
    const [sa] = w.sides;
    fell(w, sa);
    expect(sa.player.life).toBeCloseTo(0.5 * sa.player.def.maxLife, 6);
    expect(sa.player.def.maxLife).toBeGreaterThan(5 * sa.char.defence().maxLife);
  });

  it('does not reach the minions: a minion has the same life with the curve on or off', () => {
    const a = buildForActive(activeGem('callBonewalkers'));
    const b = vanguard(90, 2);
    const life = (curve: boolean) => {
      const w = createDuelWorld(a, b, 1, { lifeCurve: curve });
      const s = w.sides[0];
      const c = s.char.utilities.find((u) => u.skill.id === 'callBonewalkers')!;
      const u = c.skill.utility;
      if (u?.kind !== 'summon') throw new Error('no summon');
      return makeMinion(w, s, c, s.char.profile(c, 0), u.minion, s.player.x + 1, s.player.y).def
        .maxLife;
    };
    expect(life(true)).toBe(life(false));
    expect(createDuelWorld(a, b, 1).sides[0].lifeMult).toBeGreaterThan(8);
  });
});

describe('the time cap', () => {
  it('goes to the side that used fewer reprieves, whatever life each has left', () => {
    const w = createDuelWorld(vanguard(), vanguard(1, 2), 1);
    const [sa, sb] = w.sides;
    fell(w, sb);
    sa.player.life = 1;
    const r = duelResult(w, 'time');
    expect(r.how).toBe('time');
    expect(r.winner).toBe(0);
    expect(r.sides[0].lifeLeft).toBeLessThan(r.sides[1].lifeLeft);
    fell(w, sa);
    sa.reprieve.invulnT = 0;
    fell(w, sa);
    expect(duelResult(w, 'time').winner).toBe(1);
  });

  it('is a draw when both used as many', () => {
    const w = createDuelWorld(vanguard(), vanguard(1, 2), 1);
    expect(duelResult(w, 'time').winner).toBeNull();
    for (const s of w.sides) fell(w, s);
    expect(duelResult(w, 'time').winner).toBeNull();
  });

  it('leaves a stall a draw, however many each used', () => {
    const w = createDuelWorld(vanguard(), vanguard(1, 2), 1);
    fell(w, w.sides[1]);
    const r = duelResult(w, 'stall');
    expect([r.how, r.winner]).toEqual(['stall', null]);
  });
});
