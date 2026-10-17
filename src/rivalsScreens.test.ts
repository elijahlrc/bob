import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Controller } from './run/controller';
import { hashToken, rivalRecord, type Rival } from './run/rivals';
import { newRun, SAVE_VERSION, type RunState } from './run/run';
import {
  installRivals,
  loadHighScores,
  loadRivals,
  postRun,
  resetPostKeeper,
  retryRivals,
  rivalToken,
  type RivalDeps,
} from './rivals';

/**
 * The browser side of the screens (docs/DUEL.md 6.5): what the Rivals screen asks for and in what order, what a rated fight sends
 * and what the result screen is told of it, and the high scores. A fake server answers by the name of the function or the table.
 */

type Answer = { ok: boolean; status?: number; json?: () => Promise<unknown> };
type Call = { path: string; body: unknown };
type Routes = Record<string, (body: Record<string, unknown>, n: number) => Answer>;

const ok = (body?: unknown, status = 200): Answer => ({
  ok: true,
  status,
  ...(body === undefined ? {} : { json: async () => body }),
});
const failed = (status: number, body?: unknown): Answer => ({
  ok: false,
  status,
  ...(body === undefined ? {} : { json: async () => body }),
});

/** A server: `routes` answer by the last part of the URL (`rivals_for`, `my_snapshots`, `duels`...); the calls are kept in order. */
function server(routes: Routes) {
  const calls: Call[] = [];
  const count: Record<string, number> = {};
  const deps: () => RivalDeps = () => ({
    fetch: async (url, init) => {
      const path = url.split('/').pop()!;
      const body = JSON.parse(init.body as string);
      calls.push({ path, body });
      count[path] = (count[path] ?? 0) + 1;
      const route = routes[path];
      if (!route) throw new Error(`offline: ${path}`);
      return route(Array.isArray(body) ? body[0] : body, count[path]);
    },
    sink: { url: 'https://abc.supabase.co', key: 'k' },
    version: 'abc1234',
  });
  return { calls, deps, paths: () => calls.map((c) => c.path) };
}

/** A browser that is just enough: a window with storage holding these preferences. */
function browser(prefs: Record<string, unknown> = {}) {
  const store = new Map<string, string>(
    Object.entries(prefs).map(([k, v]) => [`bob.pref.${k}`, JSON.stringify(v)]),
  );
  vi.stubGlobal('window', {
    location: { hostname: 'bob.example.org' },
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    },
  });
  return store;
}

beforeEach(() => {
  vi.useRealTimers();
  resetPostKeeper();
});
afterEach(() => vi.unstubAllGlobals());

/** The row `rivals_for` gives for a starter of a class (a level-1 character on map 10). */
function rivalRow(id: number, cls = 'strider', over: Record<string, unknown> = {}): unknown {
  const run = newRun(cls, id);
  run.phase = 'dead';
  run.map = 10;
  const { token_hash: _t, ...rest } = rivalRecord(run, null, {
    name: `Rival ${id}`,
    tokenHash: 'c'.repeat(64),
    version: 'v',
    seed: id,
  });
  return JSON.parse(JSON.stringify({ id, ...rest, rating: 100, fights: 0, wins: 0, ...over }));
}

/** The row `my_snapshots` gives for the character of a run. */
const snapshotRow = (run: RunState, over: Record<string, unknown> = {}) => ({
  id: 41,
  created_at: '2026-10-17T09:30:00+00:00',
  name: 'Wren',
  class_id: run.classId,
  level: run.build.level,
  map: run.map,
  outcome: 'died',
  save_version: SAVE_VERSION,
  rating: 410,
  fights: 0,
  wins: 0,
  ...over,
});

/** A controller on the summary of a dead run of the mystic, with the rivals screen open and nothing loaded. */
function opened(cls = 'mystic'): { c: Controller; run: RunState } {
  const c = new Controller(null);
  c.startRun(cls, 4242);
  const run = c.run!;
  run.phase = 'dead';
  run.map = 12;
  c.goTo('summary');
  c.openRivals();
  return { c, run };
}

describe('loading the Rivals screen', () => {
  it('waits for the post of the character, asks for the snapshot, then for the twenty near the map, and shows five', async () => {
    browser({ rivals: true, rivalName: 'Wren' });
    const { c, run } = opened();
    let release: (a: Answer) => void = () => undefined;
    const net = server({
      my_snapshots: () => ok([snapshotRow(run)]),
      rivals_for: () => ok(Array.from({ length: 12 }, (_, i) => rivalRow(100 + i))),
    });
    // The post is in the air when the screen opens: nothing is asked of the table until it has landed.
    const slow: () => RivalDeps = () => ({
      ...net.deps(),
      fetch: () => new Promise<Answer>((r) => (release = r)),
    });
    const first = postRun(run, null, slow);
    const loaded = loadRivals(c, net.deps);
    await new Promise((r) => setTimeout(r, 20));
    expect(net.calls).toHaveLength(0);
    expect(c.rivals!.status).toBe('loading');
    release(ok(undefined, 201));
    await first;
    await loaded;
    expect(net.paths()).toEqual(['my_snapshots', 'rivals_for']);
    const tokenHash = await hashToken(rivalToken());
    expect(net.calls[0].body).toEqual({ token_hash: tokenHash });
    expect(net.calls[1].body).toEqual({
      save_version: SAVE_VERSION,
      map: 12,
      k: 20,
      exclude_token_hash: tokenHash,
    });
    expect(c.rivals!.status).toBe('ready');
    expect(c.rivals!.mine).toMatchObject({ id: '41', rating: 410 });
    expect(c.rivals!.pool).toHaveLength(12);
    expect(c.rivals!.shown).toHaveLength(5);
    expect(c.rivals!.started).toBe(true);
  });

  it('is run once for a screen: a second call does not ask again', async () => {
    browser();
    const { c, run } = opened();
    const net = server({
      my_snapshots: () => ok([snapshotRow(run)]),
      rivals_for: () => ok([rivalRow(100)]),
    });
    await Promise.all([loadRivals(c, net.deps), loadRivals(c, net.deps)]);
    await loadRivals(c, net.deps);
    expect(net.calls).toHaveLength(2);
    expect(c.rivals!.shown.map((r: Rival) => r.id)).toEqual(['100']);
  });

  it('leaves out a rival whose snapshot does not hold up, and says so when none are near', async () => {
    browser();
    const { c, run } = opened();
    const bad = rivalRow(101, 'strider', { class_id: 'nonesuch' });
    const net = server({
      my_snapshots: () => ok([snapshotRow(run)]),
      rivals_for: () => ok([bad, rivalRow(100)]),
    });
    await loadRivals(c, net.deps);
    expect(c.rivals!.pool.map((r) => r.id)).toEqual(['100']);
    const e = opened();
    const none = server({
      my_snapshots: () => ok([snapshotRow(e.run)]),
      rivals_for: () => ok([]),
    });
    await loadRivals(e.c, none.deps);
    expect(e.c.rivals!.status).toBe('empty');
    expect(e.c.rivals!.mine).not.toBeNull();
  });

  it('is offline when the snapshot or the rivals cannot be asked for', async () => {
    browser();
    const a = opened();
    await loadRivals(a.c, server({}).deps);
    expect(a.c.rivals!.status).toBe('offline');
    const b = opened();
    await loadRivals(
      b.c,
      server({ my_snapshots: () => failed(500), rivals_for: () => ok([]) }).deps,
    );
    expect(b.c.rivals!.status).toBe('offline');
    const d = opened();
    await loadRivals(
      d.c,
      server({ my_snapshots: () => ok([snapshotRow(d.run)]), rivals_for: () => failed(503) }).deps,
    );
    expect(d.c.rivals!.status).toBe('offline');
    expect(d.c.rivals!.pool).toEqual([]);
  });

  it('says the character was not sent when the newest snapshot is not this run’s, and never posts it itself', async () => {
    browser({ rivals: true, rivalName: 'Wren' });
    const cases: ((run: RunState) => unknown[])[] = [
      () => [],
      (run) => [snapshotRow(run, { class_id: 'vanguard' })],
      (run) => [snapshotRow(run, { level: run.build.level + 1 })],
      (run) => [snapshotRow(run, { map: 3 })],
      (run) => [snapshotRow(run, { save_version: SAVE_VERSION - 1 })],
      // The newest of this version is another run's, and the one that fits is older: not taken.
      (run) => [snapshotRow(run, { id: 50, map: 3 }), snapshotRow(run, { id: 41 })],
    ];
    for (const rows of cases) {
      const { c, run } = opened();
      const net = server({
        my_snapshots: () => ok(rows(run)),
        rivals_for: () => ok([rivalRow(100)]),
        rivals: () => ok(undefined, 201),
      });
      await loadRivals(c, net.deps);
      expect(c.rivals!.status).toBe('unsent');
      expect(net.paths()).toEqual(['my_snapshots']);
      expect(c.rivals!.mine).toBeNull();
    }
  });

  it('says why: a name the table refused, or a sink that could not be reached', async () => {
    browser({ rivals: true, rivalName: 'Wren' });
    const { c, run } = opened();
    const denied = server({
      rivals: () => failed(400, { code: '23514', message: 'that name is not allowed' }),
    });
    await postRun(run, null, denied.deps);
    await loadRivals(c, server({ my_snapshots: () => ok([]) }).deps);
    expect(c.rivals).toMatchObject({ status: 'unsent', why: 'name' });
    resetPostKeeper();
    const d = opened('vanguard');
    await postRun(d.run, null, server({}).deps);
    await loadRivals(d.c, server({ my_snapshots: () => ok([]) }).deps);
    expect(d.c.rivals).toMatchObject({ status: 'unsent', why: 'unreachable' });
  });

  it('offers a retry through the keeper: a failed post goes again, the screen starts over, and a post that is in is not repeated', async () => {
    browser({ rivals: true, rivalName: 'Wren' });
    const { c, run } = opened();
    const net = server({ rivals: () => failed(503) });
    expect((await postRun(run, null, net.deps)).status).toBe('failed');
    c.failRivals('unsent', 'unreachable');
    // The retry uses the game's own fetch, which is stubbed here to take the row.
    const taken: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => {
      taken.push(url.split('/').pop()!);
      return { ok: true, status: 201 };
    });
    const st = await retryRivals(c);
    expect(st.status).toBe('posted');
    expect(taken).toEqual(['rivals']);
    expect(c.rivals).toMatchObject({ status: 'loading', started: false });
    await retryRivals(c);
    expect(taken).toEqual(['rivals']);
  });
});

describe('the report of a rated fight', () => {
  /**
   * A controller with the cards loaded, the hook installed over a fake server (`routesOf` of the run), and the first fight against
   * the first card run to its end, then `practice` fights more. `before` is a hook already on the controller.
   */
  async function fought(
    routesOf: (run: RunState) => Routes,
    opts: { practice?: number; before?: Controller['onDuelEnd'] } = {},
  ) {
    browser({ rivals: true, rivalName: 'Wren' });
    const { c, run } = opened('vanguard');
    c.onDuelEnd = opts.before ?? null;
    const net = server(routesOf(run));
    installRivals(c, net.deps);
    const loaded = server({
      my_snapshots: () => ok([snapshotRow(run, { rating: 410 })]),
      rivals_for: () => ok([100, 101, 102].map((i) => rivalRow(i))),
    });
    await loadRivals(c, loaded.deps);
    const rival = c.rivals!.shown[0];
    c.setSpeed(8);
    expect(c.startRivalDuel(rival, '41', 'Wren')).toBe(true);
    const play = () => {
      for (let i = 0; i < 20000 && c.screen === 'map'; i++) c.bus.emit('frame', { dtMs: 100 });
    };
    play();
    for (let i = 0; i < (opts.practice ?? 0); i++) {
      c.againDuel();
      play();
    }
    return { c, net, rival };
  }

  const settled = (c: Controller) =>
    vi.waitFor(() => expect(c.lastDuel!.rival!.report).not.toBe('sending'));

  it('posts the pair, the winner, how and when, with the hash of the token, and shows the rating move', async () => {
    const { c, net, rival } = await fought((run) => ({
      duels: () => ok(undefined, 201),
      my_snapshots: () => ok([snapshotRow(run, { rating: 503, fights: 1, wins: 1 })]),
    }));
    expect(c.lastDuel!.rival!.report).toBe('sending');
    expect(c.screen).toBe('duelResult');
    await settled(c);
    await vi.waitFor(() => expect(c.lastDuel!.rival!.rating).toBeDefined());
    const duels = net.calls.filter((x) => x.path === 'duels');
    expect(duels).toHaveLength(1);
    const body = (duels[0].body as Record<string, unknown>[])[0];
    const { result } = c.lastDuel!;
    expect(body).toEqual({
      a_id: 41,
      b_id: Number(rival.id),
      winner: result.winner,
      how: result.how,
      seconds: Math.round(result.time * 100) / 100,
      game_version: 'abc1234',
      token_hash: await hashToken(rivalToken()),
    });
    expect(c.lastDuel!.rival).toMatchObject({
      rated: true,
      report: 'rated',
      rating: { before: 410, after: 503 },
    });
    expect(c.rivals!.mine!.rating).toBe(503);
    expect(c.book.get('41', rival.id)!.rated).toBe(true);
    // The rating is read again after the report went in, not before.
    const order = net.paths();
    expect(order.indexOf('duels')).toBeLessThan(order.lastIndexOf('my_snapshots'));
  });

  it('is told "already" when the pair was rated before: the record has it, and no rating moves', async () => {
    const { c, net, rival } = await fought(() => ({
      duels: () => failed(409, { code: '23505', message: 'duplicate key value' }),
      my_snapshots: () => ok([]),
    }));
    await settled(c);
    expect(c.lastDuel!.rival).toMatchObject({ report: 'already' });
    expect(c.lastDuel!.rival!.rating).toBeUndefined();
    expect(c.book.get('41', rival.id)!.rated).toBe(true);
    expect(net.paths()).not.toContain('my_snapshots');
  });

  it('is told the server’s reason when it refuses, and the pair is still to be rated', async () => {
    const { c, rival } = await fought(() => ({
      duels: () => failed(400, { code: '23514', message: 'a bot does not report its fights' }),
    }));
    await settled(c);
    expect(c.lastDuel!.rival).toMatchObject({
      report: 'refused',
      message: 'a bot does not report its fights',
    });
    expect(c.book.get('41', rival.id)!.rated).toBe(false);
  });

  it('is unrated when offline, and a later fight against the rival is rated again', async () => {
    const { c, rival } = await fought(() => ({}));
    await settled(c);
    expect(c.lastDuel!.rival).toMatchObject({ report: 'failed' });
    expect(c.book.get('41', rival.id)).toMatchObject({ fights: 1, rated: false });
    c.leaveDuel('rivals');
    expect(c.startRivalDuel(rival, '41', 'Wren')).toBe(true);
    expect(c.duel!.rival!.rated).toBe(true);
  });

  it('keeps the rating line out when the ladder could not be read again', async () => {
    const { c } = await fought(() => ({ duels: () => ok(undefined, 201) }));
    await settled(c);
    await new Promise((r) => setTimeout(r, 30));
    expect(c.lastDuel!.rival).toMatchObject({ report: 'rated' });
    expect(c.lastDuel!.rival!.rating).toBeUndefined();
  });

  it('posts only the first fight of a pair: practice fights are not reported', async () => {
    const { c, net } = await fought(
      () => ({ duels: () => ok(undefined, 201), my_snapshots: () => ok([]) }),
      { practice: 2 },
    );
    await new Promise((r) => setTimeout(r, 30));
    expect(c.lastDuel!.rival).toMatchObject({ rated: false, report: null });
    expect(net.paths().filter((p) => p === 'duels')).toHaveLength(1);
    expect(c.book.get('41', c.duel!.rival!.rivalId)).toMatchObject({ fights: 3 });
  });

  it('runs the hook that was there first and is not stopped by it: the report goes in, the fight is untouched', async () => {
    let before = 0;
    const { c, net } = await fought(() => ({ duels: () => ok(undefined, 201) }), {
      before: () => {
        before++;
        throw new Error('another hook');
      },
    });
    await settled(c);
    expect(before).toBe(1);
    expect(c.screen).toBe('duelResult');
    expect(net.paths()).toContain('duels');
  });
});

describe('the high scores', () => {
  const row = (id: number, rating: number) => ({
    id,
    name: `Rival ${id}`,
    class_id: 'strider',
    level: 30,
    map: 20,
    outcome: 'died',
    rating,
    fights: 3,
    wins: 2,
    game_version: 'abc1234',
    posted_on: '2026-10-17',
  });

  it('asks for the top hundred and for the player’s own snapshots, and gives both', async () => {
    browser();
    const net = server({
      high_scores: () => ok([row(7, 900), row(8, 800)]),
      my_snapshots: () => ok([snapshotRow(newRun('mystic', 1), { id: 8 })]),
    });
    const got = await loadHighScores(net.deps);
    expect(got.scores!.map((s) => s.id)).toEqual(['7', '8']);
    expect([...got.mine]).toEqual(['8']);
    expect(net.calls.find((x) => x.path === 'high_scores')!.body).toEqual({ k: 100 });
  });

  it('is an empty list when no one has fought, null when the rivals cannot be reached, and a list without marks when the player’s snapshots cannot be read', async () => {
    browser();
    const empty = await loadHighScores(
      server({ high_scores: () => ok([]), my_snapshots: () => ok([]) }).deps,
    );
    expect(empty.scores).toEqual([]);
    const offline = await loadHighScores(server({}).deps);
    expect(offline.scores).toBeNull();
    expect(offline.mine.size).toBe(0);
    const noMine = await loadHighScores(server({ high_scores: () => ok([row(7, 900)]) }).deps);
    expect(noMine.scores).toHaveLength(1);
    expect(noMine.mine.size).toBe(0);
  });
});
