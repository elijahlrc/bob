import { useState } from 'preact/hooks';
import { currencyLabel, currencyText } from '../data/currency';
import { resistPenaltyForMap } from '../gen/mapPlan';
import type { Controller } from '../run/controller';
import { ensureMarket } from '../run/market';
import type { Ware } from '../run/wayside';
import { compareDelta, ItemCard } from './ItemCard';
import { ProvisionCard, ReprieveCard } from './Satchel';

/** What a ware is: its card (the item with what it would change, the provision, the reprieve, the currency bundle). */
export function WareCard({ w, run }: { w: Ware; run: NonNullable<Controller['run']> }) {
  const cfg = {
    areaLevel: run.map,
    difficulty: run.difficulty,
    resistPenalty: resistPenaltyForMap(run.map),
  };
  if (w.item)
    return (
      <ItemCard
        it={w.item}
        build={run.build}
        diff={w.item.kind === 'item' ? compareDelta(run.build, w.item, cfg) : null}
      />
    );
  if (w.kind === 'provision') return <ProvisionCard id={w.ref!} />;
  if (w.kind === 'reprieve') return <ReprieveCard id={w.ref!} />;
  return (
    <div class="item-card flaskitem">
      <div class="ic-name">
        {w.count} × {currencyLabel(w.ref!)}
      </div>
      <div class="muted">{currencyText(w.ref!)}</div>
    </div>
  );
}

/** The Market (docs/WAYSIDE.md section 4): a few wares for Bone Dust, restocked every level. */
export function Wares({ c }: { c: Controller }) {
  const run = c.run!;
  const stock = ensureMarket(run);
  const [error, setError] = useState<string | null>(null);
  const buy = (w: Ware) => {
    const res = c.buy(w.id);
    setError(res.ok ? null : res.reason);
  };
  return (
    <div class="wares">
      <div class="wares-head">
        <h3>Wares</h3>
        <span class="dust" title="What salvaging items pays. Spend it here.">
          Bone Dust: <strong>{run.dust.toLocaleString()}</strong>
        </span>
      </div>
      <div class="muted">
        The stock changes every level. Salvage items you do not need in the Items tab to earn Bone
        Dust.
      </div>
      {error && <div class="warn">{error}</div>}
      <div class="ware-grid">
        {stock.map((w) => (
          <div key={w.id} class={'ware' + (w.sold ? ' sold' : '')}>
            <WareCard w={w} run={run} />
            <div class="ware-buy">
              <span class="ware-price">{w.price} Bone Dust</span>
              <button
                class="btn small primary"
                disabled={w.sold || run.dust < w.price}
                onClick={() => buy(w)}
              >
                {w.sold ? 'Bought' : 'Buy'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
