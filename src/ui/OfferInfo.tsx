import { BOSSES, type BossId } from '../data/bosses';
import { FACTION_COLOR, FACTION_GLYPH } from '../data/monsterInfo';
import type { OfferPreview } from '../run/preview';
import { hoverInfo } from './info';

const hex = (n: number) => '#' + n.toString(16).padStart(6, '0');
const pct = (f: number) => `${Math.round(f * 100)}%`;

/** Colours of the damage types (physical, lightning, cold, fire, chaos), the same as the map's. */
const MIX_COLOR = ['#eadfc8', '#c89cff', '#9ad8ff', '#ff9a40', '#9ae05a'];
const MIX_NAME = ['Physical', 'Lightning', 'Cold', 'Fire', 'Chaos'];

const bonus = (f: number) =>
  f > 0.0049 ? <span class="gain">+{Math.round(f * 100)}%</span> : <span class="muted">—</span>;
const count = (n: number) => (n > 0 ? n : <span class="muted">—</span>);

/**
 * What the map pays and how many monsters it has, with the same cells on every offer card so that the cards can be read
 * across, two to a row. The percentages are over a plain map of the same level and leave out the character's own gear.
 */
export function OfferTable({ o }: { o: OfferPreview }) {
  const r = o.rewards;
  if (!r) return null;
  const m = r.monsters;
  return (
    <table class="offer-table">
      <tbody>
        <tr>
          <th
            {...hoverInfo(
              'Items dropped, over a plain map of this level (your own gear not counted).',
            )}
          >
            Quantity
          </th>
          <td>{bonus(r.quantity)}</td>
          <th
            {...hoverInfo(
              'Chance of magic, rare and unique items, over a plain map of this level (your own gear not counted).',
            )}
          >
            Rarity
          </th>
          <td>{bonus(r.rarity)}</td>
        </tr>
        <tr>
          <th {...hoverInfo('Experience from kills, over a plain map of this level.')}>
            Experience
          </th>
          <td>{bonus(r.experience)}</td>
          <th {...hoverInfo('How many monsters this map holds.')}>Monsters</th>
          <td>{m.total}</td>
        </tr>
        <tr>
          <th {...hoverInfo('Magic monsters, rare monsters, and bosses or champions on this map.')}>
            Magic · Rare · Boss
          </th>
          <td>
            {count(m.magic)} · {count(m.rare)} · {count(m.boss)}
          </td>
          <th>Bonus</th>
          <td>
            {r.bonus.length ? (
              r.bonus.map((b) => (
                <div key={b} class="gain">
                  {b}
                </div>
              ))
            ) : (
              <span class="muted">—</span>
            )}
          </td>
        </tr>
      </tbody>
    </table>
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
      <div class="chips">
        {info.factions.map((f) => (
          <span
            key={f.id}
            class="chip faction"
            style={{ borderColor: hex(FACTION_COLOR[f.id]), color: hex(FACTION_COLOR[f.id]) }}
            {...hoverInfo(`${f.name}: ${pct(f.share)} of the monsters.`)}
          >
            {FACTION_GLYPH[f.id]} {f.name} {pct(f.share)}
          </span>
        ))}
      </div>
      {(info.leans.hard.length > 0 || info.leans.soft.length > 0) && (
        <div class="leans">
          {info.leans.hard.length > 0 && <>Hard to {info.leans.hard.join(', ')}. </>}
          {info.leans.soft.length > 0 && <>Soft to {info.leans.soft.join(', ')}.</>}
        </div>
      )}
      <div
        class="mixbar"
        {...hoverInfo(
          'Damage the monsters deal, by type: ' +
            info.mix
              .map((x, i) => (x >= 0.02 ? `${MIX_NAME[i].toLowerCase()} ${pct(x)}` : ''))
              .filter(Boolean)
              .join(', '),
        )}
      >
        {info.mix.map((x, i) =>
          x >= 0.02 ? (
            <span key={i} style={{ width: `${x * 100}%`, background: MIX_COLOR[i] }} />
          ) : null,
        )}
      </div>
      {more && (
        <>
          <div class="chips">
            {info.types.map((t) => (
              <span
                key={t.id}
                class="chip type"
                style={{ color: hex(FACTION_COLOR[t.faction]) }}
                {...hoverInfo(`${t.name}: ${t.blurb}`)}
              >
                {t.name} {pct(t.share)}
              </span>
            ))}
          </div>
          {info.rules.map((r) => (
            <div key={r} class="muted rule">
              {r}
            </div>
          ))}
          {boss && (
            <div class="gate">
              <strong>{BOSSES[boss].name[0].toUpperCase() + BOSSES[boss].name.slice(1)}</strong>{' '}
              waits at the end. {BOSSES[boss].brief.join(' ')}
            </div>
          )}
        </>
      )}
      {o.weak && <div class="weak">{o.weak}</div>}
    </div>
  );
}
