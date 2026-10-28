import { useState } from 'preact/hooks';
import { setSoundVolume, soundOpen, soundVolume, VOLUMES } from './sound/engine';

const NAMES: Record<number, string> = { 0: 'Off', 0.4: 'Quiet', 0.7: 'Normal', 1: 'Loud' };

/** The sound volume, with Off (docs/AUDIO.md). Hidden while sound is shut (SOUND_OPEN). */
export function SoundSettings() {
  const [vol, setVol] = useState(soundVolume);
  if (!soundOpen()) return null;
  return (
    <div class="ui-scale" role="group" aria-label="Sound">
      <span class="muted">Sound</span>
      {VOLUMES.map((v) => (
        <button
          key={v}
          class={'btn small' + (v === vol ? ' on' : '')}
          aria-pressed={v === vol}
          onClick={() => {
            setSoundVolume(v);
            setVol(v);
          }}
        >
          {NAMES[v]}
        </button>
      ))}
    </div>
  );
}
