/**
 * The Seawall (phase G2 of docs/tree/design/G-growth.md, 2026-10-22): the Knife's east rim road, from the Rooftops'
 * fifth node straight out to the rim and then down the east edge toward the Strider's outer road. The Knife's inside
 * holds room for about eight of its fifteen new clusters (G1/shade.md §5); the rest hang off this road, which stays
 * inside the map's circle. Sleet and Whetted Will (the Rooftops' two east pockets) become bridges onto it.
 */
import { dex, int } from '../lines';
import type { AreaSpec } from '../types';

export const seawall: AreaSpec = {
  id: 'knife.rim',
  region: 'shade',
  name: 'The Seawall',
  why: "The Knife's east rim road: the far east of the region, where the Rooftops end and the Strider's outer road begins. One road from the Rooftops to the Fosse, for the late Shade and for the bow builds coming north.",
  at: [3950, -1850], // Where the area's name is drawn: over the road's first legs, clear of Sleet, Whetted Will and the Rooftops' name.
  clusters: [
    {
      id: 'wall',
      name: 'The seawall road',
      why: "Six attribute nodes: one leg straight out from the rooftop road, then a gentle arc down the east rim. Every node has something off it (G1/shade.md §3.1): the spell crit cluster at the first two, Sleet at the third, Whetted Will and the poison cluster at the fourth, the poison cluster at the fifth, the life-and-dodge cluster and the Strider's outer road at the sixth.",
      at: [4100, -1100],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 's1',
          kind: 'attribute',
          lines: [dex(6), int(6)],
          at: [3760, -2148],
          why: 'The corner: straight out from the rooftop road, then south along the rim. The spell crit cluster (SH-3) hangs here and at the next node.',
        },
        { id: 's2', kind: 'attribute', lines: [dex(6), int(6)], at: [3990, -1830] },
        {
          id: 's3',
          kind: 'attribute',
          lines: [dex(6), int(6)],
          at: [4150, -1500],
          why: 'Sleet arrives from the rooftop road.',
        },
        {
          id: 's4',
          kind: 'attribute',
          lines: [dex(6), int(6)],
          at: [4250, -1050],
          why: 'Whetted Will arrives from the rooftop road; the poison cluster (SH-7) hangs between here and the next node.',
        },
        { id: 's5', kind: 'attribute', lines: [dex(6), int(6)], at: [4250, -600] },
        {
          id: 's6',
          kind: 'attribute',
          lines: [dex(6), int(6)],
          at: [4100, -150],
          why: "The south end: the life-and-dodge cluster (SH-10) hangs here, and the Strider's outer road begins one link on (its first junction, the border pass's link).",
        },
      ],
      links: [
        ['s1', 's2'],
        ['s2', 's3'],
        ['s3', 's4'],
        ['s4', 's5'],
        ['s5', 's6'],
      ],
    },
  ],
  links: [
    {
      from: 'knife.roofs.walk.r5',
      to: 'wall.s1',
      why: "The rooftop road's fifth node, which had nothing off it, onto the seawall road: straight out to the rim.",
    },
    {
      from: 'knife.roofs.sleet.n',
      to: 'wall.s3',
      why: 'Sleet becomes a bridge between the rooftop road and the seawall road (G1/shade.md §3.1).',
    },
    {
      from: 'knife.roofs.whet.n',
      to: 'wall.s4',
      why: 'Whetted Will becomes a bridge between the rooftop road and the seawall road (G1/shade.md §3.1).',
    },
    {
      from: 'wall.s6',
      to: 'bow.rim.road.j1',
      why: "The east rim highway (a dear crossing; G1-brief.md §2.6, laid in the G2 border pass): the seawall road runs on into the Strider's outer road, one rim road from the Rooftops to the Fosse. Bows reach Quiet Shot and the Shade's far east; the Shade reaches the Strider's outer road. Both ends turn here (27° and 40°), and both become junctions in G3, where the life-and-dodge cluster (SH-10) and the life-and-resistances cluster (ST-9) hang.",
    },
  ],
};
