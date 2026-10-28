import { describe, expect, it } from 'vitest';
import { CHORDS, PROGRESSIONS, near, pcOf, scaleStep, voicing } from './music';

describe('the music (docs/AUDIO.md)', () => {
  it('voices every chord with all its notes, and moves little from one chord to the next', () => {
    for (const p of PROGRESSIONS) {
      let prev: number[] | null = null;
      for (const id of [...p.chords, ...p.chords]) {
        const chord = CHORDS[id];
        const v = voicing(chord, prev);
        expect(v).toHaveLength(4);
        expect(new Set(v.map(pcOf))).toEqual(new Set(chord.pcs));
        if (prev)
          expect(v.reduce((s, m, i) => s + Math.abs(m - prev![i]!), 0)).toBeLessThanOrEqual(10);
        prev = v;
      }
    }
  });

  it('finds the nearest note of a pitch class and steps along D minor', () => {
    expect(near(0, 40, 33, 45)).toBe(38); // D2 nearest E2
    expect(scaleStep(62, 1)).toBe(64); // D to E
    expect(scaleStep(64, 1)).toBe(65); // E to F, a half step in D minor
    expect(scaleStep(62, -1)).toBe(60); // D down to C
  });
});
