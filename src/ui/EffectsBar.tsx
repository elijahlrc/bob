import type { RunState } from '../run/run';
import { standingEffects, type StandingEffect } from '../run/reprieves';
import { infoProps } from './info';

const lasts = (e: StandingEffect): string =>
  e.left === null
    ? e.kind === 'blessing'
      ? 'until the next Shrine'
      : 'for the run'
    : `${e.left} level${e.left === 1 ? '' : 's'} left`;

/**
 * The effects bar (docs/ATTRITION.md): near the top of the Character tab, on its own porphyry ground, everything the character
 * carries from level to level and how long each lasts: a blessing or a curse on a line of its own, the relics as a compact
 * row of names whose text shows on hover (or a tap), to become icons later (the owner, 2026-10-30).
 */
export function EffectsBar({ run }: { run: RunState }) {
  const effects = standingEffects(run);
  if (!effects.length) return null;
  const lasting = effects.filter((e) => e.kind !== 'reward');
  const relics = effects.filter((e) => e.kind === 'reward');
  return (
    <section class="lf-panel effects-bar" data-paint="panel" data-field="porphyry">
      {lasting.length > 0 && (
        <ul>
          {lasting.map((e) => (
            <li key={e.kind + e.name} class={'eff-' + e.kind}>
              <b>{e.name}</b>
              <span>{e.text}</span>
              <span class="muted">{lasts(e)}</span>
            </li>
          ))}
        </ul>
      )}
      {relics.length > 0 && (
        <ul class="effects-relics" aria-label="Relics">
          {relics.map((e) => (
            <li key={e.name} tabIndex={0} {...infoProps(e.text)}>
              {e.name}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
