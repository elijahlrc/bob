import type { MonsterTypeId } from '../data/monsters';
import { Emitter } from '../core/events';
import { CRAFTING_OPEN, DT } from '../data/constants';
import { clampDifficulty, DEFAULT, type Difficulty } from '../data/difficulty';
import { worldResult, type MapResult } from '../sim/runMap';
import type { SimEvent, World } from '../sim/types';
import { cancelAbandon, requestAbandon } from '../sim/abandon';
import { createWorld, stepWorld } from '../sim/world';
import { CRAWL_SEGMENTS, mapTypeDef } from '../data/mapTypes';
import type { Build } from '../data/types';
import type { Vitals } from '../sim/types';
import { CLASSES } from '../data/classes';
import { botCamp } from './bot';
import type { MapOffer } from './offers';
import { combineCrawl } from './play';
import { galleryEntries, galleryRun, galleryWorld, type GalleryEntry } from './gallery';
import { completeTabletSets } from './craft';
import { pruneFound, unseenRares } from './found';
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
import {
  deleteSlot,
  listSlots,
  newSlot,
  saveSlot,
  slotKey,
  type KeyValueStore,
  type SlotId,
  type SlotSummary,
} from './save';

/** Auto-continue pauses when life or any flask is below this fraction (docs/MAPS.md 10.2). */
export const AUTO_PAUSE_BELOW = 0.5;

export type Screen =
  'title' | 'classSelect' | 'camp' | 'map' | 'summary' | 'victory' | 'codex' | 'patchNotes';

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
  /** The difficulty a new run starts with (set from the debug panel on the title screen; docs/ENEMIES.md 8.3). */
  startDifficulty: Difficulty = { ...DEFAULT };
  /** Enemy picked for inspection on the map. */
  selectedId: number | null = null;
  /** Paints a monster type as a picture (a data URL) for the menus; set by main.ts from the renderer, null headless. */
  portrait: ((type: MonsterTypeId) => string) | null = null;
  private acc = 0;

  private store: KeyValueStore | null;
  /** The gems and uniques this browser has found (the Codex). */
  found(): Set<string> {
    return loadFound(this.store);
  }

  /** Called once when a run ends, by a death or a win (anonymous run statistics: docs/TELEMETRY.md). */
  onRunEnd: ((run: RunState, res: MapResult) => void) | null = null;

  /** The saved runs found at boot, the most recently saved first (§5.5). */
  saves: SlotSummary[] = [];
  /** The slot the current run is saved in; null for showcase, gallery and runs without a store. */
  private slot: SlotId | null = null;
  /** True when the last save did not fit in the browser's storage (the camp warns about it). */
  saveFailed = false;

  constructor(store: KeyValueStore | null = null) {
    this.store = store;
    this.refreshSaves();
    this.bus.on('frame', ({ dtMs }) => this.onFrame(dtMs));
    this.bus.on('select', ({ id }) => (this.selectedId = id));
  }

  private refreshSaves(): void {
    this.saves = this.store ? listSlots(this.store) : [];
  }

  private changed(): void {
    // The game saves on entering camp and on any camp change (§5.5), into the run's own slot.
    if (this.store && this.run && this.screen === 'camp' && this.slot !== null) {
      try {
        saveSlot(this.store, this.slot, this.run);
        this.saveFailed = false;
      } catch {
        this.saveFailed = true;
      }
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
      opts: {
        ...worldOptsFor(run, plan),
        godMode: true,
        freeResources: true,
        maxTime: 900,
        autoAbandonAt: Infinity,
      },
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

  /** Resume a saved run at camp. */
  continueRun(id: SlotId): void {
    const found = this.saves.find((s) => s.id === id);
    if (!found || found.result.status !== 'ok') return;
    this.run = found.result.run;
    this.slot = id;
    this.undoStack = [];
    this.lastResult = null;
    this.goTo('camp');
  }

  /** Delete a save: an incompatible one, or one the player no longer wants. */
  discardSave(id: SlotId): void {
    if (this.store) deleteSlot(this.store, id);
    this.refreshSaves();
    this.changed();
  }

  goTo(screen: Screen): void {
    this.screen = screen;
    this.changed();
  }

  startRun(classId: string, seed: number): void {
    this.run = newRun(classId, seed, this.startDifficulty);
    // A new run gets a slot of its own: the saves of earlier runs stay as they are.
    this.slot = this.store ? newSlot(this.store) : null;
    this.undoStack = [];
    this.lastResult = null;
    this.goTo('camp');
  }

  /** The difficulty of the next new run. */
  setStartDifficulty(d: Partial<Difficulty>): void {
    this.startDifficulty = clampDifficulty({ ...this.startDifficulty, ...d });
    this.changed();
  }

  /** Change the settings of the run in progress; they apply from the next map, never to one being played (camp only). */
  setDifficulty(d: Partial<Difficulty>): void {
    const run = this.run;
    if (!run || run.phase !== 'camp' || this.screen !== 'camp') return;
    run.difficulty = clampDifficulty({ ...run.difficulty, ...d });
    this.changed();
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
    pruneFound(run);
    this.undoStack = [];
    // A Crawl is three maps in a row: this remembers where it is and what the character carries between them.
    this.crawl =
      offer.type === 'crawl'
        ? { offer, segment: 0, parts: [], build: run.build, xp: run.xp, start: run.vitals }
        : null;
    const plan = planFor(run, offer);
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
    let res = worldResult(w);
    const crawl = this.crawl;
    if (crawl) {
      crawl.parts.push(res);
      if (res.status === 'cleared' && crawl.segment < CRAWL_SEGMENTS - 1) {
        // The next map of the Crawl, at once: no camp, and the character is as the last map left it.
        crawl.segment++;
        crawl.build = { ...crawl.build, level: res.level };
        crawl.xp = res.xp;
        crawl.start = res.vitals;
        const plan = planFor(run, crawl.offer, crawl.segment);
        this.bus.emit('mapEnd', null);
        this.world = createWorld({
          plan,
          build: crawl.build,
          xp: crawl.xp,
          opts: { ...worldOptsFor(run, plan), start: crawl.start },
        });
        this.acc = 0;
        this.bus.emit('select', { id: null });
        this.bus.emit('mapStart', { world: this.world });
        this.changed();
        return;
      }
      res = combineCrawl(crawl.parts);
      this.crawl = null;
    }
    this.lastResult = res;
    finishMap(run, res);
    if (run.phase !== 'camp') this.onRunEnd?.(run, res);
    this.world = null;
    this.bus.emit('mapEnd', null);
    // A run that ended in death or victory leaves no save behind.
    if (run.phase !== 'camp' && this.store && this.slot !== null) {
      deleteSlot(this.store, this.slot);
      this.slot = null;
      this.refreshSaves();
    }
    this.goTo(run.phase === 'dead' ? 'summary' : run.phase === 'victory' ? 'victory' : 'camp');
  }

  /** The Crawl being played, if any (docs/MAPS.md 9.2). */
  private crawl: {
    offer: MapOffer;
    segment: number;
    parts: MapResult[];
    build: Build;
    xp: number;
    start: Vitals;
  } | null = null;

  private undoStack: string[] = [];

  /** The parts of a run a camp change can touch (undo snapshots). */
  private snapshot(run: RunState): string {
    const { build, inventory, nextUid, bonusPoints, refundPoints, reward } = run;
    const discarded = run.discarded ?? [];
    const { currency, dust, tablets } = run;
    return JSON.stringify({
      build,
      inventory,
      discarded,
      nextUid,
      bonusPoints,
      refundPoints,
      reward,
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
    // (With crafting closed there is no way to pick a result or redeem a set, so neither holds auto-continue up.)
    if (CRAFTING_OPEN && run.pendingCraft) return 'a craft is waiting for you to pick a result';
    const set = CRAFTING_OPEN ? completeTabletSets(run) : [];
    if (set.length)
      return `${set.length} tablet set${set.length === 1 ? '' : 's'} to redeem (open the Workbench)`;
    const rares = unseenRares(run).length;
    if (rares > 0) return `${rares} new rare/unique item${rares === 1 ? '' : 's'} (open Items)`;
    // The next map is the anchor: stop if it is not the plain map auto-continue is meant for, or the character is worn down.
    if (run.offers[0].type !== 'plain')
      return `the first map is a ${mapTypeDef(run.offers[0].type).name} map`;
    if (run.vitals.life < AUTO_PAUSE_BELOW) return 'life is low';
    if (Object.values(run.vitals.flasks).some((f) => f < AUTO_PAUSE_BELOW)) return 'a flask is low';
    return null;
  }

  /** The raw saved run of a slot (for bug reports), or null. */
  exportSave(id: SlotId): string | null {
    return this.store?.getItem(slotKey(id)) ?? null;
  }

  /** Leave the run (it stays saved) and return to the title screen. */
  quit(): void {
    if (this.world) this.bus.emit('mapEnd', null);
    this.world = null;
    this.crawl = null;
    this.run = null;
    this.slot = null;
    this.refreshSaves();
    this.goTo('title');
  }

  /** Abandon the current run entirely (deletes its save; the others stay). */
  abandon(): void {
    if (this.store && this.slot !== null) deleteSlot(this.store, this.slot);
    this.slot = null;
    this.quit();
  }
}
