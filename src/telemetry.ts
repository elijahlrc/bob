import { postRecords, runRecord, SINK, simRecord } from './run/telemetry';
import type { Controller } from './run/controller';
import { loadPref, savePref } from './ui/prefs';

const PREF = 'telemetry';

/** Whether this build can send at all. */
export function telemetryConfigured(): boolean {
  return SINK.url !== '' && SINK.key !== '';
}

/** Whether the player has left sending on (it is on until they switch it off). */
export function telemetryOn(): boolean {
  return loadPref<boolean>(PREF, true);
}

export function setTelemetry(on: boolean): void {
  savePref(PREF, on);
}

/** Where this page is: the published game, the dev server or a local copy (which counts as development), or neither. */
function where(): 'published' | 'dev' | null {
  const h = window.location.hostname;
  if (import.meta.env.DEV || h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local'))
    return 'dev';
  return h === '' ? null : 'published';
}

const buildId = (): string => (typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'local');

const post = (table: 'runs' | 'sim_runs', record: object) =>
  postRecords((url, init) => fetch(url, init as RequestInit), SINK, table, [record]);

/**
 * Send the result of every run that ends on `c`, when sending is configured and on: from the published game to `runs`, from
 * the dev server or a local copy to `sim_runs` (as source `dev`), so real play and development play never mix.
 */
export function installTelemetry(c: Controller): void {
  c.onRunEnd = (run, res) => {
    if (!telemetryConfigured() || !telemetryOn()) return;
    const record = runRecord(run, res, buildId());
    const at = where();
    if (at === 'published') void post('runs', record);
    else if (at === 'dev') void post('sim_runs', simRecord(record, 'dev', buildId()));
  };
}
