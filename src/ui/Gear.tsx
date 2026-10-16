import { flaskBase } from '../data/flasks';
import type { EquipSlot, FlaskItem, Item } from '../data/types';
import type { RunState } from '../run/run';
import { slotName } from '../run/inventoryOps';
import { rarityClass } from './ItemCard';
import { SocketPips } from './SocketPips';

/** Where each slot sits, drawn roughly as a body (docs/ITEMS.md 3.3). Empty strings are gaps. */
const LAYOUT: (EquipSlot | '')[][] = [
  ['mainHand', 'helmet', 'offHand'],
  ['gloves', 'body', 'boots'],
  ['ring1', 'amulet', 'ring2'],
  ['', 'belt', ''],
];

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
  onSlot: (slot: EquipSlot) => void;
  onFlask: (idx: number) => void;
  onUnequip: (slot: EquipSlot) => void;
  onUnequipFlask: (idx: number) => void;
  onDragSlot: (slot: EquipSlot | null) => void;
  onDropSlot: (slot: EquipSlot) => void;
};

function slotSummary(it: Item): string {
  const n = it.affixes.length;
  return n ? `${n} affix${n > 1 ? 'es' : ''}` : '';
}

/** The ten worn slots and five flask slots. Each is a button; a worn one carries a × that takes it off. */
export function Gear(p: Props) {
  const { run } = p;
  const slot = (id: EquipSlot) => {
    const it = run.build.equipment[id];
    const t = p.targets.get(id);
    const classes = [
      'ix-slot',
      it ? rarityClass(it) : 'empty',
      p.selSlot === id ? 'sel' : '',
      t ? (t.ok ? 'target' : 'blocked') : '',
      !t && p.peek.has(id) ? 'peek' : '',
      p.dragging && t?.ok ? 'drop' : '',
    ]
      .filter(Boolean)
      .join(' ');
    return (
      <div key={id} class="ix-slot-wrap">
        <button
          class={classes}
          title={t && !t.ok ? t.reason : it ? `${it.name}\n${slotSummary(it)}` : slotName(id)}
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
          <span class="ix-slot-label">{slotName(id)}</span>
          <span class="ix-slot-name">{it ? it.name : '—'}</span>
          {it && it.sockets.length > 0 && (
            <span class="ix-slot-pips">
              <SocketPips sockets={it.sockets} primary={run.build.primaryGem} />
            </span>
          )}
        </button>
        {it && !t && (
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
  const flask = (f: FlaskItem | null, i: number) => (
    <div key={i} class="ix-slot-wrap">
      <button
        class={`ix-slot ix-flask ${f ? 'flaskitem' : 'empty'}${
          p.selFlask === i ? ' sel' : ''
        }${p.flaskTargets ? ' target' : ''}`}
        title={f ? f.name : `Flask ${i + 1}`}
        onClick={() => p.onFlask(i)}
        aria-label={`Flask ${i + 1}: ${f ? f.name : 'empty'}`}
      >
        <span class={'ix-bottle' + (f ? ' ' + flaskBase(f.baseId).kind : '')} />
        <span class="ix-slot-name">{f ? f.name : '—'}</span>
      </button>
      {f && !p.flaskTargets && (
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
  return (
    <div class="ix-gear">
      <div class="ix-doll">
        {LAYOUT.flat().map((id, i) =>
          id ? slot(id) : <div key={`gap${i}`} class="ix-gap" aria-hidden="true" />,
        )}
      </div>
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
