/* Replays the strider campaign to its first stall and dumps the player's state just before it. */
import { skillRange } from '../src/calc/character';
import { botCamp } from '../src/run/bot';
import { finishMap, newRun, planFor, worldOptsFor } from '../src/run/run';
import { runMap } from '../src/sim/runMap';

const cls = process.argv[2] ?? 'strider';
const seed = Number(process.argv[3] ?? 7001);
const run = newRun(cls, seed);
let done = false;
while (run.phase === 'camp' && run.map <= 40 && !done) {
  botCamp(run);
  const plan = planFor(run, run.nextThemes[0]);
  // Pass 1: find the first stall in this map.
  let stallT = -1;
  let stallId = 0;
  const snap = structuredClone(run);
  runMap(plan, run.build, run.xp, worldOptsFor(run, plan), undefined, (w) => {
    if (stallT < 0 && w.events.some((e) => e.t === 'stall')) {
      stallT = w.t;
      stallId = (w.events.find((e) => e.t === 'stall') as { id: number }).id;
    }
  });
  if (stallT >= 0) {
    console.log(`first stall: map ${run.map} t=${stallT.toFixed(1)} target=${stallId}`);
    const last = new Map<
      number,
      {
        x: number;
        y: number;
        tr: number;
        mr: number;
        own: number;
        vx: number;
        vy: number;
        r: number;
      }
    >();
    let shown = 0;
    runMap(plan, snap.build, snap.xp, worldOptsFor(snap, plan), undefined, (w) => {
      if (w.t >= stallT - 8 && w.t < stallT - 2) {
        const alive = new Set(w.projectiles.map((q) => q.id));
        for (const [id, q] of last)
          if (!alive.has(id) && shown < 14) {
            shown++;
            const t = w.actors.find((a) => a.id === stallId)!;
            console.log(
              `  proj ${id} owner=${q.own} gone at (${q.x.toFixed(2)},${q.y.toFixed(2)}) travelled=${q.tr.toFixed(2)}/${q.mr.toFixed(2)} v=(${q.vx.toFixed(1)},${q.vy.toFixed(1)}) r=${q.r} distToTarget=${Math.hypot(t.x - q.x, t.y - q.y).toFixed(2)} tile=${w.grid.isFloor(Math.floor(q.x), Math.floor(q.y))}`,
            );
          }
        last.clear();
        for (const q of w.projectiles)
          last.set(q.id, {
            x: q.x,
            y: q.y,
            tr: q.travelled,
            mr: q.maxRange,
            own: q.owner,
            vx: q.vx,
            vy: q.vy,
            r: q.r,
          });
      }
      if (w.t >= stallT - 6 && w.t < stallT - 5.4 && w.tick % 6 === 0) {
        const p = w.player;
        const t = w.actors.find((a) => a.id === stallId)!;
        const prof = w.char.profile(w.primary);
        console.log(
          `t=${w.t.toFixed(2)} mode=${w.ai.mode} p=(${p.x.toFixed(2)},${p.y.toFixed(2)}) moving=${p.moving} act=${p.action?.which ?? '-'} ` +
            `stun=${p.stunT.toFixed(2)} frz=${p.ail.freezeT.toFixed(2)} | tgt=${t.name} (${t.x.toFixed(2)},${t.y.toFixed(2)}) ` +
            `d=${Math.hypot(t.x - p.x, t.y - p.y).toFixed(2)} state=${t.state} tact=${t.action?.which ?? '-'} reach=${(skillRange(prof) + t.r).toFixed(2)} ` +
            `usable=${w.primary.usable} mana=${p.mana.toFixed(0)}/${prof.cost.toFixed(0)} proj=${w.projectiles.length} id=${w.ai.targetId}`,
        );
      }
    });
    done = true;
  }
  const res = runMap(plan, run.build, run.xp, worldOptsFor(run, plan));
  finishMap(run, res);
}
