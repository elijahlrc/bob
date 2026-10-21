/**
 * Extracts the numbers the draft script needs from the reference data (DESIGN §3 rule 2: data may be consulted; no code
 * is copied). Raw files stay outside the repo; the trimmed JSON written here is reference data under reference/coverage/
 * and is never loaded by the game.
 *
 *   npm run coverage:extract -- <path to the unzipped data folder of the reference release>
 *
 * Source: the release named in reference/sources.json (`data`: repository, tag, commit, date, download link), the last
 * one of the reference version. The file layout inside the data folder comes from there too.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { COVERAGE_DIR, loadSources } from './reference';

/** The release the data comes from, as written into the extracted JSON. */
export function refSource(): {
  repo: string;
  tag: string;
  commit: string;
  date: string;
  note: string;
} {
  const { repo, tag, commit, date, note } = loadSources().data;
  return { repo, tag, commit, date, note };
}

export type RefLevel = {
  /** Positional stat values, in the order of the skill's `stats` list (per-level interpolated values at this level). */
  values: number[];
  levelRequirement?: number;
  manaCost?: number;
  manaMultiplier?: number;
  baseMultiplier?: number;
  damageEffectiveness?: number;
  critChance?: number;
  attackSpeedMultiplier?: number;
  duration?: number;
  cooldown?: number;
  cost?: Record<string, number>;
  other?: Record<string, number>;
};

export type RefSkill = {
  id: string;
  name: string;
  support: boolean;
  description: string;
  skillTypes: string[];
  requireSkillTypes: string[];
  excludeSkillTypes: string[];
  addSkillTypes: string[];
  castTime?: number;
  stats: string[];
  constantStats: [string, number][];
  qualityStats: [string, number][];
  /** Level 1 and 20 (or the top level if it is lower), the anchors of COVERAGE open question 5. */
  levels: { count: number; first: RefLevel; l20: RefLevel };
  /** From the data's gem list. */
  gem?: { tags: string[]; reqStr: number; reqDex: number; reqInt: number; id: string };
};

export type RefDataUnique = {
  name: string;
  base: string;
  slot: string;
  variants: string[];
  levelReq?: number;
  req: string;
  source: string;
  league: string;
  implicits: number;
  /** Mod lines exactly as the data has them, including {variant:N} markers. */
  lines: string[];
};

function parseLevel(line: string): RefLevel {
  const body = line.replace(/^\s*\[\d+\] = \{/, '').replace(/\},?\s*$/, '');
  const interp = body.replace(/statInterpolation = \{[^}]*\},?/, '');
  const cost: Record<string, number> = {};
  const costM = interp.match(/cost = \{([^}]*)\}/);
  if (costM) for (const m of costM[1].matchAll(/(\w+) = (-?[\d.]+)/g)) cost[m[1]] = Number(m[2]);
  const rest = interp.replace(/cost = \{[^}]*\},?/, '');
  const firstNamed = rest.search(/\w+ = /);
  const positional = (firstNamed < 0 ? rest : rest.slice(0, firstNamed))
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '')
    .map(Number);
  const named: Record<string, number> = {};
  for (const m of rest.matchAll(/(\w+) = (-?[\d.]+)/g)) named[m[1]] = Number(m[2]);
  const {
    levelRequirement,
    manaCost,
    manaMultiplier,
    baseMultiplier,
    damageEffectiveness,
    critChance,
    attackSpeedMultiplier,
    duration,
    cooldown,
    ...other
  } = named;
  const lv: RefLevel = { values: positional };
  const set = <K extends keyof RefLevel>(k: K, v: RefLevel[K] | undefined) => {
    if (v !== undefined) lv[k] = v;
  };
  set('levelRequirement', levelRequirement);
  set('manaCost', manaCost);
  set('manaMultiplier', manaMultiplier);
  set('baseMultiplier', baseMultiplier);
  set('damageEffectiveness', damageEffectiveness);
  set('critChance', critChance);
  set('attackSpeedMultiplier', attackSpeedMultiplier);
  set('duration', duration);
  set('cooldown', cooldown);
  if (Object.keys(cost).length) lv.cost = cost;
  if (Object.keys(other).length) lv.other = other;
  return lv;
}

function typeList(block: string, field: string): string[] {
  const m = block.match(new RegExp(`\\n\\t${field} = \\{([^}]*)\\}`));
  if (!m) return [];
  return [...m[1].matchAll(/SkillType\.(\w+)/g)].map((x) => x[1]);
}

function pairs(block: string, field: string): [string, number][] {
  const m = block.match(new RegExp(`\\n\\t${field} = \\{\\n([\\s\\S]*?)\\n\\t\\},`));
  if (!m) return [];
  return [...m[1].matchAll(/\{ "([^"]+)", (-?[\d.]+) \}/g)].map((x) => [x[1], Number(x[2])]);
}

export function parseSkills(text: string): RefSkill[] {
  const out: RefSkill[] = [];
  const parts = text.split(/\nskills\["/).slice(1);
  for (const part of parts) {
    const id = part.slice(0, part.indexOf('"'));
    const block = part;
    const name = block.match(/\n\tname = "([^"]*)"/)?.[1] ?? id;
    const stats = (block.match(/\n\tstats = \{\n([\s\S]*?)\n\t\},/)?.[1] ?? '')
      .split('\n')
      .map((l) => l.match(/"([^"]+)"/)?.[1])
      .filter((s): s is string => !!s);
    const levelLines = [...block.matchAll(/^\t\t\[(\d+)\] = \{.*$/gm)];
    if (!levelLines.length) continue;
    const byN = new Map(levelLines.map((m) => [Number(m[1]), m[0]]));
    const keys = [...byN.keys()];
    const top = Math.max(...keys);
    const lo = Math.min(...keys);
    const at20 = Math.max(...keys.filter((k) => k <= 20), lo);
    out.push({
      id,
      name,
      support: /\n\tsupport = true/.test(block),
      description: block.match(/\n\tdescription = "([^"]*)"/)?.[1] ?? '',
      skillTypes: typeList(block, 'skillTypes'),
      requireSkillTypes: typeList(block, 'requireSkillTypes'),
      excludeSkillTypes: typeList(block, 'excludeSkillTypes'),
      addSkillTypes: typeList(block, 'addSkillTypes'),
      castTime: Number(block.match(/\n\tcastTime = ([\d.]+)/)?.[1]) || undefined,
      stats,
      constantStats: pairs(block, 'constantStats'),
      qualityStats: pairs(block, 'qualityStats'),
      levels: { count: top, first: parseLevel(byN.get(lo)!), l20: parseLevel(byN.get(at20)!) },
    });
  }
  return out;
}

export function parseGems(
  text: string,
): Map<string, NonNullable<RefSkill['gem']> & { name: string }> {
  const out = new Map<string, NonNullable<RefSkill['gem']> & { name: string }>();
  for (const part of text.split(/\n\t\["Metadata\/Items\/Gems\//).slice(1)) {
    const name = part.match(/\n\t\tname = "([^"]*)"/)?.[1];
    const granted = part.match(/grantedEffectId = "([^"]*)"/)?.[1];
    if (!name || !granted) continue;
    const tagString = part.match(/tagString = "([^"]*)"/)?.[1] ?? '';
    out.set(granted, {
      name,
      id: part.slice(0, part.indexOf('"')),
      tags: tagString
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      reqStr: Number(part.match(/reqStr = (\d+)/)?.[1] ?? 0),
      reqDex: Number(part.match(/reqDex = (\d+)/)?.[1] ?? 0),
      reqInt: Number(part.match(/reqInt = (\d+)/)?.[1] ?? 0),
    });
  }
  return out;
}

export function parseUniques(text: string, slot: string): RefDataUnique[] {
  const out: RefDataUnique[] = [];
  for (const m of text.matchAll(/\[\[\n([\s\S]*?)\n\]\]/g)) {
    const lines = m[1].split('\n').map((l) => l.trim());
    if (lines.length < 2) continue;
    const u: RefDataUnique = {
      name: lines[0],
      base: lines[1],
      slot,
      variants: [],
      req: '',
      source: '',
      league: '',
      implicits: 0,
      lines: [],
    };
    for (const l of lines.slice(2)) {
      let t;
      if ((t = l.match(/^Variant: (.*)$/))) u.variants.push(t[1]);
      else if ((t = l.match(/^Requires Level (\d+)(.*)$/))) {
        u.levelReq = Number(t[1]);
        u.req = t[2].replace(/^,\s*/, '');
      } else if ((t = l.match(/^Source: (.*)$/))) u.source = t[1];
      else if ((t = l.match(/^League: (.*)$/))) u.league = t[1];
      else if ((t = l.match(/^Implicits: (\d+)$/))) u.implicits = Number(t[1]);
      else if (
        /^(Upgrade|Selected Variant|Has Alt Variant|Radius|LevelReq|Limited to|Talisman Tier|Selected Alt)/.test(
          l,
        )
      )
        continue;
      else if (l) u.lines.push(l);
    }
    out.push(u);
  }
  return out;
}

function main(): void {
  const dir = process.argv[2];
  if (!dir)
    throw new Error(
      'usage: coverage:extract -- <path to the data folder of the reference release>',
    );
  const root = resolve(dir);
  const layout = loadSources().data;
  const source = refSource();
  const skillFiles = [
    'act_str',
    'act_dex',
    'act_int',
    'sup_str',
    'sup_dex',
    'sup_int',
    'other',
    'minion',
    'spectre',
    'glove',
  ];
  const gems = parseGems(readFileSync(join(root, layout.gems), 'utf8'));
  const skills: RefSkill[] = [];
  for (const f of skillFiles)
    skills.push(
      ...parseSkills(readFileSync(join(root, layout.skills, `${f}${layout.ext}`), 'utf8')),
    );
  for (const s of skills) {
    const g = gems.get(s.id);
    if (g) s.gem = { tags: g.tags, reqStr: g.reqStr, reqDex: g.reqDex, reqInt: g.reqInt, id: g.id };
  }
  const gemSkills = skills.filter((s) => s.gem);
  writeFileSync(
    join(COVERAGE_DIR, 'ref-skills.json'),
    JSON.stringify({ source, skills: gemSkills }) + '\n',
  );
  const uniques: RefDataUnique[] = [];
  const udir = join(root, layout.uniques);
  const files = readdirSync(udir).filter(
    (x) => x.endsWith(layout.ext) && !layout.uniquesSkipped.includes(x),
  );
  for (const f of files) {
    uniques.push(...parseUniques(readFileSync(join(udir, f), 'utf8'), f.replace(layout.ext, '')));
  }
  writeFileSync(join(COVERAGE_DIR, 'ref-uniques.json'), JSON.stringify({ source, uniques }) + '\n');
  console.log(
    `skills with gems: ${gemSkills.length} (of ${skills.length} skill blocks), uniques: ${uniques.length}`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
