/**
 * The build matrix (docs/ROSTER.md 6.2): how many times longer than a plain monster of its level each type takes to kill
 * under each of eight reference damage profiles, its mean (the divisor of its raw life: a defence is paid for in life) and
 * the means by faction.
 *
 *   npm run matrix -- [--level 30]
 */
import { PROBES, durabilityTable, meanDurability } from '../src/calc/matrix';
import { profileOf } from '../src/data/defence';
import { MONSTER_TYPES } from '../src/data/monsters';

const i = process.argv.indexOf('--level');
const level = i >= 0 ? Number(process.argv[i + 1]) : 30;
const ids = PROBES.map((p) => p.id);
const head = ids.map((p) => p.slice(0, 6).padStart(7)).join('');
console.log(
  `Durability against a plain monster at level ${level} (1 is the same; above 1 is harder to kill)`,
);
console.log('type'.padEnd(14) + head + '   mean  life x  toughness');
const byFaction: Record<string, number[][]> = {};
for (const t of Object.values(MONSTER_TYPES)) {
  const p = profileOf(t.faction, t.defence);
  const table = durabilityTable(p, level);
  const mean = meanDurability(p, level);
  const row = ids.map((id) => table[id]);
  console.log(
    t.id.padEnd(14) +
      row.map((x) => x.toFixed(2).padStart(7)).join('') +
      mean.toFixed(2).padStart(7) +
      (t.lifeMult / mean).toFixed(2).padStart(8) +
      t.lifeMult.toFixed(2).padStart(10),
  );
  (byFaction[t.faction] ??= []).push(row);
}
console.log('\nBy faction (mean over its types)');
for (const [f, rows] of Object.entries(byFaction))
  console.log(
    f.padEnd(14) +
      ids
        .map((_, j) => (rows.reduce((s, r) => s + r[j], 0) / rows.length).toFixed(2).padStart(7))
        .join(''),
  );
