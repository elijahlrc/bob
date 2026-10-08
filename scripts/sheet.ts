/**
 * A contact sheet of every monster type (docs/ROSTER.md 4.5), the review tool of every change to a body, a kit or a rig.
 *
 *   npm run sheet -- out.svg [--k 1.9] [--mono] [--poses idle,walk,attack] [--types warrior,hexer] [--report]
 *
 * `--k` is pixels per figure unit: the game draws 0.6 times the camera zoom, so `--k 0.6` is a phone, `--k 1.2` a desktop.
 * `--mono` draws one flat colour, to judge outlines. `--report` also prints the pairs of types whose outlines overlap most.
 */
import { writeFileSync } from 'node:fs';
import { MONSTER_TYPES, type MonsterTypeId } from '../src/data/monsters';
import type { AnimName } from '../src/render/style/figure';
import { sheetSvg } from '../src/render/style/sheet';
import { pairScores } from '../src/render/style/silhouette';

const argv = process.argv.slice(2);
const flag = (k: string) => argv.includes(`--${k}`);
const arg = (k: string, d: string) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 ? argv[i + 1] : d;
};
const out = argv.find(
  (a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--') && !flag('mono')),
);

const TIMES: Record<string, number> = { idle: 0, walk: 0.25, attack: 0.5, stun: 0.3, death: 0.6 };
const poses = arg('poses', 'idle')
  .split(',')
  .map((p) => [p as AnimName, TIMES[p] ?? 0] as [AnimName, number]);
const types = arg('types', '').split(',').filter(Boolean) as MonsterTypeId[];
for (const t of types) if (!MONSTER_TYPES[t]) throw new Error(`no such type: ${t}`);

if (out) {
  writeFileSync(
    out,
    sheetSvg({
      k: Number(arg('k', '1.9')),
      mono: flag('mono'),
      poses,
      types: types.length ? types : undefined,
    }),
  );
  console.log(`wrote ${out}`);
}

if (flag('report') || !out) {
  const pairs = pairScores(types.length > 1 ? types : undefined);
  const n = Number(arg('top', '20'));
  console.log(
    `most alike outlines (intersection over union, 1 is the same), top ${n} of ${pairs.length}:`,
  );
  for (const p of pairs.slice(0, n))
    console.log(`  ${p.sim.toFixed(2)}  ${p.a} / ${p.b}${p.sameFaction ? '  (same faction)' : ''}`);
  const other = pairs.filter((p) => !p.sameFaction);
  const same = pairs.filter((p) => p.sameFaction);
  const over = (xs: typeof pairs, v: number) => xs.filter((p) => p.sim > v).length;
  console.log(
    `pairs of different factions above 0.75: ${over(other, 0.75)} of ${other.length}; same faction above 0.85: ${over(same, 0.85)} of ${same.length}`,
  );
}
