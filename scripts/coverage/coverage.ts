/**
 * Coverage report (COVERAGE section 2): how much of the 3.9.0 reference list Bob covers, by category, by bucket and by
 * milestone.
 *
 *   npm run coverage            print the report
 *   npm run coverage -- --list  also list the uncovered entries of each bucket
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ALL_GEMS } from '../../src/data/gems';
import { UNIQUES } from '../../src/data/uniques';
import { UNIQUE_FLASKS } from '../../src/data/uniqueFlasks';
import {
  BUCKETS,
  BUCKET_LABEL,
  BUCKET_MILESTONE,
  MILESTONES,
  gemBucket,
  loadOverrides,
  uniqueBucket,
  type Bucket,
} from './buckets';
import { COVERAGE_DIR, key, loadReference } from './reference';

export type MapStatus = 'covered' | 'partial' | 'planned' | 'excluded';
export type MapEntry = { ref: string; status: MapStatus; note: string };
export type CoverageMap = { gems: Record<string, MapEntry>; uniques: Record<string, MapEntry> };

export const MAP_STATUSES: readonly MapStatus[] = ['covered', 'partial', 'planned', 'excluded'];

export function loadMap(): CoverageMap {
  return JSON.parse(readFileSync(resolve(COVERAGE_DIR, 'map.json'), 'utf8')) as CoverageMap;
}

/** Every droppable Bob gem and unique id: each needs a line in map.json, even if its status is "excluded". */
export function bobIds(): { gems: string[]; uniques: string[] } {
  return {
    gems: ALL_GEMS.map((g) => g.id),
    uniques: [...UNIQUES.map((u) => u.id), ...UNIQUE_FLASKS.map((u) => u.id)],
  };
}

/** Problems in map.json, as readable strings. Empty when the map is sound. */
export function validateMap(map: CoverageMap): string[] {
  const ref = loadReference();
  const ids = bobIds();
  const problems: string[] = [];
  const gemKeys = new Set(ref.gems.map((g) => key(g.name)));
  const uniqueKeys = new Set(ref.uniques.map((u) => key(u.name)));
  const check = (kind: 'gems' | 'uniques', known: string[], keys: Set<string>) => {
    const entries = map[kind];
    for (const id of known)
      if (!entries[id]) problems.push(`${kind}: Bob id "${id}" has no entry in map.json`);
    for (const [id, e] of Object.entries(entries)) {
      if (!known.includes(id)) problems.push(`${kind}: map.json entry "${id}" is not a Bob id`);
      if (!MAP_STATUSES.includes(e.status))
        problems.push(`${kind}: "${id}" has unknown status ${e.status}`);
      if (e.status === 'excluded') {
        if (e.ref) problems.push(`${kind}: "${id}" is excluded but names a reference entry`);
      } else if (!keys.has(key(e.ref)))
        problems.push(`${kind}: "${id}" points at "${e.ref}", which is not in the reference list`);
      if (!e.note) problems.push(`${kind}: "${id}" has no note`);
    }
  };
  check('gems', ids.gems, gemKeys);
  check('uniques', ids.uniques, uniqueKeys);
  return problems;
}

type Cat = 'active' | 'support' | 'unique';
type Row = {
  name: string;
  cat: Cat;
  bucket: Bucket;
  covered: boolean;
  partial: boolean;
  planned: boolean;
};

export function rows(map: CoverageMap): Row[] {
  const ref = loadReference();
  const over = loadOverrides();
  const status = new Map<string, Set<MapStatus>>();
  for (const e of [...Object.values(map.gems), ...Object.values(map.uniques)]) {
    if (e.status === 'excluded') continue;
    const k = key(e.ref);
    if (!status.has(k)) status.set(k, new Set());
    status.get(k)!.add(e.status);
  }
  const mk = (name: string, cat: Cat, bucket: Bucket): Row => {
    const s = status.get(key(name));
    return {
      name,
      cat,
      bucket: over[key(name)] ?? bucket,
      covered: !!s?.has('covered'),
      partial: !s?.has('covered') && !!s?.has('partial'),
      planned: !s?.has('covered') && !!s?.has('planned'),
    };
  };
  return [
    ...ref.gems.map((g) => mk(g.name, g.kind, gemBucket(g))),
    ...ref.uniques.map((u) => mk(u.name, 'unique', uniqueBucket(u))),
  ];
}

const pct = (a: number, b: number) =>
  b === 0 ? '  -  ' : `${((100 * a) / b).toFixed(1)}%`.padStart(5);

export function report(map: CoverageMap, list: boolean): string {
  const rs = rows(map);
  const out: string[] = [];
  const sum = (f: (r: Row) => boolean) => rs.filter(f).length;
  const gems = (r: Row) => r.cat !== 'unique';
  const uniq = (r: Row) => r.cat === 'unique';
  const cov = (r: Row) => r.covered;

  out.push('Coverage of the 3.9.0 reference list (docs/COVERAGE.md)');
  out.push('');
  for (const [label, f, target] of [
    ['Active gems', (r: Row) => r.cat === 'active', 0.9],
    ['Support gems', (r: Row) => r.cat === 'support', 0.9],
    ['All gems', gems, 0.9],
    ['All uniques', uniq, 0.9],
  ] as const) {
    const n = sum(f);
    const c = sum((r) => f(r) && cov(r));
    const need = Math.ceil(n * target);
    out.push(
      `${label.padEnd(14)} ${String(c).padStart(4)} / ${String(n).padEnd(4)} ${pct(c, n)}   90% needs ${need} (${Math.max(0, need - c)} to go, ${n - need} misses allowed)`,
    );
  }
  out.push(
    `partial (does not count): ${sum((r) => r.partial)}   planned: ${sum((r) => r.planned)}`,
  );
  out.push('');
  out.push(`${'Bucket'.padEnd(36)} ${'Gems'.padStart(12)} ${'Uniques'.padStart(14)}  Milestone`);
  for (const b of BUCKETS) {
    const g = rs.filter((r) => gems(r) && r.bucket === b);
    const u = rs.filter((r) => uniq(r) && r.bucket === b);
    const gc = g.filter(cov).length;
    const uc = u.filter(cov).length;
    out.push(
      `${BUCKET_LABEL[b].padEnd(36)} ${`${gc}/${g.length}`.padStart(12)} ${`${uc}/${u.length}`.padStart(14)}  ${BUCKET_MILESTONE[b]}`,
    );
  }
  out.push('');
  out.push(
    'Potential coverage if every entry in the milestone buckets were covered (the curve of section 8):',
  );
  const nG = sum(gems);
  const nU = sum(uniq);
  for (const m of MILESTONES) {
    const upTo = MILESTONES.slice(0, MILESTONES.indexOf(m) + 1) as readonly string[];
    const inScope = (r: Row) => upTo.includes(BUCKET_MILESTONE[r.bucket]);
    const g = sum((r) => gems(r) && (inScope(r) || cov(r)));
    const u = sum((r) => uniq(r) && (inScope(r) || cov(r)));
    out.push(`  after ${m}: gems ${pct(g, nG)}  uniques ${pct(u, nU)}`);
  }
  if (list) {
    for (const b of BUCKETS) {
      const miss = rs.filter((r) => r.bucket === b && !r.covered).map((r) => r.name);
      out.push('', `${BUCKET_LABEL[b]} — uncovered (${miss.length}):`, '  ' + miss.join('; '));
    }
  }
  return out.join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const map = loadMap();
  const problems = validateMap(map);
  if (problems.length) {
    console.error('map.json problems:\n  ' + problems.join('\n  '));
    process.exitCode = 1;
  }
  console.log(report(map, process.argv.includes('--list')));
}
