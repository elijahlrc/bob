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

  it('places every keystone of a region at exactly one of its districts', () => {
    for (const r of REGIONS) {
      const placed = DISTRICTS.filter((d) => d.region === r.id).flatMap((d) => d.keystones);
      expect([...placed].sort(), r.id).toEqual([...r.keystones].sort());
    }
  });
});
