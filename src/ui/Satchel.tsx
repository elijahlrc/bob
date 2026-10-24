import {
  isReprieveId,
  PROVISIONS_PER_MAP,
  provisionDef,
  type ProvisionId,
} from '../data/provisions';
import { curseDef, reprieveDef } from '../data/reprieves';
import type { Controller } from '../run/controller';
import { spare } from '../run/provisions';
import { waysideOf } from '../run/wayside';
import { Tip } from './Tip';

const KIND_TEXT = { staple: 'Staple', bet: 'Bet', reprieve: 'Reprieve' } as const;
const FAMILY_TEXT = { retreat: 'retreat', revive: 'revive' } as const;
/** The stone in the setting between a provision's name and its kind. */
const STONE = { staple: 'pearl', bet: 'vermilion', reprieve: 'sky' } as const;

/**
 * One provision (a reprieve too): what it is, and (when something is given) how to use it. With `plaque` it is an object
 * of its own, a small plaque with a thin gold rim ("heavy": the double rim of one that is armed); without, it sits on
 * whatever holds it (a ware, a button, the reward preview).
 */
export function ProvisionCard({
  id,
  extra,
  plaque,
}: {
  id: string;
  extra?: preact.ComponentChildren;
  plaque?: 'thin' | 'heavy';
}) {
  const d = provisionDef(id);
  const family = isReprieveId(id) ? reprieveDef(id).family : null;
  return (
    <div
      class={`provision ${d.kind}${family ? ` ${family}` : ''}`}
      data-paint={plaque ? 'panel' : undefined}
      data-thin={plaque === 'thin' ? '' : undefined}
      data-pk={plaque}
    >
      <div class="provision-name">
        <span class="provision-title">{d.name}</span>
        <i class="provision-sep" data-paint="sep" data-stone={STONE[d.kind]} data-pk={d.kind} />
        <span class="muted">
          {KIND_TEXT[d.kind]}
          {family ? ` (${FAMILY_TEXT[family]})` : ''}
        </span>
      </div>
      <div class="provision-text">{d.text}</div>
      {extra}
    </div>
  );
}

/** A reprieve: a provision of the third kind. */
export function ReprieveCard({ id }: { id: string }) {
  return <ProvisionCard id={id} />;
}

/**
 * What the character carries into the next map (docs/WAYSIDE.md sections 6 and 9.1): the pouch of three provisions, any or all of
 * them armed. What is armed counts in everything the offer cards say, and burns when a map starts; a reprieve needs no arming.
 */
export function Satchel({ c }: { c: Controller }) {
  const run = c.run!;
  const w = waysideOf(run);
  const held = Object.keys(w.pouch).filter((id) => (w.pouch[id] ?? 0) > 0) as ProvisionId[];
  const curses = w.curses.filter((k) => k.until >= run.map);
  if (!held.length && !w.armed.length && !curses.length && !w.found) return null;
  return (
    <div class="satchel" data-paint="panel">
      <div class="lf-h">Satchel</div>
      {w.found && <div class="notice">The last map left you {provisionDef(w.found).name}.</div>}
      {held.some((id) => !isReprieveId(id)) && <Tip c={c} id="satchel" />}
      {held.some((id) => isReprieveId(id)) && <Tip c={c} id="reprieve" />}
      {curses.map((k) => (
        <div key={k.id} class="satchel-curse" data-paint="panel" data-thin data-field="vermilion">
          Cursed: {curseDef(k.id).name} — {curseDef(k.id).text}, through level {k.until}.
        </div>
      ))}
      <div class="satchel-list">
        {held.map((id) => {
          const armed = w.armed.filter((x) => x === id).length;
          const ready = isReprieveId(id);
          return (
            <ProvisionCard
              key={id}
              id={id}
              plaque={armed ? 'heavy' : 'thin'}
              extra={
                <div class="provision-buttons">
                  <span class="muted">
                    × {w.pouch[id]}
                    {armed ? ` (${armed} armed)` : ''}
                  </span>
                  {!ready && (
                    <button
                      class="btn small"
                      disabled={spare(run, id) <= 0 || w.armed.length >= PROVISIONS_PER_MAP}
                      onClick={() => c.arm(id, true)}
                    >
                      Arm
                    </button>
                  )}
                  {!ready && armed > 0 && (
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
