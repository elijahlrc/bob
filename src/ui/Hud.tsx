import { CLASSES } from '../data/classes';
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

export function Hud({ c }: { c: Controller }) {
  useTicks(c);
  const w = c.world;
  if (!w) return null;
  const p = w.player;
  const lifeMax = Math.max(1, p.def.maxLife - w.char.reservedLife);
  const manaMax = Math.max(0, p.def.maxMana - w.char.reservedMana);
  const sc = c.showcase;
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
      {sc && (
        <div class="hud-showcase">
          <div class="muted">
            {CLASSES[sc.classIdx].name} · keys 1 / 2 / 3 switch style · N next class
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
            {w.flasks.map((f, i) => (
              <div key={i} class={'flask' + (f.activeT > 0 ? ' active' : '')} title={f.spec.name}>
                <div
                  class={'flask-fill ' + f.spec.kind}
                  style={{ height: `${(f.charges / f.spec.maxCharges) * 100}%` }}
                />
              </div>
            ))}
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
