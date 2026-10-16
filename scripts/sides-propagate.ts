/**
 * The compiler-driven pass of the extraction in `src/sim` (docs/DUEL.md 3.2, pattern "acts for a side"): where the compiler
 * says that `World` (or `WorldOpts`) no longer has a field that has moved to `Side`, the read in a function that takes the
 * world as a parameter becomes a read of a `s: Side` parameter placed right after it, and every caller of that function
 * passes its own side (and so gets a `s` parameter in its turn), up to the barriers. Calls from outside the sim (tests,
 * render, ui, run, scripts) pass `<world expression>.sides[0]`.
 *
 *   npx tsx scripts/sides-propagate.ts [--apply] [--groups 1,2] [--barrier stepWorld,...] [--skip a,b] [--name s]
 *
 * Without `--apply` it only lists, per function, what it would do. It is only for functions that act for a side. The hit
 * path (a function that is given the actors that fight: `src.side`, `dst.side`) and the monsters' reads of the character
 * (`hunted`) are rewritten by hand first, so that the compiler no longer reports them. Anything that cannot be done
 * mechanically (a function value, a callback type, a world held in a field) is listed at the end, not edited.
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
const apply = argv.includes('--apply');
const groups = opt('--groups', '1,2,3,4,5').split(',').map(Number);
const fields = new Set(groups.flatMap((g) => GROUPS[g] ?? []));
const barriers = new Set(opt('--barrier', 'stepWorld').split(',').filter(Boolean));
const skip = new Set(opt('--skip', '').split(',').filter(Boolean));
/** Only these functions may gain a side (the rest are listed as blocked, to be done by hand); empty: any. */
const only = new Set(opt('--only', '').split(',').filter(Boolean));
/** These functions may not gain a side (the hit path, the monsters): reaching one is listed as blocked, to be done by hand. */
const except = new Set(opt('--except', '').split(',').filter(Boolean));
const blocked: string[] = [];
const preferred = opt('--name', 's');
/**
 * `name:param`: the function acts on the actor `param` (any actor: a character, a minion, a monster), so its side is
 * `param.side!` and it takes no side of its own (pattern 2 of DUEL.md 3.2).
 */
const byActor = new Map(
  opt('--by-actor', '')
    .split(',')
    .filter(Boolean)
    .map((x) => x.split(':') as [string, string]),
);
/** The monsters' functions (and the world's): their side is that of the character they fight, `w.player.side!` until G5's `hunted`. */
const byPlayer = new Set(opt('--by-player', '').split(',').filter(Boolean));

const root = process.cwd().replace(/\\/g, '/');
const rel = (f: string) => path.relative(root, f).replace(/\\/g, '/');
/** The test helpers of src/sim (gemKit.ts, dummy.ts) are done as tests are: by scripts/codemod-sides.ts. */
const HARNESS = ['src/sim/gemKit.ts', 'src/sim/dummy.ts'];
const isSim = (f: string) =>
  /^src\/sim\//.test(rel(f)) && !/\.test\.tsx?$/.test(f) && !HARNESS.includes(rel(f));

const cfgPath = ts.findConfigFile(root, ts.sys.fileExists, 'tsconfig.json')!;
const cfg = ts.readConfigFile(cfgPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(cfg.config, ts.sys, root);
const program = ts.createProgram(parsed.fileNames, parsed.options);
const checker = program.getTypeChecker();
const diags = ts.getPreEmitDiagnostics(program);

type FnLike =
  ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression | ts.MethodDeclaration;
const isFnLike = (n: ts.Node): n is FnLike =>
  ts.isFunctionDeclaration(n) ||
  ts.isArrowFunction(n) ||
  ts.isFunctionExpression(n) ||
  ts.isMethodDeclaration(n);

type Edit = { file: string; pos: number; end: number; text: string };
const edits: Edit[] = [];
const manual: string[] = [];
const where = (n: ts.Node) => {
  const sf = n.getSourceFile();
  const { line, character } = sf.getLineAndCharacterOfPosition(n.getStart());
  return `${rel(sf.fileName)}:${line + 1}:${character + 1}`;
};
const fnName = (f: FnLike): string => {
  if ((ts.isFunctionDeclaration(f) || ts.isMethodDeclaration(f)) && f.name) return f.name.getText();
  const p = f.parent;
  if (ts.isVariableDeclaration(p) && ts.isIdentifier(p.name)) return p.name.text;
  if (ts.isPropertyAssignment(p)) return p.name.getText();
  return '<anonymous>';
};

/** The parameter of type World (or Side) that an identifier refers to. */
function paramOf(id: ts.Identifier, typeName: string): ts.ParameterDeclaration | undefined {
  const d = checker.getSymbolAtLocation(id)?.valueDeclaration;
  if (!d || !ts.isParameter(d)) return undefined;
  return d.type?.getText() === typeName ? d : undefined;
}
const worldParamIndex = (f: FnLike): number =>
  f.parameters.findIndex((p) => p.type?.getText() === 'World');
const sideParamOf = (f: FnLike): ts.ParameterDeclaration | undefined =>
  f.parameters.find((p) => p.type?.getText() === 'Side');

const allowed = (f: FnLike): boolean => {
  const n = fnName(f);
  return (
    barriers.has(n) ||
    byActor.has(n) ||
    byPlayer.has(n) ||
    (!except.has(n) && (only.size === 0 || only.has(n)))
  );
};

/** Per function that needs a side: the name the side goes by in it. */
const needs = new Map<FnLike, string>();
const queue: FnLike[] = [];

function usesName(f: FnLike, name: string): boolean {
  let found = false;
  const visit = (n: ts.Node): void => {
    if (found) return;
    if (ts.isIdentifier(n) && n.text === name) {
      found = true;
      return;
    }
    ts.forEachChild(n, visit);
  };
  visit(f);
  return found;
}

/** The name of the side in `f`: its own side parameter, or a fresh `s` (or `side`...) when it has none yet; null at a barrier. */
function sideName(f: FnLike): string {
  const n = fnName(f);
  const actor = byActor.get(n);
  if (actor) return `${actor}.side!`;
  if (byPlayer.has(n)) return `${f.parameters[worldParamIndex(f)].name.getText()}.player.side!`;
  const have = sideParamOf(f);
  if (have) return have.name.getText();
  const known = needs.get(f);
  if (known) return known;
  const candidates = [preferred, 'side', 'sd', 'sx'];
  const name = candidates.find((c) => !usesName(f, c)) ?? 'side0';
  needs.set(f, name);
  if (!barriers.has(fnName(f))) queue.push(f);
  return name;
}

// Step 1: the reads the compiler reports.
const readSites: { id: ts.Identifier; fn: FnLike; field: string }[] = [];
for (const d of diags) {
  if ((d.code !== 2339 && d.code !== 2551) || !d.file || d.start === undefined) continue;
  if (!isSim(d.file.fileName)) continue;
  const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
  const m = /^Property '(\w+)' does not exist on type '(World|WorldOpts)'/.exec(msg);
  if (!m) continue;
  const [, field, on] = m;
  if (on === 'World' ? !fields.has(field) : !SIDE_OPTS.includes(field)) continue;
  let hit: ts.PropertyAccessExpression | undefined;
  const visit = (n: ts.Node): void => {
    if (hit || d.start! < n.getFullStart() || d.start! >= n.getEnd()) return;
    if (ts.isPropertyAccessExpression(n) && n.name.getStart() === d.start) {
      hit = n;
      return;
    }
    ts.forEachChild(n, visit);
  };
  visit(d.file);
  if (!hit) {
    manual.push(`${rel(d.file.fileName)}: not a plain read: ${msg}`);
    continue;
  }
  // `w.field`, or `w.opts.field` for the options that moved.
  let root: ts.Expression = hit.expression;
  if (on === 'WorldOpts') {
    if (ts.isPropertyAccessExpression(root) && root.name.text === 'opts') root = root.expression;
    else {
      manual.push(`${where(hit)}: options not read as <world>.opts.${field}`);
      continue;
    }
  }
  if (!ts.isIdentifier(root)) {
    manual.push(`${where(hit)}: the world is not a plain name (${root.getText()})`);
    continue;
  }
  const p = paramOf(root, 'World');
  if (!p || !isFnLike(p.parent)) {
    manual.push(`${where(hit)}: ${root.getText()} is not a parameter of type World`);
    continue;
  }
  const fn = p.parent;
  if (skip.has(fnName(fn))) continue;
  if (!allowed(fn)) {
    blocked.push(`${where(hit)}: ${fnName(fn)} would need a side (reads ${field})`);
    continue;
  }
  readSites.push({ id: root, fn, field });
}

for (const r of readSites) {
  const name = sideName(r.fn);
  edits.push({
    file: r.id.getSourceFile().fileName,
    pos: r.id.getStart(),
    end: r.id.getEnd(),
    text: name,
  });
}

// Step 2: an index of the calls, by what they call.
const calls = new Map<ts.Symbol, ts.CallExpression[]>();
const refs = new Map<ts.Symbol, ts.Identifier[]>();
const resolve = (id: ts.Node): ts.Symbol | undefined => {
  let s = checker.getSymbolAtLocation(id);
  if (s && s.flags & ts.SymbolFlags.Alias) s = checker.getAliasedSymbol(s);
  return s;
};
for (const sf of program.getSourceFiles()) {
  if (sf.isDeclarationFile || sf.fileName.includes('node_modules')) continue;
  const visit = (n: ts.Node): void => {
    if (ts.isCallExpression(n)) {
      const e = n.expression;
      const id = ts.isIdentifier(e) ? e : ts.isPropertyAccessExpression(e) ? e.name : undefined;
      const s = id && resolve(id);
      if (s) calls.set(s, [...(calls.get(s) ?? []), n]);
    }
    if (ts.isIdentifier(n)) {
      const p = n.parent;
      const isCallee =
        (ts.isCallExpression(p) && p.expression === n) ||
        (ts.isPropertyAccessExpression(p) &&
          p.name === n &&
          ts.isCallExpression(p.parent) &&
          p.parent.expression === p);
      const isDecl =
        ts.isImportSpecifier(p) ||
        ts.isExportSpecifier(p) ||
        ((ts.isFunctionDeclaration(p) || ts.isVariableDeclaration(p)) && p.name === n);
      if (!isCallee && !isDecl) {
        const s = resolve(n);
        if (s) refs.set(s, [...(refs.get(s) ?? []), n]);
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}

function symbolOfFn(f: FnLike): ts.Symbol | undefined {
  if ((ts.isFunctionDeclaration(f) || ts.isMethodDeclaration(f)) && f.name) return resolve(f.name);
  const p = f.parent;
  if (ts.isVariableDeclaration(p)) return resolve(p.name);
  if (ts.isPropertyAssignment(p)) return resolve(p.name);
  return undefined;
}

// Step 3: each function that gained a side takes the parameter, and its callers pass theirs.
const done = new Set<FnLike>();
const importFiles = new Set<string>();
while (queue.length) {
  const f = queue.shift()!;
  if (done.has(f)) continue;
  done.add(f);
  const name = needs.get(f)!;
  const wi = worldParamIndex(f);
  if (wi < 0) {
    manual.push(`${where(f)}: ${fnName(f)} has no World parameter`);
    continue;
  }
  const wp = f.parameters[wi];
  if (!wp.type) {
    manual.push(
      `${where(f)}: ${fnName(f)}: the world's type is inferred, add the parameter by hand`,
    );
    continue;
  }
  if (!sideParamOf(f)) {
    edits.push({
      file: f.getSourceFile().fileName,
      pos: wp.getEnd(),
      end: wp.getEnd(),
      text: `, ${name}: Side`,
    });
    importFiles.add(f.getSourceFile().fileName);
  }
  const sym = symbolOfFn(f);
  if (!sym) {
    manual.push(`${where(f)}: ${fnName(f)} cannot be followed to its callers`);
    continue;
  }
  for (const r of refs.get(sym) ?? [])
    manual.push(`${where(r)}: ${fnName(f)} is used as a value, not called`);
  for (const c of calls.get(sym) ?? []) {
    const a = c.arguments[wi];
    if (!a) {
      manual.push(`${where(c)}: call of ${fnName(f)} without its world`);
      continue;
    }
    const file = c.getSourceFile().fileName;
    let side: string;
    if (!isSim(file)) {
      side = `${a.getText()}.sides[0]`;
    } else if (ts.isIdentifier(a) && paramOf(a, 'World')) {
      const owner = paramOf(a, 'World')!.parent;
      if (!isFnLike(owner)) {
        manual.push(`${where(c)}: world parameter of a function type`);
        continue;
      }
      if (!allowed(owner)) {
        blocked.push(`${where(c)}: ${fnName(owner)} calls ${fnName(f)}, which now takes a side`);
        continue;
      }
      side = sideName(owner);
    } else {
      manual.push(
        `${where(c)}: call of ${fnName(f)} with ${a.getText()}, which is not a world parameter`,
      );
      continue;
    }
    // A call that already passes a side as the next argument is done.
    const next = c.arguments[wi + 1];
    if (next && next.getText() === side && sideParamOf(f)) continue;
    edits.push({ file, pos: a.getEnd(), end: a.getEnd(), text: `, ${side}` });
  }
}

// Report.
const byFile = new Map<string, Edit[]>();
for (const e of edits) byFile.set(e.file, [...(byFile.get(e.file) ?? []), e]);
console.log(
  `${apply ? 'applying' : 'would apply'} ${edits.length} edits in ${byFile.size} files; ${needs.size} functions take a side`,
);
for (const [f, name] of [...needs].sort((a, b) => where(a[0]).localeCompare(where(b[0]))))
  console.log(
    `  ${where(f)} ${fnName(f)}(${f.parameters.map((p) => p.getText()).join(', ')}) -> ${name}${barriers.has(fnName(f)) ? '  [barrier: by hand]' : ''}`,
  );
if (blocked.length) {
  console.log(`\n${blocked.length} blocked (not in --only):`);
  for (const m of [...new Set(blocked)]) console.log('  ' + m);
}
if (manual.length) {
  console.log(`\n${manual.length} to do by hand:`);
  for (const m of [...new Set(manual)]) console.log('  ' + m);
}
if (apply) {
  for (const [file, list] of byFile) {
    let text = readFileSync(file, 'utf8');
    // Inserts at the same position keep the order they were made in; edits are applied from the end.
    const ordered = list
      .map((e, i) => ({ e, i }))
      .sort((a, b) => b.e.pos - a.e.pos || b.i - a.i)
      .map((x) => x.e);
    const seen = new Set<string>();
    for (const e of ordered) {
      const key = `${e.pos}:${e.end}:${e.text}`;
      if (seen.has(key)) continue;
      seen.add(key);
      text = text.slice(0, e.pos) + e.text + text.slice(e.end);
    }
    if (importFiles.has(file) && !/\bSide\b[^;]*from '[^']*\/side'/.test(text)) {
      const dir = path.dirname(file);
      let r = path.relative(dir, path.join(root, 'src/sim/side')).replace(/\\/g, '/');
      if (!r.startsWith('.')) r = './' + r;
      const imports = [...text.matchAll(/^import [^;]*;[ \t]*$/gm)];
      const last = imports[imports.length - 1];
      const at = last ? last.index! + last[0].length : 0;
      text = text.slice(0, at) + `\nimport type { Side } from '${r}';` + text.slice(at);
    }
    writeFileSync(file, text);
  }
}
