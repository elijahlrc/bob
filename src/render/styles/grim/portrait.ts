import { MONSTER_TYPES, type MonsterTypeId } from '../../../data/monsters';
import { rasterFigure } from './paint';

/**
 * A monster's portrait for the menus (a boss's offer at camp, docs/BOSSES.md 10). The menus may not reach the renderer, so
 * `main.ts` hands this to the controller (`Controller.portrait`).
 */

/** The part of a painted frame the figure covers, with a small margin (a frame is mostly empty room for its poses). */
function cropToFigure(src: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = src.getContext('2d');
  if (!ctx) return src;
  const { width: w, height: h } = src;
  const d = ctx.getImageData(0, 0, w, h).data;
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (d[(y * w + x) * 4 + 3] > 0) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) return src;
  const pad = 4;
  const side = Math.max(x1 - x0, y1 - y0) + pad * 2;
  const out = document.createElement('canvas');
  out.width = out.height = side;
  // Feet on the bottom, centred across.
  out
    .getContext('2d')!
    .drawImage(
      src,
      x0,
      y0,
      x1 - x0 + 1,
      y1 - y0 + 1,
      (side - (x1 - x0)) / 2,
      side - pad - (y1 - y0),
      x1 - x0 + 1,
      y1 - y0 + 1,
    );
  return out;
}

/** A monster's figure as a picture for the camp, painted as the map paints it (made once per type). */
const portraits = new Map<MonsterTypeId, string>();
export function monsterPortrait(type: MonsterTypeId): string {
  let url = portraits.get(type);
  if (!url) {
    const t = MONSTER_TYPES[type];
    const src = rasterFigure(t.body, 'idle', 0.25, 0, 1.4, {
      type,
      faction: t.faction,
      variant: 'none',
    });
    url = cropToFigure(src).toDataURL();
    portraits.set(type, url);
  }
  return url;
}
