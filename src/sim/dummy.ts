import { LEGACY } from '../data/difficulty';
import type { Defence } from '../calc/combat';
import { biomeDef } from '../data/biomes';
import { densityDef } from '../data/density';
import { themeDef } from '../data/themes';
import type { Build } from '../data/types';
import { FLOOR } from '../gen/labyrinth';
import type { MapPlan } from '../gen/mapPlan';
import type { Actor, World } from './types';
import { createWorld, spawnMonster } from './world';

/** A defence with no mitigation; override fields as needed. */
export function dummyDefence(over: Partial<Defence> = {}): Defence {
  return {
    isPlayer: false,
    hitTakenMult: 1,
    maxLife: 1e12,
    maxEs: 0,
    maxMana: 0,
    armour: 0,
    evasion: 0,
    blockAttack: 0,
    blockSpell: 0,
    blockCap: 0.75,
    blockProjectile: 0,
    lifeOnBlock: 0,
    manaOnBlock: 0,
    blockStagger: 0,
    esRegen: 0,
    res: [0, 0, 0, 0, 0],
    avoidHit: [0, 0, 0, 0, 0],
    maxRes: [75, 75, 75, 75, 75],
    physReduction: 0,
    damageTakenMult: 1,
    ailmentThreshold: 1e12,
    stunThreshold: 1e12,
    stunAvoid: 0,
    stunDurOnSelf: 1,
    cannotBeStunned: true,
    cannotEvade: false,
    evadeProj: 0,
    evadeMelee: 0,
    immuneChaos: false,
    manaBeforeLife: 0,
    cannotBeChilled: false,
    cannotBeFrozen: false,
    lifeRegen: 0,
    esRecharge: 0,
    esDelay: 2,
    manaRegen: 0,
    lifeOnBlockPct: 0,
    moveSpeed: 0,
    esProtectsMana: false,
    noLifeRegen: true,
    instantLeech: false,
    leechToEs: false,
    regenToEs: false,
    chaosHitsEs: false,
    chaosEsShare: 0,
    armourVsEle: 0,
    physTakenAs: [0, 0, 0, 0, 0],
    damageTakenType: [1, 1, 1, 1, 1],
    unaffectedByShock: false,
    cannotBeLeechedFrom: false,
    immuneAilments: false,
    immune: [false, false, false, false, false],
    avoid: { ignite: 0, shock: 0, chill: 0, freeze: 0, bleed: 0, poison: 0 },
    durOnSelf: { ignite: 1, shock: 1, chill: 1, freeze: 1, bleed: 1, poison: 1 },
    flatTakenAttack: [0, 0, 0, 0, 0],
    reflect: [0, 0, 0, 0, 0],
    reflectPhysPct: 0,
    leechRate: 1,
    noMovingBleed: false,
    dodgeAttack: 0,
    dodgeSpell: 0,
    ...over,
  };
}

/**
 * The open arena the training dummy stands in and a duel is fought in (docs/DUEL.md 4.2): a square of floor with one room (the
 * end room), no monsters and no chests; `start` is where the character stands, 8.5 tiles in from the west wall.
 */
export function arenaPlan(seed: number, size: number, areaLevel: number): MapPlan {
  const tiles = new Uint8Array(size * size);
  for (let y = 1; y < size - 1; y++) for (let x = 1; x < size - 1; x++) tiles[y * size + x] = FLOOR;
  const room = {
    id: 0,
    kind: 'end' as const,
    rect: { x: 1, y: 1, w: size - 2, h: size - 2 },
    cx: 15,
    cy: 15,
    pathIndex: 0,
  };
  const start = { x: 8.5, y: 15.5 };
  return {
    seed,
    map: 1,
    areaLevel,
    resistPenalty: 0,
    theme: themeDef('ashenCrypt'),
    biome: biomeDef('crypt'),
    density: densityDef('standard'),
    affixes: [],
    type: 'plain',
    difficulty: LEGACY,
    segment: 0,
    segments: 1,
    xpMult: themeDef('ashenCrypt').xpMult,
    endKind: 'rare',
    lab: {
      w: size,
      h: size,
      tiles,
      rooms: [room],
      mainPath: [0],
      waypoints: [{ ...start, room: 0 }],
      start,
      exit: { x: 27.5, y: 27.5 },
    },
    pop: { monsters: [], chests: [] },
  };
}

/** An open arena with the player and one stationary training dummy `distance` tiles away. */
export function createDummyWorld(
  build: Build,
  opts: {
    distance: number;
    defence?: Partial<Defence>;
    seed?: number;
    maxTime?: number;
    /** The arena's width and height in tiles (30 by default). */
    size?: number;
    /** What the dummy counts as (a boss makes the conditions of the rare and boss skills hold). */
    rarity?: Actor['rarity'];
    /** Other dummies standing just behind the first, so that a pack is near the character; the character still fights the first. */
    bystanders?: number;
    /** The dummies cannot be moved (pushed by the character, knocked back): the measuring tools set it. */
    fixed?: boolean;
    /** Turns the dummies about the character by this many radians, so that its minions are not stuck behind it in a line. */
    angle?: number;
  },
): { world: World; dummy: Actor } {
  const plan = arenaPlan(opts.seed ?? 1, opts.size ?? 30, build.level);
  const start = plan.lab.start;
  const world = createWorld({
    plan,
    build,
    xp: 0,
    opts: { maxTime: opts.maxTime ?? 600, freeResources: true, autoAbandonAt: Infinity },
  });
  const turn = opts.angle ?? 0;
  const stand = (dx: number, dy: number, name: string): Actor => {
    const d = spawnMonster(
      world,
      { type: 'warrior', variant: 'none', rarity: 'normal', level: 1, mods: [] },
      start.x + dx * Math.cos(turn) - dy * Math.sin(turn),
      start.y + dx * Math.sin(turn) + dy * Math.cos(turn),
      0,
      0,
      name,
    );
    d.dummy = true;
    d.def = dummyDefence(opts.defence);
    d.life = d.def.maxLife;
    d.r = 0.5;
    if (opts.fixed) d.stationary = true;
    return d;
  };
  const dummy = stand(opts.distance, 0, 'Training Dummy');
  if (opts.rarity) dummy.rarity = opts.rarity;
  // The others stand behind the first and well to the sides (still within a pack's reach of the character), so that the first is
  // the nearest to the character and to what it puts down, wherever those stand.
  for (let i = 0; i < (opts.bystanders ?? 0); i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const by = stand(
      opts.distance + 1.5 + Math.floor(i / 2) * 0.6,
      side * (3.2 + Math.floor(i / 2) * 0.8),
      'Bystander',
    );
    // They take nothing, so that what is measured is the damage to the one the character fights.
    by.def = dummyDefence({ immune: [true, true, true, true, true], immuneChaos: true });
  }
  return { world, dummy };
}
