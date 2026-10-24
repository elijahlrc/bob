import { describe, expect, it } from 'vitest';
import type { HighScore, MySnapshot } from '../run/rivals';
import { boardOf, type Board } from './Leaderboard';

/**
 * The end screen's slice of the high scores: the top, the rows around the player's character, and its rank. `served` answers as
 * the two database functions do (docs/rivals.sql 15c): the top five, and the rows within two ranks of the character.
 */

const score = (id: number, rating: number, wins = 1): HighScore => ({
  id: String(id),
  name: `Rival ${id}`,
  classId: 'strider',
  level: 30,
  map: 20,
  outcome: 'died',
  rating,
  fights: 3,
  wins,
  gameVersion: 'abc1234',
  postedOn: '2026-10-23',
});
/** `n` rows rated 1000, 990, 980, ... with ids 1, 2, 3, ... */
const list = (n: number) => Array.from({ length: n }, (_, i) => score(i + 1, 1000 - i * 10));
const mine = (id: number, rating: number, fights = 2, wins = 1): MySnapshot => ({
  id: String(id),
  createdAt: '2026-10-23T00:00:00Z',
  name: 'Me',
  classId: 'mystic',
  level: 20,
  map: 15,
  outcome: 'died',
  saveVersion: 23,
  rating,
  fights,
  wins,
});

/** What the server gives for `board` (in rank order, the player's character in it once rated) and the character. */
function served(board: HighScore[], me: MySnapshot | null, span = 2) {
  const ranked = board.map((s, i) => ({ ...s, rank: i + 1 }));
  const top = ranked.slice(0, 5);
  if (!me) return boardOf(top, [], null);
  const at = ranked.findIndex((s) => s.id === me.id);
  const ahead =
    at >= 0
      ? at
      : ranked.filter((s) => s.rating > me.rating || (s.rating === me.rating && s.wins >= me.wins))
          .length;
  const hi = ahead + span + (at >= 0 ? 1 : 0);
  const near = ranked.filter((s) => s.rank >= ahead + 1 - span && s.rank <= hi);
  return boardOf(top, near, me);
}
const shown = (b: Board) => b.rows.map((r) => (r === null ? '…' : `${r.rank ?? '-'}:${r.id}`));

describe('the high scores on the end screen', () => {
  it('shows the top five when the player has no character there', () => {
    const b = served(list(20), null);
    expect(shown(b)).toEqual(['1:1', '2:2', '3:3', '4:4', '5:5']);
    expect(b.standing).toBeNull();
  });

  it('shows the top, a gap, and the two either side of the player’s character, with its rank', () => {
    const b = served(list(30), mine(12, 890));
    expect(shown(b)).toEqual([
      '1:1',
      '2:2',
      '3:3',
      '4:4',
      '5:5',
      '…',
      '10:10',
      '11:11',
      '12:12',
      '13:13',
      '14:14',
    ]);
    expect(b.standing).toBe(12);
    expect(b.rows.find((r) => r?.me)?.id).toBe('12');
  });

  it('joins the two when they meet', () => {
    expect(shown(served(list(30), mine(6, 950)))).toEqual([
      '1:1',
      '2:2',
      '3:3',
      '4:4',
      '5:5',
      '6:6',
      '7:7',
      '8:8',
    ]);
    expect(shown(served(list(3), mine(2, 990)))).toEqual(['1:1', '2:2', '3:3']);
  });

  it('ranks a character far down a long list, the rows around it read by rank and not by the whole list', () => {
    const b = served(list(5000), mine(4321, 1000 - 4320 * 10));
    expect(b.standing).toBe(4321);
    expect(shown(b).slice(5)).toEqual([
      '…',
      '4319:4319',
      '4320:4320',
      '4321:4321',
      '4322:4322',
      '4323:4323',
    ]);
  });

  it('places a character not yet rated where its rating stands, without a rank, and moves no one', () => {
    const b = served(list(30), mine(99, 905, 0));
    expect(b.standing).toBe('unrated');
    expect(shown(b)).toEqual([
      '1:1',
      '2:2',
      '3:3',
      '4:4',
      '5:5',
      '…',
      '9:9',
      '10:10',
      '-:99',
      '11:11',
      '12:12',
    ]);
  });

  it('a character not yet rated comes after those it ties with, ahead of those with fewer wins', () => {
    const board = [score(1, 900, 3), score(2, 900, 2), score(3, 900, 1)];
    expect(shown(served(board, mine(9, 900, 0, 2)))).toEqual(['1:1', '2:2', '-:9', '3:3']);
    expect(shown(served(list(2), mine(9, 1, 0)))).toEqual(['1:1', '2:2', '-:9']);
    expect(shown(served([], mine(9, 100, 0)))).toEqual(['-:9']);
  });
});
