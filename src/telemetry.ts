import { postRecord, runRecord, type Sink } from './run/telemetry';
import type { Controller } from './run/controller';
import { loadPref, savePref } from './ui/prefs';

/**
 * Anonymous results of finished runs (docs/TELEMETRY.md). The project URL and the public key of the Supabase project go
 * here; with either empty nothing is sent and the title screen says nothing about it. The key is the "anon" or
 * "publishable" one, which is meant to be public: the table only lets it insert. Never put the service key here.
 */
export const SINK: Sink = {
  url: 'https://rqehhconrbuxewrhqjnw.supabase.co',
  key: 'sb_publishable_mcqUSx6wYO-jZ6rkZx3XNg_8Ej144pW',
};

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

/** Not from the dev server, a local file or a test browser: only the published game counts. */
function published(): boolean {
  if (import.meta.env.DEV) return false;
  const h = window.location.hostname;
  return h !== '' && h !== 'localhost' && h !== '127.0.0.1' && !h.endsWith('.local');
}

const buildId = (): string => (typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'local');

/** Send the result of every run that ends on `c`, when sending is configured, on and the game is the published one. */
export function installTelemetry(c: Controller): void {
  c.onRunEnd = (run, res) => {
    if (!telemetryConfigured() || !telemetryOn() || !published()) return;
    void postRecord(
      (url, init) => fetch(url, init as RequestInit),
      SINK,
      runRecord(run, res, buildId()),
    );
  };
}
