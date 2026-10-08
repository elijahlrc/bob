/**
 * Turns the reference tree into the clusters of Bob's tree: one cluster per reference notable, made of an analog of the
 * notable (its lines translated into Bob's mods) and a few small nodes that repeat the theme of the reference cluster's own
 * small nodes. Names, layout and ring come from us; only the stat lines and the size of the cluster follow the reference.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ctxFor, translateLine, type ModT } from '../coverage/translate';
import type { RefNode, TreeRef } from './extract';

export type Override = {
  /** The reference notable has no analog in Bob (and why). */
  skip?: string;
  /** Lines to leave out (a substring of the reference line each). */
  drop?: string[];
  /** Hand-written mods added to the translated ones. */
  mods?: ModT[];
  /** The family the cluster sorts under on the tree (see `familyOf`). */
  family?: string;
  note?: string;
};
export type Overrides = Record<string, Override>;

export type ClusterBuilt = {
  ref: number;
  /** Index into the reference's `sectors`. */
  sector: number;
  depth: number;
  notable: ModT[];
  /** Reference lines that no rule maps and that were left out. */
  dropped: string[];
  small: ModT[];
  smallCount: number;
  family: string;
};

const ctx = ctxFor('ring', 'ring');
const flat = (l: string) => l.replace(/\s*\n\s*/g, ' ');

/** The mods of a list of reference lines, and the lines that did not translate. */
export function translateLines(
  lines: string[],
  drop: string[] = [],
): { mods: ModT[]; dropped: string[] } {
  const mods: ModT[] = [];
  const dropped: string[] = [];
  for (const raw of lines) {
    const line = flat(raw);
    if (drop.some((s) => line.includes(s))) continue;
    const r = translateLine(line, ctx);
    if (r.kind === 'mods') mods.push(...r.mods);
    else if (r.kind === 'unmapped') dropped.push(line);
  }
  return { mods, dropped };
}

/** What a cluster is about, for sorting the tree into wedges: the first mod's subject. */
export function familyOf(mods: ModT[]): string {
  const m = mods[0];
  if (!m) return 'misc';
  const tags = new Set(m.tags ?? []);
  const s = m.stat;
  for (const t of [
    'minion',
    'totem',
    'trap',
    'mine',
    'brand',
    'channelling',
    'curse',
    'aura',
    'warcry',
  ] as const)
    if (tags.has(t) || s.toLowerCase().includes(t)) return t;
  if (s.startsWith('minion')) return 'minion';
  if (s === 'dotMulti' || s.endsWith('.speed') || s.startsWith('duration') || tags.has('dot'))
    return 'dot';
  if (/^(chance\.(ignite|bleed|poison|shock|freeze)|ailmentEffect|effect\.)/.test(s))
    return 'ailment';
  if (s === 'life' || s.startsWith('lifeRegen') || s === 'lifeOnKillPct') return 'life';
  if (s === 'mana' || s.startsWith('manaRegen') || s === 'cost' || s === 'reducedReservation')
    return 'mana';
  if (s === 'es' || s.startsWith('esRecharge')) return 'es';
  if (s === 'armour' || s === 'physReduction' || s === 'shieldDefences') return 'armour';
  if (s === 'evasion' || s.startsWith('dodge') || s.startsWith('evade')) return 'evasion';
  if (s.startsWith('block') || s === 'shieldEs') return 'block';
  if (s.startsWith('resist') || s.startsWith('maxResist')) return 'res';
  if (s.startsWith('leech')) return 'leech';
  if (s.startsWith('charge') || s.startsWith('maxCharges') || s.startsWith('minCharges'))
    return 'charges';
  if (s.startsWith('flask')) return 'flask';
  if (s === 'critChance' || s === 'critMulti') return 'crit';
  if (s === 'attackSpeed' || s === 'castSpeed' || s === 'moveSpeed') return 'speed';
  if (s === 'accuracy') return 'accuracy';
  if (s.startsWith('stun') || s === 'enemyStunThreshold') return 'stun';
  if (s === 'str' || s === 'dex' || s === 'int' || s === 'allAttr') return 'attr';
  if (s === 'penetration' || s === 'enemyPhysReduction') return 'pen';
  if (tags.has('projectile') || s === 'projectiles' || s === 'pierce' || s === 'chains')
    return 'projectile';
  if (tags.has('spell')) return 'spell';
  if (
    tags.has('melee') ||
    tags.has('twoHand') ||
    tags.has('oneHand') ||
    tags.has('mace') ||
    tags.has('sword') ||
    tags.has('axe') ||
    tags.has('claw') ||
    tags.has('dagger') ||
    tags.has('staff') ||
    tags.has('sceptre')
  )
    return 'melee';
  if (tags.has('bow') || tags.has('wand')) return 'ranged';
  if (s === 'aoe') return 'aoe';
  if (s === 'damage' || s.startsWith('gain.') || s.startsWith('convert')) {
    const t = m.damageTypes?.[0];
    return t ? 'dmg.' + t : tags.has('attack') ? 'attack' : 'damage';
  }
  return 'misc';
}

const keyOf = (mods: ModT[]) =>
  JSON.stringify(
    mods.map((m) => [m.stat, m.kind, m.min, m.tags, m.damageTypes, m.condition, m.per]),
  );

export function buildClusters(
  ref: TreeRef,
  overrides: Overrides = {},
): { built: ClusterBuilt[]; skipped: { ref: number; name: string; why: string }[] } {
  const byGroup = new Map<number, RefNode[]>();
  for (const n of ref.nodes)
    (byGroup.get(n.group) ?? byGroup.set(n.group, []).get(n.group)!).push(n);
  const built: ClusterBuilt[] = [];
  const skipped: { ref: number; name: string; why: string }[] = [];
  for (const n of ref.nodes) {
    if (n.kind !== 'notable') continue;
    const o = overrides[String(n.id)] ?? {};
    if (o.skip) {
      skipped.push({ ref: n.id, name: n.name, why: o.skip });
      continue;
    }
    const { mods, dropped } = translateLines(n.lines, o.drop);
    const notable = [...mods, ...(o.mods ?? [])];
    if (notable.length === 0) {
      skipped.push({ ref: n.id, name: n.name, why: 'no line translates' });
      continue;
    }
    const group = byGroup.get(n.group) ?? [];
    const smalls = group.filter((x) => x.kind === 'small' && x.lines.length > 0);
    const notables = group.filter((x) => x.kind === 'notable').length;
    // The small nodes' theme: the most common line set among them.
    const votes = new Map<string, { mods: ModT[]; n: number }>();
    for (const s of smalls) {
      const t = translateLines(s.lines).mods;
      if (t.length === 0) continue;
      const k = keyOf(t);
      const v = votes.get(k) ?? { mods: t, n: 0 };
      v.n++;
      votes.set(k, v);
    }
    let small = [...votes.values()].sort((a, b) => b.n - a.n)[0]?.mods;
    if (!small) {
      // No small nodes of its own: a third of the notable's main line.
      const first = notable[0];
      small = [{ ...first, min: roundTo(first.min / 3), max: roundTo(first.max / 3) }];
    }
    const smallCount = Math.min(4, Math.max(2, Math.round(smalls.length / Math.max(1, notables))));
    built.push({
      ref: n.id,
      sector: n.sector,
      depth: n.depth,
      notable,
      dropped,
      small,
      smallCount,
      family: o.family ?? familyOf(notable),
    });
  }
  return { built, skipped };
}

const roundTo = (v: number) => Math.round(v * 10) / 10 || (v > 0 ? 0.1 : -0.1);

export const TREE_DIR = resolve(import.meta.dirname, '../../docs/tree');

export function loadOverrides(): Overrides {
  try {
    return JSON.parse(readFileSync(resolve(TREE_DIR, 'overrides.json'), 'utf8')) as Overrides;
  } catch {
    return {};
  }
}

export function loadNames(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of ['names.json']) {
    try {
      Object.assign(out, JSON.parse(readFileSync(resolve(TREE_DIR, f), 'utf8')));
    } catch {
      /* none yet */
    }
  }
  return out;
}

/** The region of Bob's tree each reference sector lands in: by attribute, as the design says (marauder strength, and so on). */
export const SECTOR_REGION = ['str', 'dex', 'int', 'strdex', 'strint', 'dexint'] as const;
