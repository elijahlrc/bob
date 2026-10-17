import { useEffect, useState } from 'preact/hooks';
import { classDef } from '../data/classes';
import type { Controller } from '../run/controller';
import { buildSignature, type Rival } from '../run/rivals';
import { loadRivals, postStatus, retryRivals } from '../rivals';

/** The name of the feature: the run summary's button and this screen's heading. */
export const DUEL_TITLE = "Duel for your damned soul's fate";

/** One rival: who, what they reached, where they stand, what they built, and what the player has done against them. */
function RivalCard({ c, rival, myId }: { c: Controller; rival: Rival; myId: string }) {
  const rec = c.book.get(myId, rival.id);
  const sig = buildSignature(rival.build);
  const mine = c.rivals?.mine;
  return (
    <button
      class="rival-card"
      onClick={() => {
        if (mine) c.startRivalDuel(rival, mine.id, mine.name);
      }}
    >
      <span class="rc-head">
        <b class="rc-name">{rival.name}</b>
        {rival.bot && <span class="rc-bot">bot</span>}
      </span>
      <span>
        {classDef(rival.classId).name} · level {rival.level}
      </span>
      <span>
        map {rival.map}, {rival.outcome}
      </span>
      <span class="muted">
        rating {rival.rating} · {rival.wins} of {rival.fights} won
      </span>
      {sig.length > 0 && <span class="rc-sig muted">{sig.join(' · ')}</span>}
      {rec && (
        <span class="rc-you">
          you: {rec.wins} of {rec.fights}
        </span>
      )}
    </button>
  );
}

/**
 * The rivals near the map the run ended on (docs/DUEL.md 6.5): five cards drawn from twenty, a button on each that starts the
 * duel. The fetches are made once when the screen opens; "Show others" draws five more of the twenty.
 */
export function Rivals({ c }: { c: Controller }) {
  const s = c.rivals;
  const run = c.run;
  const [busy, setBusy] = useState(false);
  // The screen of a session that is new (the first visit, or one made again by a retry) asks for its cards.
  useEffect(() => {
    if (s && !s.started) void loadRivals(c);
  }, [c, s]);
  if (!s || !run) return null;
  const back = (
    <button class="btn" onClick={() => c.goTo(s.home)}>
      Back
    </button>
  );
  const canRetry =
    s.status === 'unsent' && s.why === 'unreachable' && postStatus(run).status === 'failed';
  return (
    <div class="screen rivals">
      <h2>{DUEL_TITLE}</h2>
      {s.status === 'loading' && <p class="muted">Looking for rivals…</p>}
      {s.status === 'offline' && <p>Could not reach the rivals</p>}
      {s.status === 'empty' && <p>No rivals near this map</p>}
      {s.status === 'unsent' && (
        <p>{s.why === 'name' ? 'That name is not allowed' : 'Your character could not be sent'}</p>
      )}
      {s.status === 'ready' && s.mine && (
        <div class="rival-cards">
          {s.shown.map((r) => (
            <RivalCard key={r.id} c={c} rival={r} myId={s.mine!.id} />
          ))}
        </div>
      )}
      <div class="menu row">
        {s.status === 'ready' && s.pool.length > s.shown.length && (
          <button class="btn" onClick={() => c.showOthers()}>
            Show others
          </button>
        )}
        {canRetry && (
          <button
            class="btn"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void retryRivals(c).finally(() => setBusy(false));
            }}
          >
            Try again
          </button>
        )}
        {back}
      </div>
    </div>
  );
}
