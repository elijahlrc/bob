import { Rng } from '../core/rng';
import { family, familyMods } from '../data/affixes';
import { ITEM_BASES, itemBase } from '../data/bases';
import { isGem } from '../data/gems';
import { uniqueDef } from '../data/uniques';
import { EQUIP_SLOTS, type Build, type GemItem, type Item } from '../data/types';
import { rollUnique, socketLimit } from '../gen/loot';
import type { Rival } from './rivals';
import { noteFound } from './found';
import { uidSource, type RunState } from './run';

/**
 * The fallen characters the Envious Dead and Another's Remains are made of (docs/ATTRITION.md): another player's run that
 * ended in death near the level, from the rivals list. The run layer never fetches: the shade is handed in (`src/rivals.ts`
 * fetches it) and kept in the stop's visit, so a reload finds the same one.
 */
export type Shade = { name: string; classId: string; level: number; map: number; build: Build };

/** Where the shade of an offered rivals stop stands (kept on the controller, never saved): asked for, found, or closed and why. */
export type ShadeStatus =
  { state: 'loading' } | { state: 'ready'; shade: Shade } | { state: 'closed'; why: string };

/** The key of an offer's shade status: the run and the offer. */
export const shadeKey = (run: RunState, offerId: string): string => `${run.seed}:${offerId}`;

/** A foe within this many levels of the character is drawn first, the nearest; beyond it, one below the character. */
export const SHADE_NEAR = 5;

/**
 * The shade a stop is made of, from the rivals near the level: a player's fallen character before a bot's, the nearest in
 * character level, ties broken by the seed. A foe (the Envious Dead's) with none within `SHADE_NEAR` levels is drawn from
 * those below the character before any above (the owner, 2026-10-30: a duel against a character 20 levels higher is no
 * fun). Null when none died near.
 */
export function pickShade(
  rivals: readonly Rival[],
  run: RunState,
  offerId: string,
  foe = false,
): Shade | null {
  const dead = rivals.filter((r) => r.outcome === 'died');
  if (!dead.length) return null;
  const gap = (r: Rival) => Math.abs(r.level - run.build.level);
  const tiers = foe
    ? [
        dead.filter((r) => gap(r) <= SHADE_NEAR),
        dead.filter((r) => r.level < run.build.level),
        dead,
      ]
    : [dead];
  const among = tiers.find((t) => t.length)!;
  const pool = among.some((r) => !r.bot) ? among.filter((r) => !r.bot) : among;
  const best = Math.min(...pool.map(gap));
  const near = pool.filter((r) => gap(r) === best);
  const r = new Rng(run.seed).fork(`shade${offerId}`).pick(near);
  return { name: r.name, classId: r.classId, level: r.level, map: r.map, build: r.build };
}

/** For testing with no rivals list (`?shades` in a dev build): the character's own build, as a shade of itself. */
export function fixtureShade(run: RunState): Shade {
  return {
    name: 'A test shade',
    classId: run.build.classId,
    level: run.build.level,
    map: run.map,
    build: structuredClone(run.build),
  };
}

const knownFamily = (id: string) => {
  try {
    return family(id);
  } catch {
    return null;
  }
};

const implicitKeys = new Set(ITEM_BASES.map((b) => JSON.stringify(b.implicits)));

/**
 * An item of another player's build, made safe to take: the rivals table limits a build's size, not what is in it, so every
 * number is put back within what the item could roll (affixes within their tier, a unique rolled afresh from its own entry, an
 * implicit some base has, gems that exist). Null when it cannot be made sense of.
 */
export function sanitizeShadeItem(it: Item): Item | null {
  try {
    const base = itemBase(it.baseId);
    const ilvl = Math.max(1, Math.min(100, Math.round(it.ilvl)));
    // No more sockets than the base could have at its level.
    const sockets: (GemItem | null)[] = (it.sockets ?? [])
      .slice(0, socketLimit(base, ilvl))
      .map((g) =>
        g && isGem(g.gemId) ? { kind: 'gem' as const, uid: g.uid, gemId: g.gemId } : null,
      );
    if (it.uniqueId) {
      const fresh = rollUnique(
        new Rng(ilvl).fork(`shade${it.uniqueId}`),
        () => it.uid,
        uniqueDef(it.uniqueId),
        ilvl,
      );
      return fresh.fixedSockets ? fresh : { ...fresh, sockets };
    }
    const affixes = (it.affixes ?? []).slice(0, 6).flatMap((a) => {
      // An affix this version does not know is dropped, not the item.
      const f = knownFamily(a.family);
      const tier = f?.tiers.find((t) => t.tier === a.tier);
      if (!f || !tier) return [];
      const values = tier.ranges.map(([lo, hi], i) => {
        const v = a.mods?.[i]?.value;
        return typeof v === 'number' && Number.isFinite(v)
          ? Math.min(Math.max(v, Math.min(lo, hi)), Math.max(lo, hi))
          : (lo + hi) / 2;
      });
      return [{ family: f.id, tier: tier.tier, mods: familyMods(f, values) }];
    });
    const implicits = implicitKeys.has(JSON.stringify(it.implicits ?? []))
      ? it.implicits.map((m) => ({ ...m }))
      : base.implicits.map((m) => ({ ...m }));
    return {
      kind: 'item',
      uid: it.uid,
      baseId: base.id,
      rarity:
        affixes.length === 0
          ? 'normal'
          : it.rarity === 'magic' && affixes.length <= 2
            ? 'magic'
            : 'rare',
      name: typeof it.name === 'string' ? it.name.slice(0, 60) : base.name,
      ilvl,
      implicits,
      affixes,
      sockets,
    };
  } catch {
    return null;
  }
}

/** What a shade wore, each item made safe (`sanitizeShadeItem`); the uids are the shade's, for picking. */
export function shadeItems(shade: Shade): Item[] {
  const out: Item[] = [];
  for (const slot of EQUIP_SLOTS) {
    const it = shade.build.equipment?.[slot];
    if (!it || it.kind !== 'item') continue;
    const safe = sanitizeShadeItem(it);
    if (safe) out.push(safe);
  }
  return out;
}

/** Give the run one of a shade's items, with new uids for it and the gems in it (nothing in an item points at its old run). */
export function grantShadeItem(run: RunState, it: Item): void {
  const uid = uidSource(run);
  const taken: Item = {
    ...it,
    uid: uid(),
    sockets: it.sockets.map((g) => (g ? { ...g, uid: uid() } : null)),
  };
  run.inventory.push(taken);
  noteFound(run, taken);
}
