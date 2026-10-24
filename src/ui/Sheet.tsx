import { useMemo } from 'preact/hooks';
import type { Character, CharacterSheet } from '../calc/character';
import { statTotals, type StatTotal } from '../calc/statTotals';
import { DEFAULT_MAX_RES } from '../data/constants';
import { HEXES, hexText } from '../data/hexes';
import { modLabel } from '../mods/text';

const f0 = (v: number) => Math.round(v).toLocaleString();
const f1 = (v: number) => (Math.round(v * 10) / 10).toLocaleString();
const pct = (v: number) => `${Math.round(v * 100)}%`;
const times = (v: number) => `×${v.toFixed(2)}`;

/** The resistances in the order the tiles show them: index into `res` / `maxRes`, name, and colour class. */
const RES: [number, string, string][] = [
  [3, 'Fire', 'fire'],
  [2, 'Cold', 'cold'],
  [1, 'Lightning', 'lightning'],
  [4, 'Chaos', 'chaos'],
];

function Row({ label, value, raw }: { label: string; value: string; raw?: string }) {
  return (
    <div class="cs-row">
      <span class="cs-label">{label}</span>
      <span class="cs-value">
        {raw && <span class="cs-raw">{raw}</span>}
        {value}
      </span>
    </div>
  );
}

function Totals({ list }: { list: StatTotal[] }) {
  if (list.length === 0) return null;
  return (
    <div class="cs-totals">
      {list.map((t) => (
        <Row key={modLabel(t.mod)} label={modLabel(t.mod)} value={times(t.mult)} />
      ))}
    </div>
  );
}

/**
 * The Character tab (DESIGN.md Appendix A, 2026-10-23): the character's own numbers across the top, then defence on the left and
 * offence on the right, each as what it is worth (armour as physical damage taken off, evasion as the chance to evade) and the
 * character's modifiers summed per stat. The estimates worked out from all of it come last.
 */
export function Sheet({ s, ch }: { s: CharacterSheet; ch: Character }) {
  const totals = useMemo(() => statTotals(ch.db, ch.configConds, ch.statValue), [ch]);
  const mit = useMemo(() => ch.mitigation(), [ch]);
  const of = (g: StatTotal['group']) => totals.filter((t) => t.group === g);
  const freeMana = s.mana - s.reservedMana;
  const sc = s.scenarios;
  return (
    <div class="cs">
      <div class="cs-top">
        <div class="cs-group">
          <div class="cs-big">
            <span class="cs-label">Life</span>
            <b>{f0(s.life - s.reservedLife)}</b>
            {s.reservedLife > 0 && <span class="cs-raw">of {f0(s.life)}</span>}
          </div>
          {s.es > 0 && (
            <div class="cs-big">
              <span class="cs-label">Energy Shield</span>
              <b>{f0(s.es)}</b>
            </div>
          )}
          <div class="cs-big">
            <span class="cs-label">Mana</span>
            <b>{f0(freeMana)}</b>
            {s.reservedMana > 0 && <span class="cs-raw">of {f0(s.mana)}</span>}
          </div>
        </div>
        <div class="cs-group">
          <div class="cs-big">
            <span class="cs-label">Strength</span>
            <b>{s.attrs.str}</b>
          </div>
          <div class="cs-big">
            <span class="cs-label">Dexterity</span>
            <b>{s.attrs.dex}</b>
          </div>
          <div class="cs-big">
            <span class="cs-label">Intelligence</span>
            <b>{s.attrs.int}</b>
          </div>
        </div>
      </div>
      <div class="cs-cols">
        <div class="cs-col">
          <Row
            label="Physical Damage Reduction"
            value={pct(mit.physReduction)}
            raw={`${f0(s.armour)} armour`}
          />
          <Row
            label="Chance to Evade Attacks"
            value={pct(mit.evade)}
            raw={`${f0(s.evasion)} evasion`}
          />
          <Row label="Chance to Block Attacks" value={pct(s.blockAttack)} />
          {s.blockSpell > 0 && <Row label="Chance to Block Spells" value={pct(s.blockSpell)} />}
          <div class="cs-res">
            {RES.map(([i, name, cls]) => (
              <div key={cls} class={`cs-res-${cls}`}>
                <span>{name}</span>
                <b class={s.res[i] < s.maxRes[i] ? 'cs-under' : ''}>{s.res[i]}%</b>
                {s.maxRes[i] !== DEFAULT_MAX_RES && <span class="cs-raw">max {s.maxRes[i]}%</span>}
              </div>
            ))}
          </div>
          <Row label="Life Regeneration" value={`${f1(s.lifeRegen)}/s`} />
          <Row label="Mana Regeneration" value={`${f1(s.manaRegen)}/s`} />
          {s.stunAvoid > 0 && <Row label="Chance to Avoid Stuns" value={pct(s.stunAvoid)} />}
          <Totals list={of('defence')} />
        </div>
        <div class="cs-col">
          <Totals list={of('offence')} />
          {s.hexes.map((h) => (
            <Row key={h.id} label={HEXES[h.id].name} value={hexText(h.id, h.effect)} />
          ))}
        </div>
      </div>
      <div class="cs-foot">
        <Row label="Movement Speed" value={`${f1(s.moveSpeed)} tiles/s`} />
        <Totals list={of('other').filter((t) => t.mod.stat !== 'moveSpeed')} />
        {s.auras.map((a) => (
          <Row
            key={a.name}
            label={a.name}
            value={a.active ? `reserves ${a.reserved}` : 'inactive: not enough mana'}
          />
        ))}
        {s.warnings.map((w) => (
          <div key={w} class="warn">
            ⚠ {w}
          </div>
        ))}
      </div>
      <div class="cs-est">
        <span>
          Estimated DPS <b>{f0(sc ? sc.pack : s.skill.totalDps)}</b>
          {sc && sc.boss !== sc.pack && (
            <>
              {' '}
              against packs, <b>{f0(sc.boss)}</b> against bosses
            </>
          )}
        </span>
        <span>
          Effective HP <b>{f0(s.ehp)}</b>
        </span>
      </div>
    </div>
  );
}
