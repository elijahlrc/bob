/**
 * Write the join blocks of every gem to batch files for a re-audit (docs/SPIRIT.md S14): the actives and auras in four batches,
 * the supports in three. Usage: tsx scripts/spirit/dump-batches.ts <out-dir>
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ALL_GEMS } from '../../src/data/gems';
import { joinBlock, loadMapGems } from './join';

const out = resolve(process.argv[2] ?? 'audit-batches');
mkdirSync(out, { recursive: true });
const mapped = loadMapGems();
const ids = ALL_GEMS.filter((g) => mapped[g.id]).map((g) => g);
const supports = ids
  .filter((g) => g.kind === 'support')
  .map((g) => g.id)
  .sort();
const others = ids
  .filter((g) => g.kind !== 'support')
  .map((g) => g.id)
  .sort();
const split = (list: string[], n: number): string[][] => {
  const per = Math.ceil(list.length / n);
  return Array.from({ length: n }, (_, i) => list.slice(i * per, (i + 1) * per));
};
const batches = [...split(others, 4), ...split(supports, 3)];
batches.forEach((b, i) => {
  writeFileSync(
    resolve(out, `batch-${i + 1}.txt`),
    b.map((id) => joinBlock(id)).join('\n\n') + '\n',
  );
  writeFileSync(resolve(out, `batch-${i + 1}.ids`), b.join('\n') + '\n');
  console.log(`batch ${i + 1}: ${b.length} gems`);
});
