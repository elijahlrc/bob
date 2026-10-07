/**
 * Drafts entries in our data format from the reference list and the 3.9-era Path of Building numbers (COVERAGE 7.1).
 * A draft is a starting point for hand review (7.2): the reference name appears in a comment only, the name is a TODO,
 * and every number still has to be rescaled to Bob's 1-100 curve.
 *
 *   npm run coverage:draft -- gem "Heavy Strike" "Faster Attacks Support"
 *   npm run coverage:draft -- unique "Kaom's Heart"
 *
 * Output goes to scripts/coverage/staging/ (git-ignored, outside src) and is echoed to the terminal.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { PobSkill, PobUnique } from './pob-extract';
import { COVERAGE_DIR, key, loadReference } from './reference';

const STAGING = resolve(COVERAGE_DIR, '../../scripts/coverage/staging');

function pob<T>(file: string): T {
  return JSON.parse(readFileSync(resolve(COVERAGE_DIR, file), 'utf8')) as T;
}

const round = (n: number) => Math.round(n * 100) / 100;
const pair = (a: number, b: number) => (a === b ? `${a}` : `[${a}, ${b}]`);

/**
 * Pairs "..._minimum_..." with "..._maximum_..." stats. In 3.9 data these are ratios of a base damage that comes from a
 * per-level table scaled by the skill's damage effectiveness. Bob keeps one such table (`spellBaseDamage`), so a spell
 * is drafted as a `spread` (the lowest and highest roll as a share of their average) plus the effectiveness, and the
 * shared curve does the rest. A `share` other than 1 means the type carries more or less than the skill's average.
 */
function damageRanges(s: PobSkill): string[] {
  const out: string[] = [];
  s.stats.forEach((stat, i) => {
    const m = stat.match(
      /^(?:spell_)?minimum_base_(\w+?)_damage$|^spell_minimum_base_(\w+?)_damage$/,
    );
    if (!m) return;
    const type = m[1] ?? m[2];
    const j = s.stats.indexOf(stat.replace('minimum', 'maximum'));
    if (j < 0) return;
    const lo = s.levels.l20.values[i];
    const hi = s.levels.l20.values[j];
    const avg = (lo + hi) / 2;
    if (avg <= 0) return;
    const share = round(avg) === 1 ? '' : `, share: ${round(avg)}`;
    out.push(`{ type: '${type}', spread: [${round(lo / avg)}, ${round(hi / avg)}]${share} }`);
  });
  return out;
}

const ATTR: Record<string, string> = { strength: 'str', dexterity: 'dex', intelligence: 'int' };

/** The stats that carry a per-level value (the rest are flags or constants). */
function statList(s: PobSkill): string {
  return s.stats
    .map((st, i) =>
      s.levels.first.values[i] === undefined
        ? ''
        : `${st} ${pair(round(s.levels.first.values[i]), round(s.levels.l20.values[i]))}`,
    )
    .filter(Boolean)
    .join('; ');
}

export function draftGem(name: string): string {
  const ref = loadReference();
  const entry = ref.gems.find((g) => key(g.name) === key(name));
  if (!entry) throw new Error(`"${name}" is not in the reference list`);
  const skills = pob<{ skills: PobSkill[] }>('pob-skills.json').skills;
  const s =
    skills.find((x) => key(x.name) === key(name)) ??
    skills.find((x) => key(x.name) === key(name.replace(/ Support$/, '')));
  const head = `  // reference: ${entry.name} (${entry.kind}; wiki tags ${entry.tags.join(', ')}; released ${entry.release || 'at launch'})`;
  if (!s) return `${head}\n  // no 3.9-era data found in pob-skills.json: draft by hand\n`;
  const f = s.levels.first;
  const l = s.levels.l20;
  const lines: string[] = [head];
  if (s.support) {
    lines.push(
      '  {',
      "    kind: 'support',",
      "    id: 'TODO',",
      "    name: 'TODO',",
      `    attr: '${ATTR[entry.attr] ?? (entry.attr || 'TODO')}',`,
      `    // requires skill types: ${s.requireSkillTypes.join(', ') || 'any'}; excludes: ${s.excludeSkillTypes.join(', ') || 'none'}; adds: ${s.addSkillTypes.join(', ') || 'none'}`,
      '    supports: [],',
      `    costMult: ${round((f.manaMultiplier ?? 100) / 100)},`,
      `    // stats at level 1 / 20: ${statList(s)}`,
      '    mods: [],',
      `    description: ${JSON.stringify(s.description)},`,
      '  },',
    );
  } else {
    const attack = s.skillTypes.includes('Attack');
    const ranges = damageRanges(s);
    lines.push(
      '  {',
      "    kind: 'active',",
      "    id: 'TODO',",
      "    name: 'TODO',",
      `    attr: '${ATTR[entry.attr] ?? (entry.attr || 'TODO')}',`,
      `    skillType: '${attack ? 'attack' : 'spell'}',`,
      `    // wiki tags: ${entry.tags.join(', ')}; skill types: ${s.skillTypes.join(', ')}`,
      '    tags: [],',
      "    behaviour: { kind: 'TODO' },",
    );
    if (attack && f.baseMultiplier !== undefined && l.baseMultiplier !== undefined)
      lines.push(
        `    baseMult: ${pair(round(f.baseMultiplier * 100), round(l.baseMultiplier * 100))},`,
      );
    if (!attack && ranges.length) lines.push(`    spellDamage: [${ranges.join(', ')}],`);
    if (!attack && l.damageEffectiveness !== undefined)
      lines.push(`    effectiveness: ${round(l.damageEffectiveness * 100)},`);
    if (s.castTime) lines.push(`    castTime: ${s.castTime},`);
    if (l.critChance !== undefined) lines.push(`    crit: ${l.critChance},`);
    lines.push(
      `    cost: ${pair(f.manaCost ?? f.cost?.Mana ?? 0, l.manaCost ?? l.cost?.Mana ?? 0)},`,
      `    // stats at level 1 / 20: ${statList(s)}`,
      '    mods: [],',
      `    description: ${JSON.stringify(s.description)},`,
      '  },',
    );
  }
  return lines.join('\n') + '\n';
}

export function draftUnique(name: string): string {
  const ref = loadReference();
  const entry = ref.uniques.find((u) => key(u.name) === key(name));
  if (!entry) throw new Error(`"${name}" is not in the reference list`);
  const pu = pob<{ uniques: PobUnique[] }>('pob-uniques.json').uniques.find(
    (u) => key(u.name) === key(name),
  );
  const lines = [
    `  // reference: ${entry.name} (${entry.class}; base ${entry.base}; level ${entry.level}; released ${entry.release || 'at launch'})`,
  ];
  if (!pu) {
    lines.push(
      '  // not in the 3.9-era data: draft from the wiki lines below, which are the current text',
      ...entry.explicit.split('\n').map((l) => `  //   ${l}`),
    );
  } else {
    lines.push(
      `  // 3.9-era lines (variants: ${pu.variants.join(' | ') || 'none'}; ${pu.implicits} implicit):`,
      ...pu.lines.map((l) => `  //   ${l}`),
    );
  }
  lines.push(
    '  {',
    "    id: 'TODO',",
    "    name: 'TODO',",
    "    baseId: 'TODO',",
    `    level: ${pu?.levelReq ?? entry.level},`,
    '    mods: [],',
    "    flavour: 'TODO',",
    '  },',
  );
  return lines.join('\n') + '\n';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [kind, ...names] = process.argv.slice(2);
  if (!['gem', 'unique'].includes(kind) || !names.length)
    throw new Error('usage: coverage:draft -- gem|unique "Name" ...');
  const text = names.map((n) => (kind === 'gem' ? draftGem(n) : draftUnique(n))).join('\n');
  mkdirSync(STAGING, { recursive: true });
  writeFileSync(resolve(STAGING, `${kind}-draft.ts.txt`), text);
  console.log(text);
}
