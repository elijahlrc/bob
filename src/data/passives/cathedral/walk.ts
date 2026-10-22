/**
 * The north walk over the Undercroft (G3): created empty between G3 rounds so the region's agent can move that band's clusters
 * here without touching index.ts. The agent fills it, may rename the place and moves the label; if unused it is removed
 * before the bake.
 */
import type { AreaSpec } from '../types';

export const lychway: AreaSpec = {
  id: 'cathedral.walk',
  region: 'zealot',
  name: 'The Lychway',
  why: 'A place name for the north walk over the Undercroft (G3).',
  at: [-2700, -3650],
  clusters: [],
  links: [],
};
