import { describe, expect, it } from 'vitest';
import { POUCH_LIMIT } from '../data/provisions';
import type { StopId } from '../data/stops';
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
  it('offers distinct blessings, gives the one chosen, and it counts on the maps that follow', () => {
    const { run, slot } = withStop('shrine', 12);
    const ids = shrineBlessings(run, run.offers[slot]);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
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
    // As many wares as the pouch holds is fine; one more is not.
    const over = [rep, ...provisions].slice(0, POUCH_LIMIT + 1).map((w) => w.id);
    expect(over).toHaveLength(POUCH_LIMIT + 1);
    expect(stopProblem(run, slot, { stop: 'quartermaster', buy: over })).not.toBeNull();
    expect(takeStop(run, slot, { stop: 'quartermaster', buy: over.slice(0, POUCH_LIMIT) }).ok).toBe(
      true,
    );
    expect(waysideOf(run).pouch[rep.ref!]).toBe(1);
    expect(pouchCount(run)).toBe(POUCH_LIMIT);
    run.offers[1] = makeStop(run.map, 1, 'quartermaster');
    const again = saleStock(run, run.offers[1]).find((w) => w.kind === 'reprieve')!;
    expect(stopProblem(run, 1, { stop: 'quartermaster', buy: [again.id] })).not.toBeNull();
  });
});

describe('the Ferryman', () => {
  it('gives the reprieve chosen for nothing, and a curse for the levels after', () => {
    const { run, slot } = withStop('ferryman', 20);
    expect(takeStop(run, slot, { stop: 'ferryman', reprieve: 'nope' }).ok).toBe(false);
    expect(takeStop(run, slot, { stop: 'ferryman', reprieve: 'lastSpark' }).ok).toBe(true);
    const w = waysideOf(run);
    expect(w.pouch).toEqual({ lastSpark: 1 });
    expect(w.curses).toHaveLength(1);
    expect(w.curses[0].until).toBeGreaterThan(21);
    expect(run.map).toBe(21);
    expect(planFor(run, run.offers[0]).affixes).toContain('curse.bargain');
  });

  it('needs room in the pouch', () => {
    const { run, slot } = withStop('ferryman', 20);
    while (addProvision(run, 'wardOil'));
    expect(stopProblem(run, slot, { stop: 'ferryman', reprieve: 'lastSpark' })).not.toBeNull();
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
});
