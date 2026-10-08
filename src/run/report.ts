import { median } from '../core/math';
import { FACTION_NAMES, MONSTER_TYPES, type FactionId, type MonsterTypeId } from '../data/monsters';
import { SNAPSHOT_MAPS, type BuildSnapshot, type KillerInfo } from './metrics';

/** What the depth report needs to know about one headless run (EXPANSION 10.3). */
export type RunSummary = {
  classId: string;
  won: boolean;
  deathMap: number | null;
  killer: KillerInfo | null;
  /** Maps played, and uniques picked up over them. */
  mapsPlayed: number;
  found: number;
  /** Gems picked up over those maps. */
  gemsFound: number;
  snapshots: BuildSnapshot[];
  /** The build at the end of the run. */
  signature: string;
};

function tally<T>(items: T[], key: (x: T) => string[]): [string, number][] {
  const m = new Map<string, number>();
  for (const it of items) for (const k of key(it)) m.set(k, (m.get(k) ?? 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
}

const pct = (n: number, d: number) => (d ? `${Math.round((100 * n) / d)}%` : '–');

function histogram(title: string, rows: [string, number][], total: number, top = 8): string[] {
  if (!rows.length) return [`${title}: none`];
  return [
    `${title}: ` +
      rows
        .slice(0, top)
        .map(([k, n]) => `${k} ${n} (${pct(n, total)})`)
        .join(' · '),
  ];
}

/** Who killed the player: by faction, monster type, variant, mod and damage type, plus a class matrix. */
export function killerReport(runs: RunSummary[]): string[] {
  const dead = runs.filter((r) => r.deathMap !== null && r.killer);
  const out = [
    `Deaths with a known killer: ${dead.length} of ${runs.filter((r) => r.deathMap !== null).length}`,
  ];
  if (!dead.length) return out;
  const n = dead.length;
  out.push(
    ...histogram(
      'Faction',
      tally(dead, (r) => [r.killer!.faction]),
      n,
    ),
  );
  out.push(
    ...histogram(
      'Monster type',
      tally(dead, (r) => [r.killer!.type]),
      n,
    ),
  );
  out.push(
    ...histogram(
      'Variant',
      tally(dead, (r) => [r.killer!.variant]),
      n,
    ),
  );
  out.push(
    ...histogram(
      'Rarity',
      tally(dead, (r) => [r.killer!.rarity]),
      n,
    ),
  );
  out.push(
    ...histogram(
      'Monster mod',
      tally(dead, (r) => r.killer!.mods),
      n,
    ),
  );
  out.push(
    ...histogram(
      'Damage type',
      tally(dead, (r) => [r.killer!.dtype]),
      n,
    ),
  );
  const classes = [...new Set(dead.map((r) => r.classId))].sort();
  const factions = [...new Set(dead.map((r) => r.killer!.faction))].sort();
  out.push('', `| Deaths by faction × class | ${classes.join(' | ')} |`);
  out.push(`| --- | ${classes.map(() => '---').join(' | ')} |`);
  for (const f of factions)
    out.push(
      `| ${f} | ${classes
        .map((c) => dead.filter((r) => r.classId === c && r.killer!.faction === f).length)
        .join(' | ')} |`,
    );
  return out;
}

/** Uniques found and worn at maps 25, 50, 75 and 100, over the runs that got that far. */
export function uniquesReport(runs: RunSummary[]): string[] {
  if (!runs.some((r) => r.snapshots.length)) return ['Uniques: no run reached map 25'];
  const out = [
    '| Map | Runs | Median uniques found | Runs wearing one | Most worn |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const map of SNAPSHOT_MAPS) {
    const snaps = runs.flatMap((r) => r.snapshots.filter((s) => s.map === map));
    if (!snaps.length) continue;
    const worn = tally(snaps, (s) => s.worn)
      .slice(0, 4)
      .map(([k, c]) => `${k} ${c}`)
      .join(', ');
    out.push(
      `| ${map} | ${snaps.length} | ${median(snaps.map((s) => s.found))} | ${pct(snaps.filter((s) => s.worn.length > 0).length, snaps.length)} | ${worn || '–'} |`,
    );
  }
  // Distinct uniques worn at each snapshot, and uniques found per 100 maps.
  for (const map of [50, 75]) {
    const worn = tally(
      runs.flatMap((r) => r.snapshots.filter((s) => s.map === map)),
      (s) => s.worn,
    );
    if (worn.length)
      out.push(
        `Distinct uniques worn at map ${map}: ${worn.length} (${worn.map(([k]) => k).join(', ')})`,
      );
  }
  const rate = runs.filter((r) => r.mapsPlayed >= 20).map((r) => (100 * r.found) / r.mapsPlayed);
  if (rate.length) out.push(`Uniques found per 100 maps: median ${median(rate).toFixed(1)}`);
  const gems = runs
    .filter((r) => r.mapsPlayed >= 20)
    .map((r) => (100 * r.gemsFound) / r.mapsPlayed);
  if (gems.length) out.push(`Gems found per 100 maps: median ${median(gems).toFixed(1)}`);
  return out;
}

/** The builds of the winning runs: how many different ones, and how concentrated. */
export function signatureReport(runs: RunSummary[]): string[] {
  const wins = runs.filter((r) => r.won);
  if (!wins.length) return ['Build signatures: no wins'];
  const rows = tally(wins, (r) => [r.signature]);
  const out = [
    `Build signatures among ${wins.length} wins: ${rows.length} distinct; the most common is ${pct(rows[0][1], wins.length)}`,
  ];
  for (const [sig, n] of rows.slice(0, 5)) out.push(`  ${n}× ${sig}`);
  return out;
}

/** The part of a bot run the variety report reads. */
export type VarietyRun = { maps: { map: number; met?: Record<string, number> }[] };

const FACTION_ORDER = Object.keys(FACTION_NAMES) as FactionId[];

/** The faction share (0 to 1) of one map's head count. */
function factionShares(met: Record<string, number>): Record<FactionId, number> {
  const out = Object.fromEntries(FACTION_ORDER.map((f) => [f, 0])) as Record<FactionId, number>;
  let total = 0;
  for (const [t, n] of Object.entries(met)) {
    const def = MONSTER_TYPES[t as MonsterTypeId];
    if (!def) continue;
    out[def.faction] += n;
    total += n;
  }
  if (total > 0) for (const f of FACTION_ORDER) out[f] /= total;
  return out;
}

/**
 * Who the player met (docs/ENEMIES.md section 9), by band of ten maps: the share of the monsters placed by faction and the
 * commonest types, then the variety index: distinct types per band, and the longest stretch of maps in which one faction
 * supplied over 60% of the monsters. Each map counts once, so the shares are of the maps played, not of the head count.
 */
export function varietyReport(runs: VarietyRun[]): string[] {
  const maps = runs.flatMap((r) => r.maps.filter((m) => m.met && Object.keys(m.met).length > 0));
  if (!maps.length) return ['Enemies met: no maps played'];
  const out = [
    '| Maps | Maps played | ' +
      FACTION_ORDER.map((f) => FACTION_NAMES[f]).join(' | ') +
      ' | Commonest types | Distinct types |',
    '| --- | --- | ' + FACTION_ORDER.map(() => '---').join(' | ') + ' | --- | --- |',
  ];
  for (let lo = 1; lo <= 100; lo += 10) {
    const band = maps.filter((m) => m.map >= lo && m.map < lo + 10);
    if (!band.length) continue;
    // The share of the head count of the whole band, so a big map weighs more than a small one.
    const sum: Record<string, number> = {};
    for (const m of band) for (const [t, n] of Object.entries(m.met!)) sum[t] = (sum[t] ?? 0) + n;
    const shares = factionShares(sum);
    const total = Object.values(sum).reduce((a, b) => a + b, 0);
    const top = Object.entries(sum)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([t, n]) => `${MONSTER_TYPES[t as MonsterTypeId]?.name ?? t} ${pct(n, total)}`)
      .join(', ');
    out.push(
      `| ${lo}–${lo + 9} | ${band.length} | ${FACTION_ORDER.map((f) => pct(shares[f], 1)).join(' | ')} | ${top} | ${Object.keys(sum).length} |`,
    );
  }
  // Longest stretch of consecutive maps in one run led (over 60%) by the same faction.
  let longest = 0;
  const streaks: number[] = [];
  for (const r of runs) {
    let cur = 0;
    let who: FactionId | null = null;
    let best = 0;
    for (const m of r.maps) {
      if (!m.met || !Object.keys(m.met).length) continue;
      const sh = factionShares(m.met);
      const lead = FACTION_ORDER.find((f) => sh[f] > 0.6) ?? null;
      if (lead !== null && lead === who) cur++;
      else cur = lead === null ? 0 : 1;
      who = lead;
      best = Math.max(best, cur);
    }
    longest = Math.max(longest, best);
    streaks.push(best);
  }
  out.push(
    `Longest stretch of maps led (over 60%) by one faction: ${longest}; median over runs ${median(streaks)}`,
  );
  return out;
}

export function depthReport(runs: RunSummary[]): string {
  return [
    '## Depth report',
    '',
    ...killerReport(runs),
    '',
    ...uniquesReport(runs),
    '',
    ...signatureReport(runs),
  ].join('\n');
}
