import { useState } from 'preact/hooks';
import type { Item } from '../data/types';
import { affixLabel } from '../run/affixText';
import type { Controller } from '../run/controller';
import { nextTier } from '../run/craft';
import {
  respiteCraftCost,
  respiteItems,
  respiteProblem,
  respiteVisit,
  type RespiteCraft,
} from '../run/respite';
import { ItemCard, itemTitle, rarityClass } from './ItemCard';
import { sfx } from './sound/engine';

const KINDS: [RespiteCraft['kind'], string][] = [
  ['affix', 'Add an affix'],
  ['tier', 'Raise a tier'],
  ['socket', 'Add a socket'],
];

const plaque = (on: boolean) => ({
  'data-paint': 'panel',
  'data-thin': on ? undefined : '',
  'data-pk': on ? 'on' : '',
});

/**
 * The Respite (docs/ATTRITION.md): rest, or craft on an item. Resting passes the level at once. A craft is made and shown at
 * once; the first of a visit is free, the next cost Bone Dust, and once one is made the player leaves through "Leave".
 */
export function RespiteScreen({
  c,
  slot,
  onBack,
}: {
  c: Controller;
  slot: number;
  onBack: () => void;
}) {
  const run = c.run!;
  const offer = run.offers[slot];
  const visit = respiteVisit(run);
  const [kind, setKind] = useState<RespiteCraft['kind'] | null>(visit ? 'affix' : null);
  const [itemUid, setItemUid] = useState<number | null>(null);
  const [family, setFamily] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!offer || offer.kind !== 'respite') return null;
  const items = kind ? respiteItems(run, kind) : [];
  const chosen =
    itemUid === null
      ? undefined
      : [...Object.values(run.build.equipment), ...run.inventory].find(
          (x): x is Item => x?.kind === 'item' && x.uid === itemUid,
        );
  let craft: RespiteCraft | null = null;
  if (kind && itemUid !== null)
    craft = kind === 'tier' ? (family ? { kind, itemUid, family } : null) : { kind, itemUid };
  const problem = craft ? respiteProblem(run, slot, craft) : 'Choose first';
  const cost = respiteCraftCost(run);

  const make = () => {
    if (!craft) return;
    const res = c.craftAtRespite(slot, craft);
    if (!res.ok) {
      sfx('denied');
      setError(res.reason);
      return;
    }
    if (cost > 0) sfx('dust');
    setError(null);
    setFamily(null);
  };

  return (
    <div class="stop" data-paint="panel" data-field="green" data-arch data-foot data-loss="0.02">
      <div class="stop-name">Respite</div>
      <div class="muted stop-level">Level {offer.areaLevel}</div>
      <p class="stop-how">
        {visit
          ? `Crafts made: ${visit.crafts}. The next costs ${cost ? `${cost} Bone Dust` : 'nothing'}; you have ${run.dust}.`
          : 'Rest, or craft on one of your items. The first craft is free; more cost Bone Dust.'}
      </p>
      {!visit && (
        <div class="stop-buttons">
          <button class="btn primary" onClick={() => c.startMap(slot)}>
            Rest: refill life, mana, shield and flasks
          </button>
        </div>
      )}
      <div class="stop-body">
        <div class="stop-kinds">
          {KINDS.map(([id, name]) => (
            <button
              key={id}
              class={'btn small' + (id === kind ? ' on' : '')}
              onClick={() => {
                setKind(id);
                setItemUid(null);
                setFamily(null);
                setError(null);
              }}
            >
              {name}
            </button>
          ))}
        </div>
        {kind && !items.length && (
          <div class="muted">
            {kind === 'socket'
              ? 'None of your items has room for another socket.'
              : kind === 'affix'
                ? 'None of your worn items can take another affix.'
                : 'No affix on your worn items can go up a tier.'}
          </div>
        )}
        {kind && items.length > 0 && (
          <div class="stop-list">
            {items.map((it) => (
              <button
                key={it.uid}
                class={'stop-item' + (it.uid === itemUid ? ' sel' : '')}
                {...plaque(it.uid === itemUid)}
                onClick={() => {
                  setItemUid(it.uid);
                  setFamily(null);
                }}
              >
                <span class={'stop-item-name ' + rarityClass(it)}>{itemTitle(it)}</span>
                <span class="muted">
                  {kind === 'socket'
                    ? `${it.sockets.length} → ${it.sockets.length + 1} sockets`
                    : `${it.affixes.length} affixes`}
                </span>
              </button>
            ))}
          </div>
        )}
        {kind === 'tier' && chosen && (
          <div class="stop-list">
            {chosen.affixes
              .filter((a) => nextTier(chosen, a.family, run.map))
              .map((a) => (
                <button
                  key={a.family}
                  class={'stop-item' + (a.family === family ? ' sel' : '')}
                  {...plaque(a.family === family)}
                  onClick={() => setFamily(a.family)}
                >
                  <span class="stop-item-name">{affixLabel(a.family)}</span>
                  <span class="muted">
                    Tier {a.tier} → {nextTier(chosen, a.family, run.map)!.tier}
                  </span>
                </button>
              ))}
          </div>
        )}
        {chosen && (
          <div class="respite-item">
            <ItemCard it={chosen} build={run.build} />
          </div>
        )}
      </div>
      {error && (
        <div class="stop-warn" data-paint="panel" data-thin data-field="vermilion">
          {error}
        </div>
      )}
      <div class="stop-buttons">
        {kind && (
          <button
            class="btn primary"
            disabled={problem !== null}
            onClick={make}
            title={problem ?? ''}
          >
            {cost ? `Craft for ${cost} Bone Dust` : 'Craft (free)'}
          </button>
        )}
        {visit ? (
          <button class="btn" onClick={() => c.leaveRespite()}>
            Leave
          </button>
        ) : (
          <button class="btn" onClick={onBack}>
            Back
          </button>
        )}
      </div>
    </div>
  );
}
