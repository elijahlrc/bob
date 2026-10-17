import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Controller } from './run/controller';
import { generateName } from './run/rivals';
import { newRun, type RunState } from './run/run';
import type { MapResult } from './sim/runMap';
import {
  installRivals,
  rivalName,
  rivalToken,
  rivalsOn,
  sendName,
  setRivalName,
  setRivals,
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

beforeEach(() => vi.useRealTimers());
afterEach(() => vi.unstubAllGlobals());

describe('the rivals preference', () => {
  it('is off until the player turns it on, and the name is theirs as typed', () => {
    browser();
    expect(rivalsOn()).toBe(false);
    expect(rivalName()).toBe('');
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

  it('makes a name up when the typed one is not valid', async () => {
    const { calls } = browser({ rivals: true, rivalName: '-no' });
    const c = controller();
    const run = deadRun();
    installRivals(c, deps(calls));
    c.onRunEnd!(run, res);
    await sent(calls, 1);
    expect(JSON.parse(calls[0].body)[0].name).toBe(generateName(run.seed));
  });

  it('still sends when the hook before it throws, and never throws itself', async () => {
    const { calls } = browser({ rivals: true });
    const c = controller(() => {
      throw new Error('the other hook');
    });
    installRivals(c, deps(calls));
    expect(() => c.onRunEnd!(deadRun(), res)).toThrow('the other hook');
    await sent(calls, 1);
    const d = controller();
    installRivals(d, () => {
      throw new Error('no deps');
    });
    expect(() => d.onRunEnd!(deadRun(), res)).not.toThrow();
  });

  it('runs beside telemetry’s hook in either order: both of them send', async () => {
    for (const order of ['telemetry first', 'rivals first']) {
      const { calls } = browser({ rivals: true, telemetry: true });
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
