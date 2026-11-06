import { describe, expect, it } from 'vitest';
import { chalkAdd } from './craft';
import { chooseOffer } from './bot';
import { Controller } from './controller';
import { OFFSETS_FROM_MAP, respiteSlot, rollOffers } from './offers';
import { newRun, planFor, setMap, stash, takeRespite, TOTAL_MAPS } from './run';
import { bossForMap } from '../data/bosses';
import { fullVitals } from '../sim/types';

const hurt = (life: number, flask = 1) => ({ ...fullVitals(), life, flasks: { 1: flask } });

/** The first level from `from` whose set holds a Respite and that has no boss next, for a seed. */
function restLevel(seed: number, from = OFFSETS_FROM_MAP): number {
  for (let map = from; map < 100; map++)
    if (respiteSlot(seed, map) >= 0 && !bossForMap(map + 1)) return map;
  throw new Error('no Respite');
}

describe('the Respite offer (docs/MAPS.md 4.2, docs/ATTRITION.md)', () => {
  it('is never offered before level offsets start, on a tenth level or on a boss level', () => {
    for (let seed = 1; seed <= 200; seed++)
      for (const map of [1, OFFSETS_FROM_MAP - 1, 10, 20, 100])
        expect(rollOffers(seed, map).every((o) => o.kind !== 'respite')).toBe(true);
  });

  it('is always offered on the level before a boss, in the last slot', () => {
    for (let seed = 1; seed <= 50; seed++)
      for (let map = OFFSETS_FROM_MAP; map < 100; map++) {
        if (!bossForMap(map + 1) || bossForMap(map)) continue;
        const offers = rollOffers(seed, map);
        expect(offers.at(-1)!.kind).toBe('respite');
      }
  });

  it('comes on some levels and not others, never as the first offer, never more than once a set', () => {
    let sets = 0;
    let rested = 0;
    for (let seed = 1; seed <= 400; seed++) {
      const offers = rollOffers(seed, 33);
      sets++;
      const n = offers.filter((o) => o.kind === 'respite').length;
      expect(n).toBeLessThanOrEqual(1);
      if (n) rested++;
      expect(offers[0].kind).toBe('map');
    }
    expect(rested).toBeGreaterThan(0);
    expect(rested).toBeLessThan(sets);
  });

  it('is where respiteSlot says, from the seed and the level alone', () => {
    for (let seed = 1; seed <= 50; seed++)
      for (const map of [7, 23, 47, 86]) {
        const slot = respiteSlot(seed, map);
        const offers = rollOffers(seed, map);
        if (slot < 0) expect(offers.every((o) => o.kind !== 'respite')).toBe(true);
        else expect(offers[slot].kind).toBe('respite');
        expect(rollOffers(seed, map)).toEqual(offers);
      }
  });
});

describe('taking a Respite', () => {
  it('makes the character whole, passes the level, and gives nothing', () => {
    const run = newRun('vanguard', 6);
    const map = restLevel(run.seed, 12);
    setMap(run, map);
    // A worn flask nearly dry, and a carried one (uid 9999, not on the belt) half full.
    const worn = run.build.flasks.find((f) => f !== null)!.uid;
    run.vitals = { life: 0.2, mana: 0.3, es: 0.1, flasks: { [worn]: 0.1, 9999: 0.5 } };
    expect(run.offers.some((o) => o.kind === 'respite')).toBe(true);
    const before = {
      refund: run.refundPoints,
      bonus: run.bonusPoints,
      xp: run.xp,
      inv: run.inventory.length,
    };
    takeRespite(run);
    // The worn flasks are full again; a carried flask keeps what it held (the owner, 2026-11-05).
    expect(run.vitals).toEqual({ ...fullVitals(), flasks: { 9999: 0.5 } });
    expect(run.map).toBe(map + 1);
    expect(run.history.at(-1)).toMatchObject({ map, status: 'respite', kills: 0 });
    expect(run.refundPoints).toBe(before.refund);
    expect(run.bonusPoints).toBe(before.bonus);
    expect(run.xp).toBe(before.xp);
    expect(run.inventory.length).toBe(before.inv);
    expect(run.reward).toBeNull();
    expect(run.phase).toBe('camp');
    expect(run.offers).toEqual(rollOffers(run.seed, map + 1));
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
    setMap(run, restLevel(run.seed, 12));
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
    const map = restLevel(run.seed, 12);
    setMap(run, map);
    run.vitals = hurt(0.1);
    c.startMap(run.offers.findIndex((o) => o.kind === 'respite'));
    expect(c.screen).toBe('camp');
    expect(c.world).toBeNull();
    expect(run.map).toBe(map + 1);
    expect(run.vitals).toMatchObject({ life: 1, mana: 1, es: 1 });
    for (const f of run.build.flasks) if (f) expect(run.vitals.flasks[f.uid] ?? 1).toBe(1);
  });
});

describe('the bot and the Respite', () => {
  it('the bot rests when it is worn down and a Respite is offered, and takes a map otherwise', () => {
    const run = newRun('vanguard', 6);
    setMap(run, restLevel(run.seed, 13));
    run.vitals = hurt(0.2);
    expect(chooseOffer(run, 'best').kind).toBe('respite');
    run.vitals = hurt(0.6);
    expect(chooseOffer(run, 'best').kind).not.toBe('respite');
    expect(chooseOffer(run, 'first').kind).toBe('map');
  });
});
