import { useState } from 'preact/hooks';
import type { Character } from '../calc/character';
import { gemDef } from '../data/gems';
import { EQUIP_SLOTS, type EquipSlot } from '../data/types';
import type { Controller } from '../run/controller';
import { setPrimary, socketGem, unsocketGem } from '../run/inventory';

const SLOT_NAME: Record<EquipSlot, string> = {
  mainHand: 'Main hand',
  offHand: 'Off hand',
  helmet: 'Helmet',
  body: 'Body armour',
  gloves: 'Gloves',
  boots: 'Boots',
  amulet: 'Amulet',
  ring1: 'Ring',
  ring2: 'Ring',
  belt: 'Belt',
};

export function Skills({ c, ch }: { c: Controller; ch: Character }) {
  const run = c.run!;
  const [pick, setPick] = useState<{ slot: EquipSlot; socket: number } | null>(null);
  const gems = run.inventory.filter((x) => x.kind === 'gem');
  const levelOf = (uid: number) => ch.gems.find((g) => g.gem.uid === uid)?.level ?? 1;
  return (
    <div class="skills">
      <p class="muted">
        Every socket on an item is linked: supports boost the active skills in the same item. Click
        an active gem to make it your primary skill.
      </p>
      {EQUIP_SLOTS.map((slot) => {
        const it = run.build.equipment[slot];
        if (!it || it.sockets.length === 0) return null;
        return (
          <div key={slot} class="socket-row">
            <div class="socket-item">
              <div class="muted">{SLOT_NAME[slot]}</div>
              <div>{it.name}</div>
            </div>
            {it.sockets.map((g, i) => {
              if (!g)
                return (
                  <button key={i} class="socket empty" onClick={() => setPick({ slot, socket: i })}>
                    + gem
                  </button>
                );
              const d = gemDef(g.gemId);
              const primary = ch.primary.gemUid === g.uid;
              const active = ch.actives.find((a) => a.gemUid === g.uid);
              return (
                <div key={i} class={`socket ${d.kind}${primary ? ' primary' : ''}`}>
                  <button
                    class="gem-name"
                    title={d.description}
                    onClick={() => d.kind === 'active' && c.act((r) => setPrimary(r, g.uid))}
                  >
                    {d.name} <span class="muted">L{levelOf(g.uid)}</span>
                    {primary && ' ★'}
                    {active && !active.usable && <div class="warn">{active.reason}</div>}
                  </button>
                  <button
                    class="x"
                    title="Remove"
                    onClick={() => c.act((r) => unsocketGem(r, slot, i))}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}
      {ch.primary.gemUid === null && (
        <div class="warn">No usable active skill: using the default attack.</div>
      )}
      {pick && (
        <div class="gem-pick">
          <div>Choose a gem for {SLOT_NAME[pick.slot]}:</div>
          {gems.length === 0 && <div class="muted">No gems in the inventory.</div>}
          {gems.map((g) => {
            const d = gemDef(g.kind === 'gem' ? g.gemId : '');
            return (
              <button
                key={g.uid}
                class={`btn small gem ${d.kind}`}
                onClick={() => {
                  c.act((r) => socketGem(r, pick.slot, pick.socket, g.uid));
                  setPick(null);
                }}
              >
                {d.name}
              </button>
            );
          })}
          <button class="btn small" onClick={() => setPick(null)}>
            Cancel
          </button>
        </div>
      )}
      {gems.length > 0 && (
        <div class="muted">
          Gems in inventory:{' '}
          {gems.map((g) => (g.kind === 'gem' ? gemDef(g.gemId).name : '')).join(', ')}
        </div>
      )}
    </div>
  );
}
