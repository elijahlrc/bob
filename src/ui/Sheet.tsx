import type { CharacterSheet } from '../calc/character';
import { HEXES, hexText } from '../data/hexes';

const f0 = (v: number) => Math.round(v).toLocaleString();
const f1 = (v: number) => (Math.round(v * 10) / 10).toLocaleString();
const f2 = (v: number) => (Math.round(v * 100) / 100).toLocaleString();
const slotLabel = (slot: string) => {
  const words = slot
    .replace(/([A-Z])/g, ' $1')
    .replace(/(\d)/, ' $1')
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};
const pct = (v: number) => `${f1(v * 100)}%`;

export function Sheet({ s }: { s: CharacterSheet }) {
  const k = s.skill;
  const rows: [string, string][] = [
    ['Level', String(s.level)],
    ['Strength / Dexterity / Intelligence', `${s.attrs.str} / ${s.attrs.dex} / ${s.attrs.int}`],
    ['Life', `${f0(s.life - s.reservedLife)} / ${f0(s.life)}`],
    ['Mana (unreserved)', `${f0(s.mana - s.reservedMana)} / ${f0(s.mana)}`],
    ['Energy shield', f0(s.es)],
    ['Armour', f0(s.armour)],
    ['Evasion', f0(s.evasion)],
    ['Block (attack / spell)', `${pct(s.blockAttack)} / ${pct(s.blockSpell)}`],
    [
      'Resistances (fire / cold / lightning / chaos)',
      `${s.res[3]}% / ${s.res[2]}% / ${s.res[1]}% / ${s.res[4]}%`,
    ],
    ['Stun threshold / avoid', `${f0(s.stunThreshold)} / ${pct(s.stunAvoid)}`],
    ['Life regen / mana regen', `${f1(s.lifeRegen)}/s / ${f1(s.manaRegen)}/s`],
    ['Movement speed', `${f1(s.moveSpeed)} tiles/s`],
    ['Effective HP (vs area monsters)', f0(s.ehp)],
  ];
  const skill: [string, string][] = [
    ['Skill', `${k.name}${k.isDefault ? ' (default attack)' : ''}`],
    ...(k.note ? ([['', k.note]] as [string, string][]) : []),
    ['Average hit', f1(k.avgHit)],
    ['Uses per second', f1(k.usesPerSec)],
    ['Crit chance / multiplier', `${pct(k.critChance)} / ${pct(k.critMulti)}`],
    ['Hit chance', pct(k.hitChance)],
    ['Stun chance', pct(k.stunChance)],
    ['Mana cost', String(k.cost)],
    ['Hit DPS', f1(k.hitDps)],
    ['Ignite / bleed / poison DPS', `${f1(k.igniteDps)} / ${f1(k.bleedDps)} / ${f1(k.poisonDps)}`],
    ['Debuff damage over time DPS', f1(k.dotDps)],
    ['Total DPS', f1(k.totalDps)],
  ];
  return (
    <div class="sheet">
      <table>
        <tbody>
          {rows.map(([a, b]) => (
            <tr key={a}>
              <td>{a}</td>
              <td>{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table>
        <tbody>
          {skill.map(([a, b]) => (
            <tr key={a}>
              <td>{a}</td>
              <td>{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {s.scenarios && s.scenarios.pack !== s.scenarios.boss && (
        <table class="triggered">
          <tbody>
            <tr>
              <td colSpan={2}>
                <b>Rotation by fight</b>{' '}
                <span class="muted">(some skills wait for a kind of fight: Strategy tab)</span>
              </td>
            </tr>
            <tr>
              <td>Total DPS against a pack</td>
              <td>{f1(s.scenarios.pack)}</td>
            </tr>
            <tr>
              <td>Total DPS against a boss</td>
              <td>{f1(s.scenarios.boss)}</td>
            </tr>
          </tbody>
        </table>
      )}
      {s.secondary.length > 0 && (
        <table class="triggered">
          <tbody>
            <tr>
              <td colSpan={2}>
                <b>Periodic skills</b> <span class="muted">(used every so often)</span>
              </td>
            </tr>
            {s.secondary.map((t) => (
              <tr key={t.key}>
                <td>{t.skill.name}</td>
                <td>
                  every {f1(1 / t.usesPerSec)} s · {f1(t.dps)} DPS · {f1(t.manaPerSec)} mana/s
                </td>
              </tr>
            ))}
            <tr>
              <td>Total DPS with periodic skills</td>
              <td>{f1(k.totalDps + s.secondaryDps + s.triggeredDps)}</td>
            </tr>
          </tbody>
        </table>
      )}
      {s.hexes.length > 0 && (
        <table class="triggered">
          <tbody>
            <tr>
              <td colSpan={2}>
                <b>Hexes on enemies you hit</b>
              </td>
            </tr>
            {s.hexes.map((h) => (
              <tr key={h.id}>
                <td>{HEXES[h.id].name}</td>
                <td>{hexText(h.id, h.effect)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {s.triggered.length > 0 && (
        <table class="triggered">
          <tbody>
            <tr>
              <td colSpan={2}>
                <b>Triggered skills</b>
              </td>
            </tr>
            {s.triggered.map((t) => (
              <tr key={t.key + t.skill.id}>
                <td>
                  {t.skill.name} <span class="muted">({slotLabel(t.source)})</span>
                </td>
                <td>
                  {f2(t.usesPerSec)}/s · {f1(t.dps)} DPS · {f1(t.manaPerSec)} mana/s
                </td>
              </tr>
            ))}
            <tr>
              <td>Total DPS with triggered skills</td>
              <td>{f1(k.totalDps + s.triggeredDps + s.secondaryDps)}</td>
            </tr>
          </tbody>
        </table>
      )}
      {s.auras.length > 0 && (
        <div class="auras">
          {s.auras.map((a) => (
            <div key={a.name} class={a.active ? '' : 'warn'}>
              {a.name}: reserves {a.reserved} {a.active ? '' : '— inactive (not enough mana)'}
            </div>
          ))}
        </div>
      )}
      {s.warnings.map((w) => (
        <div key={w} class="warn">
          ⚠ {w}
        </div>
      ))}
    </div>
  );
}
