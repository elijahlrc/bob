import type { MapResult } from '../sim/runMap';
import { buildSignature } from './metrics';
import type { RunState } from './run';

/**
 * What is sent when a run ends (docs/TELEMETRY.md): game facts only, no save, no text a player typed and no identifier of
 * a person. The columns are the ones worth grouping by; the rest of what is known goes in `details`, so a field added
 * later needs no change to the table.
 */
export type RunRecord = {
  outcome: 'died' | 'won';
  class_id: string;
  /** The character's level, the map (floor) the run ended on, and the level of the monsters there. */
  level: number;
  map: number;
  area_level: number | null;
  map_type: string | null;
  theme: string | null;
  affixes: string[];
  killer: string | null;
  killer_type: string | null;
  killer_rarity: string | null;
  killer_mods: string[];
  /** The run's seed (it makes the run replayable; it says nothing about the player). */
  seed: number;
  game_version: string;
  details: Record<string, unknown>;
};

const MAX_TEXT = 64;
const MAX_LIST = 12;

const text = (s: string | undefined | null): string | null => (s ? s.slice(0, MAX_TEXT) : null);
const list = (xs: readonly string[] | undefined): string[] =>
  (xs ?? []).slice(0, MAX_LIST).map((x) => x.slice(0, MAX_TEXT));

/** The record of a run that has just ended (`run.phase` is 'dead' or 'victory'), from the result of its last map. */
export function runRecord(run: RunState, res: MapResult, version: string): RunRecord {
  const recap = run.phase === 'dead' ? run.lastRecap : undefined;
  const seconds = run.history.reduce((s, h) => s + h.time, 0);
  const details: Record<string, unknown> = {
    difficulty: run.difficulty,
    maps_played: run.history.length,
    seconds: Math.round(seconds),
    kills: run.history.reduce((s, h) => s + h.kills, 0),
    passives: run.build.allocated.length,
    build: buildSignature(run.build),
    map_status: res.status,
  };
  if (recap) {
    details.max_life = Math.round(recap.maxLife);
    details.max_es = Math.round(recap.maxEs);
    details.res = recap.res;
    details.max_res = recap.maxRes;
    details.ailments = list(recap.ailments);
    details.seconds_on_map = Math.round(recap.time);
    details.last_damage = recap.lines.slice(0, 4).map((l) => ({
      from: l.name.slice(0, MAX_TEXT),
      type: l.dtype,
      amount: Math.round(l.amount),
    }));
  }
  return {
    outcome: run.phase === 'victory' ? 'won' : 'died',
    class_id: run.classId,
    level: run.build.level,
    map: run.map,
    area_level: recap?.areaLevel ?? res.areaLevel ?? null,
    map_type: text(recap?.mapType ?? res.type),
    theme: text(recap?.themeId),
    affixes: list(recap?.affixes),
    killer: text(recap?.killer),
    killer_type: text(recap?.killerType),
    killer_rarity: text(recap?.killerRarity),
    killer_mods: list(recap?.killerMods),
    seed: run.seed,
    game_version: version.slice(0, MAX_TEXT),
    details,
  };
}

/**
 * Where records go: a Supabase project whose tables `runs` (real players) and `sim_runs` (the dev server and the bot sim)
 * let the public key insert rows and nothing else (docs/TELEMETRY.md). The key is the "publishable" one, which is meant to
 * be public; the secret key must never be in the repo.
 */
export type Sink = { url: string; key: string };

export const SINK: Sink = {
  url: 'https://rqehhconrbuxewrhqjnw.supabase.co',
  key: 'sb_publishable_mcqUSx6wYO-jZ6rkZx3XNg_8Ej144pW',
};

/** What a record from the dev server or a bot adds: where it came from and which batch of runs it belongs to. */
export type SimRecord = RunRecord & { source: string; batch: string };

export function simRecord(r: RunRecord, source: string, batch: string): SimRecord {
  return { ...r, source: source.slice(0, MAX_TEXT), batch: batch.slice(0, MAX_TEXT) };
}

type Fetch = (url: string, init: Record<string, unknown>) => Promise<{ ok: boolean }>;

/**
 * Post records to a table in one request. Fire and forget: it resolves to whether the server took them and never throws, so
 * a blocked or offline request cannot disturb the game or a sim. `fetchFn` is injected so this stays testable and the run
 * layer stays free of the DOM.
 */
export async function postRecords(
  fetchFn: Fetch,
  sink: Sink,
  table: 'runs' | 'sim_runs',
  records: readonly object[],
): Promise<boolean> {
  if (!records.length) return true;
  try {
    const res = await fetchFn(`${sink.url.replace(/\/+$/, '')}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        apikey: sink.key,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(records),
      keepalive: records.length === 1,
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Post the record of a real player's run. */
export function postRecord(fetchFn: Fetch, sink: Sink, record: RunRecord): Promise<boolean> {
  return postRecords(fetchFn, sink, 'runs', [record]);
}
