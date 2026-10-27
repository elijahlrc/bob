import { DAMAGE_TYPES } from '../mods/types';
import type { LedgerRow, MapReport } from '../sim/ledger';
import { TypeBar } from './TypeBar';

const f0 = (v: number) => Math.round(v).toLocaleString();
const pct = (v: number) => `${v >= 10 ? Math.round(v) : v.toFixed(1)}%`;
const sum = (d: number[]) => d[0] + d[1] + d[2] + d[3] + d[4];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** A big number short enough for a medallion: 9,876, 12.3k, 456k, 1.23M. */
const short = (v: number) => {
  const n = Math.round(v);
  if (n < 10_000) return n.toLocaleString();
  if (n < 1_000_000) return `${n < 100_000 ? (n / 1000).toFixed(1) : Math.round(n / 1000)}k`;
  return `${(n / 1_000_000).toFixed(n < 10_000_000 ? 2 : 1)}M`;
};

/**
 * The ramp of each damage type (physical, lightning, cold, fire, chaos) in the painted bar and the legend's stones, as
 * the offer cards' damage bar paints them (leaf/shapes.ts).
 */
const TYPE_STONE = ['pearl', 'violet', 'teal', 'vermilion', 'green'];

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
              <i
                class="mr-stone"
                data-paint="sep"
                data-stone={TYPE_STONE[i]}
                data-pk={TYPE_STONE[i]}
              />
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
              <th class="mr-opt" title="Average damage a second over the whole map">
                Per second
              </th>
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
                  <td class="num mr-opt">{r.time > 0 ? f0(t / r.time) : '–'}</td>
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

/** What the character took, one row per monster kind or effect, and what it came out of. `who` is what it is called ("you"). */
function Taken({ r, who }: { r: MapReport; who: string }) {
  const rows = r.taken;
  const all = rows.reduce((s, x) => s + sum(x.dmg), 0);
  const top = rows.length ? sum(rows[0].dmg) : 0;
  const { es, mana, life } = r.pools;
  const hitsTaken = rows.reduce((s, x) => s + x.hits, 0);
  const avoided = r.evaded + r.blocked;
  const aimed = hitsTaken + avoided;
  if (all <= 0 && avoided <= 0) return <p class="muted">Nothing hurt {who}.</p>;
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
          {f0(aimed)} attacks were aimed at {who}: {f0(hitsTaken)} landed, {f0(r.evaded)} missed{' '}
          {who} and {f0(r.blocked)} were blocked ({pct((avoided / aimed) * 100)} avoided).
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

/**
 * The map report: what each skill dealt, by damage type, and what hurt the character. `who` is what the character is called
 * (the report of a duel's rival says its name); the default is "you".
 */
export function MapReportView({
  r,
  title,
  who = 'you',
}: {
  r: MapReport;
  title?: string;
  who?: string;
}) {
  const dealt = r.dealt.reduce((s, x) => s + sum(x.dmg), 0);
  const taken = r.taken.reduce((s, x) => s + sum(x.dmg), 0);
  /** One of the few big numbers at the top: a medallion with its name and value. */
  const medal = (label: string, value: string, field = 'lapis,4') => (
    <div class="mr-medal" data-paint="medal" data-field={field} data-medal="big" data-pk={label}>
      <span class="mr-medal-label">{label}</span>
      <b>{value}</b>
    </div>
  );
  return (
    <div class="mreport">
      {title && <h3 class="mr-title">{title}</h3>}
      <div class="mr-medals">
        {medal('Time', `${r.time.toFixed(0)} s`, 'green,4')}
        {medal('Dealt', short(dealt))}
        {r.time > 0 && medal('Per second', short(dealt / r.time))}
        {medal('Took', short(taken), 'vermilion,4')}
      </div>
      <div class="mr-panel" data-paint="panel">
        <h4 class="lf-h">Damage {who} dealt</h4>
        <Dealt r={r} />
      </div>
      <div class="mr-panel" data-paint="panel">
        <h4 class="lf-h">Damage {who} took</h4>
        <Taken r={r} who={who} />
      </div>
    </div>
  );
}
