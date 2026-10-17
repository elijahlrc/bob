import { ACTIVE_GEMS } from '../data/gems';
import { MONSTER_TYPES } from '../data/monsters';
import type { SkillDot } from './skillDots';
import type { Actor, World } from './types';
import { hunted, MONSTERS } from './side';
import type { Side } from './side';

/** What dealt (or took) the damage of a row: a skill, a minion, an ailment, a monster or some other effect. */
export type RowKind = 'skill' | 'minion' | 'ailment' | 'monster' | 'effect';

/** One row of the map report: everything one source dealt in a map, split by damage type (physical, lightning, cold, fire, chaos). */
export type LedgerRow = {
  name: string;
  kind: RowKind;
  /** Damage that reached the target, after resistance, armour and the like. */
  dmg: number[];
  /** Hits that landed, how many of them were critical, attacks that missed or were blocked, and the biggest hit. */
  hits: number;
  crits: number;
  misses: number;
  max: number;
};

/** How a source is named for the ledger; `split` shares a tick of damage over time between several sources. */
export type DmgSrc = {
  name: string;
  kind: RowKind;
  /** The side whose damage it is, when it is a character's (or a minion's): what it deals is credited to that side. */
  side?: Side;
  split?: { name: string; kind: RowKind; wt: number[]; side?: Side }[];
};

/** Damage over time of one kind of ailment that one side's hits put on an actor: the side (none for no owner) and its dps. */
export type DotShare = { side: Side | undefined; dps: number };

/** The rows of one side, a map for each kind of source (so a hit finds its row without building a key). */
type Rows = Record<RowKind, Map<string, LedgerRow>>;

export type Ledger = {
  dealt: Rows;
  taken: Rows;
  /** What the damage the character took came out of. */
  pools: { es: number; life: number; mana: number };
  /** Hits aimed at the character that missed it (evaded) or that it blocked. */
  evaded: number;
  blocked: number;
};

/** The finished report of a map (or a whole Crawl), biggest first. */
export type MapReport = {
  time: number;
  dealt: LedgerRow[];
  taken: LedgerRow[];
  pools: { es: number; life: number; mana: number };
  evaded: number;
  blocked: number;
};

export function newLedger(): Ledger {
  return {
    dealt: newRows(),
    taken: newRows(),
    pools: { es: 0, life: 0, mana: 0 },
    evaded: 0,
    blocked: 0,
  };
}

const newRows = (): Rows => ({
  skill: new Map(),
  minion: new Map(),
  ailment: new Map(),
  monster: new Map(),
  effect: new Map(),
});

const sum = (d: number[]) => d[0] + d[1] + d[2] + d[3] + d[4];

function row(side: Rows, name: string, kind: RowKind): LedgerRow {
  const m = side[kind];
  let r = m.get(name);
  if (!r) {
    r = { name, kind, dmg: [0, 0, 0, 0, 0], hits: 0, crits: 0, misses: 0, max: 0 };
    m.set(name, r);
  }
  return r;
}

/**
 * The side credited with damage to `dst`: the one the source names (unless it is on `dst`'s own team), and, for what no side owns
 * (the ground, a drain), on a monster, the side that fights it (the character it hunts). A character's damage taken from
 * monsters or the ground is only taken: no side dealt it.
 */
function ownerOf(w: World, dst: Actor, by: Side | undefined): Side | null {
  if (by) return by.team === dst.team ? null : by;
  return dst.team === MONSTERS ? hunted(w, dst).side : null;
}

function addDamage(rows: Rows, name: string, kind: RowKind, dmg: number[]): void {
  const r = row(rows, name, kind);
  for (let i = 0; i < 5; i++) r.dmg[i] += dmg[i];
}

/**
 * Damage that has been dealt, by type: what a character takes is entered in its own ledger (taken), and what a side deals in its
 * ledger (dealt): the character's hits on a monster, or one character's on another. Called by `applyDamage`.
 */
export function noteDamage(w: World, dst: Actor, dmg: number[], src: DmgSrc | undefined): void {
  const taken = dst.isPlayer ? dst.side!.ledger.taken : null;
  const owner = ownerOf(w, dst, src?.side);
  if (!taken && !owner) return;
  const s: DmgSrc = src ?? { name: 'Other', kind: 'effect' };
  if (!s.split) {
    if (taken) addDamage(taken, s.name, s.kind, dmg);
    if (owner) addDamage(owner.ledger.dealt, s.name, s.kind, dmg);
    return;
  }
  // A tick of damage over time shares each type over the sources that made it, by their weight, each credited to its own side.
  const give = (name: string, kind: RowKind, i: number, amount: number, by: Side | undefined) => {
    if (taken) row(taken, name, kind).dmg[i] += amount;
    const o = by ? ownerOf(w, dst, by) : owner;
    if (o) row(o.ledger.dealt, name, kind).dmg[i] += amount;
  };
  for (let i = 0; i < 5; i++) {
    if (dmg[i] <= 0) continue;
    let wt = 0;
    for (const p of s.split) wt += p.wt[i];
    if (wt <= 0) {
      give(s.name, s.kind, i, dmg[i], undefined);
      continue;
    }
    for (const p of s.split)
      if (p.wt[i] > 0) give(p.name, p.kind, i, (dmg[i] * p.wt[i]) / wt, p.side);
  }
}

/** What a side has dealt, for its stats: `total` of the damage that reached `dst`, shared over the owners of a tick of damage over time. */
export function noteDealt(
  w: World,
  dst: Actor,
  dmg: number[],
  total: number,
  src: DmgSrc | undefined,
): void {
  const owner = ownerOf(w, dst, src?.side);
  const split = src?.split;
  let owned = false;
  if (split) for (const p of split) if (p.side) owned = true;
  if (!split || !owned) {
    if (owner) owner.stats.damageDealt += total;
    return;
  }
  for (let i = 0; i < 5; i++) {
    if (dmg[i] <= 0) continue;
    let wt = 0;
    for (const p of split) wt += p.wt[i];
    if (wt <= 0) {
      if (owner) owner.stats.damageDealt += dmg[i];
      continue;
    }
    for (const p of split) {
      const o = p.side ? ownerOf(w, dst, p.side) : owner;
      if (o && p.wt[i] > 0) o.stats.damageDealt += (dmg[i] * p.wt[i]) / wt;
    }
  }
}

/** A hit that landed (`total` is what it dealt), by what dealt it. */
export function noteHit(w: World, dst: Actor, src: DmgSrc, total: number, crit: boolean): void {
  if (dst.isPlayer) bumpHit(dst.side!.ledger.taken, src, total, crit);
  const owner = ownerOf(w, dst, src.side);
  if (owner) bumpHit(owner.ledger.dealt, src, total, crit);
}

function bumpHit(rows: Rows, src: DmgSrc, total: number, crit: boolean): void {
  const r = row(rows, src.name, src.kind);
  r.hits++;
  if (crit) r.crits++;
  if (total > r.max) r.max = total;
}

/** An attack that did nothing: it missed, or was blocked or turned aside. */
export function noteMiss(w: World, dst: Actor, src: DmgSrc, blocked: boolean): void {
  if (dst.isPlayer) {
    const l = dst.side!.ledger;
    if (blocked) l.blocked++;
    else l.evaded++;
  }
  const owner = ownerOf(w, dst, src.side);
  if (owner) row(owner.ledger.dealt, src.name, src.kind).misses++;
}

/** Where the character's damage went: energy shield, then (maybe) mana, then life. */
export function notePools(s: Side, es: number, mana: number, life: number): void {
  s.ledger.pools.es += es;
  s.ledger.pools.mana += mana;
  s.ledger.pools.life += life;
}

/** The monster that hit, named by its kind (a pack of the same kind is one row); a boss by its own name. */
export function monsterSrc(a: Actor): DmgSrc {
  const boss = a.rarity === 'boss' || a.rarity === 'miniboss';
  const type = a.mon?.spec.type;
  const name = !boss && type && MONSTER_TYPES[type] ? MONSTER_TYPES[type].name : a.name;
  return { name: name || 'Unknown', kind: 'monster' };
}

/**
 * The sources of one tick of damage over time, with how much of each type each gave (the weights `noteDamage` shares by). With
 * several sides in the world, `owners` says whose hits each ailment came from, and each part is credited to its own side.
 */
export function dotSources(
  player: boolean,
  ignite: number,
  bleed: number,
  poison: number,
  skills: SkillDot[] | null,
  owners?: { ignite?: DotShare[]; bleed?: DotShare[]; poison?: DotShare[] },
): NonNullable<DmgSrc['split']> {
  const split: NonNullable<DmgSrc['split']> = [];
  const add = (name: string, type: number, total: number, shares: DotShare[] | undefined) => {
    if (total <= 0) return;
    if (!shares || shares.length === 0) {
      const wt = [0, 0, 0, 0, 0];
      wt[type] = total;
      split.push({ name, kind: 'ailment', wt });
      return;
    }
    // Several owners share the tick by their share of the dps.
    let sum = 0;
    for (const x of shares) sum += x.dps;
    for (const x of shares) {
      const wt = [0, 0, 0, 0, 0];
      wt[type] = sum > 0 ? (total * x.dps) / sum : total / shares.length;
      split.push({ name, kind: 'ailment', wt, side: x.side });
    }
  };
  add(player ? 'Burning' : 'Ignite', 3, ignite, owners?.ignite);
  add(player ? 'Bleeding' : 'Bleed', 0, bleed, owners?.bleed);
  add('Poison', 4, poison, owners?.poison);
  for (const d of skills ?? []) {
    const wt = [0, 0, 0, 0, 0];
    wt[d.type] = d.dps;
    split.push({ name: skillName(d.src), kind: 'skill', wt, side: d.by });
  }
  return split;
}

let gemNames: Map<string, string> | null = null;
/** The name of the skill that put a lasting debuff on an enemy, from its id. */
export function skillName(id: string): string {
  gemNames ??= new Map(ACTIVE_GEMS.map((g) => [g.id, g.name]));
  return gemNames.get(id) ?? id;
}

const byTotal = (a: LedgerRow, b: LedgerRow) => sum(b.dmg) - sum(a.dmg);

/** The report of the map a side has played so far. */
export function buildReport(w: World, s: Side): MapReport {
  const l = s.ledger;
  const copy = (side: Rows) =>
    Object.values(side)
      .flatMap((m) => [...m.values()])
      .filter((r) => sum(r.dmg) > 0 || r.hits > 0 || r.misses > 0)
      .map((r) => ({ ...r, dmg: [...r.dmg] }))
      .sort(byTotal);
  return {
    time: w.t,
    dealt: copy(l.dealt),
    taken: copy(l.taken),
    pools: { ...l.pools },
    evaded: l.evaded,
    blocked: l.blocked,
  };
}

/** One report for several maps (a Crawl): rows of the same source added together. */
export function combineReports(parts: MapReport[]): MapReport {
  const merge = (pick: (r: MapReport) => LedgerRow[]) => {
    const m = newRows();
    for (const part of parts)
      for (const r of pick(part)) {
        const t = row(m, r.name, r.kind);
        for (let i = 0; i < 5; i++) t.dmg[i] += r.dmg[i];
        t.hits += r.hits;
        t.crits += r.crits;
        t.misses += r.misses;
        t.max = Math.max(t.max, r.max);
      }
    return Object.values(m)
      .flatMap((k) => [...k.values()])
      .sort(byTotal);
  };
  return {
    time: parts.reduce((s, r) => s + r.time, 0),
    dealt: merge((r) => r.dealt),
    taken: merge((r) => r.taken),
    pools: {
      es: parts.reduce((s, r) => s + r.pools.es, 0),
      life: parts.reduce((s, r) => s + r.pools.life, 0),
      mana: parts.reduce((s, r) => s + r.pools.mana, 0),
    },
    evaded: parts.reduce((s, r) => s + r.evaded, 0),
    blocked: parts.reduce((s, r) => s + r.blocked, 0),
  };
}
