import { ACTIVE_GEMS } from '../data/gems';
import { MONSTER_TYPES } from '../data/monsters';
import type { SkillDot } from './skillDots';
import type { Actor, World } from './types';

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
  split?: { name: string; kind: RowKind; wt: number[] }[];
};

/** The rows of one side, a map for each kind of source (so a hit finds its row without building a key). */
type Side = Record<RowKind, Map<string, LedgerRow>>;

export type Ledger = {
  dealt: Side;
  taken: Side;
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
    dealt: newSide(),
    taken: newSide(),
    pools: { es: 0, life: 0, mana: 0 },
    evaded: 0,
    blocked: 0,
  };
}

const newSide = (): Side => ({
  skill: new Map(),
  minion: new Map(),
  ailment: new Map(),
  monster: new Map(),
  effect: new Map(),
});

const sum = (d: number[]) => d[0] + d[1] + d[2] + d[3] + d[4];

function row(side: Side, name: string, kind: RowKind): LedgerRow {
  const m = side[kind];
  let r = m.get(name);
  if (!r) {
    r = { name, kind, dmg: [0, 0, 0, 0, 0], hits: 0, crits: 0, misses: 0, max: 0 };
    m.set(name, r);
  }
  return r;
}

/** Damage that has been dealt, by type: to the character (taken) or to a monster (dealt). Called by `applyDamage`. */
export function noteDamage(w: World, dst: Actor, dmg: number[], src: DmgSrc | undefined): void {
  const side = dst.isPlayer ? w.ledger.taken : dst.faction === 1 ? w.ledger.dealt : null;
  if (!side) return;
  const s: DmgSrc = src ?? { name: 'Other', kind: 'effect' };
  if (!s.split) {
    const r = row(side, s.name, s.kind);
    for (let i = 0; i < 5; i++) r.dmg[i] += dmg[i];
    return;
  }
  // A tick of damage over time shares each type over the sources that made it, by their weight.
  for (let i = 0; i < 5; i++) {
    if (dmg[i] <= 0) continue;
    let wt = 0;
    for (const p of s.split) wt += p.wt[i];
    if (wt <= 0) {
      row(side, s.name, s.kind).dmg[i] += dmg[i];
      continue;
    }
    for (const p of s.split)
      if (p.wt[i] > 0) row(side, p.name, p.kind).dmg[i] += (dmg[i] * p.wt[i]) / wt;
  }
}

/** A hit that landed (`total` is what it dealt), by what dealt it. */
export function noteHit(w: World, dst: Actor, src: DmgSrc, total: number, crit: boolean): void {
  const side = dst.isPlayer ? w.ledger.taken : dst.faction === 1 ? w.ledger.dealt : null;
  if (!side) return;
  const r = row(side, src.name, src.kind);
  r.hits++;
  if (crit) r.crits++;
  if (total > r.max) r.max = total;
}

/** An attack that did nothing: it missed, or was blocked or turned aside. */
export function noteMiss(w: World, dst: Actor, src: DmgSrc, blocked: boolean): void {
  if (dst.isPlayer) {
    if (blocked) w.ledger.blocked++;
    else w.ledger.evaded++;
    return;
  }
  if (dst.faction !== 1) return;
  row(w.ledger.dealt, src.name, src.kind).misses++;
}

/** Where the character's damage went: energy shield, then (maybe) mana, then life. */
export function notePools(w: World, es: number, mana: number, life: number): void {
  w.ledger.pools.es += es;
  w.ledger.pools.mana += mana;
  w.ledger.pools.life += life;
}

/** The monster that hit, named by its kind (a pack of the same kind is one row); a boss by its own name. */
export function monsterSrc(a: Actor): DmgSrc {
  const boss = a.rarity === 'boss' || a.rarity === 'miniboss';
  const type = a.mon?.spec.type;
  const name = !boss && type && MONSTER_TYPES[type] ? MONSTER_TYPES[type].name : a.name;
  return { name: name || 'Unknown', kind: 'monster' };
}

/** The sources of one tick of damage over time, with how much of each type each gave (the weights `noteDamage` shares by). */
export function dotSources(
  player: boolean,
  ignite: number,
  bleed: number,
  poison: number,
  skills: SkillDot[] | null,
): NonNullable<DmgSrc['split']> {
  const split: NonNullable<DmgSrc['split']> = [];
  if (ignite > 0)
    split.push({ name: player ? 'Burning' : 'Ignite', kind: 'ailment', wt: [0, 0, 0, ignite, 0] });
  if (bleed > 0)
    split.push({ name: player ? 'Bleeding' : 'Bleed', kind: 'ailment', wt: [bleed, 0, 0, 0, 0] });
  if (poison > 0) split.push({ name: 'Poison', kind: 'ailment', wt: [0, 0, 0, 0, poison] });
  for (const d of skills ?? []) {
    const wt = [0, 0, 0, 0, 0];
    wt[d.type] = d.dps;
    split.push({ name: skillName(d.src), kind: 'skill', wt });
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

/** The report of the map the world has played so far. */
export function buildReport(w: World): MapReport {
  const l = w.ledger;
  const copy = (side: Side) =>
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
    const m = newSide();
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
