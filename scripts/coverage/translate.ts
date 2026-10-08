/**
 * Translator from 3.9-era unique item lines to Bob mods (COVERAGE C3). The rules live in modDict.ts (phrases of the
 * reference game are allowed in scripts/). A line is parsed in four steps:
 *
 *   1. markers like {variant:2} are dropped, and every number becomes `#` with its [min, max] kept;
 *   2. clauses at the end of the line ("while on Low Life", "per Frenzy Charge", "with Bows") are peeled off, each
 *      adding a condition, a per-stat scaling or tags to whatever the core line becomes;
 *   3. the core line is matched against the rules, which build mods in Bob's own stat vocabulary;
 *   4. lines no rule knows come back as UNMAPPED, for a human to decide.
 *
 *   npm run coverage:translate -- --unmapped 40        the most common lines no rule maps yet
 *   npm run coverage:translate -- "Reference Name"     the draft of one unique
 */
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { UniqueMod } from '../../src/data/uniques';
import type { CondId, DamageType, SkillTag } from '../../src/mods/types';
import { CLAUSES, IGNORED, RULES } from './modDict';
import { LATE_IGNORED } from './treeRules';
import { pobBase } from './bobBase';
import { COVERAGE_DIR, key, loadReference } from './reference';

export type Num = [number, number];

/** What a rule knows about the item the line is on. */
export type LineCtx = {
  /** The item is a weapon: damage, speed, crit and accuracy lines are local to it. */
  weapon: boolean;
  /** Armour pieces and shields: defence lines are local to the item. */
  armourPiece: boolean;
  /** The item class in Bob's terms ("sword", "body", "ring", ...). */
  slot: string;
  twoHanded: boolean;
};

export type ModT = Omit<UniqueMod, 'condition' | 'per'> & {
  condition?: { id: CondId; not?: boolean };
  per?: { stat: string; div: number };
};

export type Rule = {
  re: RegExp;
  make: (m: RegExpMatchArray, n: Num[], c: LineCtx) => ModT[];
};

/** A clause peeled off the end of a line: it changes every mod the core line produces. */
export type Clause = {
  re: RegExp;
  apply: (m: RegExpMatchArray, mod: ModT, n: Num[]) => ModT;
};

export type Translated =
  | { kind: 'mods'; mods: ModT[]; sockets?: number }
  | { kind: 'ignored' }
  | { kind: 'unmapped'; core: string };

const NUMBER = /([+\-−])?\(([+\-−]?\d+(?:\.\d+)?)[–-](\d+(?:\.\d+)?)\)|([+\-−]?\d+(?:\.\d+)?)/g;

const asNumber = (s: string) => Number(s.replace('−', '-'));

/** Strip markers, replace numbers by `#`; a sign belongs to its number, so "+10" and "+(5-10)" both leave a bare #. */
export function parseNumbers(line: string): { text: string; nums: Num[] } {
  const cleaned = line.replace(/\{[^}]*\}/g, '').trim();
  const nums: Num[] = [];
  const text = cleaned
    .replace(NUMBER, (_tok, sign?: string, lo?: string, hi?: string, plain?: string) => {
      if (lo !== undefined && hi !== undefined) {
        const k = sign === '-' || sign === '−' ? -1 : 1;
        nums.push([k * asNumber(lo), k * asNumber(hi)]);
      } else nums.push([asNumber(plain as string), asNumber(plain as string)]);
      return '#';
    })
    .replace(/\s+/g, ' ')
    .trim();
  return { text: text.replace(/#%/g, '#'), nums };
}

/** Mods carry their numbers: build one from a stat and the first unused number. */
export const DMG_TYPES: Record<string, DamageType[]> = {
  Physical: ['physical'],
  Fire: ['fire'],
  Cold: ['cold'],
  Lightning: ['lightning'],
  Chaos: ['chaos'],
  Elemental: ['fire', 'cold', 'lightning'],
};

export function translateLine(line: string, ctx: LineCtx): Translated {
  const { text, nums } = parseNumbers(line);
  if (!text) return { kind: 'ignored' };
  for (const re of IGNORED) if (re.test(text)) return { kind: 'ignored' };
  const sockets = text.match(/^Has # (?:Abyssal )?Sockets?$/);
  if (sockets) return { kind: 'mods', mods: [], sockets: nums[0][0] };
  if (/^Has no Sockets$/.test(text)) return { kind: 'mods', mods: [], sockets: 0 };
  // Peel clauses off the end.
  let core = text;
  const applied: { clause: Clause; m: RegExpMatchArray }[] = [];
  for (let guard = 0; guard < 4; guard++) {
    let hit = false;
    for (const clause of CLAUSES) {
      const m = core.match(clause.re);
      if (!m) continue;
      applied.push({ clause, m });
      core = core.slice(0, core.length - m[0].length).trim();
      hit = true;
      break;
    }
    if (!hit) break;
  }
  // The numbers of the clauses come last in the line: the core takes the first ones.
  const clauseNums = applied.reduce((s, a) => s + (a.m[0].match(/#/g)?.length ?? 0), 0);
  const coreNums = nums.slice(0, nums.length - clauseNums);
  const extraNums = nums.slice(nums.length - clauseNums);
  for (const rule of RULES) {
    const m = core.match(rule.re);
    if (!m) continue;
    let mods = rule.make(m, coreNums, ctx);
    let ni = 0;
    for (const { clause, m: cm } of applied.reverse()) {
      const need = cm[0].match(/#/g)?.length ?? 0;
      const cn = extraNums.slice(ni, ni + need);
      ni += need;
      mods = mods.map((x) => clause.apply(cm, x, cn));
    }
    return { kind: 'mods', mods };
  }
  for (const re of LATE_IGNORED) if (re.test(text)) return { kind: 'ignored' };
  return { kind: 'unmapped', core: text };
}

// ---------------------------------------------------------------------------------------------------------------

export type PobUnique = {
  name: string;
  base: string;
  slot: string;
  variants: string[];
  levelReq?: number;
  req: string;
  lines: string[];
  implicits: number;
};

let pobCache: PobUnique[] | null = null;

/**
 * The 3.9-era unique data: Path of Building's, plus (for the reference uniques it does not have) the wiki's current text,
 * its implicit lines first. Those carry no variants and are marked by an empty `req`.
 */
export function loadPobUniques(): PobUnique[] {
  if (pobCache) return pobCache;
  const pob = (
    JSON.parse(readFileSync(resolve(COVERAGE_DIR, 'pob-uniques.json'), 'utf8')) as {
      uniques: PobUnique[];
    }
  ).uniques;
  const have = new Set(pob.map((u) => key(u.name)));
  const extra: PobUnique[] = [];
  for (const r of loadReference().uniques) {
    if (have.has(key(r.name)) || /flask$/i.test(r.class)) continue;
    const split = (t: string) =>
      t
        .split(String.fromCharCode(10))
        .map((x) => x.trim())
        .filter(Boolean);
    const imp = split(r.implicit ?? '');
    extra.push({
      name: r.name,
      base: r.base,
      slot: r.class,
      variants: [],
      levelReq: r.level,
      req: '',
      lines: [...imp, ...split(r.explicit ?? '')],
      implicits: imp.length,
    });
  }
  return (pobCache = [...pob, ...extra]);
}

/**
 * The lines of the *current* variant: a line tagged with variants is kept if the last variant is among them. A first
 * line that is only the base item's own implicit is dropped (Bob's bases carry theirs).
 */
export function currentLines(u: PobUnique): string[] {
  const last = u.variants.length;
  const lines = u.lines.filter((l) => {
    const m = l.match(/\{variant:([\d,]+)\}/);
    if (!m) return true;
    return m[1].split(',').map(Number).includes(last);
  });
  const imp = pobBase(u.base)?.implicit;
  if (imp && u.implicits === 0 && lines.length > 0) {
    const same = (x: string) => parseNumbers(x).text.replace(/[–-]/g, '-');
    if (same(lines[0]) === same(imp)) lines.shift();
  }
  return lines;
}

export function ctxFor(base: string, slot: string): LineCtx {
  const weapon = /sword|axe|mace|sceptre|dagger|claw|wand|staff|bow/i.test(slot);
  return {
    weapon,
    armourPiece: /body|helmet|gloves|boots|shield/i.test(slot),
    slot,
    twoHanded: /Two Handed|Staff|Bow/i.test(base),
  };
}

// ---------------------------------------------------------------------------------------------------------------

function main(): void {
  const args = process.argv.slice(2);
  const pob = loadPobUniques();
  const ref = loadReference();
  const inScope = new Set(ref.uniques.map((u) => key(u.name)));
  const unique = pob.filter((u) => inScope.has(key(u.name)));
  if (args[0] === '--unmapped') {
    const n = Number(args[1] ?? 40);
    const freq = new Map<string, number>();
    let lines = 0;
    let mapped = 0;
    let ignored = 0;
    for (const u of unique)
      for (const line of currentLines(u)) {
        lines++;
        const r = translateLine(line, ctxFor(u.base, u.slot));
        if (r.kind === 'unmapped') freq.set(r.core, (freq.get(r.core) ?? 0) + 1);
        else if (r.kind === 'ignored') ignored++;
        else mapped++;
      }
    console.log(
      `lines ${lines}: mapped ${mapped}, ignored ${ignored}, unmapped ${lines - mapped - ignored}`,
    );
    const rows = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
    console.log(rows.map(([k, v]) => `${v}\t${k}`).join('\n'));
    return;
  }
  if (args[0] === '--summary') {
    // How many uniques have how many unmapped lines, and what implementing the common mechanics would buy.
    const per = unique.map((u) => ({
      name: u.name,
      cores: currentLines(u)
        .map((l) => translateLine(l, ctxFor(u.base, u.slot)))
        .flatMap((r) => (r.kind === 'unmapped' ? [r.core] : [])),
    }));
    const hist = new Map<number, number>();
    for (const p of per) hist.set(p.cores.length, (hist.get(p.cores.length) ?? 0) + 1);
    console.log(
      'uniques by number of unmapped lines:',
      [...hist.entries()]
        .sort((x, y) => x[0] - y[0])
        .map(([k, v]) => k + ':' + v)
        .join('  '),
    );
    const freq = new Map<string, number>();
    for (const p of per) for (const c of new Set(p.cores)) freq.set(c, (freq.get(c) ?? 0) + 1);
    for (const min of [10, 5, 3, 2]) {
      const known = new Set([...freq.entries()].filter(([, v]) => v >= min).map(([k]) => k));
      const ok = per.filter((p) => p.cores.every((c) => known.has(c))).length;
      const one = per.filter((p) => p.cores.filter((c) => !known.has(c)).length <= 1).length;
      console.log(
        'with every line used by at least ' +
          min +
          ' uniques mapped: ' +
          ok +
          ' uniques fully mapped, ' +
          one +
          ' with at most one open line',
      );
    }
    return;
  }
  if (args[0] === '--cheap') {
    // The open lines of the undecided uniques that have at most N of them: the cheapest mechanics to add.
    const maxOpen = Number(args[1] ?? 2);
    const decided = new Set<string>();
    for (const f of readdirSync(resolve(COVERAGE_DIR, 'uniques')).filter((x) =>
      x.endsWith('.json'),
    ))
      for (const d of JSON.parse(readFileSync(resolve(COVERAGE_DIR, 'uniques', f), 'utf8')) as {
        ref: string;
      }[])
        decided.add(key(d.ref));
    const map = JSON.parse(readFileSync(resolve(COVERAGE_DIR, 'map.json'), 'utf8')) as {
      uniques: Record<string, { ref: string; status: string }>;
    };
    for (const e of Object.values(map.uniques))
      if (e.ref && e.status !== 'excluded') decided.add(key(e.ref));
    const freq = new Map<string, number>();
    let count = 0;
    for (const u of unique) {
      if (decided.has(key(u.name))) continue;
      const open = currentLines(u).flatMap((l) => {
        const r = translateLine(l, ctxFor(u.base, u.slot));
        return r.kind === 'unmapped' ? [r.core] : [];
      });
      if (open.length > maxOpen) continue;
      count++;
      for (const c of new Set(open)) freq.set(c, (freq.get(c) ?? 0) + 1);
    }
    console.log('undecided uniques with at most ' + maxOpen + ' open lines: ' + count);
    const top = [...freq.entries()].sort((x, y) => y[1] - x[1]).slice(0, Number(args[2] ?? 60));
    console.log(top.map(([k, v]) => `${v}\t${k}`).join('\n'));
    return;
  }
  if (args[0] === '--next') {
    // The next undecided uniques, fewest open lines first: what a batch works through.
    const n = Number(args[1] ?? 25);
    const slot = args[2];
    const decided = new Set<string>();
    try {
      for (const f of readdirSync(resolve(COVERAGE_DIR, 'uniques')).filter((x) =>
        x.endsWith('.json'),
      ))
        for (const d of JSON.parse(readFileSync(resolve(COVERAGE_DIR, 'uniques', f), 'utf8')) as {
          ref: string;
        }[])
          decided.add(key(d.ref));
    } catch {
      /* no decisions yet */
    }
    // Analogs that already exist (map.json) are done.
    const map = JSON.parse(readFileSync(resolve(COVERAGE_DIR, 'map.json'), 'utf8')) as {
      uniques: Record<string, { ref: string; status: string }>;
    };
    for (const e of Object.values(map.uniques))
      if (e.ref && e.status !== 'excluded') decided.add(key(e.ref));
    const rows = unique
      .filter(
        (u) =>
          !decided.has(key(u.name)) && (!slot || new RegExp(slot, 'i').test(u.slot + ' ' + u.base)),
      )
      .map((u) => {
        const results = currentLines(u).map(
          (l) => [l, translateLine(l, ctxFor(u.base, u.slot))] as const,
        );
        return { u, results, open: results.filter(([, r]) => r.kind === 'unmapped').length };
      })
      .sort((x, y) => x.open - y.open || x.u.name.localeCompare(y.u.name))
      .slice(0, n);
    for (const { u, results, open } of rows) {
      console.log(`
## ${u.name} | ${u.base} | ${u.slot} | level ${u.levelReq ?? '?'} | open ${open}`);
      for (const [l, r] of results)
        console.log(
          `  ${r.kind === 'mods' ? 'ok  ' : r.kind === 'ignored' ? 'skip' : '??? '} ${l.replace(/\{[^}]*\}/g, '')}`,
        );
    }
    return;
  }
  const u = unique.find((x) => key(x.name) === key(args.join(' ')));
  if (!u) throw new Error(`no such unique: ${args.join(' ')}`);
  console.log(`${u.name} (${u.base}, ${u.slot})`);
  for (const line of currentLines(u)) {
    const r = translateLine(line, ctxFor(u.base, u.slot));
    console.log(
      r.kind === 'mods'
        ? `  ok   ${line}\n         ${JSON.stringify(r.mods)}${r.sockets !== undefined ? ` sockets ${r.sockets}` : ''}`
        : r.kind === 'ignored'
          ? `  skip ${line}`
          : `  ???  ${line}`,
    );
  }
}

export type { SkillTag };
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
