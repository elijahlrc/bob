import { classDef } from '../data/classes';
import type { Controller } from '../run/controller';
import { StyleSwitcher } from './StyleSwitcher';

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
      <div class="style-panel">
        <div class="muted">Visual style</div>
        <StyleSwitcher c={c} />
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
