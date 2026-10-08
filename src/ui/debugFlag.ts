import { loadPref, savePref } from './prefs';

/**
 * Whether the debug controls are shown (docs/ENEMIES.md 8.3): in a dev build, when the address has `?debug`, or when the
 * pref `debug` has been set once with it. A published build shows nothing otherwise.
 */
export function debugEnabled(): boolean {
  try {
    if (import.meta.env.DEV) return true;
    if (new URLSearchParams(window.location.search).has('debug')) {
      savePref('debug', true);
      return true;
    }
  } catch {
    // No window or no address: the controls stay hidden.
  }
  return loadPref('debug', false);
}
