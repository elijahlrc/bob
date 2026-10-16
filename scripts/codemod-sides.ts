/**
 * The mechanical part of the extraction of the player singleton (docs/DUEL.md 3.3): a read of a field that has moved from
 * `World` to `Side` is rewritten from `w.<field>` to `w.sides[0].<field>`, wherever the compiler says `World` has no such
 * property. It is driven by the compiler's own diagnostics (TS2339 "Property 'x' does not exist on type 'World'"), so it
 * works on whatever expression holds the world (`w`, `world`, `res.world`, `this.world`), and it can be run again after a
 * merge that brings in new tests: it finds exactly what is left.
 *
 *   npx tsx scripts/codemod-sides.ts [--scope tests|outside|all] [--groups 1,2,3] [--dry]
 *
 * Scopes (the sim itself is not among them: there a read becomes a parameter, a side read from an actor, or `hunted`):
 *   tests    every *.test.ts and *.test.tsx
 *   outside  render, ui, run, the entry files and scripts/*.ts that are not tests
 *   all      both (the default)
 *
 * Only the fields of the groups named (default: all five) are touched, so a mistyped property is never "fixed". Anything the
 * compiler flags that is not a plain property read (a destructuring, an object literal cast `as World`) is listed, not edited.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const GROUPS: Record<number, string[]> = {
  1: ['flasks', 'ai', 'stats', 'picked', 'dmgLog', 'ledger', 'reprieve', 'xp'],
  2: [
    'chargeT',
    'buffT',
    'rage',
    'rageT',
    'rageDrain',
    'rageGainT',
    'trophy',
    'trig',
    'secondaryReady',
    'guard',
    'cooldowns',
    'utilityReady',
    'openers',
    'auraBurnT',
    'berserkT',
    'chars',
  ],
  3: [
    'deployables',
    'deploySeq',
    'minions',
    'fields',
    'zones',
    'banner',
    'offering',
    'warp',
    'wither',
    'caught',
  ],
  4: [
    'uses',
    'intensity',
    'intensityT',
    'seals',
    'mirage',
    'inspireMana',
    'infusing',
    'shockCd',
    'inShock',
    'critLock',
    'critSeen',
    'elem',
    'elemLast',
    'staticFx',
    'shell',
    'virulence',
    'surgeMana',
    'relicRegen',
    'relicT',
    'trailT',
    'vortex',
    'markers',
    'stormOrb',
    'fuses',
    'spores',
    'charged',
    'inFx',
    'lastTravel',
    'channel',
    'stacks',
    'hitsLanded',
    'shots',
    'lastOutcome',
  ],
  5: ['player', 'char', 'build', 'primary'],
};

/** The options that moved from `WorldOpts` to `SideOpts` (G1). */
const SIDE_OPTS = ['start', 'freeResources', 'godMode', 'reprieves'];

const argv = process.argv.slice(2);
const opt = (k: string, d: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const scope = opt('--scope', 'all');
const dry = argv.includes('--dry');
const groups = opt('--groups', '1,2,3,4,5').split(',').map(Number);
const fields = new Set(groups.flatMap((g) => GROUPS[g] ?? []));

const root = process.cwd().replace(/\\/g, '/');
const rel = (f: string) => path.relative(root, f).replace(/\\/g, '/');
/** Tests, and the two modules of src/sim that only tests and scripts import (they build and poke worlds as a test does). */
const HARNESS = ['src/sim/gemKit.ts', 'src/sim/dummy.ts'];
const isTest = (f: string) => /\.test\.tsx?$/.test(f) || HARNESS.includes(f);
const inScope = (f: string): boolean => {
  const r = rel(f);
  if (r.startsWith('..') || r.startsWith('node_modules')) return false;
  if (isTest(r)) return scope === 'tests' || scope === 'all';
  if (scope === 'tests') return false;
  if (r.startsWith('src/sim/')) return false;
  return (
    r.startsWith('src/render/') ||
    r.startsWith('src/ui/') ||
    r.startsWith('src/run/') ||
    /^src\/[^/]+\.tsx?$/.test(r) ||
    /^scripts\/.+\.ts$/.test(r)
  );
};

const cfgPath = ts.findConfigFile(root, ts.sys.fileExists, 'tsconfig.json')!;
const cfg = ts.readConfigFile(cfgPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(cfg.config, ts.sys, root);
const program = ts.createProgram(parsed.fileNames, parsed.options);
const diags = ts.getPreEmitDiagnostics(program);

type Edit = { pos: number; end: number; text: string };
const edits = new Map<string, Edit[]>();
const unhandled: string[] = [];
let seen = 0;

for (const d of diags) {
  if ((d.code !== 2339 && d.code !== 2551) || !d.file || d.start === undefined) continue;
  const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
  const m = /^Property '(\w+)' does not exist on type '(World|WorldOpts)'/.exec(msg);
  if (!m || (m[2] === 'World' ? !fields.has(m[1]) : !SIDE_OPTS.includes(m[1]))) continue;
  const file = d.file.fileName;
  if (!inScope(file)) continue;
  seen++;
  let hit: ts.PropertyAccessExpression | undefined;
  const visit = (n: ts.Node): void => {
    if (hit || d.start! < n.getFullStart() || d.start! >= n.getEnd()) return;
    if (
      ts.isPropertyAccessExpression(n) &&
      n.name.getStart() === d.start &&
      n.name.getEnd() === d.start! + d.length!
    ) {
      hit = n;
      return;
    }
    ts.forEachChild(n, visit);
  };
  visit(d.file);
  if (!hit) {
    const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
    unhandled.push(`${rel(file)}:${line + 1}:${character + 1} ${msg}`);
    continue;
  }
  // `w.field`, or `w.opts.field` for the options that moved to the side: `.sides[0]` goes after the world either way.
  let world: ts.Expression = hit.expression;
  if (m[2] === 'WorldOpts') {
    if (ts.isPropertyAccessExpression(world) && world.name.text === 'opts')
      world = world.expression;
    else {
      const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
      unhandled.push(`${rel(file)}:${line + 1}:${character + 1} ${msg} (not read as <world>.opts)`);
      continue;
    }
  }
  // The access that follows the world: `w.field`, or `w.opts` for the options. If it is optional (`w?.player`) the optional
  // chain goes on from the side: `w?.sides[0].player`.
  const next = hit.expression === world ? hit : (hit.expression as ts.PropertyAccessExpression);
  const list = edits.get(file) ?? [];
  if (next.questionDotToken)
    list.push({
      pos: next.questionDotToken.getStart(),
      end: next.questionDotToken.getEnd(),
      text: '?.sides[0].',
    });
  else list.push({ pos: world.getEnd(), end: world.getEnd(), text: '.sides[0]' });
  edits.set(file, list);
}

let total = 0;
for (const [file, list] of edits) {
  let text = readFileSync(file, 'utf8');
  for (const e of list.sort((a, b) => b.pos - a.pos)) {
    text = text.slice(0, e.pos) + e.text + text.slice(e.end);
    total++;
  }
  if (!dry) writeFileSync(file, text);
}
console.log(
  `${dry ? 'would rewrite' : 'rewrote'} ${total} reads of moved fields in ${edits.size} files (scope ${scope}, groups ${groups.join(',')})`,
);
if (unhandled.length) {
  console.log(`\n${unhandled.length} the compiler flags that are not plain reads (by hand):`);
  for (const u of unhandled) console.log('  ' + u);
}
if (seen === 0) console.log('nothing to do');
