import type { Controller } from '../run/controller';

export function Title({ c }: { c: Controller }) {
  return (
    <div class="screen title">
      <h1>Bob</h1>
      <p class="subtitle">An auto-battler of bones and numbers.</p>
      <div class="menu">
        <button class="btn primary" onClick={() => c.goTo('classSelect')}>
          New Run
        </button>
      </div>
    </div>
  );
}
