import { Rng } from '../../../core/rng';

/** Isometric Grimdark: a 2:1 diamond tile, 32×16 art pixels. */
export const ISO_W = 32;
export const ISO_H = 16;
/** Wall cube heights in pixels (tall walls at the back, low ones in front so they never hide the action). */
export const WALL_TALL = 30;
export const WALL_LOW = 12;

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

/** Inside the 2:1 diamond inscribed in a ISO_W × ISO_H box. */
function inDiamond(x: number, y: number): boolean {
  return (
    Math.abs(x + 0.5 - ISO_W / 2) / (ISO_W / 2) + Math.abs(y + 0.5 - ISO_H / 2) / (ISO_H / 2) <= 1
  );
}

/** Four floor variants: hard-edged flagstones with grout, lit from the top-left. */
export function isoFloors(themeFloor: number): HTMLCanvasElement[] {
  const rng = new Rng(0x7f4a7c15 ^ themeFloor);
  const base = mul(hex(themeFloor), 2.3);
  const out: HTMLCanvasElement[] = [];
  for (let v = 0; v < 4; v++) {
    const cv = document.createElement('canvas');
    cv.width = ISO_W;
    cv.height = ISO_H;
    const c = cv.getContext('2d')!;
    const img = c.createImageData(ISO_W, ISO_H);
    const N = 4;
    const seeds = Array.from({ length: N }, () => ({
      x: rng.next() * ISO_W,
      y: rng.next() * ISO_H,
      shade: 0.72 + rng.next() * 0.5,
      moss: rng.next() > 0.8,
    }));
    for (let y = 0; y < ISO_H; y++)
      for (let x = 0; x < ISO_W; x++) {
        if (!inDiamond(x, y)) continue;
        let best = 1e9;
        let second = 1e9;
        let bi = 0;
        for (let i = 0; i < N; i++) {
          const d = Math.hypot(x - seeds[i].x, (y - seeds[i].y) * 2);
          if (d < best) {
            second = best;
            best = d;
            bi = i;
          } else if (d < second) second = d;
        }
        let col = mul(base, seeds[bi].shade);
        if (seeds[bi].moss) col = [col[0] * 0.9, col[1] * 1.08, col[2] * 0.95];
        if (second - best < 1.6) col = mul(base, 0.3);
        else if (second - best < 3 && x + y * 2 < seeds[bi].x + seeds[bi].y * 2)
          col = mul(col, 1.18);
        if (rng.next() < 0.05) col = mul(col, rng.next() < 0.5 ? 0.82 : 1.15);
        put(img, x, y, col);
      }
    // Dark rim on the lower edges so the slab reads as a tile.
    for (let y = 0; y < ISO_H; y++)
      for (let x = 0; x < ISO_W; x++) {
        if (!inDiamond(x, y)) continue;
        if (!inDiamond(x + 1, y + 1) || !inDiamond(x, y + 1)) {
          const k = (y * ISO_W + x) * 4;
          img.data[k] *= 0.55;
          img.data[k + 1] *= 0.55;
          img.data[k + 2] *= 0.55;
        }
      }
    c.putImageData(img, 0, 0);
    out.push(cv);
  }
  return out;
}

/**
 * Wall cubes: a lit top, a mid-tone left face and a dark right face of brick courses. The image is
 * ISO_W wide and (ISO_H + height) tall; the footprint's bottom vertex is the bottom-centre pixel.
 */
export function isoWalls(themeWall: number, height: number): HTMLCanvasElement[] {
  const rng = new Rng(0x2b1d9e37 ^ themeWall ^ height);
  const base = mul(hex(themeWall), 3.4);
  const out: HTMLCanvasElement[] = [];
  const H = ISO_H + height;
  for (let v = 0; v < 3; v++) {
    const cv = document.createElement('canvas');
    cv.width = ISO_W;
    cv.height = H;
    const c = cv.getContext('2d')!;
    const img = c.createImageData(ISO_W, H);
    const topDy = 0; // top diamond occupies rows [0, ISO_H)
    // Face helper: which face does a pixel belong to?
    for (let y = 0; y < H; y++)
      for (let x = 0; x < ISO_W; x++) {
        const dx = x + 0.5 - ISO_W / 2;
        // Top diamond (shifted up by `height`).
        const ty = y - topDy;
        const onTop =
          ty >= 0 &&
          ty < ISO_H &&
          Math.abs(dx) / (ISO_W / 2) + Math.abs(ty + 0.5 - ISO_H / 2) / (ISO_H / 2) <= 1;
        if (onTop) {
          let col = mul(base, 1.25);
          // Subtle slab seams and chips.
          if (
            (x * 3 + y * 5 + v * 7) % 11 === 0 ||
            (ty + 0.5 - ISO_H / 2 < -0.5 && Math.abs(dx) > ISO_W / 2 - ty * 2 - 2)
          )
            col = mul(base, 1.45);
          if (rng.next() < 0.08) col = mul(col, 0.85);
          put(img, x, y, col);
          continue;
        }
        // Side faces: below the top diamond's lower edges, down to the footprint's lower edges.
        const topLower = ISO_H / 2 + (ISO_H / 2) * (1 - Math.abs(dx) / (ISO_W / 2)); // lower edge of the top face
        const footLower = topLower + height;
        if (y >= topLower - 0.5 && y < footLower) {
          const left = dx < 0;
          const faceY = y - topLower; // 0..height down the face
          // Brick courses 5 px tall; joints offset per course; x measured along the face.
          const course = Math.floor(faceY / 5);
          const along = Math.floor(x + (left ? 0 : 3) + (course % 2) * 4 + v * 2);
          const mortar = faceY % 5 < 1 || along % 8 === 0;
          const face = left ? 1.0 : 0.62;
          let col = mul(
            base,
            mortar ? 0.38 * face : face * (0.85 + ((course * 13 + along * 7) % 5) * 0.06),
          );
          if (!mortar && rng.next() < 0.06) col = mul(col, 0.8);
          // Dark rim on the leading edge between faces.
          if (Math.abs(dx) < 1) col = mul(base, 0.3);
          put(img, x, y, col);
        }
      }
    // Outline: darken pixels bordering transparency.
    const copy = new Uint8ClampedArray(img.data);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < ISO_W; x++) {
        const k = (y * ISO_W + x) * 4;
        if (!copy[k + 3]) continue;
        const open = (xx: number, yy: number) =>
          xx < 0 || yy < 0 || xx >= ISO_W || yy >= H || !copy[(yy * ISO_W + xx) * 4 + 3];
        if (open(x - 1, y) || open(x + 1, y) || open(x, y - 1) || open(x, y + 1)) {
          img.data[k] *= 0.4;
          img.data[k + 1] *= 0.4;
          img.data[k + 2] *= 0.4;
        }
      }
    c.putImageData(img, 0, 0);
    out.push(cv);
  }
  return out;
}
