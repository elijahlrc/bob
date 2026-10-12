/**
 * Use the passive tree from a terminal (docs/TREE-REDESIGN.md, T0): the interface of the simulated players of T6.1, and a way
 * to try a build by hand. A build is a small JSON file (class and allocated node ids); every command takes `--build file`.
 *
 *   npm run tree:explore -- new <class> --build b.json [--budget 100]
 *   npm run tree:explore -- show <id> --build b.json        a node: what it gives, its links, what it costs to reach
 *   npm run tree:explore -- near <id> [hops] --build b.json  the nodes within a few steps of one
 *   npm run tree:explore -- reach [hops] --build b.json      what can be had within a few steps of the build, by cost
 *   npm run tree:explore -- region <id> --build b.json       every notable and keystone in a region (or hub), by cost
 *   npm run tree:explore -- find <text...> --build b.json    nodes whose name or lines contain the text, by cost
 *   npm run tree:explore -- alloc <id...> --build b.json     take nodes (the path to each is taken with it)
 *   npm run tree:explore -- unalloc <id...> --build b.json   give nodes back (the build must stay connected)
 *   npm run tree:explore -- summary --build b.json           points used, what the build gives in total
 *   npm run tree:explore -- legend                           what the picture colours mean
 *
 * Classes: vanguard (str), strider (dex), mystic (int), reaver (str/dex), zealot (str/int), shade (dex/int). The cost of a node is
 * the number of points it takes to reach it from the build (one point a node, the path included).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { modText } from '../../src/mods/text';
import type { Mod } from '../../src/mods/types';
import { canRemove, pathTo } from '../../src/run/tree';
import { TONE_LABEL, toneOf } from '../../src/ui/treeStyle';
import { REGIONS } from '../../src/data/tree/spec';
import { CLASSES } from '../../src/data/classes';
import { nodes, regionOf, steps, tree } from './lib';

type Build = { class: string; budget: number; allocated: number[] };

const argv = process.argv.slice(2);
const bi = argv.indexOf('--build');
const file = bi >= 0 ? argv[bi + 1] : '';
const rest = argv.filter(
  (_, i) => !(bi >= 0 && (i === bi || i === bi + 1)) && argv[i - 1] !== '--budget',
);
const cmd = rest[0];
const args = rest.slice(1).filter((a) => a !== '--budget');

function load(): Build {
  if (!file || !existsSync(file))
    throw new Error('no build: create one with `new <class> --build file.json`');
  return JSON.parse(readFileSync(file, 'utf8')) as Build;
}
const save = (b: Build) => writeFileSync(file, JSON.stringify(b));

const lines = (id: number): string => {
  const n = nodes[id];
  if (n.kind === 'start') return 'class start';
  return n.mods.length ? n.mods.map((m: Mod) => modText(m)).join('; ') : '(nothing)';
};
const label = (id: number): string => {
  const n = nodes[id];
  const kind = n.kind === 'travel' ? 'road' : n.kind;
  return `#${id} ${kind} "${n.name}" [${regionOf(n)}]`;
};
const classOfBuild = (b: Build) => b.class;
const costOf = (b: Build, id: number): number | null => {
  const p = pathTo(b.allocated, classOfBuild(b), id);
  return p ? p.length : null;
};
const owned = (b: Build) => new Set([tree.starts[b.class], ...b.allocated]);

function oneLine(id: number, b: Build): string {
  const c = costOf(b, id);
  const n = nodes[id];
  const kind = n.kind === 'travel' ? 'road' : n.kind;
  return `#${id} ${kind} "${n.name}" [${regionOf(n)}] @${n.x},${n.y} ${c === null ? 'UNREACHABLE (cannot be taken)' : 'cost ' + c}: ${lines(id)}`;
}

switch (cmd) {
  case 'new': {
    const cls = args[0];
    if (!CLASSES.some((c) => c.id === cls))
      throw new Error(`class must be one of ${CLASSES.map((c) => c.id).join(', ')}`);
    const bj = argv.indexOf('--budget');
    const b: Build = { class: cls, budget: bj >= 0 ? Number(argv[bj + 1]) : 100, allocated: [] };
    save(b);
    const start = tree.starts[cls];
    console.log(
      `new ${cls} build, ${b.budget} points. Start node #${start} in the ${regionOf(nodes[start])} region.`,
    );
    break;
  }
  case 'show': {
    const b = load();
    const id = Number(args[0]);
    const n = nodes[id];
    if (!n) throw new Error('no such node');
    console.log(oneLine(id, b));
    console.log(`  ${owned(b).has(id) ? 'TAKEN' : 'not taken'}; links:`);
    for (const m of n.links) console.log(`   ${owned(b).has(m) ? '*' : ' '} ${oneLine(m, b)}`);
    break;
  }
  case 'near': {
    const b = load();
    const id = Number(args[0]);
    const hops = Number(args[1] ?? 3);
    const d = steps([id]);
    for (let h = 1; h <= hops; h++) {
      const at = nodes.filter((n) => d[n.id] === h);
      console.log(`-- ${h} step${h > 1 ? 's' : ''} (${at.length}) --`);
      for (const n of at) console.log(`${owned(b).has(n.id) ? '*' : ' '} ${oneLine(n.id, b)}`);
    }
    break;
  }
  case 'reach': {
    const b = load();
    const hops = Number(args[0] ?? 6);
    const d = steps([...owned(b)]);
    for (let h = 1; h <= hops; h++) {
      const at = nodes.filter((n) => d[n.id] === h && n.kind !== 'start');
      const sig = at.filter((n) => n.kind === 'notable' || n.kind === 'keystone');
      const rest = at.length - sig.length;
      console.log(`-- cost ${h}: ${at.length} nodes (${rest} small or road) --`);
      for (const n of sig) console.log(`  ${oneLine(n.id, b)}`);
    }
    break;
  }
  case 'region': {
    const b = load();
    const r = args[0];
    if (r !== 'hub' && !REGIONS.some((x) => x.id === r))
      throw new Error(`region: hub or ${REGIONS.map((x) => x.id).join(', ')}`);
    const at = nodes.filter(
      (n) => regionOf(n) === r && (n.kind === 'notable' || n.kind === 'keystone'),
    );
    at.sort((p, q) => (costOf(b, p.id) ?? 999) - (costOf(b, q.id) ?? 999));
    console.log(`${r}: ${at.length} notables and keystones, nearest first`);
    for (const n of at) console.log(`  ${oneLine(n.id, b)}`);
    break;
  }
  case 'find': {
    const b = load();
    const q = args.join(' ').toLowerCase();
    const hit = nodes.filter(
      (n) =>
        n.kind !== 'start' &&
        (n.name.toLowerCase().includes(q) || lines(n.id).toLowerCase().includes(q)),
    );
    hit.sort((p, r) => (costOf(b, p.id) ?? 999) - (costOf(b, r.id) ?? 999));
    const notable = hit.filter((n) => n.kind === 'notable' || n.kind === 'keystone');
    const small = hit.filter((n) => n.kind !== 'notable' && n.kind !== 'keystone');
    console.log(
      `${hit.length} nodes match "${q}": ${notable.length} notables or keystones, ${small.length} others`,
    );
    for (const n of notable.slice(0, 40)) console.log(`  ${oneLine(n.id, b)}`);
    if (small.length)
      console.log(
        `  (${small.length} small or road nodes; the nearest ${Math.min(8, small.length)}:)`,
      );
    for (const n of small.slice(0, 8)) console.log(`  ${oneLine(n.id, b)}`);
    break;
  }
  case 'alloc': {
    const b = load();
    for (const a of args) {
      const id = Number(a);
      const path = pathTo(b.allocated, b.class, id);
      if (!path) {
        console.log(`#${id}: cannot be reached`);
        continue;
      }
      if (path.length === 0) {
        console.log(`#${id}: already taken`);
        continue;
      }
      if (b.allocated.length + path.length > b.budget) {
        console.log(
          `#${id}: costs ${path.length}, only ${b.budget - b.allocated.length} points left; not taken`,
        );
        continue;
      }
      b.allocated.push(...path);
      console.log(`took ${path.length}: ${path.map((p) => `#${p} ${nodes[p].name}`).join(' > ')}`);
    }
    save(b);
    console.log(`${b.allocated.length}/${b.budget} points used`);
    break;
  }
  case 'unalloc': {
    const b = load();
    for (const a of args) {
      const id = Number(a);
      if (!canRemove(b.allocated, b.class, id)) {
        console.log(`#${id}: not taken, or others depend on it`);
        continue;
      }
      b.allocated = b.allocated.filter((x) => x !== id);
      console.log(`gave back #${id} ${nodes[id].name}`);
    }
    save(b);
    console.log(`${b.allocated.length}/${b.budget} points used`);
    break;
  }
  case 'summary': {
    const b = load();
    const got = b.allocated.map((id) => nodes[id]);
    const kinds = (k: string) => got.filter((n) => n.kind === k).length;
    console.log(
      `${b.class}: ${b.allocated.length}/${b.budget} points: ${kinds('notable')} notables, ${kinds('keystone')} keystones, ${kinds('small')} small, ${kinds('travel')} road/attribute`,
    );
    const key = (m: Mod) =>
      [
        m.stat,
        m.kind,
        (m.tags ?? []).join('+'),
        (m.damageTypes ?? []).join('+'),
        m.condition?.id ?? '',
      ].join('|');
    const sum = new Map<string, Mod>();
    for (const n of got)
      for (const m of n.mods) {
        const k = key(m);
        const have = sum.get(k);
        sum.set(k, have ? { ...have, value: have.value + m.value } : { ...m });
      }
    console.log('Taken, by region:');
    const byRegion = new Map<string, number>();
    for (const n of got) byRegion.set(regionOf(n), (byRegion.get(regionOf(n)) ?? 0) + 1);
    console.log('  ' + [...byRegion].map(([r, c]) => `${r} ${c}`).join(', '));
    console.log('Notables and keystones:');
    for (const n of got.filter((x) => x.kind === 'notable' || x.kind === 'keystone'))
      console.log(`  #${n.id} ${n.name}: ${lines(n.id)}`);
    console.log('Total of everything taken:');
    for (const m of sum.values()) console.log(`  ${modText(m)}`);
    break;
  }
  case 'legend': {
    console.log('Node colour says what the node gives (from its first line):');
    for (const [tone, text] of TONE_LABEL) console.log(`  ${tone}: ${text}`);
    console.log(
      `Example: ${label(tree.starts.mystic)} is a class start. Tones in use: ${new Set(nodes.map((n) => toneOf(n))).size}`,
    );
    break;
  }
  default:
    console.log(
      'commands: new, show, near, reach, region, find, alloc, unalloc, summary, legend (see the top of scripts/tree/explore.ts)',
    );
}
