import Phaser from 'phaser';
import type { Emitter } from '../core/events';
import type { BusEvents } from '../run/controller';
import type { World } from '../sim/types';
import type { MapStyle } from './style/types';
import { GrimStyle } from './styles/grim';

/** Hosts the active visual style. The style reads sim state and never writes it (§8.2). */
export class MapScene extends Phaser.Scene {
  private bus!: Emitter<BusEvents>;
  private world: World | null = null;
  private style: MapStyle | null = null;
  private selected: number | null = null;
  private unsub: (() => void)[] = [];

  constructor() {
    super('map');
  }

  init(data: { bus: Emitter<BusEvents> }): void {
    this.bus = data.bus;
  }

  create(): void {
    this.unsub.push(
      this.bus.on('mapStart', ({ world }) => this.build(world)),
      this.bus.on('mapEnd', () => this.clear()),
      this.bus.on('ticked', ({ events, world }) => {
        if (this.world === world) this.style?.onEvents(events, world);
      }),
      this.bus.on('select', ({ id }) => {
        this.selected = id;
        this.style?.setSelected(id);
      }),
    );
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (!this.style || !this.world || p.button !== 0) return;
      // A fingertip covers about 14 screen pixels around its centre; a mouse pointer none.
      const slop = p.wasTouch ? 14 / this.cameras.main.zoom : 0;
      const id = this.style.pick(p.worldX, p.worldY, slop);
      this.bus.emit('select', { id });
    });
    const onResize = (size: Phaser.Structs.Size) => this.style?.resize?.(size.width, size.height);
    this.scale.on('resize', onResize);
    this.events.once('shutdown', () => {
      this.scale.off('resize', onResize);
      this.unsub.forEach((u) => u());
    });
  }

  private clear(): void {
    this.selected = null;
    this.style?.destroy();
    this.style = null;
    this.world = null;
  }

  private build(world: World): void {
    this.style?.destroy();
    this.world = world;
    this.style = new GrimStyle(this);
    this.style.build(world);
    this.style.setSelected(this.selected);
  }

  override update(_time: number, delta: number): void {
    this.bus.emit('frame', { dtMs: delta });
    if (this.world && this.style) this.style.update(this.world, Math.min(0.1, delta / 1000));
  }
}
