/**
 * How big and how crowded the generated maps are (docs/MAP-VARIETY.md W0): for map levels and map types, over many seeds,
 * the rooms, the floor area, the map's bounding box, the monsters and the monsters per 100 floor tiles.
 *
 *   npm run mapstats -- [--seeds 40] [--maps 1,10,25,50,75,100] [--type plain]
 */
import { MAP_TYPES, type MapTypeId } from '../src/data/mapTypes';
import { THEMES } from '../src/data/themes';
import { makeMapPlan } from '../src/gen/mapPlan';

const arg = (k: string, d: string) => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const seeds = Number(arg('seeds', '40'));
const maps = arg('maps', '1,10,25,50,75,100').split(',').map(Number);
const only = arg('type', '');

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const f = (n: number, d = 1) => n.toFixed(d);

console.log('map type       rooms  floor  w x h      monsters  /100 tiles  min-max');
for (const map of maps) {
  for (const t of MAP_TYPES) {
    if (only && t.id !== only) continue;
    if (t.from > map) continue;
    if (map % 10 === 0 && t.id !== 'plain') continue;
    const rooms: number[] = [];
    const floor: number[] = [];
    const wh: number[] = [];
    const mons: number[] = [];
    for (let s = 1; s <= seeds; s++) {
      const theme = THEMES.filter((x) => (x.fromMap ?? 1) <= map)[s % 5].id;
      const plan = makeMapPlan(s * 7919, map, theme, [], map, t.id as MapTypeId);
      let n = 0;
      for (const v of plan.lab.tiles) n += v === 1 ? 1 : 0;
      rooms.push(plan.lab.rooms.length);
      floor.push(n);
      wh.push(Math.max(plan.lab.w, plan.lab.h));
      const m =
        plan.pop.monsters.length +
        (plan.pop.waves ?? []).reduce((a, w) => a + w.monsters.length, 0);
      mons.push(m);
    }
    const dens = mons.map((m, i) => (m / floor[i]) * 100);
    console.log(
      `${String(map).padStart(3)} ${t.id.padEnd(11)} ${f(avg(rooms)).padStart(5)} ${f(avg(floor), 0).padStart(6)}  ${f(avg(wh), 0).padStart(4)}       ${f(avg(mons)).padStart(7)}  ${f(avg(dens), 2).padStart(10)}  ${Math.min(...mons)}-${Math.max(...mons)}`,
    );
  }
}
