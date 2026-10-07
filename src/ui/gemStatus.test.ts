import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import { gemDef } from '../data/gems';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { gemStatus } from './Skills';

let n = 100;
const uid = () => n++;

/** A body with these gems (and a mace, so melee skills work) on a fresh character. */
function chOf(gems: string[], classId = 'vanguard') {
  const run = newRun(classId, 1);
  const b = run.build;
  b.level = 30;
  b.equipment.mainHand = makeItem(uid, 'mace2_3', 30, 1);
  delete b.equipment.offHand;
  const body = makeItem(uid, 'body_ar_1', 30, gems.length);
  body.sockets = gems.map((g) => makeGem(uid, g));
  b.equipment.body = body;
  b.primaryGem = body.sockets[0]!.uid;
  return { ch: new Character(b, { areaLevel: 30 }), body };
}

const status = (
  ch: Character,
  body: { sockets: ({ uid: number; gemId: string } | null)[] },
  i: number,
) => gemStatus(ch, body.sockets[i]!.uid, gemDef(body.sockets[i]!.gemId));

describe('gem status lines (is this gem doing anything?)', () => {
  it('a spell support on a spell says what it supports; the spell says what supports it', () => {
    const { ch, body } = chOf(['flameBolt', 'echoingCast']);
    expect(status(ch, body, 1)).toEqual({ ok: true, text: 'Supporting: Flame Bolt' });
    expect(status(ch, body, 0)).toEqual({ ok: true, text: 'Supported by: Echoing Cast' });
  });

  it('a skill the mana cannot pay for says so', () => {
    const { ch, body } = chOf(['flameBolt', 'echoingCast'], 'mystic');
    const s = status(ch, body, 0)!;
    expect(s.ok).toBe(false);
    expect(s.text).toMatch(/^Supported by: Echoing Cast · Mana-starved \(\d+%\)$/);
    expect(s.hint).toMatch(/can pay for about \d+% of this skill's casts/);
  });

  it('a spell support on an attack is flagged: it does nothing', () => {
    const { ch, body } = chOf(['crushingBlow', 'echoingCast']);
    const s = status(ch, body, 1)!;
    expect(s.ok).toBe(false);
    expect(s.text).toMatch(/Not supporting anything: needs a spell skill in the same item/);
    expect(status(ch, body, 0)).toEqual({ ok: true, text: 'No supports linked' });
  });

  it('a support in a different item than its skill is flagged', () => {
    const run = newRun('mystic', 1);
    const b = run.build;
    b.level = 30;
    const body = makeItem(uid, 'body_ar_1', 30, 1);
    body.sockets = [makeGem(uid, 'flameBolt')];
    const helm = makeItem(uid, 'helmet_ar_1', 30, 1);
    helm.sockets = [makeGem(uid, 'echoingCast')];
    b.equipment.body = body;
    b.equipment.helmet = helm;
    b.primaryGem = body.sockets[0]!.uid;
    const ch = new Character(b, { areaLevel: 30 });
    expect(gemStatus(ch, helm.sockets[0]!.uid, gemDef('echoingCast'))!.ok).toBe(false);
    expect(gemStatus(ch, body.sockets[0]!.uid, gemDef('flameBolt'))!.text).toMatch(
      /^No supports linked/,
    );
  });

  it('a hex gem without Hexing Strikes is flagged, with it is applied', () => {
    const lone = chOf(['crushingBlow', 'openWounds']);
    expect(status(lone.ch, lone.body, 1)!.ok).toBe(false);
    const both = chOf(['crushingBlow', 'hexingStrikes', 'openWounds']);
    expect(status(both.ch, both.body, 2)).toEqual({ ok: true, text: 'Hexes the enemies you hit' });
  });
});
