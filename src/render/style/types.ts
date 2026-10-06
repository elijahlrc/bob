import type { StyleId } from '../../data/styles';
import type { SimEvent, World } from '../../sim/types';

/** A visual style for the map view. Each style owns its own sprites, tiles, effects and camera. */
export interface MapStyle {
  readonly id: StyleId;
  /** Build everything for a new map. */
  build(world: World): void;
  /** Per-frame sync of sprites, lights and particles from sim state. `dt` is in seconds. */
  update(world: World, dt: number): void;
  /** Sim events produced since the last frame (hits, deaths, ...). */
  onEvents(events: SimEvent[], world: World): void;
  /** Highlight (and show life/affix marks for) the inspected enemy. */
  setSelected(id: number | null): void;
  /** The actor under a world-space point (an enemy), or null. Used for click-to-inspect. */
  pick(wx: number, wy: number): number | null;
  destroy(): void;
}

export type { StyleId } from '../../data/styles';
export { STYLE_IDS, STYLE_INFO } from '../../data/styles';
