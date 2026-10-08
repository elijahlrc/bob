import { describe, expect, it } from 'vitest';
import { themeDef, themesFor } from '../data/themes';
import { chalkAdd, chalkOptions } from './craft';
import { fullVitals, type Vitals } from '../sim/types';
import { roomsForMap, resistPenaltyForMap } from '../gen/mapPlan';
import { runMap } from '../sim/runMap';
import { isHurt, makeOffer, OFFERS_PER_SET, OFFSETS_FROM_MAP, rollOffers } from './offers';
import { finishMap, mapSeed, newRun, planFor, setMap, stash, worldOptsFor } from './run';
import { loadRun, MemoryStore, saveRun } from './save';
import type { MapResult } from '../sim/runMap';

const cleared = (level: number): MapResult => ({
  status: 'cleared',
  areaLevel: level,
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
  vitals: fullVitals(),
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
        for (const o of offers) expect(themeDef(o.themeId)).toBeDefined();
      }
    }
  });

  it('the anchor is at the map number; the others sit at 0, -2 or +2 from it, clamped to 1-100', () => {
    for (const map of [1, 4, 5, 8, 15, 25, 40, 60, 98, 99, 100]) {
      for (let seed = 1; seed <= 40; seed++) {
        const [anchor, ...rest] = rollOffers(seed, map);
        expect(anchor.offset).toBe(0);
        expect(anchor.areaLevel).toBe(map);
        for (const o of [anchor, ...rest]) {
          expect(Math.abs(o.offset)).toBeLessThanOrEqual(2); // clamped to 100 near the end
          expect(o.areaLevel).toBe(map + o.offset);
          expect(o.areaLevel).toBeLessThanOrEqual(100);
          if (map < OFFSETS_FROM_MAP) expect(o.offset).toBe(0);
        }
      }
    }
    // At map 100 a +2 clamps to 100 itself.
    for (let seed = 1; seed <= 200; seed++)
      for (const o of rollOffers(seed, 100)) expect(o.areaLevel).toBeLessThanOrEqual(100);
  });

  it('about two in three sets carry an off-level offer, and a hurt character sees lower maps more often', () => {
    const count = (vitals: Vitals) => {
      let off = 0;
      let lower = 0;
      let sets = 0;
      for (let seed = 1; seed <= 400; seed++) {
        const offers = rollOffers(seed, 30, vitals);
        sets++;
        if (offers.some((o) => o.offset !== 0)) off++;
        if (offers.some((o) => o.offset < 0)) lower++;
      }
      return { off: off / sets, lower: lower / sets };
    };
    const well = count(fullVitals());
    const hurt = count({ ...fullVitals(), life: 0.3 });
    expect(well.off).toBeGreaterThan(0.5); // two slots, each off-level 40% of the time
    expect(well.off).toBeLessThan(0.75);
    expect(hurt.lower).toBeGreaterThan(well.lower + 0.08);
    expect(isHurt({ ...fullVitals(), flasks: { 4: 0.2 } })).toBe(true);
    expect(isHurt(fullVitals())).toBe(false);
  });

  it('the plan follows the offer: monsters and loot at its level, everything else at the map number', () => {
    const run = newRun('vanguard', 12);
    setMap(run, 29);
    const flat = planFor(run, makeOffer(run.seed, 29, 1, 'ashenCrypt', 0));
    const up = planFor(run, makeOffer(run.seed, 29, 1, 'ashenCrypt', 2));
    const down = planFor(run, makeOffer(run.seed, 29, 1, 'ashenCrypt', -2));
    expect([down.areaLevel, flat.areaLevel, up.areaLevel]).toEqual([27, 29, 31]);
    for (const p of [down, flat, up]) {
      expect(p.map).toBe(29);
      expect(p.resistPenalty).toBe(resistPenaltyForMap(29));
      expect(p.endKind).toBe('rare');
      expect(p.lab.mainPath.length).toBe(roomsForMap(29));
    }
    const level = (p: typeof flat) => Math.max(...p.pop.monsters.map((m) => m.spec.level));
    expect(level(up)).toBeGreaterThan(level(flat));
    expect(level(flat)).toBeGreaterThan(level(down));
    // The mini-boss comes with the map number, not the offered level: 38 +2 is still not a mini-boss map.
    setMap(run, 39);
    expect(planFor(run, makeOffer(run.seed, 39, 0, 'ashenCrypt', 2)).endKind).toBe('rare');
    setMap(run, 40);
    expect(planFor(run, makeOffer(run.seed, 40, 0, 'ashenCrypt', -2)).endKind).toBe('miniboss');
  });

  it('a result records the level that was played', () => {
    const run = newRun('vanguard', 2);
    setMap(run, 8);
    const offer = makeOffer(run.seed, 8, 1, 'ashenCrypt', 2);
    const plan = planFor(run, offer);
    const res = runMap(plan, run.build, run.xp, worldOptsFor(run, plan), undefined);
    expect(res.areaLevel).toBe(10);
    finishMap(run, res);
    expect(run.history.at(-1)).toMatchObject({ map: 8, areaLevel: 10 });
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
    expect(run.offers[0].areaLevel).toBe(40);
    expect(run.offers.every((o) => Math.abs(o.areaLevel - 40) <= 2)).toBe(true);
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
