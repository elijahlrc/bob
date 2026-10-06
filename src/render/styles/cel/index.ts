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
import { AnimTrack, StyleBase, heroColor, type ActorView } from '../../style/base';
import type { AnimName, FigureKind } from '../../style/figure';
import type { StyleId } from '../../style/types';
import {
  buildSprites,
  CEL_THEMES,
  FRAMES,
  floorTiles,
  rasterFigure,
  TH,
  TW,
  wallBlocks,
  WALL_H,
  type CelTheme,
} from './paint';

const ZOOM = 1.3;
const ELEMENT_TINT: Record<string, number> = {
  none: 0xffffff,
  fire: 0xffc890,
  cold: 0xb8e4ff,
  lightning: 0xe0c8ff,
};
const DTYPE_COLOR = [0xfff1d2, 0xd8b0ff, 0x8ae4ff, 0xffa030, 0x9aee5a];
const RARITY_RIM: Record<string, number> = {
  magic: 0x4a7cff,
  rare: 0xffd030,
  miniboss: 0xff8a1a,
  boss: 0xff3a3a,
};
const DROP_TINT: Record<string, number> = {
  normal: 0xe8e8f4,
  magic: 0x6a9cff,
  rare: 0xffd84a,
  unique: 0xff9a2a,
  gem: 0x40f0c8,
  flask: 0xff70a0,
};
const CONFETTI = [0xff6a8a, 0xffd24a, 0x7fffe0, 0x8aa8ff, 0xc08aff];

type Emitter = Phaser.GameObjects.Particles.ParticleEmitter;
type Img = Phaser.GameObjects.Image;
type View = ActorView & {
  data: {
    sprite: Img;
    rim: Img | null;
    shadow: Img;
    ice: Img;
    gone: boolean;
    last: string;
    acc: number;
    accent: number;
    variant: string;
    lx: number;
    ly: number;
    face: number;
  };
};

type Bolt = { pts: { x: number; y: number }[]; t: number };

export class CelStyle extends StyleBase {
  readonly id: StyleId = 'cel';
  private owned: Phaser.GameObjects.GameObject[] = [];
  private em!: Record<string, Emitter>;
  private gfx!: Phaser.GameObjects.Graphics;
  private bolts: Bolt[] = [];
  private byId = new Map<number, Actor>();
  private floaters: Phaser.GameObjects.Text[] = [];
  private theme!: CelTheme;
  private slashed = new WeakSet<object>();
  private flames: { img: Img; glow: Img; seed: number }[] = [];
  private portal: { a: Img; b: Img } | null = null;
  private playerGlow: Img | null = null;
  private flash!: Img;
  private punch = 0;
  private flashA = 0;

  project(x: number, y: number): { x: number; y: number } {
    return { x: (x - y) * (TW / 2), y: (x + y) * (TH / 2) };
  }
  override depthOf(x: number, y: number): number {
    return (x + y) * 100;
  }

  // ---- Textures --------------------------------------------------------------------------------
  private addTex(key: string, cnv: HTMLCanvasElement): void {
    if (!this.scene.textures.exists(key)) this.scene.textures.addCanvas(key, cnv);
  }

  private figKey(kind: FigureKind, accent: number, anim: AnimName, i: number): string {
    const acc = kind.startsWith('hero_') ? accent : 0;
    const key = `cf_${kind}_${acc}_${anim}_${i}`;
    if (!this.scene.textures.exists(key))
      this.addTex(key, rasterFigure(kind, anim, i / FRAMES[anim], acc));
    return key;
  }

  // ---- World -----------------------------------------------------------------------------------
  buildWorld(world: World): void {
    const s = this.scene;
    for (const [k, cnv] of Object.entries(buildSprites())) this.addTex('c_' + k, cnv);
    const lab = world.plan.lab;
    const th = (this.theme = CEL_THEMES[world.plan.theme.id] ?? CEL_THEMES.ashenCrypt);
    const tid = world.plan.theme.id;
    floorTiles(th).forEach((c, i) => this.addTex(`cfl_${tid}_${i}`, c));
    wallBlocks(th, WALL_H).forEach((c, i) => this.addTex(`cwt_${tid}_${i}`, c));
    wallBlocks(th, 14).forEach((c, i) => this.addTex(`cwl_${tid}_${i}`, c));

    const rng = new Rng(world.plan.seed ^ 0xce1);
    const isFloor = (x: number, y: number) =>
      x >= 0 && y >= 0 && x < lab.w && y < lab.h && lab.tiles[y * lab.w + x] === 1;

    // Floors baked into 8×8-tile chunks (diamond slabs), skipping empty chunks.
    const CH = 8;
    const tileImgs = [0, 1, 2, 3].map(
      (i) => s.textures.get(`cfl_${tid}_${i}`).getSourceImage() as HTMLCanvasElement,
    );
    for (let cy = 0; cy < Math.ceil(lab.h / CH); cy++)
      for (let cx = 0; cx < Math.ceil(lab.w / CH); cx++) {
        let any = false;
        const minX = (cx * CH - (cy * CH + CH - 1)) * (TW / 2) - TW / 2;
        const minY = (cx * CH + cy * CH) * (TH / 2);
        const cnv = document.createElement('canvas');
        cnv.width = CH * 2 * (TW / 2) + TW;
        cnv.height = (CH * 2 - 2) * (TH / 2) + TH;
        const c = cnv.getContext('2d')!;
        for (let y = cy * CH; y < Math.min(lab.h, cy * CH + CH); y++)
          for (let x = cx * CH; x < Math.min(lab.w, cx * CH + CH); x++) {
            if (!isFloor(x, y)) continue;
            any = true;
            const p = this.project(x, y);
            const v = (x * 7 + y * 13 + ((x + y) % 2) * 5) % 4;
            c.drawImage(tileImgs[v], p.x - TW / 2 - minX, p.y - minY);
            // Contact shadow along walls to the north-west.
            if (!isFloor(x - 1, y) || !isFloor(x, y - 1)) {
              c.save();
              c.beginPath();
              c.moveTo(p.x - minX, p.y - minY);
              c.lineTo(p.x + TW / 2 - minX, p.y + TH / 2 - minY);
              c.lineTo(p.x - TW / 2 - minX, p.y + TH / 2 - minY);
              c.closePath();
              c.clip();
              const g = c.createLinearGradient(p.x - minX, p.y - minY, p.x - minX, p.y + 14 - minY);
              g.addColorStop(0, 'rgba(40,10,70,0.45)');
              g.addColorStop(1, 'rgba(40,10,70,0)');
              c.fillStyle = g;
              c.fillRect(p.x - TW / 2 - minX, p.y - minY, TW, 14);
              c.restore();
            }
          }
        if (!any) continue;
        const key = `cc_${world.plan.seed}_${cx}_${cy}`;
        this.addTex(key, cnv);
        const img = s.add.image(minX, minY, key).setOrigin(0, 0).setDepth(0);
        this.owned.push(img);
      }

    // Wall blocks around the rooms; walls on the near (south-east) side are cut low so they never hide the action.
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
          .image(p.x, p.y, `${front ? 'cwl' : 'cwt'}_${tid}_${rng.int(0, 2)}`)
          .setOrigin(0.5, 1)
          .setDepth((x + y + 1) * 100);
        this.owned.push(img);
      }

    this.placeProps(world, rng);

    const cam = s.cameras.main;
    cam.setZoom(ZOOM);
    cam.setBounds(-10000, -300, 20000, 10000);
    cam.roundPixels = false;
    cam.setBackgroundColor(th.bg);
    try {
      cam.filters.external.addVignette(0.5, 0.5, 0.95, 0.35, 0x120828);
    } catch {
      /* optional */
    }

    this.makeEmitters();
    this.gfx = s.add.graphics().setDepth(900000);
    this.flash = s.add
      .image(0, 0, 'c_glow')
      .setScrollFactor(0)
      .setDepth(2_000_000)
      .setAlpha(0)
      .setTint(0xffffff)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.flash.setDisplaySize(cam.width, cam.height).setPosition(cam.width / 2, cam.height / 2);
    this.owned.push(this.gfx, this.flash);

    const pl = s.add
      .image(0, 0, 'c_glow')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(th.glow)
      .setAlpha(0.28)
      .setDepth(1)
      .setScale(2.8, 1.4);
    this.playerGlow = pl;
    this.owned.push(pl);
    const ex = this.project(lab.exit.x, lab.exit.y);
    const pa = s.add
      .image(ex.x, ex.y, 'c_portal')
      .setTint(0x7fe8ff)
      .setDepth(this.depthOf(lab.exit.x, lab.exit.y))
      .setAlpha(0.2);
    const pb = s.add
      .image(ex.x, ex.y, 'c_portal')
      .setTint(0xc08aff)
      .setScale(0.65)
      .setDepth(this.depthOf(lab.exit.x, lab.exit.y) + 1)
      .setAlpha(0.2);
    this.owned.push(pa, pb);
    this.portal = { a: pa, b: pb };
  }

  private placeProps(world: World, rng: Rng): void {
    const s = this.scene;
    const lab = world.plan.lab;
    const th = this.theme;
    for (const room of lab.rooms) {
      const r = room.rect;
      // Torches at two corners.
      const spots: [number, number][] = [
        [r.x + 0.8, r.y + 0.9],
        [r.x + r.w - 0.8, r.y + 0.9],
      ];
      for (const [x, y] of spots.slice(0, room.kind === 'start' ? 1 : 2)) {
        const p = this.project(x, y);
        const img = s.add
          .image(p.x, p.y + 2, 'c_torch')
          .setOrigin(0.5, 0.95)
          .setDepth(this.depthOf(x, y));
        const glow = s.add
          .image(p.x, p.y + 4, 'c_glow')
          .setBlendMode(Phaser.BlendModes.ADD)
          .setTint(th.glow)
          .setAlpha(0.45)
          .setScale(2.4, 1.2)
          .setDepth(1);
        this.owned.push(img, glow);
        this.flames.push({ img, glow, seed: rng.next() * 6 });
      }
      // Scenery.
      if (room.kind !== 'start') {
        const n = rng.int(2, 4);
        for (let i = 0; i < n; i++) {
          const x = rng.float(r.x + 1, r.x + r.w - 1);
          const y = rng.chance(0.6)
            ? rng.float(r.y + 0.7, r.y + 1.6)
            : rng.float(r.y + 1, r.y + r.h - 1);
          const kind = rng.pick(['tomb', 'crate', 'mushroom', 'skullpile', 'tomb']);
          const p = this.project(x, y);
          const img = s.add
            .image(p.x, p.y, 'c_' + kind)
            .setOrigin(0.5, 0.92)
            .setDepth(this.depthOf(x, y));
          const sh = s.add.image(p.x, p.y, 'c_shadow').setScale(0.7).setDepth(1);
          this.owned.push(img, sh);
          if (kind === 'mushroom') {
            const g = s.add
              .image(p.x, p.y - 12, 'c_glow')
              .setBlendMode(Phaser.BlendModes.ADD)
              .setTint(0x7fffe0)
              .setAlpha(0.3)
              .setScale(1.1)
              .setDepth(2);
            this.owned.push(g);
          }
        }
      }
    }
  }

  private makeEmitters(): void {
    const s = this.scene;
    const mk = (tex: string, cfg: Record<string, unknown>): Emitter => {
      const e = s.add.particles(0, 0, 'c_' + tex, { emitting: false, ...cfg } as never) as Emitter;
      e.setDepth(800000);
      this.owned.push(e);
      return e;
    };
    this.em = {
      chip: mk('chip', {
        speed: { min: 120, max: 300 },
        angle: { min: 200, max: 340 },
        lifespan: { min: 450, max: 750 },
        gravityY: 650,
        rotate: { min: 0, max: 360 },
        scale: { start: 0.9, end: 0.2 },
        tint: [0xfff1d2, 0xe6cfc0, 0xc8a6d6],
      }),
      star: mk('star', {
        speed: { min: 80, max: 260 },
        angle: { min: 0, max: 360 },
        lifespan: { min: 320, max: 560 },
        rotate: { min: -180, max: 180 },
        scale: { start: 0.9, end: 0 },
        tint: [0xffd24a, 0xff9a3a, 0xffffff],
      }),
      puff: mk('puff', {
        speed: { min: 20, max: 70 },
        angle: { min: 0, max: 360 },
        lifespan: { min: 380, max: 620 },
        scale: { start: 0.35, end: 1.1 },
        alpha: { start: 1, end: 0 },
      }),
      dot: mk('dot', {
        speed: { min: 60, max: 180 },
        angle: { min: 0, max: 360 },
        lifespan: { min: 300, max: 520 },
        scale: { start: 0.9, end: 0 },
      }),
      flame: mk('flame', {
        speed: { min: 20, max: 60 },
        angle: { min: 245, max: 295 },
        lifespan: { min: 320, max: 520 },
        scale: { start: 0.55, end: 0 },
        tint: [0xffd23a, 0xff8a1a, 0xff4a2a],
      }),
      shard: mk('shard', {
        speed: { min: 80, max: 240 },
        angle: { min: 0, max: 360 },
        lifespan: { min: 360, max: 600 },
        rotate: { min: -180, max: 180 },
        scale: { start: 0.7, end: 0 },
        tint: [0xc8f4ff, 0x8ae4ff, 0xffffff],
      }),
      bolt: mk('bolt', {
        speed: { min: 60, max: 200 },
        angle: { min: 0, max: 360 },
        lifespan: { min: 200, max: 380 },
        rotate: { min: -90, max: 90 },
        scale: { start: 0.8, end: 0 },
        tint: [0xfff060, 0xd8b0ff, 0xffffff],
      }),
      bubble: mk('bubble', {
        speed: { min: 10, max: 30 },
        angle: { min: 250, max: 290 },
        lifespan: { min: 500, max: 800 },
        scale: { start: 0.5, end: 0.9 },
        alpha: { start: 1, end: 0 },
        tint: [0xa8f060, 0x78d040],
      }),
      conf: mk('conf', {
        speed: { min: 100, max: 360 },
        angle: { min: 215, max: 325 },
        lifespan: { min: 800, max: 1300 },
        gravityY: 500,
        rotate: { min: 0, max: 360 },
        scale: { start: 1, end: 0.6 },
        tint: CONFETTI,
      }),
      speed: mk('speed', {
        speed: { min: 200, max: 360 },
        lifespan: { min: 140, max: 220 },
        scale: { start: 1, end: 0.2 },
        alpha: { start: 1, end: 0 },
      }),
      drop: mk('drop', {
        speed: { min: 40, max: 140 },
        angle: { min: 200, max: 340 },
        lifespan: { min: 350, max: 550 },
        gravityY: 600,
        scale: { start: 0.8, end: 0.3 },
        tint: [0xff5a6a, 0xff3a4a],
      }),
    };
  }

  // ---- Actors ----------------------------------------------------------------------------------
  protected createView(a: Actor, kind: FigureKind): View {
    const s = this.scene;
    const accent = a.isPlayer ? heroColor(this.world) : 0;
    const key = this.figKey(kind, accent, 'idle', 0);
    const sprite = s.add.image(0, 0, key).setOrigin(0.5, 0.86);
    const variant = a.mon?.spec.variant ?? 'none';
    if (variant !== 'none') sprite.setTint(ELEMENT_TINT[variant]);
    const shadow = s.add.image(0, 0, 'c_shadow').setDepth(1);
    let rim: Img | null = null;
    const rc = a.isPlayer ? undefined : RARITY_RIM[a.rarity];
    if (rc !== undefined)
      rim = s.add
        .image(0, 0, key)
        .setOrigin(0.5, 0.86)
        .setTint(rc)
        .setTintMode(Phaser.TintModes.FILL);
    const ice = s.add.image(0, 0, 'c_ice').setOrigin(0.5, 0.95).setVisible(false);
    this.owned.push(sprite, shadow, ice);
    if (rim) this.owned.push(rim);
    return {
      id: a.id,
      track: new AnimTrack(),
      kind,
      data: {
        sprite,
        rim,
        shadow,
        ice,
        gone: false,
        last: '',
        acc: 0,
        accent,
        variant,
        lx: a.x,
        ly: a.y,
        face: 1,
      },
    };
  }

  protected updateView(v: View, a: Actor, dt: number): void {
    const d = v.data;
    if (d.gone) return;
    const t = v.track;
    const p = this.project(t.rx, t.ry);
    d.face = t.faceIso;
    d.lx = t.rx;
    d.ly = t.ry;
    const st = t.state(a);
    const n = FRAMES[st.anim];
    const idx = Math.min(n - 1, Math.floor(st.t * n));
    const key = this.figKey(v.kind, d.accent, st.anim, idx);
    if (key !== d.last) {
      d.sprite.setTexture(key);
      d.rim?.setTexture(key);
      d.last = key;
    }
    // Squash and stretch.
    let sx = 1;
    let sy = 1;
    if (st.anim === 'walk') sy = 1 + Math.sin(st.t * Math.PI * 4) * 0.045;
    else if (st.anim === 'idle') sy = 1 + Math.sin(st.t * Math.PI * 2) * 0.02;
    else if (st.anim === 'attack') {
      if (st.t < 0.4) {
        sy = 1 + 0.1 * (st.t / 0.4);
        sx = 1 - 0.07 * (st.t / 0.4);
      } else if (st.t < 0.62) {
        sx = 1.2;
        sy = 0.88;
      } else {
        const k = (st.t - 0.62) / 0.38;
        sx = 1.2 - 0.2 * k;
        sy = 0.88 + 0.12 * k;
      }
    }
    let ox = 0;
    let oy = 0;
    if (t.hitT < 0.16 && a.alive) {
      const k = 1 - t.hitT / 0.16;
      sx *= 1 + 0.28 * k;
      sy *= 1 - 0.22 * k;
      ox = Math.cos(t.hitDir) * 7 * k - Math.sin(t.hitDir) * 0;
      oy = Math.sin(t.hitDir) * 3 * k;
    }
    if (!a.alive) {
      const k = Math.max(0, (t.deathT - 0.55) / 0.25);
      sx *= 1 - k;
      sy *= 1 - k;
    }
    const depth = this.depthOf(t.rx, t.ry) + 10;
    d.sprite
      .setPosition(p.x + ox, p.y + oy)
      .setScale(d.face * sx, sy)
      .setDepth(depth);
    if (d.rim)
      d.rim
        .setPosition(p.x + ox, p.y + oy)
        .setScale(d.face * sx * 1.1, sy * 1.1)
        .setDepth(depth - 1)
        .setVisible(a.alive);
    if (t.hitT < 0.07 && a.alive) d.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    else {
      let tint = ELEMENT_TINT[d.variant] ?? 0xffffff;
      if (a.ail.chill > 0) tint = 0xb8e4ff;
      else if (a.ail.poisons.length) tint = 0xd0f4a8;
      d.sprite.setTint(tint).setTintMode(Phaser.TintModes.MULTIPLY);
    }
    d.shadow
      .setPosition(p.x, p.y)
      .setScale(Math.max(0.5, a.r * 1.7), Math.max(0.5, a.r * 1.7))
      .setAlpha(a.alive ? 1 : 0.4);
    d.ice
      .setVisible(a.ail.freezeT > 0 && a.alive)
      .setPosition(p.x, p.y + 2)
      .setDepth(depth + 1)
      .setScale(Math.max(0.8, a.r * 1.6));
    if (!a.alive && t.deathT > 0.8) {
      d.sprite.destroy();
      d.rim?.destroy();
      d.shadow.destroy();
      d.ice.destroy();
      d.gone = true;
    }
    void dt;
  }

  protected destroyView(v: View): void {
    if (v.data.gone) return;
    v.data.sprite.destroy();
    v.data.rim?.destroy();
    v.data.shadow.destroy();
    v.data.ice.destroy();
  }

  // ---- Projectiles, drops, chests --------------------------------------------------------------
  protected createProjectile(p: Projectile) {
    const s = this.scene;
    const phys = p.dtype === 0;
    const tex = phys ? 'c_arrow' : p.dtype === 3 ? 'c_orb' : p.dtype === 2 ? 'c_shard' : 'c_bolt';
    const img = s.add.image(0, 0, tex).setDepth(850000);
    const glow = s.add
      .image(0, 0, 'c_glow')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(849999)
      .setScale(phys ? 0.4 : 0.9)
      .setAlpha(phys ? 0.1 : 0.55);
    if (!phys) {
      img.setTint(DTYPE_COLOR[p.dtype]);
      glow.setTint(DTYPE_COLOR[p.dtype]);
    }
    if (p.dtype === 3) img.setScale(1.1);
    this.owned.push(img, glow);
    return { img, glow, acc: 0 };
  }
  protected updateProjectile(o: unknown, p: Projectile, dt: number): void {
    const q = o as { img: Img; glow: Img; acc: number };
    const s = this.project(p.x, p.y);
    const y = s.y - 22;
    q.img.setPosition(s.x, y);
    q.glow.setPosition(s.x, y);
    const sx = (p.vx - p.vy) * (TW / 2);
    const sy = (p.vx + p.vy) * (TH / 2);
    const ang = Math.atan2(sy, sx);
    if (p.dtype === 0 || p.dtype === 1 || p.dtype === 2)
      q.img.setRotation(p.dtype === 2 ? ang + Math.PI / 2 : p.dtype === 1 ? this.time * 12 : ang);
    q.acc += dt;
    if (q.acc > 0.04) {
      q.acc = 0;
      const e =
        p.dtype === 3
          ? this.em.flame
          : p.dtype === 2
            ? this.em.shard
            : p.dtype === 1
              ? this.em.bolt
              : this.em.speed;
      if (p.dtype === 0) {
        e.setParticleTint(0xffffff);
        e.setEmitterAngle(Phaser.Math.RadToDeg(ang) + 180);
      }
      e.emitParticleAt(s.x, y, p.dtype === 0 ? 1 : 2);
    }
  }
  protected destroyProjectile(o: unknown): void {
    const q = o as { img: Img; glow: Img };
    q.img.destroy();
    q.glow.destroy();
  }

  protected createDrop(d: Drop) {
    const s = this.scene;
    const rarity = d.item.kind === 'item' ? d.item.rarity : d.item.kind;
    const tint = DROP_TINT[rarity] ?? 0xffffff;
    const p = this.project(d.x, d.y);
    const img = s.add
      .image(p.x, p.y, d.item.kind === 'gem' ? 'c_gem' : 'c_bag')
      .setTint(tint)
      .setOrigin(0.5, 0.9);
    const ring = s.add.image(p.x, p.y, 'c_ring').setTint(tint).setScale(0.5).setDepth(2);
    const beam =
      rarity === 'normal'
        ? null
        : s.add
            .image(p.x, p.y, 'c_beam')
            .setOrigin(0.5, 1)
            .setTint(tint)
            .setAlpha(0.8)
            .setDepth(this.depthOf(d.x, d.y) + 5);
    this.owned.push(img, ring);
    if (beam) this.owned.push(beam);
    this.burst(p.x, p.y - 8, 'star', 6);
    // Pop out of the corpse with a bounce.
    return { img, ring, beam, tint, ph: Math.random() * 6, born: this.time };
  }
  protected updateDrop(o: unknown, d: Drop): void {
    const q = o as {
      img: Img;
      ring: Img;
      beam: Img | null;
      ph: number;
      tint: number;
      born: number;
    };
    const p = this.project(d.x, d.y);
    const age = this.time - q.born;
    const bounce =
      age < 0.45
        ? Math.abs(Math.sin((age / 0.45) * Math.PI * 2.4)) * 30 * (1 - age / 0.45)
        : Math.sin(this.time * 3 + q.ph) * 3;
    q.img
      .setPosition(p.x, p.y - 4 - bounce)
      .setDepth(this.depthOf(d.x, d.y) + 6)
      .setScale(1 + Math.sin(this.time * 5 + q.ph) * 0.04);
    q.ring.setPosition(p.x, p.y).setScale(0.45 + Math.sin(this.time * 4 + q.ph) * 0.05);
    q.beam?.setPosition(p.x, p.y);
  }
  protected destroyDrop(o: unknown, picked: boolean): void {
    const q = o as { img: Img; ring: Img; beam: Img | null; tint: number };
    if (picked) {
      this.em.star.setParticleTint(q.tint);
      this.em.star.explode(7, q.img.x, q.img.y);
      this.punchRing(q.img.x, q.img.y + 6, q.tint, 0.7);
    }
    q.img.destroy();
    q.ring.destroy();
    q.beam?.destroy();
  }

  protected createChest(c: Chest) {
    const p = this.project(c.x, c.y);
    const img = this.scene.add
      .image(p.x, p.y + 6, 'c_chest')
      .setOrigin(0.5, 0.9)
      .setDepth(this.depthOf(c.x, c.y));
    this.owned.push(img);
    return { img, opened: false };
  }
  protected updateChest(o: unknown, c: Chest): void {
    const q = o as { img: Img; opened: boolean };
    if (c.opened && !q.opened) {
      q.opened = true;
      q.img.setTexture('c_chestOpen');
      const p = this.project(c.x, c.y);
      this.em.conf.explode(24, p.x, p.y - 12);
      this.punchRing(p.x, p.y, 0xffd24a, 1);
      this.pow(p.x, p.y - 16, 0.9, 0xffd24a);
    }
  }

  protected updateGround(effects: GroundEffect[]): void {
    const g = this.gfx;
    g.clear();
    for (const e of effects) {
      const k = 1 - e.t / e.total;
      const p = this.project(e.x, e.y);
      const rx = e.radius * (TW / 2) * Math.SQRT2;
      const ry = e.radius * (TH / 2) * Math.SQRT2;
      g.fillStyle(0xff4a5a, 0.22 + 0.2 * k).fillEllipse(p.x, p.y, rx * 2, ry * 2);
      g.lineStyle(7, 0x1d0f2e, 1).strokeEllipse(p.x, p.y, rx * 2, ry * 2);
      g.lineStyle(3.5, 0xffffff, 1).strokeEllipse(p.x, p.y, rx * 2, ry * 2);
      g.fillStyle(0xff4a5a, 0.55).fillEllipse(p.x, p.y, rx * 2 * k, ry * 2 * k);
    }
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i];
      b.t -= 1 / 60;
      if (b.t <= 0) {
        this.bolts.splice(i, 1);
        continue;
      }
      const jitter = () => (Math.random() - 0.5) * 6;
      for (const [w, col] of [
        [9, 0x1d0f2e],
        [5, 0xfff060],
        [2, 0xffffff],
      ] as const) {
        g.lineStyle(w, col, 1).beginPath().moveTo(b.pts[0].x, b.pts[0].y);
        for (const p of b.pts) g.lineTo(p.x + jitter(), p.y + jitter());
        g.strokePath();
      }
    }
  }

  protected updateExit(world: World): void {
    if (!this.portal) return;
    const open = world.exitOpen;
    this.portal.a
      .setRotation(0)
      .setScale(1 + Math.sin(this.time * 3) * 0.05)
      .setAlpha(open ? 1 : 0.18);
    this.portal.b.setScale(0.65 + Math.cos(this.time * 4) * 0.05).setAlpha(open ? 1 : 0.14);
    if (open && Math.random() < 0.25)
      this.em.star.emitParticleAt(
        this.portal.a.x + (Math.random() - 0.5) * 60,
        this.portal.a.y - Math.random() * 30,
        1,
      );
  }

  // ---- VFX helpers -----------------------------------------------------------------------------
  private pow(x: number, y: number, scale: number, color = 0xffb62a): void {
    const img = this.scene.add
      .image(x, y, 'c_pow')
      .setDepth(1_000_000)
      .setTint(color)
      .setScale(0.2)
      .setRotation(Math.random() * 0.6 - 0.3);
    this.scene.tweens.add({
      targets: img,
      scale: scale,
      duration: 110,
      ease: 'Back.easeOut',
      onComplete: () =>
        this.scene.tweens.add({
          targets: img,
          scale: 0,
          alpha: 0,
          duration: 130,
          onComplete: () => img.destroy(),
        }),
    });
  }
  private punchRing(x: number, y: number, color: number, scale = 1): void {
    const img = this.scene.add
      .image(x, y, 'c_ring')
      .setDepth(999_000)
      .setTint(color)
      .setScale(0.2 * scale);
    this.scene.tweens.add({
      targets: img,
      scale: 1.4 * scale,
      alpha: 0,
      duration: 340,
      ease: 'Cubic.easeOut',
      onComplete: () => img.destroy(),
    });
  }
  private burst(
    x: number,
    y: number,
    kind: 'star' | 'chip' | 'puff' | 'dot' | 'conf' | 'shard' | 'bolt' | 'flame',
    n: number,
    tint?: number,
  ): void {
    const e = this.em[kind];
    if (tint !== undefined) e.setParticleTint(tint);
    e.explode(n, x, y);
  }
  private floater(x: number, y: number, text: string, color: number, big: boolean): void {
    if (this.floaters.length > 30) this.floaters.shift()!.destroy();
    const t = this.scene.add
      .text(x + (Math.random() - 0.5) * 24, y, text, {
        fontFamily: '"Trebuchet MS", "Arial Rounded MT Bold", Arial, sans-serif',
        fontSize: big ? '30px' : '20px',
        fontStyle: 'bold',
        color: '#' + color.toString(16).padStart(6, '0'),
        stroke: '#1d0f2e',
        strokeThickness: big ? 8 : 6,
      })
      .setOrigin(0.5)
      .setDepth(1_500_000)
      .setScale(0.2);
    this.floaters.push(t);
    this.scene.tweens.add({
      targets: t,
      scale: big ? 1.35 : 1,
      y: y - 36,
      duration: 160,
      ease: 'Back.easeOut',
      onComplete: () =>
        this.scene.tweens.add({
          targets: t,
          y: t.y - 28,
          alpha: 0,
          scale: big ? 1.1 : 0.9,
          duration: 650,
          ease: 'Sine.easeIn',
          onComplete: () => t.destroy(),
        }),
    });
  }
  private flashScreen(a: number): void {
    this.flashA = Math.max(this.flashA, a);
  }

  private slash(src: Actor, arc: boolean, skill: string): void {
    const p = this.project(src.x, src.y);
    const dir = Math.cos(src.facing) - Math.sin(src.facing) >= 0 ? 1 : -1;
    const heavy = skill === 'crushingBlow' || src.rarity === 'boss';
    const img = this.scene.add
      .image(p.x + dir * 22, p.y - 32, 'c_slash')
      .setOrigin(0.1, 0.5)
      .setDepth(1_000_000);
    img
      .setFlipX(dir < 0)
      .setTint(src.isPlayer ? 0xffffff : 0xffd8e8)
      .setScale(0.3 * (arc ? 1.5 : heavy ? 1.2 : 1), 0.3);
    this.scene.tweens.add({
      targets: img,
      scaleX: (arc ? 1.55 : heavy ? 1.3 : 1.05) * 1,
      scaleY: arc ? 1.3 : 1,
      duration: 120,
      ease: 'Back.easeOut',
      onComplete: () =>
        this.scene.tweens.add({
          targets: img,
          alpha: 0,
          duration: 120,
          onComplete: () => img.destroy(),
        }),
    });
    this.em.speed.setEmitterAngle(dir > 0 ? 0 : 180);
    this.em.speed.emitParticleAt(p.x + dir * 30, p.y - 32, 2);
    if (heavy) {
      this.burst(p.x + dir * 24, p.y - 4, 'puff', 3);
      this.shake = Math.max(this.shake, 6);
    }
  }

  protected handleEvent(e: SimEvent, world: World): void {
    const em = this.em;
    const pxy = (id: number, up = 30) => {
      const a = this.byId.get(id) ?? world.actors.find((x) => x.id === id);
      if (!a) return null;
      const p = this.project(a.x, a.y);
      return { a, x: p.x, y: p.y - up };
    };
    switch (e.t) {
      case 'hit': {
        const d = pxy(e.dst);
        if (!d) break;
        const src = e.src
          ? (this.byId.get(e.src) ?? world.actors.find((x) => x.id === e.src))
          : undefined;
        const amt = Math.round(e.amount);
        this.pow(d.x, d.y, e.crit ? 1.15 : 0.6, e.crit ? 0xffe040 : DTYPE_COLOR[e.dtype]);
        if (d.a.isPlayer) {
          em.drop.explode(5, d.x, d.y);
          this.shake = Math.max(this.shake, 4);
          this.flashScreen(0.05);
        } else {
          em.chip.explode(e.crit ? 8 : 4, d.x, d.y);
          if (e.dtype === 3) em.flame.explode(4, d.x, d.y);
          else if (e.dtype === 2) em.shard.explode(5, d.x, d.y);
          else if (e.dtype === 1) em.bolt.explode(4, d.x, d.y);
          else em.star.explode(e.crit ? 7 : 3, d.x, d.y);
        }
        if (e.crit) {
          this.shake = Math.max(this.shake, 9);
          this.punch = 0.06;
          this.flashScreen(0.1);
          this.punchRing(d.x, d.y + 28, 0xffe040, 1);
        }
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
        if (amt > 0 && (src?.isPlayer || d.a.isPlayer))
          this.floater(
            d.x,
            d.y - 14,
            String(amt),
            d.a.isPlayer ? 0xff6a7a : e.crit ? 0xffe040 : DTYPE_COLOR[e.dtype],
            e.crit,
          );
        break;
      }
      case 'miss': {
        const d = pxy(e.dst);
        if (d) this.floater(d.x, d.y - 10, 'miss', 0xd8d0f0, false);
        break;
      }
      case 'block': {
        const d = pxy(e.dst);
        if (d) {
          em.star.explode(8, d.x, d.y);
          this.floater(d.x, d.y - 10, 'block!', 0xa8d8ff, false);
        }
        break;
      }
      case 'death': {
        const d = pxy(e.id, 24);
        if (!d || d.a.isPlayer) break;
        const big = d.a.rarity === 'boss' || d.a.rarity === 'miniboss' || d.a.rarity === 'rare';
        em.puff.explode(big ? 8 : 4, d.x, d.y + 10);
        em.chip.explode(big ? 20 : 9, d.x, d.y);
        em.star.explode(big ? 14 : 5, d.x, d.y);
        this.pow(d.x, d.y, big ? 1.4 : 0.8, 0xffffff);
        if (big) {
          this.shake = Math.max(this.shake, 10);
          this.flashScreen(0.14);
          em.conf.explode(20, d.x, d.y);
        }
        break;
      }
      case 'explode': {
        const p = this.project(e.x, e.y);
        const col = DTYPE_COLOR[e.dtype];
        this.pow(p.x, p.y - 10, 1.25, col);
        this.punchRing(p.x, p.y, col, 1.4);
        if (e.dtype === 3) {
          em.flame.explode(14, p.x, p.y - 6);
          em.puff.explode(5, p.x, p.y);
        } else if (e.dtype === 2) em.shard.explode(14, p.x, p.y - 6);
        else if (e.dtype === 1) em.bolt.explode(14, p.x, p.y - 6);
        else {
          em.puff.explode(8, p.x, p.y);
          em.chip.explode(10, p.x, p.y);
          this.shake = Math.max(this.shake, 12);
        }
        this.flashScreen(0.06);
        break;
      }
      case 'chain': {
        const a = pxy(e.from, 30);
        const b = pxy(e.to, 30);
        if (a && b) {
          const pts: { x: number; y: number }[] = [{ x: a.x, y: a.y }];
          const n = 6;
          for (let i = 1; i < n; i++)
            pts.push({
              x: a.x + ((b.x - a.x) * i) / n + (Math.random() - 0.5) * 22,
              y: a.y + ((b.y - a.y) * i) / n + (Math.random() - 0.5) * 22,
            });
          pts.push({ x: b.x, y: b.y });
          this.bolts.push({ pts, t: 0.24 });
          em.bolt.explode(6, b.x, b.y);
        }
        break;
      }
      case 'use': {
        const a = this.byId.get(e.src);
        if (!a?.action) break;
        const prof = a.action.profile;
        if (prof.skill.type === 'spell') {
          const tags = prof.skill.tags;
          const col = tags.includes('fire')
            ? 0xffa030
            : tags.includes('cold')
              ? 0x8ae4ff
              : tags.includes('lightning')
                ? 0xd8b0ff
                : 0xffffff;
          const p = this.project(a.x, a.y);
          this.punchRing(p.x, p.y, col, 0.9);
          em.star.setParticleTint(col);
          em.star.explode(4, p.x + (Math.cos(a.facing) - Math.sin(a.facing)) * 14, p.y - 34);
        }
        break;
      }
      case 'stun': {
        const d = pxy(e.dst, 56);
        if (d) em.star.explode(6, d.x, d.y);
        break;
      }
      case 'levelUp': {
        const p = this.project(world.player.x, world.player.y);
        em.conf.explode(40, p.x, p.y - 30);
        this.punchRing(p.x, p.y, 0xffe040, 1.8);
        this.pow(p.x, p.y - 36, 1.6, 0xffe040);
        this.floater(p.x, p.y - 80, `Level ${e.level}!`, 0xffe040, true);
        break;
      }
      case 'flaskUsed': {
        const f = world.flasks[e.idx];
        const p = this.project(world.player.x, world.player.y);
        const col =
          f?.spec.kind === 'mana' ? 0x6a9cff : f?.spec.kind === 'utility' ? 0xffd24a : 0xff5a6a;
        this.punchRing(p.x, p.y, col, 1.1);
        em.dot.setParticleTint(col);
        em.dot.explode(8, p.x, p.y - 30);
        break;
      }
      case 'summon': {
        const d = pxy(e.id, 24);
        if (d) {
          em.puff.explode(4, d.x, d.y + 10);
          this.punchRing(d.x, d.y + 24, 0xc08aff, 0.8);
        }
        break;
      }
      case 'exitOpen':
        if (this.portal) {
          this.punchRing(this.portal.a.x, this.portal.a.y, 0x7fe8ff, 2);
          em.conf.explode(24, this.portal.a.x, this.portal.a.y - 20);
        }
        break;
      case 'ailment': {
        const d = pxy(e.dst, 30);
        if (d && e.kind === 'freeze') em.shard.explode(10, d.x, d.y);
        break;
      }
    }
  }

  // ---- Per-frame -------------------------------------------------------------------------------
  protected frame(world: World, dt: number): void {
    this.byId = new Map(world.actors.map((a) => [a.id, a]));
    const cam = this.scene.cameras.main;
    const pp = this.project(world.player.x, world.player.y);
    this.playerGlow?.setPosition(pp.x, pp.y);
    for (const f of this.flames) {
      const k = 1 + Math.sin(this.time * 11 + f.seed) * 0.05;
      f.img.setScale(k, 1 + Math.sin(this.time * 9 + f.seed * 2) * 0.06);
      f.glow.setAlpha(0.4 + Math.sin(this.time * 7 + f.seed) * 0.08);
      if (Math.random() < 0.05) this.em.flame.emitParticleAt(f.img.x, f.img.y - 48, 1);
    }
    // Ailments.
    for (const a of world.actors) {
      if (!a.alive) continue;
      const v = this.views.get(a.id) as View | undefined;
      if (!v || v.data.gone) continue;
      v.data.acc += dt;
      if (v.data.acc < 0.12) continue;
      v.data.acc = 0;
      const p = this.project(a.x, a.y);
      const x = p.x + (Math.random() - 0.5) * 18;
      if (a.ail.ignites.length) this.em.flame.emitParticleAt(x, p.y - 44 - Math.random() * 12, 1);
      if (a.ail.shock > 0) this.em.bolt.emitParticleAt(x, p.y - 36 - Math.random() * 20, 1);
      if (a.ail.chill > 0) this.em.shard.emitParticleAt(x, p.y - 30 - Math.random() * 20, 1);
      if (a.ail.poisons.length) this.em.bubble.emitParticleAt(x, p.y - 20, 1);
      if (a.ail.bleeds.length) this.em.drop.emitParticleAt(x, p.y - 30, 1);
      if (a.stunT > 0) {
        const ang = this.time * 7;
        this.em.star.emitParticleAt(p.x + Math.cos(ang) * 18, p.y - 66 + Math.sin(ang) * 6, 1);
      }
    }
    if (this.flashA > 0.001) {
      this.flash
        .setAlpha(this.flashA)
        .setPosition(cam.width / 2, cam.height / 2)
        .setDisplaySize(cam.width / cam.zoom, cam.height / cam.zoom);
      this.flashA *= Math.pow(0.0004, dt);
    } else this.flash.setAlpha(0);
    if (this.punch > 0.001) {
      this.punch *= Math.pow(0.0003, dt);
      cam.setZoom(ZOOM * (1 + this.punch));
    } else if (cam.zoom !== ZOOM) cam.setZoom(ZOOM);
  }

  protected destroyAll(): void {
    for (const o of this.owned) o.destroy();
    this.owned = [];
    for (const f of this.floaters) f.destroy();
    this.floaters = [];
    this.flames = [];
    this.bolts = [];
    this.portal = null;
    this.playerGlow = null;
    const cam = this.scene.cameras.main;
    cam.setZoom(1);
    try {
      cam.filters.external.clear();
    } catch {
      /* ignore */
    }
  }
}
