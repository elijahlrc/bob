import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import { buildMonster, referenceMonster, type MonsterSpec } from '../calc/monster';
import { monsterHit, monsterLife } from '../calc/formulas';
import { makeMapPlan } from '../gen/mapPlan';
import { offerNoise } from '../gen/population';
import { newRun } from '../run/run';
import { loadRun, MemoryStore, SAVE_KEY } from '../run/save';
import {
  clampDifficulty,
  DEFAULT,
  LEGACY,
  mapTier,
  packPower,
  relativeHardness,
  statLevel,
  type Difficulty,
} from './difficulty';

const spec = (extra: Partial<MonsterSpec> = {}): MonsterSpec => ({
  type: 'warrior',
  variant: 'none',
  rarity: 'normal',
  level: 30,
  mods: [],
  ...extra,
});

describe('the difficulty model (docs/ENEMIES.md section 8)', () => {
  it('the legacy settings read the old curve at the area level', () => {
    for (const area of [1, 7, 30, 100]) expect(statLevel(area, LEGACY)).toBe(area);
    expect(relativeHardness(30, LEGACY, monsterLife, monsterHit)).toBeCloseTo(1, 10);
  });

  it('a spec with no difficulty fields builds the same monster as one at the legacy stat level and power 1', () => {
    const a = buildMonster(spec());
    const b = buildMonster(spec({ statLevel: 30, power: 1 }));
    expect(b.defence.maxLife).toBe(a.defence.maxLife);
    expect(b.profile(0).hands[0].chunks).toEqual(a.profile(0).hands[0].chunks);
  });

  it('scaling raises life and damage and leaves the area-level things alone', () => {
    const a = buildMonster(spec());
    const b = buildMonster(spec({ statLevel: statLevel(30, { ...LEGACY, scaling: 1.25 }) }));
    expect(b.defence.maxLife).toBeGreaterThan(a.defence.maxLife * 1.2);
    const dmg = (m: ReturnType<typeof buildMonster>) =>
      m.profile(0).hands[0].chunks.reduce((n, c) => n + c.max, 0);
    expect(dmg(b)).toBeGreaterThan(dmg(a));
    // Accuracy, evasion and armour, and the experience, stay on the area level.
    expect(b.defence.armour).toBe(a.defence.armour);
    expect(b.defence.evasion).toBe(a.defence.evasion);
    expect(b.xp).toBe(a.xp);
  });

  it('the base multiplier moves life times damage by that factor', () => {
    const a = buildMonster(spec());
    const b = buildMonster(spec({ power: 4 }));
    const dmg = (m: ReturnType<typeof buildMonster>) =>
      m.profile(0).hands[0].chunks.reduce((n, c) => n + (c.min + c.max) / 2, 0);
    const ratio = (b.defence.maxLife / a.defence.maxLife) * (dmg(b) / dmg(a));
    expect(ratio).toBeGreaterThan(3.9);
    expect(ratio).toBeLessThan(4.1);
  });

  it('the new default is harder than the legacy curve, more so as the run goes on', () => {
    const at = (m: number) => relativeHardness(m, DEFAULT, monsterLife, monsterHit);
    expect(at(1)).toBeCloseTo(1, 5);
    expect(at(10)).toBeGreaterThan(1.2);
    expect(at(50)).toBeGreaterThan(at(10));
    expect(at(100)).toBeGreaterThan(at(50));
  });

  it('clamps bad numbers into range', () => {
    expect(clampDifficulty({ scaling: 99, base: -3, variance: NaN })).toEqual({
      scaling: 2.5,
      base: 0.25,
      variance: DEFAULT.variance,
    });
    expect(clampDifficulty(undefined)).toEqual(DEFAULT);
  });

  it('variance is a bounded spread that is zero when variance is zero', () => {
    const d: Difficulty = { ...LEGACY, variance: 0.5 };
    expect(packPower(LEGACY, 1, 1)).toBe(1);
    expect(packPower(d, 1, 1)).toBe(1.5);
    expect(packPower(d, -1, -1)).toBe(0.5);
    expect(mapTier(LEGACY, 1)).toBeNull();
    expect(mapTier(d, 1)).toBe('fierce');
    expect(mapTier(d, -1)).toBe('gentle');
    expect(mapTier(d, 0)).toBe('even');
  });
});

describe('difficulty in map plans', () => {
  const plan = (d: Difficulty, seed = 5) =>
    makeMapPlan(seed, 20, 'ashenCrypt', [], 20, 'plain', 0, d, offerNoise(seed, '20.0'));

  it('the legacy plan has no difficulty fields on its monsters', () => {
    for (const m of plan(LEGACY).pop.monsters) {
      expect(m.spec.statLevel).toBeUndefined();
      expect(m.spec.power).toBeUndefined();
    }
  });

  it('a scaled plan puts the stat level on every monster and one power per pack', () => {
    const p = plan({ scaling: 1.5, base: 1, variance: 0.4 });
    const byPack = new Map<number, Set<number>>();
    for (const m of p.pop.monsters) {
      expect(m.spec.statLevel).toBeCloseTo(statLevel(20, { scaling: 1.5, base: 1, variance: 0 }));
      const set = byPack.get(m.pack) ?? new Set();
      set.add(m.spec.power!);
      byPack.set(m.pack, set);
    }
    for (const set of byPack.values()) expect(set.size).toBe(1);
    expect(new Set([...byPack.values()].map((s) => [...s][0])).size).toBeGreaterThan(1);
  });

  it('is the same map on a reload and the same monsters, with or without the settings', () => {
    const d = { scaling: 1.25, base: 1.2, variance: 0.3 };
    expect(JSON.stringify(plan(d).pop)).toBe(JSON.stringify(plan(d).pop));
    // The settings change the stats, never who is where.
    const a = plan(LEGACY).pop.monsters.map((m) => [m.spec.type, m.x, m.y, m.pack]);
    const b = plan(d).pop.monsters.map((m) => [m.spec.type, m.x, m.y, m.pack]);
    expect(b).toEqual(a);
  });

  it('every power stays inside the spread the settings promise', () => {
    const d = { scaling: 1, base: 1, variance: 0.3 };
    for (let seed = 1; seed < 8; seed++)
      for (const m of plan(d, seed).pop.monsters) {
        expect(m.spec.power!).toBeGreaterThanOrEqual(0.7);
        expect(m.spec.power!).toBeLessThanOrEqual(1.3);
      }
  });

  it('the offer card draw is a function of the run seed and the offer only', () => {
    expect(offerNoise(7, '12.1')).toBe(offerNoise(7, '12.1'));
    expect(offerNoise(7, '12.1')).not.toBe(offerNoise(7, '12.2'));
  });
});

describe('difficulty in a character and a run', () => {
  it('effective HP falls as the monsters get harder', () => {
    const run = newRun('vanguard', 1);
    const at = (d: Difficulty) =>
      new Character(run.build, { areaLevel: 30, difficulty: d, steady: 'clearing' }).ehp();
    expect(at({ ...LEGACY, scaling: 1.25 })).toBeLessThan(at(LEGACY));
    expect(at({ ...LEGACY, base: 2 })).toBeLessThan(at(LEGACY));
    expect(referenceMonster(30, DEFAULT).defence.maxLife).toBeGreaterThan(
      referenceMonster(30, LEGACY).defence.maxLife,
    );
  });

  it('a new run starts at the default and a version 7 save keeps the old curve', () => {
    expect(newRun('vanguard', 1).difficulty).toEqual(DEFAULT);
    const store = new MemoryStore();
    const run = JSON.parse(JSON.stringify(newRun('vanguard', 1))) as Record<string, unknown>;
    delete run.difficulty;
    run.version = 7;
    store.setItem(SAVE_KEY, JSON.stringify({ version: 7, run }));
    const res = loadRun(store);
    expect(res.status).toBe('ok');
    if (res.status === 'ok') expect(res.run.difficulty).toEqual(LEGACY);
  });
});
