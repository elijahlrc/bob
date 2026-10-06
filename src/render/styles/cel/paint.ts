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

/** Isometric tile: a 64×32 diamond. World (x, y) tiles → screen via project(). */
export const TW = 64;
export const TH = 32;
/** Wall block height in pixels. */
export const WALL_H = 36;
export const CEL_PX = 1.3;
export const FRAMES: Record<AnimName, number> = { idle: 2, walk: 4, attack: 4, stun: 2, death: 4 };
const SS = 2;

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

const OUT = '#1d0f2e';
type Pair = [string, string];

const UNDEAD: Record<Role, Pair> = {
  bone: ['#fff1d2', '#c8a6d6'],
  boneShade: ['#e6cfc0', '#a888c0'],
  dark: ['#2b1740', '#1d0f2e'],
  cloth: ['#8a6ad8', '#5b3fa8'],
  clothShade: ['#6a4ab8', '#43308a'],
  accent: ['#ff6a8a', '#c43a68'],
  metal: ['#f2f6ff', '#9aa8d8'],
  metalShade: ['#b8c4ea', '#7080b8'],
  wood: ['#d99a52', '#9a6234'],
  skin: ['#ffd2a8', '#e0976e'],
  glow: ['#7fffe0', '#34c8a8'],
  eye: ['#ff5a8a', '#ff5a8a'],
};

function shadeHex(hex: number, f: number): string {
  const r = Math.max(0, Math.min(255, ((hex >> 16) & 255) * f)) | 0;
  const g = Math.max(0, Math.min(255, ((hex >> 8) & 255) * f)) | 0;
  const b = Math.max(0, Math.min(255, (hex & 255) * f)) | 0;
  return `rgb(${r},${g},${b})`;
}

function heroPalette(classColor: number): Record<Role, Pair> {
  return {
    ...UNDEAD,
    bone: [shadeHex(classColor, 1.12), shadeHex(classColor, 0.7)],
    boneShade: [shadeHex(classColor, 0.85), shadeHex(classColor, 0.55)],
    cloth: [shadeHex(classColor, 1.12), shadeHex(classColor, 0.7)],
    clothShade: [shadeHex(classColor, 0.85), shadeHex(classColor, 0.55)],
    accent: ['#ffd24a', '#d89a1a'],
    skin: ['#ffd2a8', '#e0976e'],
    eye: ['#ffffff', '#ffffff'],
    glow: ['#fff2a8', '#ffc84a'],
  };
}

function shape(
  ctx: CanvasRenderingContext2D,
  p: Prim,
  color: string,
  grow: number,
  ox: number,
  oy: number,
  s: number,
): void {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  switch (p.k) {
    case 'circ':
      ctx.beginPath();
      ctx.arc(ox + p.x * s, oy + p.y * s, p.r * s + grow, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'cap':
      ctx.lineWidth = p.r * 2 * s + grow * 2;
      ctx.beginPath();
      ctx.moveTo(ox + p.x1 * s, oy + p.y1 * s);
      ctx.lineTo(ox + p.x2 * s, oy + p.y2 * s);
      ctx.stroke();
      break;
    case 'box': {
      ctx.save();
      ctx.translate(ox + p.x * s, oy + p.y * s);
      ctx.rotate(p.rot);
      const w = p.w * s + grow * 2;
      const h = p.h * s + grow * 2;
      ctx.beginPath();
      const r = Math.min(w, h) * 0.3;
      ctx.roundRect(-w / 2, -h / 2, w, h, r);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'tri':
      ctx.beginPath();
      ctx.moveTo(ox + p.pts[0] * s, oy + p.pts[1] * s);
      ctx.lineTo(ox + p.pts[2] * s, oy + p.pts[3] * s);
      ctx.lineTo(ox + p.pts[4] * s, oy + p.pts[5] * s);
      ctx.closePath();
      ctx.fill();
      if (grow > 0) {
        ctx.lineWidth = grow * 2;
        ctx.stroke();
      }
      break;
  }
}

export function frameSize(kind: FigureKind): number {
  return Math.ceil(90 * SCALE_OF[kind] * CEL_PX) + 8;
}

/** Cel-shaded figure: thick outline, flat colour, one cool shadow crescent per part. */
export function rasterFigure(
  kind: FigureKind,
  anim: AnimName,
  t: number,
  classColor: number,
): HTMLCanvasElement {
  const S = frameSize(kind);
  const W = S * SS;
  const pal = isHero(kind) ? heroPalette(classColor) : UNDEAD;
  const prims = buildFigure(kind, poseFor(kind, anim, t));
  const main = document.createElement('canvas');
  main.width = main.height = W;
  const c = main.getContext('2d')!;
  const tmp = document.createElement('canvas');
  tmp.width = tmp.height = W;
  const tc = tmp.getContext('2d')!;
  const s = CEL_PX * SS;
  const ox = W / 2;
  const oy = W * 0.86;
  const outline = 2.6 * SS * (SCALE_OF[kind] > 1.5 ? 1.3 : 1);
  for (const p of prims) shape(c, p, OUT, outline, ox, oy, s);
  for (const p of prims) {
    const [base, shade] = pal[p.role];
    tc.clearRect(0, 0, W, W);
    shape(tc, p, shade, 0, ox, oy, s);
    tc.globalCompositeOperation = 'source-atop';
    shape(tc, p, base, 0, ox - 1.5 * SS, oy - 1.7 * SS, s);
    tc.globalCompositeOperation = 'source-over';
    c.drawImage(tmp, 0, 0);
  }
  const out = document.createElement('canvas');
  out.width = out.height = S;
  const oc = out.getContext('2d')!;
  oc.imageSmoothingQuality = 'high';
  oc.drawImage(main, 0, 0, S, S);
  return out;
}

// ---- Environment --------------------------------------------------------------------------------

export type CelTheme = {
  a: string;
  b: string;
  top: string;
  l: string;
  r: string;
  bg: string;
  glow: number;
};
export const CEL_THEMES: Record<string, CelTheme> = {
  ashenCrypt: {
    a: '#f0b27a',
    b: '#e39a62',
    top: '#9b6aa0',
    l: '#6e4278',
    r: '#4a2a57',
    bg: '#2d1b3a',
    glow: 0xffa050,
  },
  rimedCatacomb: {
    a: '#a6e4ec',
    b: '#8acfdc',
    top: '#93aaec',
    l: '#627fd2',
    r: '#4259a8',
    bg: '#1b2a4a',
    glow: 0x9ad8ff,
  },
  thunderVault: {
    a: '#cfa6f4',
    b: '#b88ee4',
    top: '#6a58c0',
    l: '#4a3c98',
    r: '#322878',
    bg: '#1b1440',
    glow: 0xc8a0ff,
  },
  bonePits: {
    a: '#dcd490',
    b: '#c8bf76',
    top: '#94845f',
    l: '#6f5f46',
    r: '#4e4232',
    bg: '#2b261a',
    glow: 0xffd070,
  },
  archersGallery: {
    a: '#aee280',
    b: '#94ce66',
    top: '#58a070',
    l: '#3f7e5a',
    r: '#2c5c46',
    bg: '#12302a',
    glow: 0xb8ff90,
  },
};

function cv(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

function diamond(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  c.beginPath();
  c.moveTo(x + w / 2, y);
  c.lineTo(x + w, y + h / 2);
  c.lineTo(x + w / 2, y + h);
  c.lineTo(x, y + h / 2);
  c.closePath();
}

/** Floor diamond variants (64×32). */
export function floorTiles(th: CelTheme): HTMLCanvasElement[] {
  const out: HTMLCanvasElement[] = [];
  for (let v = 0; v < 4; v++) {
    const [cnv, c] = cv(TW, TH);
    const rng = new Rng(500 + v);
    diamond(c, 0, 0, TW, TH);
    c.fillStyle = v % 2 ? th.b : th.a;
    c.fill();
    c.save();
    diamond(c, 0, 0, TW, TH);
    c.clip();
    // Soft tone patches and a bright top edge, like hand-painted flagstones.
    c.fillStyle = 'rgba(255,255,255,0.14)';
    diamond(c, 5, 1, TW - 10, TH - 5);
    c.fill();
    c.fillStyle = 'rgba(60,20,90,0.16)';
    for (let i = 0; i < 3; i++) c.fillRect(rng.int(8, 48), rng.int(6, 24), rng.int(4, 9), 2);
    if (v === 3) {
      c.strokeStyle = 'rgba(70,30,100,0.35)';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(20, 10);
      c.lineTo(30, 16);
      c.lineTo(27, 22);
      c.stroke();
    }
    c.restore();
    c.strokeStyle = 'rgba(40,16,70,0.55)';
    c.lineWidth = 2;
    diamond(c, 1, 1, TW - 2, TH - 2);
    c.stroke();
    out.push(cnv);
  }
  return out;
}

/** Wall block variants: bright top, mid left face, dark right face, bold outline. */
export function wallBlocks(th: CelTheme, wallH: number = WALL_H): HTMLCanvasElement[] {
  const out: HTMLCanvasElement[] = [];
  const H = TH + wallH;
  for (let v = 0; v < 3; v++) {
    const [cnv, c] = cv(TW, H);
    const rng = new Rng(900 + v);
    const top = (x: number, y: number) => ({ x, y });
    void top;
    const t = wallH;
    // Left face.
    c.fillStyle = th.l;
    c.beginPath();
    c.moveTo(0, t + TH / 2);
    c.lineTo(TW / 2, t + TH);
    c.lineTo(TW / 2, TH);
    c.lineTo(0, TH / 2);
    c.closePath();
    c.fill();
    // Right face.
    c.fillStyle = th.r;
    c.beginPath();
    c.moveTo(TW, t + TH / 2);
    c.lineTo(TW / 2, t + TH);
    c.lineTo(TW / 2, TH);
    c.lineTo(TW, TH / 2);
    c.closePath();
    c.fill();
    // Brick courses.
    c.strokeStyle = 'rgba(25,8,45,0.4)';
    c.lineWidth = 1.6;
    for (let r = 1; r < 3; r++) {
      const y = (wallH / 3) * r;
      c.beginPath();
      c.moveTo(0, TH / 2 + y);
      c.lineTo(TW / 2, TH + y);
      c.lineTo(TW, TH / 2 + y);
      c.stroke();
    }
    for (let k = 0; k < 3; k++) {
      const x = rng.int(4, 28);
      const y = rng.int(0, 2);
      c.beginPath();
      c.moveTo(x, TH / 2 + (x / TW) * TH + y * 12);
      c.lineTo(x, TH / 2 + (x / TW) * TH + y * 12 + 11);
      c.stroke();
    }
    // Light rim on the left-face top edge and a shadow at the base.
    c.fillStyle = 'rgba(255,255,255,0.12)';
    c.fillRect(0, TH / 2 + 2, TW / 2, 3);
    // Top face.
    c.fillStyle = th.top;
    diamond(c, 0, 0, TW, TH);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.22)';
    diamond(c, 6, 2, TW - 12, TH - 7);
    c.fill();
    if (v === 1) {
      c.fillStyle = 'rgba(40,12,70,0.25)';
      diamond(c, TW / 2 - 8, TH / 2 - 4, 16, 8);
      c.fill();
    }
    // Outline.
    c.strokeStyle = OUT;
    c.lineWidth = 3;
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(TW / 2, 1);
    c.lineTo(TW - 1, TH / 2);
    c.lineTo(TW - 1, t + TH / 2);
    c.lineTo(TW / 2, t + TH - 1);
    c.lineTo(1, t + TH / 2);
    c.lineTo(1, TH / 2);
    c.closePath();
    c.stroke();
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(1, TH / 2);
    c.lineTo(TW / 2, TH - 1);
    c.lineTo(TW - 1, TH / 2);
    c.moveTo(TW / 2, TH - 1);
    c.lineTo(TW / 2, t + TH - 1);
    c.stroke();
    out.push(cnv);
  }
  return out;
}

// ---- Props, effects ---------------------------------------------------------------------------

function outlined(c: CanvasRenderingContext2D, fill: string, w = 2.5): void {
  c.lineJoin = 'round';
  c.lineWidth = w * 2;
  c.strokeStyle = OUT;
  c.stroke();
  c.fillStyle = fill;
  c.fill();
}

function star(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  inner: number,
  points: number,
  rot = 0,
): void {
  c.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = rot + (i * Math.PI) / points - Math.PI / 2;
    const rr = i % 2 ? inner : r;
    c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath();
}

export const SPRITES: Record<string, HTMLCanvasElement> = {};

export function buildSprites(): Record<string, HTMLCanvasElement> {
  if (Object.keys(SPRITES).length) return SPRITES;
  const add = (
    k: string,
    w: number,
    h: number,
    draw: (c: CanvasRenderingContext2D, w: number, h: number) => void,
  ) => {
    const [cnv, c] = cv(w, h);
    draw(c, w, h);
    SPRITES[k] = cnv;
  };
  add('shadow', 64, 32, (c, w, h) => {
    c.fillStyle = 'rgba(30,10,50,0.42)';
    c.beginPath();
    c.ellipse(w / 2, h / 2, w / 2 - 2, h / 2 - 2, 0, 0, Math.PI * 2);
    c.fill();
  });
  add('glow', 128, 128, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  });
  add('star', 32, 32, (c) => {
    star(c, 16, 16, 12, 5, 4);
    outlined(c, '#fff', 2.2);
  });
  add('star5', 32, 32, (c) => {
    star(c, 16, 16, 12, 6, 5);
    outlined(c, '#fff', 2.2);
  });
  add('chip', 20, 20, (c) => {
    c.beginPath();
    c.moveTo(10, 2);
    c.lineTo(18, 10);
    c.lineTo(10, 18);
    c.lineTo(2, 10);
    c.closePath();
    outlined(c, '#fff', 2);
  });
  add('dot', 24, 24, (c) => {
    c.beginPath();
    c.arc(12, 12, 8, 0, Math.PI * 2);
    outlined(c, '#fff', 2.4);
  });
  add('puff', 64, 48, (c) => {
    c.beginPath();
    c.arc(20, 30, 14, 0, Math.PI * 2);
    c.arc(34, 24, 17, 0, Math.PI * 2);
    c.arc(46, 32, 12, 0, Math.PI * 2);
    c.moveTo(60, 44);
    c.rect(10, 28, 44, 14);
    outlined(c, '#fff', 2.6);
  });
  add('ring', 128, 64, (c, w, h) => {
    c.lineWidth = 9;
    c.strokeStyle = OUT;
    c.beginPath();
    c.ellipse(w / 2, h / 2, w / 2 - 7, h / 2 - 7, 0, 0, Math.PI * 2);
    c.stroke();
    c.lineWidth = 4.5;
    c.strokeStyle = '#fff';
    c.stroke();
  });
  add('pow', 128, 128, (c, w, h) => {
    const rng = new Rng(7);
    c.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8;
      const r = i % 2 ? 30 + rng.int(0, 8) : 58 + rng.int(0, 5);
      c.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r);
    }
    c.closePath();
    outlined(c, '#ffb62a', 4);
    c.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6 + 0.2;
      const r = i % 2 ? 16 : 34;
      c.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r);
    }
    c.closePath();
    c.fillStyle = '#fff6b0';
    c.fill();
  });
  add('slash', 160, 100, (c, w, h) => {
    c.beginPath();
    c.moveTo(14, h / 2 + 34);
    c.bezierCurveTo(50, h / 2 - 54, 118, h / 2 - 54, w - 8, h / 2 + 4);
    c.bezierCurveTo(112, h / 2 - 28, 56, h / 2 - 22, 14, h / 2 + 34);
    c.closePath();
    outlined(c, '#fff', 3.5);
  });
  add('speed', 64, 12, (c, w, h) => {
    c.beginPath();
    c.moveTo(2, h / 2);
    c.lineTo(w - 4, 1);
    c.lineTo(w - 4, h - 1);
    c.closePath();
    outlined(c, '#fff', 1.6);
  });
  add('flame', 40, 56, (c) => {
    c.beginPath();
    c.moveTo(20, 3);
    c.bezierCurveTo(34, 20, 38, 34, 28, 48);
    c.bezierCurveTo(24, 53, 16, 53, 12, 48);
    c.bezierCurveTo(2, 34, 8, 22, 20, 3);
    outlined(c, '#fff', 2.8);
  });
  add('shard', 24, 44, (c) => {
    c.beginPath();
    c.moveTo(12, 2);
    c.lineTo(21, 20);
    c.lineTo(12, 42);
    c.lineTo(3, 20);
    c.closePath();
    outlined(c, '#fff', 2.4);
  });
  add('bolt', 28, 52, (c) => {
    c.beginPath();
    c.moveTo(18, 2);
    c.lineTo(5, 26);
    c.lineTo(14, 26);
    c.lineTo(8, 50);
    c.lineTo(24, 20);
    c.lineTo(15, 20);
    c.closePath();
    outlined(c, '#fff', 2.4);
  });
  add('orb', 40, 40, (c) => {
    c.beginPath();
    c.arc(20, 20, 14, 0, Math.PI * 2);
    outlined(c, '#fff', 3.2);
    c.fillStyle = 'rgba(255,255,255,0.8)';
    c.beginPath();
    c.arc(15, 15, 5, 0, Math.PI * 2);
    c.fill();
  });
  add('arrow', 56, 14, (c) => {
    c.beginPath();
    c.moveTo(2, 7);
    c.lineTo(46, 7);
    c.lineWidth = 7;
    c.strokeStyle = OUT;
    c.stroke();
    c.lineWidth = 3;
    c.strokeStyle = '#e8c88a';
    c.stroke();
    c.beginPath();
    c.moveTo(40, 1);
    c.lineTo(54, 7);
    c.lineTo(40, 13);
    c.closePath();
    outlined(c, '#f4f8ff', 2);
  });
  add('bubble', 24, 24, (c) => {
    c.beginPath();
    c.arc(12, 12, 8, 0, Math.PI * 2);
    outlined(c, '#fff', 2);
    c.fillStyle = 'rgba(255,255,255,0.8)';
    c.fillRect(8, 8, 3, 3);
  });
  add('drop', 20, 28, (c) => {
    c.beginPath();
    c.moveTo(10, 3);
    c.bezierCurveTo(18, 14, 18, 20, 10, 25);
    c.bezierCurveTo(2, 20, 2, 14, 10, 3);
    outlined(c, '#fff', 2);
  });
  add('ice', 64, 80, (c) => {
    c.beginPath();
    c.roundRect(6, 8, 52, 66, 12);
    c.fillStyle = 'rgba(150,220,255,0.55)';
    c.fill();
    c.lineWidth = 5;
    c.strokeStyle = '#1d3a6a';
    c.stroke();
    c.lineWidth = 3;
    c.strokeStyle = '#eaffff';
    c.beginPath();
    c.moveTo(16, 20);
    c.lineTo(16, 52);
    c.moveTo(24, 16);
    c.lineTo(36, 16);
    c.stroke();
  });
  add('beam', 36, 160, (c, w, h) => {
    c.fillStyle = 'rgba(255,255,255,0.42)';
    c.fillRect(6, 0, w - 12, h);
    c.fillStyle = 'rgba(255,255,255,0.4)';
    c.fillRect(13, 0, w - 26, h);
  });
  add('torch', 36, 74, (c) => {
    c.beginPath();
    c.roundRect(14, 30, 8, 40, 3);
    outlined(c, '#9a6234', 2.4);
    c.beginPath();
    c.roundRect(8, 22, 20, 12, 4);
    outlined(c, '#d9a24a', 2.4);
    c.beginPath();
    c.moveTo(18, 2);
    c.bezierCurveTo(30, 10, 31, 18, 25, 24);
    c.lineTo(11, 24);
    c.bezierCurveTo(5, 18, 6, 10, 18, 2);
    outlined(c, '#ffb43a', 2.4);
    c.beginPath();
    c.moveTo(18, 10);
    c.bezierCurveTo(24, 15, 24, 20, 21, 23);
    c.lineTo(15, 23);
    c.bezierCurveTo(12, 20, 12, 15, 18, 10);
    c.fillStyle = '#fff3a0';
    c.fill();
  });
  add('tomb', 44, 58, (c) => {
    c.beginPath();
    c.moveTo(6, 54);
    c.lineTo(6, 22);
    c.arc(22, 22, 16, Math.PI, 0);
    c.lineTo(38, 54);
    c.closePath();
    outlined(c, '#c9b8e8', 2.6);
    c.fillStyle = '#9a86c4';
    c.fillRect(7, 46, 30, 6);
    c.strokeStyle = '#6a58a0';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(22, 18);
    c.lineTo(22, 36);
    c.moveTo(15, 25);
    c.lineTo(29, 25);
    c.stroke();
  });
  add('crate', 48, 52, (c) => {
    c.beginPath();
    c.roundRect(4, 10, 40, 38, 4);
    outlined(c, '#d99a52', 2.6);
    c.strokeStyle = '#8a5a2a';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(6, 12);
    c.lineTo(42, 46);
    c.moveTo(42, 12);
    c.lineTo(6, 46);
    c.stroke();
  });
  add('mushroom', 36, 40, (c) => {
    c.beginPath();
    c.roundRect(14, 20, 9, 16, 3);
    outlined(c, '#fff1d2', 2);
    c.beginPath();
    c.ellipse(18, 18, 15, 11, 0, Math.PI, 0);
    c.closePath();
    outlined(c, '#7fffe0', 2.4);
    c.fillStyle = '#fff';
    c.fillRect(11, 11, 4, 3);
    c.fillRect(21, 8, 4, 3);
  });
  add('skullpile', 52, 36, (c) => {
    for (const [x, y, r] of [
      [16, 24, 9],
      [34, 24, 9],
      [25, 14, 9],
    ] as const) {
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      outlined(c, '#fff1d2', 2.2);
      c.fillStyle = '#2b1740';
      c.fillRect(x - 5, y - 2, 3, 4);
      c.fillRect(x + 2, y - 2, 3, 4);
    }
  });
  add('chest', 52, 44, (c) => {
    c.beginPath();
    c.roundRect(4, 18, 44, 24, 5);
    outlined(c, '#d99a52', 2.6);
    c.beginPath();
    c.moveTo(4, 24);
    c.arc(26, 22, 22, Math.PI, 0);
    c.lineTo(48, 24);
    c.closePath();
    outlined(c, '#e8b068', 2.6);
    c.fillStyle = '#ffd24a';
    c.fillRect(22, 20, 8, 10);
    c.strokeStyle = OUT;
    c.lineWidth = 2;
    c.strokeRect(22, 20, 8, 10);
  });
  add('chestOpen', 52, 52, (c) => {
    c.beginPath();
    c.roundRect(4, 26, 44, 20, 5);
    outlined(c, '#d99a52', 2.6);
    c.fillStyle = '#ffe98a';
    c.fillRect(8, 28, 36, 8);
    c.beginPath();
    c.roundRect(6, 4, 40, 18, 6);
    outlined(c, '#e8b068', 2.6);
  });
  add('gem', 28, 28, (c) => {
    c.beginPath();
    c.moveTo(14, 2);
    c.lineTo(25, 11);
    c.lineTo(14, 26);
    c.lineTo(3, 11);
    c.closePath();
    outlined(c, '#fff', 2.4);
    c.fillStyle = 'rgba(255,255,255,0.7)';
    c.beginPath();
    c.moveTo(14, 4);
    c.lineTo(8, 11);
    c.lineTo(14, 11);
    c.fill();
  });
  add('bag', 32, 32, (c) => {
    c.beginPath();
    c.moveTo(11, 6);
    c.lineTo(21, 6);
    c.lineTo(19, 11);
    c.bezierCurveTo(30, 16, 29, 29, 16, 29);
    c.bezierCurveTo(3, 29, 2, 16, 13, 11);
    c.closePath();
    outlined(c, '#fff', 2.4);
    c.fillStyle = OUT;
    c.fillRect(11, 5, 10, 3);
  });
  add('portal', 128, 64, (c, w, h) => {
    for (let i = 0; i < 4; i++) {
      c.lineWidth = 9 - i * 2;
      c.strokeStyle = i % 2 ? '#ffffff' : OUT;
      c.beginPath();
      c.ellipse(w / 2, h / 2, w / 2 - 6 - i * 13, h / 2 - 4 - i * 6.5, 0, 0, Math.PI * 1.6);
      c.stroke();
    }
  });
  add('conf', 14, 8, (c) => {
    c.fillStyle = '#fff';
    c.fillRect(1, 1, 12, 6);
  });
  return SPRITES;
}
