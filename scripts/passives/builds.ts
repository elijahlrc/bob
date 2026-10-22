/**
 * Walks the archetypes of `archetypes.ts` through the hand-written network and reports how much tension it gives them
 * (docs/tree/design/G-growth.md §1): for 60 and 120 points, the best plan an allocator finds and the plans nearly as good,
 * then reach, choice, tax, what each build gave up, and its main stats one at a time (never one number for a build).
 *
 *   npx tsx scripts/passives/builds.ts [--only id,id] [--budgets 60,120] [--radius 18] [--json out.json] [--pics dir]
 *
 * The allocator buys a connected set of nodes from the class's start, one point a node, never through another start.
 * Greedy: from the set, the path (shortest, ties to the more valuable) whose value per point is highest; then swaps:
 * for every wanted notable or keystone not taken, prune the least valuable leaves to pay for the path to it and refill
 * greedily, kept when the plan is worth more. Alternatives: the same search with one or two of the best plan's notables
 * banned. It is deterministic, so a baseline and a later round mean the same thing. A yardstick for walks, never the
 * reason a node is placed (CONSTRAINTS §14).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildAll } from '../../src/data/passives';
import { makeLine } from '../../src/data/passives/vocab';
import type { LineSpec } from '../../src/data/passives/types';
import { Canvas, hex } from '../tree/png';
import { ARCHETYPES, type Archetype } from './archetypes';

/**
 * Steps from the start within which reach and the gave-up lists count what the network holds. Proposed at G0 from the
 * depth of today's 120-point plans; once the user agrees it is never changed, so every round is measured the same way.
 */
export const REACH_RADIUS = 18;
/** A plan within this share of the best counts as a near-equal choice. */
const NEAR = 0.05;
/** Two plans are different choices when each takes at least this many notables or keystones the other does not. */
const DIFFER = 3;

const argv = process.argv.slice(2);
const arg = (k: string) => {
  const i = argv.indexOf(k);
  return i >= 0 ? argv[i + 1] : undefined;
};
const only = arg('--only')?.split(',');
const budgets = (arg('--budgets') ?? '60,120').split(',').map(Number);
const radius = Number(arg('--radius') ?? REACH_RADIUS);
const jsonOut = arg('--json');
const picDir = arg('--pics');

const built = buildAll({ allowNew: true });
const { nodes } = built.tree;
const N = nodes.length;
const live = (i: number) => nodes[i].name !== '(retired)';
const isStart = (i: number) => nodes[i].kind === 'start';
const big = (i: number) => nodes[i].kind === 'notable' || nodes[i].kind === 'keystone';

// ---- Lines of every node, as keys with units and their amount in their own terms.
type Row = { key: string; units: number; amount: number; label: string };
const keyOf = (s: LineSpec): string =>
  [
    s.fn,
    ...s.args
      .filter((x) => typeof x === 'string' || Array.isArray(x))
      .map((x) => (Array.isArray(x) ? x.join('+') : String(x))),
  ].join(':');
const rows: Row[][] = built.lines.map((specs) =>
  specs.flatMap((s) => {
    const l = makeLine(s);
    if (!l) return [];
    const amount = (s.args.find((x) => typeof x === 'number') as number | undefined) ?? 0;
    return [{ key: keyOf(s), units: l.units, amount, label: l.label }];
  }),
);
const ATTR = new Set(['str', 'dex', 'int', 'allAttr']);
const attrOf = (i: number, a: 'str' | 'dex' | 'int') =>
  rows[i].reduce((s, r) => s + (r.key === a || r.key === 'allAttr' ? r.amount : 0), 0);

function weightOf(a: Archetype, key: string): number {
  if (a.weights[key] !== undefined) return a.weights[key];
  const fn = key.split(':')[0];
  if (fn !== key && a.weights[`${fn}:*`] !== undefined) return a.weights[`${fn}:*`];
  return 0;
}

/** What each node is worth to an archetype (attributes are worth nothing; see archetypes.ts). */
function valuesFor(a: Archetype): Float64Array {
  const v = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    if (!live(i)) continue;
    if (nodes[i].kind === 'keystone') v[i] = a.keystones?.[nodes[i].name] ?? 0;
    else
      v[i] = rows[i].reduce((s, r) => s + (ATTR.has(r.key) ? 0 : r.units * weightOf(a, r.key)), 0);
  }
  return v;
}
/** The share of a node's units that are wanted lines: a notable is "of its own kind" at a half or more. */
function wantedShare(a: Archetype, i: number): number {
  if (nodes[i].kind === 'keystone') return a.keystones?.[nodes[i].name] ? 1 : 0;
  const all = rows[i].reduce((s, r) => s + r.units, 0);
  const want = rows[i].reduce((s, r) => s + (weightOf(a, r.key) > 0 ? r.units : 0), 0);
  return all ? want / all : 0;
}

// ---- Steps.
/** Steps from a set by the ways a player can take: never through a start or a banned node. */
function bfs(
  from: Iterable<number>,
  v: Float64Array,
  banned: Set<number>,
): { d: Int32Array; pv: Float64Array; prev: Int32Array } {
  const d = new Int32Array(N).fill(-1);
  const pv = new Float64Array(N);
  const prev = new Int32Array(N).fill(-1);
  const q: number[] = [];
  for (const s of from) {
    d[s] = 0;
    q.push(s);
  }
  for (let h = 0; h < q.length; h++) {
    const x = q[h];
    for (const m of nodes[x].links) {
      if (isStart(m) || banned.has(m)) continue;
      if (d[m] < 0) {
        d[m] = d[x] + 1;
        pv[m] = pv[x] + v[m];
        prev[m] = x;
        q.push(m);
      } else if (d[m] === d[x] + 1 && pv[x] + v[m] > pv[m]) {
        pv[m] = pv[x] + v[m];
        prev[m] = x;
      }
    }
  }
  return { d, pv, prev };
}

// ---- The allocator.
type Plan = { set: Set<number>; score: number };
const scoreOf = (set: Set<number>, v: Float64Array) => {
  let s = 0;
  for (const i of set) s += v[i];
  return s;
};

/** Adds the best paths by value per point until nothing worth anything fits. */
function fill(
  set: Set<number>,
  start: number,
  budget: number,
  v: Float64Array,
  banned: Set<number>,
) {
  for (;;) {
    const left = budget - (set.size - 1);
    if (left <= 0) return;
    const { d, pv, prev } = bfs(set, v, banned);
    let best = -1,
      bestR = 0,
      bestV = 0;
    for (let t = 0; t < N; t++) {
      if (d[t] <= 0 || d[t] > left || v[t] <= 0) continue;
      const r = pv[t] / d[t];
      if (r > bestR + 1e-9 || (Math.abs(r - bestR) <= 1e-9 && pv[t] > bestV)) {
        best = t;
        bestR = r;
        bestV = pv[t];
      }
    }
    if (best < 0) return;
    for (let c = best; !set.has(c); c = prev[c]) set.add(c);
  }
  void start;
}

/** Leaves of the plan (one link inside it), never the start. */
function leaves(set: Set<number>, start: number): number[] {
  const out: number[] = [];
  for (const i of set) {
    if (i === start) continue;
    let k = 0;
    for (const m of nodes[i].links) if (set.has(m)) k++;
    if (k <= 1) out.push(i);
  }
  return out;
}

/** Removes the least valuable leaves until `free` points are free (a branch comes back one leaf at a time). */
function prune(set: Set<number>, start: number, free: number, v: Float64Array, keep: number) {
  let freed = 0;
  while (freed < free) {
    const ls = leaves(set, start).filter((i) => i !== keep);
    if (!ls.length) return;
    // The leaf whose branch, back to the plan's next junction or valued node, is worth least per point.
    let worst = -1,
      worstR = Infinity;
    for (const l of ls) {
      let val = 0,
        len = 0,
        c = l;
      const seen = new Set<number>();
      for (;;) {
        val += v[c];
        len++;
        seen.add(c);
        const up = nodes[c].links.filter((m) => set.has(m) && !seen.has(m));
        if (up.length !== 1 || up[0] === start) break;
        const u = up[0];
        let k = 0;
        for (const m of nodes[u].links) if (set.has(m)) k++;
        if (k > 2 || v[u] > 0) break;
        c = u;
      }
      const r = val / len;
      if (r < worstR || (r === worstR && l < worst)) {
        worstR = r;
        worst = l;
      }
    }
    set.delete(worst);
    freed++;
  }
}

function solve(a: Archetype, budget: number, v: Float64Array, banned: Set<number>): Plan {
  const start = built.tree.starts[a.start];
  const set = new Set<number>([start]);
  fill(set, start, budget, v, banned);
  let score = scoreOf(set, v);
  // Swaps: reach for each wanted notable or keystone not taken, paying with the plan's weakest leaves.
  for (let pass = 0; pass < 3; pass++) {
    let improved = false;
    const { d } = bfs(set, v, banned);
    const targets = [];
    for (let t = 0; t < N; t++)
      if (big(t) && !set.has(t) && d[t] > 0 && d[t] <= budget && v[t] >= 1.5) targets.push(t);
    targets.sort((x, y) => v[y] - v[x] || x - y);
    for (const t of targets) {
      const trial = new Set(set);
      const need = bfs(trial, v, banned).d[t];
      if (need < 0) continue;
      const left = budget - (trial.size - 1);
      if (need > left) prune(trial, start, need - left, v, -1);
      const r = bfs(trial, v, banned);
      if (r.d[t] < 0 || r.d[t] > budget - (trial.size - 1)) continue;
      for (let c = t; !trial.has(c); c = r.prev[c]) trial.add(c);
      fill(trial, start, budget, v, banned);
      const s = scoreOf(trial, v);
      if (s > score + 1e-6) {
        set.clear();
        for (const i of trial) set.add(i);
        score = s;
        improved = true;
      }
    }
    if (!improved) break;
  }
  return { set, score };
}

const bigOf = (p: Plan) => [...p.set].filter(big);
function differs(p: Plan, q: Plan): boolean {
  const a = new Set(bigOf(p)),
    b = new Set(bigOf(q));
  let ab = 0,
    ba = 0;
  for (const x of a) if (!b.has(x)) ab++;
  for (const x of b) if (!a.has(x)) ba++;
  return Math.min(ab, ba) >= DIFFER;
}

/**
 * The best plan and the distinct plans within NEAR of it. Banning one or two of the best plan's notables finds the plans
 * a player would weigh against it; when one of them beats the best, the search starts again from it, so the best is the
 * same however the search began.
 */
function plans(
  a: Archetype,
  budget: number,
  v: Float64Array,
): { best: Plan; near: Plan[]; firstGain: number } {
  const found: Plan[] = [];
  const tried = new Set<string>();
  const run = (ban: number[]) => {
    const key = [...ban].sort((x, y) => x - y).join(',');
    if (tried.has(key)) return;
    tried.add(key);
    found.push(solve(a, budget, v, new Set(ban)));
  };
  run([]);
  const first = found[0].score;
  let best = found[0];
  for (let round = 0; round < 6; round++) {
    const tops = bigOf(best)
      .filter((i) => v[i] > 0)
      .sort((x, y) => v[y] - v[x] || x - y);
    for (const t of tops.slice(0, 12)) run([t]);
    const four = tops.slice(0, 4);
    for (let i = 0; i < four.length; i++)
      for (let j = i + 1; j < four.length; j++) run([four[i], four[j]]);
    const top = found.reduce((p, q) => (q.score > p.score + 1e-6 ? q : p), best);
    if (top === best) break;
    best = top;
  }
  found.sort((x, y) => y.score - x.score);
  const near: Plan[] = [];
  for (const p of found) {
    if (p.score < best.score * (1 - NEAR)) break;
    if (near.every((q) => differs(p, q))) near.push(p);
  }
  return { best, near, firstGain: best.score / first - 1 };
}

// ---- Reports.
/** One stat family of a plan: amounts in their own terms, units taken, units taken within the radius, units there. */
type Family = {
  label: string;
  plan: Record<string, number>;
  units: number;
  takenWithin: number;
  withinUnits: number;
};
type Result = {
  id: string;
  budget: number;
  points: number;
  depth: { max: number; p90: number };
  reach: number;
  reachAt: Record<number, number>;
  choice: number;
  /** How much the swaps and bans gained over the first greedy plan (a check on the search). */
  searchGain: number;
  nearScores: number[];
  tax: { points: number; share: number; road: number };
  attrs: { str: number; dex: number; int: number };
  families: Family[];
  pair: { labels: [string, string]; units: [number, number]; within: [number, number] };
  taken: string[];
  gaveUp: { name: string; value: number; cost: number }[];
  plan: number[];
};

function familyOf(
  a: Archetype,
  label: string,
  set: Set<number>,
  within: (i: number) => boolean,
): Family {
  const keys = new Set(a.main[label]);
  const plan: Record<string, number> = {};
  let units = 0,
    takenWithin = 0,
    withinUnits = 0;
  for (let i = 0; i < N; i++) {
    if (!live(i)) continue;
    for (const r of rows[i]) {
      if (!keys.has(r.key)) continue;
      if (within(i)) withinUnits += r.units;
      if (set.has(i)) {
        units += r.units;
        if (within(i)) takenWithin += r.units;
        plan[r.key] = (plan[r.key] ?? 0) + r.amount;
      }
    }
  }
  return { label, plan, units, takenWithin, withinUnits };
}

function measure(a: Archetype, budget: number): Result {
  const v = valuesFor(a);
  const start = built.tree.starts[a.start];
  const { best, near, firstGain } = plans(a, budget, v);
  const set = best.set;
  const fromStart = bfs([start], v, new Set()).d;
  const depths = [...set].map((i) => fromStart[i]).sort((x, y) => x - y);
  const within = (r: number) => (i: number) => fromStart[i] >= 0 && fromStart[i] <= r;
  const reachOf = (r: number) => {
    let all = 0,
      got = 0;
    for (let i = 0; i < N; i++)
      if (within(r)(i)) {
        all += v[i];
        if (set.has(i)) got += v[i];
      }
    return all ? got / all : 0;
  };
  const reachAt: Record<number, number> = {};
  for (const r of [12, 15, 18, 21, 24]) reachAt[r] = reachOf(r);
  const points = set.size - 1;
  let taxPts = 0,
    road = 0;
  for (const i of set) {
    if (i === start) continue;
    if (v[i] <= 0) taxPts++;
    if (nodes[i].kind === 'travel') road++;
  }
  const attrs = { str: 0, dex: 0, int: 0 };
  for (const i of set) for (const k of ['str', 'dex', 'int'] as const) attrs[k] += attrOf(i, k);
  const families = Object.keys(a.main).map((l) => familyOf(a, l, set, within(radius)));
  const fp = (l: string) => families.find((f) => f.label === l)!;
  const fromPlan = bfs(set, v, new Set()).d;
  const gaveUp = [];
  for (let i = 0; i < N; i++)
    if (big(i) && !set.has(i) && within(radius)(i) && v[i] > 0 && wantedShare(a, i) >= 0.5)
      gaveUp.push({ name: nodes[i].name, value: v[i], cost: fromPlan[i] });
  gaveUp.sort((x, y) => y.value - x.value || x.cost - y.cost);
  return {
    id: a.id,
    budget,
    points,
    depth: { max: depths[depths.length - 1], p90: depths[Math.floor(depths.length * 0.9)] },
    reach: reachOf(radius),
    reachAt,
    choice: near.length,
    searchGain: firstGain,
    nearScores: near.map((p) => p.score / best.score),
    tax: { points: taxPts, share: points ? taxPts / points : 0, road },
    attrs,
    families,
    pair: {
      labels: a.pair,
      units: [fp(a.pair[0]).units, fp(a.pair[1]).units],
      within: [fp(a.pair[0]).withinUnits, fp(a.pair[1]).withinUnits],
    },
    taken: bigOf(best)
      .sort((x, y) => fromStart[x] - fromStart[y])
      .map((i) => nodes[i].name),
    gaveUp,
    plan: [...set].sort((x, y) => x - y),
  };
}

// ---- Pictures: the network dimmed, the 60-point plan inside the 120-point one, what was given up ringed.
function picture(a: Archetype, res: Result[], path: string) {
  const ids = built.tree.nodes.filter((n) => live(n.id));
  const xs = ids.map((n) => n.x),
    ys = ids.map((n) => n.y);
  const m = 250;
  const minX = Math.min(...xs) - m,
    maxX = Math.max(...xs) + m,
    minY = Math.min(...ys) - m,
    maxY = Math.max(...ys) + m;
  const width = 1800;
  const scale = width / (maxX - minX);
  const cv = new Canvas(width, Math.round((maxY - minY) * scale), hex('#0f1016'));
  const X = (x: number) => (x - minX) * scale,
    Y = (y: number) => (y - minY) * scale;
  const [small, large] = [...res].sort((p, q) => p.budget - q.budget);
  const inS = new Set(small?.plan ?? []),
    inL = new Set(large?.plan ?? []);
  const COL = {
    both: hex('#ffe08a'),
    early: hex('#7fc8ff'),
    late: hex('#f08a4a'),
    off: hex('#3a3e4c'),
  };
  const colOf = (i: number) =>
    inS.has(i) && inL.has(i) ? COL.both : inS.has(i) ? COL.early : inL.has(i) ? COL.late : COL.off;
  for (const n of nodes)
    for (const k of n.links)
      if (k > n.id && live(n.id) && live(k)) {
        const on = (inS.has(n.id) && inS.has(k)) || (inL.has(n.id) && inL.has(k));
        cv.line(
          X(n.x),
          Y(n.y),
          X(nodes[k].x),
          Y(nodes[k].y),
          on ? 3 : 1,
          on ? colOf(k) : COL.off,
          on ? 0.9 : 0.6,
        );
      }
  const R: Record<string, number> = {
    start: 34,
    keystone: 38,
    notable: 24,
    small: 10,
    travel: 9,
    hub: 10,
  };
  const gave = new Set(large?.gaveUp.map((g) => g.name) ?? []);
  for (const n of nodes) {
    if (!live(n.id)) continue;
    const r = R[n.kind] * scale * 1.4;
    cv.disc(X(n.x), Y(n.y), r, n.kind === 'start' ? hex('#ffffff') : colOf(n.id), 1);
    if (big(n.id) && gave.has(n.name) && !inL.has(n.id)) {
      cv.ring(X(n.x), Y(n.y), r + 3, 2, hex('#ff4a5a'), 1);
      cv.text(n.name, X(n.x), Y(n.y) + r + 9, 1, hex('#ff8a95'), 'middle');
    }
    if (big(n.id) && (inL.has(n.id) || inS.has(n.id)))
      cv.text(n.name, X(n.x), Y(n.y) + r + 9, 1, hex('#e8e4d8'), 'middle');
  }
  cv.text(
    `${a.id}: blue 60 only, yellow both, orange 120 only, red ring given up at 120`,
    10,
    16,
    2,
    hex('#e8e4d8'),
    'start',
  );
  cv.save(path);
}

// ---- Run.
const pct = (x: number) => `${Math.round(100 * x)}%`;
const fmt = (n: number) =>
  Math.abs(n - Math.round(n)) < 0.05 ? String(Math.round(n)) : n.toFixed(1);
const all: Result[] = [];
for (const a of ARCHETYPES) {
  if (only && !only.includes(a.id)) continue;
  const res = budgets.map((b) => measure(a, b));
  all.push(...res);
  console.log(`\n== ${a.id} (${a.start}): ${a.want}`);
  for (const r of res) {
    console.log(
      `  ${r.budget} pts: reach ${pct(r.reach)} (r${radius}; ${Object.entries(r.reachAt)
        .map(([k, x]) => `${k}:${pct(x)}`)
        .join(
          ' ',
        )}), choice ${r.choice} [${r.nearScores.map((s) => pct(s)).join(' ')}], tax ${pct(r.tax.share)} (${r.tax.points}; roads ${r.tax.road}), depth max ${r.depth.max} p90 ${r.depth.p90}, attrs str ${r.attrs.str} dex ${r.attrs.dex} int ${r.attrs.int}${r.points < r.budget ? `, ${r.budget - r.points} points unspent` : ''}`,
    );
    for (const f of r.families)
      console.log(
        `    ${f.label}: ${pct(f.takenWithin / (f.withinUnits || 1))} of the ${fmt(f.withinUnits)} units within reach; ${fmt(f.units)} units in all (${Object.entries(
          f.plan,
        )
          .map(([k, x]) => `${k} ${fmt(x)}`)
          .join(', ')})`,
      );
    console.log(
      `    pair ${r.pair.labels.join(' + ')}: ${fmt(r.pair.units[0])} + ${fmt(r.pair.units[1])} units, of ${fmt(r.pair.within[0])} + ${fmt(r.pair.within[1])} within reach`,
    );
    console.log(`    took: ${r.taken.join(', ')}`);
    console.log(
      `    gave up: ${r.gaveUp
        .slice(0, 12)
        .map((g) => `${g.name} (${fmt(g.value)}, +${g.cost})`)
        .join(', ')}${r.gaveUp.length > 12 ? `, and ${r.gaveUp.length - 12} more` : ''}`,
    );
  }
  if (picDir) {
    mkdirSync(picDir, { recursive: true });
    picture(a, res, join(picDir, `${a.id}.png`));
  }
}
if (jsonOut) writeFileSync(jsonOut, JSON.stringify({ radius, results: all }, null, 1));
