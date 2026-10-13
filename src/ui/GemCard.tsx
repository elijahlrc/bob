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
  // By the cursor, kept on screen. Preact 11 adds no "px" to a number, so the style says it.
  const left = Math.max(4, Math.min(x + 16, window.innerWidth - 306));
  const top = Math.max(4, Math.min(y + 12, window.innerHeight - 300));
  return (
    <div class="tooltip gem-tooltip" style={{ left: `${left}px`, top: `${top}px` }}>
      <GemCard gemId={gemId} level={level} tip />
    </div>
  );
}
