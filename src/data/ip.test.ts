import { describe, expect, it } from 'vitest';
import { bare, loadPobNames, loadReference } from '../../scripts/coverage/reference';
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

/** The value of every `name` property, at any depth: those are the player-visible names. */
function collectNameValues(v: unknown, out: string[], seen: Set<unknown>): void {
  if (v === null || typeof v !== 'object' || seen.has(v)) return;
  seen.add(v);
  if (Array.isArray(v)) {
    for (const x of v) collectNameValues(x, out, seen);
    return;
  }
  for (const [k, x] of Object.entries(v)) {
    if (k === 'name' && typeof x === 'string') out.push(x);
    else collectNameValues(x, out, seen);
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

  it('no gem or unique is named like a reference entry (docs/coverage/reference-3.9.0.json)', () => {
    const ref = loadReference();
    const denied = new Map<string, string>();
    for (const g of ref.gems) denied.set(bare(g.name), `gem "${g.name}"`);
    for (const u of ref.uniques) denied.set(bare(u.name), `unique "${u.name}"`);
    const pob = loadPobNames();
    for (const n of pob.gems) denied.set(bare(n), `gem "${n}" (3.9-era name)`);
    for (const n of pob.uniques) denied.set(bare(n), `unique "${n}" (3.9-era name)`);
    const names: string[] = [];
    collectNameValues(modules, names, new Set());
    const bad = names
      .filter((n) => denied.has(bare(n)))
      .map((n) => `"${n}" is ${denied.get(bare(n))}`);
    expect(bad).toEqual([]);
  });

  it('the reference deny-list scan catches a slip', () => {
    const ref = loadReference();
    const names = new Set([...ref.gems, ...ref.uniques].map((e) => bare(e.name)));
    expect(names.has(bare('Mjölner'))).toBe(true);
    expect(names.has(bare('Poet’s Pen'))).toBe(true);
    expect(ref.uniques.length).toBeGreaterThan(700);
  });

  it('the scanner catches a slip', () => {
    expect(ipViolations(['Resolute Technique']).length).toBe(1);
    expect(ipViolations(['Hatred']).length).toBe(1);
    expect(ipViolations(['Veil of Grace', 'Haste flask']).length).toBe(0);
  });
});
