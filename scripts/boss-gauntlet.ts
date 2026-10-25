/**
 * How the bosses go for the bot's characters (docs/BOSSES.md 13): full bot runs, watching every boss fight. For each boss it
 * reports how many characters reached it, how many beat it, how long it took to kill, how low their life fell, what its
 * mechanics did, and what killed those that fell. This is the plan's one measurement: run it once, not while building.
 *
 *   npx tsx scripts/boss-gauntlet.ts --runs 4 --class all [--seed 1] [--maps 100] [--dump out.json] [--merge a.json b.json ...]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { CLASSES } from '../src/data/classes';
import { BOSSES, BOSS_IDS, type BossId } from '../src/data/bosses';
import { botRun } from '../src/run/bot';
import { bossState } from '../src/sim/bosses';
import { theftOf } from '../src/sim/theft';
import type { World } from '../src/sim/types';

type Fight = {
  boss: BossId;
  classId: string;
  seed: number;
  level: number;
  won: boolean;
  died: boolean;
  /** Seconds from the boss waking to its death (or the character's). */
  time: number;
  /** The lowest the character's life and energy shield fell, as a share of the most. */
  minPool: number;
  /** What the fight did: tolls rung, Sentences landed and their share of the pool, thefts, and so on. */
  notes: Record<string, number>;
  killer?: string;
  /** Damage the character took by type (physical, lightning, cold, fire, chaos): during the fight, and on its whole map. */
  fightTaken: number[];
  mapTaken: number[];
};

const arg = (k: string, d: string) => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const runs = Number(arg('runs', '4'));
const seed0 = Number(arg('seed', '1'));
const cls = arg('class', 'all');
const classes = cls === 'all' ? CLASSES.map((c) => c.id) : cls.split(',');
const dump = arg('dump', '');
const mergeAt = process.argv.indexOf('--merge');

const fights: Fight[] = [];
if (mergeAt >= 0) {
  for (const f of process.argv.slice(mergeAt + 1))
    fights.push(...(JSON.parse(readFileSync(f, 'utf8')) as Fight[]));
} else {
  for (const classId of classes)
    for (let r = 0; r < runs; r++) {
      const seed = seed0 + r;
      let cur: Fight | null = null;
      let start = 0;
      let world: World | null = null;
      const seen = new WeakSet<object>();
      // Hits on the character on the map now (a boss map's whole damage, for its share of it in the fight).
      let mapTaken = [0, 0, 0, 0, 0];
      const close = (w: World) => {
        if (!cur) return;
        const b = w.actors.find((a) => a.rarity === 'boss' && a.mon?.kind.bossOnly);
        cur.won = !!b && !b.alive;
        cur.died = w.status === 'dead';
        cur.time = w.t - start;
        if (cur.died) {
          const last = w.sides[0].dmgLog[w.sides[0].dmgLog.length - 1];
          cur.killer = last ? `${last.name} (${last.via ?? last.name})` : 'unknown';
        }
        cur.mapTaken = [...mapTaken];
        fights.push(cur);
        cur = null;
      };
      botRun(classId, seed, Number(arg('maps', '100')), {
        onTick: (w) => {
          if (world !== w) {
            if (world) close(world);
            world = w;
            mapTaken = [0, 0, 0, 0, 0];
          }
          const me = w.sides[0].player.id;
          for (const e of w.events)
            if (e.t === 'hit' && e.dst === me && e.amount > 0) {
              mapTaken[e.dtype] += e.amount;
              if (cur) cur.fightTaken[e.dtype] += e.amount;
            }
          const b = w.actors.find((a) => a.rarity === 'boss' && a.mon?.kind.bossOnly);
          if (!b) return;
          const st = bossState(b);
          if (!st) return;
          const p = w.sides[0].player;
          if (!cur && b.alive && b.state === 'chase' && !seen.has(b)) {
            seen.add(b);
            start = w.t;
            cur = {
              boss: st.id,
              classId,
              seed,
              level: w.sides[0].build.level,
              won: false,
              died: false,
              time: 0,
              minPool: 1,
              notes: {},
              fightTaken: [0, 0, 0, 0, 0],
              mapTaken: [0, 0, 0, 0, 0],
            };
          }
          if (!cur) return;
          const pool = (p.life + p.es) / Math.max(1, p.def.maxLife + p.def.maxEs);
          cur.minPool = Math.min(cur.minPool, pool);
          const n = cur.notes;
          n.tolls = st.tolls;
          n.thefts = st.thefts;
          for (const e of w.events) {
            if (e.t === 'blast' && e.e.label === 'Sentence') {
              n.sentences = (n.sentences ?? 0) + 1;
              n.sentenceShare = Math.max(
                n.sentenceShare ?? 0,
                e.e.damage / Math.max(1, p.def.maxLife + p.def.maxEs),
              );
            }
            if (e.t === 'window' && e.kind.startsWith('returned.'))
              n.returned = (n.returned ?? 0) + 1;
            if (e.t === 'window' && e.kind === 'tollBroken')
              n.tollsBroken = (n.tollsBroken ?? 0) + 1;
            if (e.t === 'window' && e.kind === 'blocked')
              n.gallopsBlocked = (n.gallopsBlocked ?? 0) + 1;
          }
          if (theftOf(w).flasks) n.sealedTicks = (n.sealedTicks ?? 0) + 1;
          if (!b.alive || w.status !== 'running') close(w);
        },
      });
      if (world) close(world);
      process.stderr.write(`${classId} ${seed} done\n`);
    }
}

if (dump) writeFileSync(dump, JSON.stringify(fights));

const pct = (x: number) => `${Math.round(x * 100)}%`;
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
console.log(
  '| Boss | Map | Fought | Won | Died there | Mean kill time (s) | Slowest | Mean low point | Notes |',
);
console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
for (const id of BOSS_IDS) {
  const fs = fights.filter((f) => f.boss === id);
  if (!fs.length) {
    console.log(`| ${BOSSES[id].name} | ${BOSSES[id].map} | 0 | | | | | | |`);
    continue;
  }
  const won = fs.filter((f) => f.won);
  const died = fs.filter((f) => f.died);
  const times = won.map((f) => f.time);
  const notes: Record<string, number[]> = {};
  for (const f of fs) for (const [k, v] of Object.entries(f.notes)) (notes[k] ??= []).push(v);
  const noteText = Object.entries(notes)
    .filter(([, v]) => v.some((x) => x > 0))
    .map(([k, v]) => `${k} ${mean(v).toFixed(k === 'sentenceShare' ? 2 : 1)}`)
    .join(', ');
  console.log(
    `| ${BOSSES[id].name} | ${BOSSES[id].map} | ${fs.length} | ${won.length} | ${died.length} | ${mean(times).toFixed(0)} | ${Math.max(0, ...times).toFixed(0)} | ${pct(mean(fs.map((f) => f.minPool)))} | ${noteText} |`,
  );
}
console.log('\nBy class (won / fought):');
for (const c of classes) {
  const row = BOSS_IDS.map((id) => {
    const fs = fights.filter((f) => f.boss === id && f.classId === c);
    return `${id} ${fs.filter((f) => f.won).length}/${fs.length}`;
  });
  console.log(`${c}: ${row.join(', ')}`);
}
const deaths = fights.filter((f) => f.died);
if (deaths.length) {
  console.log('\nDeaths at a boss:');
  for (const f of deaths)
    console.log(
      `- ${f.classId} (seed ${f.seed}, level ${f.level}) at ${f.boss} after ${f.time.toFixed(0)} s: ${f.killer}`,
    );
}

// What each boss's fight deals by type, and its share of the damage taken on its map (docs/NEWPLAYER.md N12): the boss
// map's card blends the boss in by these.
const TYPES = ['physical', 'lightning', 'cold', 'fire', 'chaos'];
console.log('');
console.log('| Boss | Fights | Share of the map in the fight | Fight mix |');
console.log('| --- | --- | --- | --- |');
for (const id of BOSS_IDS) {
  const fs = fights.filter((f) => f.boss === id && f.fightTaken);
  if (!fs.length) continue;
  const fight = [0, 0, 0, 0, 0];
  let map = 0;
  for (const f of fs) {
    f.fightTaken.forEach((x, i) => (fight[i] += x));
    map += f.mapTaken.reduce((a, b) => a + b, 0);
  }
  const tot = fight.reduce((a, b) => a + b, 0);
  const mix = fight.map((x, i) => `${TYPES[i]} ${pct(x / Math.max(1, tot))}`).join(', ');
  console.log(`| ${BOSSES[id].name} | ${fs.length} | ${pct(tot / Math.max(1, map))} | ${mix} |`);
}
