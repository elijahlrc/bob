/**
 * Balance baseline: a headless player that makes random camp decisions (no strategy).
 * A balanced game should end these runs early; this reports how early.
 *
 *   npm run random -- [--runs 10] [--class all|id,id] [--maps 30] [--seed 1] [--moves 8] [--verbose] [--report]
 */
import { median } from '../src/core/math';
import { CLASSES } from '../src/data/classes';
import { killerText } from '../src/run/metrics';
import { randomRun, type RandomRunResult } from '../src/run/randomBot';
import { depthReport } from '../src/run/report';

const argv = process.argv.slice(2);
const opt = (k: string, d: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const runs = Number(opt('--runs', '10'));
const classArg = opt('--class', 'all');
const classes = classArg === 'all' ? CLASSES.map((c) => c.id) : classArg.split(',');
const maxMap = Number(opt('--maps', '30'));
const seed = Number(opt('--seed', '1'));
const moves = Number(opt('--moves', '8'));
const verbose = argv.includes('--verbose');

const results: RandomRunResult[] = [];
const t0 = performance.now();
for (let r = 0; r < runs; r++) {
  const cls = classes[r % classes.length];
  const res = randomRun(cls, seed * 1000 + r, maxMap, moves);
  results.push(res);
  const fate = res.died
    ? `died on map ${res.reached}`
    : res.won
      ? 'WON'
      : `survived to map ${res.reached} (cap)`;
  console.log(
    `${String(r + 1).padStart(2)}. ${cls.padEnd(9)} seed ${seed * 1000 + r}: ${fate}, level ${res.level}, ${res.moves} moves` +
      (res.killer ? `, killed by ${killerText(res.killer)}` : ''),
  );
  if (verbose)
    console.log(
      '    ' +
        res.maps
          .map((m) => `${m.map}:${m.status === 'cleared' ? Math.round(m.time) + 's' : m.status}`)
          .join(' '),
    );
}
const died = results.filter((r) => r.died);
console.log('');
console.log(
  `${results.length} runs, ${died.length} died, ${results.length - died.length} reached the cap (map ${maxMap}). ` +
    `Death map: median ${died.length ? median(died.map((r) => r.reached)) : '-'}, ` +
    `earliest ${died.length ? Math.min(...died.map((r) => r.reached)) : '-'}, ` +
    `latest ${died.length ? Math.max(...died.map((r) => r.reached)) : '-'}. ` +
    `Dead within the first 5 maps: ${died.filter((r) => r.reached <= 5).length}/${results.length}.`,
);
console.log(`Wall time ${((performance.now() - t0) / 1000).toFixed(1)} s`);
if (argv.includes('--report')) console.log('\n' + depthReport(results));
