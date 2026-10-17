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
 * rating moves with every rated fight anyone reports.
 */
export function HighScores({ c }: { c: Controller }) {
  const [got, setGot] = useState<Loaded | null>(null);
  useEffect(() => {
    let live = true;
    void loadHighScores().then((r) => live && setGot(r));
    return () => {
      live = false;
    };
  }, []);
  return <HighScoresView got={got} onBack={() => c.goTo('title')} />;
}

/** The screen for what has been loaded so far (null while the list is being asked for). */
export function HighScoresView({ got, onBack }: { got: Loaded | null; onBack: () => void }) {
  return (
    <div class="screen highscores">
      <h2>High scores</h2>
      {got === null && <p class="muted">Looking for rivals…</p>}
      {got !== null && got.scores === null && <p>Could not reach the rivals</p>}
      {got?.scores?.length === 0 && <p>No duels yet.</p>}
      {got?.scores && got.scores.length > 0 && (
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
                <tr key={s.id} class={got.mine.has(s.id) ? 'hs-me' : ''}>
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
      )}
      <div class="menu row">
        <button class="btn" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  );
}
