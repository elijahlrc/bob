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

/** Figure design units → pixels (small pixels, wide view). */
export const FIG_PX = 0.6;

export const FRAMES: Record<AnimName, number> = { idle: 4, walk: 8, attack: 6, stun: 4, death: 7 };

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

type RGB = [number, number, number];
const hex = (c: number): RGB => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
const mul = (c: RGB, f: number): RGB => [
  Math.max(0, Math.min(255, c[0] * f)),
  Math.max(0, Math.min(255, c[1] * f)),
  Math.max(0, Math.min(255, c[2] * f)),
];

const UNDEAD: Record<Role, RGB> = {
  bone: hex(0xd8cfb4),
  boneShade: hex(0x9d927a),
  dark: hex(0x15110e),
  cloth: hex(0x6b5b48),
  clothShade: hex(0x45392d),
  accent: hex(0xb24a2a),
  metal: hex(0xaab0b8),
  metalShade: hex(0x6a707c),
  wood: hex(0x6b4a2f),
  skin: hex(0xc99a74),
  glow: hex(0x9fe8ff),
  eye: hex(0xff7a2a),
};

function heroPalette(accent: number): Record<Role, RGB> {
  return {
    ...UNDEAD,
    bone: hex(0x4d5260),
    boneShade: hex(0x353845),
    cloth: hex(0x56596a),
    clothShade: hex(0x363847),
    accent: hex(accent),
    skin: hex(0xd8a67e),
    glow: hex(0xffe6a0),
    eye: hex(0xffffff),
    dark: hex(0x15110e),
  };
}

const OUTLINE: RGB = [10, 8, 9];

function fillPrim(ctx: CanvasRenderingContext2D, p: Prim, ox: number, oy: number, s: number): void {
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#fff';
  ctx.beginPath();
  switch (p.k) {
    case 'circ':
      ctx.arc(ox + p.x * s, oy + p.y * s, Math.max(0.6, p.r * s), 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'cap':
      ctx.lineWidth = Math.max(1.4, p.r * 2 * s);
      ctx.lineCap = 'round';
      ctx.moveTo(ox + p.x1 * s, oy + p.y1 * s);
      ctx.lineTo(ox + p.x2 * s, oy + p.y2 * s);
      ctx.stroke();
      break;
    case 'box':
      ctx.save();
      ctx.translate(ox + p.x * s, oy + p.y * s);
      ctx.rotate(p.rot);
      ctx.fillRect((-p.w / 2) * s, (-p.h / 2) * s, p.w * s, p.h * s);
      ctx.restore();
      break;
    case 'tri':
      ctx.moveTo(ox + p.pts[0] * s, oy + p.pts[1] * s);
      ctx.lineTo(ox + p.pts[2] * s, oy + p.pts[3] * s);
      ctx.lineTo(ox + p.pts[4] * s, oy + p.pts[5] * s);
      ctx.closePath();
      ctx.fill();
      break;
  }
}

export function frameSize(kind: FigureKind, px = FIG_PX): number {
  return Math.ceil(84 * SCALE_OF[kind] * px) + 4;
}

/**
 * Rasterise one animation frame as hard-edged pixel art: flat role colours, light from the top-left,
 * contour lines where parts overlap, and a dark outline. Returns a canvas ready to become a texture.
 */
export function rasterFigure(
  kind: FigureKind,
  anim: AnimName,
  t: number,
  accent: number,
  px = FIG_PX,
): HTMLCanvasElement {
  const S = frameSize(kind, px);
  const pal = isHero(kind) ? heroPalette(accent) : UNDEAD;
  const prims = buildFigure(kind, poseFor(kind, anim, t));
  const scratch = document.createElement('canvas');
  scratch.width = scratch.height = S;
  const sctx = scratch.getContext('2d', { willReadFrequently: true })!;
  const id = new Uint16Array(S * S);
  const col = new Array<RGB>(S * S);
  const ox = S / 2;
  const oy = S * 0.84;
  prims.forEach((p, i) => {
    sctx.clearRect(0, 0, S, S);
    fillPrim(sctx, p, ox, oy, px);
    const d = sctx.getImageData(0, 0, S, S).data;
    for (let k = 0; k < S * S; k++)
      if (d[k * 4 + 3] > 100) {
        id[k] = i + 1;
        col[k] = pal[p.role];
      }
  });
  const out = document.createElement('canvas');
  out.width = out.height = S;
  const octx = out.getContext('2d')!;
  const img = octx.createImageData(S, S);
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= S || y >= S ? 0 : id[y * S + x]);
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const k = y * S + x;
      const me = id[k];
      let c: RGB | null = null;
      if (me) {
        c = col[k];
        const tl = at(x - 1, y - 1);
        const br = at(x + 1, y + 1);
        if (!tl || tl < me) c = mul(c, 1.28);
        if (!br) c = mul(c, 0.72);
        // Contour where a later part overlaps this one.
        for (const [dx, dy] of [
          [1, 0],
          [0, 1],
          [-1, 0],
          [0, -1],
        ] as const) {
          const n = at(x + dx, y + dy);
          if (n > me && col[(y + dy) * S + x + dx] !== col[k]) {
            c = mul(c, 0.55);
            break;
          }
        }
      } else if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) c = OUTLINE;
      if (c) {
        img.data[k * 4] = c[0];
        img.data[k * 4 + 1] = c[1];
        img.data[k * 4 + 2] = c[2];
        img.data[k * 4 + 3] = 255;
      }
    }
  octx.putImageData(img, 0, 0);
  return out;
}

// ---- Props and effect textures ----------------------------------------------------------------

export type PixelDraw = (c: CanvasRenderingContext2D, w: number, h: number, rng: Rng) => void;

function canvas(w: number, h: number, draw: PixelDraw, seed = 1): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  draw(cv.getContext('2d')!, w, h, new Rng(seed));
  return cv;
}

const px = (c: CanvasRenderingContext2D, color: string, x: number, y: number, w = 1, h = 1) => {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
};

export const PROPS: Record<string, HTMLCanvasElement> = {};

export function buildProps(): Record<string, HTMLCanvasElement> {
  if (Object.keys(PROPS).length) return PROPS;
  PROPS.shadow = canvas(24, 12, (c, w, h) => {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const d = Math.hypot((x - w / 2 + 0.5) / (w / 2), (y - h / 2 + 0.5) / (h / 2));
        if (d < 1) px(c, `rgba(0,0,0,${d < 0.6 ? 0.5 : 0.28})`, x, y);
      }
  });
  PROPS.px = canvas(2, 2, (c) => px(c, '#fff', 0, 0, 2, 2));
  PROPS.spark = canvas(5, 5, (c) => {
    px(c, '#fff', 2, 0, 1, 5);
    px(c, '#fff', 0, 2, 5, 1);
    px(c, '#ffe9b0', 2, 2, 1, 1);
  });
  PROPS.glow = canvas(64, 64, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.14)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  });
  PROPS.smoke = canvas(16, 16, (c, w, h, rng) => {
    for (let i = 0; i < 40; i++) {
      const x = rng.int(3, 12);
      const y = rng.int(3, 12);
      const r = rng.int(2, 4);
      for (let yy = -r; yy <= r; yy++)
        for (let xx = -r; xx <= r; xx++)
          if (xx * xx + yy * yy <= r * r) px(c, 'rgba(200,200,200,0.06)', x + xx, y + yy);
    }
    void w;
    void h;
  });
  PROPS.flame = canvas(10, 14, (c, w, h) => {
    for (let y = 0; y < h; y++) {
      const half = Math.max(0, Math.sin((y / h) * Math.PI * 0.95 + 0.25) * (w / 2 - 0.5));
      for (let x = 0; x < w; x++) if (Math.abs(x - w / 2 + 0.5) <= half) px(c, '#fff', x, y);
    }
  });
  PROPS.bonechip = canvas(5, 3, (c) => {
    px(c, '#e8e0c8', 1, 0, 3, 1);
    px(c, '#b0a68c', 0, 1, 5, 1);
    px(c, '#7a7058', 1, 2, 3, 1);
  });
  PROPS.slash = canvas(56, 40, (c, w, h) => {
    // A crescent swoosh opening to the right.
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const cx = x - 8;
        const cy = y - h / 2;
        const d = Math.hypot(cx, cy);
        const ang = Math.atan2(cy, cx);
        if (
          Math.abs(ang) < 1.15 &&
          d > 26 - Math.cos(ang * 1.4) * 6 &&
          d < 40 - Math.abs(ang) * 12
        ) {
          const a = 1 - Math.abs(ang) / 1.2;
          px(c, `rgba(255,255,255,${Math.max(0.25, a)})`, x, y);
        }
      }
  });
  PROPS.ring = canvas(64, 64, (c, w, h) => {
    for (let i = 0; i < 360; i += 2) {
      const a = (i * Math.PI) / 180;
      px(
        c,
        '#fff',
        Math.round(w / 2 + Math.cos(a) * 29),
        Math.round(h / 2 + Math.sin(a) * 29),
        2,
        2,
      );
    }
  });
  PROPS.groundring = canvas(40, 22, (c, w, h) => {
    for (let i = 0; i < 360; i += 3) {
      const a = (i * Math.PI) / 180;
      px(
        c,
        '#fff',
        Math.round(w / 2 + Math.cos(a) * (w / 2 - 1.5)),
        Math.round(h / 2 + Math.sin(a) * (h / 2 - 1.5)),
        1,
        1,
      );
    }
  });
  PROPS.beam = canvas(10, 96, (c, w, h) => {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const f = 1 - Math.abs(x - w / 2 + 0.5) / (w / 2);
        px(c, `rgba(255,255,255,${(1 - y / h) * f * 0.9})`, x, y);
      }
  });
  PROPS.arrow = canvas(14, 5, (c) => {
    px(c, '#c9b48a', 1, 2, 10, 1);
    px(c, '#e8e8f0', 11, 1, 3, 3);
    px(c, '#e8e8f0', 13, 2, 1, 1);
    px(c, '#a44', 0, 1, 2, 1);
    px(c, '#a44', 0, 3, 2, 1);
  });
  PROPS.orb = canvas(10, 10, (c, w, h) => {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const d = Math.hypot(x - 4.5, y - 4.5);
        if (d < 4.8) px(c, d < 2 ? '#fff' : d < 3.6 ? '#ddd' : '#aaa', x, y);
      }
  });
  PROPS.star = canvas(9, 9, (c) => {
    px(c, '#ffe45a', 4, 0, 1, 9);
    px(c, '#ffe45a', 0, 4, 9, 1);
    px(c, '#fff', 3, 3, 3, 3);
  });
  PROPS.torch = canvas(8, 16, (c) => {
    px(c, '#0e0c0b', 2, 5, 4, 11);
    px(c, '#4a3a2a', 3, 6, 2, 9);
    px(c, '#2a2f38', 1, 4, 6, 2);
    px(c, '#6a7280', 2, 4, 4, 1);
    px(c, '#3a2a1a', 3, 2, 2, 3);
  });
  PROPS.brazier = canvas(20, 22, (c) => {
    px(c, '#0e0c0b', 3, 8, 14, 3);
    px(c, '#3a3f48', 4, 8, 12, 3);
    px(c, '#6a7280', 4, 8, 12, 1);
    px(c, '#0e0c0b', 8, 11, 4, 8);
    px(c, '#2a2f38', 9, 11, 2, 8);
    px(c, '#0e0c0b', 5, 19, 10, 3);
    px(c, '#3a3f48', 6, 19, 8, 2);
    px(c, '#ff8a2a', 5, 7, 10, 2);
    px(c, '#ffd070', 7, 6, 6, 2);
  });
  PROPS.bonepile = canvas(18, 10, (c, w, h, rng) => {
    for (let i = 0; i < 9; i++) {
      const x = rng.int(1, 12);
      const y = rng.int(1, 7);
      const horiz = rng.chance(0.5);
      px(c, '#0d0b0a', x - 1, y - 1, horiz ? 6 : 4, horiz ? 4 : 6);
    }
    for (let i = 0; i < 9; i++) {
      const x = rng.int(1, 12);
      const y = rng.int(1, 7);
      const horiz = rng.chance(0.5);
      px(c, '#cfc6a8', x, y, horiz ? 4 : 2, horiz ? 2 : 4);
      px(c, '#9a8f76', x, y + (horiz ? 1 : 3), horiz ? 4 : 2, 1);
    }
    px(c, '#0d0b0a', 5, 2, 6, 6);
    px(c, '#d6cdb0', 6, 2, 5, 5);
    px(c, '#15110e', 7, 4, 1, 1);
    px(c, '#15110e', 9, 4, 1, 1);
    void w;
    void h;
  });
  for (let v = 0; v < 3; v++)
    PROPS['blood' + v] = canvas(
      16,
      12,
      (c, w, h, rng) => {
        for (let i = 0; i < 26; i++) {
          const a = rng.next() * Math.PI * 2;
          const d = rng.next() * (4 + v * 1.5);
          px(
            c,
            i < 14 ? 'rgba(110,12,14,0.85)' : 'rgba(70,8,10,0.9)',
            Math.round(w / 2 + Math.cos(a) * d),
            Math.round(h / 2 + Math.sin(a) * d * 0.7),
            rng.int(1, 3),
            1,
          );
        }
      },
      100 + v,
    );
  PROPS.scorch = canvas(24, 16, (c, w, h, rng) => {
    for (let i = 0; i < 60; i++) {
      const a = rng.next() * Math.PI * 2;
      const d = Math.sqrt(rng.next()) * 9;
      px(
        c,
        `rgba(8,6,6,${0.35 + rng.next() * 0.4})`,
        Math.round(w / 2 + Math.cos(a) * d),
        Math.round(h / 2 + Math.sin(a) * d * 0.6),
        2,
        1,
      );
    }
  });
  PROPS.crack = canvas(32, 20, (c, w, h, rng) => {
    for (let k = 0; k < 7; k++) {
      let x = w / 2;
      let y = h / 2;
      const a = (k / 7) * Math.PI * 2 + rng.next();
      for (let i = 0; i < 9; i++) {
        px(c, 'rgba(8,6,6,0.9)', Math.round(x), Math.round(y));
        x += Math.cos(a + rng.next() * 0.8 - 0.4);
        y += Math.sin(a + rng.next() * 0.8 - 0.4) * 0.6;
      }
    }
  });
  PROPS.chest = canvas(22, 18, (c) => {
    px(c, '#0d0b0a', 1, 4, 20, 14);
    px(c, '#6b4a2f', 2, 6, 18, 11);
    px(c, '#8a6240', 2, 6, 18, 2);
    px(c, '#4a3220', 2, 14, 18, 3);
    px(c, '#2a2f38', 2, 9, 18, 2);
    px(c, '#2a2f38', 9, 6, 4, 11);
    px(c, '#d8b040', 10, 11, 2, 3);
    px(c, '#0d0b0a', 2, 2, 18, 4);
    px(c, '#7a5636', 3, 3, 16, 3);
    px(c, '#8a6a46', 3, 3, 16, 1);
  });
  PROPS.chestOpen = canvas(22, 18, (c) => {
    px(c, '#0d0b0a', 1, 7, 20, 11);
    px(c, '#4a3220', 2, 9, 18, 8);
    px(c, '#ffd070', 3, 9, 16, 3);
    px(c, '#2a2f38', 2, 12, 18, 2);
    px(c, '#0d0b0a', 2, 0, 18, 5);
    px(c, '#6b4a2f', 3, 1, 16, 3);
  });
  PROPS.gem = canvas(10, 10, (c) => {
    px(c, '#0d0b0a', 2, 1, 6, 8);
    px(c, '#0d0b0a', 1, 3, 8, 4);
    px(c, '#fff', 3, 2, 4, 6);
    px(c, '#ddd', 2, 4, 6, 2);
    px(c, '#fff', 3, 2, 2, 2);
  });
  PROPS.bag = canvas(12, 12, (c) => {
    px(c, '#0d0b0a', 1, 3, 10, 9);
    px(c, '#fff', 2, 4, 8, 7);
    px(c, '#bbb', 2, 8, 8, 3);
    px(c, '#0d0b0a', 4, 1, 4, 3);
    px(c, '#eee', 5, 2, 2, 2);
  });
  PROPS.portal = canvas(48, 48, (c, w, h) => {
    for (let r = 20; r > 2; r -= 1) {
      for (let a = 0; a < Math.PI * 2; a += 0.04) {
        const sp = a + r * 0.28;
        const f = (Math.sin(sp * 3) + 1) / 2;
        const x = Math.round(w / 2 + Math.cos(a) * r);
        const y = Math.round(h / 2 + Math.sin(a) * r);
        px(c, `rgba(255,255,255,${0.15 + f * 0.8 * (1 - r / 24)})`, x, y);
      }
    }
  });
  PROPS.drip = canvas(2, 3, (c) => px(c, '#fff', 0, 0, 2, 3));
  return PROPS;
}
