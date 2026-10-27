import { useEffect, useMemo, useState } from 'preact/hooks';
import { sheetDps } from '../calc/character';
import { gemDef } from '../data/gems';
import type { Controller } from '../run/controller';
import { sheetOf } from '../run/bot';
import {
  linkSupports,
  mainLostBy,
  planSheet,
  planSupports,
  slotLabel,
  supportChoices,
  type SocketRef,
  type SupportChoice,
} from '../run/inventoryOps';
import { ask } from './Confirm';

const pct = (a: number, b: number) => (a > 0 ? ((b - a) / a) * 100 : 0);

/** A DPS change as the Skills tab writes it: "▲12%", "▼3%", or nothing when it hardly moves. */
function Pct({ v }: { v: number }) {
  if (Math.abs(v) < 0.5) return <span class="badge neutral">no effect</span>;
  return (
    <span class={'badge ' + (v > 0 ? 'up' : 'down')}>
      {v > 0 ? '▲' : '▼'}
      {Math.abs(Math.round(v))}%
    </span>
  );
}

/**
 * The supports of one skill, chosen in one place (docs/GEM-SOCKETS.md 4): every support that works with it, the linked ones
 * ticked, the bag's below them and the ones on other gear at the bottom; as many can be ticked as the item has sockets beside
 * the skill. Each row says what ticking or unticking it does; "Socket these" puts the ticked ones in and names what leaves.
 */
export function SupportsPicker({
  c,
  at,
  onClose,
}: {
  c: Controller;
  at: SocketRef;
  onClose: () => void;
}) {
  const run = c.run!;
  const it = run.build.equipment[at.slot];
  const skill = it?.sockets[at.socket];
  const choices = useMemo(() => supportChoices(run, at), [run.build, run.inventory.length]);
  const cap = it ? it.sockets.length - 1 : 0;
  const [ticked, setTicked] = useState<number[]>(() =>
    choices.filter((x) => x.where === 'linked').map((x) => x.gem.uid),
  );
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);
  // The sheet of the build with the ticked supports, and of each row toggled, against it.
  const base = sheetOf(run);
  const plan = planSupports(run, at, ticked);
  const planDps = plan ? sheetDps(planSheet(run, plan)) : sheetDps(base);
  const rowPct = useMemo(() => {
    const m = new Map<number, number>();
    for (const x of choices) {
      const on = ticked.includes(x.gem.uid);
      if (!on && ticked.length >= cap) continue;
      const p = planSupports(
        run,
        at,
        on ? ticked.filter((u) => u !== x.gem.uid) : [...ticked, x.gem.uid],
      );
      if (p) m.set(x.gem.uid, pct(planDps, sheetDps(planSheet(run, p))));
    }
    return m;
  }, [ticked.join(','), run.build]);
  if (!it || !skill) return null;
  const name = gemDef(skill.gemId).name;
  const leaving = (plan?.out ?? []).map((g) => gemDef(g.gemId).name);
  const changed = plan && JSON.stringify(plan.build) !== JSON.stringify(run.build);
  const near = choices.filter((x) => x.where === 'linked' || x.where === 'bag');
  const far = choices.filter((x) => x.where !== 'linked' && x.where !== 'bag');
  const row = (x: SupportChoice) => {
    const on = ticked.includes(x.gem.uid);
    const full = !on && ticked.length >= cap;
    const d = rowPct.get(x.gem.uid);
    return (
      <label key={x.gem.uid} class={'sp-row' + (full ? ' full' : '')}>
        <input
          type="checkbox"
          checked={on}
          disabled={full}
          onChange={() =>
            setTicked(on ? ticked.filter((u) => u !== x.gem.uid) : [...ticked, x.gem.uid])
          }
        />
        <span class="sp-name">
          {gemDef(x.gem.gemId).name}
          {x.where !== 'linked' && x.where !== 'bag' && (
            <span class="sp-where"> · {slotLabel(x.where)}</span>
          )}
        </span>
        {d !== undefined && <Pct v={on ? -d : d} />}
      </label>
    );
  };
  const apply = async () => {
    if (!plan || !changed) return onClose();
    const lost = mainLostBy(run, plan.build);
    onClose();
    if (
      lost &&
      !(await ask({
        title: 'Lose your main skill?',
        body: `${lost} will no longer be used.`,
        confirm: 'Socket these',
        danger: true,
      }))
    )
      return;
    c.act((r) => linkSupports(r, at, ticked));
  };
  return (
    <div class="modal sp" onClick={onClose}>
      <div
        class="modal-card lf-panel sp-card"
        role="dialog"
        aria-label={`Supports for ${name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 class="lf-h">Supports for {name}</h3>
        <div class="sp-sub">
          {ticked.length} of {cap}
          {changed && (
            <>
              {' · '}
              <Pct v={pct(sheetDps(base), planDps)} />
            </>
          )}
        </div>
        {choices.length === 0 && <p class="sp-none">No support you have works with it.</p>}
        <div class="sp-list">
          {near.map(row)}
          {far.length > 0 && (
            <>
              <h4 class="sp-h">On your gear</h4>
              {far.map(row)}
            </>
          )}
        </div>
        {leaving.length > 0 && <div class="sp-out">To the bag: {leaving.join(', ')}</div>}
        <div class="item-actions">
          <button class="btn primary" disabled={!changed} onClick={() => void apply()}>
            Socket these
          </button>
          <button class="btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
