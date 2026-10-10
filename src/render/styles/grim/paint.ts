import { Rng } from '../../../core/rng';
import {
  FACTION_NAMES,
  type FactionId,
  type MonsterTypeId,
  type Stance,
  type Variant,
} from '../../../data/monsters';
import {
  buildFigure,
  isHero,
  poseFor,
  stanceFor,
  styleFor,
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
  gnawer: 0.7,
  bat: 0.7,
  beetle: 0.9,
  nest: 1.3,
  sentinel: 1.5,
  arbalest: 1.1,
  golem: 1.4,
  pylon: 1.2,
  hound: 1.2,
  boar: 1.25,
  cat: 1.25,
  bloat: 1.05,
  toad: 1.1,
  orb: 0.9,
  crawler: 1,
  heap: 1.35,
  bell: 1.1,
  spider: 1,
  chest: 1,
  worm: 1.1,
  slag: 1.25,
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

/** The faction palettes (docs/ENEMIES.md 6.2): the body is painted in them, not tinted, so the element stays an accent. */
const FACTION_PALETTE: Record<FactionId, Partial<Record<Role, RGB>>> = {
  ossuary: {},
  rot: {
    bone: hex(0xa9b07a),
    boneShade: hex(0x6e7a4c),
    cloth: hex(0x56603a),
    clothShade: hex(0x3a4528),
    accent: hex(0x9fd04a),
    eye: hex(0xc6ff3a),
    glow: hex(0xb6ff5a),
    skin: hex(0x8a9a5a),
  },
  hollow: {
    bone: hex(0xb8cce8),
    boneShade: hex(0x7e93bd),
    cloth: hex(0x44527a),
    clothShade: hex(0x2e3856),
    accent: hex(0x7ad0ff),
    eye: hex(0xa8f0ff),
    glow: hex(0xa8e8ff),
    metal: hex(0x9ab0d0),
  },
  choir: {
    bone: hex(0xd0b49a),
    boneShade: hex(0x9a7e68),
    cloth: hex(0x7a3a2c),
    clothShade: hex(0x4e241c),
    accent: hex(0xe0a040),
    eye: hex(0xffd060),
    glow: hex(0xffc060),
    skin: hex(0xd8b090),
    metal: hex(0xc8a860),
  },
  swarm: {
    bone: hex(0xc8a870),
    boneShade: hex(0x8a7048),
    cloth: hex(0x6a5030),
    clothShade: hex(0x453420),
    accent: hex(0xd88a3a),
    eye: hex(0xffa030),
    wood: hex(0x5a4228),
  },
  kennel: {
    bone: hex(0xb89a78),
    boneShade: hex(0x7a6048),
    cloth: hex(0x5a4630),
    clothShade: hex(0x3c2e1e),
    accent: hex(0xc8884a),
    eye: hex(0xffc860),
    skin: hex(0xb89a78),
    wood: hex(0x5a4228),
  },
  emberborn: {
    bone: hex(0xc8b8a8),
    boneShade: hex(0x7a6a5a),
    cloth: hex(0x4a2820),
    clothShade: hex(0x2a1612),
    accent: hex(0xff7a2a),
    eye: hex(0xffc040),
    glow: hex(0xffb050),
    skin: hex(0xa89888),
    metal: hex(0x5a5450),
    metalShade: hex(0x38342f),
  },
  drowned: {
    bone: hex(0xb4d0d4),
    boneShade: hex(0x6c9098),
    cloth: hex(0x2f5660),
    clothShade: hex(0x1c3640),
    accent: hex(0x5ad0e0),
    eye: hex(0x9af0ff),
    glow: hex(0x7ae0f0),
    skin: hex(0x8aa8a8),
    metal: hex(0x7a9aa4),
  },
  gilded: {
    bone: hex(0xd8c08a),
    boneShade: hex(0x9a8450),
    cloth: hex(0x6a4a2a),
    clothShade: hex(0x42301c),
    accent: hex(0xf0c040),
    metal: hex(0xe0c060),
    metalShade: hex(0xa88a30),
    eye: hex(0xffe070),
    glow: hex(0xffe890),
  },
  reliquary: {
    bone: hex(0xa8b0c0),
    boneShade: hex(0x6e7686),
    cloth: hex(0x4a505c),
    metal: hex(0xc0c8d4),
    metalShade: hex(0x70788a),
    accent: hex(0xd0a850),
    eye: hex(0xffd070),
    glow: hex(0xffe090),
  },
};

/** What the element does to a body: its colours take the eyes, the glow and the trim, and tint the rest a little. */
const ELEMENT_ACCENT: Record<
  Exclude<Variant, 'none'>,
  { eye: RGB; glow: RGB; accent: RGB; wash: RGB }
> = {
  fire: { eye: hex(0xff8a30), glow: hex(0xffb060), accent: hex(0xff6a28), wash: hex(0xffa068) },
  cold: { eye: hex(0x8fe0ff), glow: hex(0xb0e8ff), accent: hex(0x6ab8ff), wash: hex(0x90c8ff) },
  lightning: {
    eye: hex(0xf0d0ff),
    glow: hex(0xe0c0ff),
    accent: hex(0xc890ff),
    wash: hex(0xc8a0ff),
  },
};

const blend = (a: RGB, b: RGB, k: number): RGB => [
  a[0] + (b[0] - a[0]) * k,
  a[1] + (b[1] - a[1]) * k,
  a[2] + (b[2] - a[2]) * k,
];

/** What a monster looks like; `stance` is the pose of the attack it is making, when it is not its type's own (a thrown sidearm). */
export type MonsterLook = {
  type: MonsterTypeId;
  faction: FactionId;
  variant: Variant;
  stance?: Stance;
};

/** The palette of a monster: its faction's, with the element as an accent. */
export function monsterPalette(look: Pick<MonsterLook, 'faction' | 'variant'>): Record<Role, RGB> {
  const pal: Record<Role, RGB> = { ...UNDEAD, ...FACTION_PALETTE[look.faction] };
  if (look.variant !== 'none') {
    const e = ELEMENT_ACCENT[look.variant];
    pal.eye = e.eye;
    pal.glow = e.glow;
    pal.accent = e.accent;
    for (const r of ['bone', 'boneShade', 'cloth', 'clothShade'] as const)
      pal[r] = blend(pal[r], e.wash, 0.22);
  }
  return pal;
}

/** A short name of a faction palette, for tests and tooltips. */
export const FACTION_LABEL = FACTION_NAMES;

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
  look?: MonsterLook,
): HTMLCanvasElement {
  const S = frameSize(kind, px);
  const pal = isHero(kind) ? heroPalette(accent) : look ? monsterPalette(look) : UNDEAD;
  const prims = buildFigure(
    kind,
    poseFor(kind, anim, t, look?.stance ?? stanceFor(look?.type, kind), styleFor(look?.type, kind)),
    look?.type,
    t,
  );
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
  // What monsters throw (docs/ENCOUNTERS.md 3): each its own shape, so a spear is not read as an arrow.
  PROPS.p_spear = canvas(20, 5, (c) => {
    px(c, '#3a2c20', 0, 2, 3, 1);
    px(c, '#d8cfb4', 2, 2, 13, 1);
    px(c, '#b8ad90', 3, 3, 11, 1);
    px(c, '#f2ecda', 14, 1, 4, 3);
    px(c, '#ffffff', 18, 2, 2, 1);
  });
  PROPS.p_boulder = canvas(11, 11, (c, w, h, rng) => {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const d = Math.hypot(x - 5, (y - 5) * 1.1);
        if (d < 5.2 - rng.float(0, 0.8))
          px(c, d < 2 ? '#a89a88' : x + y < 9 ? '#8a7c6c' : '#5a5046', x, y);
      }
    px(c, '#3a342e', 6, 3, 1, 3);
    px(c, '#3a342e', 3, 6, 3, 1);
  });
  PROPS.p_gobbet = canvas(9, 8, (c) => {
    px(c, '#4a7a1a', 1, 2, 7, 4);
    px(c, '#6aa82a', 2, 1, 5, 6);
    px(c, '#b8f070', 3, 2, 2, 2);
    px(c, '#3a5a10', 0, 4, 2, 2);
  });
  PROPS.p_clot = canvas(9, 8, (c) => {
    px(c, '#1a4a6a', 1, 2, 7, 4);
    px(c, '#3a7aa8', 2, 1, 5, 6);
    px(c, '#c0eaff', 3, 2, 2, 2);
  });
  PROPS.p_shade = canvas(14, 9, (c, w, h) => {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const d = Math.hypot((x - 9) / 1.3, y - 4);
        if (d < 4 - (x < 9 ? (9 - x) * 0.25 : 0))
          px(c, d < 1.5 ? '#e0d0ff' : d < 2.6 ? '#7a5aa8' : '#2a1a40', x, y);
      }
  });
  PROPS.p_chain = canvas(16, 5, (c) => {
    for (let i = 0; i < 4; i++) {
      px(c, '#c0b070', i * 4, 1, 3, 1);
      px(c, '#c0b070', i * 4, 3, 3, 1);
      px(c, '#8a7a40', i * 4, 2, 1, 1);
    }
    px(c, '#e8d890', 12, 0, 4, 5);
  });
  PROPS.p_spore = canvas(7, 7, (c) => {
    px(c, '#6a8a2a', 1, 1, 5, 5);
    px(c, '#c8e870', 2, 2, 3, 3);
    px(c, '#fff8c0', 3, 3, 1, 1);
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
