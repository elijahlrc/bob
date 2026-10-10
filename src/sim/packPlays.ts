import type { MonsterTypeId } from '../data/monsters';
import { castPattern } from './blasts';
import type { Action, Actor, World } from './types';

/**
 * Pack plays (docs/ENCOUNTERS.md 8): a pack acts together on a cue.
 *
 * - **Loosing call**: when two or more archers or slingers of a pack can see the character, they hold for a moment and
 *   loose together, each down a lane shown on the ground.
 * - **Encircle**: three or more hounds of a pack hold a ring round the character for two seconds, then all leap at once.
 * - **Converge**: a Nest's call sends every Gnawer of its brood in faster and harder.
 *
 * Looked at four times a second; a pack has one play at a time and a cooldown after it.
 */

const LOOSERS: ReadonlySet<MonsterTypeId> = new Set<MonsterTypeId>(['archer', 'slinger']);
export const LOOSE_WARN = 0.8;
const LOOSE_COOLDOWN = 10;
export const RING_RADIUS = 5;
const RING_SECONDS = 2;
const RING_COOLDOWN = 14;
const CONVERGE_COOLDOWN = 12;

type Play = {
  kind: 'loose' | 'ring' | 'converge' | null;
  /** Seconds left of the play, and before the pack may play again. */
  t: number;
  cd: number;
  members: Actor[];
  /** A ring: the angle its slots start from. */
  base: number;
};

const state = new WeakMap<World, { next: number; packs: Map<number, Play> }>();

function stateOf(w: World) {
  let s = state.get(w);
  if (!s) state.set(w, (s = { next: 0, packs: new Map() }));
  return s;
}

function playOf(w: World, pack: number): Play {
  const s = stateOf(w);
  let p = s.packs.get(pack);
  if (!p) s.packs.set(pack, (p = { kind: null, t: 0, cd: 2, members: [], base: 0 }));
  return p;
}

/** A play's members hold still (a monster with `windT` stands; the dash code counts it down only for leapers). */
function hold(m: Actor, seconds: number): void {
  m.action = null;
  m.windT = Math.max(m.windT, seconds);
}

/** Advance the plays in progress, and four times a second look for packs that can start one. */
export function tickPackPlays(w: World, dt: number): void {
  const s = stateOf(w);
  for (const pl of s.packs.values()) {
    if (pl.cd > 0) pl.cd -= dt;
    if (pl.t <= 0) continue;
    pl.t -= dt;
    if (pl.kind === 'loose')
      for (const m of pl.members) if (m.alive && m.windT > 0) m.windT = Math.max(0, m.windT - dt);
    if (pl.kind === 'ring') {
      // The hounds keep their leaps for the end.
      for (const m of pl.members) if (m.alive) m.abT[0] = Math.max(m.abT[0] ?? 0, 0.3);
      if (pl.t <= 0) for (const m of pl.members) if (m.alive) m.abT[0] = 0;
    }
    if (pl.t <= 0) pl.kind = null;
  }
  if (w.t < s.next) return;
  s.next = w.t + 0.25;
  const p = w.player;
  if (!p.alive) return;
  // The members of each pack that could take part, by play.
  const loosers = new Map<number, Actor[]>();
  const hounds = new Map<number, Actor[]>();
  const nests: Actor[] = [];
  for (const a of w.actors) {
    if (a.isPlayer || !a.alive || !a.mon || a.state !== 'chase' || a.pack < 0 || a.stunT > 0)
      continue;
    const type = a.mon.spec.type;
    const d = Math.hypot(a.x - p.x, a.y - p.y);
    if (LOOSERS.has(type) && d <= 10 && w.grid.los(a.x, a.y, p.x, p.y)) {
      const l = loosers.get(a.pack) ?? [];
      l.push(a);
      loosers.set(a.pack, l);
    } else if (type === 'hound' && d <= 9 && a.dashT <= 0 && a.windT <= 0) {
      const l = hounds.get(a.pack) ?? [];
      l.push(a);
      hounds.set(a.pack, l);
    } else if (type === 'nest' && d <= 14) nests.push(a);
  }
  for (const [pack, list] of loosers) {
    const pl = playOf(w, pack);
    if (list.length < 2 || pl.cd > 0 || pl.kind) continue;
    pl.kind = 'loose';
    pl.t = LOOSE_WARN;
    pl.cd = LOOSE_COOLDOWN;
    pl.members = list;
    w.events.push({ t: 'window', id: list[0].id, kind: 'call' });
    for (const m of list) {
      hold(m, LOOSE_WARN);
      m.facing = Math.atan2(p.y - m.y, p.x - m.x);
      const act = { profile: m.mon!.profile(0), aimX: p.x, aimY: p.y } as Action;
      castPattern(w, m, act, 'volley');
    }
  }
  for (const [pack, list] of hounds) {
    const pl = playOf(w, pack);
    if (list.length < 3 || pl.cd > 0 || pl.kind) continue;
    pl.kind = 'ring';
    pl.t = RING_SECONDS;
    pl.cd = RING_COOLDOWN;
    pl.members = list;
    let cx = 0;
    let cy = 0;
    for (const m of list) {
      cx += m.x;
      cy += m.y;
    }
    pl.base = Math.atan2(cy / list.length - p.y, cx / list.length - p.x);
    w.events.push({ t: 'window', id: list[0].id, kind: 'encircle' });
  }
  for (const nest of nests) {
    const pl = playOf(w, nest.pack);
    if (pl.cd > 0 || pl.kind) continue;
    const brood = w.actors.filter(
      (a) =>
        a.alive && a.pack === nest.pack && a.mon?.spec.type === 'gnawer' && a.state === 'chase',
    );
    if (brood.length < 4) continue;
    pl.kind = 'converge';
    pl.t = 3;
    pl.cd = CONVERGE_COOLDOWN;
    pl.members = brood;
    for (const g of brood) g.buffT = Math.max(g.buffT, 3);
    w.events.push({ t: 'window', id: nest.id, kind: 'converge' });
  }
}

/** Where a hound of an Encircle stands: its slot on the ring round the target (null when it is not in one). */
export function ringSlot(
  w: World,
  m: Actor,
  tgt: Actor,
): { x: number; y: number; pace: number } | null {
  if (m.pack < 0 || m.mon?.spec.type !== 'hound') return null;
  const pl = stateOf(w).packs.get(m.pack);
  if (!pl || pl.kind !== 'ring' || pl.t <= 0) return null;
  const k = pl.members.indexOf(m);
  if (k < 0) return null;
  const ang = pl.base + (k / pl.members.length) * Math.PI * 2;
  const x = tgt.x + Math.cos(ang) * RING_RADIUS;
  const y = tgt.y + Math.sin(ang) * RING_RADIUS;
  return { x, y, pace: 1.3 };
}

/** The rings being held now, for the renderer: round the character, and how long is left of each. */
export function activeRings(w: World): { t: number; n: number }[] {
  const out: { t: number; n: number }[] = [];
  for (const pl of stateOf(w).packs.values())
    if (pl.kind === 'ring' && pl.t > 0) out.push({ t: pl.t, n: pl.members.length });
  return out;
}
