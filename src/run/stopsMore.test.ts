import { describe, expect, it } from 'vitest';
import { priceAt } from '../data/sale';
import type { StopId } from '../data/stops';
import { botRun } from './bot';
import { botStopChoice } from './botStop';
import { makeStop } from './offers';
import { addProvision, pouchCount } from './provisions';
import { standingAffixes } from './reprieves';
import { newRun, planFor, setMap, type RunState } from './run';
import { saleStock, shrineBlessings, stopProblem, takeStop } from './stops';
import { waysideOf } from './wayside';

/** A run on a level with the given stop put in its second slot (the schedule is tested in stops.test.ts). */
function withStop(stop: StopId, map: number, seed = 31): { run: RunState; slot: number } {
  const run = newRun('vanguard', seed);
  setMap(run, map);
  run.build = { ...run.build, level: map };
  run.offers[1] = makeStop(map, 1, stop);
  return { run, slot: 1 };
}

describe('the Shrine', () => {
  it('offers three blessings, gives the one chosen, and it counts on the maps that follow', () => {
    const { run, slot } = withStop('shrine', 12);
    const ids = shrineBlessings(run, run.offers[slot]);
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    expect(shrineBlessings(run, run.offers[slot])).toEqual(ids);
    expect(takeStop(run, slot, { stop: 'shrine', blessing: 'nope' }).ok).toBe(false);
    expect(waysideOf(run).blessing).toBeNull();
    expect(takeStop(run, slot, { stop: 'shrine', blessing: ids[0] }).ok).toBe(true);
    expect(waysideOf(run).blessing).toBe(ids[0]);
    expect(standingAffixes(run)).toEqual([`blessing.${ids[0]}`]);
    expect(planFor(run, run.offers[0]).affixes).toContain(`blessing.${ids[0]}`);
    expect(run.map).toBe(13);
  });

  it("is ended by the next stop, and replaced by the next Shrine's", () => {
    const { run, slot } = withStop('shrine', 12);
    const first = shrineBlessings(run, run.offers[slot])[0];
    takeStop(run, slot, { stop: 'shrine', blessing: first });
    run.offers[1] = makeStop(run.map, 1, 'awlsmith');
    run.build.equipment.body = { ...run.build.equipment.body!, ilvl: 80 };
    expect(takeStop(run, 1, { stop: 'awlsmith', itemUid: run.build.equipment.body!.uid }).ok).toBe(
      true,
    );
    expect(waysideOf(run).blessing).toBeNull();
    run.offers[1] = makeStop(run.map, 1, 'shrine');
    const next = shrineBlessings(run, run.offers[1])[0];
    takeStop(run, 1, { stop: 'shrine', blessing: next });
    expect(waysideOf(run).blessing).toBe(next);
  });
});

describe('the Quartermaster', () => {
  it('sells eight wares, a reprieve among them', () => {
    const { run, slot } = withStop('quartermaster', 30);
    const stock = saleStock(run, run.offers[slot]);
    expect(stock).toHaveLength(8);
    expect(saleStock(run, run.offers[slot]).map((w) => w.id + w.price)).toEqual(
      stock.map((w) => w.id + w.price),
    );
    expect(stock.filter((w) => w.kind === 'reprieve')).toHaveLength(1);
    const gear = stock.find((w) => w.kind === 'gear')!;
    expect(gear.price).toBe(priceAt(30, 30));
    const early = withStop('quartermaster', 6);
    expect(saleStock(early.run, early.run.offers[1]).some((w) => w.kind === 'reprieve')).toBe(true);
  });

  it('takes the cart, pays for it, and passes the level; or does nothing when the cart is wrong', () => {
    const { run, slot } = withStop('quartermaster', 30);
    const stock = saleStock(run, run.offers[slot]);
    const gem = stock.find((w) => w.kind === 'gem')!;
    const flask = stock.find((w) => w.kind === 'flask')!;
    run.dust = gem.price + flask.price + 4;
    const bag = run.inventory.length;
    expect(takeStop(run, slot, { stop: 'quartermaster', buy: [gem.id, gem.id] }).ok).toBe(false);
    expect(takeStop(run, slot, { stop: 'quartermaster', buy: ['99'] }).ok).toBe(false);
    run.dust = gem.price - 1;
    expect(takeStop(run, slot, { stop: 'quartermaster', buy: [gem.id] }).ok).toBe(false);
    expect(run.map).toBe(30);
    expect(run.inventory).toHaveLength(bag);
    run.dust = gem.price + flask.price + 4;
    expect(takeStop(run, slot, { stop: 'quartermaster', buy: [gem.id, flask.id] }).ok).toBe(true);
    expect(run.dust).toBe(4);
    expect(run.inventory).toHaveLength(bag + 2);
    expect(run.inventory.every((x) => x.uid > 0)).toBe(true);
    expect(run.map).toBe(31);
    expect(run.history.at(-1)).toMatchObject({ status: 'stop', stop: 'quartermaster' });
  });

  it('takes a reprieve into the pouch, and holds no more than the pouch has room for', () => {
    const { run, slot } = withStop('quartermaster', 40);
    const stock = saleStock(run, run.offers[slot]);
    const rep = stock.find((w) => w.kind === 'reprieve')!;
    const provisions = stock.filter((w) => w.kind === 'provision');
    run.dust = 100000;
    // Three wares for the pouch of three is fine; four is not.
    const four = [rep, ...provisions].slice(0, 4).map((w) => w.id);
    expect(stopProblem(run, slot, { stop: 'quartermaster', buy: four })).toBe(
      'Your pouch cannot hold that many',
    );
    expect(takeStop(run, slot, { stop: 'quartermaster', buy: four.slice(0, 3) }).ok).toBe(true);
    expect(waysideOf(run).pouch[rep.ref!]).toBe(1);
    expect(pouchCount(run)).toBe(3);
    run.offers[1] = makeStop(run.map, 1, 'quartermaster');
    const again = saleStock(run, run.offers[1]).find((w) => w.kind === 'reprieve')!;
    expect(stopProblem(run, 1, { stop: 'quartermaster', buy: [again.id] })).toBe(
      'Your pouch cannot hold that many',
    );
  });
});

describe('the Ferryman', () => {
  it('gives the reprieve chosen for nothing, and a curse for five levels', () => {
    const { run, slot } = withStop('ferryman', 20);
    expect(takeStop(run, slot, { stop: 'ferryman', reprieve: 'nope' }).ok).toBe(false);
    expect(takeStop(run, slot, { stop: 'ferryman', reprieve: 'lastSpark' }).ok).toBe(true);
    const w = waysideOf(run);
    expect(w.pouch).toEqual({ lastSpark: 1 });
    expect(w.curses).toEqual([{ id: 'bargain', until: 25 }]);
    expect(run.map).toBe(21);
    expect(planFor(run, run.offers[0]).affixes).toContain('curse.bargain');
  });

  it('needs room in the pouch', () => {
    const { run, slot } = withStop('ferryman', 20);
    while (addProvision(run, 'wardOil'));
    expect(stopProblem(run, slot, { stop: 'ferryman', reprieve: 'lastSpark' })).toBe(
      'Your pouch is full',
    );
    expect(takeStop(run, slot, { stop: 'ferryman', reprieve: 'lastSpark' }).ok).toBe(false);
    expect(run.map).toBe(20);
  });
});

describe('the bot at every stop', () => {
  it('has something valid to do at the Shrine and the Ferryman, and at the Quartermaster once it has Dust', () => {
    const shrine = withStop('shrine', 15);
    expect(botStopChoice(shrine.run, 1)).not.toBeNull();
    const ferry = withStop('ferryman', 25);
    expect(botStopChoice(ferry.run, 1)).toMatchObject({ stop: 'ferryman' });
    const sale = withStop('quartermaster', 30);
    expect(botStopChoice(sale.run, 1)).toBeNull();
    sale.run.dust = 100000;
    const choice = botStopChoice(sale.run, 1);
    expect(choice).toMatchObject({ stop: 'quartermaster' });
    expect(stopProblem(sale.run, 1, choice!)).toBeNull();
  });

  it('plays runs that take every stop it can use', () => {
    let taken = 0;
    for (const seed of [41, 42, 43, 44, 45, 46]) {
      const r = botRun('strider', seed, 40, { themes: 'stopper' });
      taken += r.maps.filter((m) => m.status === 'stop').length;
    }
    expect(taken).toBeGreaterThan(0);
    // Six whole bot runs: slow on a shared CI runner.
  }, 180000);
});
