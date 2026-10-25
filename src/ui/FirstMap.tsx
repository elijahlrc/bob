import { useEffect, useLayoutEffect, useState } from 'preact/hooks';
import type { Controller } from '../run/controller';
import { isCoarse } from './device';
import { seeIntro } from './intro';
import { uiZoom } from './uiScale';

type Rect = { left: number; right: number; top: number; bottom: number };
type Spots = { life: Rect | null; mana: Rect | null; speeds: Rect | null; W: number; H: number };

/** The orbs and the speed buttons, in interface pixels (the layer may be zoomed, uiScale.ts). */
function measure(): Spots {
  const z = uiZoom();
  const rect = (sel: string): Rect | null => {
    const r = document.querySelector(`.hud ${sel}`)?.getBoundingClientRect();
    return r
      ? { left: r.left / z, right: r.right / z, top: r.top / z, bottom: r.bottom / z }
      : null;
  };
  return {
    W: window.innerWidth / z,
    H: window.innerHeight / z,
    life: rect('.orb.life'),
    mana: rect('.orb.mana'),
    speeds: rect('.speeds'),
  };
}

/**
 * The first map of a player's first run (docs/NEWPLAYER.md N9): the map waits, paused, under one line on what the game is,
 * a tag pointing at the life and mana orbs and one at the speed buttons. Any tap starts it, and it is not shown again.
 */
export function FirstMap({ c, onDone }: { c: Controller; onDone: () => void }) {
  const [spots, setSpots] = useState<Spots>(() => measure());
  useLayoutEffect(() => {
    const again = () => setSpots(measure());
    again();
    window.addEventListener('resize', again);
    return () => window.removeEventListener('resize', again);
  }, []);
  useEffect(() => {
    if (!c.paused) c.togglePause();
  }, []);
  const done = () => {
    seeIntro('map');
    if (c.paused) c.togglePause();
    onDone();
  };
  const { life, mana, speeds, W, H } = spots;
  const info = `${isCoarse() ? 'Tap' : 'Hover over'} icons for more information`;
  // The speed buttons are a row under the dock, or a column down the right edge on a phone. The tag goes beside a row
  // when there is room before the life orb, above it when there is not, and to the left of a column (with the card
  // below the column, clear of it).
  const column = !!speeds && speeds.bottom - speeds.top > speeds.right - speeds.left;
  const side = !column && !!(speeds && life && speeds.left - life.right > 260);
  return (
    <div class="intro-layer" onClick={done}>
      <div
        class="intro-card"
        data-paint="panel"
        style={
          column && speeds ? { top: `${Math.max(H * 0.16, speeds.bottom + 16)}px` } : undefined
        }
      >
        <div class="intro-head lf-h">Your character fights on its own</div>
        <div class="intro-text">Between maps, you make it stronger.</div>
        <button class="btn primary" onClick={done}>
          Begin
        </button>
      </div>
      {life && (
        <div
          class="intro-tag"
          data-paint="panel"
          data-thin
          style={{ left: `${Math.max(8, life.left)}px`, bottom: `${H - life.top + 8}px` }}
        >
          ↓ {info}
        </div>
      )}
      {mana && (
        <div
          class="intro-tag"
          data-paint="panel"
          data-thin
          style={{ right: `${Math.max(8, W - mana.right)}px`, bottom: `${H - mana.top + 8}px` }}
        >
          {info} ↓
        </div>
      )}
      {speeds && (
        <div
          class="intro-tag"
          data-paint="panel"
          data-thin
          style={
            column
              ? {
                  right: `${W - speeds.left + 8}px`,
                  top: `${(speeds.top + speeds.bottom) / 2 - 24}px`,
                }
              : side
                ? {
                    right: `${W - speeds.left + 10}px`,
                    bottom: `${H - speeds.bottom}px`,
                  }
                : {
                    left: `${(speeds.left + speeds.right) / 2}px`,
                    bottom: `${H - speeds.top + 8}px`,
                    transform: 'translateX(-50%)',
                  }
          }
        >
          {column || side ? 'Pause and game speed →' : 'Pause and game speed ↓'}
        </div>
      )}
    </div>
  );
}
