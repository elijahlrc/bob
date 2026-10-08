/**
 * Names for the notables of the tree. Every notable of the reference gets an analog with a name of our own; the names are
 * written by hand (or by an author given the effect) into docs/tree/names/<region>.json as { "<reference id>": "Name" }.
 *
 *   npm run tree:names -- --todo [sector]     writes the effects still to be named into scripts/tree/staging/
 *   npm run tree:names -- --check file.json   dry run of one names file: ids exist, names are free and not reference names
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { modsText } from '../../src/mods/text';
import type { Mod } from '../../src/mods/types';
import { loadReference, loadPobNames, key } from '../coverage/reference';
import type { ModT } from '../coverage/translate';
import { buildClusters, loadOverrides, SECTOR_REGION, TREE_DIR } from './clusters';
import { loadTreeRef } from './lines';

export const NAMES_DIR = resolve(TREE_DIR, 'names');

export function loadAllNames(): Record<string, string> {
  const out: Record<string, string> = {};
  let files: string[] = [];
  try {
    files = readdirSync(NAMES_DIR).filter((f) => f.endsWith('.json'));
  } catch {
    /* none yet */
  }
  for (const f of files.sort())
    Object.assign(out, JSON.parse(readFileSync(resolve(NAMES_DIR, f), 'utf8')));
  return out;
}

export const asMods = (mods: ModT[]): Mod[] =>
  mods.map((m) => ({
    stat: m.stat,
    kind: m.kind,
    value: m.min,
    ...(m.damageTypes ? { damageTypes: m.damageTypes } : {}),
    ...(m.tags ? { tags: m.tags } : {}),
    ...(m.condition ? { condition: m.condition } : {}),
    ...(m.per ? { per: m.per } : {}),
  }));

/** The names that may not be used: reference gems, uniques and tree nodes, in every spelling the IP test knows. */
export function deniedNames(): Set<string> {
  const ref = loadReference();
  const pob = loadPobNames();
  const tree = loadTreeRef();
  const set = new Set<string>();
  for (const g of ref.gems) set.add(key(g.name));
  for (const u of ref.uniques) set.add(key(u.name));
  for (const n of pob.gems) set.add(key(n));
  for (const n of pob.uniques) set.add(key(n));
  for (const n of tree.nodes) set.add(key(n.name));
  return set;
}

function main(): void {
  const args = process.argv.slice(2);
  const ref = loadTreeRef();
  const { built } = buildClusters(ref, loadOverrides());
  const names = loadAllNames();
  if (args[0] === '--todo') {
    const want = args[1];
    mkdirSync(resolve(import.meta.dirname, 'staging'), { recursive: true });
    for (let s = 0; s < ref.sectors.length; s++) {
      if (want && SECTOR_REGION[s] !== want) continue;
      const rows = built
        .filter((b) => b.sector === s && !names[String(b.ref)])
        .map((b) => ({
          id: String(b.ref),
          effect: modsText(asMods(b.notable)),
          smallNodes: modsText(asMods(b.small)),
        }));
      const out = resolve(import.meta.dirname, 'staging', `names-todo-${SECTOR_REGION[s]}.json`);
      writeFileSync(out, JSON.stringify(rows, null, 1));
      console.log(`${SECTOR_REGION[s]}: ${rows.length} to name -> ${out}`);
    }
    return;
  }
  if (args[0] === '--check') {
    const path = resolve(args[1]);
    const mine = JSON.parse(readFileSync(path, 'utf8')) as Record<string, string>;
    const ids = new Set(built.map((b) => String(b.ref)));
    const deny = deniedNames();
    const used = new Map<string, string>();
    for (const [id, n] of Object.entries(names)) used.set(key(n), id);
    const problems: string[] = [];
    const here = new Set<string>();
    for (const [id, n] of Object.entries(mine)) {
      if (!ids.has(id)) problems.push(`${id}: not a notable that is built`);
      if (typeof n !== 'string' || n.trim().length < 3) problems.push(`${id}: bad name`);
      const k = key(n);
      if (deny.has(k)) problems.push(`${id}: "${n}" is a reference name`);
      const other = used.get(k);
      if (other && other !== id) problems.push(`${id}: "${n}" is already used by ${other}`);
      if (here.has(k)) problems.push(`${id}: "${n}" appears twice in this file`);
      here.add(k);
    }
    if (problems.length) {
      console.log(problems.join('\n'));
      process.exit(1);
    }
    console.log(`ok: ${Object.keys(mine).length} names`);
    return;
  }
  const missing = built.filter((b) => !names[String(b.ref)]).length;
  console.log(`${built.length} notables built, ${missing} without a name`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
