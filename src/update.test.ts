import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Controller } from './run/controller';
import {
  CHECK_COOLDOWN_MS,
  installUpdateCheck,
  newBuild,
  serverBuild,
  setNewBuild,
  type UpdateDeps,
} from './update';
import { UpdateNotice } from './ui/UpdateNotice';

type Answer = { ok: boolean; json(): Promise<unknown> };

const answer = (body: unknown, ok = true): Answer => ({ ok, json: () => Promise.resolve(body) });

/** A fake server: counts the fetches, answers the same every time, and remembers the visibility callback. */
function server(reply: () => Answer | Promise<Answer>, current = 'aaaaaaa') {
  const s = {
    calls: 0,
    visible: null as (() => void) | null,
    deps: (): UpdateDeps => ({
      current,
      fetch: () => {
        s.calls++;
        return Promise.resolve(reply());
      },
      onVisible: (cb) => {
        s.visible = cb;
      },
    }),
  };
  return s;
}

/** Lets the fetch, its body and the check's `then` settle (timers are faked, so this is microtasks only). */
const flush = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
};

beforeEach(() => {
  setNewBuild(null);
  vi.useFakeTimers({ toFake: ['setTimeout'] });
});
afterEach(() => vi.useRealTimers());

describe('the build the server serves', () => {
  it('is another build only when the file names one that is not this page', async () => {
    const s = server(() => answer({ build: 'bbbbbbb' }));
    expect(await serverBuild(s.deps())).toBe('bbbbbbb');
    expect(await serverBuild({ ...s.deps(), current: 'bbbbbbb' })).toBeNull();
  });

  it('is nothing for the dev server and a local copy, which never ask', async () => {
    const s = server(() => answer({ build: 'bbbbbbb' }), 'local');
    expect(await serverBuild(s.deps())).toBeNull();
    expect(s.calls).toBe(0);
  });

  it('is nothing when the answer is not a build: an error, a page, a blank, local', async () => {
    expect(await serverBuild(server(() => answer({ build: 'bbbbbbb' }, false)).deps())).toBeNull();
    expect(
      await serverBuild(
        server(() => ({ ok: true, json: () => Promise.reject(new Error('html')) })).deps(),
      ),
    ).toBeNull();
    expect(await serverBuild(server(() => answer({ build: '' })).deps())).toBeNull();
    expect(await serverBuild(server(() => answer({ build: 'local' })).deps())).toBeNull();
    expect(await serverBuild(server(() => answer({ build: 7 })).deps())).toBeNull();
    expect(await serverBuild(server(() => answer(null)).deps())).toBeNull();
    expect(await serverBuild(server(() => answer('bbbbbbb')).deps())).toBeNull();
    expect(
      await serverBuild(server(() => Promise.reject(new Error('offline')) as never).deps()),
    ).toBeNull();
  });
});

describe('the check', () => {
  it('asks on arriving at camp or the title, once a minute at most, and tells the screens of a newer build', async () => {
    const c = new Controller(null);
    const s = server(() => answer({ build: 'aaaaaaa' }));
    installUpdateCheck(c, s.deps);
    let told = 0;
    c.bus.on('state', () => told++);
    c.goTo('camp');
    await flush();
    expect(s.calls).toBe(1);
    expect(newBuild()).toBeNull();
    // Still at camp: a camp change is not an arrival.
    c.bus.emit('state', null);
    c.goTo('title');
    await flush();
    expect(s.calls).toBe(1);
    vi.advanceTimersByTime(CHECK_COOLDOWN_MS);
    c.goTo('camp');
    await flush();
    expect(s.calls).toBe(2);
    expect(newBuild()).toBeNull();
    // The four changes of screen, and nothing from a check that found this build.
    expect(told).toBe(4);
  });

  it('never asks on the way to a map or to the end of a run', async () => {
    const c = new Controller(null);
    const s = server(() => answer({ build: 'bbbbbbb' }));
    installUpdateCheck(c, s.deps);
    for (const screen of [
      'classSelect',
      'map',
      'summary',
      'victory',
      'rivals',
      'duelResult',
    ] as const) {
      vi.advanceTimersByTime(CHECK_COOLDOWN_MS);
      c.goTo(screen);
      await flush();
    }
    expect(s.calls).toBe(0);
    expect(newBuild()).toBeNull();
  });

  it('asks when the tab comes back into view, and stops once a newer build is known', async () => {
    const c = new Controller(null);
    const s = server(() => answer({ build: 'bbbbbbb' }));
    installUpdateCheck(c, s.deps);
    let told = 0;
    c.bus.on('state', () => told++);
    s.visible!();
    await flush();
    expect(s.calls).toBe(1);
    expect(newBuild()).toBe('bbbbbbb');
    expect(told).toBe(1);
    vi.advanceTimersByTime(CHECK_COOLDOWN_MS);
    s.visible!();
    c.goTo('camp');
    await flush();
    expect(s.calls).toBe(1);
  });

  it('never asks from the dev server', async () => {
    const c = new Controller(null);
    const s = server(() => answer({ build: 'bbbbbbb' }), 'local');
    installUpdateCheck(c, s.deps);
    s.visible!();
    c.goTo('camp');
    await flush();
    expect(s.calls).toBe(0);
  });

  it('keeps asking after an answer that was not a build', async () => {
    const c = new Controller(null);
    let bad = true;
    const s = server(() => (bad ? answer('<html>', false) : answer({ build: 'bbbbbbb' })));
    installUpdateCheck(c, s.deps);
    c.goTo('camp');
    await flush();
    expect(newBuild()).toBeNull();
    bad = false;
    vi.advanceTimersByTime(CHECK_COOLDOWN_MS);
    c.goTo('title');
    await flush();
    expect(s.calls).toBe(2);
    expect(newBuild()).toBe('bbbbbbb');
  });
});

describe('the notice', () => {
  const text = (n: unknown): string => JSON.stringify(n);

  it('is nothing while the page is current, and one line with Reload when it is not', () => {
    expect(UpdateNotice()).toBeNull();
    setNewBuild('bbbbbbb');
    const view = text(UpdateNotice());
    expect(view).toContain('A new version is out.');
    expect(view).toContain('Reload');
  });
});
