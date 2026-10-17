import { useState } from 'preact/hooks';
import { rivalName, rivalsConfigured, rivalsOn, setRivalName, setRivals } from '../rivals';
import { validName } from '../run/rivals';

/**
 * The opt-in to the rivals and high scores other players see, with the name that goes with it (docs/DUEL.md 6.2, 6.4): off until the
 * player turns it on, and a typed name is needed to duel. The title screen shows it always; the run summary shows it until the
 * character is sent. `onChange` says what the player touched, so that the summary can post the run that has just ended when the box
 * is ticked with a name already there. `refused` is a name the table did not take: the field says so while it still holds it.
 */
export function RivalsOptIn({
  onChange,
  refused = null,
}: {
  onChange?: (what: 'box' | 'name') => void;
  refused?: string | null;
}) {
  const [on, setOn] = useState(rivalsOn());
  const [name, setName] = useState(rivalName());
  if (!rivalsConfigured()) return null;
  const typed = name.trim();
  const bad = typed !== '' && !validName(typed);
  const denied = refused !== null && typed === refused;
  const hint = bad
    ? '3 to 16 letters, digits, spaces or hyphens; a letter or digit at each end.'
    : denied
      ? 'That name is not allowed'
      : typed === ''
        ? 'A name is needed to duel'
        : '';
  return (
    <div class="rivals-opt muted">
      <label title="Sent when a run ends, a death or a win: the character (class, level, passive tree, gear, gems and Strategy), the map reached and your name, with a random id kept in this browser. A name is needed to duel. Separate from the run statistics.">
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => {
            const v = (e.currentTarget as HTMLInputElement).checked;
            setRivals(v);
            setOn(v);
            onChange?.('box');
          }}
        />{' '}
        Add my characters to the rivals and high scores other players see
      </label>
      {on && (
        <div class="rival-name">
          <input
            type="text"
            maxLength={16}
            value={name}
            placeholder="Your name"
            aria-label="Your name"
            aria-invalid={bad || denied}
            onInput={(e) => {
              const v = (e.currentTarget as HTMLInputElement).value;
              setRivalName(v);
              setName(v);
              onChange?.('name');
            }}
          />
          {hint !== '' && <span class={bad || denied ? 'warn' : ''}>{hint}</span>}
          <span>Your address is kept, hashed, to block abuse.</span>
        </div>
      )}
    </div>
  );
}
