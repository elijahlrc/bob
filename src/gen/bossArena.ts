import { FLOOR, WALL, type Labyrinth, type Room } from './labyrinth';

/** The radius of a boss's arena, in tiles: room for the Courser to gallop (docs/BOSSES.md 12). */
export const BOSS_ARENA_RADIUS = 11;

/**
 * A boss map (docs/BOSSES.md 12): the labyrinth as usual, then a round arena past its last room, joined by a corridor that
 * crosses no other room. The arena is the new end room; the old end room becomes a room of the path.
 */
export function attachArena(lab: Labyrinth, radius = BOSS_ARENA_RADIUS): Labyrinth {
  const end = lab.rooms[lab.mainPath[lab.mainPath.length - 1]];
  // The side whose way out from the end room crosses no floor; the right when none is clear.
  const sides = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];
  const clear = (dx: number, dy: number) => {
    const r = end.rect;
    let x = dx > 0 ? r.x + r.w : dx < 0 ? r.x - 1 : end.cx;
    let y = dy > 0 ? r.y + r.h : dy < 0 ? r.y - 1 : end.cy;
    while (x >= 0 && y >= 0 && x < lab.w && y < lab.h) {
      for (let k = -2; k <= 2; k++) {
        const tx = dx === 0 ? x + k : x;
        const ty = dy === 0 ? y + k : y;
        if (tx >= 0 && ty >= 0 && tx < lab.w && ty < lab.h && lab.tiles[ty * lab.w + tx] === FLOOR)
          return false;
      }
      x += dx;
      y += dy;
    }
    return true;
  };
  const side = sides.find((s) => clear(s.dx, s.dy)) ?? sides[0];
  const gap = 4;
  const size = radius * 2 + 3;
  // Grow the map on that side.
  const addW = side.dx !== 0 ? size + gap : 0;
  const addH = side.dy !== 0 ? size + gap : 0;
  const w = Math.max(lab.w + addW, side.dy !== 0 ? Math.max(lab.w, size + 2) : 0);
  const h = Math.max(lab.h + addH, side.dx !== 0 ? Math.max(lab.h, size + 2) : 0);
  const ox = side.dx < 0 ? addW : 0;
  const oy = side.dy < 0 ? addH : 0;
  const tiles = new Uint8Array(w * h).fill(WALL);
  for (let y = 0; y < lab.h; y++)
    for (let x = 0; x < lab.w; x++) tiles[(y + oy) * w + x + ox] = lab.tiles[y * lab.w + x];
  const shiftRoom = (r: Room): Room => ({
    ...r,
    rect: { ...r.rect, x: r.rect.x + ox, y: r.rect.y + oy },
    cx: r.cx + ox,
    cy: r.cy + oy,
  });
  const rooms = lab.rooms.map(shiftRoom);
  const e = rooms[end.id];
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  // The arena's middle: past the old map on that side, level with the end room where it can be.
  const cx =
    side.dx > 0
      ? lab.w + gap + radius + 1
      : side.dx < 0
        ? radius + 1
        : clamp(e.cx, radius + 1, w - radius - 2);
  const cy =
    side.dy > 0
      ? lab.h + gap + radius + 1
      : side.dy < 0
        ? radius + 1
        : clamp(e.cy, radius + 1, h - radius - 2);
  for (let y = cy - radius; y <= cy + radius; y++)
    for (let x = cx - radius; x <= cx + radius; x++)
      if (
        (x - cx) ** 2 + (y - cy) ** 2 <= radius * radius + radius &&
        x > 0 &&
        y > 0 &&
        x < w - 1 &&
        y < h - 1
      )
        tiles[y * w + x] = FLOOR;
  // The corridor: straight out of the end room along the way that was found clear, into the arena (its middle is level
  // with the end room, or near enough that the corridor still meets the circle).
  const carve = (x0: number, y0: number, x1: number, y1: number) => {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
      for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
        if (x > 0 && y > 0 && x < w - 1 && y < h - 1) tiles[y * w + x] = FLOOR;
  };
  if (side.dx !== 0) carve(e.cx, e.cy - 1, cx, e.cy + 1);
  else carve(e.cx - 1, e.cy, e.cx + 1, cy);
  const arena: Room = {
    id: rooms.length,
    kind: 'end',
    rect: { x: cx - radius, y: cy - radius, w: radius * 2 + 1, h: radius * 2 + 1 },
    cx,
    cy,
    pathIndex: lab.mainPath.length,
  };
  rooms[end.id] = { ...e, kind: 'main' };
  rooms.push(arena);
  // The exit is the arena's far side from where the corridor comes in.
  const exit = { x: cx + side.dx * (radius - 2) + 0.5, y: cy + side.dy * (radius - 2) + 0.5 };
  return {
    w,
    h,
    tiles,
    rooms,
    mainPath: [...lab.mainPath, arena.id],
    waypoints: [
      ...lab.waypoints.map((p) => ({ ...p, x: p.x + ox, y: p.y + oy })),
      { x: cx + 0.5, y: cy + 0.5, room: arena.id },
    ],
    start: { x: lab.start.x + ox, y: lab.start.y + oy },
    exit,
  };
}
