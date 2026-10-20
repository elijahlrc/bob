/**
 * The Cathedral's coordinate frame: positions are written as (out, side) from the Zealot's start, `out` along the
 * class's radial (210 degrees, up and to the left), `side` across it, positive toward the Mystic (north-east) and
 * negative toward the Vanguard (south-west). The nave, the sceptres and the fire tower run along `out` on the Wall
 * side; the aura-and-minion tower bends off toward the Spire on the positive side.
 */
export const START_AT: [number, number] = [-866, -500];
const C = Math.cos((210 * Math.PI) / 180),
  S = Math.sin((210 * Math.PI) / 180);

/** Tree units from (out, side). */
export const P = (out: number, side: number): [number, number] => [
  Math.round(START_AT[0] + C * out - S * side),
  Math.round(START_AT[1] + S * out + C * side),
];
