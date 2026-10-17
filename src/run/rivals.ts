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
import { getTree } from '../data/tree';
import { uniqueFlaskDef } from '../data/uniqueFlasks';
import { uniqueDef } from '../data/uniques';
import { EQUIP_SLOTS, type Build } from '../data/types';
import type { MapResult } from '../sim/runMap';
import type { RunState } from './run';
import { SAVE_VERSION } from './run';
import { postRecords, type Fetch, type Sink } from './telemetry';

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
export function rivalRecord(run: RunState, _res: MapResult, opts: RivalOpts): RivalRecord {
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

/** Post a snapshot. Resolves to whether the table took it; never throws. */
export function postRival(fetchFn: Fetch, sink: Sink, record: RivalRecord): Promise<boolean> {
  return postRecords(fetchFn, sink, 'rivals', [record]);
}

// ---------------------------------------------------------------------------------------------------------------------------
// Reading: the table is read through two functions only (docs/rivals.sql)

/** A `fetch` that can read the body: what the two read functions need. */
export type FetchJson = (
  url: string,
  init: Record<string, unknown>,
) => Promise<{ ok: boolean; json(): Promise<unknown> }>;

/** Call a database function through PostgREST (`POST rpc/<name>`); null on any failure. */
async function rpc(
  fetchFn: FetchJson,
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
    if (!res.ok) return null;
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
export async function fetchRivals(
  fetchFn: FetchJson,
  sink: Sink,
  q: RivalsQuery,
): Promise<Rival[]> {
  const rows = await rpc(fetchFn, sink, 'rivals_for', {
    save_version: q.saveVersion,
    map: q.map,
    k: q.k,
    exclude_token_hash: q.excludeTokenHash,
  });
  if (!rows) return [];
  const out: Rival[] = [];
  for (const row of rows) {
    const r = validateRival(row, q.saveVersion);
    if (r) out.push(r);
  }
  return out;
}

/** The top of the rating list (`high_scores`, at most 100); empty when offline, when nothing is rated yet, or when the table is not there. */
export async function fetchHighScores(
  fetchFn: FetchJson,
  sink: Sink,
  k: number,
): Promise<HighScore[]> {
  const rows = await rpc(fetchFn, sink, 'high_scores', { k });
  if (!rows) return [];
  const out: HighScore[] = [];
  for (const row of rows) {
    const s = highScoreOf(row);
    if (s) out.push(s);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------------
// Validation

const isObj = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);
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
    !b.allocated.every((id) => isInt(id, 0, tree.nodes.length - 1) && tree.nodes[id])
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
 * unique, a flask), a primary gem that is not socketed, or one that will not even make a `Character`. The rating columns of the
 * ranking are not read: a rival is fightable whatever its standing.
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
    build,
  };
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
  };
}
