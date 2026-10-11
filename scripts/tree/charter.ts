/**
 * The supply of the charter (docs/TREE-REDESIGN.md, T1): per region, each district with its groups, and the clusters left to
 * stand beside a road. `npm run tree:charter`. The checks themselves are in `src/data/tree/charter.test.ts`.
 */
import { DISTRICTS, districtOf } from '../../src/data/tree/charter';
import { GEN_CLUSTERS } from '../../src/data/tree/clustersGen';
import { REGIONS } from '../../src/data/tree/spec';

const byId = new Map(GEN_CLUSTERS.map((g) => [g.id, g]));
for (const r of REGIONS) {
  const all = GEN_CLUSTERS.filter((g) => g.region === r.id);
  const inD = all.filter((g) => districtOf(g.id));
  console.log(
    `\n== ${r.id}: ${all.length} clusters, ${inD.length} in districts, ${all.length - inD.length} wayside`,
  );
  for (const d of DISTRICTS.filter((x) => x.region === r.id)) {
    const groups = Object.entries(d.groups)
      .map(([k, v]) => `${k} ${v.length}`)
      .join(', ');
    console.log(
      `  ${d.name.padEnd(18)} ${d.template.padEnd(7)} ${groups}; nexus ${d.nexus.map((id) => byId.get(id)?.notable.name).join(', ') || '-'}; tip ${d.keystones.join(', ') || '-'}`,
    );
  }
  const way = all.filter((g) => !districtOf(g.id));
  const byFam = new Map<string, number>();
  for (const g of way) byFam.set(g.family, (byFam.get(g.family) ?? 0) + 1);
  console.log(`  wayside by family: ${[...byFam].map(([f, n]) => `${f} ${n}`).join(', ')}`);
}
