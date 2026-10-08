import { describe, expect, it } from 'vitest';
import { themeDef, themesFor } from '../data/themes';
import { chalkAdd, chalkOptions } from './craft';
import { OFFERS_PER_SET, rollOffers } from './offers';
import { finishMap, mapSeed, newRun, planFor, setMap, stash } from './run';
import { loadRun, MemoryStore, saveRun } from './save';
import type { MapResult } from '../sim/runMap';

const cleared = (level: number): MapResult => ({
  status: 'cleared',
  time: 100,
  ticks: 1000,
  level,
  xp: 0,
  xpGained: 0,
  kills: 10,
  stuck: 0,
  picked: [],
  eventHash: 0,
  lifeFrac: 1,
});

describe('map offers (docs/MAPS.md section 4)', () => {
  it('a level offers three maps with three different themes that exist at that level', () => {
    for (const map of [1, 4, 8, 15, 25, 40, 60, 100]) {
      for (let seed = 1; seed <= 10; seed++) {
        const offers = rollOffers(seed, map);
        expect(offers).toHaveLength(OFFERS_PER_SET);
        const themes = offers.map((o) => o.themeId);
        expect(new Set(themes).size, `${seed}/${map}`).toBe(OFFERS_PER_SET);
        const allowed = new Set(themesFor(map).map((t) => t.id));
        for (const id of themes) expect(allowed.has(id), id).toBe(true);
        for (const o of offers) {
          expect(o.areaLevel).toBe(map);
          expect(o.offset).toBe(0);
          expect(themeDef(o.themeId)).toBeDefined();
        }
      }
    }
  });

  it('offers are rolled from the seed alone: the same run gives the same set', () => {
    expect(rollOffers(5, 30)).toEqual(rollOffers(5, 30));
    expect(rollOffers(5, 30)).not.toEqual(rollOffers(6, 30));
  });

  it('every offer has its own layout, and the same offer always has the same layout', () => {
    const run = newRun('vanguard', 9);
    const seeds = run.offers.map((o) => mapSeed(run, o));
    expect(new Set(seeds).size).toBe(OFFERS_PER_SET);
    expect(run.offers.map((o) => mapSeed(run, o))).toEqual(seeds);
    expect(planFor(run, run.offers[0]).seed).toBe(seeds[0]);
    expect(planFor(run, run.offers[1]).seed).toBe(seeds[1]);
  });

  it('a clear rolls the next level’s offers; setMap rolls them for a level jumped to', () => {
    const run = newRun('vanguard', 3);
    const first = run.offers;
    finishMap(run, cleared(2));
    expect(run.map).toBe(2);
    expect(run.offers).toEqual(rollOffers(3, 2));
    expect(run.offers).not.toEqual(first);
    setMap(run, 40);
    expect(run.offers).toEqual(rollOffers(3, 40));
    expect(run.offers.every((o) => o.areaLevel === 40)).toBe(true);
  });

  it('the offers, with Chalk edits, survive a save and a load', () => {
    const run = newRun('vanguard', 4);
    setMap(run, 50);
    stash(run, { kind: 'currency', uid: 1, id: 'chalk', count: 3 });
    const opts = chalkOptions(run, 2);
    expect(chalkAdd(run, 2, opts[0]).ok).toBe(true);
    expect(run.offers[2].affixes).toContain(opts[0]);
    const store = new MemoryStore();
    saveRun(store, run);
    const loaded = loadRun(store);
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(loaded.run.offers).toEqual(run.offers);
    // Editing one offer leaves the others alone.
    expect(run.offers[0]).toEqual(rollOffers(4, 50)[0]);
  });

  it('a theme id as a plan asks for that theme’s map at the current level', () => {
    const run = newRun('vanguard', 6);
    const byOffer = planFor(run, run.offers[1]);
    const byTheme = planFor(run, run.offers[1].themeId);
    expect(byTheme.seed).toBe(byOffer.seed);
    expect(byTheme.theme.id).toBe(byOffer.theme.id);
    expect(byTheme.affixes).toEqual(byOffer.affixes);
  });
});
