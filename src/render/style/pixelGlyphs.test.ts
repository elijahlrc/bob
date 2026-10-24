import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FAMILIES, RARE_FIRST, RARE_SECOND } from '../../data/affixes';
import { BOB5, BOB7, GLYPH_ROWS, parseGlyph, type GlyphSet } from './pixelGlyphs';

function wellFormed(set: GlyphSet, rows: number): string[] {
  const bad: string[] = [];
  for (const ch of Object.keys(set)) {
    const g = parseGlyph(set, ch)!;
    if (!g.rows.every((r) => /^[#.]+$/.test(r) && r.length === g.w)) bad.push(`${ch}: ragged rows`);
    if (g.top < 0 || g.top + g.rows.length > rows) bad.push(`${ch}: outside ${rows} rows`);
  }
  return bad;
}

/** Every `name: '...'` in the game data, with the parts magic and rare item names are made of. */
function allNames(): string[] {
  const names: string[] = [];
  const walk = (dir: string) => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (p.endsWith('.ts') && !p.endsWith('.test.ts'))
        for (const m of readFileSync(p, 'utf8').matchAll(/\bname: (['"])((?:\\.|(?!\1).)*)\1/g))
          names.push(m[2].replace(/\\(.)/g, '$1'));
    }
  };
  walk(join(import.meta.dirname, '../../data'));
  for (const f of FAMILIES) names.push(...f.names);
  names.push(...RARE_FIRST, ...Object.values(RARE_SECOND).flat());
  return names;
}

describe('the map bitmap font', () => {
  it('has well-formed glyphs that stay inside their rows', () => {
    expect(wellFormed(BOB7, GLYPH_ROWS.bob7)).toEqual([]);
    expect(wellFormed(BOB5, GLYPH_ROWS.bob5)).toEqual([]);
  });

  it('has capitals and digits 7 rows high from the cap line, and lowercase on the same baseline', () => {
    for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
      const g = parseGlyph(BOB7, ch)!;
      expect([ch, g.top, g.rows.length]).toEqual([ch, 0, 7]);
    }
    for (const ch of 'acemnorsuvwxz') expect(parseGlyph(BOB7, ch)!.top + 5).toBe(7);
  });

  it('can write every name a drop or a floater shows', () => {
    const text = [...allNames(), 'Immune', 'miss', 'blocked', 'Level 100', 'Tablet: ×12'];
    const missing = new Set<string>();
    for (const n of text) for (const ch of n) if (BOB7[ch] === undefined) missing.add(ch);
    expect([...missing]).toEqual([]);
  });

  it('has small digits for every plain number', () => {
    for (const ch of '0123456789+-') expect(BOB5[ch]).toBeDefined();
  });
});
