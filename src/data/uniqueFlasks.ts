import type { UniqueMod } from './uniques';

/**
 * Unique flasks (EXPANSION 6.4, wave 1). Their mods apply while the flask is active: they ride on a
 * utility flask base and are drunk by the same automatic policy as any utility flask.
 */
export type UniqueFlaskDef = {
  id: string;
  name: string;
  /** A unique-only utility flask base in `data/flasks.ts`. */
  baseId: string;
  level: number;
  /** Mods granted during the effect. */
  mods: UniqueMod[];
  factions?: string[];
  notes?: { pairsWith: string[]; weakAgainst: string[] };
  flavour: string;
};

const m = (
  stat: string,
  kind: UniqueMod['kind'],
  min: number,
  max = min,
  extra: Partial<UniqueMod> = {},
): UniqueMod => ({ stat, kind, min, max, ...extra });

export const UNIQUE_FLASKS: UniqueFlaskDef[] = [
  {
    id: 'hoarfrostDraught',
    name: 'Hoarfrost Draught',
    baseId: 'flask_hoarfrost',
    level: 26,
    mods: [m('physTakenAs.cold', 'base', 30), m('gain.physical.cold', 'base', 10, 15)],
    notes: {
      pairsWith: [
        'cold resistance gear',
        'physical hitters that need an answer (Brutes, Sentinels)',
      ],
      weakAgainst: ['cold-leaning maps, and a utility slot that is not free'],
    },
    flavour: 'Drink it and the cold takes the blow instead of you.',
  },
  {
    id: 'lastLightFlask',
    name: 'Last Light Flask',
    baseId: 'flask_lastlight',
    level: 40,
    mods: [m('projectiles', 'base', 2), m('aoe', 'inc', 20, 30)],
    factions: ['swarm'],
    notes: {
      pairsWith: ['projectile skills and pierce', 'Flame Bolt and other area skills'],
      weakAgainst: ['melee builds, and the flask must be up to matter'],
    },
    flavour: 'Poured out in a dark room, it makes the room very bright, very briefly.',
  },
  {
    id: 'rotwineFlask',
    name: 'Rotwine Flask',
    baseId: 'flask_rotwine',
    level: 35,
    mods: [
      m('gain.physical.chaos', 'base', 10, 15),
      m('gain.lightning.chaos', 'base', 10),
      m('gain.cold.chaos', 'base', 10),
      m('gain.fire.chaos', 'base', 10),
      m('leech.life', 'base', 2, 2, { damageTypes: ['chaos'] }),
    ],
    factions: ['rot'],
    notes: {
      pairsWith: ['chaos penetration and poison', 'enemies with high elemental resistance'],
      weakAgainst: ['chaos-resistant enemies, and Bloodless monsters that cannot be leeched from'],
    },
    flavour: 'Vintage by decay. It improves everything but you.',
  },
  {
    id: 'stonebrewFlask',
    name: 'Stonebrew Flask',
    baseId: 'flask_stonebrew',
    level: 20,
    mods: [m('blockAttack', 'base', 12, 15), m('blockSpell', 'base', 12, 15)],
    factions: ['ossuary'],
    notes: {
      pairsWith: ['shields and block notables', 'life on block'],
      weakAgainst: ['builds without a way to reach the block cap'],
    },
    flavour: 'It tastes of the wall it was brewed against.',
  },
  {
    id: 'gamblersTonic',
    name: "Gambler's Tonic",
    baseId: 'flask_tonic',
    level: 22,
    mods: [m('itemRarity', 'inc', 20, 30), m('itemQuantity', 'inc', 20, 30)],
    notes: {
      pairsWith: [
        'fast clearing: only kills made during the effect count',
        'The Trophy Cord-style rare hunting',
      ],
      weakAgainst: ['everything hard: it adds no combat value and takes a utility slot'],
    },
    flavour: 'One more cup, and the next chest will be the one.',
  },
  {
    id: 'martyrsDraught',
    name: "Martyr's Draught",
    baseId: 'flask_martyr',
    level: 30,
    mods: [m('flask.lifeToEs', 'flag', 1), m('chaosNotBypassEs', 'flag', 1)],
    factions: ['rot'],
    notes: {
      pairsWith: ['a large energy shield pool', "Embalmer's Wraps and other chaos answers"],
      weakAgainst: ['life builds, where it is lethal: it leaves you at 1 life for two seconds'],
    },
    flavour: 'Drink deep. Someone has to go first.',
  },
];

export function uniqueFlaskDef(id: string): UniqueFlaskDef {
  const u = UNIQUE_FLASKS.find((x) => x.id === id);
  if (!u) throw new Error(`unknown unique flask ${id}`);
  return u;
}
