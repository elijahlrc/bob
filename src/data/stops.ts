/**
 * Stops (docs/WAYSIDE.md section 5): a non-combat offer that takes a map's place in a set. Taking one spends the level (the
 * counter advances, no XP, no clear rewards, no reward pick) and gives a service a map cannot. Every name and text is ours.
 */
export type StopId = 'awlsmith' | 'gemHoard' | 'shrine' | 'quartermaster' | 'ferryman';

export type StopDef = {
  id: StopId;
  name: string;
  /** What the card says it gives, in a line. */
  text: string;
  /** What a player does there, in a sentence or two (the stop's own screen). */
  how: string;
  /** Weight among the stops of a window. */
  weight: number;
  /** The first level it can be scheduled on. */
  from: number;
};

/** The stops that are built (a stop is only scheduled if it is listed here). */
export const STOPS: StopDef[] = [
  {
    id: 'awlsmith',
    name: 'The Awlsmith',
    text: 'Bore a new socket into one item, free.',
    how: 'Pick one item, worn or carried. It gets its next socket free. Sockets beyond that cost Socket Augers at the usual rates.',
    weight: 30,
    from: 9,
  },
  {
    id: 'gemHoard',
    name: 'The Gem Hoard',
    text: 'Choose a kind of gem, then take 3 of the 8 laid out.',
    how: 'Name one of four kinds. Eight gems of that kind are laid out; take three.',
    weight: 30,
    from: 9,
  },
  {
    id: 'shrine',
    name: 'The Shrine',
    text: 'A blessing that lasts until the next stop.',
    how: 'Pick one of three blessings. It lasts until you take another stop, and replaces the one you have.',
    weight: 25,
    from: 9,
  },
  {
    id: 'quartermaster',
    name: 'The Quartermaster',
    text: 'Twelve wares for sale, paid in Bone Dust.',
    how: 'Twelve wares, paid in Bone Dust (what salvaging items pays). Choose what you want; whatever you leave is gone when you do.',
    weight: 25,
    from: 9,
  },
  {
    id: 'ferryman',
    name: 'The Ferryman',
    text: 'A free reprieve, for a price.',
    how: 'The Ferryman gives one reprieve for nothing, but you carry a curse for the next five levels. You may refuse.',
    weight: 20,
    from: 17,
  },
];

export const stopDef = (id: StopId): StopDef => STOPS.find((s) => s.id === id)!;

/** Stops are scheduled in windows of this many levels, starting at `STOP_FROM`: one stop to a window. */
export const STOP_WINDOW = 8;
export const STOP_FROM = 9;

/** The kinds of gem the Gem Hoard offers to name (each has at least five active gems), and what each is called. */
export const HOARD_TAGS: { tag: string; name: string }[] = [
  { tag: 'fire', name: 'Fire' },
  { tag: 'cold', name: 'Cold' },
  { tag: 'lightning', name: 'Lightning' },
  { tag: 'chaos', name: 'Chaos' },
  { tag: 'physical', name: 'Physical' },
  { tag: 'projectile', name: 'Projectile' },
  { tag: 'melee', name: 'Melee' },
  { tag: 'bow', name: 'Bow' },
  { tag: 'minion', name: 'Minion' },
  { tag: 'curse', name: 'Curse' },
  { tag: 'movement', name: 'Movement' },
  { tag: 'totem', name: 'Totem' },
];

/** How many gems the Hoard lays out and how many may be taken. */
export const HOARD_LAID = 8;
export const HOARD_TAKE = 3;
/** How many kinds the Hoard asks the player to choose between. */
export const HOARD_KINDS = 4;
