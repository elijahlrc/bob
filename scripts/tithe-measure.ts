/*
 * How much the Tithe of the Servants heals beside everything else, on real builds (docs/REPLENISH.md step 4). Plays each
 * build through level-99 maps from 60% life and counts, per map: life the character lost, what replenish won back, and
 * what the Tithe would heal (`TITHE_SLAIN`, `TITHE_EXPIRED`) and did heal (all of it below the life cap, up to all of it at the cap).
 * Usage: npx tsx scripts/tithe-measure.ts <build.json>... [--maps N]
 */
import { readFileSync } from 'node:fs';
import type { Build } from '../src/data/types';
import { newRun, planFor, setMap, worldOptsFor } from '../src/run/run';
import { runMap } from '../src/sim/runMap';
import { lifeCap } from '../src/sim/combat';
import type { World } from '../src/sim/types';
import { TITHE_EXPIRED, TITHE_SLAIN } from '../src/data/runRewards';

const args = process.argv.slice(2);
const files = args.filter((a) => a.endsWith('.json'));
const mapsArg = args.indexOf('--maps');
const maps = mapsArg >= 0 ? Number(args[mapsArg + 1]) : 6;

for (const file of files) {
  const build = JSON.parse(readFileSync(file, 'utf8')) as Build;
  let lost = 0;
  let replenished = 0;
  let held = 0;
  let titheOffered = 0;
  let titheHealed = 0;
  let titheLow = 0;
  let bigBurst = 0;
  let time = 0;
  let deaths = 0;
  let maxLife = 0;
  for (let i = 0; i < maps; i++) {
    const run = newRun(build.classId, 9000 + i);
    run.build = structuredClone(build);
    setMap(run, 99);
    const plans = run.offers.flatMap((o) => {
      try {
        return [planFor(run, o)];
      } catch {
        return []; // a Respite or a stop
      }
    });
    const plan = plans[i % plans.length];
    let prev = new Map<object, { alive: boolean; maxLife: number; t: number }>();
    let started = false;
    const res = runMap(plan, run.build, run.xp, worldOptsFor(run, plan), undefined, (w: World) => {
      const s = w.sides[0];
      const p = s.player;
      if (!started) {
        p.life = p.def.maxLife * 0.6;
        started = true;
        maxLife = p.def.maxLife;
      }
      const now = new Map<object, { alive: boolean; maxLife: number; t: number }>();
      for (const m of s.minions) now.set(m, { alive: m.alive, maxLife: m.def.maxLife, t: m.t });
      let tick = 0;
      for (const [m, was] of prev) {
        if (now.has(m)) continue;
        const slain = !(m as { alive: boolean }).alive;
        tick += was.maxLife * (slain ? TITHE_SLAIN : TITHE_EXPIRED);
      }
      if (tick > 0) {
        titheOffered += tick;
        // Below the cap after it, the whole tithe went in; at the cap, somewhere between none and all of it.
        titheHealed += tick;
        if (p.life < lifeCap(p) - 0.5) titheLow += tick;
        bigBurst = Math.max(bigBurst, tick / p.def.maxLife);
      }
      prev = now;
    });
    const r = res.report;
    lost += r?.pools.life ?? 0;
    replenished += r?.replenish?.won ?? 0;
    held += r?.replenish?.held ?? 0;
    time += r?.time ?? 0;
    if (res.status !== 'cleared') deaths++;
  }
  const pc = (v: number) => `${((v / maxLife) * 100).toFixed(1)}%`;
  console.log(
    `\n${file}  (max life ${maxLife.toFixed(0)}, ${maps} maps, ${time.toFixed(0)} s, not cleared ${deaths})`,
  );
  console.log(
    `  life lost            ${lost.toFixed(0)} (${pc(lost / (time || 1))} of max life a second)`,
  );
  console.log(`  replenished          ${replenished.toFixed(0)}, held back ${held.toFixed(0)}`);
  console.log(
    `  tithe offered        ${titheOffered.toFixed(0)} (${pc(titheOffered / (time || 1))} a second)`,
  );
  console.log(
    `  tithe healed         ${titheLow.toFixed(0)} to ${titheHealed.toFixed(0)} = ${((titheLow / (lost || 1)) * 100).toFixed(1)} to ${((titheHealed / (lost || 1)) * 100).toFixed(1)}% of life lost`,
  );
  console.log(`  biggest one-tick tithe ${(bigBurst * 100).toFixed(1)}% of max life`);
}
