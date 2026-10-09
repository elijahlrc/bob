import { describe, expect, it } from 'vitest';
import type { DeathRecap } from '../sim/types';
import type { MapResult } from '../sim/runMap';
import { newRun } from './run';
import { postRecord, runRecord } from './telemetry';

const recap: DeathRecap = {
  time: 41.6,
  killer: 'Gnawer',
  killerRarity: 'rare',
  killerMods: ['hasted', 'fireBound'],
  killerType: 'gnawer',
  themeId: 'ossuary',
  affixes: ['frenzied', 'armoured'],
  areaLevel: 37,
  mapType: 'crescendo',
  lines: [
    { name: 'Gnawer', dtype: 0, amount: 812.4 },
    { name: 'The Collapse', dtype: 0, amount: 100 },
  ],
  res: { fire: 40, cold: 75, lightning: 10, chaos: -30 },
  maxRes: { fire: 75, cold: 75, lightning: 75, chaos: 75 },
  ailments: ['ignite'],
  maxLife: 901.2,
  maxEs: 0,
};
const res = { status: 'dead', areaLevel: 37, type: 'crescendo', level: 41 } as MapResult;

function deadRun() {
  const run = newRun('vanguard', 12345);
  run.phase = 'dead';
  run.map = 35;
  run.build = { ...run.build, level: 41 };
  run.lastRecap = recap;
  run.history.push({
    map: 34,
    areaLevel: 34,
    status: 'cleared',
    time: 80.4,
    levelAfter: 40,
    kills: 120,
    stuck: 0,
  });
  return run;
}

describe('the record of a finished run', () => {
  it('says what killed the character, where, as which class and at what level', () => {
    const r = runRecord(deadRun(), res, 'abc1234');
    expect(r).toMatchObject({
      outcome: 'died',
      class_id: 'vanguard',
      level: 41,
      map: 35,
      area_level: 37,
      map_type: 'crescendo',
      theme: 'ossuary',
      affixes: ['frenzied', 'armoured'],
      killer: 'Gnawer',
      killer_type: 'gnawer',
      killer_rarity: 'rare',
      killer_mods: ['hasted', 'fireBound'],
      seed: 12345,
      game_version: 'abc1234',
    });
    expect(r.details).toMatchObject({ maps_played: 1, seconds: 80, kills: 120, max_life: 901 });
    expect((r.details.last_damage as unknown[])[0]).toEqual({
      from: 'Gnawer',
      type: 0,
      amount: 812,
    });
  });

  it('records a win without a killer', () => {
    const run = deadRun();
    run.phase = 'victory';
    run.lastRecap = undefined;
    run.map = 100;
    const r = runRecord(run, { ...res, status: 'cleared' } as MapResult, 'abc1234');
    expect(r.outcome).toBe('won');
    expect(r.killer).toBeNull();
    expect(r.affixes).toEqual([]);
    expect(r.map).toBe(100);
  });

  it('holds nothing about the player: no free text, bounded lengths and lists', () => {
    const run = deadRun();
    run.lastRecap = {
      ...recap,
      killer: 'x'.repeat(500),
      killerMods: Array.from({ length: 40 }, (_, i) => `mod${i}`),
    };
    const r = runRecord(run, res, 'v'.repeat(200));
    expect(r.killer!.length).toBe(64);
    expect(r.killer_mods).toHaveLength(12);
    expect(r.game_version.length).toBe(64);
    expect(JSON.stringify(r).length).toBeLessThan(3000);
    expect(Object.keys(r).sort()).toEqual(
      [
        'outcome',
        'class_id',
        'level',
        'map',
        'area_level',
        'map_type',
        'theme',
        'affixes',
        'killer',
        'killer_type',
        'killer_rarity',
        'killer_mods',
        'seed',
        'game_version',
        'details',
      ].sort(),
    );
  });
});

describe('sending a record', () => {
  const sink = { url: 'https://abc.supabase.co/', key: 'sb_publishable_test' };

  it('posts it to the table with the public key and nothing else identifying', async () => {
    const calls: { url: string; init: Record<string, unknown> }[] = [];
    const ok = await postRecord(
      async (url, init) => {
        calls.push({ url, init });
        return { ok: true };
      },
      sink,
      runRecord(deadRun(), res, 'abc1234'),
    );
    expect(ok).toBe(true);
    expect(calls[0].url).toBe('https://abc.supabase.co/rest/v1/runs');
    expect(calls[0].init.method).toBe('POST');
    expect(calls[0].init.headers).toMatchObject({ apikey: 'sb_publishable_test' });
    expect(JSON.parse(calls[0].init.body as string).class_id).toBe('vanguard');
  });

  it('never throws: an offline or refused request is just false', async () => {
    const record = runRecord(deadRun(), res, 'x');
    expect(
      await postRecord(
        async () => {
          throw new Error('offline');
        },
        sink,
        record,
      ),
    ).toBe(false);
    expect(await postRecord(async () => ({ ok: false }), sink, record)).toBe(false);
  });
});
