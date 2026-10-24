import { useEffect, useState } from 'preact/hooks';
import { classDef } from '../data/classes';
import type { HighScore, MySnapshot } from '../run/rivals';
import type { RunState } from '../run/run';
import { loadStanding, postStatus, watchPost } from '../rivals';

/** How many rows the top of the board shows, and how many either side of the player's own. */
const TOP = 5;
const SPAN = 2;
/** The longest list the server gives: a character below it has no known rank. */
const LIST_MAX = 100;

export type BoardRow = {
  id: string;
  name: string;
  classId: string;
  level: number;
  rating: number;
  /** Its place on the board; null for the player's character when it has none (not yet rated, or below the list). */
  rank: number | null;
  me: boolean;
};

export type Board = {
  /** The rows to show, with null where rows are skipped. */
  rows: (BoardRow | null)[];
  /** The player's character: its rank, 'unrated' before its first rated duel, 'below' under the list; null when it is not there. */
  standing: number | 'unrated' | 'below' | null;
};

const rowOf = (s: HighScore | MySnapshot, rank: number | null, me: boolean): BoardRow => ({
  id: s.id,
  name: s.name,
  classId: s.classId,
  level: s.level,
  rating: s.rating,
  rank,
  me,
});

/**
 * The end screen's slice of the high scores: the top few, then the few around the player's character, its rank, and a gap between
 * the two when they do not meet. A character not yet rated is shown where its rating would stand, without a rank.
 */
export function boardOf(scores: HighScore[], me: MySnapshot | null): Board {
  const at = me ? scores.findIndex((s) => s.id === me.id) : -1;
  if (!me || at >= 0) {
    const rows = scores.map((s, i) => rowOf(s, i + 1, s.id === me?.id));
    if (at < 0) return { rows: rows.slice(0, TOP), standing: null };
    return { rows: around(rows, at), standing: at + 1 };
  }
  // The list orders by rating, then wins; a newer character comes after those it ties with.
  let pos = scores.findIndex(
    (s) => s.rating < me.rating || (s.rating === me.rating && s.wins < me.wins),
  );
  if (pos < 0) pos = scores.length;
  const rated = me.fights > 0;
  if (rated && pos >= LIST_MAX) {
    const top = scores.slice(0, TOP).map((s, i) => rowOf(s, i + 1, false));
    return { rows: [...top, null, rowOf(me, null, true)], standing: 'below' };
  }
  const rows = scores.map((s, i) => rowOf(s, i + 1 + (rated && i >= pos ? 1 : 0), false));
  rows.splice(pos, 0, rowOf(me, rated ? pos + 1 : null, true));
  return { rows: around(rows, pos), standing: rated ? pos + 1 : 'unrated' };
}

/** The top rows and the rows around `at`, joined when they meet. */
function around(rows: BoardRow[], at: number): (BoardRow | null)[] {
  const from = at - SPAN;
  const to = Math.min(rows.length, at + SPAN + 1);
  if (from <= TOP) return rows.slice(0, Math.max(TOP, to));
  return [...rows.slice(0, TOP), null, ...rows.slice(from, to)];
}

const className = (id: string): string => {
  try {
    return classDef(id).name;
  } catch {
    return id;
  }
};

function standingText(b: Board): string | null {
  if (b.standing === null) return null;
  if (b.standing === 'unrated') return 'Unranked until your first rated duel';
  if (b.standing === 'below') return `Your rank: below #${LIST_MAX}`;
  return `Your rank: #${b.standing}`;
}

/** The slice of the high scores for what has been loaded (null while it is asked for). */
export function LeaderboardView({
  got,
}: {
  got: { scores: HighScore[] | null; me: MySnapshot | null } | null;
}) {
  if (got === null) return <p class="muted">Looking for rivals…</p>;
  if (got.scores === null) return <p class="muted">Could not reach the rivals</p>;
  const b = boardOf(got.scores, got.me);
  if (b.rows.length === 0) return <p class="muted">No duels yet.</p>;
  const text = standingText(b);
  return (
    <>
      {text && <p class="board-rank">{text}</p>}
      <table class="hs-table">
        <thead>
          <tr>
            <th class="num">#</th>
            <th>Name</th>
            <th>Class</th>
            <th class="num hs-x">Level</th>
            <th class="num">Rating</th>
          </tr>
        </thead>
        <tbody>
          {b.rows.map((r, i) =>
            r === null ? (
              <tr key={`gap${i}`} class="board-gap">
                <td colSpan={5}>⋯</td>
              </tr>
            ) : (
              <tr key={r.id} class={r.me ? 'hs-me' : ''}>
                <td class="num">{r.rank ?? '–'}</td>
                <td class="hs-name">{r.name}</td>
                <td>{className(r.classId)}</td>
                <td class="num hs-x">{r.level}</td>
                <td class="num">{r.rating}</td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </>
  );
}

/**
 * The high scores at the foot of a run's end screen: asked for when the screen opens (it opens again after every duel, so the
 * rating is fresh) and again once the character's post lands.
 */
export function Leaderboard({ run }: { run: RunState }) {
  const [got, setGot] = useState<{ scores: HighScore[] | null; me: MySnapshot | null } | null>(
    null,
  );
  const [posted, setPosted] = useState(postStatus(run).status === 'posted');
  useEffect(() => watchPost(() => setPosted(postStatus(run).status === 'posted')), [run]);
  useEffect(() => {
    let live = true;
    void loadStanding(run).then((r) => live && setGot(r));
    return () => {
      live = false;
    };
  }, [run, posted]);
  return (
    <div class="board">
      <h3>High scores</h3>
      <LeaderboardView got={got} />
    </div>
  );
}
