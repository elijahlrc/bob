import Phaser from 'phaser';
import { classDef } from '../../data/classes';
import { itemBase } from '../../data/bases';
import type {
  Actor,
  Chest,
  Drop,
  GroundEffect,
  Projectile,
  SimEvent,
  World,
} from '../../sim/types';
import { AnimTrack } from './anim';
import { MonsterMarks, type MarkTheme } from './marks';
import { heroFigure, monsterFigure, type FigureKind } from './figure';

export { AnimTrack };
import type { MapStyle } from './types';

export type ActorView = {
  id: number;
  track: AnimTrack;
  kind: FigureKind;
  /** Style-specific display objects. */
  data: Record<string, unknown>;
};

export function figureOf(w: World, a: Actor): FigureKind {
  if (a.isPlayer) {
    const mh = w.build.equipment.mainHand;
    return heroFigure(mh ? itemBase(mh.baseId).itemClass : undefined);
  }
  return monsterFigure(a.mon!.spec.type, a.mon!.spec.rarity);
}

export function heroColor(w: World): number {
  return classDef(w.build.classId).color;
}

/**
 * Shared scaffolding for a map style: owns the view maps, animation tracking and the per-frame
 * orchestration. Subclasses decide how everything looks.
 */
export abstract class StyleBase implements MapStyle {
  protected world!: World;
  protected views = new Map<number, ActorView>();
  protected projs = new Map<number, unknown>();
  protected drops = new Map<number, unknown>();
  protected chests = new Map<number, unknown>();
  protected time = 0;
  /** Shake amplitude in px, decays each frame. */
  protected shake = 0;

  protected scene: Phaser.Scene;
  protected marks: MonsterMarks | null = null;
  protected selectedId: number | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // ---- Projection (iso overrides) ----
  /** World tiles to screen pixels. */
  abstract project(x: number, y: number): { x: number; y: number };
  /** Depth for sorting actors in the display list. */
  depthOf(_x: number, y: number): number {
    return y;
  }

  // ---- Lifecycle ----
  abstract buildWorld(world: World): void;
  /** Look of the enemy readouts (pips, bars, auras) in this style. */
  protected abstract markTheme(): MarkTheme;
  /** Fraction of the sprite height (above the feet) at which an enemy's head sits. */
  protected headFrac = 0.62;
  protected abstract createView(a: Actor, kind: FigureKind): ActorView;
  protected abstract updateView(v: ActorView, a: Actor, dt: number): void;
  protected abstract destroyView(v: ActorView): void;
  protected abstract createProjectile(p: Projectile): unknown;
  protected abstract updateProjectile(obj: unknown, p: Projectile, dt: number): void;
  protected abstract destroyProjectile(obj: unknown, p: Projectile | null): void;
  protected abstract createDrop(d: Drop): unknown;
  protected abstract updateDrop(obj: unknown, d: Drop, dt: number): void;
  protected abstract destroyDrop(obj: unknown, picked: boolean): void;
  protected abstract createChest(c: Chest): unknown;
  protected abstract updateChest(obj: unknown, c: Chest, dt: number): void;
  protected abstract updateGround(effects: GroundEffect[], dt: number, world: World): void;
  protected abstract updateExit(world: World, dt: number): void;
  protected abstract handleEvent(e: SimEvent, world: World): void;
  protected abstract frame(world: World, dt: number): void;
  protected abstract destroyAll(): void;

  build(world: World): void {
    this.world = world;
    this.buildWorld(world);
    this.marks?.destroy();
    this.marks = new MonsterMarks(this.scene, this.markTheme());
    const cam = this.scene.cameras.main;
    const p = this.project(world.player.x, world.player.y);
    cam.centerOn(p.x, p.y);
  }

  onEvents(events: SimEvent[], world: World): void {
    for (const e of events) {
      if (e.t === 'hit') {
        const tr = this.views.get(e.dst)?.track;
        if (tr) {
          tr.hitT = 0;
          tr.crit = e.crit;
          const src = world.actors.find((a) => a.id === e.src);
          const dst = world.actors.find((a) => a.id === e.dst);
          if (src && dst) tr.hitDir = Math.atan2(dst.y - src.y, dst.x - src.x);
        }
      }
      this.handleEvent(e, world);
    }
  }

  update(world: World, dt: number): void {
    this.world = world;
    this.time += dt;
    for (const a of world.actors) {
      let v = this.views.get(a.id);
      if (!v) {
        // Actors that died before this style was built (e.g. after a live style switch) get no view.
        if (!a.alive) continue;
        v = this.createView(a, figureOf(world, a));
        this.views.set(a.id, v);
      }
      v.track.update(a, dt);
      this.updateView(v, a, dt);
    }
    // Remove views for actors no longer in the world (should not normally happen).
    // Projectiles.
    const seen = new Set<number>();
    for (const p of world.projectiles) {
      seen.add(p.id);
      let o = this.projs.get(p.id);
      if (!o) {
        o = this.createProjectile(p);
        this.projs.set(p.id, o);
      }
      this.updateProjectile(o, p, dt);
    }
    for (const [id, o] of this.projs)
      if (!seen.has(id)) {
        this.destroyProjectile(o, null);
        this.projs.delete(id);
      }
    const dropIds = new Set(world.drops.map((d) => d.id));
    for (const d of world.drops) {
      let o = this.drops.get(d.id);
      if (!o) {
        o = this.createDrop(d);
        this.drops.set(d.id, o);
      }
      this.updateDrop(o, d, dt);
    }
    for (const [id, o] of this.drops)
      if (!dropIds.has(id)) {
        this.destroyDrop(o, true);
        this.drops.delete(id);
      }
    for (const c of world.chests) {
      let o = this.chests.get(c.id);
      if (!o) {
        o = this.createChest(c);
        this.chests.set(c.id, o);
      }
      this.updateChest(o, c, dt);
    }
    this.updateGround(world.effects, dt, world);
    this.updateExit(world, dt);
    this.frame(world, dt);
    this.followCamera(world, dt);
    this.marks?.draw(world, this.selectedId, this.time, (a) => this.markPos(a));
  }

  /** Screen-space anchor for an actor's readouts: feet position, head height, and body radius in px. */
  protected markPos(a: Actor): { x: number; y: number; headUp: number; r: number } | null {
    const v = this.views.get(a.id);
    if (!v) return null;
    const p = this.project(v.track.rx, v.track.ry);
    const sprite = v.data.sprite as Phaser.GameObjects.Image | undefined;
    const h = sprite?.displayHeight ?? 40;
    return { x: p.x, y: p.y, headUp: h * this.headFrac, r: this.pickRadius(a) };
  }

  /** Body radius in px, used for the ground aura and picking. */
  protected pickRadius(a: Actor): number {
    const p0 = this.project(0, 0);
    const p1 = this.project(a.r * 1.4, 0);
    return Math.max(8, Math.hypot(p1.x - p0.x, p1.y - p0.y));
  }

  setSelected(id: number | null): void {
    this.selectedId = id;
  }

  pick(wx: number, wy: number): number | null {
    let best: number | null = null;
    let bestD = Infinity;
    for (const a of this.world.actors) {
      if (a.isPlayer || !a.alive) continue;
      const m = this.markPos(a);
      if (!m) continue;
      // Test against the whole body: from the feet up to the head.
      const cy = m.y - m.headUp * 0.5;
      const rx = Math.max(m.r, m.headUp * 0.45);
      const ry = Math.max(m.headUp * 0.6, m.r);
      const dx = (wx - m.x) / rx;
      const dy = (wy - cy) / ry;
      const d = dx * dx + dy * dy;
      if (d <= 1 && d < bestD) {
        bestD = d;
        best = a.id;
      }
    }
    return best;
  }

  /** Camera follows the player with a little smoothing and the shake applied. */
  /** The player's smoothed render position in tiles (falls back to the sim position). */
  protected playerPos(world: World): { x: number; y: number } {
    const t = this.views.get(world.player.id)?.track;
    return t && !Number.isNaN(t.rx) ? { x: t.rx, y: t.ry } : world.player;
  }

  protected followCamera(world: World, dt: number): void {
    const cam = this.scene.cameras.main;
    const pp = this.playerPos(world);
    const p = this.project(pp.x, pp.y);
    const k = Math.min(1, dt * 6);
    const tx = p.x - cam.width / 2;
    const ty = p.y - cam.height / 2;
    cam.scrollX += (tx - cam.scrollX) * k;
    cam.scrollY += (ty - cam.scrollY) * k;
    if (this.shake > 0.05) {
      cam.scrollX += (Math.random() - 0.5) * this.shake;
      cam.scrollY += (Math.random() - 0.5) * this.shake;
      this.shake *= Math.pow(0.001, dt);
    } else this.shake = 0;
  }

  destroy(): void {
    for (const v of this.views.values()) this.destroyView(v);
    this.views.clear();
    for (const o of this.projs.values()) this.destroyProjectile(o, null);
    this.projs.clear();
    for (const o of this.drops.values()) this.destroyDrop(o, false);
    this.drops.clear();
    this.chests.clear();
    this.marks?.destroy();
    this.marks = null;
    this.destroyAll();
  }
}
