/**
 * Ladder plausibility probe (docs/LADDER.md section 3): how big a Build is as JSON at several maps, how fast a headless duel
 * runs, and whether "A attacks a dummy wearing B's defence" (the crossfire of LADDER.md 5.1) tells builds apart.
 *
 *   npx tsx scripts/ladder-probe.ts [--classes all|vanguard,mystic] [--seeds 1,2] [--maps 80] [--duel 20,40,60] [--legacy]
 *                                   [--scale 0.1] [--save snaps.json] [--load a.json,b.json]
 *                                   [--real [--scale 1,0.5,0.35] [--fight-seeds 1,2] [--cells]]
 *
 * `--legacy` plays the bot on the legacy difficulty (the default kills it on maps 10 to 20). `--scale` multiplies the dummy's
 * damage taken (a PvP handicap). `--save` keeps the builds it snapshots, so `--load` (one file or several) can re-run the duels
 * without the bot. Builds are snapshotted at 5, 10, 15, 20, 40, 60, 80, 100 and the maps of `--duel`.
 * `--real` fights the matrix with real duels (`runDuel`, docs/DUEL.md F3 and F4) instead of the crossfire, each pair in both
 * orders, one fight per seed of `--fight-seeds` (1), at each damage scale of `--scale` (a list; 1, 0.5, 0.35, 0.25, 0.2, 0.15
 * by default). It prints, for each scale and map, how the fights ended (death, both dead at once, stall, time cap), the quartiles
 * and the longest fight, and how often the west side (side 0) won; `--cells` also prints who beat whom.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { Character } from '../src/calc/character';
import { CLASSES } from '../src/data/classes';
import type { Build } from '../src/data/types';
import { botRun } from '../src/run/bot';
import { runDuel } from '../src/sim/duel';
import { createDummyWorld } from '../src/sim/dummy';
import { stepWorld } from '../src/sim/world';

const argv = process.argv.slice(2);
const arg = (k: string, d: string) => {
  const i = argv.indexOf(k);
  return i >= 0 ? argv[i + 1] : d;
};
const classes = arg('--classes', 'all');
const clsIds = classes === 'all' ? CLASSES.map((c) => c.id) : classes.split(',');
const seeds = arg('--seeds', '1').split(',').map(Number);
const maxMap = Number(arg('--maps', '80'));
const duelMaps = arg('--duel', '40').split(',').map(Number);
const legacy = argv.includes('--legacy');
const real = argv.includes('--real');
const scales = arg('--scale', real ? '1,0.5,0.35,0.25,0.2,0.15' : '1')
  .split(',')
  .map(Number);
const scale = scales[0];
const showCells = argv.includes('--cells');
const saveFile = arg('--save', '');
const loadFile = arg('--load', '');
const fightSeeds = arg('--fight-seeds', '1').split(',').map(Number);
// The maps a build is snapshotted at: the usual ones, 5 and 15 (where the bot on the default difficulty still is), and `--duel`'s.
const SNAPS = [...new Set([5, 10, 15, 20, 40, 60, 80, 100, ...duelMaps])];

type Snap = { cls: string; seed: number; map: number; level: number; build: Build };
let snaps: Snap[] = [];

const t0 = performance.now();
if (loadFile)
  for (const f of loadFile.split(','))
    snaps.push(...(JSON.parse(readFileSync(f, 'utf8')) as Snap[]));
for (const cls of loadFile ? [] : clsIds)
  for (const seed of seeds) {
    const seen = new Set<number>();
    const start = performance.now();
    const res = botRun(cls, seed * 1000 + 7, maxMap, {
      ...(legacy ? { difficulty: { scaling: 1, base: 1, variance: 0 } } : {}),
      onTick: (_w, run) => {
        if (SNAPS.includes(run.map) && !seen.has(run.map)) {
          seen.add(run.map);
          snaps.push({
            cls,
            seed,
            map: run.map,
            level: run.build.level,
            build: structuredClone(run.build),
          });
        }
      },
    });
    console.log(
      `run ${cls} seed ${seed}: reached map ${res.reached}, ${((performance.now() - start) / 1000).toFixed(1)} s wall`,
    );
  }
console.log(`bot runs: ${((performance.now() - t0) / 1000).toFixed(1)} s\n`);
if (saveFile) writeFileSync(saveFile, JSON.stringify(snaps));
if (!real) console.log(`damage scale ${scale}`);

// ---- Sizes ----
if (!real)
  console.log(
    'build sizes (bytes): class seed map level | json gzip | items affixes gems | allocated',
  );
for (const s of real ? [] : snaps) {
  const json = JSON.stringify(s.build);
  const gz = gzipSync(Buffer.from(json)).length;
  const items = Object.values(s.build.equipment).filter((it) => it !== undefined);
  const affixes = items.reduce((n, it) => n + it.affixes.length + it.implicits.length, 0);
  const gems = items.reduce((n, it) => n + it.sockets.filter((g) => g !== null).length, 0);
  console.log(
    `${s.cls.padEnd(9)} ${s.seed} ${String(s.map).padStart(3)} ${String(s.level).padStart(3)} | ${String(json.length).padStart(6)} ${String(gz).padStart(5)} | ${items.length} ${affixes} ${gems} | ${s.build.allocated.length}`,
  );
}

// ---- Duels: A attacks a dummy with B's defence; the time to kill it. ----
function ttk(a: Build, b: Build, seed: number): { t: number; ms: number } {
  const defB = new Character(b, { areaLevel: a.level }).defence();
  const { world, dummy } = createDummyWorld(a, {
    distance: 4,
    maxTime: 120,
    seed,
    defence: { ...defB, damageTakenMult: defB.damageTakenMult * scale },
    fixed: true,
  });
  world.sides[0].opts.freeResources = false;
  const start = performance.now();
  while (world.status === 'running' && dummy.alive) stepWorld(world);
  return { t: dummy.alive ? Infinity : world.t, ms: performance.now() - start };
}

const name = (s: Snap) => `${s.cls.slice(0, 5)}${s.seed}`;
const f = (t: number) => (t === Infinity ? 'inf' : t.toFixed(1));
/** The median time to kill over three seeds. */
const median = (a: Build, b: Build) =>
  [1, 2, 3].map((s) => ttk(a, b, s).t).sort((x, y) => x - y)[1];

// ---- Real duels (docs/DUEL.md F3, F4): the same matrix, fought with `runDuel` in both orders, at each damage scale. ----
type Real = { winner: 0 | 1 | null; how: 'death' | 'time' | 'stall'; time: number; ms: number };
function fight(a: Build, b: Build, seed: number, damageScale: number): Real {
  const start = performance.now();
  const r = runDuel(a, b, seed, { damageScale });
  return { winner: r.winner, how: r.how, time: r.time, ms: performance.now() - start };
}

/** The value at a share of a sorted list. */
const quantile = (sorted: number[], q: number): number =>
  sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];

/** One row of the length table: how the fights of a set ended and how long they lasted (docs/DUEL.md 4.4). */
function lengthRow(label: string, scaleName: string, builds: number, all: Real[]): string {
  const times = all.map((c) => c.time).sort((x, y) => x - y);
  const by = (f: (c: Real) => boolean) => all.filter(f).length;
  const west = by((c) => c.winner === 0);
  const east = by((c) => c.winner === 1);
  const decided = west + east;
  return [
    label.padEnd(10),
    scaleName.padEnd(5),
    String(builds).padStart(3),
    String(all.length).padStart(5),
    String(by((c) => c.how === 'death' && c.winner !== null)).padStart(5),
    String(by((c) => c.how === 'death' && c.winner === null)).padStart(5),
    String(by((c) => c.how === 'stall')).padStart(5),
    String(by((c) => c.how === 'time')).padStart(5),
    quantile(times, 0.25).toFixed(1).padStart(6),
    quantile(times, 0.5).toFixed(1).padStart(6),
    quantile(times, 0.75).toFixed(1).padStart(6),
    times[times.length - 1].toFixed(1).padStart(6),
    String(west).padStart(5),
    String(east).padStart(5),
    `${decided ? ((100 * west) / decided).toFixed(0) : '-'}%`.padStart(5),
  ].join(' ');
}
const LENGTH_HEADER =
  'pool       scale  bld fights death both  stall   cap     q1 median     q3 longest  west  east west%';

function realMatrix(pool: Snap[], duelMap: number, damageScale: number): Real[] {
  // cells[i][j]: the fights of pool[i] (side 0) against pool[j] (side 1), one per seed.
  const cells: Real[][][] = pool.map(() => pool.map(() => []));
  for (let i = 0; i < pool.length; i++)
    for (let j = 0; j < pool.length; j++)
      if (i !== j)
        for (const seed of fightSeeds)
          cells[i][j].push(fight(pool[i].build, pool[j].build, seed, damageScale));
  if (showCells) {
    console.log(
      `\nreal duels at map ${duelMap}, damage scale ${damageScale}: ${pool.length} builds (${pool.map((p) => name(p)).join(', ')}), seeds ${fightSeeds.join(',')}`,
    );
    console.log(
      'row is side 0 (west), column side 1; r = the row wins, c = the column wins, = a draw; seconds (median of the seeds)',
    );
    for (let i = 0; i < pool.length; i++) {
      const out = pool.map((_, j) => {
        if (i === j) return '    -     ';
        const cs = cells[i][j];
        const letters = cs.map((c) => (c.winner === 0 ? 'r' : c.winner === 1 ? 'c' : '=')).join('');
        const ts = cs.map((c) => c.time).sort((x, y) => x - y);
        return `${letters} ${ts[Math.floor(ts.length / 2)].toFixed(1)}`.padEnd(10);
      });
      console.log(`${name(pool[i]).padEnd(8)} ${out.join(' ')}`);
    }
  }
  // The two orders of a pair and a seed: the same build wins both (the fight is about the builds), or the winner is the side that stood west.
  let agree = 0;
  let disagree = 0;
  let oneDraw = 0;
  for (let i = 0; i < pool.length; i++)
    for (let j = i + 1; j < pool.length; j++)
      for (let k = 0; k < fightSeeds.length; k++) {
        const ij = cells[i][j][k].winner;
        const ji = cells[j][i][k].winner;
        if (ij === null || ji === null) {
          oneDraw++;
          continue;
        }
        // ij: 0 means pool[i] won; ji: 0 means pool[j] won, so the same build won both when exactly one of them is 0.
        if ((ij === 0) !== (ji === 0)) agree++;
        else disagree++;
      }
  const all = cells.flat(2);
  console.log(
    `${lengthRow(`map ${duelMap}`, String(damageScale), pool.length, all)}   | orders agree ${agree}, disagree ${disagree}, a draw ${oneDraw}; ${(all.reduce((n, c) => n + c.ms, 0) / all.length).toFixed(0)} ms each`,
  );
  return all;
}

if (real) {
  console.log(`\nreal duels, fight seeds ${fightSeeds.join(',')}, each pair in both orders`);
  console.log(LENGTH_HEADER);
  for (const sc of scales) {
    const total: Real[] = [];
    let builds = 0;
    for (const duelMap of duelMaps) {
      const pool = snaps.filter((s) => s.map === duelMap);
      if (pool.length < 2) {
        console.log(`no two builds reached map ${duelMap}; duel skipped`);
        continue;
      }
      builds += pool.length;
      total.push(...realMatrix(pool, duelMap, sc));
    }
    if (total.length > 0 && duelMaps.length > 1)
      console.log(lengthRow('all maps', String(sc), builds, total));
  }
  process.exit(0);
}

for (const duelMap of duelMaps) {
  const pool = snaps.filter((s) => s.map === duelMap);
  if (pool.length < 2) {
    console.log(`\nno two builds reached map ${duelMap}; duel skipped`);
    continue;
  }
  console.log(
    `\nduels at map ${duelMap}: ${pool.length} builds (${pool.map((p) => name(p)).join(', ')})`,
  );
  console.log('time to kill (s), row attacks column; 3 seeds min/median/max, and wall ms per duel');
  let totalMs = 0;
  let duels = 0;
  for (const a of pool) {
    const cells: string[] = [];
    for (const b of pool) {
      if (a === b) {
        cells.push('   -    ');
        continue;
      }
      const ts = [1, 2, 3].map((seed) => {
        const r = ttk(a.build, b.build, seed);
        totalMs += r.ms;
        duels++;
        return r.t;
      });
      ts.sort((x, y) => x - y);
      cells.push(`${f(ts[0])}/${f(ts[1])}/${f(ts[2])}`.padEnd(14));
    }
    console.log(`${name(a).padEnd(8)} ${cells.join(' ')}`);
  }
  // Pairwise outcome by median time: who kills first.
  const wins = new Map<Snap, number>();
  for (const a of pool) {
    let w = 0;
    for (const b of pool) if (a !== b && median(a.build, b.build) < median(b.build, a.build)) w++;
    wins.set(a, w);
  }
  console.log(`\nwins by median time-to-kill (out of ${pool.length - 1}):`);
  for (const [s, w] of [...wins].sort((x, y) => y[1] - x[1]))
    console.log(`  ${name(s).padEnd(8)} ${w}   level ${s.level}`);
  console.log(
    `\n${duels} duels, ${(totalMs / duels).toFixed(1)} ms each on average (sim-seconds capped at 120)`,
  );
}
