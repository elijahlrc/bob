import { monsterModDef } from '../data/monsters';
import { MOD_MARKS } from '../data/monsterMarks';
import { FACTION_COLOR, FACTION_GLYPH, TAG_INFO } from '../data/monsterInfo';
import { themeDef } from '../data/themes';
import type { OfferPreview } from '../run/preview';
import { infoProps } from './info';

const hex = (n: number) => '#' + n.toString(16).padStart(6, '0');
const pct = (f: number) => `${Math.round(f * 100)}%`;

/** Colours of the damage types (physical, lightning, cold, fire, chaos), the same as the map's. */
const MIX_COLOR = ['#eadfc8', '#c89cff', '#9ad8ff', '#ff9a40', '#9ae05a'];
const MIX_NAME = ['Physical', 'Lightning', 'Cold', 'Fire', 'Chaos'];

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
            {...infoProps(`${f.name}: ${pct(f.share)} of the monsters.`)}
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
      <div
        class="mixbar"
        {...infoProps(
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
            <span key={t} class="chip tag" {...infoProps(TAG_INFO[t].text)}>
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
                {...infoProps(`${t.name}: ${t.blurb}`)}
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
