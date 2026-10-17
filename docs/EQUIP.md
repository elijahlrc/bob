# Bob — Equipping plan: comparing, sockets, and the phone

Status: **built** (2026-10-16; section 8 says what shipped and what did not). Milestones are **Q0–Q8** (Q for equip; the letter is unused). Sibling plans:
[ITEMS.md](ITEMS.md) (the Items tab, built 2026-10-09) and [MOBILE.md](MOBILE.md) (touch rules). This plan keeps their rules (every action
reachable by thumb, never commit on a first tap you cannot read) and finishes what they left open.

Mock-ups of the proposed Items screen: [mockups/equip/index.html](mockups/equip/index.html) (open `#p1` to `#p5`, `#d1`; static pages built on the game's own stylesheets, numbers illustrative) and the rendered `p0`–`p5.png` (phone) and `d1.png` (desktop) beside it.

Code read for this plan: `src/ui/Items.tsx`, `ItemDetail.tsx`, `ItemCard.tsx`, `Gear.tsx`, `Skills.tsx`, `src/run/inventory.ts`
(`equip`, `dryEquip`, `transferGems`), `src/run/inventoryOps.ts` (`compareSlots`, `placementsFor`), `ItemList.tsx`, `items.css`, `mobile.css`. The
screens were also looked at in the dev server at 375×812 and 1024×768 with `__dev.loot(40, 30)`. **Caveat:** that character starts with
every socket empty, so the _loss_ case (a swap that pushes gems out) is established from the code, not yet seen on screen. Q0 adds
the dev helper that sets it up.

---

## 0. Summary

**The finding that organises the plan: the game already knows the socket consequences of a swap, and the screen does not say them.**
`dryEquip` runs the real `equip` on a copy, so its build already has the gems moved by `transferGems`, the gems that did not fit
pushed back to the bag, and a two-hander's off hand cleared, off-hand gems included. It returns that as `gemsToBag`. **Nothing in
`src/ui` reads `gemsToBag`**, and `compareSlots` drops it when it builds a `SlotCompare`. The delta chips are computed from that same
build, so "▼ 40% damage" is _correct_ and _unexplained_: the player sees the number, never the cause. That is the second complaint
exactly.

Three complaints, three causes:

1. **"Hard to compare what I have with what I want, on mobile."** On a phone the comparison is two tall cards stacked, folded away
   by default behind "Show the cards", inside a sheet that is 254 px of an 812 px screen. By default you get three chips and no
   comparison. Unfolded, you scroll the sheet to see old then new, never both.
2. **"Hard to know if sockets change the consequences."** Sockets are one muted line on the card (`Sockets: 4 (linked)`). The worn
   slots show a name and nothing else, not even how many sockets the piece has or what is in them. Which gems fall out of a swap
   (the _last_ ones in socket order, decided by position), whether a support is left with no skill to support, whether the primary
   skill is lost: none of it is shown. The Skills tab then answers a different question (where does this gem go) and hides the names
   of what it replaces.
3. **"A lot on screen and not enough information."** On a phone, 240 px of controls sit above the first bag row (a fold button,
   search, sort, two buttons, eleven chips, a capacity bar). Meanwhile the facts that decide a swap are not on screen at all.

**The approach: say the consequence in one line, show the diff in one place, and spend the chrome budget on facts.** A headless
`SocketOutcome` for every compare (Q0), drawn as a sockets row with pips (Q1); one merged diff card instead of two stacked cards on
the phone (Q2); a sheet that opens with the answer, not with a toggle (Q3); the same facts on the gear grid and the Skills tab (Q4,
Q5); a socket picker where the gem is (Q6); less chrome (Q7).

**No mechanics change.** Costs, odds, socket rolls and the order `transferGems` uses stay as they are; this plan changes what is said and
where. The one place a mechanics decision hides (which gems get pushed out) is in section 6, for you to decide.

---

## 1. Principles

1. **The answer first.** A selected item opens on what a swap does to the character _and_ to the gems, in words. The two cards are one
   tap away, not the other way round.
2. **Say what moves, with names.** "Halo Sweep and Slow Rot come out" beats "2 gems". A count tells you something happened; a name
   tells you whether you mind.
3. **Show only what changed, by default.** The diff lists changed lines, with the unchanged ones folded. Everything is still one tap
   away (progressive disclosure, not removal).
4. **One surface for the comparison**, shared by the Items tab and the Skills tab, so a gem swap and an item swap read the same.
5. **Sockets are first-class everywhere an item appears**: card, gear slot, bag row. Count, how many are filled, and which skill
   lives there.
6. **Logic is headless** (`src/run/`, unit-tested); components only draw it. `gemStatus` moves out of `Skills.tsx` for this.
7. **Desktop unchanged where it works.** New rows and pips are additive on desktop; the merged diff and the sheet changes are scoped by
   width (`max-width: 600px`) or `(pointer: coarse)` (MOBILE.md principle 3).
8. **No mechanics change** (section 0).

---

## 2. What breaks and where

| #   | What happens                                                                                                                                                                                                                                                                                                                                                                                                    | Where                                                                       | Fix      |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------- |
| F1  | `dryEquip` returns `gemsToBag`; nothing reads it, and `compareSlots` drops it. The socket consequence of a swap is computed and thrown away.                                                                                                                                                                                                                                                                    | `inventory.ts:201-221`, `inventoryOps.ts:453-487`                           | 3.1      |
| F2  | Overflow is decided by position: gems of the old item go into the new item's empty sockets in order, the rest (the later ones) go to the bag. A skill gem in socket 1 survives a swap that costs the supports in sockets 3–4, and the reverse. The player never sees which. The primary skill is silently dropped when its gem leaves (`dropLostPrimary`).                                                      | `inventory.ts:103-119`, `223-231`                                           | 3.1, 3.3 |
| F3  | A card says `Sockets: N (linked)` in muted text, and never shows the gems in them. Every socket on an item is linked, so socket count _is_ link size, which is what decides how many supports a skill gets. It is not presented as the number that matters.                                                                                                                                                     | `ItemCard.tsx:222`                                                          | 3.2      |
| F4  | A worn slot cell shows its label and name. No sockets, no gems, no "2 empty sockets". You find out what an item carries on a different tab.                                                                                                                                                                                                                                                                     | `Gear.tsx:79-80`                                                            | 3.5      |
| F5  | Whether a support still has a skill to link to after a swap (`gemStatus`) is worked out only for the live character, on the Skills tab. The Items compare cannot say "Hamstring has nothing to support in the new body".                                                                                                                                                                                        | `Skills.tsx:59-109`                                                         | 3.1      |
| F6  | Phone: the selection is a fixed sheet, max 52 vh (254 px at 812 px) with the list padded under it. The old/new cards are **folded by default**; unfolded, `.ix-pair` is one column, so old and new stack and you scroll between them. The default view is three chips and the buttons.                                                                                                                          | `items.css:561-618`, `ItemDetail.tsx:189,200-207`                           | 3.2, 3.4 |
| F7  | The gem in the bag says "Choose which socket on the Skills tab." On a phone that means leaving, finding the gem again in a second list, and tapping a socket.                                                                                                                                                                                                                                                   | `ItemDetail.tsx:430`                                                        | 3.7      |
| F8  | Skills: the preview badge says `replaces` with no name, though `Placement.replaces` holds it. Tapping a socket with a gem selected **commits at once**, a filled socket included (undoable, but unread). The phone sheet shows the new gem's card only. A 7-line hint paragraph is always on. List badges give a % but not where the gem would go. A support with no skill to link to shows a bare "no change". | `Skills.tsx:344,221-228,461-501,270-277,452`, `inventoryOps.ts:337,370-379` | 3.6      |
| F9  | Phone chrome above the first row: ~240 px (gear fold, search, sort, Reverse, Tidy, six kind chips, five view chips, capacity). Rows show the mods' category names, truncated, and one badge for the best slot (the slot's name is shown only for items that fit two).                                                                                                                                           | `ItemList.tsx:175-283` (controls), `99-112` (row), screenshot at 375        | 3.8, 3.9 |
| F10 | The flask compare is two plain cards with none of the changed-line marks the item compare has.                                                                                                                                                                                                                                                                                                                  | `ItemDetail.tsx:278-291`                                                    | 3.2      |

### What the code already gives us

- `dryEquip` (the real `equip` on a copy) and `withEquipped`; the build after a swap is exact, gems and off hand included.
- `Placement.replaces` (the name of the gem a socket would lose), `placementsFor`, `bestPlacement`.
- `gemStatus` (why a gem is or is not doing anything), `Character.actives[].inert`, `ch.primary`.
- `lineMarks` (gain / lost / diff per line), `SlotTabs` (one comparison per slot, already built), the status line with Undo.
- `c.act` is undoable, so a commit is never final; what is missing is reading before committing.

---

## 3. Design

### 3.1 Headless: a `SocketOutcome` on every compare (Q0)

Extend `dryEquip` and `SlotCompare` (`src/run/`) with what the swap does to the gems, as data, with names:

```ts
type SocketOutcome = {
  before: { sockets: number; filled: number }; // the slot's item now (0/0 when empty)
  after: { sockets: number; filled: number }; // the new item once the gems have moved
  moved: GemItem[]; // gems that go into the new item
  out: GemItem[]; // gems that go to the bag, off hand's included
  lostPrimary: boolean; // the primary skill's gem is among them
  idle: { gem: GemItem; why: string }[]; // supports left with no skill to link to in the new item
  freeAfter: number; // empty sockets in the new item once placed
};
```

`out` is today's `gemsToBag` with the gems themselves; `idle` is `gemStatus`'s reasoning (move it into `src/run/gemStatus.ts`, keep
the export `Skills.tsx` uses) run on a `Character` built from the dry build (as `compareDelta` does with `new Character(build, cfg)`; `compareSlots` today only builds
a `CharacterSheet` through `sheetOf`, so either build one more or let `sheetOf` hand back the `Character` it makes). A count and
a name for the bag rows can be had without any `Character` at all (`transferGems` alone), which matters for 3.9.

Tests: fewer sockets than gems (the last ones out), more sockets (free sockets), a bare item, a swap that loses the primary, a
support whose skill leaves, a ring onto a ring, a two-hander over a shield with gems in it, a two-hander over a quiver. Also
verify what `socketGem` does to `primaryGem` when it replaces the primary's own gem, so section 3.6 says the true thing. A dev helper
`__dev.gearUp()` equips a 4-socket body and a 2-socket helmet with skills and supports so the loss case can be looked at.

### 3.2 One diff surface (Q2)

On a phone the default is one merged card, not two. One list, in the order of the card; each changed line carries the old value
beside it (`←` points at the value that was there; the sockets row reads old → new, as a swap does), gained lines are green, lost lines red and struck, unchanged lines folded under "+8 unchanged lines":

```
 Grim Plate  ·  Patched Vest  ·  vs  Dented Plate (worn)
 ─────────────────────────────────────────────
  Sockets      ◆ ◆ ◆ ◆  →  ◆ ◆ ◆            4 → 3
  ⚠ Slow Rot comes out (to the bag)
  Armour       59        ←  31
  +12% chaos res            ← gained
  +41 Evasion Rating        ←  +30
  ~~+20 max life~~          ← lost
  + 8 unchanged lines  ▾
```

Built on `lineMarks`, which already pairs lines by key with the numbers removed, so the old value for a `diff` line is a lookup. Items
and flasks both use it (flasks gain the marks they lack, F10). **Desktop and tablet keep the two-card `Pair`** (there is room for it),
with the same sockets row above it; a "Show both cards" toggle replaces "Show the cards" on the phone, off by default.

### 3.3 The sockets row (Q1)

A first-class row at the top of the diff and under the slot tab, drawn from `SocketOutcome`:

- **Pips**: one per socket, ◆ filled, ◇ empty, in socket order; old item's pips, an arrow, the new item's. Pips are
  display, not controls, so they can be small (two sets of six at 44 px would be 528 px, wider than the sheet); the tap targets stay the
  socket buttons on the Skills tab. A pip that is pushed out is drawn crossed (✕) with the gem's name beside the row.
- **Severity, by colour and by words** (never colour alone): no gems affected → plain; gems come out → **one line, one
  sentence** naming them, never wrapping ("No socket for Twin Cut, it will be unequipped"); the primary skill goes → the same line in the
  stronger colour ("No socket for Halo Sweep, your primary skill, it will be unequipped"); gems stay and the new item has free sockets → a positive note
  ("2 free sockets"). The reasons behind it (what stays linked, what the numbers count) are not on the line.
- **Link size as a fact**: since every socket is linked, "4 sockets" is "a 4-link". The row says `4 linked` the way the card does, and
  a support that has nothing to link to says why, from `idle`: "Hamstring: needs a melee skill in the same item."
- The **Equip button** says only `Swap` (the slot is in the "vs" line above it; the socket consequence is the sockets row and its warning, not the button), and the status line after the swap names what went
  where ("Equipped Plate. Slow Rot and Hamstring are in the bag.") with the same Undo it has now.
- When nothing about sockets changes (no gems either side), the row is hidden, not "0 → 0".

### 3.4 The phone sheet (Q3)

- **Open by default**, and it opens on **the affixes that change**, not on calculated numbers: the changed lines of the item against
  the one worn (every one of them, never cut off behind a "show more": a long list scrolls inside the peek, which stops at 52 vh with the actions pinned; gained green, lost red and struck, changed amber with `was …`), then the sockets row and its one-line warning, then
  the actions. The calculated chips (damage, effective HP, resistances) show only with the Both cards switch (phone). No toggle between
  you and the comparison.
- **Two heights**: _peek_ (header, "vs Dented Plate · worn in Body", the changed lines with the unchanged ones folded, sockets row,
  one-line warning, one row of actions: about 37 vh in the mock-up, so the top of the bag stays visible and ◂ ▸ steps through it)
  and _full_ (tap ▴ or drag: about 85 vh, the chips, the gem names and the whole card). Today it is one height, 52 vh, and the list is
  padded by 54 vh underneath.
- **Compact actions, one row**: the main button is the size of the others (`Swap`, about 34 px high, not a full-width
  44 px bar), then ☆, Craft…, Discard, and an icon-only ▴/▾ for peek/full. A phone tap target is still met by the row's own height
  plus its spacing; the Equip button is not the only way to commit (Enter, the slot tabs, tapping a highlighted gear slot).
- **The slot tabs stay** for rings and one-handers, now each with its own one-line socket outcome ("Ring 2: ▲ 12% HP · no gems").
- **Swipe left/right** steps to the next/previous row (ITEMS.md left it out; the buttons stay as the visible control, principle 6 of
  that plan). Decision in section 6.

### 3.5 Gear slots carry their sockets (Q4)

- Every worn slot cell gets its pips under the name: ◆◆◇◇. A worn item with empty sockets is visible at a glance; so is one with a
  skill in it (the skill gem's initial or a ★ on the primary's pip, not a name: the cell is narrow).
- The folded phone summary becomes `Gear · 6 of 10 worn · 7 gems · 3 free sockets`.
- Selecting a worn slot shows its gems by name under the card ("Halo Sweep ★ · Slow Rot · Hamstring") and an **Edit gems →** button
  that opens the Skills tab with that item's sockets in view (a deep link, not a second UI).
- A slot that the selected bag item could fill shows what it holds in the same pips, so "this body has 4 sockets, all full" is
  readable on the grid before opening the compare.

### 3.6 The Skills tab (Q5)

- **Sockets by item as cards**: item name (one line, no wrap), `4 sockets, linked`, the pips row as buttons, each filled one with the
  gem's name and `gemStatus` line (what it supports, why it does nothing). Items with no sockets stay hidden, with a single quiet line
  "Not socketable: Helmet, Gloves" so a missing row is not a mystery.
- **Say what is replaced**: `Placement.replaces` is already there. The badge row reads `▲ 24% DPS · replaces Slow Rot`, and the phone
  sheet shows the new gem and the replaced gem as two columns of the same merged-diff component (one-column list on a 375 px
  screen), with what each supports.
- **Read before committing a replacement.** A first tap on a socket that holds a gem selects it as the target and shows the preview;
  the sheet's button ("Replace Slow Rot") commits. An _empty_ socket still places at once, as today (it is undoable and loses
  nothing). Undo and the status line already exist.
- **List badges say where**: `▲ 24% DPS → Body`, from the `bestPlacement` the badge is already computed from. And a support with
  nowhere to work says "needs a melee skill on one of your items" in place of "no change" (`hasActiveSkill` already knows).
- **The hint paragraph** (7 lines on a phone) collapses to a `?` that opens it; it is shown once, on the first visit.

### 3.7 A socket picker where the gem is (Q6)

Selecting a gem in the Items bag replaces "Choose which socket on the Skills tab" with the same socket list the Skills tab has, built
from `placementsFor`: one row per item that has sockets, its pips, the badge, and "replaces X" where it would. Tap a row to place (empty
sockets commit with Undo; filled sockets preview first, 3.6). One component, `SocketPicker`, used by both tabs. The Skills tab remains the
place to rearrange.

### 3.8 Less chrome on a phone (Q7)

Progressive disclosure, nothing removed:

- One row: a **compact search** (about 34 px high, not the 44 px of a full touch target; its text stays 16 px, because a smaller font
  makes iOS zoom the page when it takes focus, MOBILE.md section 0) and a **Filter** button of the same height. The button opens a sheet with kind chips, view chips, sort, reverse, Tidy and
  Salvage. A filter that is not the default shows as one removable chip under the row, so you always know the list is filtered.
- **Clear filters**, a button beside Filter, shown only while something is filtered (a kind, a view, or search text). One tap resets
  kind, view and search to their defaults in one go (sort is left alone: it is an order, not a filter). The sheet has the same reset at
  its foot. An empty list says why and offers it: "Nothing matches. Clear filters". The point is that nobody is stuck in a filtered list
  they do not understand; the cost is a narrower search box (about 160 px on a 375 px phone).
- The capacity bar stays, compact, and turns amber near full (it is the number you need exactly when you are about to pick up more).
- Target: the first bag row is visible by about 110 px, from about 250 px.
- Desktop and tablet keep today's toolbar (it is not the problem there).

### 3.9 Rows that carry the answer (Q7, continued)

"Not enough information visible by default" is largely the row. Today it shows the _names of the mod categories_, cut off, and one
badge:

- An item that fits two slots already shows `→ Ring 2` for its best one (`ItemList.tsx:101`); the badge keeps that and gains the other
  slot's verdict only in the sheet.
- A row shows its sockets as pips beside the ilvl (`◆◇◇`), and a ⚠ when the best-slot swap pushes gems out. This uses the cheap tier of
  `SocketOutcome` (3.1, no `Character`), so it can be worked out for the whole bag; the `idle`-support check is for the selected item only.
- The second line shows the item's best two or three actual lines (the numbers) in place of category names, truncated by the line, not
  mid-word.
- Unchanged: NEW tags, stars, the "can't use" tag (its reason moves from `title=` to text in the sheet: ITEMS.md I7).

---

## 4. Milestones

Each is a commit-sized unit; the tests are headless where the change is. Order is value order: Q0–Q3 answer the three complaints,
Q4–Q7 spread the same facts around.

| #   | Does                                                                                                                    | Files                                                                                       | Tests                                                                            |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Q0  | `SocketOutcome` in `dryEquip` and `SlotCompare`; `gemStatus` moved to `src/run/gemStatus.ts`; `__dev.gearUp()`.         | `inventory.ts`, `inventoryOps.ts`, `run/gemStatus.ts`, `Skills.tsx` (import only), `dev.ts` | the eight cases of 3.1; bot results unchanged (the fields are additive)          |
| Q1  | `SocketPips` and the sockets row; the Equip button and status line say what moves.                                      | `ui/SocketPips.tsx`, `ItemDetail.tsx`, `ItemCard.tsx`, `items.css`                          | component test of the row text per severity                                      |
| Q2  | Merged diff card on the phone; flask marks; "Show both cards" toggle.                                                   | `ItemDetail.tsx`, `ItemCard.tsx` (`lineMarks` gains old values), `items.css`                | `lineMarks` old-value test                                                       |
| Q3  | Sheet open by default, peek/full heights, tab socket lines, (swipe if kept).                                            | `items.css`, `ItemDetail.tsx`                                                               | none (layout): screenshots                                                       |
| Q4  | Pips and gems on gear slots; folded summary; worn-slot gem list; deep link to Skills.                                   | `Gear.tsx`, `Items.tsx`, `App.tsx` (the link)                                               | `gearSummary` test                                                               |
| Q5  | Skills: item cards, named replacements, preview before replacing, "→ Body" badges, idle-support reason, collapsed hint. | `Skills.tsx`, `mobile.css`, `inventoryOps.ts` (a reason on a no-change `Placement`)         | placement reason cases                                                           |
| Q6  | `SocketPicker` shared by Items (gem selected) and Skills.                                                               | `ui/SocketPicker.tsx`, `ItemDetail.tsx`, `Skills.tsx`                                       | none (UI over `placementsFor`)                                                   |
| Q7  | Phone Filter sheet; rows with slot name, pips, ⚠, real lines.                                                           | `ItemList.tsx`, `Items.tsx`, `inventoryOps.ts` (`itemInfos` gains the cheap socket tier)    | `itemInfos` socket-tier test; the list's perf stays under the Skills badge slice |
| Q8  | Verification pass, docs: this plan's status, `CLAUDE.md`, `PROGRESS.md`, DESIGN Appendix A for decisions taken.         | docs                                                                                        | see section 7                                                                    |

---

## 5. Not in this plan

- Any change to socket rolls, link rules, the gem-transfer order, costs or the sim (section 6 for the one decision).
- A new compare _metric_. The DPS/EHP/score numbers are what the bot and the sheet agree on; this plan explains them, it does not
  replace them.
- The Workbench screen (ITEMS.md section 4) and the Strategy tab.
- A real-device pass (MOBILE.md section 9); this plan adds to the list of things to look at on one.

---

## 6. Open questions (your calls; my default in bold)

1. **Which gems come out when the new item has fewer sockets?** Today the _later_ sockets lose, by position, so a skill in socket 1
   always survives and a skill in socket 4 does not. Options: (a) **leave the rule, show it** (everything in this plan works); (b) change
   it so active skills move first and supports after, so a swap never costs you the skill to keep a support (a one-line change in
   `transferGems`, but it is a mechanics change: it moves the balance of every bot run and the save behaviour of swaps); (c) let the
   player pick which gems go in the compare (largest UI, most control). I would do (a) first and only add (b) or (c) if the new row
   shows the rule to be annoying in play.
2. **Should an empty socket count for something in the compare?** The delta counts only gems that fit. A 6-socket body with 2
   filled and 4 free is worth more than the chips say. **Show it as a fact (`4 free sockets`), do not fold it into the numbers.**
3. **One tab for gear and gems?** The Items and Skills tabs are two halves of one task. Merging them is the biggest possible change and
   not needed for the complaints above. **Not now:** the socket picker (3.7) and the gear pips (3.5) remove most of the back-and-forth;
   revisit after Q6.
4. **Sheet on the phone: two heights (peek/full) or a full-screen compare page?** **Peek/full:** you keep the list in view and keep
   stepping with ◂ ▸. A full-screen page is simpler to build and loses the list.
5. **Swipe to step through items.** Left out last time. **Add it, with the buttons staying as the visible control.**
6. **Merged diff on desktop too?** **Phone only.** At 1100 px+ the two cards fit side by side and read well; the sockets row is added to
   both.
7. **Row sockets: always, or only on upgrade candidates?** **Always** (pips are small); the ⚠ only when a gem would be pushed out.

---

## 7. Verification

- Headless: the tests in section 4; `npm test` and `npm run lint`; `npm run sim` result unchanged for the bot (the new fields are
  additive, and nothing in `bot.ts` reads them).
- On screen: `__dev.gearUp()` then `__dev.loot(40, 30)`, at **375×812** (phone), **768×1024** (tablet) and **1280×720**, looking at: a
  swap that costs gems; a swap that gains free sockets; a ring (two slots); a two-hander over a shield with gems; a support that loses
  its skill; a gem swap on Skills; the filter sheet.
- Screenshots regenerated in `docs/screenshots/mobile/`: `p3-360-items-sheet.jpg`, `p5-360-gem-sheet.jpg`, plus new ones for the sheet
  at both heights and the Filter sheet. Desktop screenshots are the regression check for "desktop unchanged".
- The one thing no emulation answers: how the peek height feels under a thumb, and whether a swipe collides with the bag's scroll. Both go
  on the real-device list.

---

## 8. Built (2026-10-16)

Q0 to Q7 are built, each a commit (Q2 and Q3 together, Q5 and Q6 together). The section 6 defaults were taken as written: the
transfer rule is kept and shown (a), free sockets are a fact and not a number, the tabs are not merged, peek and full, the merged
diff on phones only, row pips always.

**What the screens do now.**

- `dryEquip` returns `sockets` (a `SocketOutcome`: before and after counts, `placed`, `moved`, `out`, `fromOffHand`, `lostPrimary`,
  `idle`, `freeAfter`) in place of the old `gemsToBag` count; `SlotCompare.sockets` carries it with `idle` filled in, and `ItemInfo.gemsOut`
  gives a bag row the cheap tier. `src/run/socketText.ts` turns an outcome into the one sentence; `gemStatus` lives in `src/run/gemStatus.ts`
  with `gemIdle`.
- Items tab: a "vs" line, the sockets row (`SocketPips`, `SocketsRow`), the Swap / Equip button, the status line names the gems that went
  to the bag, the slot tabs say what happens to the gems, a worn slot shows its pips, a worn item names its gems and has **Edit gems →**
  (opens the Skills tab scrolled to that item), a bag gem has the `SocketPicker`.
- Phone: the sheet opens on a peek (the changed lines, the sockets row, one row of actions); the grab bar or ▴ opens the full view
  (gems by name and the merged card with old values; the calculated chips (damage, effective HP, resistances) appear only with "Both" cards, since they cover only some stats and repeat what the changed lines say). **The peek shows every changed line** (the user's review
  of the first build: a "show more" in the peek made it useless); it grows to 52 vh and scrolls inside, with the actions pinned.
- Filters: a phone's toolbar is the search, **Filter** (with a count) and **Clear filters**; the rest is in a sheet with Show N items
  and Reset filters. Clear filters is also on desktop and tablet (beside Reverse), and an empty list offers it.
- Rows: socket pips, a ⚠ "N gems out" badge when the best-slot swap sends gems back, the item's own lines (short forms) in place of the
  category names. Flask compares carry the same changed-line marks.
- Skills tab: "if you replace it" and the replaced gem named in a confirm, a first tap on a full socket with a gem from the bag asks
  first (an empty socket still places at once; dragging onto a socket is an explicit gesture and commits), list badges say where
  (`→ Body`) and why a support does nothing ("needs a spell skill on one of your items"), items show their sockets, "Not socketable:"
  names the rest, the hint is a `?` and shows open once.

**Checked on the code.** Replacing the primary skill's gem with `socketGem` leaves `primaryGem` pointing at a gem now in the bag, and the
character falls back to its first usable skill; the replace confirm says "your primary skill" for that reason.

**Differences from the plan.**

- The warning wraps to a second line when several gems come out ("No socket for A and B, they will be unequipped") rather than
  truncating; one gem is one line, as in the mock-up.
- `idle` counts a support with no skill to work on and a skill the new weapons cannot use. A skill that is merely short of mana is not
  idle (`gemStatus` still says so on the Skills tab).
- The Skills tab keeps its own socket grid (it is also where gems are dragged and moved) and shares `Badge` and the confirm wording
  with the `SocketPicker`; the picker itself is the Items tab's. On a phone the gem sheet leads with the picker and shows the gem card
  in the full view.
- A gem swap on the Skills tab shows what is replaced as text and a badge, not as two cards.
- Placements gained `idle`; `bestPlacement` breaks ties toward a socket where the gem does something.

**Not built, and not seen.**

- Swipe to step through items, and dragging the grab bar (it taps).
- Not looked at on screen: a ring's two slot tabs on a phone, and a two-hander over a shield in the browser (both are covered by the
  headless tests). Not looked at on a real device (peek height under a thumb, scroll against the bag).
- Screenshots: `docs/screenshots/mobile/q3-peek.jpg`, `q3-full.jpg`, `q6-gem-picker.jpg`, `q7-filter-sheet.jpg`.
- `p3-360-items-sheet.jpg` and `p5-360-gem-sheet.jpg` in the same folder show the screens before this plan; the `q*.jpg` files supersede them. `npm run fence` holds (12 runs identical), so the bot is unchanged.
