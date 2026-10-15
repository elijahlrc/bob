/**
 * The damage preview against the damage the sim deals (docs/SHEET-AUDIT.md).
 *
 *   npm run dpsaudit -- [--class all|id,id] [--maps 12,24,40] [--seeds 1] [--time 240] [--sims 1] [--target reference] [--mana]
 *                       [--builds file.json] [--save file.json] [--brief]
 *
 * Builds come from the bot (a run played to the given maps; its build at the start of each), or from a file saved by an earlier
 * run (`--save`, then `--builds`), so a change to the sheet is measured on the same builds.
 *
 * Each build is measured in two fights: a **pack** (the target with three dummies near it that take no damage, so that the
 * conditions of the pack skills hold) and a **boss** (the target is a boss), in an open arena against a training dummy that does not
 * hit back. The yardstick is damage a second while the target stands there: what the sheet claims to be. The sheet's number for the
 * same fight is `Character.sheet(conds, scenario, target)` with the dummy's own defence (`--target reference` gives the dummy the
 * reference monster's defence instead, to check mitigation too).
 *
 * `--mana` plays with the character's mana and life as they are (the sheet's DPS counts every skill at full rate).
 *
 * Per fight it prints the sheet's DPS, the sim's, their ratio and, for each skill, uses a second (`sim/sheet`; `+n` is what a
 * totem, brand, trap or mine fired by itself) and damage a second (from the sim's own ledger of who dealt what).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { CLASSES } from '../src/data/classes';
import type { Build } from '../src/data/types';
import { botRun } from '../src/run/bot';
import { f1, measure, type Fight, type MeasureOpts } from './dps-lib';

const argv = process.argv.slice(2);
const opt = (k: string, d: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const classArg = opt('--class', 'all');
const classes = classArg === 'all' ? CLASSES.map((c) => c.id) : classArg.split(',');
const maps = opt('--maps', '12,24,40').split(',').map(Number);
const seeds = Number(opt('--seeds', '1'));
const time = Number(opt('--time', '240'));
const sims = Number(opt('--sims', '1'));
const reference = opt('--target', 'dummy') === 'reference';
const brief = argv.includes('--brief');
const mana = argv.includes('--mana');
const DIST = 4;

export type Captured = { label: string; build: Build };

/** The bot's builds at the start of the given maps. */
function capture(classId: string, seed: number): Captured[] {
  const got = new Map<number, Build>();
  botRun(classId, seed, Math.max(...maps), {
    onTick: (_w, run) => {
      if (maps.includes(run.map) && !got.has(run.map)) got.set(run.map, structuredClone(run.build));
    },
  });
  return [...got].map(([map, build]) => ({ label: `${classId}#${seed} map ${map}`, build }));
}

const OPTS: MeasureOpts = { distance: DIST, time, sims, reference, freeResources: !mana };

export function auditBuild(label: string, build: Build): { fight: Fight; ratio: number }[] {
  const out: { fight: Fight; ratio: number }[] = [];
  let head = false;
  for (const fight of ['pack', 'boss'] as Fight[]) {
    const r = measure(build, fight, OPTS);
    if (!head) {
      console.log(
        `\n${label} (level ${build.level}, ${build.equipment.mainHand?.baseId ?? 'no weapon'}): mains ${r.mains}; rotation ${r.rotation}`,
      );
      head = true;
    }
    const ratio = r.sim / Math.max(1e-9, r.sheet);
    out.push({ fight, ratio });
    console.log(
      `  ${fight.padEnd(4)} sheet ${f1(r.sheet).padStart(6)}  sim ${f1(r.sim).padStart(6)}  sim/sheet ${ratio.toFixed(2)}`,
    );
    if (brief) continue;
    for (const x of r.rows.sort((a, b) => b.sheetDps + b.simDps - a.sheetDps - a.simDps)) {
      if (x.sheetUses + x.simUses + x.simShots + x.sheetDps + x.simDps < 0.01) continue;
      console.log(
        `       ${x.id.padEnd(18)} uses ${f1(x.simUses).padStart(5)}/${f1(x.sheetUses).padEnd(5)}${x.simShots > 0 ? ` +${f1(x.simShots)}` : '      '}  dps ${f1(x.simDps).padStart(6)}/${f1(x.sheetDps).padEnd(6)}`,
      );
    }
  }
  return out;
}

const loadFile = opt('--builds', '');
let corpus: Captured[] = [];
if (loadFile) corpus = JSON.parse(readFileSync(loadFile, 'utf8')) as Captured[];
else
  for (const cls of classes)
    for (let seed = 1; seed <= seeds; seed++) corpus.push(...capture(cls, seed));
const saveFile = opt('--save', '');
if (saveFile) writeFileSync(saveFile, JSON.stringify(corpus));

const all: { fight: Fight; ratio: number }[] = [];
for (const cap of corpus) all.push(...auditBuild(cap.label, cap.build));

const med = (xs: number[]) => (xs.length ? [...xs].sort((a, b) => a - b)[xs.length >> 1] : NaN);
for (const fight of ['pack', 'boss'] as Fight[]) {
  const rs = all.filter((a) => a.fight === fight).map((a) => a.ratio);
  const within = (lo: number, hi: number) => rs.filter((r) => r >= lo && r <= hi).length;
  console.log(
    `\n${fight}: ${rs.length} builds, median sim/sheet ${med(rs).toFixed(2)}, within 10% ${within(0.9, 1.1)}, within 25% ${within(0.75, 1.25)}, under 0.75: ${rs.filter((r) => r < 0.75).length}, over 1.25: ${rs.filter((r) => r > 1.25).length}`,
  );
}
