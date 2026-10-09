import { useEffect } from 'preact/hooks';
import {
  CURRENCIES,
  CURRENCY_VERBS,
  currencyLabel,
  currencySource,
  currencyText,
  tabletsNeeded,
  TABLET_PREFIX,
  type CurrencyId,
} from '../data/currency';
import { completeTabletSets, owned, redeemTablets } from '../run/craft';
import type { Controller } from '../run/controller';
import type { RunState } from '../run/run';

/** Which group of actions a currency is used in; clicking its chip opens that group. Chalk is used on the Next map tab. */
export type GroupId = 'change' | 'reroll' | 'add' | 'essence' | 'sockets' | 'gamble';

export function groupOfCurrency(id: string): GroupId | null {
  switch (id) {
    case 'ember':
      return 'reroll';
    case 'pearl':
      return 'add';
    case 'thread':
    case 'whetstone':
      return 'change';
    case 'auger':
      return 'sockets';
    case 'die':
    case 'seal':
      return 'gamble';
    case 'chalk':
      return null;
    default:
      return 'essence';
  }
}

type Props = {
  c: Controller;
  run: RunState;
  onGroup: (g: GroupId) => void;
  onGuide: () => void;
};

/** The pouch: Bone Dust, every currency held with the verb it buys, and the tablets (with Redeem when a set is whole). */
export function Pouch({ c, run, onGroup, onGuide }: Props) {
  const held = CURRENCIES.filter((d) => owned(run, d.id) > 0);
  const tablets = Object.entries(run.tablets).filter(([, n]) => n > 0);
  const complete = completeTabletSets(run);
  return (
    <div class="wx-pouch">
      <div class="wx-dust" title="Bone Dust: from salvaging. It pays for the Bench.">
        <b>Bone Dust</b> {run.dust}
      </div>
      {held.length === 0 && tablets.length === 0 && (
        <span class="muted">No currency yet. Monsters and rewards drop it.</span>
      )}
      {held.map((d) => {
        const g = groupOfCurrency(d.id);
        return (
          <button
            key={d.id}
            class="wx-chip"
            title={`${d.text}${g ? '' : ' Used on the Next map tab.'}`}
            disabled={!g}
            onClick={() => g && onGroup(g)}
          >
            <b>{d.name}</b> × {owned(run, d.id)}
            <small>{CURRENCY_VERBS[d.id]}</small>
          </button>
        );
      })}
      {tablets.map(([id, n]) => {
        const need = tabletsNeeded(id);
        return (
          <span key={id} class="wx-chip tablet" title={currencyText(TABLET_PREFIX + id)}>
            <b>{currencyLabel(TABLET_PREFIX + id)}</b>
            <small>
              {n} of {need} tablets
            </small>
            {complete.includes(id) && (
              <button class="btn small" onClick={() => c.craft((r) => redeemTablets(r, id))}>
                Redeem
              </button>
            )}
          </span>
        );
      })}
      <button
        class="btn small wx-guide-btn"
        onClick={onGuide}
        aria-label="What does each currency do?"
      >
        ? Guide
      </button>
    </div>
  );
}

/** Every currency in one sheet: what it buys, what it does, how many you have and where it comes from. */
export function Guide({ run, onClose }: { run: RunState; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div class="modal" onClick={onClose}>
      <div
        class="modal-card wx-guide"
        role="dialog"
        aria-label="Currency guide"
        onClick={(e) => e.stopPropagation()}
      >
        <button class="sheet-x modal-x" aria-label="Close" onClick={onClose}>
          ×
        </button>
        <h3>What each currency does</h3>
        <div class="muted">
          Pick an item, pick what to do to it, and look at the result before you pay. Bone Dust
          (from salvaging) pays for the Bench, a second way to do some of the same things.
        </div>
        <div class="wx-guide-list">
          {CURRENCIES.map((d) => (
            <div key={d.id} class="wx-guide-row">
              <div>
                <b>{d.name}</b> <span class="muted">× {owned(run, d.id)}</span>
              </div>
              <div class="wx-verb">{CURRENCY_VERBS[d.id as CurrencyId]}</div>
              <div class="muted">{d.text}</div>
              <div class="muted">{currencySource(d.id)}</div>
            </div>
          ))}
        </div>
        <button class="btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
