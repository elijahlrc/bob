import type { SkillChoice } from '../calc/character';
import { levelValue } from '../calc/gems';
import type { UtilityDef } from '../data/gems';
import { reservedMana } from './reserve';
import { applyStatus } from './statuses';
import type { Actor, World } from './types';

/**
 * Banners (docs/SPIRIT.md S6): an aura you carry, then put down. Carried, it holds some of the character's mana, gains a stage
 * for each kill (or each impale) and its aura works around the character. Put down, it frees the mana, stands where it was
 * put for a time that grows with its stages, and its aura works around the spot; the stages also widen it, strengthen it and
 * lengthen it, and the character gains a short buff from them. Only one banner stands at a time.
 */
export type BannerState = {
  /** The utility skill's key. */
  key: string;
  placed: boolean;
  x: number;
  y: number;
  stages: number;
  /** Seconds left once put down. */
  t: number;
  /** The aura's radius now, and before the stages. */
  radius: number;
  r0: number;
  /** The aura's strength, as a multiplier on what it does to enemies. */
  effect: number;
  /** Mana held while carried. */
  reserve: number;
  /** Impale stages are given at most five a second. */
  stageT: number;
  stageN: number;
  pulseT: number;
};

type BannerSpec = NonNullable<Extract<UtilityDef, { kind: 'buff' }>['banner']>;

const PULSE = 0.25;
const IMPALE_STAGES_PER_SECOND = 5;
/** A carried banner is put down when it holds this many stages and a fight is on. */
const PLACE_AT_STAGES = 8;
const FIGHT_RADIUS = 7;
const FIGHT_SIZE = 3;

function specOf(
  c: SkillChoice,
): { u: Extract<UtilityDef, { kind: 'buff' }>; spec: BannerSpec } | null {
  const u = c.skill.utility;
  return u?.kind === 'buff' && u.banner ? { u, spec: u.banner } : null;
}

/** What the character does with a banner skill now: carry it, put it down, or nothing. */
export function bannerAction(w: World, c: SkillChoice, target: Actor): 'carry' | 'place' | null {
  const s = specOf(c);
  if (!s) return null;
  const b = w.banner;
  const p = w.player;
  if (b && b.key === c.key && !b.placed) {
    if (b.stages >= s.spec.maxStages) return 'place';
    if (b.stages < PLACE_AT_STAGES) return null;
    const near = w.actors.filter(
      (e) => !e.isPlayer && e.alive && Math.hypot(e.x - p.x, e.y - p.y) <= FIGHT_RADIUS,
    ).length;
    const big =
      target.rarity === 'boss' || target.rarity === 'miniboss' || target.rarity === 'rare';
    return near >= FIGHT_SIZE || big ? 'place' : null;
  }
  if (b && !(b.placed && b.t < 1.5)) return null;
  const reserve = Math.ceil((s.spec.reservePct / 100) * p.def.maxMana);
  return p.def.maxMana - reservedMana(w) >= reserve ? 'carry' : null;
}

/** Cast the banner skill: carry a new banner, or put the carried one down where the character stands. */
export function useBanner(w: World, c: SkillChoice, radiusMult: number): void {
  const s = specOf(c);
  if (!s) return;
  const p = w.player;
  const action = bannerAction(w, c, p);
  const b = w.banner;
  if (action === 'place' && b) {
    const g = s.spec.perStage;
    b.placed = true;
    b.x = p.x;
    b.y = p.y;
    b.radius = b.r0 * (1 + (g.area / 100) * b.stages);
    b.effect = 1 + (g.effect / 100) * b.stages;
    b.t = (s.spec.placedSeconds + g.seconds * b.stages) * w.char.db.mult('buffDuration');
    const granted = s.spec.place.secondsPerStage * b.stages;
    if (granted > 0) {
      w.buffT[s.spec.place.buff] = Math.max(w.buffT[s.spec.place.buff], granted);
      w.events.push({ t: 'buff', id: s.spec.place.buff });
    }
    return;
  }
  const r0 = s.spec.radius * radiusMult;
  w.banner = {
    key: c.key,
    placed: false,
    x: p.x,
    y: p.y,
    stages: 0,
    t: 0,
    radius: r0,
    r0,
    effect: 1,
    reserve: Math.ceil((s.spec.reservePct / 100) * p.def.maxMana),
    stageT: 0,
    stageN: 0,
    pulseT: 0,
  };
  w.events.push({ t: 'buff', id: s.u.buff });
}

/** A kill, or an impale, while a banner is carried gives it a stage. */
export function bannerStage(w: World, on: 'kill' | 'impale'): void {
  const b = w.banner;
  if (!b || b.placed) return;
  const c = w.char.utilities.find((x) => x.key === b.key);
  const s = c && specOf(c);
  if (!s || s.spec.stageOn !== on) return;
  if (on === 'impale') {
    if (w.t - b.stageT >= 1) {
      b.stageT = w.t;
      b.stageN = 0;
    }
    if (b.stageN >= IMPALE_STAGES_PER_SECOND) return;
    b.stageN++;
  }
  b.stages = Math.min(s.spec.maxStages, b.stages + 1);
}

/** Run the banner: its time, and its aura on the character and the enemies in it. */
export function tickBanner(w: World, dt: number): void {
  const b = w.banner;
  if (!b) return;
  const c = w.char.utilities.find((x) => x.key === b.key);
  const s = c && specOf(c);
  if (!c || !s) {
    w.banner = null;
    return;
  }
  const p = w.player;
  if (b.placed) {
    b.t -= dt;
    if (b.t <= 0) {
      w.banner = null;
      return;
    }
  }
  const cx = b.placed ? b.x : p.x;
  const cy = b.placed ? b.y : p.y;
  // The aura works on the character while it is carried or stands within the banner's radius.
  if (!b.placed || Math.hypot(p.x - cx, p.y - cy) <= b.radius + p.r)
    w.buffT[s.u.buff] = Math.max(w.buffT[s.u.buff], PULSE + dt);
  b.pulseT -= dt;
  if (b.pulseT > 0) return;
  b.pulseT += PULSE;
  const v = levelValue(s.spec.enemy.v, c.skill.level) * b.effect;
  for (const e of w.actors)
    if (!e.isPlayer && e.alive && e.phaseT <= 0 && Math.hypot(e.x - cx, e.y - cy) <= b.radius + e.r)
      applyStatus(w, e, s.spec.enemy.id, { seconds: PULSE * 2.4, v });
}
