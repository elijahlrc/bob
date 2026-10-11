import { Character, scenarioDps } from '../calc/character';
import { buildMonster } from '../calc/monster';
import {
  ADAPT_MAX,
  ADAPT_WINDOW,
  ATTUNE_SECONDS,
  ATTUNE_SHIFT,
  BARE_SECONDS,
  BARE_TAKEN,
  BAR_DOT,
  BAR_FLOOR,
  BAR_SHARE,
  BIG_HIT,
  BOSSES,
  BROKEN_SECONDS,
  BROKEN_TAKEN,
  CANTER_RADIUS,
  CANTER_SECONDS,
  CANTER_SPEED,
  COMMAND_MAX,
  COMMAND_PER,
  COURSER_CHILL,
  DRINK_REGEN,
  ECHO_EVERY,
  ENGINE_STUN,
  EXPOSED_SECONDS,
  EXPOSED_TAKEN,
  FRACTURE_SECONDS,
  FLURRY_LANES,
  FLURRY_LENGTH,
  FLURRY_MULT,
  FLURRY_SPREAD,
  FLURRY_TELL,
  FLURRY_WIDTH,
  FRACTURE_TAKEN,
  GALLOP_LENGTH,
  GALLOP_SPEED,
  GALLOP_TELL,
  GRIEF_DAMAGE,
  GRIEF_SPEED,
  GRIND_EVERY,
  HORN_TELL,
  LANE_BURN_SECONDS,
  LANE_WIDTH,
  PLATED_LESS,
  PRISM_PATTERN_EVERY,
  REGIMENTS,
  ROT_PATCH_EVERY,
  ROT_PATCH_SECONDS,
  ROT_REGEN,
  ROT_ROTATION,
  ROUTED_SECONDS,
  ROUTED_TAKEN,
  SENTENCE_EVERY,
  SENTENCE_MULT,
  SENTENCE_STUN,
  SENTENCE_TELL,
  SHARD_LIFE,
  SHARD_ORBIT,
  STAGGER_SECONDS,
  THEFT_AT,
  THEFT_ORDER,
  TOLL_DAMAGE,
  TOLL_EVERY,
  TOLL_RINGS,
  TOLL_RING_DELAY,
  TOLL_RING_MULT,
  TOLL_RING_START,
  TOLL_RING_STEP,
  TOLL_RING_WIDTH,
  TOLL_SHOCK,
  TOLL_SPEED,
  TOLL_TELL,
  VEIL_CYCLE,
  VEIL_SECONDS,
  WAVES,
  WAVE_PUSH_SECONDS,
  WAVE_THIN,
  WITNESSES,
  WITNESS_HEX_STEP,
  WITNESS_WEIGHT,
  bossOfType,
  type BossId,
  type TheftKind,
} from '../data/bosses';
import { HEX_IDS } from '../data/hexes';
import { affixPlayerMods } from '../data/mapAffixes';
import type { MonsterTypeId, Variant } from '../data/monsters';
import { afflictPlayer, stunPlayer } from './afflict';
import { castPattern } from './blasts';
import { rebuildForTheft } from './charges';
import { hit, monsterConds, monsterHitOf, refreshPlayerDefence } from './combat';
import { monsterHexEffect, openZone, speedMult } from './factions';
import { monsterHexesPlayer } from './hexes';
import { setTheft, theftBuild, theftOf, type Theft } from './theft';
import { armourReduction, hitChance } from '../calc/formulas';
import type { Action, Actor, GroundEffect, World } from './types';
import { spawnMonster } from './world';

/**
 * The fights of the six bosses (docs/BOSSES.md 4 to 9). A boss carries encounter state (`Actor.enc`), so the encounter hooks
 * call in here; its own state is kept beside it (not on the actor, which is kept small for the sim's speed). The numbers are
 * `data/bosses.ts`.
 */

type Gait = 'canter' | 'tell' | 'gallop' | 'turn' | 'charge';

export type BossState = {
  id: BossId;
  /** The fight has begun (what a boss brings appears then). */
  begun: boolean;
  /**
   * Its timed move (a toll, a Sentence, a pattern) is due: it starts the next time the boss is between blows (a boss in a
   * fight is otherwise never between them: `bossAI` asks before it chooses its next blow).
   */
  due: boolean;
  // The Tollkeeper.
  clock: number;
  tellT: number;
  tolls: number;
  // The Courser.
  gait: Gait;
  gaitT: number;
  orbit: number;
  dir: 1 | -1;
  strikeT: number;
  lane: { x: number; y: number; x2: number; y2: number } | null;
  laneId: number;
  // The Magistrate.
  sentenceT: number;
  countT: number;
  witnesses: Actor[];
  plinths: { x: number; y: number }[];
  hexT: number;
  hexNext: number;
  // The Prism Warden.
  element: 1 | 2 | 3;
  attuneT: number;
  shiftT: number;
  fractured: number;
  fracturedT: number;
  patT: number;
  // The Rotwife.
  rot: number;
  patchT: number;
  regrowing: boolean;
  // The Unmaker.
  thefts: number;
  shards: { actor: Actor; kind: TheftKind; angle: number }[];
  exposedT: number;
  dealt: number[];
  adapt: number[];
  // The Siege Marshal.
  holding: boolean;
  wave: number;
  waveT: number;
  hornT: number;
  soldiers: Actor[];
  routedT: number;
  // The Veiled Duellist.
  veiled: boolean;
  phaseT: number;
  flurryT: number;
  bareT: number;
  // The Bulwark Engine.
  bar: number;
  brokenT: number;
  lastLife: number;
  hitLoss: number;
  grindT: number;
  // The Sundered Twins.
  twin: 'ash' | 'cinder';
  grief: boolean;
  echoT: number;
};

const states = new WeakMap<Actor, BossState>();

/** The boss state of a monster, if it is one of the bosses. */
export function bossState(m: Actor): BossState | undefined {
  return states.get(m);
}

/** Give a boss its state (from `initEncounter`). */
export function initBoss(w: World, a: Actor): void {
  const def = a.mon && bossOfType(a.mon.spec.type);
  if (!def) return;
  states.set(a, {
    id: def.id,
    begun: false,
    due: false,
    clock: TOLL_EVERY,
    tellT: 0,
    tolls: 0,
    gait: 'canter',
    gaitT: CANTER_SECONDS,
    orbit: 0,
    dir: 1,
    strikeT: 1,
    lane: null,
    laneId: 0,
    sentenceT: SENTENCE_EVERY * 0.6,
    countT: 0,
    witnesses: [],
    plinths: [],
    hexT: 1,
    hexNext: 0,
    element: 3,
    attuneT: ATTUNE_SECONDS,
    shiftT: 0,
    fractured: 0,
    fracturedT: 0,
    patT: PRISM_PATTERN_EVERY * 0.6,
    rot: 0,
    patchT: ROT_PATCH_EVERY,
    regrowing: false,
    thefts: 0,
    shards: [],
    exposedT: 0,
    dealt: [0, 0, 0, 0, 0],
    adapt: [0, 0, 0, 0, 0],
    holding: true,
    wave: 0,
    waveT: 0,
    hornT: 0,
    soldiers: [],
    routedT: 0,
    veiled: true,
    phaseT: VEIL_SECONDS,
    flurryT: 0,
    bareT: 0,
    bar: a.def.maxLife * BAR_SHARE,
    brokenT: 0,
    lastLife: a.life,
    hitLoss: 0,
    grindT: GRIND_EVERY * 0.7,
    twin: a.mon!.spec.type === 'cinder' ? 'cinder' : 'ash',
    grief: false,
    echoT: ECHO_EVERY,
  });
  void w;
}

/** How fast a boss's own clock runs: chill slows it, freeze stops it (the Tollkeeper's toll, the Courser's stride). */
function clockRate(m: Actor, chillTimes = 1): number {
  if (m.ail.freezeT > 0) return 0;
  return Math.max(0.1, 1 - m.ail.chill * chillTimes);
}

/** Run a boss for one tick (from `tickEncounter`: only while it fights). */
export function tickBoss(w: World, m: Actor, dt: number): void {
  const st = states.get(m);
  if (!st || !m.alive) return;
  if (!st.begun) {
    st.begun = true;
    w.events.push({ t: 'window', id: m.id, kind: 'bossBegins' });
    if (st.id === 'magistrate') raiseWitnesses(w, m, st, true);
    if (st.id === 'prismWarden') attune(w, m, st, 3);
    if (st.id === 'siegeMarshal') callRegiment(w, m, st);
    if (st.id === 'duellist') st.phaseT = VEIL_SECONDS;
  }
  switch (st.id) {
    case 'siegeMarshal':
      tickSiege(w, m, st, dt);
      break;
    case 'duellist':
      tickDuel(w, m, st, dt);
      break;
    case 'bulwarkEngine':
      tickEngine(w, m, st, dt);
      break;
    case 'twins':
      tickTwins(st, dt);
      break;
    case 'tollkeeper':
      tickToll(w, m, st, dt);
      break;
    case 'magistrate':
      tickCourt(w, m, st, dt);
      break;
    case 'prismWarden':
      tickPrism(w, m, st, dt);
      break;
    case 'rotwife':
      tickRot(w, m, st, dt);
      break;
    case 'unmaker':
      tickUnmaker(w, m, st, dt);
      break;
    case 'courser':
      // The Courser is never stunned at a gallop.
      if (st.gait !== 'canter' && m.stunT > 0) m.stunT = 0;
      break;
  }
}

/**
 * A boss's own way of moving and striking (from `monsterAI`), when it takes the place of the usual: the Courser always, the
 * others while they hold still (a toll's swing, a Sentence's countdown, an attunement's shift). Returns whether it did.
 */
export function bossAI(w: World, m: Actor, dt: number): boolean {
  const st = states.get(m);
  if (!st) return false;
  const p = w.player;
  switch (st.id) {
    case 'courser':
      courserAI(w, m, st, dt);
      return true;
    case 'tollkeeper':
      if (st.due && st.tellT <= 0) {
        st.due = false;
        st.tellT = TOLL_TELL;
        w.events.push({ t: 'window', id: m.id, kind: 'tollTell' });
      }
      if (st.tellT > 0) m.facing = Math.atan2(p.y - m.y, p.x - m.x);
      return st.tellT > 0;
    case 'magistrate':
      if (st.due && st.countT <= 0 && p.alive) {
        st.due = false;
        pronounce(w, m, st);
      }
      if (st.countT > 0) m.facing = Math.atan2(p.y - m.y, p.x - m.x);
      return st.countT > 0;
    case 'prismWarden':
      if (st.due && st.shiftT <= 0 && p.alive) {
        st.due = false;
        const act = { profile: m.mon!.profile(0), aimX: p.x, aimY: p.y } as Action;
        castPattern(w, m, act, PATTERN_OF[st.element]);
        w.events.push({ t: 'window', id: m.id, kind: 'pattern' });
      }
      return st.shiftT > 0;
    case 'siegeMarshal':
      // Until his regiments are spent he commands from where he stands.
      if (!st.holding) return false;
      m.moving = false;
      m.facing = Math.atan2(p.y - m.y, p.x - m.x);
      return true;
    case 'duellist':
      if (st.due && st.flurryT <= 0 && !st.veiled && p.alive) {
        st.due = false;
        flurry(w, m, st);
      }
      if (st.flurryT > 0) m.facing = Math.atan2(p.y - m.y, p.x - m.x);
      return st.flurryT > 0;
    case 'bulwarkEngine':
      if (st.due && m.stunT <= 0 && p.alive) {
        st.due = false;
        const act = { profile: m.mon!.profile(0), aimX: p.x, aimY: p.y } as Action;
        castPattern(w, m, act, 'march');
        w.events.push({ t: 'window', id: m.id, kind: 'grind' });
      }
      return false;
    case 'twins':
      if (st.due && st.grief && p.alive) {
        st.due = false;
        echo(w, m, st);
      }
      return false;
    default:
      return false;
  }
}

/** A boss's damage and pace (from `encDamageMult` and `encMoveMult`): the toll's stacks. */
export function bossDamageMult(m: Actor): number {
  const st = states.get(m);
  if (st?.id === 'tollkeeper') return 1 + TOLL_DAMAGE * st.tolls;
  if (st?.id === 'twins' && st.grief) return 1 + GRIEF_DAMAGE;
  return 1;
}
export function bossSpeedMult(m: Actor): number {
  const st = states.get(m);
  if (st?.id === 'tollkeeper') return 1 + TOLL_SPEED * st.tolls;
  if (st?.id === 'twins' && st.grief) return 1 + GRIEF_SPEED;
  return 1;
}

/** What a hit on a boss does to it (from `modeTaken`): a Fractured element, the Unmaker's adaptation and exposure. */
export function bossTaken(dst: Actor, dmg: number[]): void {
  const st = states.get(dst);
  if (!st) return;
  if (st.id === 'prismWarden' && st.fracturedT > 0) dmg[st.fractured] *= 1 + FRACTURE_TAKEN;
  if (st.id === 'siegeMarshal') {
    const k = (1 - commandLess(st)) * (st.routedT > 0 ? 1 + ROUTED_TAKEN : 1);
    for (let i = 0; i < 5; i++) dmg[i] *= k;
  }
  if (st.id === 'duellist' && st.bareT > 0) for (let i = 0; i < 5; i++) dmg[i] *= 1 + BARE_TAKEN;
  if (st.id === 'bulwarkEngine') {
    if (st.brokenT > 0) for (let i = 0; i < 5; i++) dmg[i] *= 1 + BROKEN_TAKEN;
    else {
      // A hit wears the bar down by its size: a big one by all of it, a small one by a share (never none).
      const total = dmg[0] + dmg[1] + dmg[2] + dmg[3] + dmg[4];
      const big = Math.min(1, total / dst.def.maxLife / BIG_HIT);
      st.bar -= total * (BAR_FLOOR + (1 - BAR_FLOOR) * big);
      for (let i = 0; i < 5; i++) dmg[i] *= 1 - PLATED_LESS;
    }
  }
  if (st.id === 'unmaker') {
    const exposed = st.exposedT > 0 ? 1 + EXPOSED_TAKEN : 1;
    for (let i = 0; i < 5; i++) dmg[i] *= (1 - st.adapt[i]) * exposed;
  }
}

/** What a boss has taken (from `noteTaken`): the Unmaker learns the damage it is dealt most. */
export function bossNoteTaken(m: Actor, dmg: number[]): void {
  const st = states.get(m);
  if (st?.id === 'bulwarkEngine') st.hitLoss += dmg[0] + dmg[1] + dmg[2] + dmg[3] + dmg[4];
  if (st?.id !== 'unmaker') return;
  for (let i = 0; i < 5; i++) st.dealt[i] += dmg[i];
}

/** A boss's blow lands on the character (from `onMonsterHitPlayer`): the Rotwife's ailment of the moment. */
export function bossHitPlayer(w: World, src: Actor): void {
  const st = states.get(src);
  // The Engine's blows knock the character senseless for a moment (once in the boss lock).
  if (st?.id === 'bulwarkEngine') stunPlayer(w, ENGINE_STUN);
  if (st?.id !== 'rotwife') return;
  const kind = ROT_ROTATION[st.rot % ROT_ROTATION.length];
  st.rot++;
  const hit = monsterHitOf(src);
  switch (kind) {
    case 'bleed':
      afflictPlayer(w, 'bleed', hit * 0.18, 5, true);
      break;
    case 'poison':
      afflictPlayer(w, 'poison', hit * 0.12, 4, true);
      break;
    case 'ignite':
      afflictPlayer(w, 'ignite', hit * 0.3, 4, true);
      break;
    case 'freeze':
      // A chill first; the freeze itself is short, and kept from coming back by the lock.
      afflictPlayer(w, 'chill', 0.3, 3, true);
      afflictPlayer(w, 'freeze', 0, 0.6, true);
      break;
    case 'shock':
      afflictPlayer(w, 'shock', 0.25, 4, true);
      break;
  }
  w.events.push({
    t: 'window',
    id: src.id,
    kind: `rot.${ROT_ROTATION[st.rot % ROT_ROTATION.length]}`,
  });
}

/** A boss, or one of its creatures, dies (from `onEncounterDeath` and the monster death path). */
export function bossDeath(w: World, a: Actor): void {
  const st = states.get(a);
  if (st) {
    // The fight is over: what it brought goes with it, and what it held comes back.
    for (const x of st.witnesses) if (x.alive) dismiss(w, x);
    for (const s of st.shards) if (s.actor.alive) dismiss(w, s.actor);
    for (const x of st.soldiers) if (x.alive) dismiss(w, x);
    st.shards = [];
    // The other twin takes it hard.
    if (st.id === 'twins') grieve(w, a);
    if (st.id === 'unmaker' && hasTheft(w)) {
      setTheft(w, {});
      rebuildForTheft(w);
    }
    w.effects = w.effects.filter((e) => e.owner !== a.id || isZoneKind(e));
    return;
  }
  // A shard is broken: its piece comes back, and the Unmaker staggers.
  if (a.mon?.spec.type === 'shard') {
    for (const o of w.actors) {
      const os = states.get(o);
      if (os?.id !== 'unmaker' || !o.alive) continue;
      const i = os.shards.findIndex((s) => s.actor === a);
      if (i < 0) continue;
      const kind = os.shards[i].kind;
      os.shards.splice(i, 1);
      giveBack(w, kind);
      o.stunT = Math.max(o.stunT, STAGGER_SECONDS);
      o.action = null;
      os.exposedT = EXPOSED_SECONDS;
      w.events.push({ t: 'window', id: o.id, kind: `returned.${kind}` });
      w.events.push({ t: 'stun', dst: o.id, dur: STAGGER_SECONDS });
    }
  }
}

const isZoneKind = (e: GroundEffect) =>
  e.kind === 'caustic' || e.kind === 'burning' || e.kind === 'chilling' || e.kind === 'shocking';

/** A creature the boss brought leaves with it: no body, no reward. */
function dismiss(w: World, x: Actor): void {
  x.alive = false;
  x.life = 0;
  w.events.push({ t: 'window', id: x.id, kind: 'dismissed' });
}

/** Spawn a creature of a boss beside it: no experience, no loot, and awake. */
function bring(w: World, m: Actor, type: MonsterTypeId, x: number, y: number): Actor {
  const spec = { ...m.mon!.spec, type, rarity: 'normal' as const, mods: [] };
  const a = spawnMonster(w, spec, x, y, m.room, m.pack, '');
  a.name = a.mon!.kind.name;
  a.noReward = true;
  a.summonedBy = m.id;
  a.state = 'chase';
  return a;
}

// ---------------------------------------------------------------------------------------------------------------------
// The Tollkeeper (section 4).

function tickToll(w: World, m: Actor, st: BossState, dt: number): void {
  const rate = clockRate(m);
  if (st.tellT > 0) {
    // A stun in the swing breaks it: the bell rings flat, and the clock starts again.
    if (m.stunT > 0) {
      st.tellT = 0;
      st.clock = TOLL_EVERY;
      w.events.push({ t: 'window', id: m.id, kind: 'tollBroken' });
      return;
    }
    st.tellT -= dt * rate;
    if (st.tellT <= 0) toll(w, m, st);
    return;
  }
  if (st.due) return;
  st.clock -= dt * rate;
  if (st.clock <= 0) {
    st.clock = TOLL_EVERY;
    st.due = true;
  }
}

/** The bell tolls: rings of lightning go out from it one after another, and it grows stronger for good. */
function toll(w: World, m: Actor, st: BossState): void {
  const rings = TOLL_RINGS + st.tolls;
  const dmg = monsterHitOf(m) * TOLL_RING_MULT * bossDamageMult(m);
  st.tolls++;
  w.events.push({ t: 'window', id: m.id, kind: 'toll' });
  for (let i = 0; i < rings; i++) {
    const r = TOLL_RING_START + i * TOLL_RING_STEP;
    w.effects.push({
      id: w.nextId++,
      x: m.x,
      y: m.y,
      radius: r + TOLL_RING_WIDTH / 2,
      inner: Math.max(0, r - TOLL_RING_WIDTH / 2),
      t: 0.8,
      total: 0.8,
      kind: 'slam',
      damage: dmg,
      dtype: 1,
      faction: 1,
      shape: 'donut',
      delay: i > 0 ? i * TOLL_RING_DELAY : undefined,
      label: 'Toll',
      owner: m.id,
      afflict: { kind: 'shock', value: TOLL_SHOCK, seconds: 2 },
    });
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// The Courser (section 5).

/** Move a boss toward a point at a speed, sliding along walls; stopped by a minion in the way. Returns whether it got there. */
function ride(w: World, m: Actor, tx: number, ty: number, speed: number, dt: number): boolean {
  const dx = tx - m.x;
  const dy = ty - m.y;
  const len = Math.hypot(dx, dy);
  if (len < 0.05) return true;
  const d = Math.min(len, speed * dt);
  const c = w.grid.collide(m.x + (dx / len) * d, m.y + (dy / len) * d, m.r);
  m.x = c.x;
  m.y = c.y;
  m.facing = Math.atan2(dy, dx);
  m.moving = true;
  return d >= len - 1e-6;
}

/** A minion stands in the Courser's way: a minion build's answer to a gallop. */
function minionAhead(w: World, m: Actor): boolean {
  for (const n of w.minions)
    if (n.alive && Math.hypot(n.x - m.x, n.y - m.y) <= n.r + m.r + 0.1) return true;
  return false;
}

/** The end of a gallop from (x, y) along `ang`: up to `len`, stopped short of the first wall. */
function runOut(
  w: World,
  x: number,
  y: number,
  ang: number,
  len: number,
  r: number,
): { x: number; y: number } {
  let d = 0;
  for (let s = 0.4; s <= len; s += 0.4) {
    const px = x + Math.cos(ang) * s;
    const py = y + Math.sin(ang) * s;
    if (!w.grid.clear(px, py) || !w.grid.clear(px + Math.cos(ang) * r, py + Math.sin(ang) * r))
      break;
    d = s;
  }
  return { x: x + Math.cos(ang) * d, y: y + Math.sin(ang) * d };
}

/** Show a lane the Courser is about to run, as a blast that lands when it has run it. */
function showLane(
  w: World,
  m: Actor,
  st: BossState,
  to: { x: number; y: number },
  seconds: number,
  damage: number,
): void {
  st.lane = { x: m.x, y: m.y, x2: to.x, y2: to.y };
  const e: GroundEffect = {
    id: w.nextId++,
    x: m.x,
    y: m.y,
    x2: to.x,
    y2: to.y,
    width: LANE_WIDTH,
    radius: Math.hypot(to.x - m.x, to.y - m.y) / 2,
    t: seconds,
    total: seconds,
    kind: 'slam',
    damage,
    dtype: 3,
    faction: 1,
    shape: 'lane',
    label: 'Gallop',
    owner: m.id,
  };
  st.laneId = e.id;
  w.effects.push(e);
}

/** The lane it ran burns for a while. */
function burnLane(w: World, m: Actor, st: BossState): void {
  const l = st.lane;
  if (!l) return;
  const len = Math.hypot(l.x2 - l.x, l.y2 - l.y);
  const n = Math.max(1, Math.round(len / 1.3));
  const dps = monsterHitOf(m) * 0.35;
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    openZone(
      w,
      l.x + (l.x2 - l.x) * f,
      l.y + (l.y2 - l.y) * f,
      0.85,
      LANE_BURN_SECONDS,
      'burning',
      dps,
    );
  }
}

function courserAI(w: World, m: Actor, st: BossState, dt: number): void {
  const p = w.player;
  if (!p.alive) return;
  const rate = clockRate(m, COURSER_CHILL) * speedMult(m);
  const blow = monsterHitOf(m);
  switch (st.gait) {
    case 'canter': {
      // It circles the character inside melee reach, striking as it passes.
      st.orbit += ((CANTER_SPEED * rate) / CANTER_RADIUS) * dt * st.dir;
      const tx = p.x + Math.cos(st.orbit) * CANTER_RADIUS;
      const ty = p.y + Math.sin(st.orbit) * CANTER_RADIUS;
      // Out of the way of a wall: the circle turns back.
      if (!w.grid.clear(tx, ty)) st.dir = st.dir === 1 ? -1 : 1;
      ride(w, m, tx, ty, CANTER_SPEED * 1.8 * rate, dt);
      st.strikeT -= dt * rate;
      const d = Math.hypot(p.x - m.x, p.y - m.y);
      if (st.strikeT <= 0 && d <= m.mon!.range + p.r + m.r + 0.4) {
        st.strikeT = m.mon!.kind.attackTime;
        const prof = m.mon!.profile(monsterConds(m));
        const facing = Math.atan2(p.y - m.y, p.x - m.x);
        w.events.push({
          t: 'swing',
          src: m.id,
          x: m.x,
          y: m.y,
          facing,
          radius: m.mon!.range + m.r,
          arc: 60,
          dtype: 3,
          heavy: false,
        });
        hit(w, m, p, prof, 0, d);
      }
      st.gaitT -= dt;
      if (st.gaitT <= 0) {
        // Break away: outward from the character, a little to the side, as far as the floor allows.
        const out = Math.atan2(m.y - p.y, m.x - p.x) + w.rngAi.float(-0.5, 0.5);
        const to = runOut(w, m.x, m.y, out, GALLOP_LENGTH, m.r);
        st.gait = 'tell';
        st.gaitT = GALLOP_TELL;
        showLane(w, m, st, to, GALLOP_TELL + Math.hypot(to.x - m.x, to.y - m.y) / GALLOP_SPEED, 0);
        w.events.push({ t: 'window', id: m.id, kind: 'gallop' });
      }
      return;
    }
    case 'tell':
    case 'turn':
      // It paws the ground while the lane shows.
      m.moving = true;
      st.gaitT -= dt * rate;
      if (st.lane) m.facing = Math.atan2(st.lane.y2 - st.lane.y, st.lane.x2 - st.lane.x);
      if (st.gaitT <= 0) st.gait = st.gait === 'tell' ? 'gallop' : 'charge';
      return;
    case 'gallop':
    case 'charge': {
      const l = st.lane!;
      const there = ride(w, m, l.x2, l.y2, GALLOP_SPEED * rate, dt);
      // A minion in the way ends the run where it stands.
      const blocked = minionAhead(w, m);
      if (!there && !blocked) return;
      if (blocked) {
        l.x2 = m.x;
        l.y2 = m.y;
        w.effects = w.effects.filter((e) => e.id !== st.laneId);
        w.events.push({ t: 'window', id: m.id, kind: 'blocked' });
      }
      burnLane(w, m, st);
      if (st.gait === 'gallop') {
        // Turn, and charge back through where the character stands.
        const ang = Math.atan2(p.y - m.y, p.x - m.x);
        const to = runOut(w, m.x, m.y, ang, Math.hypot(p.x - m.x, p.y - m.y) + 3, m.r);
        st.gait = 'turn';
        st.gaitT = GALLOP_TELL;
        showLane(
          w,
          m,
          st,
          to,
          GALLOP_TELL + Math.hypot(to.x - m.x, to.y - m.y) / GALLOP_SPEED,
          blow * 1.4,
        );
        w.events.push({ t: 'window', id: m.id, kind: 'charge' });
      } else {
        st.gait = 'canter';
        st.gaitT = CANTER_SECONDS;
        st.orbit = Math.atan2(m.y - p.y, m.x - p.x);
        st.dir = w.rngAi.chance(0.5) ? 1 : -1;
        st.lane = null;
      }
      return;
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// The Magistrate (section 6).

/** The Witnesses take their plinths round the room (the first time), or rise on them again. */
function raiseWitnesses(w: World, m: Actor, st: BossState, first: boolean): void {
  if (first) {
    const room = w.plan.lab.rooms[m.room];
    const cx = room ? room.cx + 0.5 : m.x;
    const cy = room ? room.cy + 0.5 : m.y;
    const r = room ? Math.min(room.rect.w, room.rect.h) / 2 - 2.5 : 6;
    for (let k = 0; k < WITNESSES; k++) {
      const ang = (k / WITNESSES) * Math.PI * 2 + Math.PI / 4;
      const at = w.grid.nearestReachable(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r) ?? {
        x: cx,
        y: cy,
      };
      st.plinths.push({ x: at.x, y: at.y });
    }
  }
  st.plinths.forEach((at, k) => {
    const old = st.witnesses[k];
    if (old?.alive) return;
    st.witnesses[k] = bring(w, m, 'witness', at.x, at.y);
  });
  w.events.push({ t: 'window', id: m.id, kind: 'witnesses' });
}

export function livingWitnesses(st: BossState): number {
  return st.witnesses.filter((x) => x.alive).length;
}

/** What the Sentence will deal now: its blow, made heavier by each Witness still standing. */
export function sentenceDamage(m: Actor, st: BossState): number {
  return monsterHitOf(m) * SENTENCE_MULT * (1 + WITNESS_WEIGHT * livingWitnesses(st));
}

function tickCourt(w: World, m: Actor, st: BossState, dt: number): void {
  const p = w.player;
  // The Witnesses keep a hex on the character, one after another; each Witness past the first makes it stronger.
  const alive = livingWitnesses(st);
  st.hexT -= dt;
  if (alive > 0 && st.hexT <= 0 && p.alive) {
    st.hexT = 3;
    for (let k = 0; k < WITNESSES; k++) {
      const i = (st.hexNext + k) % WITNESSES;
      if (!st.witnesses[i]?.alive) continue;
      const id = HEX_IDS[i % HEX_IDS.length];
      if (!p.hexes.some((h) => h.id === id && h.t > 1))
        monsterHexesPlayer(w, id, monsterHexEffect(w, id) * (1 + WITNESS_HEX_STEP * (alive - 1)));
      st.hexNext = i + 1;
      break;
    }
  }
  if (st.countT > 0) {
    st.countT -= dt;
    const e = w.effects.find((x) => x.owner === m.id && x.label === 'Sentence');
    if (e) e.damage = sentenceDamage(m, st);
    if (st.countT <= 0) {
      st.sentenceT = SENTENCE_EVERY;
      // When it has passed, the Witnesses that fell rise again.
      raiseWitnesses(w, m, st, false);
    }
    return;
  }
  if (st.due) return;
  st.sentenceT -= dt;
  if (st.sentenceT <= 0) st.due = true;
}

/** The Magistrate points the axe: the Sentence follows the character for its countdown, then lands. */
function pronounce(w: World, m: Actor, st: BossState): void {
  const p = w.player;
  st.countT = SENTENCE_TELL;
  w.events.push({ t: 'window', id: m.id, kind: 'sentence' });
  w.effects.push({
    id: w.nextId++,
    x: p.x,
    y: p.y,
    radius: 1.8,
    t: SENTENCE_TELL,
    total: SENTENCE_TELL,
    kind: 'slam',
    damage: sentenceDamage(m, st),
    dtype: 0,
    faction: 1,
    shape: 'circle',
    label: 'Sentence',
    owner: m.id,
    follow: true,
    unavoidable: true,
    stun: SENTENCE_STUN,
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// The Prism Warden (section 7).

const VARIANT_OF: Record<1 | 2 | 3, Variant> = { 1: 'lightning', 2: 'cold', 3: 'fire' };
const NEXT_ELEMENT: Record<1 | 2 | 3, 1 | 2 | 3> = { 3: 2, 2: 1, 1: 3 };
const PATTERN_OF = { 3: 'closingRing', 2: 'march', 1: 'cross' } as const;

/** Take on an element: its spells, its ailment, its immunity (a copy of the defence, so the shared one is untouched). */
function attune(w: World, m: Actor, st: BossState, el: 1 | 2 | 3): void {
  const lifeShare = m.life / m.def.maxLife;
  const es = m.es;
  m.mon = buildMonster({ ...m.mon!.spec, variant: VARIANT_OF[el] });
  const immune = [false, false, false, false, false];
  immune[el] = true;
  m.def = { ...m.mon.defence, immune };
  m.life = lifeShare * m.def.maxLife;
  m.es = Math.min(es, m.def.maxEs);
  st.element = el;
  st.attuneT = ATTUNE_SECONDS;
  w.events.push({ t: 'window', id: m.id, kind: `attune.${el}` });
}

function tickPrism(w: World, m: Actor, st: BossState, dt: number): void {
  if (st.fracturedT > 0) st.fracturedT -= dt;
  if (st.shiftT > 0) {
    st.shiftT -= dt;
    if (st.shiftT <= 0) {
      const old = st.element;
      attune(w, m, st, NEXT_ELEMENT[old]);
      st.fractured = old;
      st.fracturedT = FRACTURE_SECONDS;
    }
    return;
  }
  st.attuneT -= dt;
  if (st.attuneT <= 0) {
    // The shift: the core flickers through its colours, and for a moment it is immune to nothing.
    st.shiftT = ATTUNE_SHIFT;
    m.action = null;
    m.def = { ...m.def, immune: [false, false, false, false, false] };
    w.events.push({ t: 'window', id: m.id, kind: 'shift' });
    return;
  }
  if (st.due) return;
  st.patT -= dt;
  if (st.patT <= 0) {
    st.patT = PRISM_PATTERN_EVERY;
    st.due = true;
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// The Rotwife (section 8).

/** Whether something is eating at the Rotwife: a burn, a bleed, a poison, or a skill's damage over time. */
function sufferingDot(m: Actor): boolean {
  const a = m.ail;
  return a.ignites.length > 0 || a.bleeds.length > 0 || a.poisons.length > 0 || m.sdots.length > 0;
}

function tickRot(w: World, m: Actor, st: BossState, dt: number): void {
  st.regrowing = !sufferingDot(m) && m.life < m.def.maxLife;
  if (st.regrowing) m.life = Math.min(m.def.maxLife, m.life + m.def.maxLife * ROT_REGEN * dt);
  st.patchT -= dt;
  if (st.patchT <= 0 && m.moving) {
    st.patchT = ROT_PATCH_EVERY;
    openZone(w, m.x, m.y, 1.2, ROT_PATCH_SECONDS, 'caustic', monsterHitOf(m) * 0.3);
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// The Siege Marshal (section 5a).

/** The share off what the Marshal takes while his soldiers stand. */
export function commandLess(st: BossState): number {
  return Math.min(COMMAND_MAX, COMMAND_PER * livingSoldiers(st));
}

export function livingSoldiers(st: BossState): number {
  return st.soldiers.filter((x) => x.alive).length;
}

/** The horn sounds: the next regiment marches in when it dies away. */
function callRegiment(w: World, m: Actor, st: BossState): void {
  st.hornT = HORN_TELL;
  w.events.push({ t: 'window', id: m.id, kind: 'horn' });
}

/** A regiment takes its places round the arena, and starts for the character. */
function marchIn(w: World, m: Actor, st: BossState): void {
  const room = w.plan.lab.rooms[m.room];
  const cx = room ? room.cx + 0.5 : m.x;
  const cy = room ? room.cy + 0.5 : m.y;
  const r = room ? Math.min(room.rect.w, room.rect.h) / 2 - 2.5 : 6;
  const ranks = REGIMENTS[Math.min(st.wave, REGIMENTS.length - 1)];
  const total = ranks.reduce((n, g) => n + g.n, 0);
  const start = w.rngAi.float(0, Math.PI * 2);
  st.soldiers = st.soldiers.filter((x) => x.alive);
  let k = 0;
  for (const g of ranks)
    for (let i = 0; i < g.n; i++, k++) {
      const ang = start + (k / total) * Math.PI * 2;
      const at = w.grid.nearestReachable(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r) ?? {
        x: cx,
        y: cy,
      };
      st.soldiers.push(bring(w, m, g.type, at.x, at.y));
    }
  st.wave++;
  st.waveT = WAVE_PUSH_SECONDS;
  w.events.push({ t: 'window', id: m.id, kind: 'march' });
}

function tickSiege(w: World, m: Actor, st: BossState, dt: number): void {
  if (st.routedT > 0) st.routedT -= dt;
  if (!st.holding) return;
  if (st.hornT > 0) {
    st.hornT -= dt;
    if (st.hornT <= 0) marchIn(w, m, st);
    return;
  }
  const alive = livingSoldiers(st);
  if (st.wave < WAVES) {
    // The next regiment comes when the last has thinned, or when its time is up, whichever is first.
    st.waveT -= dt;
    if (alive <= WAVE_THIN || st.waveT <= 0) callRegiment(w, m, st);
  } else if (alive === 0) {
    // All spent: he comes down himself, and for a moment he is alone.
    st.holding = false;
    st.routedT = ROUTED_SECONDS;
    w.events.push({ t: 'window', id: m.id, kind: 'routed' });
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// The Veiled Duellist (section 5b).

/** Whether the veil is up: nothing that hits him can crit (from `hit`). */
export function bossVeiled(m: Actor): boolean {
  const st = states.get(m);
  return st?.id === 'duellist' && st.veiled;
}

function tickDuel(w: World, m: Actor, st: BossState, dt: number): void {
  if (st.bareT > 0) st.bareT -= dt;
  if (st.flurryT > 0) {
    st.flurryT -= dt;
    if (st.flurryT <= 0) {
      st.bareT = BARE_SECONDS;
      w.events.push({ t: 'window', id: m.id, kind: 'bare' });
    }
  }
  st.phaseT -= dt;
  if (st.phaseT > 0) return;
  if (st.veiled) {
    // The veil drops, and he lunges as soon as he is between blows.
    st.veiled = false;
    st.phaseT = VEIL_CYCLE - VEIL_SECONDS;
    st.due = true;
    w.events.push({ t: 'window', id: m.id, kind: 'unveil' });
  } else {
    st.veiled = true;
    st.phaseT = VEIL_SECONDS;
    st.due = false;
    w.events.push({ t: 'window', id: m.id, kind: 'veil' });
  }
}

/** The lunge: lanes of steel fan out toward the character, shown first, each a critical blow. */
function flurry(w: World, m: Actor, st: BossState): void {
  const p = w.player;
  st.flurryT = FLURRY_TELL;
  const base = Math.atan2(p.y - m.y, p.x - m.x);
  const dmg = monsterHitOf(m) * FLURRY_MULT;
  for (let i = 0; i < FLURRY_LANES; i++) {
    const ang = base + (i - (FLURRY_LANES - 1) / 2) * FLURRY_SPREAD;
    const to = runOut(w, m.x, m.y, ang, FLURRY_LENGTH, 0.3);
    w.effects.push({
      id: w.nextId++,
      x: m.x,
      y: m.y,
      x2: to.x,
      y2: to.y,
      width: FLURRY_WIDTH,
      radius: Math.hypot(to.x - m.x, to.y - m.y) / 2,
      t: FLURRY_TELL,
      total: FLURRY_TELL,
      kind: 'slam',
      damage: dmg,
      dtype: 0,
      faction: 1,
      shape: 'lane',
      label: 'Flurry',
      owner: m.id,
    });
  }
  w.events.push({ t: 'window', id: m.id, kind: 'flurry' });
}

// ---------------------------------------------------------------------------------------------------------------------
// The Bulwark Engine (section 5c).

function tickEngine(w: World, m: Actor, st: BossState, dt: number): void {
  // Life lost to something other than a hit (a burn, a bleed, a poison) wears the plates too, a little.
  const dot = Math.max(0, st.lastLife - m.life - st.hitLoss);
  st.lastLife = m.life;
  st.hitLoss = 0;
  if (st.brokenT > 0) {
    st.brokenT -= dt;
    if (st.brokenT <= 0) {
      st.bar = m.def.maxLife * BAR_SHARE;
      w.events.push({ t: 'window', id: m.id, kind: 'replated' });
    }
    return;
  }
  st.bar -= dot * BAR_DOT;
  if (st.bar <= 0) {
    // The plates give: it stops dead, and takes more for a while.
    st.brokenT = BROKEN_SECONDS;
    m.stunT = Math.max(m.stunT, BROKEN_SECONDS);
    m.action = null;
    w.events.push({ t: 'window', id: m.id, kind: 'broken' });
    w.events.push({ t: 'stun', dst: m.id, dur: BROKEN_SECONDS });
    return;
  }
  st.grindT -= dt;
  if (st.grindT <= 0) {
    st.grindT = GRIND_EVERY;
    st.due = true;
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// The Sundered Twins (section 5d).

function tickTwins(st: BossState, dt: number): void {
  if (!st.grief) return;
  st.echoT -= dt;
  if (st.echoT <= 0 && !st.due) {
    st.echoT = ECHO_EVERY;
    st.due = true;
  }
}

/** One twin has fallen: the other takes it hard (faster, harder, and it sends the dead one's own kind of blow). */
function grieve(w: World, dead: Actor): void {
  const o = w.actors.find((x) => x !== dead && x.alive && states.get(x)?.id === 'twins');
  const st = o && states.get(o);
  if (!o || !st || st.grief) return;
  st.grief = true;
  st.echoT = ECHO_EVERY * 0.5;
  w.events.push({ t: 'window', id: o.id, kind: 'grief' });
}

/** The survivor casts the other's kind of blow: Ash sends Cinder's fire, Cinder sends Ash's steel. */
function echo(w: World, m: Actor, st: BossState): void {
  const p = w.player;
  const act = { profile: m.mon!.profile(0), aimX: p.x, aimY: p.y } as Action;
  const from = w.effects.length;
  castPattern(w, m, act, st.twin === 'ash' ? 'closingRing' : 'cross');
  const dtype = st.twin === 'ash' ? 3 : 0;
  for (let i = from; i < w.effects.length; i++) w.effects[i].dtype = dtype;
  w.events.push({ t: 'window', id: m.id, kind: 'echo' });
}

// ---------------------------------------------------------------------------------------------------------------------
// The Unmaker (section 9).

function hasTheft(w: World): boolean {
  const t = theftOf(w);
  return !!(t.res || t.defence || t.supports?.length || t.flasks);
}

/** The character's best defence, by what it does against this boss: armour, evasion, energy shield or block. */
function bestDefence(w: World, m: Actor): NonNullable<Theft['defence']> {
  const d = w.player.def;
  const hit = Math.max(1, monsterHitOf(m));
  const accuracy = m.mon!.profile(0).hands[0]?.accuracy ?? 0;
  // Each as the share of a blow it takes away: armour against its hit, evasion against its accuracy, the shield's share of
  // the pool, the chance to block.
  const scores: [NonNullable<Theft['defence']>, number][] = [
    ['armour', armourReduction(d.armour, hit)],
    ['evasion', 1 - hitChance(accuracy, d.evasion)],
    ['es', d.maxEs / Math.max(1, d.maxEs + d.maxLife)],
    ['block', d.blockAttack],
  ];
  scores.sort((a, b) => b[1] - a[1]);
  return scores[0][0];
}

/** The two supports of the main skill whose loss costs the most damage. */
function strongestSupports(w: World): number[] {
  const ch = w.char;
  const sups = ch.primary?.supports ?? [];
  if (sups.length === 0) return [];
  const opts = {
    areaLevel: w.plan.areaLevel,
    resistPenalty: w.plan.resistPenalty,
    extraMods: w.plan.affixes.flatMap((id) => affixPlayerMods(id, w.plan.areaLevel)),
    charges: ch.charges,
  };
  const base = scenarioDps(ch.sheet(undefined, 'boss'));
  const loss = sups.map((s) => {
    const prior = theftOf(w);
    setTheft(w, { supports: [s.gem.uid] });
    const without = new Character(theftBuild(w, w.build), opts);
    setTheft(w, prior);
    return { uid: s.gem.uid, loss: base - scenarioDps(without.sheet(undefined, 'boss')) };
  });
  loss.sort((a, b) => b.loss - a.loss);
  return loss.slice(0, 2).map((x) => x.uid);
}

/** Take the next piece: it leaves the character and orbits the Unmaker as a shard. */
function steal(w: World, m: Actor, st: BossState, kind: TheftKind): void {
  const t: Theft = { ...theftOf(w) };
  const p = w.player;
  if (kind === 'resistance') {
    const res = p.def.res;
    const el = ([1, 2, 3] as const).reduce((a, b) => (res[b] > res[a] ? b : a));
    t.res = el;
    // It hits in the element it took, and wears its colour.
    const share = m.life / m.def.maxLife;
    m.mon = buildMonster({ ...m.mon!.spec, variant: VARIANT_OF[el] });
    m.def = m.mon.defence;
    m.life = share * m.def.maxLife;
  } else if (kind === 'defence') t.defence = bestDefence(w, m);
  else if (kind === 'supports') t.supports = strongestSupports(w);
  else t.flasks = true;
  setTheft(w, t);
  rebuildForTheft(w);
  refreshPlayerDefence(w);
  const angle = (st.shards.length / 4) * Math.PI * 2;
  const shard = bring(w, m, 'shard', m.x, m.y);
  const life = m.def.maxLife * SHARD_LIFE;
  shard.def = { ...shard.def, maxLife: life };
  shard.life = life;
  shard.name = SHARD_NAMES[kind];
  st.shards.push({ actor: shard, kind, angle });
  w.events.push({ t: 'window', id: m.id, kind: `stolen.${kind}` });
}

const SHARD_NAMES: Record<TheftKind, string> = {
  resistance: 'Shard of your resistance',
  defence: 'Shard of your defence',
  supports: 'Shard of your supports',
  flasks: 'Shard of your flasks',
};

/** A piece comes back to the character. */
function giveBack(w: World, kind: TheftKind): void {
  const t: Theft = { ...theftOf(w) };
  if (kind === 'resistance') delete t.res;
  else if (kind === 'defence') delete t.defence;
  else if (kind === 'supports') delete t.supports;
  else delete t.flasks;
  setTheft(w, t);
  rebuildForTheft(w);
  refreshPlayerDefence(w);
}

function tickUnmaker(w: World, m: Actor, st: BossState, dt: number): void {
  if (st.exposedT > 0) st.exposedT -= dt;
  // The damage it has been dealt fades over the window; the share of the type it has had most of hardens it.
  const fade = Math.exp(-dt / ADAPT_WINDOW);
  let total = 0;
  for (let i = 0; i < 5; i++) {
    st.dealt[i] *= fade;
    total += st.dealt[i];
  }
  for (let i = 0; i < 5; i++) {
    const share = total > 0 ? st.dealt[i] / total : 0;
    st.adapt[i] = ADAPT_MAX * Math.max(0, (share - 0.2) / 0.8);
  }
  // The thefts, at their marks of its life.
  while (st.thefts < THEFT_AT.length && m.life <= m.def.maxLife * THEFT_AT[st.thefts]) {
    steal(w, m, st, THEFT_ORDER[st.thefts]);
    st.thefts++;
  }
  // The shards circle it.
  const t = w.t * 0.9;
  for (const s of st.shards) {
    if (!s.actor.alive) continue;
    s.actor.x = m.x + Math.cos(t + s.angle) * SHARD_ORBIT;
    s.actor.y = m.y + Math.sin(t + s.angle) * SHARD_ORBIT;
  }
  // While it holds the flasks, it drinks them.
  if (theftOf(w).flasks)
    m.life = Math.min(m.def.maxLife, m.life + m.def.maxLife * DRINK_REGEN * dt);
}

/** What the HUD's boss bar says of a boss now (docs/BOSSES.md 10). */
export function bossReadout(w: World, m: Actor): string[] {
  const st = states.get(m);
  if (!st) return [];
  const out: string[] = [];
  switch (st.id) {
    case 'tollkeeper':
      out.push(`Tolls: ${st.tolls}`);
      out.push(st.tellT > 0 ? 'Tolling: stun it now!' : `Next toll in ${Math.ceil(st.clock)}s`);
      break;
    case 'courser':
      out.push(st.gait === 'canter' ? 'Circling' : 'Galloping');
      break;
    case 'magistrate': {
      const n = livingWitnesses(st);
      out.push(`Witnesses: ${n}`);
      out.push(
        st.countT > 0
          ? `Sentence in ${st.countT.toFixed(1)}s`
          : `Next Sentence in ${Math.ceil(st.sentenceT)}s`,
      );
      break;
    }
    case 'prismWarden':
      out.push(
        st.shiftT > 0
          ? 'Shifting'
          : `Attuned to ${VARIANT_OF[st.element]}${st.fracturedT > 0 ? `, fractured to ${VARIANT_OF[st.fractured as 1 | 2 | 3]}` : ''}`,
      );
      break;
    case 'rotwife':
      out.push(`Next blow: ${ROT_ROTATION[st.rot % ROT_ROTATION.length]}`);
      if (st.regrowing) out.push('Regrowing');
      break;
    case 'siegeMarshal':
      if (st.holding) {
        out.push(`Regiment ${st.wave} of ${WAVES}: ${livingSoldiers(st)} standing`);
        if (commandLess(st) > 0) out.push(`Takes ${Math.round(commandLess(st) * 100)}% less`);
      } else if (st.routedT > 0) out.push('Routed');
      break;
    case 'duellist':
      out.push(
        st.veiled ? 'Veiled' : st.flurryT > 0 ? 'Lunging' : st.bareT > 0 ? 'Bare' : 'Unveiled',
      );
      break;
    case 'bulwarkEngine':
      out.push(
        st.brokenT > 0
          ? 'Plates broken'
          : `Plating ${Math.max(0, Math.round((st.bar / (m.def.maxLife * BAR_SHARE)) * 100))}%`,
      );
      break;
    case 'twins':
      if (st.grief) out.push('Grieving');
      break;
    case 'unmaker': {
      const held = st.shards.filter((s) => s.actor.alive).map((s) => s.kind);
      if (held.length) out.push(`Holds your ${held.join(', ')}`);
      const top = st.adapt.indexOf(Math.max(...st.adapt));
      if (st.adapt[top] > 0.05)
        out.push(`Hardened to ${DTYPE_NAMES[top]} (${Math.round(st.adapt[top] * 100)}%)`);
      if (st.exposedT > 0) out.push('Exposed');
      break;
    }
  }
  void w;
  return out;
}

const DTYPE_NAMES = ['physical', 'lightning', 'cold', 'fire', 'chaos'];

/** The shards the Unmaker holds, and the Witnesses of a court: what the character goes for first (section 11.1). */
export const PRIORITY_TYPES: ReadonlySet<MonsterTypeId> = new Set<MonsterTypeId>([
  'witness',
  'shard',
]);

export { BOSSES };
