import { useState } from 'preact/hooks';
import {
  musicVolumeNow,
  setMusicVolume,
  setSoundVolume,
  soundOpen,
  soundVolume,
  VOLUMES,
} from './sound/engine';

const NAMES: Record<number, string> = { 0: 'Off', 0.4: 'Quiet', 0.7: 'Normal', 1: 'Loud' };

function VolumeRow({
  label,
  get,
  set,
}: {
  label: string;
  get: () => number;
  set: (v: number) => void;
}) {
  const [vol, setVol] = useState(get);
  return (
    <div class="ui-scale" role="group" aria-label={label}>
      <span class="muted">{label}</span>
      {VOLUMES.map((v) => (
        <button
          key={v}
          class={'btn small' + (v === vol ? ' on' : '')}
          aria-pressed={v === vol}
          onClick={() => {
            set(v);
            setVol(v);
          }}
        >
          {NAMES[v]}
        </button>
      ))}
    </div>
  );
}

/** The sound and music volumes, each with Off (docs/AUDIO.md). Hidden while sound is shut (SOUND_OPEN). */
export function SoundSettings() {
  if (!soundOpen()) return null;
  return (
    <>
      <VolumeRow label="Sound" get={soundVolume} set={setSoundVolume} />
      <VolumeRow label="Music" get={musicVolumeNow} set={setMusicVolume} />
    </>
  );
}
