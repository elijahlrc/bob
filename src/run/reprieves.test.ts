import { describe, expect, it } from 'vitest';
import { POUCH_LIMIT } from '../data/provisions';
import { REPRIEVE_FROM } from '../data/reprieves';
import { buyWare, ensureMarket } from './market';
import { addProvision, pouchCount } from './provisions';
import { acquireReprieve, reprieveBlocker, reprieveOnSale } from './reprieves';
import { newRun, rollRewards, setMap, takeReward } from './run';
import { waysideOf } from './wayside';

describe('Reprieves for sale (docs/WAYSIDE.md 7.4)', () => {
  it('are not sold before level 20, never on two levels in a row, and sometimes after', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      let n = 0;
      for (let map = 1; map <= 99; map++) {
        const sale = reprieveOnSale(seed, map);
        if (map < REPRIEVE_FROM) expect(sale).toBeNull();
        if (sale) {
          n++;
          expect(reprieveOnSale(seed, map - 1)).toBeNull();
        }
      }
      expect(n, `seed ${seed}`).toBeGreaterThan(5);
    }
  });

  it('take the last slot of the stock on those levels, at a price that follows the level', () => {
    let found = 0;
    for (let seed = 1; seed <= 30 && !found; seed++) {
      for (let map = REPRIEVE_FROM; map < 60 && !found; map++) {
        if (!reprieveOnSale(seed, map)) continue;
        const run = newRun('vanguard', seed);
        setMap(run, map);
        const ware = ensureMarket(run).find((w) => w.kind === 'reprieve')!;
        expect(ware).toBeDefined();
        expect(ware.ref).toBe(reprieveOnSale(seed, map));
        expect(ensureMarket(run).some((w) => w.kind === 'currency')).toBe(false);
        run.dust = ware.price + 3;
        expect(buyWare(run, ware.id)).toEqual({ ok: true });
        expect(waysideOf(run).reprieve).toBe(ware.ref);
        expect(waysideOf(run).reprieves).toBe(1);
        expect(run.dust).toBe(3);
        found++;
      }
    }
    expect(found).toBe(1);
  });

  it('cannot be bought while one is held, and the Dust is kept', () => {
    for (let seed = 1; seed <= 30; seed++) {
      for (let map = REPRIEVE_FROM; map < 60; map++) {
        if (!reprieveOnSale(seed, map)) continue;
        const run = newRun('vanguard', seed);
        setMap(run, map);
        acquireReprieve(run, 'ferryToken');
        const ware = ensureMarket(run).find((w) => w.kind === 'reprieve')!;
        run.dust = 5000;
        expect(buyWare(run, ware.id)).toEqual({ ok: false, reason: 'You already hold a reprieve' });
        expect(run.dust).toBe(5000);
        return;
      }
    }
    throw new Error('no sale found');
  });
});

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
