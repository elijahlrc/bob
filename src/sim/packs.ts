import { MONSTER_TYPES, type FactionId } from '../data/monsters';
import type { Actor, World } from './types';

/**
 * Packs that fight as packs (docs/ROSTER.md 6.7). A pack used to share nothing but an alert. Here a pack flanks (its melee
 * members come at the character from several sides, not in a queue), its ranged members keep behind its front, and when its
 * leader falls the rest react by faction. Worked out from the pack's living members, once a tick.
 */

/** The factions whose melee members take slots round the character instead of queueing for it. */
const FLANKERS: ReadonlySet<FactionId> = new Set<FactionId>(['kennel', 'swarm']);

type Pack = {
  /** The living monsters of the pack, in id order. */
  all: Actor[];
  /** The melee ones that move, with their place in that list and the pack's mean position. */
  melee: Actor[];
  slot: Map<number, number>;
  cx: number;
  cy: number;
};

const cache = new WeakMap<World, { tick: number; n: number; byPack: Map<number, Pack> }>();

/**
 * The packs of the living, rebuilt four times a second into the same objects (a room of forty asks forty times a tick). A
 * member that has died since stays in its list until the next rebuild, so what reads a list checks `alive`.
 */
function packs(w: World): Map<number, Pack> {
  let c = cache.get(w);
  if (!c) cache.set(w, (c = { tick: -1, n: -1, byPack: new Map() }));
  const key = Math.floor(w.t * 4);
  // Rebuilt every quarter second, and at once when something has joined the map (a summon, a spawn).
  if (c.tick === key && c.n === w.actors.length) return c.byPack;
  c.tick = key;
  c.n = w.actors.length;
  for (const p of c.byPack.values()) {
    p.all.length = 0;
    p.melee.length = 0;
    p.slot.clear();
    p.cx = 0;
    p.cy = 0;
  }
  for (const a of w.actors) {
    if (a.isPlayer || !a.alive || !a.mon || a.pack < 0) continue;
    let p = c.byPack.get(a.pack);
    if (!p) c.byPack.set(a.pack, (p = { all: [], melee: [], slot: new Map(), cx: 0, cy: 0 }));
    p.all.push(a);
    const t = a.mon.kind;
    if (t.attack === 'melee' && !t.stationary) {
      p.slot.set(a.id, p.melee.length);
      p.melee.push(a);
      p.cx += a.x;
      p.cy += a.y;
    }
  }
  for (const p of c.byPack.values())
    if (p.melee.length) {
      p.cx /= p.melee.length;
      p.cy /= p.melee.length;
    }
  return c.byPack;
}

/** The living monsters of a pack, in id order. */
export function packMates(w: World, m: Actor): Actor[] {
  return packs(w).get(m.pack)?.all ?? [];
}

/** A slot round the target for a melee member of a flanking pack: a point on a 120 degree arc, by the member's place in the pack. */
export function flankPoint(
  w: World,
  m: Actor,
  tgt: Actor,
  d: number,
): { x: number; y: number } | null {
  if (d <= 4 || !m.mon) return null;
  const def = m.mon.kind;
  if (!FLANKERS.has(def.faction) || def.attack !== 'melee' || def.stationary) return null;
  // A skitter or a tether steers by itself.
  if (def.movement?.some((s) => s.id === 'skitter' || s.id === 'tether')) return null;
  const p = packs(w).get(m.pack);
  if (!p || p.melee.length < 3) return null;
  const k = p.slot.get(m.id);
  if (k === undefined) return null;
  const base = Math.atan2(p.cy - tgt.y, p.cx - tgt.x);
  const off = ((k + 0.5) / p.melee.length - 0.5) * ((120 * Math.PI) / 180);
  return { x: tgt.x + Math.cos(base + off) * 1.5, y: tgt.y + Math.sin(base + off) * 1.5 };
}

/** The nearest living front-line member of a pack, for a ranged member to keep behind. */
export function frontOf(w: World, m: Actor): Actor | null {
  let best: Actor | null = null;
  let bd = 16;
  for (const a of packMates(w, m)) {
    if (a === m || !a.alive || MONSTER_TYPES[a.mon!.spec.type].role !== 'front') continue;
    const d = Math.hypot(a.x - m.x, a.y - m.y);
    if (d < bd) {
      bd = d;
      best = a;
    }
  }
  return best;
}

/**
 * A leader of a pack has fallen: the rest react by faction. The Kennel's hounds go into a frenzy, the Choir falters, the
 * Swarm scatters; the others carry on.
 */
export function rally(w: World, dead: Actor): void {
  if (!dead.mon) return;
  const def = MONSTER_TYPES[dead.mon.spec.type];
  if (def.role !== 'support' && def.role !== 'special') return;
  const mates = packMates(w, dead).filter((a) => a !== dead && a.alive);
  if (mates.length < 2) return;
  for (const a of mates) {
    if (def.faction === 'kennel') a.buffT = Math.max(a.buffT, 6);
    else if (def.faction === 'choir') a.stunT = Math.max(a.stunT, 0.7);
    else if (def.faction === 'swarm') a.fleeT = Math.max(a.fleeT, 2.5);
  }
}
