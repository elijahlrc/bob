/**
 * Fetches the coverage reference list (docs/COVERAGE.md section 2): every skill gem and unique item that
 * existed in the reference version, from the reference wiki's Cargo API (its address, the version and the filters are in
 * reference/sources.json).
 *
 *   npm run coverage:fetch
 *
 * Writes reference/coverage/ref-list.json. The file is reference data: it lives outside `src/` and the game never
 * loads it (DESIGN §3). Mod text on the reference wiki is the *current* text, not the reference version's (COVERAGE §2,
 * caveat on mod text).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadSources, type Sources } from './reference';
import { versionAtMost, versionBefore } from './version';

const AGENT = 'bob-coverage/0.1 (personal hobby project; reference list for a game design plan)';
const OUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../reference/coverage/ref-list.json',
);

type Row = Record<string, string | null>;

function decode(s: string | null): string {
  if (s == null) return '';
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/** Reference wiki stat text carries markup (<br>, [[links]], <span>): reduce it to plain lines. */
function plain(s: string | null): string {
  return decode(s)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
    .trim();
}

async function cargo(api: string, query: Record<string, string>): Promise<Row[]> {
  const rows: Row[] = [];
  for (let offset = 0; ; offset += 500) {
    const params = new URLSearchParams({
      action: 'cargoquery',
      format: 'json',
      limit: '500',
      offset: String(offset),
      ...query,
    });
    let data: { cargoquery?: { title: Row }[]; error?: unknown } | undefined;
    for (let attempt = 0; attempt < 4; attempt++) {
      const res = await fetch(`${api}?${params}`, { headers: { 'User-Agent': AGENT } });
      data = (await res.json()) as typeof data;
      if (data?.cargoquery) break;
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
    if (!data?.cargoquery) throw new Error(`Cargo query failed: ${JSON.stringify(data?.error)}`);
    rows.push(...data.cargoquery.map((r) => r.title));
    if (data.cargoquery.length < 500) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  return rows;
}

export type RefGem = {
  name: string;
  kind: 'active' | 'support';
  page: string;
  tags: string[];
  attr: string;
  release: string;
  removal: string;
  level: number;
  dropEnabled: boolean;
  maxLevel: number;
};

export type RefUnique = {
  name: string;
  /** Reference wiki item class ("Body Armour", "Utility Flask"). */
  class: string;
  page: string;
  base: string;
  release: string;
  removal: string;
  level: number;
  dropEnabled: boolean;
  implicit: string;
  explicit: string;
  /** Other reference wiki entries folded into this one (same name, different page). */
  variants: string[];
};

export type Reference = {
  header: {
    version: string;
    fetched: string;
    source: string;
    note: string;
    filters: string[];
    counts: Record<string, number>;
    excluded: { gems: Record<string, number>; uniques: Record<string, number> };
  };
  gems: RefGem[];
  uniques: RefUnique[];
};

/** In the reference: released at the reference version or earlier, and not removed before it (COVERAGE §2). */
function inScope(
  release: string | null,
  removal: string | null,
  v: Sources['version'],
): string | null {
  if (release && !versionAtMost(release, v.line)) return `released after ${v.line}`;
  if (removal && versionBefore(removal, v.full)) return `removed before ${v.full}`;
  return null;
}

async function main(): Promise<void> {
  const { version, wiki } = loadSources();
  const excludedGems: Record<string, number> = {};
  const excludedUniques: Record<string, number> = {};
  const bump = (m: Record<string, number>, k: string) => (m[k] = (m[k] ?? 0) + 1);
  const namesOut = wiki.gemNamesExcluded.patterns.map(([re, flags]) => new RegExp(re, flags));

  // --- Gems -------------------------------------------------------------------------------------------------
  const gemRows = await cargo(wiki.api, {
    tables: 'items,skill_gems',
    join_on: 'items._pageID=skill_gems._pageID',
    fields: [
      'items.name=name',
      'items.class=class',
      'items._pageName=page',
      'items.release_version=release',
      'items.removal_version=removal',
      'items.required_level=level',
      'items.drop_enabled=drop',
      'skill_gems.gem_tags=tags',
      `${wiki.gemFlagField}=flag`,
      'skill_gems.primary_attribute=attr',
      'skill_gems.max_level=maxLevel',
    ].join(','),
    where: 'items.class="Skill Gem" OR items.class="Support Gem"',
  });
  console.log(`gem rows: ${gemRows.length}`);
  const gems: RefGem[] = [];
  const seenGems = new Set<string>();
  for (const r of gemRows) {
    const name = decode(r.name);
    const out = inScope(r.release, r.removal, version);
    if (out) {
      bump(excludedGems, out);
      continue;
    }
    if (r.flag === '1') {
      bump(excludedGems, wiki.gemFlagLabel);
      continue;
    }
    if (name.startsWith(wiki.gemPrefixExcluded.prefix)) {
      bump(excludedGems, wiki.gemPrefixExcluded.label);
      continue;
    }
    if (namesOut.some((re) => re.test(name))) {
      bump(excludedGems, wiki.gemNamesExcluded.label);
      continue;
    }
    if (seenGems.has(name)) {
      bump(excludedGems, 'duplicate name');
      continue;
    }
    seenGems.add(name);
    gems.push({
      name,
      kind: r.class === 'Support Gem' ? 'support' : 'active',
      page: decode(r.page),
      tags: (r.tags ?? '').split(',').filter(Boolean),
      attr: r.attr ?? '',
      release: r.release ?? '',
      removal: r.removal ?? '',
      level: Number(r.level ?? 0),
      dropEnabled: r.drop === '1',
      maxLevel: Number(r.maxLevel ?? 0),
    });
  }
  gems.sort((a, b) => a.name.localeCompare(b.name));

  // --- Uniques ----------------------------------------------------------------------------------------------
  const uniqueRows = await cargo(wiki.api, {
    tables: 'items',
    fields: [
      'name',
      'class',
      '_pageName=page',
      'base_item=base',
      'release_version=release',
      'removal_version=removal',
      'required_level=level',
      'drop_enabled=drop',
      'is_replica=replica',
      'is_in_game=inGame',
      'implicit_stat_text=implicit',
      'explicit_stat_text=explicit',
    ].join(','),
    where: 'rarity_id="unique"',
  });
  console.log(`unique rows: ${uniqueRows.length}`);
  const byName = new Map<string, RefUnique>();
  for (const r of uniqueRows) {
    const cls = decode(r.class);
    const name = decode(r.name);
    const exClass = wiki.uniqueClassesExcluded[cls];
    if (exClass) {
      bump(excludedUniques, `class ${cls}`);
      continue;
    }
    const out = inScope(r.release, r.removal, version);
    if (out) {
      bump(excludedUniques, out);
      continue;
    }
    if (r.replica === '1') {
      bump(excludedUniques, 'replica');
      continue;
    }
    if (r.inGame === '0') {
      bump(excludedUniques, 'not in game');
      continue;
    }
    const prev = byName.get(name);
    if (prev) {
      prev.variants.push(decode(r.page));
      bump(excludedUniques, 'duplicate name (variant)');
      continue;
    }
    byName.set(name, {
      name,
      class: cls,
      page: decode(r.page),
      base: decode(r.base),
      release: r.release ?? '',
      removal: r.removal ?? '',
      level: Number(r.level ?? 0),
      dropEnabled: r.drop === '1',
      implicit: plain(r.implicit),
      explicit: plain(r.explicit),
      variants: [],
    });
  }
  const uniques = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));

  const counts = {
    activeGems: gems.filter((g) => g.kind === 'active').length,
    supportGems: gems.filter((g) => g.kind === 'support').length,
    gems: gems.length,
    uniques: uniques.length,
    uniqueFlasks: uniques.filter((u) => /Flask$/.test(u.class)).length,
    uniqueNonDropping: uniques.filter((u) => !u.dropEnabled).length,
  };
  const ref: Reference = {
    header: {
      version: version.full,
      fetched: new Date().toISOString().slice(0, 10),
      source: `${wiki.api} (Cargo tables items, skill_gems)`,
      note: wiki.listNote,
      filters: [
        wiki.gemFilter,
        'uniques: rarity unique; classes excluded: ' +
          Object.keys(wiki.uniqueClassesExcluded).join(', '),
        'uniques: not a replica, in game; one entry per name (variants folded in)',
      ],
      counts,
      excluded: { gems: excludedGems, uniques: excludedUniques },
    },
    gems,
    uniques,
  };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(ref, null, 1) + '\n');
  console.log(JSON.stringify({ counts, excludedGems, excludedUniques }, null, 1));
  console.log(`wrote ${OUT}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) void main();
