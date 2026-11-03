import { Rng } from '../core/rng';
import { ITEM_BASES } from '../data/bases';
import { BOSSES, type BossId } from '../data/bosses';
import { MONSTER_TYPES } from '../data/monsters';
import { getTree } from '../data/tree';
import { rollItemOf } from '../gen/loot';
import { noteFound } from '../run/found';
import { allocate, pathTo } from '../run/tree';
import { itemLines } from '../ui/ItemCard';
import { forceBiome, type BiomeId } from '../data/biomes';
import { forceDensity, type DensityId } from '../data/density';
import type { Difficulty } from '../data/difficulty';
import { inBlast, pending } from '../sim/blasts';
import { bossState } from '../sim/bosses';
import { killActor } from '../sim/combat';
import type { Build, Item } from '../data/types';
import { makeGem, makeItem } from '../gen/items';
import { botAllocate } from '../run/bot';
import type { Controller } from '../run/controller';
import { newRun, planFor, setMap, uidSource, worldOptsFor, type RunState } from '../run/run';
import { createWorld, spawnMonster } from '../sim/world';
import type { World } from '../sim/types';

/**
 * Trailer staging (docs/trailer/README.md): builds the scenes the trailer's shots are filmed from, in the real game, for
 * `scripts/trailer/capture.ts`. Loaded by that script from the dev server (`import('/src/trailer/stage.ts')`); the game never
 * imports it.
 */

/** A character for a shot: class and level, a weapon, and the gems of each item (all gems in one item are linked). */
export type Loadout = {
  classId: string;
  level: number;
  seed?: number;
  /** Base ids; `offHand: null` leaves the hand empty (a two-hander). */
  weapon?: string;
  offHand?: string | null;
  body?: string[];
  helmet?: string[];
  gloves?: string[];
  boots?: string[];
  /** The gem the character leads with (by gem id); the first gem of the body when unset. */
  primary?: string;
  difficulty?: Difficulty;
};

const ARMOUR: Record<string, string> = {
  body: 'body_ar_l59',
  helmet: 'helmet_ar_1',
  gloves: 'gloves_ar_1',
  boots: 'boots_ar_1',
};

/** A run whose character is `l`, at map `map`; its passive points are spent by the bot (for the attributes the gems want). */
export function stagedRun(l: Loadout, map: number): RunState {
  const run = newRun(l.classId, l.seed ?? 1, l.difficulty);
  const uid = uidSource(run);
  run.build.level = l.level;
  setMap(run, map);
  botAllocate(run);
  const eq = run.build.equipment;
  if (l.weapon) eq.mainHand = makeItem(uid, l.weapon, l.level, 1);
  if (l.offHand === null) delete eq.offHand;
  else if (l.offHand) eq.offHand = makeItem(uid, l.offHand, l.level, 0);
  const all: { uid: number; gemId: string }[] = [];
  for (const slot of ['body', 'helmet', 'gloves', 'boots'] as const) {
    const gems = l[slot];
    if (!gems?.length) continue;
    const it: Item = makeItem(uid, slot === 'body' ? ARMOUR.body : ARMOUR[slot], l.level, 0);
    it.sockets = gems.map((g) => makeGem(uid, g));
    eq[slot] = it;
    for (const g of it.sockets) if (g) all.push(g);
  }
  run.build.primaryGem = (all.find((g) => g.gemId === l.primary) ?? all[0])?.uid;
  run.build.primaryAuto = false;
  return run;
}

export type MapStage = {
  theme?: string;
  biome?: BiomeId | null;
  density?: DensityId | null;
  /** The character cannot die (default true). */
  god?: boolean;
};

/** Start a map of `run` on the controller, as a real map is started, with the theme, biome and density asked for. */
export function playMap(c: Controller, run: RunState, s: MapStage = {}): World {
  forceBiome(s.biome ?? null);
  forceDensity(s.density ?? null);
  const plan = planFor(run, s.theme ?? run.offers[0]);
  forceBiome(null);
  forceDensity(null);
  const world = createWorld({
    plan,
    build: run.build,
    xp: 0,
    opts: {
      ...worldOptsFor(run, plan),
      godMode: s.god ?? true,
      freeResources: s.god ?? true,
      maxTime: 900,
      autoAbandonAt: Infinity,
    },
  });
  return show(c, run, world);
}

/** Put a world on screen as the current map. */
export function show(c: Controller, run: RunState, world: World): World {
  const cc = c as unknown as { acc: number };
  c.showcase = null;
  c.gallery = null;
  c.duel = null;
  if (c.world) c.bus.emit('mapEnd', null);
  c.run = run;
  c.world = world;
  cc.acc = 0;
  c.screen = 'map';
  c.speed = 1;
  c.paused = false;
  c.bus.emit('select', { id: null });
  c.bus.emit('mapStart', { world });
  c.bus.emit('state', null);
  return world;
}

/** Keep the map on screen when it ends (a death is held on, not cut away from). */
export function holdEnd(c: Controller): void {
  (c as unknown as { endMap: () => void }).endMap = () => {};
}

/** Advance the sim `frames` frames of `dtMs` without drawing (the renderer catches up on the next drawn frame). */
export function warm(c: Controller, frames: number, dtMs = 1000 / 30): void {
  for (let i = 0; i < frames; i++) c.bus.emit('frame', { dtMs });
}

/** Warm until `pred` holds, at most `max` frames; returns the frames taken or -1. */
export function warmUntil(
  c: Controller,
  pred: (w: World) => boolean,
  max = 3000,
  dtMs = 1000 / 30,
): number {
  for (let i = 0; i < max; i++) {
    const w = c.world;
    if (w && pred(w)) return i;
    c.bus.emit('frame', { dtMs });
  }
  return -1;
}

/** Living monsters within `r` tiles of the character. */
export function near(w: World, r: number): number {
  const p = w.sides[0].player;
  return w.actors.filter(
    (a) => !a.isPlayer && a.alive && a.side === null && Math.hypot(a.x - p.x, a.y - p.y) < r,
  ).length;
}

/** The sim events of the frames since the last call, by type (the capture script logs them per frame to find the hits). */
export function tapEvents(c: Controller): () => string[] {
  const seen: string[] = [];
  c.bus.on('ticked', ({ events }) => {
    for (const e of events) seen.push(e.t);
  });
  return () => seen.splice(0);
}

export type { Build };

/** Show the camp of `run` (the Next map tab first, as after a fresh start). */
export function toCamp(c: Controller, run: RunState): void {
  if (c.world) c.bus.emit('mapEnd', null);
  c.world = null;
  c.showcase = null;
  c.run = run;
  c.lastResult = null;
  c.goTo('camp');
  c.bus.emit('state', null);
}

/**
 * Set up the tree shot: a keystone whose path from the bot's allocation is `steps` long or longer, with all but the last
 * `steps` nodes of it taken and points to spare. Returns the keystone's name (to find it with the tree's search) and the nodes
 * left to take, in order.
 */
export function treeShot(run: RunState, steps = 4): { name: string; path: number[] } | null {
  const tree = getTree();
  let best: { id: number; path: number[] } | null = null;
  for (const n of tree.nodes) {
    if (n.kind !== 'keystone' || n.retired) continue;
    const p = pathTo(run.build.allocated, run.classId, n.id);
    if (!p || p.length < steps) continue;
    if (!best || p.length < best.path.length) best = { id: n.id, path: p };
  }
  if (!best) return null;
  const pre = best.path.slice(0, best.path.length - steps);
  run.build = { ...run.build, allocated: [...run.build.allocated, ...pre] };
  run.bonusPoints += steps + pre.length + 2;
  return { name: tree.nodes[best.id].name, path: best.path.slice(-steps) };
}

/** Throw unless the tree's nodes `ids` have the names `names` (a build written down before the tree changed). */
export function checkNodes(ids: number[], names: string[]): void {
  const { nodes } = getTree();
  ids.forEach((id, i) => {
    if (nodes[id]?.name !== names[i])
      throw new Error(`node ${id} is ${nodes[id]?.name}, not ${names[i]}: run treeBuild.ts`);
  });
}

/** Where `classId` starts and where each of the nodes `ids` is, in tree units. */
export function nodePoints(
  classId: string,
  ids: number[],
): { start: [number, number]; pts: [number, number][] } {
  const tree = getTree();
  const st = tree.nodes[tree.starts[classId]];
  return {
    start: [st.x, st.y],
    pts: ids.map((id) => [tree.nodes[id].x, tree.nodes[id].y] as [number, number]),
  };
}

/** The box the nodes `ids` fill, and where `classId` starts, in tree units. */
export function boxOf(
  classId: string,
  ids: number[],
): { minX: number; minY: number; maxX: number; maxY: number; startX: number; startY: number } {
  const tree = getTree();
  const st = tree.nodes[tree.starts[classId]];
  const box = { minX: st.x, minY: st.y, maxX: st.x, maxY: st.y, startX: st.x, startY: st.y };
  for (const id of ids) {
    const n = tree.nodes[id];
    box.minX = Math.min(box.minX, n.x);
    box.minY = Math.min(box.minY, n.y);
    box.maxX = Math.max(box.maxX, n.x);
    box.maxY = Math.max(box.maxY, n.y);
  }
  return box;
}

/** Set the passives taken (in order) without spending points, for a tree that fills up on screen. */
export function setAllocated(c: Controller, ids: number[]): void {
  c.act((r) => {
    r.build = { ...r.build, allocated: ids };
  });
}

/** Take one node of the tree, as a click on it does. */
export function take(c: Controller, node: number): void {
  c.act((r) => {
    allocate(r, node);
  });
}

/** Maps behind the run, as if it had played them (for the end screen of a run that falls on map `run.map`). */
export function pastMaps(run: RunState): void {
  for (let m = 1; m < run.map; m++)
    run.history.push({
      map: m,
      areaLevel: m,
      status: 'cleared',
      time: 70 + ((m * 37) % 40),
      levelAfter: Math.min(run.build.level, 1 + Math.round(m * 1.4)),
      kills: 60 + ((m * 53) % 50),
      stuck: 0,
    });
}

/** A rare amulet whose lines suit a lightning critical build, put in the bag as just found; returns its uid. */
export function rareAmulet(run: RunState, ilvl: number): number {
  const uid = uidSource(run);
  const bases = ITEM_BASES.filter((b) => b.itemClass === 'amulet' && b.level <= ilvl);
  let pick: Item | null = null;
  for (let s = 1; s < 4000 && !pick; s++) {
    const rng = new Rng(s);
    const it = rollItemOf(rng, uid, rng.pick(bases), ilvl, 'rare') as Item;
    const lines = itemLines(it).join(' | ');
    if (/lightning/i.test(lines) && /critical/i.test(lines) && /life/i.test(lines)) pick = it;
  }
  if (!pick) throw new Error('no amulet');
  noteFound(run, pick);
  run.acquired[pick.uid] = run.map;
  run.inventory = run.inventory.concat(pick);
  return pick.uid;
}

/** A poor amulet on the character's neck, for the drop to replace (a plain base and no affixes, named for the shot). */
export function wornAmulet(run: RunState, name = 'Worn Locket'): void {
  const it = makeItem(uidSource(run), 'amulet_liferegen', 5, 0, 'normal');
  it.name = name;
  run.build = { ...run.build, equipment: { ...run.build.equipment, amulet: it } };
}

/** Drop `itemUid`'s item from the bag on the ground beside the character, as a kill drops loot. */
export function dropNear(w: World, run: RunState, itemUid: number, dx = 1.5, dy = 0.5): void {
  const item = run.inventory.find((i) => i.uid === itemUid)!;
  const p = w.sides[0].player;
  w.drops.push({ id: w.nextId++, x: p.x + dx, y: p.y + dy, item } as World['drops'][number]);
}

/**
 * A big monster set down `dist` tiles from the character, toward the nearest other monster, standing in the shot; returns its id.
 * `keepBig` holds it up through the fight and `fellBig` brings it down with a drop.
 */
export function bigOne(
  w: World,
  run: RunState,
  type: keyof typeof MONSTER_TYPES = 'slagbrute',
  dist = 3.6,
): number {
  const p = w.sides[0].player;
  const foes = w.actors
    .filter((a) => !a.isPlayer && a.alive && a.side === null)
    .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
  const ang = foes[0] ? Math.atan2(foes[0].y - p.y, foes[0].x - p.x) : 0;
  const spot = w.grid.collide(p.x + Math.cos(ang) * dist, p.y + Math.sin(ang) * dist, 0.9);
  const room = w.plan.lab.rooms.findIndex(
    (r) =>
      spot.x >= r.rect.x &&
      spot.x < r.rect.x + r.rect.w &&
      spot.y >= r.rect.y &&
      spot.y < r.rect.y + r.rect.h,
  );
  const spec = {
    type,
    variant: 'none' as const,
    rarity: 'rare' as const,
    level: run.map,
    mods: [],
  };
  const m = spawnMonster(w, spec, spot.x, spot.y, Math.max(0, room), 999, MONSTER_TYPES[type].name);
  m.state = 'chase';
  return m.id;
}

/** The living monsters within `r` tiles of the character, nearest first. */
function packOf(w: World, r: number): World['actors'] {
  const p = w.sides[0].player;
  const d = (a: { x: number; y: number }) => Math.hypot(a.x - p.x, a.y - p.y);
  return w.actors
    .filter((a) => !a.isPlayer && a.alive && a.side === null && d(a) < r)
    .sort((a, b) => d(a) - d(b));
}

/** Put the character's Skyfall markers on the pack around it (within `r` tiles), one on each monster in turn. */
export function aimMarkers(w: World, r = 3): void {
  const pack = packOf(w, r);
  if (!pack.length) return;
  w.sides[0].markers.forEach((m, j) => {
    m.x = pack[j % pack.length].x;
    m.y = pack[j % pack.length].y;
  });
}

/** When the Skyfall markers are struck in the next frame (of `dt` seconds), every monster under one dies of it. */
export function doomMarked(w: World, dt = 1 / 30): void {
  const s = w.sides[0];
  if (!s.markers.some((m) => m.t <= dt + 1e-6)) return;
  for (const m of s.markers) {
    const r = m.profile.skill.markers!.radius * m.profile.radiusMult;
    for (const e of packOf(w, 99))
      if (Math.hypot(e.x - m.x, e.y - m.y) <= r + e.r) {
        e.life = Math.min(e.life, 1);
        e.es = 0;
      }
  }
}

/** Hold the big monster `id` up: it takes no more than half its life. */
export function keepBig(w: World, id: number): void {
  const m = w.actors.find((a) => a.id === id);
  if (m?.alive) m.life = Math.max(m.life, m.def.maxLife * 0.5);
}

/** Clear the character's traps and bolts from around the big monster `id` (living or fallen), so that nothing hides it. */
export function calmBig(w: World, id: number): void {
  const m = w.actors.find((a) => a.id === id);
  if (!m) return;
  const clear = (o: { x: number; y: number }) => Math.hypot(o.x - m.x, o.y - m.y) > 4;
  w.effects = w.effects.filter(clear);
  w.projectiles = w.projectiles.filter(clear);
  w.sides[0].deployables = w.sides[0].deployables.filter(clear);
  w.sides[0].zones = w.sides[0].zones.filter(clear);
  w.sides[0].fields = w.sides[0].fields.filter(clear);
}

/** Bring the big monster `id` down, and the item `uid` drops where it stood, a step toward the character. */
export function fellBig(w: World, run: RunState, id: number, uid: number): void {
  const m = w.actors.find((a) => a.id === id);
  if (!m) throw new Error('no big monster to fell');
  const p = w.sides[0].player;
  const d = Math.hypot(p.x - m.x, p.y - m.y) || 1;
  const item = run.inventory.find((i) => i.uid === uid)!;
  // Its own loot is left out: the item is what drops.
  const had = new Set(w.drops.map((d) => d.id));
  killActor(w, m);
  w.drops = w.drops.filter((d) => had.has(d.id));
  w.drops.push({
    id: w.nextId++,
    x: m.x + ((p.x - m.x) / d) * 0.7,
    y: m.y + ((p.y - m.y) / d) * 0.7,
    item,
  } as World['drops'][number]);
}

/**
 * From now on the character stands where it is and does nothing (after each sim frame, before it is drawn): no step (it would
 * walk to the loot and pick it up), no skill, and nothing new thrown or set down is drawn or kept. What is already down plays on.
 * Returns the release: from then on the character acts again. With `walk` it walks on instead, `speed` tiles a second along
 * (`dx`, `dy`), still using no skill; with `casts` too it uses its skills that many times as it goes, stopping for each (none before frame `castAfter`).
 */
export function standStill(
  c: Controller,
  game: { scene: { getScene(key: string): unknown } },
  walk?: { dx: number; dy: number; speed: number; casts?: number; castAfter?: number },
): () => void {
  let on = true;
  const w = c.world!;
  const s = w.sides[0];
  const p = s.player;
  const at = { x: p.x, y: p.y, facing: p.facing };
  type Events = (events: World['events'], w: World) => void;
  const style = (
    game.scene.getScene('map') as {
      style: { onEvents: Events; fx: { flights: Map<number, unknown> } } | null;
    }
  ).style;
  if (!style) throw new Error('no map style');
  // A trap still in the air when it stops is not drawn landing, nor kept.
  s.deployables = s.deployables.filter((d) => !style.fx.flights.has(d.id));
  const had = new Set(s.deployables.map((d) => d.id));
  const grounded = () => {
    for (const id of style.fx.flights.keys())
      if (!s.deployables.some((d) => d.id === id)) style.fx.flights.delete(id);
  };
  grounded();
  const draw = style.onEvents.bind(style);
  const casts = walk?.casts ?? 0;
  const after = walk?.castAfter ?? 0;
  let frame = 0;
  let used = 0;
  let allowed: unknown = null;
  style.onEvents = (events, ww) =>
    draw(
      !on
        ? events
        : events.filter(
            (e) =>
              !(e.t === 'deploy' && !e.end && !had.has(e.id) && !casts) &&
              !(e.t === 'use' && e.src === p.id && (used >= casts || frame < after)),
          ),
      ww,
    );
  const step = walk ? walk.speed / 30 / Math.hypot(walk.dx, walk.dy) : 0;
  c.bus.on('ticked', ({ events }) => {
    if (!on) return;
    frame++;
    for (const e of events)
      if (e.t === 'use' && e.src === p.id && used < casts && frame > after) {
        used++;
        allowed = p.action;
      }
    if (p.action && p.action === allowed) {
      // A cast it may make: it stands where it is until the cast is done.
      p.x = at.x;
      p.y = at.y;
      p.moving = false;
      return;
    }
    if (walk) {
      const to = w.grid.collide(at.x + walk.dx * step, at.y + walk.dy * step, p.r);
      at.x = to.x;
      at.y = to.y;
      at.facing = Math.atan2(walk.dy, walk.dx);
    }
    p.x = at.x;
    p.y = at.y;
    p.facing = at.facing;
    p.moving = !!walk;
    p.action = null;
    // (What its casts threw flies on.)
    if (casts) return;
    s.deployables = s.deployables.filter((d) => had.has(d.id));
    w.projectiles = w.projectiles.filter((o) => o.owner !== p.id);
    grounded();
  });
  return () => {
    on = false;
  };
}

/**
 * A crowd for an opening shot: `n` plain monsters of the kinds already on the map, set down in a ring `dist` tiles round the
 * character and all coming for it. Returns their ids.
 */
export function crowd(w: World, run: RunState, n: number, dist = 5): number[] {
  const p = w.sides[0].player;
  const kinds = [
    ...new Set(
      w.actors.filter((a) => !a.isPlayer && a.side === null && a.mon).map((a) => a.mon!.spec.type),
    ),
  ];
  if (!kinds.length) throw new Error('no monsters on the map to copy');
  const ids: number[] = [];
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2 + (i % 2) * 0.3;
    const d = dist + (i % 3) * 0.7;
    const spot = w.grid.collide(p.x + Math.cos(ang) * d, p.y + Math.sin(ang) * d, 0.6);
    const room = w.plan.lab.rooms.findIndex(
      (r) =>
        spot.x >= r.rect.x &&
        spot.x < r.rect.x + r.rect.w &&
        spot.y >= r.rect.y &&
        spot.y < r.rect.y + r.rect.h,
    );
    const type = kinds[i % kinds.length];
    const spec = {
      type,
      variant: 'none' as const,
      rarity: 'normal' as const,
      level: run.map,
      mods: [],
    };
    const m = spawnMonster(
      w,
      spec,
      spot.x,
      spot.y,
      Math.max(0, room),
      998,
      MONSTER_TYPES[type].name,
    );
    m.state = 'chase';
    ids.push(m.id);
  }
  return ids;
}

/** Put the character in the middle of the map's biggest room (an opening shot wants open ground round it). */
export function centre(w: World): void {
  // Of the biggest rooms, the one nearest the middle of the map (one at its edge has the void beyond its wall in the shot).
  const mid = (r: { rect: { x: number; y: number; w: number; h: number } }) =>
    Math.hypot(r.rect.x + r.rect.w / 2 - w.grid.w / 2, r.rect.y + r.rect.h / 2 - w.grid.h / 2);
  const room = [...w.plan.lab.rooms].sort(
    (a, b) => b.rect.w * b.rect.h - a.rect.w * a.rect.h || mid(a) - mid(b),
  )[0];
  const p = w.sides[0].player;
  const at = w.grid.nearestReachable(room.rect.x + room.rect.w / 2, room.rect.y + room.rect.h / 2);
  p.x = at?.x ?? room.rect.x + room.rect.w / 2;
  p.y = at?.y ?? room.rect.y + room.rect.h / 2;
}

/**
 * From now on the monsters only close in: no blow is started, and nothing of theirs is thrown or laid on the ground. Returns the
 * release.
 */
export function harmless(c: Controller): () => void {
  let on = true;
  c.bus.on('ticked', () => {
    const w = c.world;
    if (!on || !w) return;
    const foe = new Set<number>();
    for (const a of w.actors)
      if (!a.isPlayer && a.side === null) {
        foe.add(a.id);
        a.action = null;
      }
    w.effects = w.effects.filter((e) => e.owner == null || !foe.has(e.owner));
    w.projectiles = w.projectiles.filter((o) => !foe.has(o.owner));
  });
  return () => {
    on = false;
  };
}

/** Take every monster within `r` tiles of the character off the map (the ground an army is set down on). */
export function clearAround(w: World, r: number): void {
  const p = w.sides[0].player;
  w.actors = w.actors.filter(
    (a) => a.isPlayer || a.side !== null || Math.hypot(a.x - p.x, a.y - p.y) > r,
  );
}

/**
 * An army for an opening shot: `n` plain monsters of `kinds` (taken in turn) in ranks round (`x`, `y`), `width` tiles
 * across the line (`ax`, `ay`) and `depth` tiles deep behind it, all coming for the character. Returns their ids.
 */
export function army(
  w: World,
  run: RunState,
  kinds: (keyof typeof MONSTER_TYPES)[],
  n: number,
  at: { x: number; y: number; ax: number; ay: number; width: number; depth: number },
): number[] {
  const p = w.sides[0].player;
  // Behind the line: away from the character.
  const bl = Math.hypot(at.x - p.x, at.y - p.y) || 1;
  const bx = (at.x - p.x) / bl;
  const by = (at.y - p.y) / bl;
  const per = Math.max(1, Math.round(at.width / 0.9));
  const ids: number[] = [];
  for (let i = 0; i < n; i++) {
    const rank = Math.floor(i / per);
    const file = i % per;
    const across = (file / Math.max(1, per - 1) - 0.5) * at.width + (rank % 2) * 0.45;
    const back = (rank / Math.max(1, Math.ceil(n / per) - 1)) * at.depth;
    const x = at.x + at.ax * across + bx * back;
    const y = at.y + at.ay * across + by * back;
    const room = w.plan.lab.rooms.findIndex(
      (r) => x >= r.rect.x && x < r.rect.x + r.rect.w && y >= r.rect.y && y < r.rect.y + r.rect.h,
    );
    const type = kinds[i % kinds.length];
    const spec = {
      type,
      variant: 'none' as const,
      rarity: 'normal' as const,
      level: run.map,
      mods: [],
    };
    const m = spawnMonster(w, spec, x, y, Math.max(0, room), 997, MONSTER_TYPES[type].name);
    m.state = 'chase';
    // Ten times as tough: what the character throws on its way in hurts the army without thinning it (`wipe` brings it low).
    // (Its own defence, made for it when it was set down.)
    m.def.maxLife *= 10;
    m.life = m.def.maxLife;
    ids.push(m.id);
  }
  return ids;
}

/** The character's areas are `k` times as wide (a nova that must read on a phone screen). */
export function widen(w: World, k: number): void {
  const ch = w.sides[0].char;
  const of = ch.profile.bind(ch);
  const wide = new WeakMap<object, ReturnType<typeof of>>();
  ch.profile = (...args: Parameters<typeof of>) => {
    const p = of(...args);
    let q = wide.get(p);
    if (!q) wide.set(p, (q = { ...p, radiusMult: p.radiusMult * k }));
    return q;
  };
}

/**
 * Deaths drawn quietly, so that many at once do not hide the blow that killed them: frozen monsters fall as others do, without
 * bursting into ice shards, and the bone, dust and motes thrown up by a death are `keep` of what they were.
 */
export function quietDeaths(
  game: { scene: { getScene(key: string): unknown } },
  keep = 0.25,
): void {
  type Events = (events: World['events'], w: World) => void;
  type Burst = { explode(n: number, x: number, y: number): unknown };
  const style = (
    game.scene.getScene('map') as { style: { onEvents: Events; em: Record<string, Burst> } | null }
  ).style;
  if (!style) throw new Error('no map style');
  const draw = style.onEvents.bind(style);
  style.onEvents = (events, ww) =>
    draw(
      events.filter((e) => e.t !== 'shatter'),
      ww,
    );
  for (const k of ['bone', 'dust', 'mote']) {
    const em = style.em[k];
    const burst = em.explode.bind(em);
    em.explode = (n, x, y) => burst(Math.max(1, Math.round(n * keep)), x, y);
  }
}

/** The camera keeps the character `at` of the way down the screen (a half when it is centred), easing as the game's does. */
export function lowCamera(game: { scene: { getScene(key: string): unknown } }, at: number): void {
  type Cam = { width: number; height: number; scrollX: number; scrollY: number };
  const style = (
    game.scene.getScene('map') as {
      style: {
        scene: { cameras: { main: Cam } };
        shake: number;
        playerPos(w: World): { x: number; y: number };
        project(x: number, y: number): { x: number; y: number };
        followCamera(w: World, dt: number): void;
      } | null;
    }
  ).style;
  if (!style) throw new Error('no map style');
  const st = style;
  st.followCamera = (w, dt) => {
    const cam = st.scene.cameras.main;
    const pp = st.playerPos(w);
    const p = st.project(pp.x, pp.y);
    const k = Math.min(1, dt * 6);
    cam.scrollX += (p.x - cam.width / 2 - cam.scrollX) * k;
    cam.scrollY += (p.y - cam.height * at - cam.scrollY) * k;
    if (st.shake > 0.05) {
      cam.scrollX += (Math.random() - 0.5) * st.shake;
      cam.scrollY += (Math.random() - 0.5) * st.shake;
      st.shake *= Math.pow(0.001, dt);
    } else st.shake = 0;
  };
}

/**
 * From now on the character uses only its skill `id`, whatever part the build gives it; the release takes that skill away and
 * gives back all the others.
 */
export function onlySkill(w: World, id: string): () => void {
  type Entry = World['sides'][number]['char']['mains'][number];
  const ch = w.sides[0].char;
  const { mains, rotation } = ch;
  const e = [...mains, ...rotation].find((x) => x.choice.skill.id === id);
  if (!e) throw new Error(`the character has no skill ${id}`);
  // (Worked out by getters in the game: the staging puts its own lists over them.)
  const set = (m: readonly Entry[], r: readonly Entry[]) => {
    Object.defineProperty(ch, 'mains', { value: m, configurable: true });
    Object.defineProperty(ch, 'rotation', { value: r, configurable: true });
  };
  set([e], []);
  return () =>
    set(
      mains.filter((x) => x !== e),
      rotation.filter((x) => x !== e),
    );
}

/**
 * More weight to the blow of the skill `skill` than the game gives it (for a shot about that blow): when its area goes off, a
 * cold shockwave rings out to the edge of the area trailing ice, the screen shakes hard and lights up, and the fight all but
 * stops for three frames, then runs at `slow` speed for `frames` more (the effects play on at full speed).
 */
export function juice(
  game: { scene: { getScene(key: string): unknown } },
  c: Controller,
  skill: string,
  slow = 0.35,
  frames = 14,
): void {
  type Burst = { explode(n: number, x: number, y: number): unknown };
  type Pen = {
    clear(): Pen;
    lineStyle(w: number, color: number, alpha: number): Pen;
    strokeEllipse(x: number, y: number, w: number, h: number): Pen;
    fillStyle(color: number, alpha: number): Pen;
    fillEllipse(x: number, y: number, w: number, h: number): Pen;
    setDepth(d: number): Pen;
    setBlendMode(m: number): Pen;
  };
  const style = (
    game.scene.getScene('map') as {
      style: {
        scene: { add: { graphics(): Pen } };
        shake: number;
        em: Record<string, Burst>;
        project(x: number, y: number): { x: number; y: number };
        flash(x: number, y: number, color: number, scale?: number, intensity?: number): void;
      } | null;
    }
  ).style;
  if (!style) throw new Error('no map style');
  const st = style;
  // Over everything on the ground, added to what is under it (1: Phaser's ADD).
  const pen = st.scene.add.graphics().setDepth(99999).setBlendMode(1);
  const WAVE = 10;
  let left = -1;
  let wave: { x: number; y: number; r: number; t: number } | null = null;
  c.bus.on('ticked', ({ events }) => {
    if (left > 0) {
      left--;
      c.speed = left === 0 ? 1 : left < frames ? slow : 0.05;
    }
    pen.clear();
    if (wave) {
      const k = 1 - Math.pow(1 - wave.t / WAVE, 2);
      const mid = st.project(wave.x, wave.y);
      // A circle on the ground is an ellipse twice as wide as it is high on screen.
      const half = (r: number) =>
        Math.abs(st.project(wave!.x + r * Math.SQRT1_2, wave!.y - r * Math.SQRT1_2).x - mid.x);
      const a = 1 - wave.t / WAVE;
      for (const [lag, width, alpha] of [
        [0, 7, 1],
        [0.18, 3, 0.6],
      ] as const) {
        const rw = half(wave.r * Math.max(0.05, k - lag));
        pen
          .lineStyle(width * (0.4 + a), 0xbfe8ff, alpha * a)
          .strokeEllipse(mid.x, mid.y, rw * 2, rw);
      }
      const rw = half(wave.r * k);
      pen.fillStyle(0x6fb8ff, 0.22 * a).fillEllipse(mid.x, mid.y, rw * 2, rw);
      for (let i = 0; i < 18; i++) {
        const ang = (i / 18) * Math.PI * 2 + wave.t;
        const q = st.project(
          wave.x + Math.cos(ang) * wave.r * k,
          wave.y + Math.sin(ang) * wave.r * k,
        );
        st.em.ice.explode(2, q.x, q.y - 4);
      }
      if (++wave.t > WAVE) wave = null;
    }
    const e = events.find(
      (x): x is Extract<World['events'][number], { t: 'explode' }> =>
        x.t === 'explode' && x.skill === skill && !x.pulse,
    );
    if (!e) return;
    const mid = st.project(e.x, e.y);
    st.shake = Math.max(st.shake, 18);
    st.flash(mid.x, mid.y, 0x9ad8ff, 3, 0.6);
    st.em.ice.explode(60, mid.x, mid.y - 8);
    wave = { x: e.x, y: e.y, r: e.r, t: 0 };
    c.speed = 0.05;
    left = frames + 3;
  });
}

/** Every monster within `r` tiles of the character is left on its last point of life: the next blow that reaches it kills it. */
export function wipe(w: World, r: number): void {
  for (const e of packOf(w, r)) {
    e.life = Math.min(e.life, 1);
    e.es = 0;
  }
}

/**
 * A clean picture for an opening shot: no words or numbers over the fight, no marks over the monsters (bars, pips), no
 * warnings of their blows on the ground, and no loot.
 */
export function clean(game: { scene: { getScene(key: string): unknown } }, c: Controller): void {
  const style = (
    game.scene.getScene('map') as {
      style: {
        floater: unknown;
        drawTelegraph: unknown;
        marks: { destroy(): void } | null;
      } | null;
    }
  ).style;
  if (!style) throw new Error('no map style');
  style.floater = () => {};
  style.drawTelegraph = () => {};
  style.marks?.destroy();
  style.marks = null;
  c.bus.on('ticked', () => {
    if (c.world) c.world.drops.length = 0;
  });
}

/**
 * A duel of `a` against `b`, named, rated as the trailer has it (712 to 748 for the viewer when it ends). `rules` change how hard the
 * two hit and how much life they have, so the fight is short enough to film.
 */
export function duel(
  c: Controller,
  a: Build,
  b: Build,
  seed: number,
  names: [string, string],
  rating: { before: number; after: number },
  rules: { damageScale?: number; lifeCurve?: boolean } = {},
): boolean {
  c.screen = 'title';
  c.world = null;
  // (The film's rules are its own: no reprieves, and the one life with all of the modifiers.)
  const ok = c.startDuel(a, b, seed, { names, reprieves: 0, stages: null, ...rules }, 'title');
  if (!ok || !c.duel) return false;
  c.duel.rival = { rivalId: '7', myId: '3', rated: true, home: 'summary' };
  c.onDuelEnd = (_d, out) => {
    if (out.rival) {
      out.rival.report = 'rated';
      out.rival.rating = rating;
    }
    c.bus.emit('state', null);
  };
  return true;
}

/**
 * A boss of docs/BOSSES.md against `run`'s character, everything else cleared, the boss `dist` tiles off and fighting (as
 * `__dev.fight` stages it, for a run of our own). The character is deathless until the shot lets it die.
 */
export function bossFight(
  c: Controller,
  run: RunState,
  id: BossId,
  s: MapStage & { dist?: number } = {},
): World {
  const w = playMap(c, run, s);
  warm(c, 5);
  for (const a of w.actors) if (!a.isPlayer) a.alive = false;
  const p = w.sides[0].player;
  const ang = Math.atan2(w.plan.lab.exit.y - p.y, w.plan.lab.exit.x - p.x);
  const d = s.dist ?? 6;
  const spot = w.grid.collide(p.x + Math.cos(ang) * d, p.y + Math.sin(ang) * d, 0.9);
  const def = BOSSES[id];
  const room = w.plan.lab.rooms.findIndex(
    (r) =>
      spot.x >= r.rect.x &&
      spot.x < r.rect.x + r.rect.w &&
      spot.y >= r.rect.y &&
      spot.y < r.rect.y + r.rect.h,
  );
  const spec = {
    type: def.type,
    variant: 'none' as const,
    rarity: 'boss' as const,
    level: run.map,
    mods: [],
  };
  const m = spawnMonster(
    w,
    spec,
    spot.x,
    spot.y,
    Math.max(0, room),
    999,
    MONSTER_TYPES[def.type].name,
  );
  m.state = 'chase';
  return w;
}

/** Let the character die: no more god mode or free life, and its life down to `life`. */
export function mortal(w: World, life = 1): void {
  const side = w.sides[0];
  side.opts.godMode = false;
  side.opts.freeResources = false;
  side.player.life = Math.min(side.player.life, life);
  side.player.es = 0;
}

/** The boss on the map and its fight's state (its clocks: when its next move is due), if one is alive. */
export function boss(
  w: World,
): { m: World['actors'][number]; st: NonNullable<ReturnType<typeof bossState>> } | null {
  for (const m of w.actors) {
    const st = m.alive ? bossState(m) : undefined;
    if (st) return { m, st };
  }
  return null;
}

/** Keep the boss above `floor` of its life (a deathless character would kill it before the move a shot waits for). */
export function keepBoss(w: World, floor = 0.45): void {
  const b = boss(w);
  if (b) b.m.life = Math.max(b.m.life, b.m.def.maxLife * floor);
}

/**
 * Warm a Tollkeeper fight until it has tolled `n` times and the next toll is due in `lead` seconds or less, the boss kept
 * from falling meanwhile.
 */
export function untilTolls(c: Controller, n: number, lead = 0.8): void {
  const at = warmUntil(
    c,
    (w) => {
      keepBoss(w);
      const st = boss(w)?.st;
      return !!st && st.tolls >= n && st.tellT <= 0 && !st.due && st.clock <= lead;
    },
    6000,
  );
  if (at < 0) throw new Error(`the Tollkeeper did not toll ${n} times`);
}

/**
 * Let actor `id`'s figure flash white when hit at most once every `gap` seconds. A boss under a stream of hits is otherwise
 * white from end to end and its wind-up cannot be seen. Only the drawing changes: the hits land as ever.
 */
export function calmFlash(
  game: { scene: { getScene(key: string): unknown } },
  id: number,
  gap = 0.8,
): void {
  const style = (
    game.scene.getScene('map') as {
      style: { views: Map<number, { track: { hitT: number } }> } | null;
    }
  ).style;
  const tr = style?.views.get(id)?.track;
  if (!tr) throw new Error(`no figure for actor ${id}`);
  let t = tr.hitT;
  let since = 99;
  Object.defineProperty(tr, 'hitT', {
    get: () => t,
    set: (v: number) => {
      // A new hit sets it to 0; the frames add their time to it.
      if (v === 0) {
        if (since < gap) return;
        since = 0;
      } else since += v - t;
      t = v;
    },
  });
}

/**
 * Draw no damage numbers, misses or blocks from now on (the boss's own call-outs still show), for a shot about one move of
 * the boss's.
 */
export function quietNumbers(game: { scene: { getScene(key: string): unknown } }): void {
  type Floater = (x: number, y: number, text: string, color: number, big: boolean) => void;
  const style = (game.scene.getScene('map') as { style: { floater: Floater } | null }).style;
  if (!style) throw new Error('no map style');
  const draw = style.floater.bind(style);
  style.floater = (x, y, text, color, big) => {
    if (/^\d+$/.test(text) || ['miss', 'blocked', 'Immune'].includes(text)) return;
    draw(x, y, text, color, big);
  };
}

/** Whether a blast labelled `label` (a toll's ring) lands on the character within two frames: the moment to let it die. */
export function blastDue(w: World, label: string): boolean {
  const p = w.sides[0].player;
  return w.effects.some(
    (e) => e.label === label && !pending(e) && e.t < 0.07 && inBlast(e, p.x, p.y, p.r),
  );
}

/** The labelled ground effect (a boss's move, e.g. 'Sentence') now on the floor, if any. */
export function effect(w: World, label: string): World['effects'][number] | undefined {
  return w.effects.find((e) => e.label === label);
}

/** Keep a duel on screen when it ends, so the frames after the killing blow can be filmed (undone by `releaseDuelEnd`). */
export function holdDuelEnd(c: Controller): void {
  (c as unknown as { endDuel: () => void }).endDuel = () => {};
}

/** Let a held duel end: the next frame goes to the result screen. */
export function releaseDuelEnd(c: Controller): void {
  delete (c as unknown as { endDuel?: unknown }).endDuel;
}

/** Let a held map end (undo `holdEnd`): the next frame goes to the screen the map's end leads to. */
export function releaseEnd(c: Controller): void {
  delete (c as unknown as { endMap?: unknown }).endMap;
}

/**
 * Catch the renderer up with a sim warmed without drawing, before the first filmed frame: the effects age a little, the shake
 * left by the warm-up dies, and the camera is put on the character at once (it would otherwise swing across the map from where
 * the map began).
 */
export function settle(game: { scene: { getScene(key: string): unknown } }, c: Controller): void {
  const style = (
    game.scene.getScene('map') as {
      style: {
        update(w: World, dt: number): void;
        followCamera(w: World, dt: number): void;
        shake: number;
      } | null;
    }
  ).style;
  const w = c.world;
  if (!style || !w) return;
  for (let i = 0; i < 15; i++) style.update(w, 1 / 30);
  style.followCamera(w, 1);
  style.shake = 0;
}
