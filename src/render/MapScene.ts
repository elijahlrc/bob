import Phaser from 'phaser';
import type { Emitter } from '../core/events';
import type { BusEvents } from '../run/controller';
import type { World } from '../sim/types';
import type { MapStyle, StyleId } from './style/types';
import { makeStyle } from './styles';

/** Hosts the active visual style. The style reads sim state and never writes it (§8.2). */
export class MapScene extends Phaser.Scene {
  private bus!: Emitter<BusEvents>;
  private world: World | null = null;
  private style: MapStyle | null = null;
  private styleId: StyleId = 'grim';
  private selected: number | null = null;
  private unsub: (() => void)[] = [];

  constructor() {
    super('map');
  }

  init(data: { bus: Emitter<BusEvents>; style: StyleId }): void {
    this.bus = data.bus;
    this.styleId = data.style;
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
      this.bus.on('style', ({ id }) => {
        this.styleId = id;
        if (this.world) this.build(this.world);
      }),
    );
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (!this.style || !this.world || p.button !== 0) return;
      const id = this.style.pick(p.worldX, p.worldY);
      this.bus.emit('select', { id });
    });
    this.events.once('shutdown', () => this.unsub.forEach((u) => u()));
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
    this.style = makeStyle(this.styleId, this);
    this.style.build(world);
    this.style.setSelected(this.selected);
  }

  override update(_time: number, delta: number): void {
    this.bus.emit('frame', { dtMs: delta });
    if (this.world && this.style) this.style.update(this.world, Math.min(0.1, delta / 1000));
  }
}
