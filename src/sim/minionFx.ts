import { levelValue } from '../calc/gems';
import { itemMods } from '../calc/items';
import type { Defence } from '../calc/combat';
import { itemBase } from '../data/bases';
import type { MinionDef } from '../data/minions';
import { MINION_ENEMY_RES } from '../data/minions';
import { DAMAGE_TYPES } from '../mods/types';
import { spellBaseDamage } from '../data/constants';
import type { SkillChoice } from '../calc/character';
import type { Item } from '../data/types';
import { rawHit } from './combat';
import { corpseNear, takeCorpse } from './factions';
import type { Minion } from './minions';
import type { MinionSup } from './minionSup';
import { applyFlatDot } from './skillDots';
import { applyStatus } from './statuses';
import type { Actor, Drop, World } from './types';

/**
 * What acts on minions besides their own numbers (docs/SPIRIT.md S12): an Offering that uses corpses and gives all the minions its
 * effects for a while, a Golem that gives the other minions added physical damage, the supports that give the minions of a skill
 * resistances, elemental damage, exposure or a burning aura, and a Guardian that wears the items lying on the ground.
 */

export type { MinionSup };

/** An Offering that stands. */
export type OfferingState = {
  t: number;
  corpses: number;
  atk: number;
  move: number;
  cast: number;
  blockAtk: number;
  blockSpell: number;
  heal: number;
  esPct: number;
  chaos: number;
  res: number;
};

/** What all the minions have at this moment from the offering and the golem. */
export type Aura = {
  atk: number;
  move: number;
  blockAtk: number;
  blockSpell: number;
  heal: number;
  esPct: number;
  chaos: number;
  res: number;
  addedMin: number;
  addedMax: number;
};

const NONE: Aura = {
  atk: 0,
  move: 0,
  blockAtk: 0,
  blockSpell: 0,
  heal: 0,
  esPct: 0,
  chaos: 0,
  res: 0,
  addedMin: 0,
  addedMax: 0,
};

const BURN_RADIUS = 1.8;

/** The aura now: the standing offering's effects, and the added damage of the golem that stands. */
export function auraNow(w: World): Aura {
  const o = w.offering;
  let golem: Minion | undefined;
  for (const m of w.minions) if (m.golem && m.alive) golem = m;
  if (!o && !golem) return NONE;
  return {
    atk: o?.atk ?? 0,
    move: o?.move ?? 0,
    blockAtk: o?.blockAtk ?? 0,
    blockSpell: o?.blockSpell ?? 0,
    heal: o?.heal ?? 0,
    esPct: o?.esPct ?? 0,
    chaos: o?.chaos ?? 0,
    res: o?.res ?? 0,
    addedMin: golem?.golem?.min ?? 0,
    addedMax: golem?.golem?.max ?? 0,
  };
}

// ---- defence of a minion with its buffs and gear

function gearSum(gear: Map<string, Item> | undefined) {
  const out = { life: 0, armour: 0, res: [0, 0, 0, 0, 0] };
  if (!gear) return out;
  for (const it of gear.values()) {
    const b = itemBase(it.baseId);
    out.armour += b.defence?.armour ?? 0;
    for (const m of itemMods(it)) {
      if (m.kind !== 'base') continue;
      if (m.stat === 'life') out.life += m.value;
      else if (m.stat === 'armour') out.armour += m.value;
      else if (m.stat === 'resist.fire') out.res[3] += m.value;
      else if (m.stat === 'resist.cold') out.res[2] += m.value;
      else if (m.stat === 'resist.lightning') out.res[1] += m.value;
      else if (m.stat === 'resist.allEle') for (const i of [1, 2, 3]) out.res[i] += m.value;
      else if (m.stat === 'resist.chaos') out.res[4] += m.value;
    }
  }
  return out;
}

const signature = (m: Minion, a: Aura): string =>
  [a.blockAtk, a.blockSpell, a.heal, a.esPct, a.res, m.sup.res, m.sup.maxRes, m.gearKey ?? ''].join(
    '|',
  );

/** The minion's defence with the offering's block, energy shield and resistances, the supports' resistances, and the gear it wears. */
export function refreshMinionDef(m: Minion, a: Aura): void {
  const key = signature(m, a);
  if (m.defKey === key) return;
  m.defKey = key;
  const base = m.bodyDef ?? (m.bodyDef = m.def);
  const g = gearSum(m.gear);
  const maxLife = base.maxLife + g.life;
  const def: Defence = {
    ...base,
    maxLife,
    armour: base.armour + g.armour,
    blockAttack: Math.min(0.75, base.blockAttack + a.blockAtk / 100),
    blockSpell: Math.min(0.75, base.blockSpell + a.blockSpell / 100),
    lifeOnBlockPct: a.heal > 0 ? a.heal / Math.max(1, maxLife) : base.lifeOnBlockPct,
    maxEs: base.maxEs + (maxLife * a.esPct) / 100,
    res: base.res.map((r, i) =>
      i >= 1 && i <= 3 ? r + a.res + m.sup.res + g.res[i] : r + g.res[i],
    ),
    maxRes: base.maxRes.map((r, i) => (i >= 1 && i <= 3 ? r + m.sup.maxRes : r)),
  };
  // Life gained from gear is whole at once; energy shield from an offering is recovered as it is granted.
  m.life += maxLife - m.def.maxLife;
  if (def.maxEs > m.def.maxEs) m.es += def.maxEs - m.def.maxEs;
  m.def = def;
}

// ---- offerings

function eligibleOffering(w: World): boolean {
  return w.minions.some((m) => m.alive);
}

/** Whether the character would cast an offering now: minions to help, a corpse to use, and none standing (or one nearly over). */
export function offeringWanted(w: World, reach: number): boolean {
  if (!eligibleOffering(w)) return false;
  if (w.offering && w.offering.t > 1.5) return false;
  const p = w.player;
  return !!corpseNear(w, p.x, p.y, reach);
}

/** The offering is cast: a corpse and up to four more about it are used, and the minions gain its effects for a time. */
export function castOffering(w: World, c: SkillChoice): void {
  const u = c.skill.utility;
  if (u?.kind !== 'offering') return;
  const p = w.player;
  const first = corpseNear(w, p.x, p.y, 12);
  if (!first) return;
  takeCorpse(w, first);
  let used = 1;
  while (used < u.maxCorpses) {
    const more = corpseNear(w, first.x, first.y, 3);
    if (!more) break;
    takeCorpse(w, more);
    used++;
  }
  const lv = c.skill.level;
  const v = (x: typeof u.atkInc) => (x === undefined ? 0 : levelValue(x, lv));
  w.offering = {
    t: (u.seconds + u.perCorpse * (used - 1)) * w.char.db.mult('buffDuration'),
    corpses: used,
    atk: v(u.atkInc),
    move: v(u.moveInc),
    cast: v(u.castInc),
    blockAtk: v(u.blockAtk),
    blockSpell: v(u.blockSpell),
    heal: v(u.healOnBlock),
    esPct: (u.esPerCorpse ?? 0) * used,
    chaos: v(u.physAsChaos),
    res: v(u.res),
  };
  w.buffT[u.buff] = w.offering.t;
  w.events.push({ t: 'buff', id: u.buff });
}

/** The time of an offering runs down. */
export function tickOffering(w: World, dt: number): void {
  if (!w.offering) return;
  w.offering.t -= dt;
  if (w.offering.t <= 0) w.offering = null;
}

// ---- the minions' blows

/** One blow of a minion: its damage, with what the offering, the golem and the supports add. */
export function minionStrike(
  w: World,
  m: Minion,
  st: MinionDef,
  target: Actor,
  foes: Actor[],
  aura: Aura,
): void {
  const dtype = DAMAGE_TYPES.indexOf(st.dtype);
  const elemental = dtype >= 1 && dtype <= 3;
  let base =
    m.fixedHit !== undefined
      ? m.fixedHit * m.dmg * MINION_ENEMY_RES
      : spellBaseDamage(m.level) * st.dmg * m.dmg * MINION_ENEMY_RES;
  if (elemental && m.sup.eleMore > 0) base *= 1 + m.sup.eleMore / 100;
  // A defensive minion hits harder what is near its owner.
  if (m.nearMore && Math.hypot(target.x - w.player.x, target.y - w.player.y) <= 3.5)
    base *= 1 + m.nearMore / 100;
  // A golem hits harder for each of the other minions near it.
  if (m.golem) {
    let near = 0;
    for (const o of w.minions)
      if (o !== m && o.alive && !o.golem && Math.hypot(o.x - m.x, o.y - m.y) <= 5) near++;
    base *= 1 + Math.min(m.golem.cap, near * m.golem.perNearby) / 100;
  }
  // Another minion's golem gives flat physical damage to the ones that are not golems.
  const added = m.golem ? 0 : ((aura.addedMin + aura.addedMax) / 2) * m.dmg * MINION_ENEMY_RES;
  const phys = (dtype === 0 ? base : 0) + added;
  const parts: number[] = [0, 0, 0, 0, 0];
  parts[dtype] += dtype === 0 ? 0 : base;
  parts[0] += phys;
  parts[4] += (phys * aura.chaos) / 100;
  // A crawler's blows are partly chaos.
  if (st.chaos) {
    const moved = (parts[0] * st.chaos) / 100;
    parts[0] -= moved;
    parts[4] += moved;
  }
  for (let t = 0; t < 5; t++) {
    if (parts[t] <= 0) continue;
    rawHit(w, target, parts[t], t, 'Minion', 'minion');
    if (st.splash > 0)
      for (const e of foes)
        if (
          e !== target &&
          e.alive &&
          Math.hypot(e.x - target.x, e.y - target.y) <= st.splash + e.r
        )
          rawHit(w, e, parts[t] * 0.5, t, 'Minion', 'minion');
  }
  // Elemental Army: a hit exposes the enemy to the element it dealt.
  if (m.sup.exposure > 0 && elemental && target.alive)
    applyStatus(
      w,
      target,
      (['', 'exposedLightning', 'exposedCold', 'exposedFire'] as const)[dtype] as 'exposedFire',
      {
        v: m.sup.exposure,
      },
    );
}

/** Infernal Legion: the minions burn the enemies near them and themselves. */
export function tickLegion(w: World, dt: number): void {
  for (const m of w.minions) {
    if (!m.alive || m.sup.burn <= 0) continue;
    if (Math.floor(w.t * 4) !== Math.floor((w.t - dt) * 4))
      for (const e of w.actors)
        if (!e.isPlayer && e.alive && Math.hypot(e.x - m.x, e.y - m.y) <= BURN_RADIUS + e.r)
          applyFlatDot(w, e, '@legion', 3, m.sup.burn, 0.5);
    if (m.sup.selfBurn > 0)
      rawHit(w, m, (m.def.maxLife * m.sup.selfBurn * dt) / 100, 3, 'Burning', 'minion');
  }
}

// ---- Animate Guardian

const ARMOUR = ['helmet', 'body', 'gloves', 'boots', 'shield'];

/** The slot an item can be worn in by a Guardian, if it can be worn. */
function guardianSlot(it: Item, taken: Set<string>): string | null {
  const b = itemBase(it.baseId);
  if (it.sockets.some((s) => s !== null)) return null;
  if (ARMOUR.includes(b.itemClass)) return b.itemClass;
  if (b.weapon && b.itemClass !== 'bow' && b.itemClass !== 'wand')
    return taken.has('weapon1') ? 'weapon2' : 'weapon1';
  return null;
}

/** An item on the ground that a Guardian could wear, and the character can spare. */
export function guardianDrop(w: World, c: SkillChoice, reach: number): Drop | null {
  const u = c.skill.utility;
  if (u?.kind !== 'summon' || !u.warden) return null;
  const cap = levelValue(u.warden.maxReq, c.skill.level);
  const g = w.minions.find((m) => m.key === c.key && m.alive);
  const p = w.player;
  for (const d of w.drops) {
    const it = d.item;
    if (it.kind !== 'item' || (it.rarity !== 'normal' && it.rarity !== 'magic') || it.ilvl > cap)
      continue;
    if (Math.hypot(d.x - p.x, d.y - p.y) > reach) continue;
    const slot = guardianSlot(it, new Set(g?.gear?.keys()));
    if (!slot) continue;
    // A piece is not worn over a better one (the higher level stands for the better).
    const old = g?.gear?.get(slot);
    if (old && old.ilvl >= it.ilvl) continue;
    return d;
  }
  return null;
}

/** The Guardian puts on the item. */
export function wearItem(w: World, c: SkillChoice, drop: Drop, make: () => Minion): void {
  const u = c.skill.utility;
  if (u?.kind !== 'summon' || !u.warden) return;
  const it = drop.item as Item;
  const i = w.drops.indexOf(drop);
  if (i >= 0) w.drops.splice(i, 1);
  let g = w.minions.find((m) => m.key === c.key && m.alive);
  if (!g) g = make();
  g.gear ??= new Map();
  const slot = guardianSlot(it, new Set(g.gear.keys()))!;
  const was = g.gear.has(slot);
  g.gear.set(slot, it);
  g.gearKey = [...g.gear.entries()].map(([k, v]) => `${k}:${v.uid}`).join(',');
  // A weapon makes it strike with that weapon's damage; every piece worn adds what it has.
  const lv = c.skill.level;
  let min = levelValue(u.warden.addMin, lv);
  let max = levelValue(u.warden.addMax, lv);
  let aps = 1.2;
  let weapons = 0;
  for (const [k, item] of g.gear) {
    if (!k.startsWith('weapon')) continue;
    weapons++;
    const wb = itemBase(item.baseId).weapon!;
    min += wb.min;
    max += wb.max;
    aps = wb.aps;
  }
  g.fixedHit = ((min + max) / 2) * (1 + levelValue(u.warden.melee, lv) / 100);
  g.fixedRate = weapons > 0 ? aps : 1.2;
  // A piece of armour new to its place mends a quarter of its life.
  if (!was && ARMOUR.includes(slot))
    g.life = Math.min(g.def.maxLife, g.life + g.def.maxLife * 0.25);
  g.defKey = undefined;
  refreshMinionDef(g, auraNow(w));
}
