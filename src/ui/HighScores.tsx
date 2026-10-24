import { useEffect, useState } from 'preact/hooks';
import { classDef } from '../data/classes';
import type { Controller } from '../run/controller';
import type { HighScore } from '../run/rivals';
import { loadHighScores } from '../rivals';

/** A list as loaded so far: the rows (null when out of reach), the player's own ids, and whether a page follows. */
export type Loaded = { scores: HighScore[] | null; mine: Set<string>; more?: boolean };

const className = (id: string): string => {
  try {
    return classDef(id).name;
  } catch {
    return id;
  }
};

/**
 * One list, a page at a time: the first page once `on` is set, and the next each time `more` is called; a page that cannot be
 * reached ends the list where it is.
 */
function usePaged(outdated: boolean, on: boolean): [Loaded | null, () => void, boolean] {
  const [got, setGot] = useState<Loaded | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!on || got !== null) return;
    let live = true;
    void loadHighScores(undefined, outdated).then((r) => live && setGot(r));
    return () => {
      live = false;
    };
  }, [on]);
  const more = () => {
    if (busy || !got?.scores || !got.more) return;
    setBusy(true);
    void loadHighScores(undefined, outdated, got.scores.length).then((r) => {
      setBusy(false);
      setGot((g) =>
        g?.scores
          ? { ...g, scores: [...g.scores, ...(r.scores ?? [])], more: r.scores !== null && r.more }
          : g,
      );
    });
  };
  return [got, more, busy];
}

/**
 * The best rated characters (docs/DUEL.md 6.3, `high_scores_page`): one row per character, by rating, the player's own marked,
 * fifty at a time with Show more. The rating moves with every rated fight anyone reports. The list is of this version's
 * characters, the ones that can be fought; a box shows the older versions' list below it, marked outdated, asked for the first
 * time it is ticked.
 */
export function HighScores({ c }: { c: Controller }) {
  const [showOlder, setShowOlder] = useState(false);
  const [got, more, busy] = usePaged(false, true);
  const [older, moreOlder, busyOlder] = usePaged(true, showOlder);
  return (
    <HighScoresView
      got={got}
      older={showOlder ? older : undefined}
      onShowOlder={setShowOlder}
      onMore={busy ? undefined : more}
      onMoreOlder={busyOlder ? undefined : moreOlder}
      onBack={() => c.goTo('title')}
    />
  );
}

/** One list: a line while it is asked for, when it is out of reach or when it is empty, else the table. */
function ScoreList({ got, onMore }: { got: Loaded | null; onMore?: () => void }) {
  if (got === null) return <p class="muted">Looking for rivals…</p>;
  if (got.scores === null) return <p>Could not reach the rivals</p>;
  if (got.scores.length === 0) return <p>No duels yet.</p>;
  const mine = got.mine;
  return (
    <div class="hs-scroll">
      <table class="hs-table">
        <thead>
          <tr>
            <th class="num">#</th>
            <th>Name</th>
            <th>Class</th>
            <th class="num hs-x">Level</th>
            <th class="num">Rating</th>
            <th class="num hs-x">Fights</th>
            <th class="num hs-x">Won</th>
            <th class="hs-x">Posted</th>
          </tr>
        </thead>
        <tbody>
          {got.scores.map((s, i) => (
            <tr key={s.id} class={mine.has(s.id) ? 'hs-me' : ''}>
              <td class="num">{s.rank ?? i + 1}</td>
              <td class="hs-name">{s.name}</td>
              <td>{className(s.classId)}</td>
              <td class="num hs-x">{s.level}</td>
              <td class="num">{s.rating}</td>
              <td class="num hs-x">{s.fights}</td>
              <td class="num hs-x">{s.wins}</td>
              <td class="hs-x">{s.postedOn}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {got.more && (
        <button class="btn hs-more" disabled={!onMore} onClick={() => onMore?.()}>
          Show more
        </button>
      )}
    </div>
  );
}

/**
 * The screen for what has been loaded so far (null while a list is being asked for). `older` is undefined while the box is not
 * ticked, and the older versions' list once it is.
 */
export function HighScoresView({
  got,
  older,
  onShowOlder,
  onMore,
  onMoreOlder,
  onBack,
}: {
  got: Loaded | null;
  older?: Loaded | null;
  onShowOlder?: (show: boolean) => void;
  onMore?: () => void;
  onMoreOlder?: () => void;
  onBack: () => void;
}) {
  const showOlder = older !== undefined;
  return (
    <div class={`screen highscores${showOlder ? ' hs-both' : ''}`}>
      <h2>High scores</h2>
      <ScoreList got={got} onMore={onMore} />
      <label class="muted hs-older-check">
        <input
          type="checkbox"
          checked={showOlder}
          onChange={(e) => onShowOlder?.((e.target as HTMLInputElement).checked)}
        />{' '}
        Show high scores from older versions
      </label>
      {showOlder && (
        <>
          <h3 class="hs-older">Older versions (outdated)</h3>
          <p class="muted">
            These characters were made in an earlier version and can no longer be fought.
          </p>
          <ScoreList got={older} onMore={onMoreOlder} />
        </>
      )}
      <div class="menu row">
        <button class="btn" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  );
}
