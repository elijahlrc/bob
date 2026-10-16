/**
 * The hash fence (docs/DUEL.md 8.1): the proof that a change to the sim's structure moved no number.
 *
 *   npm run fence                       play every run and compare with scripts/hash-fence.json; exits 1 on any mismatch
 *   npm run fence -- --write            record the hashes (on a tree known to be right; the file is not committed)
 *   npm run fence -- [--maps 10] [--seeds 1,2] [--class all|id,id] [--deep] [--events]
 *
 * Each run is the bot (`botRun`) playing one class from one seed to map `--maps` (default 10: six classes, seeds 1 and 2).
 * `--deep` is the wider fence (maps 1 to 30, seeds 1 to 3): the late maps bring in the skills, minions and monsters the first
 * ten do not. A run is recorded under `class:seed:maps`, so the two fences live side by side in the one file.
 *
 * One hash per run covers
 *   - every tick's events of every map, hashed exactly as `hashEvents` does (src/sim/runMap.ts);
 *   - each map's whole `MapResult` (its `eventHash`, time, kills, stuck, picked, vitals, ledger report, ...), as JSON;
 *   - the run's outcome: `reached`, the last map's level and xp, and the rest of the `BotRunResult` (maps played, what was
 *     found, the build's signature), so that a changed camp path (crafting, offers, levelling: also seeded) cannot hide.
 * It reads the sim only through those public results and events, so the script does not change when the sim's structure does.
 *
 * `--events` lists the kinds of event the runs produced and how many (what the fence can see).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { Hasher } from '../src/core/hash';
import { CLASSES } from '../src/data/classes';
import { botRun } from '../src/run/bot';
import { hashEvents } from '../src/sim/runMap';

const argv = process.argv.slice(2);
const opt = (k: string, d: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const write = argv.includes('--write');
const deep = argv.includes('--deep');
const maxMap = Number(opt('--maps', deep ? '30' : '10'));
const seeds = opt('--seeds', deep ? '1,2,3' : '1,2')
  .split(',')
  .map(Number);
const classArg = opt('--class', 'all');
const classes = classArg === 'all' ? CLASSES.map((c) => c.id) : classArg.split(',');
const FILE = new URL('./hash-fence.json', import.meta.url);

type Entry = { hash: string; reached: number; level: number; maps: number; won: boolean };
type Fence = { runs: Record<string, Entry> };

const hex = (n: number) => n.toString(16).padStart(8, '0');
const seen: Record<string, number> = {};

function play(cls: string, seed: number): Entry {
  const h = new Hasher();
  const res = botRun(cls, seed, maxMap, {
    onTick: (w) => {
      hashEvents(h, w);
      for (const e of w.events) seen[e.t] = (seen[e.t] ?? 0) + 1;
    },
    onMap: (r) => {
      h.str(JSON.stringify(r));
      h.num(r.eventHash);
    },
  });
  const last = res.maps[res.maps.length - 1];
  h.num(res.reached)
    .num(last?.level ?? 0)
    .num(last?.xp ?? 0);
  h.str(JSON.stringify(res));
  return {
    hash: hex(h.digest()),
    reached: res.reached,
    level: last?.level ?? 0,
    maps: res.mapsPlayed,
    won: res.won,
  };
}

const stored: Fence = existsSync(FILE)
  ? (JSON.parse(readFileSync(FILE, 'utf8')) as Fence)
  : { runs: {} };
if (!write && !Object.keys(stored.runs).length) {
  console.error(
    'no scripts/hash-fence.json: run `npm run fence -- --write` on a tree known to be right',
  );
  process.exit(2);
}

const bad: string[] = [];
let played = 0;
const t0 = performance.now();
for (const cls of classes) {
  for (const seed of seeds) {
    const key = `${cls}:${seed}:${maxMap}`;
    const t = performance.now();
    const e = play(cls, seed);
    const secs = ((performance.now() - t) / 1000).toFixed(1);
    played++;
    let verdict = '';
    if (write) stored.runs[key] = e;
    else {
      const was = stored.runs[key];
      if (!was) {
        verdict = '  NOT RECORDED';
        bad.push(`${key}: not in the stored fence`);
      } else if (was.hash !== e.hash) {
        verdict = `  MISMATCH (was ${was.hash}; reached ${was.reached}, level ${was.level}, ${was.maps} maps)`;
        bad.push(`${key}: ${e.hash} is not ${was.hash}`);
      } else verdict = '  ok';
    }
    console.log(
      `${key.padEnd(16)} ${e.hash}  reached ${String(e.reached).padStart(2)}  level ${String(e.level).padStart(2)}  maps ${String(e.maps).padStart(2)}${e.won ? '  won' : ''}  ${secs}s${verdict}`,
    );
  }
}
const cpuUsed = process.cpuUsage();
const total = `${((performance.now() - t0) / 1000).toFixed(1)}s wall, ${((cpuUsed.user + cpuUsed.system) / 1e6).toFixed(1)}s cpu`;
if (argv.includes('--events')) {
  const kinds = Object.entries(seen).sort((a, b) => b[1] - a[1]);
  console.log(
    `\n${kinds.length} kinds of event:\n${kinds.map(([k, n]) => `${k} ${n}`).join(', ')}`,
  );
}
if (write) {
  const sorted = Object.fromEntries(
    Object.entries(stored.runs).sort(([a], [b]) => (a < b ? -1 : 1)),
  );
  writeFileSync(FILE, JSON.stringify({ runs: sorted }, null, 2) + '\n');
  console.log(`recorded ${played} runs to scripts/hash-fence.json (${total})`);
} else if (bad.length) {
  console.error(`\nFENCE BROKEN (${total}):\n  ${bad.join('\n  ')}`);
  process.exit(1);
} else console.log(`fence holds: ${played} runs identical (${total})`);
