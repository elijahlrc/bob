import { useState } from 'preact/hooks';
import { copyText } from '../clipboard';
import { classDef } from '../data/classes';
import type { Controller } from '../run/controller';
import type { SlotId, SlotSummary } from '../run/save';
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

export function Title({ c }: { c: Controller }) {
  const saves = c.saves.filter((s) => s.result.status !== 'none');
  const anyOk = saves.some((s) => s.result.status === 'ok');
  return (
    <div class="screen title">
      <h1>Bob</h1>
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
      {anyOk && (
        <p class="muted">Each run keeps its own save; a new run leaves the others alone.</p>
      )}
      <TelemetryNotice />
      <DebugPanel c={c} />
    </div>
  );
}
