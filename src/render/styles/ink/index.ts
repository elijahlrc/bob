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
import type { MarkTheme } from '../../style/marks';
import type { AnimName, FigureKind } from '../../style/figure';
import type { StyleId } from '../../style/types';
import {
  BOIL,
  buildSprites,
  FRAMES,
  INK,
  INK_THEMES,
  inkLine,
  ITILE,
  RES,
  rasterFigure,
} from './paint';

const ZOOM = 1.25;
const ELEMENT_TINT: Record<string, number> = {
  none: 0xffffff,
  fire: 0xf4b078,
  cold: 0xa8d0f0,
  lightning: 0xf0e090,
};
const DTYPE_WASH = [0x3a2e24, 0xe8c82a, 0x4a9ad0, 0xe8742a, 0x5a9a4a];
const RARITY_BASE: Record<string, number> = {
  magic: 0x6a8cff,
  rare: 0xf0c840,
  miniboss: 0xf08a30,
  boss: 0xd03a30,
};
const DROP_WASH: Record<string, number> = {
  normal: 0xb8a888,
  magic: 0x6a8cff,
  rare: 0xf0c840,
  unique: 0xf08a30,
  gem: 0x3ac8a0,
  flask: 0xe8508a,
};
const BLOOD = 0xa3201c;

type Emitter = Phaser.GameObjects.Particles.ParticleEmitter;
type Img = Phaser.GameObjects.Image;
type View = ActorView & {
  data: {
    sprite: Img;
    base: Img;
    shadow: Img;
    gone: boolean;
    last: string;
    acc: number;
    accent: number;
    variant: string;
    boil: number;
  };
};
type Bolt = { pts: { x: number; y: number }[]; t: number };

export class InkStyle extends StyleBase {
  readonly id: StyleId = 'ink';
  private owned: Phaser.GameObjects.GameObject[] = [];
  private em!: Record<string, Emitter>;
  private gfx!: Phaser.GameObjects.Graphics;
  private bolts: Bolt[] = [];
  private byId = new Map<number, Actor>();
  private decals: Img[] = [];
  private floaters: Phaser.GameObjects.Text[] = [];
  private slashed = new WeakSet<object>();
  private flames: { flame: Img; wash: Img; seed: number }[] = [];
  private portal: { spiral: Img; wash: Img } | null = null;
  private punch = 0;
  private rng = new Rng(5);

  project(x: number, y: number): { x: number; y: number } {
    return { x: x * ITILE, y: y * ITILE };
  }

  private addTex(key: string, cnv: HTMLCanvasElement): void {
    if (!this.scene.textures.exists(key)) this.scene.textures.addCanvas(key, cnv);
  }

  private figKey(kind: FigureKind, accent: number, anim: AnimName, i: number, v: number): string {
    const acc = kind.startsWith('hero_') ? accent : 0;
    const key = `if_${kind}_${acc}_${anim}_${i}_${v}`;
    if (!this.scene.textures.exists(key))
      this.addTex(key, rasterFigure(kind, anim, i / FRAMES[anim], acc, v));
    return key;
  }

  // ---- World -----------------------------------------------------------------------------------
  buildWorld(world: World): void {
    const s = this.scene;
    for (const [k, cnv] of Object.entries(buildSprites())) this.addTex('i_' + k, cnv);
    const lab = world.plan.lab;
    const rng = new Rng(world.plan.seed ^ 0x1c4);
    const isFloor = (x: number, y: number) =>
      x >= 0 && y >= 0 && x < lab.w && y < lab.h && lab.tiles[y * lab.w + x] === 1;

    // Distance of each wall tile from the nearest floor (1, 2, or further).
    const dist = new Uint8Array(lab.w * lab.h);
    let frontier: number[] = [];
    for (let y = 0; y < lab.h; y++)
      for (let x = 0; x < lab.w; x++) if (isFloor(x, y)) frontier.push(y * lab.w + x);
    for (let d = 1; d <= 2; d++) {
      const next: number[] = [];
      for (const i of frontier) {
        const x = i % lab.w;
        const y = (i - x) / lab.w;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= lab.w || ny >= lab.h) continue;
            const j = ny * lab.w + nx;
            if (isFloor(nx, ny) || dist[j]) continue;
            dist[j] = d;
            next.push(j);
          }
      }
      frontier = next;
    }

    const paper = s.textures.get('i_paper').getSourceImage() as HTMLCanvasElement;
    const CH = 16;
    for (let cy = 0; cy < Math.ceil(lab.h / CH); cy++)
      for (let cx = 0; cx < Math.ceil(lab.w / CH); cx++) {
        const cnv = document.createElement('canvas');
        cnv.width = cnv.height = CH * ITILE;
        const c = cnv.getContext('2d')!;
        const pat = c.createPattern(paper, 'repeat')!;
        let any = false;
        const r2 = new Rng(world.plan.seed ^ (cx * 7919 + cy * 104729));
        for (let ty = 0; ty < CH; ty++)
          for (let tx = 0; tx < CH; tx++) {
            const x = cx * CH + tx;
            const y = cy * CH + ty;
            if (x >= lab.w || y >= lab.h) continue;
            const floor = isFloor(x, y);
            const d = dist[y * lab.w + x];
            if (!floor && !d) continue;
            any = true;
            const px = tx * ITILE;
            const py = ty * ITILE;
            c.save();
            c.translate(cx * CH * ITILE * -0, 0);
            c.fillStyle = pat;
            c.fillRect(px, py, ITILE, ITILE);
            c.restore();
            if (floor) {
              // Faint hand-ruled grid and stipple.
              c.strokeStyle = 'rgba(90,60,25,0.16)';
              c.lineWidth = 1;
              inkLine(c, px, py, px + ITILE, py, r2, 0.8);
              inkLine(c, px, py, px, py + ITILE, r2, 0.8);
              c.fillStyle = 'rgba(70,45,20,0.35)';
              for (let i = 0; i < 4; i++)
                c.fillRect(px + r2.int(3, ITILE - 4), py + r2.int(3, ITILE - 4), 1.2, 1.2);
              // Shadow wash against walls.
              const shade = (
                x0: number,
                y0: number,
                x1: number,
                y1: number,
                w: number,
                h: number,
              ) => {
                const g = c.createLinearGradient(x0, y0, x1, y1);
                g.addColorStop(0, 'rgba(90,55,20,0.24)');
                g.addColorStop(1, 'rgba(90,55,20,0)');
                c.fillStyle = g;
                c.fillRect(
                  px + (x0 === px ? 0 : w),
                  py + (y0 === py ? 0 : h),
                  x0 === x1 ? ITILE : 10,
                  y0 === y1 ? ITILE : 10,
                );
              };
              void shade;
              if (!isFloor(x, y - 1)) {
                const g = c.createLinearGradient(0, py, 0, py + 11);
                g.addColorStop(0, 'rgba(90,55,20,0.3)');
                g.addColorStop(1, 'rgba(90,55,20,0)');
                c.fillStyle = g;
                c.fillRect(px, py, ITILE, 11);
              }
              if (!isFloor(x - 1, y)) {
                const g = c.createLinearGradient(px, 0, px + 11, 0);
                g.addColorStop(0, 'rgba(90,55,20,0.3)');
                g.addColorStop(1, 'rgba(90,55,20,0)');
                c.fillStyle = g;
                c.fillRect(px, py, 11, ITILE);
              }
            } else {
              // Hatched wall band: single hatch next to the floor, cross-hatch one tile further.
              c.save();
              c.beginPath();
              c.rect(px, py, ITILE, ITILE);
              c.clip();
              c.strokeStyle = INK;
              c.lineWidth = d === 1 ? 1.3 : 1.5;
              const step = d === 1 ? 6 : 4.6;
              for (let o = -ITILE; o < ITILE * 2; o += step)
                inkLine(c, px + o, py + ITILE + 2, px + o + ITILE + 2, py - 2, r2, 0.7);
              if (d === 2)
                for (let o = -ITILE; o < ITILE * 2; o += step)
                  inkLine(c, px + o, py - 2, px + o + ITILE + 2, py + ITILE + 2, r2, 0.7);
              c.restore();
            }
            // Ink line along floor/wall edges (and the outer edge of the hatched band).
            c.strokeStyle = INK;
            c.lineCap = 'round';
            const edge = (
              nx: number,
              ny: number,
              x1: number,
              y1: number,
              x2: number,
              y2: number,
            ) => {
              const nf = isFloor(nx, ny);
              const nd = nx < 0 || ny < 0 || nx >= lab.w || ny >= lab.h ? 3 : dist[ny * lab.w + nx];
              const solid = floor ? !nf : d === 2 ? !nf && nd === 0 : false;
              if (!solid) return;
              c.lineWidth = floor ? 3.4 : 3;
              inkLine(c, px + x1, py + y1, px + x2, py + y2, r2, 1.1);
              if (floor) {
                c.lineWidth = 1.2;
                const ox = nx < x ? 4 : nx > x ? -4 : 0;
                const oy = ny < y ? 4 : ny > y ? -4 : 0;
                void ox;
                void oy;
              }
            };
            edge(x, y - 1, 0, 0, ITILE, 0);
            edge(x, y + 1, 0, ITILE, ITILE, ITILE);
            edge(x - 1, y, 0, 0, 0, ITILE);
            edge(x + 1, y, ITILE, 0, ITILE, ITILE);
          }
        if (!any) continue;
        const key = `ic_${world.plan.seed}_${cx}_${cy}`;
        this.addTex(key, cnv);
        const img = s.add
          .image(cx * CH * ITILE, cy * CH * ITILE, key)
          .setOrigin(0, 0)
          .setDepth(0);
        this.owned.push(img);
      }

    this.placeDoodles(world, rng);
    const th = INK_THEMES[world.plan.theme.id] ?? INK_THEMES.ashenCrypt;
    const cam = s.cameras.main;
    cam.setZoom(ZOOM);
    cam.setBounds(-300, -300, lab.w * ITILE + 600, lab.h * ITILE + 600);
    cam.setBackgroundColor(INK);
    try {
      cam.filters.external.addVignette(0.5, 0.5, 0.9, 0.5, 0x2a1808);
    } catch {
      /* optional */
    }
    this.makeEmitters();
    this.gfx = s.add.graphics().setDepth(600000);
    this.owned.push(this.gfx);
    const ex = this.project(lab.exit.x, lab.exit.y);
    const sp = s.add.image(ex.x, ex.y, 'i_spiral').setDepth(2).setAlpha(0.35);
    const wa = s.add
      .image(ex.x, ex.y, 'i_wash')
      .setDepth(1)
      .setTint(th.wash)
      .setAlpha(0)
      .setScale(0.9);
    this.owned.push(sp, wa);
    this.portal = { spiral: sp, wash: wa };
  }

  private placeDoodles(world: World, rng: Rng): void {
    const s = this.scene;
    const lab = world.plan.lab;
    const th = INK_THEMES[world.plan.theme.id] ?? INK_THEMES.ashenCrypt;
    for (const room of lab.rooms) {
      const r = room.rect;
      // Torches along the top wall, with a wash of warm colour.
      for (const tx of [r.x + 2, r.x + r.w - 3]) {
        const x = (tx + 0.5) * ITILE;
        const y = (r.y + 0.15) * ITILE;
        const t = s.add
          .image(x, y + 10, 'i_torch')
          .setOrigin(0.5, 1)
          .setDepth(y + 20);
        const wash = s.add
          .image(x, y - 8, 'i_wash')
          .setTint(0xf0a040)
          .setAlpha(0.28)
          .setScale(0.75)
          .setDepth(1);
        const flame = s.add
          .image(x, y - 10, 'i_flame')
          .setTint(0xf08a30)
          .setScale(0.8)
          .setDepth(y + 21);
        this.owned.push(t, wash, flame);
        this.flames.push({ flame, wash, seed: rng.next() * 6 });
      }
      if (room.kind === 'start') continue;
      for (let i = 0; i < 4; i++) {
        const kind = rng.pick(['skull', 'rubble', 'rubble', 'skull']);
        const img = s.add
          .image(
            rng.float(r.x + 1, r.x + r.w - 1) * ITILE,
            rng.float(r.y + 1, r.y + r.h - 1) * ITILE,
            'i_' + kind,
          )
          .setDepth(1)
          .setRotation(rng.float(-0.4, 0.4))
          .setAlpha(0.9);
        this.owned.push(img);
      }
      const web = s.add
        .image((r.x + r.w) * ITILE, r.y * ITILE, 'i_web')
        .setOrigin(0, 0)
        .setFlipX(true)
        .setDepth(1)
        .setAlpha(0.85);
      this.owned.push(web);
    }
    void th;
  }

  private makeEmitters(): void {
    const s = this.scene;
    const mk = (tex: string, cfg: Record<string, unknown>): Emitter => {
      const e = s.add.particles(0, 0, 'i_' + tex, { emitting: false, ...cfg } as never) as Emitter;
      e.setDepth(500000);
      this.owned.push(e);
      return e;
    };
    this.em = {
      ink: mk('drop', {
        speed: { min: 60, max: 220 },
        angle: { min: 0, max: 360 },
        lifespan: { min: 280, max: 520 },
        scale: { start: 1.1, end: 0.2 },
        rotate: { min: 0, max: 360 },
        tint: [0x1c1612, 0x2a1f18],
      }),
      blood: mk('drop', {
        speed: { min: 60, max: 200 },
        angle: { min: 0, max: 360 },
        lifespan: { min: 300, max: 560 },
        scale: { start: 1.2, end: 0.2 },
        tint: [0xa3201c, 0x7a1612, 0xc02a24],
      }),
      fleck: mk('dot', {
        speed: { min: 40, max: 150 },
        angle: { min: 0, max: 360 },
        lifespan: { min: 300, max: 600 },
        scale: { start: 0.7, end: 0 },
        tint: [0x1c1612],
      }),
      star: mk('star', {
        speed: { min: 60, max: 190 },
        angle: { min: 0, max: 360 },
        lifespan: { min: 360, max: 600 },
        rotate: { min: -180, max: 180 },
        scale: { start: 0.8, end: 0 },
        tint: [0xf0c840, 0xf08a30, 0xffffff],
      }),
      bone: mk('bone', {
        speed: { min: 60, max: 180 },
        angle: { min: 0, max: 360 },
        lifespan: { min: 500, max: 800 },
        rotate: { min: 0, max: 360 },
        scale: { start: 1.3, end: 0.8 },
        alpha: { start: 1, end: 0 },
      }),
      flame: mk('flame', {
        speed: { min: 10, max: 40 },
        angle: { min: 250, max: 290 },
        lifespan: { min: 320, max: 520 },
        scale: { start: 0.5, end: 0 },
        tint: [0xf4b040, 0xf08a30, 0xe05a1a],
      }),
      shard: mk('shard', {
        speed: { min: 60, max: 180 },
        angle: { min: 0, max: 360 },
        lifespan: { min: 340, max: 560 },
        rotate: { min: -180, max: 180 },
        scale: { start: 0.7, end: 0 },
        tint: [0xa8d0f0, 0x4a9ad0],
      }),
      wdot: mk('dot', {
        speed: { min: 20, max: 80 },
        angle: { min: 0, max: 360 },
        lifespan: { min: 500, max: 800 },
        scale: { start: 1.2, end: 0.2 },
        alpha: { start: 0.9, end: 0 },
        tint: [0x5a9a4a, 0x8ab860],
      }),
    };
  }

  // ---- Actors ----------------------------------------------------------------------------------
  protected createView(a: Actor, kind: FigureKind): View {
    const s = this.scene;
    const accent = a.isPlayer ? heroColor(this.world) : 0;
    const sprite = s.add.image(0, 0, this.figKey(kind, accent, 'idle', 0, 0)).setOrigin(0.5, 0.86);
    const variant = a.mon?.spec.variant ?? 'none';
    if (variant !== 'none') sprite.setTint(ELEMENT_TINT[variant]);
    const base = s.add
      .image(0, 0, 'i_base')
      .setTint(a.isPlayer ? accent : (RARITY_BASE[a.rarity] ?? 0xd8c090));
    const shadow = s.add.image(0, 0, 'i_shadow');
    this.owned.push(sprite, base, shadow);
    return {
      id: a.id,
      track: new AnimTrack(),
      kind,
      data: {
        sprite,
        base,
        shadow,
        gone: false,
        last: '',
        acc: 0,
        accent,
        variant,
        boil: Math.floor(Math.random() * 3),
      },
    };
  }

  protected markTheme(): MarkTheme {
    return { unit: 3.2, outline: 0x1c1612, squash: 0.5 };
  }

  protected updateView(v: View, a: Actor): void {
    const d = v.data;
    if (d.gone) return;
    const t = v.track;
    const px = v.track.rx * ITILE;
    const py = v.track.ry * ITILE;
    const st = t.state(a);
    const n = FRAMES[st.anim];
    const idx = Math.min(n - 1, Math.floor(st.t * n));
    const bv = (Math.floor(this.time * 8) + d.boil) % BOIL;
    const key = this.figKey(v.kind, d.accent, st.anim, idx, bv);
    if (key !== d.last) {
      d.sprite.setTexture(key);
      d.last = key;
    }
    let ox = 0;
    let oy = 0;
    let sx = 1;
    let sy = 1;
    if (t.hitT < 0.14 && a.alive) {
      const k = 1 - t.hitT / 0.14;
      ox = Math.cos(t.hitDir) * 7 * k;
      oy = Math.sin(t.hitDir) * 4 * k;
      sx = 1 + 0.1 * k;
      sy = 1 - 0.08 * k;
    }
    if (st.anim === 'attack' && st.t > 0.4 && st.t < 0.65) sx = 1.08;
    let alpha = 1;
    if (!a.alive) alpha = Math.max(0, 1 - Math.max(0, t.deathT - 0.45) / 0.35);
    const depth = 10 + py;
    d.sprite
      .setPosition(px + ox, py + oy)
      .setScale((t.face * sx) / RES, sy / RES)
      .setDepth(depth)
      .setAlpha(alpha);
    if (t.hitT < 0.07 && a.alive) d.sprite.setTint(BLOOD).setTintMode(Phaser.TintModes.FILL);
    else {
      let tint = ELEMENT_TINT[d.variant] ?? 0xffffff;
      if (a.ail.freezeT > 0) tint = 0x9ac8ec;
      else if (a.ail.chill > 0) tint = 0xc4dcf0;
      else if (a.ail.poisons.length) tint = 0xc8e0a0;
      d.sprite.setTint(tint).setTintMode(Phaser.TintModes.MULTIPLY);
    }
    const bs = Math.max(0.55, a.r * 1.7);
    d.base
      .setPosition(px, py + 2)
      .setScale(bs, bs)
      .setDepth(depth - 2)
      .setAlpha(alpha);
    d.shadow
      .setPosition(px + 5, py + 7)
      .setScale(bs, bs)
      .setDepth(depth - 3)
      .setAlpha(alpha);
    if (!a.alive && t.deathT > 0.85) {
      d.sprite.destroy();
      d.base.destroy();
      d.shadow.destroy();
      d.gone = true;
    }
  }

  protected destroyView(v: View): void {
    if (v.data.gone) return;
    v.data.sprite.destroy();
    v.data.base.destroy();
    v.data.shadow.destroy();
  }

  // ---- Projectiles, drops, chests --------------------------------------------------------------
  protected createProjectile(p: Projectile) {
    const s = this.scene;
    const phys = p.dtype === 0;
    const img = s.add
      .image(
        0,
        0,
        phys ? 'i_arrow' : p.dtype === 2 ? 'i_shard' : p.dtype === 1 ? 'i_star' : 'i_flame',
      )
      .setDepth(450000);
    const wash = phys
      ? null
      : s.add
          .image(0, 0, 'i_wash')
          .setTint(DTYPE_WASH[p.dtype])
          .setScale(0.5)
          .setAlpha(0.8)
          .setDepth(449999);
    if (!phys) img.setTint(p.dtype === 1 ? 0xf0c840 : 0xffffff);
    if (p.dtype === 3) img.setTint(0xf08a30).setScale(0.9);
    this.owned.push(img);
    if (wash) this.owned.push(wash);
    return { img, wash, acc: 0 };
  }
  protected updateProjectile(o: unknown, p: Projectile, dt: number): void {
    const q = o as { img: Img; wash: Img | null; acc: number };
    const x = p.x * ITILE;
    const y = p.y * ITILE - 10;
    q.img.setPosition(x, y);
    q.wash?.setPosition(x, y);
    const ang = Math.atan2(p.vy, p.vx);
    if (p.dtype === 0) q.img.setRotation(ang);
    else if (p.dtype === 2) q.img.setRotation(ang + Math.PI / 2);
    else if (p.dtype === 1) q.img.setRotation(this.time * 10);
    q.acc += dt;
    if (q.acc > 0.045) {
      q.acc = 0;
      const e =
        p.dtype === 3
          ? this.em.flame
          : p.dtype === 2
            ? this.em.shard
            : p.dtype === 1
              ? this.em.star
              : this.em.fleck;
      e.emitParticleAt(x, y, 1);
    }
  }
  protected destroyProjectile(o: unknown): void {
    const q = o as { img: Img; wash: Img | null };
    q.img.destroy();
    q.wash?.destroy();
  }

  protected createDrop(d: Drop) {
    const s = this.scene;
    const rarity = d.item.kind === 'item' ? d.item.rarity : d.item.kind;
    const tint = DROP_WASH[rarity] ?? 0xb8a888;
    const p = this.project(d.x, d.y);
    const x = s.add
      .image(p.x, p.y + 2, 'i_x')
      .setTint(0x1c1612)
      .setAlpha(0.6)
      .setDepth(2);
    const img = s.add
      .image(p.x, p.y, d.item.kind === 'gem' ? 'i_gem' : 'i_bag')
      .setTint(tint)
      .setOrigin(0.5, 0.9);
    const ray =
      rarity === 'normal' || rarity === 'magic'
        ? null
        : s.add
            .image(p.x, p.y - 8, 'i_ray')
            .setTint(tint)
            .setAlpha(0.8)
            .setDepth(3);
    const wash = s.add
      .image(p.x, p.y - 6, 'i_wash')
      .setTint(tint)
      .setAlpha(0.35)
      .setScale(0.4)
      .setDepth(2);
    this.owned.push(x, img, wash);
    if (ray) this.owned.push(ray);
    this.em.ink.explode(5, p.x, p.y - 8);
    return { x, img, ray, wash, ph: Math.random() * 6, born: this.time, tint };
  }
  protected updateDrop(o: unknown, d: Drop): void {
    const q = o as { x: Img; img: Img; ray: Img | null; wash: Img; ph: number; born: number };
    const p = this.project(d.x, d.y);
    const age = this.time - q.born;
    const bounce =
      age < 0.4
        ? Math.abs(Math.sin((age / 0.4) * Math.PI * 2.2)) * 22 * (1 - age / 0.4)
        : Math.sin(this.time * 3 + q.ph) * 2;
    q.img.setPosition(p.x, p.y - 4 - bounce).setDepth(30 + p.y);
    q.ray?.setPosition(p.x, p.y - 8).setRotation(this.time * 0.4);
    q.wash.setPosition(p.x, p.y - 6);
  }
  protected destroyDrop(o: unknown, picked: boolean): void {
    const q = o as { x: Img; img: Img; ray: Img | null; wash: Img; tint: number };
    if (picked) {
      this.em.star.explode(6, q.img.x, q.img.y);
      this.bloom(q.img.x, q.img.y, q.tint, 0.5);
    }
    q.x.destroy();
    q.img.destroy();
    q.ray?.destroy();
    q.wash.destroy();
  }

  protected createChest(c: Chest) {
    const p = this.project(c.x, c.y);
    const img = this.scene.add
      .image(p.x, p.y + 6, 'i_chest')
      .setOrigin(0.5, 0.9)
      .setDepth(10 + p.y);
    this.owned.push(img);
    return { img, opened: false };
  }
  protected updateChest(o: unknown, c: Chest): void {
    const q = o as { img: Img; opened: boolean };
    if (c.opened && !q.opened) {
      q.opened = true;
      q.img.setTexture('i_chestOpen');
      const p = this.project(c.x, c.y);
      this.em.star.explode(14, p.x, p.y - 10);
      this.bloom(p.x, p.y - 8, 0xf0c840, 1.1);
    }
  }

  protected updateGround(effects: GroundEffect[]): void {
    const g = this.gfx;
    g.clear();
    for (const e of effects) {
      const k = 1 - e.t / e.total;
      const x = e.x * ITILE;
      const y = e.y * ITILE;
      const r = e.radius * ITILE;
      g.fillStyle(BLOOD, 0.12 + 0.2 * k).fillCircle(x, y, r);
      for (let i = -8; i <= 8; i++) {
        // Hatching clipped to the circle by chord length.
        const yy = (i / 8) * r;
        const half = Math.sqrt(Math.max(0, r * r - yy * yy));
        g.lineStyle(1.5, BLOOD, 0.5).lineBetween(x - half, y + yy, x + half, y + yy);
      }
      g.lineStyle(3, 0x1c1612, 1).strokeCircle(x + Math.sin(this.time * 9) * 0.8, y, r);
      g.lineStyle(2, BLOOD, 1).strokeCircle(x, y, r * k);
    }
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i];
      b.t -= 1 / 60;
      if (b.t <= 0) {
        this.bolts.splice(i, 1);
        continue;
      }
      const j = () => (Math.random() - 0.5) * 4;
      for (const [w, col, al] of [
        [10, 0xf0c840, 0.5],
        [4, 0x1c1612, 1],
      ] as const) {
        g.lineStyle(w, col, al).beginPath().moveTo(b.pts[0].x, b.pts[0].y);
        for (const p of b.pts) g.lineTo(p.x + j(), p.y + j());
        g.strokePath();
      }
    }
  }

  protected updateExit(world: World): void {
    if (!this.portal) return;
    const open = world.exitOpen;
    this.portal.spiral.setRotation(this.time * (open ? 1.4 : 0.2)).setAlpha(open ? 1 : 0.3);
    this.portal.wash.setAlpha(open ? 0.5 + Math.sin(this.time * 3) * 0.1 : 0).setTint(0x3ac8c8);
  }

  // ---- VFX helpers -----------------------------------------------------------------------------
  private splat(x: number, y: number, tint: number, scale: number, alpha = 0.9): void {
    const d = this.scene.add
      .image(x, y, 'i_splat' + this.rng.int(0, 3))
      .setTint(tint)
      .setDepth(3 + this.decals.length * 0.0001)
      .setScale(scale)
      .setRotation(Math.random() * 6.28)
      .setAlpha(alpha);
    this.decals.push(d);
    if (this.decals.length > 170) this.decals.shift()!.destroy();
  }
  private bloom(x: number, y: number, tint: number, scale: number): void {
    const img = this.scene.add
      .image(x, y, 'i_wash')
      .setTint(tint)
      .setDepth(400000)
      .setScale(scale * 0.3)
      .setAlpha(0.85)
      .setRotation(Math.random() * 6);
    this.scene.tweens.add({
      targets: img,
      scale: scale,
      alpha: 0,
      duration: 520,
      ease: 'Cubic.easeOut',
      onComplete: () => img.destroy(),
    });
  }
  private rays(x: number, y: number, tint: number, scale: number): void {
    const img = this.scene.add
      .image(x, y, 'i_ray')
      .setTint(tint)
      .setDepth(420000)
      .setScale(scale * 0.4)
      .setAlpha(0.95);
    this.scene.tweens.add({
      targets: img,
      scale,
      alpha: 0,
      rotation: 0.4,
      duration: 380,
      ease: 'Cubic.easeOut',
      onComplete: () => img.destroy(),
    });
  }
  private floater(x: number, y: number, text: string, color: number, big: boolean): void {
    if (this.floaters.length > 30) this.floaters.shift()!.destroy();
    const t = this.scene.add
      .text(x + (Math.random() - 0.5) * 20, y, text, {
        fontFamily: 'Georgia, "Palatino Linotype", serif',
        fontSize: big ? '26px' : '17px',
        fontStyle: 'italic bold',
        color: '#' + color.toString(16).padStart(6, '0'),
        stroke: '#ecdcb4',
        strokeThickness: big ? 6 : 4,
      })
      .setOrigin(0.5)
      .setDepth(900000)
      .setRotation((Math.random() - 0.5) * 0.25)
      .setScale(0.4);
    this.floaters.push(t);
    this.scene.tweens.add({
      targets: t,
      scale: big ? 1.25 : 1,
      y: y - 30,
      duration: 180,
      ease: 'Back.easeOut',
      onComplete: () =>
        this.scene.tweens.add({
          targets: t,
          y: t.y - 26,
          alpha: 0,
          duration: 650,
          onComplete: () => t.destroy(),
        }),
    });
  }

  private slash(src: Actor, arc: boolean, skill: string): void {
    const dir = Math.cos(src.facing) >= 0 ? 1 : -1;
    const x = src.x * ITILE + dir * 18;
    const y = src.y * ITILE - 14;
    const heavy = skill === 'crushingBlow' || src.rarity === 'boss';
    const img = this.scene.add
      .image(x, y, 'i_brush')
      .setOrigin(0.1, 0.5)
      .setTint(src.isPlayer ? 0x1c1612 : 0x5a1612)
      .setDepth(480000)
      .setFlipX(dir < 0)
      .setScale(0.3, arc ? 1.1 : heavy ? 1 : 0.8)
      .setAlpha(0.95);
    this.scene.tweens.add({
      targets: img,
      scaleX: arc ? 1.25 : heavy ? 1.1 : 0.85,
      duration: 110,
      ease: 'Cubic.easeOut',
      onComplete: () =>
        this.scene.tweens.add({
          targets: img,
          alpha: 0,
          duration: 200,
          onComplete: () => img.destroy(),
        }),
    });
    this.em.ink.emitParticleAt(x + dir * 30, y, 3);
    if (heavy) {
      this.shake = Math.max(this.shake, 4);
      this.splat(x + dir * 22, src.y * ITILE + 4, 0x1c1612, 0.45, 0.5);
    }
  }

  protected handleEvent(e: SimEvent, world: World): void {
    const em = this.em;
    const pxy = (id: number, up = 18) => {
      const a = this.byId.get(id) ?? world.actors.find((x) => x.id === id);
      return a ? { a, x: a.x * ITILE, y: a.y * ITILE - up } : null;
    };
    switch (e.t) {
      case 'hit': {
        const d = pxy(e.dst);
        if (!d) break;
        const src = e.src
          ? (this.byId.get(e.src) ?? world.actors.find((x) => x.id === e.src))
          : undefined;
        const amt = Math.round(e.amount);
        if (d.a.isPlayer) {
          em.blood.explode(7, d.x, d.y);
          this.splat(d.x + (Math.random() - 0.5) * 14, d.y + 18, BLOOD, 0.35, 0.8);
          this.shake = Math.max(this.shake, 2);
        } else {
          em.bone.explode(e.crit ? 5 : 2, d.x, d.y);
          em.ink.explode(e.crit ? 8 : 4, d.x, d.y);
          if (e.dtype === 3) em.flame.explode(4, d.x, d.y);
          else if (e.dtype === 2) em.shard.explode(5, d.x, d.y);
          else if (e.dtype === 1) em.star.explode(4, d.x, d.y);
          if (Math.random() < 0.2)
            this.splat(d.x + (Math.random() - 0.5) * 12, d.y + 14, 0x1c1612, 0.25, 0.6);
        }
        if (e.crit) {
          this.shake = Math.max(this.shake, 5);
          this.punch = 0.04;
          this.rays(d.x, d.y, 0xa3201c, 0.9);
          this.splat(d.x, d.y + 14, BLOOD, 0.5, 0.85);
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
            d.a.isPlayer ? BLOOD : e.crit ? BLOOD : 0x1c1612,
            e.crit,
          );
        break;
      }
      case 'miss': {
        const d = pxy(e.dst);
        if (d) this.floater(d.x, d.y - 10, 'miss', 0x6a5a48, false);
        break;
      }
      case 'block': {
        const d = pxy(e.dst);
        if (d) {
          em.star.explode(6, d.x, d.y);
          this.floater(d.x, d.y - 10, 'parry', 0x4a5a78, false);
        }
        break;
      }
      case 'death': {
        const d = pxy(e.id, 10);
        if (!d || d.a.isPlayer) break;
        const big = d.a.rarity === 'boss' || d.a.rarity === 'miniboss' || d.a.rarity === 'rare';
        em.ink.explode(big ? 22 : 10, d.x, d.y);
        em.bone.explode(big ? 14 : 6, d.x, d.y);
        this.splat(d.x, d.y + 10, 0x1c1612, big ? 0.8 : 0.4, 0.9);
        if (big) {
          this.rays(d.x, d.y, 0x1c1612, 1.2);
          this.shake = Math.max(this.shake, 6);
        }
        break;
      }
      case 'explode': {
        const x = e.x * ITILE;
        const y = e.y * ITILE;
        const col = DTYPE_WASH[e.dtype];
        this.bloom(x, y, col, Math.max(1.4, (e.r * ITILE) / 40));
        this.bloom(x, y, col, 0.9);
        if (e.dtype === 3) em.flame.explode(14, x, y);
        else if (e.dtype === 2) em.shard.explode(14, x, y);
        else if (e.dtype === 1) em.star.explode(12, x, y);
        else {
          em.ink.explode(16, x, y);
          this.rays(x, y, 0x1c1612, 1.3);
          this.shake = Math.max(this.shake, 8);
          this.splat(x, y, 0x1c1612, 0.9, 0.5);
        }
        this.splat(x, y, 0x1c1612, 0.4, 0.35);
        break;
      }
      case 'chain': {
        const a = pxy(e.from, 18);
        const b = pxy(e.to, 18);
        if (a && b) {
          const pts: { x: number; y: number }[] = [{ x: a.x, y: a.y }];
          const n = 6;
          for (let i = 1; i < n; i++)
            pts.push({
              x: a.x + ((b.x - a.x) * i) / n + (Math.random() - 0.5) * 16,
              y: a.y + ((b.y - a.y) * i) / n + (Math.random() - 0.5) * 16,
            });
          pts.push({ x: b.x, y: b.y });
          this.bolts.push({ pts, t: 0.26 });
          em.star.explode(4, b.x, b.y);
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
            ? 0xe8742a
            : tags.includes('cold')
              ? 0x4a9ad0
              : tags.includes('lightning')
                ? 0xe8c82a
                : 0x8a5ac0;
          this.bloom(a.x * ITILE + Math.cos(a.facing) * 14, a.y * ITILE - 20, col, 0.45);
        }
        break;
      }
      case 'stun': {
        const d = pxy(e.dst, 40);
        if (d) em.star.explode(5, d.x, d.y);
        break;
      }
      case 'levelUp': {
        const p = this.project(world.player.x, world.player.y);
        this.rays(p.x, p.y - 16, 0xf0c840, 1.6);
        this.bloom(p.x, p.y - 10, 0xf0c840, 1.8);
        em.star.explode(24, p.x, p.y - 16);
        this.floater(p.x, p.y - 56, `Level ${e.level}`, 0x1c1612, true);
        break;
      }
      case 'flaskUsed': {
        const f = world.flasks[e.idx];
        const p = this.project(world.player.x, world.player.y);
        this.bloom(
          p.x,
          p.y - 14,
          f?.spec.kind === 'mana' ? 0x4a78d0 : f?.spec.kind === 'utility' ? 0xf0c840 : BLOOD,
          0.9,
        );
        break;
      }
      case 'summon': {
        const d = pxy(e.id, 10);
        if (d) {
          this.bloom(d.x, d.y, 0x8a5ac0, 0.7);
          em.ink.explode(6, d.x, d.y);
        }
        break;
      }
      case 'exitOpen':
        if (this.portal) this.bloom(this.portal.spiral.x, this.portal.spiral.y, 0x3ac8c8, 2);
        break;
      case 'ailment': {
        const d = pxy(e.dst, 18);
        if (d && e.kind === 'freeze') em.shard.explode(8, d.x, d.y);
        break;
      }
    }
  }

  protected frame(world: World, dt: number): void {
    this.byId = new Map(world.actors.map((a) => [a.id, a]));
    const cam = this.scene.cameras.main;
    for (const f of this.flames) {
      f.flame.setScale(
        0.8 + Math.sin(this.time * 12 + f.seed) * 0.07,
        0.8 + Math.sin(this.time * 9 + f.seed * 2) * 0.1,
      );
      f.wash.setAlpha(0.26 + Math.sin(this.time * 6 + f.seed) * 0.05);
    }
    for (const a of world.actors) {
      if (!a.alive) continue;
      const v = this.views.get(a.id) as View | undefined;
      if (!v || v.data.gone) continue;
      v.data.acc += dt;
      if (v.data.acc < 0.14) continue;
      v.data.acc = 0;
      const x = a.x * ITILE + (Math.random() - 0.5) * 14;
      const y = a.y * ITILE - 16 - Math.random() * 14;
      if (a.ail.ignites.length) this.em.flame.emitParticleAt(x, y, 1);
      if (a.ail.shock > 0) this.em.star.emitParticleAt(x, y, 1);
      if (a.ail.chill > 0) this.em.shard.emitParticleAt(x, y, 1);
      if (a.ail.poisons.length) this.em.wdot.emitParticleAt(x, y, 1);
      if (a.ail.bleeds.length) this.em.blood.emitParticleAt(x, y, 1);
      if (a.stunT > 0)
        this.em.star.emitParticleAt(
          a.x * ITILE + Math.cos(this.time * 7) * 12,
          a.y * ITILE - 44,
          1,
        );
    }
    if (this.punch > 0.001) {
      this.punch *= Math.pow(0.0003, dt);
      cam.setZoom(ZOOM * (1 + this.punch));
    } else if (cam.zoom !== ZOOM) cam.setZoom(ZOOM);
  }

  protected destroyAll(): void {
    for (const o of this.owned) o.destroy();
    this.owned = [];
    for (const d of this.decals) d.destroy();
    this.decals = [];
    for (const f of this.floaters) f.destroy();
    this.floaters = [];
    this.flames = [];
    this.bolts = [];
    this.portal = null;
    const cam = this.scene.cameras.main;
    cam.setZoom(1);
    try {
      cam.filters.external.clear();
    } catch {
      /* ignore */
    }
  }
}
