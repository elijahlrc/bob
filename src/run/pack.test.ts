import { describe, expect, it } from 'vitest';
import { LEGACY } from '../data/difficulty';
import { botRun } from './bot';
import { pack, unpack } from './pack';

describe('pack', () => {
  it('gives back what it was given', () => {
    for (const s of [
      '',
      'a',
      'ab',
      'aaaaaaaaaaaaaaaaaaaaaaaa',
      'abcabcabcabcabc',
      '×1.10 – “quoted” 😀 日本語',
    ])
      expect(unpack(pack(s))).toBe(s);
  });

  it('survives a dictionary that fills up and starts over', () => {
    // Pseudo-random words from a small alphabet: many distinct phrases, so the dictionary fills several times over.
    let x = 12345;
    const rnd = () => (x = (x * 1103515245 + 12345) % 2147483648) / 2147483648;
    let s = '';
    while (s.length < 400_000) s += String.fromCharCode(33 + Math.floor(rnd() * 90));
    const p = pack(s);
    expect(unpack(p)).toBe(s);
    // Whatever it stores is plain characters: none of the control range, none of the surrogates.
    for (let i = 0; i < p.length; i++) {
      const c = p.charCodeAt(i);
      expect(c >= 0x100 && c < 0xd800).toBe(true);
    }
  });

  it('long runs of one character (a code that is read before it is defined)', () => {
    const s = 'x'.repeat(200_000);
    expect(unpack(pack(s))).toBe(s);
    expect(pack(s).length).toBeLessThan(2000);
  });

  it('a save takes a fraction of its length', () => {
    let json = '';
    botRun('strider', 3, 12, {
      difficulty: LEGACY,
      onTick: (_w, run) => {
        if (!json && run.map >= 12) json = JSON.stringify({ version: run.version, run });
      },
    });
    expect(json.length).toBeGreaterThan(5000);
    const p = pack(json);
    expect(unpack(p)).toBe(json);
    expect(p.length).toBeLessThan(json.length / 3);
  }, 60000);

  it('rejects text that is not packed', () => {
    expect(() => unpack('{"version":1}')).toThrow();
  });
});
