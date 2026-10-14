import { describe, expect, it } from 'vitest';
import { POUCH_LIMIT } from '../data/provisions';
import { addProvision, pouchCount } from './provisions';
import { acquireReprieve, reprieveBlocker } from './reprieves';
import { newRun, rollRewards, setMap, takeReward } from './run';
import { waysideOf } from './wayside';

describe('cards of a reward pick that are for the Wayside (docs/WAYSIDE.md 6.1 and 7.4)', () => {
  const pickAt = (seed: number, map: number) => {
    const run = newRun('vanguard', seed);
    run.build = { ...run.build, level: map };
    setMap(run, map);
    return { run, offers: rollRewards(run) };
  };

  it("a boss level's pick sometimes holds a Reprieve, one of the three cards", () => {
    let reprieves = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const { offers } = pickAt(seed, 20);
      expect(offers).toHaveLength(3);
      reprieves += offers.filter((o) => o.kind === 'pouch' && o.what === 'reprieve').length;
    }
    expect(reprieves).toBeGreaterThan(15);
    expect(reprieves).toBeLessThan(50);
  });

  it('holds no Reprieve while one is held or all three have been taken, nor on a pick of uniques', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const held = pickAt(seed, 20);
      acquireReprieve(held.run, 'ferryToken');
      expect(rollRewards(held.run).some((o) => o.kind === 'pouch' && o.what === 'reprieve')).toBe(
        false,
      );
      for (const map of [25, 50, 75])
        expect(pickAt(seed, map).offers.some((o) => o.kind === 'pouch')).toBe(false);
    }
  });

  it("a fifth map's pick sometimes holds a provision, never when the Pouch is full", () => {
    let provisions = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const { run, offers } = pickAt(seed, 15);
      provisions += offers.filter((o) => o.kind === 'pouch' && o.what === 'provision').length;
      expect(offers.some((o) => o.kind === 'pouch' && o.what === 'reprieve')).toBe(false);
      for (let i = 0; i < POUCH_LIMIT; i++) addProvision(run, 'wardOil');
      expect(rollRewards(run).some((o) => o.kind === 'pouch')).toBe(false);
    }
    expect(provisions).toBeGreaterThan(8);
  });

  it('taking a card puts it in the Pouch or the Reprieve slot, and one that no longer fits leaves the pick open', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const { run, offers } = pickAt(seed, 20);
      const card = offers.find((o) => o.kind === 'pouch' && o.what === 'reprieve');
      if (!card || card.kind !== 'pouch') continue;
      run.reward = offers;
      // Bought something else first: the slot is taken.
      acquireReprieve(run, 'lastSpark');
      expect(takeReward(run, card.uid)).toBe(false);
      expect(run.reward).toBe(offers);
      waysideOf(run).reprieve = null;
      expect(takeReward(run, card.uid)).toBe(true);
      expect(run.reward).toBeNull();
      expect(waysideOf(run).reprieve).toBe(card.id);
      expect(reprieveBlocker(run)).toBe('You already hold a reprieve');
      return;
    }
    throw new Error('no Reprieve card found');
  });

  it('taking a provision card fills the Pouch', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const { run, offers } = pickAt(seed, 15);
      const card = offers.find((o) => o.kind === 'pouch');
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
