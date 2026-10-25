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
  type DuelOpts,
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

/**
 * The rules of F4, before docs/DUEL-BALANCE.md: no reprieves, no life curve, a 90 s cap. Two level 1 starters with no gems take
 * minutes to go through four lives each, so the tests of how a fight works (not of the balance) play by these.
 */
const F4: DuelOpts = { reprieves: 0, lifeCurve: false, maxTime: 90 };

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
    const r = runDuel(vanguard(1), vanguard(2), 1, F4);
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
    const r = runDuel(vanguard(1), vanguard(2), 1, F4);
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

  it('the cap with as many reprieves used on each side is a draw by time', () => {
    expect(DUEL_MAX_TIME).toBe(250);
    const { result } = playDuel(vanguard(1), vanguard(2), 1, { maxTime: 2 });
    expect(result.how).toBe('time');
    expect(result.winner).toBeNull();
    expect(result.time).toBeGreaterThan(1.9);
    expect(result.time).toBeLessThan(2.2);
  });
});

describe('the order of the sides', () => {
  /** The ids of the sides in the order they were stepped, one list for each tick (the flask policy is asked once for each side). */
  const trace = (w: World, ticks: number): number[][] => {
    const seen: number[][] = [];
    for (let i = 0; i < ticks; i++) {
      const tick: number[] = [];
      stepWorld(w, (_w, s) => {
        tick.push(s.id);
        return [];
      });
      seen.push(tick);
    }
    return seen;
  };

  it('changes within one fight, tick by tick, and neither side is first more often than a fair coin allows', () => {
    const seen = trace(createDuelWorld(vanguard(1), vanguard(2), 1), 1000);
    expect(seen.every((t) => t.length === 2 && t[0] !== t[1])).toBe(true);
    const first0 = seen.filter((t) => t[0] === 0).length;
    // 3 standard deviations of a fair coin over 1000 ticks: 500 plus or minus 47.
    expect(Math.abs(first0 - 500)).toBeLessThanOrEqual(47);
    // Not the alternation of the parity of the tick: some tick follows one of the same order.
    expect(seen.some((t, i) => i > 0 && t[0] === seen[i - 1][0])).toBe(true);
    // And no fixed rhythm either: the ticks that put side 1 first are not all of one parity.
    const parities = new Set(seen.flatMap((t, i) => (t[0] === 1 ? [(i + 1) % 2] : [])));
    expect(parities.size).toBe(2);
  });

  it('is drawn from the tick and the seed: the same seed gives the same order, another seed another', () => {
    const order = (seed: number) => trace(createDuelWorld(vanguard(1), vanguard(2), seed), 200);
    expect(order(7)).toEqual(order(7));
    expect(order(7)).not.toEqual(order(8));
    expect(createDuelWorld(vanguard(1), vanguard(2), 7).orderSeed).toBe(7);
  });

  it('is `sides` itself or the same one array reversed, so a tick does not allocate', () => {
    const w = createDuelWorld(vanguard(1), vanguard(2), 1);
    const orders = new Set<unknown>();
    for (let i = 0; i < 40; i++) {
      stepWorld(w);
      orders.add(w.order);
    }
    expect(orders.size).toBe(2);
    expect(orders.has(w.sides)).toBe(true);
    const reversed = [...orders].find((o) => o !== w.sides);
    expect(reversed).toEqual([w.sides[1], w.sides[0]]);
  });

  it('puts the characters in their places in the actor loop too', () => {
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
    const orders = new Set<string>();
    for (let seed = 1; seed <= 12; seed++) {
      const { order, uses } = firstUses(seed);
      expect(uses).toEqual(order);
      orders.add(order.join(','));
    }
    // Over seeds both of them are first at that exchange.
    expect([...orders].sort()).toEqual(['1,2', '2,1']);
  });

  it('never changes for one side: a map’s order is its `sides`, tick after tick', () => {
    const { world } = createDummyWorld(vanguard(1), { distance: 4 });
    expect(world.sides).toHaveLength(1);
    expect(world.orderSeed).toBe(0);
    for (let i = 0; i < 10; i++) {
      stepWorld(world);
      expect(world.order).toBe(world.sides);
    }
  });
});

describe('the damage scale', () => {
  /** A world with the two characters standing still and taking what comes (every life at the whole scale). */
  const scaled = (k?: number): World => {
    const w = createDuelWorld(
      vanguard(1),
      vanguard(2),
      1,
      k === undefined ? { stages: null } : { damageScale: k, stages: null },
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
    // A Slag Carapace's burst is of what the shell took as it was before the scale, and is scaled once, as it lands on the other
    // character: ×0.5 of the burst at ×1, not ×0.25.
    const shellBurst = (k: number) => {
      const w = scaled(k);
      const [sa, sb] = w.sides;
      sb.buffT.moltenGuard = 1e9;
      sb.shell = {
        left: 1e9,
        taken: 0,
        absorb: 0.5,
        reflect: 100,
        radius: 30,
        buff: 'moltenGuard',
        profile: sb.char.profile(sb.primary, 0),
      };
      rawHit(w, sb.player, 100, 0, null, 'Test');
      expect(sb.shell!.taken).toBeGreaterThan(0);
      // The buff ends: the shell goes out as fire on A.
      sb.buffT.moltenGuard = 0;
      stepWorld(w);
      expect(sb.shell).toBeNull();
      return sa.stats.damageTaken;
    };
    expect(shellBurst(1)).toBeGreaterThan(0);
    expect(shellBurst(0.5)).toBeCloseTo(shellBurst(1) / 2, 6);
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
    const w = createDuelWorld(swordsman(), skeletons(), 1, F4);
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
      const r = runDuel(structuredClone(a), structuredClone(a), seed, F4);
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
