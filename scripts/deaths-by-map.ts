/**
 * Where players die, as a bar chart in the terminal, from the Supabase run table (docs/TELEMETRY.md).
 *
 *   npm run deaths-by-map                       deaths by map in the last 24 hours
 *   npm run deaths-by-map -- --hours 72 --by class
 *   options: --hours N (24)   --by map|class|killer|version (map)   --outcome died|won|all (died)
 *            --class vanguard   --version abc1234   --max-map 20 (maps past it share one bar)
 *            --table runs|sim_runs   --from rows.json (rows already exported, no network)
 *
 * Reading needs the project's secret (service) key: the publishable key in src/run/telemetry.ts can only insert. Put
 *   SUPABASE_SECRET_KEY=...
 * in `.env.local` at the repo root (git-ignored) or in the environment; SUPABASE_URL is optional and defaults to the game's project.
 */
import { existsSync, readFileSync } from 'node:fs';

interface Row {
  created_at: string;
  outcome: string;
  class_id: string;
  map: number;
  killer: string | null;
  game_version: string | null;
}

const arg = (k: string, d: string): string => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : d;
};

/** KEY=value lines of a dotenv file; the environment wins. */
function envFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m) out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return out;
}

const hours = Math.max(0.1, Number(arg('hours', '24')));
const by = arg('by', 'map');
const outcome = arg('outcome', 'died');
const classId = arg('class', '');
const version = arg('version', '');
const maxMap = Math.max(1, Number(arg('max-map', '20')));
const table = arg('table', 'runs');
const from = arg('from', '');

async function load(): Promise<Row[]> {
  if (from) return JSON.parse(readFileSync(from, 'utf8')) as Row[];
  const env = { ...envFile('.env'), ...envFile('.env.local'), ...process.env };
  const url = env.SUPABASE_URL ?? 'https://rqehhconrbuxewrhqjnw.supabase.co';
  const key = env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new Error(
      'Reading needs the secret key: put SUPABASE_SECRET_KEY=... in .env.local (git-ignored) or the environment. ' +
        'Supabase dashboard > Project settings > API keys > secret.',
    );
  }
  const since = new Date(Date.now() - hours * 3600_000).toISOString();
  let filter = `&created_at=gte.${encodeURIComponent(since)}`;
  if (outcome !== 'all') filter += `&outcome=eq.${encodeURIComponent(outcome)}`;
  if (classId) filter += `&class_id=eq.${encodeURIComponent(classId)}`;
  if (version) filter += `&game_version=eq.${encodeURIComponent(version)}`;
  const rows: Row[] = [];
  for (let offset = 0; ; offset += 1000) {
    const q = `select=created_at,outcome,class_id,map,killer,game_version&order=created_at.asc&limit=1000&offset=${offset}${filter}`;
    const res = await fetch(`${url}/rest/v1/${table}?${q}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
    const page = (await res.json()) as Row[];
    rows.push(...page);
    if (page.length < 1000) break;
  }
  return rows;
}

type Bar = { label: string; n: number };

/** One bar per map from 1 to the cap (empty maps included, so gaps show), then one bar for everything past it. */
export function byMap(rows: Row[], cap: number): Bar[] {
  const bars: Bar[] = Array.from({ length: cap }, (_, i) => ({ label: String(i + 1), n: 0 }));
  const past: Bar = { label: `${cap + 1}+`, n: 0 };
  for (const r of rows) {
    if (r.map > cap) past.n++;
    else bars[r.map - 1].n++;
  }
  return past.n > 0 ? [...bars, past] : bars;
}

/** One bar per distinct value, the commonest first. */
export function byField(rows: Row[], pick: (r: Row) => string | null): Bar[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const k = pick(r) || '(none)';
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts].map(([label, n]) => ({ label, n })).sort((a, b) => b.n - a.n);
}

export function render(bars: Bar[], width = 40): string[] {
  const total = bars.reduce((s, b) => s + b.n, 0);
  const top = Math.max(1, ...bars.map((b) => b.n));
  const lw = Math.max(...bars.map((b) => b.label.length));
  const nw = String(top).length;
  return bars.map((b) => {
    const len = b.n === 0 ? 0 : Math.max(1, Math.round((b.n / top) * width));
    const share = total ? `${((100 * b.n) / total).toFixed(1)}%` : '';
    return `${b.label.padStart(lw)} │ ${'█'.repeat(len).padEnd(width)} ${String(b.n).padStart(nw)}  ${share}`;
  });
}

async function main() {
  const rows = await load();
  const what = outcome === 'all' ? 'runs' : outcome === 'won' ? 'wins' : 'deaths';
  const scope = [
    from ? 'from file' : `last ${hours} h`,
    classId && `class ${classId}`,
    version && `version ${version}`,
    table !== 'runs' && table,
  ]
    .filter(Boolean)
    .join(', ');
  const bars =
    by === 'class'
      ? byField(rows, (r) => r.class_id)
      : by === 'killer'
        ? byField(rows, (r) => r.killer)
        : by === 'version'
          ? byField(rows, (r) => r.game_version)
          : byMap(rows, maxMap);
  console.log(`${rows.length} ${what} by ${by} (${scope})\n`);
  if (rows.length === 0) return;
  console.log(by === 'map' ? 'map' : by);
  for (const line of render(bars)) console.log(line);
  if (by === 'map') {
    const sorted = rows.map((r) => r.map).sort((a, b) => a - b);
    const pct = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
    const early = rows.filter((r) => r.map <= 10).length;
    console.log(
      `\nmedian map ${pct(0.5)}, quartiles ${pct(0.25)} to ${pct(0.75)}; ${early} of ${rows.length} (${Math.round((100 * early) / rows.length)}%) on maps 1 to 10`,
    );
  }
}

if (process.argv[1]?.includes('deaths-by-map')) {
  main().catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
