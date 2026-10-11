/**
 * A tiny raster canvas that writes PNG files with no dependency: filled discs, rings, lines and small text (a 5x7 bitmap font),
 * drawn at twice the size and averaged down. It exists so that the tree can be drawn to a file that an agent or a person can open
 * (`scripts/tree/pic.ts`); it is not used by the game.
 */
import { crc32, deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

export type Rgb = [number, number, number];

export function hex(c: string): Rgb {
  const s = c.replace('#', '');
  const v = parseInt(s.length === 3 ? s.replace(/./g, (d) => d + d) : s, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

const FONT: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  '/': ['00001', '00001', '00010', '00100', '01000', '10000', '10000'],
};

export class Canvas {
  /** Output size in pixels. */
  readonly w: number;
  readonly h: number;
  /** Working size: twice the output, averaged down on write. */
  private readonly W: number;
  private readonly H: number;
  private readonly px: Uint8ClampedArray;

  constructor(w: number, h: number, bg: Rgb) {
    this.w = w;
    this.h = h;
    this.W = w * 2;
    this.H = h * 2;
    this.px = new Uint8ClampedArray(this.W * this.H * 3);
    for (let i = 0; i < this.W * this.H; i++) {
      this.px[i * 3] = bg[0];
      this.px[i * 3 + 1] = bg[1];
      this.px[i * 3 + 2] = bg[2];
    }
  }

  private blend(x: number, y: number, c: Rgb, a: number): void {
    if (x < 0 || y < 0 || x >= this.W || y >= this.H) return;
    const i = (y * this.W + x) * 3;
    this.px[i] += (c[0] - this.px[i]) * a;
    this.px[i + 1] += (c[1] - this.px[i + 1]) * a;
    this.px[i + 2] += (c[2] - this.px[i + 2]) * a;
  }

  /** All coordinates below are in output pixels (fractions allowed). */
  disc(cx: number, cy: number, r: number, c: Rgb, a = 1): void {
    const X = cx * 2;
    const Y = cy * 2;
    const R = r * 2;
    for (let y = Math.floor(Y - R); y <= Math.ceil(Y + R); y++)
      for (let x = Math.floor(X - R); x <= Math.ceil(X + R); x++)
        if ((x + 0.5 - X) ** 2 + (y + 0.5 - Y) ** 2 <= R * R) this.blend(x, y, c, a);
  }

  ring(cx: number, cy: number, r: number, width: number, c: Rgb, a = 1): void {
    const X = cx * 2;
    const Y = cy * 2;
    const R0 = Math.max(0, r - width / 2) * 2;
    const R1 = (r + width / 2) * 2;
    for (let y = Math.floor(Y - R1); y <= Math.ceil(Y + R1); y++)
      for (let x = Math.floor(X - R1); x <= Math.ceil(X + R1); x++) {
        const d2 = (x + 0.5 - X) ** 2 + (y + 0.5 - Y) ** 2;
        if (d2 <= R1 * R1 && d2 >= R0 * R0) this.blend(x, y, c, a);
      }
  }

  line(x0: number, y0: number, x1: number, y1: number, width: number, c: Rgb, a = 1): void {
    const ax = x0 * 2;
    const ay = y0 * 2;
    const bx = x1 * 2;
    const by = y1 * 2;
    const hw = (width * 2) / 2;
    const minX = Math.floor(Math.min(ax, bx) - hw - 1);
    const maxX = Math.ceil(Math.max(ax, bx) + hw + 1);
    const minY = Math.floor(Math.min(ay, by) - hw - 1);
    const maxY = Math.ceil(Math.max(ay, by) + hw + 1);
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy || 1;
    for (let y = Math.max(0, minY); y <= Math.min(this.H - 1, maxY); y++)
      for (let x = Math.max(0, minX); x <= Math.min(this.W - 1, maxX); x++) {
        const t = Math.max(0, Math.min(1, ((x + 0.5 - ax) * dx + (y + 0.5 - ay) * dy) / l2));
        const d = Math.hypot(x + 0.5 - (ax + t * dx), y + 0.5 - (ay + t * dy));
        if (d <= hw) this.blend(x, y, c, a);
      }
  }

  /** Text in capitals, `size` output pixels per font cell, left edge at x, vertical middle at y. */
  text(
    s: string,
    x: number,
    y: number,
    size: number,
    c: Rgb,
    anchor: 'start' | 'middle' = 'start',
  ): void {
    const str = s.toUpperCase();
    const total = str.length * 6 * size - size;
    let ox = anchor === 'middle' ? x - total / 2 : x;
    const oy = y - (7 * size) / 2;
    for (const ch of str) {
      const g = FONT[ch];
      if (g)
        for (let r = 0; r < 7; r++)
          for (let q = 0; q < 5; q++)
            if (g[r][q] === '1')
              for (let sy = 0; sy < size * 2; sy++)
                for (let sx = 0; sx < size * 2; sx++)
                  this.blend(
                    Math.floor(ox * 2 + q * size * 2 + sx),
                    Math.floor(oy * 2 + r * size * 2 + sy),
                    c,
                    1,
                  );
      ox += 6 * size;
    }
  }

  png(): Buffer {
    const raw = Buffer.alloc((this.w * 3 + 1) * this.h);
    for (let y = 0; y < this.h; y++) {
      raw[y * (this.w * 3 + 1)] = 0;
      for (let x = 0; x < this.w; x++)
        for (let k = 0; k < 3; k++) {
          let sum = 0;
          for (let j = 0; j < 2; j++)
            for (let i = 0; i < 2; i++) sum += this.px[((y * 2 + j) * this.W + x * 2 + i) * 3 + k];
          raw[y * (this.w * 3 + 1) + 1 + x * 3 + k] = Math.round(sum / 4);
        }
    }
    const chunk = (type: string, data: Buffer): Buffer => {
      const len = Buffer.alloc(4);
      len.writeUInt32BE(data.length);
      const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
      const crc = Buffer.alloc(4);
      crc.writeUInt32BE(crc32(body) >>> 0);
      return Buffer.concat([len, body, crc]);
    };
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.w, 0);
    ihdr.writeUInt32BE(this.h, 4);
    ihdr[8] = 8;
    ihdr[9] = 2;
    return Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw)),
      chunk('IEND', Buffer.alloc(0)),
    ]);
  }

  save(path: string): void {
    writeFileSync(path, this.png());
  }
}
