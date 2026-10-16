import { describe, expect, it } from 'vitest';
import { makeGem } from '../gen/items';
import type { SocketOutcome } from './inventory';
import { joinNames, socketNote, socketsMatter } from './socketText';

let n = 1;
const gem = (id: string) => makeGem(() => n++, id);

const calm = (over: Partial<SocketOutcome> = {}): SocketOutcome => ({
  before: { sockets: 3, filled: 2 },
  after: { sockets: 3, filled: 2 },
  placed: [],
  moved: [],
  out: [],
  fromOffHand: [],
  lostPrimary: false,
  idle: [],
  freeAfter: 1,
  ...over,
});

describe('the sentence a swap says about the gems', () => {
  it('says nothing when the gems are not touched', () => {
    expect(socketNote(calm())).toEqual({ severity: 'none', text: '' });
  });

  it('one gem with no socket left: one sentence, naming it', () => {
    const o = calm({ out: [gem('flameBolt')] });
    expect(socketNote(o)).toEqual({
      severity: 'warn',
      text: 'No socket for Flame Bolt, it will be unequipped',
    });
  });

  it('the primary skill is named as such, and is the stronger severity', () => {
    const g = gem('flameBolt');
    const o = calm({ out: [g], lostPrimary: true });
    expect(socketNote(o, g.uid)).toEqual({
      severity: 'bad',
      text: 'No socket for Flame Bolt, your primary skill, it will be unequipped',
    });
  });

  it('several gems are listed once, and the primary among them is called out', () => {
    const a = gem('flameBolt');
    const b = gem('echoingCast');
    const o = calm({ out: [a, b], lostPrimary: true });
    expect(socketNote(o, a.uid).text).toBe(
      'No socket for Flame Bolt and Echoing Cast, including your primary skill, they will be unequipped',
    );
    expect(socketNote(calm({ out: [a, b] })).text).toBe(
      'No socket for Flame Bolt and Echoing Cast, they will be unequipped',
    );
  });

  it("a cleared off hand's gems are not blamed on the sockets", () => {
    const a = gem('kindle');
    const o = calm({ out: [a], fromOffHand: [a] });
    expect(socketNote(o)).toEqual({
      severity: 'warn',
      text: 'Off hand goes to the bag with Kindle',
    });
  });

  it('a support left with no skill says why, and how many more', () => {
    const s = gem('echoingCast');
    const t = gem('bruteForce');
    const one = calm({ idle: [{ gem: s, why: 'needs a spell skill in the same item' }] });
    expect(socketNote(one).text).toBe('Echoing Cast needs a spell skill in the same item');
    const two = calm({
      idle: [
        { gem: s, why: 'needs a spell skill in the same item' },
        { gem: t, why: 'needs a melee skill in the same item' },
      ],
    });
    expect(socketNote(two).text).toContain('(+1 more idle)');
  });

  it('free sockets gained are a good thing to say, once, in the plural when there are several', () => {
    expect(socketNote(calm({ freeAfter: 3 }))).toEqual({
      severity: 'good',
      text: '3 free sockets',
    });
    expect(
      socketNote(
        calm({ before: { sockets: 2, filled: 2 }, after: { sockets: 3, filled: 2 }, freeAfter: 1 }),
      ).text,
    ).toBe('1 free socket');
  });

  it('knows when the gems matter at all', () => {
    expect(
      socketsMatter(calm({ before: { sockets: 4, filled: 0 }, after: { sockets: 3, filled: 0 } })),
    ).toBe(false);
    expect(socketsMatter(calm())).toBe(true);
  });

  it('joins names the way a sentence does', () => {
    expect(joinNames([])).toBe('');
    expect(joinNames(['A'])).toBe('A');
    expect(joinNames(['A', 'B'])).toBe('A and B');
    expect(joinNames(['A', 'B', 'C'])).toBe('A, B and C');
  });
});
