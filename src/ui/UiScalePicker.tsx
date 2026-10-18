import { useState } from 'preact/hooks';
import { isCoarse } from './device';
import { offeredScales, setUiScale, uiScale } from './uiScale';

/** The interface size, on a touch screen only (a desktop browser ignores it and has its own zoom). */
export function UiScalePicker() {
  const [scale, setScale] = useState(uiScale);
  if (!isCoarse()) return null;
  return (
    <div class="ui-scale" role="group" aria-label="Interface size">
      <span class="muted">Interface size</span>
      {offeredScales().map((s) => (
        <button
          key={s}
          class={'btn small' + (s === scale ? ' on' : '')}
          aria-pressed={s === scale}
          onClick={() => {
            setUiScale(s);
            setScale(s);
          }}
        >
          {Math.round(s * 100)}%
        </button>
      ))}
    </div>
  );
}
