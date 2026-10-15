/**
 * How the character spends its time in a fight (docs/SHEET-AUDIT.md): the sheet's rotation.
 *
 * The sim's character chooses what to do each time it is free (`chooseSkill`, src/sim/ai.ts, docs/PLAYER-AI.md 4.1):
 *   1. the first of the other skills, in their order, whose moment has come (a utility skill after its pause, a periodic one
 *      after its pause or when its cooldown has a use ready);
 *   2. else the first main skill that can be used (its cooldown has a use ready, and its totems are not all standing);
 *   3. else, with no main skill to use, a periodic skill that is ready, whatever its pause;
 *   4. else the weapon.
 * An action takes the skill's use time and is never cut short.
 *
 * `planRotation` plays that choice over a few minutes of time with nothing else going on (no mana to run out, no target to
 * die), and counts what it did. The sheet then prices each skill by the uses a second it was given, instead of guessing at the
 * shares of time the skills might have: a main skill on a cooldown leaves gaps that the other mains, the periodic skills and
 * the weapon fill in the order the character would fill them.
 *
 * Pure numbers in, numbers out: the sheet turns its skill profiles into `PlanSkill`s (`Character.plan`).
 */

export type PlanSkill = {
  key: string;
  /** Seconds one use takes. */
  useTime: number;
  /** Seconds before it is used again, for a skill with no cooldown of its own (a periodic skill's pause, a utility skill's interval). */
  pause: number;
  /** A cooldown of its own: the seconds a use takes to come back, and how many uses it holds. */
  cooldown?: { seconds: number; uses: number };
  /**
   * A totem or a brand: how many may stand, how long each stands, the seconds before its first shot and between its shots. The
   * skill is used to put one down, only when fewer than `count` stand.
   */
  standing?: { count: number; seconds: number; firstShot: number; interval: number };
};

export type PlanInput = {
  /** The skills other than the main ones, in the order the character considers them (utility skills and periodic skills). */
  rotation: (PlanSkill & { utility: boolean })[];
  /** The main skills that hold in this fight, in order. */
  mains: PlanSkill[];
  /** Seconds one use of the weapon takes. */
  weapon: number;
  /** Seconds of play to count (default 300). */
  horizon?: number;
};

export type Plan = {
  /** Uses started a second, by skill (a totem or brand: the ones put down). */
  acts: Record<string, number>;
  /** Shots a second from the totems and brands a skill has standing. */
  shots: Record<string, number>;
  /** Uses of the weapon a second. */
  weapon: number;
  /** The share of time each skill (and the weapon, as 'weapon') takes. */
  busy: Record<string, number>;
  /** The seconds counted. */
  seconds: number;
};

/** How much of a use's time passes before it lands (a totem stands from then). */
const LANDS_AT = 0.6;

type State = {
  s: PlanSkill;
  /** Time from which a skill without a cooldown may be used again. */
  readyAt: number;
  /** Uses held now, and when the next one comes back (a skill with a cooldown). */
  stock: number;
  refillAt: number;
  /** When each standing totem or brand ends. */
  ends: number[];
};

export function planRotation(input: PlanInput): Plan {
  const horizon = input.horizon ?? 300;
  const make = (s: PlanSkill): State => ({
    s: { ...s, useTime: Math.max(0.05, s.useTime) },
    readyAt: 0,
    stock: s.cooldown?.uses ?? 1,
    refillAt: Infinity,
    ends: [],
  });
  const rot = input.rotation.map((r) => ({ st: make(r), utility: r.utility }));
  const mains = input.mains.map(make);
  const weaponTime = Math.max(0.05, input.weapon);

  const acts: Record<string, number> = {};
  const shots: Record<string, number> = {};
  const busy: Record<string, number> = {};
  let weapon = 0;
  let weaponBusy = 0;

  const refill = (st: State, t: number) => {
    const cd = st.s.cooldown;
    if (!cd) return;
    while (st.refillAt <= t) {
      st.stock = Math.min(cd.uses, st.stock + 1);
      st.refillAt = st.stock < cd.uses ? st.refillAt + cd.seconds : Infinity;
    }
  };
  const standingNow = (st: State, t: number) => {
    let n = 0;
    for (const e of st.ends) if (e > t) n++;
    return n;
  };
  /** Whether the skill can be used now (its cooldown, its totems). */
  const ready = (st: State, t: number): boolean => {
    if (st.s.cooldown && st.stock <= 0) return false;
    if (st.s.standing && standingNow(st, t) >= st.s.standing.count) return false;
    return true;
  };
  const use = (st: State, t: number, byPause: boolean) => {
    const { s } = st;
    acts[s.key] = (acts[s.key] ?? 0) + 1;
    busy[s.key] = (busy[s.key] ?? 0) + s.useTime;
    if (s.cooldown) {
      if (st.stock >= s.cooldown.uses) st.refillAt = t + s.cooldown.seconds;
      st.stock--;
    } else if (byPause) st.readyAt = t + Math.max(s.pause, s.useTime);
    if (s.standing) {
      const st0 = t + LANDS_AT * s.useTime;
      const end = st0 + s.standing.seconds;
      st.ends = st.ends.filter((e) => e > t);
      st.ends.push(end);
      // The shots it fires before it ends, or before the count ends.
      const span = Math.min(end, horizon) - st0 - s.standing.firstShot;
      if (span >= 0)
        shots[s.key] = (shots[s.key] ?? 0) + Math.floor(span / s.standing.interval) + 1;
    }
  };

  let t = 0;
  while (t < horizon) {
    for (const r of rot) refill(r.st, t);
    for (const m of mains) refill(m, t);
    let picked: State | null = null;
    let byPause = false;
    // 1. The other skills, in order.
    for (const { st } of rot) {
      if (!st.s.cooldown && st.readyAt > t) continue;
      if (!ready(st, t)) continue;
      picked = st;
      byPause = true;
      break;
    }
    // 2. The first main skill that can be used.
    if (!picked)
      for (const m of mains)
        if (ready(m, t)) {
          picked = m;
          break;
        }
    // 3. With no main skill to use, a periodic skill that is ready, whatever its pause.
    if (!picked)
      for (const { st, utility } of rot)
        if (!utility && ready(st, t)) {
          picked = st;
          byPause = true;
          break;
        }
    if (picked) {
      use(picked, t, byPause);
      t += picked.s.useTime;
    } else {
      // 4. The weapon.
      weapon++;
      weaponBusy += weaponTime;
      t += weaponTime;
    }
  }
  const per = (m: Record<string, number>, over: number) => {
    const o: Record<string, number> = {};
    for (const k of Object.keys(m)) o[k] = m[k] / over;
    return o;
  };
  const share: Record<string, number> = per(busy, t);
  share.weapon = weaponBusy / t;
  return {
    acts: per(acts, t),
    shots: per(shots, horizon),
    weapon: weapon / t,
    busy: share,
    seconds: t,
  };
}
