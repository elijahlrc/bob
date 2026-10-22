/**
 * The Lychway (the north walk over the Undercroft): the rim road of six attribute nodes from Kindled Steel round the back
 * of the Undercroft to Tomb Dust and on to the Mystic's north-west rim road, the casters' far loop, with what hangs off it.
 * Laid in G2 (2026-10-22) as a cluster of the Undercroft; its own place since G3 round 2 (2026-10-22), when the road and
 * Rood Screen moved here from `crypt.ts` (their ids changed from `cathedral.crypt.north.*` and `cathedral.crypt.rood.*`).
 * In G3 round 3 spell damage with duration (ZE-9) hangs off the fourth node and channelling (ZE-3) bridges Shattering Rite
 * to the east end.
 */
import { es, int, spellBlock, str } from '../lines';
import type { AreaSpec } from '../types';
import { P } from './frame';

export const lychway: AreaSpec = {
  id: 'cathedral.walk',
  region: 'zealot',
  name: 'The Lychway',
  why: "The north walk over the Undercroft: the casters' far loop between the Zealot's north rim and the Mystic's, and the clusters off it (Rood Screen; in round 3 spell damage with duration and channelling).",
  at: [-2700, -3650], // Where the area's name is drawn: over the walk's middle, clear of Rood Screen, Sigil Warden and every other area's name.
  clusters: [
    {
      id: 'road',
      name: 'The north walk',
      why: "G2 (2026-10-22, G1/zealot.md §3 and G1-brief.md §2.2): a rim road of six attribute nodes from Kindled Steel round the back of the Undercroft to Tomb Dust, the casters' far loop. Kindled Steel's chain runs straight out to the corner; then the walk follows the rim, outside Sigil Warden and Volatile Servants, to its east end, where Tomb Dust arrives and the far loop to the Mystic's north-west rim road leaves (the border pass). Kindled Steel and Tomb Dust become bridges. Rood Screen (G3 round 1) hangs inward off the third node; in round 3 ZE-9 hangs off the fourth and ZE-3 bridges Shattering Rite to the east end.",
      at: P(3057, 1916),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'n1',
          kind: 'attribute',
          lines: [str(6), int(6)],
          at: P(3510, 728),
          why: "The corner where Kindled Steel's line meets the rim.",
        },
        {
          id: 'n2',
          kind: 'attribute',
          lines: [str(6), int(6)],
          at: P(3396, 1140),
          why: 'Outside the Sigil Warden keystone.',
        },
        {
          id: 'n3',
          kind: 'attribute',
          lines: [str(6), int(6)],
          at: P(3244, 1537),
          why: 'Where Rood Screen (energy shield with spell block) hangs inward.',
        },
        {
          id: 'n4',
          kind: 'attribute',
          lines: [str(6), int(6)],
          at: P(3057, 1916),
          why: 'Where, in G3 round 3, spell damage with duration (ZE-9) hangs inward.',
        },
        {
          id: 'n5',
          kind: 'attribute',
          lines: [str(6), int(6)],
          at: P(2836, 2274),
          why: 'Outside the Volatile Servants keystone, toward the east end.',
        },
        {
          id: 'n6',
          kind: 'attribute',
          lines: [str(6), int(6)],
          at: P(2584, 2607),
          why: "The east end: Tomb Dust arrives, ZE-3 bridges in from Shattering Rite (G3 round 3), and the far loop runs on in the same line to the Mystic's north-west rim road.",
        },
      ],
      links: [
        ['n1', 'n2'],
        ['n2', 'n3'],
        ['n3', 'n4'],
        ['n4', 'n5'],
        ['n5', 'n6'],
      ],
    },
    {
      id: 'rood',
      name: 'Rood Screen',
      why: "G3 round 1 (2026-10-22; ledger ZE-11): a pocket inward off the north walk's third node, square to the walk: energy shield three times, then the notable with energy shield and spell block. The block caster's shield without a shield (Glass Wall needs one), and the energy shield a Zealot or Mystic caster finds far out on the casters' loop, in a different direction from the Cloister's. A dead-end tip on purpose (§13.5): the walk it hangs from has three ways in.",
      at: P(2978, 1419),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [es(5)],
          at: P(3143, 1492),
          why: 'The entrance from the walk.',
        },
        { id: 'b', kind: 'small', lines: [es(5)], at: P(3093, 1469) },
        { id: 'c', kind: 'small', lines: [es(5)], at: P(3042, 1448) },
        {
          id: 'n',
          kind: 'notable',
          name: 'Rood Screen',
          lines: [es(10), spellBlock(4)],
          at: P(2978, 1419),
          why: 'Energy shield and spell block: 2 + 2 units.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'c'],
        ['c', 'n'],
      ],
    },
  ],
  links: [
    {
      from: 'cathedral.ambulatory.kindled.n',
      to: 'road.n1',
      why: "Kindled Steel's chain carried straight on to the rim: the fire-strike pocket becomes a bridge onto the north walk.",
    },
    {
      from: 'cathedral.crypt.tomb.n',
      to: 'road.n6',
      why: "Tomb Dust's chain carried on to the north walk's east end: the chaos pocket becomes a bridge, and the walk's second way in.",
    },
    { from: 'road.n3', to: 'rood.a', why: "The north walk's third node onto Rood Screen." },
    {
      from: 'road.n6',
      to: 'spire.fire.rim.c',
      why: "The far loop (a dear crossing; G1-brief.md §2.2, laid in the G2 border pass): the north walk runs on in its own line (a turn of about 10°) to the corner of the Mystic's north-west rim road, so the two rim roads read as one road over the top of the map. The casters' far loop: Tomb Dust, Shattering Rite and the Zealot's far casters with Cinder, Steady Stream and the Mystic's far shield. 19 steps from the Zealot start and 23 from the Mystic's, so it is a late build's road.",
    },
  ],
};
