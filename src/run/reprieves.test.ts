import { describe, expect, it } from 'vitest';
import { isReprieveId, POUCH_LIMIT } from '../data/provisions';
import { addProvision, heldReprieveIds, pouchCount } from './provisions';
import { acquireReprieve, reprieveBlocker, spendReprieve } from './reprieves';
import { newRun, rollRewards, setMap, takeReward, type RewardCard } from './run';
import { waysideOf } from './wayside';

const isReprieveCard = (o: RewardCard) => o.kind === 'pouch' && isReprieveId(o.id);
const isProvisionCard = (o: RewardCard) => o.kind === 'pouch' && !isReprieveId(o.id);

describe('reprieves in the pouch (docs/WAYSIDE.md 7)', () => {
  it('are taken into the pouch with the other provisions, and the pouch holds three', () => {
    const run = newRun('vanguard', 1);
    expect(reprieveBlocker(run)).toBeNull();
    expect(acquireReprieve(run, 'lastSpark').ok).toBe(true);
    expect(acquireReprieve(run, 'lastSpark').ok).toBe(true);
    addProvision(run, 'wardOil');
    expect(pouchCount(run)).toBe(3);
    expect(acquireReprieve(run, 'ferryToken')).toEqual({ ok: false, reason: 'Your pouch is full' });
    expect(heldReprieveIds(run)).toEqual(['lastSpark', 'lastSpark']);
  });

  it('are used up one at a time, and a Bargain Coin leaves its curse', () => {
    const run = newRun('vanguard', 1);
    setMap(run, 8);
    acquireReprieve(run, 'bargainCoin');
    acquireReprieve(run, 'lastSpark');
    spendReprieve(run, 'bargainCoin');
    expect(waysideOf(run).pouch).toEqual({ lastSpark: 1 });
    expect(waysideOf(run).curses).toEqual([{ id: 'bargain', until: 13 }]);
    // Spending what is not there does nothing.
    spendReprieve(run, 'bargainCoin');
    expect(waysideOf(run).curses).toHaveLength(1);
  });
});

describe('cards of a reward pick that are for the Wayside (docs/WAYSIDE.md 6.1 and 7.4)', () => {
  const pickAt = (seed: number, map: number) => {
    const run = newRun('vanguard', seed);
    run.build = { ...run.build, level: map };
    setMap(run, map);
    return { run, offers: rollRewards(run) };
  };

  it("a boss level's pick often holds a reprieve, one of the three cards", () => {
    let reprieves = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const { offers } = pickAt(seed, 20);
      expect(offers).toHaveLength(3);
      reprieves += offers.filter(isReprieveCard).length;
    }
    expect(reprieves).toBeGreaterThan(25);
    expect(reprieves).toBeLessThan(50);
  });

  it("a fifth map's pick holds a reprieve less often, and a provision now and then", () => {
    let reprieves = 0;
    let provisions = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const { offers } = pickAt(seed, 15);
      reprieves += offers.filter(isReprieveCard).length;
      provisions += offers.filter(isProvisionCard).length;
    }
    expect(reprieves).toBeGreaterThan(15);
    expect(reprieves).toBeLessThan(45);
    expect(provisions).toBeGreaterThan(15);
    expect(provisions).toBeLessThan(50);
  });

  it('holds nothing for the pouch when it is full, nor on a pick of uniques', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const full = pickAt(seed, 20);
      while (addProvision(full.run, 'wardOil'));
      expect(pouchCount(full.run)).toBe(POUCH_LIMIT);
      expect(rollRewards(full.run).some((o) => o.kind === 'pouch')).toBe(false);
      for (const map of [25, 75])
        expect(pickAt(seed, map).offers.some((o) => o.kind === 'pouch')).toBe(false);
    }
  });

  it('shows up on the very first pick (level 5) for some runs', () => {
    let any = 0;
    for (let seed = 1; seed <= 60; seed++)
      if (pickAt(seed, 5).offers.some((o) => o.kind === 'pouch')) any++;
    expect(any).toBeGreaterThan(10);
  });

  it('taking a card puts it in the pouch, and one that no longer fits leaves the pick open', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const { run, offers } = pickAt(seed, 20);
      const card = offers.find(isReprieveCard);
      if (!card || card.kind !== 'pouch') continue;
      run.reward = offers;
      // The pouch filled up first.
      while (addProvision(run, 'wardOil'));
      expect(takeReward(run, card.uid)).toBe(false);
      expect(run.reward).toBe(offers);
      waysideOf(run).pouch = {};
      expect(takeReward(run, card.uid)).toBe(true);
      expect(run.reward).toBeNull();
      expect(waysideOf(run).pouch[card.id]).toBe(1);
      return;
    }
    throw new Error('no reprieve card found');
  });

  it('taking a provision card fills the pouch', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const { run, offers } = pickAt(seed, 15);
      const card = offers.find(isProvisionCard);
      if (!card || card.kind !== 'pouch') continue;
      run.reward = offers;
      expect(takeReward(run, card.uid)).toBe(true);
      expect(pouchCount(run)).toBe(1);
      expect(waysideOf(run).pouch[card.id]).toBe(1);
      return;
    }
    throw new Error('no provision card found');
  });
});
