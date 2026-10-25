/**
 * What each boss deals by type when it fights alone (docs/NEWPLAYER.md N12): a deathless level-matched Vanguard in an open
 * arena with the boss and its partners, two minutes, every hit on the character tallied by damage type. The boss maps
 * reached by bots are measured in real fights by `scripts/boss-gauntlet.ts`; this fills in the rest and checks the two agree.
 *
 *   npx tsx scripts/boss-mix.ts [--seconds 120]
 */
import type { MonsterSpec } from '../src/calc/monster';
import { BOSSES, BOSS_IDS, type BossId } from '../src/data/bosses';
import { makeGem, makeItem } from '../src/gen/items';
import { newRun } from '../src/run/run';
import { createDummyWorld } from '../src/sim/dummy';
import type { World } from '../src/sim/types';
import { spawnMonster, stepWorld } from '../src/sim/world';

const i = process.argv.indexOf('--seconds');
const seconds = i >= 0 ? Number(process.argv[i + 1]) : 120;
const TYPES = ['physical', 'lightning', 'cold', 'fire', 'chaos'];

function arena(level: number): World {
  const run = newRun('vanguard', 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = level;
  b.equipment.mainHand = makeItem(uid, 'mace2_3', level, 1);
  b.equipment.mainHand.sockets = [makeGem(uid, 'crushingBlow')];
  b.primaryGem = b.equipment.mainHand.sockets[0]!.uid;
  delete b.equipment.offHand;
  const { world } = createDummyWorld(b, { distance: 30 });
  world.sides[0].opts.godMode = true;
  for (const a of world.actors) if (a.dummy) a.alive = false;
  return world;
}

function mix(id: BossId): number[] {
  const def = BOSSES[id];
  const w = arena(def.map);
  for (const [k, type] of [def.type, ...(def.partners ?? [])].entries()) {
    const spec: MonsterSpec = { type, variant: 'none', rarity: 'boss', level: def.map, mods: [] };
    const p = w.sides[0].player;
    spawnMonster(w, spec, p.x + 6, p.y + k * 2, 0, 900, def.name).state = 'chase';
  }
  const taken = [0, 0, 0, 0, 0];
  const me = w.sides[0].player.id;
  for (let f = 0; f < seconds * 60; f++) {
    stepWorld(w);
    for (const e of w.events)
      if (e.t === 'hit' && e.dst === me && e.amount > 0) taken[e.dtype] += e.amount;
  }
  const tot = taken.reduce((a, b) => a + b, 0) || 1;
  return taken.map((x) => x / tot);
}

console.log('| Boss | Map | Mix alone |');
console.log('| --- | --- | --- |');
for (const id of BOSS_IDS) {
  const m = mix(id);
  console.log(
    `| ${BOSSES[id].name} | ${BOSSES[id].map} | ${m.map((x, k) => `${TYPES[k]} ${Math.round(x * 100)}%`).join(', ')} |`,
  );
}
