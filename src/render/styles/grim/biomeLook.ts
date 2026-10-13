/**
 * How each biome looks (docs/MAP-VARIETY.md 3.4): its ground and walls, the light, and the props and marks scattered
 * over its rooms. The theme's own colours stay on as a tint, so a Rotting theme still reads rotten in a cavern.
 */
import type { BiomeId } from '../../../data/biomes';
import type { FloorKind, WallKind } from './isoPaint';

/** A prop that stands on the ground (sorted with the actors), or a mark lying on it. */
export type PropSpec = {
  /** Texture key (without the `g_`). */
  tex: string;
  weight: number;
  /** Lies flat on the floor (a puddle, a crack) instead of standing. */
  flat?: boolean;
  /** Burns or glows: a light at the prop. */
  light?: { color: number; radius: number; intensity: number };
  /** Added on top of the light, to make the glow read (additive blend with this tint). */
  glow?: number;
};

export type BiomeLook = {
  /** The biome's own ground and wall colours. */
  floor: number;
  wall: number;
  /** How much of the theme's colours is mixed in, 0 to 1. */
  themeTint: number;
  floorKind: FloorKind;
  wallKind: WallKind;
  /** Ambient light colour. */
  ambient: number;
  /** Chance that each of a room's two north-wall torches is lit. */
  torches: number;
  /** Chance of a brazier in a main room (always in the end room). */
  brazier: number;
  /** Props per room, standing and flat together: from, to. */
  perRoom: [number, number];
  props: PropSpec[];
};

const FUNGUS = { color: 0x40e0d0, radius: 120, intensity: 0.9 };
const CANDLE = { color: 0xffd890, radius: 110, intensity: 1.0 };
const LAVA = { color: 0xff7a30, radius: 100, intensity: 0.9 };

export const BIOME_LOOKS: Record<BiomeId, BiomeLook> = {
  crypt: {
    floor: 0x3a3430,
    wall: 0x1c1816,
    themeTint: 1,
    floorKind: 'flag',
    wallKind: 'brick',
    ambient: 0x625c7a,
    torches: 1,
    brazier: 0.5,
    perRoom: [3, 4],
    props: [
      { tex: 'bonepile', weight: 4, flat: true },
      { tex: 'blood0', weight: 2, flat: true },
      { tex: 'blood1', weight: 2, flat: true },
      { tex: 'blood2', weight: 1, flat: true },
      { tex: 'cobweb', weight: 2, flat: true },
      { tex: 'rubble', weight: 1 },
    ],
  },
  cavern: {
    floor: 0x2c2a2e,
    wall: 0x1c1a1c,
    themeTint: 0.4,
    floorKind: 'rock',
    wallKind: 'rough',
    ambient: 0x4a5878,
    torches: 0,
    brazier: 0.1,
    perRoom: [4, 6],
    props: [
      { tex: 'stalag', weight: 4 },
      { tex: 'fungus', weight: 3, light: FUNGUS, glow: 0x40e0d0 },
      { tex: 'rubble', weight: 2 },
      { tex: 'bonepile', weight: 1, flat: true },
      { tex: 'puddle', weight: 1, flat: true },
    ],
  },
  ruins: {
    floor: 0x3a3830,
    wall: 0x24211c,
    themeTint: 0.5,
    floorKind: 'cobble',
    wallKind: 'ashlar',
    ambient: 0x6c667c,
    torches: 0.5,
    brazier: 0.3,
    perRoom: [4, 6],
    props: [
      { tex: 'rubble', weight: 5 },
      { tex: 'boulder', weight: 2 },
      { tex: 'moss', weight: 3, flat: true },
      { tex: 'cobweb', weight: 1, flat: true },
      { tex: 'bonepile', weight: 1, flat: true },
    ],
  },
  marsh: {
    floor: 0x2c3a2c,
    wall: 0x1a2418,
    themeTint: 0.4,
    floorKind: 'earth',
    wallKind: 'rough',
    ambient: 0x58786c,
    torches: 0,
    brazier: 0,
    perRoom: [5, 7],
    props: [
      { tex: 'puddle', weight: 5, flat: true },
      { tex: 'reeds', weight: 4 },
      { tex: 'moss', weight: 3, flat: true },
      { tex: 'fungus', weight: 1, light: FUNGUS, glow: 0x80f0a0 },
      { tex: 'boulder', weight: 1 },
    ],
  },
  forge: {
    floor: 0x2e2a2a,
    wall: 0x1c1818,
    themeTint: 0.4,
    floorKind: 'plate',
    wallKind: 'ashlar',
    ambient: 0x7a5a58,
    torches: 0.5,
    brazier: 1,
    perRoom: [3, 5],
    props: [
      { tex: 'lavacrack', weight: 4, flat: true, light: LAVA, glow: 0xff7a30 },
      { tex: 'vent', weight: 3, flat: true },
      { tex: 'ash', weight: 3, flat: true },
      { tex: 'rubble', weight: 2 },
    ],
  },
  hollow: {
    floor: 0x3a3426,
    wall: 0x201c14,
    themeTint: 0.4,
    floorKind: 'earth',
    wallKind: 'rough',
    ambient: 0x6a6c86,
    torches: 0,
    brazier: 0.2,
    perRoom: [5, 8],
    props: [
      { tex: 'boulder', weight: 4 },
      { tex: 'rubble', weight: 3 },
      { tex: 'roots', weight: 3, flat: true },
      { tex: 'ash', weight: 2, flat: true },
      { tex: 'bonepile', weight: 1, flat: true },
    ],
  },
  shrine: {
    floor: 0x403e46,
    wall: 0x2a2830,
    themeTint: 0.4,
    floorKind: 'slab',
    wallKind: 'ashlar',
    ambient: 0x7a7090,
    torches: 1,
    brazier: 0.6,
    perRoom: [2, 4],
    props: [
      { tex: 'candles', weight: 5, light: CANDLE, glow: 0xffd890 },
      { tex: 'rubble', weight: 1 },
      { tex: 'cobweb', weight: 1, flat: true },
      { tex: 'bonepile', weight: 1, flat: true },
    ],
  },
  warren: {
    floor: 0x34281e,
    wall: 0x1e160e,
    themeTint: 0.4,
    floorKind: 'earth',
    wallKind: 'rough',
    ambient: 0x5a5068,
    torches: 0,
    brazier: 0.1,
    perRoom: [3, 5],
    props: [
      { tex: 'roots', weight: 5, flat: true },
      { tex: 'bonepile', weight: 4, flat: true },
      { tex: 'rubble', weight: 2 },
      { tex: 'fungus', weight: 1, light: FUNGUS, glow: 0xc0a050 },
      { tex: 'blood0', weight: 1, flat: true },
    ],
  },
};

/** Mix two 0xRRGGBB colours: `t` of `b`, the rest of `a`. */
export function mixColor(a: number, b: number, t: number): number {
  const ch = (s: number) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t) & 255;
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

/** The ground and wall colours of a map: the biome's, with the theme's mixed in. */
export function biomeColors(
  look: BiomeLook,
  theme: { floor: number; wall: number },
): { floor: number; wall: number } {
  return {
    floor: mixColor(look.floor, theme.floor, look.themeTint),
    wall: mixColor(look.wall, theme.wall, look.themeTint),
  };
}
