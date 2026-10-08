import { MONSTER_TYPES, type MonsterTypeId } from '../../data/monsters';
import { monsterPalette } from '../styles/grim/paint';
import { buildFigure, poseFor, stanceFor, type AnimName, type Prim, type Role } from './figure';

/**
 * A contact sheet of the monster roster (docs/ROSTER.md 4.5): every type drawn from the same primitives the game uses, as
 * an SVG. It is the review tool of every change to a body or a kit, so it takes the things a reviewer needs to vary: the
 * scale (the game draws a figure unit as 0.6 px times the camera zoom, so `k` 0.6 is a phone and 1.2 a desktop), whether
 * colour is shown at all (silhouettes are judged with it off), and which poses to show.
 */
export type SheetOpts = {
  /** Pixels per design unit. */
  k?: number;
  /** Draw every figure in one flat colour. */
  mono?: boolean;
  /** The poses to draw side by side for each type. */
  poses?: [AnimName, number][];
  /** The types to draw; every type by default. */
  types?: MonsterTypeId[];
  /** Cells per row. */
  cols?: number;
};

const hex = (c: number[]) =>
  '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

function primSvg(p: Prim, fill: string): string {
  switch (p.k) {
    case 'circ':
      return `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${p.r.toFixed(2)}" fill="${fill}"/>`;
    case 'cap':
      return `<line x1="${p.x1.toFixed(2)}" y1="${p.y1.toFixed(2)}" x2="${p.x2.toFixed(2)}" y2="${p.y2.toFixed(2)}" stroke="${fill}" stroke-width="${(p.r * 2).toFixed(2)}" stroke-linecap="round"/>`;
    case 'box':
      return `<rect x="${(-p.w / 2).toFixed(2)}" y="${(-p.h / 2).toFixed(2)}" width="${p.w.toFixed(2)}" height="${p.h.toFixed(2)}" fill="${fill}" transform="translate(${p.x.toFixed(2)},${p.y.toFixed(2)}) rotate(${((p.rot * 180) / Math.PI).toFixed(2)})"/>`;
    case 'tri':
      return `<polygon points="${p.pts.map((n) => n.toFixed(2)).join(',')}" fill="${fill}"/>`;
  }
}

/** One type in one pose, as SVG at the origin (feet at 0,0). */
export function figureSvg(id: MonsterTypeId, anim: AnimName, t: number, mono: boolean): string {
  const def = MONSTER_TYPES[id];
  const pal = monsterPalette({ faction: def.faction, variant: 'none' });
  const prims = buildFigure(def.body, poseFor(def.body, anim, t, stanceFor(id, def.body)), id, t);
  return prims
    .map((p) => primSvg(p, mono ? '#e4e0d8' : hex(pal[p.role as Role] as unknown as number[])))
    .join('');
}

export function sheetSvg(opts: SheetOpts = {}): string {
  const k = opts.k ?? 1.9;
  const mono = opts.mono ?? false;
  const poses = opts.poses ?? [['idle', 0]];
  const ids = opts.types ?? (Object.keys(MONSTER_TYPES) as MonsterTypeId[]);
  const cols = opts.cols ?? 6;
  const cw = 80 * k * poses.length + 24;
  const ch = 120 * k + 30;
  const rows = Math.ceil(ids.length / cols);
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${cols * cw}" height="${rows * ch}" viewBox="0 0 ${cols * cw} ${rows * ch}">`,
    `<rect width="100%" height="100%" fill="#15110e"/>`,
  ];
  ids.forEach((id, i) => {
    const def = MONSTER_TYPES[id];
    const x0 = (i % cols) * cw;
    const y0 = Math.floor(i / cols) * ch;
    poses.forEach(([anim, t], j) => {
      const ox = x0 + 12 + (j + 0.5) * 80 * k;
      const oy = y0 + 120 * k - 6;
      parts.push(
        `<g transform="translate(${ox.toFixed(1)},${oy.toFixed(1)}) scale(${k})">${figureSvg(id, anim, t, mono)}</g>`,
      );
    });
    parts.push(
      `<text x="${x0 + cw / 2}" y="${y0 + ch - 8}" fill="#cfc8b8" font-size="11" font-family="sans-serif" text-anchor="middle">${def.name} (${def.faction})</text>`,
    );
  });
  parts.push('</svg>');
  return parts.join('\n');
}
