import { gemDef } from '../data/gems';
import { gemCardData } from './gemText';

/** What a gem does at a given level: type, tags, stats, effects, requirements. */
export function GemCard({ gemId, level, tip }: { gemId: string; level: number; tip?: boolean }) {
  const d = gemCardData(gemDef(gemId), level);
  const kind = gemDef(gemId).kind;
  return (
    <div class={`item-card gem gem-${kind}${tip ? ' gem-tip' : ''}`}>
      <div class="ic-name">{d.name}</div>
      <div class="muted">
        {d.type} · Level {d.level}
      </div>
      {d.tags.length > 0 && <div class="gem-tags">{d.tags.join(', ')}</div>}
      {d.stats.map((l, i) => (
        <div key={`s${i}`} class="ic-mod implicit">
          {l}
        </div>
      ))}
      {d.effects.map((l, i) => (
        <div key={`e${i}`} class="ic-mod explicit">
          {l}
        </div>
      ))}
      <div class="ic-base">{d.description}</div>
      <div class="muted">Requires {d.requires}</div>
    </div>
  );
}

/** A tooltip that follows the pointer; shown for a gem hovered in the skills tab. */
export function GemTip({
  gemId,
  level,
  x,
  y,
}: {
  gemId: string;
  level: number;
  x: number;
  y: number;
}) {
  const left = Math.min(x + 16, window.innerWidth - 300);
  const top = Math.min(y + 12, window.innerHeight - 260);
  return (
    <div class="tooltip gem-tooltip" style={{ left, top }}>
      <GemCard gemId={gemId} level={level} tip />
    </div>
  );
}
