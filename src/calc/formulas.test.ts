import { describe, expect, it } from 'vitest';
import {
  armourReduction,
  baseXp,
  effectiveRes,
  hitChance,
  levelPenalty,
  mag,
  monsterAccuracy,
  monsterArmour,
  monsterEvasion,
  monsterHit,
  monsterLife,
  stunChance,
} from './formulas';

describe('§12.1 monster scaling fixtures', () => {
  const rows = [
    [1, 31, 5, 34, 42, 30, 8],
    [10, 139, 28, 160, 150, 120, 63],
    [25, 359, 107, 370, 330, 270, 241],
    [50, 1089, 318, 720, 630, 520, 694],
    [75, 3948, 604, 1070, 930, 770, 1296],
    [100, 18354, 955, 1420, 1230, 1020, 2020],
  ];
  for (const [m, life, hit, acc, eva, arm, xp] of rows) {
    it(`level ${m}`, () => {
      expect(monsterLife(m)).toBe(life);
      expect(Math.round(monsterHit(m))).toBe(hit);
      expect(monsterAccuracy(m)).toBe(acc);
      expect(monsterEvasion(m)).toBe(eva);
      expect(monsterArmour(m)).toBe(arm);
      expect(baseXp(m)).toBe(xp);
    });
  }
});

describe('§6.3 defences', () => {
  it('hit chance', () => {
    expect(hitChance(100, 0)).toBe(1);
    expect(hitChance(1000, 400)).toBeCloseTo(1000 / (1000 + Math.pow(100, 0.8)));
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
    expect(mag(0.5, 50)).toBe(50);
    expect(mag(0.125, 50)).toBeCloseTo(25);
    expect(mag(0, 30)).toBe(0);
  });
});

describe('§6.6a stun', () => {
  it('chance with minimum', () => {
    expect(stunChance(50, 100, 0.1)).toBe(1);
    expect(stunChance(10, 100, 0.1)).toBeCloseTo(0.2);
    expect(stunChance(4, 100, 0.1)).toBe(0);
  });
});

describe('§5.4 experience', () => {
  it('level penalty', () => {
    expect(levelPenalty(10, 10)).toBe(1);
    expect(levelPenalty(10, 13)).toBe(1);
    expect(levelPenalty(10, 15)).toBeCloseTo(0.76);
    expect(levelPenalty(1, 100)).toBe(0.05);
  });
});
