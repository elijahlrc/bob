import { useState } from 'preact/hooks';
import { copyText } from '../clipboard';
import { classDef } from '../data/classes';
import type { Controller } from '../run/controller';
import type { SlotId, SlotSummary } from '../run/save';
import { rivalName, rivalsConfigured, rivalsOn, setRivalName, setRivals } from '../rivals';
import { validName } from '../run/rivals';
import { setTelemetry, telemetryConfigured, telemetryOn } from '../telemetry';
import { ask } from './Confirm';
import { DebugPanel } from './Debug';

/** Copies the saved run so it can be attached to a bug report, and says whether that worked. */
function CopySave({ c, id }: { c: Controller; id: SlotId }) {
  const [state, setState] = useState<'idle' | 'ok' | 'failed'>('idle');
  return (
    <button
      class="btn small"
      title="Copies this saved run to the clipboard so it can be attached to a bug report"
      onClick={() =>
        void copyText(c.exportSave(id) ?? '').then((ok) => {
          setState(ok ? 'ok' : 'failed');
          setTimeout(() => setState('idle'), 3000);
        })
      }
    >
      {state === 'ok' ? 'Copied' : state === 'failed' ? 'Could not copy' : 'Copy'}
    </button>
  );
}

/** One saved run: continue it, copy it for a bug report, or delete it (after asking). */
function SaveRow({ c, slot, first }: { c: Controller; slot: SlotSummary; first: boolean }) {
  const res = slot.result;
  if (res.status === 'none') return null;
  const del = async (what: string) => {
    const ok = await ask({
      title: 'Delete this saved run?',
      body: 'The run and its character are lost for good.',
      facts: [what],
      confirm: 'Delete the save',
      danger: true,
    });
    if (ok) c.discardSave(slot.id);
  };
  if (res.status === 'incompatible')
    return (
      <div class="save-row warn">
        <span class="save-name">Save incompatible with this version</span>
        <CopySave c={c} id={slot.id} />
        <button class="btn small danger" onClick={() => c.discardSave(slot.id)}>
          Discard
        </button>
      </div>
    );
  const { run } = res;
  const name = `${classDef(run.classId).name}, level ${run.build.level}, map ${run.map}`;
  return (
    <div class="save-row">
      <button
        class={first ? 'btn primary save-name' : 'btn save-name'}
        onClick={() => c.continueRun(slot.id)}
      >
        Continue — {name}
      </button>
      <CopySave c={c} id={slot.id} />
      <button class="btn small danger" onClick={() => void del(name)}>
        Delete
      </button>
    </div>
  );
}

/** Says that finished runs are reported without anything about the player, and lets the player turn that off. */
function TelemetryNotice() {
  const [on, setOn] = useState(telemetryOn());
  if (!telemetryConfigured()) return null;
  return (
    <label
      class="telemetry muted"
      title="Sent when a run ends: class, level, map, what killed you and the map's modifiers. No name, no save, no cookies."
    >
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => {
          const v = (e.currentTarget as HTMLInputElement).checked;
          setTelemetry(v);
          setOn(v);
        }}
      />{' '}
      Send anonymous run results (what killed you, where, as which class) to help balance the game
    </label>
  );
}

/** Lets the player add their characters to the rivals and high scores other players see, with a name of their choosing (off until they do). */
function RivalsNotice() {
  const [on, setOn] = useState(rivalsOn());
  const [name, setName] = useState(rivalName());
  if (!rivalsConfigured()) return null;
  const bad = name.trim() !== '' && !validName(name.trim());
  return (
    <div class="rivals-opt muted">
      <label title="Sent when a run ends, a death or a win: the character (class, level, passive tree, gear, gems and Strategy), the map reached and your name, with a random id kept in this browser. Separate from the run statistics.">
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => {
            const v = (e.currentTarget as HTMLInputElement).checked;
            setRivals(v);
            setOn(v);
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
            aria-invalid={bad}
            onInput={(e) => {
              const v = (e.currentTarget as HTMLInputElement).value;
              setRivalName(v);
              setName(v);
            }}
          />
          <span class={bad ? 'warn' : ''}>
            {bad
              ? '3 to 16 letters, digits, spaces or hyphens; a letter or digit at each end.'
              : 'Leave blank for a name the game makes up'}
          </span>
        </div>
      )}
    </div>
  );
}

/** The invite to the game's Discord server (a permanent one). Empty hides the invitation. */
export const DISCORD_URL = 'https://discord.gg/JJJgK9Prj3';

/** The Discord mark, drawn in the colour of the text round it (Simple Icons, CC0). */
function DiscordMark() {
  return (
    <svg class="discord-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"
      />
    </svg>
  );
}

/** Asks players to come and say what they think of the game. */
function DiscordInvite() {
  if (!DISCORD_URL) return null;
  return (
    <p class="discord">
      Your feedback shapes this game. Found a bug, or something that feels off?{' '}
      <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
        <DiscordMark />
        Join the Discord
      </a>{' '}
      and tell us.
    </p>
  );
}

export function Title({ c }: { c: Controller }) {
  const saves = c.saves.filter((s) => s.result.status !== 'none');
  const anyOk = saves.some((s) => s.result.status === 'ok');
  return (
    <div class="screen title">
      <h1>Battle of Builds</h1>
      <p class="subtitle">An auto-battler of bones and numbers.</p>
      {saves.length > 0 && (
        <div class="saves">
          {saves.map((s, i) => (
            <SaveRow key={s.id} c={c} slot={s} first={i === 0} />
          ))}
        </div>
      )}
      <div class="menu">
        <button class={anyOk ? 'btn' : 'btn primary'} onClick={() => c.goTo('classSelect')}>
          New Run
        </button>
        <button class="btn" onClick={() => c.goTo('codex')}>
          Codex
        </button>
        <button class="btn" onClick={() => c.goTo('patchNotes')}>
          Patch notes
        </button>
      </div>
      <DiscordInvite />
      {anyOk && (
        <p class="muted">Each run keeps its own save; a new run leaves the others alone.</p>
      )}
      <TelemetryNotice />
      <RivalsNotice />
      <DebugPanel c={c} />
    </div>
  );
}
