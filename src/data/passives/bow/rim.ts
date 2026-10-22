/**
 * The Far Pasture (phase G2 of docs/tree/design/G-growth.md, 2026-10-22): the Strider's outer road. Today's edge is a
 * wall of pockets at radius 3,000 to 3,400 (Ricochet, Heavy Draw, Split Volley, Barbed Arrows, Skewer, Quick Sip, Pitch
 * Arrows) with the map empty beyond it; the growth puts the region's second band of clusters out there (G1/strider.md
 * §2), and this is the road they hang from. A gentle arc at radius about 3,800 from the Shade's east rim road (at its
 * north end) to the Reaver's Fosse (at its south end), so the east of the map gets one outer ring, and three spokes back
 * into the region, each made by putting a road node into a link between two of today's edge pockets.
 *
 * Laid out so every junction reads: each spoke leaves its pocket link and meets the arc as near a right angle at both
 * ends as one straight line allows (the north spoke within about 4 degrees, the middle 13, the south 10; a spoke at a
 * right angle to its pocket link would meet the arc 20 to 24 degrees off, since the old edge does not face the same way
 * as the arc). Road nodes sit about 250 to 380 units apart on the arc, turning 4 to 6 degrees at each.
 */
import { dex, int, str } from '../lines';
import type { AreaSpec } from '../types';
import { P } from './frame';

export const farPasture: AreaSpec = {
  id: 'bow.rim',
  region: 'strider',
  name: 'The Far Pasture',
  why: "The Strider's outer road and the band of clusters beyond today's edge: where a bow build goes once the inside is spent (at 120 points it picks a direction along this road and leaves the others), and the east of the map's outer ring, from the Shade's Seawall to the Reaver's Fosse.",
  at: [3600, 1300], // Where the area's name is drawn: in the band between the old edge and the road (over the road's middle run), clear of Split Volley, Far Flight (and its name), Barbed Arrows and the High Moor's name.
  clusters: [
    {
      id: 'road',
      name: 'The outer road',
      why: "Sixteen attribute nodes on an arc at radius about 3,800, north to south. The junctions are where the brief's clusters hang (G1/strider.md §2, G1-brief.md §2.5–2.6): j1 the Shade's rim road and ST-9, m12 ST-6, j2 the north spoke and ST-1, j3 the middle spoke and ST-1's crit chain, m34 ST-5, j4 ST-3, j5 the south spoke, m56a ST-2, j6 ST-7, m67 ST-4, j7 ST-10, j8 the Fosse. Dexterity and intelligence on the two nodes nearest the Shade, strength and dexterity on the two nearest the Fosse (CONSTRAINTS §7.4: the hybrid ends serve both neighbours' gear), dexterity between.",
      at: P(2600, 0),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'j1',
          kind: 'attribute',
          lines: [dex(6), int(6)],
          at: P(2366, -1770),
          why: "The road's north end, where the Shade's rim road (the Seawall) arrives and ST-9 bridges in from the Shade's road to Ricochet.",
        },
        {
          id: 'm12',
          kind: 'attribute',
          lines: [dex(6), int(6)],
          at: P(2482, -1527),
          why: 'The traps-or-mines wheel (ST-6) hangs outward here.',
        },
        {
          id: 'j2',
          kind: 'attribute',
          lines: [dex(7)],
          at: P(2580, -1275),
          why: 'The north spoke arrives; the crit bow (ST-1) hangs outward.',
        },
        {
          id: 'm23a',
          kind: 'attribute',
          lines: [dex(7)],
          at: P(2689, -913),
          why: "The long run between the north and middle spokes, past ST-1 outward and the north-east band inward (the brief's room for a second round).",
        },
        {
          id: 'm23b',
          kind: 'attribute',
          lines: [dex(7)],
          at: P(2761, -541),
          why: 'The second node of the run from the north spoke to the middle one, keeping the road evenly spaced; ST-1 lies outward, the reserve band inward.',
        },
        {
          id: 'j3',
          kind: 'attribute',
          lines: [dex(7)],
          at: P(2796, -164),
          why: "The middle spoke arrives; ST-1's crit chain lands here, best leaving on the spoke's line so the junction is a crossing.",
        },
        {
          id: 'm34',
          kind: 'attribute',
          lines: [dex(7)],
          at: P(2799, 88),
          why: 'Fervour with attack speed (ST-5) hangs outward.',
        },
        {
          id: 'j4',
          kind: 'attribute',
          lines: [dex(7)],
          at: P(2785, 339),
          why: 'Evasion with regeneration (ST-3) hangs outward.',
        },
        {
          id: 'j5',
          kind: 'attribute',
          lines: [dex(7)],
          at: P(2754, 588),
          why: 'The south spoke arrives.',
        },
        {
          id: 'm56a',
          kind: 'attribute',
          lines: [dex(7)],
          at: P(2682, 915),
          why: "The elemental bow (ST-2) hangs outward: the brief's spot for it, straight out from here.",
        },
        {
          id: 'm56b',
          kind: 'attribute',
          lines: [dex(7)],
          at: P(2581, 1233),
          why: 'The second node of the run from the south spoke to ST-7, keeping the road evenly spaced.',
        },
        {
          id: 'j6',
          kind: 'attribute',
          lines: [dex(7)],
          at: P(2453, 1540),
          why: 'Evasion with flasks (ST-7) bridges in from Sentry Post.',
        },
        {
          id: 'm67',
          kind: 'attribute',
          lines: [dex(7)],
          at: P(2313, 1824),
          why: 'Lightning attacks with shock (ST-4) hangs outward.',
        },
        {
          id: 'j7',
          kind: 'attribute',
          lines: [dex(7)],
          at: P(2150, 2096),
          why: 'Poison with bow damage (ST-10) bridges in from Pitch Arrows.',
        },
        {
          id: 'm78',
          kind: 'attribute',
          lines: [str(6), dex(6)],
          at: P(1994, 2318),
          why: 'Between ST-10 and the Fosse crossing; strength with dexterity as the Reaver nears.',
        },
        {
          id: 'j8',
          kind: 'attribute',
          lines: [str(6), dex(6)],
          at: P(1822, 2528),
          why: "The road's south end, where the Fosse crossing leaves for Stormstruck.",
        },
      ],
      links: [
        ['j1', 'm12'],
        ['m12', 'j2'],
        ['j2', 'm23a'],
        ['m23a', 'm23b'],
        ['m23b', 'j3'],
        ['j3', 'm34'],
        ['m34', 'j4'],
        ['j4', 'j5'],
        ['j5', 'm56a'],
        ['m56a', 'm56b'],
        ['m56b', 'j6'],
        ['j6', 'm67'],
        ['m67', 'j7'],
        ['j7', 'm78'],
        ['m78', 'j8'],
      ],
    },
    {
      id: 'northSpoke',
      name: 'The north spoke',
      why: 'Ricochet and Heavy Draw stay joined through a road node, and the road runs straight out from it to the outer road: the edge pockets leave from a road (CONSTRAINTS §7.2), and walking from one to the other is no longer free of a choice (G1/strider.md §3).',
      at: P(2045, -1054),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'x',
          kind: 'attribute',
          lines: [dex(7)],
          at: P(1867, -980),
          why: 'Between Ricochet and Heavy Draw, where their link was.',
        },
        {
          id: 's',
          kind: 'attribute',
          lines: [dex(7)],
          at: P(2223, -1128),
          why: 'Halfway out on the north spoke, on its straight line.',
        },
      ],
      links: [['x', 's']],
    },
    {
      id: 'middleSpoke',
      name: 'The middle spoke',
      why: 'Barbed Arrows and Skewer stay joined through a road node, and the road runs straight out from it to the outer road.',
      at: P(2366, -82),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'x',
          kind: 'attribute',
          lines: [dex(7)],
          at: P(2223, 1),
          why: 'Between Barbed Arrows and Skewer, where their link was.',
        },
        {
          id: 's',
          kind: 'attribute',
          lines: [dex(7)],
          at: P(2510, -82),
          why: 'Halfway out on the middle spoke, on its straight line.',
        },
      ],
      links: [['x', 's']],
    },
    {
      id: 'southSpoke',
      name: 'The south spoke',
      why: 'Skewer and Quick Sip stay joined through a road node, and the road runs straight out from it to the outer road.',
      at: P(2438, 474),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'x',
          kind: 'attribute',
          lines: [dex(7)],
          at: P(2333, 435),
          why: 'Between Skewer and Quick Sip, where their link was.',
        },
        {
          id: 's',
          kind: 'attribute',
          lines: [dex(7)],
          at: P(2543, 512),
          why: 'Halfway out on the south spoke, on its straight line.',
        },
      ],
      links: [['x', 's']],
    },
  ],
  links: [
    {
      from: 'northSpoke.x',
      to: 'bow.flight.ricochet.b',
      why: "Ricochet's exit onto the north spoke (it went straight to Heavy Draw before G2).",
    },
    {
      from: 'northSpoke.x',
      to: 'bow.steel.wheel.n2',
      why: 'The north spoke onto Heavy Draw: Ricochet and Heavy Draw stay joined, through the road.',
    },
    { from: 'northSpoke.s', to: 'road.j2', why: 'The north spoke reaches the outer road.' },
    {
      from: 'middleSpoke.x',
      to: 'bow.flight.wheel.n2',
      why: 'Barbed Arrows onto the middle spoke (it went straight to Skewer before G2).',
    },
    {
      from: 'middleSpoke.x',
      to: 'bow.quiver.skewer.a',
      why: 'The middle spoke onto the pierce pocket: Barbed Arrows and Skewer stay joined, through the road.',
    },
    { from: 'middleSpoke.s', to: 'road.j3', why: 'The middle spoke reaches the outer road.' },
    {
      from: 'southSpoke.x',
      to: 'bow.quiver.skewer.n',
      why: "Skewer's exit onto the south spoke (it went straight to Quick Sip before G2).",
    },
    {
      from: 'southSpoke.x',
      to: 'bow.quiver.quickSip.a',
      why: 'The south spoke onto the flask pocket: Skewer and Quick Sip stay joined, through the road.',
    },
    { from: 'southSpoke.s', to: 'road.j5', why: 'The south spoke reaches the outer road.' },
  ],
};
