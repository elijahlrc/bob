import { CLASSES } from '../data/classes';
import { hex, MOD_MARKS, RARITY_COLOR } from '../data/monsterMarks';
import { monsterModDef, MONSTER_TYPES, BOSS_NAME, FACTION_NAMES } from '../data/monsters';
import { abilitiesOf, abilityTexts } from '../data/abilities';
import { ARCHETYPES } from '../data/archetypes';
import { defenceTexts, profileOf } from '../data/defence';
import { movementTexts, senseText } from '../data/movement';
import { patternText, phaseTexts } from '../data/phases';
import { shapeText } from '../data/shapes';
import { encounterTexts } from '../data/encounters';
import { MARK_MORE, markOf } from '../sim/encounters';
import { tithing } from '../sim/abilities';
import { FACTION_GLYPH, FACTION_RULES, TYPE_BLURBS } from '../data/monsterInfo';
import type { ThemeDef } from '../data/themes';
import { themeInfo } from '../run/themeInfo';
import { HEXES, hexText } from '../data/hexes';
import { CHARGE_KINDS, CHARGE_NAMES, CHARGE_SECONDS, CHARGE_TEXT } from '../calc/charges';
import type { Actor, World } from '../sim/types';
import { SPEEDS, type Controller } from '../run/controller';
import { DELIVERY_NAME, ELEMENT_NAME } from '../calc/skillLook';
import { useTicks } from './hooks';
import { useState } from 'preact/hooks';
import { canAbandon } from '../sim/abandon';
import { COLLAPSE_START, CRESCENDO_STEP_BONUS, HOLDOUT_WAVES, mapTypeDef } from '../data/mapTypes';
import { infoProps } from './info';
import { SkillBar } from './SkillBar';

/** A resource orb: the fill height shows the amount; the skin comes from CSS. */
function Orb(props: {
  value: number;
  max: number;
  kind: 'life' | 'mana';
  label: string;
  es?: number;
  esMax?: number;
  /** The part of `max` held by auras: drawn as a locked band at the top, so the orb keeps its full scale. */
  reserved?: number;
}) {
  const { value, max, kind, label } = props;
  const reserved = Math.max(0, Math.min(max, props.reserved ?? 0));
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const resPct = max > 0 ? (reserved / max) * 100 : 0;
  const esPct = props.esMax ? Math.max(0, Math.min(100, ((props.es ?? 0) / props.esMax) * 100)) : 0;
  return (
    <div
      class={`orb ${kind}`}
      {...infoProps(
        `${label} ${Math.round(value)} / ${Math.round(max - reserved)}${
          reserved > 0 ? ` (${Math.round(reserved)} of ${Math.round(max)} reserved by auras)` : ''
        }`,
      )}
    >
      <div class="orb-glass">
        {resPct > 0 && <div class="orb-reserved" style={{ height: `${resPct}%` }} />}
        <div class="orb-fill" style={{ height: `${pct}%` }} />
        {esPct > 0 && <div class="orb-es" style={{ height: `${esPct}%` }} />}
        <div class="orb-gloss" />
      </div>
      <div class="orb-text">{Math.round(value)}</div>
    </div>
  );
}

const RARITY_LABEL = {
  normal: 'Normal',
  magic: 'Magic',
  rare: 'Rare',
  miniboss: 'Champion',
  boss: 'Boss',
} as const;

/** The factions of a map's theme that are a quarter or more of its monsters, as a short label. */
function leadNames(theme: ThemeDef): string {
  return themeInfo(theme)
    .asks.map((a) => `${FACTION_GLYPH[a.id]} ${a.name}`)
    .join(' · ');
}
function leadText(theme: ThemeDef): string {
  return themeInfo(theme)
    .asks.map((a) => `${a.name} ask: ${a.text}.`)
    .join(' ');
}

/** Details of the enemy the player clicked: every affix with its effect. */
function Inspect({ a, c }: { a: Actor; c: Controller }) {
  const spec = a.mon?.spec;
  const rarity = a.rarity === 'player' ? 'normal' : a.rarity;
  const maxLife = Math.max(1, a.def.maxLife);
  const type = spec ? MONSTER_TYPES[spec.type].name : '';
  return (
    <div class="inspect" style={{ '--rar': hex(RARITY_COLOR[rarity]) }}>
      <button class="inspect-x" title="Close" onClick={() => c.bus.emit('select', { id: null })}>
        ×
      </button>
      <div class="inspect-name">{a.name || (rarity === 'boss' ? BOSS_NAME : type)}</div>
      <div class="muted inspect-sub">
        {RARITY_LABEL[rarity]} {type}
        {spec
          ? ` · ${ARCHETYPES[MONSTER_TYPES[spec.type].archetype].name} · Level ${spec.level}`
          : ''}
      </div>
      {spec && (
        <div class="muted inspect-sub">
          {FACTION_NAMES[MONSTER_TYPES[spec.type].faction]}: {TYPE_BLURBS[spec.type]}
          {FACTION_RULES[MONSTER_TYPES[spec.type].faction] &&
            ` ${FACTION_RULES[MONSTER_TYPES[spec.type].faction]}`}
        </div>
      )}
      {spec &&
        [
          shapeText(MONSTER_TYPES[spec.type].shape),
          ...encounterTexts(spec.type),
          ...abilityTexts(abilitiesOf(spec.type)),
          ...movementTexts(MONSTER_TYPES[spec.type].movement),
          patternText(MONSTER_TYPES[spec.type].pattern),
          ...phaseTexts(MONSTER_TYPES[spec.type].phases),
          ...senseText(MONSTER_TYPES[spec.type].senses),
          ...defenceTexts(
            profileOf(MONSTER_TYPES[spec.type].faction, MONSTER_TYPES[spec.type].defence),
          ),
        ]
          .filter((t): t is string => !!t)
          .map((t) => (
            <div key={t} class="muted inspect-sub">
              {t}
            </div>
          ))}
      <div class="inspect-life" title={`${Math.round(a.life)} / ${Math.round(maxLife)}`}>
        <div style={{ width: `${Math.max(0, Math.min(100, (a.life / maxLife) * 100))}%` }} />
        <span>
          {Math.round(a.life).toLocaleString()} / {Math.round(maxLife).toLocaleString()}
        </span>
      </div>
      {a.hexes.map((h) => (
        <div key={h.id} class="inspect-mod">
          <span class="mchip ring" style={{ '--c': '#c070e0' }} />
          <div>
            <div class="inspect-mod-name">Hexed: {HEXES[h.id].name}</div>
            <div class="muted">{hexText(h.id, h.effect)}</div>
          </div>
        </div>
      ))}
      {a.modIds.length === 0 ? (
        <div class="muted">No affixes.</div>
      ) : (
        a.modIds.map((id) => (
          <div key={id} class="inspect-mod">
            <span
              class={`mchip ${MOD_MARKS[id].shape}`}
              style={{ '--c': hex(MOD_MARKS[id].color) }}
            />
            <div>
              <div class="inspect-mod-name">{monsterModDef(id).name}</div>
              <div class="muted">{MOD_MARKS[id].desc}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/** What monsters have left on the character besides hexes (docs/ENCOUNTERS.md 7): a blinding, a mark, a draining beam. */
function playerDebuffs(w: World): { name: string; text: string }[] {
  const out: { name: string; text: string }[] = [];
  const p = w.player;
  if (p.fx.blind)
    out.push({
      name: 'Blinded',
      text: `Blinded: your attacks are half as likely to hit. ${Math.ceil(p.fx.blind.t)} s left.`,
    });
  const mark = markOf(w);
  if (mark)
    out.push({
      name: 'Marked',
      text: `Marked by a Handler: its pack hits you ${Math.round(MARK_MORE * 100)}% harder. ${Math.ceil(mark.until - w.t)} s left.`,
    });
  if (w.actors.some((a) => a.alive && tithing(a)))
    out.push({
      name: 'Tithed',
      text: 'A Bursar is draining your life through a beam: kill it, or get out of its sight.',
    });
  return out;
}

/** Pips for each kind of charge the character can gain (EXPANSION 5.6). */
function Charges({ w }: { w: World }) {
  const ch = w.char;
  const kinds = CHARGE_KINDS.filter((k) => ch.chargeSource[k] || ch.charges[k] > 0);
  const hexes = w.player.hexes;
  const debuffs = playerDebuffs(w);
  if (!kinds.length && !hexes.length && !debuffs.length) return null;
  return (
    <div class="charges">
      {debuffs.map((d) => (
        <div key={d.name} class="hexchip" {...infoProps(d.text)}>
          ⚠ {d.name}
        </div>
      ))}
      {hexes.map((h) => (
        <div
          key={h.id}
          class="hexchip"
          {...infoProps(
            `Hexed: ${HEXES[h.id].name}, ${hexText(h.id, h.effect)}. ${Math.ceil(h.t)} s left.`,
          )}
        >
          ☠ {HEXES[h.id].name}
        </div>
      ))}
      {kinds.map((k) => (
        <div
          key={k}
          class={`charge ${k}`}
          {...infoProps(
            `${CHARGE_NAMES[k]}: ${ch.charges[k]} of ${ch.chargeMax[k]}. Each charge: ${CHARGE_TEXT[k]}. Lasts ${CHARGE_SECONDS} seconds.`,
          )}
        >
          {Array.from({ length: ch.chargeMax[k] }, (_, i) => (
            <span key={i} class={'pip' + (i < ch.charges[k] ? ' on' : '')} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Leave the map early (docs/MAPS.md section 7): a confirm click, then a timer during which the character keeps fighting. */
function AbandonButton({ c, w }: { c: Controller; w: World }) {
  const [asking, setAsking] = useState(false);
  if (w.abandonT !== null) {
    return (
      <div class="hud-abandon">
        <span
          title={w.abandonAuto ? 'A map is left on its own after about eight minutes.' : undefined}
        >
          {w.abandonAuto ? 'Taking too long: leaving' : 'Leaving'} in{' '}
          {Math.max(0, w.abandonT).toFixed(1)} s
        </span>
        {!w.abandonAuto && (
          <button class="btn small" onClick={() => c.cancelAbandon()}>
            Stay
          </button>
        )}
      </div>
    );
  }
  if (!canAbandon(w)) {
    return (
      <div class="hud-abandon">
        <button
          class="btn small"
          disabled
          title="Not available on the first four maps, on mini-boss and boss maps, or once the exit is open."
        >
          Abandon map
        </button>
      </div>
    );
  }
  return (
    <div class="hud-abandon">
      {asking ? (
        <>
          <span title="You keep the loot and XP you have, but the level earns no clear rewards.">
            Leave this map?
          </span>
          <button
            class="btn small danger"
            onClick={() => {
              setAsking(false);
              c.abandonMap();
            }}
          >
            Leave
          </button>
          <button class="btn small" onClick={() => setAsking(false)}>
            Stay
          </button>
        </>
      ) : (
        <button class="btn small" onClick={() => setAsking(true)}>
          Abandon map
        </button>
      )}
    </div>
  );
}

/** Simulated seconds on the level as m:ss (h:mm:ss past an hour). */
function formatLevelTime(t: number): string {
  const s = Math.floor(Math.max(0, t));
  const sec = String(s % 60).padStart(2, '0');
  const m = Math.floor(s / 60);
  return m >= 60
    ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${sec}`
    : `${m}:${sec}`;
}

export function Hud({ c }: { c: Controller }) {
  useTicks(c);
  const w = c.world;
  if (!w) return null;
  const p = w.player;
  const lifeMax = Math.max(1, p.def.maxLife);
  const manaMax = Math.max(1, p.def.maxMana);
  const sc = c.showcase;
  const sel = c.selectedId !== null ? w.actors.find((x) => x.id === c.selectedId) : undefined;
  return (
    <div class="hud">
      <div class="hud-top">
        <span>
          {sc ? 'Showcase' : `Map ${w.plan.map}`} · {w.plan.theme.name}
        </span>
        <span {...infoProps(leadText(w.plan.theme))}>{leadNames(w.plan.theme)}</span>
        <span>Level {w.build.level}</span>
        <span>Kills {w.stats.kills}</span>
        <span {...infoProps('Time spent on this level. It stops while the game is paused.')}>
          {formatLevelTime(w.t)}
        </span>
        {w.plan.type !== 'plain' && (
          <span {...infoProps(mapTypeDef(w.plan.type).text)}>
            {mapTypeDef(w.plan.type).name}
            {w.plan.type === 'crescendo' &&
              ` +${Math.round(w.surge * CRESCENDO_STEP_BONUS * 100)}% (step ${w.surge})`}
            {w.plan.type === 'collapse' &&
              (w.collapseFront <= 0
                ? ` in ${Math.max(0, Math.ceil(COLLAPSE_START - w.t))} s`
                : ` ${Math.max(0, w.collapseGap).toFixed(0)} tiles behind you`)}
            {w.plan.type === 'crawl' && ` ${w.plan.segment + 1}/${w.plan.segments}`}
            {w.plan.type === 'holdout' &&
              ` wave ${w.holdout.spawned}/${HOLDOUT_WAVES} (${w.holdout.cleared} survived)`}
          </span>
        )}
        <span>{w.exitOpen ? 'Exit open' : ''}</span>
      </div>
      {!sc && !c.gallery && <AbandonButton c={c} w={w} />}
      {sel && sel.alive && !sel.isPlayer && <Inspect a={sel} c={c} />}
      {c.gallery && (
        <div class="hud-showcase hud-gallery">
          <div>
            {c.gallery.entries[c.gallery.idx].name}
            <span class="muted">
              {' '}
              · {DELIVERY_NAME[c.gallery.entries[c.gallery.idx].look.delivery]} ·{' '}
              {c.gallery.entries[c.gallery.idx].look.element >= 0
                ? ELEMENT_NAME[c.gallery.entries[c.gallery.idx].look.element]
                : 'no damage'}
            </span>
          </div>
          <select
            value={c.gallery.idx}
            onChange={(e) => c.galleryGo(Number((e.target as HTMLSelectElement).value))}
          >
            {c.gallery.entries.map((en, i) => (
              <option key={en.id} value={i}>
                {DELIVERY_NAME[en.look.delivery]}: {en.name}
              </option>
            ))}
          </select>
          <div class="showcase-row">
            <button class="btn small" onClick={() => c.galleryGo('prev')}>
              Prev (P)
            </button>
            <button class="btn small" onClick={() => c.galleryGo('next')}>
              Next (N)
            </button>
            <button class="btn small" onClick={() => c.exitShowcase()}>
              Exit
            </button>
          </div>
        </div>
      )}
      {sc && (
        <div class="hud-showcase">
          <div class="muted">{CLASSES[sc.classIdx].name} · N next class</div>
          <div class="showcase-row">
            <button class="btn small" onClick={() => c.nextShowcaseClass()}>
              Next class (N)
            </button>
            <button class="btn small" onClick={() => c.exitShowcase()}>
              Exit
            </button>
          </div>
        </div>
      )}
      <div class="hud-bottom">
        <Orb
          value={p.life}
          max={lifeMax}
          reserved={w.char.reservedLife}
          kind="life"
          label="Life"
          es={p.es}
          esMax={p.def.maxEs}
        />
        <div class="hud-center">
          <Charges w={w} />
          <SkillBar w={w} />
          <div class="flasks">
            {w.flasks.map((f, i) => {
              const pct = f.spec.maxCharges > 0 ? (f.charges / f.spec.maxCharges) * 100 : 0;
              const ready = f.charges >= f.spec.perUse;
              const kindLabel =
                f.spec.kind === 'life'
                  ? 'Life'
                  : f.spec.kind === 'mana'
                    ? 'Mana'
                    : f.spec.kind === 'hybrid'
                      ? 'Hybrid'
                      : 'Utility';
              return (
                <div
                  key={i}
                  class={'flask' + (f.activeT > 0 ? ' active' : '') + (ready ? ' ready' : '')}
                  {...infoProps(
                    `${f.spec.name} (${kindLabel}) · ${f.charges.toFixed(0)}/${f.spec.maxCharges} charges, ${f.spec.perUse} per use. Used automatically.`,
                  )}
                >
                  <div class="flask-neck" />
                  <div class="flask-body">
                    <div class={'flask-fill ' + f.spec.kind} style={{ height: `${pct}%` }} />
                    <span class="flask-count">{Math.floor(f.charges)}</span>
                  </div>
                  <div class="flask-tag">{kindLabel[0]}</div>
                </div>
              );
            })}
          </div>
          <div class="speeds">
            <button class={'btn small' + (c.paused ? ' on' : '')} onClick={() => c.togglePause()}>
              ❚❚
            </button>
            {[...(c.gallery ? [0.25] : []), ...SPEEDS].map((s) => (
              <button
                key={s}
                class={'btn small' + (!c.paused && c.speed === s ? ' on' : '')}
                onClick={() => c.setSpeed(s)}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
        <Orb value={p.mana} max={manaMax} reserved={w.char.reservedMana} kind="mana" label="Mana" />
      </div>
    </div>
  );
}
