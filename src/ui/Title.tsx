import { classDef } from '../data/classes';
import type { Controller } from '../run/controller';

export function Title({ c }: { c: Controller }) {
  const saved = c.saved;
  return (
    <div class="screen title">
      <h1>Bob</h1>
      <p class="subtitle">An auto-battler of bones and numbers.</p>
      <div class="menu">
        {saved.status === 'ok' && (
          <button class="btn primary" onClick={() => c.continueRun()}>
            Continue run — {classDef(saved.run.classId).name}, level {saved.run.build.level}, map{' '}
            {saved.run.map}
          </button>
        )}
        <button
          class={saved.status === 'ok' ? 'btn' : 'btn primary'}
          onClick={() => c.goTo('classSelect')}
        >
          New Run
        </button>
        <button class="btn" onClick={() => c.goTo('codex')}>
          Codex
        </button>
      </div>
      {saved.status === 'incompatible' && (
        <div class="warn">
          Save incompatible.{' '}
          <button class="btn small" onClick={() => c.discardSave()}>
            Discard it
          </button>
        </div>
      )}
      {saved.status === 'ok' && <p class="muted">Starting a new run replaces the saved one.</p>}
      {saved.status === 'ok' && (
        <button
          class="btn small"
          title="Copies the saved run to the clipboard so it can be attached to a bug report"
          onClick={() => void navigator.clipboard?.writeText(c.exportSave() ?? '')}
        >
          Copy save (for bug reports)
        </button>
      )}
      <div class="demo-panel">
        <div class="muted">Demo</div>
        <div class="showcase-row">
          <button class="btn" onClick={() => c.startShowcase(false)}>
            ▶ Showcase: crypt
          </button>
          <button class="btn" onClick={() => c.startShowcase(true)}>
            ▶ Showcase: boss
          </button>
        </div>
      </div>
    </div>
  );
}
