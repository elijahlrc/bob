import type { MonsterTypeId } from '../data/monsters';
import { Emitter } from '../core/events';
import { DT } from '../data/constants';
import { clampDifficulty, DEFAULT, type Difficulty } from '../data/difficulty';
import { worldResult, type MapResult } from '../sim/runMap';
import type { SimEvent, World } from '../sim/types';
import { cancelAbandon, requestAbandon } from '../sim/abandon';
import { createWorld, stepWorld } from '../sim/world';
import {
  createDuelWorld,
  duelEnd,
  duelResult,
  duelWatch,
  type DuelEnd,
  type DuelOpts,
  type DuelResult,
  type DuelWatch,
} from '../sim/duel';
import { buildReport, type MapReport } from '../sim/ledger';
import { CRAWL_SEGMENTS } from '../data/mapTypes';
import type { Build } from '../data/types';
import type { Vitals } from '../sim/types';
import { CLASSES, classDef } from '../data/classes';
import { botCamp } from './bot';
import { settlePrimary } from './primary';
import { takeStop, type StopChoice } from './stops';
import { craftAtRespite, restAtRespite, type RespiteCraft } from './respite';
import { waysideOf } from './wayside';
import {
  addProvision,
  armProvision,
  disarmProvision,
  readyReprieves,
  startProvisions,
} from './provisions';
import type { ProvisionId } from '../data/provisions';
import type { CraftResult } from './craft';
import type { MapOffer } from './offers';
import { combineCrawl } from './play';
import { galleryEntries, galleryRun, galleryWorld, type GalleryEntry } from './gallery';
import { pruneFound } from './found';
import { loadFound, recordFound } from './codex';
import { finishMap, newRun, planFor, setMap, worldOptsFor, type RunState } from './run';
import {
  deleteSlot,
  listSlots,
  newSlot,
  savedJson,
  saveSlot,
  slotKey,
  type KeyValueStore,
  type SlotId,
  type SlotSummary,
} from './save';
import { RivalBook } from './rivalRecord';
import { drawRivals, duelSeedFor, RIVALS_SHOWN, type MySnapshot, type Rival } from './rivals';

export type Screen =
  | 'title'
  | 'classSelect'
  | 'camp'
  | 'map'
  | 'summary'
  | 'victory'
  | 'codex'
  | 'patchNotes'
  | 'duelResult'
  | 'rivals'
  | 'highScores';

/** A duel against a rival the player picked on the Rivals screen (docs/DUEL.md 6.5). */
export type RivalFight = {
  rivalId: string;
  /** The snapshot of the player's own character that is fighting: the `a` of the rated pair. */
  myId: string;
  /** The rated fight of the pair: the first, on the pair's own seed. "Again" and the fights after it are practice. */
  rated: boolean;
  /** Where Back from the result goes: the run's summary or victory screen. */
  home: Screen;
};

/** A duel being fought on the map screen (docs/DUEL.md 5): the two builds, the seed of this fight and where Leave goes back to. */
export type DuelMode = {
  /** The two characters as they were handed over (each fight is played on copies). `a` is side 0, the viewer's. */
  a: Build;
  b: Build;
  opts: DuelOpts;
  /** The seed of this fight: `base` for the first, one more for each `againDuel`. */
  seed: number;
  base: number;
  /** How many fights have been fought with these two builds before this one. */
  fought: number;
  /** What the two characters are called. */
  names: [string, string];
  /** The screen Leave and Back return to. */
  from: Screen;
  /** The end rules' state across frames (`duelEnd`). */
  watch: DuelWatch;
  /** Set for a fight against a rival (`startRivalDuel`); null for the Debug panel's. */
  rival: RivalFight | null;
  /** The game's speed and pause before the duel: every fight starts at 1× (people watch them), and leaving puts these back. */
  runSpeed: { speed: number; paused: boolean };
};

/**
 * What came of the report of a rated fight: `sending` until the server answers, then `rated` (both ratings moved), `already` (this
 * pair was rated before), `refused` (a check violation: `message` is the server's reason) or `failed` (offline). A practice fight
 * has none.
 */
export type RivalOutcome = {
  rivalId: string;
  myId: string;
  rated: boolean;
  report: 'sending' | 'rated' | 'already' | 'refused' | 'failed' | null;
  message?: string;
  /** The player's rating before the rated fight and after it, once the ladder has moved. */
  rating?: { before: number; after: number };
};

/** What a finished duel shows on the result screen: the result and what each side dealt and took (the numbers are what landed). */
export type DuelOutcome = {
  result: DuelResult;
  /** Side 0's report and side 1's. */
  reports: [MapReport, MapReport];
  names: [string, string];
  seed: number;
  /** Set for a fight against a rival. */
  rival: RivalOutcome | null;
};

/**
 * The Rivals screen's state (docs/DUEL.md 6.5), kept beside the duel because a duel comes and goes: "Another rival" returns to the same
 * five cards. It belongs to the run that ended and goes with it. The screen fills it from the network (`src/rivals.ts`); the controller
 * only holds it.
 */
export type RivalsSession = {
  /** The run's summary or victory screen: where Back goes. */
  home: Screen;
  /**
   * `loading` while the fetches run, `ready` with five cards, `empty` when no rival is near the map, `offline` when the rivals could
   * not be reached, `unsent` when the character is not on the table (the post failed).
   */
  status: 'loading' | 'ready' | 'empty' | 'offline' | 'unsent';
  /** Why a character is `unsent`: the name was refused, or the rivals could not be reached. */
  why?: 'name' | 'unreachable';
  /** Set once the fetches have begun, so that a screen drawn twice does not start them twice. */
  started: boolean;
  /** The player's own snapshot (its id is the `a` of a rated fight; its rating is what the result shows moving). */
  mine: MySnapshot | null;
  /** The twenty the draw is made from, and the five on the cards. */
  pool: Rival[];
  shown: Rival[];
  /** How many draws have been made: "Show others" adds one. */
  counter: number;
};

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
  /**
   * Called once when a fight against a rival has ended, after the record has it and the result screen is up: the report of a rated
   * fight is posted from here (`src/rivals.ts`; the controller does no network). Nothing it does can reach the fight.
   */
  onDuelEnd: ((d: DuelMode, out: DuelOutcome) => void) | null = null;

  /** What this browser's characters have done against the rivals they fought (docs/DUEL.md 6.5). */
  readonly book: RivalBook;

  /** The saved runs found at boot, the most recently saved first (§5.5). */
  saves: SlotSummary[] = [];
  /** The slot the current run is saved in; null for showcase, gallery and runs without a store. */
  private slot: SlotId | null = null;
  /** The slot of the run in progress, if it has one. */
  get currentSlot(): SlotId | null {
    return this.slot;
  }
  /** True when the last save did not fit in the browser's storage (the camp warns about it). */
  saveFailed = false;

  constructor(store: KeyValueStore | null = null) {
    this.store = store;
    this.book = new RivalBook(store);
    this.refreshSaves();
    this.bus.on('frame', ({ dtMs }) => this.onFrame(dtMs));
    this.bus.on('select', ({ id }) => (this.selectedId = id));
  }

  private refreshSaves(): void {
    this.saves = this.store ? listSlots(this.store) : [];
  }

  private changed(): void {
    // The game saves on entering camp and on any camp change (§5.5), into the run's own slot.
    if (this.store && this.run && this.screen === 'camp') {
      try {
        // A run whose slot could not be reserved when it began tries again here.
        this.slot ??= newSlot(this.store);
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
    this.duel = null;
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
    this.duel = null;
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
    this.rivals = null;
    this.goTo('title');
  }

  /** The duel on the map screen, if one is being fought (docs/DUEL.md 5). The run, if any, is not touched by it. */
  duel: DuelMode | null = null;
  /** The last duel that ended, for the result screen. */
  lastDuel: DuelOutcome | null = null;

  /**
   * Fight `a` (side 0, the viewer's) against `b` on the map screen, in a world of its own: the run, if there is one, is as it was
   * (a duel is never a map: no `finishMap`, no Crawl, no save, no telemetry). Its end is read after every tick (`duelEnd`, the rules
   * the headless `runDuel` has) and goes to the result screen. `from` is where Leave and Back return to: by default the screen the
   * duel was started from when it is camp or a run's summary, else the title.
   *
   * It returns false and changes nothing while a map of a run (or the showcase or the gallery) is being played: a duel replaces the
   * world, and the run's map is not the duel's to end. A build that will not make a world throws before anything is changed.
   */
  startDuel(a: Build, b: Build, seed: number, opts: DuelOpts = {}, from?: Screen): boolean {
    if (this.screen === 'map' && this.world && !this.duel) return false;
    const names = opts.names ?? [classDef(a.classId).name, classDef(b.classId).name];
    const back: Screen =
      from ??
      (this.run &&
      (this.screen === 'camp' || this.screen === 'summary' || this.screen === 'victory')
        ? this.screen
        : 'title');
    this.launchDuel({
      a: structuredClone(a),
      b: structuredClone(b),
      opts: { ...opts, names },
      seed,
      base: seed,
      fought: 0,
      names,
      from: back,
      watch: duelWatch(opts),
      rival: null,
      runSpeed: this.duel?.runSpeed ?? { speed: this.speed, paused: this.paused },
    });
    return true;
  }

  /**
   * Fight a rival the player picked (docs/DUEL.md 6.5): the run's character (`run.build`, as the run ended) against the rival's
   * snapshot, the sides named `myName` and the rival's name. The first fight of this pair is **rated**: its seed is the pair's
   * (`duelSeedFor`, the database's `duel_seed`), so a report cannot shop for a seed. A pair already rated fights on another seed,
   * the one after its last, as practice. Returns false when the duel did not start; a rival whose snapshot will not make a world is
   * dropped from the cards, with no message, and the run, the screen and `onRunEnd` are as they were.
   */
  startRivalDuel(rival: Rival, myId: string, myName: string): boolean {
    const run = this.run;
    if (!run) return false;
    const pair = this.book.get(myId, rival.id);
    const rated = !pair?.rated;
    let started: boolean;
    try {
      const seed = rated || !pair ? duelSeedFor(myId, rival.id) : pair.lastSeed + 1;
      started = this.startDuel(
        run.build,
        rival.build,
        seed,
        { names: [myName, rival.name] },
        'rivals',
      );
    } catch {
      this.dropRival(rival.id);
      return false;
    }
    if (!started) return false;
    this.duel!.rival = { rivalId: rival.id, myId, rated, home: this.rivals?.home ?? 'summary' };
    return true;
  }

  /** The same two characters again, on the next seed (a new fight: the arena and the order of the sides are drawn from it). */
  againDuel(): void {
    const d = this.duel;
    if (!d) return;
    d.fought++;
    d.seed = d.base + d.fought;
    d.watch = duelWatch(d.opts);
    // Only the first fight of a pair is rated.
    if (d.rival) d.rival.rated = false;
    this.launchDuel(d);
  }

  /**
   * Leave the duel, being fought or just over, for the screen it was started from, or for `to`. No result is kept (the record has
   * what a finished fight gave it).
   */
  leaveDuel(to?: Screen): void {
    const d = this.duel;
    if (!d) return;
    if (this.world) this.bus.emit('mapEnd', null);
    this.world = null;
    this.duel = null;
    this.lastDuel = null;
    this.speed = d.runSpeed.speed;
    this.paused = d.runSpeed.paused;
    this.goTo(to ?? d.from);
  }

  private launchDuel(d: DuelMode): void {
    // The world comes first: a build that will not make one throws here, with nothing of the controller changed.
    // Each fight is played on copies, so that what a fight does to a build (its level, its flasks) never reaches the next.
    const world = createDuelWorld(structuredClone(d.a), structuredClone(d.b), d.seed, d.opts);
    if (this.world) this.bus.emit('mapEnd', null);
    this.duel = d;
    this.lastDuel = null;
    this.world = world;
    this.acc = 0;
    // Every fight, Again included, starts at 1× and unpaused: duels are watched, and some are over in seconds.
    this.speed = 1;
    this.paused = false;
    this.screen = 'map';
    this.bus.emit('select', { id: null });
    this.bus.emit('mapStart', { world: this.world });
    this.bus.emit('state', null);
  }

  /** The duel is over: the result and both reports are kept, the world is torn down and the result screen comes up. */
  private endDuel(w: World, end: DuelEnd): void {
    const d = this.duel;
    if (!d) return;
    const result = duelResult(w, end);
    const rv = d.rival;
    // The record has every fight against a rival, rated or practice; the report of a rated one is for `onDuelEnd`.
    if (rv) this.book.noteFight(rv.myId, rv.rivalId, d.seed, result.winner === 0);
    const out: DuelOutcome = {
      result,
      reports: [buildReport(w, w.sides[0]), buildReport(w, w.sides[1])],
      names: d.names,
      seed: d.seed,
      rival: rv
        ? {
            rivalId: rv.rivalId,
            myId: rv.myId,
            rated: rv.rated,
            report: rv.rated ? (this.onDuelEnd ? 'sending' : 'failed') : null,
          }
        : null,
    };
    this.lastDuel = out;
    this.world = null;
    this.bus.emit('mapEnd', null);
    this.screen = 'duelResult';
    this.changed();
    if (rv) {
      try {
        this.onDuelEnd?.(d, out);
      } catch {
        // The report is not the fight's: nothing it does reaches the result screen.
      }
    }
  }

  /** The server has the rated fight of this pair (it took the report or had it already): the next fight against the rival is practice. */
  markRated(myId: string, rivalId: string): void {
    this.book.noteRated(myId, rivalId);
  }

  // -------------------------------------------------------------------------------------------------------------------------
  // The Rivals screen (docs/DUEL.md 6.5)

  /** The Rivals screen's state for the run that ended, if it has been opened. */
  rivals: RivalsSession | null = null;

  /**
   * Go to the Rivals screen from the run's summary or victory screen. The cards of an earlier visit are kept while they are the
   * cards of a ready screen ("Another rival" comes back to the same five); a visit that found nothing is made again.
   */
  openRivals(): void {
    if (!this.run) return;
    if (this.rivals?.status !== 'ready')
      this.rivals = {
        home: this.screen === 'victory' ? 'victory' : 'summary',
        status: 'loading',
        started: false,
        mine: null,
        pool: [],
        shown: [],
        counter: 0,
      };
    this.goTo('rivals');
  }

  /** The Rivals screen found the player's character and the pool: five of the twenty are drawn for the cards. */
  fillRivals(mine: MySnapshot, pool: Rival[]): void {
    const s = this.rivals;
    const run = this.run;
    if (!s || !run) return;
    s.mine = mine;
    s.pool = pool;
    s.counter = 0;
    s.shown = drawRivals(pool, run.seed, 0, RIVALS_SHOWN);
    s.status = pool.length > 0 ? 'ready' : 'empty';
    this.changed();
  }

  /** The Rivals screen could not show cards: no rival is near the map, the rivals are out of reach, or the character is not on the table. */
  failRivals(status: 'empty' | 'offline' | 'unsent', why?: 'name' | 'unreachable'): void {
    const s = this.rivals;
    if (!s) return;
    s.status = status;
    s.why = why;
    this.changed();
  }

  /** "Show others": five more of the pool, the ones not on the cards now first. */
  showOthers(): void {
    const s = this.rivals;
    const run = this.run;
    if (!s || !run || s.status !== 'ready') return;
    s.counter++;
    s.shown = drawRivals(
      s.pool,
      run.seed,
      s.counter,
      RIVALS_SHOWN,
      s.shown.map((r) => r.id),
    );
    this.changed();
  }

  /** Take a rival that will not start out of the pool and off the cards, and fill the card with another of the pool. */
  dropRival(id: string): void {
    const s = this.rivals;
    const run = this.run;
    if (!s || !run) return;
    s.pool = s.pool.filter((r) => r.id !== id);
    const kept = s.shown.filter((r) => r.id !== id);
    const shown = new Set(kept.map((r) => r.id));
    const more = drawRivals(s.pool, run.seed, s.counter, s.pool.length).filter(
      (r) => !shown.has(r.id),
    );
    s.shown = [...kept, ...more].slice(0, RIVALS_SHOWN);
    if (s.pool.length === 0) s.status = 'empty';
    this.changed();
  }

  /** The player's snapshot as the ladder last had it (after a rated fight), for the rating the screens show. */
  setMine(mine: MySnapshot): void {
    if (this.rivals) this.rivals.mine = mine;
  }

  /** Resume a saved run at camp. */
  continueRun(id: SlotId): void {
    const found = this.saves.find((s) => s.id === id);
    if (!found || found.result.status !== 'ok') return;
    this.run = found.result.run;
    this.run.build = settlePrimary(this.run);
    this.rivals = null;
    this.slot = id;
    this.saveFailed = false;
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
    this.rivals = null;
    // A new run gets a slot of its own: the saves of earlier runs stay as they are.
    this.slot = null;
    this.saveFailed = false;
    if (this.store) {
      try {
        this.slot = newSlot(this.store);
      } catch {
        // A full store: the run goes on, the warning says it is not being saved, and camp tries again.
        this.saveFailed = true;
      }
    }
    this.undoStack = [];
    this.lastResult = null;
    this.goTo('camp');
  }

  /**
   * Start a run from the menus: straight into its first map (docs/STREAMLINE.md S1). At map 1 the offers differ in
   * nothing a new character can weigh, so the first plain map is taken; the choice of map starts at map 2.
   */
  beginRun(classId: string, seed: number): void {
    this.startRun(classId, seed);
    const offers = this.run!.offers;
    const plain = offers.findIndex((o) => o.kind === 'map' && o.type === 'plain');
    this.startMap(Math.max(0, plain));
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

  /** Debug panel: put a provision (a reprieve, say) in the pouch of the run in progress (camp only). False when it is full. */
  debugGiveProvision(id: ProvisionId): boolean {
    const run = this.run;
    if (!run || this.screen !== 'camp' || !addProvision(run, id)) return false;
    this.changed();
    return true;
  }

  /** Start the next map with one of the offered maps. */
  startMap(offerIdx = 0): void {
    const run = this.run;
    if (!run) return;
    const offer = run.offers[offerIdx] ?? run.offers[0];
    // A Respite is no map: resting passes the level and makes the character whole again, after any crafts (`craftAtRespite`).
    if (offer.kind === 'respite') {
      this.undoStack = [];
      this.lastResult = null;
      restAtRespite(run);
      this.changed();
      return;
    }
    // A stop is taken with `takeStop`, which needs the choice made on its screen.
    if (offer.kind === 'stop') return;
    this.duel = null;
    pruneFound(run);
    this.undoStack = [];
    // What is armed burns now and works until the map ends (docs/WAYSIDE.md 6.1).
    startProvisions(run);
    // A Crawl is three maps in a row: this remembers where it is and what the character carries between them.
    this.crawl =
      offer.type === 'crawl'
        ? {
            offer,
            segment: 0,
            parts: [],
            fired: [],
            build: run.build,
            xp: run.xp,
            start: run.vitals,
          }
        : null;
    const plan = planFor(run, offer);
    this.world = createWorld({ plan, build: run.build, xp: run.xp, opts: worldOptsFor(run, plan) });
    this.acc = 0;
    this.screen = 'map';
    this.bus.emit('select', { id: null });
    this.bus.emit('mapStart', { world: this.world });
    this.changed();
  }

  /** Take the stop in a slot with the choice made on its screen: the level passes (docs/WAYSIDE.md 5.1). Final, like a map. */
  takeStop(slot: number, choice: StopChoice): CraftResult {
    const run = this.run;
    if (!run) return { ok: false, reason: 'no run' };
    const res = takeStop(run, slot, choice);
    if (res.ok) this.undoStack = [];
    this.changed();
    return res;
  }

  /** A craft at the Respite (docs/ATTRITION.md): final, as any craft is, so the undo history goes. */
  craftAtRespite(slot: number, craft: RespiteCraft): CraftResult {
    const run = this.run;
    if (!run) return { ok: false, reason: 'no run' };
    const res = craftAtRespite(run, slot, craft);
    if (res.ok) this.undoStack = [];
    this.changed();
    return res;
  }

  /** The player has read a first-use explainer (docs/WAYSIDE.md 9.1): it is not shown again in this run. Not an undoable change. */
  see(id: string): void {
    if (!this.run) return;
    waysideOf(this.run).seen[id] = true;
    this.changed();
  }

  /** Arm or disarm a provision for the next map (docs/WAYSIDE.md 6.1). */
  arm(id: ProvisionId, on: boolean): CraftResult {
    const run = this.run;
    if (!run) return { ok: false, reason: 'no run' };
    const res = on ? armProvision(run, id) : disarmProvision(run, id);
    this.changed();
    return res;
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
    const duel = this.duel;
    let over: DuelEnd | null = null;
    if (!this.paused && w.status === 'running') {
      // Clamp long frames (tab switches) so we never spiral.
      this.acc += Math.min(dtMs / 1000, 0.1) * this.speed;
      let n = 0;
      while (this.acc >= DT && n < 60 && w.status === 'running') {
        stepWorld(w);
        for (const e of w.events) events.push(e);
        this.acc -= DT;
        n++;
        // A duel's end is read after every tick, not once a frame: the map's status goes 'dead' only for side 0, and a frame at
        // 8× steps up to a second, so the fight must stop at the very tick the headless runner stops at (`playDuel`).
        if (duel) {
          over = duelEnd(w, duel.watch);
          if (over) break;
        }
      }
    }
    this.bus.emit('ticked', { world: w, events });
    if (duel) {
      // A duel never reaches `endMap`: the run's map flow (rewards, Crawls, reprieves, telemetry, the save) is not its own.
      if (!over && w.status !== 'running') over = 'time';
      if (over) this.endDuel(w, over);
      return;
    }
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
      // A reprieve that fired in one map of a Crawl does not fire again on the next (the run spends it when the Crawl ends).
      crawl.fired.push(...(res.reprieves ?? []));
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
          opts: {
            ...worldOptsFor(run, plan),
            start: crawl.start,
            reprieves: readyReprieves(run, crawl.fired),
          },
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
    // A level gained can change which skill is strongest; a primary the game picked is picked again.
    if (run.phase === 'camp') run.build = settlePrimary(run);
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
    /** The reprieves that have fired on its maps so far. */
    fired: string[];
    build: Build;
    xp: number;
    start: Vitals;
  } | null = null;

  private undoStack: string[] = [];

  /** The parts of a run a camp change can touch (undo snapshots). */
  private snapshot(run: RunState): string {
    const { build, inventory, nextUid, bonusPoints, refundPoints, reward } = run;
    const discarded = run.discarded ?? [];
    const { currency, dust, tablets, wayside } = run;
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
      wayside: wayside ?? null,
    });
  }

  /** Apply a change to the run in camp and notify the UI. Changes can be undone. */
  act<T>(fn: (run: RunState) => T): T | undefined {
    if (!this.run) return undefined;
    const before = this.snapshot(this.run);
    const r = fn(this.run);
    // With no skill starred by the player, the strongest one socketed is the primary (docs/NEWPLAYER.md N4).
    this.run.build = settlePrimary(this.run);
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
  /** How many camp changes can be undone: a screen's "what just happened" line is current while this has not moved. */
  get undoDepth(): number {
    return this.undoStack.length;
  }

  /** Revert the last camp change (equip, socket, passive point, reward pick ...). */
  undo(): boolean {
    const prev = this.undoStack.pop();
    if (!prev || !this.run) return false;
    Object.assign(this.run, JSON.parse(prev));
    this.changed();
    return true;
  }

  /** The raw saved run of a slot (for bug reports), or null. */
  exportSave(id: SlotId): string | null {
    return this.store ? savedJson(this.store, slotKey(id)) : null;
  }

  /** Leave the run (it stays saved) and return to the title screen. */
  quit(): void {
    if (this.world) this.bus.emit('mapEnd', null);
    this.world = null;
    this.duel = null;
    this.lastDuel = null;
    this.crawl = null;
    this.run = null;
    this.rivals = null;
    this.slot = null;
    this.saveFailed = false;
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
