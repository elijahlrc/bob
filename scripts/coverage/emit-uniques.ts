/**
 * Turns the reviewed decisions in docs/coverage/uniques/*.json into src/data/uniquesGen.ts and the matching lines of
 * docs/coverage/map.json. The mods come from the translator (modDict.ts); a decision supplies what a human decides: our
 * name and flavour, which lines to drop and why, extra hand-written mods, and the defining-mechanic note.
 *
 *   npm run coverage:emit
 *
 * A line the translator cannot map and the decision does not drop stops the emit: nothing is dropped silently.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { format, resolveConfig } from 'prettier';
import { ITEM_BASES } from '../../src/data/bases';
import { bobBaseFor } from './bobBase';
import { CONDITIONS } from '../../src/mods/types';
import { STAT_TEXT } from '../../src/data/statText';
import { UNIQUES } from '../../src/data/uniques';
import { GENERATED_UNIQUES } from '../../src/data/uniquesGen';
import { COVERAGE_DIR, key, loadPobNames, loadReference } from './reference';
import { ctxFor, currentLines, loadPobUniques, translateLine, type ModT } from './translate';

export type Decision = {
  /** The reference unique this is an analog of. */
  ref: string;
  /** Our own name and flavour line. */
  name: string;
  flavour: string;
  id?: string;
  /** A Bob base id, when the automatic pick is wrong. */
  base?: string;
  /** What the unique does and why it counts (map.json note). */
  note: string;
  status?: 'covered' | 'partial';
  /** Lines to leave out (a substring of the reference line each), with the reason in `note`. */
  drop?: string[];
  /** Hand-written mods added to the translated ones. */
  mods?: ModT[];
  /** Hand-written trigger definitions (TriggerDef literals). */
  triggers?: unknown[];
  level?: number;
  sockets?: number;
  factions?: string[];
};

export const DECISIONS_DIR = resolve(COVERAGE_DIR, 'uniques');
export const OUT = resolve(COVERAGE_DIR, '../../src/data/uniquesGen.ts');

export function loadDecisions(): Decision[] {
  const out: Decision[] = [];
  for (const f of readdirSync(DECISIONS_DIR)
    .filter((x) => x.endsWith('.json'))
    .sort())
    out.push(...(JSON.parse(readFileSync(resolve(DECISIONS_DIR, f), 'utf8')) as Decision[]));
  return out;
}

const camel = (s: string) =>
  s
    .replace(/[^A-Za-z0-9 ]/g, '')
    .split(' ')
    .filter(Boolean)
    .map((w, i) =>
      i === 0 ? w.charAt(0).toLowerCase() + w.slice(1) : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join('');

const q = (s: string) => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const lit = (v: unknown): string => JSON.stringify(v);

function modSource(m: ModT): string {
  const extra: string[] = [];
  if (m.damageTypes) extra.push(`damageTypes: ${lit(m.damageTypes)}`);
  if (m.tags) extra.push(`tags: ${lit(m.tags)}`);
  if (m.local) extra.push('local: true');
  if (m.condition) extra.push(`condition: ${lit(m.condition)}`);
  if (m.per) extra.push(`per: ${lit(m.per)}`);
  const head = `m('${m.stat}', '${m.kind}', ${m.min}`;
  if (!extra.length) return m.max !== m.min ? `${head}, ${m.max})` : `${head})`;
  return `${head}, ${m.max}, { ${extra.join(', ')} })`;
}

export type Built = {
  id: string;
  source: string;
  entry: { ref: string; status: 'covered' | 'partial'; note: string };
};

export function build(d: Decision): Built {
  const pob = loadPobUniques().find((u) => key(u.name) === key(d.ref));
  if (!pob) throw new Error(`decision "${d.name}": no reference unique "${d.ref}" in the 3.9 data`);
  const ref = loadReference().uniques.find((u) => key(u.name) === key(d.ref));
  const baseId = d.base ?? bobBaseFor(pob.base, ref?.class ?? '');
  if (!baseId) throw new Error(`decision "${d.name}": no Bob base for "${pob.base}"`);
  const ctx = ctxFor(pob.base, pob.slot);
  const mods: ModT[] = [];
  let sockets = d.sockets;
  const open: string[] = [];
  for (const line of currentLines(pob)) {
    if (d.drop?.some((s) => line.includes(s))) continue;
    const r = translateLine(line, ctx);
    if (r.kind === 'mods') {
      mods.push(...r.mods);
      if (r.sockets !== undefined && sockets === undefined) sockets = r.sockets;
    } else if (r.kind === 'unmapped') open.push(line);
  }
  if (open.length)
    throw new Error(
      `decision "${d.name}" (${d.ref}): lines neither mapped nor dropped:\n  ${open.join('\n  ')}`,
    );
  mods.push(...(d.mods ?? []));
  const id = d.id ?? camel(d.name);
  const baseLevel = ITEM_BASES.find((b) => b.id === baseId)?.level ?? 1;
  const level = Math.max(baseLevel, d.level ?? pob.levelReq ?? ref?.level ?? 1);
  const parts = [
    `    id: ${q(id)},`,
    `    name: ${q(d.name)},`,
    `    baseId: ${q(baseId)},`,
    `    level: ${level},`,
  ];
  if (sockets !== undefined) parts.push(`    sockets: ${sockets},`);
  parts.push(
    `    mods: [${mods.map((x) => '\n      ' + modSource(x) + ',').join('')}${mods.length ? '\n    ' : ''}],`,
  );
  if (d.triggers?.length) parts.push(`    triggers: ${lit(d.triggers)},`);
  if (d.factions?.length) parts.push(`    factions: ${lit(d.factions)},`);
  parts.push(`    flavour: ${q(d.flavour)},`);
  return {
    id,
    source: `  {\n${parts.join('\n')}\n  },`,
    entry: { ref: ref?.name ?? d.ref, status: d.status ?? 'covered', note: d.note },
  };
}

/** The whole generated file for these decisions, and what map.json says about them. */
export async function render(decisions: Decision[]): Promise<{ text: string; built: Built[] }> {
  const built = decisions.map(build);
  const ids = new Set<string>();
  for (const b of built) {
    if (ids.has(b.id)) throw new Error('duplicate unique id ' + b.id);
    ids.add(b.id);
  }
  const raw = HEADER + built.map((b) => b.source).join('\n') + '\n];\n';
  // The file is committed formatted, so it is generated formatted.
  const text = await format(raw, { ...(await resolveConfig(OUT)), filepath: OUT });
  return { text, built };
}

const HEADER = `import type { UniqueDef, UniqueMod } from './uniques';

/**
 * Uniques of the coverage plan (C3 onward). Generated by scripts/coverage/emit-uniques.ts from the decisions in
 * docs/coverage/uniques/*.json: edit those, not this file. Every name and flavour line is ours.
 */
const m = (
  stat: string,
  kind: UniqueMod['kind'],
  min: number,
  max = min,
  extra: Partial<UniqueMod> = {},
): UniqueMod => ({ stat, kind, min, max, ...extra });

export const GENERATED_UNIQUES: UniqueDef[] = [
`;

/**
 * Dry run of one decisions file (what an author runs before handing it over): every decision builds, every stat and
 * condition it uses exists, and its name and id are free and not a reference name. Prints the problems; exit code 1
 * if there are any. Nothing is written.
 */
function check(file: string): void {
  const path = resolve(file);
  const mine = JSON.parse(readFileSync(path, 'utf8')) as Decision[];
  const here = path.split(String.fromCharCode(92)).join('/');
  const others: Decision[] = [];
  for (const f of readdirSync(DECISIONS_DIR).filter((x) => x.endsWith('.json'))) {
    const p = resolve(DECISIONS_DIR, f).split(String.fromCharCode(92)).join('/');
    if (p !== here) others.push(...(JSON.parse(readFileSync(p, 'utf8')) as Decision[]));
  }
  const generated = new Set(GENERATED_UNIQUES.map((u) => u.id));
  const taken = new Set<string>();
  for (const u of UNIQUES) if (!generated.has(u.id)) taken.add(key(u.name));
  for (const d of others) taken.add(key(d.name));
  const refNames = new Set<string>();
  for (const n of loadPobNames().uniques) refNames.add(key(n));
  for (const n of loadPobNames().gems) refNames.add(key(n));
  for (const r of loadReference().uniques) refNames.add(key(r.name));
  for (const r of loadReference().gems) refNames.add(key(r.name));
  const ids = new Set<string>(UNIQUES.filter((u) => !generated.has(u.id)).map((u) => u.id));
  for (const d of others) ids.add(d.id ?? camel(d.name));
  const seenRefs = new Set(others.map((d) => key(d.ref)));
  const problems: string[] = [];
  const mineNames = new Set<string>();
  for (const d of mine) {
    const bad = (msg: string) => problems.push(`${d.ref} / ${d.name}: ${msg}`);
    if (!d.name || !d.flavour || !d.note) bad('name, flavour and note are all required');
    if (refNames.has(key(d.name))) bad('the name is a reference name');
    if (taken.has(key(d.name)) || mineNames.has(key(d.name))) bad('the name is already used');
    mineNames.add(key(d.name));
    const id = d.id ?? camel(d.name);
    if (ids.has(id)) bad(`the id ${id} is already used`);
    ids.add(id);
    if (seenRefs.has(key(d.ref))) bad('the reference unique already has a decision');
    seenRefs.add(key(d.ref));
    for (const m of d.mods ?? []) {
      if (
        !STAT_TEXT[m.stat] &&
        !['damage', 'damage.min', 'damage.max'].includes(m.stat) &&
        !/^(convertSkill|gain|convert)[.]/.test(m.stat)
      )
        bad(`unknown stat ${m.stat}`);
      if (m.min > m.max && m.min >= 0) bad(`mod ${m.stat}: min ${m.min} is above max ${m.max}`);
      if (m.condition && !(CONDITIONS as readonly string[]).includes(m.condition.id))
        bad(`unknown condition ${m.condition.id}`);
    }
    try {
      build(d);
    } catch (e) {
      bad((e as Error).message);
    }
  }
  console.log(`checked ${mine.length} decisions: ${problems.length} problems`);
  for (const p of problems) console.log('  ' + p);
  if (problems.length) process.exitCode = 1;
}

async function main(): Promise<void> {
  if (process.argv[2] === '--check') return check(process.argv[3]);
  const { text, built } = await render(loadDecisions());
  writeFileSync(OUT, text);
  const mapPath = resolve(COVERAGE_DIR, 'map.json');
  const map = JSON.parse(readFileSync(mapPath, 'utf8')) as {
    gems: Record<string, unknown>;
    uniques: Record<string, unknown>;
  };
  for (const b of built) map.uniques[b.id] = b.entry;
  writeFileSync(mapPath, JSON.stringify(map, null, 1) + '\n');
  console.log('emitted ' + built.length + ' uniques to ' + OUT);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) void main();
