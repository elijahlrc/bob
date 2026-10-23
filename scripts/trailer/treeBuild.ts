/**
 * The build that grows in the trailer's tree shot (clips.ts, `tree3`): the allocator of scripts/passives/builds.ts plans a
 * two-handed mace Vanguard at 60 points and grows it to 80 and 100, as a player's build grows; this puts its nodes in the
 * order a player would take them (each stage's notables nearest first, the path to each, then what is left) and writes
 * them to tree-build.json beside this file. Run it again after the tree changes:
 *
 *   npx tsx scripts/trailer/treeBuild.ts
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getTree } from '../../src/data/tree';

const ARCHETYPE = 'mace-slam';
const STAGES = [60, 80, 100];

const out = join(mkdtempSync(join(tmpdir(), 'tree-build-')), 'plans.json');
execFileSync(
  process.execPath,
  [
    join('node_modules', 'tsx', 'dist', 'cli.mjs'),
    'scripts/passives/builds.ts',
    '--only',
    ARCHETYPE,
    '--json',
    out,
  ],
  { stdio: 'ignore' },
);
const res = JSON.parse(readFileSync(out, 'utf8')).results[0] as {
  start: string;
  curve: { budget: number; plan: number[] }[];
};

const { nodes, starts } = getTree();
const start = starts[res.start];
const big = (i: number) => nodes[i].kind === 'notable' || nodes[i].kind === 'keystone';
const taken = new Set([start]);
const order: number[] = [];
const add = (i: number) => {
  if (taken.has(i)) return;
  taken.add(i);
  order.push(i);
};

for (const budget of STAGES) {
  const stage = new Set(res.curve.find((s) => s.budget === budget)!.plan);
  for (const i of taken)
    if (!stage.has(i)) throw new Error(`the ${budget}-point plan drops node ${i}`);
  for (;;) {
    // From what is taken, through this stage's nodes only: the nearest notable or keystone not yet taken.
    const prev = new Map<number, number>();
    const queue = [...taken];
    for (const i of queue) prev.set(i, -1);
    let goal = -1;
    for (let q = 0; q < queue.length && goal < 0; q++)
      for (const k of nodes[queue[q]].links) {
        if (!stage.has(k) || prev.has(k)) continue;
        prev.set(k, queue[q]);
        if (big(k)) {
          goal = k;
          break;
        }
        queue.push(k);
      }
    if (goal < 0) break;
    const path: number[] = [];
    for (let c = goal; !taken.has(c); c = prev.get(c)!) path.push(c);
    path.reverse().forEach(add);
  }
  // The stage's small nodes off the paths, each next to what is taken.
  for (let grew = true; grew;) {
    grew = false;
    for (const i of [...stage].sort((a, b) => a - b))
      if (!taken.has(i) && nodes[i].links.some((k) => taken.has(k))) {
        add(i);
        grew = true;
      }
  }
}

writeFileSync(
  join('scripts', 'trailer', 'tree-build.json'),
  JSON.stringify(
    { archetype: ARCHETYPE, ids: order, names: order.map((i) => nodes[i].name) },
    null,
    1,
  ) + '\n',
);
console.log(
  `${order.length} nodes: ${order
    .filter(big)
    .map((i) => nodes[i].name)
    .join(', ')}`,
);
