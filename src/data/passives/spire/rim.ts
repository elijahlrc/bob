/**
 * The Parapet: The rim ring.
 * Written for the attrition rework from docs/tree/design/R-spire.md (2026-10-31).
 */
import { int } from '../lines';
import type { AreaSpec } from '../types';

export const parapet: AreaSpec = {
  id: "spire.rim",
  region: "mystic",
  name: "The Parapet",
  why: "The rim ring.",
  at: [0, -4600],
  clusters: [
    {
      id: "ring",
      name: "The rim ring",
      why: "The rim ring across the Spire, from the Cathedral border to the Knife's.",
      at: [-2150, -3724],
      shape: { kind: 'hand' },
      nodes: [
        { id: "w0", kind: "attribute", lines: [int(7)], at: [-2150, -3724] },
        { id: "q1", kind: "attribute", lines: [int(7)], at: [-1756, -3879] },
        { id: "q2", kind: "attribute", lines: [int(7)], at: [-1361, -4035] },
        { id: "w1", kind: "attribute", lines: [int(7)], at: [-967, -4190] },
        { id: "q3", kind: "attribute", lines: [int(7)], at: [-580, -4190] },
        { id: "q4", kind: "attribute", lines: [int(7)], at: [-193, -4190] },
        { id: "q5", kind: "attribute", lines: [int(7)], at: [193, -4190] },
        { id: "q6", kind: "attribute", lines: [int(7)], at: [580, -4190] },
        { id: "e1", kind: "attribute", lines: [int(7)], at: [967, -4190] },
        { id: "q7", kind: "attribute", lines: [int(7)], at: [1361, -4035] },
        { id: "q8", kind: "attribute", lines: [int(7)], at: [1756, -3879] },
      ],
      links: [["w0", "q1"], ["q1", "q2"], ["q2", "w1"], ["w1", "q3"], ["q3", "q4"], ["q4", "q5"], ["q5", "q6"], ["q6", "e1"], ["e1", "q7"], ["q7", "q8"]],
    },
  ],
  links: [
    { from: "spire.rim.ring.q8", to: "knife.rim.ring.n0", why: "The rim ring meets the Knife's." },
  ],
};
