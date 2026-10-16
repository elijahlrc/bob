/**
 * Ladder plausibility probe (docs/LADDER.md section 3): how big a Build is as JSON at several maps, how fast a headless duel
 * runs, and whether "A attacks a dummy wearing B's defence" (the crossfire of LADDER.md 5.1) tells builds apart.
 *
 *   npx tsx scripts/ladder-probe.ts [--classes all|vanguard,mystic] [--seeds 1,2] [--maps 80] [--duel 20,40,60] [--legacy]
 *                                   [--scale 0.1] [--save snaps.json] [--load snaps.json]
 *
 * `--legacy` plays the bot on the legacy difficulty (the default kills it on maps 10 to 20). `--scale` multiplies the dummy's
 * damage taken (a PvP handicap). `--save` keeps the builds it snapshots, so `--load` can re-run the duels without the bot.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { Character } from '../src/calc/character';
import { CLASSES } from '../src/data/classes';
import type { Build } from '../src/data/types';
import { botRun } from '../src/run/bot';
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
const scale = Number(arg('--scale', '1'));
const saveFile = arg('--save', '');
const loadFile = arg('--load', '');
const SNAPS = [10, 20, 40, 60, 80, 100];

type Snap = { cls: string; seed: number; map: number; level: number; build: Build };
let snaps: Snap[] = [];

const t0 = performance.now();
if (loadFile) snaps = JSON.parse(readFileSync(loadFile, 'utf8')) as Snap[];
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
console.log(`damage scale ${scale}`);

// ---- Sizes ----
console.log(
  'build sizes (bytes): class seed map level | json gzip | items affixes gems | allocated',
);
for (const s of snaps) {
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
  world.opts.freeResources = false;
  const start = performance.now();
  while (world.status === 'running' && dummy.alive) stepWorld(world);
  return { t: dummy.alive ? Infinity : world.t, ms: performance.now() - start };
}

const name = (s: Snap) => `${s.cls.slice(0, 5)}${s.seed}`;
const f = (t: number) => (t === Infinity ? 'inf' : t.toFixed(1));
/** The median time to kill over three seeds. */
const median = (a: Build, b: Build) =>
  [1, 2, 3].map((s) => ttk(a, b, s).t).sort((x, y) => x - y)[1];

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
