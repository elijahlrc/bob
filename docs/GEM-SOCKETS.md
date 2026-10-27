# Gem sockets: one tap model, a compact Skills tab (milestones K1–K6)

**Built 2026-10-26** (all six; `src/ui/Skills.tsx`, `src/ui/SupportsPicker.tsx`, `src/ui/leaf/skills.css`; the moves, the main-skill check and the supports plan are `movesFor`, `mainLostBy`, `supportChoices` and `planSupports` in `src/run/inventoryOps.ts`). Not yet tried on a real phone.

The owner, 2026-10-26: swapping gems on the Skills tab is confusing. On a phone the sockets sit above a long list of gems; a tap
picks a gem, then a second tap opens a panel (often off screen) to swap; a double tap sometimes takes a gem out and sometimes not;
picking a gem moves the whole screen; only empty sockets light up as targets; and the "Supports for" filter is clunky. This plan
answers each complaint. It revises docs/EQUIP.md 3.6 (read before replacing) and keeps docs/MOBILE.md's input rule ("tap to select or
preview, a second tap or a visible button to commit").

## 1. Causes (Skills.tsx and leaf/skills.css as of 0f439cb)

| Complaint                    | Cause                                                                                                                                                                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Gold space between items     | Each item is its own painted panel (an 18 px rim, 21/24 px padding, 12 px under it); on a phone they stack one per row.                                                                                                                                                  |
| A tap means different things | A bag row's click picks, its double click places at the best spot; a socket's double click takes the gem out. On touch a double tap is two clicks first (pick, unpick) and then the double click. From the bag a full socket asks first; socket to socket swaps at once. |
| The screen moves             | The picked gem's plaque and the replace question are put into the row above the gear when a gem is picked, and placing scrolls to the item.                                                                                                                              |
| No room on a phone           | The tab has side padding, each item panel its rim and padding, and the bag is below all the gear.                                                                                                                                                                        |
| "Supports for" is clunky     | A drop-down filter in the bag, kept between visits, asking about a skill by name.                                                                                                                                                                                        |
| Swap targets are not lit     | An empty socket lights for a bag gem, a drag or a picked socket; a full one only for a bag gem (`placementsFor` is only worked out for a bag gem), so a move between sockets never lights a full one.                                                                    |

## 2. The model

**A tap picks; a tap on a lit place puts the picked gem there; a tap on the picked thing lets go.** Anything can be picked: a gem in
the bag, a socketed gem, an empty socket. Every place the pick can go is lit the same way, empty or full, and says what it would do
before it is tapped ("▲12%", "Swap ▼5%"), so the second tap is the commit. There is no double tap or double click anywhere: what
they did are buttons in the bar. A mouse still drags.

- Bag gem picked: every socket lights, with what the gem would do there.
- Socketed gem picked: every other socket lights (a move, or a swap with what is there), and the bag's gems say what each would do
  in its place; tapping one swaps it in. Take out is a button in the bar.
- Empty socket picked: the bag's gems say what each would do in that socket, best first; tapping one places it.
- A swap is done on the tap, from the bag or between sockets alike; the camp's Undo takes it back. Only a swap that takes away the
  main skill (out of its socket, or left unable to work) asks first, in the shared popup (`ask`, Confirm.tsx).

## 3. The layout

- **One strip at the top** that never changes size: DPS, EHP and the main skill on one line on a phone; the medallions stay on a
  desktop.
- **Gear and bag side by side** at every width, each scrolling on its own inside the tab, no side gutters on a phone. The gear is one
  panel; each item is a one-line heading (the slot; on a desktop the item name too) and its sockets as tight rows.
- **A bar at the bottom** of the tab, always the same height: the picked thing's name and its buttons (Best place, Supports, Make
  main, Take out, Card, Cancel), or "Tap a gem or a socket" when nothing is picked. The question and the plaque above the gear go.
- **Less text.** A row is the stone, the name (wrapping to two lines, not cut) and at most one short line: the badge while
  something is picked, otherwise only a problem (a skill that cannot be used). The neutral status lines, "Empty" placeholders,
  "if you replace it" and an idle support's reason leave the rows; the bar and the gem's card say them.
- **The bag's filters** move behind a Filter button beside the search box (One of each, Usable with my weapons). The "Supports for"
  filter goes (section 4).

## 4. Supports for a skill

A socketed skill picked has **Supports** in the bar. It opens a popup listing every support that works with that skill (the test the
filter used: `typesAllow` and `supportLive`): the bag's first, then the ones on other gear in a section at the bottom. Each row has a
tick and what ticking or unticking it does to DPS; the supports already linked to the skill start ticked. At most as many as the
item has sockets beside the skill can be ticked ("2 of 3"). **Socket these** puts the ticked ones in the item: they keep their
sockets, the others fill the empty sockets first, then the sockets of unticked supports, then of other gems; what leaves goes to the
bag, and the popup names it. A support taken from other gear leaves an empty socket there.

## 5. Milestones

| #   | What                                                                                                                                      | Done when                                                                                                           |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| K1  | The tap model: targets for any pick, one ring, Place/Swap lines, no double click, swaps on the tap, the main-skill question in the popup. | Every pick lights every place it can go; no gesture is a double tap; a swap asks only when it takes the main skill. |
| K2  | The bar at the bottom and the fixed strip at the top; the plaque and the inline question go.                                              | Picking and placing never move the screen.                                                                          |
| K3  | Compact gear: one panel, one-line item headings, tight rows, the row text cut down.                                                       | A phone shows most of the gear in one screen.                                                                       |
| K4  | Side by side on a phone, each pane scrolling; filters behind a Filter button.                                                             | At 375 px both panes are usable; or the owner drops the idea and the bag goes below.                                |
| K5  | The supports popup (`linkSupports` in `src/run/inventoryOps.ts`), the "Supports for" filter removed.                                      | A skill's supports are chosen in one place, from the bag and from other gear.                                       |
| K6  | An empty socket can be picked: the bag says what each gem gives there, best first.                                                        | Filling a chosen socket takes two taps.                                                                             |

## 6. Not in this plan

The Items tab's socket picker (`SocketPicker`, docs/EQUIP.md 3.7) still asks before filling a full socket; bring it in line once this
lands, if the owner wants.
