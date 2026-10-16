import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import { gemDef } from '../data/gems';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from './run';
import { gemStatus } from './gemStatus';

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
    const support = status(ch, body, 1)!;
    expect(support.ok).toBe(true);
    expect(support.text).toContain('Flame Bolt');
    const skill = status(ch, body, 0)!;
    expect(skill.ok).toBe(true);
    expect(skill.text).toContain('Echoing Cast');
  });

  it('a skill the mana cannot pay for says so', () => {
    const { ch, body } = chOf(['flameBolt', 'echoingCast'], 'mystic');
    const s = status(ch, body, 0)!;
    expect(s.ok).toBe(false);
    expect(s.text).toMatch(/mana/i);
  });

  it('a spell support on an attack is flagged: it does nothing', () => {
    const { ch, body } = chOf(['crushingBlow', 'echoingCast']);
    const s = status(ch, body, 1)!;
    expect(s.ok).toBe(false);
    expect(s.text).toMatch(/spell/);
    const skill = status(ch, body, 0)!;
    expect(skill.ok).toBe(true);
    expect(skill.text).not.toContain('Echoing Cast');
  });

  it('a melee support barred from a channelled melee skill says why, not that it needs a melee skill', () => {
    const { ch, body } = chOf(['twisterBlade', 'shatteringBlows']);
    const s = status(ch, body, 1)!;
    expect(s.ok).toBe(false);
    expect(s.text).toMatch(/channel/i);
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
    expect(gemStatus(ch, body.sockets[0]!.uid, gemDef('flameBolt'))!.text).not.toContain(
      'Echoing Cast',
    );
  });

  it('a curse gem is cast by policy, and with Hexing Strikes it is applied on hit instead', () => {
    const lone = chOf(['crushingBlow', 'openWounds']);
    expect(status(lone.ch, lone.body, 1)!.text).not.toMatch(/hit/i);
    const both = chOf(['crushingBlow', 'hexingStrikes', 'openWounds']);
    const s = status(both.ch, both.body, 2)!;
    expect(s.ok).toBe(true);
    expect(s.text).toMatch(/hit/i);
  });
});
