import { Rng } from '../../../core/rng';
import {
  buildFigure,
  isHero,
  poseFor,
  type AnimName,
  type FigureKind,
  type Prim,
  type Role,
} from '../../style/figure';

/** One world tile in px (top-down, orthographic). */
export const ITILE = 40;
export const IPX = 1.0;
export const BOIL = 3;
export const FRAMES: Record<AnimName, number> = { idle: 2, walk: 4, attack: 4, stun: 2, death: 4 };
const SS = 4;
/** Output resolution multiplier: textures are RES× the design size and displayed at 1/RES. */
export const RES = 2;

export const SCALE_OF: Record<FigureKind, number> = {
  warrior: 1,
  brute: 1.35,
  archer: 0.95,
  mage: 0.95,
  boss: 2,
  hero_mace: 1.05,
  hero_sword: 1,
  hero_bow: 1,
  hero_wand: 1,
  hero_dagger: 0.98,
};

export const INK = '#1c1612';
export const PAPER = '#ecdcb4';

const WASH: Record<Role, string> = {
  bone: '#fbf3dc',
  boneShade: '#e3d2a6',
  dark: '#1c1612',
  cloth: '#8b6f55',
  clothShade: '#6a5340',
  accent: '#b4332a',
  metal: '#cfd5da',
  metalShade: '#98a2ab',
  wood: '#a8805a',
  skin: '#f0c9a0',
  glow: '#ffd27a',
  eye: '#a3201c',
};

function mix(c: number, w: string, t: number): string {
  const r = (c >> 16) & 255;
  const g = (c >> 8) & 255;
  const b = c & 255;
  const pr = parseInt(w.slice(1, 3), 16);
  const pg = parseInt(w.slice(3, 5), 16);
  const pb = parseInt(w.slice(5, 7), 16);
  return `rgb(${(r + (pr - r) * t) | 0},${(g + (pg - g) * t) | 0},${(b + (pb - b) * t) | 0})`;
}

function heroWash(classColor: number): Record<Role, string> {
  return {
    ...WASH,
    cloth: mix(classColor, '#ecdcb4', 0.4),
    clothShade: mix(classColor, '#9a7a5a', 0.4),
    bone: mix(classColor, '#ecdcb4', 0.45),
    boneShade: mix(classColor, '#9a7a5a', 0.45),
    accent: '#b4332a',
  };
}

type Pt = [number, number];

function polyFor(p: Prim, ox: number, oy: number, s: number, rng: Rng): Pt[] {
  const j = (a: number) => (rng.next() - 0.5) * a * SS;
  const pts: Pt[] = [];
  switch (p.k) {
    case 'circ': {
      const r = p.r * s;
      const n = 16;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        pts.push([
          ox + p.x * s + Math.cos(a) * (r + j(0.5)),
          oy + p.y * s + Math.sin(a) * (r + j(0.5)),
        ]);
      }
      return pts;
    }
    case 'cap': {
      const x1 = ox + p.x1 * s;
      const y1 = oy + p.y1 * s;
      const x2 = ox + p.x2 * s;
      const y2 = oy + p.y2 * s;
      const r = Math.max(1.1 * SS, p.r * s);
      const a = Math.atan2(y2 - y1, x2 - x1);
      for (let i = 0; i <= 6; i++) {
        const t = a - Math.PI / 2 - (i / 6) * Math.PI;
        pts.push([x2 + Math.cos(t) * r + j(0.4), y2 + Math.sin(t) * r + j(0.4)]);
      }
      for (let i = 0; i <= 6; i++) {
        const t = a + Math.PI / 2 - (i / 6) * Math.PI;
        pts.push([x1 + Math.cos(t) * r + j(0.4), y1 + Math.sin(t) * r + j(0.4)]);
      }
      return pts;
    }
    case 'box': {
      const w = (p.w * s) / 2;
      const h = (p.h * s) / 2;
      const cx = ox + p.x * s;
      const cy = oy + p.y * s;
      const c = Math.cos(p.rot);
      const sn = Math.sin(p.rot);
      const corners: Pt[] = [
        [-w, -h],
        [0, -h],
        [w, -h],
        [w, 0],
        [w, h],
        [0, h],
        [-w, h],
        [-w, 0],
      ];
      for (const [x, y] of corners)
        pts.push([cx + x * c - y * sn + j(0.7), cy + x * sn + y * c + j(0.7)]);
      return pts;
    }
    case 'tri':
      for (let i = 0; i < 3; i++)
        pts.push([ox + p.pts[i * 2] * s + j(0.6), oy + p.pts[i * 2 + 1] * s + j(0.6)]);
      return pts;
  }
}

function pathOf(c: CanvasRenderingContext2D, pts: Pt[]): void {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
}

export function frameSize(kind: FigureKind): number {
  return Math.ceil(88 * SCALE_OF[kind] * IPX) + 8;
}

/**
 * A hand-inked, watercolour-washed figure. `variant` jitters every outline so cycling variants
 * produces the "boiling line" look.
 */
export function rasterFigure(
  kind: FigureKind,
  anim: AnimName,
  t: number,
  classColor: number,
  variant: number,
): HTMLCanvasElement {
  const S = frameSize(kind);
  const W = S * SS;
  const wash = isHero(kind) ? heroWash(classColor) : WASH;
  const prims = buildFigure(kind, poseFor(kind, anim, t));
  const main = document.createElement('canvas');
  main.width = main.height = W;
  const c = main.getContext('2d')!;
  const s = IPX * SS;
  const ox = W / 2;
  const oy = W * 0.86;
  const seed =
    (kind.length * 977 + anim.length * 131 + Math.floor(t * 100) * 17 + variant * 7919) >>> 0;
  const rng = new Rng(seed);
  prims.forEach((p) => {
    const pts = polyFor(p, ox, oy, s, rng);
    const color = wash[p.role];
    // Wash, with the pigment pooling toward the edge.
    pathOf(c, pts);
    c.globalAlpha = 0.95;
    c.fillStyle = color;
    c.fill();
    c.globalAlpha = 1;
    c.save();
    pathOf(c, pts);
    c.clip();
    c.strokeStyle = 'rgba(60,35,15,0.28)';
    c.lineWidth = 2.6 * SS;
    c.stroke();
    // Hatching on the shaded (lower-right) side.
    let cx = 0;
    let cy = 0;
    for (const [x, y] of pts) {
      cx += x / pts.length;
      cy += y / pts.length;
    }
    c.beginPath();
    c.rect(cx - 2 * SS, cy - 40 * SS, 80 * SS, 80 * SS);
    c.clip();
    if (p.role !== 'dark' && p.role !== 'eye') {
      c.strokeStyle = 'rgba(28,22,18,0.4)';
      c.lineWidth = 0.55 * SS;
      for (let k = -40; k < 40; k++) {
        const o = k * 2.2 * SS + rng.next() * SS;
        c.beginPath();
        c.moveTo(cx + o - 30 * SS, cy + 30 * SS + (rng.next() - 0.5) * SS);
        c.lineTo(cx + o + 30 * SS, cy - 30 * SS);
        c.stroke();
      }
    }
    c.restore();
    // Ink outline, drawn twice for a sketchy double line.
    c.strokeStyle = INK;
    c.lineJoin = 'round';
    c.lineWidth = (1.7 + rng.next() * 0.7) * SS;
    pathOf(c, pts);
    c.stroke();
    if (p.role !== 'dark' && rng.chance(0.7)) {
      c.globalAlpha = 0.45;
      c.lineWidth = 1 * SS;
      pathOf(
        c,
        pts.map(
          ([x, y]) => [x + (rng.next() - 0.5) * 1.6 * SS, y + (rng.next() - 0.5) * 1.6 * SS] as Pt,
        ),
      );
      c.stroke();
      c.globalAlpha = 1;
    }
  });
  const out = document.createElement('canvas');
  out.width = out.height = S * RES;
  const oc = out.getContext('2d')!;
  oc.imageSmoothingQuality = 'high';
  oc.drawImage(main, 0, 0, S * RES, S * RES);
  return out;
}

// ---- Environment and effect sprites -------------------------------------------------------------

function cv(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

export function paperTexture(size = 256): HTMLCanvasElement {
  const [cnv, c] = cv(size, size);
  const rng = new Rng(42);
  c.fillStyle = PAPER;
  c.fillRect(0, 0, size, size);
  // Mottled tone.
  for (let i = 0; i < 140; i++) {
    const g = c.createRadialGradient(0, 0, 0, 0, 0, rng.int(14, 46));
    const a = rng.next() * 0.07;
    g.addColorStop(0, rng.chance(0.5) ? `rgba(120,80,30,${a})` : `rgba(255,245,215,${a * 1.4})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.save();
    c.translate(rng.next() * size, rng.next() * size);
    c.fillStyle = g;
    c.fillRect(-50, -50, 100, 100);
    c.restore();
  }
  // Fibres and flecks.
  for (let i = 0; i < 260; i++) {
    c.strokeStyle = `rgba(110,80,40,${0.05 + rng.next() * 0.1})`;
    c.lineWidth = 0.6;
    const x = rng.next() * size;
    const y = rng.next() * size;
    const a = rng.next() * Math.PI;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * rng.int(3, 9), y + Math.sin(a) * rng.int(3, 9));
    c.stroke();
  }
  for (let i = 0; i < 90; i++) {
    c.fillStyle = `rgba(80,55,25,${0.1 + rng.next() * 0.15})`;
    c.fillRect(rng.int(0, size - 1), rng.int(0, size - 1), 1, 1);
  }
  return cnv;
}

/** A wobbly line between two points. */
export function inkLine(
  c: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rng: Rng,
  amp = 1.2,
): void {
  const n = Math.max(2, Math.floor(Math.hypot(x2 - x1, y2 - y1) / 8));
  c.beginPath();
  c.moveTo(x1, y1);
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    c.lineTo(
      x1 + (x2 - x1) * t + (rng.next() - 0.5) * amp * 2,
      y1 + (y2 - y1) * t + (rng.next() - 0.5) * amp * 2,
    );
  }
  c.stroke();
}

export const SPRITES: Record<string, HTMLCanvasElement> = {};

function blob(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rng: Rng,
  n = 14,
  wob = 0.25,
): void {
  c.beginPath();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (1 + (rng.next() - 0.5) * wob * 2);
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
}

export function buildSprites(): Record<string, HTMLCanvasElement> {
  if (Object.keys(SPRITES).length) return SPRITES;
  const add = (
    k: string,
    w: number,
    h: number,
    draw: (c: CanvasRenderingContext2D, w: number, h: number, rng: Rng) => void,
    seed = 3,
  ) => {
    const [cnv, c] = cv(w, h);
    draw(c, w, h, new Rng(seed));
    SPRITES[k] = cnv;
  };
  SPRITES.paper = paperTexture();
  add('base', 56, 30, (c, w, h, rng) => {
    c.fillStyle = '#fff';
    c.beginPath();
    c.ellipse(w / 2, h / 2, w / 2 - 3, h / 2 - 3, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 2.4;
    c.stroke();
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(w / 2, h / 2, w / 2 - 8, h / 2 - 7, 0, 0, Math.PI * 2);
    c.stroke();
    void rng;
  });
  add('shadow', 56, 30, (c, w, h) => {
    c.fillStyle = 'rgba(40,25,10,0.38)';
    c.beginPath();
    c.ellipse(w / 2, h / 2, w / 2 - 3, h / 2 - 3, 0, 0, Math.PI * 2);
    c.fill();
  });
  for (let v = 0; v < 4; v++)
    add(
      'splat' + v,
      96,
      96,
      (c, w, h, rng) => {
        c.fillStyle = '#fff';
        blob(c, w / 2, h / 2, 13 + v * 2, rng, 18, 0.22);
        c.fill();
        for (let i = 0; i < 9 + v * 2; i++) {
          const a = rng.next() * Math.PI * 2;
          const d = 18 + rng.next() * 24;
          const r = 1.5 + rng.next() * 5;
          c.beginPath();
          c.arc(w / 2 + Math.cos(a) * d, h / 2 + Math.sin(a) * d, r, 0, Math.PI * 2);
          c.fill();
          // A thin connecting drip.
          c.lineWidth = Math.max(1, r * 0.6);
          c.strokeStyle = '#fff';
          c.beginPath();
          c.moveTo(w / 2 + Math.cos(a) * 10, h / 2 + Math.sin(a) * 10);
          c.lineTo(w / 2 + Math.cos(a) * d, h / 2 + Math.sin(a) * d);
          c.stroke();
        }
      },
      20 + v,
    );
  add('drop', 12, 14, (c) => {
    c.fillStyle = '#fff';
    c.beginPath();
    c.moveTo(6, 1);
    c.bezierCurveTo(11, 7, 11, 11, 6, 13);
    c.bezierCurveTo(1, 11, 1, 7, 6, 1);
    c.fill();
  });
  add('dot', 14, 14, (c, w, h, rng) => {
    c.fillStyle = '#fff';
    blob(c, w / 2, h / 2, 5, rng, 9, 0.2);
    c.fill();
  });
  add('wash', 128, 128, (c, w, h, rng) => {
    // Watercolour bloom: soft body, darker pooled rim, ragged edge.
    blob(c, w / 2, h / 2, 50, rng, 22, 0.14);
    const g = c.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, 56);
    g.addColorStop(0, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.8, 'rgba(255,255,255,0.7)');
    g.addColorStop(1, 'rgba(255,255,255,0.95)');
    c.fillStyle = g;
    c.fill();
    c.lineWidth = 3;
    c.strokeStyle = 'rgba(255,255,255,1)';
    c.stroke();
    for (let i = 0; i < 6; i++) {
      c.fillStyle = 'rgba(255,255,255,0.25)';
      blob(c, 30 + rng.next() * 68, 30 + rng.next() * 68, 10 + rng.next() * 10, rng, 10, 0.3);
      c.fill();
    }
  });
  add('brush', 180, 110, (c, w, h, rng) => {
    // A tapered dry-brush swipe.
    for (let k = 0; k < 18; k++) {
      const off = (k - 9) * 1.35;
      c.strokeStyle = `rgba(255,255,255,${0.35 + rng.next() * 0.65})`;
      c.lineWidth = 2 + rng.next() * 2.5;
      c.lineCap = 'round';
      c.beginPath();
      const taper = 1 - Math.abs(k - 9) / 11;
      c.moveTo(14, h * 0.85 - off * 0.4);
      c.bezierCurveTo(
        50,
        h * 0.2 + off,
        120,
        h * 0.1 + off,
        w - 10 - (1 - taper) * 24,
        h * 0.62 + off * 1.1,
      );
      c.stroke();
    }
  });
  add('ray', 160, 160, (c, w, h, rng) => {
    c.strokeStyle = '#fff';
    c.lineCap = 'round';
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + rng.next() * 0.1;
      const r1 = 22 + rng.next() * 8;
      const r2 = 50 + rng.next() * 28;
      c.lineWidth = 2 + rng.next() * 2;
      inkLine(
        c,
        w / 2 + Math.cos(a) * r1,
        h / 2 + Math.sin(a) * r1,
        w / 2 + Math.cos(a) * r2,
        h / 2 + Math.sin(a) * r2,
        rng,
        1,
      );
    }
  });
  add('star', 34, 34, (c, w, h, rng) => {
    c.strokeStyle = INK;
    c.fillStyle = '#fff';
    c.lineWidth = 2;
    c.lineJoin = 'round';
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const r = (i % 2 ? 6 : 14) + (rng.next() - 0.5);
      c.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r);
    }
    c.closePath();
    c.fill();
    c.stroke();
  });
  add('x', 28, 28, (c, w, h, rng) => {
    c.strokeStyle = '#fff';
    c.lineWidth = 4;
    c.lineCap = 'round';
    inkLine(c, 5, 5, w - 5, h - 5, rng, 0.8);
    inkLine(c, w - 5, 5, 5, h - 5, rng, 0.8);
  });
  add('bone', 18, 8, (c) => {
    c.fillStyle = '#fbf3dc';
    c.strokeStyle = INK;
    c.lineWidth = 1.6;
    c.beginPath();
    c.arc(3.5, 2.5, 2.4, 0, 6.3);
    c.arc(3.5, 5.5, 2.4, 0, 6.3);
    c.arc(14.5, 2.5, 2.4, 0, 6.3);
    c.arc(14.5, 5.5, 2.4, 0, 6.3);
    c.rect(4, 2.6, 10, 2.8);
    c.fill();
    c.stroke();
  });
  add('flame', 34, 48, (c, w, h, rng) => {
    c.beginPath();
    c.moveTo(17, 2);
    c.bezierCurveTo(30, 16, 33, 30, 24, 44);
    c.bezierCurveTo(21, 47, 13, 47, 10, 44);
    c.bezierCurveTo(1, 30, 6, 18, 17, 2);
    c.fillStyle = '#fff';
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 2;
    c.stroke();
    c.beginPath();
    c.moveTo(17, 18);
    c.bezierCurveTo(23, 26, 23, 36, 17, 41);
    c.bezierCurveTo(11, 36, 11, 26, 17, 18);
    c.fillStyle = 'rgba(255,255,255,0.7)';
    c.fill();
    void w;
    void h;
    void rng;
  });
  add('shard', 22, 40, (c) => {
    c.beginPath();
    c.moveTo(11, 2);
    c.lineTo(20, 18);
    c.lineTo(11, 38);
    c.lineTo(2, 18);
    c.closePath();
    c.fillStyle = '#fff';
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 2;
    c.stroke();
    c.beginPath();
    c.moveTo(11, 6);
    c.lineTo(11, 34);
    c.moveTo(6, 18);
    c.lineTo(16, 18);
    c.lineWidth = 1;
    c.stroke();
  });
  add('arrow', 50, 12, (c) => {
    c.strokeStyle = INK;
    c.lineWidth = 2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(3, 6);
    c.lineTo(42, 6);
    c.stroke();
    c.beginPath();
    c.moveTo(38, 1);
    c.lineTo(48, 6);
    c.lineTo(38, 11);
    c.closePath();
    c.fillStyle = INK;
    c.fill();
    c.strokeStyle = '#a3201c';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(3, 6);
    c.lineTo(9, 1);
    c.moveTo(3, 6);
    c.lineTo(9, 11);
    c.moveTo(7, 6);
    c.lineTo(13, 1);
    c.moveTo(7, 6);
    c.lineTo(13, 11);
    c.stroke();
  });
  add('chest', 56, 44, (c, w, h, rng) => {
    c.fillStyle = '#c69a68';
    c.strokeStyle = INK;
    c.lineWidth = 2.4;
    c.beginPath();
    c.rect(5, 18, 46, 22);
    c.fill();
    c.stroke();
    c.fillStyle = '#d8ac7a';
    c.beginPath();
    c.moveTo(5, 18);
    c.bezierCurveTo(8, 3, 48, 3, 51, 18);
    c.closePath();
    c.fill();
    c.stroke();
    c.lineWidth = 1.3;
    for (let i = 0; i < 6; i++) inkLine(c, 8 + i * 7, 22, 4 + i * 7, 38, rng, 0.5);
    c.fillStyle = '#e8c040';
    c.fillRect(24, 17, 9, 10);
    c.strokeRect(24, 17, 9, 10);
    void w;
    void h;
  });
  add('chestOpen', 56, 50, (c, w, h, rng) => {
    c.fillStyle = '#c69a68';
    c.strokeStyle = INK;
    c.lineWidth = 2.4;
    c.beginPath();
    c.rect(5, 26, 46, 18);
    c.fill();
    c.stroke();
    c.fillStyle = '#f2d870';
    c.fillRect(8, 28, 40, 7);
    c.beginPath();
    c.rect(7, 4, 42, 15);
    c.fillStyle = '#d8ac7a';
    c.fill();
    c.stroke();
    void w;
    void h;
    void rng;
  });
  add('gem', 28, 28, (c) => {
    c.beginPath();
    c.moveTo(14, 3);
    c.lineTo(25, 11);
    c.lineTo(14, 25);
    c.lineTo(3, 11);
    c.closePath();
    c.fillStyle = '#fff';
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 2.2;
    c.lineJoin = 'round';
    c.stroke();
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(3, 11);
    c.lineTo(25, 11);
    c.moveTo(14, 3);
    c.lineTo(9, 11);
    c.lineTo(14, 25);
    c.moveTo(14, 3);
    c.lineTo(19, 11);
    c.lineTo(14, 25);
    c.stroke();
  });
  add('bag', 30, 32, (c) => {
    c.beginPath();
    c.moveTo(10, 6);
    c.lineTo(20, 6);
    c.lineTo(18, 11);
    c.bezierCurveTo(30, 16, 28, 29, 15, 29);
    c.bezierCurveTo(2, 29, 0, 16, 12, 11);
    c.closePath();
    c.fillStyle = '#fff';
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 2.2;
    c.stroke();
    c.beginPath();
    c.moveTo(9, 7);
    c.lineTo(21, 7);
    c.stroke();
  });
  add('spiral', 96, 96, (c, w, h, rng) => {
    c.strokeStyle = INK;
    c.lineCap = 'round';
    for (let k = 0; k < 2; k++) {
      c.lineWidth = k ? 1.4 : 3;
      c.beginPath();
      for (let a = 0; a < Math.PI * 7; a += 0.12) {
        const r = 4 + a * 2.0;
        const x = w / 2 + Math.cos(a + k * 0.5) * r + (rng.next() - 0.5) * 0.8;
        const y = h / 2 + Math.sin(a + k * 0.5) * r + (rng.next() - 0.5) * 0.8;
        if (a === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
    }
  });
  add('torch', 22, 44, (c) => {
    c.fillStyle = '#a8805a';
    c.strokeStyle = INK;
    c.lineWidth = 2;
    c.beginPath();
    c.rect(8, 22, 6, 20);
    c.fill();
    c.stroke();
    c.beginPath();
    c.rect(5, 18, 12, 6);
    c.fill();
    c.stroke();
  });
  add('skull', 34, 34, (c, w, h, rng) => {
    c.strokeStyle = 'rgba(28,22,18,0.7)';
    c.lineWidth = 1.6;
    c.beginPath();
    c.arc(17, 15, 10, Math.PI * 0.9, Math.PI * 2.1);
    c.lineTo(23, 27);
    c.lineTo(11, 27);
    c.closePath();
    c.stroke();
    c.fillStyle = 'rgba(28,22,18,0.7)';
    c.beginPath();
    c.arc(13, 16, 2.4, 0, 6.3);
    c.arc(21, 16, 2.4, 0, 6.3);
    c.fill();
    inkLine(c, 14, 27, 14, 23, rng, 0.3);
    inkLine(c, 17, 27, 17, 23, rng, 0.3);
    inkLine(c, 20, 27, 20, 23, rng, 0.3);
    void w;
    void h;
  });
  add('rubble', 36, 26, (c, w, h, rng) => {
    c.strokeStyle = 'rgba(28,22,18,0.7)';
    c.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      blob(
        c,
        6 + rng.next() * (w - 12),
        6 + rng.next() * (h - 12),
        3 + rng.next() * 4,
        rng,
        7,
        0.3,
      );
      c.stroke();
    }
  });
  add('web', 40, 40, (c, w, h, rng) => {
    c.strokeStyle = 'rgba(28,22,18,0.5)';
    c.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const a = (i / 4) * (Math.PI / 2);
      inkLine(c, 0, 0, Math.cos(a) * 38, Math.sin(a) * 38, rng, 0.4);
    }
    for (let r = 10; r < 40; r += 9) {
      c.beginPath();
      c.arc(0, 0, r, 0, Math.PI / 2);
      c.stroke();
    }
    void w;
    void h;
  });
  return SPRITES;
}

export type InkTheme = { wash: number; accent: number; name: string };
export const INK_THEMES: Record<string, InkTheme> = {
  ashenCrypt: { wash: 0xe8742a, accent: 0xe8742a, name: 'ember' },
  rimedCatacomb: { wash: 0x4a9ad0, accent: 0x4a9ad0, name: 'frost' },
  thunderVault: { wash: 0x8a5ac0, accent: 0xe8c82a, name: 'storm' },
  bonePits: { wash: 0xa89050, accent: 0xa89050, name: 'ochre' },
  archersGallery: { wash: 0x5a9a4a, accent: 0x5a9a4a, name: 'moss' },
};
