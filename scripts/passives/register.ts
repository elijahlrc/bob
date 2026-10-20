/**
 * Gives every node of the hand-written tree its number in `src/data/passives/ids.json` (docs/tree/design/D-method.md):
 * append-only, so a node keeps its number for as long as it keeps its id, whatever is added, removed or reordered around
 * it. The tree editor's patch (`edits.json`) and, later, saves and rivals carry these numbers.
 *
 *   npm run passives:register
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildAll } from '../../src/data/passives';
import registry from '../../src/data/passives/ids.json';

const before = Object.keys(registry).length;
const built = buildAll({ allowNew: true, edits: false });
const after = Object.keys(built.registry).length;
const path = resolve(import.meta.dirname, '../../src/data/passives/ids.json');
writeFileSync(path, JSON.stringify(built.registry, null, 2) + '\n');
console.log(`${path}: ${after} ids (${after - before} new)`);
const retired = Object.keys(built.registry).filter(
  (id) => built.ids[built.registry[id]] === '(retired)',
).length;
if (retired)
  console.log(
    `${retired} registered ids are no longer in any area file (their numbers stay reserved).`,
  );
const problems = built.problems.filter((p) => !p.startsWith('new id not in the registry'));
if (problems.length) console.log(`problems:\n  ${problems.join('\n  ')}`);
