import { useMemo, useState } from 'preact/hooks';
import { gemDef } from '../data/gems';
import { EQUIP_SLOTS, type Item } from '../data/types';
import { placementsFor, slotLabel, type Placement, type SocketRef } from '../run/inventoryOps';
import type { RunState } from '../run/run';

/** What putting a gem in a socket does to the character, in badges; or why it does nothing (no skill on that item for a support). */
export function Badge({
  p,
}: {
  p: Pick<Placement, 'dpsPct' | 'ehpPct' | 'scorePct'> &
    Partial<Pick<Placement, 'replaces' | 'fromRemoval'>> & { idle?: string };
}) {
  const parts: [string, number][] = [
    ['DPS', p.dpsPct],
    ['EHP', p.ehpPct],
  ];
  const shown = parts.filter(([, v]) => Math.abs(v) >= 0.5);
  if (shown.length === 0) return <span class="badge neutral">{p.idle ?? 'no change'}</span>;
  return (
    <>
      {shown.map(([l, v]) => (
        <span key={l} class={'badge ' + (v > 0 ? 'up' : 'down')}>
          {v > 0 ? '▲' : '▼'}
          {Math.abs(Math.round(v))}% {l}
        </span>
      ))}
      {p.idle && <span class="muted small"> · {p.idle}</span>}
    </>
  );
}

type Row = { item: Item; ref: SocketRef; p: Placement; free: number; best: boolean };

/**
 * Where a gem from the bag could go (docs/EQUIP.md 3.7): one row for each distinct outcome, an item's free sockets as one row
 * (every socket of an item is linked, so which free one makes no difference) and each socket that holds a gem as a row that
 * says what it replaces. A free socket takes the gem at once (the status line has Undo); a full one asks first, with what is
 * lost and what is gained, because the gem that goes out may be the one you meant to keep.
 */
export function SocketPicker({
  run,
  gemUid,
  onPlace,
}: {
  run: RunState;
  gemUid: number;
  onPlace: (ref: SocketRef) => void;
}) {
  const placements = useMemo(
    () => placementsFor(run, gemUid),
    [run.build, run.inventory.length, gemUid],
  );
  const [target, setTarget] = useState<{ gemUid: number; ref: SocketRef } | null>(null);
  const rows: Row[] = [];
  for (const slot of EQUIP_SLOTS) {
    const item = run.build.equipment[slot];
    if (!item || item.sockets.length === 0) continue;
    const ps = placements.filter((p) => p.slot === slot);
    const empty = ps.filter((p) => !item.sockets[p.socket]);
    if (empty.length)
      rows.push({
        item,
        ref: { slot, socket: empty[0].socket },
        p: empty[0],
        free: empty.length,
        best: false,
      });
    for (const p of ps)
      if (item.sockets[p.socket])
        rows.push({ item, ref: { slot, socket: p.socket }, p, free: 0, best: false });
  }
  const top = rows.reduce<Row | null>(
    (b, r) => (!r.p.idle && (!b || r.p.scorePct > b.p.scorePct) ? r : b),
    null,
  );
  if (top && top.p.scorePct > 0.5) top.best = true;
  if (rows.length === 0) return <div class="ix-note">No socketed gear to put it in.</div>;
  const pending = target?.gemUid === gemUid ? target.ref : null;
  const cur = pending ? run.build.equipment[pending.slot]?.sockets[pending.socket] : null;
  const curPlacement =
    pending && placements.find((p) => p.slot === pending.slot && p.socket === pending.socket);
  const lostPrimary = !!cur && run.build.primaryGem === cur.uid;
  return (
    <div class="ix-picker" data-paint="panel">
      <h4 class="lf-h">Socket it in</h4>
      {rows.map((r) => {
        const isFree = r.free > 0;
        const on = pending && pending.slot === r.ref.slot && pending.socket === r.ref.socket;
        return (
          <button
            key={`${r.ref.slot}:${r.ref.socket}`}
            class={'ix-prow' + (r.best ? ' best' : '') + (on ? ' on' : '')}
            data-paint="panel"
            data-thin={on ? undefined : ''}
            data-pk={on ? 'on' : r.best ? 'best' : ''}
            onClick={() =>
              isFree ? onPlace(r.ref) : setTarget(on ? null : { gemUid, ref: r.ref })
            }
          >
            <span class="m">
              <span class="ix-prow-name">{r.item.name}</span>
              <span class="ix-prow-sub">
                {slotLabel(r.ref.slot)} ·{' '}
                {isFree
                  ? `${r.free} free socket${r.free === 1 ? '' : 's'}`
                  : `replaces ${r.p.replaces ?? 'a gem'}`}
              </span>
            </span>
            <span class="ix-prow-b">
              <Badge p={r.p} />
            </span>
          </button>
        );
      })}
      {pending && cur && curPlacement && (
        <div class="ix-confirm" role="status" data-paint="panel" data-field="porphyry" data-thin>
          <div>
            Replace <b>{gemDef(cur.gemId).name}</b>
            {lostPrimary ? ', your main skill' : ''}? It goes to the bag.
          </div>
          <div class="ix-confirm-b">
            <Badge p={curPlacement} />
          </div>
          <div class="item-actions">
            <button class="btn small primary" onClick={() => onPlace(pending)}>
              Replace {gemDef(cur.gemId).name}
            </button>
            <button class="btn small" onClick={() => setTarget(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
