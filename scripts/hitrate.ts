/* Player hit rate against enemies with and without the Elusive affix. */
import { CLASSES } from '../src/data/classes';
import { newRun, planFor, worldOptsFor } from '../src/run/run';
import { createWorld, stepWorld } from '../src/sim/world';

const maps = (process.argv[2] ?? '1,10,30,60').split(',').map(Number);
for (const mapNo of maps) {
  for (const cls of CLASSES) {
    const hits = [0, 0];
    const miss = [0, 0];
    const chance: number[] = [];
    for (let seed = 1; seed <= 8; seed++) {
      const run = newRun(cls.id, seed);
      run.map = mapNo;
      const plan = planFor(run, run.nextThemes[0]);
      const w = createWorld({ plan, build: run.build, xp: 0, opts: worldOptsFor(run, plan) });
      const elusive = new Set<number>();
      for (const a of w.actors) if (a.modIds.includes('elusive')) elusive.add(a.id);
      while (w.status === 'running' && w.t < 200) {
        stepWorld(w);
        for (const e of w.events) {
          if (e.t === 'hit' && e.src === w.player.id) hits[elusive.has(e.dst) ? 1 : 0]++;
          if (e.t === 'miss' && e.src === w.player.id) miss[elusive.has(e.dst) ? 1 : 0]++;
        }
      }
      chance.push(0);
    }
    const r = (h: number, m: number) => (h + m ? ((100 * h) / (h + m)).toFixed(0) + '%' : '-');
    console.log(
      `map ${mapNo} ${cls.id.padEnd(9)} normal ${r(hits[0], miss[0]).padStart(4)} (${hits[0] + miss[0]})  elusive ${r(hits[1], miss[1]).padStart(4)} (${hits[1] + miss[1]})`,
    );
  }
}
