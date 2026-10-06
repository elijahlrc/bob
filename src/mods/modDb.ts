import {
  condBit,
  dmgMask,
  tagMask,
  type CondId,
  type Mod,
  type ModKind,
  type SkillTag,
  type StatId,
} from './types';

/** Query context. Masks are precomputed bitsets (see `types.ts`). */
export type ModCtx = {
  /** Skill tags of the current use (bitmask). */
  tags: number;
  /** Damage-type ancestry of the chunk being scaled (bitmask). 0 means "not a damage query". */
  ancestry: number;
  /** Active conditions (bitmask). */
  conds: number;
  /** Lookup for `per` scaling (e.g. attributes). */
  statValue?: (stat: StatId) => number;
};

export const EMPTY_CTX: ModCtx = { tags: 0, ancestry: 0, conds: 0 };

export function makeCtx(opts: {
  tags?: readonly SkillTag[];
  ancestry?: Parameters<typeof dmgMask>[0];
  conds?: readonly CondId[];
  statValue?: (stat: StatId) => number;
}): ModCtx {
  let conds = 0;
  for (const c of opts.conds ?? []) conds |= condBit(c);
  return {
    tags: tagMask(opts.tags),
    ancestry: dmgMask(opts.ancestry),
    conds,
    statValue: opts.statValue,
  };
}

type Compiled = {
  mod: Mod;
  tagMask: number;
  dmgMask: number;
  condMask: number;
  condNot: boolean;
};

function compile(m: Mod): Compiled {
  return {
    mod: m,
    tagMask: tagMask(m.tags),
    dmgMask: dmgMask(m.damageTypes),
    condMask: m.condition ? condBit(m.condition.id) : 0,
    condNot: m.condition?.not ?? false,
  };
}

function matches(c: Compiled, ctx: ModCtx): boolean {
  if (c.tagMask && (c.tagMask & ctx.tags) !== c.tagMask) return false;
  if (c.dmgMask && ctx.ancestry && (c.dmgMask & ctx.ancestry) === 0) return false;
  if (c.condMask) {
    const on = (ctx.conds & c.condMask) !== 0;
    if (on === c.condNot) return false;
  }
  return true;
}

function valueOf(c: Compiled, ctx: ModCtx): number {
  const m = c.mod;
  if (!m.per) return m.value;
  const v = ctx.statValue ? ctx.statValue(m.per.stat) : 0;
  return m.value * Math.floor(v / m.per.div);
}

/**
 * A bag of mods indexed by stat. Query semantics (DESIGN.md §7.2):
 * damageTypes must overlap the ancestry, tags must be a subset of the use's tags, conditions true.
 */
export class ModDB {
  private byStat = new Map<StatId, Compiled[]>();
  private all: Mod[] = [];

  constructor(mods: readonly Mod[] = []) {
    this.addAll(mods);
  }

  add(m: Mod): void {
    this.all.push(m);
    let list = this.byStat.get(m.stat);
    if (!list) this.byStat.set(m.stat, (list = []));
    list.push(compile(m));
  }

  addAll(mods: readonly Mod[]): void {
    for (const m of mods) this.add(m);
  }

  mods(): readonly Mod[] {
    return this.all;
  }

  has(stat: StatId): boolean {
    return this.byStat.has(stat);
  }

  /** Sum of matching mods of one kind. */
  sum(kind: ModKind, stat: StatId, ctx: ModCtx = EMPTY_CTX): number {
    const list = this.byStat.get(stat);
    if (!list) return 0;
    let s = 0;
    for (const c of list) if (c.mod.kind === kind && matches(c, ctx)) s += valueOf(c, ctx);
    return s;
  }

  /** Product of (1 + more/100) over matching `more` mods. */
  more(stat: StatId, ctx: ModCtx = EMPTY_CTX): number {
    const list = this.byStat.get(stat);
    if (!list) return 1;
    let p = 1;
    for (const c of list)
      if (c.mod.kind === 'more' && matches(c, ctx)) p *= 1 + valueOf(c, ctx) / 100;
    return p;
  }

  /** True if any matching flag mod is present. */
  flag(stat: StatId, ctx: ModCtx = EMPTY_CTX): boolean {
    const list = this.byStat.get(stat);
    if (!list) return false;
    for (const c of list) if (c.mod.kind === 'flag' && matches(c, ctx)) return true;
    return false;
  }

  /** The last matching override, if any. */
  override(stat: StatId, ctx: ModCtx = EMPTY_CTX): number | undefined {
    const list = this.byStat.get(stat);
    if (!list) return undefined;
    let v: number | undefined;
    for (const c of list) if (c.mod.kind === 'override' && matches(c, ctx)) v = valueOf(c, ctx);
    return v;
  }

  /** Σinc as a fraction (20% → 0.2). */
  inc(stat: StatId, ctx: ModCtx = EMPTY_CTX): number {
    return this.sum('inc', stat, ctx) / 100;
  }

  /** `base · (1 + Σinc) · Π more`, honouring overrides. */
  calc(stat: StatId, ctx: ModCtx = EMPTY_CTX, extraBase = 0): number {
    const o = this.override(stat, ctx);
    if (o !== undefined) return o;
    const base = this.sum('base', stat, ctx) + extraBase;
    return base * Math.max(0, 1 + this.inc(stat, ctx)) * this.more(stat, ctx);
  }

  /** `(1 + Σinc) · Π more` (for multipliers on an externally supplied base). */
  mult(stat: StatId, ctx: ModCtx = EMPTY_CTX): number {
    return Math.max(0, 1 + this.inc(stat, ctx)) * this.more(stat, ctx);
  }

  /** True if any mod for this stat depends on a condition. */
  isConditional(stat: StatId): boolean {
    const list = this.byStat.get(stat);
    return !!list && list.some((c) => c.condMask !== 0);
  }
}
