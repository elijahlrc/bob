import type { Difficulty } from '../data/difficulty';
import { Character, diffSheets, type SheetDiff } from '../calc/character';
import { armourStats, itemReq, weaponStats } from '../calc/items';
import { isWeaponClass, itemBase, WEAPON_TYPE_NAME } from '../data/bases';
import { triggerText } from '../data/triggers';
import { BUFFS } from '../data/buffs';
import { flaskBase } from '../data/flasks';
import { naturalGemLevel } from '../calc/gems';
import { gemDef } from '../data/gems';
import type { InventoryItem, Build, EquipSlot, FlaskItem, Item } from '../data/types';
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

/** The ramp an item's name plaque is painted in, by rarity (leaf/ramps.ts): plaster, sky, gold, vermilion. */
export function rarityField(it: InventoryItem): string {
  if (it.kind === 'gem') return 'green';
  // A unique's plaque is near-black brown: its name keeps the orange players know uniques by.
  if (it.kind === 'flask') return it.uniqueId ? 'ink' : it.affixes.length ? 'sky' : 'plaster';
  return { normal: 'plaster', magic: 'sky', rare: 'gold', unique: 'ink' }[it.rarity];
}

/** An item's name on its rarity's plaque, at the head of its card. */
function NamePlaque({ it, name }: { it: InventoryItem; name: string }) {
  return (
    <div class="ic-name" data-paint="panel" data-thin data-field={rarityField(it)}>
      {name}
    </div>
  );
}

/** A row of painted gem stones in their settings, one per socket, in the gem's colour (empty sockets dark). */
export function Stones({ sockets }: { sockets: Item['sockets'] }) {
  return (
    <span
      class="ic-stones"
      aria-label={`${sockets.length} socket${sockets.length === 1 ? '' : 's'}`}
    >
      {sockets.map((g, i) => (
        <span
          key={i}
          class="ic-stone"
          data-paint="gem"
          data-gem={g ? gemDef(g.gemId).attr : 'empty'}
          data-shape={g && gemDef(g.gemId).kind === 'support' ? 'support' : 'skill'}
          data-pk={g ? g.gemId : 'empty'}
        />
      ))}
    </span>
  );
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
export const lineKey = (l: string): string => l.replace(/\d+(\.\d+)?/g, 'N');

const ELEMENT_LABELS = ['', 'lightning', 'cold', 'fire', 'chaos'] as const;
const round2 = (v: number): number => Math.round(v * 100) / 100;

/** A weapon's numbers after its own mods: the base's physical range, speed and crit, plus any other damage it adds. */
export type WeaponLine = {
  phys: string;
  speed: string;
  crit: string;
  extra: string[];
  aug: boolean[];
};

export function weaponLine(it: Item): WeaponLine | null {
  const b = itemBase(it.baseId);
  if (!b.weapon) return null;
  const s = weaponStats(it);
  const [lo, hi] = [Math.round(s.flats[0][0]), Math.round(s.flats[0][1])];
  const extra: string[] = [];
  for (let t = 1; t < s.flats.length; t++) {
    const [min, max] = s.flats[t].map(Math.round);
    if (max > 0) extra.push(`${min}–${max} ${ELEMENT_LABELS[t]}`);
  }
  return {
    phys: `${lo}–${hi} physical`,
    speed: `${round2(s.aps)} APS`,
    crit: `${round2(s.crit)}% crit`,
    extra,
    // Which of physical, speed and crit differ from the base (the card colours them).
    aug: [
      lo !== b.weapon.min || hi !== b.weapon.max,
      round2(s.aps) !== round2(b.weapon.aps),
      round2(s.crit) !== round2(b.weapon.crit),
    ],
  };
}

/** An armour piece's defences after its own mods, each with whether it differs from the base's. */
export type ArmourPart = { text: string; aug: boolean };

export function armourLine(it: Item): ArmourPart[] | null {
  const b = itemBase(it.baseId);
  if (!b.defence) return null;
  const a = armourStats(it, b);
  const d = b.defence;
  const parts: ArmourPart[] = [];
  if (a.armour) parts.push({ text: `${a.armour} armour`, aug: a.armour !== (d.armour ?? 0) });
  if (a.evasion) parts.push({ text: `${a.evasion} evasion`, aug: a.evasion !== (d.evasion ?? 0) });
  if (a.es) parts.push({ text: `${a.es} energy shield`, aug: a.es !== (d.es ?? 0) });
  if (a.block) parts.push({ text: `${a.block}% block`, aug: a.block !== (d.block ?? 0) });
  return parts;
}

/** Every stat line an item shows, implicit, explicit and rule lines alike. */
export function itemLines(it: Item): string[] {
  const all = [...it.affixes.flatMap((a) => a.mods), ...(it.uniqueMods ?? [])];
  return [...modsText(it.implicits), ...modsText(all)];
}

/** "level 12, 28 Dex": what wearing the item takes. */
export function reqText(it: Item): string {
  const req = [`level ${itemBase(it.baseId).level}`];
  const need = itemReq(it);
  if (need.str) req.push(`${need.str} Str`);
  if (need.dex) req.push(`${need.dex} Dex`);
  if (need.int) req.push(`${need.int} Int`);
  return req.join(', ');
}

/** What a flask's base gives while it runs: its mods, and the buff it holds (the Onrush Draught's). */
function flaskBuffLines(b: ReturnType<typeof flaskBase>): string[] {
  return [
    ...modsText(b.buff),
    ...(b.grants ? [`${BUFFS[b.grants].name}: ${BUFFS[b.grants].text}`] : []),
  ];
}

/** Every line a flask shows: what it recovers, its buff, and its affixes. */
export function flaskLines(f: FlaskItem): string[] {
  const b = flaskBase(f.baseId);
  return [
    ...(b.life > 0 ? [`Recovers ${b.life} life`] : []),
    ...(b.mana > 0 ? [`Recovers ${b.mana} mana`] : []),
    ...flaskBuffLines(b),
    ...f.affixes.flatMap((a) => modsText(a.mods)),
  ];
}

const linesOf = (x: Item | FlaskItem): string[] =>
  x.kind === 'flask' ? flaskLines(x) : itemLines(x);

/**
 * How the lines of `it` differ from those of `other`, for a side-by-side compare: a stat `other` lacks is a 'gain' on
 * the new item and a 'lost' on the old one; the same stat with another number is a 'diff' on both. Flasks are compared
 * the same way, by the lines their card shows.
 */
export function lineMarks(
  it: Item | FlaskItem,
  other: Item | FlaskItem | undefined,
  side: 'new' | 'old',
): Map<string, 'gain' | 'lost' | 'diff'> {
  const marks = new Map<string, 'gain' | 'lost' | 'diff'>();
  if (!other) return marks;
  const theirs = new Map(linesOf(other).map((l) => [lineKey(l), l]));
  for (const l of linesOf(it)) {
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
        <NamePlaque it={it} name={it.name} />
        <div class="muted">
          Requires level {b.level} · {b.perUse}/{b.maxCharges} charges · {b.duration} s
        </div>
        {b.life > 0 && (
          <div class={'ic-mod' + markClass(marks, `Recovers ${b.life} life`)}>
            Recovers {b.life} life
          </div>
        )}
        {b.mana > 0 && (
          <div class={'ic-mod' + markClass(marks, `Recovers ${b.mana} mana`)}>
            Recovers {b.mana} mana
          </div>
        )}
        {flaskBuffLines(b).map((l, i) => (
          <div key={i} class={'ic-mod' + markClass(marks, l)}>
            {l}
          </div>
        ))}
        {it.affixes
          .flatMap((a) => modsText(a.mods))
          .map((l, i) => (
            <div key={`a${i}`} class={'ic-mod explicit' + markClass(marks, l)}>
              {l}
            </div>
          ))}
      </div>
    );
  }
  const b = itemBase(it.baseId);
  const wl = weaponLine(it);
  const al = armourLine(it);
  const req = reqText(it);
  const all = [...it.affixes.flatMap((a) => a.mods), ...(it.uniqueMods ?? [])];
  // Rules (flags, granted keystones, triggers) are set apart from the stat lines.
  const isRule = (m: Mod) => m.kind === 'flag';
  const explicit = all.filter((m) => !isRule(m));
  const rules = all.filter(isRule);
  return (
    <div class={`item-card ${it.rarity}`}>
      <NamePlaque it={it} name={it.name} />
      {it.name !== b.name && <div class="ic-base">{b.name}</div>}
      {isWeaponClass(b.itemClass) && <div class="ic-type">{WEAPON_TYPE_NAME[b.itemClass]}</div>}
      {wl && (
        <div class="muted">
          <span class={wl.aug[0] ? 'ic-aug' : ''}>{wl.phys}</span> ·{' '}
          <span class={wl.aug[1] ? 'ic-aug' : ''}>{wl.speed}</span> ·{' '}
          <span class={wl.aug[2] ? 'ic-aug' : ''}>{wl.crit}</span>
        </div>
      )}
      {wl && wl.extra.length > 0 && <div class="ic-aug">Adds {wl.extra.join(', ')}</div>}
      {al && al.length > 0 && (
        <div class="muted">
          {al.map((p, i) => (
            <span key={i}>
              {i > 0 && ' · '}
              <span class={p.aug ? 'ic-aug' : ''}>{p.text}</span>
            </span>
          ))}
        </div>
      )}
      <div class="muted">
        Requires {req} · item level {it.ilvl}
      </div>
      {it.sockets.length > 0 && (
        <div class="ic-sockets">
          <Stones sockets={it.sockets} />
        </div>
      )}
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
