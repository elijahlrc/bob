/* Plays bot campaigns and reports every stall-breaker firing with diagnostics. */
import { CLASSES } from '../src/data/classes';
import { botCamp } from '../src/run/bot';
import { finishMap, newRun, planFor, worldOptsFor } from '../src/run/run';
import { runMap } from '../src/sim/runMap';

const runs = Number(process.argv[2] ?? 2);
const only = process.argv[4];
const seedBase = Number(process.argv[5] ?? 7000);
const maxMap = Number(process.argv[3] ?? 40);
let total = 0;
for (const cls of CLASSES.filter((c) => !only || c.id === only)) {
  for (let r = 0; r < runs; r++) {
    const run = newRun(cls.id, seedBase + r);
    while (run.phase === 'camp' && run.map <= maxMap) {
      botCamp(run);
      const plan = planFor(run, run.nextThemes[0]);
      const recent: { t: number; k: string; mine: boolean }[] = [];
      const res = runMap(plan, run.build, run.xp, worldOptsFor(run, plan), undefined, (w) => {
        for (const e of w.events) {
          if (e.t === 'hit' || e.t === 'miss')
            recent.push({ t: w.t, k: e.t, mine: e.src === w.player.id });
          if (e.t === 'stall') {
            total++;
            const a = w.actors.find((x) => x.id === e.id)!;
            const win = recent.filter((x) => w.t - x.t <= 25 && x.mine);
            console.log(
              `STALL ${cls.id} run${r} map${run.map} lvl${run.build.level} t=${w.t.toFixed(0)} ` +
                `${a.name}[${a.rarity}/${a.state}] mods=${a.modIds.join(',') || '-'} life=${a.life.toFixed(0)}/${a.def.maxLife.toFixed(0)} ` +
                `eva=${a.def.evasion.toFixed(0)} arm=${a.def.armour.toFixed(0)} dist=${Math.hypot(a.x - w.player.x, a.y - w.player.y).toFixed(1)} ` +
                `los=${w.grid.los(w.player.x, w.player.y, a.x, a.y)} action=${w.player.action?.which ?? '-'} ` +
                `hits=${win.filter((x) => x.k === 'hit').length} misses=${win.filter((x) => x.k === 'miss').length} ` +
                `stunned=${a.stunT.toFixed(1)} frozen=${a.ail.freezeT.toFixed(1)} dummy=${a.dummy}`,
            );
          }
        }
        if (recent.length > 600) recent.splice(0, 300);
      });
      finishMap(run, res);
    }
  }
}
console.log(`done, ${total} stall events`);
