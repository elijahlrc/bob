import { describe, expect, it } from 'vitest';
import { provisionDef } from '../data/provisions';
import { GEAR_ILVL_BONUS, priceAt, QUARTERMASTER_SIZE, WARE_BASE } from '../data/sale';
import type { Item } from '../data/types';
import { addProvision } from './provisions';
import { grantWare, rollSale } from './sale';
import { newRun, setMap } from './run';
import { waysideOf } from './wayside';

/** The stock a Quartermaster would lay out on a level of a run. */
function stockAt(map: number, seed = 5, offerId = `${map}.1`) {
  const run = newRun('vanguard', seed);
  setMap(run, map);
  run.build = { ...run.build, level: map };
  return { run, stock: rollSale(run, offerId) };
}

describe("the Quartermaster's stock (docs/WAYSIDE.md 5.2)", () => {
  it('is the same for a run, a level and an offer every time, and different between offers', () => {
    const a = stockAt(25);
    const b = stockAt(25);
    expect(JSON.stringify(a.stock)).toBe(JSON.stringify(b.stock));
    expect(JSON.stringify(rollSale(a.run, '25.2'))).not.toBe(JSON.stringify(a.stock));
  });

  it('holds eight wares of the planned kinds, priced the way salvage is', () => {
    const { stock } = stockAt(30);
    expect(stock).toHaveLength(QUARTERMASTER_SIZE);
    const kinds = stock.map((w) => w.kind).sort();
    expect(kinds).toEqual(
      ['gear', 'gear', 'gem', 'flask', 'provision', 'provision', 'provision', 'reprieve'].sort(),
    );
    for (const w of stock) {
      if (w.kind === 'provision' || w.kind === 'reprieve')
        expect(w.price).toBe(priceAt(provisionDef(w.ref!).base, 30));
      else if (w.kind === 'gear') expect(w.price).toBe(priceAt(WARE_BASE.gear, 30));
      expect(w.sold).toBeUndefined();
    }
    expect(
      stock
        .filter((w) => w.kind === 'provision')
        .every((w) => provisionDef(w.ref!).kind !== 'reprieve'),
    ).toBe(true);
    expect(priceAt(30, 50)).toBe(60);
  });

  it('holds a reprieve from the first stop on', () => {
    expect(stockAt(6).stock.filter((w) => w.kind === 'reprieve')).toHaveLength(1);
    expect(stockAt(40).stock.filter((w) => w.kind === 'reprieve')).toHaveLength(1);
  });

  it('is rolled without touching the run (no uids taken from its counter)', () => {
    const { run } = stockAt(12);
    const before = run.nextUid;
    rollSale(run, '12.1');
    expect(run.nextUid).toBe(before);
  });
});

describe('the gear it sells (docs/WAYSIDE.md 3)', () => {
  it('is a rare at the item level of an offer two levels up, and the best of a few rolls', () => {
    const power = (it: Item) => it.affixes.reduce((n, a) => n + a.tier, 0);
    let sum = 0;
    let n = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const { stock } = stockAt(30, seed);
      for (const w of stock.filter((x) => x.kind === 'gear')) {
        const it = w.item as Item;
        expect(it.kind).toBe('item');
        expect(it.rarity).toBe('rare');
        expect(it.ilvl).toBe(30 + GEAR_ILVL_BONUS);
        sum += power(it);
        n++;
      }
    }
    // A plain rare of that level has a lower average tier sum than the best of four.
    expect(sum / n).toBeGreaterThan(6);
  });
});

describe('what a ware does when it joins the run', () => {
  it('gives an item a real uid, and a noted one', () => {
    const { run, stock } = stockAt(14);
    const gear = stock.find((w) => w.kind === 'gear')!;
    const bag = run.inventory.length;
    const uid = run.nextUid;
    grantWare(run, gear);
    expect(run.inventory).toHaveLength(bag + 1);
    expect(run.inventory.at(-1)!.uid).toBe(uid);
    expect(run.nextUid).toBe(uid + 1);
    expect(run.unseen).toContain(uid);
  });

  it('puts a provision or a reprieve in the pouch', () => {
    const { run, stock } = stockAt(40);
    const provision = stock.find((w) => w.kind === 'provision')!;
    grantWare(run, provision);
    expect(waysideOf(run).pouch[provision.ref!]).toBe(1);
    const reprieve = stock.find((w) => w.kind === 'reprieve')!;
    grantWare(run, reprieve);
    expect(waysideOf(run).pouch[reprieve.ref!]).toBe(1);
    addProvision(run, 'wardOil');
  });
});
