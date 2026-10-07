/**
 * How much currency a map gives in each band of the run (EXPANSION 8.5), measured by rolling the
 * drops of every monster on generated maps. No simulation: the monsters are there, and each one
 * drops what its rarity says.
 *
 *   npm run economy -- [--maps 200]
 */
import { Rng } from '../src/core/rng';
import { factionOfSpec } from '../src/data/monsters';
import { rollCurrencyDrops } from '../src/gen/currencyDrops';
import { makeMapPlan } from '../src/gen/mapPlan';
import { rollThemes } from '../src/run/run';

const argv = process.argv.slice(2);
const per = Number(argv.includes('--maps') ? argv[argv.indexOf('--maps') + 1] : 100);

const BANDS: [string, number, number, number][] = [
  ['1–10', 1, 10, 0.5],
  ['11–30', 11, 30, 1.5],
  ['31–60', 31, 60, 3],
  ['61–100', 61, 100, 4],
];

console.log('| Map band | Currency items per map | Target | Tablets per map | Monsters per map |');
console.log('| --- | --- | --- | --- | --- |');
for (const [name, lo, hi, target] of BANDS) {
  let items = 0;
  let tablets = 0;
  let monsters = 0;
  let maps = 0;
  for (let m = lo; m <= hi; m += Math.max(1, Math.floor((hi - lo) / 9))) {
    for (let seed = 1; seed <= per / 10; seed++) {
      const theme = rollThemes(seed, m)[0];
      const plan = makeMapPlan(seed * 7919 + m, m, theme, []);
      const rng = new Rng(seed * 31 + m);
      let uid = 1;
      for (const mon of plan.pop.monsters) {
        const drops = rollCurrencyDrops(rng, () => uid++, {
          map: m,
          monster: mon.spec.rarity,
          faction: factionOfSpec(mon.spec),
          quantity: 1 + plan.theme.itemQuantity,
        });
        for (const d of drops) {
          if (d.id.startsWith('tablet:')) tablets += d.count;
          else items += d.count;
        }
        monsters++;
      }
      maps++;
    }
  }
  console.log(
    `| ${name} | ${(items / maps).toFixed(2)} | ${target} | ${(tablets / maps).toFixed(2)} | ${(monsters / maps).toFixed(0)} |`,
  );
}
