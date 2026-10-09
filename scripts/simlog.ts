/**
 * Sends the runs of a bot sim to the `sim_runs` table (docs/TELEMETRY.md), in the same shape as the records of real players
 * (`runs`) plus a source and a batch label, so the two can be compared at the same game version. Opt in with
 * `--log <batch>` (`npm run sim -- --log seed2-tree`); nothing is sent otherwise, and a failure to send only prints a warning.
 */
import { execSync } from 'node:child_process';
import type { RunState } from '../src/run/run';
import type { MapResult } from '../src/sim/runMap';
import { postRecords, runRecord, simRecord, SINK, type SimRecord } from '../src/run/telemetry';

/** The short commit hash the sim ran on, with a + when the source differs from it (so it is not mistaken for that commit). */
export function gameVersion(): string {
  try {
    const hash = execSync('git rev-parse --short=7 HEAD', { encoding: 'utf8' }).trim();
    const dirty = execSync('git status --porcelain src', { encoding: 'utf8' }).trim() !== '';
    return hash + (dirty ? '+' : '');
  } catch {
    return 'unknown';
  }
}

export class SimLog {
  private records: SimRecord[] = [];
  private readonly version = gameVersion();

  private readonly batch: string;
  private readonly source: string;

  constructor(batch: string, source: string) {
    this.batch = batch;
    this.source = source;
  }

  /** Keep the record of a run that has just ended. */
  add(run: RunState, res: MapResult): void {
    this.records.push(simRecord(runRecord(run, res, this.version), this.source, this.batch));
  }

  /** Send what was kept (in requests of 200 records) and say what happened. */
  async flush(): Promise<string> {
    let sent = 0;
    for (let i = 0; i < this.records.length; i += 200) {
      const part = this.records.slice(i, i + 200);
      if (
        !(await postRecords((url, init) => fetch(url, init as RequestInit), SINK, 'sim_runs', part))
      )
        return `sim_runs: sending failed after ${sent} of ${this.records.length} records (is the table made? docs/TELEMETRY.md)`;
      sent += part.length;
    }
    return `sim_runs: sent ${sent} records (batch ${this.batch}, source ${this.source}, version ${this.version})`;
  }
}
