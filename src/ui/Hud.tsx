import { SPEEDS, type Controller } from '../run/controller';
import { useTicks } from './hooks';

function Bar(props: { value: number; max: number; color: string; label: string }) {
  const { value, max, color, label } = props;
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div class="bar">
      <div class="bar-fill" style={{ width: `${pct}%`, background: color }} />
      <div class="bar-text">
        {label} {Math.max(0, Math.round(value))} / {Math.round(max)}
      </div>
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
  return (
    <div class="hud">
      <div class="hud-top">
        <span>
          Map {w.plan.map} · {w.plan.theme.name}
        </span>
        <span>Level {w.build.level}</span>
        <span>Kills {w.stats.kills}</span>
        <span>{w.exitOpen ? 'Exit open' : ''}</span>
      </div>
      <div class="hud-bottom">
        <div class="bars">
          {p.def.maxEs > 0 && <Bar value={p.es} max={p.def.maxEs} color="#7fb4d8" label="ES" />}
          <Bar value={p.life} max={lifeMax} color="#c03030" label="Life" />
          {manaMax > 0 && <Bar value={p.mana} max={manaMax} color="#3050c0" label="Mana" />}
        </div>
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
    </div>
  );
}
