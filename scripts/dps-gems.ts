/**
 * Every damage gem alone, the sheet's DPS against the sim's (docs/SHEET-AUDIT.md): a level 50 character with the gem as its only
 * skill and a fitting weapon, one boss-sized training dummy in front of it. The gems whose sheet is far from the sim are the ones
 * whose behaviour the calc models differently from the sim.
 *
 *   npm run dpsgems -- [--only id,id] [--time 60] [--distance 3] [--worst 40] [--reference]
 */
import { ACTIVE_GEMS } from '../src/data/gems';
import { buildForActive } from '../src/sim/gemKit';
import { f1, measure } from './dps-lib';

const argv = process.argv.slice(2);
const opt = (k: string, d: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const only = opt('--only', '').split(',').filter(Boolean);
const time = Number(opt('--time', '60'));
const distance = Number(opt('--distance', '3'));
const worst = Number(opt('--worst', '40'));
const reference = argv.includes('--reference');

type Line = { id: string; sheet: number; sim: number; ratio: number; note: string };
const lines: Line[] = [];
for (const def of ACTIVE_GEMS) {
  if (only.length && !only.includes(def.id)) continue;
  if (def.utility || def.selfTrigger) continue;
  let line: Line;
  try {
    const build = buildForActive(def);
    const r = measure(build, 'boss', { distance, time, sims: 1, reference });
    const mine = r.rows.find((x) => x.id === def.id);
    const note = mine
      ? `uses ${f1(mine.simUses)}/${f1(mine.sheetUses)}${mine.simShots > 0 ? ` +${f1(mine.simShots)}` : ''}`
      : '';
    line = { id: def.id, sheet: r.sheet, sim: r.sim, ratio: r.sim / Math.max(1e-9, r.sheet), note };
  } catch (e) {
    line = { id: def.id, sheet: 0, sim: 0, ratio: NaN, note: `error: ${(e as Error).message}` };
  }
  lines.push(line);
}

const dev = (l: Line) =>
  Number.isFinite(l.ratio) && l.ratio > 0 ? Math.abs(Math.log(l.ratio)) : 99;
lines.sort((a, b) => dev(b) - dev(a));
console.log(`${lines.length} gems; sim/sheet, worst first`);
for (const l of lines.slice(0, worst))
  console.log(
    `${l.id.padEnd(22)} sheet ${f1(l.sheet).padStart(6)}  sim ${f1(l.sim).padStart(6)}  sim/sheet ${l.ratio.toFixed(2).padStart(5)}  ${l.note}`,
  );
const ok = lines.filter((l) => l.ratio >= 0.9 && l.ratio <= 1.1).length;
const near = lines.filter((l) => l.ratio >= 0.75 && l.ratio <= 1.25).length;
console.log(
  `\nwithin 10%: ${ok}, within 25%: ${near}, under 0.75: ${lines.filter((l) => l.ratio < 0.75).length}, over 1.25: ${lines.filter((l) => l.ratio > 1.25).length}, of ${lines.length}`,
);
