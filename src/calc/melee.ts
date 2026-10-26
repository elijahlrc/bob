import { BUFFS } from '../data/buffs';
import type { BuffId } from '../data/buffs';
import { levelValue } from './gems';
import type { SkillProfile } from './skill';

/**
 * What a melee skill does besides its own blow, counted the way the sim plays it (docs/SHEET-AUDIT.md section 5): a spin's sweeps,
 * the storm it leaves, the quake that follows a slam, the beams a strike calls, the charges it puts on the enemy, and the buffs
 * its own blows keep up. Each is written as hits worth one blow of the skill, so that the sheet's average hit times the hits a use
 * lands gives what the sim deals. Single target by design: what a crowd would add (a beam that leaps, a burst that reaches the
 * others) is not counted.
 */

export type LandsInput = {
  /** Uses a second (a triggered skill's rate when it is triggered). */
  usesPerSec: number;
  triggered: boolean;
  /** Hits one fire lands on the one target (the projectiles, the cone, the channel's stages). */
  volley: number;
  /** The chance one hit lands (not missed, not blocked). */
  land: number;
};

/**
 * The hits of one use that land on a single target that stays put, in blows of the skill. Without any of the effects below this is
 * `(1 + repeats) x pulses x volley`, as the sheet always counted it.
 */
export function landsPerUse(p: SkillProfile, o: LandsInput): number {
  const s = p.skill;
  const repeats = o.triggered ? 0 : p.repeats;
  // Each repeat of a Triple Cadence is harder than the one before; the first blow is a blow.
  const ramp = p.multistrike && !o.triggered ? p.multistrike.ramp / 100 : 0;
  const echoes = repeats + (ramp * repeats * (repeats + 1)) / 2;
  // A spin sweeps `hits` times; an echo or a trigger of it is one sweep. What a use leaves behind (the quake, the storm) is left once.
  const sweeps = s.spin?.once ? 1 : (s.spin?.hits ?? 1);
  const own = s.spin ? (o.triggered ? 1 : sweeps + echoes) : (1 + echoes) * p.pulses;
  const lands = own * o.volley;
  // The hits themselves, whatever their weight: each puts a charge or a stack on the enemy.
  const count =
    (s.spin ? (o.triggered ? 1 : sweeps + repeats) : (1 + repeats) * p.pulses) * o.volley;
  const rate = o.usesPerSec;
  if (!(rate > 0)) return lands;
  // What each fire leaves behind: once for a spin, and for every fire (the repeats too) for anything else.
  const placed = s.spin ? 1 : 1 + repeats;
  const placedBlows = s.spin ? 1 : 1 + echoes;
  let extra = 0;

  // A slam cracks the ground, and the ground erupts a moment later, harder.
  if (s.aftershock) extra += placedBlows * (1 + s.aftershock.more / 100);

  // A storm of blades stays where the spin was made and hits every interval: as many storms as the uses keep up, and no more than
  // the most (the oldest goes when another is made).
  const st = s.stanceStorm;
  if (st) {
    const made = rate * placed;
    const life = st.seconds * p.skillDuration;
    const each = Math.min(life, st.max / made);
    const pulses = Math.floor(each / (st.interval ?? p.useTime) + 1e-6);
    extra += placedBlows * pulses * (1 + st.more / 100) * (s.spin?.hits ?? 1);
  }

  // Each hit that lands puts a charge on the enemy, and a charge is worth its share of a blow whenever it goes off (at the most, at
  // the end of its time, or at death), so a hit is worth one blow more by that share.
  const ch = s.charge;
  if (ch) extra += count * o.land * (ch.perCharge / 100);

  // Each hit that lands gives a stack of a buff, and while it lasts beams strike the enemy near: faster for each stack. The
  // character stands to strike, so the beams are the weaker ones.
  const bm = s.beams;
  if (bm) {
    const stackRate = rate * count * o.land;
    const held = stackRate * bm.seconds;
    const up = Math.min(1, held);
    const stacks = Math.min(bm.max, Math.max(1, held));
    const every = bm.interval / (1 + (bm.perStack / 100) * stacks);
    const less = levelValue(bm.lessStill, s.level);
    extra += (up * (1 - less / 100)) / every / rate;
  }
  return lands + extra;
}

/**
 * The buffs a skill's own use keeps up when it is used one blow after another: the buff its hit gives (Thunder Rebuke), and the one of the
 * storm it stands in (Whirlwind Cleave; the sheet is for one target, so the stance for a lone enemy, Blood). A buff is kept up when the
 * skill is used again before it ends. `p` is the skill's profile without them; `buffDuration` the character's multiplier on how long
 * the buffs it gains last.
 */
export function ownBuffs(p: SkillProfile, buffDuration: number): BuffId[] {
  const s = p.skill;
  const out: BuffId[] = [];
  if (s.hitBuff && p.useTime <= BUFFS[s.hitBuff.buff].seconds * buffDuration)
    out.push(s.hitBuff.buff);
  if (s.stanceStorm && p.useTime <= s.stanceStorm.seconds * p.skillDuration)
    out.push(s.stanceStorm.blood);
  return out;
}

/**
 * Whether the wave of an illusion that comes at every `waveStages` stages is one of those that break once the illusion has stopped
 * (Storm Rush): it stops where it has run far enough, or at the place it was sent to. It is made with the first stage and runs
 * ahead of the character at `speed` times its pace, so a wave is still when the stages before it have given the illusion time to
 * arrive. With no word of the target (a caller that does not know) the later half of the waves are taken as still.
 */
export function illusionStill(
  o: { speed: number; distance: number; waveStages: number },
  useTime: number,
  wave: number,
  waves: number,
  run?: { distance: number; speed: number },
): boolean {
  if (!run) return wave > waves / 2;
  const elapsed = (wave * o.waveStages - 1) * useTime;
  const need = Math.min(o.distance, Math.max(0, run.distance - 0.3));
  return elapsed * run.speed * o.speed >= need;
}
