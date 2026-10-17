import type { Controller } from './run/controller';
import { hashToken, postRival, rivalRecord, validName } from './run/rivals';
import { SINK, type Fetch, type Sink } from './run/telemetry';
import { loadPref, savePref } from './ui/prefs';

/**
 * Rivals, the browser side (docs/DUEL.md 6, docs/TELEMETRY.md "Rivals and high scores"): the player's two choices, the random
 * token that stands for this browser, and the hook that sends the character when a run ends. It is its own opt-in, off until the
 * player turns it on, and separate from the anonymous run statistics (`src/telemetry.ts`), which promise no identity.
 */

const PREF_ON = 'rivals';
const PREF_NAME = 'rivalName';
const TOKEN_KEY = 'bob.rival.token';

/** Whether this build can send at all (the same project as the run statistics). */
export function rivalsConfigured(): boolean {
  return SINK.url !== '' && SINK.key !== '';
}

/** Whether the player has added their characters to the rivals (off until they do). */
export function rivalsOn(): boolean {
  return loadPref<boolean>(PREF_ON, false);
}

export function setRivals(on: boolean): void {
  savePref(PREF_ON, on);
}

/** The name the player typed, as typed ('' for none). It may not be valid: `sendName` is what is sent. */
export function rivalName(): string {
  const n = loadPref<string>(PREF_NAME, '');
  return typeof n === 'string' ? n : '';
}

export function setRivalName(name: string): void {
  savePref(PREF_NAME, name);
}

/** The name to send: the typed one when it is a valid name, else null (the game makes one up). */
export function sendName(): string | null {
  const n = rivalName().trim();
  return validName(n) ? n : null;
}

let memoryToken: string | null = null;

function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * The random token that stands for this browser, made once and kept in `localStorage`. Only its hash is ever sent (`hashToken`):
 * it tells this browser's own rivals from other people's, and it is what the table counts a day's inserts by. With storage
 * unavailable it lasts the session.
 */
export function rivalToken(): string {
  try {
    const stored = window.localStorage.getItem(TOKEN_KEY);
    if (stored) return stored;
  } catch {
    // Storage may be unavailable.
  }
  const token = memoryToken ?? newToken();
  memoryToken = token;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // The token lasts this session only.
  }
  return token;
}

const buildId = (): string => (typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'local');

/** What the hook sends with and where: the real ones in the game, replaced in tests. */
export type RivalDeps = { fetch: Fetch; sink: Sink; version: string };

const realDeps = (): RivalDeps => ({
  fetch: (url, init) => fetch(url, init as RequestInit),
  sink: SINK,
  version: buildId(),
});

/**
 * Send the character of every run that ends on `c`, a death and a win alike, when the player has opted in. It runs beside any
 * hook already on `c.onRunEnd` (telemetry's), whichever was installed first, and nothing it does can throw into the end of a run.
 */
export function installRivals(c: Controller, deps: () => RivalDeps = realDeps): void {
  const prev = c.onRunEnd;
  c.onRunEnd = (run, res) => {
    try {
      prev?.(run, res);
    } finally {
      try {
        if (!rivalsConfigured() || !rivalsOn()) return;
        const d = deps();
        // The run may not change under the send; the character is copied now.
        const kept = { ...run, build: structuredClone(run.build) };
        const name = sendName();
        void hashToken(rivalToken())
          .then((tokenHash) =>
            postRival(
              d.fetch,
              d.sink,
              rivalRecord(kept, res, { name, tokenHash, version: d.version, seed: run.seed }),
            ),
          )
          .catch(() => undefined);
      } catch {
        // Never disturbs the end of a run.
      }
    }
  };
}
