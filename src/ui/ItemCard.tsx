import { Character, diffSheets, type SheetDiff } from '../calc/character';
import { itemBase } from '../data/bases';
import { flaskBase } from '../data/flasks';
import { gemDef } from '../data/gems';
import type { AnyItem, Build, EquipSlot } from '../data/types';
import { modsText } from '../mods/text';
import { slotsFor, withEquipped } from '../run/inventory';

export function rarityClass(it: AnyItem): string {
  return it.kind === 'item' ? it.rarity : it.kind === 'flask' ? 'flaskitem' : 'gem';
}

export function itemTitle(it: AnyItem): string {
  if (it.kind === 'gem') return gemDef(it.gemId).name;
  return it.name;
}

/** Δ of equipping `it` into its first valid slot (or the given slot). */
export function compareDelta(
  build: Build,
  it: AnyItem,
  cfg: { areaLevel: number; resistPenalty: number },
  slot?: EquipSlot,
): SheetDiff | null {
  if (it.kind !== 'item') return null;
  const s = slot ?? slotsFor(it)[0];
  const a = new Character(build, cfg).sheet();
  const b = new Character(withEquipped(build, it, s), cfg).sheet();
  return diffSheets(a, b);
}

function DeltaLine({ label, v, pct }: { label: string; v: number; pct?: boolean }) {
  if (Math.abs(v) < 0.05) return null;
  const s = `${v > 0 ? '+' : ''}${pct ? Math.round(v) + '%' : Math.round(v * 10) / 10}`;
  return (
    <div class={v > 0 ? 'delta up' : 'delta down'}>
      {s} {label}
    </div>
  );
}

export function ItemCard({ it, diff }: { it: AnyItem; diff?: SheetDiff | null }) {
  if (it.kind === 'gem') {
    const d = gemDef(it.gemId);
    return (
      <div class="item-card gem">
        <div class="ic-name">{d.name}</div>
        <div class="muted">
          {d.kind === 'active'
            ? 'Active skill gem'
            : d.kind === 'support'
              ? 'Support gem'
              : 'Aura gem'}
        </div>
        <div class="ic-mod">{d.description}</div>
      </div>
    );
  }
  if (it.kind === 'flask') {
    const b = flaskBase(it.baseId);
    return (
      <div class="item-card flaskitem">
        <div class="ic-name">{it.name}</div>
        <div class="muted">
          Requires level {b.level} · {b.perUse}/{b.maxCharges} charges · {b.duration} s
        </div>
        {b.life > 0 && <div class="ic-mod">Recovers {b.life} life</div>}
        {b.mana > 0 && <div class="ic-mod">Recovers {b.mana} mana</div>}
        {modsText(b.buff).map((l, i) => (
          <div key={i} class="ic-mod">
            {l}
          </div>
        ))}
        {it.affixes
          .flatMap((a) => modsText(a.mods))
          .map((l, i) => (
            <div key={`a${i}`} class="ic-mod explicit">
              {l}
            </div>
          ))}
      </div>
    );
  }
  const b = itemBase(it.baseId);
  const req = [`level ${b.level}`];
  if (b.req.str) req.push(`${b.req.str} Str`);
  if (b.req.dex) req.push(`${b.req.dex} Dex`);
  if (b.req.int) req.push(`${b.req.int} Int`);
  const explicit = [...it.affixes.flatMap((a) => a.mods), ...(it.uniqueMods ?? [])];
  return (
    <div class={`item-card ${it.rarity}`}>
      <div class="ic-name">{it.name}</div>
      {it.name !== b.name && <div class="ic-base">{b.name}</div>}
      {b.weapon && (
        <div class="muted">
          {b.weapon.min}–{b.weapon.max} physical · {b.weapon.aps} APS · {b.weapon.crit}% crit
        </div>
      )}
      {b.defence && (
        <div class="muted">
          {[
            b.defence.armour && `${b.defence.armour} armour`,
            b.defence.evasion && `${b.defence.evasion} evasion`,
            b.defence.es && `${b.defence.es} energy shield`,
            b.defence.block && `${b.defence.block}% block`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </div>
      )}
      <div class="muted">
        Requires {req.join(', ')} · ilvl {it.ilvl}
      </div>
      {it.sockets.length > 0 && <div class="muted">Sockets: {it.sockets.length} (linked)</div>}
      {modsText(it.implicits).map((l, i) => (
        <div key={`i${i}`} class="ic-mod implicit">
          {l}
        </div>
      ))}
      {modsText(explicit).map((l, i) => (
        <div key={`e${i}`} class="ic-mod explicit">
          {l}
        </div>
      ))}
      {diff && (
        <div class="ic-diff">
          <DeltaLine label="total DPS" v={diff.dps} />
          <DeltaLine label="life" v={diff.life} />
          <DeltaLine label="energy shield" v={diff.es} />
          <DeltaLine label="mana" v={diff.mana} />
          <DeltaLine label="fire res" v={diff.res[3]} pct />
          <DeltaLine label="cold res" v={diff.res[2]} pct />
          <DeltaLine label="lightning res" v={diff.res[1]} pct />
          <DeltaLine label="chaos res" v={diff.res[4]} pct />
          <DeltaLine label="effective HP" v={diff.ehp} />
        </div>
      )}
    </div>
  );
}
