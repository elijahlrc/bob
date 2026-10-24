import { describe, expect, it } from 'vitest';
import { Character, sheetDps } from '../calc/character';
import { gemDef } from '../data/gems';
import type { EquipSlot } from '../data/types';
import { makeGem } from '../gen/items';
import { cfgFor, sheetOf } from './bot';
import { gemStatus } from './gemStatus';
import { setPrimary, socketGem } from './inventory';
import { placementsFor } from './inventoryOps';
import { settlePrimary } from './primary';
import { newRun, type RunState } from './run';

/** The Skills tab says what will happen (docs/NEWPLAYER.md N4). */

function mystic(): { run: RunState; gem: (id: string) => number } {
  const run = newRun('mystic', 3);
  run.build = { ...run.build, level: 10 };
  const uid = () => run.nextUid++;
  return {
    run,
    gem: (id) => {
      const g = makeGem(uid, id);
      run.inventory.push(g);
      return g.uid;
    },
  };
}

/** Socket a gem as the camp does: the move, then the primary settled. */
function put(run: RunState, slot: EquipSlot, socket: number, uid: number): void {
  expect(socketGem(run, slot, socket, uid)).toBe(true);
  run.build = settlePrimary(run);
}

const pct = (a: number, b: number) => ((b - a) / a) * 100;

describe('the primary skill', () => {
  it('is the strongest skill socketed when none is starred, wherever the sockets are', () => {
    const { run, gem } = mystic();
    const plague = gem('creepingPlague');
    const drift = gem('rimeDrift');
    put(run, 'body', 0, drift);
    put(run, 'mainHand', 0, plague);
    const as = (uid: number) =>
      sheetDps(sheetOf(run, { ...run.build, primaryGem: uid, primaryAuto: true }));
    const stronger = as(drift) >= as(plague) ? drift : plague;
    expect(run.build.primaryGem).toBe(stronger);
    expect(new Character(run.build).primary.gemUid).toBe(stronger);
  });

  it('a starred skill stays the primary', () => {
    const { run, gem } = mystic();
    const plague = gem('creepingPlague');
    const drift = gem('rimeDrift');
    put(run, 'body', 0, drift);
    put(run, 'mainHand', 0, plague);
    const other = run.build.primaryGem === drift ? plague : drift;
    setPrimary(run, other);
    run.build = settlePrimary(run);
    expect(run.build.primaryGem).toBe(other);
  });
});

describe('a socket badge and the headline agree', () => {
  for (const id of ['standardOfDread', 'rimeDrift', 'creepingPlague'])
    it(`${id}: the badge's DPS change is the headline's change once it is socketed`, () => {
      const { run, gem } = mystic();
      put(run, 'body', 0, gem('witheringBreath'));
      const uid = gem(id);
      const p = placementsFor(run, uid).find((x) => x.slot === 'body' && x.socket === 1)!;
      const before = sheetDps(sheetOf(run));
      put(run, 'body', 1, uid);
      expect(pct(before, sheetDps(sheetOf(run)))).toBeCloseTo(p.dpsPct, 6);
    });

  it('a skill says what supports it, and nothing about mana or missing links', () => {
    const { run, gem } = mystic();
    put(run, 'body', 0, gem('rimeDrift'));
    const alone = new Character(run.build, cfgFor(run));
    expect(gemStatus(alone, alone.primary.gemUid!, gemDef('rimeDrift'))).toBeNull();
    put(run, 'body', 1, gem('witheringBreath'));
    const ch = new Character(run.build, cfgFor(run));
    const st = gemStatus(ch, ch.primary.gemUid!, gemDef('rimeDrift'));
    expect(st?.text ?? '').not.toMatch(/mana|link/i);
  });
});

describe('a replacement credits the right gem', () => {
  it('a support the skill cannot use says so, and the gain from the gem it pushes out is named', () => {
    const { run, gem } = mystic();
    const drift = gem('rimeDrift');
    put(run, 'body', 0, gem('witheringBreath'));
    put(run, 'body', 1, drift);
    const p = placementsFor(run, gem('tripleShot')).find(
      (x) => x.slot === 'body' && x.socket === 0,
    )!;
    expect(p.replaces).toBe('Withering Breath');
    expect(p.idle).toMatch(/single skull/);
    // Whatever changes comes from Withering Breath leaving, not from the support.
    if (Math.abs(p.dpsPct) >= 0.5) expect(p.fromRemoval).toBeCloseTo(p.dpsPct, 6);
  });
});
