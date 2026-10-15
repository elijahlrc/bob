/**
 * Stops (docs/WAYSIDE.md section 5): a non-combat offer that takes a map's place in a set. Taking one spends the level (the
 * counter advances) and gives a service a map cannot. Every name and text is ours.
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
    text: 'A free socket in one item.',
    how: 'Choose an item. More sockets cost Bone Dust.',
    weight: 30,
    from: 6,
  },
  {
    id: 'gemHoard',
    name: 'The Gem Hoard',
    text: 'Choose a kind, take 3 of 8 gems.',
    how: 'Choose a kind of gem, then take three.',
    weight: 30,
    from: 6,
  },
  {
    id: 'shrine',
    name: 'The Shrine',
    text: 'A blessing until your next stop.',
    how: 'Choose a blessing.',
    weight: 25,
    from: 6,
  },
  {
    id: 'quartermaster',
    name: 'The Quartermaster',
    text: 'Eight wares for Bone Dust.',
    how: 'Buy what you want with Bone Dust.',
    weight: 25,
    from: 6,
  },
  {
    id: 'ferryman',
    name: 'The Ferryman',
    text: 'A reprieve, at a price.',
    how: 'Choose a reprieve.',
    weight: 20,
    from: 8,
  },
];

export const stopDef = (id: StopId): StopDef => STOPS.find((s) => s.id === id)!;

/** Stops are scheduled in windows of this many levels, starting at `STOP_FROM`: `STOPS_PER_WINDOW` (offers.ts) stops to a window. */
export const STOP_WINDOW = 5;
export const STOP_FROM = 6;

/** What the Awlsmith charges, in Bone Dust, for the nth socket of an item beyond the free one (the first three sockets of an item cost nothing). */
export function awlsmithPrice(nth: number): number {
  return nth <= 3 ? 0 : nth === 4 ? 40 : nth === 5 ? 120 : 300;
}

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
