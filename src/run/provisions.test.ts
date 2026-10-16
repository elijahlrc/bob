import { describe, expect, it } from 'vitest';
import { Character, sheetDps } from '../calc/character';
import { affixPlayerMods, affixRarePacks, mapAffixDef } from '../data/mapAffixes';
import {
  FORAGE_FROM,
  isProvisionAffix,
  isReprieveId,
  POUCH_LIMIT,
  PROVISIONS,
  PROVISIONS_PER_MAP,
  provisionAffixId,
} from '../data/provisions';
import {
  addProvision,
  affixesWithArmed,
  armProvision,
  disarmProvision,
  endProvisions,
  forage,
  heldReprieveIds,
  pouchCount,
  provisionAffixes,
  readyReprieves,
  spare,
  startProvisions,
} from './provisions';
import { offersFor } from './preview';
import { affixRewards, finishMap, newRun, planFor, setMap } from './run';
import { waysideOf } from './wayside';

describe('the pouch and arming (docs/WAYSIDE.md 6.1)', () => {
  it('holds provisions up to its limit, and arms them up to the limit for a map', () => {
    const run = newRun('vanguard', 1);
    for (let i = 0; i < POUCH_LIMIT; i++) expect(addProvision(run, 'whettedPowder')).toBe(true);
    expect(addProvision(run, 'wardOil')).toBe(false);
    expect(pouchCount(run)).toBe(POUCH_LIMIT);
    const armable = Math.min(POUCH_LIMIT, PROVISIONS_PER_MAP);
    for (let i = 0; i < armable; i++) expect(armProvision(run, 'whettedPowder').ok).toBe(true);
    expect(armProvision(run, 'whettedPowder').ok).toBe(false);
    expect(spare(run, 'whettedPowder')).toBe(POUCH_LIMIT - armable);
  });

  it('arms only what the pouch holds, and disarming puts it back', () => {
    const run = newRun('vanguard', 1);
    expect(armProvision(run, 'wardOil').ok).toBe(false);
    addProvision(run, 'wardOil');
    expect(armProvision(run, 'wardOil').ok).toBe(true);
    expect(armProvision(run, 'wardOil').ok).toBe(false);
    expect(disarmProvision(run, 'wardOil').ok).toBe(true);
    expect(disarmProvision(run, 'wardOil').ok).toBe(false);
    expect(spare(run, 'wardOil')).toBe(1);
  });

  it('carries a reprieve in the same pouch, counts it, and never arms it', () => {
    const run = newRun('vanguard', 1);
    addProvision(run, 'lastSpark');
    addProvision(run, 'ferryToken');
    addProvision(run, 'wardOil');
    expect(pouchCount(run)).toBe(3);
    expect(armProvision(run, 'lastSpark').ok).toBe(false);
    expect(heldReprieveIds(run)).toEqual(['lastSpark', 'ferryToken']);
    startProvisions(run);
    expect(heldReprieveIds(run)).toEqual(['lastSpark', 'ferryToken']);
  });

  it('uses a revive before a retreat, and a reprieve that has fired is not ready again', () => {
    const run = newRun('vanguard', 1);
    for (const id of ['ferryToken', 'bargainCoin', 'lastSpark'] as const) addProvision(run, id);
    expect(heldReprieveIds(run)).toEqual(['lastSpark', 'bargainCoin', 'ferryToken']);
    expect(readyReprieves(run, ['lastSpark'])).toEqual(['bargainCoin', 'ferryToken']);
    expect(readyReprieves(run, ['lastSpark', 'ferryToken'])).toEqual(['bargainCoin']);
  });
});

describe('burning (docs/WAYSIDE.md 6.1)', () => {
  it('takes what is armed out of the pouch when the map starts, and keeps it working until the map ends', () => {
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
    expect(affixRewards(plan.affixes, 10).quantity).toBeGreaterThan(
      affixRewards(run.offers[0].affixes, 10).quantity,
    );
  });
});

describe('what they do (data/provisions.ts)', () => {
  const sheetWith = (ids: string[], level = 20) => {
    const run = newRun('vanguard', 4);
    run.build = { ...run.build, level };
    const extra = ids.flatMap((id) => affixPlayerMods(provisionAffixId(id), level));
    return new Character(run.build, { areaLevel: level, extraMods: extra }).sheet();
  };

  it('Whetted Powder raises damage', () => {
    const base = sheetDps(sheetWith([]));
    const up = sheetDps(sheetWith(['whettedPowder']));
    expect(up).toBeGreaterThan(base);
  });

  it('Glass Draught raises damage and lowers effective life', () => {
    const base = sheetWith([]);
    const bet = sheetWith(['glassDraught']);
    expect(sheetDps(bet)).toBeGreaterThan(sheetDps(base));
    expect(bet.ehp).toBeLessThan(base.ehp);
  });

  it('Greedy Lantern costs maximum life, and Ward-oil adds resistances', () => {
    const base = sheetWith([]);
    expect(sheetWith(['greedyLantern']).life).toBeLessThan(base.life);
    const oiled = sheetWith(['wardOil']);
    expect(oiled.res[2]).toBeGreaterThan(base.res[2]);
    expect(oiled.res[4]).toBeGreaterThan(base.res[4]);
  });

  it('Rushing Tonic speeds the character and the monsters', () => {
    expect(sheetWith(['rushingTonic']).moveSpeed).toBeGreaterThan(sheetWith([]).moveSpeed);
    expect(mapAffixDef(provisionAffixId('rushingTonic')).monsterMods?.length).toBeGreaterThan(0);
  });

  it("Hunter's Bell adds rare packs, experience and quantity to the map", () => {
    const packs = affixRarePacks(provisionAffixId('hunterBell'), 10);
    expect(packs).toBeGreaterThan(0);
    expect(affixRarePacks(provisionAffixId('hunterBell'), 80)).toBe(packs);
    const run = newRun('vanguard', 2);
    setMap(run, 12);
    run.build = { ...run.build, level: 12 };
    const before = offersFor(run)[0];
    addProvision(run, 'hunterBell');
    armProvision(run, 'hunterBell');
    const after = offersFor(run)[0];
    expect(after.rewards!.experience).toBeGreaterThan(before.rewards!.experience);
    expect(after.rewards!.quantity).toBeGreaterThan(before.rewards!.quantity);
    expect(after.rewards!.monsters.rare).toBeGreaterThan(before.rewards!.monsters.rare);
  });

  it('every staple and bet has a hidden affix that is never rolled and does not follow the level band', () => {
    for (const p of PROVISIONS.filter((x) => x.kind !== 'reprieve')) {
      const a = mapAffixDef(provisionAffixId(p.id));
      expect(a.chalkOnly).toBe(true);
      expect(a.fixed).toBe(true);
      expect(isProvisionAffix(a.id)).toBe(true);
    }
  });

  it('a reprieve is a provision of a third kind with no affix', () => {
    expect(provisionAffixes(['lastSpark', 'wardOil'])).toEqual([provisionAffixId('wardOil')]);
    expect(isReprieveId('lastSpark')).toBe(true);
    expect(isReprieveId('wardOil')).toBe(false);
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
    expect(after.rewards!.quantity).toBeGreaterThan(before.rewards!.quantity);
    // The offer itself still lists only its own affixes.
    expect(after.affixes).toEqual(before.affixes);
    expect(affixesWithArmed(run, run.offers[0])).toContain(provisionAffixId('greedyLantern'));
  });
});

describe('what a cleared map leaves in the pouch (docs/WAYSIDE.md 6.1)', () => {
  it('is nothing before level 3, and something for certain the first time after', () => {
    const run = newRun('vanguard', 6);
    setMap(run, FORAGE_FROM - 1);
    expect(forage(run)).toBeNull();
    setMap(run, FORAGE_FROM);
    const first = forage(run);
    expect(first).not.toBeNull();
    expect(isReprieveId(first!)).toBe(false);
    expect(pouchCount(run)).toBe(1);
    expect(waysideOf(run).seen.foraged).toBe(true);
  });

  it('is sometimes something, never a reprieve, and nothing when the pouch is full', () => {
    let found = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const run = newRun('vanguard', seed);
      setMap(run, 10);
      waysideOf(run).seen.foraged = true;
      const got = forage(run);
      if (got) {
        found++;
        expect(isReprieveId(got)).toBe(false);
      }
      while (addProvision(run, 'wardOil'));
      expect(forage(run)).toBeNull();
    }
    expect(found).toBeGreaterThan(0);
  });

  it('is told to the camp after the level passes, and gone after the next level', () => {
    const run = newRun('vanguard', 7);
    setMap(run, 6);
    const w = waysideOf(run);
    finishMap(run, {
      status: 'cleared',
      areaLevel: 6,
      time: 1,
      ticks: 1,
      level: 6,
      xp: 0,
      xpGained: 0,
      kills: 0,
      stuck: 0,
      picked: [],
      eventHash: 0,
      lifeFrac: 1,
      vitals: { life: 1, mana: 1, es: 1, flasks: {} },
    });
    expect(run.map).toBe(7);
    // The first find is certain.
    expect(w.found).not.toBeNull();
    expect(pouchCount(run)).toBeGreaterThanOrEqual(1);
  });
});
