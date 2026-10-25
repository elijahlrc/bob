import { BASE_CRIT_MULTI, ES_RECHARGE_DELAY } from './constants';

/**
 * Plain words for what a newcomer meets on the Character tab, the HUD and the cards (docs/NEWPLAYER.md N13): one line each,
 * saying what a thing is for, in our own words. Shown on hover or tap.
 */
export const GLOSSARY = {
  life: 'When it runs out, your character dies and the run is over.',
  es: `Energy shield: a second pool over life. Hits take it first, and it starts to refill ${ES_RECHARGE_DELAY} seconds after the last one.`,
  mana: 'Paid to use skills. It refills slowly by itself, and a mana flask refills some of it.',
  str: 'Strength: needed for heavy gear and gems. Each point adds life and melee physical damage.',
  dex: 'Dexterity: needed for nimble gear and gems. Each point adds accuracy and evasion.',
  int: 'Intelligence: needed for gear and gems of the mind. Each point adds mana and energy shield.',
  resist:
    'Takes this share off damage of its element. It cannot go past the maximum, 75% to begin with.',
  chaos: 'Takes this share off chaos damage (poison and rot). It cannot go past the maximum.',
  armour: 'Takes a share off physical hits: much off small hits, less off big ones.',
  evasion: "A chance for an enemy's attack to miss you.",
  block:
    'A chance to take no damage from a hit. A shield gives it, as do two weapons held at once.',
  stun: 'A stun stops a fighter for a moment. Big hits stun.',
  regen: 'Refills by itself every second.',
  leech: 'Part of the damage you deal comes back to you as life or mana.',
  flask: 'Flasks are drunk by themselves (the Strategy tab says when) and refill as you kill.',
  taken: 'Changes how much damage reaches you, after your other defences.',
  damage: 'How hard your character hits.',
  speed: 'How often your character attacks or casts.',
  crit: `A critical strike deals more damage: ${BASE_CRIT_MULTI}% of a normal hit to begin with.`,
  accuracy: "Lowers an enemy's chance to evade your attacks.",
  area: 'How far an area skill reaches, how fast and far projectiles go, how long effects last.',
  ailments:
    'Ignite burns, chill slows, freeze stops, shock makes the target take more damage; poison and bleeding hurt over time.',
  dot: 'Damage over time: dealt little by little, not in one hit.',
  hexes: 'Curses your character puts on enemies.',
  minions: 'What your summoned allies, totems and lasting effects do.',
  move: 'How fast your character walks.',
  mult: '×1.10 here is 10% more than without your gear, passives and gems; ×1.00 is none.',
  dps: "Damage per second: the game's estimate of what your character deals in a fight.",
  hit: 'The physical damage of each hit, before your modifiers.',
  aps: 'Attacks per second with this weapon, before your modifiers.',
  ilvl: 'Item level: the level of the map it came from. Higher ones can roll stronger modifiers.',
  ehp: 'Effective HP: how much damage your character can take, its defences counted.',
} as const;

export type Term = keyof typeof GLOSSARY;

/** Which line explains a stat of the character's totals, by the start of its stat id (the first that matches). */
const BY_STAT: [RegExp, Term][] = [
  [/^life$/, 'life'],
  [/^es$/, 'es'],
  [/^mana$/, 'mana'],
  [/^(armour|physReduction|globalDefences|shieldDefences)/, 'armour'],
  [/^evasion/, 'evasion'],
  [/^block/, 'block'],
  [/^(stun|avoid)/, 'stun'],
  [/^(lifeRegen|manaRegen|esRecharge|recover|lifeOn|manaOn)/, 'regen'],
  [/^leech/, 'leech'],
  [/^flask/, 'flask'],
  [/^(resist|maxResist)/, 'resist'],
  [/^(damageTaken|hitTaken)/, 'taken'],
  [/^(damage|minDamage|maxDamage|pen)/, 'damage'],
  [/^(attackSpeed|castSpeed|actionSpeed|cooldownRecovery)/, 'speed'],
  [/^crit/, 'crit'],
  [/^accuracy/, 'accuracy'],
  [/^(aoe|projectile|skillDuration|chain|pierce|fork|buffDuration)/, 'area'],
  [/^moveSpeed/, 'move'],
];

/** The line for a stat of the character's totals (a Character tab row), by its stat id. */
export function glossFor(stat: string): string | undefined {
  const hit = BY_STAT.find(([re]) => re.test(stat));
  return hit ? GLOSSARY[hit[1]] : undefined;
}

/** What a gem's tags mean, for the ones a newcomer has to know (by the tag as the card shows it, lower case). */
export const TAG_GLOSSARY: Record<string, string> = {
  attack: "Swung or shot with your weapon: the weapon's damage and speed count.",
  spell: 'Cast, not swung: it has its own damage, and cast speed counts.',
  melee: 'Hits enemies within reach of your weapon.',
  projectile: 'Flies from your character to where it hits.',
  area: 'Hits everything in an area; area of effect makes it wider.',
  duration: 'Lasts a while; skill effect duration makes it last longer.',
  minion: 'Summons allies that fight beside your character.',
  totem: 'Puts down a totem that stands and uses the skill on its own.',
  trap: 'Thrown on the ground, it goes off when an enemy comes near.',
  mine: 'Laid on the ground; the mines go off together once enough enemies are near.',
  aura: 'Always on while it holds back part of your mana.',
  curse: 'Weakens the enemies it is put on.',
  warcry: 'A shout with an effect on enemies or your character, on a cooldown.',
  chaining: 'Jumps from the enemy it hits to others nearby.',
  dot: 'Deals its damage over time, not in one hit.',
};
