/**
 * The layouts of the biomes (docs/MAP-VARIETY.md 3.2): each is the chain of rooms of `generateLabyrinth` with another style
 * (the shape of a room, how corridors run, how open the ground is), and a few changes to how many rooms there are.
 */
import type { LayoutKind } from '../data/biomes';
import { CHAIN_STYLE, type LayoutStyle } from './labyrinth';

export type Layout = {
  style: LayoutStyle;
  /** Multiplies the rooms of an ordinary map (a field has few big rooms, a warren many small ones). */
  rooms: number;
  /** Side branches added to the drawn ones (the first maps have none). */
  extraBranches: number;
  /** The smallest room side, when the layout sets its own. */
  minSide?: number;
};

export const LAYOUTS: Record<LayoutKind, Layout> = {
  chain: { style: CHAIN_STYLE, rooms: 1, extraBranches: 0 },
  // Caves: rounded rooms and wandering passages, smoothed so no wall is straight.
  cave: {
    style: {
      shape: 'blob',
      wander: true,
      width: [3, 4],
      maxSide: 12,
      fill: false,
      loops: 1,
      pillars: 0,
    },
    rooms: 1,
    extraBranches: 0,
  },
  // A field: few, very wide rooms joined by wide ways, with pillars standing in the open.
  field: {
    style: {
      shape: 'rect',
      wander: false,
      width: [5, 6],
      maxSide: 12,
      fill: true,
      loops: 2,
      pillars: 0.05,
    },
    rooms: 0.7,
    extraBranches: 0,
  },
  // Ruins: the chain with one or two extra ways between halls, so there is more than one way round.
  loops: {
    style: { ...CHAIN_STYLE, loops: 2 },
    rooms: 1,
    extraBranches: 0,
  },
  // A warren: many small cells joined by narrow passages, and loops that make it a tangle.
  warren: {
    style: {
      shape: 'rect',
      wander: false,
      width: [2, 2],
      maxSide: 8,
      fill: false,
      loops: 2,
      pillars: 0,
    },
    rooms: 1.5,
    extraBranches: 1,
    minSide: 5,
  },
};
