import { useEffect, useState } from 'preact/hooks';
import { isCoarse } from './device';

/**
 * Tips (docs/MOBILE.md 3.2), one look for every pointer (the Gold Leaf tip: lapis with a gold ring, leaf/leaf.css):
 * `infoProps(text)` opens the popover of the `InfoLayer` (mounted once in App) on hover and on keyboard focus with a
 * mouse, and on a tap with a finger. Spread it on elements that do nothing on a tap (orbs, chips, icons), never on
 * buttons: a button's first tap must stay its action.
 */
type Open = { text: string; x: number; y: number } | null;

let current: Open = null;
const listeners = new Set<(o: Open) => void>();
function show(o: Open): void {
  current = o;
  listeners.forEach((l) => l(o));
}

type Hover = {
  onMouseEnter?: (e: MouseEvent) => void;
  onMouseLeave?: () => void;
  onFocus?: (e: FocusEvent) => void;
  onBlur?: () => void;
};
/** Open the tip over an element while the mouse is on it (or it has the keyboard's focus). */
const hover = (text: string): Hover => {
  const open = (e: Event) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    show({ text, x: r.left + r.width / 2, y: r.top });
  };
  return {
    onMouseEnter: open,
    onMouseLeave: () => show(null),
    onFocus: open,
    onBlur: () => show(null),
  };
};

/**
 * The text for something inside a button (an offer card): the tip on hover with a mouse, and on a touch screen nothing,
 * so that a tap on it is still a tap on the button.
 */
export function hoverInfo(text: string | undefined): Hover {
  return text && !isCoarse() ? hover(text) : {};
}

export function infoProps(text: string | undefined): Hover & {
  onClick?: (e: MouseEvent) => void;
} {
  if (!text) return {};
  if (!isCoarse()) return hover(text);
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
      // In pixels as strings: this Preact adds no "px" to a number.
      style={{
        left: `${left}px`,
        width: `${w}px`,
        ...(above ? { bottom: `${window.innerHeight - o.y + 8}px` } : { top: `${o.y + 40}px` }),
      }}
    >
      {o.text}
    </div>
  );
}
