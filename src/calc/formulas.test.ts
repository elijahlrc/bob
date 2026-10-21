import { readFileSync } from 'node:fs';
import { hasReference } from '../../scripts/coverage/reference';
import { describe, expect, it } from 'vitest';
import {
  armourReduction,
  effectiveRes,
  hitChance,
  levelPenalty,
  mag,
  monsterAccuracy,
  monsterEvasion,
  stunChance,
} from './formulas';

// The table is in the local reference data (scripts/coverage/reference.ts): without it this skips. It is read inside the test,
// since a skipped describe's body still runs to collect its tests.
describe.skipIf(!hasReference())(
  '§12.1 monster evasion and accuracy follow the reference tables (docs/EVASION.md)',
  () => {
    it('evasion is the table to the unit, accuracy within two points', () => {
      const table = JSON.parse(
        readFileSync(
          new URL('../../reference/coverage/ref-monster-stats.json', import.meta.url),
          'utf8',
        ),
      ) as { evasion: number[]; accuracy: number[] };
      table.evasion.forEach((v, i) => expect(monsterEvasion(i + 1)).toBe(v));
      table.accuracy.forEach((v, i) =>
        expect(Math.abs(monsterAccuracy(i + 1) - v)).toBeLessThanOrEqual(2),
      );
    });
  },
);

describe('§6.3 defences', () => {
  it('hit chance', () => {
    expect(hitChance(100, 0)).toBe(1);
    // 3.9: the attacker's accuracy counts 15% extra, and the chance tops out at 100%.
    expect(hitChance(100, 400)).toBeCloseTo((1.15 * 100) / (100 + Math.pow(100, 0.8)));
    expect(hitChance(1000, 400)).toBe(1);
    expect(hitChance(0, 1000)).toBe(0.05);
  });
  it('armour', () => {
    expect(armourReduction(1000, 100)).toBeCloseTo(0.5);
    expect(armourReduction(1e9, 1)).toBe(0.9);
    expect(armourReduction(0, 100)).toBe(0);
  });
  it('resistances', () => {
    expect(effectiveRes(90, 75)).toBe(75);
    expect(effectiveRes(40, 75, 20)).toBe(20);
    expect(effectiveRes(-300, 75)).toBe(-200);
  });
});

describe('§6.6 ailments', () => {
  it('mag', () => {
    // 50 · r^0.4 · (1 + effect), capped (3.9).
    expect(mag(0.5, 50)).toBeCloseTo(50 * Math.pow(0.5, 0.4));
    expect(mag(0.125, 50)).toBeCloseTo(50 * Math.pow(0.125, 0.4));
    expect(mag(1, 50)).toBe(50);
    expect(mag(0.5, 50, 2)).toBe(50); // the effect bonus counts before the cap
    expect(mag(0.5, 30)).toBe(30);
    expect(mag(0.125, 30)).toBeCloseTo(50 * Math.pow(0.125, 0.4));
    expect(mag(0, 30)).toBe(0);
  });
});

describe('§6.6a stun', () => {
  it('chance with minimum', () => {
    expect(stunChance(50, 100, 0.2)).toBe(1);
    expect(stunChance(15, 100, 0.2)).toBeCloseTo(0.3);
    expect(stunChance(10, 100, 0.2)).toBe(0); // a chance at or under 20% is ignored (3.9)
  });
});

describe('§5.4 experience', () => {
  it('level penalty', () => {
    expect(levelPenalty(10, 10)).toBe(1);
    expect(levelPenalty(10, 13)).toBe(1);
    expect(levelPenalty(10, 15)).toBeLessThan(1);
  });
});
