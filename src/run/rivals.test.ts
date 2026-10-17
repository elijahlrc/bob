import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Rng } from '../core/rng';
import { ACTIVE_GEMS, ALL_GEMS } from '../data/gems';
import { ipViolations } from '../data/ipScan';
import { RIVAL_EPITHETS, RIVAL_PLACES, MAX_GENERATED_NAME } from '../data/rivalNames';
import { itemBase } from '../data/bases';
import { UNIQUE_FLASKS } from '../data/uniqueFlasks';
import { UNIQUES } from '../data/uniques';
import { rollBase, rollFlask, rollItemOf, rollUnique, rollUniqueFlask } from '../gen/loot';
import type { Build, EquipSlot, Item, ItemClass, Rarity } from '../data/types';
import type { MapResult } from '../sim/runMap';
import { botSeed, snapshotBuild } from './duelBot';
import {
  botRivalRecord,
  fetchHighScores,
  fetchRivals,
  generateName,
  hashToken,
  NAME_PATTERN,
  postRival,
  rivalRecord,
  validateRival,
  validName,
  type FetchJson,
  type RivalRecord,
} from './rivals';
import { newRun, SAVE_VERSION, type RunState } from './run';

const sink = { url: 'https://abc.supabase.co/', key: 'sb_publishable_test' };
const res = { status: 'dead', areaLevel: 37, type: 'crescendo', level: 41 } as MapResult;
const sql = readFileSync(new URL('../../docs/rivals.sql', import.meta.url), 'utf8');

function deadRun(): RunState {
  const run = newRun('vanguard', 12345);
  run.phase = 'dead';
  run.map = 35;
  run.build = { ...run.build, level: 41 };
  return run;
}

const HASH = 'a'.repeat(64);
const opts = { name: null, tokenHash: HASH, version: 'abc1234', seed: 99 };

/** What the wire gives back for a posted record: the row of `rivals_for`, with the id the table gave it. */
function rowOf(rec: RivalRecord, over: Record<string, unknown> = {}): unknown {
  const { token_hash: _token, ...rest } = rec;
  return JSON.parse(JSON.stringify({ id: 7, ...rest, ...over }));
}

/** The build with one gem socketed in the main hand and chosen as the primary skill. */
function withPrimaryGem(build: Build, uid = 9001): Build {
  const b = structuredClone(build);
  const main = b.equipment.mainHand!;
  main.sockets = [{ kind: 'gem', uid, gemId: ACTIVE_GEMS[0].id }, ...main.sockets.slice(1)];
  b.primaryGem = uid;
  return b;
}

function recordOf(build: Build): RivalRecord {
  const run = deadRun();
  run.build = build;
  return rivalRecord(run, res, opts);
}

describe('the record of a character', () => {
  it('holds the table columns and the build, and nothing else of the run', () => {
    const run = deadRun();
    run.inventory.push(structuredClone(run.build.equipment.mainHand!));
    run.lastRecap = { time: 1, lines: [], killer: 'Gnawer' } as unknown as RunState['lastRecap'];
    run.difficulty = {
      scaling: 2,
      base: 1.5,
      variance: 0.1,
      secret: 'x',
    } as RunState['difficulty'];
    const r = rivalRecord(run, res, { ...opts, name: 'Wren' });
    expect(Object.keys(r).sort()).toEqual(
      [
        'name',
        'class_id',
        'level',
        'map',
        'outcome',
        'difficulty',
        'save_version',
        'game_version',
        'bot',
        'token_hash',
        'build',
      ].sort(),
    );
    expect(r).toMatchObject({
      name: 'Wren',
      class_id: 'vanguard',
      level: 41,
      map: 35,
      outcome: 'died',
      difficulty: { scaling: 2, base: 1.5, variance: 0.1 },
      save_version: SAVE_VERSION,
      game_version: 'abc1234',
      bot: false,
      token_hash: HASH,
    });
    expect(Object.keys(r.difficulty)).toEqual(['scaling', 'base', 'variance']);
    expect(r.build).toBe(run.build);
    expect(JSON.stringify(r)).not.toMatch(
      /"(inventory|history|lastRecap|currency|offers|wayside)"/,
    );
    expect(JSON.stringify(r)).not.toContain('Gnawer');
  });

  it('is a win with the last map, a bot with the flag, and bounded', () => {
    const run = deadRun();
    run.phase = 'victory';
    run.map = 100;
    const won = rivalRecord(run, res, { ...opts, bot: true, version: 'v'.repeat(200) });
    expect(won).toMatchObject({ outcome: 'won', map: 100, bot: true });
    expect(won.game_version).toHaveLength(64);
    run.map = 150;
    run.build = { ...run.build, level: 0 };
    expect(rivalRecord(run, res, opts)).toMatchObject({ map: 100, level: 1 });
  });

  it('takes the typed name when it is valid and makes one up when it is not', () => {
    const run = deadRun();
    expect(rivalRecord(run, res, { ...opts, name: 'Bob-2' }).name).toBe('Bob-2');
    for (const bad of ['', 'x', '-Bob', 'Bob ', 'a'.repeat(17), 'Bób', null]) {
      expect(rivalRecord(run, res, { ...opts, name: bad }).name).toBe(generateName(99));
    }
  });

  it('is the one the SQL has columns for', () => {
    const table = sql.slice(
      sql.indexOf('create table if not exists public.rivals'),
      sql.indexOf('create index'),
    );
    for (const key of Object.keys(recordOf(deadRun().build)))
      expect(table).toMatch(new RegExp(`\\n  ${key}\\s`));
    expect(sql).toContain(NAME_PATTERN.source);
  });
});

describe('the token', () => {
  it('is hashed to 64 hex characters, the same way each time (SHA-256)', async () => {
    expect(await hashToken('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
    expect(await hashToken('abc')).toBe(await hashToken('abc'));
    expect(await hashToken('abd')).not.toBe(await hashToken('abc'));
    expect(await hashToken('a longer token, with ünïcode')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('never appears in a request: only its hash does', async () => {
    const bodies: string[] = [];
    const raw = 'raw-token-0123456789abcdef';
    const record = rivalRecord(deadRun(), res, { ...opts, tokenHash: await hashToken(raw) });
    await postRival(
      async (_url, init) => {
        bodies.push(JSON.stringify(init));
        return { ok: true };
      },
      sink,
      record,
    );
    expect(bodies[0]).not.toContain(raw);
    expect(bodies[0]).toContain(record.token_hash);
    const bot = await botRivalRecord(deadRun(), res, 'v1');
    expect(JSON.stringify(bot)).not.toContain('bot:vanguard:12345');
  });

  it('is its own for each class and seed of a bot, and the same for the same run', async () => {
    const a = await botRivalRecord(deadRun(), res, 'v1');
    const again = await botRivalRecord(deadRun(), res, 'v1');
    const other = deadRun();
    other.seed = 12346;
    const b = await botRivalRecord(other, res, 'v1');
    expect(a.token_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(a.token_hash).toBe(again.token_hash);
    expect(a.token_hash).not.toBe(b.token_hash);
    expect(a).toMatchObject({ bot: true, name: generateName(12345), game_version: 'v1' });
  });
});

describe('sending and fetching', () => {
  it('posts the row to the table with the public key', async () => {
    const calls: { url: string; init: Record<string, unknown> }[] = [];
    const record = rivalRecord(deadRun(), res, opts);
    const ok = await postRival(
      async (url, init) => {
        calls.push({ url, init });
        return { ok: true };
      },
      sink,
      record,
    );
    expect(ok).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://abc.supabase.co/rest/v1/rivals');
    expect(calls[0].init.method).toBe('POST');
    expect(calls[0].init.headers).toMatchObject({
      apikey: 'sb_publishable_test',
      Prefer: 'return=minimal',
    });
    const body = JSON.parse(calls[0].init.body as string);
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      class_id: 'vanguard',
      token_hash: HASH,
      save_version: SAVE_VERSION,
    });
  });

  it('asks rivals_for with the version, the map, how many and whom to leave out', async () => {
    const calls: { url: string; init: Record<string, unknown> }[] = [];
    const good = rowOf(rivalRecord(deadRun(), res, { ...opts, name: 'Wren' }), { id: 12 });
    const fetchFn: FetchJson = async (url, init) => {
      calls.push({ url, init });
      return { ok: true, json: async () => [good] };
    };
    const rivals = await fetchRivals(fetchFn, sink, {
      saveVersion: SAVE_VERSION,
      map: 30,
      k: 5,
      excludeTokenHash: HASH,
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://abc.supabase.co/rest/v1/rpc/rivals_for');
    expect(calls[0].init.method).toBe('POST');
    expect(calls[0].init.headers).toMatchObject({ apikey: 'sb_publishable_test' });
    expect(JSON.parse(calls[0].init.body as string)).toEqual({
      save_version: SAVE_VERSION,
      map: 30,
      k: 5,
      exclude_token_hash: HASH,
    });
    expect(rivals).toHaveLength(1);
    expect(rivals[0]).toMatchObject({
      id: '12',
      name: 'Wren',
      classId: 'vanguard',
      level: 41,
      map: 35,
      outcome: 'died',
      saveVersion: SAVE_VERSION,
      gameVersion: 'abc1234',
      bot: false,
    });
    expect(rivals[0].build.classId).toBe('vanguard');
  });

  it('sends null for no one to leave out, and leaves a row that does not hold up out of the list', async () => {
    const good = rowOf(rivalRecord(deadRun(), res, opts));
    const badGem = structuredClone(good) as { build: Build };
    badGem.build.equipment.mainHand!.sockets = [{ kind: 'gem', uid: 5, gemId: 'nope' }];
    const bodies: string[] = [];
    const rivals = await fetchRivals(
      async (_url, init) => {
        bodies.push(init.body as string);
        return { ok: true, json: async () => [badGem, 'junk', null, good] };
      },
      sink,
      { saveVersion: SAVE_VERSION, map: 3, k: 20, excludeTokenHash: null },
    );
    expect(JSON.parse(bodies[0]).exclude_token_hash).toBeNull();
    expect(rivals).toHaveLength(1);
  });

  it('asks high_scores for the top k and reads the rows of its type', async () => {
    const calls: { url: string; body: string }[] = [];
    const row = {
      id: 3,
      name: 'Wren',
      class_id: 'mystic',
      level: 60,
      map: 41,
      outcome: 'died',
      rating: 1234,
      fights: 12,
      wins: 8,
      game_version: 'abc1234',
      posted_on: '2026-10-17',
    };
    const scores = await fetchHighScores(
      async (url, init) => {
        calls.push({ url, body: init.body as string });
        return {
          ok: true,
          json: async () => [
            row,
            { ...row, id: 4, rating: 'high' },
            { ...row, id: 5, name: 9 },
            row,
          ],
        };
      },
      sink,
      100,
    );
    expect(calls[0].url).toBe('https://abc.supabase.co/rest/v1/rpc/high_scores');
    expect(JSON.parse(calls[0].body)).toEqual({ k: 100 });
    expect(scores).toEqual([
      {
        id: '3',
        name: 'Wren',
        classId: 'mystic',
        level: 60,
        map: 41,
        outcome: 'died',
        rating: 1234,
        fights: 12,
        wins: 8,
        gameVersion: 'abc1234',
        postedOn: '2026-10-17',
      },
      expect.objectContaining({ id: '3' }),
    ]);
  });

  it('never throws: offline, refused, or an answer that is not a list is just false or empty', async () => {
    const record = rivalRecord(deadRun(), res, opts);
    const q = { saveVersion: SAVE_VERSION, map: 1, k: 5, excludeTokenHash: null };
    const offline = async () => {
      throw new Error('offline');
    };
    expect(await postRival(offline, sink, record)).toBe(false);
    expect(await postRival(async () => ({ ok: false }), sink, record)).toBe(false);
    expect(await fetchRivals(offline, sink, q)).toEqual([]);
    expect(await fetchHighScores(offline, sink, 10)).toEqual([]);
    const refused: FetchJson = async () => ({ ok: false, json: async () => [] });
    expect(await fetchRivals(refused, sink, q)).toEqual([]);
    expect(await fetchHighScores(refused, sink, 10)).toEqual([]);
    const object: FetchJson = async () => ({ ok: true, json: async () => ({ message: 'no' }) });
    expect(await fetchRivals(object, sink, q)).toEqual([]);
    expect(await fetchHighScores(object, sink, 10)).toEqual([]);
    const brokenBody: FetchJson = async () => ({
      ok: true,
      json: async () => {
        throw new Error('not json');
      },
    });
    expect(await fetchRivals(brokenBody, sink, q)).toEqual([]);
  });
});

describe('a name a player may type', () => {
  it('is 3 to 16 ASCII letters, digits, spaces and hyphens that starts and ends with a letter or digit', () => {
    const good = ['Bob', 'Bo7', 'a b', 'Bob-Ross', 'Two  Spaces', '0123456789abcdef', 'A-1'];
    const bad = [
      '',
      'Bo',
      '0123456789abcdefg',
      ' Bob',
      'Bob ',
      '-Bob',
      'Bob-',
      'Bób',
      'Bob_1',
      "Bob's",
      'Bob\n',
      'a\tb',
      '日本語です',
    ];
    for (const s of good) expect(validName(s), s).toBe(true);
    for (const s of bad) expect(validName(s), JSON.stringify(s)).toBe(false);
  });
});

describe('the names the game makes up', () => {
  it('are the same for the same seed, and most seeds differ', () => {
    expect(generateName(5)).toBe(generateName(5));
    const names = new Set(Array.from({ length: 200 }, (_, i) => generateName(i)));
    expect(names.size).toBeGreaterThan(190);
    expect(generateName(1)).toMatch(/^The [A-Z][a-z]+ [A-Za-z ]+ of the [A-Z][a-z]+ [A-Za-z]+$/);
  });

  it('fit the table: under 48 characters, ASCII letters and spaces', () => {
    expect(MAX_GENERATED_NAME).toBeLessThanOrEqual(48);
    for (let i = 0; i < 500; i++) {
      const n = generateName(i);
      expect(n.length).toBeLessThanOrEqual(48);
      expect(n).toMatch(NAME_PATTERN);
      expect(n).not.toMatch(/ {2}/);
    }
    for (const w of [...RIVAL_EPITHETS, ...RIVAL_PLACES])
      expect(w).toMatch(/^[A-Z][a-z]+( [A-Z][a-z]+)+$/);
    expect(new Set(RIVAL_EPITHETS).size).toBe(RIVAL_EPITHETS.length);
    expect(new Set(RIVAL_PLACES).size).toBe(RIVAL_PLACES.length);
  });

  it('use no word of the reference game (every entry and every name of 500 seeds)', () => {
    const words = [...RIVAL_EPITHETS, ...RIVAL_PLACES].flatMap((s) => [s, ...s.split(' ')]);
    const names = Array.from({ length: 500 }, (_, i) => generateName(i));
    expect(ipViolations([...words, ...names])).toEqual([]);
    // (The scan catches a slip: a whole-string single word, or a phrase anywhere.)
    expect(ipViolations(['Shaper', 'The Eternal Empire of the Low Road']).length).toBe(2);
  });
});

describe('checking a rival before it is shown', () => {
  /** A bot's character as it stands at map 8 of a real bot run (a second or two), posted as the sim posts it. */
  const bot = (() => {
    let record: RivalRecord | null = null;
    return async () => {
      if (record) return record;
      const snap = snapshotBuild('strider', 3, 8, true)!;
      const run = newRun('strider', botSeed(3));
      run.build = snap.build;
      run.map = snap.map;
      run.phase = 'dead';
      record = await botRivalRecord(run, res, 'abc1234');
      return record;
    };
  })();

  it('accepts the record of a bot run, as it comes back from the table', async () => {
    const rec = await bot();
    const rival = validateRival(rowOf(rec), SAVE_VERSION);
    expect(rival).not.toBeNull();
    expect(rival).toMatchObject({ classId: 'strider', bot: true, saveVersion: SAVE_VERSION });
    expect(rival!.name).toBe(rec.name);
    expect(rival!.build.allocated).toEqual(rec.build.allocated);
  });

  it('accepts a player’s record, and does not read the rating columns', () => {
    const rec = rivalRecord(deadRun(), res, { ...opts, name: 'Wren' });
    const rival = validateRival(
      rowOf(rec, { rating: 1500, fights: 4, wins: 3, rated_at: 'x' }),
      SAVE_VERSION,
    );
    expect(rival).toMatchObject({ name: 'Wren', bot: false });
    expect(Object.keys(rival!)).not.toContain('rating');
  });

  it('accepts a primary gem that is socketed, and the old name of a gem that was folded into another', () => {
    const build = withPrimaryGem(deadRun().build);
    expect(validateRival(rowOf(recordOf(build)), SAVE_VERSION)).not.toBeNull();
    const old = structuredClone(build);
    old.equipment.mainHand!.sockets[1] = { kind: 'gem', uid: 9002, gemId: 'cindering' };
    expect(validateRival(rowOf(recordOf(old)), SAVE_VERSION)).not.toBeNull();
  });

  it('skips a row with an id this version does not have, or a primary gem that is not socketed', () => {
    const base = deadRun().build;
    const mutate = (f: (b: Build) => void): unknown => {
      const b = structuredClone(withPrimaryGem(base));
      f(b);
      return rowOf(recordOf(b));
    };
    expect(
      validateRival(
        mutate(() => {}),
        SAVE_VERSION,
      ),
    ).not.toBeNull();
    const refused: Record<string, (b: Build) => void> = {
      'a gem id': (b) => {
        b.equipment.mainHand!.sockets[1] = { kind: 'gem', uid: 9003, gemId: 'no-such-gem' };
      },
      'a passive node': (b) => {
        b.allocated.push(999999);
      },
      'a negative node': (b) => {
        b.allocated.push(-1);
      },
      'an item base': (b) => {
        b.equipment.mainHand!.baseId = 'no_such_base';
      },
      'an affix family': (b) => {
        b.equipment.body!.affixes = [{ family: 'no-such-family', tier: 1, mods: [] }];
      },
      'a unique family on an item that is not a unique': (b) => {
        b.equipment.body!.affixes = [{ family: 'unique', tier: 1, mods: [] }];
      },
      'a unique id': (b) => {
        b.equipment.body!.uniqueId = 'no-such-unique';
      },
      'a flask base': (b) => {
        b.flasks[0] = {
          kind: 'flask',
          uid: 5,
          baseId: 'no_such_flask',
          ilvl: 1,
          name: 'x',
          affixes: [],
        };
      },
      'a flask affix': (b) => {
        b.flasks[0] = {
          kind: 'flask',
          uid: 5,
          baseId: b.flasks.find((f) => f)!.baseId,
          ilvl: 1,
          name: 'x',
          affixes: [{ family: 'no-such-affix', tier: 1, mods: [] }],
        };
      },
      'an equipment slot': (b) => {
        (b.equipment as Record<string, unknown>).tail = structuredClone(b.equipment.body);
      },
      'a primary gem that is not in a socket': (b) => {
        b.primaryGem = 424242;
      },
      'a mod without a number': (b) => {
        b.equipment.body!.implicits = [
          { stat: 'life', kind: 'base', value: 'many' as unknown as number },
        ];
      },
      'a strategy of another kind': (b) => {
        b.strategy = { target: 'nobody' } as unknown as Build['strategy'];
      },
      'a class that is not the row’s': (b) => {
        b.classId = 'mystic';
      },
    };
    for (const [what, f] of Object.entries(refused))
      expect(validateRival(mutate(f), SAVE_VERSION), what).toBeNull();
  });

  it('skips a row of another save version, a bad name, a bad shape, or a build that will not make a character', () => {
    const rec = rivalRecord(deadRun(), res, { ...opts, name: 'Wren' });
    const ok = rowOf(rec) as Record<string, unknown>;
    expect(validateRival(ok, SAVE_VERSION)).not.toBeNull();
    expect(validateRival({ ...ok, save_version: SAVE_VERSION + 1 }, SAVE_VERSION + 1)).toBeNull();
    expect(validateRival({ ...ok, save_version: SAVE_VERSION - 1 }, SAVE_VERSION)).toBeNull();
    expect(validateRival({ ...ok, save_version: SAVE_VERSION }, SAVE_VERSION - 1)).toBeNull();
    for (const over of [
      { name: '-Wren' },
      { name: 'Wr' },
      { name: 'x'.repeat(49) },
      { name: 7 },
      { class_id: 'wizard' },
      { level: 0 },
      { level: 41.5 },
      { map: 101 },
      { outcome: 'draw' },
      { difficulty: null },
      { bot: 'no' },
      { build: null },
      { build: [] },
      { id: undefined },
    ])
      expect(validateRival({ ...ok, ...over }, SAVE_VERSION), JSON.stringify(over)).toBeNull();
    for (const junk of [null, undefined, 3, 'row', [], {}])
      expect(validateRival(junk, SAVE_VERSION)).toBeNull();
    // A level that does not match the build's.
    expect(validateRival({ ...ok, level: 40 }, SAVE_VERSION)).toBeNull();
  });
});

describe('what a real character holds is accepted', () => {
  const slotOf = (c: ItemClass): EquipSlot => {
    if (c === 'shield' || c === 'quiver') return 'offHand';
    if (c === 'helmet' || c === 'gloves' || c === 'boots') return c;
    if (c === 'body') return 'body';
    if (c === 'amulet' || c === 'belt') return c;
    if (c === 'ring') return 'ring1';
    return 'mainHand';
  };
  const uid = (() => {
    let n = 100;
    return () => n++;
  })();
  /** The starting character wearing `it` in the slot its base belongs in, with a gem in every socket. */
  const wear = (it: Item): Build => {
    const b = structuredClone(deadRun().build);
    it.sockets = it.sockets.map((_, i) => ({
      kind: 'gem',
      uid: uid(),
      gemId: ALL_GEMS[i % ALL_GEMS.length].id,
    }));
    b.equipment[slotOf(itemBase(it.baseId).itemClass)] = it;
    return b;
  };

  it('rolled items of every rarity, with gems in their sockets', () => {
    const rng = new Rng(11);
    let n = 0;
    for (let i = 0; i < 240; i++) {
      const rarity: Rarity = (['normal', 'magic', 'rare'] as const)[i % 3];
      const it = rollItemOf(rng, uid, rollBase(rng, 20 + (i % 70)), 20 + (i % 70), rarity);
      const rec = recordOf(wear(it));
      expect(validateRival(rowOf(rec), SAVE_VERSION), `${it.baseId} ${rarity}`).not.toBeNull();
      n++;
    }
    expect(n).toBe(240);
  });

  it('every unique item and every unique flask, with the mods and triggers they carry', () => {
    const rng = new Rng(12);
    for (const u of UNIQUES) {
      const it = rollUnique(rng, uid, u, Math.max(u.level, 30));
      const rec = recordOf(wear(it));
      expect(validateRival(rowOf(rec), SAVE_VERSION), u.id).not.toBeNull();
    }
    for (const u of UNIQUE_FLASKS) {
      const b = structuredClone(deadRun().build);
      b.flasks = [rollUniqueFlask(rng, uid, u, Math.max(u.level, 30)), ...b.flasks.slice(1)];
      expect(validateRival(rowOf(recordOf(b)), SAVE_VERSION), u.id).not.toBeNull();
    }
  });

  it('rolled flasks with their affixes', () => {
    const rng = new Rng(13);
    for (let i = 0; i < 80; i++) {
      const b = structuredClone(deadRun().build);
      b.flasks = [
        rollFlask(rng, uid, 20 + (i % 70), 1),
        rollFlask(rng, uid, 20 + (i % 70), 1),
        null,
      ];
      expect(validateRival(rowOf(recordOf(b)), SAVE_VERSION), `flask ${i}`).not.toBeNull();
    }
  });
});
