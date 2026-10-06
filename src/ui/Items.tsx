import { useEffect, useMemo, useState } from 'preact/hooks';
import { EQUIP_SLOTS, type AnyItem, type EquipSlot } from '../data/types';
import { resistPenaltyForMap } from '../gen/mapPlan';
import type { Controller } from '../run/controller';
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
import { compareDelta, ItemCard, itemTitle, rarityClass } from './ItemCard';

const SLOT_NAME: Record<EquipSlot, string> = {
  mainHand: 'Main hand',
  offHand: 'Off hand',
  helmet: 'Helmet',
  body: 'Body',
  gloves: 'Gloves',
  boots: 'Boots',
  amulet: 'Amulet',
  ring1: 'Ring',
  ring2: 'Ring',
  belt: 'Belt',
};

type Sel =
  { from: 'inv'; uid: number } | { from: 'slot'; slot: EquipSlot } | { from: 'flask'; idx: number };

export function Items({ c }: { c: Controller }) {
  const run = c.run!;
  const [sel, setSel] = useState<Sel | null>(null);
  const [msg, setMsg] = useState('');
  // Visiting the items tab acknowledges new loot (re-enables auto-continue).
  useEffect(() => {
    if (run.newLoot.length) c.act((r) => (r.newLoot = []));
  }, []);
  const cfg = { areaLevel: run.map, resistPenalty: resistPenaltyForMap(run.map) };
  const selected: AnyItem | null = useMemo(() => {
    if (!sel) return null;
    if (sel.from === 'inv') return run.inventory.find((x) => x.uid === sel.uid) ?? null;
    if (sel.from === 'slot') return run.build.equipment[sel.slot] ?? null;
    return run.build.flasks[sel.idx] ?? null;
  }, [sel, run.inventory, run.build]);
  const diff = useMemo(() => {
    if (!selected || sel?.from !== 'inv' || selected.kind !== 'item') return null;
    const slot = slotsFor(selected).find((s) => canEquip(run, selected, s).ok);
    return slot ? compareDelta(run.build, selected, cfg, slot) : null;
  }, [selected, run.build]);
  const doEquip = (slot: EquipSlot) => {
    if (sel?.from !== 'inv') return;
    const r = c.act((run) => equip(run, sel.uid, slot));
    setMsg(r?.ok ? '' : (r?.reason ?? ''));
    if (r?.ok) setSel({ from: 'slot', slot });
  };
  return (
    <div class="items">
      <div class="equip-col">
        <div class="equip-grid">
          {EQUIP_SLOTS.map((slot) => {
            const it = run.build.equipment[slot];
            return (
              <button
                key={slot}
                class={`eq-slot ${it ? rarityClass(it) : 'empty'}${sel?.from === 'slot' && sel.slot === slot ? ' sel' : ''}`}
                onClick={() => setSel({ from: 'slot', slot })}
              >
                <div class="muted">{SLOT_NAME[slot]}</div>
                <div>{it ? it.name : '—'}</div>
              </button>
            );
          })}
        </div>
        <div class="flask-row">
          {run.build.flasks.map((f, i) => (
            <button
              key={i}
              class={`eq-slot flaskslot ${f ? 'flaskitem' : 'empty'}${sel?.from === 'flask' && sel.idx === i ? ' sel' : ''}`}
              onClick={() => setSel({ from: 'flask', idx: i })}
            >
              <div class="muted">Flask {i + 1}</div>
              <div>{f ? f.name : '—'}</div>
            </button>
          ))}
        </div>
        {selected && (
          <div class="item-detail">
            <ItemCard it={selected} diff={diff} />
            <div class="item-actions">
              {sel?.from === 'inv' &&
                selected.kind === 'item' &&
                slotsFor(selected).map((s) => {
                  const chk = canEquip(run, selected, s);
                  return (
                    <button
                      key={s}
                      class="btn small"
                      disabled={!chk.ok}
                      title={chk.reason}
                      onClick={() => doEquip(s)}
                    >
                      Equip ({SLOT_NAME[s]})
                    </button>
                  );
                })}
              {sel?.from === 'inv' &&
                selected.kind === 'flask' &&
                [0, 1, 2, 3, 4].map((i) => (
                  <button
                    key={i}
                    class="btn small"
                    onClick={() => c.act((r) => equipFlask(r, selected.uid, i))}
                  >
                    Flask slot {i + 1}
                  </button>
                ))}
              {sel?.from === 'inv' && selected.kind === 'gem' && (
                <span class="muted">Socket gems from the Skills tab.</span>
              )}
              {sel?.from === 'slot' && (
                <button class="btn small" onClick={() => c.act((r) => unequip(r, sel.slot))}>
                  Unequip
                </button>
              )}
              {sel?.from === 'flask' && (
                <button class="btn small" onClick={() => c.act((r) => unequipFlask(r, sel.idx))}>
                  Unequip
                </button>
              )}
              {sel?.from === 'inv' && (
                <button
                  class="btn small danger"
                  onClick={() => {
                    c.act((r) => discard(r, sel.uid));
                    setSel(null);
                  }}
                >
                  Discard
                </button>
              )}
            </div>
            {msg && <div class="warn">{msg}</div>}
          </div>
        )}
      </div>
      <div class="inv-col">
        <div class="muted">
          Inventory {run.inventory.length}/{INVENTORY_SIZE}
        </div>
        <div class="inv-grid">
          {run.inventory.map((it) => (
            <button
              key={it.uid}
              class={`inv-item ${rarityClass(it)}${sel?.from === 'inv' && sel.uid === it.uid ? ' sel' : ''}`}
              onClick={() => setSel({ from: 'inv', uid: it.uid })}
            >
              {itemTitle(it)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
