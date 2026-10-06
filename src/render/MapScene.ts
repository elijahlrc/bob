import Phaser from 'phaser';
import type { Emitter } from '../core/events';
import { classDef } from '../data/classes';
import type { BusEvents } from '../run/controller';
import type { Actor, SimEvent, World } from '../sim/types';
import {
  DTYPE_COLORS,
  RARITY_COLORS,
  TILE,
  VARIANT_TINTS,
  makeEntityTextures,
  makeTileset,
} from './textures';

type Floater = { text: Phaser.GameObjects.Text; t: number; vy: number };
type Flash = {
  kind: 'ring' | 'chain';
  x: number;
  y: number;
  x2: number;
  y2: number;
  r: number;
  color: number;
  t: number;
  total: number;
};

const MAX_FLOATERS = 40;

/** Renders the current map from sim state. Never writes sim state (§8.2). */
export class MapScene extends Phaser.Scene {
  private bus!: Emitter<BusEvents>;
  private world: World | null = null;
  private layer: Phaser.Tilemaps.TilemapLayer | null = null;
  private map: Phaser.Tilemaps.Tilemap | null = null;
  private sprites = new Map<number, Phaser.GameObjects.Image>();
  private rings = new Map<number, Phaser.GameObjects.Image>();
  private projSprites = new Map<number, Phaser.GameObjects.Image>();
  private dropSprites = new Map<number, Phaser.GameObjects.Image>();
  private chestSprites = new Map<number, Phaser.GameObjects.Image>();
  private exitSprite: Phaser.GameObjects.Image | null = null;
  private overlay!: Phaser.GameObjects.Graphics;
  private floaters: Floater[] = [];
  private flashes: Flash[] = [];
  private unsub: (() => void)[] = [];

  constructor() {
    super('map');
  }

  init(data: { bus: Emitter<BusEvents> }): void {
    this.bus = data.bus;
  }

  create(): void {
    makeEntityTextures(this);
    this.overlay = this.add.graphics().setDepth(20);
    this.unsub.push(
      this.bus.on('mapStart', ({ world }) => this.build(world)),
      this.bus.on('mapEnd', () => this.clear()),
      this.bus.on('ticked', ({ events }) => this.onEvents(events)),
    );
    this.events.once('shutdown', () => this.unsub.forEach((u) => u()));
  }

  private clear(): void {
    this.world = null;
    this.layer?.destroy();
    this.map?.destroy();
    this.layer = null;
    this.map = null;
    for (const m of [
      this.sprites,
      this.rings,
      this.projSprites,
      this.dropSprites,
      this.chestSprites,
    ]) {
      for (const s of m.values()) s.destroy();
      m.clear();
    }
    this.exitSprite?.destroy();
    this.exitSprite = null;
    for (const f of this.floaters) f.text.destroy();
    this.floaters = [];
    this.flashes = [];
    this.overlay.clear();
  }

  private build(world: World): void {
    this.clear();
    this.world = world;
    const lab = world.plan.lab;
    const theme = world.plan.theme;
    const key = `tiles_${theme.id}`;
    makeTileset(this, key, theme.floor, theme.wall);
    const data: number[][] = [];
    for (let y = 0; y < lab.h; y++) {
      const row: number[] = [];
      for (let x = 0; x < lab.w; x++) {
        const floor = lab.tiles[y * lab.w + x] === 1;
        if (floor) row.push((x * 7 + y * 13) % 5 === 0 ? 1 : 0);
        else {
          const below = y + 1 < lab.h && lab.tiles[(y + 1) * lab.w + x] === 1;
          row.push(below ? 3 : 2);
        }
      }
      data.push(row);
    }
    this.map = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
    const ts = this.map.addTilesetImage(key, key, TILE, TILE)!;
    this.layer = this.map.createLayer(0, ts, 0, 0) as Phaser.Tilemaps.TilemapLayer;
    this.layer.setDepth(0);
    this.exitSprite = this.add
      .image(lab.exit.x * TILE, lab.exit.y * TILE, 'exit')
      .setDepth(1)
      .setAlpha(0.25);
    for (const c of world.chests)
      this.chestSprites.set(c.id, this.add.image(c.x * TILE, c.y * TILE, 'chest').setDepth(2));
    const cam = this.cameras.main;
    cam.setBounds(-TILE * 4, -TILE * 4, (lab.w + 8) * TILE, (lab.h + 8) * TILE);
    cam.setZoom(1.25);
    cam.centerOn(world.player.x * TILE, world.player.y * TILE);
  }

  private actorSprite(a: Actor): Phaser.GameObjects.Image {
    let s = this.sprites.get(a.id);
    if (s) return s;
    if (a.isPlayer) {
      s = this.add.image(0, 0, 'player').setTint(classDef(this.world!.build.classId).color);
    } else {
      const spec = a.mon!.spec;
      s = this.add.image(0, 0, spec.type).setTint(VARIANT_TINTS[spec.variant] ?? 0xffffff);
      const scale = spec.rarity === 'boss' ? 2.2 : spec.rarity === 'miniboss' ? 1.35 : 1;
      s.setScale(scale);
      const rc = RARITY_COLORS[spec.rarity];
      if (rc !== undefined) {
        const ring = this.add.image(0, 0, 'ring').setTint(rc).setDepth(4);
        ring.setScale(((a.r * 2 + 0.3) * TILE) / 64);
        this.rings.set(a.id, ring);
      }
    }
    s.setDepth(a.isPlayer ? 6 : 5);
    this.sprites.set(a.id, s);
    return s;
  }

  private onEvents(events: SimEvent[]): void {
    const w = this.world;
    if (!w) return;
    const byId = new Map(w.actors.map((a) => [a.id, a]));
    for (const e of events) {
      switch (e.t) {
        case 'hit': {
          const dst = byId.get(e.dst);
          if (!dst || e.amount < 0.5) break;
          const color = dst.isPlayer ? 0xff5050 : DTYPE_COLORS[e.dtype];
          this.floater(dst.x, dst.y - dst.r, Math.round(e.amount).toString(), color, e.crit);
          break;
        }
        case 'miss':
        case 'block': {
          const dst = byId.get(e.dst);
          if (dst)
            this.floater(dst.x, dst.y - dst.r, e.t === 'miss' ? 'miss' : 'block', 0xaaaaaa, false);
          break;
        }
        case 'explode':
          this.flashes.push({
            kind: 'ring',
            x: e.x,
            y: e.y,
            x2: 0,
            y2: 0,
            r: e.r,
            color: DTYPE_COLORS[e.dtype],
            t: 0.35,
            total: 0.35,
          });
          break;
        case 'chain': {
          const a = byId.get(e.from);
          const b = byId.get(e.to);
          if (a && b)
            this.flashes.push({
              kind: 'chain',
              x: a.x,
              y: a.y,
              x2: b.x,
              y2: b.y,
              r: 0,
              color: DTYPE_COLORS[1],
              t: 0.2,
              total: 0.2,
            });
          break;
        }
        case 'levelUp':
          this.floater(w.player.x, w.player.y - 1, `Level ${e.level}!`, 0xffe060, true);
          break;
        case 'stuck':
          this.floater(w.player.x, w.player.y - 1, 'unstuck', 0xff60ff, false);
          break;
      }
    }
  }

  private floater(x: number, y: number, s: string, color: number, big: boolean): void {
    if (this.floaters.length >= MAX_FLOATERS) {
      const old = this.floaters.shift()!;
      old.text.destroy();
    }
    const text = this.add
      .text(x * TILE + (Math.random() - 0.5) * 12, y * TILE, s, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: big ? '18px' : '13px',
        fontStyle: big ? 'bold' : 'normal',
        color: '#' + color.toString(16).padStart(6, '0'),
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(30);
    this.floaters.push({ text, t: 0.9, vy: -40 });
  }

  override update(_time: number, delta: number): void {
    this.bus.emit('frame', { dtMs: delta });
    const w = this.world;
    const dt = delta / 1000;
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.t -= dt;
      f.text.y += f.vy * dt;
      f.text.setAlpha(Math.min(1, f.t * 2));
      if (f.t <= 0) {
        f.text.destroy();
        this.floaters.splice(i, 1);
      }
    }
    if (!w) return;
    this.sync(w, dt);
  }

  private sync(w: World, dt: number): void {
    const g = this.overlay;
    g.clear();
    // Actors.
    for (const a of w.actors) {
      const s = this.actorSprite(a);
      const ring = this.rings.get(a.id);
      if (!a.alive) {
        if (s.visible) {
          s.setVisible(false);
          ring?.setVisible(false);
        }
        continue;
      }
      s.setPosition(a.x * TILE, a.y * TILE);
      if (a.isPlayer) s.setRotation(a.facing);
      ring?.setPosition(a.x * TILE, a.y * TILE);
      const x = a.x * TILE;
      const y = a.y * TILE;
      const top = y - a.r * TILE * (a.rarity === 'boss' ? 2.4 : 1.3) - 6;
      // Life bar for damaged monsters.
      if (!a.isPlayer && a.life < a.def.maxLife) {
        const wBar = Math.max(24, a.r * TILE * 2);
        g.fillStyle(0x000000, 0.7).fillRect(x - wBar / 2, top, wBar, 4);
        g.fillStyle(0xd03030, 1).fillRect(
          x - wBar / 2,
          top,
          (wBar * Math.max(0, a.life)) / a.def.maxLife,
          4,
        );
      }
      // Ailment pips.
      const pips: number[] = [];
      if (a.ail.ignites.length) pips.push(DTYPE_COLORS[3]);
      if (a.ail.chill > 0 || a.ail.freezeT > 0) pips.push(DTYPE_COLORS[2]);
      if (a.ail.shock > 0) pips.push(DTYPE_COLORS[1]);
      if (a.ail.bleeds.length) pips.push(0xb01010);
      if (a.ail.poisons.length) pips.push(DTYPE_COLORS[4]);
      pips.forEach((c, i) =>
        g.fillStyle(c, 1).fillCircle(x - (pips.length - 1) * 4 + i * 8, top - 5, 3),
      );
      if (a.ail.freezeT > 0) g.lineStyle(2, 0xbfefff, 0.9).strokeCircle(x, y, a.r * TILE + 3);
      if (a.stunT > 0) {
        const t = w.t * 8;
        for (let i = 0; i < 5; i++) {
          const ang = t + (i / 5) * Math.PI * 2;
          g.fillStyle(0xffe060, 1).fillCircle(
            x + Math.cos(ang) * 10,
            top - 10 + Math.sin(ang) * 3,
            2,
          );
        }
      }
    }
    // Projectiles.
    const seen = new Set<number>();
    for (const p of w.projectiles) {
      seen.add(p.id);
      let s = this.projSprites.get(p.id);
      if (!s) {
        s = this.add.image(0, 0, 'proj').setDepth(8).setTint(DTYPE_COLORS[p.dtype]);
        if (p.explodeRadius > 0) s.setScale(1.6);
        this.projSprites.set(p.id, s);
      }
      s.setPosition(p.x * TILE, p.y * TILE);
    }
    for (const [id, s] of this.projSprites)
      if (!seen.has(id)) {
        s.destroy();
        this.projSprites.delete(id);
      }
    // Drops and chests.
    const dropIds = new Set(w.drops.map((d) => d.id));
    for (const d of w.drops)
      if (!this.dropSprites.has(d.id)) {
        const rarity =
          d.item.kind === 'item' ? d.item.rarity : d.item.kind === 'gem' ? 'gem' : 'flask';
        const tint =
          rarity === 'unique'
            ? 0xff9a2a
            : rarity === 'rare'
              ? 0xffd84a
              : rarity === 'magic'
                ? 0x6a8cff
                : rarity === 'gem'
                  ? 0x40e0c0
                  : rarity === 'flask'
                    ? 0xff6090
                    : 0xdddddd;
        this.dropSprites.set(
          d.id,
          this.add
            .image(d.x * TILE, d.y * TILE, 'drop')
            .setTint(tint)
            .setDepth(3),
        );
      }
    for (const [id, s] of this.dropSprites)
      if (!dropIds.has(id)) {
        s.destroy();
        this.dropSprites.delete(id);
      }
    for (const c of w.chests) if (c.opened) this.chestSprites.get(c.id)?.setAlpha(0.35);
    if (this.exitSprite) {
      this.exitSprite.setAlpha(w.exitOpen ? 1 : 0.25);
      if (w.exitOpen) this.exitSprite.rotation += dt * 2;
    }
    // Telegraphs.
    for (const e of w.effects) {
      const k = 1 - e.t / e.total;
      g.fillStyle(0xff2020, 0.15 + 0.25 * k).fillCircle(e.x * TILE, e.y * TILE, e.radius * TILE);
      g.lineStyle(2, 0xff4040, 0.9).strokeCircle(e.x * TILE, e.y * TILE, e.radius * TILE * k);
    }
    // Transient flashes.
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const f = this.flashes[i];
      f.t -= dt;
      if (f.t <= 0) {
        this.flashes.splice(i, 1);
        continue;
      }
      const a = f.t / f.total;
      if (f.kind === 'ring')
        g.lineStyle(3, f.color, a).strokeCircle(
          f.x * TILE,
          f.y * TILE,
          f.r * TILE * (1.2 - a * 0.4),
        );
      else g.lineStyle(2, f.color, a).lineBetween(f.x * TILE, f.y * TILE, f.x2 * TILE, f.y2 * TILE);
    }
    // Camera follows the player smoothly.
    const cam = this.cameras.main;
    const tx = w.player.x * TILE - cam.width / 2;
    const ty = w.player.y * TILE - cam.height / 2;
    const k = Math.min(1, dt * 6);
    cam.scrollX += (tx - cam.scrollX) * k;
    cam.scrollY += (ty - cam.scrollY) * k;
  }
}
