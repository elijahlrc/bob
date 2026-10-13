/**
 * Death level over time, from the Supabase run table (docs/TELEMETRY.md). One dot per death (level it died at, and the map it
 * reached), coloured by class, with a rolling median and a tick wherever the game version changed. Writes a self-contained HTML
 * page (no network needed to view it).
 *
 *   SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SECRET_KEY=... npm run deaths
 *   npm run deaths -- --from rows.json            (rows already exported: [{created_at, class_id, level, map, game_version}])
 *   options: --table runs|sim_runs   --x time|run   --window 10   --out deaths.local.html
 *
 * Reading needs the project's secret (service) key: the publishable key in src/telemetry.ts can only insert. Keep the key in the
 * environment, never in the repo. `*.local` is git-ignored, so the default output stays out of commits.
 */
import { readFileSync, writeFileSync } from 'node:fs';

interface Row {
  created_at: string;
  outcome?: string;
  class_id: string;
  level: number;
  map: number;
  game_version?: string | null;
}

const arg = (k: string, d: string) => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const table = arg('table', 'runs');
const xMode = arg('x', 'time') === 'run' ? 'run' : 'time';
const window = Math.max(1, Number(arg('window', '10')));
const out = arg('out', 'deaths.local.html');
const from = arg('from', '');

async function load(): Promise<Row[]> {
  if (from) return JSON.parse(readFileSync(from, 'utf8')) as Row[];
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      'Set SUPABASE_URL and SUPABASE_SECRET_KEY (reading needs the secret key), or pass --from rows.json',
    );
  }
  const rows: Row[] = [];
  for (let offset = 0; ; offset += 1000) {
    const q = `select=created_at,outcome,class_id,level,map,game_version&order=created_at.asc&limit=1000&offset=${offset}`;
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

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const CLASS_COLOUR: Record<string, string> = {
  vanguard: '#d9534f',
  strider: '#3fae6a',
  mystic: '#5b8def',
  reaver: '#e08a1e',
  zealot: '#e6c229',
  shade: '#a56ee0',
};
const colourOf = (c: string) => CLASS_COLOUR[c] ?? '#8a8f98';

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c);

/** One scatter panel: `pick` is what goes on y. */
function panel(rows: Row[], title: string, pick: (r: Row) => number): string {
  const W = 960;
  const H = 320;
  const pad = { l: 48, r: 16, t: 28, b: 34 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const times = rows.map((r) => Date.parse(r.created_at));
  const t0 = Math.min(...times);
  const t1 = Math.max(...times);
  const xv = (i: number) => (xMode === 'run' ? i : times[i]);
  const x0 = xMode === 'run' ? 0 : t0;
  const x1 = xMode === 'run' ? Math.max(1, rows.length - 1) : Math.max(t0 + 1, t1);
  const X = (v: number) => pad.l + ((v - x0) / (x1 - x0)) * iw;
  const ys = rows.map(pick);
  const ymax = Math.max(10, Math.ceil(Math.max(...ys) / 10) * 10);
  const Y = (v: number) => pad.t + ih - (v / ymax) * ih;

  const parts: string[] = [];
  // horizontal grid
  for (let v = 0; v <= ymax; v += ymax > 60 ? 20 : 10) {
    parts.push(
      `<line x1="${pad.l}" x2="${W - pad.r}" y1="${Y(v)}" y2="${Y(v)}" class="grid"/>`,
      `<text x="${pad.l - 6}" y="${Y(v) + 4}" class="ax" text-anchor="end">${v}</text>`,
    );
  }
  // x labels: dates (time) or run number
  const ticks = 6;
  for (let k = 0; k <= ticks; k++) {
    const v = x0 + ((x1 - x0) * k) / ticks;
    const label =
      xMode === 'run'
        ? String(Math.round(v) + 1)
        : new Date(v).toLocaleString('en-GB', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
    parts.push(
      `<text x="${X(v)}" y="${H - 10}" class="ax" text-anchor="middle">${esc(label)}</text>`,
    );
  }
  // version changes
  let last = '';
  rows.forEach((r, i) => {
    const v = r.game_version ?? '';
    if (v !== last && i > 0 && last !== '') {
      const x = X(xv(i));
      parts.push(
        `<line x1="${x}" x2="${x}" y1="${pad.t}" y2="${pad.t + ih}" class="ver"><title>${esc(v)}</title></line>`,
      );
    }
    last = v;
  });
  // rolling median
  const line = ys
    .map((_, i) => {
      const w = ys.slice(Math.max(0, i - window + 1), i + 1);
      return `${i ? 'L' : 'M'}${X(xv(i)).toFixed(1)},${Y(median(w)).toFixed(1)}`;
    })
    .join(' ');
  parts.push(`<path d="${line}" class="med"/>`);
  // dots
  rows.forEach((r, i) => {
    parts.push(
      `<circle cx="${X(xv(i)).toFixed(1)}" cy="${Y(ys[i]).toFixed(1)}" r="3.6" fill="${colourOf(r.class_id)}" fill-opacity=".8"><title>${esc(
        `${r.class_id} level ${r.level}, map ${r.map}\n${new Date(r.created_at).toLocaleString()}\n${r.game_version ?? ''}`,
      )}</title></circle>`,
    );
  });
  parts.push(`<text x="${pad.l}" y="16" class="ttl">${esc(title)}</text>`);
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}">${parts.join('')}</svg>`;
}

function page(rows: Row[]): string {
  const classes = [...new Set(rows.map((r) => r.class_id))].sort();
  const legend = classes
    .map(
      (c) =>
        `<span><i style="background:${colourOf(c)}"></i>${esc(c)} (${rows.filter((r) => r.class_id === c).length})</span>`,
    )
    .join('');
  const levels = rows.map((r) => r.level);
  const summary = `${rows.length} deaths · median level ${median(levels)} · deepest level ${Math.max(...levels)} (map ${Math.max(...rows.map((r) => r.map))}) · ${new Date(rows[0].created_at).toLocaleDateString()} to ${new Date(rows[rows.length - 1].created_at).toLocaleDateString()}`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Deaths over time</title>
<style>
:root{--bg:#fff;--fg:#1c1f24;--mut:#6b7280;--grid:#e5e7eb}
@media (prefers-color-scheme:dark){:root{--bg:#14171c;--fg:#e6e8eb;--mut:#9aa1ab;--grid:#2a2f37}}
body{margin:0 auto;max-width:1000px;padding:16px;background:var(--bg);color:var(--fg);font:14px system-ui,sans-serif}
h1{font-size:18px;margin:0 0 4px}p{color:var(--mut);margin:0 0 12px}
.legend{display:flex;flex-wrap:wrap;gap:14px;margin:0 0 8px}.legend i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px}
svg{width:100%;height:auto;display:block;margin-bottom:12px}
.grid{stroke:var(--grid)}.ax{fill:var(--mut);font-size:11px}.ttl{fill:var(--fg);font-size:13px;font-weight:600}
.med{fill:none;stroke:var(--fg);stroke-width:2;stroke-opacity:.75}.ver{stroke:var(--mut);stroke-dasharray:3 4;stroke-opacity:.6}
</style></head><body>
<h1>Deaths over time (${esc(table)})</h1>
<p>${esc(summary)}. Line: rolling median of the last ${window} deaths. Dashed ticks: a new game version (hover for its hash). Hover a dot for details.</p>
<div class="legend">${legend}</div>
${panel(rows, 'Character level at death', (r) => r.level)}
${panel(rows, 'Map reached at death', (r) => r.map)}
</body></html>`;
}

try {
  const all = (await load())
    .filter((r) => (r.outcome ?? 'died') === 'died')
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  if (all.length === 0) {
    console.log('No deaths to plot.');
  } else {
    writeFileSync(out, page(all));
    console.log(`${all.length} deaths -> ${out}`);
  }
} catch (e) {
  console.error((e as Error).message);
  process.exitCode = 1;
}
