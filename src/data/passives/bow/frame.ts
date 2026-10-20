/**
 * The Bow's coordinate frame: positions are written as (out, side) from the Strider's start, `out` along the class's
 * radial (30 degrees), `side` across it, positive toward the Reaver (south) and negative toward the Shade (north).
 * Writing the region this way keeps every "north of the road" and "farther out" decision readable in the file.
 *
 * The geometry follows the reference's tree as seen (its live tree, Ranger start, 2026-10-19): clusters are compact
 * orbits whose nodes sit a third of the distance between clusters apart; roads are long straight runs that turn at a
 * junction node; the big clusters are closed rings with the notables on the rim; a pocket's entrance faces the junction it
 * hangs off. Nothing is copied from it: the clusters, lines and links are this game's.
 */
export const START_AT: [number, number] = [866, 500];
const C = Math.cos(Math.PI / 6),
  S = Math.sin(Math.PI / 6);

/** Tree units from (out, side). */
export const P = (out: number, side: number): [number, number] => [
  Math.round(START_AT[0] + C * out - S * side),
  Math.round(START_AT[1] + S * out + C * side),
];

/** The ring angle (global degrees, as `Shape.ring.a0` wants) that puts a ring's first node on the side facing `target`. */
export const facing = (centre: [number, number], target: [number, number]): number =>
  Math.round((Math.atan2(target[1] - centre[1], target[0] - centre[0]) * 180) / Math.PI);

/** Road spacing between junctions; pocket orbit; big wheel orbit. One scale for the region, so density reads as meaning. */
export const ROAD = 250;
export const POCKET_R = 75;
export const WHEEL_R = 170;
