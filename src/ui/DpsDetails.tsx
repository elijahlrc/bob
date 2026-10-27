import { useState } from 'preact/hooks';
import { dpsBreakdown, type BreakdownRole } from '../calc/breakdown';
import type { Character, Scenario } from '../calc/character';

const TYPE_NAMES = ['Physical', 'Lightning', 'Cold', 'Fire', 'Chaos'];
const ROLE_NAMES: Record<BreakdownRole, string> = {
  main: 'Main',
  periodic: 'Periodic',
  weapon: 'Weapon',
  trigger: 'Triggered',
};
const SCENARIO_NAMES: Record<Scenario, string> = { pack: 'Against a pack', boss: 'Against a boss' };

const f0 = (v: number) => Math.round(v).toLocaleString();
const pct = (v: number) => `${Math.round(v * 100)}%`;
const dash = (v: number, text: string) => (v < 0.5 ? '–' : text);

/** How often a skill is used: a second's worth, or the seconds between uses when it is less than one a second. */
function often(perSec: number): string {
  if (perSec <= 0) return '–';
  return perSec >= 1 ? `${perSec.toFixed(1)}/s` : `every ${(1 / perSec).toFixed(1)}s`;
}

/**
 * The calculation behind the two DPS figures of the Strategy tab (the owner, 2026-10-26): each skill the rotation uses, how often,
 * and the damage it is expected to deal a second, by type. Closed until asked for; the figures are those of the sheet.
 */
export function DpsDetails({ ch }: { ch: Character }) {
  const [open, setOpen] = useState(false);
  const [scenario, setScenario] = useState<Scenario>('pack');
  const sc = ch.sheet().scenarios;
  const both = !!sc && Math.abs(sc.pack - sc.boss) > 0.5;
  const shown: Scenario = both ? scenario : 'pack';
  const b = open ? dpsBreakdown(ch, shown) : null;
  // Only the types that deal damage get a column.
  const types = b
    ? TYPE_NAMES.map((_, k) => k).filter((k) => b.rows.some((r) => r.perType[k] >= 0.5))
    : [];
  const overTime = !!b && b.rows.some((r) => r.overTime >= 0.5);
  return (
    <details
      class="lf-panel st-group st-calc"
      data-paint="panel"
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary class="lf-h">Damage in detail</summary>
      {b && (
        <>
          {both && (
            <div class="st-calc-tabs">
              {(['pack', 'boss'] as Scenario[]).map((s) => (
                <button
                  key={s}
                  class={'btn small' + (s === shown ? ' on' : '')}
                  onClick={() => setScenario(s)}
                >
                  {SCENARIO_NAMES[s]}
                </button>
              ))}
            </div>
          )}
          <div class="st-calc-scroll">
            <table class="st-calc-table">
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>Used</th>
                  <th>Hits/use</th>
                  <th>Hit</th>
                  <th>Lands</th>
                  <th>Crit</th>
                  {types.map((k) => (
                    <th key={k}>{TYPE_NAMES[k]}</th>
                  ))}
                  {overTime && <th>Over time</th>}
                  <th>DPS</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {b.rows.map((r) => (
                  <tr key={r.key}>
                    <td>
                      {r.name}
                      <small>{ROLE_NAMES[r.role]}</small>
                    </td>
                    <td>{often(r.usesPerSec)}</td>
                    <td>{r.hitsPerUse > 0 ? r.hitsPerUse.toFixed(1) : '–'}</td>
                    <td>{f0(r.avgHit)}</td>
                    <td>{pct(r.hitChance)}</td>
                    <td>{pct(r.critChance)}</td>
                    {types.map((k) => (
                      <td key={k}>{dash(r.perType[k], f0(r.perType[k]))}</td>
                    ))}
                    {overTime && <td>{dash(r.overTime, f0(r.overTime))}</td>}
                    <td>{f0(r.dps)}</td>
                    <td>{pct(r.share)}</td>
                  </tr>
                ))}
                {b.minions >= 0.5 && (
                  <tr>
                    <td>
                      Minions and clones<small>Standing beside you</small>
                    </td>
                    <td />
                    <td />
                    <td />
                    <td />
                    <td />
                    {types.map((k) => (
                      <td key={k} />
                    ))}
                    {overTime && <td />}
                    <td>{f0(b.minions)}</td>
                    <td>{pct(b.total > 0 ? b.minions / b.total : 0)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td />
                  <td />
                  <td />
                  <td />
                  <td />
                  {types.map((k) => (
                    <td key={k}>{f0(b.rows.reduce((a, r) => a + r.perType[k], 0))}</td>
                  ))}
                  {overTime && <td>{f0(b.rows.reduce((a, r) => a + r.overTime, 0))}</td>}
                  <td>{f0(b.total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
          <p class="st-calc-note">
            For one target. Used counts the shots of a totem or trap. Hit is the average hit; Lands
            is the chance it lands.
          </p>
        </>
      )}
    </details>
  );
}
