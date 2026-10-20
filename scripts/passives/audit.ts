/**
 * The brief's checks on the hand-written tree (docs/tree/design/C-brief.md, "the check" under each section), printed.
 * Nothing passes or fails here; the tests do that once the tree is complete.
 *
 *   npx tsx scripts/passives/audit.ts [region]
 */
import { AREAS, buildAll } from '../../src/data/passives';
import type { NodeSpec } from '../../src/data/passives/types';

const region = process.argv[2];
const built = buildAll({ allowNew: true });
const { nodes, starts } = built.tree;
const ids = built.ids;
const live = (i: number) => nodes[i].name !== '(retired)';

// ---- Lookups from the specs: units per node, keystone names.
const spec = new Map<string, NodeSpec>();
for (const a of AREAS)
  for (const c of a.clusters) for (const n of c.nodes) spec.set(`${a.id}.${c.id}.${n.id}`, n);
const unitsOf = (i: number) => spec.get(ids[i])?.lines.reduce((s, l) => s + l.units, 0) ?? 0;
const attrOf = (i: number, a: 'str' | 'dex' | 'int') =>
  nodes[i].mods.reduce(
    (s, m) => s + (m.kind === 'base' && (m.stat === a || m.stat === 'allAttr') ? m.value : 0),
    0,
  );

const CLASS_ATTRS: Record<string, ('str' | 'dex' | 'int')[]> = {
  vanguard: ['str'],
  strider: ['dex'],
  mystic: ['int'],
  reaver: ['str', 'dex'],
  zealot: ['str', 'int'],
  shade: ['dex', 'int'],
};
const REGION_OF_CLASS: Record<string, string> = {
  vanguard: 'vanguard',
  strider: 'strider',
  mystic: 'mystic',
  reaver: 'reaver',
  zealot: 'zealot',
  shade: 'shade',
};

/** Steps from `from` by the ways a player can take: never through a start. */
function steps(from: number): { d: number[]; prev: number[] } {
  const d = new Array<number>(nodes.length).fill(-1);
  const prev = new Array<number>(nodes.length).fill(-1);
  d[from] = 0;
  const q = [from];
  for (let h = 0; h < q.length; h++)
    for (const m of nodes[q[h]].links)
      if (d[m] < 0 && nodes[m].kind !== 'start') {
        d[m] = d[q[h]] + 1;
        prev[m] = q[h];
        q.push(m);
      }
  return { d, prev };
}

const pct = (a: number, b: number) => `${((100 * a) / (b || 1)).toFixed(0)}%`;

// ---- 1. Counts.
console.log('== Counts');
const kinds: Record<string, number> = {};
let total = 0;
for (let i = 0; i < nodes.length; i++) {
  if (!live(i)) continue;
  if (region && built.place[i].region !== region) continue;
  kinds[nodes[i].kind] = (kinds[nodes[i].kind] ?? 0) + 1;
  total++;
}
console.log(
  `${region ?? 'all'}: ${total} nodes: ${Object.entries(kinds)
    .map(([k, v]) => `${k} ${v} (${pct(v, total)})`)
    .join(', ')}`,
);
console.log(
  `problems: ${built.problems.length}${built.problems.length ? '\n  ' + built.problems.join('\n  ') : ''}`,
);

// ---- 2. Notable strength.
console.log('\n== Notables in units (a unit = the small node of the stat); the brief wants 3 to 5');
const notables = [...spec.entries()].filter(
  ([id, n]) => n.kind === 'notable' && (!region || id.startsWith(regionPrefix(region))),
);
function regionPrefix(r: string): string {
  const a = AREAS.find((x) => x.region === r);
  return a ? a.id.split('.')[0] + '.' : r;
}
const strengths = notables
  .map(([id, n]) => ({ id, name: n.name, u: n.lines.reduce((s, l) => s + l.units, 0) }))
  .sort((a, b) => a.u - b.u);
console.log(strengths.map((s) => `${s.name} ${s.u.toFixed(1)}`).join(' | '));
const weak = strengths.filter((s) => s.u < 3),
  strong = strengths.filter((s) => s.u > 5);
if (weak.length) console.log('under 3:', weak.map((s) => s.name).join(', '));
if (strong.length) console.log('over 5:', strong.map((s) => s.name).join(', '));

// ---- 3. Per class: the first fifteen steps, keystones, and a greedy natural build's attribute supply.
for (const [classId, start] of Object.entries(starts)) {
  const reg = REGION_OF_CLASS[classId];
  if (region && reg !== region) continue;
  if (nodes[start].links.length === 0) continue;
  const { d, prev } = steps(start);
  console.log(`\n== ${classId}`);
  // Keystones and notables by distance.
  const ks = nodes
    .filter((n) => n.kind === 'keystone' && d[n.id] >= 0)
    .sort((a, b) => d[a.id] - d[b.id]);
  console.log('keystones: ' + ks.map((k) => `${k.name} ${d[k.id]}`).join(', '));
  const ns = nodes
    .filter((n) => n.kind === 'notable' && d[n.id] >= 0)
    .sort((a, b) => d[a.id] - d[b.id]);
  console.log(
    'notables within 15: ' +
      ns
        .filter((n) => d[n.id] <= 15)
        .map((n) => `${n.name} ${d[n.id]}`)
        .join(', '),
  );
  // The home: every node within 5 steps and where the ways out lead.
  const near = nodes
    .filter((n) => d[n.id] > 0 && d[n.id] <= 5 && n.kind !== 'start')
    .sort((a, b) => d[a.id] - d[b.id]);
  console.log('first five steps: ' + near.map((n) => `${d[n.id]}:${n.name}`).join('; '));

  // A greedy natural build: from the allocated set, repeatedly take the nearest unallocated notable or keystone of the
  // class's own region (ties: the strongest), paying its path; stop at 60 points. Reports attribute supply and road tax.
  const own = CLASS_ATTRS[classId];
  const alloc = new Set<number>([start]);
  const spent: number[] = [];
  const marks: Record<number, string> = {};
  while (spent.length < 60) {
    // Steps from the allocated set.
    const dd = new Array<number>(nodes.length).fill(-1);
    const pp = new Array<number>(nodes.length).fill(-1);
    const q: number[] = [];
    for (const a of alloc) {
      dd[a] = 0;
      q.push(a);
    }
    for (let h = 0; h < q.length; h++)
      for (const m of nodes[q[h]].links)
        if (dd[m] < 0 && nodes[m].kind !== 'start') {
          dd[m] = dd[q[h]] + 1;
          pp[m] = q[h];
          q.push(m);
        }
    let best = -1,
      bestKey = Infinity;
    for (const n of nodes) {
      if (alloc.has(n.id) || dd[n.id] < 0 || (n.kind !== 'notable' && n.kind !== 'keystone'))
        continue;
      if (built.place[n.id].region !== reg) continue;
      if (spent.length + dd[n.id] > 60) continue;
      const key = dd[n.id] - Math.min(unitsOf(n.id), 5) / 10;
      if (key < bestKey) {
        bestKey = key;
        best = n.id;
      }
    }
    if (best < 0) break;
    const path: number[] = [];
    for (let c = best; !alloc.has(c); c = pp[c]) path.push(c);
    path.reverse();
    for (const p of path) {
      alloc.add(p);
      spent.push(p);
    }
    marks[spent.length] = nodes[best].name;
  }
  const at = (k: number) => {
    const taken = spent.slice(0, k);
    const attrs = own.map((a) => `${a} +${taken.reduce((s, i) => s + attrOf(i, a), 0)}`).join(' ');
    const road = taken.filter((i) => nodes[i].kind === 'travel').length;
    return `${attrs} (road ${road}/${k})`;
  };
  console.log(
    `greedy build, ${spent.length} points: at 20: ${at(20)}; at 40: ${at(40)}; at 60: ${at(Math.min(60, spent.length))}`,
  );
  console.log(
    'order: ' +
      Object.entries(marks)
        .map(([k, v]) => `${v}@${k}`)
        .join(', '),
  );
  void prev;
}

// ---- 4. Links without a reason, and a map of every area's ways in and out.
console.log('\n== Areas: links in and out');
for (const a of AREAS) {
  if (region && a.region !== region) continue;
  const outs = built.links.filter((l) => {
    const pa = built.place[built.registry[l.a]].area,
      pb = built.place[built.registry[l.b]].area;
    return (pa === a.id) !== (pb === a.id);
  });
  console.log(
    `${a.id}: ${outs.map((l) => `${l.a.replace(a.id + '.', '')} ↔ ${l.b.replace(a.id + '.', '')}`).join('; ')}`,
  );
}
