import { BOSSES, type BossId } from '../data/bosses';
import { FACTION_COLOR, FACTION_GLYPH, FACTION_RULES } from '../data/monsterInfo';
import { PRESENT_SHARE } from '../run/themeInfo';
import type { OfferPreview } from '../run/preview';
import { hoverInfo } from './info';

const hex = (n: number) => '#' + n.toString(16).padStart(6, '0');
const pct = (f: number) => `${Math.round(f * 100)}%`;

/** The damage types, in the order of the mix (the painted bar colours them, leaf/shapes.ts). */
const MIX_NAME = ['Physical', 'Lightning', 'Cold', 'Fire', 'Chaos'];

/**
 * What the map pays and how many monsters it has (docs/mockups/style/STYLE-GUIDE.md): four short rows in a fixed order,
 * so the same value sits in the same place on every card, and what a map does not give is dimmed. The percentages are
 * over a plain map of the same level and leave out the character's own gear.
 */
export function OfferTable({ o }: { o: OfferPreview }) {
  const r = o.rewards;
  if (!r) return null;
  const m = r.monsters;
  const gain = (label: string, f: number, tip: string) =>
    f > 0.0049 ? (
      <span class="pay" {...hoverInfo(tip)}>
        {label} <span class="gain">+{Math.round(f * 100)}%</span>
      </span>
    ) : (
      <span class="pay none" {...hoverInfo(tip)}>
        {label} —
      </span>
    );
  const count = (n: number, one: string, many: string, tip?: string) => (
    <span class={'pay' + (n > 0 ? '' : ' none')} {...(tip ? hoverInfo(tip) : {})}>
      {n > 0 ? <b>{n}</b> : '—'} {n === 1 ? one : many}
    </span>
  );
  const sep = <i class="pay-sep" data-paint="sep" />;
  return (
    <div class="offer-pays">
      <div class="pays-row">
        {gain(
          'Quantity',
          r.quantity,
          'Items dropped, over a plain map of this level (your own gear not counted).',
        )}
        {sep}
        {gain(
          'Rarity',
          r.rarity,
          'Chance of magic, rare and unique items, over a plain map of this level (your own gear not counted).',
        )}
      </div>
      <div class="pays-row">
        {gain('Experience', r.experience, 'Experience from kills, over a plain map of this level.')}
        {sep}
        {r.bonus.length ? (
          <span class="pay">
            Bonus <span class="gain">{r.bonus.join(', ')}</span>
          </span>
        ) : (
          <span class="pay none">Bonus —</span>
        )}
      </div>
      <div class="pays-row">
        {count(m.total, 'monster', 'monsters', 'How many monsters this map holds.')}
        {sep}
        {count(m.boss, 'boss', 'bosses', 'Bosses or champions on this map.')}
      </div>
      <div class="pays-row">
        {count(m.magic, 'magic', 'magic', 'Magic monsters on this map.')}
        {sep}
        {count(m.rare, 'rare', 'rare', 'Rare monsters on this map.')}
      </div>
    </div>
  );
}

/** The part of an offer card that says who is on the map (docs/ENEMIES.md 5.1). */
export function OfferInfo({
  o,
  boss,
  more,
}: {
  o: OfferPreview;
  /** The boss that ends the map, on a boss map (docs/BOSSES.md): it takes the champion's place. */
  boss?: BossId;
  /** Show the lines that are left out of a narrow card until it is expanded. */
  more: boolean;
}) {
  const info = o.info;
  if (!info) return null;
  return (
    <div class="offer-info">
      <div class="chips armies">
        {info.factions.map((f) => {
          // A faction's rule, where it applies, is in its tip rather than a line on the card.
          const rule = f.share >= PRESENT_SHARE ? FACTION_RULES[f.id] : undefined;
          return (
            <span
              key={f.id}
              class="chip faction"
              style={{ color: hex(FACTION_COLOR[f.id]) }}
              {...hoverInfo(`${f.name}: ${pct(f.share)} of the monsters.${rule ? ' ' + rule : ''}`)}
            >
              {FACTION_GLYPH[f.id]} {f.name} {pct(f.share)}
            </span>
          );
        })}
      </div>
      <div
        class="mixbar"
        data-paint="mix"
        data-mix={info.mix.map((x) => (x >= 0.02 ? x.toFixed(3) : '0')).join(',')}
        {...hoverInfo(
          'Damage the monsters deal, by type: ' +
            info.mix
              .map((x, i) => (x >= 0.02 ? `${MIX_NAME[i].toLowerCase()} ${pct(x)}` : ''))
              .filter(Boolean)
              .join(', '),
        )}
      />
      {more && boss && (
        <div class="gate">
          <strong>{BOSSES[boss].name[0].toUpperCase() + BOSSES[boss].name.slice(1)}</strong> waits
          at the end. {BOSSES[boss].brief.join(' ')}
        </div>
      )}
    </div>
  );
}
