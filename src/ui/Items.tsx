import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { EQUIP_SLOTS, type InventoryItem, type EquipSlot } from '../data/types';
import { resistPenaltyForMap } from '../gen/mapPlan';
import type { Controller } from '../run/controller';
import { salvage, salvageValue } from '../run/craft';
import {
  canEquip,
  discard,
  equip,
  equipFlask,
  INVENTORY_SIZE,
  slotsFor,
  unequip,
  unequipFlask,
} from '../run/inventory';
import {
  filterItems,
  isUpgrade,
  itemInfos,
  junkItems,
  quickEquip,
  slotLabel,
  SORT_LABELS,
  sortItems,
  type FilterKey,
  type ItemInfo,
  type SortKey,
} from '../run/inventoryOps';
import { useViewport } from './device';
import { compareDelta, ItemCard, itemTitle, rarityClass } from './ItemCard';
import { loadPref, savePref } from './prefs';

type Sel =
  { from: 'inv'; uid: number } | { from: 'slot'; slot: EquipSlot } | { from: 'flask'; idx: number };

type ListFilter = FilterKey | 'last';

const FILTERS: [ListFilter, string][] = [
  ['all', 'All'],
  ['last', 'Last map'],
  ['upgrades', 'Upgrades'],
  ['weapon', 'Weapons'],
  ['armour', 'Armour'],
  ['jewellery', 'Jewellery'],
  ['flask', 'Flasks'],
  ['gem', 'Gems'],
  ['usable', 'Usable'],
];

function Badge({ v, label }: { v: number; label: string }) {
  if (Math.abs(v) < 0.5) return null;
  return (
    <span
      class={'badge ' + (v > 0 ? 'up' : 'down')}
      title={`${v > 0 ? '+' : ''}${v.toFixed(1)}% ${label}`}
    >
      {v > 0 ? '▲' : '▼'}
      {Math.abs(Math.round(v))}% {label}
    </span>
  );
}

export function Items({ c }: { c: Controller }) {
  const run = c.run!;
  const { coarse } = useViewport();
  const [sel, setSel] = useState<Sel | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  const [sort, setSort] = useState<SortKey>(() => loadPref<SortKey>('inv.sort', 'newest'));
  const [desc, setDesc] = useState<boolean>(() => loadPref<boolean>('inv.desc', false));
  const [filter, setFilter] = useState<ListFilter>(() => loadPref<ListFilter>('inv.filter', 'all'));
  // Items picked up since the last camp visit are tagged NEW (captured before they are acknowledged).
  const fresh = useRef(new Set(run.newLoot));
  useEffect(() => {
    if (run.newLoot.length) c.act((r) => (r.newLoot = []));
  }, []);
  useEffect(() => savePref('inv.sort', sort), [sort]);
  useEffect(() => savePref('inv.desc', desc), [desc]);
  useEffect(() => savePref('inv.filter', filter), [filter]);

  const cfg = { areaLevel: run.map, resistPenalty: resistPenaltyForMap(run.map) };
  const infos = useMemo(() => itemInfos(run), [run.build, run.inventory]);
  const lastDrops = useMemo(() => new Set(run.lastDrops ?? []), [run.lastDrops]);
  const lastCount = useMemo(
    () => run.inventory.filter((x) => lastDrops.has(x.uid)).length,
    [run.inventory, lastDrops],
  );
  const visible = useMemo(() => {
    const pool =
      filter === 'last'
        ? run.inventory.filter((x) => lastDrops.has(x.uid))
        : filterItems(run.inventory, infos, filter);
    return sortItems(pool, infos, sort, desc);
  }, [run.inventory, infos, sort, desc, filter, lastDrops]);
  const junk = useMemo(() => junkItems(run), [run.build, run.inventory]);
  const upgrades = useMemo(
    () => run.inventory.filter((x) => isUpgrade(infos.get(x.uid)!)).length,
    [run.inventory, infos],
  );

  const lookup = (s: Sel | null): InventoryItem | null => {
    if (!s) return null;
    if (s.from === 'inv') return run.inventory.find((x) => x.uid === s.uid) ?? null;
    if (s.from === 'slot') return run.build.equipment[s.slot] ?? null;
    return run.build.flasks[s.idx] ?? null;
  };
  const selected = lookup(sel);
  const shown: InventoryItem | null =
    (hover !== null ? run.inventory.find((x) => x.uid === hover) : null) ?? selected;
  const shownInfo: ItemInfo | undefined = shown ? infos.get(shown.uid) : undefined;
  const fromInv = shown !== null && run.inventory.some((x) => x.uid === shown.uid);
  const diff = useMemo(() => {
    if (!shown || shown.kind !== 'item' || !fromInv || !shownInfo?.slot) return null;
    return compareDelta(run.build, shown, cfg, shownInfo.slot);
  }, [shown, shownInfo?.slot, run.build]);

  const note = (m: string) => setMsg(m);
  const equipTo = (uid: number, slot: EquipSlot) => {
    const r = c.act((run) => equip(run, uid, slot));
    note(r?.ok ? '' : (r?.reason ?? ''));
    if (r?.ok) setSel({ from: 'slot', slot });
  };
  const doQuick = (uid: number) => {
    const r = c.act((run) => quickEquip(run, uid));
    note(r?.ok ? '' : (r?.reason ?? ''));
    if (r?.ok)
      setSel(
        r.slot
          ? { from: 'slot', slot: r.slot }
          : r.flask !== undefined
            ? { from: 'flask', idx: r.flask }
            : null,
      );
  };
  const doDiscard = (uid: number) => {
    // Keep the selection moving through the list so repeated discards are quick.
    const i = visible.findIndex((x) => x.uid === uid);
    c.act((r) => discard(r, uid));
    const next = visible[i + 1] ?? visible[i - 1];
    setSel(next ? { from: 'inv', uid: next.uid } : null);
  };
  const salvageJunk = () => {
    if (!junk.length) return;
    const dust = junk.reduce((n, x) => n + salvageValue(x), 0);
    if (
      !confirm(
        `Salvage ${junk.length} normal/magic item${junk.length > 1 ? 's' : ''} that are not upgrades for ${dust} Bone Dust?`,
      )
    )
      return;
    c.craft((r) => junk.forEach((x) => salvage(r, x.uid)));
    setSel(null);
  };

  // Slots the selected inventory item can go into.
  const targets = new Map<EquipSlot, { ok: boolean; reason?: string }>();
  if (sel?.from === 'inv' && selected?.kind === 'item')
    for (const s of slotsFor(selected)) targets.set(s, canEquip(run, selected, s));
  const flaskTargets = sel?.from === 'inv' && selected?.kind === 'flask';

  const onKey = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement).tagName === 'SELECT') return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const cur = sel?.from === 'inv' ? visible.findIndex((x) => x.uid === sel.uid) : -1;
      const n = Math.max(0, Math.min(visible.length - 1, cur + (e.key === 'ArrowDown' ? 1 : -1)));
      if (visible[n]) setSel({ from: 'inv', uid: visible[n].uid });
    } else if ((e.key === 'Enter' || e.key === 'e') && sel?.from === 'inv') {
      doQuick(sel.uid);
    } else if ((e.key === 'u' || e.key === 'Backspace') && sel?.from === 'slot') {
      c.act((r) => unequip(r, sel.slot));
      setSel(null);
    } else if ((e.key === 'u' || e.key === 'Backspace') && sel?.from === 'flask') {
      c.act((r) => unequipFlask(r, sel.idx));
      setSel(null);
    } else if ((e.key === 'Delete' || e.key === 'x') && sel?.from === 'inv') {
      doDiscard(sel.uid);
    } else if (e.key === 'Escape') setSel(null);
  };

  return (
    <div class="items" tabIndex={0} onKeyDown={onKey}>
      <div class="equip-col">
        <div class="equip-grid">
          {EQUIP_SLOTS.map((slot) => {
            const it = run.build.equipment[slot];
            const t = targets.get(slot);
            return (
              <button
                key={slot}
                class={`eq-slot ${it ? rarityClass(it) : 'empty'}${
                  sel?.from === 'slot' && sel.slot === slot ? ' sel' : ''
                }${t ? (t.ok ? ' target' : ' blocked') : ''}`}
                title={t && !t.ok ? t.reason : it ? 'Double-click to unequip' : undefined}
                onClick={() => {
                  if (sel?.from === 'inv' && t) {
                    if (t.ok) equipTo(sel.uid, slot);
                    else note(t.reason ?? '');
                  } else setSel({ from: 'slot', slot });
                }}
                onDblClick={() => {
                  if (it && !t) {
                    c.act((r) => unequip(r, slot));
                    setSel(null);
                  }
                }}
              >
                <div class="muted">{slotLabel(slot)}</div>
                <div>{it ? it.name : '—'}</div>
              </button>
            );
          })}
        </div>
        <div class="flask-row">
          {run.build.flasks.map((f, i) => (
            <button
              key={i}
              class={`eq-slot flaskslot ${f ? 'flaskitem' : 'empty'}${
                sel?.from === 'flask' && sel.idx === i ? ' sel' : ''
              }${flaskTargets ? ' target' : ''}`}
              onClick={() => {
                if (sel?.from === 'inv' && flaskTargets) {
                  c.act((r) => equipFlask(r, sel.uid, i));
                  setSel({ from: 'flask', idx: i });
                } else setSel({ from: 'flask', idx: i });
              }}
              onDblClick={() => {
                if (f && !flaskTargets) {
                  c.act((r) => unequipFlask(r, i));
                  setSel(null);
                }
              }}
            >
              <div class="muted">Flask {i + 1}</div>
              <div>{f ? f.name : '—'}</div>
            </button>
          ))}
        </div>
        {sel?.from === 'inv' && selected?.kind === 'item' && (
          <div class="muted hint">
            {coarse
              ? 'Tap a highlighted slot to equip, or use the Equip button for the best slot.'
              : 'Click a highlighted slot to equip, or press Enter / double-click for the best slot.'}
          </div>
        )}
        <div class="item-detail">
          {sel && (
            <button class="sheet-x" aria-label="Close" onClick={() => setSel(null)}>
              ×
            </button>
          )}
          {!shown && (
            <div class="muted hint">
              {coarse ? 'Select' : 'Hover or select'} an item to see its details.
            </div>
          )}
          {shown && (
            <>
              <div class={shownInfo?.replaces || shownInfo?.slot ? 'compare' : ''}>
                <div>
                  {fromInv && <div class="muted cmp-title">New</div>}
                  <ItemCard it={shown} diff={diff} build={run.build} />
                </div>
                {fromInv && shown.kind === 'item' && shownInfo?.slot && (
                  <div>
                    <div class="muted cmp-title">Equipped ({slotLabel(shownInfo.slot)})</div>
                    {shownInfo.replaces ? (
                      <ItemCard it={shownInfo.replaces} />
                    ) : (
                      <div class="item-card empty-card muted">Empty slot</div>
                    )}
                  </div>
                )}
              </div>
              <div class="item-actions">
                {sel?.from === 'inv' && selected && (
                  <button
                    class="btn small primary"
                    disabled={!shownInfo?.equippable && selected.kind !== 'gem'}
                    title={shownInfo?.reason}
                    onClick={() => doQuick(selected.uid)}
                  >
                    {selected.kind === 'gem'
                      ? 'Socket (best free socket)'
                      : shownInfo?.slot
                        ? `Equip → ${slotLabel(shownInfo.slot)}`
                        : 'Equip'}
                  </button>
                )}
                {sel?.from === 'slot' && (
                  <button
                    class="btn small"
                    onClick={() => {
                      c.act((r) => unequip(r, sel.slot));
                      setSel(null);
                    }}
                  >
                    Unequip
                  </button>
                )}
                {sel?.from === 'flask' && (
                  <button
                    class="btn small"
                    onClick={() => {
                      c.act((r) => unequipFlask(r, sel.idx));
                      setSel(null);
                    }}
                  >
                    Unequip
                  </button>
                )}
                {sel?.from === 'inv' && selected && (
                  <button class="btn small danger" onClick={() => doDiscard(selected.uid)}>
                    Discard
                  </button>
                )}
              </div>
              {msg && <div class="warn">{msg}</div>}
            </>
          )}
        </div>
        {!coarse && (
          <div class="muted hint">
            Keys: ↑/↓ browse · Enter equip · Del discard · U unequip · Ctrl+Z undo
          </div>
        )}
      </div>
      <div class="inv-col">
        <div class="inv-toolbar">
          <label class="muted">
            Sort{' '}
            <select
              value={sort}
              onChange={(e) => setSort((e.target as HTMLSelectElement).value as SortKey)}
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  {SORT_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
          <button class="btn small" title="Reverse the sort order" onClick={() => setDesc(!desc)}>
            {desc ? '⇅ reversed' : '⇅ default'}
          </button>
          <span class="spacer" />
          <button class="btn small" disabled={!c.canUndo} onClick={() => c.undo()} title="Ctrl+Z">
            ↶ Undo
          </button>
          <button class="btn small danger" disabled={!junk.length} onClick={salvageJunk}>
            Salvage junk ({junk.length})
          </button>
        </div>
        <div class="chips">
          {FILTERS.map(([k, label]) => (
            <button
              key={k}
              class={'chip' + (filter === k ? ' on' : '')}
              onClick={() => setFilter(k)}
            >
              {label}
              {k === 'upgrades' && upgrades > 0 ? ` (${upgrades})` : ''}
              {k === 'last' ? ` (${lastCount})` : ''}
            </button>
          ))}
          <span class="muted count">
            {visible.length} shown · {run.inventory.length}/{INVENTORY_SIZE}
          </span>
        </div>
        <div class="inv-list">
          {visible.length === 0 && <div class="muted">Nothing here.</div>}
          {visible.map((it) => {
            const info = infos.get(it.uid)!;
            return (
              <button
                key={it.uid}
                class={`inv-row ${rarityClass(it)}${sel?.from === 'inv' && sel.uid === it.uid ? ' sel' : ''}${
                  info.equippable ? '' : ' unusable'
                }`}
                onClick={() => setSel({ from: 'inv', uid: it.uid })}
                onDblClick={() => doQuick(it.uid)}
                onMouseEnter={() => !coarse && setHover(it.uid)}
                onMouseLeave={() => setHover(null)}
                title={info.reason}
              >
                <span class="row-name">
                  {fresh.current.has(it.uid) && <span class="new-tag">NEW</span>}
                  {itemTitle(it)}
                </span>
                <span class="row-slot muted">{info.slotLabel}</span>
                <span class="row-ilvl muted">{it.kind === 'gem' ? '' : `i${it.ilvl}`}</span>
                <span class="row-badges">
                  {info.group !== 'gem' && info.group !== 'flask' && info.equippable && (
                    <>
                      <Badge v={info.dpsPct} label="DPS" />
                      <Badge v={info.ehpPct} label="EHP" />
                    </>
                  )}
                  {!info.equippable && info.group !== 'gem' && (
                    <span class="badge down">can't use</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
