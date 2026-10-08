import type { ThreatTag } from './monsterInfo';

/**
 * The ability library (docs/ENEMIES.md 7.3). A monster type lists the abilities it has; `sim/abilities.ts` runs the active
 * ones, and the text here is what the camp card, the inspect card and the recap say, so a new type needs no text of its
 * own. An ability marked `passive` is a rule that the combat code applies (a Shambler rising, a beetle curling up):
 * it is listed so the cards can name it.
 */
export type AbilityId =
  // Active: run every tick by `sim/abilities.ts`.
  | 'raiseCorpses'
  | 'blink'
  | 'spawn'
  | 'slam'
  | 'aura'
  | 'hex'
  | 'healChannel'
  | 'shell'
  | 'leap'
  | 'charge'
  | 'whistle'
  | 'kite'
  | 'ambush'
  | 'suppress'
  | 'pull'
  | 'devour'
  // Passive: applied where the rule lives.
  | 'rise'
  | 'burst'
  | 'curl'
  | 'shield'
  | 'fervour'
  | 'wispNova'
  | 'deathZone'
  | 'protect'
  | 'steal'
  | 'reflect';

export type AbilityDef = {
  id: AbilityId;
  /** Seconds between uses (active abilities). */
  interval?: number;
  /** Tiles: the reach of an aura, the range a leap or a pull starts from. */
  range?: number;
  /** A share (0 to 1), a count or a number of tiles, by ability. */
  amount?: number;
  /** A cap (alive at once, uses in a row). */
  max?: number;
  /** Seconds of telegraph before the effect. */
  telegraph?: number;
  /** The type this spawns. */
  spawns?: string;
};

export type AbilityInfo = {
  name: string;
  active: boolean;
  /** The threat tag it counts towards. */
  tag?: ThreatTag;
  text: (a: AbilityDef) => string;
};

const s = (n: number | undefined) => (n === undefined ? '' : `${n}`);
const pct = (n: number | undefined) => `${Math.round((n ?? 0) * 100)}%`;

export const ABILITY_INFO: Record<AbilityId, AbilityInfo> = {
  raiseCorpses: {
    name: 'Raise the dead',
    active: true,
    tag: 'summoners',
    text: (a) =>
      `Every ${s(a.interval)} s raises up to ${s(a.max)} nearby corpses as weaker allies.`,
  },
  blink: {
    name: 'Blink',
    active: true,
    tag: 'blinkers',
    text: (a) => `Every ${s(a.interval)} s it vanishes and reappears behind you.`,
  },
  spawn: {
    name: 'Spawn',
    active: true,
    tag: 'spawners',
    text: (a) =>
      `Every ${s(a.interval)} s spawns ${s(a.amount)} ${a.spawns ?? 'monsters'} (up to ${s(a.max)} at once).`,
  },
  slam: {
    name: 'Slam',
    active: true,
    tag: 'armoured',
    text: (a) =>
      `Every ${s(a.interval)} s slams the ground where you stand: a ${s(a.range)}-tile circle, after a warning.`,
  },
  aura: {
    name: 'Aura',
    active: true,
    tag: 'healers',
    text: (a) => `Allies within ${s(a.range)} tiles move faster and hit harder.`,
  },
  hex: {
    name: 'Hex',
    active: true,
    tag: 'hexes',
    text: (a) => `Hexes you with one of the four hexes every ${s(a.interval)} s.`,
  },
  healChannel: {
    name: 'Mend',
    active: true,
    tag: 'healers',
    text: (a) =>
      `Every ${s(a.interval)} s channels for ${s(a.telegraph)} s, healing allies within ${s(a.range)} tiles by ${pct(a.amount)}; a stun interrupts it.`,
  },
  shell: {
    name: 'Ward',
    active: true,
    tag: 'healers',
    text: (a) =>
      `Allies within ${s(a.range)} tiles carry an energy shield of ${pct(a.amount)} of their life while it lives.`,
  },
  leap: {
    name: 'Leap',
    active: true,
    tag: 'chargers',
    text: (a) =>
      `From ${s(a.range)} tiles away it crouches, then leaps onto you (every ${s(a.interval)} s).`,
  },
  charge: {
    name: 'Charge',
    active: true,
    tag: 'chargers',
    text: (a) =>
      `Every ${s(a.interval)} s it lowers its head and rushes in a straight line; it staggers whatever it hits.`,
  },
  whistle: {
    name: 'Whistle',
    active: true,
    tag: 'healers',
    text: (a) =>
      `Every ${s(a.interval)} s calls its pack to a frenzy: allies within ${s(a.range)} tiles move faster and hit harder for a few seconds.`,
  },
  kite: {
    name: 'Kite',
    active: false,
    tag: 'ranged',
    text: () => 'Backs away from you while it shoots.',
  },
  ambush: {
    name: 'Ambush',
    active: false,
    tag: 'chargers',
    text: (a) => `Lies still until you come within ${s(a.range)} tiles, then pounces.`,
  },
  suppress: {
    name: 'Suppress',
    active: true,
    tag: 'suppressors',
    text: (a) =>
      `While it stands, your regeneration, leech and energy shield recharge stop within ${s(a.range)} tiles.`,
  },
  devour: {
    name: 'Devour',
    active: true,
    text: (a) =>
      `Every ${s(a.interval)} s eats a body within ${s(a.range)} tiles and heals ${pct(a.amount)} of its life: burn or break the corpses.`,
  },
  pull: {
    name: 'Pull',
    active: true,
    tag: 'holders',
    text: (a) => `Every ${s(a.interval)} s drags you ${s(a.amount)} tiles toward it.`,
  },
  rise: {
    name: 'Rise',
    active: false,
    tag: 'summoners',
    text: () => 'Rises once more a few seconds after it dies, if its body is whole.',
  },
  burst: {
    name: 'Burst',
    active: false,
    tag: 'clouds',
    text: () => 'Bursts on contact or on death into a caustic cloud.',
  },
  curl: {
    name: 'Curl up',
    active: false,
    text: () => 'Curls up when hit and takes far less physical damage.',
  },
  shield: {
    name: 'Shield',
    active: false,
    text: () => 'A shield stops arrows from the front until it swings.',
  },
  fervour: {
    name: 'Fervour',
    active: false,
    text: () => 'Grows faster and stronger each time an ally dies nearby.',
  },
  wispNova: {
    name: 'Drain',
    active: false,
    tag: 'drains',
    text: () => 'Drains your mana on every hit, and a fifth of it when it dies.',
  },
  deathZone: {
    name: 'Scorched ground',
    active: false,
    tag: 'clouds',
    text: () => 'Leaves burning, chilled or shocked ground where it falls.',
  },
  protect: {
    name: 'Protect',
    active: false,
    tag: 'healers',
    text: (a) => `While it stands, allies within ${s(a.range)} tiles take no damage.`,
  },
  steal: {
    name: 'Steal',
    active: false,
    tag: 'thieves',
    text: (a) =>
      `Its hits take ${pct(a.amount)} of a flask's charges; it runs, and the charges come back when it dies.`,
  },
  reflect: {
    name: 'Reflect',
    active: false,
    tag: 'reflectors',
    text: (a) => `Reflects ${pct(a.amount)} of the melee damage dealt to it.`,
  },
};

/** One sentence per ability a type has. */
export function abilityTexts(abilities: AbilityDef[] | undefined): string[] {
  return (abilities ?? []).map((a) => `${ABILITY_INFO[a.id].name}: ${ABILITY_INFO[a.id].text(a)}`);
}

// ---- The numbers of the abilities the first two factions already have (docs/EXPANSION.md 7.3) --------------------

export const HAG_RAISE_INTERVAL = 8;
export const HAG_RAISE_MAX = 3;
export const HAG_RAISE_RANGE = 12;
export const BLINK_INTERVAL = 6;
export const BLINK_TELEGRAPH = 0.4;
export const WIGHT_RANGE = 6;
export const WIGHT_SHELL = 0.3;
export const CENSER_RANGE = 5;
export const HEXER_INTERVAL = 6;
export const CHOIR_HEAL_INTERVAL = 7;
export const CHOIR_HEAL_RANGE = 6;
export const CHOIR_HEAL_SHARE = 0.2;
export const CHANNEL_TIME = 1;
export const NEST_INTERVAL = 4;
export const NEST_SPAWN = 2;
export const NEST_MAX_ALIVE = 8;
export const SENTINEL_SLAM_INTERVAL = 4;
export const SENTINEL_SLAM_RADIUS = 2;
export const PYLON_RANGE = 5;

/** The abilities of each type (docs/ENEMIES.md 7.3): the single list the sim runs and the cards read. */
export const TYPE_ABILITIES: Partial<Record<string, AbilityDef[]>> = {
  shambler: [{ id: 'rise' }],
  bloater: [{ id: 'burst' }],
  shieldbearer: [{ id: 'shield' }],
  hag: [
    {
      id: 'raiseCorpses',
      interval: HAG_RAISE_INTERVAL,
      max: HAG_RAISE_MAX,
      range: HAG_RAISE_RANGE,
    },
  ],
  gloomstalker: [{ id: 'blink', interval: BLINK_INTERVAL, telegraph: BLINK_TELEGRAPH }],
  wisp: [{ id: 'wispNova' }],
  wight: [{ id: 'shell', range: WIGHT_RANGE, amount: WIGHT_SHELL }],
  hexer: [{ id: 'hex', interval: HEXER_INTERVAL }],
  censer: [{ id: 'aura', range: CENSER_RANGE }],
  flagellant: [{ id: 'fervour' }],
  choirmaster: [
    {
      id: 'healChannel',
      interval: CHOIR_HEAL_INTERVAL,
      range: CHOIR_HEAL_RANGE,
      amount: CHOIR_HEAL_SHARE,
      telegraph: CHANNEL_TIME,
    },
  ],
  beetle: [{ id: 'curl' }],
  nest: [
    {
      id: 'spawn',
      interval: NEST_INTERVAL,
      amount: NEST_SPAWN,
      max: NEST_MAX_ALIVE,
      spawns: 'Gnawers',
    },
  ],
  sentinel: [
    { id: 'slam', interval: SENTINEL_SLAM_INTERVAL, range: SENTINEL_SLAM_RADIUS, amount: 2 },
  ],
  golem: [{ id: 'deathZone' }],
  pylon: [{ id: 'protect', range: PYLON_RANGE }],
  hound: [{ id: 'leap', interval: 5, range: 7, telegraph: 0.5 }],
  boar: [{ id: 'charge', interval: 7, range: 10, telegraph: 0.6 }],
  handler: [{ id: 'whistle', interval: 8, range: 8, amount: 0.2 }, { id: 'kite' }],
  cat: [
    { id: 'leap', interval: 6, range: 6, telegraph: 0.4 },
    { id: 'ambush', range: 4.5 },
  ],
  cutpurse: [{ id: 'steal', amount: 0.25 }],
  guard: [{ id: 'reflect', amount: 0.15 }],
  bursar: [{ id: 'suppress', range: 5 }],
  slinger: [{ id: 'kite' }],
  gorger: [{ id: 'devour', interval: 3, range: 2.5, amount: 0.25 }],
  watcher: [{ id: 'hex', interval: 9 }],
  bell: [{ id: 'aura', range: 6 }],
  coffer: [{ id: 'ambush', range: 4 }],
};

/** The abilities a type has (none for most plain ones). */
export function abilitiesOf(type: string): AbilityDef[] {
  return TYPE_ABILITIES[type] ?? [];
}
