/**
 * How long the damage and defence calculation takes (docs/PERFORMANCE.md): the cost of one Character and one sheet, and of the
 * per-gem evaluation behind the Skills tab, on a run played by the bot to a late map.
 *
 *   npm run perf -- [--class strider] [--map 40] [--seed 1] [--save runs.json | --load runs.json] [--reps 10]
 *
 * With --cpu-prof (node's own profiler) the run is profiled; summarise the .cpuprofile with scripts/perf-profile.cjs.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { Character } from '../src/calc/character';
import { LEGACY } from '../src/data/difficulty';
import { botRun, cfgFor, chooseOffer, clearSheetCache, sheetOf } from '../src/run/bot';
import { bestPlacements, itemInfos, placementsFor } from '../src/run/inventoryOps';
import type { RunState } from '../src/run/run';

const argv = process.argv.slice(2);
const opt = (k: string, d: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const cls = opt('--class', 'strider');
const map = Number(opt('--map', '40'));
const seed = Number(opt('--seed', '1'));
const reps = Number(opt('--reps', '10'));
const load = opt('--load', '');
const save = opt('--save', '');

function capture(): RunState {
  let got: RunState | null = null;
  botRun(cls, seed, map, {
    difficulty: LEGACY,
    onTick: (_w, run) => {
      if (!got && run.map >= map) got = structuredClone(run);
    },
  });
  if (!got) throw new Error(`the bot did not reach map ${map}`);
  return got;
}

const run: RunState = load ? (JSON.parse(readFileSync(load, 'utf8')) as RunState) : capture();
if (save) writeFileSync(save, JSON.stringify(run));

/** Milliseconds a call takes: the best of three rounds of `n` calls (the machine is usually busy with something else). */
const cpu = () => performance.now();
const time = <T>(f: () => T, n = reps): { ms: number; last: T } => {
  let last = f();
  let best = Infinity;
  for (let round = 0; round < 3; round++) {
    const t0 = cpu();
    for (let i = 0; i < n; i++) last = f();
    best = Math.min(best, (cpu() - t0) / n);
  }
  return { ms: best, last };
};

const gems = run.inventory.filter((x) => x.kind === 'gem');
const sockets = Object.values(run.build.equipment).reduce(
  (n, it) => n + (it?.sockets.length ?? 0),
  0,
);
console.log(
  `${run.classId} run at map ${run.map}, level ${run.build.level}: ${gems.length} gems in the inventory, ${sockets} sockets, ${Object.keys(run.build.equipment).length} items worn`,
);
const cfg = cfgFor(run);
const ch = new Character(run.build, cfg);
console.log(
  `active skills ${ch.actives.length}, mains ${ch.mains.length}, rotation ${ch.rotation.length}`,
);

// --only sheet: nothing but sheets, for a profile that is not lost in loading the modules.
if (opt('--only', '') === 'sheet') {
  for (let i = 0; i < reps; i++) {
    clearSheetCache();
    sheetOf(run);
  }
  process.exit(0);
}

const f2 = (x: number) => x.toFixed(2).padStart(8);
console.log(`new Character              ${f2(time(() => new Character(run.build, cfg)).ms)} ms`);
console.log(
  `sheet() on a built one     ${f2(time(() => new Character(run.build, cfg).sheet()).ms - time(() => new Character(run.build, cfg)).ms)} ms`,
);
console.log(
  `sheetOf (both)             ${f2(
    time(() => {
      clearSheetCache();
      return sheetOf(run);
    }).ms,
  )} ms`,
);
const t = time(() => {
  const c = new Character(run.build, cfg);
  c.mainSheet();
  c.secondarySheets();
  c.ehp();
}, reps);
console.log(
  `a Skills tab render's own  ${f2(t.ms)} ms (Character + mainSheet + secondarySheets + ehp)`,
);
if (gems[0]) {
  const one = time(() => placementsFor(run, gems[0].uid), Math.max(2, reps >> 2));
  console.log(`placementsFor, one gem     ${f2(one.ms)} ms (${one.last.length} sockets)`);
}
const all = time(() => {
  clearSheetCache();
  for (const g of gems) placementsFor(run, g.uid);
}, 1);
console.log(
  `placementsFor, all gems    ${f2(all.ms)} ms  <- every gem in every socket (what the badges cost before)`,
);
const badges = time(() => {
  clearSheetCache();
  return bestPlacements(
    run,
    gems.map((g) => g.uid),
  );
}, 1);
console.log(
  `best badges, all gems      ${f2(badges.ms)} ms  <- the Skills tab's badges now (empty sockets first, in slices)`,
);

// The camp's three offers, each priced against the character (the map cards and the bot's choice).
console.log(
  `chooseOffer, 3 offers     ${f2(time(() => chooseOffer(run, 'best')).ms)} ms  <- the map cards, on every build change`,
);

const items = run.inventory.filter((x) => x.kind === 'item').length;
const infos = time(() => {
  clearSheetCache();
  return itemInfos(run);
}, 1);
console.log(
  `itemInfos, ${String(items).padStart(2)} items      ${f2(infos.ms)} ms  <- the Items tab's upgrade hints, on every change`,
);
