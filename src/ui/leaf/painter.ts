/**
 * Gold Leaf's painter (docs/mockups/style/STYLE-GUIDE.md): every surface of the interface is drawn at half resolution
 * from ramp colours, aged, and set as its element's background, scaled up with hard pixels; the text on top stays
 * smooth. Elements are matched by `JOBS` (the shared widgets: the wall, tabs, buttons, panels) or name their painting
 * themselves with `data-paint` (and data attributes for its options). Paintings are cached by key and size, and the page
 * is repainted, at most a few times a second, when the DOM changes, the window resizes or the fonts arrive.
 */
import { age, type AgeOpts } from './age';
import { KINDS } from './kinds';
import { canvas, col, ctx2d, isRamp, P, rng, seedOf, type Ramp } from './ramps';
import { medallion, mixBar, panel, STRIPS, type PanelOpts } from './shapes';

type Job = [selector: string, kind: string, opts?: Record<string, unknown>];

const PANEL_AGE: AgeOpts = {
  texture: 0.55,
  edgeBias: 0.45,
  edgeReach: 12,
  goldLoss: 0.08,
  shadow: true,
};

/**
 * The shared widgets, matched by class (first match wins; an element with `data-paint` is painted by that instead, and
 * `data-paint="none"` is left alone). The tabs' own looks add their pieces with `data-paint` in their markup.
 */
const JOBS: Job[] = [
  ['.screen:not(.hud-screen)', 'wall'],
  ['.tabs', 'field', { field: 'lapis', idx: 2, loss: 0.02, cracks: 4, texture: 0.6 }],
  ['.camp-bar', 'field', { field: 'green', idx: 3, loss: 0.04, cracks: 3 }],
  [
    '.tab.on',
    'panel',
    { field: 'gold', rim: 'ink', thin: true, loss: 0, cracks: 0, texture: 0.45, goldLoss: 0 },
  ],
  ['.btn.primary', 'panel', { field: 'vermilion', thin: true, loss: 0.05, cracks: 1 }],
  ['.btn.danger', 'panel', { field: 'porphyry', thin: true, loss: 0.05, cracks: 1 }],
  [
    '.btn.on',
    'panel',
    { field: 'gold', thin: true, loss: 0, cracks: 0, texture: 0.45, goldLoss: 0 },
  ],
  ['.btn', 'panel', { field: 'lapis', thin: true, loss: 0.05, cracks: 1 }],
  ['.modal-card', 'panel', { field: 'lapis', loss: 0.03, cracks: 4 }],
];

const cache = new Map<string, string>();
let strips: Record<string, { label: string; W: number; H: number; url: string }> | null = null;

/** Paint the border strips and the small-bar texture once, as CSS variables on the root (--s-wave, --t-lapis ...). */
function makeShared() {
  if (strips) return;
  strips = {};
  for (const [k, [label, W, H, draw]] of Object.entries(STRIPS)) {
    const cv = canvas(W, H);
    draw(ctx2d(cv), W);
    age(cv, rng(seedOf(k)), { wrapX: true, loss: 0.04, cracks: 1, crackLen: 8, goldLoss: 0.15 });
    strips[k] = { label, W, H, url: cv.toDataURL() };
  }
  const tile = (field: Ramp, idx: number, W: number, H: number, seed: number, o: AgeOpts) => {
    const cv = canvas(W, H);
    const ctx = ctx2d(cv);
    ctx.fillStyle = col(field, idx);
    ctx.fillRect(0, 0, W, H);
    return age(cv, rng(seed), { wrapX: true, wrapY: true, ...o }).toDataURL();
  };
  const root = document.documentElement.style;
  root.setProperty(
    '--t-lapis',
    `url(${tile('lapis', 3, 96, 96, 12, { loss: 0.02, cracks: 2, texture: 0.6 })}) 0 0 / ${96 * P}px ${96 * P}px`,
  );
  root.setProperty(
    '--t-green',
    `url(${tile('green', 3, 96, 48, 13, { loss: 0.05, cracks: 2 })}) 0 0 / ${96 * P}px ${48 * P}px`,
  );
  for (const [k, s] of Object.entries(strips))
    root.setProperty(`--s-${k}`, `url(${s.url}) 0 0 / ${s.W * P}px ${s.H * P}px repeat-x`);
}

/** A ramp and step from "lapis,4" (or a bare ramp). */
function rampOf(v: string | undefined, fallback: [Ramp, number]): [Ramp, number] {
  if (!v) return fallback;
  const [r, i] = v.split(',');
  return isRamp(r) ? [r, i !== undefined ? Number(i) : fallback[1]] : fallback;
}

/** The art pixel at which a frieze starts under each heading that belongs to `el` (`.lf-h`, `.cs-section h4`). */
function friezesOf(el: HTMLElement): number[] {
  const heads = el.querySelectorAll<HTMLElement>('.lf-h');
  if (!heads.length) return [];
  const er = el.getBoundingClientRect();
  const sc = el.offsetHeight / (er.height || 1);
  const out: number[] = [];
  heads.forEach((h) => {
    if (h.closest('[data-paint="panel"], .lf-panel') !== el) return;
    out.push(Math.round(((h.getBoundingClientRect().bottom - er.top) * sc) / P) - 12);
  });
  return out;
}

function draw(
  el: HTMLElement,
  kind: string,
  o: Record<string, unknown>,
  W: number,
  H: number,
  key: string,
): string {
  const r = rng(seedOf(key));
  const d = el.dataset;
  const num = (k: string, v: unknown) =>
    d[k] !== undefined ? Number(d[k]) : (v as number | undefined);
  if (kind === 'wall') {
    const cv = canvas(W, H);
    const ctx = ctx2d(cv);
    ctx.fillStyle = col('gold', 4);
    ctx.fillRect(0, 0, W, H);
    return age(cv, r, {
      loss: 0.045,
      blotch: 7,
      cracks: Math.round((W * H) / 2600),
      crackLen: 30,
      texture: 1.1,
      edgeBias: 0.05,
      grime: 0.9,
    }).toDataURL();
  }
  if (kind === 'field') {
    const [field, idx] = rampOf(d.field, [(o.field as Ramp) ?? 'lapis', (o.idx as number) ?? 3]);
    const cv = canvas(W, H);
    const ctx = ctx2d(cv);
    ctx.fillStyle = col(field, idx);
    ctx.fillRect(0, 0, W, H);
    return age(cv, r, { edgeBias: 0, grime: 0.6, ...(o as AgeOpts) }).toDataURL();
  }
  if (kind === 'medal') {
    const S = Math.min(W, H);
    const [field, from] = rampOf(d.field, ['lapis', 4]);
    const m = d.medal ?? '';
    const wreath = m.includes('wreath');
    const R = Math.round(wreath ? S * 0.31 : S * 0.38);
    const cv = medallion(S, {
      field,
      from,
      R,
      wreath,
      stars: m.includes('stars'),
      big: wreath || m.includes('big'),
      plain: m.includes('plain') || S < 30,
    });
    return age(cv, r, {
      loss: 0.035,
      cracks: wreath ? 3 : 1,
      crackLen: 10,
      texture: 0.75,
      edgeBias: 0.5,
      edgeReach: 6,
      goldLoss: 0.08,
      shadow: true,
    }).toDataURL();
  }
  if (kind === 'mix') {
    const mix = (d.mix ?? '').split(',').map(Number);
    return age(mixBar(W, H, mix), r, {
      loss: 0.02,
      texture: 0.6,
      grime: 0.5,
      goldLoss: 0,
    }).toDataURL();
  }
  if (kind === 'panel') {
    const [field] = rampOf(d.field, [(o.field as Ramp) ?? 'lapis', 4]);
    const rim = isRamp(d.rim) ? d.rim : (o.rim as Ramp | undefined);
    const opts: PanelOpts = {
      field,
      rim,
      thin: 'thin' in d || !!o.thin,
      arch: 'arch' in d || !!o.arch,
      pearls: 'pearls' in d || !!o.pearls,
      foot: 'foot' in d || !!o.foot,
      friezes: friezesOf(el),
    };
    return age(panel(W, H, opts), r, {
      ...PANEL_AGE,
      loss: 0.035,
      cracks: Math.min(8, Math.round((W * H) / 6000)),
      ...(o as AgeOpts),
      ...(d.loss !== undefined ? { loss: num('loss', 0) } : {}),
    }).toDataURL();
  }
  const k = KINDS[kind];
  if (!k) return '';
  const [cv, ao] = k(el, W, H);
  return (ao === false ? cv : age(cv, r, ao)).toDataURL();
}

function paintEl(el: HTMLElement, kind: string, o: Record<string, unknown>, key: string) {
  let W = Math.ceil(el.offsetWidth / P);
  let H = Math.ceil(el.offsetHeight / P);
  if (!W || !H) return;
  if (['medal', 'gem', 'slot', 'sep', 'star'].includes(kind)) W = H = Math.min(W, H);
  // A wall is the screen's own box: its content scrolls over it.
  if (kind === 'wall') {
    W = Math.ceil(el.clientWidth / P);
    H = Math.ceil(el.clientHeight / P);
  }
  const fz = kind === 'panel' ? friezesOf(el).join(',') : '';
  const pk = el.dataset.pk ?? '';
  const ck = `${key}|${pk}|${fz}|${W}x${H}`;
  if (el.dataset.painted === ck) return;
  let url = cache.get(ck);
  if (url === undefined) {
    url = draw(el, kind, o, W, H, `${key}|${pk}`);
    cache.set(ck, url);
    // A long session with many sizes: keep the cache from growing without end.
    if (cache.size > 1500) cache.delete(cache.keys().next().value!);
  }
  el.dataset.painted = ck;
  const s = el.style;
  s.backgroundImage = url ? `url(${url})` : '';
  s.backgroundSize = `${W * P}px ${H * P}px`;
  s.backgroundRepeat = 'no-repeat';
  s.backgroundPosition = '0 0';
}

/** Paint everything under `root` that wants a painting. */
export function paintAll(root: ParentNode = document) {
  makeShared();
  const done = new Set<HTMLElement>();
  const seen = new Map<string, number>();
  root.querySelectorAll<HTMLElement>('[data-paint]').forEach((el) => {
    done.add(el);
    const kind = el.dataset.paint!;
    if (kind === 'none' || el.closest('[data-nopaint]')) return;
    // Keys follow the element's place among its kind, so a surface keeps its wear while the screen stays the same.
    const base = `${kind}:${el.className}`;
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    paintEl(el, kind, {}, `${base}#${n}`);
  });
  for (const [sel, kind, o] of JOBS) {
    let i = 0;
    root.querySelectorAll<HTMLElement>(sel).forEach((el) => {
      if (done.has(el) || el.closest('[data-nopaint]')) return;
      done.add(el);
      paintEl(el, kind, o ?? {}, `${sel}#${i++}`);
    });
  }
}

/** The strips, for the debug sample sheet. */
export const leafStrips = () => {
  makeShared();
  return strips!;
};

let started = false;
/** Keep the page painted from now on: after DOM changes (throttled), resizes and font loads. */
export function startPainter() {
  if (started || typeof document === 'undefined') return;
  started = true;
  let queued = false;
  let last = 0;
  const run = () => {
    queued = false;
    last = performance.now();
    try {
      paintAll(document);
    } catch (e) {
      console.error('Gold Leaf painter', e);
    }
  };
  const schedule = () => {
    if (queued) return;
    queued = true;
    const wait = Math.max(0, 120 - (performance.now() - last));
    setTimeout(() => requestAnimationFrame(run), wait);
  };
  new MutationObserver((records) => {
    // Changes inside a part that redraws itself constantly (the map's HUD, the tree's words) do not need the painter.
    if (records.every((r) => (r.target as Element).closest?.('[data-nopaint]'))) return;
    schedule();
  }).observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [
      'class',
      'data-paint',
      'data-state',
      'data-pk',
      'data-field',
      'hidden',
      'open',
    ],
  });
  window.addEventListener('resize', schedule);
  document.fonts?.ready.then(schedule);
  document.fonts?.addEventListener?.('loadingdone', schedule);
  schedule();
}
