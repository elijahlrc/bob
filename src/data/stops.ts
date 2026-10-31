import { mod, type Mod } from '../mods/types';

/**
 * Stops (docs/WAYSIDE.md section 5): a non-combat offer that takes a map's place in a set. Taking one spends the level (the
 * counter advances) and gives a service a map cannot. Every name and text is ours.
 */
export type StopId =
  | 'awlsmith'
  | 'gemHoard'
  | 'shrine'
  | 'quartermaster'
  | 'ferryman'
  | 'surgeon'
  | 'knucklebone'
  | 'enviousDead'
  | 'remains';

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
  /** It needs the rivals list (another player's fallen character): shown but closed when that cannot be had. */
  rivals?: boolean;
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
    text: 'A blessing for ten levels.',
    how: 'Choose a blessing for the next ten levels.',
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
    // The id is the old name's (saves keep it); the Bloodletter since 2026-10-29 (the owner).
    name: 'The Bloodletter',
    text: 'A reprieve and full flasks, for 15% less life over five levels.',
    how: 'Choose a reprieve.',
    flavour: "He doesn't ask where you're going. Only what you'll give.",
    weight: 20,
    from: 8,
  },
  // The four of 2026-10-30 (docs/ATTRITION.md, the owner's picks from the brainstorm).
  {
    id: 'surgeon',
    name: 'The Surgeon',
    text: 'Up to three trades of your body, each a little worse than the last.',
    how: 'Choose up to three trades. Each one after the first gives a little less.',
    flavour: "Hold still. Everything on this table was someone's once.",
    weight: 20,
    from: 8,
  },
  {
    id: 'knucklebone',
    name: 'The Knucklebone Man',
    text: 'He throws his bones over one of your items, for Bone Dust.',
    how: 'Choose an item and throw. Each throw costs more than the last.',
    flavour: 'The bones decide. The bones always decide.',
    weight: 20,
    from: 8,
  },
  {
    id: 'enviousDead',
    name: 'The Envious Dead',
    text: "Duel a fallen player's shade for one of its items and a relic. Win or lose, you live.",
    how: 'Win, and take one of its items and a relic. Lose, and only the level is spent.',
    flavour: 'It died not far from here. It wants what you still have.',
    weight: 15,
    from: 10,
    rivals: true,
  },
  {
    id: 'remains',
    name: "Another's Remains",
    text: "Take one item from a fallen player's build.",
    how: 'Choose one of the items they wore.',
    flavour: 'They got this far. Their things went no further.',
    weight: 15,
    from: 8,
    rivals: true,
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

/**
 * The Surgeon's trades (docs/ATTRITION.md): a gain and its price, at full strength. A visit offers `SURGEON_OFFERED` of them
 * and takes up to `SURGEON_MAX` (one may be taken more than once); each after the first gives `SURGEON_FADE` less of its gain,
 * the price staying whole. A visit should leave the character stronger on net by about a combat level (the owner,
 * 2026-10-30), so a gain is worth about three small passives (`UNIT`, data/passives/lines.ts) and a price about one: three
 * trades net about five.
 */
export type SurgeonTrade = { id: string; gain: Mod[]; price: Mod[] };
export const SURGEON_TRADES: SurgeonTrade[] = [
  { id: 'lifeForMana', gain: [mod('mana', 'inc', 25)], price: [mod('life', 'inc', -5)] },
  { id: 'manaForLife', gain: [mod('life', 'inc', 15)], price: [mod('mana', 'inc', -8)] },
  { id: 'strForDex', gain: [mod('dex', 'base', 45)], price: [mod('str', 'base', -15)] },
  { id: 'strForInt', gain: [mod('int', 'base', 45)], price: [mod('str', 'base', -15)] },
  { id: 'dexForStr', gain: [mod('str', 'base', 45)], price: [mod('dex', 'base', -15)] },
  { id: 'dexForInt', gain: [mod('int', 'base', 45)], price: [mod('dex', 'base', -15)] },
  { id: 'intForStr', gain: [mod('str', 'base', 45)], price: [mod('int', 'base', -15)] },
  { id: 'intForDex', gain: [mod('dex', 'base', 45)], price: [mod('int', 'base', -15)] },
  {
    id: 'guardForSpeed',
    gain: [mod('attackSpeed', 'inc', 15), mod('castSpeed', 'inc', 15)],
    price: [mod('armour', 'inc', -10), mod('evasion', 'inc', -10), mod('es', 'inc', -10)],
  },
  {
    id: 'speedForGuard',
    gain: [mod('armour', 'inc', 36), mod('evasion', 'inc', 36), mod('es', 'inc', 36)],
    price: [mod('moveSpeed', 'inc', -4)],
  },
  { id: 'lifeForWard', gain: [mod('resist.allEle', 'base', 12)], price: [mod('life', 'inc', -5)] },
  { id: 'wardForLife', gain: [mod('life', 'inc', 15)], price: [mod('resist.allEle', 'base', -4)] },
  { id: 'lifeForWrath', gain: [mod('damage', 'inc', 25)], price: [mod('life', 'inc', -5)] },
  { id: 'lifeForShield', gain: [mod('es', 'inc', 20)], price: [mod('life', 'inc', -5)] },
];
export const SURGEON_OFFERED = 4;
export const SURGEON_MAX = 3;
export const SURGEON_FADE = 0.15;
export const surgeonTrade = (id: string): SurgeonTrade | undefined =>
  SURGEON_TRADES.find((t) => t.id === id);

/**
 * The Knucklebone Man's price (docs/ATTRITION.md): Bone Dust for a visit's nth throw (0 is the first) before the item's level,
 * which raises it as wares are priced (`priceAt`).
 */
export const knucklePrice = (nth: number): number => Math.round(15 * Math.pow(1.6, nth));
/** How the bones fall, in percent (run/craft.ts `throwBones`); the owner, 2026-10-30: a gamble leans good and can pay big. */
export const KNUCKLE_ODDS = { bad: 20, good: 50, great: 22, jackpot: 8 } as const;
export type KnuckleFall = keyof typeof KNUCKLE_ODDS;
/** What a throw did: an affix down a tier, nothing (bad, with nothing to drop), up a tier, added, up to its best, or all. */
export type KnuckleThrow = 'down' | 'nothing' | 'up' | 'add' | 'best' | 'all';
