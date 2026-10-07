import { median } from '../core/math';
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
