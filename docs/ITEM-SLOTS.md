# Items tab: inspect, compare, swap

**Plan, 2026-10-27. Not built.** The interactive mock-up is `docs/mockups/items/inspect-compare.html`; it uses real items,
comparisons and wording taken from a test run. Every point below is the owner's decision.

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

- Going to the Skills tab from Socket (the mock-up says where it would go).
- Clean up opens a placeholder.
- After a swap, the other bag items' numbers are not worked out again.
- A flask's base lines and affix lines are not told apart, because the data taken from the game did not separate them.
