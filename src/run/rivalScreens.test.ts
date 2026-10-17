import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Rng } from '../core/rng';
import { gemDef } from '../data/gems';
import { UNIQUE_FLASKS } from '../data/uniqueFlasks';
import { UNIQUES } from '../data/uniques';
import { getTree } from '../data/tree';
import { rollUnique, rollUniqueFlask } from '../gen/loot';
import type { Build } from '../data/types';
import { snapshotBuild } from './duelBot';
import {
  buildSignature,
  drawRivals,
  duelSeedFor,
  fetchHighScoresOrNull,
  fetchMySnapshots,
  fetchRivalsOrNull,
  nameRefused,
  postDuel,
  postRival,
  rivalRecord,
  type DuelReport,
  type FetchAny,
  type Rival,
} from './rivals';
import { newRun, SAVE_VERSION } from './run';

/**
 * What the screens of F7 stand on (docs/DUEL.md 6.5): the seed of a rated fight, the report of one, the player's own snapshots,
 * what a card says of a build and the draw of five. Every call goes through an injected fetch; nothing here touches the network.
 */

const sink = { url: 'https://abc.supabase.co/', key: 'sb_publishable_test' };
const sql = readFileSync(new URL('../../docs/rivals.sql', import.meta.url), 'utf8');
const HASH = 'b'.repeat(64);

describe('the seed of a rated fight', () => {
  it('is the database’s duel_seed: the same constants as the SQL, and 1 and 2 give 1015841', () => {
    const fn = sql.slice(sql.indexOf('create or replace function public.duel_seed'));
    const body = /select ([^;]+);/.exec(fn)![1];
    const m = /^\(\(a \* (\d+)\) \+ \(b \* (\d+)\)\) % (\d+)$/.exec(body.trim());
    expect(m, body).not.toBeNull();
    const [k1, k2, mod] = [m![1], m![2], m![3]].map(BigInt);
    expect(duelSeedFor(1, 2)).toBe(1015841);
    for (const [a, b] of [
      [1, 2],
      [2, 1],
      [7, 7],
      [12345, 678],
      [999999, 1000000],
      [123456789, 987654321],
    ])
      expect(duelSeedFor(a, b), `${a},${b}`).toBe(Number((BigInt(a) * k1 + BigInt(b) * k2) % mod));
  });

  it('takes the ids as the client holds them (strings), is not symmetric, and fits a seed', () => {
    expect(duelSeedFor('1', '2')).toBe(1015841);
    expect(duelSeedFor(2, 1)).not.toBe(duelSeedFor(1, 2));
    for (const [a, b] of [
      [5, 9],
      [4000, 4001],
    ]) {
      const s = duelSeedFor(a, b);
      expect(Number.isSafeInteger(s) && s >= 0 && s < 2147483647).toBe(true);
    }
  });

  it('is not made of anything that is not an id', () => {
    expect(() => duelSeedFor('x', 2)).toThrow();
    expect(() => duelSeedFor(1, '2.5')).toThrow();
    expect(() => duelSeedFor(-1, 2)).toThrow();
  });
});

describe('posting a snapshot says why it failed', () => {
  const record = rivalRecord(
    (() => {
      const run = newRun('vanguard', 5);
      run.phase = 'dead';
      return run;
    })(),
    null,
    { name: 'Wren', tokenHash: HASH, version: 'v', seed: 5 },
  );
  const refusing =
    (status: number, body: unknown): FetchAny =>
    async () => ({ ok: false, status, json: async () => body });

  it('carries the server’s code and message, and tells a refused name from a cap or a block', async () => {
    const denied = await postRival(
      refusing(400, { code: '23514', message: 'that name is not allowed' }),
      sink,
      record,
    );
    expect(denied).toEqual({
      ok: false,
      status: 400,
      code: '23514',
      message: 'that name is not allowed',
    });
    expect(nameRefused(denied)).toBe(true);
    const column = await postRival(
      refusing(400, {
        code: '23514',
        message: 'new row for relation "rivals" violates check constraint "rivals_name_check"',
      }),
      sink,
      record,
    );
    expect(nameRefused(column)).toBe(true);
    for (const message of [
      'too many characters from this browser today',
      'this writer is blocked',
      'the pool is taking a rest; try again later',
    ]) {
      const r = await postRival(refusing(400, { code: '23514', message }), sink, record);
      expect(r.message).toBe(message);
      expect(nameRefused(r), message).toBe(false);
    }
  });

  it('is not a refused name when it is the network, a server error or an answer with no body', async () => {
    const offline = await postRival(
      async () => {
        throw new Error('offline');
      },
      sink,
      record,
    );
    expect(offline).toEqual({ ok: false });
    expect(nameRefused(offline)).toBe(false);
    expect(nameRefused(await postRival(refusing(500, { message: 'name' }), sink, record))).toBe(
      false,
    );
    const noBody = await postRival(async () => ({ ok: false, status: 503 }), sink, record);
    expect(noBody).toEqual({ ok: false, status: 503 });
    const brokenBody = await postRival(
      async () => ({
        ok: false,
        status: 400,
        json: async () => {
          throw new Error('not json');
        },
      }),
      sink,
      record,
    );
    expect(brokenBody).toEqual({ ok: false, status: 400 });
    expect(nameRefused(brokenBody)).toBe(false);
  });
});

describe('the report of a rated fight', () => {
  const report: DuelReport = {
    a_id: 41,
    b_id: 7,
    winner: 0,
    how: 'death',
    seconds: 23.45,
    game_version: 'abc1234',
    token_hash: HASH,
  };
  const answering = (status: number, body?: unknown): FetchAny => {
    return async () => ({
      ok: status >= 200 && status < 300,
      status,
      ...(body === undefined ? {} : { json: async () => body }),
    });
  };

  it('is one row posted to duels with the public key and no read-back', async () => {
    const calls: { url: string; init: Record<string, unknown> }[] = [];
    const out = await postDuel(
      async (url, init) => {
        calls.push({ url, init });
        return { ok: true, status: 201 };
      },
      sink,
      report,
    );
    expect(out).toEqual({ outcome: 'rated' });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://abc.supabase.co/rest/v1/duels');
    expect(calls[0].init.method).toBe('POST');
    expect(calls[0].init.headers).toMatchObject({
      apikey: 'sb_publishable_test',
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    });
    expect(JSON.parse(calls[0].init.body as string)).toEqual([report]);
  });

  it('sends the columns the table has and none the server decides (the seed, the time, the address, verified)', () => {
    const table = sql.slice(
      sql.indexOf('create table if not exists public.duels'),
      sql.indexOf('create index if not exists duels_token_idx'),
    );
    for (const key of Object.keys(report)) expect(table).toMatch(new RegExp(`\\n  ${key}\\s`));
    for (const key of ['seed', 'created_at', 'ip_hash', 'verified'])
      expect(Object.keys(report)).not.toContain(key);
  });

  it('is `already` when the pair was rated before: HTTP 409, or Postgres 23505', async () => {
    expect(
      await postDuel(answering(409, { code: '23505', message: 'duplicate key' }), sink, report),
    ).toEqual({
      outcome: 'already',
    });
    expect(await postDuel(answering(409), sink, report)).toEqual({ outcome: 'already' });
    expect(await postDuel(answering(400, { code: '23505' }), sink, report)).toEqual({
      outcome: 'already',
    });
  });

  it('is `refused` with the server’s reason on a check violation', async () => {
    for (const message of [
      'a bot does not report its fights',
      'not your character',
      'this writer is blocked',
      'too many reports from this browser today',
    ])
      expect(await postDuel(answering(400, { code: '23514', message }), sink, report)).toEqual({
        outcome: 'refused',
        message,
      });
    expect(await postDuel(answering(400, { code: '23514' }), sink, report)).toEqual({
      outcome: 'refused',
    });
  });

  it('is `failed` when offline, on a server error, or on an answer that says nothing of the report', async () => {
    const offline = await postDuel(
      async () => {
        throw new Error('offline');
      },
      sink,
      report,
    );
    expect(offline).toEqual({ outcome: 'failed' });
    expect(await postDuel(answering(500, { message: 'boom' }), sink, report)).toEqual({
      outcome: 'failed',
    });
    expect(
      await postDuel(answering(401, { code: '42501', message: 'denied' }), sink, report),
    ).toEqual({
      outcome: 'failed',
    });
    expect(await postDuel(answering(503), sink, report)).toEqual({ outcome: 'failed' });
  });

  it('reports a draw with no winner and a death with one', async () => {
    const bodies: unknown[] = [];
    const take: FetchAny = async (_url, init) => {
      bodies.push(JSON.parse(init.body as string)[0]);
      return { ok: true };
    };
    await postDuel(take, sink, { ...report, winner: null, how: 'time', seconds: 90 });
    await postDuel(take, sink, { ...report, winner: 1 });
    expect(bodies).toMatchObject([
      { winner: null, how: 'time' },
      { winner: 1, how: 'death' },
    ]);
  });
});

describe('the caller’s own snapshots', () => {
  const row = (over: Record<string, unknown> = {}) => ({
    id: 41,
    created_at: '2026-10-17T09:30:00.123+00:00',
    name: 'Wren',
    class_id: 'vanguard',
    level: 41,
    map: 35,
    outcome: 'died',
    save_version: SAVE_VERSION,
    rating: 410,
    fights: 2,
    wins: 1,
    ...over,
  });
  const giving =
    (body: unknown, ok = true): FetchAny =>
    async () => ({ ok, status: ok ? 200 : 500, json: async () => body });

  it('asks my_snapshots with the token hash, and nothing else', async () => {
    const calls: { url: string; init: Record<string, unknown> }[] = [];
    const mine = await fetchMySnapshots(
      async (url, init) => {
        calls.push({ url, init });
        return { ok: true, json: async () => [row(), row({ id: 40, rating: 400 })] };
      },
      sink,
      HASH,
    );
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://abc.supabase.co/rest/v1/rpc/my_snapshots');
    expect(calls[0].init.method).toBe('POST');
    expect(calls[0].init.headers).toMatchObject({ apikey: 'sb_publishable_test' });
    expect(JSON.parse(calls[0].init.body as string)).toEqual({ token_hash: HASH });
    expect(mine).toHaveLength(2);
    expect(mine![0]).toEqual({
      id: '41',
      createdAt: '2026-10-17T09:30:00.123+00:00',
      name: 'Wren',
      classId: 'vanguard',
      level: 41,
      map: 35,
      outcome: 'died',
      saveVersion: SAVE_VERSION,
      rating: 410,
      fights: 2,
      wins: 1,
    });
  });

  it('keeps the newest first as given, and leaves out a row that is not the function’s shape', async () => {
    const bad = [
      null,
      'junk',
      row({ id: {} }),
      row({ name: 5 }),
      row({ level: 0 }),
      row({ map: 101 }),
      row({ outcome: 'fled' }),
      row({ save_version: undefined }),
      row({ rating: 'high' }),
      row({ fights: -1 }),
      row({ wins: 1.5 }),
      row({ created_at: null }),
    ];
    const mine = await fetchMySnapshots(
      giving([row({ id: 3 }), ...bad, row({ id: 2 })]),
      sink,
      HASH,
    );
    expect(mine!.map((s) => s.id)).toEqual(['3', '2']);
  });

  it('is empty when none is there and null when the sink could not be asked', async () => {
    expect(await fetchMySnapshots(giving([]), sink, HASH)).toEqual([]);
    expect(
      await fetchMySnapshots(
        async () => {
          throw new Error('offline');
        },
        sink,
        HASH,
      ),
    ).toBeNull();
    expect(await fetchMySnapshots(giving([row()], false), sink, HASH)).toBeNull();
    expect(await fetchMySnapshots(giving({ message: 'no such function' }), sink, HASH)).toBeNull();
    expect(await fetchMySnapshots(async () => ({ ok: true }), sink, HASH)).toBeNull();
  });

  it('is told from "none near" and "none rated yet": the other two reads are null offline and a list otherwise', async () => {
    const q = { saveVersion: SAVE_VERSION, map: 1, k: 5, excludeTokenHash: null };
    const offline: FetchAny = async () => {
      throw new Error('offline');
    };
    expect(await fetchRivalsOrNull(offline, sink, q)).toBeNull();
    expect(await fetchHighScoresOrNull(offline, sink, 10)).toBeNull();
    expect(await fetchRivalsOrNull(giving([]), sink, q)).toEqual([]);
    expect(await fetchHighScoresOrNull(giving([]), sink, 10)).toEqual([]);
  });
});

describe('what a card says of a build', () => {
  const uid = (() => {
    let n = 5000;
    return () => n++;
  })();

  it('is the main skill, the keystones and the uniques by name, for a real bot build', () => {
    const snap = snapshotBuild('strider', 3, 8, true)!;
    const sig = buildSignature(snap.build);
    const gems = Object.values(snap.build.equipment).flatMap((it) => it?.sockets ?? []);
    const main =
      gems.find((g) => g?.uid === snap.build.primaryGem) ??
      gems.find((g) => g && gemDef(g.gemId).kind === 'active');
    expect(main).toBeTruthy();
    expect(sig[0]).toBe(gemDef(main!.gemId).name);
    const tree = getTree();
    const keystones = snap.build.allocated
      .filter((id) => tree.nodes[id].kind === 'keystone')
      .map((id) => tree.nodes[id].name);
    for (const k of keystones.slice(0, 3)) expect(sig).toContain(k);
    for (const s of sig) {
      expect(s.length).toBeGreaterThan(0);
      // Names, never ids.
      expect(s).not.toMatch(/^[a-z]+(_[a-z]+)+$/);
    }
  });

  it('names a unique item and a unique flask that are worn, and never more than a card can hold', () => {
    const rng = new Rng(4);
    const b: Build = structuredClone(newRun('vanguard', 1).build);
    const item = rollUnique(rng, uid, UNIQUES[0], 40);
    b.equipment.amulet = item;
    b.flasks = [rollUniqueFlask(rng, uid, UNIQUE_FLASKS[0], 40), ...b.flasks.slice(1)];
    const sig = buildSignature(b);
    expect(sig).toContain(UNIQUES[0].name);
    expect(sig).toContain(UNIQUE_FLASKS[0].name);
    // Everything a build can wear: at most one main skill, three keystones and four uniques.
    const tree = getTree();
    const all = structuredClone(b);
    all.allocated = tree.nodes.filter((n) => n.kind === 'keystone').map((n) => n.id);
    expect(all.allocated.length).toBeGreaterThan(3);
    expect(buildSignature(all).length).toBeLessThanOrEqual(1 + 3 + 4);
  });

  it('is empty-handed for a character with no skill, keystone or unique', () => {
    const b = structuredClone(newRun('vanguard', 1).build);
    for (const slot of Object.keys(b.equipment) as (keyof Build['equipment'])[]) {
      const it = b.equipment[slot];
      if (it) it.sockets = it.sockets.map(() => null);
    }
    b.flasks = [];
    b.allocated = [];
    expect(buildSignature(b)).toEqual([]);
  });
});

describe('the draw of five from the twenty', () => {
  const pool = (n: number): Rival[] =>
    Array.from({ length: n }, (_, i) => ({ id: String(i + 1) }) as Rival);
  const ids = (rs: Rival[]) => rs.map((r) => r.id);

  it('is the same five for the same run and counter, and has no repeats', () => {
    const twenty = pool(20);
    const a = ids(drawRivals(twenty, 777, 0, 5));
    expect(ids(drawRivals(twenty, 777, 0, 5))).toEqual(a);
    expect(a).toHaveLength(5);
    expect(new Set(a).size).toBe(5);
    for (const id of a) expect(ids(twenty)).toContain(id);
    // Another run, another five (most of the time: three seeds are not all alike).
    const others = [778, 779, 780].map((s) => ids(drawRivals(twenty, s, 0, 5)).join());
    expect(new Set([a.join(), ...others]).size).toBeGreaterThan(1);
  });

  it('draws five that are not the ones shown when "Show others" is pressed, while the pool has them', () => {
    const twenty = pool(20);
    let shown = ids(drawRivals(twenty, 42, 0, 5));
    for (let counter = 1; counter < 12; counter++) {
      const next = ids(drawRivals(twenty, 42, counter, 5, shown));
      expect(next).toHaveLength(5);
      expect(new Set(next).size).toBe(5);
      for (const id of next) expect(shown, `draw ${counter}`).not.toContain(id);
      shown = next;
    }
  });

  it('fills up from the ones just shown when the pool has fewer than five others, and shows a small pool whole', () => {
    const six = pool(6);
    const first = ids(drawRivals(six, 9, 0, 5));
    const next = ids(drawRivals(six, 9, 1, 5, first));
    expect(next).toHaveLength(5);
    expect(new Set(next).size).toBe(5);
    expect(next[0]).toBe(ids(six).find((id) => !first.includes(id)));
    expect(ids(drawRivals(pool(3), 9, 0, 5)).sort()).toEqual(['1', '2', '3']);
    expect(drawRivals([], 9, 0, 5)).toEqual([]);
  });

  it('does not change the pool it is given', () => {
    const twenty = pool(20);
    const before = ids(twenty);
    drawRivals(twenty, 1, 3, 5);
    expect(ids(twenty)).toEqual(before);
  });
});
