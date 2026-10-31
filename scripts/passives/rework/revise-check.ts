// @ts-nocheck -- a one-off tool of the tree revision (docs/tree/design/R-revise.md §6), run with npx tsx.
// The revision's measures, from the area files (unbaked): notables hung behind another notable, dead-end notables near
// the starts, the first notable down each direction out of a start, cluster routes that cut under a road, links across
// borders, counts. `--list` names the nodes behind each count.
import fs from 'fs';
import { buildAll } from '../../../src/data/passives';

const list = process.argv.includes('--list');
const built = buildAll({ allowNew: true });
const all = built.tree.nodes;
const live = all.map((n) => n.name !== '(retired)' && !n.retired);
const N = all.length;
const adj = all.map((n, i) => (live[i] ? n.links.filter((m) => live[m]) : []));
const kind = all.map((n) => n.kind);
const region = built.place.map((p) => p.region);
const big = (i: number) => kind[i] === 'notable' || kind[i] === 'keystone';
const starts = all.map((n, i) => (n.kind === 'start' && live[i] ? i : -1)).filter((i) => i >= 0);
const name = (i: number) => (big(i) || kind[i] === 'start' ? all[i].name : built.ids[i]);

function bfs(from: number[], blocked: (i: number) => boolean = () => false, only?: (i: number) => boolean): Int32Array {
  const d = new Int32Array(N).fill(-1);
  const q: number[] = [];
  for (const s of from) {
    d[s] = 0;
    q.push(s);
  }
  for (let h = 0; h < q.length; h++)
    for (const m of adj[q[h]])
      if (d[m] < 0 && !blocked(m) && (!only || only(m))) {
        d[m] = d[q[h]] + 1;
        q.push(m);
      }
  return d;
}

const out: string[] = [];
const say = (s: string) => out.push(s);

// Counts.
let links = 0;
for (let i = 0; i < N; i++) links += adj[i].length;
const liveCount = live.filter(Boolean).length;
say(`nodes ${liveCount}, notables ${kind.filter((k, i) => live[i] && k === 'notable').length}, keystones ${kind.filter((k, i) => live[i] && k === 'keystone').length}, mean links ${(links / liveCount).toFixed(2)}`);

// 1. Notables whose every way in from a start runs through another notable or keystone.
const hung: number[] = [];
for (let x = 0; x < N; x++) {
  if (!live[x] || !big(x)) continue;
  const d = bfs(starts, (i) => i !== x && big(i));
  if (d[x] < 0) hung.push(x);
}
say(`hung behind a notable: ${hung.length}`);
if (list) for (const x of hung) say(`  ${name(x)} (${region[x]}) <- ${adj[x].map(name).join(', ')}`);

// 2. Dead-end notables within 8 steps of each start: nothing beyond them (no neighbour farther from the start).
// 3. The first notable down each direction: per exit, and per node two steps out.
for (const s of starts) {
  const d = bfs([s], (i) => i !== s && kind[i] === 'start');
  const dead = [];
  for (let x = 0; x < N; x++)
    if (live[x] && big(x) && d[x] > 0 && d[x] <= 8 && adj[x].every((m) => d[m] <= d[x])) dead.push(x);
  const firstOwn = Math.min(...[...Array(N).keys()].filter((x) => live[x] && kind[x] === 'notable' && region[x] === region[s] && d[x] > 0).map((x) => d[x]));
  const dirs: string[] = [];
  for (const e of adj[s]) {
    const de = bfs([e], (i) => i === s || kind[i] === 'start');
    let best = Infinity;
    for (let x = 0; x < N; x++) if (big(x) && de[x] >= 0) best = Math.min(best, de[x] + 1);
    dirs.push(String(best));
  }
  const two = [...Array(N).keys()].filter((x) => d[x] === 2);
  const at2 = two.map((t) => {
    const dt = bfs([t], (i) => d[i] >= 0 && d[i] < 2);
    let best = Infinity;
    for (let x = 0; x < N; x++) if (big(x) && dt[x] >= 0) best = Math.min(best, dt[x] + 2);
    return best;
  });
  say(`${region[s]}: first own notable ${firstOwn}; dead-end notables within 8: ${dead.length}${list && dead.length ? ' (' + dead.map(name).join(', ') + ')' : ''}; first notable per exit ${dirs.join('/')}; per step-2 node ${at2.sort((a, b) => a - b).join(' ')} (${two.length} nodes at step 2)`);
}

// Steps between starts.
const ss: string[] = [];
for (const a of starts) {
  ss.push(`${region[a]} ` + starts.filter((b) => b !== a).map((b) => bfs([a], (i) => i !== a && i !== b && kind[i] === 'start')[b]).sort((x, y) => x - y).join(' '));
}
say('steps to the other starts: ' + ss.join('; '));

// 4. Cluster routes that cut under a road: pairs of road nodes up to 10 road steps apart where the whole tree's way is
// shorter than the roads' own. Many such pairs are by design (a start's seam paths run through its home clusters), so the
// count alone says little. `--save <file>` writes every road pair's distances; `--base <file>` then names only the pairs
// whose way through clusters got shorter than it was in the saved tree and is now shorter than the road: a new shortcut.
const road = (i: number) => live[i] && (kind[i] === 'travel' || kind[i] === 'hub' || kind[i] === 'start');
const arg = (k: string) => (process.argv.indexOf(k) >= 0 ? process.argv[process.argv.indexOf(k) + 1] : null);
const saveTo = arg('--save');
const basePath = arg('--base');
const base: Record<string, number> = basePath ? JSON.parse(fs.readFileSync(basePath, 'utf8')) : {};
const save: Record<string, number> = {};
let pairs = 0;
const cuts: string[] = [];
const fresh: string[] = [];
for (let a = 0; a < N; a++) {
  if (!road(a) || kind[a] === 'start') continue;
  const dr = bfs([a], () => false, road);
  const df = bfs([a], (i) => kind[i] === 'start');
  for (let b = 0; b < N; b++) {
    if (b === a || !road(b) || kind[b] === 'start' || dr[b] < 1) continue;
    const key = [built.ids[a], built.ids[b]].sort().join(' ');
    if (df[b] >= 0) save[key] = df[b];
    if (b < a || dr[b] > 10) continue;
    pairs++;
    if (df[b] >= 0 && df[b] < dr[b]) {
      const line = `${built.ids[a]} – ${built.ids[b]}: road ${dr[b]}, through clusters ${df[b]}`;
      cuts.push(line);
      if (basePath && key in base && df[b] < base[key]) fresh.push(`${line} (was ${base[key]})`);
    }
  }
}
say(`road pairs within 10 road steps: ${pairs}; shorter through clusters: ${cuts.length}`);
if (basePath) {
  say(`new shortcuts against ${basePath}: ${fresh.length}`);
  for (const c of fresh) say('  ' + c);
}
if (saveTo) fs.writeFileSync(saveTo, JSON.stringify(save));

// 5. Links across borders, by pair of regions, and how many join two non-road nodes.
const cross = new Map<string, [number, number]>();
for (let i = 0; i < N; i++)
  for (const m of adj[i])
    if (m > i && region[i] !== region[m]) {
      const k = [region[i], region[m]].sort().join('-');
      const v = cross.get(k) ?? [0, 0];
      v[0]++;
      if (!road(i) && !road(m)) v[1]++;
      cross.set(k, v);
    }
say('links across borders (all / cluster to cluster): ' + [...cross].sort().map(([k, v]) => `${k} ${v[0]}/${v[1]}`).join(', '));

console.log(out.join('\n'));
