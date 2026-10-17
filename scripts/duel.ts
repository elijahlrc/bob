/**
 * Fight two builds against each other and read the result (docs/DUEL.md 8.3): who won, how and when, and what each dealt and took.
 *
 *   npm run duel -- --a vanguard:1:20 --b strider:1:20 [--seeds 1,2,3] [--both] [--legacy] [--rows 8]
 *   npm run duel -- --load snaps.json --a 0 --b 1
 *   npm run duel -- --a save-a.json --b save-b.json
 *
 * A build is named by `class:seed:map` (the bot is played from that class and seed to that map and the character taken as it stands
 * there, as scripts/ladder-probe.ts does), by a number (an entry of the probe's `--save` file, read with `--load`), or by a file: a
 * save exported as JSON (`localStorage.getItem('bob.save.1')` in the game's console, or a slot's key), a run's or a build's.
 *
 * `--seeds` fights several seeds (the winner and the time of each; the ledgers are those of the first). `--both` fights each seed
 * in both orders: the arena is asymmetric (side 0 stands west, and strikes first in a tick), so one order says less than two.
 * `--legacy` plays the bot on the legacy difficulty. `--rows` is how many ledger rows to show for a side (8).
 */
import { readFileSync } from 'node:fs';
import { buildReport, type LedgerRow, type MapReport } from '../src/sim/ledger';
import { playDuel, type DuelResult } from '../src/sim/duel';
import { describeBuild, fighterFromSpec, type Fighter, type Snap } from './duel-lib';

const argv = process.argv.slice(2);
const arg = (k: string, d: string) => {
  const i = argv.indexOf(k);
  return i >= 0 ? argv[i + 1] : d;
};
const specA = arg('--a', '');
const specB = arg('--b', '');
if (!specA || !specB) {
  console.error(
    'usage: npm run duel -- --a <build> --b <build> [--seeds 1,2,3] [--both] [--legacy] [--load snaps.json]',
  );
  process.exit(2);
}
const seeds = arg('--seeds', '1').split(',').map(Number);
const both = argv.includes('--both');
const legacy = argv.includes('--legacy');
const rows = Number(arg('--rows', '8'));
const loadFile = arg('--load', '');
const loaded = loadFile ? (JSON.parse(readFileSync(loadFile, 'utf8')) as Snap[]) : [];

const t0 = performance.now();
const A = fighterFromSpec(specA, loaded, legacy);
const B = fighterFromSpec(specB, loaded, legacy);
console.log(`builds ready in ${((performance.now() - t0) / 1000).toFixed(1)} s`);
console.log(`  A  ${A.label}\n     ${describeBuild(A.build)}`);
console.log(`  B  ${B.label}\n     ${describeBuild(B.build)}\n`);

const sum = (d: number[]) => d[0] + d[1] + d[2] + d[3] + d[4];
const TYPES = ['phys', 'light', 'cold', 'fire', 'chaos'];

function printRows(title: string, list: LedgerRow[]): void {
  const all = list.reduce((n, r) => n + sum(r.dmg), 0);
  console.log(`    ${title}: ${all.toFixed(0)}`);
  for (const r of list.slice(0, rows)) {
    const parts = r.dmg
      .map((d, i) => (d > 0 ? `${TYPES[i]} ${d.toFixed(0)}` : ''))
      .filter((x) => x)
      .join(', ');
    console.log(
      `      ${r.name.padEnd(22)} ${r.kind.padEnd(8)} ${sum(r.dmg).toFixed(0).padStart(8)}  hits ${String(r.hits).padStart(3)}  crits ${String(r.crits).padStart(3)}  max ${r.max.toFixed(0).padStart(6)}  ${parts}`,
    );
  }
  if (list.length > rows) console.log(`      ... and ${list.length - rows} more`);
}

function printSide(name: string, f: Fighter, r: DuelResult['sides'][number], rep: MapReport): void {
  const end = r.recap
    ? `fell (${r.recap.killer ?? 'killed'})`
    : `${(r.lifeLeft * 100).toFixed(0)}% life left`;
  console.log(`  ${name} ${f.label}: ${end}`);
  printRows('dealt', rep.dealt);
  printRows('taken', rep.taken);
  console.log(
    `    energy shield ${rep.pools.es.toFixed(0)}, life ${rep.pools.life.toFixed(0)}, mana ${rep.pools.mana.toFixed(0)} taken; evaded ${rep.evaded}, blocked ${rep.blocked}`,
  );
}

type Fight = {
  seed: number;
  order: 'AB' | 'BA';
  winner: 'A' | 'B' | null;
  how: string;
  time: number;
  ms: number;
};
const fights: Fight[] = [];
let first = true;
for (const seed of seeds) {
  for (const order of both ? (['AB', 'BA'] as const) : (['AB'] as const)) {
    const [x, y] = order === 'AB' ? [A, B] : [B, A];
    const start = performance.now();
    const { result, world } = playDuel(x.build, y.build, seed);
    const ms = performance.now() - start;
    const who =
      result.winner === null ? null : (order === 'AB') === (result.winner === 0) ? 'A' : 'B';
    fights.push({ seed, order, winner: who, how: result.how, time: result.time, ms });
    console.log(
      `seed ${seed} ${order === 'AB' ? 'A west, B east' : 'B west, A east'}: ${who ? `${who} wins` : 'a draw'} by ${result.how} at ${result.time.toFixed(1)} s  (${ms.toFixed(0)} ms)`,
    );
    if (first) {
      first = false;
      console.log('');
      printSide(
        order === 'AB' ? 'side 0, A' : 'side 0, B',
        x,
        result.sides[0],
        buildReport(world, world.sides[0]),
      );
      printSide(
        order === 'AB' ? 'side 1, B' : 'side 1, A',
        y,
        result.sides[1],
        buildReport(world, world.sides[1]),
      );
      console.log('');
    }
  }
}
if (fights.length > 1) {
  const tally = (w: 'A' | 'B' | null) => fights.filter((f) => f.winner === w).length;
  const times = fights.map((f) => f.time).sort((p, q) => p - q);
  console.log(
    `\n${fights.length} fights: A won ${tally('A')}, B won ${tally('B')}, drawn ${tally(null)}; median ${times[Math.floor(times.length / 2)].toFixed(1)} s`,
  );
}
