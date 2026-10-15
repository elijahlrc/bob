import type { Variant } from './monsters';

/**
 * Monster teleports (docs/ENCOUNTERS.md 3, the Blinking affix). A monster marks the spot where the character stands, and a
 * moment later it is there: the spell it uses is one of the character's own travel gems, in the monster's manner. The mark
 * on the ground is the warning, and what lands with it is the spell's: a burst of its element, ground it leaves, and for a
 * Bolt Step a second burst where the monster stood.
 */
export type StepId = 'quick' | 'cinder' | 'rime' | 'bolt';

export type StepSpec = {
  id: StepId;
  name: string;
  /** The damage type index of its burst (0 physical, 1 lightning, 2 cold, 3 fire). */
  dtype: number;
  /** Seconds the landing is marked before the monster is on it. */
  warn: number;
  /** The burst at the landing: its radius, and its share of the monster's hit. */
  radius: number;
  mult: number;
  /** Ground the landing leaves: how long, and its damage a second as a share of the monster's hit. */
  leaves?: { kind: 'burning' | 'chilling' | 'shocking'; seconds: number; dps: number };
  /** A burst where the monster stood (Bolt Step). */
  departs?: { radius: number; mult: number };
  /** What it does, as the end of a sentence about a monster that "blinks onto the spot where you stand". */
  effect: string;
};

export const STEPS: Record<StepId, StepSpec> = {
  quick: {
    id: 'quick',
    name: 'Quick Step',
    dtype: 0,
    warn: 0.6,
    radius: 1.4,
    mult: 0.6,
    effect: 'and lands with a thump.',
  },
  cinder: {
    id: 'cinder',
    name: 'Cinder Step',
    dtype: 3,
    warn: 0.7,
    radius: 1.6,
    mult: 0.7,
    leaves: { kind: 'burning', seconds: 3, dps: 0.25 },
    effect: 'in a burst of fire that leaves the ground burning.',
  },
  rime: {
    id: 'rime',
    name: 'Rime Step',
    dtype: 2,
    warn: 0.7,
    radius: 1.6,
    mult: 0.6,
    leaves: { kind: 'chilling', seconds: 3, dps: 0.1 },
    effect: 'in a burst of cold that leaves the ground chilling.',
  },
  bolt: {
    id: 'bolt',
    name: 'Bolt Step',
    dtype: 1,
    warn: 0.9,
    radius: 1.5,
    mult: 0.8,
    departs: { radius: 1.5, mult: 0.5 },
    effect: 'with a flash of lightning at both ends.',
  },
};

/** The spell a Blinking monster uses: its element picks it. */
export const STEP_OF_VARIANT: Record<Variant, StepId> = {
  none: 'quick',
  fire: 'cinder',
  cold: 'rime',
  lightning: 'bolt',
};

/** A Blinking monster steps about this often (the first after a random part of it), from at least this far and no further. */
export const STEP_INTERVAL = 8;
export const STEP_FROM = 4.5;
export const STEP_TO = 14;

/** What the cards say about a step from a sidearm (`range` is "from 5 to 12 tiles"). */
export const stepText = (id: StepId, range: string): string =>
  `Marks where you stand and blinks there, ${range} away, ${STEPS[id].effect}`;
