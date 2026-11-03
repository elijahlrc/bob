// @ts-nocheck -- a one-off tool of the attrition rework (docs/tree/design/R-state.md), run with npx tsx; absolute paths.
// Skeleton draft 2 (docs/tree/design/R-skeleton.md): every region's spokes and areas placed by hand, in polar terms
// relative to the region's angle (side -1 is the lower-angle neighbour). Writes a sketch.json for sketch.ts.
import fs from 'fs';
const HIGHWAY = 340; // tree units between road nodes on the long runs (spokes and rings; the owner, 2026-10-30: fewer)
const R_START = 1450;
const R_MID = 2900;
const R_RIM = 4300;
const R_SEAM = 1600; // the border seams sit just outside the line of the starts
type Area = [label: string, r: number, off: number];
type Region = { c: string; th: number; spoke: [number, number]; areas: Area[]; keys: Area[] };
// spoke: the angle offsets of the side -1 and side +1 spokes (chosen per region).
const regions: Region[] = [
  {
    c: 'knife',
    th: -30,
    spoke: [-13, 12],
    areas: [
      ['Knife home', 2050, 0],
      ['Stair', 2400, -22],
      ['Rookery', 2950, -19],
      ['Rooftops: spells', 3750, -20],
      ['Alleys', 2350, 21],
      ['Docks', 3100, 6],
      ['Rooftops: blades', 3800, 2],
      ['Seawall', 4350, 17],
    ],
    keys: [
      ['K Nimble Gambit', 2550, 25],
      ['K Shade Leech', 3200, -26],
      ['K Cruel Agony', 3350, -12],
      ['K Spellslip', 2650, -27],
    ],
  },
  {
    c: 'spire',
    th: -90,
    spoke: [-12, 12],
    areas: [
      ['Spire home', 2050, 0],
      ['Cloister', 2400, -21],
      ['Lantern', 3900, -18],
      ['Scriptorium', 2400, 21],
      ['Gallery', 3600, 15],
      ['Eaves', 4350, 21],
      ['Column', 2950, 0],
      ['Belfry', 4000, 0],
    ],
    keys: [
      ['K Mind Bulwark', 3000, -24],
      ['K Mana Bastion', 3000, 24],
      ['K Pain Conduit', 3700, 25],
      ['K Prismatic Balance', 4500, -6],
      ['K Fever Pitch', 4600, 6],
    ],
  },
  {
    c: 'bow',
    th: 30,
    spoke: [-12, 13],
    areas: [
      ['Bow home', 2050, 0],
      ['Hedgerows', 2350, -21],
      ['Far Pasture', 3800, -13],
      ['Ford', 2350, 21],
      ['Water Meadows', 3700, 21],
      ['Meadow', 2550, 3],
      ['High Moor', 2950, -5],
      ['Thicket', 3200, 10],
    ],
    keys: [
      ['K Steady Draw', 2600, -26],
      ['K Arrow Weave', 2700, 7],
      ['K Close Quarters', 3300, -2],
      ['K Plated Hide', 2700, 26],
    ],
  },
  {
    c: 'yard',
    th: 90,
    spoke: [-12, 12],
    areas: [
      ['Yard home', 2050, 0],
      ['Lists', 2350, -21],
      ['Pits: blood', 3050, -9],
      ['Practice Ground', 2350, 21],
      ['Muster', 2950, 22],
      ['Pits: great', 3200, 7],
      ['Fosse', 4000, 0],
    ],
    keys: [
      ['K Wound Dance', 3300, -15],
      ['K Crimson Pact', 3450, -3],
      ['K Shieldwall', 3200, 27],
    ],
  },
  {
    c: 'wall',
    th: 150,
    spoke: [-12, 12],
    areas: [
      ['Wall home', 2050, 0],
      ['Quarry', 2350, -21],
      ['Barrows', 3600, -13],
      ['Barrows: rim', 4250, -22],
      ['Rampart', 2350, 21],
      ['Barbican', 3300, 15],
      ['Battlements', 1700, 25],
    ],
    keys: [
      ['K Strongarm', 2650, -27],
      ['K Unerring Discipline', 2650, 27],
      ['K Rooted Stance', 4100, 20],
      ['K Blood Rite', 4500, -10],
    ],
  },
  {
    c: 'cathedral',
    th: -150,
    spoke: [-12, 12],
    areas: [
      ['Cathedral home', 2050, 0],
      ['Nave', 2350, -21],
      ['Vestry', 2950, -23],
      ['Bell Tower', 3500, -7],
      ['Ambulatory', 3750, -17],
      ['Churchyard', 4350, -15],
      ['Choir', 2350, 21],
      ['Undercroft', 3200, 16],
      ['Lychway', 4350, 22],
    ],
    keys: [
      ['K Lone Vow', 2700, 27],
      ['K Idle Hands', 3100, -28],
      ['K Searing Avatar', 3700, -2],
      ['K Volatile Servants', 3500, 26],
      ['K Sigil Warden', 4000, 10],
    ],
  },
];
const startOf: Record<string, string> = {
  knife: 'shade',
  spire: 'mystic',
  bow: 'strider',
  yard: 'reaver',
  wall: 'vanguard',
  cathedral: 'zealot',
};
const pol = (r: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [Math.round(r * Math.cos(a)), Math.round(r * Math.sin(a))];
};
const sk: any = {
  title: 'Skeleton draft 2 (R-skeleton.md)',
  clusters: [],
  roads: [],
  links: [],
  moves: [],
};
let roadNodes = 0;
const road = (label: string, pts: [number, number][], spacing = HIGHWAY) => {
  let n = 0;
  for (let i = 1; i < pts.length; i++)
    n += Math.max(
      1,
      Math.round(Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]) / spacing),
    );
  roadNodes += n;
  sk.roads.push({ label, points: pts, nodes: n });
};
const ringPts: Record<string, [number, number][]> = { mid: [], rim: [] };
const ringAngles: number[] = [];
for (const g of regions) {
  const S = pol(R_START, g.th);
  sk.moves.push({ id: `start.${startOf[g.c]}`, to: S });
  sk.clusters.push({ id: `${g.c}-start`, label: '', at: S, nodes: 0 });
  for (const [k, side] of [
    [0, -1],
    [1, 1],
  ] as const) {
    // Out of the start: one corner node, then the hub where the exit branches; nothing else between.
    const exit = pol(R_START + 60, g.th + side * 6);
    const hub = pol(R_START + 220, g.th + side * 10);
    sk.roads.push({ label: '', points: [exit, hub], nodes: 2, ends: true });
    sk.roads.push({ label: '', points: [S, exit], nodes: 0 });
    roadNodes += 2;
    // Spoke out through the mid ring to the rim.
    const so = g.spoke[k];
    road('', [hub, pol(R_MID, g.th + so), pol(R_RIM, g.th + so)]);
    ringAngles.push(g.th + so);
    // The road toward the neighbour: out into the ground just beyond the start, then back in to the border seam (the
    // reference's roads between starts bow outward rather than hugging an inner arc). Large jumps between its nodes.
    road('', [hub, pol(1780, g.th + side * 19), pol(R_SEAM, g.th + side * 30)], 215);
  }
  // The cross-link through the home hub.
  road(
    '',
    [pol(2050, g.th + g.spoke[0] * 0.9), pol(2050, g.th), pol(2050, g.th + g.spoke[1] * 0.9)],
    140,
  );
  ringAngles.push(g.th + 30);
  for (const [label, r, off] of g.areas)
    sk.clusters.push({ id: `${g.c}-${label}`, label, at: pol(r, g.th + off), nodes: 0 });
  for (const [label, r, off] of g.keys)
    sk.clusters.push({ id: `${g.c}-${label}`, label, at: pol(r, g.th + off), nodes: 0 });
  // The border seam: a cluster where the inner roads of two neighbours meet, and the seam road out to the rim.
  sk.clusters.push({ id: `${g.c}-seam`, label: 'seam', at: pol(R_SEAM, g.th + 30), nodes: 0 });
  road('', [pol(R_SEAM, g.th + 30), pol(700, g.th + 30), [0, 0]], 420);
  // The same radial goes on past the seam, along the border, to the mid ring (the owner's idea, 2026-10-30): it covers
  // the ground between two regions beyond the starts.
  road('', [pol(R_SEAM, g.th + 30), pol(R_MID, g.th + 30)], 330);
}
// The rings through every spoke and border, in angle order.
const angles = [...new Set(ringAngles.map((a) => ((a + 540) % 360) - 180))].sort((a, b) => a - b);
for (const [key, r] of [
  ['mid', R_MID],
  ['rim', R_RIM],
] as const) {
  const pts = angles.map((a) => pol(r, a));
  pts.push(pts[0]);
  road(`${key} ring`, pts);
}
sk.clusters.push({
  id: 'centre',
  label: 'centre: the eight generic notables',
  at: [0, 0],
  nodes: 0,
});
fs.writeFileSync(process.argv[2], JSON.stringify(sk, null, 1));
console.log(`road nodes about ${roadNodes}`);
