/**
 * Map types (docs/MAPS.md section 9): a type changes what a map is, whatever its theme and affixes.
 * An offered map has at most one. Types never appear on a mini-boss or boss map (every tenth).
 */
export type MapTypeId =
  'plain' | 'crescendo' | 'quarry' | 'throng' | 'holdout' | 'collapse' | 'crawl';

export type MapTypeDef = {
  id: MapTypeId;
  name: string;
  /** One sentence for the offer card. */
  text: string;
  /** First map on which it is offered. */
  from: number;
  /** What the type adds to the map's rewards, as fractions. */
  reward: { quantity?: number; rarity?: number; experience?: number };
  /** The loot the type pays that is not a percentage, in a few words for the comparison on the offer card. */
  loot?: string;
  /** How much harder the map is in ways the monsters' mods do not show (the threat model's multiplier). */
  pressure: number;
};

export const MAP_TYPES: MapTypeDef[] = [
  {
    id: 'plain',
    name: 'Plain',
    text: '',
    from: 1,
    reward: {},
    pressure: 1,
  },
  {
    id: 'crescendo',
    name: 'Crescendo',
    text: 'After 30 s the monsters grow stronger every 15 s (+5% damage and life each time, up to +80%); kills made later drop more. You are pulled out after 330 s.',
    from: 10,
    reward: { quantity: 0.25 },
    loot: 'Later kills drop up to 48% more',
    pressure: 1.3,
  },
  {
    id: 'quarry',
    name: 'Quarry',
    text: 'A short hunt: three champions and few others. Each champion drops a rare (sometimes a unique) and a stack of currency.',
    from: 10,
    reward: {},
    loot: 'Each champion drops a rare (or a unique) and currency',
    pressure: 1.2,
  },
  {
    id: 'throng',
    name: 'Throng',
    text: 'A throng two and a half times the usual crowd, of weaker monsters with less life and damage.',
    from: 12,
    reward: { quantity: 0.4, experience: 0.25 },
    // The hidden affix makes each monster 0.6 times the life and 0.8 times the damage (0.48 together), and the crowd is
    // 2.5 times as big and engaged at once: this multiplier makes the map about 1.4 times a plain one in the threat model.
    pressure: 2.9,
  },
  {
    id: 'holdout',
    name: 'Holdout',
    text: 'A single arena. Hold the beacon while eight waves come, twelve seconds apart; each wave you survive opens a chest, and the last has a rare leading it.',
    from: 25,
    reward: { quantity: 0.2 },
    loot: 'A chest for every wave survived',
    pressure: 1.25,
  },
  {
    id: 'collapse',
    name: 'Collapse',
    text: 'After one minute the way behind you starts to fall in, from the entrance onward, faster than you can ignore. Reach the exit before it reaches you.',
    from: 30,
    reward: { quantity: 0.3, experience: 0.1 },
    pressure: 1.35,
  },
  {
    id: 'crawl',
    name: 'Crawl',
    text: 'Three short maps in a row with no camp between them. At the end you pick one of three rewards, and one of them is a unique.',
    from: 40,
    reward: {},
    loot: 'Choice of three rewards, one a unique',
    pressure: 1.4,
  },
];

export function mapTypeDef(id: MapTypeId): MapTypeDef {
  const t = MAP_TYPES.find((x) => x.id === id);
  if (!t) throw new Error(`unknown map type ${id}`);
  return t;
}

/** The types that can be offered on a map (not on a mini-boss or boss map). */
export function typesFor(map: number): MapTypeDef[] {
  if (map % 10 === 0) return [];
  return MAP_TYPES.filter((t) => t.id !== 'plain' && t.from <= map);
}

/** Crescendo (docs/MAPS.md 9.1). */
export const CRESCENDO_GRACE = 30;
export const CRESCENDO_STEP_SECONDS = 15;
export const CRESCENDO_MAX_STEPS = 16;
/** Each step: monsters deal this much more damage and have this much more life. */
export const CRESCENDO_STEP_BONUS = 0.05;
/** Each kill at step s drops this much more (times s). */
export const CRESCENDO_LOOT_PER_STEP = 0.03;
/** The character is pulled out as an abandon at this time. */
export const CRESCENDO_LIMIT = 330;

/** The Crescendo step at a time in the map: 0 during the grace, then one more every 15 s, up to 16. */
export function crescendoStep(t: number): number {
  return Math.min(
    CRESCENDO_MAX_STEPS,
    Math.max(0, Math.floor((t - CRESCENDO_GRACE) / CRESCENDO_STEP_SECONDS)),
  );
}

/** Throng (docs/MAPS.md 9.2): the id of the hidden affix that gives its monsters their mods and its extra crowd. */
export const THRONG_AFFIX = 'typeThrong';

/** Holdout (docs/MAPS.md 9.2): the first wave comes this soon, then one every interval, eight in all. */
export const HOLDOUT_WAVES = 8;
export const HOLDOUT_FIRST = 4;
export const HOLDOUT_INTERVAL = 12;

/**
 * Collapse: the fall starts at the entrance this many seconds in and moves along the way through the map at this
 * speed (tiles a second). A character caught behind the front is crushed.
 */
export const COLLAPSE_START = 60;
export const COLLAPSE_SPEED = 2.4;

/** Crawl: the segments played back to back. */
export const CRAWL_SEGMENTS = 3;
