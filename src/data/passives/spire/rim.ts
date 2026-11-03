/**
 * The Parapet: The rim ring.
 * Written for the attrition rework from docs/tree/design/R-spire.md (2026-10-31).
 */
import { int } from '../lines';
import type { AreaSpec } from '../types';

export const parapet: AreaSpec = {
  id: 'spire.rim',
  region: 'mystic',
  name: 'The Parapet',
  why: 'The rim ring.',
  at: [0, -4600],
  clusters: [
    {
      id: 'ring',
      name: 'The rim ring',
      why: "The rim ring across the Spire, from the Cathedral border to the Knife's. Thinned in finalization (2026-10-31), eleven nodes to eight: one node between the border and the west spoke, three between the spokes (q4 on the axis), and the east spoke straight to the border node.",
      at: [-2150, -3724],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'w0', kind: 'attribute', lines: [int(7)], at: [-2150, -3724] },
        { id: 'q1', kind: 'attribute', lines: [int(7)], at: [-1558, -3957] },
        { id: 'w1', kind: 'attribute', lines: [int(7)], at: [-967, -4190] },
        { id: 'q3', kind: 'attribute', lines: [int(7)], at: [-484, -4190] },
        { id: 'q4', kind: 'attribute', lines: [int(7)], at: [0, -4190] },
        { id: 'q6', kind: 'attribute', lines: [int(7)], at: [484, -4190] },
        { id: 'e1', kind: 'attribute', lines: [int(7)], at: [967, -4190] },
        { id: 'q8', kind: 'attribute', lines: [int(7)], at: [1756, -3879] },
      ],
      links: [
        ['w0', 'q1'],
        ['q1', 'w1'],
        ['w1', 'q3'],
        ['q3', 'q4'],
        ['q4', 'q6'],
        ['q6', 'e1'],
        ['e1', 'q8'],
      ],
    },
  ],
  links: [
    { from: 'spire.rim.ring.q8', to: 'knife.rim.ring.n0', why: "The rim ring meets the Knife's." },
  ],
};
