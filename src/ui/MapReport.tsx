import { DAMAGE_TYPES } from '../mods/types';
import type { LedgerRow, MapReport } from '../sim/ledger';

const f0 = (v: number) => Math.round(v).toLocaleString();
const pct = (v: number) => `${v >= 10 ? Math.round(v) : v.toFixed(1)}%`;
const sum = (d: number[]) => d[0] + d[1] + d[2] + d[3] + d[4];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Colour of each damage type (physical, lightning, cold, fire, chaos), the same as the numbers over the monsters. */
const TYPE_COLOR = ['#eadfc8', '#c89cff', '#9ad8ff', '#ff9a40', '#9ae05a'];

/** A bar split by damage type; `scale` is how much of the full width the whole bar takes (1 for the largest row). */
function TypeBar({ dmg, scale = 1 }: { dmg: number[]; scale?: number }) {
  const total = sum(dmg);
  if (total <= 0) return <div class="mr-bar" />;
  return (
    <div class="mr-bar">
      <div class="mr-fill" style={{ width: `${Math.max(1, scale * 100)}%` }}>
        {dmg.map((d, i) =>
          d > 0 ? (
            <span
              key={i}
              style={{ width: `${(d / total) * 100}%`, background: TYPE_COLOR[i] }}
              title={`${cap(DAMAGE_TYPES[i])} ${f0(d)} (${pct((d / total) * 100)})`}
            />
          ) : null,
        )}
      </div>
    </div>
  );
}

/** The damage of a whole side by type: one bar and a legend of the types that appear. */
function TypeSplit({ rows }: { rows: LedgerRow[] }) {
  const dmg = [0, 0, 0, 0, 0];
  for (const r of rows) for (let i = 0; i < 5; i++) dmg[i] += r.dmg[i];
  const total = sum(dmg);
  if (total <= 0) return null;
  return (
    <div class="mr-split">
      <TypeBar dmg={dmg} />
      <div class="mr-legend">
        {dmg.map((d, i) =>
          d > 0 ? (
            <span key={i}>
              <i style={{ background: TYPE_COLOR[i] }} />
              {cap(DAMAGE_TYPES[i])} {pct((d / total) * 100)}
            </span>
          ) : null,
        )}
      </div>
    </div>
  );
}

const KIND_TAG: Record<string, string> = {
  minion: 'minion',
  ailment: 'ailment',
};

function Name({ r }: { r: LedgerRow }) {
  const tag = KIND_TAG[r.kind];
  return (
    <td class="mr-name">
      {r.name}
      {tag && <span class="muted"> ({tag})</span>}
    </td>
  );
}

/** What the character dealt, one row per skill, minion or ailment. */
function Dealt({ r }: { r: MapReport }) {
  const rows = r.dealt;
  const all = rows.reduce((s, x) => s + sum(x.dmg), 0);
  const top = rows.length ? sum(rows[0].dmg) : 0;
  if (all <= 0) return <p class="muted">No damage was dealt.</p>;
  return (
    <>
      <TypeSplit rows={rows} />
      <div class="mr-scroll">
        <table class="mr-table">
          <thead>
            <tr>
              <th>Source</th>
              <th class="mr-opt" />
              <th>Damage</th>
              <th>Share</th>
              <th title="Average damage a second over the whole map">Per second</th>
              <th class="mr-opt">Hits</th>
              <th>Crit</th>
              <th title="The biggest single hit">Biggest</th>
              <th class="mr-opt" title="Attacks that missed or were turned aside">
                Missed
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => {
              const t = sum(x.dmg);
              const tries = x.hits + x.misses;
              return (
                <tr key={`${x.kind}${x.name}`}>
                  <Name r={x} />
                  <td class="mr-barcell mr-opt">
                    <TypeBar dmg={x.dmg} scale={top > 0 ? t / top : 0} />
                  </td>
                  <td class="num">{f0(t)}</td>
                  <td class="num">{pct((t / all) * 100)}</td>
                  <td class="num">{r.time > 0 ? f0(t / r.time) : '–'}</td>
                  <td class="num mr-opt">{x.hits > 0 ? f0(x.hits) : '–'}</td>
                  <td class="num">{x.hits > 0 ? pct((x.crits / x.hits) * 100) : '–'}</td>
                  <td class="num">{x.max > 0 ? f0(x.max) : '–'}</td>
                  <td class="num mr-opt">{x.misses > 0 ? pct((x.misses / tries) * 100) : '–'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** What the character took, one row per monster kind or effect, and what it came out of. */
function Taken({ r }: { r: MapReport }) {
  const rows = r.taken;
  const all = rows.reduce((s, x) => s + sum(x.dmg), 0);
  const top = rows.length ? sum(rows[0].dmg) : 0;
  const { es, mana, life } = r.pools;
  const hitsTaken = rows.reduce((s, x) => s + x.hits, 0);
  const avoided = r.evaded + r.blocked;
  const aimed = hitsTaken + avoided;
  if (all <= 0 && avoided <= 0) return <p class="muted">Nothing hurt you.</p>;
  return (
    <>
      <TypeSplit rows={rows} />
      {all > 0 && (
        <p class="muted mr-line">
          {es <= 0 && mana <= 0
            ? 'All of it came out of life.'
            : `It came out of ${[
                es > 0 && `energy shield ${pct((es / all) * 100)}`,
                mana > 0 && `mana ${pct((mana / all) * 100)}`,
                `life ${pct((life / all) * 100)}`,
              ]
                .filter(Boolean)
                .join(', ')}.`}
        </p>
      )}
      {aimed > 0 && (
        <p class="muted mr-line">
          {f0(aimed)} attacks were aimed at you: {f0(hitsTaken)} landed, {f0(r.evaded)} missed you
          and {f0(r.blocked)} were blocked ({pct((avoided / aimed) * 100)} avoided).
        </p>
      )}
      {all > 0 && (
        <div class="mr-scroll">
          <table class="mr-table">
            <thead>
              <tr>
                <th>Source</th>
                <th class="mr-opt" />
                <th>Damage</th>
                <th>Share</th>
                <th class="mr-opt">Hits</th>
                <th title="The biggest single hit">Biggest</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x) => {
                const t = sum(x.dmg);
                return (
                  <tr key={`${x.kind}${x.name}`}>
                    <Name r={x} />
                    <td class="mr-barcell mr-opt">
                      <TypeBar dmg={x.dmg} scale={top > 0 ? t / top : 0} />
                    </td>
                    <td class="num">{f0(t)}</td>
                    <td class="num">{pct((t / all) * 100)}</td>
                    <td class="num mr-opt">{x.hits > 0 ? f0(x.hits) : '–'}</td>
                    <td class="num">{x.max > 0 ? f0(x.max) : '–'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/** The map report: what each skill dealt, by damage type, and what hurt the character. */
export function MapReportView({ r, title }: { r: MapReport; title?: string }) {
  const dealt = r.dealt.reduce((s, x) => s + sum(x.dmg), 0);
  const taken = r.taken.reduce((s, x) => s + sum(x.dmg), 0);
  return (
    <div class="mreport">
      {title && <h3>{title}</h3>}
      <p class="muted">
        {r.time.toFixed(0)} s · dealt {f0(dealt)}
        {r.time > 0 && ` (${f0(dealt / r.time)} a second)`} · took {f0(taken)}
      </p>
      <h4>Damage you dealt</h4>
      <Dealt r={r} />
      <h4>Damage you took</h4>
      <Taken r={r} />
    </div>
  );
}
