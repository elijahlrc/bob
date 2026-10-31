import { mapPlayerMods } from './mapMods';
import { hasRelic } from '../calc/relics';
import { BRIMMING_FADE } from '../data/runRewards';
import { COLD } from '../calc/skill';
import { MONSTER_TYPES } from '../data/monsters';
import { reservedMana } from './reserve';
import { tickPhases } from './phases';
import { Character } from '../calc/character';
import { noCharges, type ChargeCounts } from '../calc/charges';
import { buildMonster, scaleOf, type MonsterSpec } from '../calc/monster';
import { mix32 } from '../core/hash';
import { Rng } from '../core/rng';
import { DT } from '../data/constants';
import { MAX_LEVEL, xpToNext } from '../data/xpTable';
import type { Build } from '../data/types';
import type { MapPlan } from '../gen/mapPlan';
import { monsterName } from '../gen/population';
import { actorById, tickSkillZones, updateAction, updateProjectiles } from './actions';
import { monsterAI, playerAI, separate } from './ai';
import { lifeCap, monsterHitOf, rawHit, refreshPlayerDefence, tickActor } from './combat';
import { autoFlaskPolicy, type FlaskPolicy } from './flaskPolicy';
import { abilitiesOf, RIME_AURA_RANGE } from '../data/abilities';
import { cue, healed } from './cues';
import { tickAbilities, tickChargingMod } from './abilities';
import {
  isZone,
  openZone,
  pullPlayer,
  tickCorpses,
  tickFactionBehaviour,
  tickZones,
} from './factions';
import { BUFF_IDS, type BuffId } from '../data/buffs';
import { rollGains, tickBuffs } from './buffs';
import { tickCooldowns } from './cooldowns';
import { tickChannel } from './channel';
import { tickBanner } from './banners';
import { tickCaught, tickWarp, tickWither } from './blinks';
import { tickLegion, tickOffering } from './minionFx';
import { tickSupports } from './supportFx';
import { tickSkillFx } from './skillFx';
import { recompute, tickCurseAura } from './hexes';
import { tickBerserk, tickDegen, tickStance } from './stances';
import { tickProliferation } from './proliferate';
import { tickFields, tickLobbed } from './fields';
import { tickShots } from './shots';
import { tickDeployables } from './deploy';
import { tickMinions } from './minions';
import { tickAuraBurn } from './utility';
import { rebuildCharacter, seedCharacters, tickCharges } from './charges';
import { tickTriggers } from './triggers';
import { noteRecover, tickRecover } from './recovery';
import { Grid } from './grid';
import { newActor } from './actor';
import { newLedger } from './ledger';
import { tickAbandon } from './abandon';
import { duelStage, newReprieveState, tickReprieve } from './reprieve';
import { tickCollapse } from './collapse';
import { tickHoldout } from './holdout';
import { tickStranded } from './strand';
import { initEncounter, tickEncounter } from './encounters';
import { tickBlinking, tickStep } from './steps';
import { tickPackPlays } from './packPlays';
import { inBlast, pending } from './blasts';
import { afflictPlayer, stunPlayer } from './afflict';
import { flasksSealed } from './theft';
import { bossFlaskRecovery } from './bosses';
import { crescendoStep, HOLDOUT_WAVES } from '../data/mapTypes';
import type { Actor, GroundEffect, MapOpts, World, WorldOpts } from './types';
import { hunted } from './side';
import type { Side, SideOpts } from './side';

export function spawnMonster(
  w: World,
  spec: MonsterSpec,
  x: number,
  y: number,
  room: number,
  pack: number,
  name: string,
): Actor {
  const stats = buildMonster(spec);
  const def = MONSTER_TYPES[spec.type];
  // Whatever placed it, a walker never starts where the character cannot reach (in a wall, or outside the map): it is
  // set down on the nearest spot that can be reached. A flier or phaser may hover over a wall, but not off the map.
  const walker = !def.flies && !def.movement?.some((s) => s.id === 'phase');
  const onMap = x >= 0 && y >= 0 && x < w.grid.w && y < w.grid.h;
  if (walker ? !w.grid.reachable(x, y) : !onMap) {
    const at = w.grid.nearestReachable(x, y);
    if (at) {
      x = at.x;
      y = at.y;
    }
  }
  const a = newActor(w.nextId++, false, x, y, stats.radius);
  a.mon = stats;
  a.def = stats.defence;
  a.life = stats.defence.maxLife;
  a.es = stats.defence.maxEs;
  a.name = name;
  a.rarity = spec.rarity;
  a.modIds = spec.mods;
  a.flies = !!MONSTER_TYPES[spec.type].flies;
  a.phases = !!MONSTER_TYPES[spec.type].movement?.some((s) => s.id === 'phase');
  const momentum = MONSTER_TYPES[spec.type].movement?.find((s) => s.id === 'momentum');
  if (momentum) a.mv.ramp = momentum.from ?? 0.5;
  a.stationary = !!MONSTER_TYPES[spec.type].stationary;
  if (spec.type === 'pylon') w.hasPylons = true;
  initEncounter(w, a);
  a.room = room;
  a.pack = pack;
  w.actors.push(a);
  return a;
}

/** One character of a world (docs/DUEL.md 4.1): what it brings, and where it stands. */
export type SideInput = {
  build: Build;
  x: number;
  y: number;
  /** Experience carried in (a map passes the run's); default 0. */
  xp?: number;
  /** What the character brings: its starting vitals, and whether it can die or runs out of life and mana. */
  opts?: SideOpts;
  /** The level of the area the character is built for (the plan's when absent; a duel builds each at its own level). */
  areaLevel?: number;
  /** What the recap calls the character (`You` for the first side, `Rival` for the rest by default). */
  name?: string;
};

/**
 * A world with any number of characters. Side `i` is made with the actor id `i + 1`; its team is 0 for the first, then 2, 3, ...
 * (the monsters are team 1), and the characters face one another.
 */
export type CreateWorldInput = {
  plan: MapPlan;
  sides: SideInput[];
  /** What the map decides; what each character brings is in its own `opts`. */
  opts?: WorldOpts;
};

/** The call a map makes: the run's one character, at the plan's start, and one bag of options that `createWorld` splits. */
export type MapWorldInput = {
  plan: MapPlan;
  build: Build;
  /** Carried-over experience from camp. */
  xp: number;
  opts?: MapOpts;
};

export function makeCharacter(
  build: Build,
  plan: MapPlan,
  charges: ChargeCounts = noCharges(),
  areaLevel: number = plan.areaLevel,
): Character {
  return new Character(build, {
    areaLevel,
    resistPenalty: plan.resistPenalty,
    extraMods: mapPlayerMods(plan, build, areaLevel),
    charges,
  });
}

/** The team of a side: 0 for the first, then 2, 3, ... (the monsters are `MONSTERS`, 1). */
export const teamOfSide = (id: number): number => (id === 0 ? 0 : id + 1);

/** A side and its character's actor, with every field at its start (the vitals as the input says, or full). */
function makeSide(plan: MapPlan, id: number, inp: SideInput): Side {
  const build = { ...inp.build };
  const areaLevel = inp.areaLevel ?? plan.areaLevel;
  const char = makeCharacter(build, plan, noCharges(), areaLevel);
  const player = newActor(id + 1, true, inp.x, inp.y, 0.4);
  const o = inp.opts;
  const side: Side = {
    id,
    team: teamOfSide(id),
    flasks: char.flasks.map((spec) => ({
      spec,
      charges: spec.maxCharges,
      activeT: 0,
      queued: false,
      lifeRate: 0,
      manaRate: 0,
      esRate: 0,
      esT: 0,
      uses: 0,
    })),
    ai: {
      // A duel has no waypoints to advance along: the character starts out engaging (docs/DUEL.md 3.4).
      mode: o?.duel ? 'engage' : 'advance',
      wp: 0,
      path: [],
      pathKey: '',
      pathT: 0,
      targetId: 0,
      scanT: 0,
      blocked: 0,
      blockedT: 0,
      repoT: 0,
      watchId: 0,
      watchLife: 0,
      watchT: 0,
      aimHits: 0,
      strayHits: 0,
      skipId: 0,
      skipUntil: 0,
      stuckT: 0,
      stuckX: inp.x,
      stuckY: inp.y,
      lootId: 0,
      lootT: 0,
      fight: 0,
      lastEngaged: -1e9,
      kiteT: 0,
      kiteX: 0,
      kiteY: 0,
      kiteCd: 0,
      dodgeT: 0,
      dodgeRest: 0,
    },
    stats: {
      kills: 0,
      rares: 0,
      xpGained: 0,
      stuck: 0,
      stalls: 0,
      kites: 0,
      wallBlocked: 0,
      picked: 0,
      damageTaken: 0,
      damageDealt: 0,
    },
    ledger: newLedger(),
    dmgLog: [],
    reprieve: newReprieveState(o?.reprieves),
    xp: inp.xp ?? 0,
    picked: [],
    opts: {
      start: o?.start,
      freeResources: o?.freeResources,
      godMode: o?.godMode,
      reprieves: o?.reprieves,
      duel: o?.duel,
    },
    // A duel's first life has its own share of the duel's modifiers (`duelStage`).
    ...duelStage(o?.duel, 0),
    chargeT: { grit: 0, fervour: 0, insight: 0 },
    buffT: {
      ...Object.fromEntries(BUFF_IDS.map((b) => [b, 0])),
      // Everyone starts in the Blood stance.
      bloodStance: 1e9,
    } as Record<BuffId, number>,
    rage: 0,
    rageT: 0,
    rageDrain: 0,
    rageGainT: -1,
    trophy: {},
    trig: {
      cooldown: {},
      taken: {},
      next: {},
      busy: false,
      explosions: 0,
      queue: [],
      draining: false,
    },
    secondaryReady: {},
    guard: null,
    cooldowns: {},
    utilityReady: {},
    openers: {},
    auraBurnT: 0,
    berserkT: 0,
    chars: new Map(),
    deployables: [],
    deploySeq: 0,
    minions: [],
    fields: [],
    zones: [],
    banner: null,
    offering: null,
    warp: null,
    wither: null,
    caught: null,
    uses: {},
    intensity: {},
    intensityT: {},
    seals: {},
    mirage: null,
    inspireMana: 0,
    infusing: null,
    shockCd: {},
    inShock: false,
    critLock: null,
    critSeen: false,
    elem: 3,
    elemLast: 0,
    staticFx: null,
    shell: null,
    virulence: 0,
    surgeMana: 0,
    relicRegen: { t: 0, me: 0, minions: 0 },
    relicT: -1,
    trailT: 0,
    vortex: null,
    markers: [],
    stormOrb: null,
    fuses: [],
    spores: [],
    charged: {},
    inFx: false,
    lastTravel: 0,
    channel: null,
    stacks: null,
    hitsLanded: 0,
    shots: [],
    lobbed: [],
    lastOutcome: null,
    player,
    char,
    build,
    primary: char.primary,
    areaLevel,
  };
  player.side = side;
  player.team = side.team;
  player.def = char.defence(undefined, undefined, side.lifeMult);
  // The character starts with what the last map left (full on a new run), as fractions of the maximum.
  const frac = (f: number | undefined) => Math.min(1, Math.max(0, f ?? 1));
  player.life = Math.max(1, lifeCap(player) * frac(o?.start?.life));
  player.es = player.def.maxEs * frac(o?.start?.es);
  player.mana = Math.max(0, player.def.maxMana - char.reservedMana) * frac(o?.start?.mana);
  // A provision may fill them first (Tapper's Brine).
  const full = char.db.flag('flaskStartFull');
  for (const f of side.flasks)
    f.charges = f.spec.maxCharges * (full ? 1 : frac(o?.start?.flasks[f.spec.uid]));
  player.name = inp.name ?? (id === 0 ? 'You' : 'Rival');
  seedCharacters(side);
  return side;
}

export function createWorld(inp: CreateWorldInput | MapWorldInput): World {
  const { plan } = inp;
  const root = new Rng(plan.seed);
  const grid = new Grid(plan.lab.w, plan.lab.h, plan.lab.tiles);
  grid.markReach(plan.lab.start.x, plan.lab.start.y);
  // A map brings its one character, to the plan's start; the bag of options is split between the world and that character.
  const inputs: SideInput[] =
    'sides' in inp
      ? inp.sides
      : [
          {
            build: inp.build,
            x: plan.lab.start.x,
            y: plan.lab.start.y,
            xp: inp.xp,
            opts: inp.opts,
          },
        ];
  const sides = inputs.map((si, i) => makeSide(plan, i, si));
  // The characters face one another (the first of the others, when there are more than two).
  if (sides.length > 1)
    for (const s of sides) {
      const o = sides[s.id === 0 ? 1 : 0].player;
      s.player.facing = Math.atan2(o.y - s.player.y, o.x - s.player.x);
    }
  const w: World = {
    plan,
    grid,
    sides,
    order: sides,
    orderSeed: 0,
    t: 0,
    tick: 0,
    rngCombat: root.fork('combat'),
    rngAi: root.fork('ai'),
    rngLoot: root.fork('loot'),
    rngTrig: root.fork('trigger'),
    actors: sides.map((s) => s.player),
    nextId: sides.length + 1,
    projectiles: [],
    effects: [],
    corpses: [],
    hasPylons: false,
    blasts: [],
    drops: [],
    chests: plan.pop.chests.map((c, i) => ({
      id: 100000 + i,
      x: c.x,
      y: c.y,
      room: c.room,
      opened: false,
    })),
    events: [],
    status: 'running',
    abandonT: null,
    abandonAuto: false,
    surge: 0,
    collapseFront: 0,
    collapseGap: Infinity,
    holdout: { spawned: 0, cleared: 0, done: [], ids: [] },
    exitOpen: false,
    endRoom: plan.lab.mainPath[plan.lab.mainPath.length - 1],
    opts: inp.opts ?? {},
  };
  for (const s of plan.pop.monsters) {
    const a = spawnMonster(w, s.spec, s.x, s.y, s.room, s.pack, s.name);
    // A Stalker Cat lies in wait wherever it is; a pack that is an Ambush does so as a whole.
    if (s.hold || abilitiesOf(s.spec.type).some((x) => x.id === 'ambush')) a.hold = true;
    if (s.patrol) a.patrol = { points: s.patrol.map((p) => ({ ...p })), i: 1 };
  }
  return w;
}

/** Rebuild the character after a level-up, keeping resource fractions. */
function levelUp(w: World, s: Side): void {
  const p = s.player;
  const lf = p.life / Math.max(1, lifeCap(p));
  const mf = p.def.maxMana > 0 ? p.mana / p.def.maxMana : 1;
  const ef = p.def.maxEs > 0 ? p.es / p.def.maxEs : 1;
  s.build = { ...s.build, level: s.build.level + 1 };
  rebuildCharacter(w, s);
  s.flasks.forEach((f, i) => {
    if (s.char.flasks[i]) f.spec = s.char.flasks[i];
  });
  refreshPlayerDefence(w, s);
  p.life = lf * lifeCap(p);
  p.mana = mf * p.def.maxMana;
  p.es = ef * p.def.maxEs;
  w.events.push({ t: 'levelUp', src: p.id, level: s.build.level });
}

/** Seconds over which a life-to-ES flask returns the life it took. */
const LIFE_TO_ES_TIME = 2;
/** The ground a flask leaves: its reach in tiles, the chill of chilled ground (a fraction) and the blind of a smoke cloud. */
const FLASK_GROUND_RADIUS = 2;
const FLASK_GROUND_CHILL = 0.1;
const FLASK_SMOKE_BLIND = 50;

function useFlask(w: World, side: Side, i: number): void {
  const f = side.flasks[i];
  const p = side.player;
  // The Unmaker holds the flasks (docs/BOSSES.md 9).
  if (f.charges < f.spec.perUse || flasksSealed(w)) return;
  const s = f.spec;
  if (s.kind === 'life' || s.kind === 'hybrid' || s.kind === 'mana') {
    if (f.activeT > 0) {
      if (f.queued) return;
      f.queued = true;
    } else if (s.instant) {
      const l0 = p.life;
      const heal = s.life * bossFlaskRecovery(w, p);
      p.life = Math.min(lifeCap(p), p.life + heal);
      noteRecover(p, 'life', p.life - l0);
      brim(side, l0 + heal - p.life);
    } else {
      f.activeT = s.duration;
      f.lifeRate = s.life / s.duration;
      f.manaRate = s.mana / s.duration;
    }
  } else {
    if (f.activeT > 0) return;
    f.activeT = s.duration;
  }
  if (s.lifeToEs) {
    // All but 1 life is turned into energy shield, which comes back over two seconds.
    const removed = Math.max(0, p.life - 1);
    p.life = Math.min(p.life, 1);
    f.esRate = Math.min(removed, Math.max(0, p.def.maxEs - p.es)) / LIFE_TO_ES_TIME;
    f.esT = LIFE_TO_ES_TIME;
  }
  // Ground left where the character stands, for as long as the flask runs (the Sanctum, Chillwake and Smokeveil Draughts).
  if (s.ground) {
    const r = FLASK_GROUND_RADIUS;
    side.fields.push({
      id: w.nextId++,
      owner: p.id,
      kind: s.ground,
      x: p.x,
      y: p.y,
      r0: r,
      grow: 1,
      radius: r,
      t: s.duration,
      total: s.duration,
      hand: 0,
      pulseT: 0,
      interval: 0.5,
      dps: s.ground === 'smoke' ? FLASK_SMOKE_BLIND : 0,
      dtype: s.ground === 'chilling' ? COLD : 0,
      ...(s.ground === 'chilling' ? { chill: FLASK_GROUND_CHILL } : {}),
    });
  }
  // A buff held for as long as the flask runs (the Onrush Draught's Quickened).
  if (s.grants) {
    side.buffT[s.grants] = Math.max(side.buffT[s.grants], s.duration);
    w.events.push({ t: 'buff', id: s.grants });
  }
  f.charges -= s.perUse;
  f.uses++;
  p.since.flask = 0;
  // What the flask takes off (for the renderer): only the ailments that were there.
  const cleansed: string[] = [];
  if (s.removeIgnite && p.ail.ignites.length > 0) cleansed.push('ignite');
  if (s.removeBleed && p.ail.bleeds.length > 0) cleansed.push('bleed');
  if (s.removeFreeze && (p.ail.freezeT > 0 || p.ail.chill > 0)) cleansed.push('freeze');
  if (s.removePoison && p.ail.poisons.length > 0) cleansed.push('poison');
  if (s.removeShock && p.ail.shock > 0) cleansed.push('shock');
  if (s.removeCurse && p.hexes.length > 0) cleansed.push('curse');
  if (s.removeIgnite) p.ail.ignites.length = 0;
  if (s.removeBleed) p.ail.bleeds.length = 0;
  if (s.removeFreeze) {
    p.ail.freezeT = 0;
    p.ail.chill = 0;
  }
  if (s.removePoison) p.ail.poisons.length = 0;
  if (s.removeShock) {
    p.ail.shock = 0;
    p.ail.shockT = 0;
  }
  if (s.removeCurse && p.hexes.length > 0) {
    p.hexes.length = 0;
    recompute(p);
  }
  w.events.push({
    t: 'flaskUsed',
    src: p.id,
    idx: i,
    ...(cleansed.length > 0 ? { cleansed } : {}),
  });
  rollGains(w, side, 'flask');
}

/**
 * The Brimming Ward (relic 5): flask healing past full life becomes energy shield, up to the character's own; with none of
 * its own, a shield that fades (`brim`), at most as large as its life.
 */
function brim(side: Side, over: number): void {
  if (over <= 0 || !hasRelic(side.build, 'brimmingWard')) return;
  const p = side.player;
  if (p.def.maxEs > 0) p.es = Math.min(p.def.maxEs, p.es + over);
  else p.brim = Math.min(p.def.maxLife, (p.brim ?? 0) + over);
}

function tickFlasks(w: World, s: Side, dt: number, policy: FlaskPolicy): void {
  const p = s.player;
  if (p.brim) p.brim = Math.max(0, p.brim - (p.brim * BRIMMING_FADE + 1) * dt);
  for (const i of policy(w, s)) useFlask(w, s, i);
  // A boss fight may cut what flasks give (docs/ATTRITION.md): the Magistrate's Witnesses, the Rotwife's poison.
  const k = bossFlaskRecovery(w, p);
  for (const f of s.flasks) {
    if (f.esT > 0) {
      const e0 = p.es;
      p.es = Math.min(p.def.maxEs, p.es + f.esRate * Math.min(dt, f.esT));
      noteRecover(p, 'es', p.es - e0);
      f.esT -= dt;
      if (f.esT <= 0) {
        f.esT = 0;
        f.esRate = 0;
      }
    }
    if (f.activeT <= 0) continue;
    const step = Math.min(dt, f.activeT);
    f.activeT -= dt;
    const l0 = p.life;
    const m0 = p.mana;
    if (f.lifeRate) {
      const heal = f.lifeRate * step * k;
      p.life = Math.min(lifeCap(p), p.life + heal);
      brim(s, l0 + heal - p.life);
    }
    if (f.manaRate)
      p.mana = Math.min(p.def.maxMana - reservedMana(s), p.mana + f.manaRate * step * k);
    noteRecover(p, 'life', p.life - l0);
    noteRecover(p, 'mana', p.mana - m0);
    if (f.activeT <= 0) {
      f.activeT = 0;
      if (f.queued) {
        f.queued = false;
        f.activeT = f.spec.duration;
      } else {
        f.lifeRate = 0;
        f.manaRate = 0;
      }
    }
  }
}

/** The name of the monster that laid a ground effect (for the death recap), if it is still known. */
function viaOf(w: World, e: GroundEffect): string | undefined {
  return e.owner === undefined ? undefined : actorById(w, e.owner)?.name;
}

function tickEffects(w: World, dt: number): void {
  let j = 0;
  for (const e of w.effects) {
    // A later step of a pattern waits before its warning shows.
    if (pending(e)) {
      e.delay! -= dt;
      w.effects[j++] = e;
      continue;
    }
    // A blow that follows the character until it lands (a Sentence).
    if (e.follow) {
      const p = hunted(w, e);
      if (p.alive) {
        e.x = p.x;
        e.y = p.y;
      }
    }
    e.t -= dt;
    if (e.t > 0) {
      w.effects[j++] = e;
      continue;
    }
    // A lasting zone just fades.
    if (isZone(e)) continue;
    // What an effect strikes: the characters of the other teams, and their minions.
    if (e.shape) {
      // A shaped blast (docs/ENCOUNTERS.md 4): it strikes what its shape covers, drags what a hook catches, and may leave
      // ground behind.
      w.events.push({ t: 'blast', e });
      for (const s of w.sides) {
        if (s.team === e.team) continue;
        const p = s.player;
        const caught = p.alive && inBlast(e, p.x, p.y, p.r);
        if (caught && e.damage > 0)
          rawHit(w, p, e.damage, e.dtype, null, e.label ?? 'Blast', 'player', viaOf(w, e));
        // What a boss's blast does besides damage (docs/BOSSES.md): a Sentence stuns, a toll shocks.
        if (caught && p.alive && e.stun) stunPlayer(w, s, e.stun);
        if (caught && p.alive && e.afflict)
          afflictPlayer(w, s, e.afflict.kind, e.afflict.value, e.afflict.seconds, true);
        if (caught && p.alive && e.trample)
          for (const f of s.flasks) f.charges = Math.max(0, f.charges - f.spec.perUse * e.trample);
        const owner = e.pull && caught ? actorById(w, e.owner ?? 0) : undefined;
        if (owner?.alive) pullPlayer(w, s, owner, e.pull!);
        for (const m of s.minions)
          if (m.alive && inBlast(e, m.x, m.y, m.r))
            rawHit(w, m, e.damage, e.dtype, null, e.label ?? 'Blast');
      }
      if (e.leaves) openZone(w, e.x, e.y, e.radius, e.leaves.seconds, e.leaves.kind, e.leaves.dps);
      continue;
    }
    // A mark that hurts nothing and throws nothing (the dot a charge or a leap was aimed at) goes off as a dud.
    const dud = e.damage <= 0 && !e.push;
    w.events.push({
      t: 'explode',
      x: e.x,
      y: e.y,
      r: e.radius,
      dtype: e.dtype,
      ...(dud ? { dud: true } : {}),
    });
    const label = e.label ?? (e.kind === 'slam' ? 'Crushing slam' : 'Volatile explosion');
    for (const s of w.sides) {
      if (s.team === e.team) continue;
      const p = s.player;
      // A warding pulse throws the character back, away from where it went off.
      if (e.push && p.alive && Math.hypot(p.x - e.x, p.y - e.y) <= e.radius + p.r) {
        const ang = Math.atan2(p.y - e.y, p.x - e.x);
        const to = w.grid.collide(p.x + Math.cos(ang) * e.push, p.y + Math.sin(ang) * e.push, p.r);
        const x0 = p.x;
        const y0 = p.y;
        p.x = to.x;
        p.y = to.y;
        if (Math.hypot(p.x - x0, p.y - y0) > 0.05)
          w.events.push({
            t: 'push',
            src: e.owner ?? 0,
            dst: p.id,
            x: x0,
            y: y0,
            x2: p.x,
            y2: p.y,
            ox: e.x,
            oy: e.y,
            r: e.radius,
          });
      }
      if (e.damage > 0 && p.alive && Math.hypot(p.x - e.x, p.y - e.y) <= e.radius + p.r)
        rawHit(w, p, e.damage, e.dtype, null, label, 'player', viaOf(w, e));
      // The character's minions standing in a monster's blast are hurt too.
      if (e.team === 1)
        for (const m of s.minions)
          if (m.alive && Math.hypot(m.x - e.x, m.y - e.y) <= e.radius + m.r)
            rawHit(w, m, e.damage, e.dtype, null, label);
    }
  }
  w.effects.length = j;
}

/** Behaviours driven by monster mods (§12.5). The bosses are `sim/bosses.ts` (docs/BOSSES.md). */
function tickMonsterMods(w: World, m: Actor, dt: number): void {
  tickStep(w, m, dt);
  if (m.state !== 'chase') return;
  const p = hunted(w, m);
  if (
    m.modIds.includes('rimeAura') &&
    Math.hypot(p.x - m.x, p.y - m.y) <= RIME_AURA_RANGE &&
    !p.def.cannotBeChilled
  ) {
    if (p.ail.chill <= 0.15) {
      p.ail.chill = 0.15;
      p.ail.chillT = Math.max(p.ail.chillT, 0.25);
    }
  }
  if (m.modIds.includes('charging')) tickChargingMod(w, m, dt);
  if (m.modIds.includes('blinking')) tickBlinking(w, m, dt);
  if (m.modIds.includes('wardingPulse')) {
    m.pulseT -= dt;
    if (m.pulseT <= 0) {
      m.pulseT = 8;
      w.effects.push({
        id: w.nextId++,
        x: m.x,
        y: m.y,
        radius: 3,
        t: 1,
        total: 1,
        kind: 'slam',
        damage: 0.6 * monsterHitOf(m),
        dtype: 0,
        team: 1,
        owner: m.id,
        push: 3,
      });
    }
  }
  if (m.modIds.includes('mirrored') && m.mirror.id === 0) {
    // The twin stands some way off, with everything but the mirror.
    const spec = m.mon!.spec;
    // Six tiles off at the first angle that is open floor in sight of it (six tiles can be a wall or another room).
    const ang0 = w.rngAi.float(0, Math.PI * 2);
    let pos = { x: m.x, y: m.y };
    for (let k = 0; k < 16; k++) {
      const ang = ang0 + (k * Math.PI) / 8;
      const tx = m.x + Math.cos(ang) * 6;
      const ty = m.y + Math.sin(ang) * 6;
      if (w.grid.clear(tx, ty) && w.grid.reachable(tx, ty) && w.grid.los(m.x, m.y, tx, ty)) {
        pos = { x: tx, y: ty };
        break;
      }
    }
    const twin = spawnMonster(
      w,
      { ...spec, mods: spec.mods.filter((id) => id !== 'mirrored') },
      pos.x,
      pos.y,
      m.room,
      m.pack,
      m.name,
    );
    twin.state = 'chase';
    twin.mirror.id = m.id;
    m.mirror.id = twin.id;
    w.events.push({ t: 'twin', id: twin.id, of: m.id });
  }
  if (m.mirror.t > 0) {
    m.mirror.t -= dt;
    // The twin did not follow in time: the survivor is made whole, and the pair is no more.
    if (m.mirror.t <= 0) {
      const hurt = m.life < m.def.maxLife;
      m.life = m.def.maxLife;
      m.mirror.id = 0;
      cue(w, 'whole', m, 0);
      if (hurt) healed(w, m);
    }
  }
  if (m.modIds.includes('raiser')) {
    m.raiserT -= dt;
    if (m.raiserT <= 0) {
      m.raiserT = 8;
      const alive = w.actors.filter((a) => a.alive && a.summonedBy === m.id).length;
      for (let k = 0; k < Math.min(2, 6 - alive); k++) summon(w, m, 'warrior', m.mon!.spec.variant);
    }
  }
}

function summon(w: World, m: Actor, type: 'warrior', variant: MonsterSpec['variant']): void {
  const spec: MonsterSpec = {
    type,
    variant,
    rarity: 'normal',
    level: m.mon!.spec.level,
    mods: [],
    ...scaleOf(m.mon!.spec),
  };
  const ang = w.rngAi.float(0, Math.PI * 2);
  const pos = w.grid.collide(m.x + Math.cos(ang) * 1.2, m.y + Math.sin(ang) * 1.2, 0.4);
  const a = spawnMonster(w, spec, pos.x, pos.y, m.room, m.pack, monsterName(spec, w.rngAi));
  a.noReward = true;
  a.summonedBy = m.id;
  a.state = 'chase';
  w.events.push({ t: 'summon', id: a.id });
}

function checkExit(w: World): void {
  if (w.exitOpen || w.opts.noExit) return;
  // A Holdout is over when the last wave has come and gone.
  if (w.plan.type === 'holdout' && w.holdout.spawned < HOLDOUT_WAVES) return;
  for (const a of w.actors)
    if (!a.isPlayer && a.alive && a.room === w.endRoom && !a.noReward) return;
  // A Quarry opens its exit only when every champion has fallen, wherever it stood.
  if (w.plan.type === 'quarry' && w.actors.some((a) => a.alive && a.rarity === 'miniboss')) return;
  w.exitOpen = true;
  w.events.push({ t: 'exitOpen' });
}

const flowFrom: Actor[] = [];
/**
 * The characters the monsters' flow field leads to: every living one (all of them when none lives, as `hunted` falls back to the
 * first), and on a map the one character, alive or not. The list is reused: the grid copies the tiles it needs.
 */
function flowOrigins(w: World): Actor[] {
  flowFrom.length = 0;
  for (const s of w.sides) if (w.sides.length === 1 || s.player.alive) flowFrom.push(s.player);
  if (flowFrom.length === 0) for (const s of w.sides) flowFrom.push(s.player);
  return flowFrom;
}

/** The sides reversed, one array for each world's `sides` (an odd tick would otherwise allocate). */
const reversedSides = new WeakMap<Side[], Side[]>();

/**
 * The sides in the order they act in the tick `w.tick` (docs/DUEL.md 3.3, 4.4): in turn, or reversed when a mix of the tick and
 * `w.orderSeed` is odd, so that the side that strikes first in a tie is not the same one at every exchange of a fight (the parity
 * of the tick would be, for two characters of one rhythm). Deterministic from the tick and the seed. With one side (a map) it is
 * `w.sides` itself, always.
 */
function sidesInOrder(w: World): Side[] {
  if (w.sides.length < 2 || (mix32(w.tick + Math.imul(w.orderSeed, 0x9e3779b1)) & 1) === 0)
    return w.sides;
  let r = reversedSides.get(w.sides);
  if (!r || r.length !== w.sides.length) {
    r = [...w.sides].reverse();
    reversedSides.set(w.sides, r);
  }
  return r;
}

/** Advance the world by one fixed tick (§8.2). */
export function stepWorld(w: World, policy: FlaskPolicy = autoFlaskPolicy): void {
  if (w.status !== 'running') return;
  w.events.length = 0;
  const dt = DT;
  w.t += dt;
  w.tick++;
  w.order = sidesInOrder(w);
  if (w.plan.type === 'crescendo') w.surge = crescendoStep(w.t);
  for (const s of w.order) refreshPlayerDefence(w, s);
  for (const s of w.order) tickHoldout(w, s);
  for (const s of w.order) tickTriggers(w, s, dt);
  for (const s of w.order) tickCharges(w, s, dt);
  for (const s of w.order) tickCooldowns(w, s, dt);
  for (const s of w.order) tickBuffs(s, dt);
  for (const s of w.order) tickAuraBurn(w, s, dt);
  for (const s of w.order) tickDeployables(w, s, dt);
  for (const s of w.order) tickMinions(w, s, dt);
  for (const s of w.order) tickSkillZones(w, s, dt);
  for (const s of w.order) tickFlasks(w, s, dt, policy);
  // Flow field for monsters follows the characters' tiles: one search from every living character, so that each tile leads to
  // the nearest by path (the character a monster hunts is the nearest in a straight line: across a wall the two can differ).
  w.grid.buildFlow(flowOrigins(w));
  // The actors step in id order, the characters (the first of `w.actors`, one for each side) in the order of this tick's sides and
  // the monsters after them as they are (docs/DUEL.md 3.3). The list is read live: what is spawned in the loop is reached.
  const actors = w.actors;
  const characters = w.sides.length;
  for (let i = 0; i < actors.length; i++) {
    const a = i < characters ? w.order[i].player : actors[i];
    if (!a.alive) continue;
    tickActor(w, a, dt);
    if (!a.alive) continue;
    updateAction(w, a, dt);
    if (a.isPlayer) playerAI(w, a.side!, dt);
    else {
      monsterAI(w, a, dt);
      tickPhases(w, a);
      tickMonsterMods(w, a, dt);
      if (a.state === 'chase') {
        tickFactionBehaviour(w, a, dt);
        tickAbilities(w, a, dt);
        if (a.enc) tickEncounter(w, a, dt);
      }
    }
    if (!a.action) a.carry = 0;
  }
  for (const s of w.order) tickPackPlays(w, s, dt);
  for (const s of w.order) tickShots(w, s);
  for (const s of w.order) tickLobbed(w, s);
  for (const s of w.order) tickChannel(w, s);
  for (const s of w.order) tickFields(w, s, dt);
  for (const s of w.order) tickBanner(w, s, dt);
  for (const s of w.order) tickWarp(w, s, dt);
  for (const s of w.order) tickWither(w, s);
  for (const s of w.order) tickCaught(s, dt);
  for (const s of w.order) tickStance(w, s);
  for (const s of w.order) tickBerserk(w, s, dt);
  for (const s of w.order) tickDegen(w, s, dt);
  for (const s of w.order) tickOffering(s, dt);
  for (const s of w.order) tickLegion(w, s, dt);
  for (const s of w.order) tickSupports(w, s, dt);
  for (const s of w.order) tickSkillFx(w, s, dt);
  for (const s of w.order) tickCurseAura(w, s, dt);
  tickProliferation(w, dt);
  updateProjectiles(w, dt);
  tickEffects(w, dt);
  tickZones(w, dt);
  tickCorpses(w, dt);
  separate(w);
  tickStranded(w, dt);
  checkExit(w);
  for (const s of w.order) {
    while (s.build.level < MAX_LEVEL && s.xp >= xpToNext(s.build.level)) {
      s.xp -= xpToNext(s.build.level);
      levelUp(w, s);
    }
    if (s.build.level >= MAX_LEVEL) s.xp = 0;
    if (s.opts.freeResources && s.player.alive) {
      s.player.life = lifeCap(s.player);
      s.player.mana = Math.max(0, s.player.def.maxMana - reservedMana(s));
    }
  }
  // The map is over when the local player's character is dead (a duel reads its own sides' deaths).
  for (const s of w.order)
    if (s.id === 0 && !s.player.alive && w.status === 'running') w.status = 'dead';
  for (const s of w.order) tickCollapse(w, s);
  for (const s of w.order) tickRecover(w, s.player, dt);
  for (const s of w.order) tickReprieve(s, dt);
  tickAbandon(w, dt);
  if (w.t >= (w.opts.maxTime ?? 900) && w.status === 'running') w.status = 'timeout';
}
