import type { SimEvent, World } from '../../sim/types';

/** A visual style for the map view. Each style owns its own sprites, tiles, effects and camera. */
export interface MapStyle {
  /** Build everything for a new map. */
  build(world: World): void;
  /** Per-frame sync of sprites, lights and particles from sim state. `dt` is in seconds. */
  update(world: World, dt: number): void;
  /** Sim events produced since the last frame (hits, deaths, ...). */
  onEvents(events: SimEvent[], world: World): void;
  /** Highlight (and show life/affix marks for) the inspected enemy. */
  setSelected(id: number | null): void;
  /** The actor under a world-space point (an enemy), or null. Used for click-to-inspect. `slop` widens every body
   * by that many world pixels (a fingertip covers more than a mouse pointer). */
  pick(wx: number, wy: number, slop?: number): number | null;
  /** The game area changed size (a rotation, a resized window): pick the pixel zoom again. */
  resize?(width: number, height: number): void;
  destroy(): void;
}
