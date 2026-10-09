import { useState } from 'preact/hooks';
import { copyText } from '../clipboard';
import { classDef } from '../data/classes';
import type { Controller } from '../run/controller';
import { setTelemetry, telemetryConfigured, telemetryOn } from '../telemetry';
import { DebugPanel } from './Debug';

/** Copies the saved run so it can be attached to a bug report, and says whether that worked. */
function CopySave({ c }: { c: Controller }) {
  const [state, setState] = useState<'idle' | 'ok' | 'failed'>('idle');
  return (
    <button
      class="btn small"
      title="Copies the saved run to the clipboard so it can be attached to a bug report"
      onClick={() =>
        void copyText(c.exportSave() ?? '').then((ok) => {
          setState(ok ? 'ok' : 'failed');
          setTimeout(() => setState('idle'), 3000);
        })
      }
    >
      {state === 'ok'
        ? 'Copied'
        : state === 'failed'
          ? 'Could not copy'
          : 'Copy save (for bug reports)'}
    </button>
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
      {saved.status === 'ok' && <CopySave c={c} />}
      <TelemetryNotice />
      <DebugPanel c={c} />
      <div class="demo-panel">
        <div class="muted">Demo</div>
        <div class="showcase-row">
          <button class="btn" onClick={() => c.startShowcase(false)}>
            ▶ Showcase: crypt
          </button>
          <button class="btn" onClick={() => c.startShowcase(true)}>
            ▶ Showcase: boss
          </button>
          <button class="btn" onClick={() => c.startGallery()}>
            ▶ Skill gallery
          </button>
        </div>
      </div>
    </div>
  );
}
