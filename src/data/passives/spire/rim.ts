/**
 * The mystic region's outer road (phase G2 of docs/tree/design/G-growth.md): created empty so the region's G2 agent can
 * lay the rim road here without touching index.ts. The agent fills it, renames the place and moves the label; if the
 * region does not need it, it is removed before the bake.
 */
import type { AreaSpec } from '../types';

export const parapet: AreaSpec = {
  id: 'spire.rim',
  region: 'mystic',
  name: 'The Parapet',
  why: 'The outer road of the growth (G1-brief.md).',
  at: [0, -4550],
  clusters: [],
  links: [],
};
