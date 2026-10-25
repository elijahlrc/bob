import { tone } from '../../../data/palette';

/** Isometric Grimdark: a 2:1 diamond tile, 32×16 art pixels. */
export const ISO_W = 32;
export const ISO_H = 16;
/** Wall cube heights in pixels (tall walls at the back, low ones in front so they never hide the action). */
export const WALL_TALL = 30;
export const WALL_LOW = 12;
/** The three heights of each kind of wall cube, so a run of wall has a broken top rather than one flat line. */
export const TALL_HEIGHTS = [27, 30, 33] as const;
export const LOW_HEIGHTS = [10, 12, 14] as const;

type RGB = [number, number, number];
const hex = (c: number): RGB => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
const mul = (c: RGB, f: number): RGB => [
  Math.max(0, Math.min(255, c[0] * f)),
  Math.max(0, Math.min(255, c[1] * f)),
  Math.max(0, Math.min(255, c[2] * f)),
];

function put(img: ImageData, x: number, y: number, c: RGB, a = 255): void {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  const k = (y * img.width + x) * 4;
  img.data[k] = c[0];
  img.data[k + 1] = c[1];
  img.data[k + 2] = c[2];
  img.data[k + 3] = a;
}

/** How a biome's ground is made (docs/MAP-VARIETY.md 3.4). */
export type FloorKind = 'flag' | 'cobble' | 'rock' | 'slab' | 'plate' | 'earth';
/** How a biome's walls are made. */
export type WallKind = 'brick' | 'rough' | 'ashlar';

const FLOOR_SALT: Record<FloorKind, number> = {
  flag: 0,
  cobble: 0x1111,
  rock: 0x2222,
  slab: 0x3333,
  plate: 0x4444,
  earth: 0x5555,
};
const WALL_SALT: Record<WallKind, number> = { brick: 0, rough: 0x1357, ashlar: 0x2468 };

/** A cheap hash of two integers to [0, 1). */
function hash2(x: number, y: number, salt: number): number {
  let h = (x * 374761393 + y * 668265263 + salt * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Smooth value noise in [0, 1). */
function vnoise(x: number, y: number, salt: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy, salt);
  const b = hash2(ix + 1, iy, salt);
  const c = hash2(ix, iy + 1, salt);
  const d = hash2(ix + 1, iy + 1, salt);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

/** Tile space to the view's pixels (the grim style's `project`, without the map's origin). */
const toSx = (tx: number, ty: number) => ((tx - ty) * ISO_W) / 2;
const toSy = (tx: number, ty: number) => ((tx + ty) * ISO_H) / 2;

/** The stone a point falls in: a jittered grid of cells in tile space, measured in the view's pixels. */
type Cell = { id: number; edge: number; fx: number; fy: number };
const cellOut: Cell = { id: 0, edge: 0, fx: 0, fy: 0 };
function voronoi(tx: number, ty: number, size: number, jitter: number, salt: number): Cell {
  const u = tx / size;
  const v = ty / size;
  const iu = Math.floor(u);
  const iv = Math.floor(v);
  const sx = toSx(tx, ty);
  const sy = toSy(tx, ty);
  let b1 = 1e18;
  let b2 = 1e18;
  let x1 = 0;
  let y1 = 0;
  let x2 = 0;
  let y2 = 0;
  let id = 0;
  for (let dj = -1; dj <= 1; dj++)
    for (let di = -1; di <= 1; di++) {
      const cu = iu + di;
      const cv = iv + dj;
      const ftx = (cu + 0.5 + (hash2(cu, cv, salt) - 0.5) * jitter) * size;
      const fty = (cv + 0.5 + (hash2(cu, cv, salt + 1) - 0.5) * jitter) * size;
      const fx = toSx(ftx, fty);
      const fy = toSy(ftx, fty);
      const d = (sx - fx) ** 2 + (sy - fy) ** 2;
      if (d < b1) {
        b2 = b1;
        x2 = x1;
        y2 = y1;
        b1 = d;
        x1 = fx;
        y1 = fy;
        id = hash2(cu, cv, salt + 2);
      } else if (d < b2) {
        b2 = d;
        x2 = fx;
        y2 = fy;
      }
    }
  cellOut.id = id;
  // The exact distance to the border between the two nearest stones.
  cellOut.edge = (b2 - b1) / (2 * Math.max(1e-6, Math.hypot(x2 - x1, y2 - y1)));
  cellOut.fx = x1;
  cellOut.fy = y1;
  return cellOut;
}

/** A worn gold-leaf colour at shade `f` (0 dark to 1 light), flaked to the red bole at `flake`. */
function gilt(f: number, flake: boolean): RGB {
  if (flake) return hex(tone('bole', 1 + Math.round(f * 2)));
  return hex(tone('gold', 1 + Math.round(f * 4)));
}

export type FloorPaint = {
  /** The ground's colour (the biome's mixed with the theme's). */
  floor: number;
  kind: FloorKind;
  /** The share of stones that are gilded inlay (flag and slab only). */
  gilt: number;
  /** The map's seed, so a map keeps its floor. */
  seed: number;
};

/**
 * One chunk of floor, painted in world space (docs/WORLD-LEAF.md 3.6): stones are laid across the map rather than
 * stamped tile by tile, so no tile's outline shows, and the ground varies at a larger scale too (worn and damp patches,
 * a missing or cracked stone, pebbles). `minX`, `minY` is the chunk's top-left in the view's pixels; only the pixels of
 * the chunk's own floor tiles (`mine`) are painted, and a dark lip is drawn where the floor (`floorAt`) stops.
 */
export function paintFloorChunk(
  img: ImageData,
  minX: number,
  minY: number,
  mine: (x: number, y: number) => boolean,
  floorAt: (x: number, y: number) => boolean,
  o: FloorPaint,
): boolean {
  const base = mul(hex(o.floor), 2.3);
  const salt = (FLOOR_SALT[o.kind] ^ o.seed) | 0;
  const W = img.width;
  const H = img.height;
  let any = false;
  for (let py = 0; py < H; py++)
    for (let px = 0; px < W; px++) {
      const sx = px + minX + 0.5;
      const sy = py + minY + 0.5;
      const tx = (sx / (ISO_W / 2) + sy / (ISO_H / 2)) / 2;
      const ty = (sy / (ISO_H / 2) - sx / (ISO_W / 2)) / 2;
      if (!mine(Math.floor(tx), Math.floor(ty))) continue;
      any = true;
      // Wear at two scales, over every kind of ground.
      const wear =
        0.88 + vnoise(tx * 0.3, ty * 0.3, salt + 7) * 0.2 + vnoise(tx, ty, salt + 8) * 0.08;
      const damp = vnoise(tx * 0.45 + 50, ty * 0.45, salt + 9);
      let col = floorPixel(o, base, salt, tx, ty, sx, sy);
      col = mul(col, wear * (damp > 0.7 ? 0.82 : 1));
      if (hash2(px + minX, py + minY, salt + 10) < 0.04)
        col = mul(col, hash2(px, py, salt + 11) < 0.5 ? 0.85 : 1.12);
      put(img, px, py, col);
    }
  // A dark lip where the floor stops at the void (walls stand over the rest).
  const d = img.data;
  const voidAt = (px: number, py: number) => {
    const sx = px + minX + 0.5;
    const sy = py + minY + 0.5;
    const tx = (sx / (ISO_W / 2) + sy / (ISO_H / 2)) / 2;
    const ty = (sy / (ISO_H / 2) - sx / (ISO_W / 2)) / 2;
    return !floorAt(Math.floor(tx), Math.floor(ty));
  };
  for (let py = 0; py < H; py++)
    for (let px = 0; px < W; px++) {
      const k = (py * W + px) * 4;
      if (d[k + 3] && (voidAt(px, py + 1) || voidAt(px + 1, py))) {
        d[k] *= 0.55;
        d[k + 1] *= 0.55;
        d[k + 2] *= 0.55;
      }
    }
  return any;
}

/** One pixel of ground of a kind, before the wear. */
function floorPixel(
  o: FloorPaint,
  base: RGB,
  salt: number,
  tx: number,
  ty: number,
  sx: number,
  sy: number,
): RGB {
  switch (o.kind) {
    case 'flag':
    case 'cobble':
      return stones(o, base, salt, tx, ty, sx, sy);
    case 'slab':
      return slabs(o, base, salt, tx, ty);
    case 'plate': {
      // Iron plates two tiles square, rows staggered, with bars, rivets and now and then a glowing seam.
      const row = Math.floor(ty / 2);
      const u = tx / 2 + (row % 2) * 0.5;
      const fu = u - Math.floor(u);
      const fv = ty / 2 - row;
      const pid = hash2(Math.floor(u), row, salt);
      const seam = Math.min(fu, 1 - fu, fv, 1 - fv) * 2 * 17.9;
      let col = mul(base, 0.86 + pid * 0.16);
      if (Math.abs(((fv * 4) % 1) - 0.5) < 0.1) col = mul(base, 0.64);
      if (seam < 1) col = mul(base, 0.3);
      else if (seam < 2 && fu + fv < 1) col = mul(col, 1.15);
      if (Math.abs(fu - 0.12) < 0.05 && (Math.abs(fv - 0.12) < 0.05 || Math.abs(fv - 0.88) < 0.05))
        col = mul(base, 1.5);
      if (pid < 0.08 && Math.abs(fu - 0.5 - (fv - 0.5) * 0.3) < 0.03) col = [235, 120, 40];
      return col;
    }
    case 'rock': {
      // Bare stone: blotches at two scales, fissures along the ridges of a noise, and the odd bright fleck.
      const n = vnoise(tx * 1.6, ty * 1.6, salt) * 0.6 + vnoise(tx * 4, ty * 4, salt + 1) * 0.4;
      let col = mul(base, 0.7 + n * 0.55);
      const r = Math.abs(vnoise(tx * 1.1, ty * 1.1, salt + 2) - 0.5);
      if (r < 0.018) col = mul(base, 0.35);
      else if (r < 0.04) col = mul(col, 0.82);
      if (hash2(Math.floor(sx), Math.floor(sy), salt + 3) < 0.02) col = mul(base, 1.35);
      return col;
    }
    default: {
      // Earth: grain, pebbles with a lit top, and tufts of green in patches.
      let col = mul(base, 0.8 + hash2(Math.floor(sx), Math.floor(sy), salt) * 0.3);
      const pb = voronoi(tx, ty, 0.3, 0.9, salt + 4);
      if (pb.id < 0.12) {
        const dd = Math.hypot(sx - pb.fx, sy - pb.fy);
        if (dd < 1.6) col = mul(base, sy < pb.fy ? 1.4 : 1.05);
        else if (dd < 2.4 && sy > pb.fy) col = mul(base, 0.5);
      }
      if (
        vnoise(tx * 0.9, ty * 0.9, salt + 5) > 0.66 &&
        hash2(Math.floor(sx), Math.floor(sy), salt + 6) < 0.35
      )
        col = [col[0] * 0.8, col[1] * 1.22, col[2] * 0.8];
      return col;
    }
  }
}

/** Flagstones (big and uneven) or cobbles (small and round), laid as one field across the map. */
function stones(
  o: FloorPaint,
  base: RGB,
  salt: number,
  tx: number,
  ty: number,
  sx: number,
  sy: number,
): RGB {
  const cob = o.kind === 'cobble';
  const c = voronoi(tx, ty, cob ? 0.36 : 0.58, cob ? 0.8 : 0.95, salt);
  const grout = cob ? 0.9 : 1.05;
  if (c.edge < grout) return mul(base, 0.3);
  const id = c.id;
  // A missing stone leaves dark earth.
  if (!cob && id < 0.03)
    return mul(base, 0.42 + hash2(Math.floor(sx), Math.floor(sy), salt) * 0.12);
  const dx = sx - c.fx;
  const dy = sy - c.fy;
  const towardLight = dx + dy * 2 < 0;
  const isGilt = !cob && o.gilt > 0 && id > 1 - o.gilt;
  let col: RGB;
  if (isGilt) {
    const flake = vnoise(sx * 0.4, sy * 0.4, salt + 20) > 0.62;
    col = gilt(0.45 + (towardLight ? 0.3 : 0) - (c.edge < 2.5 ? 0.2 : 0), flake);
  } else {
    col = mul(base, 0.74 + id * 0.46);
    if (id > 0.82 && id < 0.9) col = [col[0] * 0.9, col[1] * 1.08, col[2] * 0.95];
  }
  // Relief: a lit lip on the side facing the light, a shadowed one opposite.
  if (c.edge < 2.2) col = mul(col, towardLight ? 1.17 : 0.84);
  else if (cob) col = mul(col, 1 + Math.max(-0.12, Math.min(0.12, -(dx + dy * 2) * 0.012)));
  // A cracked flagstone.
  if (!cob && id > 0.03 && id < 0.11) {
    const a = id * 40;
    const along = dx * Math.cos(a) + dy * Math.sin(a);
    const off = -dx * Math.sin(a) + dy * Math.cos(a) - Math.sin(along * 0.7 + id * 90) * 0.9;
    if (Math.abs(off) < 0.55 && Math.abs(along) < 3 + id * 40) col = mul(base, 0.32);
  }
  return col;
}

/** Big squared slabs, a tile wide and one or two long, in staggered rows. */
function slabs(o: FloorPaint, base: RGB, salt: number, tx: number, ty: number): RGB {
  const row = Math.floor(tx);
  const shift = hash2(row, 0, salt) * 2;
  const along = ty + shift;
  // Slab lengths alternate between one and two tiles down a row, by hash.
  const k = Math.floor(along / 1.5);
  const id = hash2(row, k, salt + 1);
  const fu = tx - row;
  const fv = along / 1.5 - k;
  // Joints in the view's pixels (a tile's side is about 18 px long).
  const ju = Math.min(fu, 1 - fu) * 17.9;
  const jv = Math.min(fv, 1 - fv) * 1.5 * 17.9;
  const j = Math.min(ju, jv);
  if (j < 1) return mul(base, 0.32);
  const lit = (ju < 2.5 && fu < 0.5) || (jv < 2.5 && fv < 0.5);
  if (o.gilt > 0 && id > 1 - o.gilt) {
    const flake = vnoise(tx * 6, along * 6, salt + 20) > 0.6;
    return gilt(0.4 + (lit ? 0.3 : 0), flake);
  }
  let col = mul(base, 0.8 + id * 0.32);
  if (j < 2.5) col = mul(col, lit ? 1.15 : 0.86);
  if (id < 0.07 && Math.abs(fu - 0.5 - (fv - 0.5) * 0.6) < 0.025) col = mul(base, 0.34);
  return col;
}

/**
 * Which neighbours of a wall cube are walls too, as bits: north (x, y-1), west (x-1, y), east (x+1, y), south
 * (x, y+1). A cube has an outline and a lit lip only on the edges no neighbour covers, so a run of wall reads as one
 * mass rather than a row of boxes.
 */
export const WALL_N = 1;
export const WALL_W = 2;
export const WALL_E = 4;
export const WALL_S = 8;

export type WallPaint = {
  wall: number;
  kind: WallKind;
  height: number;
  /** Which neighbours are walls (WALL_N | …). */
  mask: number;
  /** 0 or 1: a second shading of the stones, or (with `frieze`) a gold frieze. */
  variant: number;
  /** The second variant carries a worn gold frieze (the holy biomes). */
  frieze: boolean;
};

/**
 * A wall cube: a lit top, a mid-tone left face and a dark right face. The courses are measured from the foot and repeat
 * every 16 px along a face, so they run on from cube to cube even where the heights differ. The image is ISO_W wide and
 * (ISO_H + height) tall; the footprint's bottom vertex is the bottom-centre pixel.
 */
export function isoWallCube(o: WallPaint): HTMLCanvasElement {
  const { height, kind, mask, variant } = o;
  const base = mul(hex(o.wall), 3.4);
  const salt = WALL_SALT[kind] + variant * 101;
  const H = ISO_H + height;
  const cv = document.createElement('canvas');
  cv.width = ISO_W;
  cv.height = H;
  const c = cv.getContext('2d')!;
  const img = c.createImageData(ISO_W, H);
  const has = (bit: number) => (mask & bit) !== 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < ISO_W; x++) {
      const dx = x + 0.5 - ISO_W / 2;
      const onTop =
        y < ISO_H && Math.abs(dx) / (ISO_W / 2) + Math.abs(y + 0.5 - ISO_H / 2) / (ISO_H / 2) <= 1;
      if (onTop) {
        // Natural rock has a ragged top where it is open: bites out of the cap's upper edges.
        if (kind === 'rough' && y < ISO_H / 2 && !has(dx < 0 ? WALL_W : WALL_N)) {
          const m = Math.abs(dx) / (ISO_W / 2) + Math.abs(y + 0.5 - ISO_H / 2) / (ISO_H / 2);
          if ((1 - m) * (ISO_H / 2) < hash2(x >> 1, 3, salt) * 3.5) continue;
        }
        // The cap: a worn capstone, mottled and pitted.
        let col = mul(base, 1.08 + (vnoise(x * 0.3, y * 0.6, salt + 3) - 0.5) * 0.3);
        const pit = hash2(x, y, salt + 4);
        if (pit < 0.1) col = mul(col, 0.78);
        else if (pit > 0.96) col = mul(col, 1.15);
        put(img, x, y, col);
        continue;
      }
      const topLower = ISO_H / 2 + (ISO_H / 2) * (1 - Math.abs(dx) / (ISO_W / 2));
      const footLower = topLower + height;
      if (y < topLower - 0.5 || y >= footLower) continue;
      const left = dx < 0;
      const up = footLower - 1 - y; // 0 at the foot, up the face
      const face = left ? 1.0 : 0.62;
      let col: RGB;
      if (kind === 'rough') {
        // Natural rock: uneven strata and cracks running down the face.
        const n = vnoise(x * 0.5, up / 3, salt);
        col = mul(base, face * (0.7 + n * 0.5));
        if (hash2(x, 0, salt) < 0.12) col = mul(col, 0.7);
        if (hash2(x, Math.floor(up), salt + 1) < 0.04) col = mul(base, 0.3 * face);
      } else if (kind === 'ashlar') {
        // Big dressed blocks: courses of 10, joints every 16, a pale edge on each block.
        const course = Math.floor(up / 10);
        const along = (x + (course % 2) * 8) % 16;
        const mortar = up % 10 === 9 || along === 0;
        col = mul(
          base,
          mortar
            ? 0.36 * face
            : face * (0.88 + hash2(course, Math.floor((x + (course % 2) * 8) / 16), salt) * 0.26),
        );
        if (!mortar && (up % 10 === 8 || along === 1)) col = mul(col, 1.18);
      } else {
        // Brick: courses of 5, joints every 8.
        const course = Math.floor(up / 5);
        const along = (x + (course % 2) * 4) % 8;
        const mortar = up % 5 === 4 || along === 0;
        const brick = hash2(course, Math.floor((x + (course % 2) * 4) / 8), salt);
        col = mul(base, mortar ? 0.38 * face : face * (0.82 + brick * 0.3));
        if (!mortar && brick < 0.06) col = mul(col, 0.7);
      }
      // Grime: darker towards the foot, and streaks run down from the cap.
      if (up < 6) col = mul(col, 0.74 + up * 0.043);
      const streak = hash2(x, 7, salt + 5);
      if (streak < 0.18 && y - topLower < 4 + streak * 60) col = mul(col, 0.8);
      // A worn gold frieze on the upper courses of a tall wall.
      if (o.frieze && variant === 1 && up >= 21 && up < 24) {
        const band =
          up === 22
            ? hex(tone('lapis', 3))
            : gilt(left ? 0.7 : 0.35, hash2(x, up, salt + 6) < 0.22);
        col = mul(band, up === 22 ? face : 1);
      }
      // The corner between the faces, when both faces show.
      if (Math.abs(dx) < 1 && !has(WALL_E) && !has(WALL_S)) col = mul(base, 0.3);
      put(img, x, y, col);
    }
  // Outline and lit lip only on the edges no neighbour covers.
  const copy = new Uint8ClampedArray(img.data);
  const open = (xx: number, yy: number) =>
    xx < 0 || yy < 0 || xx >= ISO_W || yy >= H || !copy[(yy * ISO_W + xx) * 4 + 3];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < ISO_W; x++) {
      const k = (y * ISO_W + x) * 4;
      if (!copy[k + 3]) continue;
      const oL = open(x - 1, y);
      const oR = open(x + 1, y);
      const oU = open(x, y - 1);
      const oD = open(x, y + 1);
      if (!(oL || oR || oU || oD)) continue;
      const dx = x + 0.5 - ISO_W / 2;
      let covered = false;
      if (oD && !oU && !oL && !oR)
        covered = false; // the foot: always outlined
      else if (y < ISO_H / 2 + 1 && (oU || (dx < 0 ? oL : oR)))
        covered = dx < 0 ? has(WALL_W) : has(WALL_N); // the cap's upper edges
      else if (oL && x <= 1) covered = has(WALL_W);
      else if (oR && x >= ISO_W - 2) covered = has(WALL_N);
      // Where a neighbour covers an edge of the cap, a faint joint between capstones is left; elsewhere nothing.
      const capJoint = covered && y < ISO_H / 2 + 1;
      if (covered && !capJoint) continue;
      const f = capJoint ? 0.72 : 0.4;
      img.data[k] *= f;
      img.data[k + 1] *= f;
      img.data[k + 2] *= f;
      // The open upper edges of the cap catch the light just inside the outline.
      if (!capJoint && y < ISO_H / 2 + 1 && oU) {
        const k2 = ((y + 1) * ISO_W + x) * 4;
        if (copy[k2 + 3] && y + 1 < ISO_H) {
          img.data[k2] = Math.min(255, copy[k2] * 1.2);
          img.data[k2 + 1] = Math.min(255, copy[k2 + 1] * 1.2);
          img.data[k2 + 2] = Math.min(255, copy[k2 + 2] * 1.2);
        }
      }
    }
  c.putImageData(img, 0, 0);
  return cv;
}
