import { describe, expect, it } from 'vitest';
import { MARKET_SIZE, priceAt, WARE_BASE } from '../data/market';
import { provisionDef } from '../data/provisions';
import { botShop } from './bot';
import { buyWare, ensureMarket, rollMarket } from './market';
import { reprieveOnSale } from './reprieves';
import { loadRun, MemoryStore, saveRun } from './save';
import { newRun, setMap } from './run';

describe('the Market stock (docs/WAYSIDE.md 4.2)', () => {
  it('is the same for a run and a level every time, and different between levels', () => {
    const a = newRun('vanguard', 5);
    setMap(a, 12);
    const b = newRun('vanguard', 5);
    setMap(b, 12);
    expect(JSON.stringify(rollMarket(a))).toBe(JSON.stringify(rollMarket(b)));
    setMap(b, 13);
    expect(JSON.stringify(rollMarket(a))).not.toBe(JSON.stringify(rollMarket(b)));
  });

  it('has the planned kinds of ware at prices that follow the level the way salvage does', () => {
    const run = newRun('mystic', 9);
    setMap(run, 25);
    const stock = rollMarket(run);
    expect(stock).toHaveLength(MARKET_SIZE);
    expect(stock.map((w) => w.kind).sort()).toEqual(
      [
        reprieveOnSale(9, 25) ? 'reprieve' : 'currency',
        'flask',
        'gear',
        'gear',
        'gem',
        'provision',
      ].sort(),
    );
    for (const w of stock) {
      const base =
        w.kind === 'provision'
          ? provisionDef(w.ref!).base
          : WARE_BASE[w.kind as keyof typeof WARE_BASE];
      expect(w.price).toBe(priceAt(base, 25));
      expect(w.sold).toBeUndefined();
    }
    expect(priceAt(30, 50)).toBe(60);
    for (const w of stock.filter((x) => x.kind === 'gear')) {
      expect(w.item?.kind).toBe('item');
      if (w.item?.kind === 'item') expect(w.item.rarity).toBe('rare');
    }
  });

  it('is rolled without touching the run (no uids taken from its counter)', () => {
    const run = newRun('vanguard', 3);
    setMap(run, 9);
    const before = run.nextUid;
    rollMarket(run);
    expect(run.nextUid).toBe(before);
  });

  it('is kept with the run for the level, restocks on the next, and survives a save', () => {
    const run = newRun('vanguard', 4);
    setMap(run, 10);
    const first = ensureMarket(run);
    expect(ensureMarket(run)).toBe(first);
    first[0].sold = true;
    const store = new MemoryStore();
    saveRun(store, run);
    const back = loadRun(store);
    expect(back.status).toBe('ok');
    if (back.status === 'ok') {
      expect(ensureMarket(back.run)[0].sold).toBe(true);
      expect(ensureMarket(back.run)).toHaveLength(MARKET_SIZE);
    }
    setMap(run, 11);
    const next = ensureMarket(run);
    expect(next).not.toBe(first);
    expect(next.every((w) => !w.sold)).toBe(true);
  });
});

describe('buying', () => {
  it('takes the Dust, gives the ware a real uid, and cannot be done twice', () => {
    const run = newRun('vanguard', 6);
    setMap(run, 14);
    const stock = ensureMarket(run);
    const gear = stock.find((w) => w.kind === 'gear')!;
    run.dust = gear.price - 1;
    const bag = run.inventory.length;
    expect(buyWare(run, gear.id)).toEqual({ ok: false, reason: 'Not enough Bone Dust' });
    expect(run.inventory).toHaveLength(bag);
    expect(run.dust).toBe(gear.price - 1);
    run.dust = gear.price + 7;
    const uid = run.nextUid;
    expect(buyWare(run, gear.id)).toEqual({ ok: true });
    expect(run.dust).toBe(7);
    expect(run.inventory).toHaveLength(bag + 1);
    expect(run.inventory.at(-1)!.uid).toBe(uid);
    expect(run.nextUid).toBe(uid + 1);
    expect(run.unseen).toContain(uid);
    expect(buyWare(run, gear.id)).toEqual({ ok: false, reason: 'Already bought' });
    expect(run.dust).toBe(7);
  });

  it('puts a currency bundle in the pouch', () => {
    const run = newRun('vanguard', 6);
    setMap(run, 14);
    const bundle = ensureMarket(run).find((w) => w.kind === 'currency')!;
    run.dust = 1000;
    expect(buyWare(run, bundle.id).ok).toBe(true);
    expect(run.currency[bundle.ref!]).toBe(bundle.count);
  });

  it('refuses a ware that is not there', () => {
    const run = newRun('vanguard', 6);
    expect(buyWare(run, 'nope').ok).toBe(false);
  });
});

describe('the bot at the Market', () => {
  it('spends only what it has, and never buys a ware twice', () => {
    for (const seed of [1, 2, 3]) {
      const run = newRun('vanguard', seed);
      setMap(run, 20);
      run.build = { ...run.build, level: 20 };
      run.dust = 400;
      botShop(run);
      expect(run.dust).toBeGreaterThanOrEqual(0);
      const bought = ensureMarket(run).filter((w) => w.sold);
      expect(400 - run.dust).toBe(bought.reduce((n, w) => n + w.price, 0));
    }
  });
});
