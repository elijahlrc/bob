import { Emitter } from '../core/events';
import { DT } from '../data/constants';
import { worldResult, type MapResult } from '../sim/runMap';
import type { SimEvent, World } from '../sim/types';
import { cancelAbandon, requestAbandon } from '../sim/abandon';
import { createWorld, stepWorld } from '../sim/world';
import { mapTypeDef } from '../data/mapTypes';
import { CLASSES } from '../data/classes';
import { botCamp } from './bot';
import { galleryEntries, galleryRun, galleryWorld, type GalleryEntry } from './gallery';
import { completeTabletSets } from './craft';
import { loadFound, recordFound } from './codex';
import {
  finishMap,
  newRun,
  passivePoints,
  planFor,
  setMap,
  takeRespite,
  worldOptsFor,
  type RunState,
} from './run';
import { clearSave, loadRun, saveRun, SAVE_KEY, type KeyValueStore, type LoadResult } from './save';

/** Auto-continue pauses when life or any flask is below this fraction (docs/MAPS.md 10.2). */
export const AUTO_PAUSE_BELOW = 0.5;

export type Screen = 'title' | 'classSelect' | 'camp' | 'map' | 'summary' | 'victory' | 'codex';

export type BusEvents = {
  /** The inspected enemy changed (click on the map; null clears). */
  select: { id: number | null };
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

/** Seconds of game time each skill gets in the gallery before the next one comes up. */
const GALLERY_SECONDS = 14;

/** Drives screens and the in-map sim. Headless: talks to render and UI only through the bus. */
export class Controller {
  readonly bus = new Emitter<BusEvents>();
  screen: Screen = 'title';
  run: RunState | null = null;
  world: World | null = null;
  lastResult: MapResult | null = null;
  speed = 1;
  paused = false;
  /** Enemy picked for inspection on the map. */
  selectedId: number | null = null;
  private acc = 0;

  private store: KeyValueStore | null;
  /** The gems and uniques this browser has found (the Codex). */
  found(): Set<string> {
    return loadFound(this.store);
  }

  /** Result of looking for a saved run at boot. */
  saved: LoadResult = { status: 'none' };

  constructor(store: KeyValueStore | null = null) {
    this.store = store;
    if (store) {
      this.saved = loadRun(store);
    }
    this.bus.on('frame', ({ dtMs }) => this.onFrame(dtMs));
    this.bus.on('select', ({ id }) => (this.selectedId = id));
  }

  private changed(): void {
    // The game saves on entering camp and on any camp change (§5.5).
    if (this.store && this.run && this.screen === 'camp') {
      saveRun(this.store, this.run);
      recordFound(this.store, this.run);
    }
    this.bus.emit('state', null);
  }

  /** Showcase mode: an endless, invulnerable demo that cycles classes (for comparing visual styles). */
  showcase: { classIdx: number; boss: boolean; runs: number } | null = null;

  startShowcase(boss = false): void {
    this.showcase = { classIdx: 0, boss, runs: 0 };
    this.launchShowcase();
  }

  /** Next class in the showcase (also used when a showcase map ends). */
  nextShowcaseClass(): void {
    if (!this.showcase) return;
    this.showcase.classIdx = (this.showcase.classIdx + 1) % CLASSES.length;
    this.launchShowcase();
  }

  private launchShowcase(): void {
    const sc = this.showcase!;
    if (this.world) this.bus.emit('mapEnd', null);
    const cls = CLASSES[sc.classIdx];
    const run = newRun(cls.id, 1000 + sc.classIdx * 17 + sc.runs++ * 101);
    run.build.level = sc.boss ? 100 : 45;
    setMap(run, sc.boss ? 100 : 30);
    botCamp(run);
    this.run = run;
    const plan = planFor(run, run.offers[0]);
    this.world = createWorld({
      plan,
      build: run.build,
      xp: 0,
      opts: { ...worldOptsFor(run, plan), godMode: true, freeResources: true, maxTime: 900 },
    });
    this.acc = 0;
    this.screen = 'map';
    this.bus.emit('select', { id: null });
    this.bus.emit('mapStart', { world: this.world });
    this.bus.emit('state', null);
  }

  /** The skill gallery: one skill at a time against training dummies, on a timer or by choice (see gallery.ts). */
  gallery: { idx: number; entries: GalleryEntry[]; runs: number } | null = null;

  startGallery(): void {
    this.gallery = { idx: 0, entries: galleryEntries(), runs: 0 };
    this.launchGallery();
  }

  /** Show another skill: the next (1), the previous (-1) or a given place in the list. */
  galleryGo(to: number | 'next' | 'prev'): void {
    const g = this.gallery;
    if (!g) return;
    const n = g.entries.length;
    g.idx = to === 'next' ? (g.idx + 1) % n : to === 'prev' ? (g.idx + n - 1) % n : to;
    this.launchGallery();
  }

  private launchGallery(): void {
    const g = this.gallery!;
    if (this.world) this.bus.emit('mapEnd', null);
    const run = galleryRun(g.entries[g.idx], 4000 + g.runs++);
    this.run = run;
    this.world = galleryWorld(run, g.entries[g.idx]);
    this.acc = 0;
    this.screen = 'map';
    this.bus.emit('select', { id: null });
    this.bus.emit('mapStart', { world: this.world });
    this.bus.emit('state', null);
  }

  exitShowcase(): void {
    if (this.world) this.bus.emit('mapEnd', null);
    this.world = null;
    this.gallery = null;
    this.showcase = null;
    this.run = null;
    this.goTo('title');
  }

  /** Resume the saved run at camp. */
  continueRun(): void {
    if (this.saved.status !== 'ok') return;
    this.run = this.saved.run;
    this.undoStack = [];
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
    this.undoStack = [];
    this.lastResult = null;
    this.goTo('camp');
  }

  /** Start the next map with one of the offered maps. */
  startMap(offerIdx = 0): void {
    const run = this.run;
    if (!run) return;
    const offer = run.offers[offerIdx] ?? run.offers[0];
    // A Respite is no map: the level passes and the character is whole again.
    if (offer.kind === 'respite') {
      this.undoStack = [];
      this.lastResult = null;
      takeRespite(run);
      this.changed();
      return;
    }
    const plan = planFor(run, offer);
    run.newLoot = [];
    this.undoStack = [];
    this.world = createWorld({ plan, build: run.build, xp: run.xp, opts: worldOptsFor(run, plan) });
    this.acc = 0;
    this.screen = 'map';
    this.bus.emit('select', { id: null });
    this.bus.emit('mapStart', { world: this.world });
    this.changed();
  }

  /** The Abandon button: start the escape timer (the map ends when it runs out). */
  abandonMap(): void {
    if (this.world && requestAbandon(this.world)) this.changed();
  }

  cancelAbandon(): void {
    if (this.world && cancelAbandon(this.world)) this.changed();
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
    if (this.gallery && w.t > GALLERY_SECONDS) this.galleryGo('next');
    else if (w.status !== 'running') this.endMap();
  }

  private endMap(): void {
    const w = this.world;
    const run = this.run;
    if (!w || !run) return;
    if (this.gallery) {
      this.galleryGo('next');
      return;
    }
    if (this.showcase) {
      this.nextShowcaseClass();
      return;
    }
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

  private undoStack: string[] = [];

  /** The parts of a run a camp change can touch (undo snapshots). */
  private snapshot(run: RunState): string {
    const { build, inventory, nextUid, bonusPoints, refundPoints, reward, newLoot } = run;
    const { currency, dust, tablets } = run;
    return JSON.stringify({
      build,
      inventory,
      nextUid,
      bonusPoints,
      refundPoints,
      reward,
      newLoot,
      currency,
      dust,
      tablets,
    });
  }

  /** Apply a change to the run in camp and notify the UI. Changes can be undone. */
  act<T>(fn: (run: RunState) => T): T | undefined {
    if (!this.run) return undefined;
    const before = this.snapshot(this.run);
    const r = fn(this.run);
    if (this.snapshot(this.run) !== before) {
      this.undoStack.push(before);
      if (this.undoStack.length > 40) this.undoStack.shift();
    }
    this.changed();
    return r;
  }

  /**
   * A craft or a salvage. It clears the undo history (EXPANSION 8.4): crafting is final, and an undo
   * could otherwise turn a draw into a free retry.
   */
  craft<T>(fn: (run: RunState) => T): T | undefined {
    if (!this.run) return undefined;
    const r = fn(this.run);
    this.undoStack = [];
    this.changed();
    return r;
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /** Revert the last camp change (equip, socket, passive point, reward pick ...). */
  undo(): boolean {
    const prev = this.undoStack.pop();
    if (!prev || !this.run) return false;
    Object.assign(this.run, JSON.parse(prev));
    this.changed();
    return true;
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
    return this.autoBlocker() === null;
  }

  /** Why auto-continue is paused (shown in the camp), or null when nothing needs attention. */
  autoBlocker(): string | null {
    const run = this.run;
    if (!run || run.phase !== 'camp') return 'not in camp';
    const pts = passivePoints(run);
    if (pts > 0) return `${pts} unspent passive point${pts === 1 ? '' : 's'}`;
    if (run.reward) return 'a reward is waiting to be picked';
    if (run.pendingCraft) return 'a craft is waiting for you to pick a result';
    const set = completeTabletSets(run);
    if (set.length)
      return `${set.length} tablet set${set.length === 1 ? '' : 's'} to redeem (open the Workbench)`;
    if (run.newLoot.length > 0)
      return `${run.newLoot.length} new rare/unique item${run.newLoot.length === 1 ? '' : 's'} (open Items)`;
    // The next map is the anchor: stop if it is not the plain map auto-continue is meant for, or the character is worn down.
    if (run.offers[0].type !== 'plain')
      return `the first map is a ${mapTypeDef(run.offers[0].type).name} map`;
    if (run.vitals.life < AUTO_PAUSE_BELOW) return 'life is low';
    if (Object.values(run.vitals.flasks).some((f) => f < AUTO_PAUSE_BELOW)) return 'a flask is low';
    return null;
  }

  /** The raw saved run (for bug reports), or null. */
  exportSave(): string | null {
    return this.store?.getItem(SAVE_KEY) ?? null;
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
