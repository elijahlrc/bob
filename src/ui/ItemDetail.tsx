import type { ComponentChildren } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import type { SheetDiff } from '../calc/character';
import { isWeaponClass, itemBase, WEAPON_TYPE_NAME } from '../data/bases';
import { CRAFTING_OPEN } from '../data/constants';
import { flaskBase } from '../data/flasks';
import { gemDef } from '../data/gems';
import type { EquipSlot, FlaskItem, GemItem, InventoryItem, Item } from '../data/types';
import { salvageValue } from '../run/craft';
import { slotsFor, type EquipCheck, type SocketOutcome } from '../run/inventory';
import {
  compareFlasks,
  compareSlots,
  slotName,
  type FlaskCompare,
  type ItemInfo,
  type SlotCompare,
} from '../run/inventoryOps';
import type { RunState } from '../run/run';
import { joinNames, socketBrief, socketsMatter } from '../run/socketText';
import { modsText } from '../mods/text';
import { triggerText } from '../data/triggers';
import { TAG_GLOSSARY } from '../data/glossary';
import { gemCardData } from './gemText';
import {
  armourLine,
  flaskBaseLines,
  gemLevelIn,
  itemTitle,
  NamePlaque,
  rarityClass,
  reqText,
  Stones,
  weaponLine,
} from './ItemCard';
import { infoProps } from './info';
import { compareGroups, type CompareRow } from './itemDiff';
import { SocketPips } from './SocketPips';

export type Sel =
  | { from: 'inv'; uid: number }
  | { from: 'pile'; uid: number }
  | { from: 'slot'; slot: EquipSlot }
  | { from: 'flask'; idx: number };

/** "Needs 40 int, you have 28" from a failed check. */
export function whyNot(check: EquipCheck): string {
  if (check.short)
    return `Needs ${check.short.need} ${check.short.attr.charAt(0).toUpperCase()}${check.short.attr.slice(1)}, you have ${Math.floor(check.short.have)}.`;
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

/** A large change on the result plaque: "−3% damage". */
function Big({ v, label }: { v: number; label: string }) {
  const r = Math.round(v);
  return (
    <span class="ix-big">
      <b class={r > 0 ? 'up' : r < 0 ? 'down' : ''}>
        {r > 0 ? '+' : r < 0 ? '−' : '±'}
        {Math.abs(r)}%
      </b>{' '}
      {label}
    </span>
  );
}

/** What a change does to the character, on a plaque: damage and effective HP large, then the rest (the Workbench's result). */
export function Delta({ d, dpsPct, ehpPct }: { d: SheetDiff; dpsPct: number; ehpPct: number }) {
  return (
    <div class="ix-delta" data-paint="panel" data-field="porphyry" data-thin>
      <Big v={dpsPct} label="damage" />
      <Big v={ehpPct} label="effective HP" />
      <span class="ix-delta-more">
        <Chip v={d.life} label="life" digits={0} />
        <Chip v={d.es} label="energy shield" digits={0} />
        <Chip v={d.mana} label="mana" digits={0} />
        <Chip v={d.res[3]} label="fire res" unit="%" />
        <Chip v={d.res[2]} label="cold res" unit="%" />
        <Chip v={d.res[1]} label="lightning res" unit="%" />
        <Chip v={d.res[4]} label="chaos res" unit="%" />
      </span>
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
  /** Go to the Skills tab with this bag gem picked, to socket it there. */
  onSocket: (uid: number) => void;
  onCraft: (uid: number) => void;
  /** Open the Skills tab at this slot's sockets. */
  onEditGems?: (slot: EquipSlot) => void;
  onClose: () => void;
  /** Move the selection to the previous (-1) or next (+1) row of the list. */
  onStep: (dir: -1 | 1) => void;
};

type Props = Actions & {
  run: RunState;
  sel: Sel | null;
  selected: InventoryItem | null;
  info: ItemInfo | undefined;
  favourite: boolean;
  /** Where the picked bag item is compared (a lit slot on the reliquary, or a tab); unset, the best one. */
  aimSlot: EquipSlot | null;
  aimFlask: number | null;
  onAim: (slot: EquipSlot | undefined, idx: number | undefined) => void;
  coarse: boolean;
  phone: boolean;
};

/** One signed change, the way the bag's rows say it: "▼22% DPS", "▲7% EHP"; nothing when it does not move. */
function Signed({ v, label }: { v: number; label: string }) {
  const r = Math.round(v);
  if (!r) return null;
  return (
    <span class={r > 0 ? 'up' : 'down'}>
      {r > 0 ? '▲' : '▼'}
      {Math.abs(r)}% {label}
    </span>
  );
}

/** What a tab says about the gems of its swap, in a few words. */
function tabGems(o: SocketOutcome): string {
  if (o.out.length) return `⚠ ${o.out.length} gem${o.out.length > 1 ? 's' : ''} out`;
  if (o.idle.length) return '⚠ a gem idles';
  return '';
}

/** A tab for each slot the item fits, with what it would do there. */
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
          data-paint="panel"
          data-thin={s.slot === active ? undefined : ''}
          onClick={() => pick(s.slot)}
        >
          <b>{s.label}</b>
          {s.check.ok ? (
            <span class="ix-tab-d">
              <Signed v={s.dpsPct} label="DPS" /> <Signed v={s.ehpPct} label="EHP" />
              {!Math.round(s.dpsPct) && !Math.round(s.ehpPct) && <span class="muted">±0%</span>}
              {tabGems(s.sockets) && <span class="warn"> {tabGems(s.sockets)}</span>}
            </span>
          ) : (
            <span class="ix-tab-d down">can't</span>
          )}
        </button>
      ))}
    </div>
  );
}

/** A flask slot's tab: the kind of flask in it ("Life", "Mana", "Hybrid"), a utility flask's first word ("Haste"). */
function flaskTab(f: FlaskItem | null | undefined): string {
  if (!f) return 'Empty';
  const b = flaskBase(f.baseId);
  return b.kind === 'utility' ? b.name.split(' ')[0] : b.kind[0].toUpperCase() + b.kind.slice(1);
}

/** The base's own numbers in boxes of their own: a weapon's damage, speed and crit, or the defences. */
function KeyNumbers({ it }: { it: Item }) {
  const w = weaponLine(it);
  const cells: { v: string; l: string; aug: boolean }[] = [];
  if (w) {
    cells.push(
      { v: w.phys.replace(' physical', ''), l: 'physical damage', aug: w.aug[0] },
      { v: w.speed.replace(' APS', ''), l: 'attacks a second', aug: w.aug[1] },
      { v: w.crit.replace(' crit', ''), l: 'critical chance', aug: w.aug[2] },
    );
    for (const e of w.extra) {
      const [v, type] = e.split(' ');
      cells.push({ v, l: `${type} added`, aug: true });
    }
  }
  for (const p of armourLine(it) ?? []) {
    const i = p.text.indexOf(' ');
    cells.push({ v: p.text.slice(0, i), l: p.text.slice(i + 1), aug: p.aug });
  }
  if (!cells.length) return null;
  return (
    <div class="ix-nums">
      {cells.map((c, i) => (
        <div key={i} class={'ix-num' + (c.aug ? ' aug' : '')}>
          <b>{c.v}</b>
          <span>{c.l}</span>
        </div>
      ))}
    </div>
  );
}

/** Lines of one group (what the base gives, or what the affixes give). */
function Lines({ lines, cls }: { lines: string[]; cls: string }) {
  if (!lines.length) return null;
  return (
    <div class="ix-lines">
      {lines.map((l, i) => (
        <div key={i} class={'ic-mod ' + cls}>
          {l}
        </div>
      ))}
    </div>
  );
}

/**
 * Everything about one item, laid out (docs/ITEM-SLOTS.md 2.2): its name, base and kind, its base's numbers in boxes, what
 * wearing it takes, its sockets, then the stats its base gives and, below a line, those its affixes give.
 */
function ItemSheet({
  it,
  run,
  bad,
  worn,
}: {
  it: InventoryItem;
  run: RunState;
  /** Why it cannot be worn, said beside its requirements. */
  bad?: string;
  /** A worn item names the gems in its sockets. */
  worn?: boolean;
}) {
  if (it.kind === 'gem') {
    // A gem laid out like an item: what it is and takes, then its numbers and, below a line, what it does.
    const d = gemCardData(gemDef(it.gemId), gemLevelIn(run.build, it.gemId));
    return (
      <div class="ix-sheet">
        <NamePlaque it={it} name={d.name} />
        <div class="muted">
          {d.type} · Level {d.level}
          {d.tags.length > 0 && ' · '}
          {d.tags.map((t, i) => (
            <span key={t}>
              {i > 0 && ', '}
              <span {...infoProps(TAG_GLOSSARY[t.toLowerCase()])}>{t}</span>
            </span>
          ))}
        </div>
        <div class="ix-req muted">Requires {d.requires}</div>
        <Lines lines={d.stats} cls="implicit" />
        <Lines lines={d.effects} cls="explicit" />
        <div class="ix-gemdesc">{d.description}</div>
      </div>
    );
  }
  if (it.kind === 'flask') {
    const b = flaskBase(it.baseId);
    return (
      <div class="ix-sheet">
        <NamePlaque it={it} name={it.name} />
        <div class="muted">
          Requires level {b.level} · {b.perUse}/{b.maxCharges} charges · {b.duration} s
        </div>
        <Lines lines={flaskBaseLines(it)} cls="implicit" />
        <Lines lines={it.affixes.flatMap((a) => modsText(a.mods))} cls="explicit" />
      </div>
    );
  }
  const b = itemBase(it.baseId);
  const all = [...it.affixes.flatMap((a) => a.mods), ...(it.uniqueMods ?? [])];
  const gems = it.sockets.filter((g): g is GemItem => g !== null);
  const base = [
    it.name !== b.name ? b.name : '',
    isWeaponClass(b.itemClass) ? WEAPON_TYPE_NAME[b.itemClass] : '',
  ]
    .filter(Boolean)
    .join(' · ');
  // The sockets sit at the right of the first line under the name, not on a line of their own.
  const stones = it.sockets.length > 0 && <Stones sockets={it.sockets} />;
  return (
    <div class="ix-sheet">
      <NamePlaque it={it} name={it.name} />
      {base && (
        <div class="ix-subrow">
          <span class="ic-base">{base}</span>
          {stones}
        </div>
      )}
      <KeyNumbers it={it} />
      <div class={'ix-subrow ' + (bad ? 'ix-req bad' : 'ix-req muted')}>
        <span>
          Requires {reqText(it)} · item level {it.ilvl}
          {bad && <div>{bad}</div>}
        </span>
        {!base && stones}
      </div>
      {worn && gems.length > 0 && (
        <div class="ix-gemnames">
          {joinNames(
            gems.map((g) => (g.uid === run.build.primaryGem ? '★ ' : '') + gemDef(g.gemId).name),
          )}
        </div>
      )}
      <Lines lines={modsText(it.implicits)} cls="implicit" />
      <Lines
        lines={[
          ...modsText(all.filter((m) => m.kind !== 'flag')),
          ...modsText(all.filter((m) => m.kind === 'flag')),
          ...(it.uniqueTriggers ?? []).map((t) => triggerText(t)),
        ]}
        cls="explicit"
      />
    </div>
  );
}

/** What wearing a bag item would do, for the page's header: the slot only when it fits more than one ("Ring 1: ▲5% EHP"). */
function Verdict({ it, info }: { it: InventoryItem; info: ItemInfo }) {
  if (it.kind === 'gem') return <span class="ix-where" />;
  if (it.kind === 'flask') {
    if (info.fillsFlask) return <span class="ix-where ix-verdict up">▲ empty flask slot</span>;
    if (info.flaskSlot !== undefined)
      return <span class="ix-where ix-verdict up">▲ upgrades flask {info.flaskSlot + 1}</span>;
    return <span class="ix-where" />;
  }
  if (!info.equippable)
    return (
      <span class="ix-where ix-verdict">
        <span class="down">can't use</span>
      </span>
    );
  const parts: ComponentChildren[] = [];
  const d = Math.round(info.dpsPct);
  const e = Math.round(info.ehpPct);
  if (d) parts.push(<Signed v={info.dpsPct} label="DPS" />);
  if (e) parts.push(<Signed v={info.ehpPct} label="EHP" />);
  if (!d && !e) parts.push(<span class="muted">no change</span>);
  if (info.gemsOut.length)
    parts.push(
      <span class="warn">
        ⚠ {info.gemsOut.length} gem{info.gemsOut.length > 1 ? 's' : ''} out
      </span>,
    );
  if (info.skillsIdle.length)
    parts.push(<span class="warn">⚠ {gemDef(info.skillsIdle[0].gemId).name} stops</span>);
  return (
    <span class="ix-where ix-verdict">
      {slotsFor(it).length > 1 && info.slot && <span class="muted">{slotName(info.slot)}: </span>}
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && <span class="muted">{' · '}</span>}
          {p}
        </span>
      ))}
    </span>
  );
}

/** The change a swap makes, for the header: "▲4% DPS · ▼1% EHP", or "no change". */
function Change({ dps, ehp }: { dps: number; ehp: number }) {
  if (!Math.round(dps) && !Math.round(ehp)) return <span class="muted">no change</span>;
  return (
    <>
      <Signed v={dps} label="DPS" />
      {Math.round(dps) !== 0 && Math.round(ehp) !== 0 && <span class="muted">{' · '}</span>}
      <Signed v={ehp} label="EHP" />
    </>
  );
}

/** The sockets before and after a swap, and what happens to the gems, on one line. */
function SocketLine({
  was,
  o,
  primary,
}: {
  was: Item | undefined;
  o: SocketOutcome;
  primary: number | undefined;
}) {
  if (!socketsMatter(o)) return null;
  const note = socketBrief(o, primary);
  return (
    <div class="ix-sline">
      {was?.sockets.length ? (
        <SocketPips sockets={was.sockets} primary={primary} />
      ) : (
        <span class="muted">none</span>
      )}
      <span aria-hidden="true">→</span>
      <SocketPips sockets={o.placed} primary={primary} out={o.out} />
      {note.text && (
        <span class={'ix-sk-note ' + note.severity} role="status">
          {note.severity === 'good' ? '' : '⚠ '}
          {note.text}
        </span>
      )}
    </div>
  );
}

const MARK_A: Record<CompareRow['mark'], string> = {
  same: '',
  better: 'gain',
  worse: 'lost',
  apart: 'gain',
};

/**
 * The two items side by side (docs/ITEM-SLOTS.md 2.3): what each is, then the stats its base gives, then those its affixes
 * give. A stat both have is one row; the rest fill the rows beside each other.
 */
function CompareGrid({
  it,
  worn,
  label,
}: {
  it: Item | FlaskItem;
  worn: Item | FlaskItem | undefined;
  label: string;
}) {
  const g = compareGroups(it, worn);
  const none = <span class="none">—</span>;
  const sub = (x: Item | FlaskItem) => {
    if (x.kind === 'flask') {
      const b = flaskBase(x.baseId);
      return `Requires level ${b.level} · ${b.perUse}/${b.maxCharges} charges · ${b.duration} s`;
    }
    const b = itemBase(x.baseId);
    return [
      x.name !== b.name ? b.name : '',
      isWeaponClass(b.itemClass) ? WEAPON_TYPE_NAME[b.itemClass] : '',
    ]
      .filter(Boolean)
      .join(' · ');
  };
  const req = (x: Item | FlaskItem) =>
    x.kind === 'item' ? `Requires ${reqText(x)} · ilvl ${x.ilvl}` : '';
  const sockets = (x: Item | FlaskItem | undefined) =>
    x?.kind === 'item' && x.sockets.length ? <Stones sockets={x.sockets} /> : null;
  const rows = (list: CompareRow[]) =>
    list.map((r, i) => [
      <div key={`a${i}`} class={MARK_A[r.mark]}>
        {r.a ?? ''}
      </div>,
      <div key={`b${i}`} class={r.mark === 'apart' ? 'lost' : ''}>
        {r.b ?? ''}
      </div>,
    ]);
  return (
    <div class="ix-cmp">
      {/* Each item's sockets at the right of its caption, not on a row of their own. */}
      <div class="cap">
        <span>New</span>
        {sockets(it)}
      </div>
      <div class="cap">
        <span>{worn ? `Worn: ${label}` : `${label}: nothing worn`}</span>
        {sockets(worn)}
      </div>
      <div class={'nm ' + rarityClass(it)}>{itemTitle(it)}</div>
      <div class={worn ? 'nm ' + rarityClass(worn) : ''}>{worn ? itemTitle(worn) : none}</div>
      {(sub(it) || (worn && sub(worn))) && [
        <div key="sa" class="lbl">
          {sub(it) || none}
        </div>,
        <div key="sb" class="lbl">
          {worn ? sub(worn) || none : none}
        </div>,
      ]}
      {req(it) && [
        <div key="ra" class="lbl">
          {req(it)}
        </div>,
        <div key="rb" class="lbl">
          {worn ? req(worn) : none}
        </div>,
      ]}
      {g.base.length > 0 && <div class="sec" />}
      {rows(g.base)}
      {g.affix.length > 0 && <div class="sec" />}
      {rows(g.affix)}
    </div>
  );
}

/** "Wear in Off hand", "Wear as Ring 1" for an empty slot; "Swap into Body" for one with an item in it. */
const wearLabel = (label: string, worn: boolean) =>
  worn ? `Swap into ${label}` : /^Ring/.test(label) ? `Wear as ${label}` : `Wear in ${label}`;

/** The compare of a bag item with what each slot it fits holds, and the swap. */
function ItemCompare({
  run,
  item,
  aim,
  onAim,
  a,
}: {
  run: RunState;
  item: Item;
  aim: EquipSlot | null;
  onAim: (slot: EquipSlot) => void;
  a: Actions;
}) {
  const slots = useMemo(() => compareSlots(run, item.uid), [run.build, run.inventory, item.uid]);
  const best = slots.find((s) => s.best) ?? slots[0];
  const active = (aim && slots.find((s) => s.slot === aim)) || best;
  if (!active) return null;
  const ok = active.check.ok;
  return (
    <Page
      head={
        <span class="ix-where ix-verdict">
          {ok ? (
            <Change dps={active.dpsPct} ehp={active.ehpPct} />
          ) : (
            <span class="down">can't</span>
          )}
        </span>
      }
      extra={
        // The sockets before and after, and what happens to the gems, in the header's room at the right.
        ok && <SocketLine was={active.equipped} o={active.sockets} primary={run.build.primaryGem} />
      }
      back="‹ Item"
      a={a}
      bar={
        <>
          <button
            class="btn primary"
            disabled={!ok}
            onClick={() => a.onEquip(item.uid, active.slot)}
          >
            {wearLabel(active.label, !!active.equipped)}
          </button>
          {!ok && <span class="ix-why">{whyNot(active.check)}</span>}
        </>
      }
    >
      <SlotTabs slots={slots} active={active.slot} pick={onAim} />
      {!ok && (
        <div class="warn ix-warn" data-paint="panel" data-field="vermilion" data-thin>
          {whyNot(active.check)}
        </div>
      )}
      <CompareGrid it={item} worn={active.equipped} label={active.label} />
    </Page>
  );
}

/** The compare of a bag flask with each flask slot, and the swap. */
function FlaskCompareView({
  run,
  flask,
  aim,
  onAim,
  a,
}: {
  run: RunState;
  flask: FlaskItem;
  aim: number | null;
  onAim: (idx: number) => void;
  a: Actions;
}) {
  const slots = useMemo(() => compareFlasks(run, flask.uid), [run.build, run.inventory, flask.uid]);
  const chosen = slots.find((s) => s.chosen) ?? slots[0];
  const active: FlaskCompare = (aim !== null && slots.find((s) => s.idx === aim)) || chosen;
  const label = `Flask ${active.idx + 1}`;
  return (
    <Page
      head={<span class="ix-where">Compare</span>}
      back="‹ Item"
      a={a}
      bar={
        <>
          <button
            class="btn primary"
            disabled={!active.ok}
            onClick={() => a.onEquipFlask(flask.uid, active.idx)}
          >
            {active.equipped ? `Swap into ${label}` : `Carry as ${label}`}
          </button>
          {!active.ok && <span class="ix-why">{active.reason}.</span>}
        </>
      }
    >
      <div class="ix-tabs" role="tablist" aria-label="Flask slot">
        {slots.map((s) => (
          <button
            key={s.idx}
            role="tab"
            aria-selected={s.idx === active.idx}
            class={'ix-tab ix-ftab' + (s.idx === active.idx ? ' on' : '')}
            data-paint="panel"
            data-thin
            data-field={s.idx === active.idx ? 'gold' : undefined}
            aria-label={`Flask ${s.idx + 1}`}
            onClick={() => onAim(s.idx)}
          >
            <b>{flaskTab(s.equipped)}</b>
          </button>
        ))}
      </div>
      <CompareGrid it={flask} worn={active.equipped ?? undefined} label={label} />
    </Page>
  );
}

/** The frame of the item page and the compare: a header, the body that scrolls, the bar of actions always in sight. */
function Page({
  head,
  back,
  a,
  bar,
  extra,
  children,
}: {
  head: ComponentChildren;
  back: string;
  a: Actions & { onBack?: () => void };
  bar: ComponentChildren;
  /** More controls at the right of the header (previous/next, the favourite star). */
  extra?: ComponentChildren;
  children: ComponentChildren;
}) {
  return (
    <div class="ix-detail ix-page">
      <div class="ix-phead">
        <button class="btn small ix-back" onClick={a.onBack ?? a.onClose}>
          {back}
        </button>
        {head}
        {extra}
      </div>
      <div class="ix-pbody">{children}</div>
      <div class="ix-pbar">{bar}</div>
    </div>
  );
}

/**
 * What is selected, as a page (docs/ITEM-SLOTS.md): everything about the item, with Compare (a bag item), Socket (a gem),
 * Take off (a worn item) or Put back (a discarded one); Compare shows the item beside what it would replace, with the swap.
 * On a phone the page covers the tab; on a wider screen it is the middle column.
 */
export function ItemDetail(p: Props) {
  const { run, sel, selected } = p;
  const [compare, setCompare] = useState(false);
  const key = sel ? JSON.stringify(sel) : '';
  useEffect(() => setCompare(false), [key]);
  // A lit slot on the reliquary (a wider screen) compares the picked item with what that slot holds.
  useEffect(() => {
    if (p.aimSlot !== null || p.aimFlask !== null) setCompare(true);
  }, [p.aimSlot, p.aimFlask]);
  const a: Actions = p;
  if (!sel || !selected) {
    // The keys, for a keyboard; the empty column needs no instructions.
    return (
      <div class="ix-detail ix-empty">
        {!p.coarse && (
          <div class="ix-guide">
            <span
              class="ix-keys"
              {...infoProps(
                'Keys: ↑/↓ browse · Enter equip · F favourite · Del discard · U take off · Ctrl+Z undo. Drag an item onto a slot to equip it.',
              )}
            >
              ?
            </span>
          </div>
        )}
      </div>
    );
  }
  const inBag = sel.from === 'inv';
  if (compare && inBag && selected.kind === 'item')
    return (
      <ItemCompare
        run={run}
        item={selected}
        aim={p.aimSlot}
        onAim={(slot) => p.onAim(slot, undefined)}
        a={{ ...a, onBack: () => setCompare(false) } as Actions}
      />
    );
  if (compare && inBag && selected.kind === 'flask')
    return (
      <FlaskCompareView
        run={run}
        flask={selected}
        aim={p.aimFlask}
        onAim={(idx) => p.onAim(undefined, idx)}
        a={{ ...a, onBack: () => setCompare(false) } as Actions}
      />
    );

  const where =
    sel.from === 'slot'
      ? `Worn: ${slotName(sel.slot)}`
      : sel.from === 'flask'
        ? `Worn: Flask ${sel.idx + 1}`
        : sel.from === 'pile'
          ? 'Discarded'
          : '';
  const steps = (sel.from === 'inv' || sel.from === 'pile') && (
    <>
      <button class="btn small" aria-label="Previous item" onClick={() => a.onStep(-1)}>
        ◂
      </button>
      <button class="btn small" aria-label="Next item" onClick={() => a.onStep(1)}>
        ▸
      </button>
    </>
  );
  const star = inBag && (
    <button
      class={'btn small ix-fav' + (p.favourite ? ' on' : '')}
      aria-label={p.favourite ? 'Remove from favourites' : 'Add to favourites'}
      onClick={() => a.onFavourite(selected.uid)}
    >
      {p.favourite ? '★' : '☆'}
    </button>
  );
  const craft = selected.kind === 'item' && CRAFTING_OPEN && (
    <button class="btn small" onClick={() => a.onCraft(selected.uid)} disabled={!!selected.sealed}>
      Craft…
    </button>
  );
  const discard = (
    <button class="btn small danger" onClick={() => a.onDiscard(selected.uid)}>
      Discard
    </button>
  );
  let bar: ComponentChildren;
  if (sel.from === 'pile')
    bar = (
      <button class="btn primary" onClick={() => a.onPutBack(selected.uid)}>
        Put back in the bag
      </button>
    );
  else if (!inBag)
    bar = (
      <>
        <button
          class="btn primary"
          onClick={() => (sel.from === 'slot' ? a.onUnequip(sel.slot) : a.onUnequipFlask(sel.idx))}
        >
          Take off
        </button>
        {sel.from === 'slot' && selected.kind === 'item' && selected.sockets.length > 0 && (
          <button class="btn small" onClick={() => a.onEditGems?.(sel.slot)}>
            Edit gems →
          </button>
        )}
        {craft}
      </>
    );
  else if (selected.kind === 'gem')
    bar = (
      <>
        <button class="btn primary" onClick={() => a.onSocket(selected.uid)}>
          Socket
        </button>
        {discard}
      </>
    );
  else
    bar = (
      <>
        <button class="btn primary" onClick={() => setCompare(true)}>
          Compare
        </button>
        {craft}
        {discard}
      </>
    );
  // Why a bag item cannot be worn, beside its requirements: the check of the slot it would go in.
  const bad =
    inBag && selected.kind === 'item' && p.info && !p.info.equippable
      ? (() => {
          const s = compareSlots(run, selected.uid).find((x) => !x.check.ok);
          return s ? whyNot(s.check) : p.info.reason;
        })()
      : undefined;
  return (
    <Page
      head={
        inBag && p.info ? (
          <Verdict it={selected} info={p.info} />
        ) : (
          <span class="ix-where">{where}</span>
        )
      }
      back={p.phone ? '‹ Bag' : '×'}
      a={a}
      bar={bar}
      extra={
        <>
          {steps}
          {star}
        </>
      }
    >
      <ItemSheet it={selected} run={run} bad={bad} worn={!inBag && sel.from !== 'pile'} />
      {sel.from === 'pile' && (
        <div class="ix-verdict muted">
          Worth {salvageValue(selected)} Bone Dust when you salvage the pile.
        </div>
      )}
    </Page>
  );
}
