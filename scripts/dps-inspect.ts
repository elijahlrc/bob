/**
 * One gem alone, the sheet's figures beside what the sim does (docs/SHEET-AUDIT.md): uses a second, hits a use, damage a hit, how
 * often it crits and misses. Where the two differ is where the calc and the sim model the skill differently.
 *
 *   npm run dpsinspect -- <gemId> [--distance 3] [--time 60] [--weapon sword_3] [--class mystic] [--pack]
 */
import { Character } from '../src/calc/character';
import { ACTIVE_GEMS } from '../src/data/gems';
import { buildFor, buildForActive, weaponFor } from '../src/sim/gemKit';
import { createDummyWorld } from '../src/sim/dummy';
import { stepWorld } from '../src/sim/world';
import { targetOf, f1 } from './dps-lib';
import type { Build } from '../src/data/types';

const argv = process.argv.slice(2);
const id = argv.find((a) => !a.startsWith('--') && !argv[argv.indexOf(a) - 1]?.startsWith('--'));
const opt = (k: string, d: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
if (!id)
  throw new Error(
    'usage: dpsinspect <gemId> [--distance n] [--time s] [--weapon base] [--class id]',
  );
const def = ACTIVE_GEMS.find((g) => g.id === id);
if (!def) throw new Error(`no active gem ${id}`);
const distance = Number(opt('--distance', '3'));
const time = Number(opt('--time', '60'));
const weapon = opt('--weapon', '');
const cls = opt('--class', '');

let build: Build = buildForActive(def);
if (weapon || cls)
  build = buildFor([def.id], weapon || weaponFor(def), cls || build.classId, 'none');

const c = new Character(build, { targetDistance: distance, areaLevel: build.level });
const t = targetOf(build, false);
const s = c.sheet(c.configConds, 'boss', t).skill;
const p = c.profile(c.primary);
console.log(
  `${def.name} (${def.id}) at level ${build.level}, ${build.equipment.mainHand?.baseId}, distance ${distance}`,
);
console.log(
  `sheet: ${f1(s.usesPerSec)} uses/s · avg hit ${f1(s.avgHit)} · hit chance ${s.hitChance.toFixed(2)} · crit ${s.critChance.toFixed(2)} x${s.critMulti.toFixed(2)} · hit dps ${f1(s.hitDps)} · dot ${f1(s.dotDps)} · ailments ${f1(s.igniteDps + s.bleedDps + s.poisonDps)} · total ${f1(s.totalDps)}`,
);
console.log(
  `profile: useTime ${p.useTime.toFixed(3)} · pulses ${p.pulses} · repeats ${p.repeats} · projectiles ${p.projectiles} · pierce ${p.pierce} · chains ${p.chains} · deployCount ${p.deployCount} · hands ${p.hands.length}`,
);

const { world, dummy } = createDummyWorld(build, {
  distance,
  maxTime: time,
  seed: 1,
  rarity: 'boss',
  fixed: true,
});
const me = world.sides[0].player.id;
let uses = 0;
let hits = 0;
let dmg = 0;
let crits = 0;
let misses = 0;
let dots = 0;
const perUse: number[] = [];
let cur = -1;
const types = [0, 0, 0, 0, 0];
while (world.status === 'running') {
  stepWorld(world);
  for (const e of world.events) {
    if (e.t === 'use' && e.src === me && !e.via) {
      uses++;
      cur = perUse.length;
      perUse.push(0);
    } else if (e.t === 'hit' && e.dst === dummy.id) {
      hits++;
      dmg += e.amount;
      types[e.dtype] += e.amount;
      if (e.crit) crits++;
      if (cur >= 0) perUse[cur] += e.amount;
    } else if (e.t === 'miss' && e.src === me) misses++;
    else if (e.t === 'dot' && e.dst === dummy.id && 'amount' in e) dots += e.amount;
  }
}
const secs = world.t;
console.log(
  `sim:   ${f1(uses / secs)} uses/s · ${(hits / Math.max(1, uses)).toFixed(2)} hits/use · avg hit ${f1(dmg / Math.max(1, hits))} · crit ${(crits / Math.max(1, hits)).toFixed(2)} · misses ${misses} · hit dps ${f1(dmg / secs)} · dot ${f1(dots / secs)}`,
);
console.log(
  `       damage by type (phys, lightning, cold, fire, chaos): ${types.map((x) => f1(x / secs)).join(', ')}`,
);
console.log(
  `       per use: ${perUse
    .slice(1, 9)
    .map((x) => f1(x))
    .join(' ')} …`,
);
const led = [
  ...world.sides[0].ledger.dealt.skill.values(),
  ...world.sides[0].ledger.dealt.ailment.values(),
  ...world.sides[0].ledger.dealt.minion.values(),
  ...world.sides[0].ledger.dealt.effect.values(),
];
console.log(
  `ledger: ${led.map((r) => `${r.name} ${f1(r.dmg.reduce((a, b) => a + b, 0) / secs)}/s (${r.hits} hits)`).join(' · ')}`,
);
