/**
 * Every summoning gem, the sheet's minion damage against the sim's (docs/SHEET-AUDIT.md): the gem beside a plain attack, a boss
 * dummy in front, and what the minions dealt on both sides.
 *
 *   npm run dpsminions -- [--only id,id] [--time 120] [--distance 3]
 */
import { ACTIVE_GEMS } from '../src/data/gems';
import { buildForActive } from '../src/sim/gemKit';
import { f1, measure } from './dps-lib';

const argv = process.argv.slice(2);
const opt = (k: string, d: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const only = opt('--only', '').split(',').filter(Boolean);
const time = Number(opt('--time', '120'));
const distance = Number(opt('--distance', '3'));

for (const def of ACTIVE_GEMS) {
  if (def.utility?.kind !== 'summon' || (only.length && !only.includes(def.id))) continue;
  try {
    const r = measure(buildForActive(def), 'boss', { distance, time, sims: 1, reference: false });
    const m = r.rows.find((x) => x.id === 'minions');
    const sheet = m?.sheetDps ?? 0;
    const sim = m?.simDps ?? 0;
    console.log(
      `${def.id.padEnd(20)} minions sheet ${f1(sheet).padStart(6)}  sim ${f1(sim).padStart(6)}  sim/sheet ${(sim / Math.max(1e-9, sheet)).toFixed(2)}`,
    );
  } catch (e) {
    console.log(`${def.id.padEnd(20)} error: ${(e as Error).message}`);
  }
}
