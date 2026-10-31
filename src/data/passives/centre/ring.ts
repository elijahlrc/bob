/**
 * The centre's roads (docs/tree/design/R-centre.md; first written by scripts/passives/rework/centre-gen.ts, which is
 * retired: edit by hand since 2026-10-31): six inner roads,
 * one along each border from the pair's seam to a junction at radius 950, an inner ring (a hexagon) joining the
 * junctions with one long link per side (its side nodes were thinned in the finalization of 2026-10-31), and three
 * spokes from every other junction to the middle. Attribute nodes carry the attributes of the classes either side. The
 * generic notables are in `clusters.ts`.
 */
import { allAttr, dex, int, str } from '../lines';
import type { AreaSpec } from '../types';

export const ring: AreaSpec = {
  id: 'centre.ring',
  region: 'centre',
  name: 'The crossroads',
  why:
    'Generic ground between all six starts, about as far from each: a pair of neighbours walks in from its seam to its ' +
    'junction, and every class reaches the middle through the junction on one of its borders.',
  at: [0, -620],
  clusters: [
    {
      id: 'road',
      name: 'The inner roads',
      why: 'One cluster so that the centre is one place; its nodes are the centre\'s only roads. The hexagon\'s sides are single links (finalization, 2026-10-31): each side node sat on the straight chord between two junctions, bought nothing a build walks there for, and the rooms now do the work of a way round.',
      at: [0, 0],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'i0', kind: 'attribute', lines: [int(6), dex(6)], at: [548,-1123], why: "The inner road along the border of the Mystic and the Shade, between their seam and the junction." },
        { id: 'j0', kind: 'attribute', lines: [int(6), dex(6)], at: [475,-823], why: "The junction of the Mystic and the Shade: their generic notable hangs here." },
        { id: 'i1', kind: 'attribute', lines: [dex(6), int(6)], at: [1245,109], why: "The inner road along the border of the Shade and the Strider, between their seam and the junction." },
        { id: 'j1', kind: 'attribute', lines: [dex(6), int(6)], at: [950,0], why: "The junction of the Shade and the Strider: their generic notable hangs here." },
        { id: 'i2', kind: 'attribute', lines: [dex(6), str(6)], at: [567,1114], why: "The inner road along the border of the Strider and the Reaver, between their seam and the junction." },
        { id: 'j2', kind: 'attribute', lines: [dex(6), str(6)], at: [475,823], why: "The junction of the Strider and the Reaver: their generic notable hangs here." },
        { id: 'i3', kind: 'attribute', lines: [str(6), dex(6)], at: [-625,1083], why: "The inner road along the border of the Reaver and the Vanguard, between their seam and the junction." },
        { id: 'j3', kind: 'attribute', lines: [str(6), dex(6)], at: [-475,823], why: "The junction of the Reaver and the Vanguard: their generic notable hangs here." },
        { id: 'i4', kind: 'attribute', lines: [str(6), int(6)], at: [-1250,0], why: "The inner road along the border of the Vanguard and the Zealot, between their seam and the junction." },
        { id: 'j4', kind: 'attribute', lines: [str(6), int(6)], at: [-950,0], why: "The junction of the Vanguard and the Zealot: their generic notable hangs here." },
        { id: 'i5', kind: 'attribute', lines: [int(6), str(6)], at: [-735,-1011], why: "The inner road along the border of the Zealot and the Mystic, between their seam and the junction." },
        { id: 'j5', kind: 'attribute', lines: [int(6), str(6)], at: [-475,-823], why: "The junction of the Zealot and the Mystic: their generic notable hangs here." },
        { id: 's1', kind: 'attribute', lines: [allAttr(4)], at: [475,0], why: "An inner spoke to the middle, from every other junction: every start reaches the middle through the junction on one of its borders." },
        { id: 's3', kind: 'attribute', lines: [allAttr(4)], at: [-237,411], why: "An inner spoke to the middle, from every other junction: every start reaches the middle through the junction on one of its borders." },
        { id: 's5', kind: 'attribute', lines: [allAttr(4)], at: [-238,-411], why: "An inner spoke to the middle, from every other junction: every start reaches the middle through the junction on one of its borders." },
        { id: 'm', kind: 'attribute', lines: [allAttr(5)], at: [0, 0], why: "The middle: the two notables every class shares hang from it." },
      ],
      links: [['i0', 'j0'], ['j0', 'j1'], ['i1', 'j1'], ['j1', 'j2'], ['i2', 'j2'], ['j2', 'j3'], ['i3', 'j3'], ['j3', 'j4'], ['i4', 'j4'], ['j4', 'j5'], ['i5', 'j5'], ['j5', 'j0'], ['j1', 's1'], ['s1', 'm'], ['j3', 's3'], ['s3', 'm'], ['j5', 's5'], ['s5', 'm']],
    },
  ],
  links: [
    // The seams and the region doors link here from their own regions (a link is written once): knife.home.seams.n,
    // knife.home.seams.s, bow.home.seams.s, yard.home.seams.s, yard.home.fieldDressing.c, wall.home.seams.s,
    // wall.home.secondWind.c, cathedral.home.star.d, spire.home.seams.w.
  ],
};
