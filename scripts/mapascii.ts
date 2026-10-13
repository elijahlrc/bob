/**
 * Draws generated maps as text (docs/MAP-VARIETY.md): `#` wall, `.` floor, `S` start, `E` exit, `m` a monster.
 *
 *   npm run map:ascii -- --biome cavern [--map 25] [--seed 1] [--count 1] [--type plain]
 */
import { LEGACY } from '../src/data/difficulty';
import type { MapTypeId } from '../src/data/mapTypes';
import { makeMapPlan } from '../src/gen/mapPlan';

const arg = (k: string, d: string) => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const biome = arg('biome', 'crypt');
const map = Number(arg('map', '25'));
const seed = Number(arg('seed', '1'));
const count = Number(arg('count', '1'));
const type = arg('type', 'plain') as MapTypeId;

for (let k = 0; k < count; k++) {
  const plan = makeMapPlan(
    (seed + k) * 7919,
    map,
    'ashenCrypt',
    [],
    map,
    type,
    0,
    LEGACY,
    0,
    biome,
    'standard',
  );
  const lab = plan.lab;
  const rows: string[][] = [];
  for (let y = 0; y < lab.h; y++) {
    const row: string[] = [];
    for (let x = 0; x < lab.w; x++) row.push(lab.tiles[y * lab.w + x] === 1 ? '.' : '#');
    rows.push(row);
  }
  for (const m of plan.pop.monsters) rows[Math.floor(m.y)][Math.floor(m.x)] = 'm';
  rows[Math.floor(lab.start.y)][Math.floor(lab.start.x)] = 'S';
  rows[Math.floor(lab.exit.y)][Math.floor(lab.exit.x)] = 'E';
  let floor = 0;
  for (const v of lab.tiles) floor += v === 1 ? 1 : 0;
  console.log(
    `${biome} map ${map} seed ${seed + k}: ${lab.w} x ${lab.h}, ${lab.rooms.length} rooms, ${floor} floor, ${plan.pop.monsters.length} monsters`,
  );
  console.log(rows.map((r) => r.join('')).join('\n'));
  console.log('');
}
