/**
 * The centre ring (C-brief §2): a ring road of attribute nodes inside the six starts, the cheap crossing between
 * neighbouring homes. Twenty-four nodes at radius 750, one at each class's angle (that class's attribute) and three
 * between neighbours (the first neighbour's, a mix, the second neighbour's). Each home's attribute junction links to the
 * ring node at its class's angle (`centre.ring.road.r<k>`, k = (angle + 90) / 15). The generic clusters inside the ring are in
 * `clusters.ts`.
 */
import { dex, int, str } from '../lines';
import type { AreaSpec, Line, NodeSpec } from '../types';

export const RING_R = 750;

/** Class order round the ring, clockwise from the top, with its attributes. */
export const RING_CLASSES: { classId: string; angle: number; attrs: ('str' | 'dex' | 'int')[] }[] =
  [
    { classId: 'mystic', angle: -90, attrs: ['int'] },
    { classId: 'shade', angle: -30, attrs: ['dex', 'int'] },
    { classId: 'strider', angle: 30, attrs: ['dex'] },
    { classId: 'reaver', angle: 90, attrs: ['str', 'dex'] },
    { classId: 'vanguard', angle: 150, attrs: ['str'] },
    { classId: 'zealot', angle: 210, attrs: ['str', 'int'] },
  ];

const LINE = { str, dex, int };
const own = (attrs: ('str' | 'dex' | 'int')[]): Line[] =>
  attrs.length === 1 ? [LINE[attrs[0]](7)] : attrs.map((a) => LINE[a](6));

const nodes: NodeSpec[] = [];
for (let k = 0; k < 24; k++) {
  const a = -90 + 15 * k;
  const at: [number, number] = [
    Math.round(RING_R * Math.cos((a * Math.PI) / 180)),
    Math.round(RING_R * Math.sin((a * Math.PI) / 180)),
  ];
  const i = Math.floor(k / 4);
  const from = RING_CLASSES[i],
    to = RING_CLASSES[(i + 1) % 6];
  const step = k % 4;
  let lines: Line[];
  if (step === 0) lines = own(from.attrs);
  else if (step === 1) lines = own(from.attrs);
  else if (step === 3) lines = own(to.attrs);
  else {
    // The middle node: +6 of each attribute either neighbour has, two at most (the first of each).
    const both = [...new Set([from.attrs[0], to.attrs[0]])];
    lines = both.length === 1 ? [LINE[both[0]](7)] : both.map((x) => LINE[x](6));
  }
  nodes.push({ id: `r${k}`, kind: 'attribute', lines, at });
}

export const ring: AreaSpec = {
  id: 'centre.ring',
  region: 'centre',
  name: 'The ring',
  why:
    'The cheap crossing between neighbouring homes: a road of attribute nodes, ' +
    "nothing else, so that walking to a neighbour pays in the attribute the neighbour's gear will ask for. Four steps from one " +
    "class's junction to the next, as in the reference (its centre crossing is about as long).",
  at: [-440, 240], // Where the area's name is drawn: clear of every other area's name (label pass, round 4).
  clusters: [
    {
      id: 'road',
      name: 'The ring road',
      why: 'One cluster so that the ring is one place; its nodes are the only attribute road the centre has.',
      at: [0, 0],
      shape: { kind: 'hand' },
      nodes,
      links: nodes.map((_, k) => [`r${k}`, `r${(k + 1) % 24}`] as [string, string]),
    },
  ],
  links: [],
};
