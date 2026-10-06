import { Emitter } from '../core/events';
import { DT } from '../data/constants';
import { worldResult, type MapResult } from '../sim/runMap';
import type { SimEvent, World } from '../sim/types';
import { createWorld, stepWorld } from '../sim/world';
import { finishMap, newRun, passivePoints, planFor, worldOptsFor, type RunState } from './run';
import { clearSave, loadRun, saveRun, type KeyValueStore, type LoadResult } from './save';

export type Screen = 'title' | 'classSelect' | 'camp' | 'map' | 'summary' | 'victory';

export type BusEvents = {
  /** Run or screen state changed (UI re-renders). */
  state: null;
  /** A map started; the renderer builds its scene from the world. */
  mapStart: { world: World };
  /** The current map ended; the renderer tears down. */
  mapEnd: null;
  /** The renderer's frame tick; the controller steps the sim. */
  frame: { dtMs: number };
  /** Sim events produced during the last frame (renderer and HUD). */
  ticked: { world: World; events: SimEvent[] };
};

export const SPEEDS = [1, 2, 4, 8] as const;

/** Drives screens and the in-map sim. Headless: talks to render and UI only through the bus. */
export class Controller {
  readonly bus = new Emitter<BusEvents>();
  screen: Screen = 'title';
  run: RunState | null = null;
  world: World | null = null;
  lastResult: MapResult | null = null;
  speed = 1;
  paused = false;
  private acc = 0;

  private store: KeyValueStore | null;
  /** Result of looking for a saved run at boot. */
  saved: LoadResult = { status: 'none' };

  constructor(store: KeyValueStore | null = null) {
    this.store = store;
    if (store) this.saved = loadRun(store);
    this.bus.on('frame', ({ dtMs }) => this.onFrame(dtMs));
  }

  private changed(): void {
    // The game saves on entering camp and on any camp change (§5.5).
    if (this.store && this.run && this.screen === 'camp') saveRun(this.store, this.run);
    this.bus.emit('state', null);
  }

  /** Resume the saved run at camp. */
  continueRun(): void {
    if (this.saved.status !== 'ok') return;
    this.run = this.saved.run;
    this.lastResult = null;
    this.goTo('camp');
  }

  /** Discard an incompatible or unwanted save. */
  discardSave(): void {
    if (this.store) clearSave(this.store);
    this.saved = { status: 'none' };
    this.changed();
  }

  goTo(screen: Screen): void {
    this.screen = screen;
    this.changed();
  }

  startRun(classId: string, seed: number): void {
    this.run = newRun(classId, seed);
    this.lastResult = null;
    this.goTo('camp');
  }

  /** Start the next map with one of the two offered themes. */
  startMap(themeIdx = 0): void {
    const run = this.run;
    if (!run) return;
    const plan = planFor(run, run.nextThemes[themeIdx] ?? run.nextThemes[0]);
    run.newLoot = [];
    this.world = createWorld({ plan, build: run.build, xp: run.xp, opts: worldOptsFor(run, plan) });
    this.acc = 0;
    this.screen = 'map';
    this.bus.emit('mapStart', { world: this.world });
    this.changed();
  }

  setSpeed(s: number): void {
    this.speed = s;
    this.paused = false;
    this.changed();
  }

  togglePause(): void {
    this.paused = !this.paused;
    this.changed();
  }

  private onFrame(dtMs: number): void {
    const w = this.world;
    if (!w || this.screen !== 'map') return;
    const events: SimEvent[] = [];
    if (!this.paused && w.status === 'running') {
      // Clamp long frames (tab switches) so we never spiral.
      this.acc += Math.min(dtMs / 1000, 0.1) * this.speed;
      let n = 0;
      while (this.acc >= DT && n < 60 && w.status === 'running') {
        stepWorld(w);
        for (const e of w.events) events.push(e);
        this.acc -= DT;
        n++;
      }
    }
    this.bus.emit('ticked', { world: w, events });
    if (w.status !== 'running') this.endMap();
  }

  private endMap(): void {
    const w = this.world;
    const run = this.run;
    if (!w || !run) return;
    const res = worldResult(w);
    this.lastResult = res;
    finishMap(run, res);
    this.world = null;
    this.bus.emit('mapEnd', null);
    if (run.phase !== 'camp' && this.store) {
      clearSave(this.store);
      this.saved = { status: 'none' };
    }
    this.goTo(run.phase === 'dead' ? 'summary' : run.phase === 'victory' ? 'victory' : 'camp');
  }

  /** Apply a change to the run in camp and notify the UI. */
  act<T>(fn: (run: RunState) => T): T | undefined {
    if (!this.run) return undefined;
    const r = fn(this.run);
    this.changed();
    return r;
  }

  setAutoContinue(on: boolean): void {
    if (!this.run) return;
    this.run.autoContinue = on;
    this.changed();
  }

  /**
   * Auto-continue applies only when nothing needs the player's attention (§5.3): no unspent
   * passive points, no pending reward and no new unique or rare item.
   */
  canAutoContinue(): boolean {
    const run = this.run;
    if (!run || run.phase !== 'camp') return false;
    return passivePoints(run) <= 0 && !run.reward && run.newLoot.length === 0;
  }

  /** Abandon the run and return to the title screen. */
  quit(): void {
    if (this.world) this.bus.emit('mapEnd', null);
    this.world = null;
    if (this.store) this.saved = loadRun(this.store);
    this.run = null;
    this.goTo('title');
  }

  /** Abandon the current run entirely (deletes the save). */
  abandon(): void {
    if (this.store) clearSave(this.store);
    this.saved = { status: 'none' };
    this.quit();
  }
}
