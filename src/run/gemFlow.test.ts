import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import { supportLive } from '../calc/reach';
import { CLASSES } from '../data/classes';
import { gemDef } from '../data/gems';
import { typesAllow } from '../data/skillTypes';
import { EQUIP_SLOTS, type GemItem } from '../data/types';
import { gemWhere, hasSocketedSkill, seatFirstSkill, skillToSocket } from './inventoryOps';
import { newRun, rollRewards, rollSkillRewards, takeReward, type RunState } from './run';
import { withStarterGems } from './starterGems';

/** A run just back from map `n` with the pick of skill gems that map pays. */
function backFrom(run: RunState, n: number): RunState {
  run.map = n;
  run.reward = rollSkillRewards(run);
  for (let i = run.history.length; i < n; i++)
    run.history.push({
      map: i + 1,
      areaLevel: i + 1,
      status: 'cleared',
      time: 60,
      levelAfter: 1,
      kills: 10,
      stuck: 0,
    });
  run.map = n + 1;
  return run;
}

function take(run: RunState): number {
  const uid = run.reward![0].uid;
  takeReward(run, uid);
  seatFirstSkill(run, uid);
  return uid;
}

/** The first skill gem seats itself; no other does (docs/NEWPLAYER.md N7). */
describe('the run’s first skill gem', () => {
  for (const cls of CLASSES)
    it(`${cls.id}: the pick after map 1 goes into a socket`, () => {
      for (let seed = 1; seed <= 20; seed++) {
        const run = backFrom(newRun(cls.id, seed), 1);
        expect(hasSocketedSkill(run.build)).toBe(false);
        const uid = take(run);
        expect(gemWhere(run, uid)?.at, `${cls.id} seed ${seed}`).toBe('worn');
        expect(new Character(run.build).primary.gemUid).toBe(uid);
      }
    });

  it('a pick after map 2 stays in the bag, even with no skill socketed', () => {
    const run = backFrom(newRun('vanguard', 3), 2);
    expect(gemWhere(run, take(run))?.at).toBe('bag');
  });

  it('a pick after map 1 stays in the bag when a skill is already socketed', () => {
    const run = backFrom(withStarterGems(newRun('vanguard', 3)), 1);
    expect(hasSocketedSkill(run.build)).toBe(true);
    expect(gemWhere(run, take(run))?.at).toBe('bag');
  });
});

describe('the camp’s no-skill warning', () => {
  it('names a usable skill gem in the bag while no skill is socketed, and nothing once one is', () => {
    const run = backFrom(newRun('vanguard', 5), 2);
    const uid = run.reward![0].uid;
    takeReward(run, uid);
    expect(skillToSocket(run, new Character(run.build))?.uid).toBe(uid);
    const g = run.inventory.find((x) => x.uid === uid) as GemItem;
    expect(gemDef(g.gemId).kind).toBe('active');
    seatFirstSkill({ ...run, history: run.history.slice(0, 1) }, uid);
    expect(skillToSocket(run, new Character(run.build))).toBeNull();
  });

  it('says nothing when the main skill is a summon cast like one (Call Furies)', () => {
    const run = backFrom(newRun('vanguard', 5), 2);
    takeReward(run, run.reward![0].uid);
    const slot = EQUIP_SLOTS.find((s) => run.build.equipment[s]?.sockets.length)!;
    const item = run.build.equipment[slot]!;
    const sockets = [...item.sockets];
    sockets[0] = { kind: 'gem', uid: 9999, gemId: 'callFuries' };
    run.build = {
      ...run.build,
      equipment: { ...run.build.equipment, [slot]: { ...item, sockets } },
    };
    const ch = new Character(run.build);
    expect(ch.primary.gemUid).toBeNull();
    expect(ch.hasMainSkill).toBe(true);
    expect(skillToSocket(run, ch)).toBeNull();
  });
});

describe('the map-5 pick', () => {
  for (const cls of CLASSES)
    it(`${cls.id}: holds a support gem that works with the main skill`, () => {
      for (let seed = 1; seed <= 30; seed++) {
        const run = withStarterGems(newRun(cls.id, seed));
        run.map = 5;
        const main = new Character(run.build).primary.skill;
        const sups = rollRewards(run).flatMap((c) =>
          c.kind === 'gem' && gemDef(c.gemId).kind === 'support' ? [gemDef(c.gemId)] : [],
        );
        expect(
          sups.some(
            (s) =>
              s.kind === 'support' &&
              typesAllow(s, new Set(main.types)) &&
              supportLive(s, main).live,
          ),
          `${cls.id} seed ${seed}`,
        ).toBe(true);
      }
    });
});
