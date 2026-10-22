/**
 * The band between the Ford and the Fosse (G3): created empty between G3 rounds so the region's agent can move that band's clusters
 * here without touching index.ts. The agent fills it, may rename the place and moves the label; if unused it is removed
 * before the bake.
 */
import type { AreaSpec } from '../types';

export const waterMeadows: AreaSpec = {
  id: 'bow.south',
  region: 'strider',
  name: 'The Water Meadows',
  why: 'A place name for the band between the Ford and the Fosse (G3).',
  at: [2050, 3150],
  clusters: [],
  links: [],
};
