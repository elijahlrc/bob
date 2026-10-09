import type { ComponentChildren } from 'preact';
import { family } from '../data/affixes';
import { CURRENCIES, currencyDef } from '../data/currency';
import type { Item } from '../data/types';
import { modsText } from '../mods/text';
import { familyText } from '../run/affixText';
import { addableFamilies, owned, POLISH_LIMIT, reforgeCost, socketCeiling } from '../run/craft';
import {
  addRoutes,
  essenceOptions,
  planCraft,
  slotRoom,
  type CraftAction,
  type CraftPlan,
} from '../run/craftPlan';
import type { RunState } from '../run/run';
import type { GroupId } from './WbPouch';

export type ActionProps = {
  run: RunState;
  it: Item;
  carried: boolean;
  /** The craft in the result panel. */
  staged: CraftAction | null;
  stage: (a: CraftAction | null) => void;
  /** The affix chosen in the list, for the crafts that act on one. */
  selAffix: string | null;
  mode: 'view' | 'reforge';
  setMode: (m: 'view' | 'reforge') => void;
  pins: string[];
  addFam: string;
  setAddFam: (f: string) => void;
  essence: string;
  setEssence: (id: string) => void;
  essReplace: Record<string, string>;
  setEssReplace: (r: Record<string, string>) => void;
  sockets: number;
  setSockets: (n: number) => void;
  open: GroupId | null;
  setOpen: (g: GroupId | null) => void;
  /** On a phone the groups are an accordion; elsewhere they are all open. */
  phone: boolean;
  /** A reforge is waiting for a pick: nothing else can be crafted. */
  locked: boolean;
};

const same = (a: CraftAction | null, b: CraftAction) =>
  !!a && JSON.stringify(a) === JSON.stringify(b);

/** The label of one way to pay: the currency and how many are held, or the Bench and its price. */
function routeLabel(plan: CraftPlan): string {
  const a = plan.action;
  const c = plan.cost[0];
  const viaBench =
    (a.kind === 'remove' || a.kind === 'add' || a.kind === 'sockets') && a.via === 'bench';
  if (viaBench) return c ? `Bench: ${c.n} Bone Dust` : 'Bench';
  if (!c) return 'Do it';
  return `${c.n > 1 ? `${c.n} × ` : ''}${c.label} (have ${c.have})`;
}

function Route({ p, action, label }: { p: ActionProps; action: CraftAction; label?: string }) {
  const plan = planCraft(p.run, p.it.uid, action);
  const on = same(p.staged, action);
  return (
    <div class="wx-route">
      <button
        class={'btn small' + (on ? ' on' : '')}
        disabled={!plan.ok || p.locked}
        aria-pressed={on}
        onClick={() => p.stage(on ? null : action)}
      >
        {label ?? routeLabel(plan)}
      </button>
      {!plan.ok && <div class="wx-why">{plan.reason}</div>}
    </div>
  );
}

function Row({
  title,
  text,
  children,
}: {
  title: string;
  text?: string;
  children?: ComponentChildren;
}) {
  return (
    <div class="wx-row">
      <div class="wx-row-title">{title}</div>
      {text && <div class="wx-row-text muted">{text}</div>}
      <div class="wx-routes">{children}</div>
    </div>
  );
}

function Group({
  id,
  title,
  hint,
  p,
  children,
}: {
  id: GroupId;
  title: string;
  hint?: string;
  p: ActionProps;
  children: ComponentChildren;
}) {
  const open = !p.phone || p.open === id;
  return (
    <section class={'wx-group' + (open ? ' open' : '')} data-group={id}>
      <button
        class="wx-group-head"
        aria-expanded={open}
        disabled={!p.phone}
        onClick={() => p.setOpen(p.open === id ? null : id)}
      >
        <span>{title}</span>
        {hint && <small class="muted">{hint}</small>}
        {p.phone && <span aria-hidden="true">{open ? '▴' : '▾'}</span>}
      </button>
      {open && <div class="wx-group-body">{children}</div>}
    </section>
  );
}

/** What the player can do to the chosen item, grouped by what they want rather than by currency (docs/ITEMS.md 4.2). */
export function Actions(p: ActionProps) {
  const { run, it } = p;
  const sealed = !!it.sealed;
  const room = slotRoom(it);
  const have = (id: string) => owned(run, id);
  const mine = it.affixes.find((a) => a.family === p.selAffix);
  const addable = addableFamilies(it);
  const essences = CURRENCIES.filter((d) => d.families && have(d.id) > 0);
  const ceiling = socketCeiling(it);
  const polished = (it.polished ?? []).length;

  return (
    <div class="wx-groups">
      {p.locked && <div class="notice">Pick a result for the open reforge first.</div>}
      {sealed && <div class="warn">Sealed: nothing can change this item again.</div>}

      {!sealed && it.affixes.length > 0 && (
        <Group
          id="change"
          title="Change an affix"
          hint={`Thread ${have('thread')} · Whetstone ${have('whetstone')}`}
          p={p}
        >
          {!mine && <div class="muted">Select an affix in the list above.</div>}
          {mine && (
            <>
              <div class="wx-chosen">{modsText(mine.mods).join(' and ')}</div>
              <Row title="Remove it" text="It goes. Nothing else changes.">
                <Route p={p} action={{ kind: 'remove', family: mine.family, via: 'thread' }} />
                <Route p={p} action={{ kind: 'remove', family: mine.family, via: 'bench' }} />
              </Row>
              <Row
                title="Raise it to the top of its tier"
                text={`Its value becomes the most its tier allows. ${polished} of ${POLISH_LIMIT} raised on this item.`}
              >
                <Route p={p} action={{ kind: 'polish', family: mine.family }} />
              </Row>
            </>
          )}
          {it.affixes.some((a) => a.bench) && (
            <Row
              title="Remove the bench affix"
              text="The affix added at the Bench comes off for free."
            >
              <Route p={p} action={{ kind: 'stripBench' }} label="Remove it (free)" />
            </Row>
          )}
        </Group>
      )}

      {!sealed && it.rarity === 'rare' && (
        <Group id="reroll" title="Reroll the rest" hint={`Reforging Ember ${have('ember')}`} p={p}>
          <Row
            title="Keep some affixes, draw three alternatives for the rest"
            text="Each affix you keep costs one more Ember. You then pick one of the three, or the original. The Embers are spent either way."
          >
            {p.mode === 'view' ? (
              <button class="btn small" disabled={p.locked} onClick={() => p.setMode('reforge')}>
                Choose what to keep…
              </button>
            ) : (
              <>
                <div class="wx-pins">
                  Tick the affixes to keep in the list above: {p.pins.length} of {it.affixes.length}{' '}
                  kept, {reforgeCost(p.pins.length)} Ember
                  {reforgeCost(p.pins.length) > 1 ? 's' : ''}.
                </div>
                <Route
                  p={p}
                  action={{ kind: 'reforge', pinned: p.pins }}
                  label={`Reroll the rest (${reforgeCost(p.pins.length)} × Reforging Ember, have ${have('ember')})`}
                />
                <button class="btn small" onClick={() => p.setMode('view')}>
                  Stop choosing
                </button>
              </>
            )}
          </Row>
        </Group>
      )}

      {!sealed && !it.uniqueId && (
        <Group
          id="add"
          title="Add an affix"
          hint={`${room.prefix.used}/${room.prefix.cap} prefixes · ${room.suffix.used}/${room.suffix.cap} suffixes`}
          p={p}
        >
          {addable.length === 0 ? (
            <div class="muted">This item has no free affix slot of a kind it can take.</div>
          ) : (
            <>
              <select
                class="wx-select"
                value={p.addFam}
                aria-label="Affix to add"
                onChange={(e) => p.setAddFam((e.target as HTMLSelectElement).value)}
              >
                <option value="">Choose an affix…</option>
                {(['prefix', 'suffix'] as const).map((t) => (
                  <optgroup key={t} label={t === 'prefix' ? 'Prefixes' : 'Suffixes'}>
                    {addable
                      .filter((f) => f.type === t)
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {familyText(f)}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
              {p.addFam && addable.some((f) => f.id === p.addFam) && (
                <Row
                  title={`Add ${familyText(family(p.addFam))}`}
                  text="Its tier and value are rolled. Pay with one of these:"
                >
                  {addRoutes(run, p.addFam).map((a, i) => (
                    <Route key={i} p={p} action={a} />
                  ))}
                </Row>
              )}
            </>
          )}
        </Group>
      )}

      {!sealed && !it.uniqueId && essences.length > 0 && (
        <Group
          id="essence"
          title="Add an affix with an essence"
          hint={`${essences.length} held`}
          p={p}
        >
          <select
            class="wx-select"
            value={p.essence}
            aria-label="Essence"
            onChange={(e) => p.setEssence((e.target as HTMLSelectElement).value)}
          >
            <option value="">Choose an essence…</option>
            {essences.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} × {have(d.id)}
              </option>
            ))}
          </select>
          {p.essence &&
            have(p.essence) > 0 &&
            essenceOptions(it, p.essence).map((o) => {
              const rep = p.essReplace[o.family.id] ?? o.replace[0] ?? '';
              return (
                <Row
                  key={o.family.id}
                  title={familyText(o.family)}
                  text={
                    o.free
                      ? `A free ${o.family.type} slot.`
                      : o.blocked
                        ? o.blocked
                        : `No free ${o.family.type} slot: one must go.`
                  }
                >
                  {!o.free && !o.blocked && (
                    <select
                      class="wx-select"
                      value={rep}
                      aria-label="Affix to give up"
                      onChange={(e) =>
                        p.setEssReplace({
                          ...p.essReplace,
                          [o.family.id]: (e.target as HTMLSelectElement).value,
                        })
                      }
                    >
                      {o.replace.map((id) => {
                        const roll = it.affixes.find((a) => a.family === id)!;
                        return (
                          <option key={id} value={id}>
                            Give up {modsText(roll.mods).join(' and ')}
                          </option>
                        );
                      })}
                    </select>
                  )}
                  {!o.blocked && (
                    <Route
                      p={p}
                      action={{
                        kind: 'add',
                        family: o.family.id,
                        via: p.essence,
                        ...(o.free ? {} : { replace: rep }),
                      }}
                      label={`${o.free ? 'Add' : 'Replace and add'} (${currencyDef(p.essence).name} · have ${have(p.essence)})`}
                    />
                  )}
                </Row>
              );
            })}
        </Group>
      )}

      {!sealed && !it.fixedSockets && ceiling > 0 && (
        <Group id="sockets" title="Sockets" hint={`${it.sockets.length} of up to ${ceiling}`} p={p}>
          <div class="wx-stepper">
            <button
              class="btn small"
              aria-label="Fewer sockets"
              disabled={p.sockets <= 0}
              onClick={() => p.setSockets(p.sockets - 1)}
            >
              −
            </button>
            <b>{p.sockets}</b>
            <button
              class="btn small"
              aria-label="More sockets"
              disabled={p.sockets >= ceiling}
              onClick={() => p.setSockets(p.sockets + 1)}
            >
              +
            </button>
            <span class="muted">sockets (now {it.sockets.length})</span>
          </div>
          <div class="muted">
            The first three are free; the 4th, 5th and 6th cost 1, 2 and 3 Socket Augers. Removing a
            socket sends its gem to the bag.
          </div>
          {p.sockets !== it.sockets.length ? (
            <Row title={`Set to ${p.sockets} sockets`}>
              <Route p={p} action={{ kind: 'sockets', count: p.sockets, via: 'auger' }} />
              {p.sockets > it.sockets.length && (
                <Route p={p} action={{ kind: 'sockets', count: p.sockets, via: 'bench' }} />
              )}
            </Row>
          ) : (
            <div class="muted">Choose a different number to see what it costs.</div>
          )}
        </Group>
      )}

      {!sealed && (
        <Group id="gamble" title="Gambles" hint="final" p={p}>
          {it.rarity === 'normal' && (
            <Row
              title="Throw the Knucklebone Die"
              text="The item is remade by chance. Only a normal item can be thrown."
            >
              <Route p={p} action={{ kind: 'die' }} />
            </Row>
          )}
          <Row
            title="Seal the item"
            text="It can never be changed again, and it may gain something or be remade. See the odds in the result before you commit."
          >
            <Route p={p} action={{ kind: 'seal' }} />
          </Row>
        </Group>
      )}

      {p.carried && (
        <section class="wx-group open">
          <div class="wx-group-body">
            <Row
              title="Get rid of it"
              text="Salvaging breaks a carried item down for Bone Dust and cannot be undone."
            >
              <Route p={p} action={{ kind: 'salvage' }} label="Salvage…" />
            </Row>
          </div>
        </section>
      )}
    </div>
  );
}
