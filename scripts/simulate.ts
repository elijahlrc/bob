/**
 * Headless bot runs (DESIGN.md §15.5).
 *
 *   npm run sim -- --runs 10 --class all [--maps 1-20] [--seed 1] [--measure-xp] [--themes first|best] [--craft greedy|random|none] [--report]
 */
import { writeFileSync } from 'node:fs';
import { median } from '../src/core/math';
import { CLASSES } from '../src/data/classes';
import { botRun, type BotRunResult, type CraftPolicy, type ThemeRule } from '../src/run/bot';
import { depthReport } from '../src/run/report';

type Args = {
  runs: number;
  classes: string[];
  maxMap: number;
  seed: number;
  measureXp: boolean;
  writeXp: boolean;
  json: boolean;
  /** 'first' takes the first offered theme (the old behaviour); 'best' picks by the theme score. */
  themes: ThemeRule;
  /** How the bot spends currency: by the sheet, at random, or not at all. */
  crafting: CraftPolicy;
  report: boolean;
};

function parseArgs(argv: string[]): Args {
  const a: Args = {
    runs: 3,
    classes: CLASSES.map((c) => c.id),
    maxMap: 100,
    seed: 1,
    measureXp: false,
    writeXp: false,
    json: false,
    themes: 'best',
    crafting: 'greedy',
    report: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const v = argv[i + 1];
    if (k === '--runs') a.runs = Number(v);
    else if (k === '--class') a.classes = v === 'all' ? CLASSES.map((c) => c.id) : v.split(',');
    else if (k === '--maps') a.maxMap = Number(v.split('-').pop());
    else if (k === '--seed') a.seed = Number(v);
    else if (k === '--measure-xp') a.measureXp = true;
    else if (k === '--write-xp') a.writeXp = a.measureXp = true;
    else if (k === '--json') a.json = true;
    else if (k === '--themes') a.themes = v === 'first' ? 'first' : 'best';
    else if (k === '--report') a.report = true;
    else if (k === '--craft')
      a.crafting = v === 'none' ? 'none' : v === 'random' ? 'random' : 'greedy';
  }
  return a;
}

const args = parseArgs(process.argv.slice(2));
const results: (BotRunResult & { wallMs: number; simSeconds: number })[] = [];
const t0 = performance.now();
for (const cls of args.classes) {
  for (let r = 0; r < args.runs; r++) {
    const start = performance.now();
    const res = botRun(cls, args.seed * 1000 + r, args.maxMap, {
      themes: args.themes,
      crafting: args.crafting,
    });
    const wallMs = performance.now() - start;
    const simSeconds = res.maps.reduce((s, m) => s + m.time, 0);
    results.push({ ...res, wallMs, simSeconds });
    process.stderr.write(
      `${cls} run ${r + 1}/${args.runs}: ${res.won ? 'WON' : `reached map ${res.reached}`} · level ${res.maps.at(-1)?.level ?? 1} · ${(wallMs / 1000).toFixed(1)} s wall (${(simSeconds / (wallMs / 1000)).toFixed(0)}× real time)\n`,
    );
  }
}

const lines: string[] = [];
lines.push(
  `Bot results — ${args.runs} run(s) per class, maps up to ${args.maxMap}, seed ${args.seed}`,
);
lines.push('');
lines.push(
  '| Class | Wins | Median map reached | Median level @25/50/75 | Deaths (maps) | Stuck/10 maps | Mean map time (1×) | Wall s/run | Speed |',
);
lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
for (const cls of args.classes) {
  const rs = results.filter((r) => r.classId === cls);
  const reached = rs.map((r) => (r.won ? 101 : r.reached));
  const levelAt = (n: number) => {
    const ls = rs
      .map((r) => r.maps.find((m) => m.map === n)?.level)
      .filter((x): x is number => x !== undefined);
    return ls.length ? String(median(ls)) : '–';
  };
  const mapsPlayed = rs.reduce((s, r) => s + r.maps.length, 0);
  const stuck = rs.reduce((s, r) => s + r.maps.reduce((a, m) => a + m.stuck, 0), 0);
  const times = rs.flatMap((r) => r.maps.filter((m) => m.status === 'cleared').map((m) => m.time));
  const wall = rs.reduce((s, r) => s + r.wallMs, 0) / rs.length / 1000;
  const sim = rs.reduce((s, r) => s + r.simSeconds, 0);
  const wallTotal = rs.reduce((s, r) => s + r.wallMs, 0) / 1000;
  const deaths = rs.map((r) => r.deathMap).filter((d): d is number => d !== null);
  const deathText =
    rs.length <= 12
      ? rs.map((r) => r.deathMap ?? '—').join(', ')
      : `${deaths.length}/${rs.length} died${deaths.length ? `, earliest map ${Math.min(...deaths)}, median ${median(deaths)}` : ''}`;
  lines.push(
    `| ${cls} | ${rs.filter((r) => r.won).length}/${rs.length} | ${median(reached)} | ${levelAt(25)}/${levelAt(50)}/${levelAt(75)} | ${deathText} | ${((stuck / Math.max(1, mapsPlayed)) * 10).toFixed(2)} | ${(times.reduce((a, b) => a + b, 0) / Math.max(1, times.length)).toFixed(0)} s | ${wall.toFixed(1)} | ${(sim / wallTotal).toFixed(0)}× |`,
  );
}
const allMaps = results.flatMap((r) => r.maps);
const pacing: string[] = [];
for (const n of [1, 10, 25, 50, 75, 90, 100]) {
  const ls = allMaps.filter((m) => m.map === n).map((m) => m.level);
  if (ls.length) pacing.push(`map ${n}: level ${median(ls)} (n=${ls.length})`);
}
lines.push('');
lines.push(`Pacing (median level after map): ${pacing.join(' · ')}`);
lines.push(`Total wall time: ${((performance.now() - t0) / 1000).toFixed(1)} s`);
console.log(lines.join('\n'));
if (args.report) console.log('\n' + depthReport(results));

if (args.measureXp) {
  // Mean XP per cleared map by area level.
  const byLevel = new Map<number, number[]>();
  for (const m of allMaps)
    if (m.status === 'cleared') byLevel.set(m.map, [...(byLevel.get(m.map) ?? []), m.xp]);
  const out: Record<number, number> = {};
  for (const [l, xs] of [...byLevel].sort((a, b) => a[0] - b[0]))
    out[l] = Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
  console.log('\nMEASURED_XP ' + JSON.stringify(out));
  if (args.writeXp) {
    // Smooth over ±2 maps, fill gaps by interpolation, and write src/data/measuredXp.ts.
    const raw: (number | null)[] = Array.from({ length: 100 }, (_, i) => out[i + 1] ?? null);
    const known = raw.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0);
    const filled = raw.map((v, i) => {
      if (v !== null) return v;
      const lo = [...known].reverse().find((k) => k < i);
      const hi = known.find((k) => k > i);
      if (lo === undefined && hi === undefined) return 0;
      if (lo === undefined) return raw[hi!]!;
      if (hi === undefined) return raw[lo]!;
      return raw[lo]! + ((raw[hi]! - raw[lo]!) * (i - lo)) / (hi - lo);
    });
    const smooth = filled.map((_, i) => {
      let sum = 0;
      let n = 0;
      for (let j = Math.max(0, i - 2); j <= Math.min(99, i + 2); j++) {
        sum += filled[j];
        n++;
      }
      return Math.round(sum / n);
    });
    const body = [
      '// Generated by `npm run sim -- --write-xp` (DESIGN.md §5.4): mean XP the bot earned clearing a',
      '// map at each area level (index 0 = map 1), smoothed over ±2 maps.',
      `export const MEASURED_XP: number[] = ${JSON.stringify(smooth)};`,
      '',
    ].join('\n');
    writeFileSync(new URL('../src/data/measuredXp.ts', import.meta.url), body);
    console.log('wrote src/data/measuredXp.ts');
  }
}
if (args.json)
  console.log(JSON.stringify(results.map(({ maps, ...r }) => ({ ...r, maps: maps.length }))));
