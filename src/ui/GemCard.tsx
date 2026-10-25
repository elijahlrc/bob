import { useLayoutEffect, useRef } from 'preact/hooks';
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
  // By the cursor (or the tap), in interface pixels (uiScale.ts), and always wholly on screen: the card is measured once
  // drawn, then put below the point if it fits there, above it if it fits there, else as near as the window allows. A
  // card taller than the window is scaled down to fit (it takes no taps, so it cannot scroll). Preact 11 adds no "px"
  // to a number, so the style says it.
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const place = () => {
      const el = ref.current;
      if (!el) return;
      const z = uiZoom();
      const [W, H, px, py] = [window.innerWidth / z, window.innerHeight / z, x / z, y / z];
      const M = 4;
      el.style.maxWidth = `${Math.min(290, W - 2 * M)}px`;
      el.style.transform = '';
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      el.style.left = `${Math.max(M, Math.min(px + 16, W - w - M))}px`;
      let top: number;
      if (py + 12 + h <= H - M) top = py + 12;
      else if (py - 12 - h >= M) top = py - 12 - h;
      else top = Math.max(M, Math.min(py - h / 2, H - h - M));
      if (h > H - 2 * M) {
        top = M;
        el.style.transformOrigin = 'top left';
        el.style.transform = `scale(${(H - 2 * M) / h})`;
      }
      el.style.top = `${top}px`;
      el.style.visibility = '';
    };
    place();
    // A phone turned on its side moves the window's edges: placed again.
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [gemId, level, x, y]);
  return (
    // Hidden until placed, so it never shows a frame in the wrong spot.
    <div
      class="tooltip gem-tooltip"
      ref={ref}
      style={{ visibility: 'hidden', left: '0px', top: '0px' }}
    >
      <GemCard gemId={gemId} level={level} tip />
    </div>
  );
}
