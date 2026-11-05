import { describe, expect, it } from 'vitest';
import { HOARD_TAKE, STOP_FROM, SURGEON_TRADES, type StopId } from '../data/stops';
import { botRun } from './bot';
import { botStopChoice } from './botStop';
import { respiteSlot, rollOffers, stopAt } from './offers';
import { newRun, setMap, type RunState } from './run';
import { Character } from '../calc/character';
import { hoardGems, hoardKinds, stopProblem, surgeonBlocker, takeStop } from './stops';

/** A run standing at the first level where the schedule puts the given stop (or any stop). */
function atStop(seed: number, want?: StopId): { run: RunState; slot: number } {
  for (let map = STOP_FROM; map < 100; map++) {
    const s = stopAt(seed, map);
    if (!s || (want && s !== want)) continue;
    const run = newRun('vanguard', seed);
    setMap(run, map);
    return { run, slot: run.offers.findIndex((o) => o.kind === 'stop') };
  }
  throw new Error('no such stop');
}

describe('the stop schedule (docs/WAYSIDE.md 5.1)', () => {
  it('never puts a stop on a fifth or tenth level, before STOP_FROM or on two levels in a row', () => {
    for (const seed of [1, 2, 3, 77, 1234]) {
      const at: number[] = [];
      for (let map = 1; map <= 100; map++) if (stopAt(seed, map)) at.push(map);
      for (const m of at) {
        expect(m).toBeGreaterThanOrEqual(STOP_FROM);
        expect(m % 5).not.toBe(0);
      }
      for (let i = 1; i < at.length; i++) expect(at[i] - at[i - 1]).toBeGreaterThan(1);
    }
  });

  it('is the same every time for a seed, and different between seeds', () => {
    const list = (seed: number) =>
      Array.from({ length: 100 }, (_, i) => stopAt(seed, i + 1) ?? '-').join();
    expect(list(5)).toBe(list(5));
    expect(list(5)).not.toBe(list(6));
  });
});

describe('a stop in a set of offers', () => {
  it('takes a slot that is not the anchor', () => {
    for (const seed of [1, 2, 3, 4]) {
      for (let map = STOP_FROM; map < 100; map++) {
        if (!stopAt(seed, map)) continue;
        const offers = rollOffers(seed, map);
        expect(offers[0].kind).toBe('map');
        const stops = offers.filter((o) => o.kind === 'stop');
        expect(stops).toHaveLength(1);
        expect(stops[0].stop).toBe(stopAt(seed, map));
        expect(offers.filter((o) => o.kind === 'map').length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('does not take the slot of a Respite', () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      for (let map = STOP_FROM; map < 100; map++) {
        if (!stopAt(seed, map) || respiteSlot(seed, map) < 0) continue;
        const offers = rollOffers(seed, map);
        expect(offers.filter((o) => o.kind === 'respite')).toHaveLength(1);
        expect(offers.filter((o) => o.kind === 'stop')).toHaveLength(1);
        expect(offers[0].kind).toBe('map');
      }
    }
  });
});

describe('the Gem Hoard', () => {
  it('lays out the same gems of a kind every time, each once, and the same kinds to choose from', () => {
    const { run, slot } = atStop(11, 'gemHoard');
    const offer = run.offers[slot];
    const kinds = hoardKinds(run, offer);
    expect(hoardKinds(run, offer)).toEqual(kinds);
    const laid = hoardGems(run, offer, kinds[0].tag);
    expect(laid.length).toBeGreaterThan(0);
    expect(new Set(laid).size).toBe(laid.length);
    expect(hoardGems(run, offer, kinds[0].tag)).toEqual(laid);
  });

  it('gives the gems taken, and nothing else, and passes the level', () => {
    const { run, slot } = atStop(11, 'gemHoard');
    const offer = run.offers[slot];
    const tag = hoardKinds(run, offer)[0].tag;
    const laid = hoardGems(run, offer, tag);
    const picks = laid.slice(0, HOARD_TAKE);
    const before = run.inventory.length;
    const level = run.map;
    expect(
      takeStop(run, slot, { stop: 'gemHoard', tag, picks: laid.slice(0, HOARD_TAKE - 1) }).ok,
    ).toBe(false);
    expect(
      takeStop(run, slot, { stop: 'gemHoard', tag, picks: [picks[0], picks[0], ...picks.slice(2)] })
        .ok,
    ).toBe(false);
    expect(run.inventory).toHaveLength(before);
    expect(takeStop(run, slot, { stop: 'gemHoard', tag, picks }).ok).toBe(true);
    expect(run.inventory).toHaveLength(before + HOARD_TAKE);
    expect(run.inventory.slice(-HOARD_TAKE).map((g) => (g.kind === 'gem' ? g.gemId : ''))).toEqual(
      picks,
    );
    expect(run.map).toBe(level + 1);
    expect(run.unseen.length).toBeGreaterThanOrEqual(HOARD_TAKE);
  });
});

describe('the bot at a stop', () => {
  it('has something valid to do at each stop', () => {
    for (const seed of [11, 12, 13]) {
      for (const want of ['gemHoard'] as const) {
        const { run, slot } = atStop(seed, want);
        const choice = botStopChoice(run, slot);
        expect(choice).not.toBeNull();
        expect(stopProblem(run, slot, choice!)).toBeNull();
      }
    }
  });

  it('plays through runs that take every stop they are offered', () => {
    // A crash guard for maps played after the stops the default bot skips (a Shrine's blessing, Gem Hoard gems). The bot dies early in
    // many runs, so look through a few seeds for one that reaches a stop, and stop at the first that does.
    let stops = 0;
    for (const seed of [23, 24, 25, 26, 27, 28]) {
      const r = botRun('vanguard', seed, 24, { themes: 'stopper' });
      stops += r.maps.filter((m) => m.status === 'stop').length;
      if (stops > 0) break;
    }
    expect(stops).toBeGreaterThan(0);
  }, 180000);
});

describe('the Surgeon', () => {
  it('will not take an attribute below 0, and says which', () => {
    const run = newRun('vanguard', 1);
    const a = new Character(run.build).attrs;
    let blocked = 0;
    for (const t of SURGEON_TRADES) {
      const lost = t.price.find((m) => m.stat === 'str' || m.stat === 'dex' || m.stat === 'int');
      const goes = lost ? a[lost.stat as 'str' | 'dex' | 'int'] + lost.value < 0 : false;
      expect(!!surgeonBlocker(run, [t.id])).toBe(goes);
      if (goes) blocked++;
    }
    // A starting Vanguard has strength to spare and little else.
    expect(blocked).toBeGreaterThan(0);
    expect(surgeonBlocker(run, ['intForStr'])).toMatch(/Intelligence below 0/);
  });
});
