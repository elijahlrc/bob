import { itemBase } from '../data/bases';
import { flaskBase } from '../data/flasks';
import { gemDef } from '../data/gems';
import type { EquipSlot, FlaskItem, Item } from '../data/types';
import type { RunState } from '../run/run';
import { slotName } from '../run/inventoryOps';
import { rarityClass } from './ItemCard';

/**
 * Where each slot sits on the soul's shadow in the reliquary (docs/mockups/style/STYLE-GUIDE.md section 10): column and
 * row of a five by five grid, helmet at the head, rings beside the amulet, a hand at either side, boots at the feet.
 */
const PLACE: Record<EquipSlot, [number, number]> = {
  helmet: [3, 1],
  ring1: [2, 2],
  amulet: [3, 2],
  ring2: [4, 2],
  mainHand: [1, 3],
  body: [3, 3],
  offHand: [5, 3],
  gloves: [1, 4],
  belt: [3, 4],
  boots: [3, 5],
};
const SLOTS = Object.keys(PLACE) as EquipSlot[];
/** The row centres of head, shoulders, hands, waist and feet, as fractions of the reliquary's height (gear.css). */
const ROWS = '0.214,0.343,0.471,0.6,0.729';

/** The glyph a slot shows: its kind, or for the off hand what is held there. */
function glyphOf(slot: EquipSlot, it: Item | undefined): string {
  if (slot === 'mainHand') return 'blade';
  if (slot === 'offHand')
    return !it || itemBase(it.baseId).itemClass === 'shield' ? 'shield' : 'blade';
  return (
    {
      helmet: 'helm',
      body: 'body',
      gloves: 'gloves',
      boots: 'boots',
      amulet: 'amulet',
      belt: 'belt',
    }[slot as string] ?? 'ring'
  );
}
/** A slot's sockets for its roundel: a letter per socket, the gem's colour or o for empty. */
const socketCode = (it: Item) =>
  it.sockets
    .map((g) =>
      g
        ? (({ str: 'r', dex: 'g', int: 'b' } as Record<string, string>)[gemDef(g.gemId).attr] ??
          'w')
        : 'o',
    )
    .join('');

export type SlotMark = { ok: boolean; reason?: string };

type Props = {
  run: RunState;
  selSlot: EquipSlot | null;
  selFlask: number | null;
  /** Slots the selected carried item can go into, with whether it may. */
  targets: Map<EquipSlot, SlotMark>;
  /** Slots the item under the pointer could go into (outline only). */
  peek: Set<EquipSlot>;
  /** Whether the selected carried item is a flask (every flask slot is then a target). */
  flaskTargets: boolean;
  /** Whether a drag is under way, and which slots it may be dropped on. */
  dragging: boolean;
  /** The slot or flask the picked bag item is aimed at (its comparison is shown; Wear puts it there). */
  aimSlot?: EquipSlot | null;
  aimFlask?: number | null;
  onSlot: (slot: EquipSlot) => void;
  onFlask: (idx: number) => void;
  onUnequip: (slot: EquipSlot) => void;
  onUnequipFlask: (idx: number) => void;
  onDragSlot: (slot: EquipSlot | null) => void;
  onDropSlot: (slot: EquipSlot) => void;
  /** The slot a swap just filled, lit for a moment: a slot id, or 'f2' for the third flask. */
  fresh?: string | null;
};

/**
 * The ten worn slots and five flasks, in the reliquary. Each slot is a roundel in its item's rarity colour with its
 * glyph and its sockets; its name shows on hover. A worn one carries a × that takes it off. Slots the picked bag item
 * fits are ringed, the one it is aimed at solidly.
 */
export function Gear(p: Props) {
  const { run } = p;
  const aiming = p.targets.size > 0 || p.flaskTargets;
  const slot = (id: EquipSlot) => {
    const it = run.build.equipment[id];
    const t = p.targets.get(id);
    const aimed = p.aimSlot === id || p.selSlot === id;
    const state = aimed ? 'aim' : t?.ok ? 'target' : '';
    const classes = [
      'ix-slot',
      it ? rarityClass(it) : 'empty',
      p.selSlot === id ? 'sel' : '',
      t ? (t.ok ? 'target' : 'blocked') : '',
      aimed ? 'aimed' : '',
      p.fresh === id ? 'fresh' : '',
      aiming && !t ? 'dim' : '',
      !t && p.peek.has(id) ? 'peek' : '',
      p.dragging && t?.ok ? 'drop' : '',
    ]
      .filter(Boolean)
      .join(' ');
    const [col, row] = PLACE[id];
    const tip = t && !t.ok ? t.reason : it ? it.name : `${slotName(id)}: empty`;
    const code = it ? socketCode(it) : '';
    return (
      <div key={id} class="ix-slot-wrap" style={{ gridColumn: col, gridRow: row }}>
        <button
          class={classes}
          data-paint="slot"
          data-rar={it ? (it.kind === 'item' ? it.rarity : 'normal') : 'empty'}
          data-glyph={glyphOf(id, it)}
          data-sockets={code}
          data-state={state}
          data-pk={`${it?.uid ?? 'none'}${code}${state}`}
          draggable={!!it}
          onDragStart={(e) => {
            e.dataTransfer?.setData('text/plain', `slot:${id}`);
            p.onDragSlot(id);
          }}
          onDragEnd={() => p.onDragSlot(null)}
          onDragOver={(e) => {
            if (t?.ok) e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (t?.ok) p.onDropSlot(id);
          }}
          onClick={() => p.onSlot(id)}
          aria-label={`${slotName(id)}: ${it ? it.name : 'empty'}`}
        >
          <span class="ix-slot-tip">{tip}</span>
        </button>
        {it && !aiming && (
          <button
            class="ix-slot-x"
            aria-label={`Take off ${it.name}`}
            title="Take off"
            onClick={(e) => {
              e.stopPropagation();
              p.onUnequip(id);
            }}
          >
            ×
          </button>
        )}
      </div>
    );
  };
  const flask = (f: FlaskItem | null, i: number) => {
    const aimed = p.aimFlask === i || p.selFlask === i;
    return (
      <div key={i} class="ix-slot-wrap ix-flask-wrap">
        <button
          class={`ix-slot ix-flask ${f ? 'flaskitem' : 'empty'}${p.selFlask === i ? ' sel' : ''}${
            p.flaskTargets ? ' target' : ''
          }${aimed ? ' aimed' : ''}${p.fresh === `f${i}` ? ' fresh' : ''}${aiming && !p.flaskTargets ? ' dim' : ''}`}
          onClick={() => p.onFlask(i)}
          aria-label={`Flask ${i + 1}: ${f ? f.name : 'empty'}`}
        >
          <i
            class="ix-bottle-art"
            data-paint="bottle"
            data-liquid={f ? flaskBase(f.baseId).kind : 'empty'}
            data-fill={f ? '0.8' : '0'}
            data-pk={f ? String(f.uid) : 'empty'}
          />
          <span class="ix-slot-tip">{f ? f.name : `Flask ${i + 1}: empty`}</span>
        </button>
        {f && !aiming && (
          <button
            class="ix-slot-x"
            aria-label={`Take off ${f.name}`}
            title="Take off"
            onClick={(e) => {
              e.stopPropagation();
              p.onUnequipFlask(i);
            }}
          >
            ×
          </button>
        )}
      </div>
    );
  };
  return (
    <div class="ix-gear ix-reliq" data-paint="soul" data-rows={ROWS}>
      <div class={'ix-doll' + (aiming ? ' aiming' : '')}>{SLOTS.map(slot)}</div>
      <div class="ix-flasks">{run.build.flasks.map(flask)}</div>
    </div>
  );
}

/** One line for the folded gear on a phone: "Gear · 6 of 10 worn · 7 gems · 3 free sockets". */
export function gearSummary(run: RunState): string {
  const worn = Object.values(run.build.equipment).filter((it): it is Item => !!it);
  const sockets = worn.reduce((n, it) => n + it.sockets.length, 0);
  const gems = worn.reduce((n, it) => n + it.sockets.filter(Boolean).length, 0);
  const free = sockets - gems;
  return (
    `Gear · ${worn.length} of 10 worn` +
    (gems ? ` · ${gems} gem${gems === 1 ? '' : 's'}` : '') +
    (free ? ` · ${free} free socket${free === 1 ? '' : 's'}` : '')
  );
}
