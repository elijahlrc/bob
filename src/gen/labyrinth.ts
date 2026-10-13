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

/** How a layout differs from the plain chain of rectangular rooms (docs/MAP-VARIETY.md 3.2). */
export type LayoutStyle = {
  /** Rooms are rectangles, or rounded blobs smoothed into caves. */
  shape: 'rect' | 'blob';
  /** Corridors bend once or twice, or wander. */
  wander: boolean;
  /** Corridor width, from and to. */
  width: [number, number];
  /** The largest side of a room (at most 12, a cell less two). */
  maxSide: number;
  /** Every room fills its whole cell and the end room is no bigger than the others. */
  fill: boolean;
  /** Extra corridors between rooms in neighbouring cells that the path does not join, at most this many. */
  loops: number;
  /** The share of open room tiles that stand as a pillar of wall instead (open ground only). */
  pillars: number;
};

export const CHAIN_STYLE: LayoutStyle = {
  shape: 'rect',
  wander: false,
  width: [2, 3],
  maxSide: 12,
  fill: false,
  loops: 0,
  pillars: 0,
};

export type LabyrinthOpts = {
  rooms: number;
  sideBranches: number;
  /** The smallest side of an ordinary room (the end room is always at least 10). */
  minSide?: number;
  /** The style of the layout: the plain chain when absent. */
  style?: LayoutStyle;
};

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
  style: LayoutStyle = CHAIN_STYLE,
): void {
  const width = rng.int(style.width[0], style.width[1]);
  if (style.wander) {
    wanderCorridor(rng, tiles, w, a, b, width);
    return;
  }
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

/** A corridor that wanders: it leans toward the target and strays to either side on the way. */
function wanderCorridor(
  rng: Rng,
  tiles: Uint8Array,
  w: number,
  a: { x: number; y: number },
  b: { x: number; y: number },
  width: number,
): void {
  const h = tiles.length / w;
  let x = a.x;
  let y = a.y;
  for (let guard = 0; guard < 4000 && (x !== b.x || y !== b.y); guard++) {
    carve(tiles, w, x, y, Math.min(w - 2, x + width - 1), Math.min(h - 2, y + width - 1));
    const dx = Math.sign(b.x - x);
    const dy = Math.sign(b.y - y);
    const r = rng.next();
    if (r < 0.4 && dx !== 0) x += dx;
    else if (r < 0.8 && dy !== 0) y += dy;
    else if (rng.chance(0.5)) x += rng.chance(0.5) ? 1 : -1;
    else y += rng.chance(0.5) ? 1 : -1;
    x = Math.max(1, Math.min(w - 1 - width, x));
    y = Math.max(1, Math.min(h - 1 - width, y));
  }
  carve(tiles, w, b.x, b.y, Math.min(w - 2, b.x + width - 1), Math.min(h - 2, b.y + width - 1));
}

/** Carve a rounded blob into a room's rectangle: the radius varies around it, so no two caves have the same outline. */
function carveBlob(rng: Rng, tiles: Uint8Array, w: number, r: Rect): void {
  const K = 8;
  const radii = Array.from({ length: K }, () => 0.7 + rng.next() * 0.38);
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  for (let y = r.y; y < r.y + r.h; y++)
    for (let x = r.x; x < r.x + r.w; x++) {
      const dx = (x + 0.5 - cx) / (r.w / 2);
      const dy = (y + 0.5 - cy) / (r.h / 2);
      const t = (Math.atan2(dy, dx) / (Math.PI * 2) + 0.5) * K;
      const i = Math.floor(t) % K;
      const f = t - Math.floor(t);
      const rad = radii[i] * (1 - f) + radii[(i + 1) % K] * f;
      if (Math.hypot(dx, dy) <= rad) tiles[y * w + x] = FLOOR;
    }
}

/** One pass of cellular smoothing: fill a nook with most of its neighbours open, and drop a spur with almost none. */
function smooth(tiles: Uint8Array, w: number, h: number): void {
  const open = (x: number, y: number) => (tiles[y * w + x] === FLOOR ? 1 : 0);
  const out = tiles.slice();
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      let n = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) if (dx || dy) n += open(x + dx, y + dy);
      if (tiles[y * w + x] === FLOOR) {
        if (n <= 2) out[y * w + x] = WALL;
      } else if (n >= 5) out[y * w + x] = FLOOR;
    }
  tiles.set(out);
}

/** Whether every one of the points can be walked to from the first by 4-neighbour steps over floor. */
function connected(
  tiles: Uint8Array,
  w: number,
  h: number,
  pts: { x: number; y: number }[],
): boolean {
  const seen = new Uint8Array(w * h);
  const first = pts[0];
  if (tiles[first.y * w + first.x] !== FLOOR) return false;
  const stack = [first.y * w + first.x];
  seen[stack[0]] = 1;
  while (stack.length) {
    const k = stack.pop()!;
    const x = k % w;
    const y = (k - x) / w;
    for (const [dx, dy] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const nk = ny * w + nx;
      if (!seen[nk] && tiles[nk] === FLOOR) {
        seen[nk] = 1;
        stack.push(nk);
      }
    }
  }
  return pts.every((q) => seen[q.y * w + q.x]);
}

function placeRoom(
  rng: Rng,
  c: Cell,
  minSide: number,
  ox: number,
  oy: number,
  style: LayoutStyle = CHAIN_STYLE,
): Rect {
  if (style.fill)
    return { x: ox + c.cx * CELL + 1, y: oy + c.cy * CELL + 1, w: CELL - 2, h: CELL - 2 };
  const lo = Math.min(minSide, style.maxSide);
  const w = rng.int(lo, style.maxSide);
  const h = rng.int(lo, style.maxSide);
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
  const style = opts.style ?? CHAIN_STYLE;
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
    const rect = placeRoom(
      rng,
      c,
      kind === 'end' && !style.fill ? 10 : (opts.minSide ?? 6),
      ox,
      oy,
      style,
    );
    const cc = center(rect);
    rooms.push({ id: rooms.length, kind, rect, cx: cc.x, cy: cc.y, pathIndex: i });
    mainPath.push(rooms.length - 1);
  });
  const sideRooms: number[][] = [];
  for (const s of sides) {
    const ids: number[] = [];
    let parent = mainPath[s.from];
    s.cells.forEach((c, k) => {
      const rect = placeRoom(rng, c, opts.minSide ?? 6, ox, oy, style);
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

  for (const r of rooms) {
    if (style.shape === 'blob') {
      carveBlob(rng, tiles, w, r.rect);
      carve(tiles, w, r.cx - 1, r.cy - 1, r.cx + 1, r.cy + 1);
    } else carve(tiles, w, r.rect.x, r.rect.y, r.rect.x + r.rect.w - 1, r.rect.y + r.rect.h - 1);
  }
  for (let i = 0; i + 1 < mainPath.length; i++) {
    const a = rooms[mainPath[i]];
    const b = rooms[mainPath[i + 1]];
    corridor(rng, tiles, w, { x: a.cx, y: a.cy }, { x: b.cx, y: b.cy }, style);
  }
  for (const r of rooms) {
    if (r.kind === 'side' && r.parent !== undefined) {
      const p = rooms[r.parent];
      corridor(rng, tiles, w, { x: p.cx, y: p.cy }, { x: r.cx, y: r.cy }, style);
    }
  }
  // Loops: rooms in neighbouring cells that the path does not join get a corridor between them.
  if (style.loops > 0) {
    const cellOf = (r: Room) => ({
      cx: Math.floor((r.rect.x - ox) / CELL),
      cy: Math.floor((r.rect.y - oy) / CELL),
    });
    const joined = (a: Room, b: Room) =>
      Math.abs(a.pathIndex - b.pathIndex) <= 1 && a.kind !== 'side' && b.kind !== 'side'
        ? true
        : a.parent === b.id || b.parent === a.id;
    const pairs: [Room, Room][] = [];
    for (const a of rooms)
      for (const b of rooms) {
        if (a.id >= b.id || joined(a, b)) continue;
        const ca = cellOf(a);
        const cb = cellOf(b);
        if (Math.abs(ca.cx - cb.cx) + Math.abs(ca.cy - cb.cy) === 1) pairs.push([a, b]);
      }
    rng.shuffle(pairs);
    for (const [a, b] of pairs.slice(0, style.loops))
      corridor(rng, tiles, w, { x: a.cx, y: a.cy }, { x: b.cx, y: b.cy }, style);
  }
  if (style.shape === 'blob') {
    smooth(tiles, w, h);
    smooth(tiles, w, h);
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

  // Pillars: single tiles of wall standing in open ground, never on a room's middle or beside a wall.
  if (style.pillars > 0) {
    for (const r of rooms)
      for (let y = r.rect.y + 2; y < r.rect.y + r.rect.h - 2; y++)
        for (let x = r.rect.x + 2; x < r.rect.x + r.rect.w - 2; x++) {
          if (Math.abs(x - r.cx) < 3 && Math.abs(y - r.cy) < 3) continue;
          if (!rng.chance(style.pillars)) continue;
          let open = true;
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++)
              if (tiles[(y + dy) * w + x + dx] !== FLOOR) open = false;
          if (open) tiles[y * w + x] = WALL;
        }
  }

  // Exit: the end-room floor tile farthest from the previous room.
  const end = rooms[mainPath[mainPath.length - 1]];
  const prev = rooms[mainPath[mainPath.length - 2]];
  let exit = { x: end.cx, y: end.cy };
  let best = -1;
  for (let y = end.rect.y + 1; y < end.rect.y + end.rect.h - 1; y++) {
    for (let x = end.rect.x + 1; x < end.rect.x + end.rect.w - 1; x++) {
      if (tiles[y * w + x] !== FLOOR) continue;
      const d = (x - prev.cx) ** 2 + (y - prev.cy) ** 2;
      if (d > best) {
        best = d;
        exit = { x, y };
      }
    }
  }

  // Every room and the exit must be reachable from the start (a cave's smoothing can pinch a passage shut).
  if (
    !connected(tiles, w, h, [
      { x: rooms[mainPath[0]].cx, y: rooms[mainPath[0]].cy },
      ...rooms.map((r) => ({ x: r.cx, y: r.cy })),
      { x: exit.x, y: exit.y },
    ])
  )
    return null;

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
