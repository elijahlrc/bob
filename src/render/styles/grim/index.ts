import Phaser from 'phaser';
import { Rng } from '../../../core/rng';
import { factionOfSpec } from '../../../data/monsters';
import type {
  Actor,
  Chest,
  Drop,
  GroundEffect,
  Projectile,
  SimEvent,
  World,
} from '../../../sim/types';
import { StyleBase, AnimTrack, figureOf, heroColor, type ActorView } from '../../style/base';
import type { MarkTheme } from '../../style/marks';
import { isHero, type AnimName, type FigureKind } from '../../style/figure';
import { buildProps, FIG_PX, FRAMES, rasterFigure, type MonsterLook } from './paint';
import { DROP_COLOR, dropLabel, dropRarity } from '../../dropLabel';
import { CollapseFx } from './collapseFx';
import { SkillFx } from './skillFx';
import { isoFloors, isoWalls, ISO_H, ISO_W, WALL_LOW, WALL_TALL } from './isoPaint';

/** Pixel zoom: 2x on wide windows, 1.5x on small ones, 1x on a phone (smaller pixels, wider view). */
export function pickZoom(width: number): number {
  return width >= 1100 ? 2 : width >= 640 ? 1.5 : 1;
}
const ELEMENT_LIGHT: Record<string, number> = {
  fire: 0xff7a2a,
  cold: 0x5aa8ff,
  lightning: 0xb070ff,
};
/** What a monster looks like: its type (the kit), faction (the palette) and element (the accent); heroes have none. */
function lookOf(a: Actor): MonsterLook | undefined {
  if (!a.mon) return undefined;
  return {
    type: a.mon.spec.type,
    faction: factionOfSpec(a.mon.spec),
    variant: a.mon.spec.variant,
  };
}
/** How lasting ground zones are drawn, by kind. */
const ZONE_LOOK: Record<string, { fill: number; edge: number }> = {
  caustic: { fill: 0x4a8a1a, edge: 0xa0e04a },
  burning: { fill: 0xa04010, edge: 0xff9a40 },
  chilling: { fill: 0x2a5a8a, edge: 0x9ad8ff },
  shocking: { fill: 0x4a2a8a, edge: 0xc8a0ff },
};
const DTYPE_COLOR = [0xeadfc8, 0xc89cff, 0x9ad8ff, 0xff9a40, 0x9ae05a];
const RARITY_RING: Record<string, number> = {
  magic: 0x5a7cff,
  rare: 0xffd040,
  miniboss: 0xff8a20,
  boss: 0xff3a20,
};

type Emitter = Phaser.GameObjects.Particles.ParticleEmitter;
type View = ActorView & {
  data: {
    sprite: Phaser.GameObjects.Image;
    shadow: Phaser.GameObjects.Image;
    ring: Phaser.GameObjects.Image | null;
    light: Phaser.GameObjects.Light | null;
    gone: boolean;
    last: string;
    acc: number;
    accent: number;
    variant: string;
  };
};

type Bolt = { pts: { x: number; y: number }[]; t: number; color: number };
type TempLight = { light: Phaser.GameObjects.Light; t: number; total: number; base: number };
type Torch = { light: Phaser.GameObjects.Light; seed: number; base: number; x: number; y: number };

export class GrimStyle extends StyleBase {
  private owned: Phaser.GameObjects.GameObject[] = [];
  private lightsOwned: Phaser.GameObjects.Light[] = [];
  private em!: Record<string, Emitter>;
  private gfx!: Phaser.GameObjects.Graphics;
  private bolts: Bolt[] = [];
  private fx!: SkillFx;
  private lastSimT = 0;
  private temps: TempLight[] = [];
  private torches: Torch[] = [];
  private decals: Phaser.GameObjects.Image[] = [];
  private byId = new Map<number, Actor>();
  private playerLight: Phaser.GameObjects.Light | null = null;
  private portal: {
    a: Phaser.GameObjects.Image;
    b: Phaser.GameObjects.Image;
    light: Phaser.GameObjects.Light;
  } | null = null;
  private floaters: Phaser.GameObjects.Text[] = [];
  private labelFrame = -1;
  private placed: { x: number; y: number; w: number; h: number }[] = [];
  private punch = 0;
  private zoom = 3;
  private rng = new Rng(7);
  private collapse: CollapseFx | null = null;

  project(x: number, y: number): { x: number; y: number } {
    return { x: ((x - y) * ISO_W) / 2, y: ((x + y) * ISO_H) / 2 };
  }

  /** A world-space radius in tiles -> the horizontal semi-axis in pixels. */
  private rpx(r: number): number {
    return r * ISO_W * 0.7071;
  }

  /** Height / width of a ground circle on screen. */
  private squash(): number {
    return 0.5;
  }

  /** Projected position as a spreadable [x, y] pair. */
  private xy(x: number, y: number): [number, number] {
    const p = this.project(x, y);
    return [p.x, p.y];
  }

  /** A world direction as a screen angle (radians). */
  private ang(vx: number, vy: number): number {
    const a = this.project(vx, vy);
    const o = this.project(0, 0);
    return Math.atan2(a.y - o.y, a.x - o.x);
  }

  // ---- Textures --------------------------------------------------------------------------------
  private addTex(key: string, cv: HTMLCanvasElement, nearest = true): void {
    if (this.scene.textures.exists(key)) return;
    const t = this.scene.textures.addCanvas(key, cv)!;
    if (nearest) t.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }

  private figKey(
    kind: FigureKind,
    accent: number,
    anim: AnimName,
    i: number,
    look?: MonsterLook,
  ): string {
    const acc = isHero(kind) ? accent : 0;
    const who = look ? `${look.type}_${look.variant}` : '';
    const key = `gf_${kind}_${who}_${acc}_${anim}_${i}`;
    if (!this.scene.textures.exists(key))
      this.addTex(key, rasterFigure(kind, anim, i / FRAMES[anim], acc, FIG_PX, look));
    return key;
  }

  private ensureProps(): void {
    const props = buildProps();
    for (const [k, cv] of Object.entries(props))
      this.addTex('g_' + k, cv, k !== 'glow' && k !== 'smoke' && k !== 'beam');
  }

  /** The game area changed size: the camera follows `zoom` every frame, so setting it is enough. */
  resize(width: number): void {
    this.zoom = pickZoom(width);
  }

  // ---- World -----------------------------------------------------------------------------------
  buildWorld(world: World): void {
    const s = this.scene;
    this.ensureProps();
    const lab = world.plan.lab;
    const rng = new Rng(world.plan.seed ^ 0x51ed);
    this.buildIsoFloor(world, rng);

    // Lighting: a dark cold ambient, warm pools around torches and the player.
    s.lights.enable();
    s.lights.setAmbientColor(0x625c7a);

    const cam = s.cameras.main;
    this.zoom = pickZoom(cam.width);
    cam.setZoom(this.zoom);
    cam.setBounds(
      -(lab.h * ISO_W) / 2 - 300,
      -300,
      ((lab.w + lab.h) * ISO_W) / 2 + 600,
      ((lab.w + lab.h) * ISO_H) / 2 + 600,
    );
    cam.roundPixels = true;
    cam.setBackgroundColor(0x050408);
    this.setupFilters(cam);

    this.makeEmitters();
    this.gfx = s.add.graphics().setDepth(600);
    this.owned.push(this.gfx);
    this.fx?.destroy();
    this.fx = new SkillFx(
      {
        project: (x, y) => this.project(x, y),
        rpx: (r) => this.rpx(r),
        squash: () => this.squash(),
        em: this.em,
        flash: (x, y, c, sc, i) => this.flash(x, y, c, sc, i),
        shake: (a) => {
          this.shake = Math.max(this.shake, a);
        },
        actorById: (id) =>
          this.byId.get(id) ??
          this.world.minions.find((m) => m.id === id) ??
          this.world.actors.find((a) => a.id === id) ??
          null,
      },
      s,
    );
    this.placeProps(world, rng);
    this.collapse?.destroy();
    this.collapse =
      world.plan.type === 'collapse'
        ? new CollapseFx(this.scene, (x, y) => this.project(x, y), world)
        : null;

    const pl0 = this.project(world.player.x, world.player.y);
    this.playerLight = this.addLight(pl0.x, pl0.y, 320, 0xffb060, 1.5);
    const ex = this.project(lab.exit.x, lab.exit.y);
    const pa = s.add
      .image(ex.x, ex.y, 'g_portal')
      .setDepth(700)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(0x66ccff);
    const pb = s.add
      .image(ex.x, ex.y, 'g_portal')
      .setDepth(700)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(0xaa88ff)
      .setScale(0.7);
    this.owned.push(pa, pb);
    this.portal = {
      a: pa,
      b: pb,
      light: this.addLight(ex.x, ex.y, 140, 0x66aaff, 0),
    };
    pa.setScale(1, 0.55);
    pb.setScale(0.7, 0.4);
    this.scene.events.emit('gstyle-built');
  }

  /** Diamond floor slabs baked into chunks, plus pixel-art wall cubes sorted with the actors by screen y. */
  private buildIsoFloor(world: World, rng: Rng): void {
    const s = this.scene;
    const lab = world.plan.lab;
    const tid = world.plan.theme.id;
    const th = world.plan.theme;
    const floors = isoFloors(th.floor);
    isoWalls(th.wall, WALL_TALL).forEach((c, i) => this.addTex(`gwt_${tid}_${i}`, c));
    isoWalls(th.wall, WALL_LOW).forEach((c, i) => this.addTex(`gwl_${tid}_${i}`, c));
    const isFloor = (x: number, y: number) =>
      x >= 0 && y >= 0 && x < lab.w && y < lab.h && lab.tiles[y * lab.w + x] === 1;
    const CH = 8;
    for (let cy = 0; cy < Math.ceil(lab.h / CH); cy++)
      for (let cx = 0; cx < Math.ceil(lab.w / CH); cx++) {
        const minX = (cx * CH - (cy * CH + CH)) * (ISO_W / 2);
        const minY = (cx * CH + cy * CH) * (ISO_H / 2);
        const cnv = document.createElement('canvas');
        cnv.width = CH * ISO_W + ISO_W;
        cnv.height = CH * ISO_H + ISO_H;
        const c = cnv.getContext('2d')!;
        let any = false;
        for (let y = cy * CH; y < Math.min(lab.h, cy * CH + CH); y++)
          for (let x = cx * CH; x < Math.min(lab.w, cx * CH + CH); x++) {
            if (!isFloor(x, y)) continue;
            any = true;
            const p = this.project(x, y);
            const v = (x * 7 + y * 13 + ((x + y) % 2) * 5) % 4;
            c.drawImage(floors[v], p.x - ISO_W / 2 - minX, p.y - minY);
            // Contact shadow in the corner under walls to the north-west.
            if (!isFloor(x - 1, y) || !isFloor(x, y - 1)) {
              c.save();
              c.globalAlpha = 0.35;
              c.fillStyle = '#000';
              c.beginPath();
              c.moveTo(p.x - minX, p.y - minY);
              c.lineTo(p.x + ISO_W / 4 - minX, p.y + ISO_H / 4 - minY);
              c.lineTo(p.x - minX, p.y + ISO_H / 2 - minY);
              c.lineTo(p.x - ISO_W / 4 - minX, p.y + ISO_H / 4 - minY);
              c.closePath();
              c.fill();
              c.restore();
            }
          }
        if (!any) continue;
        const key = `gc_${world.plan.seed}_${cx}_${cy}`;
        this.addTex(key, cnv);
        const img = s.add.image(minX, minY, key).setOrigin(0, 0).setDepth(0).setLighting(true);
        this.owned.push(img);
      }
    for (let y = 0; y < lab.h; y++)
      for (let x = 0; x < lab.w; x++) {
        if (isFloor(x, y)) continue;
        let near = false;
        for (let dy = -1; dy <= 1 && !near; dy++)
          for (let dx = -1; dx <= 1; dx++) if (isFloor(x + dx, y + dy)) near = true;
        if (!near) continue;
        const front = isFloor(x - 1, y) || isFloor(x, y - 1) || isFloor(x - 1, y - 1);
        const p = this.project(x + 1, y + 1);
        const img = s.add
          .image(p.x, p.y, `${front ? 'gwl' : 'gwt'}_${tid}_${rng.int(0, 2)}`)
          .setOrigin(0.5, 1)
          // Sorted by the middle of the footprint, like actors by their feet: a wall behind an actor must never draw over it
          // (the bottom corner, half a tile lower, did that to anyone in the half of a tile nearest a wall).
          .setDepth(1000 + p.y - ISO_H / 2)
          .setLighting(true);
        this.owned.push(img);
      }
  }

  private setupFilters(cam: Phaser.Cameras.Scene2D.Camera): void {
    try {
      cam.filters.external.addVignette(0.5, 0.5, 0.82, 0.55, 0x000000);
    } catch {
      /* filters are optional */
    }
  }

  private addLight(
    x: number,
    y: number,
    r: number,
    color: number,
    intensity: number,
  ): Phaser.GameObjects.Light {
    const l = this.scene.lights.addLight(x, y, r * 0.8, color, intensity);
    this.lightsOwned.push(l);
    return l;
  }

  private dropLight(l: Phaser.GameObjects.Light | null): void {
    if (!l) return;
    this.scene.lights.removeLight(l);
    const i = this.lightsOwned.indexOf(l);
    if (i >= 0) this.lightsOwned.splice(i, 1);
  }

  private makeEmitters(): void {
    const s = this.scene;
    const mk = (tex: string, cfg: Record<string, unknown>, depth = 90000): Emitter => {
      const e = s.add.particles(0, 0, tex, { emitting: false, ...cfg } as never) as Emitter;
      e.setDepth(depth);
      this.owned.push(e);
      return e;
    };
    const ADD = Phaser.BlendModes.ADD;
    this.em = {
      blood: mk('g_px', {
        speed: { min: 25, max: 120 },
        angle: { min: 0, max: 360 },
        lifespan: { min: 260, max: 560 },
        scale: { start: 1.3, end: 0.5 },
        alpha: { start: 1, end: 0.5 },
        color: [0xc01c20, 0x8a0e12, 0xd83030],
      }),
      spark: mk('g_spark', {
        speed: { min: 50, max: 190 },
        angle: { min: 0, max: 360 },
        lifespan: { min: 180, max: 420 },
        scale: { start: 0.9, end: 0 },
        gravityY: 130,
        blendMode: ADD,
        color: [0xfff4c0, 0xffb040, 0xff6020],
      }),
      flame: mk('g_flame', {
        speed: { min: 4, max: 18 },
        angle: { min: 258, max: 282 },
        lifespan: { min: 380, max: 700 },
        scale: { start: 0.8, end: 0.1 },
        alpha: { start: 0.95, end: 0 },
        gravityY: -26,
        blendMode: ADD,
        color: [0xfff0a0, 0xff9a28, 0xd04418, 0x501208],
      }),
      smoke: mk(
        'g_smoke',
        {
          speed: { min: 4, max: 14 },
          angle: { min: 250, max: 290 },
          lifespan: { min: 900, max: 1500 },
          scale: { start: 0.5, end: 1.9 },
          alpha: { start: 0.35, end: 0 },
          rotate: { min: 0, max: 360 },
        },
        89000,
      ),
      bone: mk('g_bonechip', {
        speed: { min: 40, max: 150 },
        angle: { min: 0, max: 360 },
        lifespan: { min: 600, max: 1000 },
        rotate: { min: 0, max: 360 },
        scale: { start: 1.1, end: 0.9 },
        alpha: { start: 1, end: 0 },
      }),
      dust: mk(
        'g_smoke',
        {
          speed: { min: 20, max: 60 },
          angle: { min: 0, max: 360 },
          lifespan: { min: 400, max: 800 },
          scale: { start: 0.4, end: 1.4 },
          alpha: { start: 0.4, end: 0 },
          tint: 0x8a7a68,
        },
        89000,
      ),
      pop: mk('g_glow', {
        lifespan: { min: 180, max: 300 },
        scale: { start: 0.2, end: 2.4 },
        alpha: { start: 0.95, end: 0 },
        blendMode: ADD,
      }),
      mote: mk('g_px', {
        speed: { min: 6, max: 20 },
        angle: { min: 240, max: 300 },
        lifespan: { min: 700, max: 1300 },
        scale: { start: 1.1, end: 0 },
        alpha: { start: 1, end: 0 },
        gravityY: -14,
        blendMode: ADD,
        color: [0xffe28a, 0xffffff],
      }),
      ice: mk('g_spark', {
        speed: { min: 30, max: 120 },
        angle: { min: 0, max: 360 },
        lifespan: { min: 300, max: 600 },
        scale: { start: 1, end: 0 },
        gravityY: 60,
        blendMode: ADD,
        color: [0xffffff, 0xaee0ff, 0x6ab8ff],
      }),
      bolt: mk('g_spark', {
        speed: { min: 40, max: 160 },
        angle: { min: 0, max: 360 },
        lifespan: { min: 120, max: 300 },
        scale: { start: 0.9, end: 0 },
        blendMode: ADD,
        color: [0xffffff, 0xd0a8ff, 0x9a70ff],
      }),
      poison: mk('g_px', {
        speed: { min: 4, max: 16 },
        angle: { min: 250, max: 290 },
        lifespan: { min: 600, max: 1000 },
        scale: { start: 1.4, end: 0.4 },
        alpha: { start: 0.9, end: 0 },
        gravityY: -12,
        color: [0x9ae05a, 0x5ab030],
      }),
      ember: mk(
        'g_px',
        {
          speed: { min: 4, max: 14 },
          angle: { min: 235, max: 305 },
          lifespan: { min: 2200, max: 3800 },
          scale: { start: 1.2, end: 0.3 },
          alpha: { start: 0.9, end: 0 },
          gravityY: -6,
          blendMode: ADD,
          color: [0xffd070, 0xff8a2a, 0xff5a1a],
          frequency: 70,
          quantity: 1,
          emitting: true,
        },
        91000,
      ),
    };
  }

  private placeProps(world: World, rng: Rng): void {
    const s = this.scene;
    const lab = world.plan.lab;
    const isFloor = (x: number, y: number) => lab.tiles[y * lab.w + x] === 1;
    const isFace = (x: number, y: number) =>
      x >= 0 &&
      y >= 0 &&
      x < lab.w &&
      y < lab.h &&
      !isFloor(x, y) &&
      y + 1 < lab.h &&
      isFloor(x, y + 1);
    for (const room of lab.rooms) {
      const r = room.rect;
      // Torches along the north wall.
      for (const tx of [r.x + 2, r.x + r.w - 3]) {
        const ty = r.y - 1;
        if (!isFace(tx, ty)) continue;
        const tb = this.project(tx + 1, ty + 1);
        const wx = tb.x + 5;
        const wy = tb.y - 15;
        const td = 1000 + tb.y + 1;
        const img = s.add.image(wx, wy, 'g_torch').setDepth(td);
        this.owned.push(img);
        const light = this.addLight(wx, wy + 8, 190, 0xff8a38, 1.5);
        this.torches.push({ light, seed: rng.next() * 100, base: 1.5, x: wx, y: wy });
        const fl = s.add.particles(wx, wy - 2, 'g_flame', {
          frequency: 85,
          quantity: 1,
          speed: { min: 2, max: 8 },
          angle: { min: 262, max: 278 },
          lifespan: { min: 300, max: 520 },
          scale: { start: 0.55, end: 0.05 },
          alpha: { start: 0.95, end: 0 },
          gravityY: -22,
          blendMode: Phaser.BlendModes.ADD,
          color: [0xfff0a0, 0xff9a28, 0xc03c10],
        } as never) as Emitter;
        fl.setDepth(td + 1);
        this.owned.push(fl);
        const g = s.add
          .image(wx, wy - 3, 'g_glow')
          .setDepth(td + 1)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setTint(0xff8a38)
          .setScale(0.55)
          .setAlpha(0.55);
        this.owned.push(g);
      }
      // A brazier in the corner of bigger rooms.
      if (room.kind === 'end' || (room.kind === 'main' && rng.chance(0.5))) {
        const bp = this.project(r.x + 1.6, r.y + 1.7);
        const bx = bp.x;
        const by = bp.y;
        const b = s.add
          .image(bx, by, 'g_brazier')
          .setDepth(1000 + by)
          .setLighting(true);
        this.owned.push(b);
        this.addLight(bx, by - 8, 190, 0xff7a30, 1.35);
        const fl = s.add.particles(bx, by - 12, 'g_flame', {
          frequency: 45,
          quantity: 1,
          speed: { min: 4, max: 14 },
          angle: { min: 255, max: 285 },
          lifespan: { min: 420, max: 800 },
          scale: { start: 0.9, end: 0.1 },
          alpha: { start: 0.95, end: 0 },
          gravityY: -32,
          blendMode: Phaser.BlendModes.ADD,
          color: [0xfff0a0, 0xff9a28, 0xc03c10, 0x401008],
        } as never) as Emitter;
        fl.setDepth(1000 + by + 1);
        this.owned.push(fl);
        const sm = s.add.particles(bx, by - 20, 'g_smoke', {
          frequency: 300,
          quantity: 1,
          speed: { min: 3, max: 10 },
          angle: { min: 260, max: 280 },
          lifespan: { min: 1200, max: 2000 },
          scale: { start: 0.5, end: 1.8 },
          alpha: { start: 0.25, end: 0 },
        } as never) as Emitter;
        sm.setDepth(89000);
        this.owned.push(sm);
      }
      // Old bones and bloodstains on the floor.
      if (room.kind !== 'start') {
        for (let i = 0; i < 3; i++)
          this.addDecal(
            ...this.xy(rng.float(r.x + 1, r.x + r.w - 1), rng.float(r.y + 1, r.y + r.h - 1)),
            rng.chance(0.4) ? 'g_bonepile' : 'g_blood' + rng.int(0, 2),
            rng.chance(0.5),
            0.9,
            false,
          );
      }
    }
  }

  private addDecal(
    x: number,
    y: number,
    tex: string,
    flip = false,
    alpha = 1,
    fade = true,
  ): Phaser.GameObjects.Image {
    const d = this.scene.add
      .image(x, y, tex)
      .setDepth(5 + this.decals.length * 0.0001)
      .setFlipX(flip)
      .setAlpha(alpha)
      .setLighting(true);
    this.decals.push(d);
    if (fade && this.decals.length > 260) {
      const old = this.decals.shift()!;
      old.destroy();
    }
    return d;
  }

  // ---- Actors ----------------------------------------------------------------------------------
  protected createView(a: Actor, kind: FigureKind): View {
    const s = this.scene;
    const accent = a.isPlayer ? heroColor(this.world) : 0;
    const sprite = s.add
      .image(0, 0, this.figKey(kind, accent, 'idle', 0, lookOf(a)))
      .setOrigin(0.5, 0.84)
      .setLighting(true);
    const shadow = s.add.image(0, 0, 'g_shadow').setOrigin(0.5, 0.5);
    const variant = a.mon?.spec.variant ?? 'none';
    let ring: Phaser.GameObjects.Image | null = null;
    const rc = a.isPlayer ? undefined : RARITY_RING[a.rarity];
    if (rc !== undefined) {
      ring = s.add
        .image(0, 0, 'g_groundring')
        .setTint(rc)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0.85);
      ring.setScale((a.rarity === 'boss' ? 2.6 : a.r * 2.4) * 0.8);
    }
    let light: Phaser.GameObjects.Light | null = null;
    if (a.rarity === 'boss') light = this.addLight(0, 0, 260, 0xff4a28, 1.3);
    else if (a.rarity === 'miniboss') light = this.addLight(0, 0, 170, 0xff8a30, 1.1);
    else if (ELEMENT_LIGHT[variant]) light = this.addLight(0, 0, 90, ELEMENT_LIGHT[variant], 1.0);
    else if (a.rarity === 'rare') light = this.addLight(0, 0, 100, 0xffd860, 0.8);
    this.owned.push(sprite, shadow);
    if (ring) this.owned.push(ring);
    return {
      id: a.id,
      track: new AnimTrack(),
      kind,
      data: {
        sprite,
        shadow,
        ring,
        light,
        gone: false,
        last: '',
        acc: 0,
        accent,
        variant,
        ghost: !!a.mon && factionOfSpec(a.mon.spec) === 'hollow',
      },
    };
  }

  protected markTheme(): MarkTheme {
    return { unit: 2.6, outline: 0x08060a, squash: 0.5 };
  }

  protected updateView(v: View, a: Actor, dt: number): void {
    const d = v.data;
    if (d.gone) return;
    const t = v.track;
    const { x: px, y: py } = this.project(t.rx, t.ry);
    const st = t.state(a);
    const n = FRAMES[st.anim];
    const idx = Math.min(n - 1, Math.floor(st.t * n));
    const key = this.figKey(v.kind, d.accent, st.anim, idx, lookOf(a));
    if (key !== d.last) {
      d.sprite.setTexture(key);
      d.last = key;
    }
    // Recoil when hit.
    let ox = 0;
    let oy = 0;
    if (t.hitT < 0.12 && a.alive) {
      const k = (1 - t.hitT / 0.12) * (t.crit ? 5 : 2.5);
      const ha = this.ang(Math.cos(t.hitDir), Math.sin(t.hitDir));
      ox = Math.cos(ha) * k;
      oy = Math.sin(ha) * k;
    }
    d.sprite.setPosition(Math.round(px + ox), Math.round(py + oy));
    d.sprite.setFlipX(t.face < 0);
    d.sprite.setDepth(1000 + py);
    // Tinting: white flash on hit, icy when chilled, element colour otherwise.
    if (t.hitT < 0.07 && a.alive) d.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    else {
      let tint = 0xffffff;
      if (a.ail.freezeT > 0) tint = 0x7ec8ff;
      else if (a.ail.chill > 0) tint = 0xb8dcff;
      else if (a.ail.poisons.length) tint = 0xc4f0a0;
      d.sprite.setTint(tint).setTintMode(Phaser.TintModes.MULTIPLY);
    }
    // The Unremembered fades out of sight while it phases.
    if (a.alive)
      d.sprite.setAlpha(
        a.phaseT > 0 ? 0.12 : a.hold && a.state === 'idle' ? 0.4 : d.ghost ? 0.8 : 1,
      );
    d.shadow
      .setPosition(px, py + 1)
      .setDepth(500)
      .setAlpha(a.alive ? 0.85 : Math.max(0, 0.6 - t.deathT * 0.2))
      .setScale(Math.max(0.6, a.r * 2.1) * 0.8);
    if (d.ring)
      d.ring
        .setPosition(px, py + 1)
        .setDepth(501)
        .setVisible(a.alive);
    if (d.light) {
      d.light.setPosition(px, py - 6);
      d.light.setIntensity(a.alive ? 0.9 + Math.sin(this.time * 9 + a.id) * 0.1 : 0);
    }
    // Corpse lifetime: stay down for a while, then fade out.
    if (!a.alive) {
      if (t.deathT > 7) d.sprite.setAlpha(Math.max(0, 1 - (t.deathT - 7) / 2));
      d.sprite.setDepth(900 + py);
      if (t.deathT > 9) {
        d.sprite.destroy();
        d.shadow.destroy();
        d.ring?.destroy();
        this.dropLight(d.light);
        d.gone = true;
      }
    }
    void dt;
  }

  protected destroyView(v: View): void {
    if (v.data.gone) return;
    v.data.sprite.destroy();
    v.data.shadow.destroy();
    v.data.ring?.destroy();
    this.dropLight(v.data.light);
  }

  // ---- Projectiles -----------------------------------------------------------------------------
  protected createProjectile(p: Projectile) {
    const s = this.scene;
    // Attacks fly as arrows, spells as orbs; the element tints either (a bigger orb bursts where it lands).
    const arrow = p.profile.skill.type === 'attack';
    const phys = p.dtype === 0;
    const col = DTYPE_COLOR[p.dtype];
    const img = s.add.image(0, 0, arrow ? 'g_arrow' : 'g_orb').setDepth(80000);
    const glow = s.add
      .image(0, 0, 'g_glow')
      .setDepth(79999)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(arrow ? (phys ? 0.25 : 0.35) : p.explodeRadius > 0 ? 0.9 : 0.6)
      .setAlpha(arrow ? (phys ? 0.25 : 0.55) : 0.8);
    if (arrow) {
      if (!phys) img.setTint(col);
    } else img.setTint(col).setBlendMode(Phaser.BlendModes.ADD);
    if (!phys || !arrow) glow.setTint(col);
    const light = phys && arrow ? null : this.addLight(0, 0, 110, col, 1.2);
    this.owned.push(img, glow);
    return { img, glow, light, acc: 0 };
  }
  protected updateProjectile(o: unknown, p: Projectile, dt: number): void {
    const q = o as {
      img: Phaser.GameObjects.Image;
      glow: Phaser.GameObjects.Image;
      light: Phaser.GameObjects.Light | null;
      acc: number;
    };
    const { x, y } = this.project(p.x, p.y);
    q.img.setPosition(x, y).setRotation(this.ang(p.vx, p.vy));
    q.glow.setPosition(x, y);
    q.light?.setPosition(x, y);
    q.acc += dt;
    if (p.dtype !== 0 && q.acc > 0.025) {
      q.acc = 0;
      const e =
        p.dtype === 3
          ? this.em.flame
          : p.dtype === 2
            ? this.em.ice
            : p.dtype === 1
              ? this.em.bolt
              : this.em.poison;
      e.emitParticleAt(
        x + (Math.random() - 0.5) * 3,
        y + (Math.random() - 0.5) * 3,
        p.dtype === 3 ? 2 : 1,
      );
      if (p.dtype === 3 && Math.random() < 0.3) this.em.smoke.emitParticleAt(x, y, 1);
    }
  }
  protected destroyProjectile(o: unknown): void {
    const q = o as {
      img: Phaser.GameObjects.Image;
      glow: Phaser.GameObjects.Image;
      light: Phaser.GameObjects.Light | null;
    };
    q.img.destroy();
    q.glow.destroy();
    this.dropLight(q.light);
  }

  // ---- Drops, chests, exit ---------------------------------------------------------------------
  protected createDrop(d: Drop) {
    const s = this.scene;
    const rarity = dropRarity(d.item);
    const tint = DROP_COLOR[rarity] ?? 0xffffff;
    const img = s.add
      .image(0, 0, d.item.kind === 'gem' ? 'g_gem' : 'g_bag')
      .setTint(tint)
      .setDepth(2000)
      .setLighting(true);
    const glow = s.add
      .image(0, 0, 'g_glow')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(tint)
      .setDepth(1999)
      .setScale(0.45)
      .setAlpha(0.6);
    const big = rarity === 'rare' || rarity === 'unique' || rarity === 'gem';
    const beam =
      rarity === 'normal'
        ? null
        : s.add
            .image(0, 0, 'g_beam')
            .setOrigin(0.5, 1)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setTint(tint)
            .setDepth(2001)
            .setAlpha(big ? 0.85 : 0.5)
            .setScale(1, big ? 0.9 : 0.5);
    const label = s.add
      .text(0, 0, dropLabel(d.item), {
        fontFamily: '"Palatino Linotype", Georgia, serif',
        fontSize: big ? '8px' : '7px',
        fontStyle: big ? 'bold' : 'normal',
        color: '#' + tint.toString(16).padStart(6, '0'),
        backgroundColor: 'rgba(10,6,8,0.72)',
        padding: { x: 2, y: 1 },
      })
      .setOrigin(0.5, 1)
      .setDepth(2002)
      .setResolution(this.zoom * 2);
    this.owned.push(img, glow, label);
    if (beam) this.owned.push(beam);
    const o = {
      img,
      glow,
      beam,
      label,
      tint,
      rarity,
      ph: Math.random() * 6,
      light: big ? this.addLight(0, 0, 70, tint, 0.9) : null,
    };
    const p = this.project(d.x, d.y);
    this.em.pop.setParticleTint?.(tint);
    this.flash(p.x, p.y - 4, tint, 0.8);
    return o;
  }
  protected updateDrop(o: unknown, d: Drop): void {
    const q = o as {
      img: Phaser.GameObjects.Image;
      glow: Phaser.GameObjects.Image;
      beam: Phaser.GameObjects.Image | null;
      label: Phaser.GameObjects.Text;
      ph: number;
      tint: number;
      light: Phaser.GameObjects.Light | null;
    };
    const { x, y } = this.project(d.x, d.y);
    const bob = Math.sin(this.time * 3 + q.ph) * 1.5;
    q.img.setPosition(x, y - 4 + bob);
    q.glow.setPosition(x, y - 4);
    q.beam?.setPosition(x, y - 2).setAlpha(0.55 + Math.sin(this.time * 4 + q.ph) * 0.15);
    q.light?.setPosition(x, y - 6);
    this.placeLabel(q.label, x, y - 12);
    if (Math.random() < 0.04) this.em.mote.emitParticleAt(x + (Math.random() - 0.5) * 8, y - 4, 1);
  }
  protected destroyDrop(o: unknown, picked: boolean): void {
    const q = o as {
      img: Phaser.GameObjects.Image;
      glow: Phaser.GameObjects.Image;
      beam: Phaser.GameObjects.Image | null;
      label: Phaser.GameObjects.Text;
      light: Phaser.GameObjects.Light | null;
      tint: number;
    };
    if (picked) {
      this.em.spark.emitParticleAt(q.img.x, q.img.y, 8);
      this.flash(q.img.x, q.img.y, q.tint, 1.2, 0.25);
    }
    q.img.destroy();
    q.glow.destroy();
    q.beam?.destroy();
    q.label.destroy();
    this.dropLight(q.light);
  }

  /** Put a ground label at (x, y), nudged upward until it clears the labels already placed this frame. */
  private placeLabel(label: Phaser.GameObjects.Text, x: number, y: number): void {
    if (this.labelFrame !== this.time) {
      this.labelFrame = this.time;
      this.placed = [];
    }
    const w = label.width;
    const h = label.height;
    let ly = y;
    for (let tries = 0; tries < 12; tries++) {
      const hit = this.placed.find(
        (p) => Math.abs(p.x - x) < (p.w + w) / 2 + 1 && Math.abs(p.y - ly) < (p.h + h) / 2,
      );
      if (!hit) break;
      ly = hit.y - (hit.h + h) / 2 - 1;
    }
    this.placed.push({ x, y: ly, w, h });
    label.setPosition(x, ly);
  }

  protected createChest(c: Chest) {
    const cp = this.project(c.x, c.y);
    const img = this.scene.add
      .image(cp.x, cp.y + 4, 'g_chest')
      .setOrigin(0.5, 0.85)
      .setLighting(true)
      .setDepth(1000 + cp.y);
    this.owned.push(img);
    return { img, opened: false };
  }
  protected updateChest(o: unknown, c: Chest): void {
    const q = o as { img: Phaser.GameObjects.Image; opened: boolean };
    if (c.opened && !q.opened) {
      q.opened = true;
      q.img.setTexture('g_chestOpen');
      const cp = this.project(c.x, c.y);
      this.flash(cp.x, cp.y, 0xffd070, 2, 0.5);
      this.em.spark.emitParticleAt(cp.x, cp.y - 4, 18);
      this.em.mote.emitParticleAt(cp.x, cp.y - 4, 14);
    }
  }

  protected updateGround(effects: GroundEffect[], dt: number, world: World): void {
    const g = this.gfx;
    g.clear();
    // Corpses: a dark smear that fades as it crumbles, with a green glint while a Shambler waits to rise.
    for (const c of world.corpses) {
      const { x, y } = this.project(c.x, c.y);
      const fade = Math.max(0, 1 - c.age / 10);
      g.fillStyle(0x1a1410, 0.5 * fade).fillEllipse(x, y + 1, 11, 5);
      if (c.spec.type === 'shambler' && c.age > 1)
        g.fillStyle(0x9fd07a, 0.35 * Math.sin(this.time * 6 + c.id) ** 2).fillEllipse(x, y, 7, 3);
    }
    // Zones, deployables, minions, auras and every skill effect (src/render/styles/grim/skillFx.ts).
    // Effects keep the sim's pace: frozen while paused, slow when the game is slowed.
    const adv = world.t - this.lastSimT;
    this.lastSimT = world.t;
    this.fx.frame(world, dt > 0 ? dt * Math.min(1, adv / dt) : 0, this.time, g);
    for (const e of effects) {
      const { x, y } = this.project(e.x, e.y);
      const r = this.rpx(e.radius);
      const sq = this.squash();
      // Lasting zones: a coloured pool with a slow swirl, fading in the last second.
      const zone = ZONE_LOOK[e.kind];
      if (zone) {
        const fade = Math.min(1, e.t);
        g.fillStyle(zone.fill, 0.2 * fade).fillEllipse(x, y, r * 2, r * 2 * sq);
        g.lineStyle(1, zone.edge, 0.7 * fade).strokeEllipse(x, y, r * 2, r * 2 * sq);
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2 + this.time * 0.8;
          const rr = r * (0.35 + 0.45 * ((i * 0.37 + this.time * 0.15) % 1));
          g.fillStyle(zone.edge, 0.5 * fade).fillCircle(
            x + Math.cos(a) * rr,
            y + Math.sin(a) * rr * sq,
            1.5,
          );
        }
        continue;
      }
      const k = 1 - e.t / e.total;
      g.fillStyle(0xa01010, 0.16 + 0.22 * k).fillEllipse(x, y, r * 2, r * 2 * sq);
      g.lineStyle(1, 0xff4020, 0.9).strokeEllipse(x, y, r * 2, r * 2 * sq);
      g.lineStyle(1, 0xffa040, 0.9).strokeEllipse(x, y, r * 2 * k, r * 2 * k * sq);
      // Rune ticks rotating around the rim.
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + this.time * 1.4;
        g.fillStyle(0xff7030, 0.9).fillRect(
          x + Math.cos(a) * (r - 3),
          y + Math.sin(a) * (r - 3) * sq,
          2,
          2,
        );
      }
    }
    // Lightning bolts.
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i];
      b.t -= 1 / 60;
      if (b.t <= 0) {
        this.bolts.splice(i, 1);
        continue;
      }
      const a = Math.min(1, b.t * 7);
      const soft = Phaser.Display.Color.IntegerToColor(b.color).lighten(35).color;
      for (const [w, col, al] of [
        [5, b.color, 0.2],
        [3, soft, 0.5],
        [1.2, 0xffffff, 1],
      ] as const) {
        g.lineStyle(w, col, al * a)
          .beginPath()
          .moveTo(b.pts[0].x, b.pts[0].y);
        for (const p of b.pts)
          g.lineTo(p.x + (Math.random() - 0.5) * 1.2, p.y + (Math.random() - 0.5) * 1.2);
        g.strokePath();
      }
    }
  }

  protected updateExit(world: World): void {
    if (!this.portal) return;
    const open = world.exitOpen;
    const { a, b, light } = this.portal;
    a.setRotation(this.time * 1.2).setAlpha(open ? 0.95 : 0.12);
    b.setRotation(-this.time * 1.9).setAlpha(open ? 0.8 : 0.08);
    light.setIntensity(open ? 1.2 + Math.sin(this.time * 4) * 0.2 : 0);
    if (open && Math.random() < 0.3) {
      const ang = Math.random() * Math.PI * 2;
      this.em.mote.emitParticleAt(a.x + Math.cos(ang) * 18, a.y + Math.sin(ang) * 18, 1);
    }
  }

  // ---- Effects ---------------------------------------------------------------------------------
  private flash(x: number, y: number, color: number, scale = 1, intensity = 0): void {
    this.em.pop.setParticleTint?.(color);
    const e = this.em.pop;
    e.particleTint = color;
    e.explode(1, x, y);
    void scale;
    if (intensity > 0) {
      const l = this.addLight(x, y, 130 * scale, color, 1.6);
      this.temps.push({ light: l, t: intensity, total: intensity, base: 1.6 });
    }
  }

  private pxOf(id: number): { x: number; y: number } | null {
    const a = this.byId.get(id);
    return a ? this.project(a.x, a.y) : null;
  }

  private floater(x: number, y: number, text: string, color: number, big: boolean): void {
    if (this.floaters.length > 36) this.floaters.shift()!.destroy();
    const t = this.scene.add
      .text(x + (Math.random() - 0.5) * 10, y - 12, text, {
        fontFamily: '"Palatino Linotype", Georgia, serif',
        fontSize: big ? '9px' : '6px',
        fontStyle: 'bold',
        color: '#' + color.toString(16).padStart(6, '0'),
        stroke: '#0a0608',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(95000)
      .setResolution(this.zoom * 2);
    this.floaters.push(t);
    this.scene.tweens.add({
      targets: t,
      y: t.y - (big ? 22 : 14),
      alpha: 0,
      scale: big ? 1.35 : 1,
      duration: big ? 900 : 650,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  protected handleEvent(e: SimEvent, world: World): void {
    const em = this.em;
    this.fx.onEvent(e, world);
    switch (e.t) {
      case 'hit': {
        const dst = this.byId.get(e.dst) ?? world.actors.find((a) => a.id === e.dst);
        if (!dst) break;
        const p = this.project(dst.x, dst.y);
        const src = e.src
          ? (this.byId.get(e.src) ?? world.actors.find((a) => a.id === e.src))
          : undefined;
        const amt = Math.round(e.amount);
        if (dst.isPlayer) {
          em.blood.explode(6 + Math.min(10, Math.round(amt / 20)), p.x, p.y - 8);
          this.shake = Math.max(this.shake, 1.2);
          this.addDecal(
            p.x + (Math.random() - 0.5) * 8,
            p.y + 2,
            'g_blood' + this.rng.int(0, 2),
            Math.random() < 0.5,
            0.8,
          );
        } else {
          em.bone.explode(e.crit ? 7 : 3, p.x, p.y - 8);
          em.dust.explode(2, p.x, p.y - 4);
          if (e.dtype === 3) em.flame.explode(6, p.x, p.y - 6);
          else if (e.dtype === 2) em.ice.explode(8, p.x, p.y - 6);
          else if (e.dtype === 1) em.bolt.explode(8, p.x, p.y - 6);
          else if (e.dtype === 4) em.poison.explode(8, p.x, p.y - 6);
          else em.spark.explode(e.crit ? 7 : 3, p.x, p.y - 6);
          if (Math.random() < 0.18)
            this.addDecal(
              p.x + (Math.random() - 0.5) * 10,
              p.y + 3,
              'g_blood' + this.rng.int(0, 2),
              Math.random() < 0.5,
              0.55,
            );
        }
        if (e.crit) {
          this.shake = Math.max(this.shake, 3);
          this.punch = 0.05;
          em.pop.particleTint = 0xffffff;
          em.pop.explode(1, p.x, p.y - 8);
        }
        if (amt > 0 && (src?.isPlayer || dst.isPlayer))
          this.floater(
            p.x,
            p.y - 14,
            String(amt),
            dst.isPlayer ? 0xff5050 : DTYPE_COLOR[e.dtype],
            e.crit,
          );
        break;
      }
      case 'miss': {
        const p = this.pxOf(e.dst);
        if (p) this.floater(p.x, p.y - 14, 'miss', 0xa0a0a0, false);
        break;
      }
      case 'block': {
        const p = this.pxOf(e.dst);
        if (p) {
          em.spark.explode(10, p.x, p.y - 8);
          this.floater(p.x, p.y - 14, 'blocked', 0xb0c0d0, false);
        }
        break;
      }
      case 'death': {
        const a = this.byId.get(e.id) ?? world.actors.find((x) => x.id === e.id);
        if (!a) {
          // A minion falls: a puff of dust where it stood.
          const f = world.minions.find((x) => x.id === e.id);
          if (f) {
            const q = this.project(f.x, f.y);
            em.dust.explode(3, q.x, q.y - 2);
          }
          break;
        }
        const p = this.project(a.x, a.y);
        if (a.isPlayer) break;
        const big = a.rarity === 'boss' || a.rarity === 'miniboss' || a.rarity === 'rare';
        em.bone.explode(big ? 22 : 10, p.x, p.y - 8);
        em.dust.explode(big ? 6 : 3, p.x, p.y - 2);
        em.mote.explode(big ? 14 : 6, p.x, p.y - 8);
        this.addDecal(p.x, p.y + 3, 'g_bonepile', Math.random() < 0.5, 1);
        if (big) {
          this.flash(p.x, p.y - 8, 0xbfe8ff, 1.4, 0.35);
          this.shake = Math.max(this.shake, 4);
        }
        break;
      }
      case 'explode': {
        const { x, y } = this.project(e.x, e.y);
        if (e.dtype === 3) {
          this.flash(x, y, 0xff9a40, 2.2, 0.5);
          em.flame.explode(24, x, y);
          em.spark.explode(18, x, y);
          em.smoke.explode(6, x, y);
          this.addDecal(x, y + 2, 'g_scorch', false, 0.9);
        } else if (e.dtype === 2) {
          this.flash(x, y, 0x9ad8ff, 1.8, 0.4);
          em.ice.explode(22, x, y);
        } else if (e.dtype === 1) {
          this.flash(x, y, 0xc8a0ff, 1.8, 0.35);
          em.bolt.explode(22, x, y);
        } else {
          em.dust.explode(14, x, y);
          em.bone.explode(8, x, y);
          this.addDecal(x, y, 'g_crack', Math.random() < 0.5, 1);
          this.shake = Math.max(this.shake, 5);
        }
        break;
      }
      case 'beam': {
        // A straight line of light from the caster, coloured by the damage it deals.
        const from = this.project(e.x, e.y);
        const to = this.project(e.x2, e.y2);
        const color = [0xd8d0c0, 0xc8a0ff, 0x9ad8ff, 0xff9a40, 0x9be07a][e.dtype] ?? 0xffffff;
        const pts: { x: number; y: number }[] = [];
        const n = 8;
        for (let i = 0; i <= n; i++)
          pts.push({
            x:
              from.x + ((to.x - from.x) * i) / n + (i > 0 && i < n ? (Math.random() - 0.5) * 4 : 0),
            y:
              from.y -
              8 +
              ((to.y - from.y) * i) / n +
              (i > 0 && i < n ? (Math.random() - 0.5) * 4 : 0),
          });
        this.bolts.push({ pts, t: 0.2, color });
        this.flash(to.x, to.y - 8, color, 1, 0.12);
        break;
      }
      case 'chain': {
        const a = this.pxOf(e.from);
        const b = this.pxOf(e.to);
        if (a && b) {
          const pts: { x: number; y: number }[] = [{ x: a.x, y: a.y - 8 }];
          const n = 7;
          for (let i = 1; i < n; i++)
            pts.push({
              x: a.x + ((b.x - a.x) * i) / n + (Math.random() - 0.5) * 9,
              y: a.y - 8 + ((b.y - a.y) * i) / n + (Math.random() - 0.5) * 9,
            });
          pts.push({ x: b.x, y: b.y - 8 });
          const col = DTYPE_COLOR[e.dtype ?? 1] ?? 0xb890ff;
          this.bolts.push({ pts, t: 0.28, color: col });
          const spray =
            e.dtype === 3 ? em.flame : e.dtype === 2 ? em.ice : e.dtype === 4 ? em.poison : em.bolt;
          spray.explode(8, b.x, b.y - 8);
          this.flash(b.x, b.y - 8, col, 1, 0.15);
        }
        break;
      }
      case 'stun': {
        const p = this.pxOf(e.dst);
        if (p) em.spark.explode(8, p.x, p.y - 22);
        break;
      }
      case 'levelUp': {
        const p = this.project(world.player.x, world.player.y);
        em.mote.explode(30, p.x, p.y - 8);
        em.spark.explode(20, p.x, p.y - 8);
        this.flash(p.x, p.y - 10, 0xffe070, 2.2, 0.8);
        const beam = this.scene.add
          .image(p.x, p.y, 'g_beam')
          .setOrigin(0.5, 1)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setTint(0xffe070)
          .setDepth(96000)
          .setScale(2.2, 2.2);
        this.scene.tweens.add({
          targets: beam,
          alpha: 0,
          scaleX: 3.5,
          duration: 1100,
          onComplete: () => beam.destroy(),
        });
        this.floater(p.x, p.y - 30, `Level ${e.level}`, 0xffe070, true);
        break;
      }
      case 'flaskUsed': {
        const f = world.flasks[e.idx];
        const p = this.project(world.player.x, world.player.y);
        const col =
          f?.spec.kind === 'mana' ? 0x4a78ff : f?.spec.kind === 'utility' ? 0xffd070 : 0xd03030;
        this.flash(p.x, p.y - 8, col, 1.4, 0.3);
        em.mote.explode(10, p.x, p.y - 10);
        break;
      }
      case 'blink': {
        const p = this.project(e.x, e.y);
        this.flash(p.x, p.y - 6, e.end ? 0xb0e0ff : 0x6a8cff, 1.4, 0.3);
        em.smoke.explode(e.end ? 6 : 4, p.x, p.y);
        break;
      }
      case 'summon': {
        const p = this.pxOf(e.id);
        if (p) {
          this.flash(p.x, p.y - 6, 0xb070ff, 1.3, 0.3);
          em.smoke.explode(4, p.x, p.y);
        }
        break;
      }
      case 'exitOpen':
        if (this.portal) this.flash(this.portal.a.x, this.portal.a.y, 0x66ccff, 2.4, 0.8);
        break;
      case 'ailment': {
        const p = this.pxOf(e.dst);
        if (p && e.kind === 'freeze') em.ice.explode(14, p.x, p.y - 8);
        break;
      }
    }
  }

  // ---- Per-frame -------------------------------------------------------------------------------
  protected frame(world: World, dt: number): void {
    this.byId = new Map(world.actors.map((a) => [a.id, a]));
    this.collapse?.update(world, dt);
    const cam = this.scene.cameras.main;
    const pp = this.playerPos(world);
    const p = this.project(pp.x, pp.y);
    if (this.playerLight) {
      this.playerLight.setPosition(p.x, p.y - 8);
      this.playerLight.setIntensity(
        1.6 + Math.sin(this.time * 11) * 0.06 + Math.sin(this.time * 4.3) * 0.05,
      );
    }
    for (const t of this.torches)
      t.light.setIntensity(
        t.base *
          (0.82 +
            0.18 * Math.sin(this.time * 12 + t.seed) * Math.sin(this.time * 5.3 + t.seed * 2)),
      );
    for (let i = this.temps.length - 1; i >= 0; i--) {
      const t = this.temps[i];
      t.t -= dt;
      if (t.t <= 0) {
        this.dropLight(t.light);
        this.temps.splice(i, 1);
      } else t.light.setIntensity((t.base * t.t) / t.total);
    }
    // Ambient embers drift across the visible area.
    const ember = this.em.ember;
    ember.setPosition(cam.worldView.centerX, cam.worldView.centerY);
    ember.clearEmitZones?.();
    ember.addEmitZone({
      type: 'random',
      source: new Phaser.Geom.Rectangle(
        -cam.width / 2 / cam.zoom,
        -cam.height / 2 / cam.zoom,
        cam.width / cam.zoom,
        cam.height / cam.zoom,
      ),
    } as never);
    // Ailment effects on actors.
    for (const a of world.actors) {
      if (!a.alive) continue;
      const v = this.views.get(a.id) as View | undefined;
      if (!v || v.data.gone) continue;
      v.data.acc += dt;
      if (v.data.acc < 0.07) continue;
      v.data.acc = 0;
      const { x, y } = this.project(a.x, a.y);
      if (a.ail.ignites.length)
        this.em.flame.emitParticleAt(x + (Math.random() - 0.5) * 8, y - 6 - Math.random() * 10, 1);
      if (a.ail.shock > 0 && Math.random() < 0.6)
        this.em.bolt.emitParticleAt(x + (Math.random() - 0.5) * 12, y - 6 - Math.random() * 14, 1);
      if (a.ail.chill > 0 || a.ail.freezeT > 0)
        this.em.ice.emitParticleAt(x + (Math.random() - 0.5) * 10, y - 4 - Math.random() * 12, 1);
      if (a.ail.poisons.length)
        this.em.poison.emitParticleAt(x + (Math.random() - 0.5) * 8, y - 6, 1);
      if (a.ail.bleeds.length && Math.random() < 0.5) this.em.blood.emitParticleAt(x, y - 6, 1);
      if (a.stunT > 0) {
        const ang = this.time * 8;
        this.em.spark.emitParticleAt(x + Math.cos(ang) * 7, y - 24 + Math.sin(ang) * 2, 1);
      }
    }
    // Camera punch on crits.
    if (this.punch > 0.001) {
      this.punch *= Math.pow(0.0005, dt);
      cam.setZoom(this.zoom * (1 + this.punch));
    } else if (cam.zoom !== this.zoom) cam.setZoom(this.zoom);
  }

  protected destroyAll(): void {
    for (const o of this.owned) o.destroy();
    this.owned = [];
    for (const d of this.decals) d.destroy();
    this.decals = [];
    for (const f of this.floaters) f.destroy();
    this.floaters = [];
    for (const l of [...this.lightsOwned]) this.dropLight(l);
    this.fx?.destroy();
    this.collapse?.destroy();
    this.collapse = null;
    this.torches = [];
    this.temps = [];
    this.bolts = [];
    this.portal = null;
    this.playerLight = null;
    this.scene.lights.disable();
    const cam = this.scene.cameras.main;
    cam.setZoom(1);
    cam.roundPixels = false;
    try {
      cam.filters.external.clear();
    } catch {
      /* ignore */
    }
    void figureOf;
  }
}
