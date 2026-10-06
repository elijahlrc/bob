import type { Rng } from '../core/rng';
import { CELL, MAP_MAX } from '../data/constants';

export const WALL = 0;
export const FLOOR = 1;

export type Rect = { x: number; y: number; w: number; h: number };

export type RoomKind = 'start' | 'main' | 'end' | 'side';

export type Room = {
  id: number;
  kind: RoomKind;
  rect: Rect;
  cx: number;
  cy: number;
  /** Index along the main path (side rooms: index of the main room they hang off). */
  pathIndex: number;
  /** For side rooms: the room this one connects to. */
  parent?: number;
  /** The last room of a side branch holds a chest. */
  chest?: boolean;
};

export type Waypoint = { x: number; y: number; room: number };

export type Labyrinth = {
  w: number;
  h: number;
  tiles: Uint8Array;
  rooms: Room[];
  /** Room ids along the main path, start first, end last. */
  mainPath: number[];
  waypoints: Waypoint[];
  start: { x: number; y: number };
  exit: { x: number; y: number };
};

export type LabyrinthOpts = { rooms: number; sideBranches: number };

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

const GRID = Math.floor((MAP_MAX - 2) / CELL); // 11 cells across

type Cell = { cx: number; cy: number };

function key(c: Cell): number {
  return c.cy * GRID + c.cx;
}

/** Self-avoiding random walk with backtracking; returns `n` cells. */
function walk(rng: Rng, n: number, used: Set<number>): Cell[] | null {
  const start: Cell = { cx: rng.int(3, GRID - 4), cy: rng.int(3, GRID - 4) };
  const path: Cell[] = [start];
  const tried: number[][] = [[]];
  used.add(key(start));
  let guard = 0;
  while (path.length < n && guard++ < 10000) {
    const cur = path[path.length - 1];
    const opts = DIRS.map((_, i) => i).filter((i) => {
      if (tried[path.length - 1].includes(i)) return false;
      const nx = cur.cx + DIRS[i][0];
      const ny = cur.cy + DIRS[i][1];
      return nx >= 0 && ny >= 0 && nx < GRID && ny < GRID && !used.has(ny * GRID + nx);
    });
    if (opts.length === 0) {
      if (path.length === 1) return null;
      used.delete(key(path.pop()!));
      tried.pop();
      continue;
    }
    const d = rng.pick(opts);
    tried[path.length - 1].push(d);
    const next = { cx: cur.cx + DIRS[d][0], cy: cur.cy + DIRS[d][1] };
    used.add(key(next));
    path.push(next);
    tried.push([]);
  }
  return path.length === n ? path : null;
}

function center(r: Rect): { x: number; y: number } {
  return { x: Math.floor(r.x + r.w / 2), y: Math.floor(r.y + r.h / 2) };
}

function carve(tiles: Uint8Array, w: number, x0: number, y0: number, x1: number, y1: number): void {
  const xa = Math.min(x0, x1);
  const xb = Math.max(x0, x1);
  const ya = Math.min(y0, y1);
  const yb = Math.max(y0, y1);
  for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) tiles[y * w + x] = FLOOR;
}

/** Carve an L-shaped (optionally jogged) corridor of the given width between two points. */
function corridor(
  rng: Rng,
  tiles: Uint8Array,
  w: number,
  a: { x: number; y: number },
  b: { x: number; y: number },
): void {
  const width = rng.int(2, 3);
  const pts: { x: number; y: number }[] = [a];
  if (rng.chance(0.3)) {
    // Extra jog: three segments via a random intermediate coordinate.
    if (rng.chance(0.5)) {
      const mx = rng.int(Math.min(a.x, b.x), Math.max(a.x, b.x));
      pts.push({ x: mx, y: a.y }, { x: mx, y: b.y });
    } else {
      const my = rng.int(Math.min(a.y, b.y), Math.max(a.y, b.y));
      pts.push({ x: a.x, y: my }, { x: b.x, y: my });
    }
  } else if (rng.chance(0.5)) {
    pts.push({ x: b.x, y: a.y });
  } else {
    pts.push({ x: a.x, y: b.y });
  }
  pts.push(b);
  for (let i = 0; i + 1 < pts.length; i++) {
    const p = pts[i];
    const q = pts[i + 1];
    carve(tiles, w, p.x, p.y, q.x + width - 1, q.y + width - 1);
    carve(tiles, w, p.x, p.y, p.x + width - 1, p.y + width - 1);
  }
}

function placeRoom(rng: Rng, c: Cell, minSide: number, ox: number, oy: number): Rect {
  const w = rng.int(minSide, 12);
  const h = rng.int(minSide, 12);
  const cellX = ox + c.cx * CELL;
  const cellY = oy + c.cy * CELL;
  const x = rng.int(cellX + 1, cellX + CELL - 1 - w);
  const y = rng.int(cellY + 1, cellY + CELL - 1 - h);
  return { x, y, w, h };
}

/** Generate a linear labyrinth (DESIGN.md §10.1). Deterministic for a given rng state. */
export function generateLabyrinth(rng: Rng, opts: LabyrinthOpts): Labyrinth {
  for (let attempt = 0; attempt < 50; attempt++) {
    const lab = tryGenerate(rng, opts);
    if (lab) return lab;
  }
  throw new Error('labyrinth generation failed');
}

function tryGenerate(rng: Rng, opts: LabyrinthOpts): Labyrinth | null {
  const used = new Set<number>();
  const main = walk(rng, opts.rooms, used);
  if (!main) return null;

  // Side branches hang off main-path rooms other than start and end.
  type Side = { cells: Cell[]; from: number };
  const sides: Side[] = [];
  for (let b = 0; b < opts.sideBranches; b++) {
    const candidates: number[] = [];
    for (let i = 1; i < main.length - 1; i++) candidates.push(i);
    rng.shuffle(candidates);
    const len = rng.int(1, 2);
    for (const from of candidates) {
      const cells: Cell[] = [];
      let cur = main[from];
      for (let k = 0; k < len; k++) {
        const free = DIRS.map((d) => ({ cx: cur.cx + d[0], cy: cur.cy + d[1] })).filter(
          (n) => n.cx >= 0 && n.cy >= 0 && n.cx < GRID && n.cy < GRID && !used.has(key(n)),
        );
        if (free.length === 0) break;
        const n = rng.pick(free);
        used.add(key(n));
        cells.push(n);
        cur = n;
      }
      if (cells.length > 0) {
        sides.push({ cells, from });
        break;
      }
    }
  }

  // Bounding box in cells, then shift so the map is compact.
  let minX = GRID;
  let minY = GRID;
  let maxX = 0;
  let maxY = 0;
  for (const k of used) {
    const cx = k % GRID;
    const cy = Math.floor(k / GRID);
    minX = Math.min(minX, cx);
    minY = Math.min(minY, cy);
    maxX = Math.max(maxX, cx);
    maxY = Math.max(maxY, cy);
  }
  const w = (maxX - minX + 1) * CELL + 2;
  const h = (maxY - minY + 1) * CELL + 2;
  if (w > MAP_MAX || h > MAP_MAX) return null;
  const ox = 1 - minX * CELL;
  const oy = 1 - minY * CELL;
  const tiles = new Uint8Array(w * h);

  const rooms: Room[] = [];
  const mainPath: number[] = [];
  main.forEach((c, i) => {
    const kind: RoomKind = i === 0 ? 'start' : i === main.length - 1 ? 'end' : 'main';
    const rect = placeRoom(rng, c, kind === 'end' ? 10 : 6, ox, oy);
    const cc = center(rect);
    rooms.push({ id: rooms.length, kind, rect, cx: cc.x, cy: cc.y, pathIndex: i });
    mainPath.push(rooms.length - 1);
  });
  const sideRooms: number[][] = [];
  for (const s of sides) {
    const ids: number[] = [];
    let parent = mainPath[s.from];
    s.cells.forEach((c, k) => {
      const rect = placeRoom(rng, c, 6, ox, oy);
      const cc = center(rect);
      rooms.push({
        id: rooms.length,
        kind: 'side',
        rect,
        cx: cc.x,
        cy: cc.y,
        pathIndex: s.from,
        parent,
        chest: k === s.cells.length - 1,
      });
      parent = rooms.length - 1;
      ids.push(parent);
    });
    sideRooms.push(ids);
  }

  for (const r of rooms)
    carve(tiles, w, r.rect.x, r.rect.y, r.rect.x + r.rect.w - 1, r.rect.y + r.rect.h - 1);
  for (let i = 0; i + 1 < mainPath.length; i++) {
    const a = rooms[mainPath[i]];
    const b = rooms[mainPath[i + 1]];
    corridor(rng, tiles, w, { x: a.cx, y: a.cy }, { x: b.cx, y: b.cy });
  }
  for (const r of rooms) {
    if (r.kind === 'side' && r.parent !== undefined) {
      const p = rooms[r.parent];
      corridor(rng, tiles, w, { x: p.cx, y: p.cy }, { x: r.cx, y: r.cy });
    }
  }
  // Keep a solid border.
  for (let x = 0; x < w; x++) {
    tiles[x] = WALL;
    tiles[(h - 1) * w + x] = WALL;
  }
  for (let y = 0; y < h; y++) {
    tiles[y * w] = WALL;
    tiles[y * w + w - 1] = WALL;
  }

  // Exit: the end-room tile farthest from the previous room.
  const end = rooms[mainPath[mainPath.length - 1]];
  const prev = rooms[mainPath[mainPath.length - 2]];
  let exit = { x: end.cx, y: end.cy };
  let best = -1;
  for (let y = end.rect.y + 1; y < end.rect.y + end.rect.h - 1; y++) {
    for (let x = end.rect.x + 1; x < end.rect.x + end.rect.w - 1; x++) {
      const d = (x - prev.cx) ** 2 + (y - prev.cy) ** 2;
      if (d > best) {
        best = d;
        exit = { x, y };
      }
    }
  }

  // Waypoints: main path in order with out-and-back detours into side branches.
  const waypoints: Waypoint[] = [];
  const startRoom = rooms[mainPath[0]];
  for (let i = 0; i < mainPath.length; i++) {
    const r = rooms[mainPath[i]];
    waypoints.push({ x: r.cx + 0.5, y: r.cy + 0.5, room: r.id });
    sides.forEach((s, si) => {
      if (s.from !== i) return;
      const ids = sideRooms[si];
      for (const id of ids)
        waypoints.push({ x: rooms[id].cx + 0.5, y: rooms[id].cy + 0.5, room: id });
      for (let k = ids.length - 2; k >= 0; k--)
        waypoints.push({ x: rooms[ids[k]].cx + 0.5, y: rooms[ids[k]].cy + 0.5, room: ids[k] });
      waypoints.push({ x: r.cx + 0.5, y: r.cy + 0.5, room: r.id });
    });
  }

  return {
    w,
    h,
    tiles,
    rooms,
    mainPath,
    waypoints,
    start: { x: startRoom.cx + 0.5, y: startRoom.cy + 0.5 },
    exit: { x: exit.x + 0.5, y: exit.y + 0.5 },
  };
}

export function isFloor(lab: Pick<Labyrinth, 'w' | 'h' | 'tiles'>, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= lab.w || y >= lab.h) return false;
  return lab.tiles[y * lab.w + x] === FLOOR;
}

export function roomAt(lab: Labyrinth, x: number, y: number): Room | undefined {
  for (const r of lab.rooms)
    if (x >= r.rect.x && x < r.rect.x + r.rect.w && y >= r.rect.y && y < r.rect.y + r.rect.h)
      return r;
  return undefined;
}
