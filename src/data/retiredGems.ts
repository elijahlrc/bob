import type { SupportGemDef } from './gems';

/**
 * Gems removed from the game (DESIGN.md Appendix A, 2026-10-28): they never drop and a loaded save loses them
 * (`dropRetiredGems`), but they stay known so that a rival's posted build that holds one still fights with it. Kept as they
 * were when removed; never edit them, and never add one back to a drop list.
 */
export const RETIRED_GEMS: SupportGemDef[] = [
  {
    kind: 'support',
    id: 'exaltedFocus',
    name: 'Exalted Focus',
    attr: 'str',
    supports: [],
    costMult: 1.25,
    levelBonus: {
      table: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    mods: [],
    description: 'Raises the level of the supported skill.',
  },
  {
    kind: 'support',
    id: 'refineGem',
    name: 'Refine Gem',
    attr: 'dex',
    supports: [],
    costMult: 1.15,
    mods: [
      {
        stat: 'damage',
        kind: 'inc',
        value: {
          table: [0, 3.3, 6.7, 10, 13.3, 16.7, 20],
        },
      },
    ],
    description: 'Raises the quality of the supported gem.',
  },
];

/** The character level each of their gem levels required, as when they were removed (`GEM_OWN_LADDERS` then). */
const STEEP = [
  1, 10, 45, 60, 75, 90, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
  100, 100, 100, 100,
];
export const RETIRED_LADDERS: Readonly<Record<string, readonly number[]>> = {
  exaltedFocus: STEEP,
  refineGem: STEEP,
};
