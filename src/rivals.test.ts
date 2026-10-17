import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Controller } from './run/controller';
import { newRun, type RunState } from './run/run';
import type { MapResult } from './sim/runMap';
import {
  installRivals,
  pendingPost,
  postRun,
  postStatus,
  resetPostKeeper,
  rivalName,
  rivalToken,
  rivalsOn,
  sendName,
  setRivalName,
  setRivals,
  watchPost,
  type RivalDeps,
} from './rivals';
import { installTelemetry } from './telemetry';

const res = { status: 'dead', areaLevel: 12, type: 'crescendo', level: 12 } as MapResult;

function deadRun(): RunState {
  const run = newRun('mystic', 4242);
  run.phase = 'dead';
  run.map = 12;
  return run;
}

type Call = { url: string; body: string };

/** A browser that is just enough: a window with storage, and a fetch that records what it is given. */
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
  const calls: Call[] = [];
  vi.stubGlobal('fetch', async (url: string, init: { body: string }) => {
    calls.push({ url, body: init.body });
    return { ok: true };
  });
  return { store, calls };
}

const controller = (onRunEnd: Controller['onRunEnd'] = null) => ({ onRunEnd }) as Controller;
const sent = async (calls: Call[], n: number) =>
  vi.waitFor(() => expect(calls.length).toBeGreaterThanOrEqual(n));

beforeEach(() => {
  vi.useRealTimers();
  resetPostKeeper();
});
afterEach(() => vi.unstubAllGlobals());

describe('the rivals preference', () => {
  it('is on by default and can be turned off, and the name is theirs as typed', () => {
    browser();
    expect(rivalsOn()).toBe(true);
    expect(rivalName()).toBe('');
    setRivals(false);
    expect(rivalsOn()).toBe(false);
    setRivals(true);
    setRivalName(' Wren ');
    expect(rivalsOn()).toBe(true);
    expect(rivalName()).toBe(' Wren ');
    expect(sendName()).toBe('Wren');
    setRivalName('x');
    expect(sendName()).toBeNull();
    setRivalName('');
    expect(sendName()).toBeNull();
  });

  it('keeps one random token for the browser, 32 hex characters, and lives without storage', () => {
    const { store } = browser();
    const t = rivalToken();
    expect(t).toMatch(/^[0-9a-f]{32}$/);
    expect(store.get('bob.rival.token')).toBe(t);
    expect(rivalToken()).toBe(t);
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => {
          throw new Error('blocked');
        },
        setItem: () => {
          throw new Error('blocked');
        },
      },
    });
    const m = rivalToken();
    expect(m).toMatch(/^[0-9a-f]{32}$/);
    expect(rivalToken()).toBe(m);
  });
});

describe('the hook that sends a character when a run ends', () => {
  const deps =
    (calls: Call[]): (() => RivalDeps) =>
    () => ({
      fetch: async (url, init) => {
        calls.push({ url, body: init.body as string });
        return { ok: true };
      },
      sink: { url: 'https://abc.supabase.co', key: 'k' },
      version: 'abc1234',
    });

  it('sends nothing until the player has opted in, and runs the hook that was there', async () => {
    const { calls } = browser();
    let before = 0;
    const c = controller(() => before++);
    installRivals(c, deps(calls));
    c.onRunEnd!(deadRun(), res);
    await new Promise((r) => setTimeout(r, 20));
    expect(before).toBe(1);
    expect(calls).toHaveLength(0);
  });

  it('sends the character of a death and of a win, with the typed name and only the token’s hash', async () => {
    const { calls, store } = browser({ rivals: true, rivalName: 'Wren' });
    const c = controller();
    installRivals(c, deps(calls));
    c.onRunEnd!(deadRun(), res);
    const won = deadRun();
    won.seed = 4243;
    won.phase = 'victory';
    won.map = 100;
    c.onRunEnd!(won, res);
    await sent(calls, 2);
    expect(calls[0].url).toBe('https://abc.supabase.co/rest/v1/rivals');
    const [a, b] = calls.map((x) => JSON.parse(x.body)[0]);
    expect(a).toMatchObject({
      name: 'Wren',
      class_id: 'mystic',
      map: 12,
      outcome: 'died',
      bot: false,
    });
    expect(b).toMatchObject({ outcome: 'won', map: 100 });
    expect(a.game_version).toBe('abc1234');
    expect(a.token_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(a.token_hash).toBe(b.token_hash);
    const raw = store.get('bob.rival.token')!;
    expect(raw).toBeTruthy();
    for (const x of calls) expect(x.body).not.toContain(raw);
  });

  it('sends nothing for a blank name or one that is not valid: a player is posted with a typed name only', async () => {
    for (const typed of [undefined, '', '   ', '-no', 'x', 'a'.repeat(17), 'Bób']) {
      resetPostKeeper();
      const { calls } = browser({
        rivals: true,
        ...(typed === undefined ? {} : { rivalName: typed }),
      });
      const c = controller();
      const run = deadRun();
      installRivals(c, deps(calls));
      c.onRunEnd!(run, res);
      await new Promise((r) => setTimeout(r, 20));
      expect(calls, `name ${JSON.stringify(typed)}`).toHaveLength(0);
      expect(postStatus(run).status).toBe('idle');
      expect(pendingPost(run)).toBeNull();
      vi.unstubAllGlobals();
    }
  });

  it('sends nothing with a valid name and the box off, and never posts the generated name', async () => {
    const { calls } = browser({ rivals: false, rivalName: 'Wren' });
    const c = controller();
    installRivals(c, deps(calls));
    c.onRunEnd!(deadRun(), res);
    await new Promise((r) => setTimeout(r, 20));
    expect(calls).toHaveLength(0);
  });

  it('still sends when the hook before it throws, and never throws itself', async () => {
    const { calls } = browser({ rivals: true, rivalName: 'Wren' });
    const c = controller(() => {
      throw new Error('the other hook');
    });
    installRivals(c, deps(calls));
    expect(() => c.onRunEnd!(deadRun(), res)).toThrow('the other hook');
    await sent(calls, 1);
    await vi.waitFor(() => expect(postStatus(deadRun()).status).toBe('posted'));
    resetPostKeeper();
    vi.unstubAllGlobals();
    browser({ rivals: true, rivalName: 'Wren' });
    const d = controller();
    installRivals(d, () => {
      throw new Error('no deps');
    });
    expect(() => d.onRunEnd!(deadRun(), res)).not.toThrow();
  });

  it('runs beside telemetry’s hook in either order: both of them send', async () => {
    for (const order of ['telemetry first', 'rivals first']) {
      resetPostKeeper();
      const { calls } = browser({ rivals: true, rivalName: 'Wren', telemetry: true });
      const c = controller();
      if (order === 'telemetry first') {
        installTelemetry(c);
        installRivals(c);
      } else {
        installRivals(c);
        installTelemetry(c);
      }
      c.onRunEnd!(deadRun(), res);
      await sent(calls, 2);
      const urls = calls.map((x) => x.url).sort();
      expect(urls[0]).toMatch(/\/rest\/v1\/rivals$/);
      expect(urls[1]).toMatch(/\/rest\/v1\/sim_runs$/);
      vi.unstubAllGlobals();
    }
  });
});

describe('the post of a run, kept', () => {
  type Answer = { ok: boolean; status?: number; json?: () => Promise<unknown> };
  const ok: Answer = { ok: true, status: 201 };
  const denied: Answer = {
    ok: false,
    status: 400,
    json: async () => ({ code: '23514', message: 'that name is not allowed' }),
  };
  const capped: Answer = {
    ok: false,
    status: 400,
    json: async () => ({ code: '23514', message: 'too many characters from this browser today' }),
  };
  /** Deps whose fetch records each call and answers by its number (1 for the first). */
  const depsOf =
    (calls: Call[], answer: (n: number) => Answer | Promise<Answer>): (() => RivalDeps) =>
    () => ({
      fetch: async (url, init) => {
        calls.push({ url, body: init.body as string });
        return answer(calls.length);
      },
      sink: { url: 'https://abc.supabase.co', key: 'k' },
      version: 'abc1234',
    });

  it('posts a run once however often it is asked: the hook, the summary, and a second ask in the air', async () => {
    const { calls } = browser({ rivals: true, rivalName: 'Wren' });
    const c = controller();
    const deps = depsOf(calls, () => ok);
    installRivals(c, deps);
    const run = deadRun();
    c.onRunEnd!(run, res);
    expect(postStatus(run).status).toBe('sending');
    const a = postRun(run, res, deps);
    const b = postRun(run, res, deps);
    expect(await a).toEqual({ status: 'posted' });
    expect(await b).toEqual({ status: 'posted' });
    expect(await postRun(run, res, deps)).toEqual({ status: 'posted' });
    expect(calls).toHaveLength(1);
    expect(postStatus(run)).toEqual({ status: 'posted' });
    expect(JSON.parse(calls[0].body)[0]).toMatchObject({ name: 'Wren', class_id: 'mystic' });
  });

  it('keeps the post in hand for a screen to await, and tells a watcher when the answer is in', async () => {
    const { calls } = browser({ rivals: true, rivalName: 'Wren' });
    let release: (a: Answer) => void = () => undefined;
    const deps = depsOf(calls, () => new Promise<Answer>((r) => (release = r)));
    const run = deadRun();
    expect(pendingPost(run)).toBeNull();
    let told = 0;
    const stop = watchPost(() => told++);
    const first = postRun(run, res, deps);
    const pending = pendingPost(run);
    expect(pending).not.toBeNull();
    // A different run is not the one in hand.
    const other = deadRun();
    other.seed = 1;
    expect(pendingPost(other)).toBeNull();
    expect(postStatus(other).status).toBe('idle');
    await vi.waitFor(() => expect(calls).toHaveLength(1));
    expect(told).toBe(0);
    release(ok);
    expect(await pending).toEqual({ status: 'posted' });
    expect(await first).toEqual({ status: 'posted' });
    expect(told).toBe(1);
    expect(pendingPost(run)).toBeNull();
    stop();
    expect(postStatus(run).status).toBe('posted');
  });

  it('posts the run that just ended when the player ticks the box on the summary, after the hook passed with it off', async () => {
    const { calls } = browser({ rivals: false });
    const c = controller();
    const deps = depsOf(calls, () => ok);
    installRivals(c, deps);
    const run = deadRun();
    c.onRunEnd!(run, res);
    await new Promise((r) => setTimeout(r, 20));
    expect(calls).toHaveLength(0);
    // The summary: the box is ticked and a name typed, then the run is posted (and the hook is not asked again).
    setRivals(true);
    setRivalName('Wren');
    expect(await postRun(run, res, deps)).toEqual({ status: 'posted' });
    expect(await postRun(run, null, deps)).toEqual({ status: 'posted' });
    expect(calls).toHaveLength(1);
    expect(JSON.parse(calls[0].body)[0]).toMatchObject({ name: 'Wren', outcome: 'died', map: 12 });
  });

  it('posts a win as a win, and only a run that has ended', async () => {
    const { calls } = browser({ rivals: true, rivalName: 'Wren' });
    const deps = depsOf(calls, () => ok);
    const camp = deadRun();
    camp.phase = 'camp';
    expect(await postRun(camp, res, deps)).toEqual({ status: 'idle' });
    expect(calls).toHaveLength(0);
    const won = deadRun();
    won.phase = 'victory';
    won.map = 100;
    await postRun(won, res, deps);
    expect(JSON.parse(calls[0].body)[0]).toMatchObject({ outcome: 'won', map: 100 });
  });

  it('says a name the deny-list refused is that, and an unreachable sink is not, and offers a retry only then', async () => {
    const { calls } = browser({ rivals: true, rivalName: 'Wren' });
    const answers: (Answer | Error)[] = [denied, capped, new Error('offline'), ok];
    const deps = depsOf(calls, (n) => {
      const a = answers[n - 1];
      if (a instanceof Error) throw a;
      return a;
    });
    const run = deadRun();
    // A name the table refused.
    expect(await postRun(run, res, deps)).toEqual({
      status: 'failed',
      reason: 'name',
      name: 'Wren',
      message: 'that name is not allowed',
    });
    expect(postStatus(run)).toMatchObject({ status: 'failed', reason: 'name' });
    expect(pendingPost(run)).toBeNull();
    // A cap: the rivals could not take it, whatever its name.
    expect(await postRun(run, res, deps)).toMatchObject({
      status: 'failed',
      reason: 'unreachable',
    });
    // Offline.
    expect(await postRun(run, res, deps)).toEqual({ status: 'failed', reason: 'unreachable' });
    // The retry that works; and then it is never posted again.
    setRivalName('Wren2');
    expect(await postRun(run, res, deps)).toEqual({ status: 'posted' });
    expect(await postRun(run, res, deps)).toEqual({ status: 'posted' });
    expect(calls).toHaveLength(4);
    expect(JSON.parse(calls[3].body)[0].name).toBe('Wren2');
  });

  it('does not retry on its own: a failed post waits for the player', async () => {
    const { calls } = browser({ rivals: true, rivalName: 'Wren' });
    const c = controller();
    installRivals(
      c,
      depsOf(calls, () => denied),
    );
    const run = deadRun();
    c.onRunEnd!(run, res);
    await vi.waitFor(() => expect(postStatus(run).status).toBe('failed'));
    await new Promise((r) => setTimeout(r, 30));
    expect(calls).toHaveLength(1);
  });

  it('remembers beside the preferences which run it posted, so a fresh page does not post it again', async () => {
    const { calls, store } = browser({ rivals: true, rivalName: 'Wren' });
    const deps = depsOf(calls, () => ok);
    const run = deadRun();
    await postRun(run, res, deps);
    expect(store.get('bob.pref.rivalPosted')).toBe(JSON.stringify('mystic:4242:0'));
    resetPostKeeper();
    expect(postStatus(run)).toEqual({ status: 'posted' });
    expect(await postRun(run, res, deps)).toEqual({ status: 'posted' });
    expect(calls).toHaveLength(1);
    // The same seed and class after other maps were played is another run.
    const again = deadRun();
    again.history.length = 3;
    expect(postStatus(again).status).toBe('idle');
  });

  it('never starts a post that cannot: no name, or a sink that throws before it is asked', async () => {
    browser({ rivals: true, rivalName: '' });
    const run = deadRun();
    expect(await postRun(run, res)).toEqual({ status: 'idle' });
    setRivalName('Wren');
    expect(
      await postRun(run, res, () => {
        throw new Error('no deps');
      }),
    ).toEqual({ status: 'failed', reason: 'unreachable' });
    expect(postStatus(run).status).toBe('failed');
  });
});
