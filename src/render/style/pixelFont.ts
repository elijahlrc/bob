import Phaser from 'phaser';
import { BOB5, BOB7, GLYPH_ROWS, parseGlyph, type GlyphSet } from './pixelGlyphs';

/** The bitmap fonts a scene can write map text in: the text face, its bold, and the small digits. */
export const PIXEL_FONT = { text: 'px_bob7', bold: 'px_bob7b', small: 'px_bob5' } as const;
export type PixelFontKey = (typeof PIXEL_FONT)[keyof typeof PIXEL_FONT];

/** The outline round every glyph: one pixel of near-black, so text reads on any floor. */
const OUTLINE = '#0a0608';

/**
 * Paint one glyph set into a strip texture (white glyphs with their outline baked in; a BitmapText's tint colours
 * them and leaves the outline dark) and register it as a bitmap font. A glyph's cell is its width plus the outline on
 * both sides; it advances by its width plus one, so neighbours share the outline column between them.
 */
function addFont(
  scene: Phaser.Scene,
  key: string,
  set: GlyphSet,
  rows: number,
  bold: boolean,
): void {
  if (scene.cache.bitmapFont.exists(key)) return;
  const chars = Object.keys(set);
  const glyphs = chars.map((ch) => parseGlyph(set, ch)!);
  const extra = bold ? 1 : 0;
  const cellH = rows + 2;
  const cellW = glyphs.map((g) => g.w + extra + 2);
  const W = cellW.reduce((a, b) => a + b, 0);
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = cellH;
  const g = cv.getContext('2d')!;
  const chardata: Record<number, unknown> = {};
  let x0 = 0;
  glyphs.forEach((gl, i) => {
    const cw = cellW[i];
    const on = new Uint8Array(cw * cellH);
    gl.rows.forEach((row, ry) =>
      [...row].forEach((p, rx) => {
        if (p !== '#') return;
        for (let b = 0; b <= extra; b++) on[(gl.top + ry + 1) * cw + rx + 1 + b] = 1;
      }),
    );
    for (let y = 0; y < cellH; y++)
      for (let x = 0; x < cw; x++) {
        let edge = false;
        if (!on[y * cw + x])
          for (let dy = -1; dy <= 1 && !edge; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && ny >= 0 && nx < cw && ny < cellH && on[ny * cw + nx]) edge = true;
            }
        if (!on[y * cw + x] && !edge) continue;
        g.fillStyle = on[y * cw + x] ? '#ffffff' : OUTLINE;
        g.fillRect(x0 + x, y, 1, 1);
      }
    chardata[chars[i].charCodeAt(0)] = {
      x: x0,
      y: 0,
      width: cw,
      height: cellH,
      centerX: Math.floor(cw / 2),
      centerY: Math.floor(cellH / 2),
      xOffset: 0,
      yOffset: 0,
      xAdvance: gl.w + extra + 1,
      data: {},
      kerning: {},
      u0: x0 / W,
      v0: 1,
      u1: (x0 + cw) / W,
      v1: 0,
    };
    x0 += cw;
  });
  scene.textures.addCanvas(key, cv)!.setFilter(Phaser.Textures.FilterMode.NEAREST);
  scene.cache.bitmapFont.add(key, {
    data: { retroFont: true, font: key, size: cellH, lineHeight: cellH, chars: chardata },
    texture: key,
    frame: null,
  });
}

/** Register the map's bitmap fonts with a scene (once). */
export function ensurePixelFonts(scene: Phaser.Scene): void {
  addFont(scene, PIXEL_FONT.text, BOB7, GLYPH_ROWS.bob7, false);
  addFont(scene, PIXEL_FONT.bold, BOB7, GLYPH_ROWS.bob7, true);
  addFont(scene, PIXEL_FONT.small, BOB5, GLYPH_ROWS.bob5, false);
}

/** The size to create a BitmapText of `key` at, so it draws one texture pixel per game pixel. */
export function pixelFontSize(key: PixelFontKey): number {
  return (key === PIXEL_FONT.small ? GLYPH_ROWS.bob5 : GLYPH_ROWS.bob7) + 2;
}

/** Text with a glyph the face lacks shows it as '?' rather than a gap. */
export function pixelSafe(text: string, key: PixelFontKey): string {
  const set = key === PIXEL_FONT.small ? BOB5 : BOB7;
  return [...text].map((ch) => (set[ch] !== undefined ? ch : '?')).join('');
}
