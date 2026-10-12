/**
 * What the passive tree is made of and how it is arranged (docs/TREE-REDESIGN.md, T0): the measurements behind the plan, printed for
 * information. Nothing here is pass or fail; read a milestone's output as a difference from the one before. `npm run tree:audit`.
 */
import { GEN_CLUSTERS } from '../../src/data/tree/clustersGen';
import { REGIONS } from '../../src/data/tree/spec';
import type { Mod } from '../../src/mods/types';
import { DISTRICTS } from '../../src/data/tree/charter';
import { classOf, nodes, pct, playerSteps, regionOf, tree } from './lib';

const n = nodes.length;
const count = (kind: string) => nodes.filter((x) => x.kind === kind).length;
const regs = REGIONS.map((r) => r.id);
const med = (a: number[]) => [...a].sort((x, y) => x - y)[a.length >> 1];
const key = (m: Mod) =>
  [
    m.stat,
    m.kind,
    (m.tags ?? []).join('+'),
    (m.damageTypes ?? []).join('+'),
    m.condition?.id ?? '',
  ].join('|');

console.log('== Mix');
console.log(
  `nodes ${n}: ${(['notable', 'keystone', 'small', 'travel', 'start'] as const).map((k) => `${k} ${count(k)} (${pct(count(k), n)})`).join(', ')}`,
);
const edges = nodes.reduce((s, x) => s + x.links.length, 0) / 2;
const roadSmalls = nodes.filter((x) => x.kind === 'small' && !x.cluster).length;
console.log(
  `edges ${edges}, mean degree ${((2 * edges) / n).toFixed(2)}, loops ${edges - n + 1}, dead ends ${pct(nodes.filter((x) => x.links.length === 1).length, n)}, 3+ links ${pct(nodes.filter((x) => x.links.length >= 3).length, n)}`,
);
console.log(
  `notables with 2+ links ${pct(nodes.filter((x) => x.kind === 'notable' && x.links.length >= 2).length, count('notable'))}; ` +
    `road nodes (attribute dots ${count('travel')} + small nodes with no cluster ${roadSmalls}) ${pct(count('travel') + roadSmalls, n)}`,
);

console.log('\n== Regions (nodes, mean degree, dead ends, notables)');
for (const r of [...regs, 'hub'] as const) {
  const at = nodes.filter((x) => x.kind !== 'start' && regionOf(x) === r);
  const deg = at.reduce((s, x) => s + x.links.length, 0) / (at.length || 1);
  console.log(
    `${r.padEnd(7)} ${String(at.length).padStart(4)} nodes  degree ${deg.toFixed(2)}  dead ends ${pct(at.filter((x) => x.links.length === 1).length, at.length).padStart(4)}  notables ${at.filter((x) => x.kind === 'notable').length}`,
  );
}

console.log(
  "\n== Cluster families by region (generated clusters), and each family's top-region share",
);
console.log('family'.padEnd(14) + regs.map((r) => r.padStart(7)).join('') + '   total  top');
const fam = new Map<string, Record<string, number>>();
for (const g of GEN_CLUSTERS) {
  const r = fam.get(g.family) ?? {};
  r[g.region] = (r[g.region] ?? 0) + 1;
  fam.set(g.family, r);
}
for (const [f, r] of [...fam].sort()) {
  const tot = Object.values(r).reduce((a, b) => a + b, 0);
  console.log(
    f.padEnd(14) +
      regs.map((x) => String(r[x] ?? 0).padStart(7)).join('') +
      String(tot).padStart(8) +
      pct(Math.max(...Object.values(r)), tot).padStart(6),
  );
}

console.log('\n== Weapon-specific and skill-specific small nodes');
const WEAPON = [
  'sword',
  'axe',
  'mace',
  'staff',
  'wand',
  'bow',
  'claw',
  'dagger',
  'sceptre',
  'twoHanded',
  'oneHanded',
];
const SKILL = [
  'minion',
  'totem',
  'trap',
  'mine',
  'brand',
  'curse',
  'warcry',
  'aura',
  'channelling',
];
const weaponNiche = (x: { mods: Mod[] }) =>
  x.mods.some(
    (m) =>
      (m.tags ?? []).some((t) => WEAPON.includes(t)) ||
      /wield|dualWield|shield/i.test(m.condition?.id ?? ''),
  );
const skillNiche = (x: { mods: Mod[] }) =>
  x.mods.some((m) => (m.tags ?? []).some((t) => SKILL.includes(t)));
const smalls = nodes.filter((x) => x.kind === 'small');
console.log(
  `small nodes ${smalls.length}: weapon-specific ${smalls.filter(weaponNiche).length} (${pct(smalls.filter(weaponNiche).length, smalls.length)}), skill-type-specific ${smalls.filter(skillNiche).length} (${pct(smalls.filter(skillNiche).length, smalls.length)}), distinct names ${new Set(smalls.map((x) => x.name)).size}`,
);
console.log(
  `on a road (no cluster): weapon-specific ${nodes.filter((x) => x.kind === 'small' && !x.cluster && weaponNiche(x)).length}`,
);

console.log(
  '\n== Strength: a notable in units of the median small node of the same stat (crude: a stat no small node has reads 1.00)',
);
const vals = new Map<string, number[]>();
for (const x of smalls)
  for (const m of x.mods) (vals.get(key(m)) ?? vals.set(key(m), []).get(key(m))!).push(m.value);
const unit = new Map([...vals].map(([k, v]) => [k, med(v)]));
const power = (x: { mods: Mod[] }) =>
  x.mods.reduce((s, m) => s + m.value / (unit.get(key(m)) ?? m.value), 0);
const notables = nodes.filter((x) => x.kind === 'notable');
const np = notables.map((x) => ({ x, p: power(x) })).sort((a, b) => a.p - b.p);
console.log(
  `notables ${np.length}: min ${np[0].p.toFixed(2)}, p10 ${np[Math.floor(np.length * 0.1)].p.toFixed(2)}, median ${np[np.length >> 1].p.toFixed(2)}, p90 ${np[Math.floor(np.length * 0.9)].p.toFixed(2)}, max ${np[np.length - 1].p.toFixed(2)}; under 2.0: ${np.filter((e) => e.p < 2).length}, under 2.5: ${np.filter((e) => e.p < 2.5).length}`,
);
console.log(
  'weakest: ' +
    np
      .slice(0, 10)
      .map((e) => `${e.x.name} ${e.p.toFixed(2)}`)
      .join(' | '),
);
const lifeSmall = smalls.filter((x) => x.mods.some((m) => m.stat === 'life' && m.kind === 'inc'));
const lv = new Map<number, number>();
for (const x of lifeSmall) {
  const v = x.mods.find((m) => m.stat === 'life')!.value;
  lv.set(v, (lv.get(v) ?? 0) + 1);
}
console.log(
  `small maximum-life % values: ${[...lv]
    .sort((a, b) => a[0] - b[0])
    .map(([v, c]) => `${v}% x${c}`)
    .join(', ')}`,
);

console.log("\n== Cluster coherence (the cluster's small nodes share a stat with its notable)");
let hit = 0;
const bad: string[] = [];
for (const g of GEN_CLUSTERS) {
  const a = new Set(g.notable.mods.map((m) => m.stat));
  if (g.small.mods.some((m) => a.has(m.stat))) hit++;
  else bad.push(`${g.notable.name} vs ${g.small.name}`);
}
console.log(
  `${hit} of ${GEN_CLUSTERS.length} (${pct(hit, GEN_CLUSTERS.length)}); first misses: ${bad.slice(0, 5).join(' | ')}`,
);

console.log('\n== Routes: the shortest way from each class start to every notable and keystone');
for (const reg of REGIONS) {
  const start = tree.starts[reg.classId];
  const prev = new Map<number, number>([[start, -1]]);
  const q = [start];
  for (let h = 0; h < q.length; h++)
    for (const m of nodes[q[h]].links)
      if (!prev.has(m)) {
        prev.set(m, q[h]);
        q.push(m);
      }
  const targets = nodes.filter((x) => x.kind === 'notable' || x.kind === 'keystone');
  const tally = { travel: 0, cluster: 0, road: 0, notable: 0, total: 0 };
  const traffic = new Map<number, number>();
  for (const t of targets)
    for (let c = prev.get(t.id)!; c !== -1 && c !== undefined && c !== start; c = prev.get(c)!) {
      const x = nodes[c];
      tally.total++;
      traffic.set(c, (traffic.get(c) ?? 0) + 1);
      if (x.kind === 'travel') tally.travel++;
      else if (x.kind === 'notable') tally.notable++;
      else if (x.kind === 'small' && x.cluster) tally.cluster++;
      else if (x.kind === 'small') tally.road++;
    }
  const busy = [...traffic].filter(([, v]) => v >= targets.length * 0.05).map(([id]) => nodes[id]);
  const busySmalls = busy.filter((x) => x.kind === 'small');
  console.log(
    `${reg.id.padEnd(7)} ${(tally.total / targets.length).toFixed(0).padStart(3)} mid nodes/route: attribute ${pct(tally.travel, tally.total)}, cluster small ${pct(tally.cluster, tally.total)}, road small ${pct(tally.road, tally.total)}, notable ${pct(tally.notable, tally.total)}; busy nodes ${busy.length} (small ${busySmalls.length}, weapon-specific ${busySmalls.filter(weaponNiche).length}, skill-specific ${busySmalls.filter(skillNiche).length})`,
  );
}

console.log('\n== Distances (steps along links)');
const first = (d: number[], kind: string) =>
  Math.min(...nodes.filter((x) => x.kind === kind && d[x.id] > 0).map((x) => d[x.id]));
for (const reg of REGIONS) {
  const d = playerSteps(tree.starts[reg.classId]);
  const others = REGIONS.filter((o) => o.id !== reg.id).map(
    (o) => `${o.id} ${d[tree.starts[o.classId]]}`,
  );
  const ks = nodes
    .filter((x) => x.kind === 'keystone')
    .map((x) => d[x.id])
    .sort((a, b) => a - b);
  console.log(
    `${reg.id.padEnd(7)} first notable ${first(d, 'notable')}, first keystone ${first(d, 'keystone')}, keystones: nearest ${ks[0]}, median ${ks[ks.length >> 1]}, farthest ${ks[ks.length - 1]}; other starts: ${others.join(', ')}`,
  );
}
const reachCheck = REGIONS.map((r) => {
  const d = playerSteps(tree.starts[r.classId]);
  return `${classOf(r.id)}: ${nodes.filter((x) => x.kind === 'keystone' && d[x.id] <= 40).length} keystones within 40, ${nodes.filter((x) => x.kind === 'notable' && d[x.id] <= 30).length} notables within 30`;
});
console.log('reach: ' + reachCheck.join('; '));

console.log(
  '\n== Districts: steps from each class start to the nearest notable of each district (never through another start)',
);
for (const reg of REGIONS) {
  const d = playerSteps(tree.starts[reg.classId]);
  const near = (id: string) =>
    Math.min(
      ...nodes
        .filter((x) => x.district === id && x.kind === 'notable')
        .map((x) => (d[x.id] < 0 ? 999 : d[x.id])),
    );
  const own = DISTRICTS.filter((x) => x.region === reg.id).map((x) => `${x.id} ${near(x.id)}`);
  const unreachable = nodes.filter((x) => d[x.id] < 0).length;
  const others = DISTRICTS.filter((x) => x.region !== reg.id)
    .map((x) => near(x.id))
    .sort((a, b) => a - b);
  console.log(
    `${reg.id.padEnd(7)} own: ${own.join(', ')}; nodes a player cannot reach ${unreachable}; other regions' districts: nearest ${others[0]}, median ${others[others.length >> 1]}`,
  );
}
