/**
 * A strong starting kit for some of the bot characters seeded as rivals (`npm run sim -- --rivals --strong-kit <share>`): the
 * owner asked on 2026-10-20 that a bit more than half of a new save version's bots start with very strong gear, so that the
 * pool reaches past level 20 while the rest play as a player starts. A bot that dies is a fair fight at the level it died at,
 * however it got there; one that reaches level 100 or wins is not posted (`keepRival`).
 *
 * The kit is made of the game's own rolls: rares of item level `KIT_ILVL` on the bases a level 1 character can wear, several
 * per base, of which `botEquip` keeps what the sheet likes best; the rest leave the bag. Sockets are the most the base and the
 * item level allow, so a kit weapon never loses the start's gems. Nothing here is in the game.
 */
import { Rng } from '../src/core/rng';
import { ITEM_BASES, itemBase } from '../src/data/bases';
import type { Item, ItemBase } from '../src/data/types';
import { rollItemOf, socketLimit } from '../src/gen/loot';
import { botEquip } from '../src/run/bot';
import { uidSource, type RunState } from '../src/run/run';

/** The item level the kit is rolled at: the top tiers of every affix. */
export const KIT_ILVL = 84;
/** Rares rolled for each base: the affix tiers are drawn by weight, so the best of a few is what makes the kit strong. */
export const KIT_ROLLS = 4;

/** The armour and jewellery classes the kit fills, with every base of them a level 1 character can wear. */
const KIT_CLASSES = ['body', 'helmet', 'gloves', 'boots', 'belt', 'amulet', 'ring'] as const;

/** Whether run `r` (its index among the runs of a class) gets the kit, for a share between 0 and 1: exactly that share of any run of consecutive indices. */
export function getsKit(r: number, share: number): boolean {
  return Math.floor((r + 1) * share) > Math.floor(r * share);
}

/** Whether a bot's character may be posted as a rival: one with the kit only if it died below level 100. */
export function keepRival(run: RunState, kit: boolean): boolean {
  return !kit || (run.phase === 'dead' && run.build.level < 100);
}

function rolls(rng: Rng, run: RunState, base: ItemBase): Item[] {
  const uid = uidSource(run);
  return Array.from({ length: KIT_ROLLS }, () => {
    const it = rollItemOf(rng, uid, base, KIT_ILVL, 'rare');
    it.sockets = new Array(socketLimit(base, KIT_ILVL)).fill(null);
    return it;
  });
}

/** Offer `items` to the bot, let it wear what it likes, and take the rest out of the bag again. */
function offer(run: RunState, items: Item[]): void {
  const kit = new Set(items.map((i) => i.uid));
  run.inventory.push(...items);
  botEquip(run);
  run.inventory = run.inventory.filter((i) => !kit.has(i.uid));
}

/** Give a new run the strong kit: the start's weapons (and off hand) rerolled as strong rares, then the armour and jewellery. */
export function giveStrongKit(run: RunState): void {
  const rng = new Rng(`strongKit:${run.classId}:${run.seed}`);
  const held = [run.build.equipment.mainHand, run.build.equipment.offHand].filter(
    (i): i is Item => i !== undefined,
  );
  for (const baseId of new Set(held.map((i) => i.baseId)))
    offer(run, rolls(rng, run, itemBase(baseId)));
  for (const cls of KIT_CLASSES)
    offer(
      run,
      ITEM_BASES.filter((b) => b.itemClass === cls && b.level <= 1 && !b.uniqueOnly).flatMap((b) =>
        rolls(rng, run, b),
      ),
    );
}
