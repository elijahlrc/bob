/* Finds "stalls": the player keeps engaging one target for a long time without damaging it. */
import { CLASSES } from '../src/data/classes';
import { newRun, planFor, worldOptsFor } from '../src/run/run';
import { createWorld, stepWorld } from '../src/sim/world';

const seeds = Number(process.argv[2] ?? 30);
const maps = (process.argv[3] ?? '1').split(',').map(Number);
let found = 0;
for (const cls of CLASSES) {
  for (let seed = 1; seed <= seeds; seed++) {
    for (const mapNo of maps) {
      const run = newRun(cls.id, seed);
      run.map = mapNo;
      const plan = planFor(run, run.nextThemes[0]);
      const w = createWorld({ plan, build: run.build, xp: 0, opts: worldOptsFor(run, plan) });
      let target = 0;
      let since = 0;
      let lastLife = 0;
      let shots = 0;
      while (w.status === 'running' && w.t < 300) {
        stepWorld(w);
        const t = w.ai.targetId;
        const a = t ? w.actors.find((x) => x.id === t) : undefined;
        if (a && a.alive && w.ai.mode === 'engage') {
          if (t !== target) {
            target = t;
            since = w.t;
            lastLife = a.life;
            shots = 0;
          } else if (a.life < lastLife - 1e-6) {
            since = w.t;
            lastLife = a.life;
            shots = 0;
          }
          if (w.player.action && w.player.action.elapsed < 0.02) shots++;
          if (w.t - since > 25) {
            found++;
            const dx = a.x - w.player.x;
            const dy = a.y - w.player.y;
            console.log(
              `STALL ${cls.id} seed=${seed} map=${mapNo} t=${w.t.toFixed(1)} target=${a.name}(${a.rarity},${a.state}) ` +
                `dist=${Math.hypot(dx, dy).toFixed(2)} shots=${shots} life=${a.life.toFixed(0)}/${a.def.maxLife.toFixed(0)} ` +
                `mods=${a.modIds.join(',')} player=(${w.player.x.toFixed(2)},${w.player.y.toFixed(2)}) tgt=(${a.x.toFixed(2)},${a.y.toFixed(2)}) ` +
                `los=${w.grid.los(w.player.x, w.player.y, a.x, a.y)}`,
            );
            break;
          }
        } else target = 0;
      }
    }
  }
}
console.log(`done, ${found} stalls`);
