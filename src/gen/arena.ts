import { FLOOR, type Labyrinth } from './labyrinth';

/** The arena of a Holdout: one open room, the beacon at its middle, the entrance beside it and the exit in a far corner. */
export const ARENA_SIZE = 36;

export function generateArena(): Labyrinth {
  const size = ARENA_SIZE;
  const tiles = new Uint8Array(size * size);
  for (let y = 1; y < size - 1; y++) for (let x = 1; x < size - 1; x++) tiles[y * size + x] = FLOOR;
  const c = size / 2;
  const room = {
    id: 0,
    kind: 'end' as const,
    rect: { x: 1, y: 1, w: size - 2, h: size - 2 },
    cx: c,
    cy: c,
    pathIndex: 0,
  };
  const start = { x: c - 3.5, y: c + 0.5 };
  return {
    w: size,
    h: size,
    tiles,
    rooms: [room],
    mainPath: [0],
    // The beacon: the character walks here and holds.
    waypoints: [{ x: c + 0.5, y: c + 0.5, room: 0 }],
    start,
    exit: { x: size - 3.5, y: size - 3.5 },
  };
}
