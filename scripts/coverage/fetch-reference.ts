/**
 * Fetches the coverage reference list (docs/COVERAGE.md section 2): every skill gem and unique item that
 * existed in PoE 1 patch 3.9.x, from the wiki's Cargo API.
 *
 *   npm run coverage:fetch
 *
 * Writes docs/coverage/reference-3.9.0.json. The file is reference data: it lives outside `src/` and the game never
 * loads it (DESIGN §3). Mod text on the wiki is the *current* text, not 3.9's (COVERAGE §2, caveat on mod text).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { versionAtMost, versionBefore } from './version';

const API = 'https://www.poewiki.net/w/api.php';
const AGENT = 'bob-coverage/0.1 (personal hobby project; reference list for a game design plan)';
const OUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../docs/coverage/reference-3.9.0.json',
);

/** Reference version: everything released at 3.9.x or earlier (COVERAGE §2). */
export const REF_MAJOR_MINOR = '3.9';

/** Item classes that are not in the unique denominator (COVERAGE C-6), with the reason. */
export const EXCLUDED_UNIQUE_CLASSES: Record<string, string> = {
  Jewel: 'jewels are out of scope (C-6)',
  'Abyss Jewel': 'jewels are out of scope (C-6)',
  Map: 'maps are not equipment (C-6)',
  Watchstone: 'watchstones are not equipment (C-6)',
  'Fishing Rod': 'fishing rods are excluded (C-6)',
  'Item Piece': 'fragments are not equipment (C-6)',
  Contract: 'heist items are post-3.9 (C-6)',
  Idol: 'not equipment (C-6)',
  Relic: 'sanctum relics are not equipment (C-6)',
  Sentinel: 'Sentinels are not equipment (C-6)',
  Tincture: 'post-3.9 item class (C-6)',
};

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

/** Wiki stat text carries markup (<br>, [[links]], <span>): reduce it to plain lines. */
function plain(s: string | null): string {
  return decode(s)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
    .trim();
}

async function cargo(query: Record<string, string>): Promise<Row[]> {
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
      const res = await fetch(`${API}?${params}`, { headers: { 'User-Agent': AGENT } });
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
  /** Wiki item class ("Body Armour", "Utility Flask"). */
  class: string;
  page: string;
  base: string;
  release: string;
  removal: string;
  level: number;
  dropEnabled: boolean;
  implicit: string;
  explicit: string;
  /** Other wiki entries folded into this one (same name, different page). */
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

function inScope(release: string | null, removal: string | null): string | null {
  if (release && !versionAtMost(release, REF_MAJOR_MINOR)) return 'released after 3.9';
  if (removal && versionBefore(removal, '3.9.0')) return 'removed before 3.9.0';
  return null;
}

async function main(): Promise<void> {
  const excludedGems: Record<string, number> = {};
  const excludedUniques: Record<string, number> = {};
  const bump = (m: Record<string, number>, k: string) => (m[k] = (m[k] ?? 0) + 1);

  // --- Gems -------------------------------------------------------------------------------------------------
  const gemRows = await cargo({
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
      'skill_gems.is_vaal_skill_gem=vaal',
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
    const out = inScope(r.release, r.removal);
    if (out) {
      bump(excludedGems, out);
      continue;
    }
    if (r.vaal === '1') {
      bump(excludedGems, 'Vaal');
      continue;
    }
    if (name.startsWith('Awakened ')) {
      bump(excludedGems, 'Awakened');
      continue;
    }
    if (/^Portal$/i.test(name) || /Vaal /.test(name)) {
      bump(excludedGems, 'Portal/Vaal name');
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
  const uniqueRows = await cargo({
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
    const exClass = EXCLUDED_UNIQUE_CLASSES[cls];
    if (exClass) {
      bump(excludedUniques, `class ${cls}`);
      continue;
    }
    const out = inScope(r.release, r.removal);
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
      version: '3.9.0',
      fetched: new Date().toISOString().slice(0, 10),
      source: `${API} (Cargo tables items, skill_gems)`,
      note: 'Names and classes are reliable for 3.9. Mod text is the current wiki text, not 3.9 text (COVERAGE section 2).',
      filters: [
        'gems: class Skill Gem or Support Gem; release_version <= 3.9.x (blank = original); not removed before 3.9.0; no Vaal, Awakened or Portal',
        'uniques: rarity unique; classes excluded: ' +
          Object.keys(EXCLUDED_UNIQUE_CLASSES).join(', '),
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
