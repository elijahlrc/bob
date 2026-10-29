import { Rng } from '../core/rng';
import { family } from '../data/affixes';
import { itemBase } from '../data/bases';
import { Character } from '../calc/character';
import { classDef } from '../data/classes';
import { clampDifficulty, type Difficulty } from '../data/difficulty';
import { FLASK_AFFIXES, flaskBase } from '../data/flasks';
import { gemDef } from '../data/gems';
import { generateName } from '../data/rivalNames';
import {
  ROLE_NAMES,
  SPACING_NAMES,
  TARGET_NAMES,
  UTILITY_FLASK_NAMES,
  WHEN_NAMES,
} from '../data/strategy';
import { getTree, isLive } from '../data/tree';
import { uniqueFlaskDef } from '../data/uniqueFlasks';
import { uniqueDef } from '../data/uniques';
import { EQUIP_SLOTS, type Build } from '../data/types';
import type { MapResult } from '../sim/runMap';
import { wornUniques } from './metrics';
import type { RunState } from './run';
import { SAVE_VERSION } from './run';
import type { Sink } from './telemetry';

export { generateName };

/**
 * Rivals (docs/DUEL.md 6): a character captured when a run ends, sent to the `rivals` table and fetched by other players to
 * fight. Everything that touches the network takes its `fetch` as a parameter, as `postRecords` does, so it is tested without
 * one and the run layer stays free of the DOM; nothing here throws into the game.
 */

/** A rival as the game holds it. */
export type Rival = {
  /** The row id. */
  id: string;
  /** Typed by the player (`validName`) or made up (`generateName`). */
  name: string;
  classId: string;
  level: number;
  /** The map the run ended on. */
  map: number;
  outcome: 'died' | 'won';
  /** Shown on the card; not used in the fight. */
  difficulty: Difficulty;
  /** `SAVE_VERSION` when it was captured: the format of `build`. */
  saveVersion: number;
  /** The commit, as telemetry sends it. */
  gameVersion: string;
  /** A character the bot built, to fill the pool. */
  bot: boolean;
  /** Its standing on the ladder (docs/DUEL.md 6.3): a card shows them; a rival is fightable whatever they are. */
  rating: number;
  fights: number;
  wins: number;
  build: Build;
};

/** A line of the high score list: a rival snapshot with the standing the ranking job has given it (docs/DUEL.md 6.3). */
export type HighScore = {
  id: string;
  name: string;
  classId: string;
  level: number;
  map: number;
  outcome: 'died' | 'won';
  rating: number;
  fights: number;
  wins: number;
  gameVersion: string;
  /** The day it was posted, `YYYY-MM-DD`. */
  postedOn: string;
  /** Its place on the whole list, from the functions that rank (`high_scores_page`, `high_score_standing`). */
  rank?: number;
};

/** The row that is posted: the table's columns, and nothing of the run but `build`. */
export type RivalRecord = {
  name: string;
  class_id: string;
  level: number;
  map: number;
  outcome: 'died' | 'won';
  difficulty: Difficulty;
  save_version: number;
  game_version: string;
  bot: boolean;
  /** SHA-256 of the browser's random token, 64 hex characters (`hashToken`). */
  token_hash: string;
  build: Build;
};

// ---------------------------------------------------------------------------------------------------------------------------
// Names

export const NAME_MIN = 3;
export const NAME_MAX = 16;
/** The table's rule for a name, as it is in `docs/rivals.sql`: it starts and ends with a letter or digit. */
export const NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 -]*[A-Za-z0-9]$/;

/** A name the player may type: 3 to 16 ASCII letters, digits, spaces and hyphens, starting and ending with a letter or digit. */
export function validName(s: string): boolean {
  return s.length >= NAME_MIN && s.length <= NAME_MAX && NAME_PATTERN.test(s);
}

// ---------------------------------------------------------------------------------------------------------------------------
// The token

/**
 * SHA-256 of a token as 64 hex characters. The raw token is made in the browser (`src/rivals.ts`) and never leaves it; the table
 * holds only this hash, to count a device's inserts and to leave its own rivals out of what it is shown.
 */
export async function hashToken(token: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------------------------------------------------------------------
// Capture

const MAX_TEXT = 64;
const clampInt = (n: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, Math.round(n)));

export type RivalOpts = {
  /** What the player typed (`validName`), or null for a made-up name. */
  name: string | null;
  /** The hash of the token (`hashToken`). */
  tokenHash: string;
  version: string;
  bot?: boolean;
  /** Seeds the made-up name. */
  seed: number;
};

/**
 * The row to post for a run that has just ended (`run.phase` is 'dead' or 'victory'): the character as it stands, the map, the
 * outcome, the difficulty, and who sent it. `build` is `run.build` as it is; nothing else of the run goes. `res` is the result
 * of the last map, which the hook that calls this is given and this does not need.
 */
export function rivalRecord(run: RunState, _res: MapResult | null, opts: RivalOpts): RivalRecord {
  const d = run.difficulty;
  return {
    name: opts.name !== null && validName(opts.name) ? opts.name : generateName(opts.seed),
    class_id: run.classId.slice(0, 32),
    level: clampInt(run.build.level, 1, 100),
    map: clampInt(run.map, 1, 100),
    outcome: run.phase === 'victory' ? 'won' : 'died',
    difficulty: { scaling: d.scaling, base: d.base, variance: d.variance },
    save_version: SAVE_VERSION,
    game_version: opts.version.slice(0, MAX_TEXT),
    bot: opts.bot === true,
    token_hash: opts.tokenHash,
    build: run.build,
  };
}

/** The row for the bot's character at the end of a sim run: a made-up name and a token of its own, from the class and the seed. */
export async function botRivalRecord(
  run: RunState,
  res: MapResult,
  version: string,
): Promise<RivalRecord> {
  return rivalRecord(run, res, {
    name: null,
    tokenHash: await hashToken(`bot:${run.classId}:${run.seed}`),
    version,
    bot: true,
    seed: run.seed,
  });
}

// ---------------------------------------------------------------------------------------------------------------------------
// Writing: a snapshot and the report of a fight

/** A `fetch` that can read the body: what the read functions need. */
export type FetchJson = (
  url: string,
  init: Record<string, unknown>,
) => Promise<{ ok: boolean; status?: number; json(): Promise<unknown> }>;

/**
 * Any `fetch` the writes may be given: `ok` is all a plain one has, and the status and the body (where PostgREST puts the error's
 * code and message) are read only if it has them. The real `fetch` and the test doubles are all of this type.
 */
export type FetchAny = (
  url: string,
  init: Record<string, unknown>,
) => Promise<{ ok: boolean; status?: number; json?: () => Promise<unknown> }>;

/** What a write came to: whether the table took it, and when it did not, what the server said (the HTTP status, the Postgres code and message). */
export type PostResult = { ok: boolean; status?: number; code?: string; message?: string };

const isObj = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);

/** The code and message of a PostgREST error body; nothing when there is none to read. */
async function errorOf(res: { json?: () => Promise<unknown> }): Promise<Partial<PostResult>> {
  try {
    if (typeof res.json !== 'function') return {};
    const body = await res.json();
    if (!isObj(body)) return {};
    return {
      ...(typeof body.code === 'string' ? { code: body.code } : {}),
      ...(typeof body.message === 'string' ? { message: body.message.slice(0, 200) } : {}),
    };
  } catch {
    return {};
  }
}

/** Insert one row into a table with the public key (`Prefer: return=minimal`: the table may not be read back); never throws. */
async function insertRow(
  fetchFn: FetchAny,
  sink: Sink,
  table: 'rivals' | 'duels',
  row: object,
): Promise<PostResult> {
  try {
    const res = await fetchFn(`${sink.url.replace(/\/+$/, '')}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        apikey: sink.key,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify([row]),
      keepalive: true,
    });
    if (res.ok) return { ok: true, status: res.status };
    return { ok: false, status: res.status, ...(await errorOf(res)) };
  } catch {
    return { ok: false };
  }
}

/**
 * Post a snapshot. Resolves to whether the table took it and, when it did not, why: PostgREST's code and message come with the
 * answer, so a screen can tell a name the deny-list refused (`nameRefused`) from a sink that is out of reach. Never throws.
 */
export function postRival(fetchFn: FetchAny, sink: Sink, record: RivalRecord): Promise<PostResult> {
  return insertRow(fetchFn, sink, 'rivals', record);
}

/**
 * Whether the table refused the snapshot for its name: the deny-list's check violation ("that name is not allowed") or the
 * column's own rule. A cap and a block are check violations too and are not this.
 */
export function nameRefused(r: PostResult): boolean {
  return !r.ok && r.code === '23514' && /name/i.test(r.message ?? '');
}

/** The report of a rated fight, as the `duels` table takes it (docs/rivals.sql 9): the server sets the seed, the time and the address. */
export type DuelReport = {
  /** The reporter's own snapshot (side 0, "you"). */
  a_id: number;
  /** The rival it fought. */
  b_id: number;
  /** 0 when `a` won, 1 when `b` did, null for a draw. */
  winner: 0 | 1 | null;
  how: 'death' | 'time' | 'stall';
  seconds: number;
  game_version: string;
  /** The hash of the token that posted snapshot `a_id`: the proof that it is the reporter's. */
  token_hash: string;
};

/**
 * How the server took a report: `rated` (both ratings moved), `already` (this pair was rated before: HTTP 409, Postgres 23505),
 * `refused` (a check violation: a bot's snapshot, a blocked writer, a cap; `message` is the server's reason) or `failed` (offline,
 * or an answer that says nothing of the report).
 */
export type DuelPost = { outcome: 'rated' | 'already' | 'refused' | 'failed'; message?: string };

/** Post the report of a rated fight; never throws. */
export async function postDuel(
  fetchFn: FetchAny,
  sink: Sink,
  report: DuelReport,
): Promise<DuelPost> {
  const r = await insertRow(fetchFn, sink, 'duels', report);
  if (r.ok) return { outcome: 'rated' };
  if (r.status === 409 || r.code === '23505') return { outcome: 'already' };
  if (r.code === '23514')
    return { outcome: 'refused', ...(r.message ? { message: r.message } : {}) };
  return { outcome: 'failed' };
}

/**
 * The seed of the rated fight between two snapshots, `a` the player's own and `b` the rival: the database's `duel_seed(a, b)`
 * (`((a * 1000003) + (b * 7919)) % 2147483647`, docs/rivals.sql 11), which forces the same seed on a report, so that nobody can
 * shop for a seed they win and a replay fights the very same duel. Exact in big integers, as the database is.
 */
export function duelSeedFor(a: string | number, b: string | number): number {
  for (const id of [a, b])
    if (!/^\d+$/.test(String(id))) throw new Error(`not a snapshot id: ${id}`);
  return Number((BigInt(a) * 1000003n + BigInt(b) * 7919n) % 2147483647n);
}

// ---------------------------------------------------------------------------------------------------------------------------
// Reading: the table is read through three functions only (docs/rivals.sql)

/** Call a database function through PostgREST (`POST rpc/<name>`); null on any failure. */
async function rpc(
  fetchFn: FetchAny,
  sink: Sink,
  name: string,
  args: Record<string, unknown>,
): Promise<unknown[] | null> {
  try {
    const res = await fetchFn(`${sink.url.replace(/\/+$/, '')}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: { apikey: sink.key, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    if (!res.ok || typeof res.json !== 'function') return null;
    const body = await res.json();
    return Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

export type RivalsQuery = {
  /** The save version the rivals must be of: this build's `SAVE_VERSION`. */
  saveVersion: number;
  /** The map to look near: rivals of that depth first. */
  map: number;
  /** How many (at most 20). */
  k: number;
  /** The hash of this browser's token: its own snapshots are left out. */
  excludeTokenHash: string | null;
};

/**
 * Up to `k` rivals of `saveVersion` near `map`, none of this browser's own (`rivals_for`), each checked by `validateRival`:
 * a row that does not hold up is left out. Empty when offline or when the table is not there.
 */
export async function fetchRivals(fetchFn: FetchAny, sink: Sink, q: RivalsQuery): Promise<Rival[]> {
  return (await fetchRivalsOrNull(fetchFn, sink, q)) ?? [];
}

/** `fetchRivals`, but null when the sink could not be asked (offline, refused, no such function), so that "none near" and "no sink" can be told apart. */
export async function fetchRivalsOrNull(
  fetchFn: FetchAny,
  sink: Sink,
  q: RivalsQuery,
): Promise<Rival[] | null> {
  const rows = await rpc(fetchFn, sink, 'rivals_for', {
    save_version: q.saveVersion,
    map: q.map,
    k: q.k,
    exclude_token_hash: q.excludeTokenHash,
  });
  if (!rows) return null;
  const out: Rival[] = [];
  for (const row of rows) {
    const r = validateRival(row, q.saveVersion);
    if (r) out.push(r);
  }
  return out;
}

/**
 * Which part of the rating list to ask for: the snapshots of this save version (the ones a game of this version can fight), or
 * with `outdated` those of older versions, whose ratings stand as they were left.
 */
export type HighScoresQuery = { saveVersion: number; outdated: boolean };

/** The top of the rating list (`high_scores`, at most 100); empty when offline, when nothing is rated yet, or when the table is not there. */
export async function fetchHighScores(
  fetchFn: FetchAny,
  sink: Sink,
  k: number,
  q: HighScoresQuery = { saveVersion: SAVE_VERSION, outdated: false },
): Promise<HighScore[]> {
  return (await fetchHighScoresOrNull(fetchFn, sink, k, q)) ?? [];
}

/** The most rows a page of the high scores may hold (`high_scores_page`). */
export const HIGH_SCORES_PAGE_MAX = 100;

/**
 * A page of the rating list (`high_scores_page`): up to `k` rows (at most 100) from rank `start + 1`, each with its rank on the
 * whole list. Null when the sink could not be asked.
 */
export async function fetchHighScoresPage(
  fetchFn: FetchAny,
  sink: Sink,
  q: HighScoresQuery & { start: number; k: number },
): Promise<HighScore[] | null> {
  const rows = await rpc(fetchFn, sink, 'high_scores_page', {
    save_version: q.saveVersion,
    outdated: q.outdated,
    start: Math.max(0, Math.floor(q.start)),
    k: Math.min(HIGH_SCORES_PAGE_MAX, Math.max(0, Math.floor(q.k))),
  });
  return rows ? rankedOf(rows) : null;
}

/**
 * The rows within `span` ranks of a snapshot on its version's list (`high_score_standing`), each with its rank: the snapshot and
 * those either side once it has fought, else those either side of where its rating would stand. Null when the sink could not be asked.
 */
export async function fetchStanding(
  fetchFn: FetchAny,
  sink: Sink,
  snapshotId: string,
  span: number,
): Promise<HighScore[] | null> {
  const id = Number(snapshotId);
  if (!Number.isSafeInteger(id)) return null;
  const rows = await rpc(fetchFn, sink, 'high_score_standing', { snapshot_id: id, span });
  return rows ? rankedOf(rows) : null;
}

/** `fetchHighScores`, but null when the sink could not be asked. */
export async function fetchHighScoresOrNull(
  fetchFn: FetchAny,
  sink: Sink,
  k: number,
  q: HighScoresQuery = { saveVersion: SAVE_VERSION, outdated: false },
): Promise<HighScore[] | null> {
  const rows = await rpc(fetchFn, sink, 'high_scores', {
    k,
    save_version: q.saveVersion,
    outdated: q.outdated,
  });
  if (!rows) return null;
  const out: HighScore[] = [];
  for (const row of rows) {
    const s = highScoreOf(row);
    if (s) out.push(s);
  }
  return out;
}

/** One of the caller's own snapshots, as `my_snapshots` gives it (docs/rivals.sql 15b): what the game may show of its own character. */
export type MySnapshot = {
  id: string;
  /** When it was posted, as the database writes a timestamp. */
  createdAt: string;
  name: string;
  classId: string;
  level: number;
  map: number;
  outcome: 'died' | 'won';
  saveVersion: number;
  rating: number;
  fights: number;
  wins: number;
};

/**
 * The caller's own snapshots, newest first (`my_snapshots`, at most 50), found by the hash of the token only its browser knows: the
 * ids the seed of a rated fight and the report need, and the rating. Null when the sink could not be asked, so that "nothing of
 * mine is there" and "offline" can be told apart; a row that is not the function's shape is left out.
 */
export async function fetchMySnapshots(
  fetchFn: FetchAny,
  sink: Sink,
  tokenHash: string,
): Promise<MySnapshot[] | null> {
  const rows = await rpc(fetchFn, sink, 'my_snapshots', { token_hash: tokenHash });
  if (!rows) return null;
  const out: MySnapshot[] = [];
  for (const row of rows) {
    const s = mySnapshotOf(row);
    if (s) out.push(s);
  }
  return out;
}

/**
 * Whether a snapshot of the caller's is the character of this run (the same save version, class, level and map, as `rivalRecord`
 * writes them): the sanity check that the newest snapshot is the run that just ended and not an older one.
 */
export function matchesRun(s: MySnapshot, run: RunState): boolean {
  return (
    s.saveVersion === SAVE_VERSION &&
    s.classId === run.classId.slice(0, 32) &&
    s.level === clampInt(run.build.level, 1, 100) &&
    s.map === clampInt(run.map, 1, 100)
  );
}

// ---------------------------------------------------------------------------------------------------------------------------
// What a rival card shows

/**
 * What a card says a build is, short: the main skill's name, the keystones taken and the uniques worn, by name (a few of each).
 * Not `metrics.buildSignature`, which is the telemetry's line of ids.
 */
export function buildSignature(build: Build): string[] {
  const gems = EQUIP_SLOTS.flatMap((s) => build.equipment[s]?.sockets ?? []).filter(
    (g) => g !== null,
  );
  const name = (look: () => string): string | null => {
    try {
      return look();
    } catch {
      return null;
    }
  };
  const main =
    gems.find((g) => g.uid === build.primaryGem) ??
    gems.find((g) => name(() => gemDef(g.gemId).kind) === 'active');
  const tree = getTree();
  const keystones = build.allocated
    .filter((id) => tree.nodes[id]?.kind === 'keystone')
    .map((id) => tree.nodes[id].name)
    .sort();
  const uniques = wornUniques(build).map(
    (id) => name(() => uniqueDef(id).name) ?? name(() => uniqueFlaskDef(id).name) ?? id,
  );
  const mainName = main ? name(() => gemDef(main.gemId).name) : null;
  return [...(mainName ? [mainName] : []), ...keystones.slice(0, 3), ...uniques.slice(0, 4)];
}

/** How many rivals are asked for at once (the most `rivals_for` gives), and how many of them a screen shows. */
export const RIVALS_POOL = 20;
export const RIVALS_SHOWN = 5;

/**
 * The `k` rivals a screen shows out of the pool (`rivals_for` is newest first, so it gives the same ones until new rows arrive):
 * a seeded shuffle of the run's seed and a counter, so that the same draw is the same five, no rival is there twice, and a later
 * draw (`counter + 1`, "Show others") puts the ones not just shown first. A pool with fewer than `k` others fills up from them.
 */
export function drawRivals(
  pool: readonly Rival[],
  runSeed: number,
  counter: number,
  k: number,
  avoid: readonly string[] = [],
): Rival[] {
  const order = new Rng(`rivals:${runSeed}:${counter}`).shuffle([...pool]);
  const fresh = order.filter((r) => !avoid.includes(r.id));
  const again = order.filter((r) => avoid.includes(r.id));
  return [...fresh, ...again].slice(0, k);
}

// ---------------------------------------------------------------------------------------------------------------------------
// Validation

const isInt = (x: unknown, lo: number, hi: number): x is number =>
  typeof x === 'number' && Number.isInteger(x) && x >= lo && x <= hi;
const isStr = (x: unknown, max = 200): x is string => typeof x === 'string' && x.length <= max;
/** Whether a lookup that throws on an unknown id finds it. */
const known = (look: () => unknown): boolean => {
  try {
    look();
    return true;
  } catch {
    return false;
  }
};
const MAX_SOCKETS = 8;
const RARITIES = ['normal', 'magic', 'rare', 'unique'];

function modsOk(x: unknown): boolean {
  return (
    Array.isArray(x) &&
    x.length <= 64 &&
    x.every(
      (m) =>
        isObj(m) &&
        isStr(m.stat) &&
        isStr(m.kind) &&
        typeof m.value === 'number' &&
        Number.isFinite(m.value),
    )
  );
}

/**
 * An affix of an item or a flask. A family id exists in the item families or the flask affixes; a unique's fixed mods are
 * stored as a family called 'unique', which only a unique carries.
 */
function affixOk(a: unknown, isFlask: boolean, unique: boolean): boolean {
  if (!isObj(a) || !isStr(a.family, 64) || !isInt(a.tier, 0, 100) || !modsOk(a.mods)) return false;
  if (a.family === 'unique') return unique;
  return isFlask
    ? FLASK_AFFIXES.some((f) => f.id === a.family)
    : known(() => family(a.family as string));
}

function affixesOk(x: unknown, isFlask: boolean, unique: boolean): boolean {
  return Array.isArray(x) && x.length <= 12 && x.every((a) => affixOk(a, isFlask, unique));
}

function triggerOk(t: unknown): boolean {
  if (!isObj(t) || !isStr(t.on, 64) || typeof t.chance !== 'number') return false;
  if (typeof t.cooldown !== 'number' || !isObj(t.effect) || !isStr(t.effect.kind, 64)) return false;
  if (t.effect.kind !== 'castGranted') return true;
  const skillId = t.effect.skillId;
  return isStr(skillId, 64) && known(() => gemDef(skillId));
}

function triggersOk(x: unknown): boolean {
  return Array.isArray(x) && x.length <= 8 && x.every(triggerOk);
}

function gemOk(g: unknown): boolean {
  return (
    isObj(g) &&
    g.kind === 'gem' &&
    typeof g.uid === 'number' &&
    isStr(g.gemId, 64) &&
    known(() => gemDef(g.gemId as string))
  );
}

function itemOk(it: unknown): boolean {
  if (!isObj(it) || it.kind !== 'item') return false;
  if (
    typeof it.uid !== 'number' ||
    !isStr(it.baseId, 64) ||
    !known(() => itemBase(it.baseId as string))
  )
    return false;
  if (!isStr(it.rarity, 16) || !RARITIES.includes(it.rarity)) return false;
  if (!isStr(it.name) || !isInt(it.ilvl, 1, 200) || !modsOk(it.implicits)) return false;
  let unique = false;
  if (it.uniqueId !== undefined) {
    if (!isStr(it.uniqueId, 64) || !known(() => uniqueDef(it.uniqueId as string))) return false;
    unique = true;
  }
  if (it.uniqueMods !== undefined && !modsOk(it.uniqueMods)) return false;
  if (it.uniqueTriggers !== undefined && !triggersOk(it.uniqueTriggers)) return false;
  if (!affixesOk(it.affixes, false, unique)) return false;
  if (
    it.polished !== undefined &&
    !(
      Array.isArray(it.polished) &&
      it.polished.length <= 4 &&
      it.polished.every((f) => isStr(f, 64) && known(() => family(f)))
    )
  )
    return false;
  return (
    Array.isArray(it.sockets) &&
    it.sockets.length <= MAX_SOCKETS &&
    it.sockets.every((g) => g === null || gemOk(g))
  );
}

function flaskOk(f: unknown): boolean {
  if (!isObj(f) || f.kind !== 'flask') return false;
  if (
    typeof f.uid !== 'number' ||
    !isStr(f.baseId, 64) ||
    !known(() => flaskBase(f.baseId as string))
  )
    return false;
  if (!isStr(f.name) || !isInt(f.ilvl, 1, 200)) return false;
  let unique = false;
  if (f.uniqueId !== undefined) {
    if (!isStr(f.uniqueId, 64) || !known(() => uniqueFlaskDef(f.uniqueId as string))) return false;
    unique = true;
  }
  return affixesOk(f.affixes, true, unique);
}

function strategyOk(s: unknown): boolean {
  if (s === undefined) return true;
  if (!isObj(s)) return false;
  const oneOf = (v: unknown, names: object) => v === undefined || (isStr(v, 32) && v in names);
  if (!oneOf(s.target, TARGET_NAMES) || !oneOf(s.spacing, SPACING_NAMES)) return false;
  if (!oneOf(s.utilityFlask, UTILITY_FLASK_NAMES)) return false;
  if (s.flasks !== undefined) {
    if (!isObj(s.flasks)) return false;
    const { at, manaAt, use } = s.flasks;
    const list = (v: unknown, ok: (x: unknown) => boolean) =>
      v === undefined || (Array.isArray(v) && v.length <= 5 && v.every((x) => x === null || ok(x)));
    const share = (x: unknown) => typeof x === 'number' && x >= 0 && x <= 1;
    if (!list(at, share) || !list(manaAt, share)) return false;
    if (!list(use, (x) => isStr(x, 32) && x in UTILITY_FLASK_NAMES)) return false;
  }
  if (
    s.lifeFlask !== undefined &&
    !(typeof s.lifeFlask === 'number' && s.lifeFlask >= 0 && s.lifeFlask <= 1)
  )
    return false;
  if (
    s.order !== undefined &&
    !(Array.isArray(s.order) && s.order.length <= 64 && s.order.every((n) => typeof n === 'number'))
  )
    return false;
  if (s.skills !== undefined) {
    if (!isObj(s.skills)) return false;
    for (const t of Object.values(s.skills)) {
      if (!isObj(t) || !oneOf(t.role, ROLE_NAMES) || !oneOf(t.when, WHEN_NAMES)) return false;
      for (const k of ['every', 'life'])
        if (t[k] !== undefined && typeof t[k] !== 'number') return false;
      for (const k of ['lowLife', 'surrounded'])
        if (t[k] !== undefined && typeof t[k] !== 'boolean') return false;
    }
  }
  return true;
}

/** Whether every id a build refers to exists at this version and its shape is a build's; it says nothing of whether it is legal. */
function buildOk(b: unknown, classId: string, level: number): b is Build {
  if (!isObj(b) || b.classId !== classId || b.level !== level) return false;
  const tree = getTree();
  if (
    !Array.isArray(b.allocated) ||
    b.allocated.length > tree.nodes.length ||
    !b.allocated.every((id) => isInt(id, 0, tree.nodes.length - 1) && isLive(tree.nodes[id]))
  )
    return false;
  if (!isObj(b.equipment)) return false;
  const gems = new Set<number>();
  for (const [slot, it] of Object.entries(b.equipment)) {
    if (!(EQUIP_SLOTS as readonly string[]).includes(slot) || !itemOk(it)) return false;
    for (const g of (it as { sockets: ({ uid: number } | null)[] }).sockets) if (g) gems.add(g.uid);
  }
  if (
    !Array.isArray(b.flasks) ||
    b.flasks.length > 8 ||
    !b.flasks.every((f) => f === null || flaskOk(f))
  )
    return false;
  if (b.primaryGem !== undefined && !(typeof b.primaryGem === 'number' && gems.has(b.primaryGem)))
    return false;
  return strategyOk(b.strategy);
}

/**
 * A row of `rivals_for` as a `Rival`, or null when it should not be offered: the wrong shape, another save version, a name the
 * table's rule would not take, a build that refers to an id this version does not have (a node, a base, an affix, a gem, a
 * unique, a flask), a primary gem that is not socketed, or one that will not even make a `Character`. The ranking's columns
 * (rating, fights, wins) are read for the card and are not checked: a row without them (or with junk in them) is a rival at ten
 * times its level that has not fought, and is as fightable as any.
 */
export function validateRival(row: unknown, saveVersion: number): Rival | null {
  if (!isObj(row)) return null;
  const { id, name, class_id: classId, level, map, outcome, difficulty, build } = row;
  if (typeof id !== 'number' && !isStr(id, 32)) return null;
  if (row.save_version !== saveVersion || saveVersion !== SAVE_VERSION) return null;
  if (!isStr(name, 48) || name.length < NAME_MIN || !NAME_PATTERN.test(name)) return null;
  if (!isStr(classId, 32) || !known(() => classDef(classId))) return null;
  if (!isInt(level, 1, 100) || !isInt(map, 1, 100)) return null;
  if (outcome !== 'died' && outcome !== 'won') return null;
  if (!isObj(difficulty) || typeof row.bot !== 'boolean') return null;
  const gameVersion =
    row.game_version === null || row.game_version === undefined ? '' : row.game_version;
  if (!isStr(gameVersion, MAX_TEXT)) return null;
  if (!buildOk(build, classId, level)) return null;
  try {
    new Character(build);
  } catch {
    return null;
  }
  return {
    id: String(id),
    name,
    classId,
    level,
    map,
    outcome,
    difficulty: clampDifficulty(difficulty as Partial<Difficulty>),
    saveVersion,
    gameVersion,
    bot: row.bot,
    rating:
      typeof row.rating === 'number' && Number.isFinite(row.rating)
        ? Math.round(row.rating)
        : level * 10,
    fights: isInt(row.fights, 0, 1e9) ? row.fights : 0,
    wins: isInt(row.wins, 0, 1e9) ? row.wins : 0,
    build,
  };
}

/** A row of `my_snapshots` as a `MySnapshot`, or null when it is not the shape the function returns. */
function mySnapshotOf(row: unknown): MySnapshot | null {
  if (!isObj(row)) return null;
  const {
    id,
    created_at,
    name,
    class_id: classId,
    level,
    map,
    outcome,
    rating,
    fights,
    wins,
  } = row;
  if (typeof id !== 'number' && !isStr(id, 32)) return null;
  if (!isStr(created_at, 64) || !isStr(name, 48) || !isStr(classId, 32)) return null;
  if (!isInt(level, 1, 100) || !isInt(map, 1, 100)) return null;
  if (outcome !== 'died' && outcome !== 'won') return null;
  if (!isInt(row.save_version, 1, 100000)) return null;
  if (typeof rating !== 'number' || !Number.isFinite(rating)) return null;
  if (!isInt(fights, 0, 1e9) || !isInt(wins, 0, 1e9)) return null;
  return {
    id: String(id),
    createdAt: created_at,
    name,
    classId,
    level,
    map,
    outcome,
    saveVersion: row.save_version,
    rating,
    fights,
    wins,
  };
}

/** Rows of a ranking function as `HighScore`s, each with its rank; rows of any other shape are skipped. */
function rankedOf(rows: unknown[]): HighScore[] {
  const out: HighScore[] = [];
  for (const row of rows) {
    const s = highScoreOf(row);
    if (s && s.rank !== undefined) out.push(s);
  }
  return out;
}

/** A row of `high_scores` as a `HighScore`, or null when it is not the shape the function returns. */
function highScoreOf(row: unknown): HighScore | null {
  if (!isObj(row)) return null;
  const { id, name, class_id: classId, level, map, outcome, rating, fights, wins, posted_on } = row;
  if (typeof id !== 'number' && !isStr(id, 32)) return null;
  if (!isStr(name, 48) || !isStr(classId, 32) || !isStr(posted_on, 32)) return null;
  if (!isInt(level, 1, 100) || !isInt(map, 1, 100)) return null;
  if (outcome !== 'died' && outcome !== 'won') return null;
  if (typeof rating !== 'number' || !isInt(fights, 0, 1e9) || !isInt(wins, 0, 1e9)) return null;
  const gameVersion =
    row.game_version === null || row.game_version === undefined ? '' : row.game_version;
  if (!isStr(gameVersion, MAX_TEXT)) return null;
  return {
    id: String(id),
    name,
    classId,
    level,
    map,
    outcome,
    rating,
    fights,
    wins,
    gameVersion,
    postedOn: posted_on,
    ...(isInt(row.rank, 1, 1e9) ? { rank: row.rank as number } : {}),
  };
}
