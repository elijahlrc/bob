/** Wiki versions are dotted numbers ("3.10.0"): compare them as numbers, never as strings. */
export function parseVersion(v: string): number[] {
  return v
    .trim()
    .split('.')
    .map((p) => parseInt(p, 10) || 0);
}

export function compareVersions(a: string, b: string): number {
  const x = parseVersion(a);
  const y = parseVersion(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

export function versionBefore(v: string, limit: string): boolean {
  return compareVersions(v, limit) < 0;
}

/**
 * True when `v` is at most the given major.minor line, whatever its patch ("3.9.2" is at most "3.9").
 * An unparsable version counts as late, not early.
 */
export function versionAtMost(v: string, majorMinor: string): boolean {
  const x = parseVersion(v);
  const y = parseVersion(majorMinor);
  if (x.length === 0 || Number.isNaN(x[0])) return false;
  const a = x[0] * 1000 + (x[1] ?? 0);
  const b = y[0] * 1000 + (y[1] ?? 0);
  return a <= b;
}
