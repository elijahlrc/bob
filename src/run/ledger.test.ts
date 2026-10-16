import { describe, expect, it } from 'vitest';
import { combineReports, type MapReport } from '../sim/ledger';
import { worldResult } from '../sim/runMap';
import { createWorld, stepWorld } from '../sim/world';
import { botCamp } from './bot';
import { newRun, planFor, setMap, worldOptsFor } from './run';

const total = (rows: { dmg: number[] }[]) =>
  rows.reduce((s, r) => s + r.dmg.reduce((a, b) => a + b, 0), 0);

function playMap(classId: string, map: number, seed: number) {
  const run = newRun(classId, seed);
  setMap(run, map);
  run.build.level = map + 2;
  botCamp(run);
  const plan = planFor(run, run.offers[0]);
  const w = createWorld({ plan, build: run.build, xp: 0, opts: worldOptsFor(run, plan) });
  while (w.status === 'running') stepWorld(w);
  return { w, res: worldResult(w) };
}

describe('the map report (the damage ledger)', () => {
  // The invariant that catches a damage path nobody told the ledger about: what the report adds up to is what the
  // world's own tallies say was dealt and taken.
  for (const [cls, map, seed] of [
    ['vanguard', 12, 3],
    ['strider', 20, 5],
    ['mystic', 16, 9],
  ] as const) {
    it(`adds up to the world's totals (${cls}, map ${map})`, () => {
      const { w, res } = playMap(cls, map, seed);
      const r = res.report!;
      expect(r).toBeDefined();
      expect(total(r.dealt)).toBeCloseTo(w.sides[0].stats.damageDealt, 3);
      expect(total(r.taken)).toBeCloseTo(w.sides[0].stats.damageTaken, 3);
      // What was taken came out of energy shield, mana and life.
      const pools = r.pools.es + r.pools.mana + r.pools.life;
      expect(pools).toBeGreaterThan(0);
      expect(pools).toBeLessThanOrEqual(total(r.taken) + 1e-6);
      // The character dealt damage with a skill, and the rows are largest first.
      expect(r.dealt.some((row) => row.kind === 'skill')).toBe(true);
      for (let i = 1; i < r.dealt.length; i++)
        expect(total([r.dealt[i - 1]])).toBeGreaterThanOrEqual(total([r.dealt[i]]));
      expect(r.time).toBe(res.time);
    });
  }

  it('adds the maps of a Crawl together', () => {
    const row = (name: string, d: number, hits: number, max: number) => ({
      name,
      kind: 'skill' as const,
      dmg: [d, 0, 0, 0, 0],
      hits,
      crits: 1,
      misses: 2,
      max,
    });
    const part = (d: number, max: number): MapReport => ({
      time: 10,
      dealt: [row('Spirit Saw', d, 5, max)],
      taken: [],
      pools: { es: 1, life: 2, mana: 3 },
      evaded: 1,
      blocked: 2,
    });
    const both = combineReports([part(100, 30), part(50, 70)]);
    expect(both.time).toBe(20);
    expect(both.dealt).toHaveLength(1);
    expect(both.dealt[0]).toMatchObject({ hits: 10, crits: 2, misses: 4, max: 70 });
    expect(both.dealt[0].dmg[0]).toBe(150);
    expect(both.pools).toEqual({ es: 2, life: 4, mana: 6 });
    expect([both.evaded, both.blocked]).toEqual([2, 4]);
  });
});
