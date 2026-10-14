import {
  PROVISIONS_PER_MAP,
  POUCH_LIMIT,
  provisionDef,
  type ProvisionId,
} from '../data/provisions';
import { curseDef, reprieveDef } from '../data/reprieves';
import type { Controller } from '../run/controller';
import { pouchCount, spare } from '../run/provisions';
import { waysideOf } from '../run/wayside';

const FAMILY_TEXT = { retreat: 'Retreat', revive: 'Revive' } as const;

/** A Reprieve: what it is and what it does when it fires. */
export function ReprieveCard({ id }: { id: string }) {
  const d = reprieveDef(id);
  return (
    <div class={`provision reprieve ${d.family}`}>
      <div class="provision-name">
        {d.name} <span class="muted">· {FAMILY_TEXT[d.family]}</span>
      </div>
      <div class="provision-text">{d.text}</div>
    </div>
  );
}

const KIND_TEXT = { staple: 'Staple', bet: 'Bet', specialist: 'Specialist' } as const;

/** One provision: what it is, and (when a button is given) how to arm it. */
export function ProvisionCard({ id, extra }: { id: string; extra?: preact.ComponentChildren }) {
  const d = provisionDef(id);
  return (
    <div class={`provision ${d.kind}`}>
      <div class="provision-name">
        {d.name} <span class="muted">· {KIND_TEXT[d.kind]}</span>
      </div>
      <div class="provision-text">{d.text}</div>
      {d.needsType && <div class="muted">Pays only on a {d.needsType} map.</div>}
      {extra}
    </div>
  );
}

/**
 * What the character carries into the next map (docs/WAYSIDE.md sections 6 and 9.1): the provisions in the Pouch and up to two armed.
 * What is armed counts in everything the offer cards say, and burns when a map starts.
 */
export function Satchel({ c }: { c: Controller }) {
  const run = c.run!;
  const w = waysideOf(run);
  const held = Object.keys(w.pouch).filter((id) => (w.pouch[id] ?? 0) > 0) as ProvisionId[];
  const curses = w.curses.filter((k) => k.until >= run.map);
  if (!held.length && !w.armed.length && !w.reprieve && !curses.length) return null;
  return (
    <div class="satchel">
      <div class="satchel-head">
        <strong>Satchel</strong>
        <span class="muted">
          armed {w.armed.length} of {PROVISIONS_PER_MAP} · carrying {pouchCount(run)} of{' '}
          {POUCH_LIMIT}
        </span>
      </div>
      <div class="muted">
        Armed provisions are used up when the next map starts, cleared or not, and count in the
        cards below.
      </div>
      {w.reprieve && (
        <div>
          <div class="muted">Reprieve held (it fires by itself if you would die):</div>
          <ReprieveCard id={w.reprieve} />
        </div>
      )}
      {curses.map((k) => (
        <div key={k.id} class="warn">
          Cursed: {curseDef(k.id).name} — {curseDef(k.id).text}, through level {k.until}.
        </div>
      ))}
      <div class="satchel-list">
        {held.map((id) => {
          const armed = w.armed.filter((x) => x === id).length;
          return (
            <ProvisionCard
              key={id}
              id={id}
              extra={
                <div class="provision-buttons">
                  <span class="muted">
                    × {w.pouch[id]}
                    {armed ? ` (${armed} armed)` : ''}
                  </span>
                  <button
                    class="btn small"
                    disabled={spare(run, id) <= 0 || w.armed.length >= PROVISIONS_PER_MAP}
                    onClick={() => c.arm(id, true)}
                  >
                    Arm
                  </button>
                  {armed > 0 && (
                    <button class="btn small" onClick={() => c.arm(id, false)}>
                      Disarm
                    </button>
                  )}
                </div>
              }
            />
          );
        })}
      </div>
    </div>
  );
}
