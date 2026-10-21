/**
 * Support gems at level 20, side by side (docs/SUPPORTS-PLAN.md 4.4): what each gives and costs in numbers, and which are outside
 * the bands the plan calls for or beaten outright by another. Run: `npx tsx scripts/audit-supports.ts`.
 *
 * `dps` is the support's multipliers on a skill's damage a second: its `more` damage and speed, and its `inc` damage and speed
 * as if the character already had +200% increased damage and +100% increased speed. A support that adds a count, a shape or a
 * trigger has numbers that mean nothing alone (they are blank in `dps`); read those by what they do.
 *
 * Bands (the reference game's, from its developer's note on supports in a later version): a support with a side benefit gives under about 25% more damage at level 20; a
 * support that is only damage, 30-35%; one with a real drawback, 38-48%.
 */
import { SUPPORT_GEMS, type GemMod, type SupportGemDef } from '../src/data/gems';
import { isPrice } from '../src/calc/reach';

const end = (v: GemMod['value']): number => (typeof v === 'number' ? v : v[1]);
const BASE_INC_DAMAGE = 2;
const BASE_INC_SPEED = 1;

type Row = {
  id: string;
  name: string;
  cost: number;
  dmg: number;
  speed: number;
  net: number;
  mechanic: boolean;
  drawback: boolean;
};

function rowOf(s: SupportGemDef): Row {
  let dmg = 1;
  let speed = 1;
  let mechanic = false;
  let drawback = false;
  for (const m of s.mods) {
    const v = end(m.value);
    if (isPrice(m)) drawback = true;
    if (m.condition || m.per) continue;
    // Damage that only reaches damage over time or an ailment does not scale the hit.
    if (m.tags?.some((t) => ['dot', 'bleed', 'poison', 'ignite'].includes(t))) continue;
    if (m.stat === 'damage' && m.kind === 'more') dmg *= 1 + v / 100;
    else if (m.stat === 'damage' && m.kind === 'inc')
      dmg *= (1 + BASE_INC_DAMAGE + v / 100) / (1 + BASE_INC_DAMAGE);
    else if ((m.stat === 'attackSpeed' || m.stat === 'castSpeed') && m.kind === 'more')
      speed *= 1 + v / 100;
    else if ((m.stat === 'attackSpeed' || m.stat === 'castSpeed') && m.kind === 'inc')
      speed *= (1 + BASE_INC_SPEED + v / 100) / (1 + BASE_INC_SPEED);
    else if (
      m.kind === 'flag' ||
      m.stat.includes('.') ||
      m.stat === 'projectiles' ||
      m.stat === 'repeats' ||
      m.stat === 'deployCount'
    )
      mechanic = true;
  }
  if (s.trigger || s.extraTriggers?.length || s.global?.length || s.levelBonus !== undefined)
    mechanic = true;
  return {
    id: s.id,
    name: s.name,
    cost: s.costMult,
    dmg,
    speed,
    net: dmg * speed,
    mechanic,
    drawback,
  };
}

const rows = SUPPORT_GEMS.map(rowOf);
const f = (n: number) => n.toFixed(2);
console.log('support'.padEnd(22), 'cost', ' dmg ', 'speed', ' dps ', ' per mana', 'notes');
for (const r of [...rows].sort((a, b) => b.net - a.net)) {
  const notes: string[] = [];
  if (!r.mechanic && !r.drawback && r.net > 1.35) notes.push('damage only, above the 30-35% band');
  if (r.mechanic && r.net > 1.25) notes.push('has a mechanic and still above +25%');
  if (r.drawback && r.net > 1.48) notes.push('above the drawback band (+48%)');
  if (r.net < 0.7 && !r.mechanic) notes.push('pure penalty with nothing it unlocks');
  console.log(
    r.name.padEnd(22),
    f(r.cost),
    f(r.dmg),
    f(r.speed),
    f(r.net),
    f(r.net / r.cost).padStart(8),
    notes.join('; '),
  );
}

// Supports beaten outright: the same rules for what they support and the same effects, each at least as strong, at no higher a price.
const key = (s: SupportGemDef) =>
  JSON.stringify([
    [...s.supports].sort(),
    [...(s.needs ?? [])].sort(),
    [...(s.excludes ?? [])].sort(),
    s.adds ?? [],
  ]);
const groups = new Map<string, SupportGemDef[]>();
for (const s of SUPPORT_GEMS) groups.set(key(s), [...(groups.get(key(s)) ?? []), s]);
const id = (m: GemMod) =>
  [
    m.stat,
    m.kind,
    (m.tags ?? []).join('+'),
    (m.damageTypes ?? []).join('+'),
    m.condition?.id ?? '',
    m.per?.stat ?? '',
  ].join(':');
function beats(b: SupportGemDef, a: SupportGemDef): boolean {
  const ua = a.mods.filter((m) => !isPrice(m));
  const ub = b.mods.filter((m) => !isPrice(m));
  const pa = a.mods.filter(isPrice);
  const pb = b.mods.filter(isPrice);
  if (ua.length === 0 || ua.length !== ub.length || pa.length !== pb.length) return false;
  let strict = b.costMult < a.costMult;
  if (b.costMult > a.costMult) return false;
  for (const m of ua) {
    const o = ub.find((x) => id(x) === id(m));
    if (!o) return false;
    if (end(o.value) < end(m.value)) return false;
    if (end(o.value) > end(m.value)) strict = true;
  }
  for (const m of pa) {
    const o = pb.find((x) => id(x) === id(m));
    if (!o) return false;
    if (Math.abs(end(o.value)) > Math.abs(end(m.value))) return false;
    if (Math.abs(end(o.value)) < Math.abs(end(m.value))) strict = true;
  }
  return strict;
}
console.log('\nBeaten outright (same rules and effects, each at least as strong, no dearer):');
let any = false;
for (const g of groups.values())
  for (const a of g)
    for (const b of g)
      if (a !== b && beats(b, a)) {
        console.log(`  ${a.name} is beaten by ${b.name}`);
        any = true;
      }
if (!any) console.log('  none');
