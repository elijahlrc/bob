/**
 * The measurement of docs/DUEL-BALANCE.md 8.1: the rival builds a sim dumped (`--rivals-dump`, scripts/rivallog.ts), fought as the
 * rivals screen pairs them (within 10 maps), in both orders and on a few seeds, under three rules:
 *
 *   new   the game's rules (three Bargain Coins a side, the life curve, the 180 s cap won by fewer reprieves)
 *   flat  the same with the life curve off (every side at ×1 life), to see what the curve does to the lower level's chances
 *   old   the rules of F4 (no reprieves, no curve, a 90 s cap): what the plan set out to change
 *
 *   npx tsx scripts/duel-balance.ts --out <dir> --shard i/n [--seeds 2] <dump.json>...    fight a shard of the pairs, write <dir>/<i>.json
 *   npx tsx scripts/duel-balance.ts --report <dir>                                        print the tables from every shard
 *
 * Run the shards side by side (one process per core) and then the report. Nothing here is in the game.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { median } from '../src/core/math';
import type { Build } from '../src/data/types';
import { createDuelWorld, duelEnd, duelResult, duelWatch, type DuelOpts } from '../src/sim/duel';
import { stepWorld } from '../src/sim/world';
import type { DumpedRival } from './rivallog';

const RULES: Record<string, DuelOpts> = {
  new: {},
  flat: { lifeCurve: false },
  old: { reprieves: 0, lifeCurve: false, maxTime: 90 },
};

/** One fight: the two builds (indices into the sorted list) as side 0 and side 1, and what came of it. */
type Fight = {
  rules: string;
  a: number;
  b: number;
  seed: number;
  mirror: boolean;
  winner: 0 | 1 | null;
  how: string;
  time: number;
  used: [number, number];
  /** The side whose damage reached the other character first (null if none did). */
  first: 0 | 1 | null;
  /** Whether each side had minions standing at some point. */
  minions: [boolean, boolean];
  levels: [number, number];
};

function fight(
  rows: Build[],
  a: number,
  b: number,
  seed: number,
  rules: string,
  mirror: boolean,
): Fight {
  const opts = RULES[rules];
  const w = createDuelWorld(structuredClone(rows[a]), structuredClone(rows[b]), seed, opts);
  const watch = duelWatch(opts);
  const ids = w.sides.map((s) => s.player.id);
  let first: 0 | 1 | null = null;
  const minions: [boolean, boolean] = [false, false];
  let end = duelEnd(w, watch);
  while (!end) {
    stepWorld(w);
    if (first === null)
      for (const e of w.events)
        if (e.t === 'hit' && !e.immune && e.amount > 0 && ids.includes(e.dst)) {
          first = e.dst === ids[0] ? 1 : 0;
          break;
        }
    for (let i = 0; i < 2; i++) if (w.sides[i].minions.length > 0) minions[i] = true;
    end = duelEnd(w, watch);
  }
  const r = duelResult(w, end);
  return {
    rules,
    a,
    b,
    seed,
    mirror,
    winner: r.winner,
    how: r.how,
    time: r.time,
    used: [r.sides[0].reprieves, r.sides[1].reprieves],
    first,
    minions,
    levels: [rows[a].level, rows[b].level],
  };
}

const argv = process.argv.slice(2);
const arg = (k: string) => {
  const i = argv.indexOf(k);
  return i >= 0 ? argv[i + 1] : undefined;
};

const reportDir = arg('--report');
if (reportDir) report(reportDir);
else measure();

function measure(): void {
  const out = arg('--out')!;
  const [shard, shards] = (arg('--shard') ?? '0/1').split('/').map(Number);
  const seeds = Number(arg('--seeds') ?? '2');
  const files = argv.filter(
    (a, i) => a.endsWith('.json') && !['--out', '--report'].includes(argv[i - 1]),
  );
  const dumped: DumpedRival[] = files.flatMap((f) => JSON.parse(readFileSync(f, 'utf8')));
  // A fixed order, so that every shard numbers the builds alike.
  dumped.sort(
    (x, y) =>
      x.record.map - y.record.map ||
      x.record.level - y.record.level ||
      x.record.class_id.localeCompare(y.record.class_id) ||
      x.record.name.localeCompare(y.record.name),
  );
  const rows = dumped.map((d) => d.record.build);
  const jobs: (() => Fight)[] = [];
  for (let i = 0; i < rows.length; i++) {
    for (let s = 1; s <= seeds * 3; s++) jobs.push(() => fight(rows, i, i, s, 'new', true));
    for (let j = i + 1; j < rows.length; j++) {
      if (Math.abs(dumped[i].record.map - dumped[j].record.map) > 10) continue;
      for (const rules of Object.keys(RULES))
        for (let s = 1; s <= seeds; s++) {
          jobs.push(() => fight(rows, i, j, s, rules, false));
          jobs.push(() => fight(rows, j, i, s, rules, false));
        }
    }
  }
  const mine = jobs.filter((_, k) => k % shards === shard);
  const fights = mine.map((job) => job());
  mkdirSync(out, { recursive: true });
  writeFileSync(`${out}/${shard}.json`, JSON.stringify(fights));
  console.log(`shard ${shard}/${shards}: ${fights.length} fights`);
}

function report(dir: string): void {
  const all: Fight[] = readdirSync(dir)
    .filter((f) => /^\d+\.json$/.test(f))
    .flatMap((f) => JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')));
  const pct = (x: number, n: number) => (n ? `${((100 * x) / n).toFixed(0)}%` : '-');
  const s1 = (x: number) => x.toFixed(1);
  /** The median of some seconds, or a dash for none. */
  const med = (xs: number[]) => (xs.length ? s1(median(xs)) : '-');
  const pairs = all.filter((f) => !f.mirror);
  const of = (rules: string) => pairs.filter((f) => f.rules === rules);
  /** A side's score in a fight: 1 for a win, a half for a draw. */
  const score = (f: Fight, side: 0 | 1) => (f.winner === null ? 0.5 : f.winner === side ? 1 : 0);

  console.log(
    `${all.length} fights (${pairs.length} between pairs, ${all.length - pairs.length} mirrored)\n`,
  );

  console.log(
    'Fight length by band of ten levels (the mean level of the pair): median seconds, and the share on the cap',
  );
  console.log('  band     fights   new (cap, decided)          flat     old');
  const bands = [...new Set(pairs.map((f) => Math.floor((f.levels[0] + f.levels[1]) / 20)))].sort(
    (x, y) => x - y,
  );
  for (const b of bands) {
    const inBand = (rules: string) =>
      of(rules).filter((f) => Math.floor((f.levels[0] + f.levels[1]) / 20) === b);
    const nw = inBand('new');
    const cap = nw.filter((f) => f.how === 'time');
    console.log(
      `  ${String(b * 10).padStart(2)}-${String(b * 10 + 9).padEnd(4)} ${String(nw.length).padStart(6)}   ${med(nw.map((f) => f.time)).padStart(6)} s (${pct(cap.length, nw.length)} cap, ${pct(cap.filter((f) => f.winner !== null).length, cap.length)} of those decided)`.padEnd(
        52,
      ) +
        `${med(inBand('flat').map((f) => f.time)).padStart(6)} s ${med(inBand('old').map((f) => f.time)).padStart(6)} s`,
    );
  }

  console.log('\nHow fights end');
  for (const rules of Object.keys(RULES)) {
    const fs = of(rules);
    const n = (how: string, won?: boolean) =>
      fs.filter((f) => f.how === how && (won === undefined || (f.winner !== null) === won)).length;
    console.log(
      `  ${rules.padEnd(5)} ${fs.length} fights · median ${med(fs.map((f) => f.time))} s · death ${pct(n('death'), fs.length)}, time won ${pct(n('time', true), fs.length)}, time drawn ${pct(n('time', false), fs.length)}, stall ${pct(n('stall'), fs.length)}`,
    );
  }
  const nw = of('new');
  const usedBy = [0, 1, 2, 3].map((k) => nw.filter((f) => Math.max(...f.used) === k).length);
  console.log(
    `  new: the most reprieves either side used, 0 to 3: ${usedBy.map((k) => pct(k, nw.length)).join(' / ')}`,
  );

  console.log('\nThe lower level, by the gap in levels: its score (a draw is a half)');
  for (const [lo, hi] of [
    [1, 4],
    [5, 10],
    [11, 99],
  ]) {
    const line = Object.keys(RULES)
      .map((rules) => {
        const fs = of(rules).filter((f) => {
          const g = Math.abs(f.levels[0] - f.levels[1]);
          return g >= lo && g <= hi;
        });
        const sc = fs.reduce((t, f) => t + score(f, f.levels[0] < f.levels[1] ? 0 : 1), 0);
        return `${rules} ${pct(sc, fs.length)} of ${fs.length}`;
      })
      .join(' · ');
    console.log(`  gap ${lo}-${hi}: ${line}`);
  }

  console.log('\nThe side whose damage reached the other character first: its score');
  for (const rules of Object.keys(RULES)) {
    const fs = of(rules).filter((f) => f.first !== null);
    const sc = fs.reduce((t, f) => t + score(f, f.first!), 0);
    console.log(`  ${rules.padEnd(5)} ${pct(sc, fs.length)} of ${fs.length}`);
  }

  console.log(
    '\nMinion builds against the others (a side that had minions standing, the other none): the minion side’s score',
  );
  for (const rules of Object.keys(RULES)) {
    const fs = of(rules).filter((f) => f.minions[0] !== f.minions[1]);
    const sc = fs.reduce((t, f) => t + score(f, f.minions[0] ? 0 : 1), 0);
    console.log(`  ${rules.padEnd(5)} ${pct(sc, fs.length)} of ${fs.length}`);
  }

  const mir = all.filter((f) => f.mirror);
  const w0 = mir.filter((f) => f.winner === 0).length;
  const w1 = mir.filter((f) => f.winner === 1).length;
  console.log(
    `\nMirrored builds (new rules): side 0 won ${w0}, side 1 won ${w1}, ${mir.length - w0 - w1} drawn; a fair coin's band is ±${(1.5 * Math.sqrt(w0 + w1)).toFixed(1)} from ${((w0 + w1) / 2).toFixed(1)}; median ${med(mir.map((f) => f.time))} s`,
  );
}
