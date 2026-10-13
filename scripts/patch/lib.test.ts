import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  bullet,
  entriesOf,
  filedProblems,
  fileNotes,
  lintNote,
  lintNotes,
  parsePending,
} from './lib';

const FILE = `# Patch notes

Intro.

## 2026-10-11

- Old note.

### Strategy

- Strategy note.

## 2026-10-10

- Older note.
`;

describe('patch notes style rules', () => {
  it('accepts a plain player-facing note', () => {
    expect(
      lintNote('Spirit Saw hits a lone target far less hard, and is still best in a crowd.'),
    ).toEqual([]);
  });
  it.each([
    ['**bold** text', 'markdown'],
    ['Use `code` here.', 'markdown'],
    ['I rebalanced Spirit Saw.', 'first person'],
    ['Torch Arrow is unchanged.', 'did not'],
    ['See docs/BOSSES.md.', 'file names'],
    ['Works like Path of Exile 3.9 did.', 'reference-game'],
    ['Fixed a flaky test in the sim.', 'internal'],
    ['x'.repeat(300), 'too long'],
  ])('rejects %s', (text, why) => {
    expect(lintNote(text).join(' ')).toContain(why);
  });
  it('rejects a release of too many notes', () => {
    const notes = Array.from({ length: 13 }, (_, i) => ({ text: `Note ${i}.`, section: null }));
    expect(lintNotes(notes).join(' ')).toContain('13 notes');
  });
});

describe('filing notes', () => {
  it('reads the queue, with headings and wrapped lines', () => {
    expect(parsePending('- One\n  more.\n# Interface\n- Two.\n')).toEqual([
      { text: 'One more.', section: null },
      { text: 'Two.', section: 'Interface' },
    ]);
  });
  it('adds to the end of a day own list, before its first section', () => {
    const out = fileNotes(FILE, '2026-10-11', [{ text: 'New note.', section: null }]);
    expect(out).toContain('- Old note.\n- New note.\n\n### Strategy');
  });
  it('adds under an existing section, and makes a missing one', () => {
    const out = fileNotes(FILE, '2026-10-11', [
      { text: 'More strategy.', section: 'Strategy' },
      { text: 'A fix.', section: 'Interface' },
    ]);
    expect(out).toContain('- Strategy note.\n- More strategy.\n\n### Interface');
    expect(out).toContain('### Interface\n\n- A fix.\n\n## 2026-10-10');
  });
  it('makes a new day at the top, under the intro', () => {
    const out = fileNotes(FILE, '2026-10-12', [{ text: 'New day.', section: null }]);
    expect(out.indexOf('## 2026-10-12')).toBeLessThan(out.indexOf('## 2026-10-11'));
    expect(out).toContain('## 2026-10-12\n\n- New day.\n\n## 2026-10-11');
    expect(out).toContain('Intro.\n\n## 2026-10-12');
  });
  it('wraps a long note as a bullet', () => {
    const b = bullet('word '.repeat(60).trim());
    expect(b.split('\n').every((l) => l.length <= 130)).toBe(true);
    expect(b.startsWith('- ')).toBe(true);
  });
  it('reads every entry of a file back', () => {
    expect(entriesOf(FILE).map((n) => n.text)).toEqual([
      'Old note.',
      'Strategy note.',
      'Older note.',
    ]);
  });
});

describe('docs/PATCH-NOTES.md', () => {
  it('every entry fits the style rules', () => {
    const file = readFileSync(new URL('../../docs/PATCH-NOTES.md', import.meta.url), 'utf8');
    expect(filedProblems(file)).toEqual([]);
  });
});
