import {
  AILMENT_NAMES,
  resolveHit,
  shockTaken,
  takenAs,
  type HitResult,
  type TargetState,
} from '../calc/combat';
import { reservedMana } from './reserve';
import {
  dotSources,
  monsterSrc,
  noteDamage,
  noteDealt,
  noteHit,
  noteMiss,
  notePools,
  type DmgSrc,
  type DotShare,
} from './ledger';
import { levelPenalty } from '../calc/formulas';
import { levelValue } from '../calc/gems';
import { abilitiesOf } from '../data/abilities';
import type { SkillProfile } from '../calc/skill';
import {
  BLEED_MOVING_MULT,
  CULLING_SHARE,
  FLASK_CHARGES_ON_KILL,
  LEECH_INSTANCE_MAX,
  LEECH_RATE_CAP,
  LEECH_RATE_PER_INSTANCE,
  LOW_LIFE,
  RECENT,
  FREEZE_GRACE,
  STUN_GRACE,
  WOUND_DANCE_STACKS,
} from '../data/constants';
import { CRESCENDO_STEP_BONUS } from '../data/mapTypes';
import { cannotBleed } from '../data/monsters';
import { BANNER_SHIFT, BUFFS, BUFF_IDS, DYN_SHIFT } from '../data/buffs';
import { MONSTER_CONDS, scaleOf } from '../calc/monster';
import { AURA_CONDS, WIELD_CONDS } from '../calc/staticConds';
import type { ModCtx } from '../mods/modDb';
import { maskIntersects, maskOr, tagBit, type CondId, type Mod } from '../mods/types';
import { bannerStage } from './banners';
import { invulnerable, reprieveFires } from './reprieve';
import { rollGains } from './buffs';
import { gainTrophy, rollCharges } from './charges';
import { ALL_HEX_IDS, HEXES } from '../data/hexes';
import { mineAuraAt, mineAuraHit } from './deploy';
import { refreshOnKill, stanceFarLess } from './stances';
import { afterPlayerHit } from './supportFx';
import { applyHex, applyPlayerHexes, hexHit, hexKill, tickHexes } from './hexes';
import {
  applyStatus,
  BLIND_SECONDS,
  blindPlayer,
  blockLessOf,
  hitChanceFactor,
  hitTakenExtra,
  rollStatuses,
  statusTaken,
  tickStatuses,
} from './statuses';
import { damageMult, hexPlayerAtRandom, onMonsterDeath, shieldedByPylon } from './factions';
import {
  counterBlow,
  markedMult,
  modeTaken,
  noteAttacked,
  noteTaken,
  turnsAside,
} from './encounters';
import { CURL_LESS, CURL_SECONDS } from '../data/encounters';
import { CRIT_ON_CONSECRATED, consecratedAt, fieldKill } from './fields';
import { spreadAilments } from './proliferate';
import {
  applyBurning,
  applyDecay,
  applyFlatDot,
  applySkillDot,
  decaySkillDots,
  spreadSkillDots,
  sumSkillDots,
  type SkillDot,
} from './skillDots';
import { corpseBlast, fireTriggers } from './triggers';
import { scaleProfile } from './shots';
import { chargedDeath, frostBite, gainVirulence, shellTakes } from './skillFx';
import { spawnMonster } from './world';
import { afflictPlayer, bossLocked, flaskWards, isBossSide, lockBoss } from './afflict';
import { bossHitPlayer, bossVeiled } from './bosses';
import type { Actor, Dot, World } from './types';
import { hunted, livingEnemiesOf, MONSTERS } from './side';
import type { Side } from './side';

const CHAOS = 4;
/** Seconds of damage kept for the death recap. */
const DAMAGE_LOG_TIME = 10;
/** Share of a melee hit that a Thorned monster reflects as physical damage. */
const THORNS_SHARE = 0.1;
const OVERLOAD_TIME = 8;

export function lifeCap(a: Actor): number {
  return a.isPlayer ? Math.max(1, a.def.maxLife - a.side!.char.reservedLife) : a.def.maxLife;
}

/** What makes each condition true for the player; a condition is only evaluated when this character's mods use it. */
type PlayerTest = (w: World, p: Actor) => boolean;
const PLAYER_TESTS: Partial<Record<CondId, PlayerTest>> = {
  onFullLife: (_w, p) => p.life >= lifeCap(p) - 0.5,
  onLowLife: (_w, p) => p.life <= p.def.maxLife * LOW_LIFE,
  killedRecently: (_w, p) => p.since.kill < RECENT,
  critRecently: (_w, p) => p.since.crit < RECENT,
  hitRecently: (_w, p) => p.since.hit < RECENT,
  usedFlaskRecently: (_w, p) => p.since.flask < RECENT,
  flaskActive: (_w, p) => p.side!.flasks.some((f) => f.activeT > 0),
  dualWielding: (_w, p) => p.side!.char.dualWielding,
  holdingShield: (_w, p) => p.side!.char.holdingShield,
  stunnedRecently: (_w, p) => p.since.stunEnemy < RECENT,
  overloadActive: (_w, p) => p.since.overload < OVERLOAD_TIME,
  blockedRecently: (_w, p) => p.since.block < RECENT,
  beenHitRecently: (_w, p) => p.since.beenHit < RECENT,
  leeching: (_w, p) => p.leech.life.length > 0,
  leechingEs: (_w, p) => p.leech.es.length > 0,
  esFull: (_w, p) => p.def.maxEs > 0 && p.es >= p.def.maxEs - 0.5,
  onLowMana: (_w, p) => p.mana <= Math.max(1, p.def.maxMana - reservedMana(p.side!)) * LOW_LIFE,
  cursed: (_w, p) => p.hexes.length > 0,
  stationary: (_w, p) => !p.moving,
  elemFire: (_w, p) => p.side!.elem === 3,
  elemCold: (_w, p) => p.side!.elem === 2,
  elemLightning: (_w, p) => p.side!.elem === 1,
  ignited: (_w, p) => p.ail.ignites.length > 0,
  shocked: (_w, p) => p.ail.shock > 0,
  chilled: (_w, p) => p.ail.chill > 0,
  frozen: (_w, p) => p.ail.freezeT > 0,
  bleeding: (_w, p) => p.ail.bleeds.length > 0,
  poisoned: (_w, p) => p.ail.poisons.length > 0,
};
for (const [id, tag] of WIELD_CONDS) PLAYER_TESTS[id] = (_w, p) => p.side!.char.weaponTags.has(tag);
for (const [id, gem] of AURA_CONDS)
  PLAYER_TESTS[id] = (_w, p) => p.side!.char.auras.some((a) => a.active && a.def.id === gem);
for (const id of BUFF_IDS) {
  const cond = BUFFS[id].cond;
  PLAYER_TESTS[cond] = (_w, p) => p.side!.buffT[id] > 0;
}

type TargetTest = (t: Actor, from: Actor) => boolean;
const TARGET_TESTS: Partial<Record<CondId, TargetTest>> = {
  targetCursed: (t) => t.hexes.length > 0,
  targetIgnited: (t) => t.ail.ignites.length > 0,
  targetShocked: (t) => t.ail.shock > 0,
  targetFullLife: (t) => t.life >= t.def.maxLife - 0.5,
  targetChilled: (t) => t.ail.chill > 0,
  targetFrozen: (t) => t.ail.freezeT > 0,
  targetBleeding: (t) => t.ail.bleeds.length > 0,
  targetPoisoned: (t) => t.ail.poisons.length > 0,
  targetStunned: (t) => t.stunT > 0,
  targetLowLife: (t) => t.life <= t.def.maxLife * LOW_LIFE,
  targetRareOrUnique: (t) => t.rarity === 'rare' || t.rarity === 'miniboss' || t.rarity === 'boss',
  targetNearby: (t, from) => Math.hypot(t.x - from.x, t.y - from.y) <= 2 + t.r,
};

// What waits for a particular curse or mark on the target (the bonuses against Despair, Punishment and the marks).
for (const id of ALL_HEX_IDS) {
  const cond = HEXES[id].selfCond;
  if (cond) TARGET_TESTS[cond] = (t) => t.hexes.some((h) => h.id === id);
}

type Compiled = { n: number; player: [number, PlayerTest][]; target: [number, TargetTest][] };
const compiled = new WeakMap<object, Compiled>();

/** The tests of the conditions a character's mods use, with their bits (rebuilt if it registers more). */
function condTests(s: Side): Compiled {
  const idx = s.char.cond;
  let c = compiled.get(idx);
  if (!c || c.n !== idx.ids.length) {
    c = { n: idx.ids.length, player: [], target: [] };
    idx.ids.forEach((id, i) => {
      const pt = PLAYER_TESTS[id];
      const tt = TARGET_TESTS[id];
      if (pt) c!.player.push([2 ** i, pt]);
      else if (tt) c!.target.push([2 ** i, tt]);
    });
    compiled.set(idx, c);
  }
  return c;
}

/** Bitmask of the player's active conditions (§7.3), optionally against a target. Bits are the character's own. */
export function playerConds(w: World, s: Side, target: Actor | null): number {
  const p = s.player;
  const t = condTests(s);
  let c = 0;
  for (const [bit, test] of t.player) if (test(w, p)) c = maskOr(c, bit);
  if (target) for (const [bit, test] of t.target) if (test(target, p)) c = maskOr(c, bit);
  return c;
}

/**
 * The query context for a stat of the character that is not about a skill (a gain on a kill, a loot multiplier): the
 * conditions that hold now, and the values a `per` mod counts (charges held, attributes). Asking with the empty context
 * would miss every mod that holds only under a condition.
 */
export function playerCtx(w: World, s: Side, tags = 0, ancestry = 0): ModCtx {
  return { tags, ancestry, conds: playerConds(w, s, null), statValue: s.char.statValue };
}

/** The conditions about a target, as a mask in the character's own bits. */
export function targetConds(s: Side, t: Actor, from: Actor): number {
  let c = 0;
  for (const [bit, test] of condTests(s).target) if (test(t, from)) c = maskOr(c, bit);
  return c;
}

export function monsterConds(a: Actor): number {
  return a.life <= a.def.maxLife * LOW_LIFE ? MONSTER_CONDS.peek('onLowLife') : 0;
}

export function flaskMask(s: Side): number {
  let m = s.rage << DYN_SHIFT;
  // A banner that stands gives the character more of its buff for each stage it was put down with.
  if (s.banner?.placed) m |= s.banner.stages << BANNER_SHIFT;
  s.flasks.forEach((f, i) => {
    if (f.activeT > 0 && f.spec.buff.length) m |= 1 << i;
  });
  return m;
}

/** Refresh the player's cached defence for the current conditions and flasks. */
export function refreshPlayerDefence(w: World, s: Side): void {
  const p = s.player;
  p.def = s.char.defence(playerConds(w, s, null), flaskMask(s));
  const cap = lifeCap(p);
  if (p.life > cap) p.life = cap;
  if (p.es > p.def.maxEs) p.es = p.def.maxEs;
  if (p.mana > p.def.maxMana - reservedMana(s))
    p.mana = Math.max(0, p.def.maxMana - reservedMana(s));
}

export function targetState(a: Actor): TargetState {
  // Brittle Doom lowers the three elemental resistances; Open Wounds adds physical vulnerability; exposure and the like add to them.
  const st = statusTaken(a);
  const resShift = a.resShift.v.map((r, i) => r - a.hex.res[i] - st.res[i]);
  return {
    def: a.def,
    shock: a.ail.shock,
    resShift,
    vuln: a.hex.vuln,
    vulnAll: a.hex.vulnAll,
    vulnType: st.vulnType,
    blockLess: blockLessOf(a),
    evasionLess: a.hex.more.evasion,
    physRedLess: a.hex.more.physRed,
    bleedChance: a.hex.more.bleedHit,
    stunBonus: a.hex.more.stun,
    es: a.es,
    poisons: a.ail.poisons.length,
  };
}

/**
 * Route damage per type into ES / mana / life (§6.3). Chaos bypasses ES. Returns total dealt.
 */
export function applyDamage(w: World, dst: Actor, dmg: number[], src?: DmgSrc): number {
  if (!dst.alive || dst.phaseT > 0 || dst.burrowT > 0) return 0;
  // Just after a Revive the character cannot be hurt (docs/WAYSIDE.md 7).
  if (dst.isPlayer && invulnerable(dst.side!)) return 0;
  // A veiled monster that is hit is seen for a moment.
  if (!dst.isPlayer && dst.revealT < 1) dst.revealT = 1;
  if (dst.mon) {
    // A Bone Beetle curled up takes 80% less physical damage; a Warden Pylon makes its allies untouchable.
    if (dst.curlT > 0) dmg[0] *= 1 - CURL_LESS;
    if (w.hasPylons && shieldedByPylon(w, dst)) return 0;
  }
  // Crescendo: the monsters grow stronger with time. What they deal is raised, and what they take is cut by the
  // same step (so they have more life), without rebuilding them (docs/MAPS.md 9.1).
  if (w.surge > 0) {
    const f = 1 + CRESCENDO_STEP_BONUS * w.surge;
    const m = dst.team === 1 ? 1 / f : f;
    for (let i = 0; i < 5; i++) dmg[i] *= m;
  }
  let total = 0;
  for (let i = 0; i < 5; i++) total += dmg[i];
  if (total <= 0) return 0;
  // A shell takes most of what hits the character, up to its pool.
  if (dst.isPlayer && dst.side!.shell) {
    const taken = shellTakes(dst.side!, total);
    if (taken > 0) {
      const f = 1 - taken / total;
      for (let i = 0; i < 5; i++) dmg[i] *= f;
      total -= taken;
      if (total <= 0) return 0;
    }
  }
  noteDamage(w, dst, dmg, src);
  const def = dst.def;
  let rest = total - dmg[CHAOS];
  let chaos = dmg[CHAOS];
  if (def.immuneChaos) chaos = 0;
  // Embalmer-style rule: chaos damage hits energy shield like any other damage.
  if (def.chaosHitsEs) {
    rest += chaos;
    chaos = 0;
  }
  // ES absorbs non-chaos damage first (unless it protects mana instead).
  let esTaken = 0;
  let manaTaken = 0;
  if (!def.esProtectsMana && dst.es > 0) {
    const a = Math.min(dst.es, rest);
    dst.es -= a;
    rest -= a;
    esTaken = a;
  }
  let lifeDmg = rest + chaos;
  if (def.manaBeforeLife > 0 && dst.mana > 0) {
    const m = Math.min(dst.mana, lifeDmg * def.manaBeforeLife);
    dst.mana -= m;
    lifeDmg -= m;
    manaTaken = m;
  }
  if (dst.isPlayer) notePools(dst.side!, esTaken, manaTaken, lifeDmg);
  dst.life -= lifeDmg;
  if (dst.life <= 0) dst.overkill = -dst.life;
  dst.since.damaged = 0;
  if (dst.isPlayer && dst.side!.opts.godMode && dst.life <= 0) dst.life = 1;
  if (dst.isPlayer) dst.side!.stats.damageTaken += total;
  noteDealt(w, dst, dmg, total, src);
  // A Reprieve held fires when this would be the end (docs/WAYSIDE.md 7); the damage still counts as taken.
  if (dst.isPlayer && dst.life <= 0 && reprieveFires(w, dst.side!)) return total;
  if (dst.life <= 0) killActor(w, dst);
  return total;
}

function addLeech(
  src: Actor,
  list: 'life' | 'mana' | 'es',
  amount: number,
  instant: boolean,
): void {
  if (amount <= 0) return;
  amount = Math.min(
    amount,
    LEECH_INSTANCE_MAX *
      (list === 'life' ? src.def.maxLife : list === 'es' ? src.def.maxEs : src.def.maxMana),
  );
  if (instant) {
    if (list === 'life') src.life += amount;
    else if (list === 'es') src.es = Math.min(src.def.maxEs, src.es + amount);
    else src.mana += amount;
    return;
  }
  const arr = src.leech[list];
  if (arr.length < 40) arr.push(amount);
}

/** An enemy struck is thrown back, away from the attacker, up to the distance or the first wall; bosses stand fast, and so do training dummies that are fixed (src/sim/dummy.ts). */
export function knockBack(w: World, src: Actor, dst: Actor, dist: number): void {
  if (!dst.alive || dst.team === src.team || dst.rarity === 'boss' || (dst.dummy && dst.stationary))
    return;
  const ang = Math.atan2(dst.y - src.y, dst.x - src.x);
  const step = 0.25;
  let x = dst.x;
  let y = dst.y;
  for (let d = step; d <= dist + 1e-6; d += step) {
    const c = w.grid.collide(dst.x + Math.cos(ang) * d, dst.y + Math.sin(ang) * d, dst.r);
    if (Math.hypot(c.x - (dst.x + Math.cos(ang) * d), c.y - (dst.y + Math.sin(ang) * d)) > 0.05)
      break;
    x = c.x;
    y = c.y;
  }
  dst.x = x;
  dst.y = y;
}

/** Apply a resolved hit from `src` to `dst`, including leech, ailments, stun and kill effects. */
export function applyHit(w: World, src: Actor, dst: Actor, p: SkillProfile, res: HitResult): void {
  if (src.isPlayer) {
    const mine = src.side!;
    mine.lastOutcome = res.outcome === 'hit' ? 'hit' : res.outcome === 'block' ? 'block' : 'miss';
    if (res.outcome === 'hit') {
      mine.hitsLanded++;
      if (mine.critLock === null) mine.critSeen = res.crit;
    }
  }
  // An Aegis counts the time since it was last attacked, whatever came of the attack.
  if (dst.enc) noteAttacked(dst);
  // The map report names what dealt the hit (for hits on a character or on a monster, and a side's hits on another side's minion).
  const how =
    dst.isPlayer || dst.team === MONSTERS || (src.side && dst.team !== src.team)
      ? sourceOf(src, dst, p)
      : undefined;
  if (res.outcome === 'miss') {
    w.events.push({ t: 'miss', src: src.id, dst: dst.id });
    if (how) noteMiss(w, dst, how, false);
    wake(w, dst);
    return;
  }
  // A monster's guard (a Brace, an Aegis, a stone skin, a Sanctuary) turns the hit aside: no damage, no ailment, no leech.
  // Damage over time goes on (docs/ENCOUNTERS.md 5).
  if (dst.mon && turnsAside(w, dst, src)) {
    if (how) noteMiss(w, dst, how, true);
    if (src.isPlayer) src.side!.lastOutcome = 'block';
    w.events.push({ t: 'block', src: src.id, dst: dst.id });
    wake(w, dst);
    return;
  }
  // Feeble Grip makes a hexed attacker deal less; the auras and Fervour of the Choir make its monsters deal more.
  const dealt = damageMult(src);
  if (dealt !== 1 && res.outcome !== 'block') {
    for (let i = 0; i < res.dmg.length; i++) res.dmg[i] *= dealt;
    res.total *= dealt;
  }
  // Infused Channelling: while channelling, hits of the types the skill is made of do less.
  if (dst.isPlayer && res.outcome !== 'block' && dst.side!.channel?.profile.infuse) {
    const ch = dst.side!.channel.profile;
    const less = ch.infuse!.barrier / 100;
    const types = ['physical', 'lightning', 'cold', 'fire', 'chaos'];
    for (let i = 0; i < 5; i++)
      if ((ch.skill.tags as readonly string[]).includes(types[i])) {
        res.total -= res.dmg[i] * less;
        res.dmg[i] *= 1 - less;
      }
  }
  // Rimeplate: what hits the character is chilled a moment.
  if (dst.isPlayer && src.team !== dst.team && res.outcome === 'hit' && dst.side!.char.frostSpec)
    frostBite(dst.side!, src);
  // Flesh and Stone in the Sand stance: attacks by enemies that are not near do less.
  if (dst.isPlayer && src.team !== dst.team && res.outcome !== 'block' && p.isAttack) {
    const far = stanceFarLess(dst.side!);
    if (far && Math.hypot(src.x - dst.x, src.y - dst.y) > far.radius + src.r) {
      for (let i = 0; i < res.dmg.length; i++) res.dmg[i] *= 1 - far.less;
      res.total *= 1 - far.less;
    }
  }
  // Immortal Call: the endurance spent makes the physical part of a hit smaller while the guard stands.
  const guard = dst.isPlayer ? dst.side!.guard : null;
  if (guard && dst.side!.buffT[guard.buff] > 0 && res.outcome !== 'block') {
    res.total -= res.dmg[0] * (1 - guard.physMult);
    res.dmg[0] *= guard.physMult;
  }
  // Traps and mines hit a shackled enemy harder; a snared one takes more from projectile attacks.
  if (src.isPlayer && dst.team !== src.team && res.outcome !== 'block') {
    const extra = hitTakenExtra(dst, p);
    if (extra > 0) {
      for (let i = 0; i < res.dmg.length; i++) res.dmg[i] *= 1 + extra;
      res.total *= 1 + extra;
    }
  }
  // Marked by a Handler: its pack hits the character harder (docs/ENCOUNTERS.md 7).
  if (dst.isPlayer && src.mon && res.outcome !== 'block') {
    const k = markedMult(w, src);
    if (k !== 1) {
      for (let i = 0; i < 5; i++) res.dmg[i] *= k;
      res.total *= k;
    }
  }
  if (
    src.modIds.includes('hexcaller') &&
    dst.isPlayer &&
    res.outcome === 'hit' &&
    src.hex.cd <= 0
  ) {
    src.hex.cd = 4;
    hexPlayerAtRandom(w, dst.side!);
  }
  // A monster's modes change what the hit does to it: exposed, quenched, swollen, fed by fire (docs/ENCOUNTERS.md 6).
  if (dst.enc && res.outcome !== 'block') {
    modeTaken(w, dst, res.dmg);
    res.total = res.dmg[0] + res.dmg[1] + res.dmg[2] + res.dmg[3] + res.dmg[4];
  }
  if (res.outcome === 'block') {
    w.events.push({ t: 'block', src: src.id, dst: dst.id });
    if (how) noteMiss(w, dst, how, true);
    dst.since.block = 0;
    if (dst.isPlayer) {
      rollCharges(w, dst.side!, 'block');
      rollGains(w, dst.side!, 'block');
    }
    if (dst.def.lifeOnBlockPct > 0 || dst.def.lifeOnBlock > 0)
      dst.life = Math.min(
        lifeCap(dst),
        dst.life + dst.def.maxLife * dst.def.lifeOnBlockPct + dst.def.lifeOnBlock,
      );
    if (dst.isPlayer && dst.def.manaOnBlock > 0)
      dst.mana = Math.min(
        Math.max(0, dst.def.maxMana - reservedMana(dst.side!)),
        dst.mana + dst.def.manaOnBlock,
      );
    // Blocking staggers the character for a moment (3.9 block recovery), once it has recovered from the last stagger.
    if (
      dst.isPlayer &&
      dst.def.blockStagger > 0 &&
      dst.stunT <= 0 &&
      dst.graceT <= 0 &&
      !dst.side!.channel?.profile.skill.channel?.stunImmune
    ) {
      dst.stunT = dst.def.blockStagger;
      dst.action = null;
      w.events.push({ t: 'stun', dst: dst.id, dur: dst.def.blockStagger });
    }
    wake(w, dst);
    if (dst.isPlayer) fireTriggers(w, dst.side!, { on: 'block' });
    // A skill that wears blocking down leaves a blocking enemy Overpowered.
    if (src.isPlayer && dst.team !== src.team) rollStatuses(w, dst, p, true);
    return;
  }
  let dtype = 0;
  for (let i = 1; i < 5; i++) if (res.dmg[i] > res.dmg[dtype]) dtype = i;
  w.events.push({ t: 'hit', src: src.id, dst: dst.id, amount: res.total, crit: res.crit, dtype });
  if (how) noteHit(w, dst, how, res.total, res.crit);
  if (dst.isPlayer) logDamage(w, dst, src, src.name, dtype, res.total);
  src.since.hit = 0;
  dst.since.beenHit = 0;
  if (src.isPlayer) {
    rollGains(w, src.side!, 'hit', p.gains);
    rollCharges(w, src.side!, 'hit', p.gains);
    if (p.skill.behaviour.kind === 'melee') {
      rollGains(w, src.side!, 'meleeHit', p.gains);
      rollCharges(w, src.side!, 'meleeHit', p.gains);
    }
  }
  if (dst.isPlayer) {
    rollGains(w, dst.side!, 'hitTaken');
    rollCharges(w, dst.side!, 'hitTaken');
  }
  if (res.crit) {
    src.since.crit = 0;
    if (src.isPlayer) {
      rollCharges(w, src.side!, 'crit', p.gains);
      rollGains(w, src.side!, 'crit', p.gains);
    }
    if (p.overload) src.since.overload = 0;
  }
  // A carapace: no single hit takes more than a share of the monster's life (docs/ROSTER.md 6.2).
  const cap = dst.isPlayer ? undefined : dst.mon?.hitCap;
  if (cap) {
    const total = res.dmg[0] + res.dmg[1] + res.dmg[2] + res.dmg[3] + res.dmg[4];
    const most = cap * dst.def.maxLife;
    if (total > most) for (let i = 0; i < 5; i++) res.dmg[i] *= most / total;
  }
  // Leech and life on hit. Some monsters cannot be leeched from; some gear makes crit leech instant.
  const instant =
    src.def.instantLeech || p.instantLeechAlways || (res.crit && p.instantLeechOnCrit);
  let ll = 0;
  let lm = 0;
  if (!dst.def.cannotBeLeechedFrom)
    for (let i = 0; i < 5; i++) {
      ll += res.dmg[i] * p.leechLife[i];
      lm += res.dmg[i] * p.leechMana[i];
    }
  if (src.def.leechToEs && instant) src.es = Math.min(src.def.maxEs, src.es + ll);
  else addLeech(src, 'life', ll, instant);
  addLeech(src, 'mana', lm, instant);
  // Energy shield leeched from the damage (Energy Leech).
  let le = 0;
  if (!dst.def.cannotBeLeechedFrom)
    for (let i = 0; i < 5; i++) le += res.dmg[i] * (p.leechEs[i] ?? 0);
  if (le > 0) addLeech(src, 'es', le, instant);
  if (p.lifeOnHit > 0) src.life = Math.min(lifeCap(src), src.life + p.lifeOnHit);
  if (p.esOnHit > 0 && src.isPlayer) src.es = Math.min(src.def.maxEs, src.es + p.esOnHit);
  if (p.manaOnHit > 0 && src.isPlayer)
    src.mana = Math.min(
      Math.max(0, src.def.maxMana - reservedMana(src.side!)),
      src.mana + p.manaOnHit,
    );

  const wasAlive = dst.alive;
  if (src.isPlayer) applyPlayerHexes(w, src.side!, dst);
  if (src.isPlayer) noteCause(dst, p.tagMask, false, p.gains, src.side!);
  applyDamage(w, dst, res.dmg, how);
  // A mark gives life and mana back on each attack hit.
  if (src.isPlayer && p.isAttack)
    hexHit(w, src.side!, dst, maskIntersects(p.tagMask, tagBit('melee')));
  if (wasAlive && dst.alive) {
    if (src.isPlayer) {
      rollStatuses(w, dst, p, false, res);
      // Vulnerability: a chance to be maimed by an attack.
      if (p.isAttack && dst.hex.more.maimHit > 0 && w.rngTrig.chance(dst.hex.more.maimHit))
        applyStatus(w, dst, 'maim', { seconds: 4 });
    }
    payImpales(w, dst, src.side ?? undefined);
    recordImpale(w, src.side!, dst, p, res);
    reflectBack(w, src, dst, p, res);
    // Culling strike: a hit that leaves the target at 10% life or less finishes it.
    if (p.culling && dst.team !== src.team && dst.life <= dst.def.maxLife * CULLING_SHARE)
      killActor(w, dst);
  }
  // A beetle that is hit curls up for a moment (then cannot again for three seconds); fire opens it again.
  if (wasAlive && dst.alive && dst.mon?.spec.type === 'beetle') {
    if (dst.curlT > 0 && res.dmg[3] > 0) dst.curlT = 0;
    else if (dst.skillT <= 0) {
      dst.curlT = CURL_SECONDS;
      dst.skillT = 3;
    }
  }
  // What a monster has taken feeds its modes (a Fade, a Core vent, a Quench), and a Counter-stance answers a blow.
  if (dst.enc && wasAlive) {
    noteTaken(w, dst, res.dmg);
    counterBlow(w, dst, src, p);
  }
  wake(w, dst);
  if (src.isPlayer && res.outcome === 'hit') afterPlayerHit(w, src.side!, dst, p);
  // Siphoning monsters drain the player's mana; Thorned monsters reflect part of a melee hit.
  if (p.manaDrain > 0 && dst.isPlayer)
    dst.mana = Math.max(0, dst.mana - (dst.def.maxMana * p.manaDrain) / 100);
  if (src.isPlayer && wasAlive && p.skill.behaviour.kind === 'melee' && res.total > 0) {
    const share = thornsShare(dst);
    if (share > 0) rawHit(w, src, res.total * share, 0, null);
  }
  if (dst.isPlayer && src.mon) onMonsterHitPlayer(w, src, dst, p);
  const afterHit = () => {
    if (src.isPlayer)
      fireTriggers(w, src.side!, { on: 'hit', target: dst, tags: p.tagMask, crit: res.crit });
    if (dst.isPlayer) fireTriggers(w, dst.side!, { on: 'hitTaken', damage: res.total });
  };
  // Prismatic Balance: shift the target's elemental resistances.
  if (p.prismaticBalance) {
    for (let i = 1; i <= 3; i++) dst.resShift.v[i] = res.dmg[i] > 0 ? 25 : -50;
    dst.resShift.t = 5;
  }
  if (!wasAlive || !dst.alive) {
    afterHit();
    return;
  }
  // A boss's freeze or stun cannot come again soon after the last (docs/BOSSES.md rule 6).
  const bossLock = dst.isPlayer && isBossSide(src);
  if (bossLock && bossLocked(w)) {
    res.ailments.freeze = 0;
    res.stun = 0;
  }
  const frozeBefore = dst.ail.freezeT;
  applyAilments(w, src, dst, res, p);
  if (bossLock && (dst.ail.freezeT > frozeBefore || res.stun > 0)) lockBoss(w);
  if (src.isPlayer && dst.team !== src.team) {
    // Damage over time the skill (or a support) puts on what it hits.
    if (p.decay) applyDecay(w, dst, p.decay, src.side!);
    // A Ruthless Blow stuns.
    if (p.stunFixed && dst.stunT <= 0 && dst.graceT <= 0 && res.outcome === 'hit') {
      dst.stunT = p.stunFixed;
      dst.action = null;
      w.events.push({ t: 'stun', dst: dst.id, dur: p.stunFixed });
    }
    if (p.knockback > 0 && res.outcome === 'hit') knockBack(w, src, dst, p.knockback);
    // A frozen enemy on less than a third of its life is shattered.
    if (
      p.shatter &&
      dst.alive &&
      dst.ail.freezeT > 0 &&
      dst.life < dst.def.maxLife / 3 &&
      dst.rarity !== 'boss' &&
      dst.rarity !== 'miniboss'
    ) {
      w.events.push({ t: 'shatter', id: dst.id });
      killActor(w, dst);
      afterHit();
      return;
    }
    if (p.skillDot && !p.skillDot.spec.hitless && !p.skillDot.spec.ground) {
      applySkillDot(w, dst, p, { by: src.side! });
      const splash = p.skillDot.spec.splash;
      if (splash)
        for (const e of livingEnemiesOf(w, src.team))
          if (e !== dst && Math.hypot(e.x - dst.x, e.y - dst.y) <= splash * p.radiusMult + e.r)
            applySkillDot(w, e, p, { by: src.side! });
    }
  }
  if (res.stun > 0 && !(dst.isPlayer && dst.side!.channel?.profile.skill.channel?.stunImmune)) {
    dst.stunT = res.stun;
    dst.action = null;
    src.since.stunEnemy = 0;
    w.events.push({ t: 'stun', dst: dst.id, dur: res.stun });
    if (dst.isPlayer) fireTriggers(w, dst.side!, { on: 'stunned' });
    if (src.isPlayer) {
      rollGains(w, src.side!, 'stun', p.gains);
      rollCharges(w, src.side!, 'stun', p.gains);
    }
  }
  afterHit();
}

export function pushDot(list: Dot[], d: Dot, cap = 30): void {
  list.push(d);
  if (list.length > cap) {
    let wi = 0;
    for (let i = 1; i < list.length; i++) if (list[i].dps < list[wi].dps) wi = i;
    list.splice(wi, 1);
  }
}

function applyAilments(w: World, src: Actor, dst: Actor, res: HitResult, p: SkillProfile): void {
  const a = res.ailments;
  const ail = dst.ail;
  const d = dst.def;
  // Chances to avoid an ailment, and how long each lasts on this actor.
  for (const name of AILMENT_NAMES)
    if (a[name] > 0 && d.avoid[name] > 0 && w.rngCombat.chance(d.avoid[name])) a[name] = 0;
  // A cleansing flask that is running keeps its ailment off the character (3.9; docs/BOSSES.md 11.2).
  if (dst.isPlayer && dst.side!.flasks.some((f) => f.activeT > 0))
    for (const name of AILMENT_NAMES)
      if (a[name] > 0 && flaskWards(dst.side!, name === 'chill' ? 'freeze' : name)) a[name] = 0;
  if (a.ignite > 0) {
    const spreadR = Math.max(p.spreadAil.ignite, p.spreadAil.ele) * p.radiusMult;
    pushDot(ail.ignites, {
      dps: a.ignite,
      t: p.ignite.dur * d.durOnSelf.ignite,
      spread: spreadR > 0 ? spreadR : undefined,
      by: src.side ?? undefined,
    });
    ail.igniteMax = p.ignite.max;
    w.events.push({ t: 'ailment', dst: dst.id, kind: 'ignite' });
    // Combustion: an enemy ignited by the skill is weaker to fire for as long as it burns.
    if (p.igniteResShift > 0)
      applyStatus(w, dst, 'exposedFire', {
        seconds: p.ignite.dur * d.durOnSelf.ignite,
        v: p.igniteResShift,
      });
    // An ignite from a Torch Arrow also leaves a burning debuff worth a share of its damage.
    const bn = p.skill.burning;
    if (bn)
      applyBurning(
        w,
        dst,
        (a.ignite * levelValue(bn.pct, p.skill.level)) / 100,
        bn.seconds,
        bn.cap,
        src.side ?? undefined,
      );
  }
  if (a.bleed > 0 && !(dst.mon && cannotBleed(dst.mon.spec.type))) {
    pushDot(ail.bleeds, {
      dps: a.bleed,
      t: p.bleed.dur * d.durOnSelf.bleed,
      stack: p.woundDance,
      by: src.side ?? undefined,
    });
    w.events.push({ t: 'ailment', dst: dst.id, kind: 'bleed' });
  }
  if (a.poison > 0) {
    pushDot(
      ail.poisons,
      { dps: a.poison, t: p.poison.dur * d.durOnSelf.poison, by: src.side ?? undefined },
      400,
    );
    w.events.push({ t: 'ailment', dst: dst.id, kind: 'poison' });
    // Herald of Agony: a poison a side's hit put on an enemy (a monster, or the other side's character or minion) gives its side a
    // point of Virulence. (A monster's poison on a minion feeds the side it hunts, as it always has; on a character, nobody.)
    if (src.side ? dst.team !== src.side.team : !dst.isPlayer) {
      const owner = src.side ?? hunted(w, src).side!;
      if (owner.char.agonySpec) gainVirulence(w, owner);
    }
  }
  if (a.shock > 0 && a.shock >= ail.shock) {
    ail.shock = a.shock;
    ail.shockT = p.shock.dur * d.durOnSelf.shock;
    w.events.push({ t: 'ailment', dst: dst.id, kind: 'shock' });
  }
  if (a.chill > 0 && a.chill >= ail.chill) {
    ail.chill = a.chill;
    ail.chillT = p.chill.dur * d.durOnSelf.chill;
  }
  // The character is not frozen again while frozen or just after (stun has the same grace).
  const canFreeze = !dst.isPlayer || (ail.freezeT <= 0 && ail.freezeGraceT <= 0);
  if (a.freeze > 0 && canFreeze && a.freeze > ail.freezeT) {
    ail.freezeT = a.freeze * d.durOnSelf.freeze;
    w.events.push({ t: 'ailment', dst: dst.id, kind: 'freeze' });
  }
  if (p.spreadAil.ele > 0 && (a.shock > 0 || a.chill > 0 || a.freeze > 0))
    ail.spreadEle = Math.max(ail.spreadEle, p.spreadAil.ele * p.radiusMult);
}

/** Resolve and apply a hit from src to dst. */
export function hit(
  w: World,
  src: Actor,
  dst: Actor,
  p: SkillProfile,
  hand: number,
  dist: number,
): void {
  // A skill that deals no hit of its own only inflicts its debuff.
  if (src.isPlayer && p.skillDot?.spec.hitless) {
    if (!dst.alive) return;
    // Bane also puts the curses linked to it on the enemy, and grows with each.
    const bane = p.skillDot.spec.perCurse;
    if (bane) {
      const linked = src.side!.char.actives.find((x) => x.skill.id === p.skill.id)?.linked ?? [];
      const n = Math.min(linked.length, src.side!.char.hexLimit);
      for (const h of linked.slice(0, n))
        applyHex(w, dst, h.id, h.effect, src.side!.char.hexLimit, h.level);
      applySkillDot(w, dst, p, {
        more: levelValue(bane.more, p.skill.level) * n,
        seconds: p.skillDot.seconds * (1 + (bane.longer * n) / 100),
        by: src.side!,
      });
    } else applySkillDot(w, dst, p, { by: src.side! });
    // Where it lands counts as a hit for what a hit gives (Drain Trap with Static Snares), but a curse is not an attack.
    if (!p.skill.tags.includes('curse')) {
      rollGains(w, src.side!, 'hit', p.gains);
      rollCharges(w, src.side!, 'hit', p.gains);
    }
    wake(w, dst);
    return;
  }
  const canStun = dst.stunT <= 0 && dst.graceT <= 0;
  let h = p.hands[Math.min(hand, p.hands.length - 1)];
  const ts = targetState(dst);
  // A blinded attacker misses more, and an enfeebled one is less accurate and crits less.
  const hm = src.hex.more;
  ts.hitChanceMult = hitChanceFactor(src) * (1 - hm.acc * 0.5);
  // Consecrated ground makes hits against what stands on it crit twice as often.
  if (
    src.isPlayer &&
    dst.team !== src.team &&
    src.side!.fields.length > 0 &&
    consecratedAt(src.side!, dst.x, dst.y)
  )
    h = { ...h, critChance: h.critChance * CRIT_ON_CONSECRATED };
  // The Veiled Duellist's veil: nothing crits it while it is up (docs/BOSSES.md 5b).
  const veiled = dst.enc !== undefined && bossVeiled(dst);
  if (veiled) h = { ...h, critChance: 0 };
  if (hm.critChance > 0 || hm.critMulti > 0)
    h = {
      ...h,
      critChance: h.critChance * (1 - hm.critChance),
      critMulti: Math.max(1, h.critMulti - hm.critMulti),
    };
  // The mines near an enemy give the hits against it a chance to deal double damage, and some fire damage.
  const aura =
    src.isPlayer && src.side!.deployables.length > 0 ? mineAuraAt(src.side!, dst.x, dst.y) : null;
  // Enemies near mines of Stormblast type take more from every hit.
  if (aura && aura.taken > 0) p = scaleProfile(p, 1 + aura.taken / 100);
  if (aura && aura.double > 0)
    p = { ...p, doubleChance: Math.min(1, p.doubleChance + aura.double / 100) };
  // A charge counts the distance it ran, not the distance to the enemy.
  if (p.distMore?.travel && src.isPlayer) dist = src.side!.lastTravel;
  const wasFull = dst.life >= dst.def.maxLife - 0.5;
  const res = resolveHit(
    w.rngCombat,
    p,
    h,
    ts,
    dist,
    canStun,
    undefined,
    veiled ? false : (src.side?.critLock ?? undefined),
  );
  // A hit of Leap Slam always stuns an enemy that was on full life.
  if (p.stunFull > 0 && wasFull && canStun && res.outcome === 'hit' && res.stun < p.stunFull)
    res.stun = p.stunFull;
  applyHit(w, src, dst, p, res);
  if (aura && aura.max > 0 && dst.alive) mineAuraHit(w, src.side!, dst);
}

/** The share of a melee hit that a monster throws back: the Thorned mod, or the reflection of a Gilded Guard. */
export function thornsShare(m: Actor): number {
  let share = m.modIds.includes('thorned') ? THORNS_SHARE : 0;
  if (m.mon)
    for (const a of abilitiesOf(m.mon.spec.type))
      if (a.id === 'reflect') share = Math.max(share, a.amount ?? 0);
  return share;
}

/** A flask loses charges to a thief: the one that is fullest, by the share of its maximum. */
function takeFlaskCharges(victim: Side, m: Actor, share: number): number {
  let best: Side['flasks'][number] | null = null;
  for (const f of victim.flasks)
    if (
      f.charges > 0 &&
      (!best || f.charges / f.spec.maxCharges > best.charges / best.spec.maxCharges)
    )
      best = f;
  if (!best) return 0;
  const take = Math.min(best.charges, best.spec.maxCharges * share);
  best.charges -= take;
  m.theft.stolen += take;
  m.theft.stolenFlask = best.spec.uid;
  return take;
}

/** What a monster's hit does to the player besides damage: steal charges (a Cutpurse, the Flask-taker mod), hobble. */
function onMonsterHitPlayer(w: World, src: Actor, dst: Actor, prof: SkillProfile): void {
  const steal = abilitiesOf(src.mon!.spec.type).find((a) => a.id === 'steal');
  if (steal || src.modIds.includes('flaskTaker') || src.modIds.includes('treasurer')) {
    const got = takeFlaskCharges(dst.side!, src, steal?.amount ?? 0.2);
    // A thief runs with what it took.
    if (steal && got > 0) src.theft.fleeT = 5;
  }
  const debuff = prof.skill.debuff;
  const hobbles = src.modIds.includes('hobbling') || src.mon?.kind.hobbles || debuff === 'hobble';
  // A hobble is a chill: whatever keeps a chill off keeps it off (docs/BOSSES.md 11.2).
  if (hobbles) afflictPlayer(w, dst.side!, 'chill', 0.3, 2);
  if (src.mon?.kind.bossOnly) bossHitPlayer(w, dst.side!, src);
  // A sidearm that blinds (docs/ENCOUNTERS.md 7): the character's attacks miss more for a while.
  if (debuff === 'blind') blindPlayer(dst.side!, BLIND_SECONDS);
}

/** Remember damage the player took, for the death recap. */
export function logDamage(
  w: World,
  dst: Actor,
  src: Pick<Actor, 'name' | 'rarity' | 'modIds' | 'mon'> | null,
  label: string,
  dtype: number,
  amount: number,
  via?: string,
): void {
  if (amount <= 0) return;
  const log = dst.side!.dmgLog;
  log.push({
    t: w.t,
    name: src ? src.name : label,
    rarity: src ? src.rarity : 'effect',
    mods: src ? [...src.modIds] : [],
    type: src?.mon?.spec.type,
    via,
    dtype,
    amount,
    hp: dst.life + dst.es,
  });
  while (log.length > 0 && w.t - log[0].t > DAMAGE_LOG_TIME) log.shift();
}

/** A player hit by a melee attack deals damage back to the attacker (reflect). */
function reflectBack(w: World, src: Actor, dst: Actor, p: SkillProfile, res: HitResult): void {
  if (!dst.isPlayer || src.team === dst.team || !src.alive || p.skill.behaviour.kind !== 'melee')
    return;
  const d = dst.def;
  for (let t = 0; t < 5; t++)
    if (d.reflect[t] > 0) rawHit(w, src, d.reflect[t], t, dst.side!, 'Reflect');
  if (d.reflectPhysPct > 0 && res.dmg[0] > 0 && src.alive)
    rawHit(w, src, res.dmg[0] * d.reflectPhysPct, 0, dst.side!, 'Reflect');
}

/** Every impale on the target deals what it recorded as reflected physical damage, and uses up one of its hits. */
function payImpales(w: World, dst: Actor, by?: Side): void {
  if (dst.impales.length === 0) return;
  let stored = 0;
  let j = 0;
  for (const imp of dst.impales) {
    stored += imp.dmg;
    if (--imp.hits > 0) dst.impales[j++] = imp;
  }
  dst.impales.length = j;
  rawHit(w, dst, stored, 0, by ?? null, 'Impale');
}

/** A hit that impales records a share of its physical damage on the target. */
function recordImpale(w: World, s: Side, dst: Actor, p: SkillProfile, res: HitResult): void {
  const imp = p.impale;
  if (imp.chance <= 0 || !dst.alive || (res.rawPhys ?? 0) <= 0) return;
  if (!w.rngCombat.chance(imp.chance)) return;
  dst.impales.push({ dmg: (res.rawPhys ?? 0) * imp.share, hits: imp.hits });
  bannerStage(w, s, 'impale');
  while (dst.impales.length > imp.max) dst.impales.shift();
}

/**
 * Damage of one type that ignores evasion and block (explosions, slams, auras, a minion's blow). `owner` is the side whose damage it
 * is, and is credited with it (its ledger, its `damageDealt`, the kill); it is `null` on purpose for what is nobody's or a
 * monster's (the ground, a drain, a monster's blast) and for damage a side deals to itself (Righteous Fire, a minion's own burn,
 * the share of a hit that a Thorned monster throws back), which no side deals to an enemy.
 */
export function rawHit(
  w: World,
  dst: Actor,
  amount: number,
  type: number,
  owner: Side | null,
  label = 'Explosion',
  by: 'player' | 'minion' = 'player',
  via?: string,
): void {
  noteCause(dst, 0, by === 'minion', [], owner ?? undefined);
  const dmg = [0, 0, 0, 0, 0];
  dmg[type] = amount;
  const def = dst.def;
  const st = statusTaken(dst);
  takenAs(def, dmg);
  const taken = def.damageTakenMult * def.hitTakenMult * shockTaken(def, dst.ail.shock);
  for (let i = 0; i < 5; i++) {
    if (dmg[i] <= 0) continue;
    if (def.immune[i] || (i === CHAOS && def.immuneChaos)) {
      dmg[i] = 0;
      continue;
    }
    if (i === 0) {
      const red = Math.min(0.9, def.armour / (def.armour + 10 * dmg[0]) + def.physReduction);
      dmg[0] *= 1 - red;
    } else {
      const shift = dst.resShift.v[i] - dst.hex.res[i] - st.res[i];
      const r = Math.max(-200, Math.min(def.res[i] + shift, def.maxRes[i]));
      dmg[i] *= 1 - r / 100;
    }
    dmg[i] *= taken * def.damageTakenType[i];
    if (i === 0) dmg[i] *= 1 + dst.hex.vuln;
    dmg[i] *= (1 + dst.hex.vulnAll) * (1 + st.vulnType[i]);
  }
  const total = dmg[0] + dmg[1] + dmg[2] + dmg[3] + dmg[4];
  w.events.push({ t: 'hit', src: 0, dst: dst.id, amount: total, crit: false, dtype: type });
  if (dst.isPlayer) logDamage(w, dst, null, label, type, total, via);
  // The map report: an effect on the character is its own row (a blast counts as a hit), one on a monster is the skill's or the
  // minion's; a minion's blow is the minion's wherever it lands.
  const side = owner ?? undefined;
  const how: DmgSrc = dst.isPlayer
    ? { name: label, kind: by === 'minion' ? 'minion' : 'effect', side }
    : { name: label, kind: by === 'minion' ? 'minion' : 'skill', side };
  if (dst.isPlayer) noteHit(w, dst, how, total, false);
  applyDamage(w, dst, dmg, how);
}

/** Who a hit is credited to in the map report. */
function sourceOf(src: Actor, dst: Actor, p: SkillProfile): DmgSrc {
  if (src.isPlayer) return { name: p.skill.name, kind: 'skill', side: src.side! };
  if (src.side) return { name: src.name || 'Minion', kind: 'minion', side: src.side };
  return dst.isPlayer ? monsterSrc(src) : { name: 'Other', kind: 'effect' };
}

/** Wake a monster that took damage (and its pack). */
export function wake(w: World, a: Actor): void {
  if (a.isPlayer || a.state !== 'idle') return;
  a.state = 'chase';
  a.hold = false;
  a.lostT = 0;
  for (const o of w.actors)
    if (!o.isPlayer && o.alive && o.state === 'idle' && Math.hypot(o.x - a.x, o.y - a.y) <= 6) {
      o.state = 'chase';
      o.hold = false;
    }
}

/** A drop must land on floor: a flier that dies over a wall drops its loot where it can be reached. */
function dropSpot(w: World, a: Actor, pos: { x: number; y: number }): { x: number; y: number } {
  if (!(a.flies || a.phases) || w.grid.isFloor(Math.floor(pos.x), Math.floor(pos.y))) return pos;
  const p = hunted(w, a);
  let best = { x: p.x, y: p.y };
  let bd = Infinity;
  for (let dy = -4; dy <= 4; dy++)
    for (let dx = -4; dx <= 4; dx++) {
      const tx = Math.floor(a.x) + dx;
      const ty = Math.floor(a.y) + dy;
      if (!w.grid.isFloor(tx, ty)) continue;
      const d = dx * dx + dy * dy;
      if (d < bd) {
        bd = d;
        best = { x: tx + 0.5, y: ty + 0.5 };
      }
    }
  return best;
}

/**
 * What last hurt an actor, for kill effects: the tags of the skill whose hit it was (none for damage over time and the like),
 * and whether it was a minion. A kill trigger counts the player's kills, with the tags of the skill that made them.
 */
const causes = new WeakMap<
  Actor,
  { tags: number; minion: boolean; gains: readonly Mod[]; side?: Side }
>();
function noteCause(
  a: Actor,
  tags: number,
  minion: boolean,
  gains: readonly Mod[] = [],
  side?: Side,
): void {
  if (!a.isPlayer) causes.set(a, { tags, minion, gains, side });
}

/** A side's damage killed a minion of another side: the effects of a kill that need no loot or experience (docs/DUEL.md F3). */
function minionKilledBy(
  w: World,
  killer: Side,
  a: Actor,
  cause: { tags: number; minion: boolean; gains: readonly Mod[] },
): void {
  killer.player.since.kill = 0;
  rollCharges(w, killer, 'kill', cause.gains);
  if (a.ail.freezeT > 0) rollCharges(w, killer, 'killFrozen', cause.gains);
  if (a.ail.shock > 0) rollGains(w, killer, 'killShocked', cause.gains);
  rollGains(w, killer, 'kill', cause.gains);
  bannerStage(w, killer, 'kill');
  refreshOnKill(killer);
  if (!cause.minion) fireTriggers(w, killer, { on: 'kill', target: a, tags: cause.tags });
}

export function killActor(w: World, a: Actor): void {
  if (!a.alive) return;
  // What a kill gives is the side's whose damage last struck it, and with none named, the one that fights the monster (the
  // character it hunts).
  const fs = (causes.get(a)?.side ?? hunted(w, a).side)!;
  a.alive = false;
  a.life = 0;
  a.action = null;
  w.events.push({ t: 'death', id: a.id });
  // A minion that falls is just gone (tickMinions clears it): nothing is dropped or raised, and it counts as no kill, no experience
  // and no flask charges. What the other side's damage that killed it gives (the charges, gains and banner stages of a kill) it
  // gives; a minion that dies of its own side's or of nobody's damage gives nothing.
  if (!a.isPlayer && a.side) {
    const cause = causes.get(a);
    if (cause?.side && cause.side.team !== a.team) minionKilledBy(w, cause.side, a, cause);
    return;
  }
  if (!a.isPlayer && !a.noReward) {
    // What the skill that made the kill gives on a kill (its own chances, and its supports').
    const gains = causes.get(a)?.gains ?? [];
    rollCharges(w, fs, 'kill', gains);
    if (a.ail.freezeT > 0) rollCharges(w, fs, 'killFrozen', gains);
    if (a.ail.shock > 0) rollGains(w, fs, 'killShocked', gains);
    rollGains(w, fs, 'kill', gains);
    bannerStage(w, fs, 'kill');
    refreshOnKill(fs);
  }
  if (!a.isPlayer && a.rarity === 'rare') gainTrophy(w, fs, a.modIds);
  if (a.isPlayer) {
    // The map is over when the local player's character falls (a duel reads the deaths of its sides).
    if (a.side!.id === 0) w.status = 'dead';
    w.events.push({ t: 'playerDied' });
    return;
  }
  const p = fs.player;
  if (!a.noReward) {
    fs.stats.kills++;
    p.since.kill = 0;
    const xp =
      (a.mon?.xp ?? 0) * levelPenalty(fs.build.level, a.mon?.spec.level ?? 1) * w.plan.xpMult;
    fs.xp += xp;
    fs.stats.xpGained += xp;
    const kind =
      a.rarity === 'boss' || a.rarity === 'miniboss'
        ? 'unique'
        : a.rarity === 'rare'
          ? 'rare'
          : a.rarity === 'magic'
            ? 'magic'
            : 'normal';
    // Killing an enemy under a hex that fills flasks (Mark of Plenty) doubles what the flasks gain.
    const cause0 = causes.get(a);
    const hexFlasks = cause0?.minion ? 0 : hexKill(w, a);
    // What a kill gives may hold only under a condition (while a flask is active) or per charge held: ask as the character is now.
    const kctx = playerCtx(w, fs);
    const gain =
      FLASK_CHARGES_ON_KILL[kind] * fs.char.db.mult('flaskCharges', kctx) * (1 + hexFlasks);
    for (const f of fs.flasks) f.charges = Math.min(f.spec.maxCharges, f.charges + gain);
    const lok =
      fs.char.db.sum('base', 'lifeOnKill', kctx) +
      (fs.char.db.sum('base', 'lifeOnKillPct', kctx) / 100) * p.def.maxLife;
    if (lok > 0) p.life = Math.min(lifeCap(p), p.life + lok);
    const mok = fs.char.db.sum('base', 'manaOnKill', kctx);
    if (mok > 0) p.mana = Math.min(p.def.maxMana - reservedMana(fs), p.mana + mok);
    if (w.opts.loot) {
      for (const item of w.opts.loot(w, a)) {
        const id = w.nextId++;
        const ang = w.rngLoot.float(0, Math.PI * 2);
        const pos = dropSpot(
          w,
          a,
          w.grid.collide(a.x + Math.cos(ang) * 0.6, a.y + Math.sin(ang) * 0.6, 0.2),
        );
        w.drops.push({ id, x: pos.x, y: pos.y, item });
        w.events.push({ t: 'drop', id });
      }
    }
  }
  if (a.modIds.includes('volatile')) {
    w.effects.push({
      id: w.nextId++,
      x: a.x,
      y: a.y,
      radius: 2,
      t: 1,
      total: 1,
      kind: 'volatile',
      damage: 3 * monsterHitOf(a),
      dtype: 3,
      team: 1,
    });
  }
  if (a.modIds.includes('splitting') && a.mon) splitInTwo(w, a);
  onMonsterDeath(w, a);
  const cause = causes.get(a);
  if (!cause?.minion) fireTriggers(w, fs, { on: 'kill', target: a, tags: cause?.tags ?? 0 });
  // Ailments that spread go once more from the corpse.
  if (!a.isPlayer && (a.ail.spreadEle > 0 || a.ail.ignites.some((d) => d.spread)))
    spreadAilments(w, a);
  // A debuff of damage over time passes on to those near the corpse.
  if (!a.isPlayer && a.sdots.length > 0) spreadSkillDots(w, a);
  // A kill on chilling ground may give a charge.
  if (!a.isPlayer && fs.fields.length > 0) fieldKill(w, a);
  // A charged enemy (Infernal Blow) goes off.
  if (fs.charged[a.id]) chargedDeath(w, a);
  // A Venomed enemy that dies poisoned passes the rest of its poison on to those around it.
  if (a.fx.venomed && a.ail.poisons.length > 0) venomBurst(w, a, a.fx.venomed.v, fs);
  // A Doomed enemy blows up for a share of its own life.
  if (a.fx.doomed) corpseBlast(w, fs, a, a.fx.doomed.v, 'chaos', 3);
}

/** The poison an enemy still carried, dealt to the enemies about it as chaos damage over a second. */
function venomBurst(w: World, dead: Actor, pct: number, by: Side): void {
  let rest = 0;
  for (const d of dead.ail.poisons) rest += d.dps * Math.max(0, d.t);
  if (rest <= 0) return;
  for (const e of w.actors)
    if (!e.isPlayer && e.alive && e !== dead && Math.hypot(e.x - dead.x, e.y - dead.y) <= 2.7 + e.r)
      applyFlatDot(w, e, 'venom', 4, (rest * pct) / 100, 1, by);
}

/** A Splitting monster leaves two weaker copies behind (no XP or loot, and they do not split). */
function splitInTwo(w: World, a: Actor): void {
  const spec = a.mon!.spec;
  for (const dx of [-0.6, 0.6]) {
    const pos = w.grid.collide(a.x + dx, a.y, 0.4);
    const c = spawnMonster(
      w,
      {
        type: spec.type,
        variant: spec.variant,
        rarity: 'normal',
        level: spec.level,
        mods: [],
        ...scaleOf(spec),
      },
      pos.x,
      pos.y,
      a.room,
      a.pack,
      a.name,
    );
    c.noReward = true;
    c.state = 'chase';
    w.events.push({ t: 'summon', id: c.id });
  }
}

export function monsterHitOf(a: Actor): number {
  const p = a.mon?.profile(0);
  if (!p) return 0;
  let s = 0;
  for (const c of p.hands[0].chunks) s += (c.min + c.max) / 2;
  return s;
}

/** Per-tick upkeep: DoTs, regeneration, leech, ES recharge, timers. */
export function tickActor(w: World, a: Actor, dt: number): void {
  if (!a.alive) return;
  const ail = a.ail;
  const def = a.def;
  // Timers.
  a.since.kill += dt;
  a.since.crit += dt;
  a.since.hit += dt;
  a.since.flask += dt;
  a.since.stunEnemy += dt;
  a.since.block += dt;
  a.since.beenHit += dt;
  a.since.overload += dt;
  a.since.damaged += dt;
  tickHexes(a, dt);
  tickStatuses(a, dt);
  // A stun opens a curled beetle.
  if (a.curlT > 0) a.curlT = a.stunT > 0 ? 0 : a.curlT - dt;
  if (a.choir.buffT > 0) a.choir.buffT -= dt;
  if (a.suppressT > 0) a.suppressT -= dt;
  if (a.choir.zealT > 0) a.choir.zealT -= dt;
  if (a.hex.cd > 0) a.hex.cd -= dt;
  // A beetle counts down the wait before it can curl up again (nothing else uses its faction timer).
  if (a.skillT > 0 && a.mon?.spec.type === 'beetle') a.skillT -= dt;
  if (a.choir.fervourT > 0) {
    a.choir.fervourT -= dt;
    if (a.choir.fervourT <= 0) a.choir.fervour = 0;
  }
  if (a.resShift.t > 0) {
    a.resShift.t -= dt;
    if (a.resShift.t <= 0) a.resShift.v.fill(0);
  }
  if (a.stunT > 0) {
    a.stunT -= dt;
    if (a.stunT <= 0) a.graceT = STUN_GRACE;
  } else if (a.graceT > 0) a.graceT -= dt;
  if (ail.freezeT > 0) {
    ail.freezeT -= dt;
    if (ail.freezeT <= 0 && a.isPlayer) ail.freezeGraceT = FREEZE_GRACE;
  } else if (ail.freezeGraceT > 0) ail.freezeGraceT -= dt;
  if (ail.shockT > 0) {
    ail.shockT -= dt;
    if (ail.shockT <= 0) ail.shock = 0;
  }
  if (ail.chillT > 0) {
    ail.chillT -= dt;
    if (ail.chillT <= 0) ail.chill = 0;
  }
  // Damage over time. Temporal Chains lets effects on a cursed enemy run out more slowly; Vulnerability and Despair raise what they deal.
  const taken = def.damageTakenMult * shockTaken(def, ail.shock);
  const hm = a.hex.more;
  const dtDot = dt * (1 - hm.expireSlow);
  let dotPhys = 0;
  let dotFire = 0;
  let dotChaos = 0;
  // Whose hits the ailments came from, to credit what they deal (only with several sides: on a map it is the one side's).
  const multi = w.sides.length > 1;
  let igniteBy: DotShare[] | undefined;
  let bleedBy: DotShare[] | undefined;
  let poisonBy: DotShare[] | undefined;
  if (ail.ignites.length) {
    // The strongest `igniteMax` ignites burn.
    if (ail.igniteMax <= 1) {
      let best = 0;
      for (const d of ail.ignites) if (d.dps > best) best = d.dps;
      dotFire += best;
    } else {
      const top = ail.ignites.map((d) => d.dps).sort((x, y) => y - x);
      for (let i = 0; i < Math.min(ail.igniteMax, top.length); i++) dotFire += top[i];
    }
    if (multi) igniteBy = dotShares(ail.ignites, Math.max(1, ail.igniteMax));
    decay(ail.ignites, dtDot);
  }
  if (ail.bleeds.length) {
    const stacking = ail.bleeds.some((d) => d.stack);
    let b = 0;
    if (stacking) {
      const sorted = ail.bleeds.map((d) => d.dps).sort((x, y) => y - x);
      for (let i = 0; i < Math.min(WOUND_DANCE_STACKS, sorted.length); i++) b += sorted[i];
    } else {
      for (const d of ail.bleeds) if (d.dps > b) b = d.dps;
      if (a.moving && !def.noMovingBleed) b *= BLEED_MOVING_MULT;
    }
    dotPhys += b;
    if (multi) bleedBy = dotShares(ail.bleeds, stacking ? WOUND_DANCE_STACKS : 1);
    decay(ail.bleeds, dtDot);
  }
  if (ail.poisons.length) {
    for (const d of ail.poisons) dotChaos += d.dps;
    if (multi) poisonBy = dotShares(ail.poisons, ail.poisons.length);
    decay(ail.poisons, dtDot);
  }
  // What ignite, bleed and poison give of this tick: the map report shares the tick between them and the skills' debuffs.
  const fromIgnite = dotFire;
  const fromBleed = dotPhys;
  const fromPoison = dotChaos;
  let fromSkills: SkillDot[] | null = null;
  // Debuffs that skills inflicted: Contagion, Blight, Essence Drain, Decay.
  let dotLight = 0;
  let dotCold = 0;
  if (a.sdots.length) {
    const own = [0, 0, 0, 0, 0];
    fromSkills = [...a.sdots];
    sumSkillDots(w, a, own, dt);
    dotPhys += own[0];
    dotLight += own[1];
    dotCold += own[2];
    dotFire += own[3];
    dotChaos += own[4];
    decaySkillDots(a, dtDot);
  }
  if (dotPhys + dotFire + dotChaos + dotLight + dotCold > 0) {
    dotPhys *= 1 + hm.dotPhys + hm.dotAll;
    dotFire *= 1 + hm.dotAll;
    dotChaos *= 1 + hm.dotAll;
    dotLight *= 1 + hm.dotAll;
    dotCold *= 1 + hm.dotAll;
    const tt = def.damageTakenType;
    const dmg = [
      dotPhys * taken * tt[0] * dt,
      dotLight * taken * tt[1] * dt,
      dotCold * taken * tt[2] * dt,
      dotFire * taken * tt[3] * dt,
      dotChaos * taken * tt[4] * dt,
    ];
    if (a.isPlayer) {
      logDamage(w, a, null, 'Burning', 3, dmg[3]);
      logDamage(w, a, null, 'Bleeding', 0, dmg[0]);
      logDamage(w, a, null, 'Poison', 4, dmg[4]);
    }
    noteCause(
      a,
      0,
      false,
      [],
      multi ? dotOwner([igniteBy, bleedBy, poisonBy], fromSkills) : undefined,
    );
    applyDamage(w, a, dmg, {
      name: 'Damage over time',
      kind: 'ailment',
      split: dotSources(
        a.isPlayer,
        fromIgnite,
        fromBleed,
        fromPoison,
        fromSkills,
        multi ? { ignite: igniteBy, bleed: bleedBy, poison: poisonBy } : undefined,
      ),
    });
    if (!a.alive) return;
  }
  // Regeneration (a Bursar or the Treasurer near the player stops it, with leech and the recharge of energy shield).
  const cap = lifeCap(a);
  const suppressed = a.suppressT > 0;
  // A Frost Bomb leaves an enemy regenerating very little.
  const regen = def.lifeRegen * (a.fx.regenLess ? 1 - a.fx.regenLess.v / 100 : 1);
  if (!suppressed && regen > 0) {
    if (def.regenToEs) a.es = Math.min(def.maxEs, a.es + regen * dt);
    else a.life = Math.min(cap, a.life + regen * dt);
  }
  if (a.isPlayer && !suppressed) {
    const manaCap = Math.max(0, def.maxMana - reservedMana(a.side!));
    a.mana = Math.min(manaCap, a.mana + def.manaRegen * dt);
    leechTick(
      a.leech.mana,
      (x) => (a.mana = Math.min(manaCap, a.mana + x)),
      def.maxMana,
      dt,
      a.mana >= manaCap,
      def.leechRate,
    );
  }
  if (suppressed) return;
  if (def.leechToEs)
    leechTick(
      a.leech.life,
      (x) => (a.es = Math.min(def.maxEs, a.es + x)),
      def.maxLife,
      dt,
      a.es >= def.maxEs,
      def.leechRate,
    );
  else
    leechTick(
      a.leech.life,
      (x) => (a.life = Math.min(cap, a.life + x)),
      def.maxLife,
      dt,
      a.life >= cap,
      def.leechRate,
    );
  if (a.leech.es.length > 0)
    leechTick(
      a.leech.es,
      (x) => (a.es = Math.min(def.maxEs, a.es + x)),
      def.maxEs,
      dt,
      a.es >= def.maxEs,
      def.leechRate,
    );
  if (def.esRegen > 0 && a.es < def.maxEs) a.es = Math.min(def.maxEs, a.es + def.esRegen * dt);
  // ES recharge.
  if (def.maxEs > 0 && a.es < def.maxEs && a.since.damaged >= def.esDelay)
    a.es = Math.min(def.maxEs, a.es + def.esRecharge * dt);
}

/** The side that put most of the damage over time on an actor, whose the kill is if it dies of it (none when no side's). */
function dotOwner(shares: (DotShare[] | undefined)[], skills: SkillDot[] | null): Side | undefined {
  let best: Side | undefined;
  let most = 0;
  for (const list of shares)
    for (const x of list ?? [])
      if (x.side && x.dps > most) {
        best = x.side;
        most = x.dps;
      }
  for (const d of skills ?? [])
    if (d.by && d.dps > most) {
      best = d.by;
      most = d.dps;
    }
  return best;
}

/** The dps of the `top` strongest entries of an ailment, added up by the side that put each on. */
function dotShares(list: Dot[], top: number): DotShare[] {
  const dealing = list.length > top ? [...list].sort((a, b) => b.dps - a.dps).slice(0, top) : list;
  const out: DotShare[] = [];
  for (const d of dealing) {
    const have = out.find((x) => x.side === d.by);
    if (have) have.dps += d.dps;
    else out.push({ side: d.by, dps: d.dps });
  }
  return out;
}

function decay(list: Dot[], dt: number): void {
  let j = 0;
  for (let i = 0; i < list.length; i++) {
    list[i].t -= dt;
    if (list[i].t > 0) list[j++] = list[i];
  }
  list.length = j;
}

function leechTick(
  list: number[],
  gain: (x: number) => void,
  max: number,
  dt: number,
  full: boolean,
  rate = 1,
): void {
  if (!list.length) return;
  if (full) {
    list.length = 0;
    return;
  }
  const per = LEECH_RATE_PER_INSTANCE * max * rate;
  const scale = Math.min(
    1,
    (LEECH_RATE_CAP * rate) / (LEECH_RATE_PER_INSTANCE * rate * list.length),
  );
  let total = 0;
  let j = 0;
  for (let i = 0; i < list.length; i++) {
    const take = Math.min(list[i], per * scale * dt);
    total += take;
    list[i] -= take;
    if (list[i] > 1e-6) list[j++] = list[i];
  }
  list.length = j;
  gain(total);
}
