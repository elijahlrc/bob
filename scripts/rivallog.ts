/**
 * Posts the bot's characters to the `rivals` table (docs/TELEMETRY.md "Rivals and high scores"), as `bot: true` rows with a
 * made-up name, so the pool has rivals at every save version before players add any. Opt in with `--rivals`
 * (`npm run sim -- --runs 10 --class all --seed 1 --rivals`); nothing is sent otherwise, and a failure to send only prints a
 * warning. Each run has a token of its own, from its class and seed, hashed as a player's is, so the table's daily cap counts per
 * run and two processes (which play different seeds) never share one.
 */
import { botRivalRecord, postRival, type RivalRecord } from '../src/run/rivals';
import { SINK, type Fetch, type Sink } from '../src/run/telemetry';
import type { RunState } from '../src/run/run';
import type { MapResult } from '../src/sim/runMap';
import { gameVersion } from './simlog';

export class RivalLog {
  private records: Promise<RivalRecord>[] = [];
  private readonly version: string;
  private readonly fetchFn: Fetch;
  private readonly sink: Sink;

  /** `fetchFn`, `sink` and `version` are the real ones unless a test hands its own. */
  constructor(
    version: string = gameVersion(),
    fetchFn: Fetch = (url, init) => fetch(url, init as RequestInit),
    sink: Sink = SINK,
  ) {
    this.version = version;
    this.fetchFn = fetchFn;
    this.sink = sink;
  }

  /** Keep the character of a run that has just ended (a death or a win). */
  add(run: RunState, res: MapResult): void {
    this.records.push(botRivalRecord(run, res, this.version));
  }

  /**
   * Send what was kept, one row to a request (a row the table refuses, a name the deny-list stops, say, then costs only itself)
   * and say what happened.
   */
  async flush(): Promise<string> {
    let sent = 0;
    for (const pending of this.records) if (await postRival(this.fetchFn, this.sink, await pending)) sent++;
    const of = this.records.length;
    this.records = [];
    const hint = of > 0 && sent === 0 ? ' (is the table made? docs/rivals.sql)' : '';
    return `rivals: sent ${sent} of ${of} bot characters (version ${this.version})${hint}`;
  }
}
