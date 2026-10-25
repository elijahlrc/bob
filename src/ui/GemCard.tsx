import { uiZoom } from './uiScale';
import { gemDef } from '../data/gems';
import { gemCardData } from './gemText';
import { TAG_GLOSSARY } from '../data/glossary';
import { infoProps } from './info';

/** What a gem does at a given level: type, tags, stats, effects, requirements. */
export function GemCard({ gemId, level, tip }: { gemId: string; level: number; tip?: boolean }) {
  const d = gemCardData(gemDef(gemId), level);
  const kind = gemDef(gemId).kind;
  return (
    <div class={`item-card gem gem-${kind}${tip ? ' gem-tip' : ''}`}>
      <div class="ic-name" data-paint="panel" data-thin data-field="green">
        {d.name}
      </div>
      <div class="muted">
        {d.type} · Level {d.level}
      </div>
      {d.tags.length > 0 && (
        <div class="gem-tags">
          {d.tags.map((t, i) => (
            <span key={t}>
              {i > 0 && ', '}
              <span {...infoProps(TAG_GLOSSARY[t.toLowerCase()])}>{t}</span>
            </span>
          ))}
        </div>
      )}
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
  // By the cursor (or the tap), kept on screen, in interface pixels (uiScale.ts); below it in the upper half of the
  // window, above it in the lower half. Preact 11 adds no "px" to a number, so the style says it.
  const z = uiZoom();
  const [W, H, px, py] = [window.innerWidth / z, window.innerHeight / z, x / z, y / z];
  const left = Math.max(4, Math.min(px + 16, W - 306));
  const place =
    py > H * 0.55
      ? { bottom: `${Math.max(4, H - py + 12)}px` }
      : { top: `${Math.max(4, py + 12)}px` };
  return (
    <div class="tooltip gem-tooltip" style={{ left: `${left}px`, ...place }}>
      <GemCard gemId={gemId} level={level} tip />
    </div>
  );
}
