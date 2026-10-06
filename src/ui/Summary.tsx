import { classDef } from '../data/classes';
import type { Controller } from '../run/controller';

export function Summary({ c }: { c: Controller }) {
  const run = c.run;
  if (!run) return null;
  const won = c.screen === 'victory';
  const last = run.history[run.history.length - 1];
  const kills = run.history.reduce((s, h) => s + h.kills, 0);
  const reason = last?.status === 'timeout' ? ' (timed out)' : '';
  return (
    <div class="screen summary">
      <h2>{won ? 'Victory!' : 'Your run has ended'}</h2>
      <p>
        {classDef(run.classId).name} · Level {run.build.level}
      </p>
      <p>
        {won ? 'The Ossuary Regent has fallen.' : `Fell on map ${last?.map ?? run.map}${reason}.`}
      </p>
      <p class="muted">
        Maps cleared: {run.history.filter((h) => h.status === 'cleared').length} · Kills: {kills}
      </p>
      <button class="btn primary" onClick={() => c.quit()}>
        Back to title
      </button>
    </div>
  );
}
