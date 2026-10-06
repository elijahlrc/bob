import Phaser from 'phaser';
import { Rng } from '../../../core/rng';
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
import type { StyleId } from '../../style/types';
import { buildProps, FRAMES, GTILE, makeTileset, rasterFigure } from './paint';

/** Integer pixel zoom: 2× on smaller windows (so spells stay in view), 3× on large ones. */
function pickZoom(width: number): number {
  return width >= 1500 ? 3 : 2;
}
const ELEMENT_TINT: Record<string, number> = {
  none: 0xffffff,
  fire: 0xffb878,
  cold: 0xa8d8ff,
  lightning: 0xd8b8ff,
};
const ELEMENT_LIGHT: Record<string, number> = {
  fire: 0xff7a2a,
  cold: 0x5aa8ff,
  lightning: 0xb070ff,
};
const DTYPE_COLOR = [0xeadfc8, 0xc89cff, 0x9ad8ff, 0xff9a40, 0x9ae05a];
const RARITY_RING: Record<string, number> = {
  magic: 0x5a7cff,
  rare: 0xffd040,
  miniboss: 0xff8a20,
  boss: 0xff3a20,
};
const DROP_TINT: Record<string, number> = {
  normal: 0xdddddd,
  magic: 0x6a8cff,
  rare: 0xffd84a,
  unique: 0xff9a2a,
  gem: 0x40e0c0,
  flask: 0xff6090,
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
  readonly id: StyleId = 'grim';
  private tileMap: Phaser.Tilemaps.Tilemap | null = null;
  private layer: Phaser.Tilemaps.TilemapLayer | null = null;
  private owned: Phaser.GameObjects.GameObject[] = [];
  private lightsOwned: Phaser.GameObjects.Light[] = [];
  private em!: Record<string, Emitter>;
  private gfx!: Phaser.GameObjects.Graphics;
  private bolts: Bolt[] = [];
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
  private slashed = new WeakSet<object>();
  private floaters: Phaser.GameObjects.Text[] = [];
  private punch = 0;
  private zoom = 3;
  private rng = new Rng(7);

  project(x: number, y: number): { x: number; y: number } {
    return { x: x * GTILE, y: y * GTILE };
  }

  // ---- Textures --------------------------------------------------------------------------------
  private addTex(key: string, cv: HTMLCanvasElement, nearest = true): void {
    if (this.scene.textures.exists(key)) return;
    const t = this.scene.textures.addCanvas(key, cv)!;
    if (nearest) t.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }

  private figKey(kind: FigureKind, accent: number, anim: AnimName, i: number): string {
    const acc = isHero(kind) ? accent : 0;
    const key = `gf_${kind}_${acc}_${anim}_${i}`;
    if (!this.scene.textures.exists(key))
      this.addTex(key, rasterFigure(kind, anim, i / FRAMES[anim], acc));
    return key;
  }

  private ensureProps(): void {
    const props = buildProps();
    for (const [k, cv] of Object.entries(props))
      this.addTex('g_' + k, cv, k !== 'glow' && k !== 'smoke' && k !== 'beam');
  }

  // ---- World -----------------------------------------------------------------------------------
  buildWorld(world: World): void {
    const s = this.scene;
    this.ensureProps();
    const lab = world.plan.lab;
    const theme = world.plan.theme;
    const key = `g_tiles_${theme.id}`;
    if (!s.textures.exists(key)) this.addTex(key, makeTileset(theme.floor, theme.wall));
    const rng = new Rng(world.plan.seed ^ 0x51ed);
    const isFloor = (x: number, y: number) =>
      x >= 0 && y >= 0 && x < lab.w && y < lab.h && lab.tiles[y * lab.w + x] === 1;
    const data: number[][] = [];
    for (let y = 0; y < lab.h; y++) {
      const row: number[] = [];
      for (let x = 0; x < lab.w; x++) {
        if (isFloor(x, y)) row.push(!isFloor(x, y - 1) ? 4 + rng.int(0, 1) : rng.int(0, 3));
        else row.push(isFloor(x, y + 1) ? 6 + rng.int(0, 2) : 9 + rng.int(0, 1));
      }
      data.push(row);
    }
    this.tileMap = s.make.tilemap({ data, tileWidth: GTILE, tileHeight: GTILE });
    const ts = this.tileMap.addTilesetImage(key, key, GTILE, GTILE)!;
    this.layer = this.tileMap.createLayer(0, ts, 0, 0) as Phaser.Tilemaps.TilemapLayer;
    this.layer.setDepth(0).setLighting(true);

    // Lighting: a dark cold ambient, warm pools around torches and the player.
    s.lights.enable();
    s.lights.setAmbientColor(0x625c7a);

    const cam = s.cameras.main;
    this.zoom = pickZoom(cam.width);
    cam.setZoom(this.zoom);
    cam.setBounds(-200, -200, lab.w * GTILE + 400, lab.h * GTILE + 400);
    cam.roundPixels = true;
    cam.setBackgroundColor(0x050408);
    this.setupFilters(cam);

    this.makeEmitters();
    this.gfx = s.add.graphics().setDepth(600);
    this.owned.push(this.gfx);
    this.placeProps(world, rng);

    this.playerLight = this.addLight(
      world.player.x * GTILE,
      world.player.y * GTILE,
      320,
      0xffb060,
      1.5,
    );
    const ex = lab.exit;
    const pa = s.add
      .image(ex.x * GTILE, ex.y * GTILE, 'g_portal')
      .setDepth(700)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(0x66ccff);
    const pb = s.add
      .image(ex.x * GTILE, ex.y * GTILE, 'g_portal')
      .setDepth(700)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(0xaa88ff)
      .setScale(0.7);
    this.owned.push(pa, pb);
    this.portal = {
      a: pa,
      b: pb,
      light: this.addLight(ex.x * GTILE, ex.y * GTILE, 140, 0x66aaff, 0),
    };
    this.scene.events.emit('gstyle-built');
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
    const l = this.scene.lights.addLight(x, y, r, color, intensity);
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
        const wx = tx * GTILE + GTILE / 2;
        const wy = ty * GTILE + 19;
        const img = s.add.image(wx, wy, 'g_torch').setDepth(2);
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
        fl.setDepth(3);
        this.owned.push(fl);
        const g = s.add
          .image(wx, wy - 3, 'g_glow')
          .setDepth(3)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setTint(0xff8a38)
          .setScale(0.55)
          .setAlpha(0.55);
        this.owned.push(g);
      }
      // A brazier in the corner of bigger rooms.
      if (room.kind === 'end' || (room.kind === 'main' && rng.chance(0.5))) {
        const bx = (r.x + 1.6) * GTILE;
        const by = (r.y + 1.7) * GTILE;
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
            rng.float(r.x + 1, r.x + r.w - 1) * GTILE,
            rng.float(r.y + 1, r.y + r.h - 1) * GTILE,
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
      .image(0, 0, this.figKey(kind, accent, 'idle', 0))
      .setOrigin(0.5, 0.84)
      .setLighting(true);
    const shadow = s.add.image(0, 0, 'g_shadow').setOrigin(0.5, 0.5);
    const variant = a.mon?.spec.variant ?? 'none';
    if (variant !== 'none') sprite.setTint(ELEMENT_TINT[variant]);
    let ring: Phaser.GameObjects.Image | null = null;
    const rc = a.isPlayer ? undefined : RARITY_RING[a.rarity];
    if (rc !== undefined) {
      ring = s.add
        .image(0, 0, 'g_groundring')
        .setTint(rc)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0.85);
      ring.setScale(a.rarity === 'boss' ? 2.6 : a.r * 2.4);
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
      data: { sprite, shadow, ring, light, gone: false, last: '', acc: 0, accent, variant },
    };
  }

  protected markTheme(): MarkTheme {
    return { unit: 2.6, outline: 0x08060a, squash: 0.5 };
  }

  protected updateView(v: View, a: Actor, dt: number): void {
    const d = v.data;
    if (d.gone) return;
    const t = v.track;
    const px = t.rx * GTILE;
    const py = t.ry * GTILE;
    const st = t.state(a);
    const n = FRAMES[st.anim];
    const idx = Math.min(n - 1, Math.floor(st.t * n));
    const key = this.figKey(v.kind, d.accent, st.anim, idx);
    if (key !== d.last) {
      d.sprite.setTexture(key);
      d.last = key;
    }
    // Recoil when hit.
    let ox = 0;
    let oy = 0;
    if (t.hitT < 0.12 && a.alive) {
      const k = (1 - t.hitT / 0.12) * (t.crit ? 5 : 2.5);
      ox = Math.cos(t.hitDir) * k;
      oy = Math.sin(t.hitDir) * k;
    }
    d.sprite.setPosition(Math.round(px + ox), Math.round(py + oy));
    d.sprite.setFlipX(t.face < 0);
    d.sprite.setDepth(1000 + py);
    // Tinting: white flash on hit, icy when chilled, element colour otherwise.
    if (t.hitT < 0.07 && a.alive) d.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    else {
      let tint = ELEMENT_TINT[d.variant] ?? 0xffffff;
      if (a.ail.freezeT > 0) tint = 0x7ec8ff;
      else if (a.ail.chill > 0) tint = 0xb8dcff;
      else if (a.ail.poisons.length) tint = 0xc4f0a0;
      d.sprite.setTint(tint).setTintMode(Phaser.TintModes.MULTIPLY);
    }
    d.shadow
      .setPosition(px, py + 1)
      .setDepth(500)
      .setAlpha(a.alive ? 0.85 : Math.max(0, 0.6 - t.deathT * 0.2))
      .setScale(Math.max(0.6, a.r * 2.1));
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
    const phys = p.dtype === 0;
    const img = s.add.image(0, 0, phys ? 'g_arrow' : 'g_orb').setDepth(80000);
    const glow = s.add
      .image(0, 0, 'g_glow')
      .setDepth(79999)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(phys ? 0.25 : 0.6)
      .setAlpha(phys ? 0.25 : 0.8);
    if (!phys) {
      img.setTint(DTYPE_COLOR[p.dtype]).setBlendMode(Phaser.BlendModes.ADD);
      glow.setTint(DTYPE_COLOR[p.dtype]);
    }
    const light = phys ? null : this.addLight(0, 0, 110, DTYPE_COLOR[p.dtype], 1.2);
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
    const x = p.x * GTILE;
    const y = p.y * GTILE;
    q.img.setPosition(x, y).setRotation(Math.atan2(p.vy, p.vx));
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
    const rarity = d.item.kind === 'item' ? d.item.rarity : d.item.kind;
    const tint = DROP_TINT[rarity] ?? 0xffffff;
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
    this.owned.push(img, glow);
    if (beam) this.owned.push(beam);
    const o = {
      img,
      glow,
      beam,
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
      ph: number;
      tint: number;
      light: Phaser.GameObjects.Light | null;
    };
    const x = d.x * GTILE;
    const y = d.y * GTILE;
    const bob = Math.sin(this.time * 3 + q.ph) * 1.5;
    q.img.setPosition(x, y - 4 + bob);
    q.glow.setPosition(x, y - 4);
    q.beam?.setPosition(x, y - 2).setAlpha(0.55 + Math.sin(this.time * 4 + q.ph) * 0.15);
    q.light?.setPosition(x, y - 6);
    if (Math.random() < 0.04) this.em.mote.emitParticleAt(x + (Math.random() - 0.5) * 8, y - 4, 1);
  }
  protected destroyDrop(o: unknown, picked: boolean): void {
    const q = o as {
      img: Phaser.GameObjects.Image;
      glow: Phaser.GameObjects.Image;
      beam: Phaser.GameObjects.Image | null;
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
    this.dropLight(q.light);
  }

  protected createChest(c: Chest) {
    const img = this.scene.add
      .image(c.x * GTILE, c.y * GTILE + 4, 'g_chest')
      .setOrigin(0.5, 0.85)
      .setLighting(true)
      .setDepth(1000 + c.y * GTILE);
    this.owned.push(img);
    return { img, opened: false };
  }
  protected updateChest(o: unknown, c: Chest): void {
    const q = o as { img: Phaser.GameObjects.Image; opened: boolean };
    if (c.opened && !q.opened) {
      q.opened = true;
      q.img.setTexture('g_chestOpen');
      this.flash(c.x * GTILE, c.y * GTILE, 0xffd070, 2, 0.5);
      this.em.spark.emitParticleAt(c.x * GTILE, c.y * GTILE - 4, 18);
      this.em.mote.emitParticleAt(c.x * GTILE, c.y * GTILE - 4, 14);
    }
  }

  protected updateGround(effects: GroundEffect[]): void {
    const g = this.gfx;
    g.clear();
    for (const e of effects) {
      const k = 1 - e.t / e.total;
      const x = e.x * GTILE;
      const y = e.y * GTILE;
      const r = e.radius * GTILE;
      g.fillStyle(0xa01010, 0.16 + 0.22 * k).fillCircle(x, y, r);
      g.lineStyle(1, 0xff4020, 0.9).strokeCircle(x, y, r);
      g.lineStyle(1, 0xffa040, 0.9).strokeCircle(x, y, r * k);
      // Rune ticks rotating around the rim.
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + this.time * 1.4;
        g.fillStyle(0xff7030, 0.9).fillRect(
          x + Math.cos(a) * (r - 3),
          y + Math.sin(a) * (r - 3),
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
      for (const [w, col, al] of [
        [5, 0x6a40ff, 0.18],
        [3, 0xb890ff, 0.4],
        [1, 0xffffff, 1],
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
    return a ? { x: a.x * GTILE, y: a.y * GTILE } : null;
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
    switch (e.t) {
      case 'hit': {
        const dst = this.byId.get(e.dst) ?? world.actors.find((a) => a.id === e.dst);
        if (!dst) break;
        const p = { x: dst.x * GTILE, y: dst.y * GTILE };
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
        // Melee swoosh once per attack.
        if (
          src?.action &&
          !this.slashed.has(src.action) &&
          src.action.profile.skill.behaviour.kind === 'melee'
        ) {
          this.slashed.add(src.action);
          this.slash(
            src,
            src.action.profile.skill.behaviour.arc !== undefined,
            src.action.profile.skill.id,
          );
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
        if (!a) break;
        const p = { x: a.x * GTILE, y: a.y * GTILE };
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
        const x = e.x * GTILE;
        const y = e.y * GTILE;
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
          this.bolts.push({ pts, t: 0.28, color: 0xb890ff });
          em.bolt.explode(8, b.x, b.y - 8);
          this.flash(b.x, b.y - 8, 0xb890ff, 1, 0.15);
        }
        break;
      }
      case 'use': {
        const a = this.byId.get(e.src);
        if (!a) break;
        const prof = a.action?.profile;
        if (prof && prof.skill.type === 'spell') {
          const tags = prof.skill.tags;
          const col = tags.includes('fire')
            ? 0xff9a40
            : tags.includes('cold')
              ? 0x9ad8ff
              : tags.includes('lightning')
                ? 0xc8a0ff
                : 0xffffff;
          const x = a.x * GTILE + Math.cos(a.facing) * 8;
          const y = a.y * GTILE - 10;
          em.pop.particleTint = col;
          em.pop.explode(1, x, y);
          em.spark.explode(5, x, y);
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

  private slash(src: Actor, arc: boolean, skill: string): void {
    const x = src.x * GTILE + Math.cos(src.facing) * (arc ? 6 : 10);
    const y = src.y * GTILE - 8 + Math.sin(src.facing) * 4;
    const img = this.scene.add
      .image(x, y, 'g_slash')
      .setOrigin(0.15, 0.5)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(94000);
    img.setRotation(Math.cos(src.facing) >= 0 ? 0 : Math.PI).setFlipY(Math.random() < 0.5);
    if (Math.cos(src.facing) < 0) img.setFlipY(!img.flipY);
    const heavy = skill === 'crushingBlow' || src.rarity === 'boss';
    img
      .setScale(arc ? 1.5 : heavy ? 1.2 : 0.9)
      .setTint(src.isPlayer ? 0xfff0d0 : 0xd8e8ff)
      .setAlpha(0.95);
    this.owned.push(img);
    this.scene.tweens.add({
      targets: img,
      alpha: 0,
      scaleX: img.scaleX * 1.25,
      duration: 170,
      ease: 'Cubic.easeOut',
      onComplete: () => img.destroy(),
    });
    if (heavy) {
      this.em.dust.explode(6, x + Math.cos(src.facing) * 8, src.y * GTILE + 2);
      this.shake = Math.max(this.shake, 2);
    }
  }

  // ---- Per-frame -------------------------------------------------------------------------------
  protected frame(world: World, dt: number): void {
    this.byId = new Map(world.actors.map((a) => [a.id, a]));
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
      const x = a.x * GTILE;
      const y = a.y * GTILE;
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
    this.torches = [];
    this.temps = [];
    this.bolts = [];
    this.layer?.destroy();
    this.tileMap?.destroy();
    this.layer = this.tileMap = null;
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
