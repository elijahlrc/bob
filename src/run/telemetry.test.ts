import { describe, expect, it } from 'vitest';
import type { DeathRecap } from '../sim/types';
import type { MapResult } from '../sim/runMap';
import { newRun } from './run';
import { DETAILS_ROOM, postRecord, postRecords, runRecord, simRecord } from './telemetry';

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
  hits: [
    { ago: 4.2, name: 'Gnawer', rarity: 'rare', dtype: 0, amount: 412.4, hp: 901.2 },
    {
      ago: 0.3,
      name: 'Crushing slam',
      via: 'Core Golem',
      rarity: 'effect',
      dtype: 0,
      amount: 400,
      hp: 480,
    },
  ],
  vitals: { life: -20.4, es: 0, mana: 33.3 },
  defence: {
    armour: 1200,
    evasion: 300,
    blockAttack: 0.25,
    blockSpell: 0,
    physReduction: 0.1,
    lifeRegen: 12.6,
    movement: 130,
  },
  flasks: [{ kind: 'life', charges: 7.5, max: 24, active: false, uses: 3 }],
  near: { all: 6, magic: 2, rare: 1, boss: 0 },
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
    const d = r.details as Record<string, unknown>;
    // A hit: tenths of a second before the death, from, via, rarity, damage type, amount, life and shield just before.
    expect(d.hits).toEqual([
      [42, 'Gnawer', '', 'rare', 0, 412, 901],
      [3, 'Crushing slam', 'Core Golem', 'effect', 0, 400, 480],
    ]);
    expect(d.vit).toEqual([-20, 0, 33]);
    expect(d.def).toEqual({ arm: 1200, eva: 300, blk: [25, 0], pr: 10, reg: 13, ms: 130 });
    expect(d.flasks).toEqual([['life', 8, 24, 0, 3]]);
    expect(d.near).toEqual([6, 2, 1, 0]);
    expect((d.gear as string[]).some((g) => g.startsWith('mainHand|'))).toBe(true);
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
    expect(JSON.stringify(r.details).length).toBeLessThanOrEqual(DETAILS_ROOM);
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

describe('a record that would not fit', () => {
  it('sheds the build, then the oldest hits, to stay within what the table takes', () => {
    const run = deadRun();
    run.lastRecap = {
      ...recap,
      hits: Array.from({ length: 14 }, (_, i) => ({
        ago: i,
        name: 'N'.repeat(40),
        via: 'V'.repeat(40),
        rarity: 'miniboss',
        dtype: 4,
        amount: 123456.7,
        hp: 98765.4,
      })),
    };
    const d = runRecord(run, res, 'abc1234').details as Record<string, unknown>;
    expect(JSON.stringify(d).length).toBeLessThanOrEqual(DETAILS_ROOM);
    // The latest hits stay; the first to go are the oldest.
    expect((d.hits as number[][]).at(-1)![0]).toBe(130);
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
    expect(JSON.parse(calls[0].init.body as string)[0].class_id).toBe('vanguard');
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

describe('records from the dev server and the bot', () => {
  const sink = { url: 'https://abc.supabase.co', key: 'k' };

  it('add a source and a batch to the same record, and go to the other table in one request', async () => {
    const calls: { url: string; body: string }[] = [];
    const base = runRecord(deadRun(), res, 'abc1234');
    const records = [
      simRecord(base, 'bot:best/greedy', 'seed2'),
      simRecord(base, 'x'.repeat(200), 'b'),
    ];
    const ok = await postRecords(
      async (url, init) => {
        calls.push({ url, body: init.body as string });
        return { ok: true };
      },
      sink,
      'sim_runs',
      records,
    );
    expect(ok).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://abc.supabase.co/rest/v1/sim_runs');
    const sent = JSON.parse(calls[0].body);
    expect(sent).toHaveLength(2);
    expect(sent[0]).toMatchObject({
      source: 'bot:best/greedy',
      batch: 'seed2',
      game_version: 'abc1234',
    });
    expect(sent[1].source).toHaveLength(64);
    // Every record has the same fields (the server refuses a batch whose objects differ).
    expect(Object.keys(sent[0]).sort()).toEqual(Object.keys(sent[1]).sort());
  });

  it('sends nothing for no records', async () => {
    let called = false;
    const ok = await postRecords(async () => ((called = true), { ok: true }), sink, 'sim_runs', []);
    expect(ok).toBe(true);
    expect(called).toBe(false);
  });
});
