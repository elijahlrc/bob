import type { Defence } from '../calc/combat';
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
    maxLife: 1e12,
    maxEs: 0,
    maxMana: 0,
    armour: 0,
    evasion: 0,
    blockAttack: 0,
    blockSpell: 0,
    res: [0, 0, 0, 0, 0],
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
    physTakenAs: [0, 0, 0, 0, 0],
    damageTakenType: [1, 1, 1, 1, 1],
    unaffectedByShock: false,
    cannotBeLeechedFrom: false,
    immuneAilments: false,
    immune: [false, false, false, false, false],
    ...over,
  };
}

/** An open arena with the player and one stationary training dummy `distance` tiles away. */
export function createDummyWorld(
  build: Build,
  opts: { distance: number; defence?: Partial<Defence>; seed?: number; maxTime?: number },
): { world: World; dummy: Actor } {
  const size = 30;
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
  const plan: MapPlan = {
    seed: opts.seed ?? 1,
    map: 1,
    areaLevel: build.level,
    resistPenalty: 0,
    theme: themeDef('ashenCrypt'),
    affixes: [],
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
  const world = createWorld({
    plan,
    build,
    xp: 0,
    opts: { maxTime: opts.maxTime ?? 600, freeResources: true },
  });
  const dummy = spawnMonster(
    world,
    { type: 'warrior', variant: 'none', rarity: 'normal', level: 1, mods: [] },
    start.x + opts.distance,
    start.y,
    0,
    0,
    'Training Dummy',
  );
  dummy.dummy = true;
  dummy.def = dummyDefence(opts.defence);
  dummy.life = dummy.def.maxLife;
  dummy.r = 0.5;
  return { world, dummy };
}
