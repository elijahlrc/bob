import type { CharacterSheet } from '../calc/character';

const f0 = (v: number) => Math.round(v).toLocaleString();
const f1 = (v: number) => (Math.round(v * 10) / 10).toLocaleString();
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
    ['Average hit', f1(k.avgHit)],
    ['Uses per second', f1(k.usesPerSec)],
    ['Crit chance / multiplier', `${pct(k.critChance)} / ${pct(k.critMulti)}`],
    ['Hit chance', pct(k.hitChance)],
    ['Stun chance', pct(k.stunChance)],
    ['Mana cost', String(k.cost)],
    ['Hit DPS', f1(k.hitDps)],
    ['Ignite / bleed / poison DPS', `${f1(k.igniteDps)} / ${f1(k.bleedDps)} / ${f1(k.poisonDps)}`],
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
