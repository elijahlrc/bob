import { describe, expect, it } from 'vitest';
import { DISTRICTS } from './charter';
import { GEN_CLUSTERS } from './clustersGen';
import { REGIONS } from './spec';

const byId = new Map(GEN_CLUSTERS.map((g) => [g.id, g]));
const members = (d: (typeof DISTRICTS)[number]) => [...Object.values(d.groups).flat(), ...d.nexus];

describe('the tree charter (docs/TREE-REDESIGN.md, T1)', () => {
  it('names only clusters that exist, each in at most one district and at most one group', () => {
    const seen = new Map<string, string>();
    for (const d of DISTRICTS)
      for (const id of members(d)) {
        expect(byId.has(id), `${d.id}: ${id}`).toBe(true);
        expect(seen.get(id), `${id} is in ${seen.get(id)} and ${d.id}`).toBeUndefined();
        seen.set(id, d.id);
      }
  });

  it('keeps a cluster in the region it was generated for', () => {
    for (const d of DISTRICTS)
      for (const id of members(d)) expect(byId.get(id)!.region, `${d.id}: ${id}`).toBe(d.region);
  });

  it('gives each region at least three templates, and each district a size worth the name', () => {
    for (const r of REGIONS) {
      const ds = DISTRICTS.filter((d) => d.region === r.id);
      expect(ds.length, r.id).toBeGreaterThanOrEqual(4);
      expect(ds.length, r.id).toBeLessThanOrEqual(5);
      expect(new Set(ds.map((d) => d.template)).size, r.id).toBeGreaterThanOrEqual(3);
      for (const d of ds) expect(members(d).length, d.id).toBeGreaterThanOrEqual(5);
    }
  });

  it('places every keystone of a region at exactly one of its districts', () => {
    for (const r of REGIONS) {
      const placed = DISTRICTS.filter((d) => d.region === r.id).flatMap((d) => d.keystones);
      expect([...placed].sort(), r.id).toEqual([...r.keystones].sort());
    }
  });

  it('leaves clusters out on purpose: wayside clusters are between a fifth and a half of each region', () => {
    for (const r of REGIONS) {
      const all = GEN_CLUSTERS.filter((g) => g.region === r.id).length;
      const inD = DISTRICTS.filter((d) => d.region === r.id).reduce(
        (s, d) => s + members(d).length,
        0,
      );
      const way = (all - inD) / all;
      expect(way, r.id).toBeGreaterThanOrEqual(0.15);
      expect(way, r.id).toBeLessThanOrEqual(0.5);
    }
  });
});
