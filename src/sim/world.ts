import { MONSTER_TYPES } from '../data/monsters';
import { tickPhases } from './phases';
import { Character } from '../calc/character';
import { noCharges, type ChargeCounts } from '../calc/charges';
import { buildMonster, scaleOf, type MonsterSpec } from '../calc/monster';
import { Rng } from '../core/rng';
import { DT } from '../data/constants';
import { affixPlayerMods } from '../data/mapAffixes';
import { MAX_LEVEL, xpToNext } from '../data/xpTable';
import type { Build } from '../data/types';
import type { MapPlan } from '../gen/mapPlan';
import { monsterName } from '../gen/population';
import { tickSkillZones, updateAction, updateProjectiles } from './actions';
import { monsterAI, playerAI, separate } from './ai';
import { lifeCap, monsterHitOf, rawHit, refreshPlayerDefence, tickActor } from './combat';
import { autoFlaskPolicy, type FlaskPolicy } from './flaskPolicy';
import { abilitiesOf } from '../data/abilities';
import { tickAbilities, tickChargingMod } from './abilities';
import { isZone, tickCorpses, tickFactionBehaviour, tickZones } from './factions';
import { BUFF_IDS, type BuffId } from '../data/buffs';
import { rollGains, tickBuffs } from './buffs';
import { tickCooldowns } from './cooldowns';
import { tickChannel } from './channel';
import { tickShots } from './shots';
import { tickDeployables } from './deploy';
import { tickMinions } from './minions';
import { tickAuraBurn } from './utility';
import { rebuildCharacter, seedCharacters, tickCharges } from './charges';
import { tickTriggers } from './triggers';
import { Grid } from './grid';
import { newActor } from './actor';
import { tickAbandon } from './abandon';
import { tickCollapse } from './collapse';
import { tickHoldout } from './holdout';
import { crescendoStep, HOLDOUT_WAVES } from '../data/mapTypes';
import type { Actor, World, WorldOpts } from './types';

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
  a.room = room;
  a.pack = pack;
  w.actors.push(a);
  return a;
}

export type CreateWorldInput = {
  plan: MapPlan;
  build: Build;
  /** Carried-over resources from camp (fractions); default full. */
  xp: number;
  opts?: WorldOpts;
};

export function makeCharacter(
  build: Build,
  plan: MapPlan,
  charges: ChargeCounts = noCharges(),
): Character {
  return new Character(build, {
    areaLevel: plan.areaLevel,
    resistPenalty: plan.resistPenalty,
    extraMods: plan.affixes.flatMap((id) => affixPlayerMods(id, plan.areaLevel)),
    charges,
  });
}

export function createWorld(inp: CreateWorldInput): World {
  const { plan } = inp;
  const root = new Rng(plan.seed);
  const build = { ...inp.build };
  const char = makeCharacter(build, plan);
  const grid = new Grid(plan.lab.w, plan.lab.h, plan.lab.tiles);
  const player = newActor(1, true, plan.lab.start.x, plan.lab.start.y, 0.4);
  const w: World = {
    plan,
    grid,
    t: 0,
    tick: 0,
    rngCombat: root.fork('combat'),
    rngAi: root.fork('ai'),
    rngLoot: root.fork('loot'),
    rngTrig: root.fork('trigger'),
    chargeT: { grit: 0, fervour: 0, insight: 0 },
    buffT: Object.fromEntries(BUFF_IDS.map((id) => [id, 0])) as Record<BuffId, number>,
    rage: 0,
    rageT: 0,
    rageDrain: 0,
    chars: new Map(),
    trophy: {},
    secondaryReady: {},
    cooldowns: {},
    guard: null,
    utilityReady: {},
    auraBurnT: 0,
    deployables: [],
    deploySeq: 0,
    minions: [],
    trig: {
      cooldown: {},
      taken: {},
      next: {},
      busy: false,
      explosions: 0,
      queue: [],
      draining: false,
    },
    actors: [player],
    player,
    nextId: 2,
    projectiles: [],
    shots: [],
    channel: null,
    stacks: null,
    hitsLanded: 0,
    lastOutcome: null,
    effects: [],
    zones: [],
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
    build,
    char,
    primary: char.primary,
    flasks: char.flasks.map((spec) => ({
      spec,
      charges: spec.maxCharges,
      activeT: 0,
      queued: false,
      lifeRate: 0,
      manaRate: 0,
      esRate: 0,
      esT: 0,
    })),
    xp: inp.xp,
    status: 'running',
    abandonT: null,
    surge: 0,
    collapseFront: 0,
    collapseGap: Infinity,
    holdout: { spawned: 0, cleared: 0, done: [], ids: [] },
    exitOpen: false,
    endRoom: plan.lab.mainPath[plan.lab.mainPath.length - 1],
    ai: {
      mode: 'advance',
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
      skipId: 0,
      skipUntil: 0,
      stuckT: 0,
      stuckX: plan.lab.start.x,
      stuckY: plan.lab.start.y,
      lootId: 0,
      lootSince: 0,
    },
    opts: inp.opts ?? {},
    stats: {
      kills: 0,
      xpGained: 0,
      stuck: 0,
      stalls: 0,
      wallBlocked: 0,
      picked: 0,
      damageTaken: 0,
      damageDealt: 0,
    },
    picked: [],
    dmgLog: [],
  };
  player.def = char.defence();
  // The player starts with what the last map left (full on a new run), as fractions of the maximum.
  const start = inp.opts?.start;
  const frac = (f: number | undefined) => Math.min(1, Math.max(0, f ?? 1));
  player.life = Math.max(1, lifeCap(w, player) * frac(start?.life));
  player.es = player.def.maxEs * frac(start?.es);
  player.mana = Math.max(0, player.def.maxMana - char.reservedMana) * frac(start?.mana);
  for (const f of w.flasks) f.charges = f.spec.maxCharges * frac(start?.flasks[f.spec.uid]);
  player.name = 'You';
  for (const s of plan.pop.monsters) {
    const a = spawnMonster(w, s.spec, s.x, s.y, s.room, s.pack, s.name);
    // A Stalker Cat lies in wait wherever it is; a pack that is an Ambush does so as a whole.
    if (s.hold || abilitiesOf(s.spec.type).some((x) => x.id === 'ambush')) a.hold = true;
    if (s.patrol) a.patrol = s.patrol.map((p) => ({ ...p }));
  }
  seedCharacters(w);
  return w;
}

/** Rebuild the character after a level-up, keeping resource fractions. */
function levelUp(w: World): void {
  const p = w.player;
  const lf = p.life / Math.max(1, lifeCap(w, p));
  const mf = p.def.maxMana > 0 ? p.mana / p.def.maxMana : 1;
  const ef = p.def.maxEs > 0 ? p.es / p.def.maxEs : 1;
  w.build = { ...w.build, level: w.build.level + 1 };
  rebuildCharacter(w);
  w.flasks.forEach((f, i) => {
    if (w.char.flasks[i]) f.spec = w.char.flasks[i];
  });
  refreshPlayerDefence(w);
  p.life = lf * lifeCap(w, p);
  p.mana = mf * p.def.maxMana;
  p.es = ef * p.def.maxEs;
  w.events.push({ t: 'levelUp', level: w.build.level });
}

/** Seconds over which a life-to-ES flask returns the life it took. */
const LIFE_TO_ES_TIME = 2;

function useFlask(w: World, i: number): void {
  const f = w.flasks[i];
  const p = w.player;
  if (f.charges < f.spec.perUse) return;
  const s = f.spec;
  if (s.kind === 'life' || s.kind === 'hybrid' || s.kind === 'mana') {
    if (f.activeT > 0) {
      if (f.queued) return;
      f.queued = true;
    } else if (s.instant) {
      p.life = Math.min(lifeCap(w, p), p.life + s.life);
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
  f.charges -= s.perUse;
  p.tFlask = 0;
  if (s.removeIgnite) p.ail.ignites.length = 0;
  if (s.removeBleed) p.ail.bleeds.length = 0;
  if (s.removeFreeze) {
    p.ail.freezeT = 0;
    p.ail.chill = 0;
  }
  w.events.push({ t: 'flaskUsed', idx: i });
  rollGains(w, 'flask');
}

function tickFlasks(w: World, dt: number, policy: FlaskPolicy): void {
  const p = w.player;
  for (const i of policy(w)) useFlask(w, i);
  for (const f of w.flasks) {
    if (f.esT > 0) {
      p.es = Math.min(p.def.maxEs, p.es + f.esRate * Math.min(dt, f.esT));
      f.esT -= dt;
      if (f.esT <= 0) {
        f.esT = 0;
        f.esRate = 0;
      }
    }
    if (f.activeT <= 0) continue;
    const step = Math.min(dt, f.activeT);
    f.activeT -= dt;
    if (f.lifeRate) p.life = Math.min(lifeCap(w, p), p.life + f.lifeRate * step);
    if (f.manaRate)
      p.mana = Math.min(p.def.maxMana - w.char.reservedMana, p.mana + f.manaRate * step);
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

function tickEffects(w: World, dt: number): void {
  const p = w.player;
  let j = 0;
  for (const e of w.effects) {
    e.t -= dt;
    if (e.t > 0) {
      w.effects[j++] = e;
      continue;
    }
    // A lasting zone just fades.
    if (isZone(e)) continue;
    w.events.push({ t: 'explode', x: e.x, y: e.y, r: e.radius, dtype: e.dtype });
    // A warding pulse throws the character back, away from where it went off.
    if (e.push && p.alive && Math.hypot(p.x - e.x, p.y - e.y) <= e.radius + p.r) {
      const ang = Math.atan2(p.y - e.y, p.x - e.x);
      const to = w.grid.collide(p.x + Math.cos(ang) * e.push, p.y + Math.sin(ang) * e.push, p.r);
      p.x = to.x;
      p.y = to.y;
    }
    const label = e.kind === 'slam' ? 'Crushing slam' : 'Volatile explosion';
    if (e.damage > 0 && p.alive && Math.hypot(p.x - e.x, p.y - e.y) <= e.radius + p.r)
      rawHit(w, p, e.damage, e.dtype, label);
    // The player's minions standing in a monster's blast are hurt too.
    if (e.faction === 1)
      for (const m of w.minions)
        if (m.alive && Math.hypot(m.x - e.x, m.y - e.y) <= e.radius + m.r)
          rawHit(w, m, e.damage, e.dtype, label);
  }
  w.effects.length = j;
}

/** Behaviours driven by monster mods (§12.5) and the boss (§12.7). */
function tickMonsterMods(w: World, m: Actor, dt: number): void {
  if (m.state !== 'chase') return;
  const p = w.player;
  if (
    m.modIds.includes('rimeAura') &&
    Math.hypot(p.x - m.x, p.y - m.y) <= 3 &&
    !p.def.cannotBeChilled
  ) {
    if (p.ail.chill <= 0.15) {
      p.ail.chill = 0.15;
      p.ail.chillT = Math.max(p.ail.chillT, 0.25);
    }
  }
  if (m.modIds.includes('charging')) tickChargingMod(w, m, dt);
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
        faction: 1,
        push: 3,
      });
    }
  }
  if (m.modIds.includes('mirrored') && m.mirrorId === 0) {
    // The twin stands some way off, with everything but the mirror.
    const spec = m.mon!.spec;
    const ang = w.rngAi.float(0, Math.PI * 2);
    const pos = w.grid.collide(m.x + Math.cos(ang) * 6, m.y + Math.sin(ang) * 6, 0.5);
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
    twin.mirrorId = m.id;
    m.mirrorId = twin.id;
  }
  if (m.mirrorT > 0) {
    m.mirrorT -= dt;
    // The twin did not follow in time: the survivor is made whole, and the pair is no more.
    if (m.mirrorT <= 0) {
      m.life = m.def.maxLife;
      m.mirrorId = 0;
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
  if (m.rarity === 'boss') {
    m.slamT -= dt;
    if (m.slamT <= 0) {
      m.slamT = 7;
      w.effects.push({
        id: w.nextId++,
        x: p.x,
        y: p.y,
        radius: 3,
        t: 1.2,
        total: 1.2,
        kind: 'slam',
        damage: 4 * bossHit(m),
        dtype: 0,
        faction: 1,
      });
    }
    const frac = m.life / m.def.maxLife;
    const phases = [0.75, 0.5, 0.25];
    while (m.bossPhase < 3 && frac <= phases[m.bossPhase]) {
      m.bossPhase++;
      const variants = ['fire', 'cold', 'lightning'] as const;
      const v = variants[w.rngAi.int(0, 2)];
      for (let k = 0; k < 4; k++) summon(w, m, 'warrior', v);
    }
  }
}

function bossHit(m: Actor): number {
  const p = m.mon!.profile(0);
  let s = 0;
  for (const c of p.hands[0].chunks) s += (c.min + c.max) / 2;
  return s;
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
  if (w.exitOpen) return;
  // A Holdout is over when the last wave has come and gone.
  if (w.plan.type === 'holdout' && w.holdout.spawned < HOLDOUT_WAVES) return;
  for (const a of w.actors)
    if (!a.isPlayer && a.alive && a.room === w.endRoom && !a.noReward) return;
  // A Quarry opens its exit only when every champion has fallen, wherever it stood.
  if (w.plan.type === 'quarry' && w.actors.some((a) => a.alive && a.rarity === 'miniboss')) return;
  w.exitOpen = true;
  w.events.push({ t: 'exitOpen' });
}

/** Advance the world by one fixed tick (§8.2). */
export function stepWorld(w: World, policy: FlaskPolicy = autoFlaskPolicy): void {
  if (w.status !== 'running') return;
  w.events.length = 0;
  const dt = DT;
  w.t += dt;
  w.tick++;
  if (w.plan.type === 'crescendo') w.surge = crescendoStep(w.t);
  const p = w.player;
  refreshPlayerDefence(w);
  tickHoldout(w);
  tickTriggers(w, dt);
  tickCharges(w, dt);
  tickCooldowns(w, dt);
  tickBuffs(w, dt);
  tickAuraBurn(w, dt);
  tickDeployables(w, dt);
  tickSkillZones(w, dt);
  tickMinions(w, dt);
  tickFlasks(w, dt, policy);
  // Flow field for monsters follows the player tile.
  w.grid.buildFlow(p.x, p.y);
  for (const a of w.actors) {
    if (!a.alive) continue;
    tickActor(w, a, dt);
    if (!a.alive) continue;
    updateAction(w, a, dt);
    if (a.isPlayer) playerAI(w, dt);
    else {
      monsterAI(w, a, dt);
      tickPhases(w, a);
      tickMonsterMods(w, a, dt);
      if (a.state === 'chase') {
        tickFactionBehaviour(w, a, dt);
        tickAbilities(w, a, dt);
      }
    }
    if (!a.action) a.carry = 0;
  }
  tickShots(w);
  tickEffects(w, dt);
  tickChannel(w);
  updateProjectiles(w, dt);
  tickZones(w, dt);
  tickCorpses(w, dt);
  separate(w);
  checkExit(w);
  while (w.build.level < MAX_LEVEL && w.xp >= xpToNext(w.build.level)) {
    w.xp -= xpToNext(w.build.level);
    levelUp(w);
  }
  if (w.build.level >= MAX_LEVEL) w.xp = 0;
  if (w.opts.freeResources && p.alive) {
    p.life = lifeCap(w, p);
    p.mana = Math.max(0, p.def.maxMana - w.char.reservedMana);
  }
  if (!p.alive && w.status === 'running') w.status = 'dead';
  tickCollapse(w);
  tickAbandon(w, dt);
  if (w.t >= (w.opts.maxTime ?? 900) && w.status === 'running') w.status = 'timeout';
}
