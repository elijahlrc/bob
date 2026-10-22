/**
 * The zealot region's outer road (phase G2 of docs/tree/design/G-growth.md): created empty so the region's G2 agent can
 * lay the rim road here without touching index.ts. The agent fills it, renames the place and moves the label; if the
 * region does not need it, it is removed before the bake.
 */
import type { AreaSpec } from '../types';

export const outerWalk: AreaSpec = {
  id: 'cathedral.rim',
  region: 'zealot',
  name: 'The Outer Walk',
  why: 'The outer road of the growth (G1-brief.md).',
  at: [-3450, -2500],
  clusters: [],
  links: [],
};
