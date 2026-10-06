/** Per-viewer UI preferences (sort order, filters). Storage may be unavailable; never throws. */
const PREFIX = 'bob.pref.';

export function loadPref<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function savePref(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Ignore: preferences are a convenience only.
  }
}
