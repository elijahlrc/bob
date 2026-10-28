import { useState } from 'preact/hooks';
import { classDef } from '../data/classes';
import type { Controller } from '../run/controller';
import type { SlotSummary } from '../run/save';
import { ask } from './Confirm';

const kb = (chars: number): string => `${Math.max(1, Math.round(chars / 1024))} KB`;

function Row({ c, slot }: { c: Controller; slot: SlotSummary }) {
  const res = slot.result;
  const run = res.status === 'ok' ? res.run : null;
  const name = run
    ? `${classDef(run.classId).name}, level ${run.build.level}, map ${run.map}`
    : 'Run from another version';
  const del = async () => {
    const ok =
      !run ||
      (await ask({
        title: 'Delete this saved run?',
        body: 'The run and its character are lost for good.',
        facts: [name],
        confirm: 'Delete the save',
        danger: true,
      }));
    if (ok) c.discardSave(slot.id);
  };
  return (
    <div class="save-row">
      <div class="save-who">
        <span class="save-name">{name}</span>
        <span class="save-at">{kb(slot.size)}</span>
      </div>
      <button class="btn small danger" onClick={() => void del()}>
        Delete
      </button>
    </div>
  );
}

/**
 * Shown on every screen while the browser has refused to store the run: the run goes on, but closing the page loses what has
 * not been saved. Lists the other saved runs, largest first, to delete.
 */
export function SaveWarning({ c }: { c: Controller }) {
  const [open, setOpen] = useState(false);
  if (!c.saveFailed) return null;
  const others = c.saves.filter((s) => s.id !== c.currentSlot).sort((a, b) => b.size - a.size);
  return (
    <div class="save-warning" role="alert" data-paint="panel" data-field="vermilion" data-thin>
      <div class="save-warning-head">
        <strong>This run is not being saved.</strong>
        <span>The browser has no room for it. Leaving the page now loses your progress.</span>
        <button class="btn small" onClick={() => setOpen(!open)}>
          {open ? 'Hide runs' : 'Delete old runs'}
        </button>
      </div>
      {open &&
        (others.length > 0 ? (
          <div class="saves">
            {others.map((s) => (
              <Row key={s.id} c={c} slot={s} />
            ))}
          </div>
        ) : (
          <div>
            There are no other saved runs. The space is used by something else on this site.
          </div>
        ))}
    </div>
  );
}
