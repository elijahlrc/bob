/**
 * How hard each theme is for the same character (EXPANSION 10.3): play a class with the greedy bot through
 * Ossuary maps up to a map, then run that map under every theme with several seeds. Prints how often the
 * character clears it and how low its life fell, so a new faction can be tuned against the Ossuary.
 *
 *   npm run lethality -- --class vanguard --map 45 --seeds 4 [--scaling 1.5] [--base 1] [--variance 0.1]
 */
import { clampDifficulty } from '../src/data/difficulty';
import { THEMES } from '../src/data/themes';
import { botCamp } from '../src/run/bot';
import { botChalk } from '../src/run/botCraft';
import { finishMap, planFor, worldOptsFor, newRun } from '../src/run/run';
import { runMap } from '../src/sim/runMap';

const arg = (k: string, d: string) => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const classId = arg('class', 'vanguard');
const stopMap = Number(arg('map', '45'));
const seeds = Number(arg('seeds', '4'));
const runSeed = Number(arg('seed', '7'));

// Walk a run up to the map along Ossuary themes only, so every theme meets the same character.
const run = newRun(classId, runSeed);
run.difficulty = clampDifficulty({
  scaling: Number(arg('scaling', String(run.difficulty.scaling))),
  base: Number(arg('base', String(run.difficulty.base))),
  variance: Number(arg('variance', String(run.difficulty.variance))),
});
while (run.phase === 'camp' && run.map < stopMap) {
  botCamp(run, 'greedy');
  botChalk(run);
  const plan = planFor(run, 'ashenCrypt');
  finishMap(run, runMap(plan, run.build, run.xp, worldOptsFor(run, plan)));
}
if (run.phase !== 'camp') {
  console.log(
    `The ${classId} died on map ${run.map} before reaching the test map; try another seed.`,
  );
  process.exit(0);
}
botCamp(run, 'greedy');
console.log(`${classId} level ${run.build.level} at map ${run.map}; ${seeds} seeds per theme\n`);
console.log('| Theme | Cleared | Mean min life | Mean time (s) |');
console.log('| --- | --- | --- | --- |');
const withMixed = process.argv.includes('--mixed');
for (const t of THEMES.filter((x) => withMixed || !x.id.startsWith('mix:'))) {
  let cleared = 0;
  let life = 0;
  let time = 0;
  for (let s = 0; s < seeds; s++) {
    const trial = { ...run, seed: run.seed + 1000 * (s + 1) };
    const plan = planFor(trial, t.id);
    const res = runMap(plan, run.build, run.xp, worldOptsFor(trial, plan));
    if (res.status === 'cleared') cleared++;
    life += res.lifeFrac;
    time += res.time;
  }
  console.log(
    `| ${t.id} | ${cleared}/${seeds} | ${((100 * life) / seeds).toFixed(0)}% | ${(time / seeds).toFixed(0)} |`,
  );
}
