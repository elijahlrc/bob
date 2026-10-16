import { describe, expect, it } from 'vitest';
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

  it('is rolled without touching the run (no uids taken from its counter)', () => {
    const { run } = stockAt(12);
    const before = run.nextUid;
    rollSale(run, '12.1');
    expect(run.nextUid).toBe(before);
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
