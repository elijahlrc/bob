import { useEffect, useState } from 'preact/hooks';
import { classDef } from '../data/classes';
import { themeDef } from '../data/themes';
import type { Controller } from '../run/controller';

const COUNTDOWN = 2;

export function Camp({ c }: { c: Controller }) {
  const run = c.run;
  const [left, setLeft] = useState<number | null>(null);
  const auto = !!run && run.autoContinue && c.canAutoContinue();
  useEffect(() => {
    if (!auto) {
      setLeft(null);
      return;
    }
    setLeft(COUNTDOWN);
    const start = performance.now();
    const id = setInterval(() => {
      const remain = COUNTDOWN - (performance.now() - start) / 1000;
      if (remain <= 0) {
        clearInterval(id);
        c.startMap(0);
      } else setLeft(remain);
    }, 100);
    return () => clearInterval(id);
  }, [auto, run?.map]);
  if (!run) return null;
  const last = c.lastResult;
  return (
    <div class="screen camp">
      <h2>Camp</h2>
      <p>
        {classDef(run.classId).name} · Level {run.build.level} · Next: map {run.map} of 100
      </p>
      {last && last.status === 'cleared' && (
        <p class="muted">
          Map cleared in {last.time.toFixed(0)} s · {last.kills} kills
        </p>
      )}
      <div class="theme-choice">
        {run.nextThemes.map((id, i) => {
          const t = themeDef(id);
          return (
            <button key={id} class="btn theme" onClick={() => c.startMap(i)}>
              <div class="theme-name">{t.name}</div>
              <div class="muted">{t.bonusText}</div>
            </button>
          );
        })}
      </div>
      <label class="muted">
        <input
          type="checkbox"
          checked={run.autoContinue}
          onChange={(e) => c.setAutoContinue((e.target as HTMLInputElement).checked)}
        />{' '}
        Auto-continue
        {left !== null && ` — starting ${themeDef(run.nextThemes[0]).name} in ${left.toFixed(1)} s`}
      </label>
      <button class="btn" onClick={() => c.quit()}>
        Abandon run
      </button>
    </div>
  );
}
