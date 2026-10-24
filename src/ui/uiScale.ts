import { loadPref, savePref } from './prefs';

/**
 * The interface size on a phone or tablet. Phones differ in how big a CSS pixel looks, so the player picks a size.
 *
 * It works through the viewport meta tag, not CSS zoom: at 110% the page is laid out `width=<device width ÷ 1.1>` and the
 * browser scales that up to fill the screen. Everything in the page stays in one coordinate space (window size, pointer
 * positions, media queries, the map canvas), so no other code has to know. Desktop browsers ignore the tag; there the
 * browser's own zoom does this job.
 *
 * Inside an iframe (the itch.io page) the tag does nothing, so there the interface layer is zoomed with CSS instead (the
 * map keeps its own zoom). Code that turns window or pointer positions into interface pixels divides by `uiZoom()`.
 */
export const UI_SCALES = [0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3] as const;

/**
 * The narrowest layout width a scale may produce. 360 px is tuned (docs/MOBILE.md); every screen was checked at 277 px
 * (a 360 px phone at 130%) with nothing running off the side, so 130% is offered there.
 */
export const MIN_LAYOUT_WIDTH = 270;

const PREF = 'uiScale';
const DEFAULT_CONTENT = 'width=device-width, initial-scale=1.0, viewport-fit=cover';

/** The layout width for a device width at scale `s`. */
export function layoutWidth(deviceWidth: number, s: number): number {
  return Math.round(deviceWidth / s);
}

/** The scales a device offers: those that keep the portrait layout at least `MIN_LAYOUT_WIDTH` wide. */
export function scalesFor(portraitWidth: number): number[] {
  return UI_SCALES.filter((s) => s <= 1 || layoutWidth(portraitWidth, s) >= MIN_LAYOUT_WIDTH);
}

/** The viewport meta content for a device width at scale `s`. */
export function viewportContent(deviceWidth: number, s: number): string {
  return s === 1 ? DEFAULT_CONTENT : `width=${layoutWidth(deviceWidth, s)}, viewport-fit=cover`;
}

/** The device's width in CSS pixels in each orientation. `screen` is portrait-only on iOS, so take the short and long sides. */
function deviceWidths(): { portrait: number; current: number } {
  const portrait = Math.min(screen.width, screen.height);
  const landscape = window.matchMedia?.('(orientation: landscape)').matches ?? false;
  return { portrait, current: landscape ? Math.max(screen.width, screen.height) : portrait };
}

/** The scale this device offers that is nearest the saved one. */
export function uiScale(): number {
  const saved = loadPref<number>(PREF, 1);
  const offered = scalesFor(deviceWidths().portrait);
  return offered.reduce((a, b) => (Math.abs(b - saved) < Math.abs(a - saved) ? b : a), 1);
}

/** The scales offered on this device. */
export function offeredScales(): number[] {
  return scalesFor(deviceWidths().portrait);
}

/** Whether the game runs inside another page (the itch.io embed), where the viewport tag is ignored. */
function embedded(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

/** The CSS zoom of the interface layer: the scale inside an iframe, 1 everywhere else. */
export function uiZoom(): number {
  return typeof window !== 'undefined' && embedded() ? uiScale() : 1;
}

function apply(): void {
  if (embedded()) {
    const ui = document.getElementById('ui');
    const z = uiZoom();
    if (ui) ui.style.zoom = z === 1 ? '' : String(z);
    window.dispatchEvent(new Event('resize'));
    return;
  }
  const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (!meta) return;
  const content = viewportContent(deviceWidths().current, uiScale());
  if (meta.content === content) return;
  meta.content = content;
  // Not every browser fires `resize` for a new viewport tag, and the map canvas and `useViewport` listen for it. Chrome
  // applies the tag at once; the second event is for a browser that applies it later.
  const resized = () => window.dispatchEvent(new Event('resize'));
  resized();
  setTimeout(resized, 250);
}

/** Save and apply a new scale. */
export function setUiScale(s: number): void {
  savePref(PREF, s);
  apply();
}

/** Apply the saved scale now and again whenever the device rotates. */
export function installUiScale(): void {
  apply();
  window.addEventListener('orientationchange', apply);
  window.matchMedia?.('(orientation: landscape)').addEventListener?.('change', apply);
}
