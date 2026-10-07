import { gemDef } from '../data/gems';
import { describe, expect, it } from 'vitest';
import { endKindForMap, resistPenaltyForMap, roomsForMap } from '../gen/mapPlan';
import type { MapResult } from '../sim/runMap';
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
} from './run';
import { clearSave, loadRun, MemoryStore, SAVE_KEY, saveRun } from './save';

const cleared = (level: number): MapResult => ({
  status: 'cleared',
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
});

describe('map schedule (§5.3)', () => {
  it('rooms, resist penalty and end rooms', () => {
    expect(roomsForMap(1)).toBe(4);
    expect(roomsForMap(25)).toBe(5);
    expect(roomsForMap(100)).toBe(8);
    expect([1, 30, 31, 60, 61, 100].map(resistPenaltyForMap)).toEqual([0, 0, 30, 30, 60, 60]);
    expect([5, 10, 20, 99, 100].map(endKindForMap)).toEqual([
      'rare',
      'miniboss',
      'miniboss',
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
    run2.map = TOTAL_MAPS;
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
    run.map = 5;
    run.reward = rollRewards(run);
    const pick = run.reward[1];
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
    expect(loadRun(store).status).toBe('ok');
    c.act((r) => (r.refundPoints = 7));
    const c2 = new Controller(store);
    expect(c2.saved.status).toBe('ok');
    c2.continueRun();
    expect(c2.screen).toBe('camp');
    expect(c2.run!.refundPoints).toBe(7);
    c2.abandon();
    expect(loadRun(store).status).toBe('none');
  });
});

describe('the headless bot (§15.5)', () => {
  it('plays deterministically and levels up', () => {
    const a = botRun('mystic', 21, 6);
    const b = botRun('mystic', 21, 6);
    expect(a.maps.map((m) => [m.status, m.level])).toEqual(b.maps.map((m) => [m.status, m.level]));
    expect(a.maps[0].status).toBe('cleared');
  });

  it('runs at least 500× real time', () => {
    const t0 = performance.now();
    const r = botRun('reaver', 5, 25);
    const wall = (performance.now() - t0) / 1000;
    const sim = r.maps.reduce((s, m) => s + m.time, 0);
    expect(sim / wall).toBeGreaterThan(500);
  });
});
