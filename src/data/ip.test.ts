import { describe, expect, it } from 'vitest';
import {
  bare,
  hasReference,
  loadDenyList,
  loadRefNames,
  loadReference,
} from '../../scripts/coverage/reference';
import { ipViolations } from './ipScan';

const modules = import.meta.glob<Record<string, unknown>>(['./**/*.ts', '!./**/*.test.ts'], {
  eager: true,
});

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

/** The reference data is local to the owner's machine (scripts/coverage/reference.ts): without it these checks skip. */
describe.skipIf(!hasReference())('IP deny-list scan (DESIGN.md §3)', () => {
  it('finds the data modules', () => {
    expect(Object.keys(modules).length).toBeGreaterThan(0);
  });

  it('no string in src/data matches a reference-game proper noun', () => {
    const strings: string[] = [];
    const seen = new Set<unknown>();
    for (const m of Object.values(modules)) collectStrings(m, strings, seen);
    expect(ipViolations(strings, loadDenyList())).toEqual([]);
  });

  it('no gem or unique is named like a reference entry (reference/coverage/ref-list.json)', () => {
    const ref = loadReference();
    const denied = new Map<string, string>();
    for (const g of ref.gems) denied.set(bare(g.name), `gem "${g.name}"`);
    for (const u of ref.uniques) denied.set(bare(u.name), `unique "${u.name}"`);
    const older = loadRefNames();
    for (const n of older.gems) denied.set(bare(n), `gem "${n}" (an older name)`);
    for (const n of older.uniques) denied.set(bare(n), `unique "${n}" (an older name)`);
    const names: string[] = [];
    collectNameValues(modules, names, new Set());
    const bad = names
      .filter((n) => denied.has(bare(n)))
      .map((n) => `"${n}" is ${denied.get(bare(n))}`);
    expect(bad).toEqual([]);
  });

  it('the reference name scan catches a slip', () => {
    const ref = loadReference();
    const names = new Set([...ref.gems, ...ref.uniques].map((e) => bare(e.name)));
    expect(ref.uniques.length).toBeGreaterThan(700);
    // A reference name, in another case and spacing, is still found.
    expect(names.has(bare(`  ${ref.uniques[0].name.toUpperCase()} `))).toBe(true);
  });

  it('the scanner catches a slip', () => {
    const list = loadDenyList();
    const single = list.find((e) => !e.startsWith('=') && !/\s/.test(e))!;
    const phrase = list.find((e) => !e.startsWith('=') && /\s/.test(e))!;
    expect(ipViolations([single], list).length).toBe(1);
    expect(ipViolations([`The ${phrase} of old`], list).length).toBe(1);
    expect(ipViolations(['Veil of Grace', 'Haste flask'], list).length).toBe(0);
  });
});
