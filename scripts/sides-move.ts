/**
 * The first step of a group of the extraction (docs/DUEL.md 3.3): the fields of the group move from `World` to `Side`, with
 * their comments, in `src/sim/types.ts` and `src/sim/side.ts`, and their initial values move from the `World` literal to the
 * `Side` literal in `createWorld` (`src/sim/world.ts`). Imports follow. After it the compiler lists every read.
 *
 *   npx tsx scripts/sides-move.ts <group 1-5> [--label "text"]
 */
import { readFileSync, writeFileSync } from 'node:fs';
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

const argv = process.argv.slice(2);
const group = Number(argv[0]);
const fields = GROUPS[group];
if (!fields) throw new Error('usage: sides-move.ts <group 1-5> [--label text]');
const label = argv.includes('--label') ? argv[argv.indexOf('--label') + 1] : `G${group}`;

const TYPES = 'src/sim/types.ts';
const SIDE = 'src/sim/side.ts';
const WORLD = 'src/sim/world.ts';
const parse = (file: string, text: string) =>
  ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);

type Range = { start: number; end: number };
const cut = (text: string, ranges: Range[]) => {
  for (const r of [...ranges].sort((a, b) => b.start - a.start))
    text = text.slice(0, r.start) + text.slice(r.end);
  return text;
};
const namesIn = (n: ts.Node, into = new Set<string>()): Set<string> => {
  if (ts.isIdentifier(n)) into.add(n.text);
  // (forEachChild stops at a callback that returns something: do not return the set from it)
  ts.forEachChild(n, (c) => {
    namesIn(c, into);
  });
  return into;
};
const specText = (e: ts.ImportSpecifier) =>
  e.propertyName ? `${e.propertyName.text} as ${e.name.text}` : e.name.text;
const moduleOf = (s: ts.ImportDeclaration) => (s.moduleSpecifier as ts.StringLiteral).text;

// 1. The property signatures of `World` (types.ts).
let typesText = readFileSync(TYPES, 'utf8');
const types = parse(TYPES, typesText);
let worldType: ts.TypeLiteralNode | undefined;
types.forEachChild((n) => {
  if (ts.isTypeAliasDeclaration(n) && n.name.text === 'World' && ts.isTypeLiteralNode(n.type))
    worldType = n.type;
});
if (!worldType) throw new Error('no World type in types.ts');
const moved = fields.map((f) => {
  const m = (worldType as ts.TypeLiteralNode).members.find(
    (x): x is ts.PropertySignature => ts.isPropertySignature(x) && x.name.getText() === f,
  );
  if (!m) throw new Error(`World has no field ${f}`);
  return {
    name: f,
    node: m,
    text: typesText.slice(m.getFullStart(), m.getEnd()),
    range: { start: m.getFullStart(), end: m.getEnd() },
  };
});

// What they refer to: the imports of types.ts they come from, and the types types.ts declares itself.
const used = new Set<string>();
for (const m of moved) namesIn(m.node, used);
const importOf = new Map<string, { from: string; spec: string }>();
const declaredInTypes = new Set<string>();
for (const s of types.statements) {
  if (ts.isImportDeclaration(s) && s.importClause?.namedBindings) {
    const nb = s.importClause.namedBindings;
    if (ts.isNamedImports(nb))
      for (const e of nb.elements)
        importOf.set(e.name.text, { from: moduleOf(s), spec: specText(e) });
  }
  if (ts.isTypeAliasDeclaration(s) || ts.isInterfaceDeclaration(s))
    declaredInTypes.add(s.name.text);
}

// types.ts without them, and without the imports that nothing uses now.
typesText = cut(
  typesText,
  moved.map((m) => m.range),
);
for (;;) {
  const sf = parse(TYPES, typesText);
  const stillUsed = new Set<string>();
  for (const s of sf.statements) if (!ts.isImportDeclaration(s)) namesIn(s, stillUsed);
  let changed = false;
  for (const s of sf.statements) {
    if (!ts.isImportDeclaration(s) || !s.importClause?.namedBindings) continue;
    const nb = s.importClause.namedBindings;
    if (!ts.isNamedImports(nb)) continue;
    const keep = nb.elements.filter((e) => stillUsed.has(e.name.text));
    if (keep.length === nb.elements.length) continue;
    if (keep.length === 0)
      typesText = cut(typesText, [{ start: s.getFullStart(), end: s.getEnd() }]);
    else {
      const kind = s.importClause.isTypeOnly ? 'type ' : '';
      const repl = `import ${kind}{ ${keep.map(specText).join(', ')} } from '${moduleOf(s)}';`;
      typesText = typesText.slice(0, s.getStart()) + repl + typesText.slice(s.getEnd());
    }
    changed = true;
    break;
  }
  if (!changed) break;
}
writeFileSync(TYPES, typesText);

// 2. side.ts: the members go at the end of `Side`, with the imports they need.
let sideText = readFileSync(SIDE, 'utf8');
{
  const sf = parse(SIDE, sideText);
  let lit: ts.TypeLiteralNode | undefined;
  sf.forEachChild((n) => {
    if (ts.isTypeAliasDeclaration(n) && n.name.text === 'Side' && ts.isTypeLiteralNode(n.type))
      lit = n.type;
  });
  if (!lit) throw new Error('no Side type in side.ts');
  const close = (lit as ts.TypeLiteralNode).getEnd() - 1;
  const block = `\n  // ${label}${moved.map((m) => m.text.replace(/^\n+/, '\n')).join('')}\n`;
  sideText = sideText.slice(0, close).replace(/\s*$/, '') + block + sideText.slice(close);
}
const wanted = new Map<string, string[]>();
for (const name of used) {
  const imp = importOf.get(name);
  if (imp) wanted.set(imp.from, [...(wanted.get(imp.from) ?? []), imp.spec]);
  else if (declaredInTypes.has(name) && name !== 'Side')
    wanted.set('./types', [...(wanted.get('./types') ?? []), name]);
}
for (const [from, specs] of wanted) {
  const sf = parse(SIDE, sideText);
  const have = new Set<string>();
  for (const s of sf.statements)
    if (
      ts.isImportDeclaration(s) &&
      s.importClause?.namedBindings &&
      ts.isNamedImports(s.importClause.namedBindings)
    )
      for (const e of s.importClause.namedBindings.elements) have.add(e.name.text);
  const need = [...new Set(specs)].filter((x) => !have.has(x.split(' as ').pop()!));
  if (!need.length) continue;
  const existing = sf.statements.find(
    (s): s is ts.ImportDeclaration =>
      ts.isImportDeclaration(s) &&
      moduleOf(s) === from &&
      !!s.importClause?.namedBindings &&
      ts.isNamedImports(s.importClause.namedBindings),
  );
  if (existing) {
    const nb = existing.importClause!.namedBindings as ts.NamedImports;
    const all = [...nb.elements.map(specText), ...need].sort();
    const repl = `import type { ${all.join(', ')} } from '${from}';`;
    sideText = sideText.slice(0, existing.getStart()) + repl + sideText.slice(existing.getEnd());
  } else sideText = `import type { ${need.sort().join(', ')} } from '${from}';\n` + sideText;
}
writeFileSync(SIDE, sideText);

// 3. world.ts: the initial values move from the World literal to the Side literal in createWorld.
const worldText = readFileSync(WORLD, 'utf8');
const wsf = parse(WORLD, worldText);
let worldLit: ts.ObjectLiteralExpression | undefined;
let sideLit: ts.ObjectLiteralExpression | undefined;
const find = (n: ts.Node): void => {
  if (ts.isVariableDeclaration(n) && n.initializer && ts.isObjectLiteralExpression(n.initializer)) {
    const t = n.type?.getText();
    if (n.name.getText() === 'w' && t === 'World') worldLit = n.initializer;
    if (n.name.getText() === 'side' && t === 'Side') sideLit = n.initializer;
  }
  ts.forEachChild(n, find);
};
find(wsf);
if (!worldLit || !sideLit) throw new Error('createWorld: no World or Side literal');
const props = fields.map((f) => {
  const p = (worldLit as ts.ObjectLiteralExpression).properties.find(
    (x) => x.name?.getText() === f,
  );
  if (!p) throw new Error(`createWorld: no initial value for ${f}`);
  const comma = worldText[p.getEnd()] === ',' ? 1 : 0;
  return {
    text: worldText.slice(p.getFullStart(), p.getEnd()),
    range: { start: p.getFullStart(), end: p.getEnd() + comma },
  };
});
let newWorld = cut(
  worldText,
  props.map((p) => p.range),
);
// The `side` literal comes before the `w` literal, so its closing brace has not moved.
const closeObj = (sideLit as ts.ObjectLiteralExpression).getEnd() - 1;
const addText = props.map((p) => p.text.replace(/^[\s,]+/, '\n    ') + ',').join('');
newWorld =
  newWorld.slice(0, closeObj).replace(/\s*$/, '') + addText + '\n  ' + newWorld.slice(closeObj);
writeFileSync(WORLD, newWorld);
console.log(`moved ${fields.length} fields (${fields.join(', ')})`);
