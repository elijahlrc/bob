import type { Controller, DuelMode, DuelOutcome } from './run/controller';
import {
  fetchHighScoresOrNull,
  fetchMySnapshots,
  fetchRivalsOrNull,
  hashToken,
  matchesRun,
  nameRefused,
  postDuel,
  postRival,
  rivalRecord,
  RIVALS_POOL,
  validName,
  type FetchAny,
  type HighScore,
} from './run/rivals';
import { SAVE_VERSION, type RunState } from './run/run';
import type { MapResult } from './sim/runMap';
import { SINK, type Sink } from './run/telemetry';
import { loadPref, savePref } from './ui/prefs';

/**
 * Rivals, the browser side (docs/DUEL.md 6, docs/TELEMETRY.md "Rivals and high scores"): the player's two choices, the random
 * token that stands for this browser, and the hook that sends the character when a run ends. It is its own opt-in, off until the
 * player turns it on, and separate from the anonymous run statistics (`src/telemetry.ts`), which promise no identity.
 */

const PREF_ON = 'rivals';
const PREF_NAME = 'rivalName';
const PREF_POSTED = 'rivalPosted';
const TOKEN_KEY = 'bob.rival.token';

/** Whether this build can send at all (the same project as the run statistics). */
export function rivalsConfigured(): boolean {
  return SINK.url !== '' && SINK.key !== '';
}

/** Whether the player has added their characters to the rivals (off until they do). */
/** On by default (the user, 2026-10-17): a character is still sent only once a name is typed (`sendName`). */
export function rivalsOn(): boolean {
  return loadPref<boolean>(PREF_ON, true);
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

/**
 * The name to send: the typed one when it is a valid name, else null. A player's character is posted only with a typed name
 * (the generated names are the bot's), so null means nothing is sent.
 */
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
export type RivalDeps = { fetch: FetchAny; sink: Sink; version: string };

export const realDeps = (): RivalDeps => ({
  fetch: (url, init) => fetch(url, init as RequestInit),
  sink: SINK,
  version: buildId(),
});

// ---------------------------------------------------------------------------------------------------------------------------
// The post of the run that just ended, kept

/**
 * Where the post of a run stands. `failed` says why: the table refused the name (the deny-list), or the rivals could not be
 * reached (offline, a cap, a block); only after `failed` may the same run be posted again.
 */
export type PostStatus =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'posted' }
  | { status: 'failed'; reason: 'name' | 'unreachable'; name?: string; message?: string };

const IDLE: PostStatus = { status: 'idle' };

/**
 * What the end screen says of a post that failed for a reason other than the name: the server's own reason when it gave one (a
 * cap from this browser or address, the pool's hourly limit, a block), "could not reach" only when nothing answered.
 */
export function postFailText(message: string | undefined): string {
  if (!message) return 'Could not reach the rivals. Press the button to try again.';
  if (/today/.test(message)) return 'Too many characters sent from here today. Try again tomorrow.';
  if (/taking a rest/.test(message)) return 'The rivals are busy. Try again in a while.';
  return 'The rivals refused this character.';
}

/** The run's identity for the keeper: its seed, with the class and the maps played so that a seed played twice is two runs. */
export function runKey(run: RunState): string {
  return `${run.classId}:${run.seed}:${run.history.length}`;
}

type Keep = { key: string; status: PostStatus; promise: Promise<PostStatus> | null };
/** The run that has just ended: its post, whether sending, done or failed. One run at a time is ever the player's. */
let keep: Keep | null = null;
const watchers = new Set<() => void>();

/** Call `fn` whenever the post of a run changes (its answer arrives); returns what stops it. */
export function watchPost(fn: () => void): () => void {
  watchers.add(fn);
  return () => void watchers.delete(fn);
}

/** Forget the post in hand (for tests: the keeper is module state). */
export function resetPostKeeper(): void {
  keep = null;
  watchers.clear();
}

/** Where the post of `run` stands: in hand, or posted before (the seed of the last run it posted is kept beside the preferences). */
export function postStatus(run: RunState): PostStatus {
  const key = runKey(run);
  if (keep?.key === key) return keep.status;
  return loadPref<string | null>(PREF_POSTED, null) === key ? { status: 'posted' } : IDLE;
}

/** The post of `run` that is on its way, to await; null when none is. */
export function pendingPost(run: RunState): Promise<PostStatus> | null {
  return keep?.key === runKey(run) && keep.status.status === 'sending' ? keep.promise : null;
}

/**
 * Post the character of a run that has ended (a death or a win), unless it is already on its way or in: the hook at the end of a
 * run and the summary's opt-in both come here, so one run is never posted twice. Posted only with a typed name that is valid
 * (`sendName`); with none, nothing is sent and the status stays `idle`. A run whose post failed is posted again by the next call.
 * Never throws; the status says what came of it.
 */
export function postRun(
  run: RunState,
  res: MapResult | null,
  deps: () => RivalDeps = realDeps,
): Promise<PostStatus> {
  const key = runKey(run);
  const now = postStatus(run);
  if (now.status === 'sending') return keep!.promise!;
  if (now.status === 'posted') return Promise.resolve(now);
  const name = sendName();
  if (!rivalsConfigured() || name === null || (run.phase !== 'dead' && run.phase !== 'victory'))
    return Promise.resolve(IDLE);
  // The run may not change under the send: the character is copied now, before anything is awaited.
  const kept = { ...run, build: structuredClone(run.build) };
  const mine: Keep = { key, status: { status: 'sending' }, promise: null };
  const attempt = async (): Promise<PostStatus> => {
    try {
      const d = deps();
      const tokenHash = await hashToken(rivalToken());
      const r = await postRival(
        d.fetch,
        d.sink,
        rivalRecord(kept, res, { name, tokenHash, version: d.version, seed: run.seed }),
      );
      if (r.ok) {
        savePref(PREF_POSTED, key);
        return { status: 'posted' };
      }
      return nameRefused(r)
        ? { status: 'failed', reason: 'name', name, message: r.message }
        : { status: 'failed', reason: 'unreachable', message: r.message };
    } catch {
      return { status: 'failed', reason: 'unreachable' };
    }
  };
  mine.promise = attempt().then((st) => {
    if (keep === mine) {
      mine.status = st;
      for (const fn of [...watchers]) {
        try {
          fn();
        } catch {
          // A watcher cannot break the post.
        }
      }
    }
    return st;
  });
  keep = mine;
  return mine.promise;
}

/**
 * Send the character of a run that has just ended when the player has opted in and has a valid name. Nothing here can throw
 * into the end of a run.
 */
function share(run: RunState, res: MapResult, deps: () => RivalDeps): void {
  try {
    if (!rivalsConfigured() || !rivalsOn()) return;
    void postRun(run, res, deps).catch(() => undefined);
  } catch {
    // Never disturbs the end of a run.
  }
}

// ---------------------------------------------------------------------------------------------------------------------------
// The Rivals screen: whose character it is, and who is near

/**
 * Fill the Rivals screen of the run that ended (`c.rivals`, opened by `c.openRivals()`), once: wait for the post of the character
 * that may still be on its way, ask the table for the player's own snapshot (`my_snapshots`: its id is what the seed of a rated
 * fight and the report need), then for the twenty rivals near the map (`rivals_for`, none of the player's own), and hand the
 * controller both. The newest snapshot of this save version is the player's character only if it is the run's (class, level and
 * map); if it is not, or there is none, the character was not sent and the screen says so (`unsent`) rather than posting it
 * again. Unreachable rivals are `offline`, none near are `empty`. Nothing here throws.
 */
export async function loadRivals(c: Controller, deps: () => RivalDeps = realDeps): Promise<void> {
  const run = c.run;
  const s = c.rivals;
  if (!run || !s || s.started) return;
  s.started = true;
  // The answer is for this session only: a screen that was left and made again (or a quit) is not written to by a load still in the air.
  const fail: Controller['failRivals'] = (status, why) => {
    if (c.rivals === s) c.failRivals(status, why);
  };
  try {
    const d = deps();
    const post = await (pendingPost(run) ?? Promise.resolve(postStatus(run)));
    const tokenHash = await hashToken(rivalToken());
    const rows = await fetchMySnapshots(d.fetch, d.sink, tokenHash);
    if (rows === null) return fail('offline');
    const newest = rows.find((r) => r.saveVersion === SAVE_VERSION);
    if (!newest || !matchesRun(newest, run))
      return fail('unsent', post.status === 'failed' ? post.reason : 'unreachable');
    const pool = await fetchRivalsOrNull(d.fetch, d.sink, {
      saveVersion: SAVE_VERSION,
      map: run.map,
      k: RIVALS_POOL,
      excludeTokenHash: tokenHash,
    });
    if (pool === null) return fail('offline');
    if (c.rivals === s) c.fillRivals(newest, pool);
  } catch {
    fail('offline');
  }
}

/**
 * The retry the Rivals screen offers when the character did not get there: the post goes again through the keeper (which refuses
 * to post a run that is sending or posted), and the screen is made again from the start. Returns the post's status.
 */
export async function retryRivals(c: Controller): Promise<PostStatus> {
  const run = c.run;
  if (!run) return IDLE;
  const st = await postRun(run, c.lastResult);
  c.openRivals();
  return st;
}

// ---------------------------------------------------------------------------------------------------------------------------
// The report of a rated fight

/**
 * Report a rated fight to the duel log (`postDuel`): the player's snapshot, the rival's, who won, how and after how long, the game
 * version and the token's hash (the proof the snapshot is the player's). The answer says what the result screen shows: `rated` (and
 * then the player's rating before and after, read again from `my_snapshots`), `already`, `refused` with the server's reason, or
 * `failed` when offline. A pair the server has (`rated` or `already`) is marked in the record, so that the next fight against that
 * rival is practice. A practice fight is not reported. Nothing here throws.
 */
export async function reportDuel(
  c: Controller,
  out: DuelOutcome,
  deps: () => RivalDeps = realDeps,
): Promise<void> {
  const rv = out.rival;
  if (!rv || !rv.rated) return;
  const changed = () => c.bus?.emit('state', null);
  try {
    const d = deps();
    const tokenHash = await hashToken(rivalToken());
    const { result } = out;
    const post = await postDuel(d.fetch, d.sink, {
      a_id: Number(rv.myId),
      b_id: Number(rv.rivalId),
      winner: result.winner,
      how: result.how,
      // The table takes up to 600 s (docs/rivals.sql 9); the cap is 250.
      seconds: Math.min(600, Math.max(0, Math.round(result.time * 100) / 100)),
      game_version: d.version,
      token_hash: tokenHash,
    });
    rv.report = post.outcome;
    if (post.message) rv.message = post.message;
    if (post.outcome === 'rated' || post.outcome === 'already') c.markRated(rv.myId, rv.rivalId);
    changed();
    if (post.outcome !== 'rated') return;
    // The ladder has moved: the player's rating before and after.
    const before = c.rivals?.mine?.rating;
    const rows = await fetchMySnapshots(d.fetch, d.sink, tokenHash);
    const row = rows?.find((r) => r.id === rv.myId);
    if (row) {
      if (before !== undefined) rv.rating = { before, after: row.rating };
      c.setMine(row);
    }
  } catch {
    rv.report = 'failed';
  }
  changed();
}

// ---------------------------------------------------------------------------------------------------------------------------
// The high scores

/**
 * The top of the list (`high_scores`, at most 100) and the ids of the caller's own snapshots in it (`my_snapshots`), so that a
 * screen can mark the player's rows. The list is of this save version's characters, the ones that can be fought, or with
 * `outdated` of older versions'. `scores` is null when the rivals could not be reached; `mine` is empty when the player's
 * snapshots could not be read (the list is shown without the marks).
 */
export async function loadHighScores(
  deps: () => RivalDeps = realDeps,
  outdated = false,
): Promise<{ scores: HighScore[] | null; mine: Set<string> }> {
  try {
    const d = deps();
    const tokenHash = await hashToken(rivalToken());
    const [scores, rows] = await Promise.all([
      fetchHighScoresOrNull(d.fetch, d.sink, 100, { saveVersion: SAVE_VERSION, outdated }),
      fetchMySnapshots(d.fetch, d.sink, tokenHash),
    ]);
    return { scores, mine: new Set((rows ?? []).map((r) => r.id)) };
  } catch {
    return { scores: null, mine: new Set() };
  }
}

/**
 * Send the character of every run that ends on `c`, a death and a win alike, when the player has opted in and typed a valid name,
 * and report every rated fight against a rival (`reportDuel`). It runs beside any hook already on `c.onRunEnd` (telemetry's),
 * whichever was installed first, and nothing it does can throw into the end of a run.
 */
export function installRivals(c: Controller, deps: () => RivalDeps = realDeps): void {
  const prev = c.onRunEnd;
  c.onRunEnd = (run, res) => {
    try {
      prev?.(run, res);
    } finally {
      share(run, res, deps);
    }
  };
  const prevDuel = c.onDuelEnd;
  c.onDuelEnd = (d: DuelMode, out: DuelOutcome) => {
    try {
      prevDuel?.(d, out);
    } finally {
      void reportDuel(c, out, deps).catch(() => undefined);
    }
  };
}
