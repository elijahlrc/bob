/**
 * Map types (docs/MAPS.md section 9): a type changes what a map is, whatever its theme and affixes.
 * An offered map has at most one. Types never appear on a mini-boss or boss map (every tenth).
 */
export type MapTypeId = 'plain' | 'crescendo' | 'quarry' | 'throng';

export type MapTypeDef = {
  id: MapTypeId;
  name: string;
  /** One sentence for the offer card. */
  text: string;
  /** First map on which it is offered. */
  from: number;
  /** What the type adds to the map's rewards, as fractions. */
  reward: { quantity?: number; rarity?: number; experience?: number };
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
    pressure: 1.3,
  },
  {
    id: 'quarry',
    name: 'Quarry',
    text: 'A short hunt: three champions and few others. Each champion drops a rare (sometimes a unique) and a stack of currency.',
    from: 10,
    reward: {},
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
