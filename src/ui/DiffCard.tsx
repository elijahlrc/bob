import { useState } from 'preact/hooks';
import { itemBase, isWeaponClass, WEAPON_TYPE_NAME } from '../data/bases';
import { flaskBase } from '../data/flasks';
import type { FlaskItem, Item } from '../data/types';
import { reqText } from './ItemCard';
import type { DiffRow } from './itemDiff';

/**
 * The changed lines of a compare, one list (docs/EQUIP.md 3.2): gained green, lost red and struck, changed amber with the
 * value it had. The unchanged lines are folded behind a count unless `open`.
 */
export function DiffLines({
  rows,
  noun = 'line',
  open = false,
}: {
  rows: DiffRow[];
  /** What the folded lines are called ("unchanged lines"). */
  noun?: string;
  open?: boolean;
}) {
  const [all, setAll] = useState(open);
  const changed = rows.filter((r) => r.mark !== 'same');
  const same = rows.length - changed.length;
  const shown = all ? rows : changed;
  return (
    <div class="ix-dls">
      {shown.map((r, i) => (
        <div key={i} class={'ix-dl' + (r.mark === 'same' ? '' : ' mark-' + r.mark)}>
          <span class="t">{r.text}</span>
          {r.was !== undefined && <span class="was">was {r.was}</span>}
        </div>
      ))}
      {changed.length === 0 && <div class="muted ix-dl-none">Nothing changes.</div>}
      {same > 0 && (
        <button class="link ix-fold" aria-expanded={all} onClick={() => setAll(!all)}>
          {all ? 'Hide' : '+'} {same} unchanged {noun}
          {same === 1 ? '' : 's'} {all ? '▴' : '▾'}
        </button>
      )}
    </div>
  );
}

/** What the card's header says under the name: base, kind of weapon, level. */
function Sub({ it }: { it: Item | FlaskItem }) {
  if (it.kind === 'flask') {
    const b = flaskBase(it.baseId);
    return (
      <div class="muted">
        Requires level {b.level} · {b.perUse}/{b.maxCharges} charges · {b.duration} s
      </div>
    );
  }
  const b = itemBase(it.baseId);
  return (
    <>
      {it.name !== b.name && <div class="ic-base">{b.name}</div>}
      {isWeaponClass(b.itemClass) && <div class="ic-type">{WEAPON_TYPE_NAME[b.itemClass]}</div>}
      <div class="muted">
        Requires {reqText(it)} · ilvl {it.ilvl}
      </div>
    </>
  );
}

/**
 * The phone's compare: one card for the new item with each changed line marked and what it was, in place of two cards the
 * player has to scroll between. A rare/magic/unique tint follows the item.
 */
export function DiffCard({ it, rows }: { it: Item | FlaskItem; rows: DiffRow[] }) {
  const rarity = it.kind === 'flask' ? (it.uniqueId ? 'unique' : 'flaskitem') : it.rarity;
  return (
    <div class={`item-card ix-dcard ${rarity}`}>
      <div class="ic-name">{it.name}</div>
      <Sub it={it} />
      <DiffLines rows={rows} />
    </div>
  );
}
