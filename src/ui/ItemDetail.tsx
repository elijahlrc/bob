import { useMemo, useState } from 'preact/hooks';
import type { SheetDiff } from '../calc/character';
import { flaskBase } from '../data/flasks';
import type { EquipSlot, FlaskItem, InventoryItem, Item } from '../data/types';
import { salvageValue } from '../run/craft';
import {
  compareFlasks,
  compareSlots,
  slotName,
  type FlaskCompare,
  type ItemInfo,
  type SlotCompare,
} from '../run/inventoryOps';
import type { EquipCheck } from '../run/inventory';
import type { RunState } from '../run/run';
import { ItemCard, itemTitle, lineMarks, rarityClass } from './ItemCard';

export type Sel =
  { from: 'inv'; uid: number } | { from: 'slot'; slot: EquipSlot } | { from: 'flask'; idx: number };

export type Status = { text: string; undo: boolean } | null;

/** "Needs 40 int, you have 28" from a failed check. */
export function whyNot(check: EquipCheck): string {
  if (check.short)
    return `Needs ${check.short.need} ${check.short.attr}, you have ${Math.floor(check.short.have)}.`;
  return (check.reason ?? 'Cannot be worn.') + (check.reason?.endsWith('.') ? '' : '.');
}

const pct = (v: number, digits = 0) =>
  `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;

/** One change to the character, as a chip: ▲ green when it helps, ▼ red when it hurts. */
function Chip({
  v,
  label,
  unit = '',
  digits = 0,
}: {
  v: number;
  label: string;
  unit?: string;
  digits?: number;
}) {
  if (Math.abs(v) < 0.05) return null;
  return (
    <span class={'ix-chip ' + (v > 0 ? 'up' : 'down')}>
      {v > 0 ? '▲' : '▼'} {pct(v, digits)}
      {unit} {label}
    </span>
  );
}

/** What wearing the item does to the character: DPS and effective HP first, then the rest. */
export function Delta({ d, dpsPct, ehpPct }: { d: SheetDiff; dpsPct: number; ehpPct: number }) {
  return (
    <div class="ix-delta">
      <Chip v={dpsPct} label="damage" unit="%" digits={0} />
      <Chip v={ehpPct} label="effective HP" unit="%" digits={0} />
      <Chip v={d.life} label="life" digits={0} />
      <Chip v={d.es} label="energy shield" digits={0} />
      <Chip v={d.mana} label="mana" digits={0} />
      <Chip v={d.res[3]} label="fire res" unit="%" />
      <Chip v={d.res[2]} label="cold res" unit="%" />
      <Chip v={d.res[1]} label="lightning res" unit="%" />
      <Chip v={d.res[4]} label="chaos res" unit="%" />
    </div>
  );
}

type Actions = {
  onEquip: (uid: number, slot: EquipSlot) => void;
  onEquipFlask: (uid: number, idx: number) => void;
  onUnequip: (slot: EquipSlot) => void;
  onUnequipFlask: (idx: number) => void;
  onFavourite: (uid: number) => void;
  onSalvage: (uid: number) => void;
  onDiscard: (uid: number) => void;
  onSocket: (uid: number) => void;
  onCraft: (uid: number) => void;
  onClose: () => void;
  /** Move the selection to the previous (-1) or next (+1) row of the list. */
  onStep: (dir: -1 | 1) => void;
  onUndo: () => void;
};

type Props = Actions & {
  run: RunState;
  sel: Sel | null;
  selected: InventoryItem | null;
  info: ItemInfo | undefined;
  favourite: boolean;
  status: Status;
  upgrades: number;
  onBestUpgrade: () => void;
  coarse: boolean;
  phone: boolean;
};

function Menu({ it, a }: { it: InventoryItem; a: Actions }) {
  const [open, setOpen] = useState(false);
  return (
    <span class="ix-menu">
      <button class="btn small" aria-expanded={open} onClick={() => setOpen(!open)}>
        Get rid of ▾
      </button>
      {open && (
        <span class="ix-menu-pop">
          <button
            class="btn small danger"
            onClick={() => {
              setOpen(false);
              a.onSalvage(it.uid);
            }}
          >
            Salvage → {salvageValue(it)} Bone Dust (final)
          </button>
          <button
            class="btn small"
            onClick={() => {
              setOpen(false);
              a.onDiscard(it.uid);
            }}
          >
            Discard (no Dust, can be undone)
          </button>
        </span>
      )}
    </span>
  );
}

/** The card of the item and the one it would replace, side by side, with what differs marked. */
function Pair({ item, against, empty }: { item: Item; against?: Item; empty: string }) {
  return (
    <div class="ix-pair">
      <div>
        <div class="muted cmp-title">New</div>
        <ItemCard it={item} marks={lineMarks(item, against, 'new')} />
      </div>
      <div>
        <div class="muted cmp-title">{empty}</div>
        {against ? (
          <ItemCard it={against} marks={lineMarks(against, item, 'old')} />
        ) : (
          <div class="item-card empty-card muted">Empty slot</div>
        )}
      </div>
    </div>
  );
}

function SlotTabs({
  slots,
  active,
  pick,
}: {
  slots: SlotCompare[];
  active: EquipSlot;
  pick: (s: EquipSlot) => void;
}) {
  if (slots.length < 2) return null;
  return (
    <div class="ix-tabs" role="tablist" aria-label="Compare with">
      {slots.map((s) => (
        <button
          key={s.slot}
          role="tab"
          aria-selected={s.slot === active}
          class={'ix-tab' + (s.slot === active ? ' on' : '') + (s.check.ok ? '' : ' blocked')}
          onClick={() => pick(s.slot)}
        >
          <b>{s.label}</b>
          <span class="muted">{s.equipped ? s.equipped.name : 'empty'}</span>
          {s.check.ok ? (
            <span class={'ix-tab-d ' + (s.scorePct > 0.5 ? 'up' : s.scorePct < -0.5 ? 'down' : '')}>
              {s.scorePct > 0.05 ? '▲' : s.scorePct < -0.05 ? '▼' : '='}{' '}
              {Math.abs(Math.round(s.dpsPct))}% dmg · {Math.abs(Math.round(s.ehpPct))}% HP
              {s.best ? ' · best' : ''}
            </span>
          ) : (
            <span class="ix-tab-d down">can't</span>
          )}
        </button>
      ))}
    </div>
  );
}

function ItemBody({
  run,
  item,
  a,
  favourite,
  phone,
}: {
  run: RunState;
  item: Item;
  a: Actions;
  favourite: boolean;
  phone: boolean;
}) {
  const slots = useMemo(() => compareSlots(run, item.uid), [run.build, run.inventory, item.uid]);
  const [pick, setPick] = useState<{ uid: number; slot: EquipSlot } | null>(null);
  const [cards, setCards] = useState(!phone);
  const best = slots.find((s) => s.best) ?? slots[0];
  const active = (pick?.uid === item.uid && slots.find((s) => s.slot === pick.slot)) || best;
  if (!active) return null;
  return (
    <>
      <SlotTabs
        slots={slots}
        active={active.slot}
        pick={(s) => setPick({ uid: item.uid, slot: s })}
      />
      {phone && (
        <button class="btn small ix-cards-toggle" onClick={() => setCards(!cards)}>
          {cards ? 'Hide the cards ▴' : 'Show the cards ▾'}
        </button>
      )}
      {(cards || !phone) && (
        <Pair item={item} against={active.equipped} empty={`Worn: ${active.label}`} />
      )}
      {active.check.ok && active.delta ? (
        <Delta d={active.delta} dpsPct={active.dpsPct} ehpPct={active.ehpPct} />
      ) : (
        <div class="warn">{whyNot(active.check)}</div>
      )}
      {active.alsoMoves.length > 0 && (
        <div class="ix-note">
          Also sends back to the bag: {active.alsoMoves.map((x) => x.name).join(', ')}.
        </div>
      )}
      <div class="item-actions ix-actions">
        <button
          class="btn primary"
          disabled={!active.check.ok}
          title={active.check.ok ? undefined : whyNot(active.check)}
          onClick={() => a.onEquip(item.uid, active.slot)}
        >
          {active.equipped ? `Swap with ${active.label}` : `Equip → ${active.label}`}
        </button>
        <button class="btn small" onClick={() => a.onFavourite(item.uid)}>
          {favourite ? '★ Favourite' : '☆ Favourite'}
        </button>
        <button class="btn small" onClick={() => a.onCraft(item.uid)} disabled={!!item.sealed}>
          Craft…
        </button>
        <Menu it={item} a={a} />
      </div>
    </>
  );
}

function FlaskBody({
  run,
  flask,
  a,
  favourite,
}: {
  run: RunState;
  flask: FlaskItem;
  a: Actions;
  favourite: boolean;
}) {
  const slots = useMemo(() => compareFlasks(run, flask.uid), [run.build, run.inventory, flask.uid]);
  const [pick, setPick] = useState<{ uid: number; idx: number } | null>(null);
  const chosen = slots.find((s) => s.chosen) ?? slots[0];
  const active: FlaskCompare =
    (pick?.uid === flask.uid && slots.find((s) => s.idx === pick.idx)) || chosen;
  const kind = flaskBase(flask.baseId).kind;
  return (
    <>
      <div class="ix-tabs" role="tablist" aria-label="Flask slot">
        {slots.map((s) => (
          <button
            key={s.idx}
            role="tab"
            aria-selected={s.idx === active.idx}
            class={'ix-tab' + (s.idx === active.idx ? ' on' : '')}
            onClick={() => setPick({ uid: flask.uid, idx: s.idx })}
          >
            <b>Flask {s.idx + 1}</b>
            <span class="muted">{s.equipped ? s.equipped.name : 'empty'}</span>
            {s.chosen && <span class="ix-tab-d">usual pick</span>}
          </button>
        ))}
      </div>
      <div class="ix-pair">
        <div>
          <div class="muted cmp-title">New</div>
          <ItemCard it={flask} build={run.build} />
        </div>
        <div>
          <div class="muted cmp-title">Worn: Flask {active.idx + 1}</div>
          {active.equipped ? (
            <ItemCard it={active.equipped} />
          ) : (
            <div class="item-card empty-card muted">Empty slot</div>
          )}
        </div>
      </div>
      {!active.ok && <div class="warn">{active.reason}.</div>}
      {active.ok && active.equipped && flaskBase(active.equipped.baseId).kind !== kind && (
        <div class="ix-note">
          This replaces a {flaskBase(active.equipped.baseId).kind} flask with a {kind} one.
        </div>
      )}
      <div class="item-actions ix-actions">
        <button
          class="btn primary"
          disabled={!active.ok}
          onClick={() => a.onEquipFlask(flask.uid, active.idx)}
        >
          {active.equipped
            ? `Swap with Flask ${active.idx + 1}`
            : `Equip → Flask ${active.idx + 1}`}
        </button>
        <button class="btn small" onClick={() => a.onFavourite(flask.uid)}>
          {favourite ? '★ Favourite' : '☆ Favourite'}
        </button>
        <Menu it={flask} a={a} />
      </div>
    </>
  );
}

/** The panel for what is selected: a carried item with its comparison per slot, a worn item, a flask, a gem, or a guide. */
export function ItemDetail(p: Props) {
  const { run, sel, selected } = p;
  const a: Actions = p;
  const head = (title: string, cls: string, star?: number) => (
    <div class="ix-head">
      <span class={'ix-title ' + cls}>{title}</span>
      {p.phone && (
        <>
          <button class="btn small" aria-label="Previous item" onClick={() => a.onStep(-1)}>
            ◂
          </button>
          <button class="btn small" aria-label="Next item" onClick={() => a.onStep(1)}>
            ▸
          </button>
        </>
      )}
      {star !== undefined && (
        <button
          class={'ix-star' + (p.favourite ? ' on' : '')}
          aria-label={p.favourite ? 'Remove from favourites' : 'Add to favourites'}
          onClick={() => a.onFavourite(star)}
        >
          {p.favourite ? '★' : '☆'}
        </button>
      )}
      <button class="sheet-x ix-close" aria-label="Close" onClick={a.onClose}>
        ×
      </button>
    </div>
  );
  const status = p.status && (
    <div class="ix-status" role="status">
      {p.status.text}{' '}
      {p.status.undo && (
        <button class="link" onClick={a.onUndo}>
          Undo
        </button>
      )}
    </div>
  );

  if (!sel || !selected) {
    return (
      <div class="ix-detail ix-empty">
        {status}
        <div class="ix-guide">
          <b>Pick something</b>
          <div class="muted">
            {p.coarse ? 'Tap' : 'Click'} an item in the bag to see how it changes you, slot by slot.
            Then equip it, swap it, or get rid of it.
          </div>
          {p.upgrades > 0 && (
            <button class="btn small primary" onClick={p.onBestUpgrade}>
              {p.upgrades} upgrade{p.upgrades > 1 ? 's' : ''} in the bag: show the best
            </button>
          )}
          {!p.coarse && (
            <div class="muted hint">
              Keys: ↑/↓ browse · Enter equip · F favourite · Del discard · U take off · Ctrl+Z undo.
              Drag an item onto a slot to equip it.
            </div>
          )}
        </div>
      </div>
    );
  }

  const inBag = sel.from === 'inv';
  return (
    <div class="ix-detail">
      {head(itemTitle(selected), rarityClass(selected), inBag ? selected.uid : undefined)}
      {status}
      <div class="ix-body">
        {inBag && selected.kind === 'item' && (
          <ItemBody run={run} item={selected} a={a} favourite={p.favourite} phone={p.phone} />
        )}
        {inBag && selected.kind === 'flask' && (
          <FlaskBody run={run} flask={selected} a={a} favourite={p.favourite} />
        )}
        {inBag && selected.kind === 'gem' && (
          <>
            <ItemCard it={selected} build={run.build} />
            <div class="item-actions ix-actions">
              <button class="btn primary" onClick={() => a.onSocket(selected.uid)}>
                Socket (best free socket)
              </button>
              <button class="btn small" onClick={() => a.onFavourite(selected.uid)}>
                {p.favourite ? '★ Favourite' : '☆ Favourite'}
              </button>
              <Menu it={selected} a={a} />
            </div>
            <div class="ix-note">Choose which socket on the Skills tab.</div>
          </>
        )}
        {!inBag && (
          <>
            <ItemCard it={selected} build={run.build} />
            <div class="item-actions ix-actions">
              <button
                class="btn primary"
                onClick={() =>
                  sel.from === 'slot' ? a.onUnequip(sel.slot) : a.onUnequipFlask(sel.idx)
                }
              >
                Take off
              </button>
              {selected.kind === 'item' && (
                <button
                  class="btn small"
                  onClick={() => a.onCraft(selected.uid)}
                  disabled={!!selected.sealed}
                >
                  Craft…
                </button>
              )}
            </div>
            {sel.from === 'slot' && <div class="ix-note">Worn in {slotName(sel.slot)}.</div>}
          </>
        )}
        {p.info &&
          !p.info.equippable &&
          inBag &&
          selected.kind !== 'gem' &&
          p.info.reason &&
          selected.kind === 'flask' && <div class="warn">{p.info.reason}.</div>}
      </div>
    </div>
  );
}
