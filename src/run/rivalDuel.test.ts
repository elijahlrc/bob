import { describe, expect, it } from 'vitest';
import { DEFAULT } from '../data/difficulty';
import type { Build } from '../data/types';
import { runDuel } from '../sim/duel';
import { Controller, type DuelMode, type DuelOutcome } from './controller';
import { RECORD_KEY } from './rivalRecord';
import { duelSeedFor, RIVALS_SHOWN, type MySnapshot, type Rival } from './rivals';
import { MemoryStore } from './save';
import { newRun, SAVE_VERSION } from './run';

/**
 * The controller's side of a duel against a rival (docs/DUEL.md 6.5): the rated fight on the pair's seed, practice after it, the
 * record, the cards that outlive a duel, a snapshot that will not start, and the guard against a duel on a map.
 */

const starter = (cls: string, seed = 1): Build => newRun(cls, seed).build;

function rivalOf(id: number, over: Partial<Rival> = {}): Rival {
  const build = over.build ?? starter(['strider', 'mystic', 'reaver', 'zealot'][id % 4], id);
  return {
    id: String(id),
    name: `Rival ${id}`,
    classId: build.classId,
    level: build.level,
    map: 10,
    outcome: 'died',
    difficulty: { ...DEFAULT },
    saveVersion: SAVE_VERSION,
    gameVersion: 'abc1234',
    bot: false,
    build,
    ...over,
  };
}

const mine = (id: number, rating = 410): MySnapshot => ({
  id: String(id),
  createdAt: '2026-10-17T09:30:00+00:00',
  name: 'Wren',
  classId: 'vanguard',
  level: 1,
  map: 12,
  outcome: 'died',
  saveVersion: SAVE_VERSION,
  rating,
  fights: 0,
  wins: 0,
});

/** A controller on the summary screen of a run that ended in a death, with the player's snapshot known and a pool of rivals. */
function onSummary(poolSize = 8, store: MemoryStore | null = null) {
  const c = new Controller(store);
  c.startRun('vanguard', 77);
  const run = c.run!;
  run.phase = 'dead';
  run.map = 12;
  c.goTo('summary');
  c.openRivals();
  c.fillRivals(
    mine(41),
    Array.from({ length: poolSize }, (_, i) => rivalOf(i + 1)),
  );
  return c;
}

function frames(c: Controller, dtMs: number, limit = 20000): number {
  let n = 0;
  while (c.screen === 'map' && n < limit) {
    c.bus.emit('frame', { dtMs });
    n++;
  }
  return n;
}

describe('a duel against a rival', () => {
  it('makes a two-side world on the pair’s seed, rated, with the two names, from the summary', () => {
    const c = onSummary();
    expect(c.screen).toBe('rivals');
    const rival = c.rivals!.shown[0];
    expect(c.startRivalDuel(rival, '41', 'Wren')).toBe(true);
    expect(c.screen).toBe('map');
    expect(c.world!.sides).toHaveLength(2);
    expect(c.world!.sides.map((s) => s.player.name)).toEqual(['Wren', rival.name]);
    const seed = duelSeedFor(41, rival.id);
    expect(c.duel!.seed).toBe(seed);
    expect(c.world!.plan.seed).toBe(seed);
    expect(c.duel!.from).toBe('rivals');
    expect(c.duel!.rival).toEqual({ rivalId: rival.id, myId: '41', rated: true, home: 'summary' });
    // It is the run's character that fights, as it ended, on a copy.
    expect(c.duel!.a).toEqual(c.run!.build);
    expect(c.duel!.a).not.toBe(c.run!.build);
    expect(c.duel!.b).toEqual(rival.build);
  });

  it('plays the same fight the headless runner plays for the pair, and leaves the run as it was', () => {
    const c = onSummary();
    const run = c.run!;
    const before = JSON.stringify(run);
    let ended = 0;
    c.onRunEnd = () => ended++;
    const rival = c.rivals!.shown[0];
    c.setSpeed(8);
    c.startRivalDuel(rival, '41', 'Wren');
    frames(c, 100);
    expect(c.screen).toBe('duelResult');
    const want = runDuel(run.build, rival.build, duelSeedFor(41, rival.id));
    const got = c.lastDuel!.result;
    expect([got.winner, got.how, got.time]).toEqual([want.winner, want.how, want.time]);
    expect(ended).toBe(0);
    expect(c.run).toBe(run);
    expect(JSON.stringify(run)).toBe(before);
    expect(c.lastResult).toBeNull();
  });

  it('writes the fight into the record, and tells the hook once, for a rated fight, with the outcome', () => {
    const store = new MemoryStore();
    const c = onSummary(8, store);
    const told: [DuelMode, DuelOutcome][] = [];
    c.onDuelEnd = (d, out) => void told.push([d, out]);
    const rival = c.rivals!.shown[0];
    c.setSpeed(8);
    c.startRivalDuel(rival, '41', 'Wren');
    frames(c, 100);
    expect(told).toHaveLength(1);
    const out = c.lastDuel!;
    expect(told[0][1]).toBe(out);
    expect(told[0][0].rival).toMatchObject({ rivalId: rival.id, myId: '41', rated: true });
    expect(out.rival).toEqual({ rivalId: rival.id, myId: '41', rated: true, report: 'sending' });
    const won = out.result.winner === 0;
    expect(c.book.get('41', rival.id)).toEqual({
      fights: 1,
      wins: won ? 1 : 0,
      lastSeed: out.seed,
      rated: false,
    });
    expect(JSON.parse(store.getItem(RECORD_KEY)!)[`41:${rival.id}`]).toMatchObject({ fights: 1 });
    expect(c.book.tally('41')).toEqual({ fought: 1, beaten: won ? 1 : 0 });
    // The hook is what says the server has it.
    c.markRated('41', rival.id);
    expect(c.book.get('41', rival.id)!.rated).toBe(true);
  });

  it('has no report to wait for when nothing is there to post it, and a hook that throws changes nothing', () => {
    const c = onSummary();
    const rival = c.rivals!.shown[0];
    c.setSpeed(8);
    c.startRivalDuel(rival, '41', 'Wren');
    frames(c, 100);
    expect(c.lastDuel!.rival!.report).toBe('failed');
    const d = onSummary();
    d.onDuelEnd = () => {
      throw new Error('boom');
    };
    d.setSpeed(8);
    d.startRivalDuel(d.rivals!.shown[0], '41', 'Wren');
    expect(() => frames(d, 100)).not.toThrow();
    expect(d.screen).toBe('duelResult');
    expect(d.book.get('41', d.rivals!.shown[0].id)).toMatchObject({ fights: 1 });
  });

  it('fights on practice after the first: the next seed, no report, and the record counts them', () => {
    const c = onSummary();
    const told: DuelOutcome[] = [];
    c.onDuelEnd = (_d, out) => void told.push(out);
    const rival = c.rivals!.shown[0];
    const base = duelSeedFor(41, rival.id);
    c.setSpeed(8);
    c.startRivalDuel(rival, '41', 'Wren');
    frames(c, 100);
    c.againDuel();
    expect(c.screen).toBe('map');
    expect(c.duel!.seed).toBe(base + 1);
    expect(c.duel!.rival!.rated).toBe(false);
    frames(c, 100);
    expect(c.lastDuel!.rival).toEqual({
      rivalId: rival.id,
      myId: '41',
      rated: false,
      report: null,
    });
    expect(c.lastDuel!.seed).toBe(base + 1);
    c.againDuel();
    frames(c, 100);
    expect(c.book.get('41', rival.id)).toMatchObject({ fights: 3, lastSeed: base + 2 });
    // The hook is told of every fight against a rival; only the first has a report to post.
    expect(told.map((o) => o.rival!.rated)).toEqual([true, false, false]);
  });

  it('starts a pair that was rated before as practice, on the seed after its last', () => {
    const c = onSummary();
    const rival = c.rivals!.shown[0];
    const base = duelSeedFor(41, rival.id);
    c.setSpeed(8);
    c.startRivalDuel(rival, '41', 'Wren');
    frames(c, 100);
    c.markRated('41', rival.id);
    c.againDuel();
    frames(c, 100);
    c.leaveDuel('rivals');
    expect(c.screen).toBe('rivals');
    // The same rival again, later: no longer a rated fight.
    expect(c.startRivalDuel(rival, '41', 'Wren')).toBe(true);
    expect(c.duel!.rival!.rated).toBe(false);
    expect(c.duel!.seed).toBe(base + 2);
    // A fight that was not reported stays rated-to-come: the pair's own seed again.
    const other = c.rivals!.shown[1];
    c.leaveDuel('rivals');
    c.startRivalDuel(other, '41', 'Wren');
    frames(c, 100);
    c.leaveDuel('rivals');
    c.startRivalDuel(other, '41', 'Wren');
    expect(c.duel!.rival!.rated).toBe(true);
    expect(c.duel!.seed).toBe(duelSeedFor(41, other.id));
    // Another character of the player's (another snapshot) is a new pair: rated again.
    c.leaveDuel('rivals');
    c.startRivalDuel(rival, '77', 'Wren');
    expect(c.duel!.rival!.rated).toBe(true);
    expect(c.duel!.seed).toBe(duelSeedFor(77, rival.id));
  });

  it('refuses while a map of a run is being played, and changes nothing', () => {
    const c = new Controller(null);
    c.startRun('vanguard', 5);
    c.startMap(0);
    const world = c.world;
    expect(c.screen).toBe('map');
    expect(world).not.toBeNull();
    expect(c.startDuel(c.run!.build, starter('strider', 2), 3)).toBe(false);
    expect(c.duel).toBeNull();
    expect(c.world).toBe(world);
    expect(c.screen).toBe('map');
    expect(c.startRivalDuel(rivalOf(3), '41', 'Wren')).toBe(false);
    expect(c.duel).toBeNull();
    expect(c.world).toBe(world);
    // Not a map: the same call from camp starts.
    const d = new Controller(null);
    d.startRun('vanguard', 5);
    expect(d.startDuel(d.run!.build, starter('strider', 2), 3)).toBe(true);
    expect(d.screen).toBe('map');
  });

  it('drops a rival whose snapshot will not make a world: no message, the run untouched, onRunEnd not called', () => {
    const c = onSummary(8);
    const run = c.run!;
    const before = JSON.stringify(run);
    let ended = 0;
    c.onRunEnd = () => ended++;
    const bad = rivalOf(99, { build: { ...starter('strider', 9), classId: 'nonesuch' } });
    c.rivals!.pool.push(bad);
    c.rivals!.shown[0] = bad;
    const shownBefore = c.rivals!.shown.map((r) => r.id);
    expect(c.startRivalDuel(bad, '41', 'Wren')).toBe(false);
    expect(c.screen).toBe('rivals');
    expect(c.duel).toBeNull();
    expect(c.world).toBeNull();
    expect(c.lastDuel).toBeNull();
    expect(ended).toBe(0);
    expect(JSON.stringify(run)).toBe(before);
    expect(c.run).toBe(run);
    // The card is gone and another of the pool fills it.
    expect(c.rivals!.pool.map((r) => r.id)).not.toContain('99');
    expect(c.rivals!.shown.map((r) => r.id)).not.toContain('99');
    expect(c.rivals!.shown).toHaveLength(RIVALS_SHOWN);
    expect(new Set(c.rivals!.shown.map((r) => r.id)).size).toBe(RIVALS_SHOWN);
    expect(c.rivals!.shown.map((r) => r.id).slice(0, RIVALS_SHOWN - 1)).toEqual(
      shownBefore.slice(1),
    );
    // The record has nothing of it.
    expect(c.book.get('41', '99')).toBeNull();
    // A snapshot with an id that is no id is dropped the same way.
    const odd = rivalOf(98, { id: 'x7' });
    c.rivals!.pool.push(odd);
    expect(c.startRivalDuel(odd, '41', 'Wren')).toBe(false);
    expect(c.rivals!.pool.map((r) => r.id)).not.toContain('x7');
  });

  it('empties the screen when the last rival of the pool is dropped', () => {
    const c = onSummary(1);
    expect(c.rivals!.status).toBe('ready');
    c.dropRival('1');
    expect(c.rivals!.status).toBe('empty');
    expect(c.rivals!.shown).toEqual([]);
  });

  it('needs a run, and Leave goes back to the cards while Back from the result goes home', () => {
    const none = new Controller(null);
    expect(none.startRivalDuel(rivalOf(1), '41', 'Wren')).toBe(false);
    const c = onSummary();
    const rival = c.rivals!.shown[0];
    c.startRivalDuel(rival, '41', 'Wren');
    for (let i = 0; i < 20; i++) c.bus.emit('frame', { dtMs: 100 });
    c.leaveDuel();
    expect(c.screen).toBe('rivals');
    expect(c.duel).toBeNull();
    // Leaving has no result: the record has nothing of it.
    expect(c.book.get('41', rival.id)).toBeNull();
    c.setSpeed(8);
    c.startRivalDuel(rival, '41', 'Wren');
    frames(c, 100);
    c.leaveDuel(c.duel!.rival!.home);
    expect(c.screen).toBe('summary');
    expect(c.rivals).not.toBeNull();
  });
});

describe('the cards of the Rivals screen', () => {
  it('are five of the pool, drawn by the run’s seed: the same five again for the same run', () => {
    const a = onSummary(20);
    const b = onSummary(20);
    expect(a.rivals!.status).toBe('ready');
    expect(a.rivals!.shown).toHaveLength(RIVALS_SHOWN);
    expect(a.rivals!.shown.map((r) => r.id)).toEqual(b.rivals!.shown.map((r) => r.id));
    expect(new Set(a.rivals!.shown.map((r) => r.id)).size).toBe(RIVALS_SHOWN);
  });

  it('are another five on "Show others", none of the five before while the pool has them', () => {
    const c = onSummary(20);
    const first = c.rivals!.shown.map((r) => r.id);
    c.showOthers();
    const second = c.rivals!.shown.map((r) => r.id);
    expect(second).toHaveLength(RIVALS_SHOWN);
    for (const id of second) expect(first).not.toContain(id);
    expect(c.rivals!.counter).toBe(1);
  });

  it('come back as they were after a duel: "Another rival" does not draw again', () => {
    const c = onSummary(20);
    c.showOthers();
    const shown = c.rivals!.shown.map((r) => r.id);
    const counter = c.rivals!.counter;
    c.setSpeed(8);
    c.startRivalDuel(c.rivals!.shown[2], '41', 'Wren');
    frames(c, 100);
    c.leaveDuel('rivals');
    expect(c.screen).toBe('rivals');
    expect(c.rivals!.shown.map((r) => r.id)).toEqual(shown);
    expect(c.rivals!.counter).toBe(counter);
    // The record shows on the card: it is the controller's book, read by pair.
    expect(c.book.get('41', c.rivals!.shown[2].id)).toMatchObject({ fights: 1 });
    // Opening the screen again from the summary keeps a ready screen's cards.
    c.goTo('summary');
    c.openRivals();
    expect(c.rivals!.shown.map((r) => r.id)).toEqual(shown);
    expect(c.rivals!.started).toBe(false);
  });

  it('are made again by a visit that found nothing, and a won run goes home to its own screen', () => {
    const c = new Controller(null);
    c.startRun('vanguard', 1);
    c.run!.phase = 'victory';
    c.goTo('victory');
    c.openRivals();
    expect(c.rivals).toMatchObject({ home: 'victory', status: 'loading', started: false });
    c.failRivals('offline');
    expect(c.rivals!.status).toBe('offline');
    c.goTo('victory');
    c.openRivals();
    expect(c.rivals!.status).toBe('loading');
    c.failRivals('unsent', 'name');
    expect(c.rivals).toMatchObject({ status: 'unsent', why: 'name' });
  });

  it('go with the run: a new run, a saved run continued and a quit forget them', () => {
    const store = new MemoryStore();
    for (const leave of [
      (c: Controller) => c.quit(),
      (c: Controller) => c.startRun('mystic', 3),
      (c: Controller) => c.abandon(),
    ]) {
      const c = onSummary(8, store);
      expect(c.rivals).not.toBeNull();
      leave(c);
      expect(c.rivals).toBeNull();
    }
  });
});
