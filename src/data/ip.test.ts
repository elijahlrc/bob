import { describe, expect, it } from 'vitest';
import { IP_DENY_LIST } from './ipDenyList';

const modules = import.meta.glob<Record<string, unknown>>(
  ['./**/*.ts', '!./**/*.test.ts', '!./ipDenyList.ts'],
  {
    eager: true,
  },
);

function collectStrings(v: unknown, out: string[], seen: Set<unknown>): void {
  if (typeof v === 'string') {
    out.push(v);
    return;
  }
  if (typeof v === 'function') {
    return;
  }
  if (v === null || typeof v !== 'object' || seen.has(v)) return;
  seen.add(v);
  if (Array.isArray(v)) for (const x of v) collectStrings(x, out, seen);
  else
    for (const [k, x] of Object.entries(v)) {
      out.push(k);
      collectStrings(x, out, seen);
    }
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Multi-word entries match anywhere as whole words. Single words match only when they are the
 * entire string (a gem or class *named* exactly like the reference) so ordinary words in our own
 * names ("Veil of Grace", "Haste flask") don't trip the scan. Entries prefixed with `=` are
 * descriptive phrases that only count as a slip when used as a whole name.
 */
export function ipViolations(strings: readonly string[]): string[] {
  const bad: string[] = [];
  for (const entry of IP_DENY_LIST) {
    const exact = entry.startsWith('=');
    const phrase = exact ? entry.slice(1) : entry;
    const multi = !exact && /\s/.test(phrase.trim());
    const re = multi
      ? new RegExp(`(^|[^a-z])${escape(phrase)}($|[^a-z])`, 'i')
      : new RegExp(`^\\s*${escape(phrase)}\\s*$`, 'i');
    for (const s of strings) if (re.test(s)) bad.push(`"${s}" matches "${entry}"`);
  }
  return bad;
}

describe('IP deny-list scan (DESIGN.md §3)', () => {
  it('finds the data modules', () => {
    expect(Object.keys(modules).length).toBeGreaterThan(0);
  });

  it('no string in src/data matches a reference-game proper noun', () => {
    const strings: string[] = [];
    const seen = new Set<unknown>();
    for (const m of Object.values(modules)) collectStrings(m, strings, seen);
    expect(ipViolations(strings)).toEqual([]);
  });

  it('the scanner catches a slip', () => {
    expect(ipViolations(['Resolute Technique']).length).toBe(1);
    expect(ipViolations(['Hatred']).length).toBe(1);
    expect(ipViolations(['Veil of Grace', 'Haste flask']).length).toBe(0);
  });
});
