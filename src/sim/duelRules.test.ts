import { describe, expect, it } from 'vitest';
import { emptyAilments, type HitResult } from '../calc/combat';
import { DT, DUEL_DAMAGE_SCALE, ENGAGE_RANGE } from '../data/constants';
import type { Build } from '../data/types';
import { newRun } from '../run/run';
import { findTargetForTest } from './ai';
import { applyHit, lifeCap, pushDot, rawHit } from './combat';
import { createDummyWorld } from './dummy';
import {
  createDuelWorld,
  DUEL_GAP,
  DUEL_MAX_TIME,
  DUEL_STALL_TIME,
  duelResult,
  playDuel,
  runDuel,
} from './duel';
import { activeGem, buildFor, buildForActive } from './gemKit';
import { makeMinion, summonMinions, type Minion } from './minions';
import type { Side } from './side';
import type { World } from './types';
import { stepWorld } from './world';

/**
 * The rules of a duel (docs/DUEL.md 4.2 to 4.4, F4): the duel option of the AI, the ends of a fight, the alternating order of
 * the sides, the damage scale, what a character targets, and that the same build on both sides wins about half.
 */

const vanguard = (seed = 1): Build => newRun('vanguard', seed).build;
const skeletons = (): Build => buildForActive(activeGem('callBonewalkers'));
/** A level 50 character with a sword and no gem: it strikes what it is next to with the default attack. */
const swordsman = (): Build => buildFor([], 'sword_3', 'vanguard');

const run = (w: World, seconds: number): void => {
  for (let i = 0; i < Math.round(seconds / DT); i++) stepWorld(w);
};

/** The character stands where it is and takes what comes (it cannot act); with `immortal` it cannot die either. */
const still = (s: Side, immortal = true): void => {
  s.player.stunT = 1e9;
  if (immortal) s.opts.godMode = true;
};

/** A minion of the gem `gem` standing at a spot, as the AI's summon would put it down. */
function minionOf(w: World, s: Side, gem: string, x: number, y: number): Minion {
  const c = s.char.utilities.find((u) => u.skill.id === gem)!;
  const u = c.skill.utility;
  if (u?.kind !== 'summon') throw new Error(`${gem} is no summon`);
  return makeMinion(w, s, c, s.char.profile(c, 0), u.minion, x, y);
}

/** A hit that landed for `dmg` (physical), as `resolveHit` would have made it, and what its ailments are. */
function landed(dmg: number, ailments: Partial<HitResult['ailments']> = {}): HitResult {
  return {
    outcome: 'hit',
    crit: false,
    dmg: [dmg, 0, 0, 0, 0],
    total: dmg,
    H: [dmg, 0, 0, 0, 0],
    ailments: { ...emptyAilments(), ...ailments },
    stun: 0,
  };
}

describe('the duel option', () => {
  it('two starters 10 tiles apart fight to a death', () => {
    const w = createDuelWorld(vanguard(1), vanguard(2), 1);
    expect(w.sides[1].player.x - w.sides[0].player.x).toBeGreaterThan(ENGAGE_RANGE);
    const r = runDuel(vanguard(1), vanguard(2), 1);
    expect(r.how).toBe('death');
    expect(r.winner === 0 || r.winner === 1).toBe(true);
    expect(r.time).toBeGreaterThan(3);
  });

  it('is what makes them engage at that distance: without it nobody is in reach of the AI', () => {
    const w = createDuelWorld(vanguard(1), vanguard(2), 1);
    const [sa, sb] = w.sides;
    expect(Math.hypot(sb.player.x - sa.player.x, sb.player.y - sa.player.y)).toBeCloseTo(
      DUEL_GAP,
      9,
    );
    expect(findTargetForTest(w, sa)).toBe(sb.player);
    expect(findTargetForTest(w, sb)).toBe(sa.player);
    sa.opts.duel = undefined;
    expect(findTargetForTest(w, sa)).toBeNull();
    // (The other side still has it.)
    expect(findTargetForTest(w, sb)).toBe(sa.player);
  });

  it('never loots, leaves or advances: loot and a chest lie by the character and the mode is always engage', () => {
    const w = createDuelWorld(vanguard(1), vanguard(2), 1);
    const [sa, sb] = w.sides;
    const item = vanguard(3).equipment.mainHand!;
    const drop = { id: w.nextId++, x: sa.player.x + 1, y: sa.player.y + 1, item };
    const chest = {
      id: w.nextId++,
      x: sb.player.x - 1,
      y: sb.player.y - 1,
      room: 0,
      opened: false,
    };
    w.drops.push(drop);
    w.chests.push(chest);
    const modes = new Set<string>([sa.ai.mode, sb.ai.mode]);
    while (w.t < DUEL_MAX_TIME && sa.player.alive && sb.player.alive) {
      stepWorld(w);
      modes.add(sa.ai.mode);
      modes.add(sb.ai.mode);
    }
    expect([...modes]).toEqual(['engage']);
    expect(sa.stats.picked + sb.stats.picked).toBe(0);
    expect(w.drops).toContain(drop);
    expect(chest.opened).toBe(false);
    expect(w.exitOpen).toBe(false);
    expect(sa.ai.wp + sb.ai.wp).toBe(0);
    expect(w.sides.every((s) => s.stats.stalls === 0)).toBe(true);
  });

  it('with nothing to hit (the other cannot be targeted) walks toward it, and fights again when it can', () => {
    const w = createDuelWorld(vanguard(1), vanguard(2), 1);
    const [sa, sb] = w.sides;
    still(sb);
    // Out of reach of every attack, as a character that is phased out: `findTarget` skips it.
    sb.player.phaseT = 1e9;
    expect(findTargetForTest(w, sa)).toBeNull();
    const d0 = Math.hypot(sb.player.x - sa.player.x, sb.player.y - sa.player.y);
    run(w, 3);
    const d1 = Math.hypot(sb.player.x - sa.player.x, sb.player.y - sa.player.y);
    expect(d1).toBeLessThan(d0 - 3);
    expect(sa.ai.mode).toBe('engage');
    expect(sa.ai.wp).toBe(0);
    expect(sb.player.life).toBe(lifeCap(sb.player));
    sb.player.phaseT = 0;
    run(w, 0.5);
    expect(findTargetForTest(w, sa)).toBe(sb.player);
    expect(sa.ai.targetId).toBe(sb.player.id);
  });

  it('is off for a map: its character does not see what is 10 tiles away', () => {
    const { world } = createDummyWorld(vanguard(1), { distance: 10 });
    const s = world.sides[0];
    expect(s.opts.duel).toBeUndefined();
    expect(s.damageScale).toBe(1);
    expect(findTargetForTest(world, s)).toBeNull();
  });
});

describe('how a duel ends', () => {
  it('a death is a death: the one left wins', () => {
    const r = runDuel(vanguard(1), vanguard(2), 1);
    expect(r.how).toBe('death');
    const dead = r.sides.filter((s) => s.lifeLeft === 0);
    expect(dead).toHaveLength(1);
  });

  it('both dead in one tick is a draw by death', () => {
    const w = createDuelWorld(vanguard(1), vanguard(2), 1);
    for (const s of w.sides) s.player.alive = false;
    const r = duelResult(w);
    expect(r.winner).toBeNull();
    expect(r.how).toBe('death');
  });

  it('a fight in which nobody takes damage for 15 seconds is a draw by a stall', () => {
    expect(DUEL_STALL_TIME).toBe(15);
    const { result } = playDuel(vanguard(1), vanguard(2), 1, { damageScale: 0 });
    expect(result.how).toBe('stall');
    expect(result.winner).toBeNull();
    expect(result.time).toBeGreaterThan(14.9);
    expect(result.time).toBeLessThan(15.2);
    expect(result.sides[0].lifeLeft).toBe(1);
    expect(result.sides[1].lifeLeft).toBe(1);
    expect(result.sides[0].recap).toBeUndefined();
  });

  it('waits as long as the option says', () => {
    const { result, world } = playDuel(vanguard(1), vanguard(2), 1, {
      damageScale: 0,
      stallTime: 4,
    });
    expect(result.how).toBe('stall');
    expect(result.time).toBeGreaterThan(3.9);
    expect(result.time).toBeLessThan(4.2);
    expect(world.sides[0].stats.damageTaken + world.sides[1].stats.damageTaken).toBe(0);
  });

  it('the cap is a draw by time', () => {
    expect(DUEL_MAX_TIME).toBe(90);
    const { result } = playDuel(vanguard(1), vanguard(2), 1, { maxTime: 2 });
    expect(result.how).toBe('time');
    expect(result.winner).toBeNull();
    expect(result.time).toBeGreaterThan(1.9);
    expect(result.time).toBeLessThan(2.2);
  });
});

describe('the order of the sides', () => {
  it('is reversed on an odd tick: side 1 first, then side 0 on the next', () => {
    const w = createDuelWorld(vanguard(1), vanguard(2), 1);
    w.orderPhase = 0;
    const seen: number[][] = [];
    for (let i = 0; i < 4; i++) {
      const tick: number[] = [];
      stepWorld(w, (_w, s) => {
        tick.push(s.id);
        return [];
      });
      seen.push(tick);
    }
    expect(seen).toEqual([
      [1, 0],
      [0, 1],
      [1, 0],
      [0, 1],
    ]);
  });

  it('is the same array object while it does not change, and `sides` itself on a tick of the plain order', () => {
    const w = createDuelWorld(vanguard(1), vanguard(2), 1);
    w.orderPhase = 0;
    stepWorld(w);
    const odd = w.order;
    expect(odd).toEqual([w.sides[1], w.sides[0]]);
    stepWorld(w);
    expect(w.order).toBe(w.sides);
    stepWorld(w);
    expect(w.order).toBe(odd);
  });

  it('puts the characters in their places in the actor loop too, and the seed says which side is first on an even tick', () => {
    // Two mirror characters start their first use on the same tick: the order of their events is the order they act in.
    const firstUses = (seed: number): { order: number[]; uses: number[] } => {
      const w = createDuelWorld(vanguard(1), vanguard(1), seed);
      for (let i = 0; i < 60 * 12; i++) {
        stepWorld(w);
        const uses = w.events.flatMap((e) => (e.t === 'use' ? [e.src] : []));
        if (uses.length >= 2) return { order: w.order.map((s) => s.player.id), uses };
      }
      throw new Error('the two characters never began a use in the same tick');
    };
    const odd = firstUses(1);
    const even = firstUses(2);
    expect(odd.uses).toEqual(odd.order);
    expect(even.uses).toEqual(even.order);
    expect(odd.order).not.toEqual(even.order);
    expect(createDuelWorld(vanguard(1), vanguard(2), 1).orderPhase).toBe(1);
    expect(createDuelWorld(vanguard(1), vanguard(2), 2).orderPhase).toBe(0);
  });

  it('never changes for one side: a map’s order is its `sides`, tick after tick', () => {
    const { world } = createDummyWorld(vanguard(1), { distance: 4 });
    expect(world.sides).toHaveLength(1);
    for (let i = 0; i < 10; i++) {
      stepWorld(world);
      expect(world.order).toBe(world.sides);
    }
  });
});

describe('the damage scale', () => {
  /** A world with the two characters standing still and taking what comes. */
  const scaled = (k?: number): World => {
    const w = createDuelWorld(
      vanguard(1),
      vanguard(2),
      1,
      k === undefined ? {} : { damageScale: k },
    );
    still(w.sides[0]);
    still(w.sides[1]);
    return w;
  };

  it('is the constant, and 1 on a map', () => {
    expect(scaled().sides[0].damageScale).toBe(DUEL_DAMAGE_SCALE);
    expect(scaled(0.25).sides[1].damageScale).toBe(0.25);
    expect(scaled(0).sides[0].damageScale).toBe(0);
  });

  it('takes half of a hit at ×0.5, in the damage and in what is recorded of it', () => {
    const taken = (k: number) => {
      const w = scaled(k);
      const [sa, sb] = w.sides;
      applyHit(w, sa.player, sb.player, sa.char.profile(sa.primary, 0), landed(100));
      const ev = w.events.find((e) => e.t === 'hit');
      return {
        damageTaken: sb.stats.damageTaken,
        damageDealt: sa.stats.damageDealt,
        pools: sb.player.es + sb.player.life,
        event: ev && ev.t === 'hit' ? ev.amount : 0,
        ledger: Object.values(sb.ledger.taken)
          .flatMap((m) => [...m.values()])
          .reduce((n, r) => n + r.dmg.reduce((x, y) => x + y, 0), 0),
      };
    };
    const full = taken(1);
    const half = taken(0.5);
    expect(full.damageTaken).toBeGreaterThan(0);
    expect(half.damageTaken).toBeCloseTo(full.damageTaken / 2, 9);
    expect(half.damageDealt).toBeCloseTo(full.damageDealt / 2, 9);
    expect(half.event).toBeCloseTo(full.event / 2, 9);
    expect(half.ledger).toBeCloseTo(full.ledger / 2, 9);
    // The pools lost the scaled amount, whatever the first took: half of 100 less than the full hit's share of them.
    expect(taken(0).damageTaken).toBe(0);
  });

  it('takes half of a burst (rawHit) and of every tick of damage over time at ×0.5', () => {
    const burst = (k: number) => {
      const w = scaled(k);
      rawHit(w, w.sides[1].player, 100, 3, null, 'Test');
      return w.sides[1].stats.damageTaken;
    };
    expect(burst(1)).toBeGreaterThan(0);
    expect(burst(0.5)).toBeCloseTo(burst(1) / 2, 9);
    const burning = (k: number) => {
      const w = scaled(k);
      const sb = w.sides[1];
      pushDot(sb.player.ail.ignites, { dps: 60, t: 5 });
      sb.player.ail.igniteMax = 1;
      run(w, 1);
      return sb.stats.damageTaken;
    };
    expect(burning(1)).toBeGreaterThan(0);
    expect(burning(0.5)).toBeCloseTo(burning(1) / 2, 6);
  });

  it('is the same for both sides', () => {
    const w = scaled(0.5);
    const [sa, sb] = w.sides;
    rawHit(w, sa.player, 100, 0, null, 'Test');
    rawHit(w, sb.player, 100, 0, null, 'Test');
    expect(sa.stats.damageTaken).toBeCloseTo(sb.stats.damageTaken, 6);
    expect(sa.stats.damageTaken).toBeGreaterThan(0);
  });

  it('leaves a minion’s damage taken as it is', () => {
    const taken = (k: number) => {
      const w = createDuelWorld(vanguard(1), skeletons(), 1, { damageScale: k });
      const [sa, sb] = w.sides;
      const m = minionOf(w, sb, 'callBonewalkers', sb.player.x - 1, sb.player.y);
      const life0 = m.life;
      rawHit(w, m, 20, 0, sa, 'Test');
      return life0 - m.life;
    };
    expect(taken(1)).toBeGreaterThan(0);
    expect(taken(0.5)).toBeCloseTo(taken(1), 9);
  });

  it('leaves the ailments of a hit as the unscaled hit made them (an ignite burns for its own damage, which it takes scaled)', () => {
    const ignite = (k: number) => {
      const w = scaled(k);
      const [sa, sb] = w.sides;
      applyHit(
        w,
        sa.player,
        sb.player,
        sa.char.profile(sa.primary, 0),
        landed(100, { ignite: 40 }),
      );
      return sb.player.ail.ignites.map((d) => d.dps);
    };
    expect(ignite(1)).toEqual([40]);
    expect(ignite(0.5)).toEqual([40]);
    expect(ignite(0.1)).toEqual([40]);
  });
});

describe('what a character goes for', () => {
  const screened = (strategyTarget?: 'rares' | 'lowest') => {
    const a = vanguard(1);
    if (strategyTarget) a.strategy = { target: strategyTarget };
    const w = createDuelWorld(a, skeletons(), 1);
    const [sa, sb] = w.sides;
    // B's minion stands 3 tiles nearer to A than B does.
    const m = minionOf(w, sb, 'callBonewalkers', sb.player.x - 3, sb.player.y);
    return { w, sa, sb, m };
  };

  it('is the nearest of the other side’s minions and character, as the priority says', () => {
    const near = screened();
    expect(findTargetForTest(near.w, near.sa)).toBe(near.m);
    const weakest = screened('lowest');
    weakest.m.life = 5;
    expect(findTargetForTest(weakest.w, weakest.sa)).toBe(weakest.m);
  });

  it('counts the other character as a boss for the `rares` priority', () => {
    const { w, sa, sb, m } = screened('rares');
    // It is 3 tiles farther than the minion, and the rare's 4 tiles of advantage put it first.
    expect(Math.hypot(sb.player.x - sa.player.x, sb.player.y - sa.player.y)).toBeGreaterThan(
      Math.hypot(m.x - sa.player.x, m.y - sa.player.y),
    );
    expect(findTargetForTest(w, sa)).toBe(sb.player);
  });

  it('kills a screen of minions and then the character behind it, and does not give the fight up', () => {
    const w = createDuelWorld(swordsman(), skeletons(), 1);
    const [sa, sb] = w.sides;
    still(sb, false);
    // Four minions in an arc in front of B, standing still with little life: a melee blow cannot reach B past them.
    const screen = [-1.8, -0.6, 0.6, 1.8].map((dy) => {
      const m = minionOf(w, sb, 'callBonewalkers', sb.player.x - 2, sb.player.y + dy);
      m.stunT = 1e9;
      m.life = 40;
      return m;
    });
    while (w.t < 60 && sb.player.alive && sa.player.alive) stepWorld(w);
    expect(screen.every((m) => !m.alive)).toBe(true);
    expect(sb.player.alive).toBe(false);
    expect(sa.stats.stalls).toBe(0);
    // None of those kills counts for the experience or the kill count of a map.
    expect(sa.stats.kills).toBe(0);
    expect(sa.xp).toBe(0);
  });

  it('gives the flasks’ charges and life on kill for a minion of the other side, and nothing for its own', () => {
    const a = swordsman();
    a.flasks = vanguard(1).flasks;
    a.equipment.body!.uniqueMods = [{ stat: 'lifeOnKill', kind: 'base', value: 20 }];
    const w = createDuelWorld(a, skeletons(), 1);
    const [sa, sb] = w.sides;
    expect(sa.flasks.length).toBeGreaterThan(0);
    for (const f of sa.flasks) f.charges = 0;
    sa.player.life = 100;
    const theirs = minionOf(w, sb, 'callBonewalkers', sb.player.x - 3, sb.player.y);
    rawHit(w, theirs, 1e9, 0, sa, 'Test');
    expect(theirs.alive).toBe(false);
    expect(sa.flasks.every((f) => f.charges > 0)).toBe(true);
    expect(sa.player.life).toBeGreaterThanOrEqual(120);
    // A kill of a minion is no kill: no experience, no count, nothing dropped.
    expect(sa.stats.kills).toBe(0);
    expect(sa.xp).toBe(0);
    expect(w.drops).toHaveLength(0);
    // The other side's minion falling to its own side's damage gives A nothing, and neither does a hit on one that stands.
    const charges = sa.flasks.map((f) => f.charges);
    const alsoTheirs = minionOf(w, sb, 'callBonewalkers', sb.player.x - 3, sb.player.y + 1);
    rawHit(w, alsoTheirs, 1e9, 0, sb, 'Test');
    expect(sa.flasks.map((f) => f.charges)).toEqual(charges);
  });
});

describe('fairness: the same build on both sides wins about half', () => {
  /**
   * Over `n` seeds the wins of side 0 against side 1 (the same build, so a fair fight): a coin's wins stand 3 standard deviations
   * (1.5 * sqrt(n) wins, of the n fights that were decided) from n / 2 about 1 time in 370. The fights are deterministic, so the
   * band only has to hold for the code as it is, and it is wide enough that a change of the numbers does not trip it by chance.
   */
  const share = (a: Build, n: number): { w0: number; w1: number; band: number } => {
    let w0 = 0;
    let w1 = 0;
    for (let seed = 1; seed <= n; seed++) {
      const r = runDuel(structuredClone(a), structuredClone(a), seed);
      if (r.winner === 0) w0++;
      else if (r.winner === 1) w1++;
    }
    return { w0, w1, band: 1.5 * Math.sqrt(w0 + w1) };
  };

  it.each(['vanguard', 'strider', 'mystic'])('two %s starters over 60 seeds', (cls) => {
    const { w0, w1, band } = share(newRun(cls, 1).build, 60);
    expect(w0 + w1).toBeGreaterThan(30);
    expect(Math.abs(w0 - (w0 + w1) / 2)).toBeLessThanOrEqual(band);
  });

  it('two summoners over 30 seeds (the first minion is in front of each, not behind the one standing east)', () => {
    const { w0, w1, band } = share(skeletons(), 30);
    expect(w0 + w1).toBeGreaterThan(15);
    expect(Math.abs(w0 - (w0 + w1) / 2)).toBeLessThanOrEqual(band);
  });
});

describe('a summon in a duel', () => {
  it('puts its first minion in front of the character, toward the other one; on a map it stays due east', () => {
    const w = createDuelWorld(vanguard(1), skeletons(), 1);
    const sb = w.sides[1];
    const c = sb.char.utilities.find((u) => u.skill.id === 'callBonewalkers')!;
    summonMinions(w, sb, c, sb.char.profile(c, 0));
    expect(sb.minions.length).toBeGreaterThan(0);
    // B stands east, facing west: its minion is west of it.
    expect(sb.minions[0].x).toBeCloseTo(sb.player.x - 1.2, 6);
    expect(sb.minions[0].y).toBeCloseTo(sb.player.y, 6);
    const { world } = createDummyWorld(skeletons(), { distance: 8 });
    const s = world.sides[0];
    const cm = s.char.utilities.find((u) => u.skill.id === 'callBonewalkers')!;
    summonMinions(world, s, cm, s.char.profile(cm, 0));
    expect(s.minions[0].x).toBeCloseTo(s.player.x + 1.2, 6);
  });
});
