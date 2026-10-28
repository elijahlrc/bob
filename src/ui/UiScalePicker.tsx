import { useState } from 'preact/hooks';
import { useViewport } from './device';
import { SoundSettings } from './SoundSettings';
import { offeredScales, setUiScale, uiScale } from './uiScale';

/** The interface size (uiScale.ts), and the sound volume beside it wherever it is offered. */
export function UiScalePicker() {
  const [scale, setScale] = useState(uiScale);
  // Re-rendered on a resize: the sizes offered follow the window.
  useViewport();
  return (
    <>
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
      <SoundSettings />
    </>
  );
}
