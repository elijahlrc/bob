import { useEffect, useState } from 'preact/hooks';
import { isCoarse } from './device';

/**
 * Tooltips for a finger (docs/MOBILE.md 3.2). A `title=` attribute needs a hovering pointer; `infoProps(text)` gives the
 * same text to both: the browser tooltip on a mouse, and on a coarse pointer a tap that opens a small popover (the
 * `InfoLayer` mounted once in App). Spread it on elements that do nothing on a tap (orbs, chips, icons), never on
 * buttons: a button's first tap must stay its action.
 */
type Open = { text: string; x: number; y: number } | null;

let current: Open = null;
const listeners = new Set<(o: Open) => void>();
function show(o: Open): void {
  current = o;
  listeners.forEach((l) => l(o));
}

/**
 * The text for something inside a button (an offer card): a hover tooltip with a mouse, and on a touch screen nothing, so that a
 * tap on it is still a tap on the button.
 */
export function hoverInfo(text: string | undefined): { title?: string } {
  return text && !isCoarse() ? { title: text } : {};
}

export function infoProps(text: string | undefined): {
  title?: string;
  onClick?: (e: MouseEvent) => void;
} {
  if (!text) return {};
  if (!isCoarse()) return { title: text };
  return {
    onClick: (e) => {
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      // The tap that opens it must not be the one that closes it (the layer closes on the next tap anywhere).
      e.stopPropagation();
      show({ text, x: r.left + r.width / 2, y: r.top });
    },
  };
}

/** The popover itself: above the tapped element (below it near the top), kept inside the window. */
export function InfoLayer() {
  const [o, setO] = useState<Open>(current);
  useEffect(() => {
    listeners.add(setO);
    const close = () => show(null);
    window.addEventListener('pointerdown', close, true);
    return () => {
      listeners.delete(setO);
      window.removeEventListener('pointerdown', close, true);
    };
  }, []);
  if (!o) return null;
  const w = Math.min(280, window.innerWidth - 16);
  const left = Math.max(8, Math.min(window.innerWidth - w - 8, o.x - w / 2));
  const above = o.y > 120;
  return (
    <div
      class="info-pop"
      role="tooltip"
      style={{
        left,
        width: w,
        ...(above ? { bottom: window.innerHeight - o.y + 8 } : { top: o.y + 40 }),
      }}
    >
      {o.text}
    </div>
  );
}
