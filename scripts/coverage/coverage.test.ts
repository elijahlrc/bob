import { describe, expect, it } from 'vitest';
import { compareVersions, versionAtMost, versionBefore } from './version';
import { gemBucket, uniqueBucket } from './buckets';
import { loadMap, report, rows, validateMap } from './coverage';
import { key, loadReference } from './reference';

describe('reference list (docs/coverage/reference-3.9.0.json)', () => {
  const ref = loadReference();

  it('has the gem denominator of COVERAGE C-5', () => {
    expect(ref.gems.filter((g) => g.kind === 'active').length).toBe(219);
    expect(ref.gems.filter((g) => g.kind === 'support').length).toBe(130);
  });

  it('has the unique denominator of COVERAGE C-6', () => {
    expect(ref.uniques.length).toBe(782);
    expect(ref.uniques.filter((u) => /Flask$/.test(u.class)).length).toBe(26);
  });

  it('has no duplicate names and no excluded classes', () => {
    for (const list of [ref.gems, ref.uniques]) {
      const names = list.map((e) => key(e.name));
      expect(new Set(names).size).toBe(names.length);
    }
    expect(ref.uniques.some((u) => /Jewel|^Map$/.test(u.class))).toBe(false);
    expect(ref.gems.some((g) => /^Awakened |Vaal /.test(g.name))).toBe(false);
  });

  it('every entry falls in exactly one bucket', () => {
    for (const g of ref.gems) expect(gemBucket(g)).toBeTruthy();
    for (const u of ref.uniques) expect(uniqueBucket(u)).toBeTruthy();
  });
});

describe('map.json', () => {
  const map = loadMap();

  it('is sound: every Bob id is mapped and every mapping points at a real reference name', () => {
    expect(validateMap(map)).toEqual([]);
  });

  it('counts a reference entry at most once however many Bob entries map to it', () => {
    const rs = rows(map);
    const names = rs.map((r) => key(r.name));
    expect(new Set(names).size).toBe(names.length);
  });

  it('prints a report', () => {
    expect(report(map, false)).toContain('All gems');
  });
});

describe('version comparison', () => {
  it('compares dotted versions as numbers, not strings', () => {
    expect(compareVersions('3.10.0', '3.9.0')).toBe(1);
    expect(versionBefore('3.10.0', '3.9.0')).toBe(false);
    expect(versionBefore('3.2.1', '3.9.0')).toBe(true);
    expect(versionAtMost('3.9.2', '3.9')).toBe(true);
    expect(versionAtMost('3.10.0', '3.9')).toBe(false);
    expect(versionAtMost('1.0.1', '3.9')).toBe(true);
  });
});

describe('generated uniques', () => {
  it('src/data/uniquesGen.ts is exactly what the decisions produce (nothing hand-edited, nothing stale)', async () => {
    const { render, loadDecisions, OUT } = await import('./emit-uniques');
    const { readFileSync } = await import('node:fs');
    expect(readFileSync(OUT, 'utf8')).toBe((await render(loadDecisions())).text);
  });

  it('every decision has our own name, a flavour line and a note', async () => {
    const { loadDecisions } = await import('./emit-uniques');
    for (const d of loadDecisions()) {
      expect(d.name.length).toBeGreaterThan(2);
      expect(d.flavour.length).toBeGreaterThan(5);
      expect(d.note.length).toBeGreaterThan(5);
    }
  });
});
