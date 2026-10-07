import {
  dmgMask,
  tagMask,
  type CondId,
  type Mod,
  type ModKind,
  type SkillTag,
  type StatId,
  maskIntersects,
  maskOr,
  maskSubset,
} from './types';

/**
 * The bit of each condition, local to one character (or one monster kind): only conditions some mod uses get a bit, so
 * there can be any number of condition ids as long as one character uses at most 52. Every ModDB of a character shares its
 * index, so a mask means the same thing in all of them. `peek` is 0 for a condition no mod uses: then nothing depends on
 * it and the sim need not evaluate it.
 */
export class CondIndex {
  readonly ids: CondId[] = [];
  private index = new Map<CondId, number>();

  /** The bit of a condition, registering it if it is new. */
  bit(id: CondId): number {
    let i = this.index.get(id);
    if (i === undefined) {
      i = this.ids.length;
      if (i >= 52) throw new Error('more than 52 conditions in one character');
      this.ids.push(id);
      this.index.set(id, i);
    }
    return 2 ** i;
  }

  /** The bit of a condition some mod uses, or 0. */
  peek(id: CondId): number {
    const i = this.index.get(id);
    return i === undefined ? 0 : 2 ** i;
  }

  /** Every registered bit. */
  get all(): number {
    return 2 ** this.ids.length - 1;
  }

  /** The bits of the conditions about the target, which damage over time ignores. */
  targetMask(): number {
    let m = 0;
    for (const id of this.ids) if (id.startsWith('target')) m = maskOr(m, this.peek(id));
    return m;
  }
}

/** Query context. Masks are precomputed bitsets (see `types.ts`); condition masks use the ModDB's CondIndex. */
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
  /** The condition index of the ModDB queried (`db.cond`); needed when `conds` is given. */
  cond?: CondIndex;
  tags?: readonly SkillTag[];
  ancestry?: Parameters<typeof dmgMask>[0];
  conds?: readonly CondId[];
  statValue?: (stat: StatId) => number;
}): ModCtx {
  let conds = 0;
  for (const c of opts.conds ?? []) conds = maskOr(conds, opts.cond?.peek(c) ?? 0);
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

function compile(m: Mod, cond: CondIndex): Compiled {
  return {
    mod: m,
    tagMask: tagMask(m.tags),
    dmgMask: dmgMask(m.damageTypes),
    condMask: m.condition ? cond.bit(m.condition.id) : 0,
    condNot: m.condition?.not ?? false,
  };
}

function matches(c: Compiled, ctx: ModCtx, require = 0): boolean {
  if (require && !maskIntersects(c.tagMask, require)) return false;
  if (c.tagMask && !maskSubset(c.tagMask, ctx.tags)) return false;
  if (c.dmgMask && ctx.ancestry && (c.dmgMask & ctx.ancestry) === 0) return false;
  if (c.condMask) {
    const on = maskIntersects(ctx.conds, c.condMask);
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

  readonly cond: CondIndex;

  constructor(mods: readonly Mod[] = [], cond: CondIndex = new CondIndex()) {
    this.cond = cond;
    this.addAll(mods);
  }

  add(m: Mod): void {
    this.all.push(m);
    let list = this.byStat.get(m.stat);
    if (!list) this.byStat.set(m.stat, (list = []));
    list.push(compile(m, this.cond));
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

  /**
   * Sum of matching mods of one kind. `require` (tag bitmask) additionally demands that the mod
   * carries at least one of those tags (used for ailment-only scaling).
   */
  sum(kind: ModKind, stat: StatId, ctx: ModCtx = EMPTY_CTX, require = 0): number {
    const list = this.byStat.get(stat);
    if (!list) return 0;
    let s = 0;
    for (const c of list) if (c.mod.kind === kind && matches(c, ctx, require)) s += valueOf(c, ctx);
    return s;
  }

  /** Product of (1 + more/100) over matching `more` mods. */
  more(stat: StatId, ctx: ModCtx = EMPTY_CTX, require = 0): number {
    const list = this.byStat.get(stat);
    if (!list) return 1;
    let p = 1;
    for (const c of list)
      if (c.mod.kind === 'more' && matches(c, ctx, require)) p *= 1 + valueOf(c, ctx) / 100;
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
  inc(stat: StatId, ctx: ModCtx = EMPTY_CTX, require = 0): number {
    return this.sum('inc', stat, ctx, require) / 100;
  }

  /** `base · (1 + Σinc) · Π more`, honouring overrides. */
  calc(stat: StatId, ctx: ModCtx = EMPTY_CTX, extraBase = 0): number {
    const o = this.override(stat, ctx);
    if (o !== undefined) return o;
    const base = this.sum('base', stat, ctx) + extraBase;
    return base * Math.max(0, 1 + this.inc(stat, ctx)) * this.more(stat, ctx);
  }

  /** `(1 + Σinc) · Π more` (for multipliers on an externally supplied base). */
  mult(stat: StatId, ctx: ModCtx = EMPTY_CTX, require = 0): number {
    return Math.max(0, 1 + this.inc(stat, ctx, require)) * this.more(stat, ctx, require);
  }

  /** Bitmask of every condition used by any mod (to keep condition-keyed caches small). */
  condsUsed(): number {
    let m = 0;
    for (const list of this.byStat.values()) for (const c of list) m = maskOr(m, c.condMask);
    return m;
  }

  /** True if any mod for this stat depends on a condition. */
  isConditional(stat: StatId): boolean {
    const list = this.byStat.get(stat);
    return !!list && list.some((c) => c.condMask !== 0);
  }
}
