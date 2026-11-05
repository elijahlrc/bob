import { useState } from 'preact/hooks';
import { family as affixFamily, familyMods } from '../data/affixes';
import { EQUIP_SLOTS, type EquipSlot, type Item } from '../data/types';
import { Character } from '../calc/character';
import type { RunState } from '../run/run';
import type { Controller } from '../run/controller';
import { nextTier } from '../run/craft';
import { slotName } from '../run/inventoryOps';
import { modsText } from '../mods/text';
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

/** What the character carries now, so resting can be weighed: life, mana and each flask's charges. */
function carried(run: RunState): string {
  const v = run.vitals;
  const specs = new Character(run.build).flasks;
  const flasks = run.build.flasks
    .filter((f) => f !== null)
    .map((f) => {
      const max = specs.find((s) => s.uid === f.uid)?.maxCharges ?? 0;
      return `${f.name} ${Math.floor(max * (v.flasks[f.uid] ?? 1))}/${max}`;
    });
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  return `You carry life ${pct(v.life)}, mana ${pct(v.mana)}${flasks.length ? `; ${flasks.join(', ')}` : ''}.`;
}

/** An affix's lines at a tier, its numbers as ranges: "+120–139 to maximum Life". */
function tierLines(familyId: string, tier: { ranges: [number, number][] }): string[] {
  const f = affixFamily(familyId);
  const lo = modsText(
    familyMods(
      f,
      tier.ranges.map((r) => r[0]),
    ),
  );
  const hi = modsText(
    familyMods(
      f,
      tier.ranges.map((r) => r[1]),
    ),
  );
  const num = /\d+(?:\.\d+)?/g;
  return lo.map((line, i) => {
    const his = hi[i]?.match(num) ?? [];
    let k = 0;
    return line.replace(num, (n) => {
      const h = his[k++];
      return h && h !== n ? `${n}–${h}` : n;
    });
  });
}

const plaque = (on: boolean) => ({
  'data-paint': 'panel',
  'data-thin': on ? undefined : '',
  'data-pk': on ? 'on' : '',
});

/**
 * The Respite (docs/ATTRITION.md): craft on items, then rest. A craft is made and shown at once; the first of a visit is free,
 * the next cost Bone Dust by the item's level. Resting refills everything and passes the level; before any craft, Back
 * returns to camp.
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
  const [bagOpen, setBagOpen] = useState(false);
  if (!offer || offer.kind !== 'respite') return null;
  const items = kind ? respiteItems(run, kind) : [];
  // Worn items first, in slot order and named by slot; carried ones stay folded away until asked for.
  const slotOf = new Map<number, EquipSlot>();
  for (const s of EQUIP_SLOTS) {
    const it = run.build.equipment[s];
    if (it) slotOf.set(it.uid, s);
  }
  const wornItems = items
    .filter((it) => slotOf.has(it.uid))
    .sort(
      (a, b) => EQUIP_SLOTS.indexOf(slotOf.get(a.uid)!) - EQUIP_SLOTS.indexOf(slotOf.get(b.uid)!),
    );
  const bagItems = items.filter((it) => !slotOf.has(it.uid));
  const showBag = bagOpen || bagItems.some((it) => it.uid === itemUid);
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
  const cost = chosen && kind ? respiteCraftCost(run, chosen, kind) : 0;

  const itemButton = (it: Item) => {
    const s = slotOf.get(it.uid);
    const price = kind ? respiteCraftCost(run, it, kind) : 0;
    return (
      <button
        key={it.uid}
        class={'stop-item' + (it.uid === itemUid ? ' sel' : '')}
        {...plaque(it.uid === itemUid)}
        onClick={() => {
          setItemUid(it.uid);
          setFamily(null);
        }}
      >
        {s && <span class="muted respite-slot">{slotName(s)}</span>}
        <span class={'stop-item-name ' + rarityClass(it)}>{itemTitle(it)}</span>
        <span class="muted">
          {kind === 'socket'
            ? `${it.sockets.length} → ${it.sockets.length + 1} sockets`
            : `${it.affixes.length} affix${it.affixes.length === 1 ? '' : 'es'}`}
          {price ? ` · ${price} Bone Dust` : ''}
        </span>
      </button>
    );
  };

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
          ? `Crafts made: ${visit.crafts}. You have ${run.dust} Bone Dust.`
          : "Craft on your items, then rest. The first craft is free; more cost Bone Dust by the item's level."}
      </p>
      <p class="muted stop-how">{carried(run)}</p>
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
        {kind && wornItems.length > 0 && <div class="stop-list">{wornItems.map(itemButton)}</div>}
        {kind && bagItems.length > 0 && (
          <button
            class="respite-bag-toggle"
            aria-expanded={showBag}
            onClick={() => setBagOpen(!showBag)}
          >
            <span class="respite-arrow">{showBag ? '▾' : '▸'}</span> In your bag ({bagItems.length})
          </button>
        )}
        {kind && showBag && bagItems.length > 0 && (
          <div class="stop-list">{bagItems.map(itemButton)}</div>
        )}
        {kind === 'tier' && chosen && (
          <div class="respite-changes">
            <div class="respite-changes-head">
              Raise an affix on <span class={rarityClass(chosen)}>{itemTitle(chosen)}</span>
              <span class="muted"> · it is rolled again within the new tier</span>
            </div>
            <div class="respite-affixes">
              {chosen.affixes
                .filter((a) => nextTier(chosen, a.family, run.map))
                .map((a) => {
                  const up = nextTier(chosen, a.family, run.map)!;
                  const on = a.family === family;
                  return (
                    <button
                      key={a.family}
                      class={'respite-affix' + (on ? ' sel' : '')}
                      data-paint="panel"
                      data-field="porphyry"
                      data-thin={on ? undefined : ''}
                      data-pk={on ? 'on' : ''}
                      onClick={() => setFamily(a.family)}
                    >
                      <span class="respite-affix-kind">
                        {affixFamily(a.family).type === 'prefix' ? 'Prefix' : 'Suffix'} · Tier{' '}
                        {a.tier} → {up.tier}
                      </span>
                      <span class="respite-affix-row">
                        <span class="muted">Now</span>
                        <span>{modsText(a.mods).join(', ')}</span>
                      </span>
                      <span class="respite-affix-row">
                        <span class="muted">After</span>
                        <span class="respite-affix-new">{tierLines(a.family, up).join(', ')}</span>
                      </span>
                    </button>
                  );
                })}
            </div>
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
          <button class="btn" disabled={problem !== null} onClick={make} title={problem ?? ''}>
            {!chosen ? 'Craft' : cost ? `Craft for ${cost} Bone Dust` : 'Craft (free)'}
          </button>
        )}
        <button class="btn primary" onClick={() => c.startMap(slot)}>
          Rest and leave
        </button>
        {!visit && (
          <button class="btn" onClick={onBack}>
            Back
          </button>
        )}
      </div>
    </div>
  );
}
