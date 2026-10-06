import { CLASSES } from '../src/data/classes';
import { newRun, planFor } from '../src/run/run';
import { runMap } from '../src/sim/runMap';
import { Character } from '../src/calc/character';

for (const c of CLASSES) {
  const run = newRun(c.id, 12345);
  const ch = new Character(run.build, { areaLevel: 1 });
  const s = ch.sheet();
  const plan = planFor(run, run.nextThemes[0]);
  const t0 = performance.now();
  const res = runMap(plan, run.build, 0);
  const ms = performance.now() - t0;
  console.log(
    c.id,
    'life',
    s.life,
    'dps',
    s.skill.totalDps.toFixed(1),
    s.skill.name,
    'hit',
    s.skill.avgHit.toFixed(1),
    'ups',
    s.skill.usesPerSec.toFixed(2),
    '|',
    res.status,
    't',
    res.time.toFixed(1),
    'kills',
    res.kills,
    'lvl',
    res.level,
    'xp',
    res.xp.toFixed(0),
    'stuck',
    res.stuck,
    'ms',
    ms.toFixed(0),
    'speedup',
    ((res.time * 1000) / ms).toFixed(0),
  );
}
