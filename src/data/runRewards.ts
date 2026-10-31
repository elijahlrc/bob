/**
 * Relics (docs/ATTRITION.md; called run rewards until 2026-10-29): things a roguelike gives and the reference game does not, kept
 * for the rest of the run. The owner's list of 2026-10-29, with three of the first four kept (Deeper Pouch became the owner's
 * first). The Quartermaster sells them, a boss that falls offers a pick of them, and a win against the Envious Dead pays one
 * (the owner, 2026-10-30). The names are provisional until the owner names them. Every name and text here is ours.
 */
export type RunRewardId =
  | 'deeperPouch'
  | 'twiceSteeped'
  | 'gleanersHook'
  | 'headsmansTally'
  | 'thirstingCup'
  | 'throneDraught'
  | 'brimmingWard'
  | 'abstainersVow'
  | 'hollowedPaths'
  | 'strayStar'
  | 'burntRoad'
  | 'graftedRoot'
  | 'pyreOfTheLesser'
  | 'strangersThreshold'
  | 'crownsOfTheFallen'
  | 'litanyOfTheChosen'
  | 'bulwarkBeforeTheThrone'
  | 'lingeringRot'
  | 'theUnflinching'
  | 'blindFury'
  | 'echoingWord'
  | 'mantleOfTheFiend'
  | 'weakestVein'
  | 'keenEye'
  | 'waystationCup'
  | 'thriftyHands'
  | 'untouchedBlood'
  | 'marksmansPulse'
  | 'rotVeil'
  | 'servantsTithe'
  | 'flayingWrath'
  | 'anvilThirst'
  | 'quickeningCruelty'
  | 'unseenWard'
  | 'arrowsAtTheThroat'
  | 'shieldsRebuke'
  | 'warringElements'
  | 'twoVessels'
  | 'burningThrough'
  | 'mountainsHide'
  | 'fleetfootOath'
  | 'ripeningWound'
  | 'sharedAgony'
  | 'spreadingHex'
  | 'searingExcess';
export type RelicId = RunRewardId;
export type RelicAttr = 'str' | 'dex' | 'int';

export type RunRewardDef = {
  id: RunRewardId;
  name: string;
  /** What it does, in a line (its card and the effects bar). */
  text: string;
  /** Base price in Bone Dust before the level factor (data/sale.ts). */
  base: number;
  /** How many a run can hold. */
  max: number;
  /** The first level it is offered on. */
  from: number;
  /** A relic used on the passive tree: how many times it can be used (docs/ATTRITION.md, relics 7 to 12). */
  uses?: number;
  /** The attributes it belongs to: it is offered by the character's own (`relicWeight`, run/relics.ts). */
  attrs?: RelicAttr[];
};

export const RUN_REWARDS: RunRewardDef[] = [
  // 1, and 1.1 and 1.2, which work with it but are offered without it (the owner, 2026-10-30).
  {
    id: 'deeperPouch',
    name: "Gravewarden's Satchel",
    text: 'Your pouch holds two more provisions, and two more can be armed.',
    base: 35,
    max: 1,
    from: 6,
  },
  {
    id: 'twiceSteeped',
    name: 'Twice-Steeped Dregs',
    text: 'Armed provisions have twice their effect.',
    base: 45,
    max: 1,
    from: 6,
  },
  {
    id: 'gleanersHook',
    name: "The Gleaner's Hook",
    text: 'Every level you pass leaves a provision in your pouch.',
    base: 45,
    max: 1,
    from: 6,
  },
  // 2
  {
    id: 'headsmansTally',
    name: "Headsman's Tally",
    text: 'Every rare monster you slay pays 20 Bone Dust.',
    base: 35,
    max: 1,
    from: 6,
  },
  // 3
  {
    id: 'thirstingCup',
    name: 'The Thirsting Cup',
    text: 'The flask in slot 1 gains half a charge for every enemy slain.',
    base: 40,
    max: 1,
    from: 6,
  },
  // 4
  {
    id: 'throneDraught',
    name: 'Draught Before the Throne',
    text: 'Every flask is at least half full when a boss level starts.',
    base: 30,
    max: 1,
    from: 6,
  },
  // 5
  {
    id: 'brimmingWard',
    name: 'The Brimming Ward',
    text: 'Flask healing beyond full life becomes energy shield. Without energy shield of your own, it fades.',
    base: 40,
    max: 1,
    from: 6,
  },
  // 6
  {
    id: 'abstainersVow',
    name: "The Abstainer's Vow",
    text: '+15% to all resistances for each empty flask slot.',
    base: 35,
    max: 1,
    from: 6,
  },
  // 7 to 13: the passive tree.
  {
    id: 'hollowedPaths',
    name: 'Hollowed Paths',
    text: 'Refund up to three passives without breaking the paths through them.',
    base: 40,
    max: 1,
    from: 6,
    uses: 3,
  },
  {
    id: 'strayStar',
    name: 'A Star Torn Loose',
    text: 'Take one notable passive anywhere on the tree.',
    base: 55,
    max: 1,
    from: 6,
    uses: 1,
  },
  {
    id: 'burntRoad',
    name: 'Brand of the Burnt Road',
    text: 'Burn a passive you hold: it is refunded and lost for good, and links to any passive within a third of the tree.',
    base: 45,
    max: 1,
    from: 6,
    uses: 1,
  },
  {
    id: 'graftedRoot',
    name: 'The Grafted Root',
    text: 'Choose a small passive to grow from. Each passive grown from it costs 10% to all resistances.',
    base: 40,
    max: 1,
    from: 6,
    uses: 1,
  },
  {
    id: 'pyreOfTheLesser',
    name: 'Pyre of the Lesser',
    text: 'Choose a cluster with two or more small passives: they burn, and its notable is three times as strong.',
    base: 50,
    max: 1,
    from: 6,
    uses: 1,
  },
  {
    id: 'strangersThreshold',
    name: "A Stranger's Threshold",
    text: "Choose another class's start: passives can grow from it too.",
    base: 50,
    max: 1,
    from: 6,
    uses: 1,
  },
  {
    id: 'crownsOfTheFallen',
    name: 'Crowns of the Fallen',
    text: "Other classes' starts can be taken as notables: +8% to all resistances, +10% attack and cast speed, +10% life and mana each.",
    base: 50,
    max: 1,
    from: 6,
  },
  // 14
  {
    id: 'litanyOfTheChosen',
    name: 'Litany of the Chosen',
    text: '+2 levels to your primary skill.',
    base: 60,
    max: 1,
    from: 6,
  },
  // 15
  {
    id: 'bulwarkBeforeTheThrone',
    name: 'Bulwark Before the Throne',
    text: '15% more armour, evasion and energy shield on boss levels.',
    base: 30,
    max: 1,
    from: 6,
  },
  // 16
  {
    id: 'lingeringRot',
    name: 'The Lingering Rot',
    text: '50% more duration of damage over time.',
    base: 40,
    max: 1,
    from: 6,
  },
  // 17
  {
    id: 'theUnflinching',
    name: 'The Unflinching',
    text: '20% less elemental damage taken. You no longer dodge attacks on the ground.',
    base: 45,
    max: 1,
    from: 6,
  },
  // 18
  {
    id: 'blindFury',
    name: 'Blind Fury',
    text: 'Attacks leech 0.5% of damage as life and mana. You can no longer choose whom they are used on.',
    base: 40,
    max: 1,
    from: 6,
  },
  // 19
  {
    id: 'echoingWord',
    name: 'The Echoing Word',
    text: 'Spells have a 50% chance to be cast again for free. 50% less Bone Dust.',
    base: 55,
    max: 1,
    from: 6,
  },
  // 20
  {
    id: 'mantleOfTheFiend',
    name: 'Mantle of the Fiend',
    text: 'You carry one monster affix, which changes every minute.',
    base: 40,
    max: 1,
    from: 6,
  },
  // 21
  {
    id: 'weakestVein',
    name: 'The Weakest Vein',
    text: 'Maximum life equal to your lowest attribute.',
    base: 35,
    max: 1,
    from: 6,
  },
  // Kept from the first four (2026-10-29).
  {
    id: 'keenEye',
    name: 'Keen Eye',
    text: 'Every reward pick offers one more choice.',
    base: 35,
    max: 1,
    from: 6,
  },
  {
    id: 'waystationCup',
    name: 'Waystation Cup',
    text: 'Every stop you take refills your flasks.',
    base: 40,
    max: 1,
    from: 8,
  },
  {
    id: 'thriftyHands',
    name: 'Thrifty Hands',
    text: 'Crafts at a Respite cost half as much Bone Dust.',
    base: 25,
    max: 1,
    from: 6,
  },
  // The attribute relics (the owner, 2026-10-30): offered by the character's attributes when they are drawn.
  {
    id: 'untouchedBlood',
    name: 'Blood of the Untouched',
    text: 'Each attack you evade makes your attacks leech 1% of their damage as life for 5 seconds. Stacks.',
    base: 45,
    max: 1,
    from: 6,
    attrs: ['dex'],
  },
  {
    id: 'marksmansPulse',
    name: "The Marksman's Pulse",
    text: '+1 maximum life for every 4 accuracy.',
    base: 45,
    max: 1,
    from: 6,
    attrs: ['dex'],
  },
  {
    id: 'rotVeil',
    name: 'Veil Against the Rot',
    text: 'Energy shield takes half of the chaos damage you take.',
    base: 40,
    max: 1,
    from: 6,
    attrs: ['int'],
  },
  {
    id: 'servantsTithe',
    name: 'Tithe of the Servants',
    text: 'A minion of yours that is slain heals you for 5% of its life; one whose time runs out, 1.25%.',
    base: 40,
    max: 1,
    from: 6,
    attrs: ['int'],
  },
  {
    id: 'flayingWrath',
    name: 'Wrath That Flays Its Bearer',
    text: '75% increased two-handed melee attack speed. Every two-handed melee hit reflects 1% of its damage back at you.',
    base: 50,
    max: 1,
    from: 6,
    attrs: ['str'],
  },
  {
    id: 'anvilThirst',
    name: 'Thirst of the Anvil',
    text: 'Life leech is increased by your increased armour. 50% less armour.',
    base: 45,
    max: 1,
    from: 6,
    attrs: ['str'],
  },
  {
    id: 'quickeningCruelty',
    name: 'Quickening Cruelty',
    text: 'Critical strikes grant 3% increased attack speed for 5 seconds, stacking up to 60%.',
    base: 50,
    max: 1,
    from: 6,
    attrs: ['dex', 'int'],
  },
  {
    id: 'unseenWard',
    name: 'The Unseen Ward',
    text: 'Evading an attack starts your energy shield recharging at once.',
    base: 40,
    max: 1,
    from: 6,
    attrs: ['dex', 'int'],
  },
  {
    id: 'arrowsAtTheThroat',
    name: 'Arrows at the Throat',
    text: '+100% projectile damage. Projectiles fall after a short distance.',
    base: 50,
    max: 1,
    from: 6,
    attrs: ['dex', 'str'],
  },
  {
    id: 'shieldsRebuke',
    name: "The Shield's Rebuke",
    text: 'Blocking an attack stuns the attacker briefly.',
    base: 45,
    max: 1,
    from: 6,
    attrs: ['dex', 'str'],
  },
  {
    id: 'warringElements',
    name: 'Elements at War',
    text: "Elemental damage of one element lowers the target's resistances to the other two by 30% for 3 seconds.",
    base: 50,
    max: 1,
    from: 6,
    attrs: ['str', 'int'],
  },
  {
    id: 'twoVessels',
    name: 'One Blood, Two Vessels',
    text: 'Life regeneration also regenerates the same share of your mana.',
    base: 45,
    max: 1,
    from: 6,
    attrs: ['str', 'int'],
  },
  // The owner's picks from the second brainstorm (2026-10-30).
  {
    id: 'burningThrough',
    name: 'Burning Through',
    text: '+1 to the maximum of every kind of charge.',
    base: 40,
    max: 1,
    from: 6,
  },
  {
    id: 'mountainsHide',
    name: "The Mountain's Hide",
    text: 'Armour also reduces elemental hit damage, at a quarter of its strength. -5% to maximum elemental resistances.',
    base: 45,
    max: 1,
    from: 6,
    attrs: ['str'],
  },
  {
    id: 'fleetfootOath',
    name: 'The Fleetfoot Oath',
    text: 'Half your increased movement speed also applies to attack and cast speed. 20% less evasion.',
    base: 45,
    max: 1,
    from: 6,
    attrs: ['dex'],
  },
  {
    id: 'ripeningWound',
    name: 'The Ripening Wound',
    text: '+30% critical strike chance for each second since your last critical strike, starting from -30%.',
    base: 45,
    max: 1,
    from: 6,
    attrs: ['dex'],
  },
  {
    id: 'sharedAgony',
    name: 'Shared Agony',
    text: 'Your minions take 25% of the damage you take, split among them. 50% less minion life.',
    base: 45,
    max: 1,
    from: 6,
    attrs: ['int'],
  },
  {
    id: 'spreadingHex',
    name: 'The Spreading Hex',
    text: 'A cursed enemy that dies passes its curses to the nearest enemy.',
    base: 40,
    max: 1,
    from: 6,
    attrs: ['int'],
  },
  {
    id: 'searingExcess',
    name: 'Searing Excess',
    text: '1% more damage of an element for each 1% of its resistance above the cap.',
    base: 50,
    max: 1,
    from: 6,
    attrs: ['str', 'int'],
  },
];

export const runRewardDef = (id: string): RunRewardDef => {
  const d = RUN_REWARDS.find((r) => r.id === id);
  if (!d) throw new Error(`unknown run reward ${id}`);
  return d;
};
export const relicDef = runRewardDef;
export const isRelicId = (id: string): id is RunRewardId => RUN_REWARDS.some((r) => r.id === id);

/** How many of each relic a build holds. Relics live on the build, so the character sheet and the sim see them. */
export type RelicHoldings = Partial<Record<RunRewardId, number>>;

/** Relic 6: resistances for each empty flask slot. */
export const ABSTAINER_RES = 15;
/** Relic 2: Bone Dust for each rare slain. */
export const HEADSMAN_DUST = 20;
/** Relic 3: charges the first slot's flask gains for each kill. */
export const THIRSTING_CHARGES = 0.5;
/** Relic 4: what every flask holds at least when a boss level starts, as a share of its charges. */
export const THRONE_DRAUGHT = 0.5;
/** Relic 10: resistances lost for each passive grown from the grafted root. */
export const GRAFT_RES = 10;
/** Relic 11: how strong the notable of a burnt cluster is. */
export const PYRE_MULT = 3;
/** Relic 14: levels added to the primary skill. */
export const LITANY_LEVELS = 2;
/** Relic 15: more global defences on boss levels. */
export const BULWARK_MORE = 15;
/** Relic 16: more duration of damage over time. */
export const LINGERING_MORE = 50;
/** Relic 17: less elemental damage taken. */
export const UNFLINCHING_LESS = 20;
/** Relic 18: share of attack damage leeched as life and as mana, in percent. */
export const BLIND_FURY_LEECH = 0.5;
/** Relic 19: the chance a spell is cast again, and the Bone Dust kept. */
export const ECHO_CHANCE = 0.5;
export const ECHO_DUST = 0.5;
/** Relic 20: seconds between the monster affixes the character carries. */
export const FIEND_PERIOD = 60;
/** Relic 5: how fast energy shield beyond the character's own fades, as a share of it a second. */
export const BRIMMING_FADE = 0.1;
/** How many relics a boss that falls offers to choose from. */
export const BOSS_RELIC_CHOICES = 3;

// The attribute relics (the owner's numbers, 2026-10-30, unless marked as mine).
/** Leech from each evaded attack, percent of attack damage, and how long a stack holds. */
export const UNTOUCHED_LEECH = 1;
export const UNTOUCHED_SECONDS = 5;
/** Accuracy for each point of maximum life. */
export const MARKSMAN_ACCURACY = 4;
/** The share of chaos damage that energy shield takes. */
export const ROT_VEIL_SHARE = 0.5;
/** Life healed when a minion is slain, and when its time runs out (mine: about a quarter, so twenty Call Furies spirits heal
 * a few percent of life a second, not a tenth). */
export const TITHE_SLAIN = 0.05;
export const TITHE_EXPIRED = 0.0125;
/** Increased attack speed with two-handed weapons, and the share of each attack hit reflected. */
export const FLAYING_SPEED = 75;
export const FLAYING_REFLECT = 0.01;
/** Less armour. */
export const ANVIL_LESS = 50;
/** Attack speed for each critical strike, its most, and how long a stack holds. */
export const CRUELTY_SPEED = 3;
export const CRUELTY_MAX = 60;
export const CRUELTY_SECONDS = 5;
/** More projectile damage, and how far a projectile flies (tiles; mine: about a melee reach and a step). */
export const ARROWS_MORE = 100;
export const ARROWS_RANGE = 2;
/** The stun a block gives the attacker (seconds), half on a boss, and how soon the same monster can be stunned again (mine). */
export const REBUKE_STUN = 0.35;
export const REBUKE_COOLDOWN = 2;
/** Resistance the other two elements lose, and for how long. */
export const WARRING_RES = 30;
export const WARRING_SECONDS = 3;

// The second brainstorm's relics (the owner's numbers, 2026-10-30, unless marked as mine).
/** The share of armour that counts against elemental hits, and the maximum resistances lost (mine: a cost no overcapping
 * buys back, smaller than what a quarter of a stacked armour saves). */
export const MOUNTAIN_SHARE = 0.25;
export const MOUNTAIN_MAX_RES = 5;
/** Increased movement speed for each point of attack and cast speed it gives, and less evasion. */
export const FLEETFOOT_DIV = 2;
export const FLEETFOOT_LESS = 20;
/** Critical strike chance gained each second since the last critical strike, and where it starts again. */
export const RIPENING_RATE = 30;
export const RIPENING_FLOOR = -30;
/** The share of damage taken that the minions take instead, and less minion life. */
export const AGONY_SHARE = 0.25;
export const AGONY_LESS = 50;
/** How far a curse can pass from an enemy that dies, in tiles (mine). */
export const HEX_SPREAD_RANGE = 6;
