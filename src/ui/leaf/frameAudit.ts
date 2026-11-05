/**
 * The frame check (docs/UI-FRAMES.md): for every painted panel on the screen, what crosses from its field onto its
 * frame: letters, icons, inputs and painted boxes inside it. `window.__dev.frames()` in a dev build; a sweep is the same
 * call on every screen at 1280, 800 and 375 px wide.
 */

/** Where the field starts, in screen pixels from the box's edge: left, top, right, bottom. */
type Inset = [number, number, number, number];

/** A ringed control keeps its letters 2 px clear of the 2 px rim, plus the 4 px of shadow room right and below. */
const RING: Inset = [4, 4, 8, 8];
/** A thin frame: 4 px of shadow room, 6 of gold, 2 of ink. */
const THIN: Inset = [12, 12, 12, 12];
const FULL: Inset = [18, 18, 18, 18];
/** What may cross unremarked: the darkened outer pixels of the field and the ink line read as one edge. */
const SLACK = 2;
/** A box inside a frame (a button, a field, an icon) keeps this much of the field between it and the ink line. */
const BOX_GAP = 2;

function insetOf(el: HTMLElement): Inset | null {
  const d = el.dataset;
  const paint = el.getAttribute('data-paint');
  const key = d.painted ?? '';
  if (paint === 'panel') return 'ring' in d ? RING : 'thin' in d ? THIN : FULL;
  if (paint) return null;
  // The shared widgets painted by class (painter.ts, JOBS).
  if (/\.btn|\.tab\.on|ui-scale/.test(key)) return THIN;
  if (/modal-card/.test(key)) return FULL;
  return null;
}

/** The part of the screen a node is seen in: its scrolling ancestors' boxes, up to `stop`. */
function clipOf(n: Node, stop: HTMLElement): DOMRect {
  let l = -1e9,
    t = -1e9,
    r = 1e9,
    b = 1e9;
  for (let p = n.parentElement; p && p !== stop; p = p.parentElement) {
    const cs = getComputedStyle(p);
    if (/(auto|scroll|hidden)/.test(cs.overflowX + cs.overflowY)) {
      const q = p.getBoundingClientRect();
      l = Math.max(l, q.left);
      t = Math.max(t, q.top);
      r = Math.min(r, q.right);
      b = Math.min(b, q.bottom);
    }
  }
  return new DOMRect(l, t, r - l, b - t);
}

let measure: CanvasRenderingContext2D | null = null;
/**
 * Where a text's letters sit in its box, in CSS pixels: from the box's top to its tallest glyph, and from the box's foot
 * to a pixel below its baseline.
 */
function inkOf(e: Element, text: string): { top: number; bottom: number } {
  const cs = getComputedStyle(e);
  measure ??= document.createElement('canvas').getContext('2d');
  if (!measure) return { top: 0, bottom: 0 };
  measure.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const m = measure.measureText(text.trim() || 'H');
  return {
    top: Math.max(0, m.fontBoundingBoxAscent - m.actualBoundingBoxAscent),
    bottom: Math.max(0, m.fontBoundingBoxDescent - 1),
  };
}

/** An element's box less its padding, on the screen. */
function contentRect(e: HTMLElement): DOMRect {
  const r = e.getBoundingClientRect();
  const sc = r.width / (e.offsetWidth || 1);
  const cs = getComputedStyle(e);
  const [t, ri, b, l] = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(
    (v) => parseFloat(v) * sc,
  );
  return new DOMRect(r.left + l, r.top + t, r.width - l - ri, r.height - t - b);
}

/**
 * The curve of an arched panel's field (shapes.ts: the arch's radius is up to 84 art pixels, inside the rim and the ink
 * line): how far a point, in CSS pixels from the box's top left, lies outside it (0 inside).
 */
function archOf(widthCss: number, thin: boolean): (x: number, y: number) => number {
  const P = 2;
  const m = thin ? 2 : 3;
  const fi = (thin ? 3 : 5) + 1;
  const Wc = Math.ceil(widthCss / P) - 2 * m;
  const ar = Math.min(Math.round(Wc / 2), 84);
  const rx = (Wc - 2 * fi) / 2;
  const ry = ar - fi;
  const cx = m + Wc / 2;
  const cy = m + fi + ry;
  return (x, y) => {
    const px = x / P;
    const py = y / P;
    if (py >= cy || rx <= 0 || ry <= 0) return 0;
    const d = Math.hypot((px - cx) / rx, (py - cy) / ry);
    return d <= 1 ? 0 : (d - 1) * Math.min(rx, ry) * P;
  };
}

export type FrameFault = {
  /** The painting's key (its tab, selector and index). */
  panel: string;
  /** What crosses: the start of a text, or a box's class. */
  what: string;
  /** By how many pixels it crosses the field's edge: left, top, right, bottom (negative: clear by that much). */
  sides: number[];
  over: number;
};

export function frameAudit(root: ParentNode = document): FrameFault[] {
  const out: FrameFault[] = [];
  for (const el of root.querySelectorAll<HTMLElement>('[data-painted]')) {
    const ins = insetOf(el);
    if (!ins || !el.offsetWidth) continue;
    const R = el.getBoundingClientRect();
    // The interface size scales the whole screen: a frame is that much wider on the screen.
    const sc = R.width / el.offsetWidth;
    const F = {
      l: R.left + ins[0] * sc,
      t: R.top + ins[1] * sc,
      r: R.right - ins[2] * sc,
      b: R.bottom - ins[3] * sc,
    };
    // A ring's inset already keeps letters clear of its rim; a box inside it needs nothing more.
    const boxGap = ins === RING ? 0 : BOX_GAP;
    const arch = 'arch' in el.dataset ? archOf(el.offsetWidth, ins === THIN) : null;
    let worst: FrameFault | null = null;
    /** `gap`: how far inside the field it must stay (negative: how far it may cross). */
    const consider = (
      q: DOMRect,
      what: string,
      clip: DOMRect,
      gap: number,
      inkTop = 0,
      inkBottom = 0,
    ) => {
      if (q.width < 1 || q.height < 1) return;
      const l = Math.max(q.left, clip.left);
      const t = Math.max(q.top + inkTop, clip.top);
      const r = Math.min(q.right, clip.right);
      const b = Math.min(q.bottom - inkBottom, clip.bottom);
      if (r <= l || b <= t) return;
      const sides = [F.l - l, F.t - t, r - F.r, b - F.b].map((v) => Math.round(v / sc));
      // Under an arch, the top corners must also be inside its curve.
      const curve = arch
        ? Math.max(
            arch((l - R.left) / sc, (t - R.top) / sc),
            arch((r - R.left) / sc, (t - R.top) / sc),
          )
        : 0;
      const over = curve > 0 ? Math.max(...sides, Math.round(curve)) : Math.max(...sides);
      if (curve > 0 && over === Math.round(curve)) what += ' (arch)';
      if (over + gap > 0 && (!worst || over > worst.over))
        worst = { panel: (el.dataset.painted ?? '').split('|')[0], what, sides, over };
    };
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: (n) => {
        if (n.nodeType === Node.TEXT_NODE)
          return n.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        const e = n as HTMLElement;
        if (e === el) return NodeFilter.FILTER_SKIP;
        const cs = getComputedStyle(e);
        if (cs.display === 'none' || cs.position === 'fixed') return NodeFilter.FILTER_REJECT;
        // A painted box inside is checked as a whole here, and its own content when the loop reaches it.
        if (e.dataset.painted && insetOf(e)) {
          consider(e.getBoundingClientRect(), `box .${e.className}`, clipOf(e, el), boxGap);
          return NodeFilter.FILTER_REJECT;
        }
        // A field or menu with no frame of its own (one set in a plaque) shows only its line of text, checked as
        // text is: its line box holds the capitals from about 0.28 of the size below its top to the baseline about
        // 0.22 above its foot.
        if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.tagName) && !e.dataset.painted) {
          const size = parseFloat(cs.fontSize) || 17;
          const sc = e.getBoundingClientRect().width / (e.offsetWidth || 1);
          consider(
            contentRect(e),
            `${e.tagName.toLowerCase()} .${e.className}`,
            clipOf(e, el),
            -SLACK,
            0.28 * size * sc,
            0.22 * size * sc,
          );
          return NodeFilter.FILTER_REJECT;
        }
        if (/^(INPUT|SELECT|TEXTAREA|CANVAS|IMG)$/.test(e.tagName) || e.dataset.painted) {
          consider(
            e.getBoundingClientRect(),
            `${e.tagName.toLowerCase()} .${e.className}`,
            clipOf(e, el),
            boxGap,
          );
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_SKIP;
      },
    });
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const range = document.createRange();
      range.selectNodeContents(n);
      // A text's box is its font's whole height (ascent and descent); its letters run from its tallest glyph down to
      // its baseline, measured in its own font (Grenze and Jacquard sit differently in their boxes). Descenders may dip
      // into the ink line, as on Undo, which the owner judged fine (2026-11-05): a pixel below the baseline counts.
      const ink = inkOf(n.parentElement!, n.textContent ?? '');
      const clip = clipOf(n, el);
      for (const q of range.getClientRects())
        consider(
          q,
          `"${(n.textContent ?? '').trim().slice(0, 24)}"`,
          clip,
          -SLACK,
          ink.top * sc,
          ink.bottom * sc,
        );
    }
    if (worst) out.push(worst);
  }
  return out;
}
