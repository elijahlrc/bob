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
  {
    id: 'emberwellUrn',
    name: 'Emberwell Urn',
    baseId: 'flask_emberwell',
    level: 22,
    mods: [
      m('recoverPct.kill.life', 'base', 1, 3),
      m('recoverPct.kill.mana', 'base', 1, 3),
      m('recoverPct.kill.es', 'base', 1, 3),
      m('damage', 'more', 10, 10, { condition: { id: 'targetIgnited' } }),
    ],
    notes: {
      pairsWith: ['ignite builds', 'fast clears with many kills'],
      weakAgainst: ['single targets, where no kill refills it'],
    },
    flavour: 'It never quite cools, and it never quite empties.',
  },
  {
    id: 'venomveinPhial',
    name: 'Venomvein Phial',
    baseId: 'flask_venomvein',
    level: 27,
    mods: [
      m('chance.poison', 'base', 25),
      m('critMulti', 'base', -50),
      m('duration.poison', 'inc', 50, 75),
    ],
    notes: {
      pairsWith: ['poison and chaos damage', 'builds that rarely crit'],
      weakAgainst: ['crit builds, where it removes the bonus'],
    },
    flavour: 'Take the sting out of the crit and put it in the blood.',
  },
  {
    id: 'steadfastTonic',
    name: 'Steadfast Tonic',
    baseId: 'flask_steadfast',
    level: 22,
    mods: [
      m('cannotBeFrozen', 'flag', 1),
      m('cannotBeChilled', 'flag', 1),
      m('cannotBeStunned', 'flag', 1),
      m('curseEffectOnSelf', 'inc', -100),
    ],
    notes: {
      pairsWith: ['cold and shock maps', 'curse-heavy enemies'],
      weakAgainst: ['maps with nothing to be immune to'],
    },
    flavour: 'For a minute, nothing can be done to you.',
  },
  {
    id: 'unboundDraught',
    name: 'Unbound Draught',
    baseId: 'flask_unbound',
    level: 50,
    mods: [m('cost', 'inc', -100), m('manaRegenPct', 'base', 1.5)],
    notes: {
      pairsWith: ['big spell skills and utility casts', 'mana-hungry builds'],
      weakAgainst: ['attack builds with cheap skills'],
    },
    flavour: 'Spend as you like. It will not be missed.',
  },
  {
    id: 'bellowingDraught',
    name: 'Bellowing Draught',
    baseId: 'flask_bellowing',
    level: 27,
    mods: [
      m('damage', 'more', 20, 25, { damageTypes: ['physical'], tags: ['melee'] }),
      m('stunDuration', 'inc', 30),
    ],
    notes: {
      pairsWith: ['melee physical builds', 'stun-based builds'],
      weakAgainst: ['ranged and spell builds'],
    },
    flavour: 'Roar first. Hit second.',
  },
  {
    id: 'swiftgutFlask',
    name: 'Swiftgut Flask',
    baseId: 'flask_swiftgut',
    level: 40,
    mods: [
      m('moveSpeed', 'inc', 10, 30),
      m('buffOn.flask.onslaught', 'base', 100),
      m('chargeOn.crit.fervour', 'base', 15),
    ],
    notes: {
      pairsWith: ['frenzy and speed builds', 'clearing runs'],
      weakAgainst: ['slow boss fights, where the speed is wasted'],
    },
    flavour: 'Better not to ask what is in it.',
  },
  {
    id: 'ashenTonic',
    name: 'Ashen Tonic',
    baseId: 'flask_ashen',
    level: 14,
    mods: [m('buffOn.flask.unholyMight', 'base', 100), m('removeIgnite', 'flag', 1)],
    notes: {
      pairsWith: ['physical builds that want chaos damage', 'fire maps'],
      weakAgainst: ['builds with no physical damage'],
    },
    flavour: 'It puts out the fire and lights something worse.',
  },
  {
    id: 'thunderbloodVial',
    name: 'Thunderblood Vial',
    baseId: 'flask_thunderblood',
    level: 68,
    mods: [
      m('leech.life', 'base', 2, 2, { damageTypes: ['lightning'] }),
      m('convert.physical.lightning', 'base', 20),
    ],
    notes: {
      pairsWith: ['lightning builds', 'physical hitters who want a lightning share'],
      weakAgainst: ['builds that need their physical damage'],
    },
    flavour: 'It hums when it is full, and it is always full.',
  },
  {
    id: 'hexfireBrew',
    name: 'Hexfire Brew',
    baseId: 'flask_hexfire',
    level: 48,
    mods: [m('damage', 'inc', 25, 40, { tags: ['dot'] }), m('hexOnHit.chaosSap', 'base', 21)],
    notes: {
      pairsWith: ['damage over time builds', 'chaos damage'],
      weakAgainst: ['hit-based builds'],
    },
    flavour: 'A bitter cup, and the curse comes with it.',
  },
];

export function uniqueFlaskDef(id: string): UniqueFlaskDef {
  const u = UNIQUE_FLASKS.find((x) => x.id === id);
  if (!u) throw new Error(`unknown unique flask ${id}`);
  return u;
}
