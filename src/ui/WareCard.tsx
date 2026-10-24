import { currencyLabel, currencyText } from '../data/currency';
import { resistPenaltyForMap } from '../gen/mapPlan';
import type { Controller } from '../run/controller';
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
      <div class="ic-name" data-paint="panel" data-thin data-field="plaster">
        {w.count} × {currencyLabel(w.ref!)}
      </div>
      <div class="muted">{currencyText(w.ref!)}</div>
    </div>
  );
}
