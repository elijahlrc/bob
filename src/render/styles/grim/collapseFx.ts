import Phaser from 'phaser';
import { measurePath, pathProgress } from '../../../sim/collapse';
import type { World } from '../../../sim/types';
import { ISO_H, ISO_W } from './isoPaint';

/** Tiles of the way that fall together: each such band is baked into one image when the front passes it. */
const BAND = 2;
/** The glowing edge covers the next band, so it shows ahead of the dark. */
const EDGE_COLOR = 0xff6a20;

type Tile = { x: number; y: number; p: number };

/**
 * The Collapse (docs/MAPS.md 9.2) drawn on the floor: every floor tile the front has passed turns to dark rubble, and the
 * tiles about to fall glow along the edge. Tiles are ranked by how far along the way they are, baked a band at a time
 * into small images (cheap to draw), and the edge is redrawn every frame.
 */
export class CollapseFx {
  private bands: Tile[][] = [];
  private next = 0;
  private images: Phaser.GameObjects.Image[] = [];
  private keys: string[] = [];
  private edge: Phaser.GameObjects.Graphics;
  private t = 0;

  private scene: Phaser.Scene;
  private project: (x: number, y: number) => { x: number; y: number };

  constructor(
    scene: Phaser.Scene,
    project: (x: number, y: number) => { x: number; y: number },
    world: World,
  ) {
    this.scene = scene;
    this.project = project;
    const lab = world.plan.lab;
    const m = measurePath(lab);
    const tiles: Tile[] = [];
    for (let y = 0; y < lab.h; y++)
      for (let x = 0; x < lab.w; x++)
        if (lab.tiles[y * lab.w + x] === 1)
          tiles.push({ x, y, p: pathProgress(m, x + 0.5, y + 0.5) });
    tiles.sort((a, b) => a.p - b.p);
    for (const t of tiles) {
      const i = Math.floor(t.p / BAND);
      (this.bands[i] ??= []).push(t);
    }
    // Empty bands (a gap in the ranking) are skipped by keeping only the used ones, in order.
    this.bands = this.bands.filter((b) => b && b.length > 0);
    this.edge = scene.add.graphics().setDepth(4.9);
  }

  /** The way a tile is hidden by the fall: dark rubble with a few lighter chips. */
  private bake(band: Tile[], index: number, seed: number): void {
    const proj = band.map((t) => ({ t, p: this.project(t.x, t.y) }));
    const minX = Math.min(...proj.map((q) => q.p.x)) - ISO_W / 2;
    const minY = Math.min(...proj.map((q) => q.p.y));
    const maxX = Math.max(...proj.map((q) => q.p.x)) + ISO_W / 2;
    const maxY = Math.max(...proj.map((q) => q.p.y)) + ISO_H;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil(maxX - minX);
    cv.height = Math.ceil(maxY - minY);
    const c = cv.getContext('2d')!;
    for (const { t, p } of proj) {
      const cx = p.x - minX;
      const cy = p.y - minY;
      c.fillStyle = 'rgba(20,9,7,0.93)';
      c.beginPath();
      c.moveTo(cx, cy);
      c.lineTo(cx + ISO_W / 2, cy + ISO_H / 2);
      c.lineTo(cx, cy + ISO_H);
      c.lineTo(cx - ISO_W / 2, cy + ISO_H / 2);
      c.closePath();
      c.fill();
      // A few chips of rubble, from a hash of the tile so they stay put.
      for (let k = 0; k < 3; k++) {
        const h =
          Math.imul(t.x * 73856093 + t.y * 19349663 + k * 83492791 + seed, 2654435761) >>> 0;
        const dx = ((h & 255) / 255 - 0.5) * ISO_W * 0.5;
        const dy = (((h >> 8) & 255) / 255 - 0.5) * ISO_H * 0.5;
        const g = 28 + ((h >> 16) & 31);
        c.fillStyle = `rgb(${g + 10},${g},${g - 4})`;
        c.fillRect(Math.round(cx + dx), Math.round(cy + ISO_H / 2 + dy), 2, 1);
      }
      // Now and then an ember still glows in the rubble.
      const e = Math.imul(t.x * 2246822519 + t.y * 3266489917 + seed, 668265263) >>> 0;
      if (e % 9 === 0) {
        c.fillStyle = 'rgb(255,120,40)';
        c.fillRect(
          Math.round(cx + ((e >> 8) % 11) - 5),
          Math.round(cy + ISO_H / 2 + ((e >> 12) % 5) - 2),
          1,
          1,
        );
      }
    }
    const key = `gcol_${seed}_${index}`;
    this.scene.textures.addCanvas(key, cv);
    this.keys.push(key);
    const img = this.scene.add.image(minX, minY, key).setOrigin(0, 0).setDepth(4);
    this.images.push(img);
  }

  /** Bake the bands the front has passed, and glow along the edge. */
  update(world: World, dt: number): void {
    this.t += dt;
    const front = world.collapseFront;
    const seed = world.plan.seed & 0xffff;
    while (this.next < this.bands.length && this.bands[this.next][0].p + BAND <= front)
      this.bake(this.bands[this.next], this.next++, seed);
    const g = this.edge;
    g.clear();
    if (front <= 0) return;
    // The band being eaten, and the one after it, glow; the closer to the front, the brighter.
    for (let b = this.next; b < Math.min(this.bands.length, this.next + 2); b++)
      for (const t of this.bands[b]) {
        const ahead = t.p - front;
        if (ahead > BAND * 2) continue;
        const fallen = ahead <= 0;
        const p = this.project(t.x, t.y);
        const flick = 0.75 + 0.25 * Math.sin(this.t * 14 + t.x * 1.7 + t.y * 2.3);
        const a = fallen ? 0.9 : Math.max(0, 0.75 * (1 - ahead / (BAND * 2))) * flick;
        if (a <= 0.02) continue;
        g.fillStyle(fallen ? 0x0a0606 : EDGE_COLOR, a);
        g.fillPoints(
          [
            new Phaser.Math.Vector2(p.x, p.y),
            new Phaser.Math.Vector2(p.x + ISO_W / 2, p.y + ISO_H / 2),
            new Phaser.Math.Vector2(p.x, p.y + ISO_H),
            new Phaser.Math.Vector2(p.x - ISO_W / 2, p.y + ISO_H / 2),
          ],
          true,
        );
      }
  }

  destroy(): void {
    this.edge.destroy();
    for (const i of this.images) i.destroy();
    for (const k of this.keys) if (this.scene.textures.exists(k)) this.scene.textures.remove(k);
    this.images = [];
    this.keys = [];
  }
}
