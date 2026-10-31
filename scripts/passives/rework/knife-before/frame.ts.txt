/**
 * The Knife's coordinate frame: positions are written as (out, side) from the Shade's start, `out` along the class's
 * radial (−30 degrees, up and to the right), `side` across it, positive toward the Strider (south-east) and negative
 * toward the Mystic (north-west). The blade runs along `out`; the two barbs hook off it to either side.
 */
export const START_AT: [number, number] = [866, -500];
const C = Math.cos(-Math.PI / 6),
  S = Math.sin(-Math.PI / 6);

/** Tree units from (out, side). */
export const P = (out: number, side: number): [number, number] => [
  Math.round(START_AT[0] + C * out - S * side),
  Math.round(START_AT[1] + S * out + C * side),
];
