import type { RunState } from '../run/run';
import { standingEffects, type StandingEffect } from '../run/reprieves';

const lasts = (e: StandingEffect): string =>
  e.left === null
    ? e.kind === 'blessing'
      ? 'until the next Shrine'
      : 'for the run'
    : `${e.left} level${e.left === 1 ? '' : 's'} left`;

/**
 * The effects bar (docs/ATTRITION.md): near the top of the Character tab, on its own porphyry ground, everything the character
 * carries from level to level (a blessing, a curse, a run reward) and how long each lasts.
 */
export function EffectsBar({ run }: { run: RunState }) {
  const effects = standingEffects(run);
  if (!effects.length) return null;
  return (
    <section class="lf-panel effects-bar" data-paint="panel" data-field="porphyry">
      <ul>
        {effects.map((e) => (
          <li key={e.kind + e.name} class={'eff-' + e.kind}>
            <b>{e.name}</b>
            <span>{e.text}</span>
            <span class="muted">{lasts(e)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
