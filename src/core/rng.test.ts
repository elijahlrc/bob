import { describe, expect, it } from 'vitest';
import { Rng } from './rng';

describe('Rng (sfc32)', () => {
  it('is reproducible from the same seed', () => {
    const a = new Rng(1234);
    const b = new Rng(1234);
    for (let i = 0; i < 100; i++) expect(a.nextU32()).toBe(b.nextU32());
  });

  it('differs across seeds', () => {
    const a = new Rng(1);
    const b = new Rng(2);
    let same = 0;
    for (let i = 0; i < 100; i++) if (a.nextU32() === b.nextU32()) same++;
    expect(same).toBeLessThan(3);
  });

  it('accepts string seeds', () => {
    expect(new Rng('abc').next()).toBe(new Rng('abc').next());
  });

  it('next() is in [0,1) with a sane mean and spread', () => {
    const r = new Rng(42);
    let sum = 0;
    let sumSq = 0;
    const n = 100000;
    for (let i = 0; i < n; i++) {
      const x = r.next();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
      sum += x;
      sumSq += x * x;
    }
    const mean = sum / n;
    const variance = sumSq / n - mean * mean;
    expect(mean).toBeCloseTo(0.5, 2);
    expect(variance).toBeCloseTo(1 / 12, 2);
  });

  it('int(a, b) covers the inclusive range uniformly', () => {
    const r = new Rng(7);
    const counts = new Array(6).fill(0);
    const n = 60000;
    for (let i = 0; i < n; i++) counts[r.int(1, 6) - 1]++;
    for (const c of counts) expect(Math.abs(c - n / 6)).toBeLessThan(n * 0.01);
  });

  it('float(a, b) stays in range', () => {
    const r = new Rng(9);
    for (let i = 0; i < 1000; i++) {
      const x = r.float(-2, 3);
      expect(x).toBeGreaterThanOrEqual(-2);
      expect(x).toBeLessThan(3);
    }
  });

  it('weighted() respects weights', () => {
    const r = new Rng(11);
    const counts = { a: 0, b: 0, c: 0 };
    const n = 40000;
    for (let i = 0; i < n; i++) counts[r.weighted(['a', 'b', 'c'] as const, [1, 3, 0])]++;
    expect(counts.c).toBe(0);
    expect(counts.b / counts.a).toBeGreaterThan(2.7);
    expect(counts.b / counts.a).toBeLessThan(3.3);
  });

  it('pick() returns members', () => {
    const r = new Rng(3);
    const xs = [10, 20, 30];
    for (let i = 0; i < 50; i++) expect(xs).toContain(r.pick(xs));
  });

  it('fork() is label-based and independent of draw order', () => {
    const a = new Rng(5);
    const b = new Rng(5);
    b.next();
    b.next();
    expect(a.fork('loot').nextU32()).toBe(b.fork('loot').nextU32());
    expect(a.fork('loot').nextU32()).not.toBe(a.fork('combat').nextU32());
    expect(a.fork('x').fork('y').nextU32()).toBe(b.fork('x').fork('y').nextU32());
  });

  it('state round-trips', () => {
    const a = new Rng(99);
    a.next();
    const b = Rng.fromState(a.getState(), a.key);
    for (let i = 0; i < 10; i++) expect(b.nextU32()).toBe(a.nextU32());
  });
});
