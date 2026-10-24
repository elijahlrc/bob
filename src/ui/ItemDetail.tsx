import type { ComponentChildren } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import type { SheetDiff } from '../calc/character';
import { CRAFTING_OPEN } from '../data/constants';
import { flaskBase } from '../data/flasks';
import type { Build, EquipSlot, FlaskItem, GemItem, InventoryItem, Item } from '../data/types';
import { gemDef } from '../data/gems';
import { joinNames } from '../run/socketText';
import { salvageValue } from '../run/craft';
import {
  compareFlasks,
  compareSlots,
  slotName,
  type SocketRef,
  type FlaskCompare,
  type ItemInfo,
  type SlotCompare,
} from '../run/inventoryOps';
import type { EquipCheck, SocketOutcome } from '../run/inventory';
import type { RunState } from '../run/run';
import { ItemCard, itemTitle, lineMarks, rarityClass } from './ItemCard';
import { DiffCard, DiffLines } from './DiffCard';
import { diffRows, type DiffRow } from './itemDiff';
import { SocketPips, SocketsRow } from './SocketPips';
import { SocketPicker } from './SocketPicker';

export type Sel =
  | { from: 'inv'; uid: number }
  | { from: 'pile'; uid: number }
  | { from: 'slot'; slot: EquipSlot }
  | { from: 'flask'; idx: number };

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
      <span class="ix-arr">{v > 0 ? '▲' : '▼'} </span>
      {pct(v, digits)}
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
  onDiscard: (uid: number) => void;
  onPutBack: (uid: number) => void;
  onSocket: (uid: number) => void;
  /** Put this gem in that socket. */
  onSocketAt: (uid: number, ref: SocketRef) => void;
  onCraft: (uid: number) => void;
  /** Open the Skills tab at this slot's sockets. */
  onEditGems?: (slot: EquipSlot) => void;
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

/** The one way to get rid of something: put it aside in the discarded pile (it can be put back, or salvaged with the rest). */
function DiscardButton({ it, a }: { it: InventoryItem; a: Actions }) {
  return (
    <button class="btn small" onClick={() => a.onDiscard(it.uid)}>
      Discard
    </button>
  );
}

/** The card of the item and the one it would replace, side by side, with what differs marked. */
function Pair({
  item,
  against,
  empty,
  build,
}: {
  item: Item | FlaskItem;
  against?: Item | FlaskItem;
  empty: string;
  build?: Build;
}) {
  return (
    <div class="ix-pair">
      <div>
        <div class="muted cmp-title">New</div>
        <ItemCard it={item} build={build} marks={lineMarks(item, against, 'new')} />
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

/** What a tab says about the gems of its swap, in a few words. */
function tabGems(o: SocketOutcome): string {
  if (o.out.length) return `⚠ ${o.out.length} gem${o.out.length > 1 ? 's' : ''} out`;
  if (o.idle.length) return '⚠ a gem idles';
  if (o.before.filled || o.after.filled) return 'gems stay';
  return 'no gems';
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
            <>
              <span
                class={'ix-tab-d ' + (s.scorePct > 0.5 ? 'up' : s.scorePct < -0.5 ? 'down' : '')}
              >
                {s.scorePct > 0.05 ? '▲' : s.scorePct < -0.05 ? '▼' : '='}{' '}
                {Math.abs(Math.round(s.dpsPct))}% dmg · {Math.abs(Math.round(s.ehpPct))}% HP
                {s.best ? ' · best' : ''}
              </span>
              <span
                class={
                  'ix-tab-d ' + (s.sockets.out.length || s.sockets.idle.length ? 'warn' : 'muted')
                }
              >
                {tabGems(s.sockets)}
              </span>
            </>
          ) : (
            <span class="ix-tab-d down">can't</span>
          )}
        </button>
      ))}
    </div>
  );
}

/** The actions of a selected bag item. On a phone they are one compact row, with the peek/full switch at its end. */
function ActionRow({
  swap,
  title,
  disabled,
  onSwap,
  a,
  it,
  favourite,
  craft,
  phone,
  full,
  setFull,
  both,
  setBoth,
}: {
  swap: string;
  title?: string;
  disabled: boolean;
  onSwap: () => void;
  a: Actions;
  it: InventoryItem;
  favourite: boolean;
  craft?: Item;
  phone: boolean;
  full: boolean;
  setFull: (f: boolean) => void;
  /** The phone's "show both cards" switch (the full view only). */
  both?: boolean;
  setBoth?: (b: boolean) => void;
}) {
  return (
    <div class="item-actions ix-actions">
      <button class="btn primary" disabled={disabled} title={title} onClick={onSwap}>
        {swap}
      </button>
      <button
        class="btn small"
        aria-label={favourite ? 'Remove from favourites' : 'Add to favourites'}
        onClick={() => a.onFavourite(it.uid)}
      >
        {phone ? (favourite ? '★' : '☆') : favourite ? '★ Favourite' : '☆ Favourite'}
      </button>
      {craft && CRAFTING_OPEN && (
        <button class="btn small" onClick={() => a.onCraft(craft.uid)} disabled={!!craft.sealed}>
          Craft…
        </button>
      )}
      <DiscardButton it={it} a={a} />
      {phone && full && both !== undefined && setBoth && (
        <button
          class={'btn small ix-both' + (both ? ' on' : '')}
          aria-label="Show both cards"
          aria-pressed={both}
          onClick={() => setBoth(!both)}
        >
          Both
        </button>
      )}
      {phone && (
        <button
          class="btn small ix-expand"
          aria-label={full ? 'Show less' : 'Show everything'}
          aria-expanded={full}
          onClick={() => setFull(!full)}
        >
          {full ? '▾' : '▴'}
        </button>
      )}
    </div>
  );
}

/**
 * The phone's compare (docs/EQUIP.md 3.4). The peek opens on the lines that change and what happens to the gems; the full view adds
 * the calculated changes, the gems by name and the whole card, one merged card with the old values beside the new ones.
 */
function PhoneCompare({
  it,
  against,
  rows,
  full,
  both,
  build,
  extra,
  sockets,
}: {
  it: Item | FlaskItem;
  against: Item | FlaskItem | undefined;
  rows: DiffRow[];
  full: boolean;
  /** Both cards shown under the merged one. */
  both: boolean;
  build: Build;
  /** The calculated changes: with both cards shown, under them. */
  extra?: ComponentChildren;
  sockets?: ComponentChildren;
}) {
  if (!full)
    return (
      <>
        <DiffLines rows={rows} />
        {sockets}
      </>
    );
  return (
    <>
      {sockets}
      {against ? <DiffCard it={it} rows={rows} /> : <ItemCard it={it} build={build} />}
      {both && (
        <>
          <Pair item={it} against={against} empty="Worn" build={build} />
          {extra}
        </>
      )}
    </>
  );
}

function ItemBody({
  run,
  item,
  a,
  favourite,
  phone,
  full,
  setFull,
}: {
  run: RunState;
  item: Item;
  a: Actions;
  favourite: boolean;
  phone: boolean;
  full: boolean;
  setFull: (f: boolean) => void;
}) {
  const slots = useMemo(() => compareSlots(run, item.uid), [run.build, run.inventory, item.uid]);
  const [pick, setPick] = useState<{ uid: number; slot: EquipSlot } | null>(null);
  const [both, setBoth] = useState(false);
  const best = slots.find((s) => s.best) ?? slots[0];
  const active = (pick?.uid === item.uid && slots.find((s) => s.slot === pick.slot)) || best;
  if (!active) return null;
  const ok = active.check.ok;
  const chips =
    ok && active.delta ? (
      <Delta d={active.delta} dpsPct={active.dpsPct} ehpPct={active.ehpPct} />
    ) : null;
  const sockets = ok ? (
    <SocketsRow
      was={active.equipped}
      o={active.sockets}
      primary={run.build.primaryGem}
      names={!phone || full}
    />
  ) : null;
  const also = active.alsoMoves.length > 0 && (
    <div class="ix-note">
      Also sends back to the bag: {active.alsoMoves.map((x) => x.name).join(', ')}.
    </div>
  );
  return (
    <>
      <SlotTabs
        slots={slots}
        active={active.slot}
        pick={(s) => setPick({ uid: item.uid, slot: s })}
      />
      <div class="ix-vs">
        {active.equipped ? (
          <>
            vs <b>{active.equipped.name}</b> · worn in {active.label}
          </>
        ) : (
          <>{active.label} is empty</>
        )}
      </div>
      {!ok && <div class="warn">{whyNot(active.check)}</div>}
      {phone ? (
        <PhoneCompare
          it={item}
          against={active.equipped}
          rows={diffRows(item, active.equipped)}
          full={full}
          both={both}
          build={run.build}
          extra={chips}
          sockets={sockets}
        />
      ) : (
        <>
          {sockets}
          <Pair item={item} against={active.equipped} empty={`Worn: ${active.label}`} />
          {chips}
        </>
      )}
      {also}
      <ActionRow
        swap={active.equipped ? 'Swap' : 'Equip'}
        title={ok ? `Into ${active.label}` : whyNot(active.check)}
        disabled={!ok}
        onSwap={() => a.onEquip(item.uid, active.slot)}
        a={a}
        it={item}
        favourite={favourite}
        craft={item}
        phone={phone}
        full={full}
        setFull={setFull}
        both={both}
        setBoth={setBoth}
      />
    </>
  );
}

function FlaskBody({
  run,
  flask,
  a,
  favourite,
  phone,
  full,
  setFull,
}: {
  run: RunState;
  flask: FlaskItem;
  a: Actions;
  favourite: boolean;
  phone: boolean;
  full: boolean;
  setFull: (f: boolean) => void;
}) {
  const slots = useMemo(() => compareFlasks(run, flask.uid), [run.build, run.inventory, flask.uid]);
  const [pick, setPick] = useState<{ uid: number; idx: number } | null>(null);
  const [both, setBoth] = useState(false);
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
      <div class="ix-vs">
        {active.equipped ? (
          <>
            vs <b>{active.equipped.name}</b> · worn in Flask {active.idx + 1}
          </>
        ) : (
          <>Flask {active.idx + 1} is empty</>
        )}
      </div>
      {phone ? (
        <PhoneCompare
          it={flask}
          against={active.equipped ?? undefined}
          rows={diffRows(flask, active.equipped ?? undefined)}
          full={full}
          both={both}
          build={run.build}
        />
      ) : (
        <Pair
          item={flask}
          against={active.equipped ?? undefined}
          empty={`Worn: Flask ${active.idx + 1}`}
          build={run.build}
        />
      )}
      {!active.ok && <div class="warn">{active.reason}.</div>}
      {active.ok && active.equipped && flaskBase(active.equipped.baseId).kind !== kind && (
        <div class="ix-note">
          This replaces a {flaskBase(active.equipped.baseId).kind} flask with a {kind} one.
        </div>
      )}
      <ActionRow
        swap={active.equipped ? 'Swap' : 'Equip'}
        title={`Into Flask ${active.idx + 1}`}
        disabled={!active.ok}
        onSwap={() => a.onEquipFlask(flask.uid, active.idx)}
        a={a}
        it={flask}
        favourite={favourite}
        phone={phone}
        full={full}
        setFull={setFull}
        both={both}
        setBoth={setBoth}
      />
    </>
  );
}

/** The gems a worn item holds, by name, and the way to the Skills tab to change them. */
function WornGems({
  it,
  primary,
  onEdit,
}: {
  it: Item;
  primary: number | undefined;
  onEdit: () => void;
}) {
  if (it.sockets.length === 0) return null;
  const gems = it.sockets.filter((g): g is GemItem => g !== null);
  const free = it.sockets.length - gems.length;
  return (
    <div class="ix-worngems">
      <SocketPips sockets={it.sockets} primary={primary} />
      <span class="ix-note">
        {gems.length
          ? joinNames(gems.map((g) => (g.uid === primary ? '★ ' : '') + gemDef(g.gemId).name))
          : 'No gems'}
        {free > 0 ? ` · ${free} free socket${free === 1 ? '' : 's'}` : ''}
      </span>
      <button class="btn small" onClick={onEdit}>
        Edit gems →
      </button>
    </div>
  );
}

/** The panel for what is selected: a carried item with its comparison per slot, a worn item, a flask, a gem, or a guide. */
export function ItemDetail(p: Props) {
  const { run, sel, selected } = p;
  // The phone sheet opens on a peek of the answer; the full view is one tap (or the grab bar) away.
  const [full, setFull] = useState(false);
  const a: Actions = p;
  const head = (title: string, cls: string, star?: number) => (
    <div class="ix-head">
      {p.phone && (
        <button
          class="ix-grab"
          aria-label={full ? 'Show less' : 'Show everything'}
          onClick={() => setFull(!full)}
        />
      )}
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

  if (sel.from === 'pile') {
    return (
      <div class="ix-detail">
        {head(itemTitle(selected), rarityClass(selected))}
        {status}
        <div class="ix-body">
          <ItemCard it={selected} build={run.build} />
          <div class="item-actions ix-actions">
            <button class="btn primary" onClick={() => a.onPutBack(selected.uid)}>
              Put back in the bag
            </button>
          </div>
          <div class="ix-note">
            Worth {salvageValue(selected)} Bone Dust when you salvage the pile.
          </div>
        </div>
      </div>
    );
  }

  const inBag = sel.from === 'inv';
  return (
    <div class={'ix-detail' + (p.phone ? (full ? ' full' : ' peek') : '')}>
      {head(itemTitle(selected), rarityClass(selected), inBag ? selected.uid : undefined)}
      {status}
      <div class="ix-body">
        {inBag && selected.kind === 'item' && (
          <ItemBody
            run={run}
            item={selected}
            a={a}
            favourite={p.favourite}
            phone={p.phone}
            full={full}
            setFull={setFull}
          />
        )}
        {inBag && selected.kind === 'flask' && (
          <FlaskBody
            run={run}
            flask={selected}
            a={a}
            favourite={p.favourite}
            phone={p.phone}
            full={full}
            setFull={setFull}
          />
        )}
        {inBag && selected.kind === 'gem' && (
          <>
            <ItemCard it={selected} build={run.build} />
            <SocketPicker
              run={run}
              gemUid={selected.uid}
              onPlace={(ref) => a.onSocketAt(selected.uid, ref)}
            />
            <ActionRow
              swap="Socket"
              title="Into the place it helps most"
              disabled={false}
              onSwap={() => a.onSocket(selected.uid)}
              a={a}
              it={selected}
              favourite={p.favourite}
              phone={p.phone}
              full={full}
              setFull={setFull}
            />
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
              {selected.kind === 'item' && CRAFTING_OPEN && (
                <button
                  class="btn small"
                  onClick={() => a.onCraft(selected.uid)}
                  disabled={!!selected.sealed}
                >
                  Craft…
                </button>
              )}
            </div>
            {sel.from === 'slot' && selected.kind === 'item' && (
              <WornGems
                it={selected}
                primary={run.build.primaryGem}
                onEdit={() => a.onEditGems?.(sel.slot)}
              />
            )}
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
