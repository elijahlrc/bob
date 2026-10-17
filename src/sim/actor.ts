import { hexTotals } from '../data/hexes';
import type { Minion } from './minions';
import { NO_SUP } from './minionSup';
import type { Actor } from './types';
import { newMoveState } from './movement';

/**
 * A stand-in for an actor that acts from somewhere else (a deployable fires as the character from its own spot). It reads
 * whatever the actor has; what it sets on itself stays on it. The groups of timers are the exception that has to be made by
 * hand: a group is one object, so setting `since.hit` on the stand-in would set it on the actor.
 */
export function standIn(p: Actor): Actor {
  const a = Object.create(p) as Actor;
  a.since = { ...p.since };
  return a;
}

/**
 * A fresh actor with every field at its neutral value; callers fill in what makes it a player, monster or minion.
 *
 * Every actor, whatever it is, is made with the same fields in the same order (the monster's `mon` and the minion's own
 * fields included, unset). The sim's hot loops read actors of all three kinds; one shape for all keeps those reads
 * monomorphic, where three shapes (and more as fields were added later) made them polymorphic and deoptimised them again
 * in every new map.
 */
export function newActor(id: number, isPlayer: boolean, x: number, y: number, r: number): Actor {
  const a: Omit<Minion, 'side'> = {
    id,
    isPlayer,
    team: isPlayer ? 0 : 1,
    x,
    y,
    r,
    facing: 0,
    alive: true,
    life: 1,
    es: 0,
    mana: 0,
    def: undefined as never,
    action: null,
    carry: 0,
    handIdx: 0,
    ail: {
      ignites: [],
      igniteMax: 1,
      spreadEle: 0,
      bleeds: [],
      poisons: [],
      shock: 0,
      shockT: 0,
      chill: 0,
      chillT: 0,
      freezeT: 0,
      freezeGraceT: 0,
    },
    stunT: 0,
    graceT: 0,
    leech: { life: [], es: [], mana: [] },
    since: {
      damaged: 99,
      kill: 99,
      crit: 99,
      hit: 99,
      flask: 99,
      stunEnemy: 99,
      block: 99,
      beenHit: 99,
      overload: 99,
    },
    resShift: { v: [0, 0, 0, 0, 0], t: 0 },
    moving: false,
    name: '',
    rarity: 'player',
    modIds: [],
    room: -1,
    pack: -1,
    home: { x, y },
    state: 'idle',
    lostT: 0,
    noticeT: 0,
    noReward: false,
    raiserT: 8,
    slamT: 7,
    bossPhase: 0,
    summonedBy: 0,
    dummy: false,
    retreat: { t: 0, cd: 0 },
    risen: false,
    skillT: 5,
    blinkT: 0,
    shellBy: 0,
    phaseT: 0,
    hexes: [],
    fx: {},
    impales: [],
    sdots: [],
    hex: {
      res: [0, 0, 0, 0, 0],
      vulnAll: 0,
      vuln: 0,
      dmg: 1,
      speed: 1,
      more: hexTotals([]),
      cd: 0,
    },
    choir: { buffT: 0, zealT: 0, fervour: 0, fervourT: 0 },
    channelT: 0,
    chase: { blockT: 0, prevX: x, prevY: y, tryTick: -1, pathT: 0, nextX: 0, nextY: 0 },
    rhythm: { beat: 0, restT: 0, patMult: 1, enraged: false },
    phaseMask: 0,
    mirror: { id: 0, t: 0 },
    strandT: 0,
    pulseT: 8,
    phases: false,
    mv: newMoveState(),
    revealT: 0,
    burrowT: 0,
    flies: false,
    stationary: false,
    curlT: 0,
    hold: false,
    patrol: null,
    abT: [],
    enc: undefined,
    dash: { t: 0, windT: 0, v: 0, x: 0, y: 0 },
    theft: { fleeT: 0, stolen: 0, stolenFlask: 0 },
    suppressT: 0,
    mark: { x: 0, y: 0 },
    mon: undefined,
    key: '',
    kind: undefined as never,
    t: 0,
    atkT: 0,
    level: 0,
    dmg: 0,
    speed: 0,
    boomed: false,
    mtype: undefined,
    fixedHit: undefined,
    fixedRate: undefined,
    sup: NO_SUP,
    golem: undefined,
    bodyDef: undefined,
    defKey: undefined,
  };
  // `side` is set after the literal, not in it: this literal has 127 properties, and V8 makes one of 128 or more much slower to
  // build (the sim ran about 15% slower with `side` among them; the same property added afterwards costs nothing). Do not add a
  // 128th field above; set it here, or group fields into a sub-object.
  const actor = a as Minion;
  actor.side = null;
  return actor;
}
