import { loadPref, savePref } from './prefs';

/**
 * The interface size. Phones differ in how big a CSS pixel looks, so the player picks a size; a desktop has the same
 * picker, and a large screen is never laid out wider than `MAX_LAYOUT_WIDTH` (a big monitor shows a 1440 px layout made
 * bigger, not a wider one with the same small text).
 *
 * It works through the viewport meta tag, not CSS zoom: at 110% the page is laid out `width=<device width ÷ 1.1>` and the
 * browser scales that up to fill the screen. Everything in the page stays in one coordinate space (window size, pointer
 * positions, media queries, the map canvas), so no other code has to know.
 *
 * Desktop browsers and iframes (the itch.io page) ignore the tag, so there the interface layer is zoomed with CSS instead
 * (the map keeps its own zoom). Code that turns window or pointer positions into interface pixels divides by `uiZoom()`.
 */
export const UI_SCALES = [0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3] as const;

/**
 * The narrowest layout width a scale may produce. 360 px is tuned (docs/MOBILE.md); every screen was checked at 277 px
 * (a 360 px phone at 130%) with nothing running off the side, so 130% is offered there.
 */
export const MIN_LAYOUT_WIDTH = 270;

/** The widest a desktop or iframe lays the interface out at 100%: a wider window zooms the interface up to fill it. */
export const MAX_LAYOUT_WIDTH = 1440;
/** ... unless that would leave it shorter than this (an ultrawide monitor): the height then sets the zoom. */
export const MIN_FIT_HEIGHT = 720;

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

/** The zoom that lays a `w` × `h` window out at most `MAX_LAYOUT_WIDTH` wide, never below 1. */
export function fitZoom(w: number, h: number): number {
  return Math.max(1, Math.min(w / MAX_LAYOUT_WIDTH, h / MIN_FIT_HEIGHT));
}

/** The device's width in CSS pixels in each orientation. `screen` is portrait-only on iOS, so take the short and long sides. */
function deviceWidths(): { portrait: number; current: number } {
  const portrait = Math.min(screen.width, screen.height);
  const landscape = window.matchMedia?.('(orientation: landscape)').matches ?? false;
  return { portrait, current: landscape ? Math.max(screen.width, screen.height) : portrait };
}

/**
 * The width the offered scales are judged by: the device's portrait width, or on a desktop the window's width at 100%
 * (a window is resized, not rotated, and `screen` can read 0 for a hidden one).
 */
function judgedWidth(): number {
  if (embedded() || !zoomed()) return deviceWidths().portrait;
  return window.innerWidth / fitZoom(window.innerWidth, window.innerHeight);
}

/** The scale this device offers that is nearest the saved one. */
export function uiScale(): number {
  const saved = loadPref<number>(PREF, 1);
  const offered = scalesFor(judgedWidth());
  return offered.reduce((a, b) => (Math.abs(b - saved) < Math.abs(a - saved) ? b : a), 1);
}

/** The scales offered on this device. */
export function offeredScales(): number[] {
  return scalesFor(judgedWidth());
}

/** Whether the game runs inside another page (the itch.io embed), where the viewport tag is ignored. */
function embedded(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

/**
 * Whether the interface is sized by CSS zoom rather than the viewport tag: inside an iframe, and wherever the main pointer
 * is precise (a desktop browser). Not `device.ts`'s `isCoarse`, which imports this module.
 */
function zoomed(): boolean {
  return embedded() || !window.matchMedia?.('(pointer: coarse)').matches;
}

/** The CSS zoom of the interface layer: the fit to the window times the scale where `zoomed`, 1 everywhere else. */
export function uiZoom(): number {
  if (typeof window === 'undefined' || !zoomed()) return 1;
  return Math.round(fitZoom(window.innerWidth, window.innerHeight) * uiScale() * 100) / 100;
}

function apply(): void {
  if (zoomed()) {
    const ui = document.getElementById('ui');
    if (!ui) return;
    const z = uiZoom();
    // Viewport units are zoomed with the layer, so 50vh in it would be more than half the window: the layer's CSS uses
    // var(--vh) and var(--vw), the window's hundredths in its own pixels (plain vh and vw when it is not zoomed).
    for (const [v, n] of [
      ['--vh', window.innerHeight],
      ['--vw', window.innerWidth],
    ] as const) {
      if (z === 1) ui.style.removeProperty(v);
      else ui.style.setProperty(v, `${n / 100 / z}px`);
    }
    const zoom = z === 1 ? '' : String(z);
    // Only on a change: this runs on every resize, and the event would bring it back.
    if (ui.style.zoom === zoom) return;
    ui.style.zoom = zoom;
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

/** Apply the saved scale now and again whenever the device rotates or the window is resized (the fit follows it). */
export function installUiScale(): void {
  apply();
  window.addEventListener('resize', () => zoomed() && apply());
  window.addEventListener('orientationchange', apply);
  window.matchMedia?.('(orientation: landscape)').addEventListener?.('change', apply);
}
