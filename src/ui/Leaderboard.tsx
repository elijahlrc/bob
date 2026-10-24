import { useEffect, useState } from 'preact/hooks';
import { classDef } from '../data/classes';
import type { HighScore, MySnapshot } from '../run/rivals';
import type { RunState } from '../run/run';
import { loadStanding, postStatus, watchPost } from '../rivals';

/** How many rows the top of the board shows, and how many either side of the player's own. */
const TOP = 5;
const SPAN = 2;

export type BoardRow = {
  id: string;
  name: string;
  classId: string;
  level: number;
  rating: number;
  /** Its place on the board; null for the player's character before its first rated duel. */
  rank: number | null;
  me: boolean;
};

export type Board = {
  /** The rows to show, with null where rows are skipped. */
  rows: (BoardRow | null)[];
  /** The player's character: its rank, or 'unrated' before its first rated duel; null when it is not there. */
  standing: number | 'unrated' | null;
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
 * The end screen's slice of the high scores, from the top rows and the rows around the player's character (each with its rank on
 * the whole list): the two joined in rank order, a gap wherever ranks are skipped, and the character's rank. A character not yet
 * on the list is placed where its rating would stand (after those it ties with, being the newest), without a rank.
 */
export function boardOf(top: HighScore[], near: HighScore[], me: MySnapshot | null): Board {
  const byId = new Map<string, HighScore>();
  for (const s of [...top, ...near]) if (s.rank !== undefined) byId.set(s.id, s);
  const ranked = [...byId.values()].sort((a, b) => a.rank! - b.rank!);
  const rows: (BoardRow | null)[] = [];
  let last = 0;
  for (const s of ranked) {
    if (s.rank! > last + 1) rows.push(null);
    rows.push(rowOf(s, s.rank!, s.id === me?.id));
    last = s.rank!;
  }
  if (!me) return { rows, standing: null };
  const mine = byId.get(me.id);
  if (mine) return { rows, standing: mine.rank! };
  // The list orders by rating, then wins, then the older: the newest character comes after those it ties with.
  const next = ranked.find(
    (s) => s.rating < me.rating || (s.rating === me.rating && s.wins < me.wins),
  );
  const at = next ? rows.findIndex((r) => r?.id === next.id) : rows.length;
  rows.splice(at, 0, rowOf(me, null, true));
  // A character that has fought but is not in the rows (its rating changed under the read) is shown without a rank.
  return { rows, standing: me.fights > 0 ? null : 'unrated' };
}

type Standing = { top: HighScore[] | null; near: HighScore[]; me: MySnapshot | null };

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
  return `Your rank: #${b.standing}`;
}

/** The slice of the high scores for what has been loaded (null while it is asked for). */
export function LeaderboardView({ got }: { got: Standing | null }) {
  if (got === null) return <p class="muted">Looking for rivals…</p>;
  if (got.top === null) return <p class="muted">Could not reach the rivals</p>;
  const b = boardOf(got.top, got.near, got.me);
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
  const [got, setGot] = useState<Standing | null>(null);
  const [posted, setPosted] = useState(postStatus(run).status === 'posted');
  useEffect(() => watchPost(() => setPosted(postStatus(run).status === 'posted')), [run]);
  useEffect(() => {
    let live = true;
    void loadStanding(run, TOP, SPAN).then((r) => live && setGot(r));
    return () => {
      live = false;
    };
  }, [run, posted]);
  return (
    <div class="board lf-panel" data-paint="panel">
      <h3 class="lf-h">High scores</h3>
      <LeaderboardView got={got} />
    </div>
  );
}
