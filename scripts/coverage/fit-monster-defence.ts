/**
 * Monster evasion and accuracy against the reference game's tables (docs/EVASION.md). `npm run evasion` prints:
 *   1. how close Bob's monster curves (src/calc/formulas.ts) are to docs/coverage/pob-monster-stats.json;
 *   2. what a character with plain gear (no affixes, no passives) hits and is hit for, in Bob before the change, in Bob now
 *      and in the reference game, level by level.
 * The reference table and the reference bases (docs/coverage/pob-bases.json) are data and stay in docs/; the game has only
 * its own fitted curves.
 */
import { readFileSync } from 'node:fs';
import { hitChance, monsterAccuracy, monsterEvasion } from '../../src/calc/formulas';
import { BASE_ACCURACY, BASE_EVASION, DEX_ACCURACY } from '../../src/data/constants';
import { ITEM_BASES } from '../../src/data/bases';

type Table = { evasion: number[]; accuracy: number[] };
type PobBase = {
  type: string;
  subType: string;
  level: number;
  evasion: number;
  implicit: string;
};

const read = <T>(f: string): T =>
  JSON.parse(readFileSync(new URL(`../../docs/coverage/${f}`, import.meta.url), 'utf8')) as T;
const table = read<Table>('pob-monster-stats.json');
const pob = read<{ bases: PobBase[] }>('pob-bases.json').bases;

// ---- 1. The fit ----
function worst(values: number[], f: (m: number) => number): [number, number] {
  let w = 0;
  let at = 1;
  values.forEach((v, i) => {
    const e = Math.abs(f(i + 1) - v) / v;
    if (e > w) [w, at] = [e, i + 1];
  });
  return [w, at];
}
const [ew, el] = worst(table.evasion, monsterEvasion);
const [aw, al] = worst(table.accuracy, monsterAccuracy);
console.log('Monster curves against the reference table (levels 1 to 100)');
console.log(`  evasion  worst error ${(ew * 100).toFixed(2)}% at level ${el}`);
console.log(`  accuracy worst error ${(aw * 100).toFixed(2)}% at level ${al}\n`);

// ---- 2. The same plain character in each game ----
const OLD_ACCURACY = (m: number) => 20 + 14 * m;
const OLD_EVASION = (m: number) => 30 + 12 * m;
/** Dexterity of the reference character: one point per level (a Dex build's requirements, roughly). */
const dex = (level: number) => level;

const SLOTS = ['body', 'helmet', 'gloves', 'boots'] as const;
const POB_SLOT: Record<(typeof SLOTS)[number], string> = {
  body: 'Body Armour',
  helmet: 'Helmet',
  gloves: 'Gloves',
  boots: 'Boots',
};

/** The best pure evasion piece in each slot that the level allows, and the best flat accuracy sword, in Bob. */
function bob(level: number): { eva: number; acc: number } {
  let eva = BASE_EVASION(level);
  for (const slot of SLOTS) {
    const best = ITEM_BASES.filter(
      (b) => b.itemClass === slot && b.defenceType === 'ev' && b.level <= level,
    ).reduce((m, b) => Math.max(m, b.defence?.evasion ?? 0), 0);
    eva += best;
  }
  const sword = ITEM_BASES.filter((b) => b.itemClass === 'sword' && b.level <= level)
    .map((b) => b.implicits.find((i) => i.stat === 'accuracy')?.value ?? 0)
    .reduce((m, v) => Math.max(m, v), 0);
  return { eva, acc: BASE_ACCURACY(level) + DEX_ACCURACY * dex(level) + sword };
}

/** The same in the reference game, from its 3.9-era bases. */
function reference(level: number): { eva: number; acc: number } {
  let eva = BASE_EVASION(level);
  for (const slot of SLOTS) {
    eva += pob
      .filter((b) => b.type === POB_SLOT[slot] && b.subType === 'Evasion' && b.level <= level)
      .reduce((m, b) => Math.max(m, b.evasion), 0);
  }
  const sword = pob
    .filter((b) => b.type === 'One Handed Sword' && b.level <= level)
    .map((b) => Number(/\+(\d+) to Accuracy Rating/.exec(b.implicit)?.[1] ?? 0))
    .reduce((m, v) => Math.max(m, v), 0);
  return { eva, acc: BASE_ACCURACY(level) + DEX_ACCURACY * dex(level) + sword };
}

const pct = (x: number) => `${(x * 100).toFixed(0)}%`;
const rows: string[][] = [
  [
    'Level',
    'Player acc (Bob/ref)',
    'Monster eva before',
    'Monster eva now',
    'Monster eva ref',
    'You hit: before',
    'now',
    'ref',
    'Player eva (Bob/ref)',
    'Monster acc before',
    'now',
    'ref',
    'Hits you: before',
    'now',
    'ref',
  ],
];
for (const L of [10, 20, 30, 45, 60, 75, 84, 100]) {
  const b = bob(L);
  const r = reference(L);
  const tEva = table.evasion[L - 1];
  const tAcc = table.accuracy[L - 1];
  rows.push([
    String(L),
    `${Math.round(b.acc)}/${Math.round(r.acc)}`,
    String(OLD_EVASION(L)),
    String(monsterEvasion(L)),
    String(tEva),
    pct(hitChance(b.acc, OLD_EVASION(L))),
    pct(hitChance(b.acc, monsterEvasion(L))),
    pct(hitChance(r.acc, tEva)),
    `${Math.round(b.eva)}/${Math.round(r.eva)}`,
    String(OLD_ACCURACY(L)),
    String(monsterAccuracy(L)),
    String(tAcc),
    pct(hitChance(OLD_ACCURACY(L), b.eva)),
    pct(hitChance(monsterAccuracy(L), b.eva)),
    pct(hitChance(tAcc, r.eva)),
  ]);
}
console.log('A character in plain gear (no affixes, passives or gems; dexterity = level)');
console.log(
  rows
    .map((r) => r.join(' | '))
    .map((l) => `| ${l} |`)
    .join('\n'),
);
