/**
 * Walks the archetypes of `archetypes.ts` through the hand-written network and reports how much tension it gives them
 * (docs/tree/design/G-growth.md §1). For every budget from 60 to 160 points, the best plan an allocator finds; from
 * those, each main stat's curve (how much of it a build holds as its points grow, in the stat's own terms), what a build
 * gave up at 60 and at 120 points (what 40 more points would buy), and at 60 and 120 the choice and the tax. Never one
 * number for a build. Budgets above 123 are not reachable in a run: they probe what a finished build still wants.
 *
 *   npx tsx scripts/passives/builds.ts [--only id,id] [--json out.json] [--pics dir]
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
import { CLASSES } from '../../src/data/classes';
import { buildAll } from '../../src/data/passives';
import { makeLine } from '../../src/data/passives/vocab';
import type { LineSpec } from '../../src/data/passives/types';
import { Canvas, hex } from '../tree/png';
import { ARCHETYPES, type Archetype } from './archetypes';

/**
 * The budgets judged: mid-run and a finished build (G-growth §0). Each is the best plan for its budget, then grown by
 * GROW points at a time up to NEXT more (keeping every node it has, as a player's build grows): what more points would
 * buy. 160 is above the game's 123 points: a probe of what a finished build still wants, not a reachable build.
 */
const JUDGED = [60, 120];
const GROW = 20;
const NEXT = 40;
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
  if (a.weights[`${fn}:*`] !== undefined) return a.weights[`${fn}:*`];
  return 0;
}

type Attr = 'str' | 'dex' | 'int';
/**
 * What each node is worth to an archetype. Attribute lines are worth nothing (see archetypes.ts), except an attribute
 * the plan is short of for its gear: `attrW` gives that attribute a weight per unit, so a plan must pay for what its
 * weapon asks. The tax always counts against the values without it.
 */
function valuesFor(a: Archetype, attrW: Partial<Record<Attr, number>> = {}): Float64Array {
  const v = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    if (!live(i)) continue;
    if (nodes[i].kind === 'keystone') v[i] = a.keystones?.[nodes[i].name] ?? 0;
    else
      v[i] = rows[i].reduce((s, r) => {
        if (!ATTR.has(r.key)) return s + r.units * weightOf(a, r.key);
        const w =
          r.key === 'allAttr'
            ? Math.max(attrW.str ?? 0, attrW.dex ?? 0, attrW.int ?? 0)
            : (attrW[r.key as Attr] ?? 0);
        return s + r.units * w;
      }, 0);
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
function prune(set: Set<number>, start: number, free: number, v: Float64Array, keep: Set<number>) {
  let freed = 0;
  while (freed < free) {
    const ls = leaves(set, start).filter((i) => !keep.has(i));
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

/** The best plan for a budget; with `base`, the best that keeps every node of `base` (a build growing from it). */
function solve(
  a: Archetype,
  budget: number,
  v: Float64Array,
  banned: Set<number>,
  base?: Set<number>,
): Plan {
  const start = built.tree.starts[a.start];
  const set = new Set<number>(base ?? [start]);
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
      if (need > left) prune(trial, start, need - left, v, base ?? new Set());
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
/** One stat family of a plan: units, and amounts in their own terms by line key. */
type Family = { label: string; units: number; amounts: Record<string, number> };
type Step = {
  budget: number;
  points: number;
  families: Family[];
  choice: number;
  nearScores: number[];
  /** How much the swaps and bans gained over the first greedy plan (a check on the search). */
  searchGain: number;
  tax: { points: number; share: number; road: number };
  attrs: { str: number; dex: number; int: number };
  /** What the plan still lacks for its gear, the class's own attributes counted. */
  short: Partial<Record<Attr, number>>;
  taken: string[];
  plan: number[];
};
/** What a build gave up at a budget: the wanted notables and keystones NEXT more points would add to its plan. */
type Verdict = { budget: number; gaveUp: { name: string; value: number }[] };
type Result = { id: string; start: string; want: string; curve: Step[]; judged: Verdict[] };

function familyOf(a: Archetype, label: string, set: Set<number>): Family {
  const keys = new Set(a.main[label]);
  const amounts: Record<string, number> = {};
  let units = 0;
  for (const i of set)
    for (const r of rows[i]) {
      if (!keys.has(r.key)) continue;
      units += r.units;
      amounts[r.key] = (amounts[r.key] ?? 0) + r.amount;
    }
  return { label, units, amounts };
}

/** How far a plan falls short of its gear, by attribute, with the class's own attributes counted. */
function shortOf(a: Archetype, set: Set<number>): Partial<Record<Attr, number>> {
  const base = CLASSES.find((c) => c.id === a.start)!.attrs;
  const out: Partial<Record<Attr, number>> = {};
  for (const k of ['str', 'dex', 'int'] as const) {
    const need = a.gear?.[k] ?? 0;
    let have = base[k];
    for (const i of set) have += attrOf(i, k);
    if (have < need) out[k] = need - have;
  }
  return out;
}

function measure(a: Archetype): Result {
  const v0 = valuesFor(a);
  const start = built.tree.starts[a.start];
  const fromStart = bfs([start], v0, new Set()).d;
  const step = (budget: number, set: Set<number>, near: Plan[] | null, gain: number): Step => {
    const points = set.size - 1;
    let taxPts = 0,
      road = 0;
    for (const i of set) {
      if (i === start) continue;
      if (v0[i] <= 0) taxPts++;
      if (nodes[i].kind === 'travel') road++;
    }
    const attrs = { str: 0, dex: 0, int: 0 };
    for (const i of set) for (const k of ['str', 'dex', 'int'] as const) attrs[k] += attrOf(i, k);
    return {
      budget,
      points,
      families: Object.keys(a.main).map((l) => familyOf(a, l, set)),
      choice: near?.length ?? 0,
      nearScores: near?.map((p) => p.score / near[0].score) ?? [],
      searchGain: gain,
      tax: { points: taxPts, share: points ? taxPts / points : 0, road },
      attrs,
      short: shortOf(a, set),
      taken: [...set]
        .filter(big)
        .sort((x, y) => fromStart[x] - fromStart[y])
        .map((i) => nodes[i].name),
      plan: [...set].sort((x, y) => x - y),
    };
  };
  const curve: Step[] = [];
  const judged: Verdict[] = [];
  for (const budget of JUDGED) {
    // Solve; while the plan is short of its gear, value the attribute it lacks more and solve again.
    let v = v0;
    let found = plans(a, budget, v);
    const attrW: Partial<Record<Attr, number>> = {};
    for (let round = 0; round < 5; round++) {
      const short = shortOf(a, found.best.set);
      if (!Object.keys(short).length) break;
      for (const k of Object.keys(short) as Attr[]) attrW[k] = (attrW[k] ?? 0) + 0.15;
      v = valuesFor(a, attrW);
      found = plans(a, budget, v);
    }
    const { best, near, firstGain } = found;
    curve.push(step(budget, best.set, near, firstGain));
    // The same build grown by GROW points at a time: what more points would buy.
    let set = best.set;
    for (let more = GROW; more <= NEXT; more += GROW) {
      set = solve(a, budget + more, v, new Set(), set).set;
      curve.push(step(budget + more, set, null, 0));
    }
    const gaveUp = [...set]
      .filter((i) => big(i) && !best.set.has(i) && v0[i] > 0 && wantedShare(a, i) >= 0.5)
      .map((i) => ({ name: nodes[i].name, value: v0[i] }))
      .sort((x, y) => y.value - x.value);
    judged.push({ budget, gaveUp });
  }
  return { id: a.id, start: a.start, want: a.want, curve, judged };
}

// ---- Pictures: the network dimmed; the best 60-point plan, what the best 120-point plan adds, what 40 more would add.
function picture(a: Archetype, res: Result, path: string) {
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
  const planAt = (b: number) => new Set(res.curve.find((s) => s.budget === b)?.plan ?? []);
  const p60 = planAt(60),
    p120 = planAt(120),
    p160 = planAt(120 + NEXT);
  const COL = [hex('#3a3e4c'), hex('#ffe08a'), hex('#f08a4a'), hex('#ff4a5a')];
  const tier = (i: number) => (p60.has(i) ? 1 : p120.has(i) ? 2 : p160.has(i) ? 3 : 0);
  for (const n of nodes)
    for (const k of n.links)
      if (k > n.id && live(n.id) && live(k)) {
        const on = tier(n.id) > 0 && tier(k) > 0;
        const t = Math.max(tier(n.id), tier(k));
        cv.line(
          X(n.x),
          Y(n.y),
          X(nodes[k].x),
          Y(nodes[k].y),
          on ? 3 : 1,
          on ? COL[t] : COL[0],
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
  for (const n of nodes) {
    if (!live(n.id)) continue;
    const r = R[n.kind] * scale * 1.4;
    const t = tier(n.id);
    if (t === 3) cv.ring(X(n.x), Y(n.y), r, 2, COL[3], 1);
    else cv.disc(X(n.x), Y(n.y), r, n.kind === 'start' ? hex('#ffffff') : COL[t], 1);
    if (big(n.id) && t > 0)
      cv.text(
        n.name,
        X(n.x),
        Y(n.y) + r + 9,
        1,
        t === 3 ? hex('#ff8a95') : hex('#e8e4d8'),
        'middle',
      );
  }
  cv.text(
    `${a.id}: yellow the best 60 points, orange what the best 120 adds, red rings what ${NEXT} more would add`,
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
const pad = (s: string, n: number) => (s.length >= n ? s : ' '.repeat(n - s.length) + s);
const all: Result[] = [];
for (const a of ARCHETYPES) {
  if (only && !only.includes(a.id)) continue;
  const res = measure(a);
  all.push(res);
  const at = (b: number) => res.curve.find((s) => s.budget === b)!;
  console.log(`\n== ${a.id} (${a.start}): ${a.want}`);
  for (const b of JUDGED) {
    const s = at(b);
    console.log(
      `  ${b} points: choice ${s.choice} [${s.nearScores.map(pct).join(' ')}], tax ${pct(s.tax.share)} (${s.tax.points}; roads ${s.tax.road}), attributes str ${s.attrs.str} dex ${s.attrs.dex} int ${s.attrs.int}${
        Object.keys(s.short).length
          ? ` (short of gear: ${Object.entries(s.short)
              .map(([k, x]) => `${k} ${x}`)
              .join(', ')})`
          : ''
      }${s.points < b ? `, ${b - s.points} points unspent` : ''}`,
    );
  }
  console.log(`  ${pad('points', 34)}${res.curve.map((s) => pad(String(s.budget), 7)).join('')}`);
  for (let f = 0; f < res.curve[0].families.length; f++) {
    const label = res.curve[0].families[f].label;
    console.log(
      `  ${pad(`${label}, units`, 34)}${res.curve.map((s) => pad(fmt(s.families[f].units), 7)).join('')}`,
    );
    const keys = [...new Set(res.curve.flatMap((s) => Object.keys(s.families[f].amounts)))];
    for (const k of keys)
      console.log(
        `  ${pad(k, 34)}${res.curve.map((s) => pad(fmt(s.families[f].amounts[k] ?? 0), 7)).join('')}`,
      );
  }
  for (const j of res.judged)
    console.log(
      `  gave up at ${j.budget} (what ${NEXT} more points would add): ${j.gaveUp.map((g) => `${g.name} (${fmt(g.value)})`).join(', ') || 'nothing it wants'}`,
    );
  if (picDir) {
    mkdirSync(picDir, { recursive: true });
    picture(a, res, join(picDir, `${a.id}.png`));
  }
}

// ---- Against the targets of stop 1 (docs/tree/design/G0-baseline.md): directions, not gates.
const median = (xs: number[]) => {
  const s = [...xs].sort((x, y) => x - y);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};
const growth = (r: Result, b: number) => {
  const now = r.curve.find((s) => s.budget === b)!,
    later = r.curve.find((s) => s.budget === b + NEXT)!;
  return now.families
    .map((f, i) => (f.units > 0 ? (later.families[i].units - f.units) / f.units : NaN))
    .filter((g) => !Number.isNaN(g));
};
const at120 = all.map((r) => r.curve.find((s) => s.budget === 120)!);
const g120 = all.flatMap((r) => growth(r, 120)),
  g60 = all.flatMap((r) => growth(r, 60));
const share = (xs: boolean[]) => pct(xs.filter(Boolean).length / (xs.length || 1));
console.log(`\n== Against the targets (${all.length} archetypes)`);
console.log(
  `  1. at 120, what ${NEXT} more points add to the typical main stat: ${pct(median(g120))} (target about 30%+); main stats gaining 10% or less: ${share(g120.map((g) => g <= 0.1))} (target about 10%); archetypes whose every main stat gains 20%+: ${all.filter((r) => growth(r, 120).every((g) => g >= 0.2)).length} (target about two in three)`,
);
console.log(
  `  2. at 60, the typical main stat: ${pct(median(g60))} (target about 50%); gaining 10% or less: ${share(g60.map((g) => g <= 0.1))}`,
);
const wanted = all.map(
  (r) => r.judged.find((j) => j.budget === 120)!.gaveUp.filter((g) => g.value >= 2.5).length,
);
console.log(
  `  3. at 120, notables worth 2.5+ units that ${NEXT} more points add: typically ${median(wanted)}, ${wanted.filter((n) => n === 0).length} builds with none (target two or more for most)`,
);
console.log(
  `  4. at 120, choice: ${at120.filter((s) => s.choice <= 1).length} builds with one plan, ${at120.filter((s) => s.choice >= 3).length} with three or more (target two or more for all, three for about half)`,
);
console.log(
  `  5. at 120, tax: typically ${pct(median(at120.map((s) => s.tax.share)))}, ${at120.filter((s) => s.tax.share > 1 / 3).length} builds above a third (target a third or less for most)`,
);
if (jsonOut)
  writeFileSync(
    jsonOut,
    JSON.stringify({ judged: JUDGED, grow: GROW, next: NEXT, results: all }, null, 1),
  );
