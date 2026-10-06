import { CLASSES } from '../data/classes';
import { hex, MOD_MARKS, RARITY_COLOR } from '../data/monsterMarks';
import { monsterModDef, MONSTER_TYPES, BOSS_NAME } from '../data/monsters';
import type { Actor } from '../sim/types';
import { SPEEDS, type Controller } from '../run/controller';
import { useTicks } from './hooks';
import { StyleSwitcher } from './StyleSwitcher';

/** A resource orb: the fill height shows the amount; the skin comes from the active style's CSS. */
function Orb(props: {
  value: number;
  max: number;
  kind: 'life' | 'mana';
  label: string;
  es?: number;
  esMax?: number;
}) {
  const { value, max, kind, label } = props;
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const esPct = props.esMax ? Math.max(0, Math.min(100, ((props.es ?? 0) / props.esMax) * 100)) : 0;
  return (
    <div class={`orb ${kind}`} title={`${label} ${Math.round(value)} / ${Math.round(max)}`}>
      <div class="orb-glass">
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
        {spec ? ` · Level ${spec.level}` : ''}
      </div>
      <div class="inspect-life" title={`${Math.round(a.life)} / ${Math.round(maxLife)}`}>
        <div style={{ width: `${Math.max(0, Math.min(100, (a.life / maxLife) * 100))}%` }} />
        <span>
          {Math.round(a.life).toLocaleString()} / {Math.round(maxLife).toLocaleString()}
        </span>
      </div>
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

export function Hud({ c }: { c: Controller }) {
  useTicks(c);
  const w = c.world;
  if (!w) return null;
  const p = w.player;
  const lifeMax = Math.max(1, p.def.maxLife - w.char.reservedLife);
  const manaMax = Math.max(0, p.def.maxMana - w.char.reservedMana);
  const sc = c.showcase;
  const sel = c.selectedId !== null ? w.actors.find((x) => x.id === c.selectedId) : undefined;
  return (
    <div class="hud">
      <div class="hud-top">
        <span>
          {sc ? 'Showcase' : `Map ${w.plan.map}`} · {w.plan.theme.name}
        </span>
        <span>Level {w.build.level}</span>
        <span>Kills {w.stats.kills}</span>
        <span>{w.exitOpen ? 'Exit open' : ''}</span>
      </div>
      {sel && sel.alive && !sel.isPlayer && <Inspect a={sel} c={c} />}
      {sc && (
        <div class="hud-showcase">
          <div class="muted">
            {CLASSES[sc.classIdx].name} · keys 1-4 switch style · N next class
          </div>
          <StyleSwitcher c={c} compact />
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
        <Orb value={p.life} max={lifeMax} kind="life" label="Life" es={p.es} esMax={p.def.maxEs} />
        <div class="hud-center">
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
                  title={`${f.spec.name} (${kindLabel}) · ${f.charges.toFixed(0)}/${f.spec.maxCharges} charges, ${f.spec.perUse} per use. Used automatically.`}
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
            {SPEEDS.map((s) => (
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
        <Orb value={p.mana} max={Math.max(1, manaMax)} kind="mana" label="Mana" />
      </div>
    </div>
  );
}
