import { classDef } from '../data/classes';
import type { Controller, DuelOutcome } from '../run/controller';
import { DUEL_STALL_TIME } from '../sim/duel';
import { MapReportView } from './MapReport';

/** Who won and how, as a headline (side 0 is the viewer's). */
function headline(o: DuelOutcome): string {
  const { winner, how } = o.result;
  if (winner === 0) return 'You won';
  if (winner === 1) return 'You fell';
  if (how === 'time') return 'A draw: time ran out';
  if (how === 'stall') return `A draw: nobody landed a blow for ${DUEL_STALL_TIME} s`;
  return 'A draw: both fell';
}

/**
 * The end of a duel (docs/DUEL.md 5): who won and how, the time, and what each side dealt (by skill) and took (by source), then
 * Again (the same two characters on a new seed) and Back.
 */
export function DuelResultView({ c }: { c: Controller }) {
  const o = c.lastDuel;
  const d = c.duel;
  if (!o || !d) return null;
  const { result, names } = o;
  const survivor = result.winner === null ? null : result.winner;
  const classes = [classDef(d.a.classId).name, classDef(d.b.classId).name];
  const title = (i: 0 | 1): string =>
    i === 0
      ? `You (${classes[0]})`
      : names[1] === classes[1]
        ? names[1]
        : `${names[1]} (${classes[1]})`;
  return (
    <div class="screen summary duel-result">
      <h2>{headline(o)}</h2>
      <p class="muted">
        {result.time.toFixed(1)} s
        {survivor !== null &&
          ` · ${survivor === 0 ? 'you' : names[1]} left with ${Math.round(result.sides[survivor].lifeLeft * 100)}% of ${survivor === 0 ? 'your' : 'its'} life`}
      </p>
      <div class="menu row">
        <button class="btn primary" onClick={() => c.againDuel()}>
          Again
        </button>
        <button class="btn" onClick={() => c.leaveDuel()}>
          Back
        </button>
      </div>
      <div class="duel-sides">
        <MapReportView r={o.reports[0]} title={title(0)} who="you" />
        <MapReportView r={o.reports[1]} title={title(1)} who={names[1]} />
      </div>
    </div>
  );
}
