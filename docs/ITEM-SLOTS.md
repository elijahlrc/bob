# Items tab: inspect, compare, swap

**Built 2026-10-27** (`src/ui/ItemDetail.tsx`, `src/ui/Items.tsx`, `src/ui/ItemList.tsx`, `src/ui/leaf/items.css`; the
side-by-side rows are `compareGroups` in `src/ui/itemDiff.ts`, the one-line gem note `socketBrief` in `src/run/socketText.ts`).
Not yet tried on a real phone. The interactive mock-up it was built from is `docs/mockups/items/inspect-compare.html`; it
uses real items, comparisons and wording taken from a test run. Every point below is the owner's decision; section 4 holds
the ones made while building.

The owner, 2026-10-27: the bag and the mannequin are not the problem on a phone. The problem is inspecting and swapping
items. So the layout stays as it is, and only what happens when you tap an item changes. The earlier version of this plan
(gear and bag side by side, a tap-to-place model like the Skills tab's, docs/GEM-SOCKETS.md) was dropped.

## 1. What stays

- On a phone, the bag runs across the whole screen with the worn gear (the mannequin) above it. On a desktop, the
  mannequin stays beside the bag.
- Search, the Filter sheet with its chips, the bag rows with their badges, Mark all seen, Clean up and both salvages.
- The mannequin's × that takes an item off, the flasks, the discarded pile (its items get "Put back in the bag"), the
  footer's Undo, and the question asked before a swap stops a skill working.

## 2. Changes

1. **The worn gear opens expanded**, and the tab opens scrolled past it to the bag. Scroll up to see the gear. The toggle
   still folds it.
2. **Tapping an item opens a full page with all its details.** It replaces the phone sheet and its peek/full switch. The page
   shows, in order:
   - the name, never cut off;
   - the base and the kind of weapon;
   - the base's main numbers, each in a box of its own (damage, attacks a second and crit, or armour, evasion and energy
     shield);
   - its requirements (in red when you can't meet them) and item level;
   - its sockets;
   - the stats its base gives (its implicit lines);
   - a divider, then the stats its affixes give.

   There are no headings. A line under the details says what wearing it would do: "▲3% EHP · ⚠ 2 gems out". It names the
   slot only when the item fits more than one ("Ring 1: ▲5% EHP"). The header has back, previous/next and the favourite
   star. The bar has **Compare** and **Discard**.
   A worn item opens the same page with **Take off**.

3. **Compare shows both items side by side.**
   - **At the top:**
     - a tab for each slot the item fits, or each flask slot, with what it would do there;
     - a thin strip with only the change to damage and effective HP, on a quiet background (the life, energy shield, mana
       and resistance figures are gone);
     - one line of sockets, before → after, counting the gems that lose their socket rather than naming them ("⚠ 3 gems
       unequipped").
   - **The two items:** each column shows the name, the base, "Requires … · ilvl", the sockets, the base stats, a divider,
     and the affix stats.
   - **Stats both items have** sit on one row, with the new value green when higher and red when lower.
   - **Stats only one has** fill the rows side by side, with no empty rows: green on the new item, red on the worn one.
   - **The bar:** **Swap into Body**, or **Wear in Ring 2** when the slot is empty. It is disabled, with the reason beside
     it, when the item can't be worn.
4. **After a swap**, the tab goes back to the bag with the gear open and scrolled into view. The slot just filled glows
   for a moment. The item taken off is at the top of the bag, and Undo puts it back.
5. **"n upgrades in the bag: show them"** sets the bag's filter to Upgrades, sorted best first, and scrolls to the bag. It
   is hidden while that filter is on. Today it opens the item the game scores highest, which looks random.
6. **A gem in the bag** opens its page with its card only. **Socket** goes to the Skills tab with the gem picked and every
   socket it can go in lit, where the player places it. The Items tab's socket picker (`SocketPicker`, docs/EQUIP.md 3.7)
   is removed.

## 3. Not in the mock-up

The game does all of these: Socket opens the Skills tab with the gem picked, Clean up opens its screen, every number
is worked out again after a swap, and a flask's base lines are set apart from its affixes'.

- Going to the Skills tab from Socket (the mock-up says where it would go).
- Clean up opens a placeholder.
- After a swap, the other bag items' numbers are not worked out again.
- A flask's base lines and affix lines are not told apart, because the data taken from the game did not separate them.

## 4. Decided while building (2026-10-27)

- **The change goes in the header.** The item page's header says what wearing it would do ("▲3% EHP · ⚠ 2 gems out"), and
  the compare's says the change to damage and EHP ("▲4% DPS · ▼1% EHP"); the strip under the compare's tabs goes.
- **Tight, with the mosaic.** The base's lines and the affixes' sit close together, and the header, the bar and the line
  between the two groups are the mosaic's row of tiles (`--s-tiles`, the camp bar's), not gold lines.
- **A desktop does not scroll as a whole.** From 1100 px wide the tab fills the camp's tab body: the gear, the item page
  and the bag are columns that line up a short way under the tabs, and only the bag's list (and a long item page) scrolls
  inside its column. A tablet keeps scrolling as before, the item page held in sight.
- **A compact bag.** The "Bag" heading goes. Wider than a phone, the bag is wider (about a third of the screen on a
  desktop), its controls are three short rows (the views; search and sort; the kinds), its housekeeping one line when it
  fits, and the upgrades button is not shown (the Upgrades view beside it has the count). Its rows are tight lines of the
  bag's panel, divided by tesserae, instead of plaques of their own (about 47 px instead of about 76 on a phone).
