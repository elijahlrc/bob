import { useState } from 'preact/hooks';
import type { EquipSlot, InventoryItem } from '../data/types';
import { INVENTORY_SIZE, slotsFor } from '../run/inventory';
import { affixSummary } from '../run/affixText';
import {
  slotName,
  SORT_LABELS,
  type FilterKey,
  type ItemInfo,
  type SortKey,
} from '../run/inventoryOps';
import { itemTitle, rarityClass } from './ItemCard';

/** What kind of thing (one at a time) and which view of the bag (one at a time); the two combine. */
export type What = Extract<FilterKey, 'all' | 'weapon' | 'armour' | 'jewellery' | 'flask' | 'gem'>;
export type View = 'all' | 'new' | 'upgrades' | 'last' | 'fav';

const WHATS: [What, string][] = [
  ['all', 'All'],
  ['weapon', 'Weapons'],
  ['armour', 'Armour'],
  ['jewellery', 'Jewellery'],
  ['flask', 'Flasks'],
  ['gem', 'Gems'],
];

const VIEWS: [Exclude<View, 'all'>, string][] = [
  ['new', 'New'],
  ['upgrades', 'Upgrades'],
  ['last', 'Last map'],
  ['fav', '★ Favourites'],
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

type RowProps = {
  it: InventoryItem;
  info: ItemInfo;
  selected: boolean;
  favourite: boolean;
  unseen: boolean;
  coarse: boolean;
  onSelect: () => void;
  onQuick: () => void;
  onStar: () => void;
  onPeek: (uid: number | null) => void;
  onDrag: (uid: number | null) => void;
};

/** One line of the bag: name and level, then where it goes, what it gives, and what it would change. */
export function ItemRow(p: RowProps) {
  const { it, info } = p;
  const slots: EquipSlot[] = it.kind === 'item' ? slotsFor(it) : [];
  const gear = info.group !== 'gem' && info.group !== 'flask';
  return (
    <button
      class={`ix-row ${rarityClass(it)}${p.selected ? ' sel' : ''}${info.equippable ? '' : ' unusable'}`}
      draggable={!p.coarse && it.kind !== 'gem'}
      onDragStart={(e) => {
        e.dataTransfer?.setData('text/plain', `inv:${it.uid}`);
        p.onDrag(it.uid);
      }}
      onDragEnd={() => p.onDrag(null)}
      onClick={p.onSelect}
      onDblClick={p.onQuick}
      onMouseEnter={() => !p.coarse && p.onPeek(it.uid)}
      onMouseLeave={() => p.onPeek(null)}
      title={info.reason}
    >
      <span class="ix-row-main">
        <span
          class={'row-star' + (p.favourite ? ' on' : '')}
          role="button"
          aria-label={p.favourite ? 'Remove from favourites' : 'Add to favourites'}
          onClick={(e) => {
            e.stopPropagation();
            p.onStar();
          }}
          onDblClick={(e) => e.stopPropagation()}
        >
          {p.favourite ? '★' : '☆'}
        </span>
        {p.unseen && <span class="new-tag">NEW</span>}
        <span class="ix-row-name">{itemTitle(it)}</span>
        <span class="ix-row-ilvl muted">{it.kind === 'gem' ? '' : `i${it.ilvl}`}</span>
      </span>
      <span class="ix-row-sub">
        <span class="muted">{info.slotLabel}</span>
        {slots.length > 1 && info.slot && <span class="ix-best">→ {slotName(info.slot)}</span>}
        {it.kind === 'item' && it.affixes.length > 0 && (
          <span class="ix-row-aff muted">{affixSummary(it)}</span>
        )}
        <span class="row-badges">
          {gear && info.equippable && (
            <>
              <Badge v={info.dpsPct} label="DPS" />
              <Badge v={info.ehpPct} label="EHP" />
            </>
          )}
          {!info.equippable && info.group !== 'gem' && <span class="badge down">can't use</span>}
        </span>
      </span>
    </button>
  );
}

type Props = {
  rows: InventoryItem[];
  infos: Map<number, ItemInfo>;
  selUid: number | null;
  favs: Set<number>;
  unseen: Set<number>;
  coarse: boolean;
  total: number;
  counts: { new: number; upgrades: number; last: number; fav: number };
  search: string;
  setSearch: (s: string) => void;
  sort: SortKey;
  setSort: (s: SortKey) => void;
  desc: boolean;
  setDesc: (d: boolean) => void;
  what: What;
  setWhat: (w: What) => void;
  view: View;
  setView: (v: View) => void;
  pinFav: boolean;
  setPinFav: (v: boolean) => void;
  unseenCount: number;
  junkCount: number;
  onMarkSeen: () => void;
  onCleanUp: () => void;
  onSalvageJunk: () => void;
  onSelect: (uid: number) => void;
  onQuick: (uid: number) => void;
  onStar: (uid: number) => void;
  onPeek: (uid: number | null) => void;
  onDrag: (uid: number | null) => void;
  onDropOnList: () => void;
  dragFromSlot: boolean;
};

/** The bag: search, sort, the two filter rows, the tidy-up menu, a capacity bar and the rows. */
export function ItemList(p: Props) {
  const [tidy, setTidy] = useState(false);
  const full = p.total / INVENTORY_SIZE;
  const close = (f: () => void) => () => {
    setTidy(false);
    f();
  };
  return (
    <div
      class={'ix-list-col' + (p.dragFromSlot ? ' drop' : '')}
      onDragOver={(e) => p.dragFromSlot && e.preventDefault()}
      onDrop={(e) => {
        if (!p.dragFromSlot) return;
        e.preventDefault();
        p.onDropOnList();
      }}
    >
      <div class="ix-tools">
        <input
          class="ix-search"
          type="search"
          placeholder="Search the bag"
          aria-label="Search the bag"
          value={p.search}
          onInput={(e) => p.setSearch((e.target as HTMLInputElement).value)}
        />
        <label class="muted ix-sort">
          Sort{' '}
          <select
            value={p.sort}
            onChange={(e) => p.setSort((e.target as HTMLSelectElement).value as SortKey)}
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {SORT_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <button
          class={'btn small' + (p.desc ? ' on' : '')}
          aria-pressed={p.desc}
          title="Turn the sort the other way round"
          onClick={() => p.setDesc(!p.desc)}
        >
          ⇅ Reverse
        </button>
        <span class="ix-tidy">
          <button class="btn small" aria-expanded={tidy} onClick={() => setTidy(!tidy)}>
            Tidy ▾
          </button>
          {tidy && (
            <>
              <div class="ix-tidy-veil" onClick={() => setTidy(false)} />
              <div class="ix-tidy-pop">
                <button class="btn small" disabled={!p.unseenCount} onClick={close(p.onMarkSeen)}>
                  Mark all seen
                </button>
                <label class="ix-tidy-check">
                  <input
                    type="checkbox"
                    checked={p.pinFav}
                    onChange={(e) => p.setPinFav((e.target as HTMLInputElement).checked)}
                  />{' '}
                  Keep ★ favourites on top
                </label>
                <button class="btn small" onClick={close(p.onCleanUp)}>
                  Clean up old items…
                </button>
                <button
                  class="btn small danger"
                  disabled={!p.junkCount}
                  onClick={close(p.onSalvageJunk)}
                >
                  Salvage junk ({p.junkCount})
                </button>
              </div>
            </>
          )}
        </span>
      </div>
      <div class="ix-chips kinds" role="group" aria-label="Kind">
        {WHATS.map(([k, label]) => (
          <button
            key={k}
            class={'chip' + (p.what === k ? ' on' : '')}
            aria-pressed={p.what === k}
            onClick={() => p.setWhat(k)}
          >
            {label}
          </button>
        ))}
      </div>
      <div class="ix-chips" role="group" aria-label="View">
        {VIEWS.map(([k, label]) => {
          const n = p.counts[k === 'fav' ? 'fav' : k];
          return (
            <button
              key={k}
              class={'chip' + (p.view === k ? ' on' : '')}
              aria-pressed={p.view === k}
              onClick={() => p.setView(p.view === k ? 'all' : k)}
            >
              {label} ({n})
            </button>
          );
        })}
        <span class="ix-cap" title={`${p.total} of ${INVENTORY_SIZE} places used`}>
          <span class={'ix-cap-bar' + (full >= 0.9 ? ' warn' : '')}>
            <span style={{ width: `${Math.min(100, full * 100)}%` }} />
          </span>
          <span class="muted">
            {p.rows.length} shown · {p.total}/{INVENTORY_SIZE}
          </span>
        </span>
      </div>
      <div class="ix-list">
        {p.rows.length === 0 && (
          <div class="muted ix-nothing">
            {p.total === 0
              ? 'The bag is empty.'
              : 'Nothing here. Try another filter or clear the search.'}
          </div>
        )}
        {p.rows.map((it) => (
          <ItemRow
            key={it.uid}
            it={it}
            info={p.infos.get(it.uid)!}
            selected={p.selUid === it.uid}
            favourite={p.favs.has(it.uid)}
            unseen={p.unseen.has(it.uid)}
            coarse={p.coarse}
            onSelect={() => p.onSelect(it.uid)}
            onQuick={() => p.onQuick(it.uid)}
            onStar={() => p.onStar(it.uid)}
            onPeek={p.onPeek}
            onDrag={p.onDrag}
          />
        ))}
      </div>
    </div>
  );
}
