import type { Difficulty } from '../data/difficulty';
import { Character, diffSheets, type SheetDiff } from '../calc/character';
import { itemReq } from '../calc/items';
import { isWeaponClass, itemBase, WEAPON_TYPE_NAME } from '../data/bases';
import { triggerText } from '../data/triggers';
import { flaskBase } from '../data/flasks';
import { naturalGemLevel } from '../calc/gems';
import { gemDef } from '../data/gems';
import type { InventoryItem, Build, EquipSlot, Item } from '../data/types';
import type { Mod } from '../mods/types';
import { modsText } from '../mods/text';
import { slotsFor, withEquipped } from '../run/inventory';
import { GemCard } from './GemCard';

export function rarityClass(it: InventoryItem): string {
  return it.kind === 'item'
    ? it.rarity
    : it.kind === 'flask'
      ? it.uniqueId
        ? 'unique'
        : 'flaskitem'
      : 'gem';
}

export function itemTitle(it: InventoryItem): string {
  if (it.kind === 'gem') return gemDef(it.gemId).name;
  return it.name;
}

/** Δ of equipping `it` into its first valid slot (or the given slot). */
export function compareDelta(
  build: Build,
  it: InventoryItem,
  cfg: { areaLevel: number; difficulty?: Difficulty; resistPenalty: number },
  slot?: EquipSlot,
): SheetDiff | null {
  if (it.kind !== 'item') return null;
  const s = slot ?? slotsFor(it)[0];
  const a = new Character(build, cfg).sheet();
  const b = new Character(withEquipped(build, it, s), cfg).sheet();
  return diffSheets(a, b);
}

/** A line with its numbers taken out: the same stat with another value has the same key. */
const lineKey = (l: string): string => l.replace(/d+(.d+)?/g, 'N');

/** Every stat line an item shows, implicit, explicit and rule lines alike. */
export function itemLines(it: Item): string[] {
  const all = [...it.affixes.flatMap((a) => a.mods), ...(it.uniqueMods ?? [])];
  return [...modsText(it.implicits), ...modsText(all)];
}

/**
 * How the lines of `it` differ from those of `other`, for a side-by-side compare: a stat `other` lacks is a 'gain' on
 * the new item and a 'lost' on the old one; the same stat with another number is a 'diff' on both.
 */
export function lineMarks(
  it: Item,
  other: Item | undefined,
  side: 'new' | 'old',
): Map<string, 'gain' | 'lost' | 'diff'> {
  const marks = new Map<string, 'gain' | 'lost' | 'diff'>();
  if (!other) return marks;
  const theirs = new Map(itemLines(other).map((l) => [lineKey(l), l]));
  for (const l of itemLines(it)) {
    const t = theirs.get(lineKey(l));
    if (t === undefined) marks.set(l, side === 'new' ? 'gain' : 'lost');
    else if (t !== l) marks.set(l, 'diff');
  }
  return marks;
}

const markClass = (m: Map<string, string> | undefined, l: string): string =>
  m?.has(l) ? ' mark-' + m.get(l) : '';

function DeltaLine({ label, v, pct }: { label: string; v: number; pct?: boolean }) {
  if (Math.abs(v) < 0.05) return null;
  const s = `${v > 0 ? '+' : ''}${pct ? Math.round(v) + '%' : Math.round(v * 10) / 10}`;
  return (
    <div class={v > 0 ? 'delta up' : 'delta down'}>
      {s} {label}
    </div>
  );
}

/** The level a gem would have in this build (before any socketed-item bonus). */
export function gemLevelIn(build: Build, gemId: string): number {
  return naturalGemLevel(gemDef(gemId), build.level, new Character(build).attrs);
}

export function ItemCard({
  it,
  diff,
  build,
  marks,
}: {
  it: InventoryItem;
  diff?: SheetDiff | null;
  /** Lines to highlight against another item (`lineMarks`), by line text. */
  marks?: Map<string, 'gain' | 'lost' | 'diff'>;
  /** Used to work out what level a gem would have. */
  build?: Build;
}) {
  if (it.kind === 'gem')
    return <GemCard gemId={it.gemId} level={build ? gemLevelIn(build, it.gemId) : 1} />;
  if (it.kind === 'flask') {
    const b = flaskBase(it.baseId);
    return (
      <div class={`item-card ${it.uniqueId ? 'unique' : 'flaskitem'}`}>
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
  const need = itemReq(it);
  if (need.str) req.push(`${need.str} Str`);
  if (need.dex) req.push(`${need.dex} Dex`);
  if (need.int) req.push(`${need.int} Int`);
  const all = [...it.affixes.flatMap((a) => a.mods), ...(it.uniqueMods ?? [])];
  // Rules (flags, granted keystones, triggers) are set apart from the stat lines.
  const isRule = (m: Mod) => m.kind === 'flag';
  const explicit = all.filter((m) => !isRule(m));
  const rules = all.filter(isRule);
  return (
    <div class={`item-card ${it.rarity}`}>
      <div class="ic-name">{it.name}</div>
      {it.name !== b.name && <div class="ic-base">{b.name}</div>}
      {isWeaponClass(b.itemClass) && <div class="ic-type">{WEAPON_TYPE_NAME[b.itemClass]}</div>}
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
        <div key={`i${i}`} class={'ic-mod implicit' + markClass(marks, l)}>
          {l}
        </div>
      ))}
      {modsText(explicit).map((l, i) => (
        <div key={`e${i}`} class={'ic-mod explicit' + markClass(marks, l)}>
          {l}
        </div>
      ))}
      {modsText(rules).map((l, i) => (
        <div key={`r${i}`} class={'ic-mod rule' + markClass(marks, l)}>
          {l}
        </div>
      ))}
      {(it.uniqueTriggers ?? []).map((t, i) => (
        <div key={`t${i}`} class="ic-mod rule">
          {triggerText(t)}
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
