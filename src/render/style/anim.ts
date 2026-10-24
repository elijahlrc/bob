import { TOLL_TELL, TOLL_WARN } from '../../data/bosses';
import { ECHO_GAP, HIT_AT } from '../../data/constants';
import { bossState } from '../../sim/bosses';
import type { Action, Actor } from '../../sim/types';
import { RELEASE_LANDS, type AnimName } from './figure';

/** How long a boss's blow plays. */
const RELEASE_SECONDS = 0.7;

/**
 * A boss whose body shows its big move (the Tollkeeper hoisting its bell through a toll's tell): how far through the wind-up
 * it is, 0 to 1 (null when it is not winding up), how many of the moves it has made, and how long after a move is made its
 * blow lands (a toll's first ring strikes once its warning has shown), so the blow plays then.
 */
function bigMove(a: Actor): { windup: number | null; made: number; lands: number } | null {
  const st = bossState(a);
  if (st?.id !== 'tollkeeper') return null;
  return {
    windup: st.tellT > 0 ? 1 - st.tellT / TOLL_TELL : null,
    made: st.tolls,
    lands: TOLL_WARN,
  };
}

/**
 * The attack animation's time for an action. A repeating skill (Echoing Cast) plays a second, shorter wind-up and strike
 * for every echo, each landing at the moment the sim fires it, so two casts are two visible casts.
 */
function attackTime(act: Action): number {
  const u = Math.min(1, act.elapsed / act.duration);
  const n = act.profile.repeats;
  if (n <= 0 || act.which === 'triggered') return u;
  const first = HIT_AT;
  const end = first + ECHO_GAP * n;
  if (u < first) return u;
  if (u < end) {
    // Inside echo k: wind back up and strike again (animation time 0.25 to 0.55, where the blow lands).
    const frac = ((u - first) % ECHO_GAP) / ECHO_GAP;
    return 0.25 + 0.3 * frac;
  }
  return 0.6 + 0.4 * ((u - end) / Math.max(1e-6, 1 - end));
}

/** Per-actor animation state tracked on the renderer side (never written back to the sim). */
export class AnimTrack {
  px = NaN;
  py = NaN;
  /** Smoothed render position (tiles). The sim ticks at a fixed rate, so raw positions step unevenly. */
  rx = NaN;
  ry = NaN;
  walkPhase = 0;
  idlePhase = Math.random();
  /** Seconds since the last hit taken (flash / recoil). */
  hitT = 99;
  /** Direction the last hit came from, radians. */
  hitDir = 0;
  deathT = 0;
  /** +1 faces right, -1 faces left. */
  face = 1;
  /** Same for the isometric camera (screen-x direction). */
  faceIso = 1;
  /** Low-passed velocity (tiles/s) and seconds until the figure may turn around again. */
  private vx = 0;
  private vsx = 0;
  private turnCd = 0;
  speed = 0;
  /** Seconds since the figure started its current attack. */
  lastAttackElapsed = 0;
  attackSeen = false;
  crit = false;
  /**
   * Seconds into a boss's blow (it plays for RELEASE_SECONDS); below 0 the move is made and the wind-up is held until the blow
   * lands. And how many moves it had made by the last update.
   */
  releaseT = 99;
  private moves = -1;

  update(a: Actor, dt: number): void {
    const big = bigMove(a);
    if (big) {
      if (this.moves >= 0 && big.made > this.moves)
        this.releaseT = RELEASE_LANDS * RELEASE_SECONDS - big.lands;
      this.moves = big.made;
    }
    this.releaseT += dt;
    if (Number.isNaN(this.px)) {
      this.px = this.rx = a.x;
      this.py = this.ry = a.y;
    }
    // Chase the sim position; snap on teleports. Animation speed/facing derive from the smoothed motion.
    if (Math.hypot(a.x - this.rx, a.y - this.ry) > 4) {
      this.rx = a.x;
      this.ry = a.y;
      this.px = a.x;
      this.py = a.y;
    } else {
      const k = 1 - Math.exp(-dt * 24);
      this.rx += (a.x - this.rx) * k;
      this.ry += (a.y - this.ry) * k;
    }
    const dx = this.rx - this.px;
    const dy = this.ry - this.py;
    const d = Math.hypot(dx, dy);
    this.px = this.rx;
    this.py = this.ry;
    this.speed = dt > 0 ? d / dt : 0;
    if (d > 0.002) this.walkPhase += d * 0.55;
    const k2 = Math.min(1, dt * 10);
    if (dt > 0) {
      this.vx += (dx / dt - this.vx) * k2;
      this.vsx += ((dx - dy) / dt - this.vsx) * k2;
    }
    this.turnCd -= dt;
    if (a.action) {
      const fx = Math.cos(a.facing);
      const fs = fx - Math.sin(a.facing);
      const nf = Math.abs(fx) > 0.2 ? (fx > 0 ? 1 : -1) : this.face;
      const ns = Math.abs(fs) > 0.2 ? (fs > 0 ? 1 : -1) : this.faceIso;
      if (nf !== this.face || ns !== this.faceIso) this.turnCd = 0.15;
      this.face = nf;
      this.faceIso = ns;
    } else if (this.turnCd <= 0) {
      // Turn only on sustained motion and not more than ~6 times a second, so noise can't flicker the flip.
      const nf = Math.abs(this.vx) > 0.5 ? (this.vx > 0 ? 1 : -1) : this.face;
      const ns = Math.abs(this.vsx) > 0.5 ? (this.vsx > 0 ? 1 : -1) : this.faceIso;
      if (nf !== this.face || ns !== this.faceIso) this.turnCd = 0.15;
      this.face = nf;
      this.faceIso = ns;
    }
    this.idlePhase = (this.idlePhase + dt * 0.5) % 1;
    this.hitT += dt;
    if (!a.alive) this.deathT += dt;
  }

  /** Which animation to show and its normalised time. */
  state(a: Actor): { anim: AnimName; t: number } {
    if (!a.alive) return { anim: 'death', t: Math.min(1, this.deathT / 0.7) };
    if (a.stunT > 0 || a.ail.freezeT > 0) return { anim: 'stun', t: (this.idlePhase * 2) % 1 };
    const big = bigMove(a);
    if (big?.windup != null) return { anim: 'windup', t: big.windup };
    if (this.releaseT < 0) return { anim: 'windup', t: 1 };
    if (this.releaseT < RELEASE_SECONDS)
      return { anim: 'release', t: this.releaseT / RELEASE_SECONDS };
    if (a.action) return { anim: 'attack', t: attackTime(a.action) };
    if (this.speed > 0.6) return { anim: 'walk', t: this.walkPhase % 1 };
    return { anim: 'idle', t: this.idlePhase };
  }
}
