import { describe, expect, it } from 'vitest';
import { newRun, setMap } from './run';
import { buildSignature, countUniques, RunTally, type KillerInfo } from './metrics';
import { randomRun } from './randomBot';
import { killerReport, signatureReport, uniquesReport, type RunSummary } from './report';

const killer = (over: Partial<KillerInfo> = {}): KillerInfo => ({
  faction: 'ossuary',
  type: 'brute',
  variant: 'cold',
  rarity: 'rare',
  mods: ['hasted'],
  dtype: 'cold',
  name: 'Frozen Skeleton Brute',
  ...over,
});

const summary = (over: Partial<RunSummary> = {}): RunSummary => ({
  classId: 'vanguard',
  won: false,
  deathMap: 10,
  killer: killer(),
  mapsPlayed: 10,
  found: 0,
  gemsFound: 0,
  snapshots: [],
  signature: 'cleave | - | -',
  ...over,
});

describe('depth report', () => {
  it('counts killers by faction, type and mod', () => {
    const lines = killerReport([
      summary(),
      summary({ killer: killer({ type: 'archer', mods: [] }) }),
      summary({ won: true, deathMap: null, killer: null }),
    ]).join('\n');
    expect(lines).toContain('Deaths with a known killer: 2 of 2');
    expect(lines).toContain('Faction: ossuary 2 (100%)');
    expect(lines).toContain('brute 1 (50%)');
    expect(lines).toContain('hasted 1 (50%)');
  });

  it('reports uniques found and worn at the snapshot maps', () => {
    const snap = (found: number, worn: string[]) => ({ map: 25, found, worn, signature: 's' });
    const text = uniquesReport([
      summary({ snapshots: [snap(2, ['a'])] }),
      summary({ snapshots: [snap(4, [])] }),
    ]).join('\n');
    expect(text).toContain('| 25 | 2 | 3 | 50% | a 1 |');
    expect(uniquesReport([summary()])).toEqual(['Uniques: no run reached map 25']);
  });

  it('counts distinct build signatures among the winners', () => {
    const wins = [
      summary({ won: true, signature: 'x' }),
      summary({ won: true, signature: 'x' }),
      summary({ won: true, signature: 'y' }),
      summary(),
    ];
    const text = signatureReport(wins).join('\n');
    expect(text).toContain('3 wins: 2 distinct');
    expect(text).toContain('2× x');
  });
});

describe('run metrics', () => {
  it('a new run has a skill in its signature and no uniques', () => {
    const run = newRun('mystic', 1);
    expect(buildSignature(run.build)).toMatch(/^\w+ \| - \| -$/);
    expect(countUniques([])).toBe(0);
    const t = new RunTally();
    setMap(run, 25);
    t.afterMap(run, []);
    expect(t.snapshots).toHaveLength(1);
    expect(t.snapshots[0].found).toBe(0);
  });

  it('the random player records who killed it', () => {
    const r = randomRun('vanguard', 2000, 30);
    expect(r.died).toBe(true);
    expect(r.killer?.faction).toBe('ossuary');
    expect(r.deathMap).toBe(r.reached);
    expect(r.signature.length).toBeGreaterThan(0);
  });
});
