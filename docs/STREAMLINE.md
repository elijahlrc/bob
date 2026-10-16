# Streamline: the first minutes and the camp loop

A small plan. Each item is a change to one or two files. Nothing here touches the sim or balance.

## 1. What a new player meets today

Walked through on 2026-10-16 in the dev build, as a Strider:

1. Title → **New Run** → class card. That's 2 clicks.
2. The camp opens on the **Character** tab, a wall of numbers. The way on is the **Next map** tab or the "Next map ▸"
   button. That's 1 click, and both buttons only switch tabs.
3. The Next map tab shows three map cards, each about 25 lines, and there is no Start button: the card itself is the
   button. A player has to scroll, read and click. That's 1 click and a scroll.
4. Map 1 plays at 1× for about 56 s of game time. The character fights with the **default attack**: a new character has
   a weapon but no skill gem (`newRun`, `src/run/run.ts`).
5. Back in camp, the game opens on the Character tab again. The gem reward, the 8 new items and an upgrade (+44% EHP)
   are each behind a different tab.
6. Three gems are now in the bag, one at +116% DPS. Only the Skills tab says "No usable active skill: using the default
   attack". Auto-continue would go on without it.

That's four clicks and a scroll before combat, then a second map fought exactly like the first unless the player finds
the Skills tab.

**Targets:**

- Title to combat in 3 clicks.
- After a map, a player who changes nothing can press **Next** in one fixed place a few times to review the new items,
  skills and passive tree, and reach the map choice, without scrolling or hunting for tabs.

## 2. Changes

**S1. Start on map 1.** `startRun` (`src/run/controller.ts`) calls `startMap(0)` instead of `goTo('camp')`. At map 1
the three cards differ in nothing a new player can weigh, so the choice starts at map 2. `run.offers[0]` is valid
straight after `newRun`; the showcase and `botCamp` already rely on that. If `offers[0]` can be a typed map at map 1,
force it plain.

**S2. After a map, the camp opens on Items, showing what the map dropped.** `Camp.tsx` starts with
`useState<Tab>('sheet')`, and the camp mounts afresh after every map, so every visit lands on the Character sheet.
Instead, coming back from a map opens the Items tab with the **Last map** view (`'last'` in `Items.tsx`, the "Last map
(8)" chip). The view is a saved pref (`loadView`), so the camp sets it for this visit only, and the view the player
chose comes back afterwards. If the map dropped nothing, the visit starts at the next step.

- **The reward pick comes first.** It lives on the Next map tab today, so it would only be reached at the end. When a
  reward is waiting, show the pick at the top of the Items tab: what you pick lands in the bag you're looking at.
  Unpicked, it stays on the Next map tab as now.
- A camp entered from the title (Continue) opens on Next map, since there's no fresh loot to review.

**S3. One Next button, always in the same place.** The camp bar's "Next map ▸" button (bottom right, at every width)
becomes a button that names where it goes (**Next: Skills ▸**) and steps through a fixed order:

> Items (last map) → Skills → Passive tree (only with points to spend) → Next map

It skips Character, Strategy, Workbench and the Last map report, which stay one click away in the tab bar. Clicking any
tab still works as now; Next always goes on from the tab you're on. On the Next map tab the button hides: the player
picks a map card.

**S4. Say when a gem is waiting.** Give the Skills tab a badge in the style of Items, e.g. "Skills (1 upgrade)", using the
DPS comparison the gem list already shows (▲116% DPS). With S2 and S3 the player walks past the Skills tab after every
map anyway; the badge says when it's worth stopping there.

**S5. "Try again" after a death.** The summary has only the button back to the title (`Summary.tsx`). Add "New run as
Strider" (the class just played), which starts it on a new seed. With S1 that goes straight into a fight.

**S6. Fewer leftover saves.** Every New Run makes a save slot at once, so runs left at map 1 pile up: the title screen
here lists five identical "Strider, level 1, map 1". With S1 most of these go away, because a run is in a map from the
start. If not, reuse a slot whose run never finished a map.

**S7. Say how each class fights.** One line per class card in `ClassSelect.tsx` ("Bow", "Two-handed mace", "Wand
spells", and so on). Today a card shows only attributes and the starting weapon.

**S8. Cut auto-continue.** With the Next walk, every map is a deliberate choice. Remove:

- the checkbox, countdown and "Paused: …" line in `Camp.tsx`
- `setAutoContinue`, `canAutoContinue`, `autoBlocker` and `AUTO_PAUSE_BELOW` in `controller.ts`
- `autoContinue` in `RunState`
- the tests that exercise them (`found.test.ts`, `respite.test.ts`, `phase2Types.test.ts`)

Old saves still carry the field. Check that the loader ignores it, otherwise bump `SAVE_VERSION`. The docs that
describe it as current (DESIGN, MAPS, MOBILE, WAYSIDE) get a line saying it's gone; plans and history (EXPANSION,
PROGRESS, WAYSIDE-QUESTIONS) stay as written. The first-stop explainer stays: it was only part of
auto-continue's pause list.

## 3. The map cards: half the information

The user's call: the cards should carry about half of what they show now. Cut:

- the "Asks: ..." line
- the tag chips (Ranged, Ground attacks, Salvos, Patterns, Guards)
- the tier text (Fierce, Even, Gentle). The variance itself stays; only the label goes.
- the "For you: DPS ×… · effective HP ×…" line
- the verdict (Comfortable, Close, Dangerous)

Keep:

- the name and level
- the map type and density lines (when the map has one)
- the faction chip
- the damage-type bar
- the monster list
- the resistance warning
- the map's modifiers

These cuts alone bring a card from about 25 lines to about 17. To reach half, also lay the reward table out in two
columns (`OfferTable`, `src/ui/OfferInfo.tsx`): three rows of two label/value pairs instead of six rows. Every row stays,
"—" included, so the cards still read across. That's the user's call.

Afterwards, check whether a narrow card still needs its Details toggle. Tests that read the removed lines go with them.
Also check whether the per-offer DPS/EHP preview still has any reader: if not, it can go too, which saves work each time
the camp opens.

## 4. Decisions (the user, 2026-10-16)

- No starting gem: characters start on the default attack.
- No auto-socketing of reward gems.
- A line per class on the class cards (S7).
- No remembered game speed.
- Auto-continue is cut (S8).
- On the Next map tab the Next button hides; the player picks a map.
- The passive tree is a step of the walk only when there are points to spend.

## 5. Not in this plan

- Remembering the game speed between visits (cut by the user).
- Tutorials or a tooltip pass.
- Changes to the player AI or balance.
- One-click auto-allocate or auto-equip built on the bot (`botAllocate`, `botRegem`, `botEquip`). It's possible, but it
  changes what the game asks of the player, so it's a design decision and not a free win.

## 6. As built (2026-10-16)

All of S1 to S8 and section 3 are built. Where the build differs from the plan above:

- **S1:** `startRun` still opens the camp, because many tests start a run that way. The menus call a new `beginRun`,
  which starts the run and its first plain map.
- **S4:** the Skills tab counts new gems ("Skills (2 new)"); opening the tab marks them seen. Working out the DPS gain of
  every gem for a tab label would cost as much as the gem list's own badges, which are worked out a slice at a time.
- **S6:** nothing beyond S1. A run is in a map from its first click, and a death deletes its save.
- **S8:** the loader keeps fields it doesn't know, so old saves load without a version bump. Only DESIGN (section 5.3
  and the decision log) is updated; MAPS, MOBILE and WAYSIDE describe auto-continue as part of their plans and history
  and stay as written.
- **Section 3:** the reward table's labels are shorter ("Quantity", "Rarity", "Bonus") so two pairs fit a card's width.
  The boss card loses its DPS/EHP line too.
- **The reward pick on Items** is laid out in one row there, so the drops stay in view.
- **The unused preview is gone:** with the DPS/EHP line, verdict and tier label off the cards, `offersFor`
  (`src/run/preview.ts`) no longer works out the threat preview, the survival ratio or the tier, and `threatPreview`,
  `survivalRatio` and `mapTier` are removed with the tests that only covered them. The map tier as a mechanic (each
  map's own draw of the variance) is unchanged. `offersFor` builds one character per offer instead of three, for the
  resistance warning: about 5.3 ms a call fell to about 1.5 ms on a level 45 camp, and the camp calls it on every
  render.
