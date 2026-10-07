import type { SkillChoice } from '../calc/character';
import { blasphemyOf } from '../calc/character';
import {
  auraLook,
  DELIVERY_NAME,
  ELEMENT_NAME,
  profileLook,
  type SkillLook,
} from '../calc/skillLook';
import type { SkillProfile } from '../calc/skill';
import { triggerText } from '../data/triggers';
import { canPay } from '../sim/cost';
import { DEPLOY_SECONDS, deployCap } from '../sim/deploy';
import { summonCount, summonRespawn } from '../sim/minions';
import type { World } from '../sim/types';

/**
 * What the skill bar shows (pure data, no DOM): one slot per skill the character has equipped, with what it is doing
 * right now. The HUD calls this every few ticks, so it only reads the world and the cached skill profiles.
 *
 *   ready    can be used now (a utility waits for the policy to want it).
 *   cooling  on cooldown; `remaining` of `total` seconds are left.
 *   active   doing its job: a buff that is up, minions or deployables standing (all it can have), a curse on an enemy.
 *   casting  the character is in the middle of using it; `remaining` of `total` seconds are left.
 *   nopay    off cooldown but the character cannot pay its cost.
 *   passive  always on (an aura) or waiting for its trigger (a trigger that is off cooldown).
 *   off      an aura that cannot be kept up (not enough mana or life to reserve).
 */
export type SkillState = 'ready' | 'cooling' | 'active' | 'casting' | 'nopay' | 'passive' | 'off';
export type SkillRole = 'Primary' | 'Secondary' | 'Utility' | 'Aura' | 'Triggered' | 'Basic attack';

export type SkillSlot = {
  key: string;
  name: string;
  role: SkillRole;
  look: SkillLook;
  state: SkillState;
  /** Seconds until it is ready or over; 0 when nothing counts down. */
  remaining: number;
  /** The length `remaining` counts down over (the sweep is remaining / total); 0 when nothing counts down. */
  total: number;
  /** A small count or label for a corner: minions '3/4', totems '2/3'. */
  badge?: string;
  /** The tooltip text. */
  detail: string;
};

const secs = (x: number): string => `${(Math.round(x * 10) / 10).toFixed(1)} s`;

/** Words for one cost: "12 mana", "5 life", or "no cost". */
function costText(prof: SkillProfile, costsLife: boolean): string {
  if (prof.cost <= 0) return 'No cost';
  return `Cost ${Math.round(prof.cost * 10) / 10} ${costsLife ? 'life' : 'mana'}`;
}

/** The tooltip: name, role, delivery, element, cost, cooldown and the state in words, in that order. */
function tip(
  name: string,
  role: SkillRole,
  look: SkillLook,
  cost: string,
  cooldown: string,
  state: string,
): string {
  const element = look.element >= 0 ? `${ELEMENT_NAME[look.element]} damage` : 'No damage type';
  return [name, role, DELIVERY_NAME[look.delivery], element, cost, cooldown, state].join(' · ');
}

/** The cast in progress, if it is this skill: time left and the length of the cast. */
function castOf(w: World, c: SkillChoice): { remaining: number; total: number } | null {
  const act = w.player.action;
  if (!act || act.which === 'monster' || act.which === 'triggered' || act.which === 'deployed')
    return null;
  if (act.profile.skill.id !== c.skill.id) return null;
  return { remaining: Math.max(0, act.duration - act.elapsed), total: act.duration };
}

/** A deploying skill's standing deployables: how many, the time until the first one ends, and the cap. */
function deployed(
  w: World,
  c: SkillChoice,
  prof: SkillProfile,
): { n: number; soonest: number; cap: number } {
  let n = 0;
  let soonest = Infinity;
  for (const d of w.deployables)
    if (d.key === c.key) {
      n++;
      soonest = Math.min(soonest, Math.max(0, d.t));
    }
  return { n, soonest: n > 0 ? soonest : 0, cap: deployCap(c, prof) };
}

type Built = Pick<SkillSlot, 'state' | 'remaining' | 'total' | 'badge'> & { words: string };

const plural = (kind: string, n: number): string => (n === 1 ? kind : `${kind}s`);

const nopayWords = (c: SkillChoice) => `Not enough ${c.costsLife ? 'life' : 'mana'}`;

/** A skill that deals damage: the primary, a secondary, or the basic attack. */
function damageSlot(w: World, c: SkillChoice, role: SkillRole): SkillSlot {
  const prof = w.char.profile(c, 0, 0);
  const look = profileLook(prof);
  const secondary = role === 'Secondary';
  const cooldown = secondary ? w.char.cooldownOf(c, 0) : 0;
  const cast = castOf(w, c);
  const dep = c.deploy ? deployed(w, c, prof) : null;
  let b: Built;
  if (cast) {
    b = {
      state: 'casting',
      remaining: cast.remaining,
      total: cast.total,
      words: `Casting, ${secs(cast.remaining)} left`,
    };
  } else if (dep && dep.n >= dep.cap) {
    b = {
      state: 'active',
      remaining: dep.soonest,
      total: DEPLOY_SECONDS[c.deploy!],
      words: `All ${dep.cap} ${plural(c.deploy!, dep.cap)} standing, the first ends in ${secs(dep.soonest)}`,
    };
  } else if (secondary && (w.secondaryReady[c.key] ?? 0) > w.t) {
    const left = (w.secondaryReady[c.key] ?? 0) - w.t;
    b = {
      state: 'cooling',
      remaining: left,
      total: Math.max(cooldown, left),
      words: `Cooling down, ${secs(left)} left`,
    };
  } else if (!canPay(w, c.costsLife, prof.cost)) {
    b = { state: 'nopay', remaining: 0, total: 0, words: nopayWords(c) };
  } else {
    b = { state: 'ready', remaining: 0, total: 0, words: 'Ready' };
  }
  const badge = dep ? `${dep.n}/${dep.cap}` : undefined;
  const standing =
    dep && dep.n > 0 && dep.n < dep.cap
      ? ` (${dep.n} of ${dep.cap} ${plural(c.deploy!, dep.cap)} standing)`
      : '';
  return {
    key: c.key,
    name: c.skill.name,
    role,
    look,
    state: b.state,
    remaining: b.remaining,
    total: b.total,
    badge,
    detail: tip(
      c.skill.name,
      role,
      look,
      costText(prof, c.costsLife),
      secondary ? `Cooldown ${secs(cooldown)}` : 'No cooldown',
      b.words + standing,
    ),
  };
}

/** A utility skill: a buff, curse, blink or summon, cast by the character's policy. */
function utilitySlot(w: World, c: SkillChoice): SkillSlot {
  const prof = w.char.profile(c, 0, 0);
  const look = profileLook(prof);
  const u = c.skill.utility!;
  const readyAt = w.utilityReady[c.key] ?? 0;
  const cast = castOf(w, c);
  let badge: string | undefined;
  let cooldown: number;
  let up: Built | null = null;
  if (u.kind === 'buff') {
    cooldown = u.cooldown ?? 0.5;
    const left = w.buffT[u.buff];
    if (left > 0)
      up = {
        state: 'active',
        remaining: left,
        total: Math.max(left, u.seconds * w.char.db.mult('buffDuration')),
        words: `Active, ${secs(left)} left`,
      };
  } else if (u.kind === 'summon') {
    cooldown = summonRespawn(c);
    const want = summonCount(c, prof);
    let n = 0;
    let soonest = Infinity;
    for (const m of w.minions)
      if (m.key === c.key && m.alive) {
        n++;
        soonest = Math.min(soonest, m.t);
      }
    badge = `${n}/${want}`;
    if (n >= want) {
      const timed = Number.isFinite(soonest);
      up = {
        state: 'active',
        remaining: timed ? Math.max(0, soonest) : 0,
        total: timed ? (u.seconds ?? 0) : 0,
        words: timed
          ? `${n} of ${want} minions standing, ${secs(soonest)} left`
          : `${n} of ${want} minions standing`,
      };
    }
  } else if (u.kind === 'curse') {
    cooldown = 0.5;
    let most = 0;
    for (const a of w.actors)
      if (a.alive && !a.isPlayer)
        for (const h of a.hexes) if (h.id === u.hex && h.t > most) most = h.t;
    if (most > 0)
      up = { state: 'active', remaining: most, total: 0, words: `On an enemy, ${secs(most)} left` };
  } else cooldown = u.cooldown;
  let b: Built;
  if (cast) {
    b = {
      state: 'casting',
      remaining: cast.remaining,
      total: cast.total,
      words: `Casting, ${secs(cast.remaining)} left`,
    };
  } else if (up) b = up;
  else if (readyAt > w.t) {
    const left = readyAt - w.t;
    b = {
      state: 'cooling',
      remaining: left,
      total: Math.max(cooldown, left),
      words: `Cooling down, ${secs(left)} left`,
    };
  } else if (!canPay(w, c.costsLife, prof.cost)) {
    b = { state: 'nopay', remaining: 0, total: 0, words: nopayWords(c) };
  } else
    b = {
      state: 'ready',
      remaining: 0,
      total: 0,
      words: 'Ready, cast when the fight calls for it',
    };
  return {
    key: c.key,
    name: c.skill.name,
    role: 'Utility',
    look,
    state: b.state,
    remaining: b.remaining,
    total: b.total,
    badge,
    detail: tip(
      c.skill.name,
      'Utility',
      look,
      costText(prof, c.costsLife),
      `Cooldown ${secs(cooldown)}`,
      b.words,
    ),
  };
}

/**
 * Every skill the character has equipped, in the order the bar shows them: the primary, the secondaries, the
 * utilities, the auras, then skills cast by triggers. The basic attack stands in only when there is no primary skill.
 */
export function skillSlots(w: World): SkillSlot[] {
  const ch = w.char;
  const out: SkillSlot[] = [];
  out.push(damageSlot(w, ch.primary, ch.primary.gemUid === null ? 'Basic attack' : 'Primary'));
  for (const c of ch.secondaries) out.push(damageSlot(w, c, 'Secondary'));
  for (const c of ch.utilities) out.push(utilitySlot(w, c));
  for (const a of ch.auras) {
    const look = auraLook(a.def);
    out.push({
      key: `aura:${a.gem.gem.uid}`,
      name: a.def.name,
      role: 'Aura',
      look,
      state: a.active ? 'passive' : 'off',
      remaining: 0,
      total: 0,
      detail: tip(
        a.def.name,
        'Aura',
        look,
        `Reserves ${Math.round(a.reserved)}`,
        'No cooldown',
        a.active ? 'Always on' : 'Off: not enough to reserve',
      ),
    });
  }
  // A curse under Blasphemy stands as an aura instead of being cast.
  for (const c of ch.actives) {
    const b = blasphemyOf(c);
    if (!c.usable || !b) continue;
    const look = profileLook(ch.profile(c, 0, 0));
    out.push({
      key: c.key,
      name: c.skill.name,
      role: 'Aura',
      look,
      state: 'passive',
      remaining: 0,
      total: 0,
      detail: tip(
        c.skill.name,
        'Aura',
        look,
        `Reserves ${b.reservePct}% of mana`,
        'No cooldown',
        'Always on',
      ),
    });
  }
  for (const src of ch.triggers) {
    const e = src.def.effect.kind;
    if (e !== 'castSocketed' && e !== 'castGranted') continue;
    for (const c of src.skills) {
      const cdKey = `${src.key}:${c.key}`;
      const left = w.trig.cooldown[cdKey] ?? 0;
      const look = profileLook(ch.profile(c, 0, 0));
      const cooling = left > 0;
      out.push({
        key: `trig:${cdKey}`,
        name: c.skill.name,
        role: 'Triggered',
        look,
        state: cooling ? 'cooling' : 'passive',
        remaining: cooling ? left : 0,
        total: cooling ? Math.max(src.def.cooldown, left) : 0,
        badge: src.def.chance < 100 ? `${src.def.chance}%` : undefined,
        detail: tip(
          c.skill.name,
          'Triggered',
          look,
          'No cost',
          `Cooldown ${secs(src.def.cooldown)}`,
          `${triggerText(src.def)}. ${cooling ? `Cooling down, ${secs(left)} left` : 'Waiting for its trigger'}`,
        ),
      });
    }
  }
  return out;
}
