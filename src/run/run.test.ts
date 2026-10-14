import { CLASSES } from '../data/classes';
import { gemDef } from '../data/gems';
import { describe, expect, it } from 'vitest';
import { endKindForMap, resistPenaltyForMap, roomsForMap } from '../gen/mapPlan';
import type { MapResult } from '../sim/runMap';
import { fullVitals } from '../sim/types';
import { botRun } from './bot';
import { Controller } from './controller';
import {
  finishMap,
  newRun,
  passivePoints,
  rollRewards,
  rollSkillRewards,
  SKILL_REWARD_MAPS,
  SAVE_VERSION,
  takeReward,
  TOTAL_MAPS,
  setMap,
} from './run';
import {
  clearSave,
  deleteSlot,
  listSlots,
  loadRun,
  MemoryStore,
  newSlot,
  SAVE_KEY,
  saveRun,
  saveSlot,
  slotKey,
  SLOTS_KEY,
  type SlotSummary,
} from './save';

const cleared = (level: number): MapResult => ({
  status: 'cleared',
  areaLevel: level,
  time: 90,
  ticks: 5400,
  level,
  xp: 0,
  xpGained: 100,
  kills: 10,
  stuck: 0,
  picked: [],
  eventHash: 0,
  lifeFrac: 1,
  vitals: fullVitals(),
});

describe('map schedule (§5.3)', () => {
  it('rooms, resist penalty and end rooms', () => {
    expect(roomsForMap(1)).toBe(4);
    expect(roomsForMap(25)).toBe(5);
    expect(roomsForMap(50)).toBe(6);
    expect(roomsForMap(100)).toBe(9);
    expect([1, 30, 31, 60, 61, 100].map(resistPenaltyForMap)).toEqual([0, 0, 30, 30, 60, 60]);
    // A boss ends every tenth map (docs/BOSSES.md).
    expect([5, 10, 20, 80, 99, 100].map(endKindForMap)).toEqual([
      'rare',
      'boss',
      'boss',
      'boss',
      'rare',
      'boss',
    ]);
  });
});

describe('run progression (§5.3)', () => {
  it('+3 bonus passive points after maps 10–80, a refund point per map, rewards every 5th map and skill gems on the first four', () => {
    const run = newRun('vanguard', 7);
    let lvl = 1;
    for (let m = 1; m <= 90; m++) {
      finishMap(run, cleared(lvl));
      lvl = Math.min(100, lvl + 1);
      if (m % 5 === 0) {
        expect(run.reward, `reward after map ${m}`).toHaveLength(3);
        takeReward(run, null);
      } else if (m <= SKILL_REWARD_MAPS) {
        expect(run.reward, `skill gems after map ${m}`).toHaveLength(3);
        expect(
          run.reward!.every((o) => o.kind === 'gem' && gemDef(o.gemId).kind === 'active'),
        ).toBe(true);
        expect(new Set(run.reward!.map((o) => (o as { gemId: string }).gemId)).size).toBe(3);
        takeReward(run, null);
      } else expect(run.reward).toBeNull();
    }
    expect(run.bonusPoints).toBe(24);
    expect(run.refundPoints).toBe(90);
    expect(run.map).toBe(91);
    // 99 level points + 24 bonus = 123 at level 100 when every bonus is earned (8 × 3 = 24).
    run.build.level = 100;
    expect(passivePoints(run)).toBe(99 + 24);
  });

  it("remembers what the last cleared map dropped, replacing the previous map's list", () => {
    const run = newRun('mystic', 1);
    const gem = { kind: 'gem' as const, uid: 501, gemId: 'crushingBlow' };
    const pot = { kind: 'currency' as const, uid: 502, id: 'ember', count: 2 };
    const bag = { kind: 'gem' as const, uid: 503, gemId: 'crushingBlow' };
    finishMap(run, { ...cleared(1), picked: [gem, pot] });
    expect(run.lastDrops).toEqual([501]);
    finishMap(run, { ...cleared(2), picked: [bag] });
    expect(run.lastDrops).toEqual([503]);
    finishMap(run, cleared(3));
    expect(run.lastDrops).toEqual([]);
  });

  it('death ends the run; clearing map 100 is victory', () => {
    const run = newRun('mystic', 1);
    finishMap(run, { ...cleared(1), status: 'dead' });
    expect(run.phase).toBe('dead');
    const run2 = newRun('mystic', 1);
    setMap(run2, TOTAL_MAPS);
    finishMap(run2, cleared(100));
    expect(run2.phase).toBe('victory');
  });

  it('skill gem offers skip gems already held, and picking one adds it to the bag', () => {
    const run = newRun('mystic', 3);
    const first = rollSkillRewards(run);
    const held = new Set(
      run.inventory.filter((x) => x.kind === 'gem').map((g) => (g as { gemId: string }).gemId),
    );
    for (const o of first) expect(held.has((o as { gemId: string }).gemId)).toBe(false);
    const wornIds = run.build.equipment.body!.sockets.map((g) => g?.gemId);
    for (const o of first) expect(wornIds).not.toContain((o as { gemId: string }).gemId);
    run.reward = first;
    takeReward(run, first[2].uid);
    expect(run.inventory.some((x) => x.uid === first[2].uid)).toBe(true);
    const again = rollSkillRewards(run);
    expect(
      again.some((o) => (o as { gemId: string }).gemId === (first[2] as { gemId: string }).gemId),
    ).toBe(false);
  });

  it('reward picks add the chosen offer to the inventory', () => {
    const run = newRun('shade', 3);
    setMap(run, 5);
    run.reward = rollRewards(run);
    // (A pick may hold a card for the Wayside, which goes to the Pouch and not the inventory.)
    const pick = run.reward.find((o) => o.kind !== 'pouch' && o.kind !== 'currency')!;
    takeReward(run, pick.uid);
    expect(run.inventory.map((x) => x.uid)).toContain(pick.uid);
    expect(run.reward).toBeNull();
  });
});

describe('saving (§5.5)', () => {
  it('round-trips a run under bob.save', () => {
    const store = new MemoryStore();
    const run = newRun('zealot', 11);
    finishMap(run, cleared(2));
    saveRun(store, run);
    expect(JSON.parse(store.getItem(SAVE_KEY)!).version).toBe(SAVE_VERSION);
    const r = loadRun(store);
    expect(r.status).toBe('ok');
    if (r.status === 'ok') expect(r.run).toEqual(JSON.parse(JSON.stringify(run)));
  });

  it('reports no save, and an unknown version as incompatible', () => {
    const store = new MemoryStore();
    expect(loadRun(store).status).toBe('none');
    store.setItem(SAVE_KEY, JSON.stringify({ version: 99, run: {} }));
    expect(loadRun(store).status).toBe('incompatible');
    store.setItem(SAVE_KEY, '{nope');
    expect(loadRun(store).status).toBe('incompatible');
    clearSave(store);
    expect(loadRun(store).status).toBe('none');
  });

  it('the controller saves on entering camp and continues from the save', () => {
    const store = new MemoryStore();
    const c = new Controller(store);
    c.startRun('vanguard', 5);
    expect(listSlots(store).map((s) => s.result.status)).toEqual(['ok']);
    c.act((r) => (r.refundPoints = 7));
    const c2 = new Controller(store);
    expect(c2.saves).toHaveLength(1);
    expect(c2.saves[0].result.status).toBe('ok');
    c2.continueRun(c2.saves[0].id);
    expect(c2.screen).toBe('camp');
    expect(c2.run!.refundPoints).toBe(7);
    c2.abandon();
    expect(c2.saves).toHaveLength(0);
    expect(listSlots(store)).toHaveLength(0);
  });
});

describe('save slots', () => {
  const okRun = (s: SlotSummary) => (s.result.status === 'ok' ? s.result.run : null);

  it('a new run leaves the older saves alone', () => {
    const store = new MemoryStore();
    const a = new Controller(store);
    a.startRun('vanguard', 1);
    a.act((r) => (r.refundPoints = 3));
    a.quit();
    a.startRun('zealot', 2);
    a.act((r) => (r.refundPoints = 9));
    a.quit();

    const b = new Controller(store);
    expect(b.saves).toHaveLength(2);
    // The most recently saved comes first.
    expect(b.saves.map((s) => okRun(s)!.classId)).toEqual(['zealot', 'vanguard']);
    expect(b.saves.map((s) => okRun(s)!.refundPoints)).toEqual([9, 3]);
  });

  it('continuing a run saves into its own slot and moves it to the front', () => {
    const store = new MemoryStore();
    const a = new Controller(store);
    a.startRun('vanguard', 1);
    a.quit();
    a.startRun('zealot', 2);
    a.quit();
    const older = a.saves[1].id;
    a.continueRun(older);
    a.act((r) => (r.refundPoints = 5));
    a.quit();
    expect(a.saves.map((s) => s.id)[0]).toBe(older);
    expect(a.saves).toHaveLength(2);
    expect(okRun(a.saves[0])!.refundPoints).toBe(5);
    expect(okRun(a.saves[1])!.refundPoints).not.toBe(5);
  });

  it('abandoning or losing a run deletes only its slot', () => {
    const store = new MemoryStore();
    const a = new Controller(store);
    a.startRun('vanguard', 1);
    a.quit();
    a.startRun('zealot', 2);
    a.abandon();
    expect(a.saves.map((s) => okRun(s)!.classId)).toEqual(['vanguard']);
    a.discardSave(a.saves[0].id);
    expect(a.saves).toHaveLength(0);
    expect(new Controller(store).saves).toHaveLength(0);
  });

  it('ids are not reused after a delete', () => {
    const store = new MemoryStore();
    const first = newSlot(store);
    saveSlot(store, first, newRun('vanguard', 1));
    deleteSlot(store, first);
    expect(newSlot(store)).not.toBe(first);
  });

  it('the save from before slots becomes a slot', () => {
    const store = new MemoryStore();
    saveRun(store, newRun('mystic', 4));
    const c = new Controller(store);
    expect(c.saves).toHaveLength(1);
    expect(okRun(c.saves[0])!.classId).toBe('mystic');
    expect(store.getItem(SAVE_KEY)).toBeNull();
    // A new run goes beside it, and a second start finds both.
    c.startRun('vanguard', 1);
    c.quit();
    expect(new Controller(store).saves).toHaveLength(2);
  });

  it('keeps an incompatible save listed so it can be discarded', () => {
    const store = new MemoryStore();
    store.setItem(SAVE_KEY, JSON.stringify({ version: 99, run: {} }));
    const c = new Controller(store);
    expect(c.saves.map((s) => s.result.status)).toEqual(['incompatible']);
    c.discardSave(c.saves[0].id);
    expect(c.saves).toHaveLength(0);
  });

  it('a lost slot list does not lose or overwrite the saves', () => {
    const store = new MemoryStore();
    const a = new Controller(store);
    a.startRun('vanguard', 1);
    a.quit();
    store.setItem(SLOTS_KEY, '{nope');
    const b = new Controller(store);
    b.startRun('zealot', 2);
    b.quit();
    // The new run took a free id: the old save is still stored and was not overwritten.
    const old = loadRun(store, slotKey(1));
    expect(old.status === 'ok' && old.run.classId).toBe('vanguard');
    expect(b.saves.map((s) => okRun(s)!.classId)).toEqual(['zealot']);
  });

  it('the showcase and the gallery write no save', () => {
    const store = new MemoryStore();
    const c = new Controller(store);
    c.startShowcase();
    c.exitShowcase();
    c.startGallery();
    c.exitShowcase();
    expect(c.saves).toHaveLength(0);
    expect(store.getItem(SLOTS_KEY)).toBeNull();
  });

  it('a save that does not fit is reported, not thrown', () => {
    const store = new MemoryStore();
    const c = new Controller(store);
    c.startRun('vanguard', 1);
    store.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    expect(() => c.act((r) => (r.refundPoints = 2))).not.toThrow();
    expect(c.saveFailed).toBe(true);
  });
});

describe('the headless bot (§15.5)', () => {
  it('plays deterministically and levels up', () => {
    // The settings the game started with: this test is about the bot, not about the default difficulty.
    const difficulty = { scaling: 1.5, base: 1, variance: 0.1 };
    const a = botRun('mystic', 22, 6, { difficulty });
    const b = botRun('mystic', 22, 6, { difficulty });
    expect(a.maps.map((m) => [m.status, m.level])).toEqual(b.maps.map((m) => [m.status, m.level]));
    expect(a.maps[0].status).toBe('cleared');
  });

  // Timing tests depend on the machine: they run locally and are skipped on CI (shared runners are slower).
  // The bot's own camp decisions count in the wall time here, and a stronger build clears maps in less simulated time, so
  // the floor is far below the 500× of the sim itself (the bot alone measured 500–560× when the coverage plan began; with the roster plan it is about 220× alone and less in a full parallel run, so 150).
  it.skipIf(!!process.env.CI)(
    'runs at least 150× real time',
    () => {
      const t0 = performance.now();
      const r = botRun('reaver', 5, 25);
      const wall = (performance.now() - t0) / 1000;
      const sim = r.maps.reduce((s, m) => s + m.time, 0);
      expect(sim / wall).toBeGreaterThan(150);
    },
    60000,
  );
});

describe('starting kit', () => {
  it('no class starts with a gem; the weapons, flasks and an empty two-socket body remain', () => {
    for (const cls of CLASSES) {
      const run = newRun(cls.id, 1);
      const gems = [
        ...Object.values(run.build.equipment).flatMap((it) => it?.sockets ?? []),
        ...run.inventory.filter((x) => x.kind === 'gem'),
      ].filter(Boolean);
      expect(gems, cls.id).toHaveLength(0);
      expect(run.build.primaryGem).toBeUndefined();
      expect(run.build.equipment.mainHand).toBeDefined();
      expect(run.build.equipment.body!.sockets).toEqual([null, null]);
      expect(run.build.flasks[0]).not.toBeNull();
    }
  });

  it('a first map is clearable on the default attack, then the first gem pick follows', () => {
    const r = botRun('vanguard', 3, 1);
    expect(r.maps[0].status).toBe('cleared');
    const run = newRun('vanguard', 3);
    finishMap(run, cleared(1));
    expect(run.reward).toHaveLength(3);
  });
});
