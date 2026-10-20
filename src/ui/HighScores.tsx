import { useEffect, useState } from 'preact/hooks';
import { classDef } from '../data/classes';
import type { Controller } from '../run/controller';
import type { HighScore } from '../run/rivals';
import { loadHighScores } from '../rivals';

export type Loaded = { scores: HighScore[] | null; mine: Set<string> };

const className = (id: string): string => {
  try {
    return classDef(id).name;
  } catch {
    return id;
  }
};

/**
 * The best rated characters (docs/DUEL.md 6.3, `high_scores`): one row per character, by rating, the player's own marked. The
 * rating moves with every rated fight anyone reports. The list is of this version's characters, the ones that can be fought; a
 * box shows the older versions' list below it, marked outdated, asked for the first time it is ticked.
 */
export function HighScores({ c }: { c: Controller }) {
  const [got, setGot] = useState<Loaded | null>(null);
  const [showOlder, setShowOlder] = useState(false);
  const [older, setOlder] = useState<Loaded | null>(null);
  useEffect(() => {
    let live = true;
    void loadHighScores().then((r) => live && setGot(r));
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (!showOlder || older !== null) return;
    let live = true;
    void loadHighScores(undefined, true).then((r) => live && setOlder(r));
    return () => {
      live = false;
    };
  }, [showOlder]);
  return (
    <HighScoresView
      got={got}
      older={showOlder ? older : undefined}
      onShowOlder={setShowOlder}
      onBack={() => c.goTo('title')}
    />
  );
}

/** One list: a line while it is asked for, when it is out of reach or when it is empty, else the table. */
function ScoreList({ got }: { got: Loaded | null }) {
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
              <td class="num">{i + 1}</td>
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
  onBack,
}: {
  got: Loaded | null;
  older?: Loaded | null;
  onShowOlder?: (show: boolean) => void;
  onBack: () => void;
}) {
  const showOlder = older !== undefined;
  return (
    <div class={`screen highscores${showOlder ? ' hs-both' : ''}`}>
      <h2>High scores</h2>
      <ScoreList got={got} />
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
          <ScoreList got={older} />
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
