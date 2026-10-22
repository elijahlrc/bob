/**
 * The Eaves: the Mystic's north-east rim road (phase G2 of docs/tree/design/G-growth.md, laid 2026-10-22 from
 * docs/tree/design/G1/mystic.md §3 and the joined brief G1-brief.md §2.1). Five intelligence nodes from the road node
 * between Shatter and Harsh Weather, up under the rim and down to the Shade's Rooftops: the top of the Spire gets an
 * outer road with clusters coming off it all along (G3: the far spell cluster and the crit wand; today Snare Line, now a
 * bridge) and a dear crossing to the Rooftops at its foot (written by the border pass). The north-west rim road is the
 * Lantern's (`fire.ts`); the two are joined across the top by the road through Shatter.
 * The export keeps the name `parapet` that index.ts imports.
 */
import { dex, int } from '../lines';
import type { AreaSpec } from '../types';

export const parapet: AreaSpec = {
  id: 'spire.rim',
  region: 'mystic',
  name: 'The Eaves',
  why: "The Spire's north-east rim, under the eaves of the Rooftops next door: an outer road for the casters' far clusters and the Shade's way in from the roofs.",
  at: [1720, -4430], // Where the area's name is drawn: outside the road, in the empty corner under the rim, clear of every node.
  clusters: [
    {
      id: 'road',
      name: 'The eaves road',
      why: "Intelligence five times, in three straight runs that turn at junctions: up from Harsh Weather's road node to the rim, along it, and down to the Rooftops. No stretch goes more than two nodes without something off it: the far spell cluster between r1 and r2 (G3), Snare Line at r3, the crit wand at r4 (G3), the Rooftops at r5 (the border pass).",
      at: [1233, -4454],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'r1',
          kind: 'attribute',
          lines: [int(7)],
          at: [519, -4234],
          why: "On the straight run from Harsh Weather's road node to r2. The far spell cluster (G1/mystic.md MY-3) hangs here and at r2, outward, as a pocket bridging the two.",
        },
        {
          id: 'r2',
          kind: 'attribute',
          lines: [int(7)],
          at: [850, -4470],
          why: 'The corner where the road meets the rim and turns east; the far end of the MY-3 pocket.',
        },
        {
          id: 'r3',
          kind: 'attribute',
          lines: [int(7)],
          at: [1233, -4454],
          why: "The north-east corner, on the line of Snare Line's chain so the chain runs straight onto it.",
        },
        {
          id: 'r4',
          kind: 'attribute',
          lines: [int(7)],
          at: [1592, -4177],
          why: 'Halfway down the run to the Rooftops. The crit wand (G1/mystic.md MY-6) hangs here, bridged to Overcharge.',
        },
        {
          id: 'r5',
          kind: 'attribute',
          lines: [dex(6), int(6)],
          at: [2080, -3900],
          why: "The last node before the Shade, so half dexterity, and the corner where the eaves road drops onto the Rooftops' ridge road beside Black Powder. Nudged east in the border pass (G2, 2026-10-22) so the run from r4 stays straight (8°) and the ridge node takes it as a clean T (75° and 120° from its two road links); on the straight line from r4 it would have met the ridge 31° from Black Powder's link. The turn is here, at the corner between two roads.",
        },
      ],
      links: [
        ['r1', 'r2'],
        ['r2', 'r3'],
        ['r3', 'r4'],
        ['r4', 'r5'],
      ],
    },
  ],
  links: [
    {
      from: 'spire.frost.toHarsh.a',
      to: 'road.r1',
      why: "The road node between Shatter and Harsh Weather onto the eaves road: the top of the Spire's two rim roads meet across it, through Shatter.",
    },
    {
      from: 'spire.frost.snare.n',
      to: 'road.r3',
      why: "Snare Line onto the eaves road: a dead-end pocket until G2, now a bridge from Harsh Weather's climb to the rim (G1/mystic.md §4).",
    },
    {
      from: 'road.r5',
      to: 'knife.roofs.ridge.y1',
      why: "The Rooftops road (a dear crossing; G1-brief.md §2.1, laid in the G2 border pass): the eaves road comes down onto the Shade's ridge road one step from Black Powder. Traps and mines (Snare Line, Black Powder), cold (Shatter, Sleet) and the crit wand for an intelligence-and-dexterity Shade; the Mystic's trapper and the far casters reach the Rooftops. Far from both starts (about 20 to 25 steps), so it is a late build's road, not a shortcut.",
    },
  ],
};
