/**
 * Gold Leaf's painter (docs/mockups/style/STYLE-GUIDE.md): every surface of the interface is drawn at half resolution
 * from ramp colours, aged, and set as its element's background, scaled up with hard pixels; the text on top stays
 * smooth. Elements are matched by `JOBS` (the shared widgets: the wall, tabs, buttons, panels) or name their painting
 * themselves with `data-paint` (and data attributes for its options). Paintings are cached by key and size, and the page
 * is repainted, at most a few times a second, when the DOM changes, the window resizes or the fonts arrive.
 *
 * Opening a tab should never wait on the painter (docs/MENU-SPEED.md): paintings are kept between sessions
 * (`store.ts`); the wall is painted once per size, its calm boxes laid over it from a clean painting; and a tab not open
 * yet can be painted ahead out of sight (`[data-rehearse]`, Camp.tsx), a few milliseconds at a time in idle moments.
 * A painting's wear is seeded by its element's place among its kind inside its tab (`[data-paint-scope]`), so the
 * hidden copy and the real tab get the same paintings.
 */
import { age, type AgeOpts } from './age';
import { KINDS } from './kinds';
import { canvas, col, ctx2d, isRamp, P, rng, seedOf, type Ramp } from './ramps';
import { loadPaintings, savePainting } from './store';
import { bitumenGround, medallion, mixBar, panel, STRIPS, type PanelOpts } from './shapes';

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
  ['.btn.danger', 'panel', { field: 'bitumen', thin: true, loss: 0.03, cracks: 1 }],
  [
    '.btn.on',
    'panel',
    { field: 'gold', thin: true, loss: 0, cracks: 0, texture: 0.45, goldLoss: 0 },
  ],
  ['.btn', 'panel', { field: 'lapis', thin: true, loss: 0.05, cracks: 1 }],
  ['.modal-card', 'panel', { field: 'lapis', loss: 0.03, cracks: 4 }],
];

const cache = new Map<string, string>();
/** A painting from the cache, or made now (and kept, here and between sessions). */
function cached(key: string, make: () => string): string {
  let url = cache.get(key);
  if (url === undefined) {
    url = make();
    remember(key, url);
  }
  return url;
}
function remember(key: string, url: string) {
  cache.set(key, url);
  savePainting(key, url);
  // A long session with many sizes: keep the cache from growing without end.
  if (cache.size > 3000) cache.delete(cache.keys().next().value!);
}
let strips: Record<string, { label: string; W: number; H: number; url: string }> | null = null;

/** Paint the border strips and the small-bar texture once, as CSS variables on the root (--s-wave, --t-lapis ...). */
function makeShared() {
  if (strips) return;
  strips = {};
  for (const [k, [label, W, H, draw]] of Object.entries(STRIPS)) {
    const url = cached(`strip:${k}:${W}x${H}`, () => {
      const cv = canvas(W, H);
      draw(ctx2d(cv), W);
      age(cv, rng(seedOf(k)), { wrapX: true, loss: 0.04, cracks: 1, crackLen: 8, goldLoss: 0.15 });
      return cv.toDataURL();
    });
    strips[k] = { label, W, H, url };
  }
  const tile = (field: Ramp, idx: number, W: number, H: number, seed: number, o: AgeOpts) =>
    cached(`tile:${field}:${idx}:${W}x${H}:${seed}`, () => {
      const cv = canvas(W, H);
      const ctx = ctx2d(cv);
      ctx.fillStyle = col(field, idx);
      ctx.fillRect(0, 0, W, H);
      return age(cv, rng(seed), { wrapX: true, wrapY: true, ...o }).toDataURL();
    });
  const root = document.documentElement.style;
  // The lapis texture is under text wherever it is used (the status line, tips, bars): mottled, never flaked or cracked.
  root.setProperty(
    '--t-lapis',
    `url(${tile('lapis', 3, 96, 96, 12, { loss: 0, cracks: 0, texture: 0.6 })}) 0 0 / ${96 * P}px ${96 * P}px`,
  );
  root.setProperty(
    '--t-green',
    `url(${tile('green', 3, 96, 48, 13, { loss: 0.05, cracks: 2 })}) 0 0 / ${96 * P}px ${48 * P}px`,
  );
  for (const [k, s] of Object.entries(strips))
    root.setProperty(`--s-${k}`, `url(${s.url}) 0 0 / ${s.W * P}px ${s.H * P}px repeat-x`);
  // The dark material of the gear's niche, as a ground for text: its craquelure, no flaking.
  const bitumen = cached('tile:bitumen-ground:96', () => {
    const cv = canvas(96, 96);
    const ctx = ctx2d(cv);
    ctx.fillStyle = col('bitumen', 3);
    ctx.fillRect(0, 0, 96, 96);
    return bitumenGround(cv, rng(seedOf('bitumen-ground'))).toDataURL();
  });
  root.setProperty('--t-bitumen', `url(${bitumen}) 0 0 / ${96 * P}px ${96 * P}px`);
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

/**
 * Where text sits straight on a wall (a screen's title, the camp's head), in the wall's art pixels: kept calm, so no
 * crack or flake runs under the words. Only what is on the wall itself counts, not text on a painted panel.
 */
function calmOf(el: HTMLElement): { x: number; y: number; w: number; h: number }[] {
  const er = el.getBoundingClientRect();
  const sc = el.clientWidth / (er.width || 1);
  const out: { x: number; y: number; w: number; h: number }[] = [];
  el.querySelectorAll<HTMLElement>('h1, h2, .lf-calm, .camp-who').forEach((t) => {
    if (t.closest('[data-paint]') || !t.offsetWidth) return;
    const r = t.getBoundingClientRect();
    out.push({
      x: Math.round(((r.left - er.left) * sc) / P) - 6,
      y: Math.round(((r.top - er.top + el.scrollTop) * sc) / P) - 4,
      w: Math.round((r.width * sc) / P) + 12,
      h: Math.round((r.height * sc) / P) + 8,
    });
  });
  return out;
}

/**
 * The wall at a size: worn gold, or (`clean`) the same gold with the same mottle and none of the wear, to lay over the
 * worn one where text sits on it. Both draw the same random numbers up to the mottle, so they line up pixel for pixel.
 */
function drawWall(
  W: number,
  H: number,
  seedKey: string,
  clean: boolean,
  twin?: (clean: HTMLCanvasElement) => void,
): HTMLCanvasElement {
  const cv = canvas(W, H);
  const ctx = ctx2d(cv);
  ctx.fillStyle = col('gold', 4);
  ctx.fillRect(0, 0, W, H);
  return age(cv, rng(seedOf(seedKey)), {
    loss: 0.045,
    blotch: 7,
    cracks: Math.round((W * H) / 2600),
    crackLen: 30,
    texture: 1.1,
    edgeBias: 0.05,
    grime: 0.9,
    cleanOnly: clean,
    twin,
  });
}

/** The clean walls made this session, by size, to cut calm boxes from (a few: one per window size). */
const cleanWalls = new Map<string, HTMLCanvasElement>();

/**
 * The wall: one worn painting per size, and over it, where text sits straight on the gold (`calmOf`), a box cut from a
 * clean painting of the same size, as extra background layers of the same element. Moving a heading then only cuts a
 * new small box instead of painting the whole wall again.
 */
function paintWall(el: HTMLElement, key: string, pk: string, W: number, H: number) {
  const calm = calmOf(el)
    .map((b) => {
      const x = Math.max(0, b.x);
      const y = Math.max(0, b.y);
      return { x, y, w: Math.min(W, b.x + b.w) - x, h: Math.min(H, b.y + b.h) - y };
    })
    .filter((b) => b.w > 0 && b.h > 0);
  const seedKey = `${key}|${pk}`;
  const size = `${seedKey}|${W}x${H}`;
  const ck = `${size}|${calm.map((b) => `${b.x},${b.y},${b.w},${b.h}`).join(';')}`;
  if (el.dataset.painted === ck) return;
  // The clean twin comes out of the same pass as the worn wall; made alone only when the worn one was kept from before.
  const keepClean = (c: HTMLCanvasElement) => {
    cleanWalls.set(size, c);
    if (cleanWalls.size > 4) cleanWalls.delete(cleanWalls.keys().next().value!);
  };
  const base = cached(`wall:${size}`, () =>
    drawWall(W, H, seedKey, false, calm.length ? keepClean : undefined).toDataURL(),
  );
  const boxes = calm.map((b) => ({
    b,
    url: cached(`wall:${size}|calm:${b.x},${b.y},${b.w},${b.h}`, () => {
      let clean = cleanWalls.get(size);
      if (!clean) keepClean((clean = drawWall(W, H, seedKey, true)));
      const cut = canvas(b.w, b.h);
      ctx2d(cut).drawImage(clean, b.x, b.y, b.w, b.h, 0, 0, b.w, b.h);
      return cut.toDataURL();
    }),
  }));
  el.dataset.painted = ck;
  sized?.observe(el);
  // A screen with a scrollbar (the title) is narrower than one without (the camp): the wider wall is made in the next
  // idle moment, so the screen that comes next need not paint it.
  const wide = Math.ceil(el.offsetWidth / P);
  if (wide > W) {
    const wideSize = `${seedKey}|${wide}x${H}`;
    if (!cache.has(`wall:${wideSize}`) && typeof requestIdleCallback === 'function')
      requestIdleCallback(
        () => {
          if (cache.has(`wall:${wideSize}`)) return;
          const url = drawWall(wide, H, seedKey, false, (c) => {
            cleanWalls.set(wideSize, c);
            if (cleanWalls.size > 4) cleanWalls.delete(cleanWalls.keys().next().value!);
          }).toDataURL();
          remember(`wall:${wideSize}`, url);
        },
        { timeout: 2000 },
      );
  }
  const s = el.style;
  s.backgroundImage = [...boxes.map((x) => `url(${x.url})`), `url(${base})`].join(', ');
  s.backgroundSize = [
    ...boxes.map((x) => `${x.b.w * P}px ${x.b.h * P}px`),
    `${W * P}px ${H * P}px`,
  ].join(', ');
  s.backgroundPosition = [...boxes.map((x) => `${x.b.x * P}px ${x.b.y * P}px`), '0 0'].join(', ');
  s.backgroundRepeat = 'no-repeat';
}

/** One paint pass: hidden copies of tabs (`[data-rehearse]`) only make new paintings until `deadline`. */
type Pass = { deadline: number; more: boolean };

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
      // A medallion carries a number or a word across its middle: no flakes or cracks under it.
      calm: [
        {
          x: Math.round(S * 0.15),
          y: Math.round(S * 0.28),
          w: Math.round(S * 0.7),
          h: Math.round(S * 0.44),
        },
      ],
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
    // The dark material: its ground laid on, then aged in its own ramps, worn to the red bole.
    const dark = field === 'bitumen';
    const cv = panel(W, H, opts);
    if (dark) bitumenGround(cv, r);
    return age(cv, r, {
      ...PANEL_AGE,
      loss: dark ? 0.016 : 0.035,
      cracks: Math.min(8, Math.round((W * H) / 6000)),
      ...(dark ? { dark: true, texture: 0.5 } : {}),
      ...(o as AgeOpts),
      ...(d.loss !== undefined ? { loss: num('loss', 0) } : {}),
    }).toDataURL();
  }
  const k = KINDS[kind];
  if (!k) return '';
  const [cv, ao] = k(el, W, H);
  return (ao === false ? cv : age(cv, r, ao)).toDataURL();
}

function paintEl(
  el: HTMLElement,
  kind: string,
  o: Record<string, unknown>,
  key: string,
  pass: Pass,
) {
  const ahead = !!el.closest('[data-rehearse]');
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
  // Everything the painting reads from the element is in its key (field, thin, arch, mix, state, pk ...); not the HUD's
  // flask state (data-st), which changes during play without changing the painting.
  const pk = Object.entries(el.dataset)
    .filter(([k]) => k !== 'painted' && k !== 'st')
    .map(([k, v]) => `${k}=${v}`)
    .join(';');
  if (kind === 'wall') {
    paintWall(el, key, pk, W, H);
    return;
  }
  const ck = `${key}|${pk}|${fz}|${W}x${H}`;
  if (el.dataset.painted === ck) return;
  let url = cache.get(ck);
  if (url === undefined) {
    // A tab painted ahead gives way: past its share of this pass, the rest waits for the next idle moment.
    if (ahead && performance.now() > pass.deadline) {
      pass.more = true;
      return;
    }
    url = draw(el, kind, o, W, H, `${key}|${pk}`);
    remember(ck, url);
  }
  el.dataset.painted = ck;
  if (!ahead) sized?.observe(el);
  const s = el.style;
  s.backgroundImage = url ? `url(${url})` : '';
  s.backgroundSize = `${W * P}px ${H * P}px`;
  s.backgroundRepeat = 'no-repeat';
  s.backgroundPosition = '0 0';
}

/** Take a painting off an element that no longer wants one (a tab that is no longer open, a row no longer picked). */
function unpaint(el: HTMLElement) {
  delete el.dataset.painted;
  sized?.unobserve(el);
  const s = el.style;
  s.backgroundImage = '';
  s.backgroundSize = '';
  s.backgroundRepeat = '';
  s.backgroundPosition = '';
}

/** Time a hidden copy of a tab may spend on new paintings in one pass (at least; an idle moment may give more). */
const AHEAD_MS = 8;

/**
 * Paint everything under `root` that wants a painting, and unpaint what no longer does. Returns whether a tab painted
 * ahead still has paintings to make.
 */
export function paintAll(root: ParentNode = document, aheadMs = AHEAD_MS): boolean {
  makeShared();
  const pass: Pass = { deadline: performance.now() + aheadMs, more: false };
  const before = root.querySelectorAll<HTMLElement>('[data-painted]');
  const done = new Set<HTMLElement>();
  // Keys follow the element's place among its kind inside its tab (or the page), so a surface keeps its wear while the
  // screen stays the same, and a tab painted ahead out of sight gets the paintings it will have when it is opened.
  const counts = new Map<Element | null, Map<string, number>>();
  const keyOf = (el: HTMLElement, base: string) => {
    const scope = el.closest<HTMLElement>('[data-paint-scope]');
    let m = counts.get(scope);
    if (!m) counts.set(scope, (m = new Map()));
    const n = m.get(base) ?? 0;
    m.set(base, n + 1);
    return scope ? `${scope.dataset.paintScope}/${base}#${n}` : `${base}#${n}`;
  };
  root.querySelectorAll<HTMLElement>('[data-paint]').forEach((el) => {
    done.add(el);
    const kind = el.dataset.paint!;
    if (kind === 'none' || el.closest('[data-nopaint], [data-rehearse-wait]')) return;
    // By its first class only: a state class (sel, drop, on) must not re-roll its wear (data-pk says when it should).
    paintEl(el, kind, {}, keyOf(el, `${kind}:${el.classList[0] ?? ''}`), pass);
  });
  for (const [sel, kind, o] of JOBS)
    root.querySelectorAll<HTMLElement>(sel).forEach((el) => {
      if (done.has(el) || el.closest('[data-nopaint], [data-rehearse-wait]')) return;
      done.add(el);
      paintEl(el, kind, o ?? {}, keyOf(el, sel), pass);
    });
  before.forEach((el) => {
    if (!done.has(el) || el.dataset.paint === 'none') unpaint(el);
  });
  return pass.more;
}

/** The strips, for the debug sample sheet. */
export const leafStrips = () => {
  makeShared();
  return strips!;
};

/** Watches the size of everything painted: a box that grows (its text changed, a font loaded) is painted again. */
let sized: ResizeObserver | null = null;
let started = false;
/** Keep the page painted from now on: after DOM changes (throttled), resizes and font loads. */
export function startPainter() {
  if (started || typeof document === 'undefined') return;
  started = true;
  // The paintings kept from earlier sessions first (or at most a quarter second's wait), then the page.
  let begun = false;
  const begin = () => {
    if (begun) return;
    begun = true;
    watch();
  };
  loadPaintings()
    .then((kept) => {
      for (const [k, v] of kept) if (!cache.has(k)) cache.set(k, v);
    })
    .catch(() => {})
    .finally(begin);
  setTimeout(begin, 250);
}

/** Keep the page painted: after DOM changes (throttled), resizes and font loads. */
function watch() {
  let queued = false;
  let last = 0;
  let idleQueued = false;
  // An idle moment, and how long it lasts (the browser says; 8 ms where it cannot).
  const idle = (f: (ms: number) => void) =>
    typeof requestIdleCallback === 'function'
      ? requestIdleCallback((d) => f(Math.max(AHEAD_MS, d.timeRemaining() - 2)), { timeout: 300 })
      : setTimeout(() => f(AHEAD_MS), 30);
  // `ahead`: a pass in an idle moment for a tab painted ahead. It leaves the throttle alone, so a tab clicked right
  // after it is still painted before it shows.
  const run = (ahead = false, ms = AHEAD_MS) => {
    if (!ahead) {
      queued = false;
      last = performance.now();
    }
    let more = false;
    try {
      more = paintAll(document, ms);
    } catch (e) {
      console.error('Gold Leaf painter', e);
    }
    // A tab painted ahead goes on in the next idle moment; when it is done, its owner hears so (and unmounts it).
    if (more) {
      if (!idleQueued) {
        idleQueued = true;
        idle((ms) => {
          idleQueued = false;
          run(true, ms);
        });
      }
    } else if (document.querySelector('[data-rehearse]:not([data-rehearse-wait])'))
      setTimeout(() => window.dispatchEvent(new Event('leaf-rehearsed')), 0);
  };
  const schedule = () => {
    if (queued) return;
    queued = true;
    const wait = Math.max(0, 120 - (performance.now() - last));
    setTimeout(() => run(), wait);
  };
  // Paint at once after a quiet spell, else when the throttle allows (see the observer below).
  const soon = () => {
    if (!queued && performance.now() - last >= 120) run();
    else schedule();
  };
  if (typeof ResizeObserver !== 'undefined') sized = new ResizeObserver(soon);
  new MutationObserver((records) => {
    // Changes inside a part that redraws itself constantly (the map's HUD, the tree's words) do not need the painter.
    // A changed text's target is the text itself: ask its element.
    const within = (n: Node) => (n.nodeType === 3 ? n.parentElement : (n as Element));
    if (records.every((r) => within(r.target)?.closest?.('[data-nopaint]'))) return;
    // After a quiet spell (a new tab, a dialog), paint now, before the browser shows the change: the new screen then
    // appears whole instead of flat for a frame. Changes in quick succession wait for the throttle.
    soon();
  }).observe(document.body, {
    subtree: true,
    childList: true,
    // A text changed in place (a menu's choice described) can make a painted box taller.
    characterData: true,
    attributes: true,
    attributeFilter: [
      'class',
      'data-paint',
      'data-state',
      'data-pk',
      'data-field',
      'hidden',
      'open',
      'data-rehearse-wait',
    ],
  });
  window.addEventListener('resize', schedule);
  document.fonts?.ready.then(schedule);
  document.fonts?.addEventListener?.('loadingdone', schedule);
  schedule();
}
