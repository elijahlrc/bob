/**
 * Which lines of the reference tree Bob can already say (DESIGN §3 rule 2: reference text lives in docs/ and scripts/).
 *
 *   npm run tree:lines                 totals, and the most common lines no rule maps yet
 *   npm run tree:lines -- --unmapped 80 --kind notable
 *
 * A line counts as mapped when the translator for unique items (scripts/coverage/modDict.ts) gives it Bob mods. That does
 * not prove the engine reads the stat; it shows the vocabulary exists. Parity is the share of notables whose lines are
 * all mapped or deliberately dropped.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ctxFor, translateLine } from '../coverage/translate';
import type { RefNode, TreeRef } from './extract';

export function loadTreeRef(): TreeRef {
  return JSON.parse(
    readFileSync(resolve(import.meta.dirname, '../../docs/tree/pob-tree.json'), 'utf8'),
  ) as TreeRef;
}

const norm = (l: string) => l.replace(/[0-9]+(\.[0-9]+)?/g, '#');
const ctx = ctxFor('ring', 'ring');

export type LineStatus = 'mods' | 'ignored' | 'unmapped';

export function statusOf(line: string): LineStatus {
  const r = translateLine(line, ctx);
  return r.kind === 'mods' ? 'mods' : r.kind === 'ignored' ? 'ignored' : 'unmapped';
}

function main(): void {
  const args = process.argv.slice(2);
  const kindArg = args.includes('--kind') ? args[args.indexOf('--kind') + 1] : '';
  const top = args.includes('--unmapped') ? Number(args[args.indexOf('--unmapped') + 1]) : 25;
  const ref = loadTreeRef();
  const kinds: RefNode['kind'][] = kindArg
    ? [kindArg as RefNode['kind']]
    : ['small', 'notable', 'keystone'];
  for (const kind of kinds) {
    const nodes = ref.nodes.filter((n) => n.kind === kind);
    const counts = { mods: 0, ignored: 0, unmapped: 0 };
    const missing = new Map<string, { n: number; ex: string }>();
    let nodesAllMapped = 0;
    for (const n of nodes) {
      let all = true;
      for (const l of n.lines) {
        const s = statusOf(l);
        counts[s]++;
        if (s === 'unmapped') {
          all = false;
          const k = norm(l);
          const e = missing.get(k) ?? { n: 0, ex: l };
          e.n++;
          missing.set(k, e);
        }
      }
      if (all) nodesAllMapped++;
    }
    const total = counts.mods + counts.ignored + counts.unmapped;
    console.log(
      `${kind}: ${nodes.length} nodes, ${total} lines: ${counts.mods} mapped, ${counts.ignored} ignored, ${counts.unmapped} unmapped (${missing.size} distinct); ${nodesAllMapped} nodes have every line mapped`,
    );
    for (const [k, v] of [...missing.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, top))
      console.log(`  ${String(v.n).padStart(3)}  ${k}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
