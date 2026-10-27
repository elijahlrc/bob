import { toChildArray, type ComponentChildren } from 'preact';
import { useMemo } from 'preact/hooks';
import { scenarioDps, type Character, type CharacterSheet } from '../calc/character';
import { statTotals, type StatTotal, type TotalSection } from '../calc/statTotals';
import { HEXES, hexText } from '../data/hexes';
import { GLOSSARY, glossFor } from '../data/glossary';
import { modLabel } from '../mods/text';
import type { Mod } from '../mods/types';
import { infoProps } from './info';

const f0 = (v: number) => Math.round(v).toLocaleString();
const f1 = (v: number) => (Math.round(v * 10) / 10).toLocaleString();
const pct = (v: number) => `${Math.round(v * 100)}%`;
const times = (v: number) => `×${v.toFixed(2)}`;

/** The ramp each medallion is painted in (leaf/ramps.ts), by its class. */
const FIELD: Record<string, string> = {
  'cs-life': 'vermilion,4',
  'cs-es': 'sky,4',
  'cs-mana': 'lapis,4',
  'cs-str': 'vermilion,3',
  'cs-dex': 'green,4',
  'cs-int': 'lapis,5',
  'cs-res-fire': 'vermilion,5',
  'cs-res-cold': 'teal,4',
  'cs-res-lightning': 'straw,4',
  'cs-res-chaos': 'porphyry,4',
};
const POOLS = new Set(['cs-life', 'cs-es', 'cs-mana']);

/** The resistances in the order the tiles show them: index into `res` / `maxRes`, name, and colour class. */
const RES: [number, string, string][] = [
  [3, 'Fire', 'fire'],
  [2, 'Cold', 'cold'],
  [1, 'Lightning', 'lightning'],
  [4, 'Chaos', 'chaos'],
];

function Row({
  label,
  value,
  raw,
  tip,
}: {
  label: string;
  value: string;
  raw?: string;
  /** What the line is, in plain words (docs/NEWPLAYER.md N13). */
  tip?: string;
}) {
  return (
    <div
      class={'cs-row' + (value === '×1.00' ? ' def' : '') + (tip ? ' tipped' : '')}
      {...infoProps(tip)}
    >
      <span class="cs-label">{label}</span>
      <span class="cs-value">
        {raw && <span class="cs-raw">{raw}</span>}
        {value}
      </span>
    </div>
  );
}

/** What an attribute gives, as a chip: "+84 Life", "+12% Energy Shield". */
const effectText = (m: Mod) => {
  const v = Math.round(m.value * 10) / 10;
  return `+${v.toLocaleString()}${m.kind === 'inc' ? '%' : ''} ${modLabel({ ...m, kind: 'base' })
    .replace(/^Maximum /, '')
    .replace(/ Rating$/, '')}`;
};

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

const totalRow = (t: StatTotal) => (
  <Row
    key={modLabel(t.mod)}
    label={titled(modLabel(t.mod))}
    value={times(t.mult)}
    tip={glossFor(t.mod.stat)}
  />
);

/** One section of a column: a small heading and its rows; nothing at all when it has no rows. */
function Section({
  title,
  tip,
  children,
}: {
  title: string;
  tip?: string;
  children: ComponentChildren;
}) {
  const rows = toChildArray(children);
  if (rows.length === 0) return null;
  return (
    <section class="cs-section">
      <h4 class={'lf-h' + (tip ? ' tipped' : '')} {...infoProps(tip)}>
        {title}
      </h4>
      {rows}
    </section>
  );
}

/**
 * The Character tab (DESIGN.md Appendix A, 2026-10-23): the character's own numbers across the top, then defence on the left and
 * offence on the right in sections, each stat as what it is worth (armour as physical damage taken off, evasion as the chance
 * to evade) beside the character's modifiers to it, summed per line. The estimates worked out from all of it come last.
 */
export function Sheet({ s, ch }: { s: CharacterSheet; ch: Character }) {
  const totals = useMemo(() => statTotals(ch.db, ch.configConds, ch.statValue), [ch]);
  const mit = useMemo(() => ch.mitigation(), [ch]);
  const of = (id: TotalSection) => totals.filter((t) => t.section === id);
  /** The plain line of a stat (no tags, no condition), which sits beside what the stat is worth. */
  const plain = (list: StatTotal[], stat: string) =>
    list.find((t) => t.mod.stat === stat && !t.mod.tags && !t.mod.condition);
  const defence = of('armour');
  const armour = plain(defence, 'armour');
  const evasion = plain(defence, 'evasion');
  const recovery = of('recovery');
  const lifeRate = plain(recovery, 'lifeRegen');
  const manaRate = plain(recovery, 'manaRegen');
  const other = of('other');
  const move = plain(other, 'moveSpeed');
  const sc = s.scenarios;
  const pools = of('pools');
  const life = plain(pools, 'life');
  const es = plain(pools, 'es');
  const mana = plain(pools, 'mana');
  /**
   * A medallion of a group at the top: name and value inside, and what is under it (the whole of a pool, a pool's
   * multiplier, a maximum) on a plaque hung from its foot. The pools are large, in wreaths.
   */
  const tile = (
    label: string,
    value: string,
    notes: (string | false)[] = [],
    cls = '',
    tip?: string,
  ) => {
    const key = cls.split(' ')[0];
    return (
      <div
        key={label}
        class={`cs-tile ${cls}`}
        {...infoProps(tip)}
        data-paint="medal"
        data-field={FIELD[key] ?? 'lapis,4'}
        data-medal={(POOLS.has(key) ? 'wreath' : '') + (key === 'cs-mana' ? ' stars' : '')}
      >
        <span class="cs-label">{label}</span>
        <b>{value}</b>
        {notes.filter((n) => n).length > 0 && (
          <span class="cs-raw" data-paint="panel" data-thin>
            {notes.filter((n) => n).join(' · ')}
          </span>
        )}
      </div>
    );
  };
  /** An attribute's medallion with, below it, the total of what it gives to other stats. */
  const attrTile = (label: string, key: 'str' | 'dex' | 'int', cls: string, tip: string) => (
    <div key={label} class="cs-attr">
      {tile(label, f0(s.attrs[key]), [], cls, tip)}
      {ch.attrEffects.some((e) => e.attr === key && e.mod.value) && (
        <div class="cs-fx" data-paint="panel" data-thin>
          {ch.attrEffects
            .filter((e) => e.attr === key && e.mod.value)
            .map((e) => (
              <span key={modLabel(e.mod)}>{effectText(e.mod)}</span>
            ))}
        </div>
      )}
    </div>
  );
  return (
    <div class="cs">
      <div class="cs-top">
        <div class="cs-trio">
          {tile(
            'Life',
            f0(s.life - s.reservedLife),
            [s.reservedLife > 0 && `of ${f0(s.life)}`, times(life?.mult ?? 1)],
            'cs-life',
            GLOSSARY.life,
          )}
          {tile('Energy Shield', f0(s.es), [times(es?.mult ?? 1)], 'cs-es', GLOSSARY.es)}
          {tile(
            'Mana',
            f0(s.mana - s.reservedMana),
            [`of ${f0(s.mana)}`, times(mana?.mult ?? 1)],
            'cs-mana',
            GLOSSARY.mana,
          )}
        </div>
        <div class="cs-trio">
          {attrTile('Strength', 'str', 'cs-str', GLOSSARY.str)}
          {attrTile('Dexterity', 'dex', 'cs-dex', GLOSSARY.dex)}
          {attrTile('Intelligence', 'int', 'cs-int', GLOSSARY.int)}
        </div>
        <div class="cs-trio cs-four">
          {RES.map(([i, name, cls]) =>
            tile(
              name,
              `${s.res[i]}%`,
              [`max ${s.maxRes[i]}%`],
              `cs-res-${cls}${s.res[i] < s.maxRes[i] ? ' cs-under' : ''}`,
              cls === 'chaos' ? GLOSSARY.chaos : GLOSSARY.resist,
            ),
          )}
        </div>
      </div>
      <p class="cs-key" data-paint="panel" data-thin>
        {GLOSSARY.mult}
      </p>
      <div class="cs-cols">
        <div class="cs-col lf-panel" data-paint="panel">
          <Section title="Life and Mana">
            {pools.filter((t) => t !== life && t !== es && t !== mana).map(totalRow)}
          </Section>
          <Section title="Armour and Evasion">
            <Row
              label="Physical Damage Reduction"
              value={pct(mit.physReduction)}
              raw={`${f0(s.armour)} armour`}
              tip={GLOSSARY.armour}
            />
            {armour && totalRow(armour)}
            <Row
              label="Chance to Evade Attacks"
              value={pct(mit.evade)}
              raw={`${f0(s.evasion)} evasion`}
              tip={GLOSSARY.evasion}
            />
            {evasion && totalRow(evasion)}
            {defence.filter((t) => t !== armour && t !== evasion).map(totalRow)}
          </Section>
          <Section title="Block and Stun">
            <Row label="Chance to Block Attacks" value={pct(s.blockAttack)} tip={GLOSSARY.block} />
            <Row label="Chance to Block Spells" value={pct(s.blockSpell)} tip={GLOSSARY.block} />
            <Row label="Chance to Avoid Stuns" value={pct(s.stunAvoid)} tip={GLOSSARY.stun} />
            {of('block').map(totalRow)}
          </Section>
          <Section title="Damage Taken">{of('defenceOther').map(totalRow)}</Section>
          <Section title="Recovery">
            <Row label="Life Regeneration" value={`${f1(s.lifeRegen)}/s`} tip={GLOSSARY.regen} />
            {lifeRate && totalRow(lifeRate)}
            <Row label="Mana Regeneration" value={`${f1(s.manaRegen)}/s`} tip={GLOSSARY.regen} />
            {manaRate && totalRow(manaRate)}
            {recovery.filter((t) => t !== lifeRate && t !== manaRate).map(totalRow)}
          </Section>
        </div>
        <div class="cs-col lf-panel" data-paint="panel">
          <Section title="Damage">{of('damage').map(totalRow)}</Section>
          <Section title="Speed">{of('speed').map(totalRow)}</Section>
          <Section title="Critical Strikes">{of('crit').map(totalRow)}</Section>
          <Section title="Area and Projectiles">{of('reach').map(totalRow)}</Section>
          <Section title="Ailments" tip={GLOSSARY.ailments}>
            {of('ailments').map(totalRow)}
          </Section>
          <Section title="Hexes" tip={GLOSSARY.hexes}>
            {s.hexes.map((h) => (
              <Row key={h.id} label={HEXES[h.id].name} value={hexText(h.id, h.effect)} />
            ))}
          </Section>
          <Section title="Minions, Totems and Effects" tip={GLOSSARY.minions}>
            {of('offenceOther').map(totalRow)}
          </Section>
          <Section title="Movement and More">
            <Row
              label="Movement Speed"
              value={`${f1(s.moveSpeed)} tiles/s`}
              raw={times(move?.mult ?? 1)}
              tip={GLOSSARY.move}
            />
            {other.filter((t) => t !== move).map(totalRow)}
          </Section>
        </div>
      </div>
      {s.warnings.map((w) => (
        <div key={w} class="warn cs-warn" data-paint="panel" data-thin data-field="bitumen">
          ⚠ {w}
        </div>
      ))}
      <div class="cs-est" data-paint="panel" data-field="porphyry" data-thin>
        <span class="tipped" {...infoProps(GLOSSARY.dps)}>
          Estimated DPS <b>{f0(sc ? sc.pack : scenarioDps(s))}</b>
          {sc && sc.boss !== sc.pack && (
            <>
              {' '}
              against packs, <b>{f0(sc.boss)}</b> against bosses
            </>
          )}
        </span>
        <span class="tipped" {...infoProps(GLOSSARY.ehp)}>
          Effective HP <b>{f0(s.ehp)}</b>
        </span>
      </div>
    </div>
  );
}
