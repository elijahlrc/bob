/**
 * Archetypes (docs/ROSTER.md 6.1): a bundle of a combat role's stats, defence lean, movement and engagement. A monster type
 * is one archetype plus its deviations, and a faction's variety is the spread of archetypes it fields. The numbers are the
 * envelope a type of the archetype lies in (its toughness, damage, speed and reach); a data test keeps every type inside
 * its own, so the roster cannot drift into sixteen names for the same monster.
 */
export type ArchetypeId =
  | 'brawler'
  | 'bruiser'
  | 'skirmisher'
  | 'cutthroat'
  | 'gunner'
  | 'sniper'
  | 'artillery'
  | 'bulwark'
  | 'controller'
  | 'support'
  | 'summoner'
  | 'bomber'
  | 'ambusher'
  | 'rager'
  | 'thief'
  | 'hunter';

export type Range = readonly [number, number];

export type Archetype = {
  id: ArchetypeId;
  name: string;
  /** The toughness (life multiple, with its defences paid for: see `calc/matrix.ts`), the damage multiple, the speed in tiles a second and the reach in tiles. */
  toughness: Range;
  damage: Range;
  speed: Range;
  reach: Range;
  /** What it is hard to and soft to, in a phrase. */
  lean: string;
  /** How it fights, in a phrase. */
  engagement: string;
  /** The question it asks of a build. */
  question: string;
};

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  brawler: {
    id: 'brawler',
    name: 'Brawler',
    toughness: [0.8, 1.8],
    damage: [0.8, 1.2],
    speed: [2, 3.4],
    reach: [1, 1.5],
    lean: 'none',
    engagement: 'closes and trades blows',
    question: 'the baseline',
  },
  bruiser: {
    id: 'bruiser',
    name: 'Bruiser',
    toughness: [1.4, 3.2],
    damage: [1, 2.5],
    speed: [1.4, 2.4],
    reach: [1.3, 2.2],
    lean: 'armour and a high stun threshold',
    engagement: 'walks in and winds up a slow, heavy blow',
    question: 'crowd control; not standing in melee',
  },
  skirmisher: {
    id: 'skirmisher',
    name: 'Skirmisher',
    toughness: [0.2, 0.6],
    damage: [0.3, 0.7],
    speed: [3.6, 5.6],
    reach: [1, 1.3],
    lean: 'evasion',
    engagement: 'darts in and out and never stays adjacent',
    question: 'area damage; damage that cannot miss',
  },
  cutthroat: {
    id: 'cutthroat',
    name: 'Cutthroat',
    toughness: [0.4, 0.9],
    damage: [1, 2.2],
    speed: [3.4, 6],
    reach: [1, 1.4],
    lean: 'evasion',
    engagement: 'waits unseen, strikes, withdraws',
    question: 'seeing it; a buffer of life; burst',
  },
  gunner: {
    id: 'gunner',
    name: 'Gunner',
    toughness: [0.5, 0.8],
    damage: [0.6, 0.9],
    speed: [2.8, 3.4],
    reach: [5, 8],
    lean: 'light',
    engagement: 'fires in salvos and backs off when closed on',
    question: 'evasion and block; closing speed',
  },
  sniper: {
    id: 'sniper',
    name: 'Sniper',
    toughness: [0.4, 1],
    damage: [0.9, 3],
    speed: [0, 2],
    reach: [9, 12],
    lean: 'evasion',
    engagement: 'holds the longest range and marks a lane before it strikes',
    question: 'leaving the line; a ranged answer',
  },
  artillery: {
    id: 'artillery',
    name: 'Artillery',
    toughness: [0.5, 0.9],
    damage: [0.6, 1.8],
    speed: [1.4, 2.2],
    reach: [8, 12],
    lean: 'energy shield',
    engagement: 'lobs and casts from far off and keeps its distance',
    question: 'ground avoidance; reach',
  },
  bulwark: {
    id: 'bulwark',
    name: 'Bulwark',
    toughness: [0.6, 2.5],
    damage: [0.1, 0.95],
    speed: [0, 2.4],
    reach: [1, 3],
    lean: 'armour, resistances and immunities',
    engagement: 'holds a place, blocks and shields the others',
    question: 'area, piercing damage, damage that ignores armour',
  },
  controller: {
    id: 'controller',
    name: 'Controller',
    toughness: [0.7, 1.2],
    damage: [0.4, 1.2],
    speed: [2, 3],
    reach: [3, 8],
    lean: 'energy shield',
    engagement: 'slows, pulls, roots or curses from a distance',
    question: 'speed; immunity to being held',
  },
  support: {
    id: 'support',
    name: 'Support',
    toughness: [0.8, 1.6],
    damage: [0.1, 0.7],
    speed: [0, 3],
    reach: [1, 7],
    lean: 'energy shield and little life',
    engagement: 'stays behind the front and heals, buffs or shields',
    question: 'target priority; burst',
  },
  summoner: {
    id: 'summoner',
    name: 'Summoner',
    toughness: [0.8, 3],
    damage: [0.1, 0.6],
    speed: [0, 3],
    reach: [1, 7],
    lean: 'energy shield',
    engagement: 'spawns or raises and keeps its distance',
    question: 'reach; clearing what it makes',
  },
  bomber: {
    id: 'bomber',
    name: 'Bomber',
    toughness: [0.2, 1.2],
    damage: [0.2, 0.6],
    speed: [1.4, 5.6],
    reach: [1, 1.2],
    lean: 'fragile',
    engagement: 'runs straight in and bursts on contact or death',
    question: 'killing it at range; keeping distance',
  },
  ambusher: {
    id: 'ambusher',
    name: 'Ambusher',
    toughness: [0.6, 1.2],
    damage: [1.2, 2.2],
    speed: [3, 4],
    reach: [1, 1.5],
    lean: 'ordinary',
    engagement: 'waits for the character to come close',
    question: 'awareness; an opening burst',
  },
  rager: {
    id: 'rager',
    name: 'Rager',
    toughness: [0.7, 1.3],
    damage: [0.9, 1.3],
    speed: [2.8, 3.4],
    reach: [1.2, 3],
    lean: 'no armour',
    engagement: 'grows with damage taken and with allies falling',
    question: 'burst before it grows; finishing it',
  },
  thief: {
    id: 'thief',
    name: 'Thief',
    toughness: [0.5, 0.9],
    damage: [0.3, 0.6],
    speed: [3.5, 5],
    reach: [1, 1.2],
    lean: 'evasion',
    engagement: 'takes something and runs',
    question: 'reach; dependence on flasks',
  },
  hunter: {
    id: 'hunter',
    name: 'Hunter',
    toughness: [0.4, 1.1],
    damage: [0.5, 1.2],
    speed: [3.4, 4],
    reach: [1, 1.2],
    lean: 'ordinary',
    engagement: 'tracks the character and goes for its minions first',
    question: 'minion builds',
  },
};

export const ARCHETYPE_IDS = Object.keys(ARCHETYPES) as ArchetypeId[];
