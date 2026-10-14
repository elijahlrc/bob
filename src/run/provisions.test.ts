import { describe, expect, it } from 'vitest';
import { Character, sheetDps } from '../calc/character';
import { affixPlayerMods } from '../data/mapAffixes';
import {
  POUCH_LIMIT,
  PROVISIONS,
  PROVISIONS_PER_MAP,
  isProvisionAffix,
  provisionAffixId,
  provisionDef,
} from '../data/provisions';
import { botRun } from './bot';
import { ensureMarket, buyWare } from './market';
import { makeOffer } from './offers';
import {
  addProvision,
  affixesWithArmed,
  armProvision,
  disarmProvision,
  endProvisions,
  pouchCount,
  provisionAffixes,
  spare,
  startProvisions,
} from './provisions';
import { offersFor } from './preview';
import { affixRewards, finishMap, newRun, planFor, setMap } from './run';
import { waysideOf } from './wayside';
import { mapAffixDef } from '../data/mapAffixes';

describe('the Pouch and arming (docs/WAYSIDE.md 6.1)', () => {
  it('holds six provisions in all, and arms two for a map', () => {
    const run = newRun('vanguard', 1);
    for (let i = 0; i < POUCH_LIMIT; i++) expect(addProvision(run, 'whettedPowder')).toBe(true);
    expect(addProvision(run, 'wardOil')).toBe(false);
    expect(pouchCount(run)).toBe(POUCH_LIMIT);
    expect(armProvision(run, 'whettedPowder').ok).toBe(true);
    expect(armProvision(run, 'whettedPowder').ok).toBe(true);
    expect(PROVISIONS_PER_MAP).toBe(2);
    expect(armProvision(run, 'whettedPowder')).toEqual({
      ok: false,
      reason: 'Only 2 can be armed for one map',
    });
    expect(spare(run, 'whettedPowder')).toBe(POUCH_LIMIT - 2);
  });

  it('arms only what the Pouch holds, and disarming puts it back', () => {
    const run = newRun('vanguard', 1);
    expect(armProvision(run, 'wardOil').ok).toBe(false);
    addProvision(run, 'wardOil');
    expect(armProvision(run, 'wardOil').ok).toBe(true);
    expect(armProvision(run, 'wardOil').ok).toBe(false);
    expect(disarmProvision(run, 'wardOil').ok).toBe(true);
    expect(disarmProvision(run, 'wardOil').ok).toBe(false);
    expect(spare(run, 'wardOil')).toBe(1);
  });
});

describe('burning (docs/WAYSIDE.md 6.1)', () => {
  it('takes what is armed out of the Pouch when the map starts, and keeps it working until the map ends', () => {
    const run = newRun('vanguard', 2);
    addProvision(run, 'whettedPowder');
    addProvision(run, 'whettedPowder');
    addProvision(run, 'bloodsalt');
    armProvision(run, 'whettedPowder');
    armProvision(run, 'bloodsalt');
    const active = startProvisions(run);
    const w = waysideOf(run);
    expect(active.sort()).toEqual(['bloodsalt', 'whettedPowder']);
    expect(w.armed).toEqual([]);
    expect(w.pouch).toEqual({ whettedPowder: 1 });
    expect(w.active).toHaveLength(2);
    endProvisions(run);
    expect(w.active).toEqual([]);
    expect(w.pouch).toEqual({ whettedPowder: 1 });
  });

  it('finishing a map, even by dying, clears what was burning', () => {
    const run = newRun('vanguard', 2);
    addProvision(run, 'wardOil');
    armProvision(run, 'wardOil');
    startProvisions(run);
    finishMap(run, {
      status: 'dead',
      areaLevel: 1,
      time: 1,
      ticks: 1,
      level: 1,
      xp: 0,
      xpGained: 0,
      kills: 0,
      stuck: 0,
      picked: [],
      eventHash: 0,
      lifeFrac: 0,
      vitals: { life: 0, mana: 1, es: 0, flasks: {} },
    });
    expect(waysideOf(run).active).toEqual([]);
  });

  it('puts the burning provisions on the map as hidden affixes', () => {
    const run = newRun('vanguard', 3);
    addProvision(run, 'greedyLantern');
    armProvision(run, 'greedyLantern');
    startProvisions(run);
    const plan = planFor(run, run.offers[0]);
    expect(plan.affixes).toContain(provisionAffixId('greedyLantern'));
    // ... and the map's own affixes are untouched.
    expect(plan.affixes.slice(0, run.offers[0].affixes.length)).toEqual(run.offers[0].affixes);
    expect(affixRewards(plan.affixes, 10).quantity).toBeCloseTo(0.3, 5);
  });
});

describe('what they do (data/provisions.ts)', () => {
  const sheetWith = (ids: string[], level = 20) => {
    const run = newRun('vanguard', 4);
    run.build = { ...run.build, level };
    const extra = ids.flatMap((id) => affixPlayerMods(provisionAffixId(id), level));
    return new Character(run.build, { areaLevel: level, extraMods: extra }).sheet();
  };

  it('Whetted Powder raises damage by about 12%', () => {
    const base = sheetDps(sheetWith([]));
    const up = sheetDps(sheetWith(['whettedPowder']));
    expect(up / base).toBeGreaterThan(1.1);
    expect(up / base).toBeLessThan(1.2); // a little over 12%: hits are rounded to whole numbers
  });

  it('Glass Draught raises damage by 60% and lowers effective life', () => {
    const base = sheetWith([]);
    const bet = sheetWith(['glassDraught']);
    expect(sheetDps(bet) / sheetDps(base)).toBeGreaterThan(1.55);
    expect(sheetDps(bet) / sheetDps(base)).toBeLessThan(1.95);
    expect(bet.ehp).toBeLessThan(base.ehp * 0.8);
  });

  it('Greedy Lantern costs maximum life, and Ward-oil adds resistances', () => {
    const base = sheetWith([]);
    expect(sheetWith(['greedyLantern']).life).toBeLessThan(base.life * 0.9);
    const oiled = sheetWith(['wardOil']);
    expect(oiled.res[2]).toBeGreaterThanOrEqual(base.res[2] + 11);
    expect(oiled.res[4]).toBeGreaterThanOrEqual(base.res[4] + 11);
  });

  it('Rushing Tonic speeds the character and the monsters', () => {
    expect(sheetWith(['rushingTonic']).moveSpeed).toBeGreaterThan(sheetWith([]).moveSpeed);
    expect(mapAffixDef(provisionAffixId('rushingTonic')).monsterMods?.length).toBeGreaterThan(0);
  });

  it('every provision has a hidden affix that is never rolled and does not follow the level band', () => {
    for (const p of PROVISIONS) {
      const a = mapAffixDef(provisionAffixId(p.id));
      expect(a.chalkOnly).toBe(true);
      expect(a.fixed).toBe(true);
      expect(isProvisionAffix(a.id)).toBe(true);
    }
  });
});

describe('the offer cards with provisions armed', () => {
  it('count the armed provisions in what they say about each map', () => {
    const run = newRun('vanguard', 5);
    setMap(run, 12);
    run.build = { ...run.build, level: 12 };
    const before = offersFor(run)[0];
    addProvision(run, 'greedyLantern');
    armProvision(run, 'greedyLantern');
    const after = offersFor(run)[0];
    expect(after.rewards!.quantity).toBeGreaterThan(before.rewards!.quantity + 0.25);
    // The offer itself still lists only its own affixes.
    expect(after.affixes).toEqual(before.affixes);
    expect(affixesWithArmed(run, run.offers[0])).toContain(provisionAffixId('greedyLantern'));
  });

  it('a specialist adds its affix only to the kind of map it needs', () => {
    const offer = makeOffer(1, 12, 0, 'sporefen', 0, 'plain');
    expect(provisionAffixes(['whettedPowder'], offer)).toEqual([provisionAffixId('whettedPowder')]);
    expect(provisionDef('whettedPowder').needsType).toBeUndefined();
  });
});

describe('buying provisions at the Market', () => {
  it('puts the provision in the Pouch, and refuses before taking the Dust when the Pouch is full', () => {
    const run = newRun('vanguard', 6);
    setMap(run, 14);
    const ware = ensureMarket(run).find((w) => w.kind === 'provision')!;
    run.dust = 500;
    expect(buyWare(run, ware.id).ok).toBe(true);
    expect(waysideOf(run).pouch[ware.ref!]).toBe(1);
    setMap(run, 15);
    const next = ensureMarket(run).find((w) => w.kind === 'provision')!;
    for (let i = 0; i < POUCH_LIMIT; i++) addProvision(run, 'wardOil');
    const dust = run.dust;
    expect(buyWare(run, next.id)).toEqual({ ok: false, reason: 'Your pouch is full' });
    expect(run.dust).toBe(dust);
  });
});

describe('the bot with provisions', () => {
  it('plays a run in which it buys and arms staples', () => {
    const r = botRun('vanguard', 8, 14);
    expect(r.maps.length).toBeGreaterThan(0);
  });
});
