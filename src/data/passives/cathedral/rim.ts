/**
 * The Churchyard (phase G2 of docs/tree/design/G-growth.md, 2026-10-22; G1/zealot.md §3, "the outer walk"): a road of
 * four attribute nodes round the back of the Bell Tower, outside the Searing Avatar spur, from Censer to Thunder Peal.
 * Both pockets become bridges, and the tower gets a loop round its back. It runs in three straight legs that turn at its
 * two junctions, where G3 hangs energy shield with life (ZE-10) and sceptre with burning (ZE-6) inward; the leg into
 * Thunder Peal is the pocket's own line carried on. The export keeps the name index.ts imports.
 */
import { int, str } from '../lines';
import type { AreaSpec } from '../types';
import { P } from './frame';

export const outerWalk: AreaSpec = {
  id: 'cathedral.rim',
  region: 'zealot',
  name: 'The Churchyard',
  why: "The ground outside the Bell Tower: the outer walk from Censer to Thunder Peal, and (G3) the clusters that hang inward off it, the fire caster's defences and the sceptre's burning beside Searing Avatar.",
  at: [-4960, -1290], // Where the area's name is drawn: outside the walk, clear of the Bell Tower's name and every notable.
  clusters: [
    {
      id: 'walk',
      name: 'The outer walk',
      why: 'Four attribute nodes: out from Censer along the rim, a corner, along the rim past the keystone, a corner, and in to Thunder Peal on its own line.',
      at: P(3300, -1250),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'o1',
          kind: 'attribute',
          lines: [str(6), int(6)],
          at: P(2923, -1292),
          why: 'The first leg, out from Censer.',
        },
        {
          id: 'o2',
          kind: 'attribute',
          lines: [str(6), int(6)],
          at: P(3300, -1250),
          why: 'The outer corner: in G3 energy shield with life (ZE-10) hangs inward from here, between Censer and Searing Avatar.',
        },
        {
          id: 'o3',
          kind: 'attribute',
          lines: [str(6), int(6)],
          at: P(3382, -858),
          why: 'The leg along the rim, outside the Searing Avatar keystone (which keeps its one link).',
        },
        {
          id: 'o4',
          kind: 'attribute',
          lines: [str(6), int(6)],
          at: P(3463, -465),
          why: "The far corner, on Thunder Peal's line: in G3 sceptre with burning (ZE-6) hangs inward from here.",
        },
      ],
      links: [
        ['o1', 'o2'],
        ['o2', 'o3'],
        ['o3', 'o4'],
      ],
    },
  ],
  links: [
    {
      from: 'cathedral.ambulatory.censer.n',
      to: 'walk.o1',
      why: 'Censer onto the outer walk: the burning pocket becomes a bridge.',
    },
    {
      from: 'walk.o4',
      to: 'cathedral.ambulatory.peal.n',
      why: 'The outer walk lands on Thunder Peal, straight through its chain: the lightning pocket becomes a bridge.',
    },
  ],
};
