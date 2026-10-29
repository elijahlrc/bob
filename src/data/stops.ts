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
  /** A line of colour over the stop's own screen, if it has one. */
  flavour?: string;
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
    // Its sockets are a Respite craft since 2026-10-29 (docs/ATTRITION.md): no longer scheduled; a save that holds one still works.
    weight: 0,
    from: 6,
  },
  {
    id: 'gemHoard',
    name: 'The Gem Hoard',
    text: 'Choose a kind, take 4 of 10 gems.',
    how: 'Choose a kind of gem, then take four.',
    weight: 30,
    from: 6,
  },
  {
    id: 'shrine',
    name: 'The Shrine',
    text: 'A blessing for five levels.',
    how: 'Choose a blessing.',
    flavour: 'Someone still prays down here. Not for you, but it will do.',
    weight: 25,
    from: 6,
  },
  {
    id: 'quartermaster',
    name: 'The Quartermaster',
    text: 'Wares and a flask refill, for Bone Dust.',
    how: 'Buy what you want with Bone Dust. A restock lays out new wares.',
    weight: 25,
    from: 6,
  },
  {
    id: 'ferryman',
    name: 'The Ferryman',
    text: 'A reprieve and full flasks, at a price.',
    how: 'Choose a reprieve.',
    flavour: "He doesn't ask where you're going. Only what you'll give.",
    weight: 20,
    from: 8,
  },
];

export const stopDef = (id: StopId): StopDef => STOPS.find((s) => s.id === id)!;

/** The first level a stop can be on (the schedule is `stopSchedule`, run/offers.ts). */
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
export const HOARD_LAID = 10;
export const HOARD_TAKE = 4;
/** How many kinds the Hoard asks the player to choose between. */
export const HOARD_KINDS = 4;
