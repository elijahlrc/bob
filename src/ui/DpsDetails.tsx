import { useState } from 'preact/hooks';
import { dpsBreakdown, type BreakdownRole, type BreakdownRow } from '../calc/breakdown';
import type { Character, Scenario } from '../calc/character';
import { TypeBar } from './TypeBar';

const ROLE_NAMES: Record<BreakdownRole, string> = {
  main: 'Main',
  periodic: 'Periodic',
  weapon: 'Weapon',
  trigger: 'Triggered',
  minion: 'Minions',
  clone: 'Clones',
};
const SCENARIO_NAMES: Record<Scenario, string> = { pack: 'Against a pack', boss: 'Against a boss' };

const f0 = (v: number) => Math.round(v).toLocaleString();
const pct = (v: number) => `${Math.round(v * 100)}%`;
const dash = (v: number, text: string) => (v < 0.5 ? '–' : text);
const hitsOf = (r: BreakdownRow) => r.perType.reduce((a, v) => a + v, 0);

/** How often a skill is used: a second's worth, or the seconds between uses when it is less than one a second. */
function often(perSec: number): string {
  if (perSec <= 0) return '–';
  return perSec >= 1 ? `${perSec.toFixed(1)}/s` : `every ${(1 / perSec).toFixed(1)}s`;
}

/**
 * The calculation behind the two DPS figures of the Strategy tab (the owner, 2026-10-26): each skill the rotation uses, how often,
 * and the damage it is expected to deal a second, its hits as a bar by type (a type's damage on a hover or a tap), then each
 * summon skill's minions and each skill's clones. Closed until asked for; the figures are those of the sheet.
 */
export function DpsDetails({ ch }: { ch: Character }) {
  const [open, setOpen] = useState(false);
  const [scenario, setScenario] = useState<Scenario>('pack');
  const sc = ch.sheet().scenarios;
  const both = !!sc && Math.abs(sc.pack - sc.boss) > 0.5;
  const shown: Scenario = both ? scenario : 'pack';
  const b = open ? dpsBreakdown(ch, shown) : null;
  const all = b ? [...b.rows, ...b.minions] : [];
  // Each bar's length is its hits against the largest row's.
  const top = Math.max(0, ...all.map(hitsOf));
  const overTime = !!b && b.rows.some((r) => r.overTime >= 0.5);
  const totals = [0, 0, 0, 0, 0];
  for (const r of all) r.perType.forEach((v, k) => (totals[k] += v));
  const skill = (r: BreakdownRow) => r.role !== 'minion' && r.role !== 'clone';
  return (
    <details
      class="lf-panel st-group st-calc"
      data-paint="panel"
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary class="lf-h">Damage details</summary>
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
                  <th class="st-calc-bar">Hits by type</th>
                  {overTime && <th>Over time</th>}
                  <th>DPS</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {all.map((r) => (
                  <tr key={r.key}>
                    <td>
                      {r.name}
                      <small>{ROLE_NAMES[r.role]}</small>
                    </td>
                    <td>{skill(r) ? often(r.usesPerSec) : '–'}</td>
                    <td>{r.hitsPerUse > 0 ? r.hitsPerUse.toFixed(1) : '–'}</td>
                    <td>{skill(r) ? f0(r.avgHit) : '–'}</td>
                    <td>{skill(r) ? pct(r.hitChance) : '–'}</td>
                    <td>{skill(r) ? pct(r.critChance) : '–'}</td>
                    <td class="st-calc-bar">
                      <TypeBar dmg={r.perType} scale={top > 0 ? hitsOf(r) / top : 0} />
                    </td>
                    {overTime && <td>{dash(r.overTime, f0(r.overTime))}</td>}
                    <td>{f0(r.dps)}</td>
                    <td>{pct(r.share)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td />
                  <td />
                  <td />
                  <td />
                  <td />
                  <td class="st-calc-bar">
                    <TypeBar dmg={totals} />
                  </td>
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
