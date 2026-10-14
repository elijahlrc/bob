import { describe, expect, it } from 'vitest';
import { STOP_FROM, STOP_WINDOW } from '../data/stops';
import type { Item } from '../data/types';
import { botRun } from './bot';
import { botStopChoice } from './botStop';
import { rollOffers, stopAt, stopLevel } from './offers';
import { newRun, setMap, type RunState } from './run';
import { awlsmithItems, hoardGems, hoardKinds, stopProblem, takeStop } from './stops';
import { waysideOf } from './wayside';

/** A run standing at the first level where the schedule puts the given stop (or any stop). */
function atStop(seed: number, want?: string): { run: RunState; slot: number } {
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
  it('puts one stop in each window of five levels, never on a fifth or tenth level or before level 6', () => {
    for (const seed of [1, 2, 3, 77, 1234]) {
      const at: number[] = [];
      for (let map = 1; map <= 100; map++) if (stopAt(seed, map)) at.push(map);
      for (const m of at) {
        expect(m).toBeGreaterThanOrEqual(STOP_FROM);
        expect(m % 5).not.toBe(0);
      }
      const windows = at.map((m) => Math.floor((m - STOP_FROM) / STOP_WINDOW));
      expect(new Set(windows).size).toBe(windows.length);
      expect(at.length).toBeGreaterThanOrEqual(17);
      // Every run meets one before level 10.
      expect(at[0]).toBeLessThanOrEqual(9);
      for (let w = 0; w < windows.length; w++) expect(at).toContain(stopLevel(seed, w));
    }
  });

  it('is the same every time for a seed, and different between seeds', () => {
    const list = (seed: number) =>
      Array.from({ length: 100 }, (_, i) => stopAt(seed, i + 1) ?? '-').join();
    expect(list(5)).toBe(list(5));
    expect(list(5)).not.toBe(list(6));
  });

  it('never repeats the kind of the window before while there is another to draw', () => {
    // (Five kinds, and a window never draws the kind of the one before.)
    const seen: string[] = [];
    for (let map = 1; map <= 99; map++) {
      const s = stopAt(9, map);
      if (s) seen.push(s);
    }
    for (let i = 1; i < seen.length; i++) expect(seen[i]).not.toBe(seen[i - 1]);
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

  it('does not take the slot of a forced Respite', () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      for (let map = STOP_FROM; map < 100; map++) {
        if (!stopAt(seed, map)) continue;
        const hurt = { life: 0.2, mana: 1, es: 1, flasks: {} };
        const offers = rollOffers(seed, map, hurt);
        expect(offers.filter((o) => o.kind === 'respite')).toHaveLength(1);
        expect(offers.filter((o) => o.kind === 'stop')).toHaveLength(1);
        expect(offers[0].kind).toBe('map');
      }
    }
  });
});

describe('the Awlsmith', () => {
  it('bores the next socket free, passes the level, and records a stop', () => {
    const { run, slot } = atStop(11, 'awlsmith');
    // The starting armour is level 1, which allows few sockets: let it be an item that can hold more.
    run.build.equipment.body = { ...run.build.equipment.body!, ilvl: 80 };
    const item = run.build.equipment.body as Item;
    const before = item.sockets.length;
    const level = run.map;
    const res = takeStop(run, slot, { stop: 'awlsmith', itemUid: item.uid });
    expect(res).toEqual({ ok: true });
    expect(run.build.equipment.body!.sockets).toHaveLength(before + 1);
    expect(run.map).toBe(level + 1);
    expect(run.history.at(-1)).toMatchObject({ map: level, status: 'stop', stop: 'awlsmith' });
    expect(run.reward).toBeNull();
    expect(waysideOf(run).stops).toBe(1);
  });

  it('charges Bone Dust for the sockets after the first, and refuses what cannot be paid', () => {
    const { run, slot } = atStop(11, 'awlsmith');
    run.build.equipment.body = { ...run.build.equipment.body!, ilvl: 80 };
    const item = run.build.equipment.body!;
    // Give the item two sockets, so the new one is its third (free) and one more is its fourth (40 Bone Dust).
    run.build.equipment.body = { ...item, sockets: [null, null] };
    const uid = item.uid;
    expect(awlsmithItems(run).find((x) => x.uid === uid)).toBeDefined();
    const choice = { stop: 'awlsmith' as const, itemUid: uid, extra: 1 };
    const why = stopProblem(run, slot, choice);
    expect(why).toMatch(/40 Bone Dust/);
    run.dust = 55;
    expect(stopProblem(run, slot, choice)).toBeNull();
    const map = run.map;
    expect(takeStop(run, slot, choice).ok).toBe(true);
    expect(run.dust).toBe(15);
    expect(run.map).toBe(map + 1);
  });

  it('changes nothing when the choice is not valid', () => {
    const { run, slot } = atStop(11, 'awlsmith');
    const snapshot = JSON.stringify(run);
    expect(takeStop(run, slot, { stop: 'awlsmith', itemUid: 999999 }).ok).toBe(false);
    expect(takeStop(run, slot, { stop: 'gemHoard', tag: 'fire', picks: [] }).ok).toBe(false);
    expect(JSON.stringify(run)).toBe(snapshot);
  });
});

describe('the Gem Hoard', () => {
  it('lays out the same eight gems of a kind every time, and four kinds to choose from', () => {
    const { run, slot } = atStop(11, 'gemHoard');
    const offer = run.offers[slot];
    const kinds = hoardKinds(run, offer);
    expect(kinds).toHaveLength(4);
    expect(hoardKinds(run, offer)).toEqual(kinds);
    const laid = hoardGems(run, offer, kinds[0].tag);
    expect(laid.length).toBeGreaterThan(0);
    expect(laid.length).toBeLessThanOrEqual(8);
    expect(new Set(laid).size).toBe(laid.length);
    expect(hoardGems(run, offer, kinds[0].tag)).toEqual(laid);
  });

  it('gives the three gems taken, and nothing else, and passes the level', () => {
    const { run, slot } = atStop(11, 'gemHoard');
    const offer = run.offers[slot];
    const tag = hoardKinds(run, offer)[0].tag;
    const laid = hoardGems(run, offer, tag);
    const picks = laid.slice(0, 3);
    const before = run.inventory.length;
    const level = run.map;
    expect(takeStop(run, slot, { stop: 'gemHoard', tag, picks: laid.slice(0, 2) }).ok).toBe(false);
    expect(
      takeStop(run, slot, { stop: 'gemHoard', tag, picks: [picks[0], picks[0], picks[1]] }).ok,
    ).toBe(false);
    expect(run.inventory).toHaveLength(before);
    expect(takeStop(run, slot, { stop: 'gemHoard', tag, picks }).ok).toBe(true);
    expect(run.inventory).toHaveLength(before + 3);
    expect(run.inventory.slice(-3).map((g) => (g.kind === 'gem' ? g.gemId : ''))).toEqual(picks);
    expect(run.map).toBe(level + 1);
    expect(run.unseen.length).toBeGreaterThanOrEqual(3);
  });
});

describe('the bot at a stop', () => {
  it('has something valid to do at each stop', () => {
    for (const seed of [11, 12, 13]) {
      for (const want of ['awlsmith', 'gemHoard']) {
        const { run, slot } = atStop(seed, want);
        const choice = botStopChoice(run, slot);
        expect(choice).not.toBeNull();
        expect(stopProblem(run, slot, choice!)).toBeNull();
      }
    }
  });

  it('plays through runs that take every stop they are offered', () => {
    // The bot dies early in many runs, so look through a few seeds for one that reaches a stop.
    let stops = 0;
    for (const seed of [23, 24, 25, 26, 27, 28]) {
      const r = botRun('vanguard', seed, 24, { themes: 'stopper' });
      stops += r.maps.filter((m) => m.status === 'stop').length;
      expect(r.maps.map((m) => m.map)).toEqual([...r.maps.map((m) => m.map)].sort((a, b) => a - b));
    }
    expect(stops).toBeGreaterThan(0);
  });
});
