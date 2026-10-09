import type { Item } from '../data/types';
import { locate } from '../run/craft';
import { wornDelta, type CraftPlan } from '../run/craftPlan';
import type { RunState } from '../run/run';
import { Delta } from './ItemDetail';
import { ItemCard, lineMarks } from './ItemCard';

type Props = {
  run: RunState;
  /** The item being worked on (null when none is chosen). */
  item: Item | null;
  /** The craft waiting for Apply. */
  plan: CraftPlan | null;
  /** A reforge that is waiting for a pick. */
  pick: boolean;
  /** What was done to this item lately, newest first. */
  log: string[];
  onApply: () => void;
  onCancel: () => void;
  onPick: (index: number | null) => void;
};

function CostLine({ plan }: { plan: CraftPlan }) {
  if (plan.cost.length === 0) return <div class="muted">It costs nothing.</div>;
  return (
    <div class="wx-costs">
      {plan.cost.map((c) => (
        <span key={c.id} class={'wx-cost' + (c.have < c.n ? ' short' : '')}>
          {c.n} {c.label} <small>(have {c.have})</small>
        </span>
      ))}
    </div>
  );
}

/** A reforge's alternatives, next to the original, with what differs from it marked. */
function PickPanel({ run, onPick }: { run: RunState; onPick: Props['onPick'] }) {
  const pending = run.pendingCraft;
  const orig = pending ? locate(run, pending.itemUid)?.item : null;
  if (!pending || !orig) return null;
  return (
    <div class="wx-result pick">
      <div class="notice">
        Pick a result for {orig.name}. The Embers are spent whichever you choose.
      </div>
      <div class="wx-options">
        <div>
          <div class="muted">Keep the original</div>
          <ItemCard it={orig} />
          <button class="btn small" onClick={() => onPick(null)}>
            Keep it
          </button>
        </div>
        {pending.options.map((o, i) => {
          const d = wornDelta(run, orig.uid, o);
          return (
            <div key={i}>
              <div class="muted">Alternative {i + 1}</div>
              <ItemCard it={o} marks={lineMarks(o, orig, 'new')} />
              {d && <Delta d={d.delta} dpsPct={d.dpsPct} ehpPct={d.ehpPct} />}
              <button class="btn small primary" onClick={() => onPick(i)}>
                Take this
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The result panel (docs/ITEMS.md 4.3): what a staged craft would do, side by side with the item as it is, and the one
 * button that pays for it. Also where a waiting reforge is picked, and the short log of what was done to the item.
 */
export function ResultPanel(p: Props) {
  if (p.pick) return <PickPanel run={p.run} onPick={p.onPick} />;
  const { plan, item } = p;
  const worn = plan?.after && item ? wornDelta(p.run, item.uid, plan.after) : null;
  return (
    <div class="wx-result">
      {!plan && (
        <div class="wx-hint">
          <b>The result shows here</b>
          <div class="muted">
            Choose something to do to the item. You will see the item after it, what it costs and,
            for a worn item, what it does to you, before anything is spent.
          </div>
        </div>
      )}
      {plan && item && (
        <>
          <div class="wx-result-head">
            <b>{plan.verb}</b>
            <button class="sheet-x wx-close" aria-label="Cancel" onClick={p.onCancel}>
              ×
            </button>
          </div>
          <CostLine plan={plan} />
          {plan.gain && <div class="ix-note">Gives {plan.gain}. Salvaging cannot be undone.</div>}
          {plan.after && (
            <div class="ix-pair">
              <div>
                <div class="muted cmp-title">Now</div>
                <ItemCard it={item} marks={lineMarks(item, plan.after, 'old')} />
              </div>
              <div>
                <div class="muted cmp-title">{plan.exact ? 'After' : 'After (a typical roll)'}</div>
                <ItemCard it={plan.after} marks={lineMarks(plan.after, item, 'new')} />
              </div>
            </div>
          )}
          {plan.range && (
            <div class="ix-note">
              {plan.exact ? '' : 'Tier and value are rolled when you apply. '}
              {plan.range}
            </div>
          )}
          {plan.odds && (
            <ul class="wx-odds">
              {plan.odds.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          )}
          {worn && <Delta d={worn.delta} dpsPct={worn.dpsPct} ehpPct={worn.ehpPct} />}
          {!plan.ok && <div class="warn">{plan.reason}</div>}
          <div class="ix-note">Crafting is final: it cannot be undone.</div>
          <div class="item-actions wx-apply">
            <button class="btn primary" disabled={!plan.ok} onClick={p.onApply}>
              {applyLabel(plan)}
            </button>
            <button class="btn" onClick={p.onCancel}>
              Cancel
            </button>
          </div>
        </>
      )}
      {p.log.length > 0 && (
        <div class="wx-log">
          <div class="muted cmp-title">Done to this item</div>
          <ul>
            {p.log.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function applyLabel(plan: CraftPlan): string {
  const a = plan.action;
  if (a.kind === 'salvage') return `Salvage${plan.gain ? ` for ${plan.gain}` : ''}`;
  if (a.kind === 'reforge') return 'Draw the alternatives';
  const spend = plan.cost.map((c) => `${c.n} ${c.label}`).join(' and ');
  return spend ? `Apply: spend ${spend}` : 'Apply';
}
