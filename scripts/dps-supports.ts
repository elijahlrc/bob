/**
 * Every support gem on a few plain skills, what it does to the sheet's DPS against what it does in the sim (docs/SHEET-AUDIT.md):
 * the same skill alone and with the support linked, a boss dummy in front, free mana. The figure that matters is the effect of the
 * support (with / without) on each side; a support the sheet values at +40% and the sim at +10% (or the other way round) is
 * mis-modelled in one of them.
 *
 *   npm run dpssupports -- [--only id,id] [--skills frostLance,crushingBlow,stormArrow] [--time 40] [--worst 40]
 */
import { SUPPORT_GEMS } from '../src/data/gems';
import { activeGem, buildFor, classFor, weaponFor } from '../src/sim/gemKit';
import { Character } from '../src/calc/character';
import { f1, measure } from './dps-lib';

const argv = process.argv.slice(2);
const opt = (k: string, d: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const only = opt('--only', '').split(',').filter(Boolean);
const skills = opt('--skills', 'frostLance,crushingBlow,stormArrow').split(',');
const time = Number(opt('--time', '40'));
const worst = Number(opt('--worst', '40'));

type Line = {
  support: string;
  skill: string;
  sheetEffect: number;
  simEffect: number;
  ratio: number;
  sheet: number;
  sim: number;
};
const lines: Line[] = [];
for (const skillId of skills) {
  const def = activeGem(skillId);
  const weapon = weaponFor(def);
  const cls = classFor(def.attr);
  const o = { distance: 3, time, sims: 1, reference: false };
  const base = measure(buildFor([skillId], weapon, cls), 'boss', o);
  for (const s of SUPPORT_GEMS) {
    if (only.length && !only.includes(s.id)) continue;
    try {
      const b = buildFor([skillId, s.id], weapon, cls);
      // A support that can do nothing for the skill is left out.
      const c = new Character(b, { targetDistance: 3, areaLevel: b.level });
      if (c.primary.inert?.some((x) => x.gem.def.id === s.id)) continue;
      const r = measure(b, 'boss', o);
      const sheetEffect = r.sheet / Math.max(1e-9, base.sheet);
      const simEffect = r.sim / Math.max(1e-9, base.sim);
      lines.push({
        support: s.id,
        skill: skillId,
        sheetEffect,
        simEffect,
        ratio: simEffect / sheetEffect,
        sheet: r.sheet,
        sim: r.sim,
      });
    } catch (e) {
      console.log(`${s.id} on ${skillId}: ${(e as Error).message}`);
    }
  }
}
const dev = (l: Line) => Math.abs(Math.log(l.ratio));
lines.sort((a, b) => dev(b) - dev(a));
console.log(
  `${lines.length} support/skill pairs; effect of the support, sim over sheet (1.00 is right), worst first`,
);
for (const l of lines.slice(0, worst))
  console.log(
    `${l.support.padEnd(22)} on ${l.skill.padEnd(12)} sheet x${l.sheetEffect.toFixed(2)}  sim x${l.simEffect.toFixed(2)}  ratio ${l.ratio.toFixed(2)}   (${f1(l.sheet)} / ${f1(l.sim)})`,
  );
const within = (x: number) => lines.filter((l) => dev(l) <= Math.log(1 + x)).length;
console.log(
  `\nwithin 10%: ${within(0.1)}, within 25%: ${within(0.25)}, of ${lines.length}; sheet overstates (<0.75): ${lines.filter((l) => l.ratio < 0.75).length}, understates (>1.33): ${lines.filter((l) => l.ratio > 1.33).length}`,
);
