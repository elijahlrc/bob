import { STYLE_IDS, STYLE_INFO } from '../data/styles';
import type { Controller } from '../run/controller';

/** Picks the visual style (map renderer and UI skin). */
export function StyleSwitcher({ c, compact }: { c: Controller; compact?: boolean }) {
  return (
    <div class={'style-switch' + (compact ? ' compact' : '')}>
      {STYLE_IDS.map((id, i) => (
        <button
          key={id}
          class={'style-btn' + (c.styleId === id ? ' on' : '')}
          title={STYLE_INFO[id].tagline}
          onClick={() => c.setStyle(id)}
        >
          <span class="key">{i + 1}</span> {STYLE_INFO[id].name}
          {!compact && <div class="tagline">{STYLE_INFO[id].tagline}</div>}
        </button>
      ))}
    </div>
  );
}
