import { monsterModDef } from '../data/monsters';
import { MOD_MARKS } from '../data/monsterMarks';
import { FACTION_COLOR, FACTION_GLYPH, TAG_INFO } from '../data/monsterInfo';
import { themeDef } from '../data/themes';
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
 * What the map pays and how many monsters it has, with the same rows on every offer card so that the cards can be read
 * across. The percentages are over a plain map of the same level and leave out the character's own gear.
 */
export function OfferTable({ o }: { o: OfferPreview }) {
  const r = o.rewards;
  if (!r) return null;
  const m = r.monsters;
  return (
    <table class="offer-table">
      <tbody>
        <tr
          {...hoverInfo(
            'Items dropped, over a plain map of this level (your own gear not counted).',
          )}
        >
          <th>Item quantity</th>
          <td>{bonus(r.quantity)}</td>
        </tr>
        <tr
          {...hoverInfo(
            'Chance of magic, rare and unique items, over a plain map of this level (your own gear not counted).',
          )}
        >
          <th>Item rarity</th>
          <td>{bonus(r.rarity)}</td>
        </tr>
        <tr {...hoverInfo('Experience from kills, over a plain map of this level.')}>
          <th>Experience</th>
          <td>{bonus(r.experience)}</td>
        </tr>
        <tr {...hoverInfo('How many monsters this map holds.')}>
          <th>Monsters</th>
          <td>{m.total}</td>
        </tr>
        <tr {...hoverInfo('Magic monsters, rare monsters, and bosses or champions on this map.')}>
          <th>Magic · Rare · Boss</th>
          <td>
            {count(m.magic)} · {count(m.rare)} · {count(m.boss)}
          </td>
        </tr>
        <tr>
          <th>Bonus loot</th>
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
  gate,
  more,
}: {
  o: OfferPreview;
  /** The map is a gate (every tenth): its mini-boss is named. */
  gate: boolean;
  /** Show the lines that are left out of a narrow card until it is expanded. */
  more: boolean;
}) {
  const info = o.info;
  if (!info) return null;
  const theme = themeDef(o.themeId);
  const champ = theme.chief ? monsterModDef(theme.chief.mod) : null;
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
      {info.asks.map((a) => (
        <div key={a.id} class="asks">
          Asks: {a.text}
        </div>
      ))}
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
      {info.tags.length > 0 && (
        <div class="chips">
          {info.tags.map((t) => (
            <span key={t} class="chip tag" {...hoverInfo(TAG_INFO[t].text)}>
              {TAG_INFO[t].name}
            </span>
          ))}
        </div>
      )}
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
          {gate && champ && theme.chief && (
            <div class="gate">
              <strong>{champ.name}</strong> waits at the end: {MOD_MARKS[theme.chief.mod].desc}
            </div>
          )}
        </>
      )}
      {o.weak && <div class="weak">{o.weak}</div>}
    </div>
  );
}
