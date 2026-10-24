import { useMemo } from 'preact/hooks';
import { scenarioDps, type Character, type CharacterSheet } from '../calc/character';
import { statTotals, type StatTotal } from '../calc/statTotals';
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

const SMALL = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'by',
  'for',
  'from',
  'in',
  'of',
  'on',
  'over',
  'to',
  'while',
  'with',
]);
/** A modifier's name in the tab's title case ("Life Regeneration Rate"), whatever case its stat text has. */
const titled = (s: string) =>
  s
    .split(' ')
    .map((w, i) =>
      i > 0 && SMALL.has(w.toLowerCase())
        ? w.toLowerCase()
        : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join(' ');

function Totals({ list }: { list: StatTotal[] }) {
  if (list.length === 0) return null;
  return (
    <div class="cs-totals">
      {list.map((t) => (
        <Row key={modLabel(t.mod)} label={titled(modLabel(t.mod))} value={times(t.mult)} />
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
  const move = totals.find((t) => t.mod.stat === 'moveSpeed' && !t.mod.condition);
  const sc = s.scenarios;
  const big = (label: string, value: number, of?: number) => (
    <div class="cs-big">
      <span class="cs-label">{label}</span>
      <b>{f0(value)}</b>
      {of !== undefined && <span class="cs-raw">of {f0(of)}</span>}
    </div>
  );
  return (
    <div class="cs">
      <div class="cs-top">
        <div class="cs-group">
          {big('Life', s.life - s.reservedLife, s.reservedLife > 0 ? s.life : undefined)}
          {big('Energy Shield', s.es)}
          {big('Mana', s.mana - s.reservedMana, s.mana)}
        </div>
        <div class="cs-group">
          {big('Strength', s.attrs.str)}
          {big('Dexterity', s.attrs.dex)}
          {big('Intelligence', s.attrs.int)}
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
          <Row label="Chance to Block Spells" value={pct(s.blockSpell)} />
          <div class="cs-res">
            {RES.map(([i, name, cls]) => (
              <div key={cls} class={`cs-res-${cls}`}>
                <span>{name}</span>
                <b class={s.res[i] < s.maxRes[i] ? 'cs-under' : ''}>{s.res[i]}%</b>
                <span class="cs-raw">max {s.maxRes[i]}%</span>
              </div>
            ))}
          </div>
          <Row label="Life Regeneration" value={`${f1(s.lifeRegen)}/s`} />
          <Row label="Mana Regeneration" value={`${f1(s.manaRegen)}/s`} />
          <Row label="Chance to Avoid Stuns" value={pct(s.stunAvoid)} />
          <Totals list={of('defence')} />
        </div>
        <div class="cs-col">
          <Totals list={of('offence')} />
          {s.hexes.map((h) => (
            <Row key={h.id} label={HEXES[h.id].name} value={hexText(h.id, h.effect)} />
          ))}
          <Row
            label="Movement Speed"
            value={`${f1(s.moveSpeed)} tiles/s`}
            raw={times(move?.mult ?? 1)}
          />
          <Totals list={of('other').filter((t) => t !== move)} />
        </div>
      </div>
      {s.warnings.map((w) => (
        <div key={w} class="warn cs-warn">
          ⚠ {w}
        </div>
      ))}
      <div class="cs-est">
        <span>
          Estimated DPS <b>{f0(sc ? sc.pack : scenarioDps(s))}</b>
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
