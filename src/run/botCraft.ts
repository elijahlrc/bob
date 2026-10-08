import { family } from '../data/affixes';
import { BENCH_RECIPES, CURRENCIES } from '../data/currency';
import { themeDef } from '../data/themes';
import { Character } from '../calc/character';
import { EQUIP_SLOTS, type EquipSlot, type Item } from '../data/types';
import { botRegem, cfgFor, scoreBuild } from './bot';
import {
  addableFamilies,
  benchAdd,
  chalkAdd,
  chalkOptions,
  chalkRemove,
  completeTabletSets,
  drawReforge,
  owned,
  pickReforge,
  POLISH_LIMIT,
  previewAdd,
  previewPolish,
  previewRemove,
  redeemTablets,
  reforgeCost,
  socketCeiling,
  socketCost,
  unlocked,
  useAuger,
  useDie,
  useEssence,
  usePearl,
  useThread,
  useWhetstone,
  type CraftResult,
} from './craft';
import { junkItems } from './inventoryOps';
import type { RunState } from './run';
import { scoreTheme } from './threat';

/**
 * The greedy bot's crafting (EXPANSION 8.4). It evaluates the real options on the character sheet
 * instead of sampling outcomes: the best family to add, the affix whose removal costs least, the
 * affixes worth pinning, the socket count the gems can use. It never seals, and throws the die
 * only at junk it would discard anyway.
 */

/** The smallest gain, as a share of the score, worth a currency. */
const MIN_GAIN = 0.004;

const wornSlots = (run: RunState): EquipSlot[] => EQUIP_SLOTS.filter((s) => run.build.equipment[s]);

function trial(run: RunState, slot: EquipSlot, next: Item): number {
  return scoreBuild(run, { ...run.build, equipment: { ...run.build.equipment, [slot]: next } });
}

type Candidate = { gain: number; apply: () => CraftResult };

/** Every affix craft the bot could make now, with its predicted gain. */
function candidates(run: RunState, base: number): Candidate[] {
  const out: Candidate[] = [];
  const pearl = owned(run, 'pearl') > 0;
  const thread = owned(run, 'thread') > 0;
  const essences = CURRENCIES.filter((c) => c.families && owned(run, c.id) > 0);
  for (const slot of wornSlots(run)) {
    const it = run.build.equipment[slot]!;
    if (it.sealed || it.uniqueId) continue;
    const addable = addableFamilies(it);
    const gainOf = (next: Item | null) => (next ? (trial(run, slot, next) - base) / base : -1);
    if (pearl)
      for (const f of addable)
        out.push({ gain: gainOf(previewAdd(it, f)), apply: () => usePearl(run, it.uid, f.id) });
    for (const ess of essences)
      for (const fam of ess.families!) {
        const f = family(fam);
        if (addable.some((x) => x.id === fam))
          out.push({
            gain: gainOf(previewAdd(it, f)),
            apply: () => useEssence(run, it.uid, ess.id, fam),
          });
        else if (!it.affixes.some((a) => a.family === fam)) {
          // Full: replace the affix of the same kind that the character misses least.
          for (const old of it.affixes.filter((a) => family(a.family).type === f.type)) {
            const next = previewAdd(previewRemove(it, old.family), f);
            out.push({
              gain: gainOf(next),
              apply: () => useEssence(run, it.uid, ess.id, fam, old.family),
            });
          }
        }
      }
    if (owned(run, 'whetstone') > 0 && (it.polished ?? []).length < POLISH_LIMIT)
      for (const a of it.affixes)
        if (!(it.polished ?? []).includes(a.family))
          out.push({
            gain: gainOf(previewPolish(it, a.family)),
            apply: () => useWhetstone(run, it.uid, a.family),
          });
    // Swap: remove an affix to make room, then add a better one.
    if (pearl && thread && addable.length === 0 && it.rarity === 'rare')
      for (const old of it.affixes) {
        const freed = previewRemove(it, old.family);
        for (const f of addableFamilies(freed)) {
          const next = previewAdd(freed, f);
          out.push({
            gain: gainOf(next),
            apply: () => swapAffix(run, it.uid, old.family, f.id),
          });
        }
      }
    // Bone Dust at the bench: a fixed mid-low roll of a listed family.
    if (!it.affixes.some((a) => a.bench))
      for (const rec of BENCH_RECIPES) {
        if (rec.kind !== 'add' || run.dust < rec.dust || !unlocked(run, rec.minMap)) continue;
        const f = addable.find((x) => x.id === rec.family);
        if (!f) continue;
        out.push({
          // Mid-low tier: about half a typical roll, which is how the bench prices it.
          gain: gainOf(previewAdd(it, f)) * 0.5,
          apply: () => benchAdd(run, it.uid, rec.family),
        });
      }
  }
  return out;
}

/** Remove an affix with a Thread, then add one with a Pearl: the two-step swap on a full item. */
function swapAffix(run: RunState, uid: number, remove: string, add: string): CraftResult {
  const done = useThread(run, uid, remove);
  return done.ok ? usePearl(run, uid, add) : done;
}

/** A Reforging Ember on a worn rare that holds affixes the character barely uses. */
function botEmber(run: RunState): number {
  let done = 0;
  for (const slot of wornSlots(run)) {
    const it = run.build.equipment[slot]!;
    if (it.sealed || it.rarity !== 'rare' || it.affixes.length < 2 || run.pendingCraft) continue;
    const base = scoreBuild(run, run.build);
    // Pin the affixes the character would miss; leave the dead weight to be redrawn.
    const pins = it.affixes
      .filter((a) => (base - trial(run, slot, previewRemove(it, a.family))) / base >= 0.008)
      .map((a) => a.family);
    if (pins.length >= it.affixes.length) continue;
    if (owned(run, 'ember') < reforgeCost(pins.length)) continue;
    if (!drawReforge(run, it.uid, pins).ok) continue;
    const pending = run.pendingCraft!;
    let best: number | null = null;
    let bestScore = base;
    pending.options.forEach((o, i) => {
      const s = trial(run, slot, o);
      if (s > bestScore * 1.002) {
        best = i;
        bestScore = s;
      }
    });
    pickReforge(run, best);
    done++;
  }
  return done;
}

/** Sockets: one more on the item that hosts the gems, if the gems can use it. */
function botSockets(run: RunState): number {
  let done = 0;
  const hosts = wornSlots(run)
    .map((s) => run.build.equipment[s]!)
    .filter((it) => !it.sealed && !it.fixedSockets && it.sockets.length > 0)
    .sort((a, b) => b.sockets.length - a.sockets.length);
  const host = hosts[0];
  if (!host || host.sockets.length >= socketCeiling(host)) return 0;
  const gemsFree = run.inventory.filter((x) => x.kind === 'gem').length;
  const full = host.sockets.every(Boolean);
  if (!gemsFree && !full) return 0;
  const to = host.sockets.length + 1;
  if (owned(run, 'auger') < socketCost(host.sockets.length, to)) return 0;
  const before = scoreBuild(run, run.build);
  const t: RunState = JSON.parse(JSON.stringify(run));
  if (!useAuger(t, host.uid, to).ok) return 0;
  botRegem(t);
  if (scoreBuild(t, t.build) > before * (1 + MIN_GAIN)) {
    useAuger(run, host.uid, to);
    botRegem(run);
    done++;
  }
  return done;
}

/** Throw the die at normal junk the bot would discard anyway. */
function botDie(run: RunState): number {
  if (owned(run, 'die') <= 0) return 0;
  let done = 0;
  for (const it of junkItems(run))
    if (it.kind === 'item' && it.rarity === 'normal' && owned(run, 'die') > 0) {
      if (useDie(run, it.uid).ok) done++;
    }
  return done;
}

/** One camp visit of crafting. Returns how many crafts were made. */
export function botCraft(run: RunState): number {
  let done = 0;
  for (const id of completeTabletSets(run)) if (redeemTablets(run, id).ok) done++;
  done += botDie(run);
  // Nothing to spend (most camps early on): skip the search for a craft.
  const spendable = Object.values(run.currency).some((n) => n > 0) || run.dust >= 15;
  if (!spendable) return done;
  for (let round = 0; round < 12; round++) {
    const base = scoreBuild(run, run.build);
    const best = candidates(run, base)
      .filter((c) => c.gain >= MIN_GAIN)
      .sort((a, b) => b.gain - a.gain)[0];
    if (!best) break;
    if (!best.apply().ok) break;
    done++;
  }
  done += botSockets(run);
  done += botEmber(run);
  return done;
}

/**
 * Wayfinder's Chalk on the offered maps: edit an affix when it raises how well the build does there
 * (the threat score, with the reward as a tiebreaker).
 */
export function botChalk(run: RunState): number {
  if (owned(run, 'chalk') < 1) return 0;
  const ch = new Character(run.build, cfgFor(run));
  const mode = run.map % 10 === 0 ? 'boss' : 'clearing';
  let done = 0;
  for (let guard = 0; guard < 4 && owned(run, 'chalk') > 0; guard++) {
    let best: { gain: number; apply: () => CraftResult } | null = null;
    run.offers.forEach((o, offer) => {
      const id = o.themeId;
      const have = o.affixes;
      const cur = scoreTheme(ch, themeDef(id), mode, have).value;
      for (const opt of chalkOptions(run, offer)) {
        const v = scoreTheme(ch, themeDef(id), mode, [...have, opt]).value;
        const gain = v / cur - 1;
        if (gain > 0.02 && (!best || gain > best.gain))
          best = { gain, apply: () => chalkAdd(run, offer, opt) };
      }
      if (owned(run, 'chalk') >= 2)
        for (const old of have) {
          const v = scoreTheme(
            ch,
            themeDef(id),
            mode,
            have.filter((x) => x !== old),
          ).value;
          const gain = v / cur - 1;
          if (gain > 0.04 && (!best || gain > best.gain))
            best = { gain, apply: () => chalkRemove(run, offer, old) };
        }
    });
    const pick = best as { gain: number; apply: () => CraftResult } | null;
    if (!pick || !pick.apply().ok) break;
    done++;
  }
  return done;
}
