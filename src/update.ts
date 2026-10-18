import type { Controller, Screen } from './run/controller';

/**
 * The nudge to reload (docs/DESIGN.md Appendix A, 2026-10-17). A tab keeps the build it loaded until it is reloaded, for days on
 * a phone, so a deploy never reaches it: the player who won on the 17th had no duel button because their tab was a day old. So
 * the game asks the server which build it serves (`version.json`, written beside the game by the build) when the tab comes back
 * into view and on arriving at the title screen or at camp, and when the answer is another build, those two screens say so with
 * a Reload button (`src/ui/UpdateNotice.tsx`). Never on the run's end screens: a reload there would lose the character before it
 * could be posted to the rivals. A check is at most one a minute, stops once a newer build is known, and nothing here can throw.
 * The dev server and a local copy (build `local`) never check.
 */

export type UpdateDeps = {
  /** The build this page is. */
  current: string;
  /** Fetch `version.json`; the real one goes past the cache. */
  fetch: (url: string) => Promise<{ ok: boolean; json(): Promise<unknown> }>;
  /** Calls `cb` whenever the tab comes back into view, for the life of the page. */
  onVisible: (cb: () => void) => void;
};

const buildId = (): string => (typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'local');

export const realDeps = (): UpdateDeps => ({
  current: buildId(),
  fetch: (url) => fetch(url, { cache: 'no-store' }),
  onVisible: (cb) => {
    if (typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') cb();
    });
  },
});

/** The build the server serves when it is not this one; null until a check has found one. */
let newer: string | null = null;

export const newBuild = (): string | null => newer;

/** Tests and the dev tools: as if the server had answered `build` (null forgets it). */
export function setNewBuild(build: string | null): void {
  newer = build;
}

/** The build the server serves, from `version.json`, or null: when it is this build, unreadable, or not a build id at all. */
export async function serverBuild(
  d: Pick<UpdateDeps, 'current' | 'fetch'>,
): Promise<string | null> {
  if (d.current === 'local') return null;
  try {
    const r = await d.fetch('version.json');
    if (!r.ok) return null;
    const body = (await r.json()) as { build?: unknown } | null;
    const b = body !== null && typeof body === 'object' ? body.build : undefined;
    if (typeof b !== 'string' || b === '' || b === 'local' || b === d.current) return null;
    return b;
  } catch {
    return null;
  }
}

/** The least time between two checks. */
export const CHECK_COOLDOWN_MS = 60_000;

/** The screens the nudge is shown on; arriving at one asks the server. */
export const NUDGE_SCREENS: readonly Screen[] = ['title', 'camp'];

/**
 * Ask the server on every arrival at a nudge screen and whenever the tab comes back into view, at most once a minute, until a
 * newer build is known; then tell the screens (`state`, which re-renders and saves nothing).
 */
export function installUpdateCheck(c: Controller, deps: () => UpdateDeps = realDeps): void {
  let cooling = false;
  const check = () => {
    if (newer !== null || cooling) return;
    const d = deps();
    if (d.current === 'local') return;
    cooling = true;
    setTimeout(() => (cooling = false), CHECK_COOLDOWN_MS);
    void serverBuild(d).then((b) => {
      if (b === null || newer !== null) return;
      newer = b;
      c.bus.emit('state', null);
    });
  };
  let last: Screen = c.screen;
  c.bus.on('state', () => {
    const s = c.screen;
    if (s === last) return;
    last = s;
    if (NUDGE_SCREENS.includes(s)) check();
  });
  deps().onVisible(check);
}
