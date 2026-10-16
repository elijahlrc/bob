/**
 * How the bot's characters would die, and what a Reprieve would have saved (docs/WAYSIDE.md 7.6). Full bot runs with the character
 * made unkillable (`godMode`, which holds it at 1 life on a lethal blow); every time that happens is a death the run would have
 * ended on. For each one it records how healthy the character was a moment before (a spike from a healthy character, or the end of
 * a long grind), whether it was a boss level, and then plays a Revive on the first one (the character stands up at a share of its
 * life and cannot be hurt for 3 s) to see whether it dies again within 10 s and how many maps later the next death comes.
 *
 *   npx tsx scripts/lethal.ts [--runs 3] [--class all] [--seed 1] [--maps 40] [--revive 0.35] [--dump out.json]
 *
 * It only reads: nothing here changes the game.
 */
import { writeFileSync } from 'node:fs';
import { CLASSES } from '../src/data/classes';
import { botRun } from '../src/run/bot';
import { lifeCap } from '../src/sim/combat';
import type { World } from '../src/sim/types';

const arg = (k: string, d: string) => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const runs = Number(arg('runs', '3'));
const seed0 = Number(arg('seed', '1'));
const maxMap = Number(arg('maps', '40'));
const share = Number(arg('revive', '0.35'));
const cls = arg('class', 'all');
const classes = cls === 'all' ? CLASSES.map((c) => c.id) : cls.split(',');
const dump = arg('dump', '');

type Event = {
  classId: string;
  seed: number;
  map: number;
  t: number;
  /** Life as a share of the maximum 1 s and 5 s before the blow. */
  before1: number;
  before5: number;
  /** The blow itself, as a share of the maximum life (what the last hit took off). */
  boss: boolean;
  /** 1 = the first lethal blow of the run, 2 = the next one after a Revive. */
  nth: number;
  /** For nth 2: seconds after the Revive, and whether it was on the same map. */
  after?: number;
  sameMap?: boolean;
};

const events: Event[] = [];
const ended: {
  classId: string;
  seed: number;
  first: number | null;
  second: number | null;
  relapse: boolean;
}[] = [];

for (const classId of classes) {
  for (let r = 0; r < runs; r++) {
    const seed = seed0 + r;
    const hist = new Map<World, { t: number; f: number }[]>();
    let n = 0;
    let revivedAt = -1;
    let revivedMap = 0;
    let first: Event | null = null;
    let second: Event | null = null;
    let done = false;
    botRun(classId, seed, maxMap, {
      onTick: (w) => {
        if (done) {
          w.sides[0].opts.godMode = true;
          return;
        }
        w.sides[0].opts.godMode = true;
        const p = w.sides[0].player;
        const cap = Math.max(1, lifeCap(p));
        let h = hist.get(w);
        if (!h) hist.set(w, (h = []));
        const f = p.life / cap;
        const lethal =
          p.life <= 1.0001 &&
          p.alive &&
          w.sides[0].reprieve.invulnT <= 0 &&
          h.length > 0 &&
          h[h.length - 1].f > 1.5 / cap;
        h.push({ t: w.t, f });
        if (h.length > 400) h.splice(0, h.length - 400);
        if (!lethal) return;
        const at = (secs: number) => {
          for (let i = h.length - 1; i >= 0; i--) if (w.t - h[i].t >= secs) return h[i].f;
          return h[0].f;
        };
        n++;
        const ev: Event = {
          classId,
          seed,
          map: w.plan.map,
          t: w.t,
          before1: at(1),
          before5: at(5),
          boss: w.plan.map % 10 === 0,
          nth: n,
        };
        if (n === 1) {
          first = ev;
          // The Revive: stand up at a share of the life, safe for three seconds.
          p.life = share * cap;
          w.sides[0].reprieve.invulnT = 3;
          revivedAt = w.t;
          revivedMap = w.plan.map;
        } else if (n === 2) {
          ev.after = w.t - revivedAt;
          ev.sameMap = w.plan.map === revivedMap;
          second = ev;
          done = true;
        }
        events.push(ev);
      },
    });
    ended.push({
      classId,
      seed,
      first: first ? (first as Event).map : null,
      second: second ? (second as Event).map : null,
      relapse:
        !!second && (second as Event).sameMap === true && ((second as Event).after ?? 99) <= 10,
    });
  }
}

const median = (xs: number[]) => {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const pct = (n: number, d: number) => (d ? `${Math.round((100 * n) / d)}%` : '-');

const firsts = events.filter((e) => e.nth === 1);
console.log(
  `${ended.length} runs, ${classes.length} classes, up to map ${maxMap}, revive at ${Math.round(share * 100)}% life`,
);
console.log(`runs with a lethal blow: ${firsts.length} of ${ended.length}`);
if (firsts.length) {
  console.log(`median map of the first lethal blow: ${median(firsts.map((e) => e.map))}`);
  const spike = firsts.filter((e) => e.before1 >= 0.6);
  console.log(
    `spike (60% life or more a second before): ${spike.length} of ${firsts.length} (${pct(spike.length, firsts.length)})`,
  );
  console.log(
    `median life a second before: ${Math.round(100 * median(firsts.map((e) => e.before1)))}%`,
  );
  console.log(
    `median life five seconds before: ${Math.round(100 * median(firsts.map((e) => e.before5)))}%`,
  );
  const boss = firsts.filter((e) => e.boss);
  console.log(
    `on a tenth map (where a Retreat does nothing): ${boss.length} of ${firsts.length} (${pct(boss.length, firsts.length)})`,
  );
}
const revived = ended.filter((e) => e.first !== null);
const relapsed = revived.filter((e) => e.relapse);
console.log(
  `Revive: dies again within 10 s on the same map: ${relapsed.length} of ${revived.length} (${pct(relapsed.length, revived.length)})`,
);
const gains = revived.map((e) => (e.second ?? maxMap + 1) - (e.first ?? 0));
console.log(
  `Revive: maps gained until the next lethal blow, median ${median(gains)} (a run with none counts to the end of the test)`,
);
console.log('by class:');
for (const c of classes) {
  const f = firsts.filter((e) => e.classId === c);
  console.log(`  ${c}: first lethal blow at map ${median(f.map((e) => e.map))} (${f.length} runs)`);
}
if (dump) writeFileSync(dump, JSON.stringify({ events, ended }, null, 1));
