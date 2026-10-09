# Bob — Items and Workbench UX plan

Status: **proposal, 2026-10-09.** Nothing here is decided until the user answers section 7; nothing is built. Milestones
are **U0–U9**. Sibling plan: [MOBILE.md](MOBILE.md) (touch rules, the camp layout, the inventory tools P8–P9, all built).
This plan keeps those rules (every action reachable by thumb, never commit on a first tap you cannot read) and builds on them.

Code read for this plan: `src/ui/Items.tsx`, `ItemCard.tsx`, `CleanUp.tsx`, `Workbench.tsx`, `src/run/inventoryOps.ts`,
`inventory.ts`, `craft.ts`, `src/data/currency.ts`, and the item rules in `src/ui/styles.css` and `mobile.css`. Both screens
were also looked at in the dev server at 1280×720 and 375×812 with 70 test items and a full pouch (`__dev.loot`).

---

## 0. Summary

**Items.** The screen answers "what does this item do to me?" with one number pair for one slot, and then makes you work to
act on the answer. The ring complaint is exact: the compare column is built from `shownInfo.slot`, the single best slot by the
bot's score (`Items.tsx:296-305`), so a second ring is never shown and "swap" does not exist as an idea. The fix is
structural, not new maths: `slotsFor` already returns both ring slots (and both hands for a one-hander) and `compareDelta`
already takes a slot. The plan is **one model, select → see → act**: the detail panel is pinned to the selection (hover
stops stealing it), it shows **one comparison per slot the item could go into**, each with its own delta and its own
"Equip here" / "Swap with" button, and the act buttons say what will move where (including what comes back to the bag).
The toolbar's seven controls and eleven chips are regrouped; the desktop layout gets a third column so the compare is not
squeezed under the gear.

**Workbench.** The screen is a stack of boxes organised by _currency_ (one box per item the game defined), each ending in
a button with a cost in brackets. The player has to know what a Marrow Pearl or an Ember does, pick the right box, and
spend before seeing the result. The finding that organises the redesign: **`craft.ts:154-186` already has `previewAdd`,
`previewRemove`, `previewPolish` and `expectedRoll`, and only the bot (`botCraft.ts`) uses them.** The UI shows none of
them. The plan puts a **preview-then-commit** step at the centre: choose what you want to do → see the item _after_
(changed lines marked, the character's delta if it is worn, the cost) → pay. Reforging already works this way (the pick
screen) and MOBILE.md 3.2 made it the touch rule; this extends it to every craft. Actions are grouped by **intent** (change
an affix, add an affix, sockets, gamble, get rid of it), not by currency, and each one names the verb and what pays for it.

**No mechanics change.** Costs, odds, unlock maps, the craft RNG and the "crafting is final" rule (EXPANSION 8.4) stay as
they are. This plan changes presentation, ordering, wording and a few pure helper functions. Balance does not move.

---

## 1. Goals and principles

1. **See before you spend.** Every craft that has a knowable outcome shows it first. Gambles show their odds in the same
   place. Nothing is paid for on the first tap.
2. **One selection, always visible.** What you picked stays on screen until you pick something else or close it. Hover
   highlights; it never replaces.
3. **Say what will move.** Any action that displaces something (a swap, a two-hander clearing the off hand, a replaced
   flask, an affix replaced by an essence) names it before and after.
4. **Say why not.** A disabled control shows its reason in text beside it ("Needs 1 Marrow Pearl, you have 0", "Unlocks at
   map 40"), not in a `title=` attribute, which phones never show.
5. **Intent over inventory.** Group by what the player wants ("add an affix"), then show what can pay for it.
6. **Desktop and phone are one design.** The same components, two layouts; nothing is desktop-only except shortcuts
   (drag, keys), and every shortcut has a visible control.
7. **Logic is headless.** Which slots, with what delta, what a craft would do, what it costs: all in `src/run/` with unit
   tests. Components only draw it (CLAUDE.md, architecture boundaries).

---

## 2. What breaks and where

### 2.1 Items

| #   | What happens                                                                                                                                                                                                                                                             | Where                                                  | Fix (section) |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ | ------------- |
| I1  | Compare shows one "Equipped (slot)" card: the best slot by bot score. A ring, a one-hand weapon (main or off) or a shield-versus-off-hand choice is compared with only one candidate. The row badges (`▲11% EHP`) are also for that one slot, and its name is not shown. | `Items.tsx:296-305`, `inventoryOps.ts:109-126`         | 3.2           |
| I2  | **Hover replaces the selection** in the detail panel (`shown = hover ?? selected`). Moving the mouse toward the Equip button across other rows swaps the card under you. This is likely much of "annoying to manipulate" that is hard to name.                           | `Items.tsx:136-137`, `onMouseEnter` on rows            | 3.1           |
| I3  | The detail card sits **under the equipment grid** in a 380 px column. At 1280×720 the grid takes the first 270 px, the compare cards are cramped and clipped, and the buttons are below the fold. On a phone the sheet covers the list.                                  | `styles.css:494-` (`.equip-col`), `mobile.css:260-300` | 3.3, 5        |
| I4  | Equipping a worn slot says nothing about the item that goes back to the bag, or about a two-hander clearing the off hand (`equip` stashes it). After the swap the selection jumps to the slot, so the old item is lost to view in a 60-row list.                         | `inventory.ts:152-190`, `Items.tsx:146-150`            | 3.2, 3.4      |
| I5  | Unequip is double-click, or select the slot then a button in the card. A slot cell has no visible action. Equipping onto a filled slot has no "Swap" wording.                                                                                                            | `Items.tsx:227-238`, `322-343`                         | 3.1, 3.4      |
| I6  | Toolbar: Sort, reverse, Undo, Mark all seen, Pin ★, Clean up…, Salvage junk (seven controls); then 11 chips, four with counts. Undo is also in the camp bar. No text search (the Workbench has one).                                                                     | `Items.tsx:369-429`                                    | 3.5           |
| I7  | The "can't use" reason is a `title=`. A phone user sees a red tag and never learns it is 12 Int short.                                                                                                                                                                   | `Items.tsx:444`, `472`                                 | 3.2           |
| I8  | Discard (red, no Dust, undoable) and Salvage (Dust, final) are different verbs on different screens. The Items card offers only Discard, and the red button invites losing Dust.                                                                                         | `Items.tsx:352-356`, `Workbench.tsx:506-516`           | 3.4           |
| I9  | Flasks: no compare with the flask they would replace (`compareDelta` returns null for non-items). Quick-equip picks a flask to replace by a rule the player is never told.                                                                                               | `ItemCard.tsx:37`, `inventoryOps.ts:241-260`           | 3.2           |
| I10 | A row shows name, slot, ilvl and two badges. For a rare it shows nothing of what it has, so judging a list means selecting each row.                                                                                                                                     | `Items.tsx:432-476`                                    | 3.5           |
| I11 | Capacity (`48/60`) is small grey text in the filter strip. `confirm()` is the confirmation for Discard-a-favourite, Salvage junk and Clean up: a native dialog, awkward on a phone and invisible to the preview tools.                                                   | `Items.tsx:164,174`, `CleanUp.tsx:52`                  | 3.6           |
| I12 | Phone: the gear grid (10 slots at 2 columns + 5 flasks) is 1.7 screens tall; the list starts below it. The two Undo buttons sit one above the other.                                                                                                                     | `mobile.css:215-230` (seen at 375×812)                 | 5.1           |

### 2.2 Workbench

| #   | What happens                                                                                                                                                                                                                                                                                                          | Where                                                        | Fix (section) |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------- |
| W1  | **No preview anywhere.** Every button spends and then shows the result. The preview helpers exist and only the bot uses them.                                                                                                                                                                                         | `craft.ts:154-186` (used by `botCraft.ts` only)              | 4.3           |
| W2  | Organised by currency: boxes for Reforging Ember, Add an affix, Essence, Sockets, "Gambles and the rest". The player must already know the verb behind each name (Ember, Pearl, Thread, Whetstone, Auger, Die, Seal) and that a "Bench" button is a second way to do the same thing for Dust.                         | `Workbench.tsx:349-517`                                      | 4.2           |
| W3  | Each affix line carries a pin checkbox and three buttons (Remove, Polish, Bench remove). Four affixes make twelve buttons; the pin only matters for the Reforge box far below; Remove and Bench remove do the same thing with different payments.                                                                     | `Workbench.tsx:288-342`                                      | 4.4           |
| W4  | Disabled buttons look almost the same as enabled ones and say why only in `title=`. Locked bench recipes (`Attack speed (30)`, `Cast speed (30)`) show a price and no "unlocks at map 40".                                                                                                                            | `Workbench.tsx:276-280`, `390-402`                           | 1.4, 4.5      |
| W5  | Essence is a three-select cascade (essence, affix, "replace what") that ends in an unlabeled **Use**. "Replace" appears whether or not the item has a free slot.                                                                                                                                                      | `Workbench.tsx:406-460`                                      | 4.6           |
| W6  | The item card at the top and the affix list below say the same thing twice, and nothing shows the **tier** of an affix or where its value sits in the tier's range, which is the information Polish and Reforge depend on. Affix-slot room (prefixes 2/3, suffixes 1/3) is never shown but decides what Pearl can do. | `Workbench.tsx:284-288`; `AffixRoll.tier` and `Family.tiers` | 4.4           |
| W7  | The reforge pick screen is a block pushed in **above** the page, moving everything down. If you change tab, nothing on the tab says a pick is waiting. The "Embers are spent either way" note is a line of prose.                                                                                                     | `Workbench.tsx:168-192`; `run.pendingCraft`                  | 4.7           |
| W8  | After a craft nothing says what happened. The card just changes. There is no log of what you did to this item.                                                                                                                                                                                                        | `Workbench.tsx:118-122`                                      | 4.8           |
| W9  | Choosing an item and finding the item are separate trips: the Items screen has no "Craft" action, and on a phone the list is above the panel with a `scrollIntoView` timeout to bridge them.                                                                                                                          | `Workbench.tsx:130-139`                                      | 4.1, 5.2      |
| W10 | Seal and Clean up use `confirm()`. Seal's confirmation does not show its odds (they are in the currency text only).                                                                                                                                                                                                   | `Workbench.tsx:503`                                          | 3.6, 4.5      |
| W11 | The pouch is a row of small chips whose only explanation is a tooltip. A first-time player has no guide to the eight kinds of currency, the faction essences, or the Bench.                                                                                                                                           | `Workbench.tsx:143-165`, `currency.ts`                       | 4.9           |

### 2.3 What the code already gives us

- `slotsFor(item)` (both rings, both hands for a one-hander), `compareDelta(build, item, cfg, slot)`, `canEquip` with a
  reason string, `equip` (stashes what it displaces), `diffSheets`.
- `previewAdd`, `previewRemove`, `previewPolish`, `expectedRoll`, `addableFamilies`, `reforgeCost`, `socketCost`,
  `benchSocketCost`, `salvageValue`, `locate`. Craft is deterministic (`craftRng` forks `seed + craftSeq`), so a preview
  can promise "the tier and value are rolled" honestly and a reload cannot re-roll.
- The tiers of a family are numbered upward (`tier: i + 1`, higher is stronger and rarer), so "tier 3 of 8" is available
  without new data.
- `c.act` (undoable) and `c.craft` (final, clears undo): the line between the two screens is already the line between
  "reversible" and "final", and the UI should say so.

---

## 3. Items design

### 3.1 One model: select → see → act

- **Selecting** is a click or tap on a row, a slot, or a flask, or an arrow key. The detail panel is **pinned** to the
  selection. **Hover never changes the panel**: on desktop it only **outlines the slots** the hovered row could go into
  and shows its delta chips (it already does the first). `Esc` clears the selection.
- A slot cell is a real control: click selects what is worn; a small **×** appears on a worn slot (always visible on touch)
  and unequips it; the cell shows the item's rarity colour and a one-line summary.
- **Desktop shortcut: drag a row onto a slot to equip, a slot onto the list to unequip.** Skills already does drag for
  gems; this makes the two screens agree. It is a shortcut: the tap path stays complete (principle 6; MOBILE.md 3.5).
- The keys stay (↑/↓, Enter, F, Del, U, Ctrl+Z) and are listed in one collapsible "Keys" line, not in a footer that is
  always on.

### 3.2 The detail panel: compare per slot

For an item that can be worn the panel shows a header, then **one block per candidate slot**, then the actions.

```
 Gale Shell  (rare)             ★   ×                 ← header: name, favourite, close
 Threadbare Vestment · ilvl 26 · Requires 10 Int ✓

 ┌─ New ──────────────┐   ┌─ Ring 1 · Inked Rime Ring ─┐   ┌─ Ring 2 · empty ──┐
 │ (item card)        │   │ (item card, differences    │   │ Empty slot        │
 │                    │   │  marked ▲ ▼)               │   │                   │
 └────────────────────┘   │ ▲ 21 energy shield  ▲ 10%  │   │ ▲ 34% DPS ▲ 12%  │
                          │   fire res   ▼ 7% DPS      │   │   effective HP   │
                          │ [Swap with Ring 1]         │   │ [Equip → Ring 2] │
                          └────────────────────────────┘   └───────────────────┘
 Also moves: nothing.                                      ★ Favourite   Salvage ▾   Craft…
```

- **Candidates** come from a new pure function `compareSlots(run, uid): SlotCompare[]` in `inventoryOps.ts`, one entry per
  `slotsFor(item)` slot: `{ slot, equipped?: Item, check: EquipCheck, delta: SheetDiff, dpsPct, ehpPct, scorePct,
alsoMoves: Item[] }`. `itemInfos` keeps its single `slot` (the best one, used for the sort and the row badge) and gains
  `slots: SlotCompare-lite[]` only where the list needs it (the row's "best: Ring 2").
- **Which slots this covers:** rings (two), one-hand weapons (main hand or off hand), shields and quivers (off hand,
  where a two-hander's presence matters), and flasks (five slots, compared with what they would replace).
- **`alsoMoves`** is what `equip` will stash: the displaced item, and for a two-hander the off hand it clears (and the
  quiver rule). It is computed by a **dry run of the real `equip`** on a clone, so the preview cannot drift from the rule.
- The default selected candidate is the best by score; the others are one tap away. On a phone the candidate blocks are
  a segmented control (**Ring 1 | Ring 2**) above a single equipped card (section 5.1).
- **Differences, not only deltas.** In the equipped card, lines that are lost are marked ▼ and lines the new item gains are
  marked ▲ in the new card; the green/red text list of totals stays, tightened into a compact table (DPS, Life, ES, Mana,
  four resistances, effective HP). The resistance rows say when a cap or a zero is crossed ("fire res 75 → 80, capped").
- **Why not.** When `check.ok` is false, the block shows the reason in a line of text with the shortfall ("Needs 40 Int, you
  have 28"). A "can't use" row does the same when selected, so the reason is visible without a tooltip (I7).
- **Flasks** compare against the flask the quick-equip rule would replace, and say so ("replaces Cracked Life Draught,
  the lowest-level life flask"), with a choice of the other four flasks.

### 3.3 Desktop layout

At ≥ 1100 px, three columns:

```
┌ Gear ───────────────┐ ┌ Selected: compare + actions ───────────┐ ┌ Bag  (48/60 ▮▮▮▮▯) ─────────────┐
│       Helmet        │ │  (3.2)                                  │ │ [search…]  Sort ▾   Tidy ▾      │
│ Main  Amulet  Off   │ │                                         │ │ All Weapons Armour Jewel Flask… │
│ Ring  Body    Ring  │ │                                         │ │ New·Upgrades·Last map·★         │
│ Gloves Belt  Boots  │ │                                         │ │ ☆ NEW Gale Shell  Body ▲4% EHP  │
│ Flasks ▯▯▯▯▯        │ │                                         │ │ ☆ Willow Twig 1h ▲35% DPS       │
└─────────────────────┘ └─────────────────────────────────────────┘ └──────────────────────────────────┘
```

- **Gear** is arranged by body position (helmet top, hands either side of the body, rings either side of the amulet, flasks
  as a row of bottles using the same bottle drawing as the HUD and the Arriving gauge), not a two-column list of ten equal
  boxes. A worn slot shows its item name in rarity colour; an empty slot shows its label dimmed. (Decision D7.)
- **The middle column is the pinned detail.** When nothing is selected it shows a short guide (what to click, the keys), the
  character's main numbers, and "n upgrades waiting" with a button that selects the best one.
- **Between 960 and 1100 px** the gear and detail share a column as today, with the detail first. **Below 960 px** it is the
  tablet/phone layout of section 5.

### 3.4 Actions: say what, say where

- The primary button reads the outcome: **Equip → Ring 2**, **Swap with Ring 1**, **Equip (also moves Pale Stock to the
  bag)**. After it, a status line (not a warning box) says what happened with an **Undo** link: "Equipped Gale Shell. Dented
  Plate went to the bag." The selection moves to the **displaced item in the bag**, because the next question is usually
  "was that old one worth keeping?", and the old gear is easy to lose in a 60-row list.
- **Unequip** is a visible button in the worn item's panel and the **×** on the slot.
- **Favourite** stays in the header (a 44 px target on touch).
- **Getting rid of an item** is one menu, **Salvage ▾**, with the two real verbs spelled out: **Salvage for 8 Bone Dust
  (final)** and **Discard (undoable, no Dust)**. Salvage from this screen is new (it exists in the Workbench and in bulk);
  it uses `salvage`, `c.craft`, and the same confirmation as everything else (3.6). A favourite asks first, as now.
- **Craft…** opens the Workbench with this item selected (4.1). It is absent for gems and for sealed items.
- Gems stay a Skills-screen job (see section 8); the Items panel keeps its "Socket (best free socket)" shortcut.

### 3.5 The list and the toolbar

- **Row (two lines, as today on a phone, on desktop too):** star · NEW · name · ilvl, then "Body · best for: Ring 2" ·
  the DPS and EHP badges · and, for rares, the **two or three strongest affix names** in a dim line ("life, fire res,
  attack speed"; an `affixSummary(item)` in `inventoryOps.ts`). A density switch (compact / detailed) lives in the Tidy
  menu; the default is detailed on desktop, compact on a phone.
- **Search** box (name, base, an affix's words), same component the Workbench uses.
- **Filters in two rows, not one:** _what_ (All · Weapons · Armour · Jewellery · Flasks · Gems) and _view_ (New · Upgrades ·
  Last map · ★). The two combine (today "New" and "Weapons" are exclusive). Counts stay on the views. `Usable` goes (its job is
  done by the dimmed "can't use" rows and `Upgrades`); this is a decision (D5).
- **One Sort control:** a dropdown plus an arrow for the direction (today it is a select and a "⇅ default" button whose
  label does not say which way "default" is).
- **Tidy ▾** gathers the housekeeping: Mark all seen, Pin ★ (a checkbox inside it), Clean up…, Salvage junk (n), density.
  **Undo leaves the toolbar** (the camp bar has it, on desktop too), which removes the duplicate.
- **Capacity** becomes a small bar next to the title of the bag, amber from 90%. (What happens when it is full is the
  existing rule; the plan only shows it.)

### 3.6 One confirmation, not `confirm()`

A shared `ConfirmSheet` (modal on desktop, bottom sheet on phone) replaces the five `window.confirm` calls
(`Items.tsx:164`, `:174`, `Workbench.tsx:503`, `CleanUp.tsx:52`). It takes a title, the consequence in a sentence, optional
numbered facts ("8 items · 41 Bone Dust · 3 rare"), and a danger-styled confirm button. It matters on a phone, where the
native dialog is ugly and some browsers suppress repeated ones, and it lets Seal show its odds.

---

## 4. Workbench design

### 4.1 The flow: item → intent → preview → apply

```
 1. Choose an item        2. Choose what to do        3. See the result        4. Pay
 (picker, or "Craft…"     (grouped by intent;          (before / after,         (one button that
  from the Items screen)   costs and reasons shown)     delta, odds)             names the cost)
```

- The item picker stays a list with search, and gains the Items screen's rarity colours, a "worn / bag" split, ★, and a
  one-word state ("sealed", "full" when no affix slot is free). It is the **same row component** as the bag's compact row.
- **Cross-link:** the Items panel has **Craft…** and the Workbench panel has **Show in Items**. The camp holds one shared
  `focus: { tab, uid }` so either lands on the right item. This removes the `scrollIntoView` hack for phones (W9).
- **The item stays on screen while you work**: on desktop it is a sticky left/top block; on a phone it is a collapsible
  header ("Sorrow Edge · rare · 4 affixes · 3 sockets ▾") that expands to the card. It shows the **slot room** as chips:
  `Prefixes 2/3 · Suffixes 2/3 · Sockets 3/3`, because that is what decides which crafts can do anything.

### 4.2 Actions grouped by intent

```
 CHANGE AN AFFIX      Remove one            Thread ×3  |  Bench 25 Dust
 (pick one in the     Raise to its max      Whetstone ×2   (2 per item, 0 used)
  list above)         Reroll the rest       Reforging Ember ×6  (1, +1 for each pinned)
 ADD AN AFFIX         Choose the affix      Marrow Pearl ×2  |  Bench 15–40 Dust  |  Essence ×…
 SOCKETS              Set to N              Socket Auger ×4 (1, 2, 3 for the 4th–6th)  |  Bench 40–300 Dust
 GAMBLE               Throw the Die         normal → magic 60% · rare 30% · unique 10%
                      Seal for good         25% each: implicit · sockets · new rare · nothing
 GET RID OF IT        Salvage               8 Bone Dust (final)
```

- Each row has: the **verb** ("Remove an affix"), a **one-line effect**, and the **ways to pay**, each as its own button
  with the owned count ("Marrow Pearl · have 2") and, when it cannot be used, the reason in text beside it.
- The **currency names stay** (they are ours and in saves and tests). A grey subtitle with the verb sits under the name
  wherever the name appears alone (the pouch, the picker of a cost): "Marrow Pearl — adds an affix" (D6).
- **Bench and currency are two payments for one verb**, not two features. A row such as "Add Maximum life" lists
  "Marrow Pearl (have 2)" and "Bench, 20 Bone Dust (have 340, mid-low tier)". Today they are a select, a button and a row
  of recipe buttons in one box.
- A row collapses when it cannot apply at all (a normal item has no "Reroll the rest"; a sealed item shows one line,
  "Sealed: nothing can change it"), with the reason, so the screen gets shorter rather than more greyed-out.
- Phone: the groups are an accordion (one open at a time); the first group with something usable is open.

### 4.3 The preview: the spine

A **result panel** (right column on desktop, a bottom sheet above the camp bar on a phone) appears as soon as an action row
is chosen and the target is complete. It always has the same shape:

```
 Remove: +10% Critical Strike Multiplier         with an Unravelling Thread (have 3 → 2)
 ┌─ Now ──────────────┐   ┌─ After ─────────────────────────┐   Worn: ▼ 4% DPS  ▲ 0 life ...
 │ …lines…            │   │ …lines… (removed line struck)    │   (character delta, worn items only)
 └────────────────────┘   └──────────────────────────────────┘
 Final: crafting cannot be undone.                      [ Remove — spend 1 Thread ]   [ Cancel ]
```

- **Deterministic outcomes** (remove, polish, bench add at its fixed mid-low tier, socket count): the exact "After".
- **Rolled outcomes** (Pearl, essence, Reforging draws): "After" shows the **typical** result from `expectedRoll`, the
  **range of values and tiers** this item level allows ("tier 2–5 · +18 to +44 life"), and the sentence "the tier and
  value are rolled when you apply". New pure helper `rollRange(family, ilvl)` in `craft.ts` returns the min and max of
  the eligible tiers and the weights, so the range shown is the range that can happen.
- **Gambles** show the odds as the preview: the Die lists "magic 60% · rare 30% · unique of this base 10% (n possible)";
  the Seal lists its four outcomes. Both then go through the `ConfirmSheet` (3.6), whose body repeats the odds and says "final".
- **Worn items** add the character delta (`diffFor`, already written for the reforge screen), so "this affix is worth 4%
  of your DPS" is visible before it is removed.
- The preview is built by pure functions that return an `Item` and a `cost` (`planCraft(run, action): { after, cost, rolled,
range?, reason? }` in a new `src/run/craftPlan.ts`), so the same code can drive the UI tests and, later, the bot. It
  calls the real `craft.ts` helpers and never duplicates a rule; a test asserts that for every deterministic action
  `planCraft(...).after` equals the item `craft.ts` produces on a clone of the run.

### 4.4 The affix list: one place, three modes

- Each affix line shows: **prefix/suffix**, the mod text, **tier ("tier 3 of 8")**, and a **roll bar** showing where the
  value sits in the tier's range (full = at the maximum, which is what Polish does), plus tags _bench_ and _polished_.
  New pure `affixInfo(item, roll)` in `craft.ts` gives `{ type, tier, tiers, lo, hi, at, polished, bench }`.
  (Show the tier only after D4 is answered.)
- **Mode 1, view (default):** lines are read-only. Selecting a line selects it for the actions in the "Change an affix"
  group, whose rows now say "Remove **this**", "Raise **this** to its maximum".
- **Mode 2, Reforge:** choosing "Reroll the rest" turns the lines into **pin toggles** with a running cost: "Pinned 2 of 4
  → 3 Embers". The pin checkboxes disappear from the other modes (W3). The three result alternatives open in the result
  panel with the differences against the original marked (4.7).
- The item card above the list is **not repeated**: on desktop the card is the sticky block and the list is the
  interactive form of the same affixes; on a phone the collapsed header replaces the card until expanded.

### 4.5 Costs, reasons and locks, in words

- A **cost line** is always `N Name (have M)` and goes amber when `have < N`.
- A button that cannot be used is dim **and** has a reason next to it. The reasons already exist as strings in `craft.ts`
  (`fail('A sealed item can never be changed')`, `Unlocks at map 40`, `An item can hold two polished affixes`); a new
  `whyNot(run, action)` in `craftPlan.ts` returns the same strings without spending anything, so the text the UI shows is
  the text the craft would have failed with.
- **Locked bench recipes** show "Unlocks at map 40" under the price instead of a disabled button.
- **Rot Seal and Knucklebone Die** keep their danger styling and add the odds line.

### 4.6 Essences

The cascade of three selects is replaced by a list of what the chosen essence offers:

```
 Essence · Ember Ash ×2   (from the Emberborn)
 ▸ Fire resistance            free prefix? no · free suffix? yes          [ Add ]
 ▸ Added fire damage          needs a prefix slot (3/3)  → replace: [ Thick Hide  ▾ ]   [ Replace and add ]
 ▸ Chance to ignite           free suffix                                 [ Add ]
```

- Each option states whether the item has room. The "replace" picker appears only on a row with no free slot of that kind,
  and lists only affixes of the same kind (as `useEssence` requires), with the lost line shown struck in the result panel.
- An essence the player does not have is not listed, as now; the pouch says where each kind comes from (4.9).

### 4.7 Reforging results

- The pick screen opens as the result panel (a bottom sheet on a phone), **not** above the page, so the page does not jump.
- The original and the three alternatives are shown with **differences against the original marked** (kept lines dim,
  changed lines highlighted), the worn-item delta on each, and **Keep the original** as an equal option with the wording
  "the Embers are spent either way" at the top of the sheet, once.
- While a result is waiting, the Workbench tab carries a badge ("Workbench ●"), the Items screen shows a one-line notice,
  and the camp bar's **Next map** asks first ("A reforge is waiting for you to pick"). (`run.pendingCraft` persists;
  today starting a map with one open is possible. Confirm that behaviour in U0 before changing it.)

### 4.8 What just happened

- After an apply, the changed lines on the item flash for about two seconds, and a **status line** names the result and
  the cost: "Added +34 to maximum life (tier 4) · 1 Marrow Pearl spent."
- A short **log of the last five crafts on this item** sits under the item. It is session state in the camp view, not in
  the save. Crafting stays final; the log is there so the player can tell what they did.

### 4.9 Teaching the screen

- **A first-time banner** (dismissible, remembered in prefs): "Pick an item. Pick what to do to it. You see the result
  before you pay." One line, three steps; nothing else.
- **The pouch** becomes a labelled tray: each currency has its icon-less chip, its count, and a verb subtitle; tapping one
  opens a small card with the full text, where it drops from (faction essences name their faction), and **"Use on <item>"**
  which jumps to the matching action row for the selected item. A **currency guide** (a `?` in the tray) lists all of
  them with verb, cost, minimum map and source in one scrollable sheet.
- **Tablets** (the epitaph sets) keep their place in the tray, with progress "3 of 4" and the Redeem button next to it.

---

## 5. Phone and tablet

Both screens follow MOBILE.md's rules (portrait first, 44 px targets, 14 px text floor, the camp bar stays). The phone
layouts below replace the stacked grid and the half-screen sheet.

### 5.1 Items on a phone

```
 ┌ Items ───────────────── 48/60 ▮▮▮▯ ┐
 │ Gear  ▸ (collapsed to one line:     │   ← "Gear · 6 of 10 · Flasks 2/5"  tap to expand
 │          Main Oak Maul · Body …)    │
 │ [search…]       Sort ▾    Tidy ▾    │
 │ All Weapons Armour Jewel Flask Gem… │   ← one scrolling chip row; second row: New · Upgrades · Last map · ★
 │ ☆ Gale Shell  i26         Body      │
 │   ▲4% EHP · life, fire res          │
 │ …                                   │
 ├─────────────────────────────────────┤  ← selecting a row raises the sheet (below)
 │ Vanguard · Level 30     Undo  Next ▸│
 └─────────────────────────────────────┘
```

- **Gear is collapsed by default** to a one-line summary that expands in place; the list starts on the first screen
  (I12). Tapping an empty or filled slot while an item is selected is the equip path, as today.
- **The sheet** for a selected item is **half height with a drag handle**: collapsed it shows the header, the primary button
  and the candidate control (**Ring 1 | Ring 2**); expanded it is the full card and comparison. The list remains visible
  and scrolls under it, and **swiping the sheet left or right moves to the next or previous row** (and the Prev/Next
  buttons do the same), so the player can run down a list without closing and reopening it.
- The sheet's action buttons keep the sticky bottom row of today (`mobile.css`, 600 px rule).
- Gear slot cells carry the **×** (always visible on touch) and a 44 px target.

### 5.2 Workbench on a phone

```
 ┌ Workbench ───────────────── ?  ┐
 │ Bone Dust 340                  │
 │ [Ember 6][Pearl 2][Thread 3] → │   ← tray scrolls sideways; tap = card + "Use on item"
 │ ┌ Sorrow Edge · rare   ▾ ┐ Change │  ← the item header; "Change" opens the picker sheet
 │ │ Prefix 2/3 · Suffix 2/3 │      │
 │ Affixes  (tap one to select)     │
 │  ▸ +14 Dexterity   tier 3/8 ▮▮▮▯ │
 │  ▸ …                             │
 │ ▾ Change an affix                │   ← accordion
 │    Remove  · Thread (have 3) …   │
 │ ▸ Add an affix                   │
 │ ▸ Sockets · ▸ Gamble · ▸ Salvage │
 ├────────────────────────────────┤
 │ Result sheet (when an action is chosen): Now / After + [Apply — 1 Thread] │
 ├────────────────────────────────┤
 │ Vanguard · Level 30  Undo Next ▸│
 └────────────────────────────────┘
```

- The **picker is a sheet** (search, Worn / Bag, rarity chips); the page itself shows only the chosen item. This replaces
  the list-above-panel stack and its scroll hack.
- The **result sheet** sits above the camp bar and carries the Apply button, so a thumb never has to scroll to commit.
- The **roll slider** for sockets becomes a stepper (− 3 +) with the cost under it; a 44 px range input is awkward and
  has no value labels on small screens.

### 5.3 Tablet

768–1024 px uses the desktop layouts with two columns: Items shows the gear collapsed above the list on the left and the
detail on the right; the Workbench shows the item and actions on the left and the result panel on the right.

---

## 6. Milestones

Each milestone ends with `npm run check` and `npm run build` green, a commit, desktop (1280×720) and phone (375×812)
screenshots of the screens it touched in `docs/screenshots/items/`, and `read_console_messages` clean. Logic lands first,
with unit tests; components follow. All use `__dev.loot` plus a new `__dev.bench()` (U0) that sets a mid-game pouch and a
mixed bag, so every check starts from the same state.

| #      | Name                         | Scope                                                                                                                                                                                                                                                                                                                                                                                                                                             | Done when                                                                                                                                                                                                                                              |
| ------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **U0** | Baseline and harness         | `__dev.bench()`; baseline screenshots of both screens at both sizes (selected ring, a rare in the Workbench, a pending reforge); a one-line finding per row of 2.1 and 2.2 confirmed or struck by the user; confirm what starting a map with a pending reforge does; add a CLAUDE.md pointer line to this plan and a PROGRESS entry.                                                                                                              | Every defect in section 2 has a picture or a code line and a keep/strike mark. The pending-reforge behaviour is written down. Screens are unchanged.                                                                                                   |
| **U1** | Compare logic                | `run/inventoryOps.ts`: `compareSlots` (per-slot delta, reason, `alsoMoves` by dry-running `equip` on a clone), `affixSummary`, flask comparison; `itemInfos` exposes the best slot's label. Tests: two rings, a one-hander with and without an off hand, a two-hander over a shield, a quiver with a bow, a flask replacing the lowest of its kind, an unusable item with a shortfall reason, and that the best entry equals today's `info.slot`. | `compareSlots` returns one entry per slot for each of those cases and its `alsoMoves` matches what `equip` really stashes (property test over a random bag). `npm run sim` is unchanged (nothing in the bot's path moved).                             |
| **U2** | Items: detail and layout     | Shared components `ItemRow`, `SlotCell`, `CompareBlock`, `StatDelta`, `StatusLine`; pinned selection (hover only outlines slots); per-slot compare with "Equip here / Swap with"; the three-column desktop layout and the paper-doll gear; status line with Undo; selection moves to the displaced item; `Salvage ▾`/Discard wording; one `items.css` replacing the three layered `.items` and `.equip-col` rules in `styles.css`.                | On desktop, selecting a ring with one ring worn shows both ring comparisons, each with its own button; moving the mouse across rows does not change the panel; equipping from a filled slot says what went to the bag and Undo restores it.            |
| **U3** | Items: list and toolbar      | Search, two-row combinable filters, one sort control, the Tidy menu, two-line rows with the affix summary, capacity bar, drag-to-equip and drag-to-unequip on desktop, `ConfirmSheet` replacing every `confirm()` in Items and Clean up.                                                                                                                                                                                                          | The toolbar has at most five controls. "Weapons" and "New" can be on together. A row of a rare shows its strongest affixes. Dragging a ring row onto Ring 2 equips it there; Esc cancels. No `window.confirm` is left in `src/ui`.                     |
| **U4** | Craft logic                  | New `run/craftPlan.ts`: `planCraft`, `whyNot`; in `craft.ts`: `rollRange`, `affixInfo`. Tests: for every deterministic action `planCraft(...).after` deep-equals what the real craft produces on a clone; `whyNot` returns the same text as the failure of the real call; ranges contain every value 500 seeded rolls produce; essence replace rules.                                                                                             | The plan, cost and reason of every craft in section 4.2 can be asked for without spending anything, and the tests prove they match the real result.                                                                                                    |
| **U5** | Workbench: structure         | Intent groups, ways-to-pay rows with counts and reasons, item header with slot-room chips, single-select affix list with tier and roll bar (after D4), Reforge as a pin mode, essence list, locked recipes in words, cross-links (Craft… / Show in Items) with the shared `focus`.                                                                                                                                                                | Every action in 2.2 is reachable from its intent group; no disabled control lacks a visible reason; adding a Maximum life affix to a rare shows all three ways to pay it in one row; the three-select essence cascade is gone.                         |
| **U6** | Workbench: preview and apply | The result panel with Now / After / worn delta / odds, Apply and Cancel; `ConfirmSheet` for Die and Seal showing their odds; reforge results as marked differences in the same panel; status line, flash and the five-entry log; the Workbench tab badge and the Next-map guard for a waiting reforge.                                                                                                                                            | No craft spends before an After is on screen. A Pearl on a worn rare shows a typical result, the possible range and the character delta before Apply. A pending reforge survives a tab change and is visible from the camp bar.                        |
| **U7** | Teaching                     | First-time banner, labelled pouch tray with verb subtitles and "Use on <item>", the currency guide sheet, tablets with progress.                                                                                                                                                                                                                                                                                                                  | A new run's Workbench says what to do in one line; the guide lists all currencies with verb, cost, minimum map and source; the banner stays dismissed after a reload.                                                                                  |
| **U8** | Phone and tablet pass        | Gear collapse, half-height item sheet with handle and swipe to the next row, segmented candidate control, Workbench picker sheet, accordion groups, result sheet above the camp bar, steppers instead of sliders, 768–1024 two-column layouts, 44 px targets and 14 px floors for every new control.                                                                                                                                              | At 375×812, from a cold start: select the second of two rings, read both comparisons, swap, undo, open the Workbench with Craft…, add an affix and pick a reforge result, all without horizontal scroll and without scrolling the page to reach Apply. |
| **U9** | Wrap-up                      | Docs: `docs/PROGRESS.md`, DESIGN.md Appendix A entries for the decisions in section 7, CLAUDE.md status line; clean up dead CSS and the `Workbench` props pile (`WorkProps` has 17 fields: it becomes a small reducer); a real-device pass noted for MOBILE.md section 9.                                                                                                                                                                         | Appendix A records each decision with a reason; no unused selector from the old layouts remains (checked by a script that lists `.class` names not found in `src/ui/*.tsx`).                                                                           |

### Order and dependencies

U0 → U1 → U2 → U3 gives a finished Items screen that can ship alone. U4 can start in parallel with U2 (different files).
U5 needs U4 and the shared components of U2 (`ItemRow`, `ConfirmSheet` arrives in U3). U6 needs U5. U8 needs both screens
done; the phone details of U2–U7 are built with the responsive rules in from the start, so U8 is a pass, not a rewrite.

---

## 7. Decisions for the user

Each has a default that the plan assumes; say "agreed" and the defaults stand.

| #      | Question                                                                                                                                                                                                                                 | Default                                                                                                  |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **D1** | Hover over a row today previews its card in the panel. Replace that with a pinned panel (hover only outlines target slots), or keep a peek-while-nothing-is-selected?                                                                    | **Pinned only.** Peek is what makes the buttons move under the pointer.                                  |
| **D2** | Add drag-and-drop to equip and unequip on desktop (as the Skills screen does for gems)?                                                                                                                                                  | **Yes**, as a shortcut; taps remain complete.                                                            |
| **D3** | Getting rid of an item: one **Salvage ▾** menu with both verbs spelled out, or keep a bare Discard?                                                                                                                                      | **The menu**, Salvage first (Dust), Discard second (undoable, no Dust).                                  |
| **D4** | Show an affix's **tier and where its roll sits in the tier's range**? It is the data Polish and Reforge depend on, but it shows internals the game has so far hidden.                                                                    | **Show it**, in the Workbench only; the Items card keeps plain lines.                                    |
| **D5** | Merge the "Usable" filter away, and make "what" and "view" filters combine?                                                                                                                                                              | **Yes.**                                                                                                 |
| **D6** | Currency names: keep them and add a verb subtitle ("Marrow Pearl — adds an affix"), or rename them to plain verbs (names are ours; a rename touches saves, `src/data/ip.test.ts`, docs and the bot reports)?                             | **Keep and subtitle.**                                                                                   |
| **D7** | Gear drawn as a body-shaped arrangement (helmet on top, hands either side of the body…), or keep a plain grid of ten boxes with better cells?                                                                                            | **Body-shaped.** The grid is the weakest part to read at a glance. Easy to swap back, it is only layout. |
| **D8** | Crafting stays final (no undo), per EXPANSION 8.4. With previews that is easier to defend. Do you want an optional "undo the last craft" for the current camp visit anyway (it would need the craft RNG and pouch in the undo snapshot)? | **No.** Previews and the log are the answer; revisit after U6 if players still regret crafts.            |

---

## 8. Not in this plan

- **Skills and gem sockets** (`Skills.tsx`): the socket screen, its drag-and-drop, the gem card sheet and the primary-skill
  buttons are MOBILE.md P5's. The Items panel keeps its "Socket (best free socket)" shortcut only.
- **Mechanics and balance**: costs, odds, unlock maps, drop rates, the craft RNG, salvage values and the inventory size do
  not change. If the previews reveal a cost that feels wrong, that goes in `docs/PROGRESS.md` as a finding, not into this plan.
- **New crafting verbs** (a new currency, a new bench recipe).
- **The Reward screen** and the map-offer Chalk (the Chalk box in the Next map tab has the same "no preview, no reason"
  problems and could reuse `ConfirmSheet` and the result panel later).
- **Art**: no icons are drawn for currencies in this plan (names, counts and verbs only); the flask bottle drawing is reused.
- **Other gestures** (long-press menus, multi-select, bulk move). Clean up and Salvage junk remain the bulk tools.

---

## 9. Risks

| Risk                                                                                                                                                      | Mitigation                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `itemInfos` is the hot path (it scores every bag item against the build, memoised per build). Adding per-slot comparison for every row would multiply it. | Per-slot detail is computed **only for the selected item** (`compareSlots`); the list keeps one best slot per row. Measure with the 300-item fixture MOBILE.md P9 used. |
| A preview that drifts from the real craft is worse than none.                                                                                             | `planCraft` calls the `craft.ts` helpers and a test compares its result to the real craft on a clone for every deterministic action (U4).                               |
| Other agents edit `Items.tsx`, `Workbench.tsx` and `styles.css` concurrently.                                                                             | U2 and U5 start by announcing the files; new CSS goes to a new `items.css` and new components to new files, so the existing files shrink instead of growing diffs.      |
| `styles.css` has three layered rewrites of `.items` and `.equip-col`, plus overrides in `mobile.css`; removing one can break the phone layout.            | U2 moves them together into `items.css` with screenshots at four sizes before and after; dead selectors are listed by a script, not guessed.                            |
| Drag and drop on desktop conflicts with text selection and with the row's click.                                                                          | Pointer-events with a 6 px threshold, as the tree does; a click that moves less than that still selects.                                                                |
| A half-height sheet with swipe fights the page scroll on iOS.                                                                                             | Swipe only on the sheet's header strip; Prev/Next buttons always present; test on a real device in U9 (MOBILE.md section 9).                                            |
| Showing tiers and roll positions exposes internals and may invite min-maxing that the economy was not tuned for.                                          | It is D4; ship it behind the user's answer, Workbench only.                                                                                                             |
| Forgetting a craft rule in the preview when a new currency is added.                                                                                      | `planCraft` has one exhaustive `switch` over the action kinds; a new currency fails the type check until it has a plan and a reason.                                    |

---

## 10. Testing

- **Unit (headless, `src/run`)**: U1 and U4 tests listed above; the seeded fixture (a 100-map run bag) from `found.test.ts`
  is reused for the compare logic.
- **Component-free helpers** keep the UI thin enough that the browser checks are about layout and flow, not rules.
- **Browser (the in-app preview)**: for each milestone, `preview_start`, `__dev.bench()`, then the "Done when" sentence as a
  script of clicks with `read_page` for structure and screenshots at 1280×720, 768×1024 and 375×812; `read_console_messages`
  for errors. `resize_window` back to desktop afterwards.
- **Existing tests that must stay green**: `src/ui/*.test.ts`, `src/run/inventory*.test.ts`, `craft.test.ts`,
  `found.test.ts`, `src/data/ip.test.ts` (any new player-visible text is ours).
