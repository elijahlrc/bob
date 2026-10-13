import { describe, expect, it } from 'vitest';
import { DENSITIES, densityFor, type DensityId } from '../data/density';
import { LEGACY } from '../data/difficulty';
import { makeMapPlan } from './mapPlan';

const plans = (style: DensityId, map = 30, n = 24) =>
  Array.from({ length: n }, (_, i) =>
    makeMapPlan(i * 101 + 7, map, 'ashenCrypt', [], map, 'plain', 0, LEGACY, 0, 'crypt', style),
  );
const total = (ps: ReturnType<typeof plans>) =>
  ps.reduce((a, p) => a + p.pop.monsters.length, 0) / ps.length;

describe('density (docs/MAP-VARIETY.md 3.3)', () => {
  it('a pack follows the size of its room', () => {
    const small: number[] = [];
    const big: number[] = [];
    for (const p of plans('standard', 30, 60)) {
      for (const r of p.lab.rooms) {
        if (r.kind !== 'main') continue;
        const n = p.pop.monsters.filter((m) => m.room === r.id).length;
        (r.rect.w * r.rect.h <= 49 ? small : big).push(n);
      }
    }
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(small.length).toBeGreaterThan(5);
    expect(avg(big)).toBeGreaterThan(avg(small) + 1);
  });

  it('sparse has fewer monsters than standard, and packed more', () => {
    const [std, sparse, packed] = [plans('standard'), plans('sparse'), plans('packed')].map(total);
    expect(sparse).toBeLessThan(std * 0.8);
    expect(packed).toBeGreaterThan(std * 1.25);
  });

  it('clustered leaves rooms empty but keeps the crowd, scattered splits it into more packs', () => {
    const std = plans('standard');
    const clustered = plans('clustered');
    const emptyRooms = (ps: typeof std) =>
      ps.reduce(
        (a, p) =>
          a +
          p.lab.rooms.filter(
            (r) =>
              (r.kind === 'main' || r.kind === 'side') &&
              !p.pop.monsters.some((m) => m.room === r.id),
          ).length,
        0,
      );
    expect(emptyRooms(clustered)).toBeGreaterThan(emptyRooms(std) + 5);
    expect(total(clustered)).toBeGreaterThan(total(std) * 0.8);
    expect(total(clustered)).toBeLessThan(total(std) * 1.4);
    const packs = (ps: typeof std) =>
      ps.reduce((a, p) => a + new Set(p.pop.monsters.map((m) => m.pack)).size, 0);
    expect(packs(plans('scattered'))).toBeGreaterThan(packs(std) * 1.4);
  });

  it('every map has monsters, whatever its style', () => {
    for (const d of DENSITIES)
      for (const p of plans(d.id, 12, 20)) expect(p.pop.monsters.length).toBeGreaterThan(0);
  });

  it('the roll is fixed by the offer, standard where it must be, and all styles turn up', () => {
    expect(densityFor(3, '2.1', 2, 'plain')).toBe('standard');
    expect(densityFor(3, '20.0', 20, 'plain')).toBe('standard');
    expect(densityFor(3, '30.1', 30, 'throng')).toBe('standard');
    expect(densityFor(3, '30.1', 30, 'plain')).toBe(densityFor(3, '30.1', 30, 'plain'));
    const seen = new Set<string>();
    for (let s = 1; s <= 80; s++) seen.add(densityFor(s, '31.1', 31, 'plain'));
    expect(seen.size).toBe(DENSITIES.length);
  });
});
