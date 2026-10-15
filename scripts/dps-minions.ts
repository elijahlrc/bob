/**
 * Every summoning gem, the sheet's minion damage against the sim's (docs/SHEET-AUDIT.md): the gem beside a plain attack, a boss
 * dummy in front (corpses laid for the gems that raise from them), and what the minions dealt on both sides.
 *
 * The dummy does not hit back, so the sim's minions never fall; "standing" is the sheet's figure without the allowance for the
 * time minions spend fallen on a real map, and is the one to compare with the sim.
 *
 *   npm run dpsminions -- [--only id,id] [--time 120] [--distance 3]
 */
import { Character } from '../src/calc/character';
import { ACTIVE_GEMS } from '../src/data/gems';
import { createDummyWorld } from '../src/sim/dummy';
import { buildForActive, seedFor } from '../src/sim/gemKit';
import { stepWorld } from '../src/sim/world';
import { f1 } from './dps-lib';

const argv = process.argv.slice(2);
const opt = (k: string, d: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const only = opt('--only', '').split(',').filter(Boolean);
const time = Number(opt('--time', '120'));
const distance = Number(opt('--distance', '3'));

for (const def of ACTIVE_GEMS) {
  if (def.utility?.kind !== 'summon' || (only.length && !only.includes(def.id))) continue;
  try {
    const build = buildForActive(def);
    const c = new Character(build, { targetDistance: distance, areaLevel: build.level });
    const sheet = c.minionDps(c.configConds, 'boss');
    const standing = c.minionDps(c.configConds, 'boss', false);
    const { world, dummy } = createDummyWorld(build, {
      distance,
      maxTime: time,
      seed: 1,
      rarity: 'boss',
      fixed: true,
      angle: 0.6,
    });
    seedFor(def, world, dummy);
    while (world.status === 'running') stepWorld(world);
    let sim = 0;
    for (const row of world.ledger.dealt.minion.values()) sim += row.dmg.reduce((a, b) => a + b, 0);
    sim /= world.t;
    console.log(
      `${def.id.padEnd(20)} minions sheet ${f1(sheet).padStart(6)}  standing ${f1(standing).padStart(6)}  sim ${f1(sim).padStart(6)}  sim/standing ${(sim / Math.max(1e-9, standing)).toFixed(2)}`,
    );
  } catch (e) {
    console.log(`${def.id.padEnd(20)} error: ${(e as Error).message}`);
  }
}
