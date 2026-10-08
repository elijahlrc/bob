import { describe, expect, it } from 'vitest';
import { chalkAdd } from './craft';
import { chooseOffer } from './bot';
import { Controller } from './controller';
import { rollOffers, RESPITE_ALWAYS_BELOW } from './offers';
import { offersFor, verdictOf, VERDICT_CLOSE, VERDICT_COMFORTABLE } from './preview';
import { newRun, planFor, setMap, stash, takeRespite, TOTAL_MAPS } from './run';
import { fullVitals } from '../sim/types';

const hurt = (life: number, flask = 1) => ({ ...fullVitals(), life, flasks: { 1: flask } });

describe('the Respite offer (docs/MAPS.md 4.2 and 9.3)', () => {
  it('is never offered to a character in good shape, on the first four maps or on a gate level', () => {
    for (let seed = 1; seed <= 200; seed++) {
      for (const map of [5, 13, 47]) {
        const well = rollOffers(seed, map, { ...fullVitals(), flasks: { 1: 0.95 } });
        expect(well.every((o) => o.kind === 'map')).toBe(true);
      }
      for (const map of [1, 2, 3, 4, 10, 20, 100])
        expect(rollOffers(seed, map, hurt(0.1)).every((o) => o.kind === 'map')).toBe(true);
    }
  });

  it('is always offered below 40% life, in the last slot, never as the first offer', () => {
    for (let seed = 1; seed <= 100; seed++) {
      for (const map of [5, 13, 47, 99]) {
        const offers = rollOffers(seed, map, hurt(RESPITE_ALWAYS_BELOW - 0.05));
        expect(offers[0].kind).toBe('map');
        expect(offers[2].kind).toBe('respite');
        expect(offers.filter((o) => o.kind === 'respite')).toHaveLength(1);
      }
    }
  });

  it('is sometimes offered to a character that is merely worn down, never more than once a set', () => {
    let sets = 0;
    let rested = 0;
    for (let seed = 1; seed <= 400; seed++) {
      const offers = rollOffers(seed, 33, hurt(0.8));
      sets++;
      const n = offers.filter((o) => o.kind === 'respite').length;
      expect(n).toBeLessThanOrEqual(1);
      if (n) rested++;
      expect(offers[0].kind).toBe('map');
    }
    expect(rested / sets).toBeGreaterThan(0.1);
    expect(rested / sets).toBeLessThan(0.3);
  });

  it('a flask running low counts, and so does mana', () => {
    let flask = false;
    for (let seed = 1; seed <= 200; seed++)
      if (rollOffers(seed, 23, hurt(1, 0.2)).some((o) => o.kind === 'respite')) flask = true;
    expect(flask).toBe(true);
    let any = false;
    for (let seed = 1; seed <= 200; seed++)
      if (rollOffers(seed, 23, { ...fullVitals(), mana: 0.5 }).some((o) => o.kind === 'respite'))
        any = true;
    expect(any).toBe(true);
  });

  it('the maps in a set are the same with or without a Respite in it', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const withRest = rollOffers(seed, 23, hurt(0.1));
      const without = rollOffers(seed, 23, fullVitals());
      expect(withRest[0]).toEqual(without[0]);
      expect(withRest[1].themeId).toBe(without[1].themeId);
    }
  });
});

describe('taking a Respite', () => {
  it('makes the character whole, passes the level, and gives nothing', () => {
    const run = newRun('vanguard', 6);
    setMap(run, 12);
    run.vitals = { life: 0.2, mana: 0.3, es: 0.1, flasks: { 1: 0.1 } };
    run.offers = rollOffers(run.seed, 12, run.vitals);
    expect(run.offers.some((o) => o.kind === 'respite')).toBe(true);
    const before = {
      refund: run.refundPoints,
      bonus: run.bonusPoints,
      xp: run.xp,
      inv: run.inventory.length,
    };
    takeRespite(run);
    expect(run.vitals).toEqual(fullVitals());
    expect(run.map).toBe(13);
    expect(run.history.at(-1)).toMatchObject({ map: 12, status: 'respite', kills: 0 });
    expect(run.refundPoints).toBe(before.refund);
    expect(run.bonusPoints).toBe(before.bonus);
    expect(run.xp).toBe(before.xp);
    expect(run.inventory.length).toBe(before.inv);
    expect(run.reward).toBeNull();
    expect(run.phase).toBe('camp');
    expect(run.offers.every((o) => o.areaLevel >= 11 && o.kind === 'map')).toBe(true);
  });

  it('cannot be taken on the last map', () => {
    const run = newRun('vanguard', 6);
    setMap(run, TOTAL_MAPS);
    takeRespite(run);
    expect(run.map).toBe(TOTAL_MAPS);
    expect(run.history).toHaveLength(0);
  });

  it('has no map to plan and no affixes for Chalk', () => {
    const run = newRun('vanguard', 6);
    setMap(run, 12);
    run.vitals = hurt(0.1);
    run.offers = rollOffers(run.seed, 12, run.vitals);
    const slot = run.offers.findIndex((o) => o.kind === 'respite');
    expect(() => planFor(run, run.offers[slot])).toThrow();
    stash(run, { kind: 'currency', uid: 1, id: 'chalk', count: 3 });
    expect(chalkAdd(run, slot, 'swift').ok).toBe(false);
    expect(run.currency.chalk).toBe(3);
  });

  it('the controller takes it as a level that passes, and stays in camp', () => {
    const c = new Controller(null);
    c.startRun('vanguard', 8);
    const run = c.run!;
    setMap(run, 12);
    run.vitals = hurt(0.1);
    run.offers = rollOffers(run.seed, 12, run.vitals);
    c.startMap(run.offers.findIndex((o) => o.kind === 'respite'));
    expect(c.screen).toBe('camp');
    expect(c.world).toBeNull();
    expect(run.map).toBe(13);
    expect(run.vitals).toEqual(fullVitals());
  });
});

describe('auto-continue and the bot', () => {
  const camp = () => {
    const c = new Controller(null);
    c.startRun('vanguard', 9);
    const run = c.run!;
    // Nothing else needs attention: no points to spend, no reward, no new gear.
    run.build.level = 1;
    return { c, run };
  };

  it('pauses for a low life, a low flask, or a typed first map, and not otherwise', () => {
    const { c, run } = camp();
    expect(c.autoBlocker()).toBeNull();
    run.vitals = hurt(0.45);
    expect(c.autoBlocker()).toBe('life is low');
    run.vitals = hurt(1, 0.3);
    expect(c.autoBlocker()).toBe('a flask is low');
    run.vitals = fullVitals();
    run.offers[0] = { ...run.offers[0], type: 'crescendo' };
    expect(c.autoBlocker()).toContain('Crescendo');
    run.offers[0] = { ...run.offers[0], type: 'plain' };
    expect(c.autoBlocker()).toBeNull();
  });

  it('the bot rests when it is worn down and a Respite is offered, and takes a map otherwise', () => {
    const run = newRun('vanguard', 6);
    setMap(run, 12);
    run.vitals = hurt(0.2);
    run.offers = rollOffers(run.seed, 12, run.vitals);
    expect(chooseOffer(run, 'best').kind).toBe('respite');
    run.vitals = hurt(0.6);
    expect(chooseOffer(run, 'best').kind).toBe('map');
    expect(chooseOffer(run, 'first').kind).toBe('map');
  });
});

describe('the verdict on an offer', () => {
  it('is comfortable, close or dangerous by how a build fares next to a plain map', () => {
    expect(verdictOf(VERDICT_COMFORTABLE)).toBe('comfortable');
    expect(verdictOf(VERDICT_COMFORTABLE - 0.01)).toBe('close');
    expect(verdictOf(VERDICT_CLOSE)).toBe('close');
    expect(verdictOf(VERDICT_CLOSE - 0.01)).toBe('dangerous');
  });

  it('every map offer has one, a Respite has none, and a worn-down character gets worse ones', () => {
    const run = newRun('vanguard', 6);
    setMap(run, 12);
    const well = offersFor(run);
    expect(well.every((o) => o.verdict !== undefined && o.ratio! > 0)).toBe(true);
    run.vitals = hurt(0.3);
    run.offers = rollOffers(run.seed, 12, run.vitals);
    const worn = offersFor(run);
    expect(worn.find((o) => o.kind === 'respite')!.verdict).toBeUndefined();
    const m = worn.find((o) => o.kind === 'map')!;
    const same = well.find((o) => o.id === m.id);
    if (same && same.kind === 'map') expect(m.ratio!).toBeLessThan(same.ratio!);
  });
});
