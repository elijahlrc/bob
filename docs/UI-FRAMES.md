# UI frames: content inside its frame

A plan, drafted 2026-11-05 after the owner marked spacing faults on the Items tab: text over a button's inner border,
controls on the bag panel's rim, filter buttons with no visible shape, an off-centre sort arrow, kind buttons that neither
fill their row nor hold their icons. The fix covers every screen, not only the Items tab, and keeps the layouts compact.

## 1. The cause (measured)

Every red circle is one fault: **padding smaller than the painted frame.** The painter draws a panel a little inside its
box (room for its shadow), then a gold rim, then an ink line, and only then the field the content belongs on. In screen
pixels, from the box's edge:

| Frame                                    | Shadow room | Gold rim | Ink line | Field starts at |
| ---------------------------------------- | ----------- | -------- | -------- | --------------- |
| thin (buttons, plaques, the open tab)    | 4           | 6        | 2        | **12 px**       |
| full (panels such as the bag, the sheet) | 6           | 10       | 2        | **18 px**       |

One line of body text (17 px Grenze, a 20 px line) has its letters from about 5 px below the line's top to its baseline
16.5 px down, descenders 3 px lower, plus a 2 px shadow. So a thin-framed text button needs about **37 px** of height for
its letters to sit clear of the ink line. That is why Undo (37 px) and the Next button read fine, and why the bag's
housekeeping buttons (29 px: padding 4/5), the selected view (padding 2/3) and the sort arrow (padding 0) do not.

The same arithmetic explains the rest:

- **Controls on the bag's rim:** from 601 px wide the bag panel's padding is 14 px inside an 18 px frame, so the search
  box, the sort menu, the arrow and the kind buttons start on the ink line. The phone's Filter and sort sheet has 18 px
  of padding in an 18 px frame: its heading and sort menu touch the rim too.
- **Kind buttons:** a 34 px painted square with its icon 5 px in: the icon covers 7 px of frame on every side. They are
  spread with `space-between`, so the ends sit on the panel's rim and the gaps vary.
- **Sort arrow:** zero padding and a 20 px line in a 32 px box; the arrow sits high and to the left.
- **Selected view:** a gold plaque with a gold rim, on a lapis panel whose own rim is gold, a few pixels apart: the two
  rims read as one tangle.
- **Unselected views:** plain text with no frame (`data-paint="none"`), so nothing says they are buttons.

## 2. The rule

Content sits on the field: **a framed box's padding is at least its frame plus a few pixels** (thin: 14 px top and
sides, full: 20 px), and a child box never crosses its parent's frame. Where that costs too much height, the control gets
the **ring** frame instead (decided by the owner, 2026-11-05).

**The ring frame** (`data-ring` on a painted panel; `ringProps` in `src/ui/leaf/ring.ts`): the painted field, textured
and aged like any panel, inside a one-art-pixel rim (2 px on screen) and no ink line, with its shadow below and right.
The owner liked the thickness of a 2 px CSS outline but found it "too digital", so the rim is painted and worn: its steps
vary, it thickens inward here and there and is chipped at the corners and in a few places. Off: a darker lapis field in a
gold rim, so it reads as a button on a lapis panel. On: a gold field in an ink rim with **dark text**, so it never merges
with the panel's gold rim. Its painting keeps 4 px free on the right and below for the shadow, so a ringed control's
padding there is 4 px more.

Which frame a control gets:

| Painted thin plaque (needs about 37 px height)            | Ring (fits in about 30 px)                        |
| --------------------------------------------------------- | ------------------------------------------------- |
| ordinary buttons, Undo, Next, dialog buttons              | the bag's views (All, New, Upgrades...)           |
| the bag's housekeeping row (owner's choice A, 2026-11-05) | the kind buttons                                  |
| the open tab                                              | the sort arrow; other one-glyph toggles           |
| plaques with a line of text                               | other compact toggles found by the sweep (step 2) |

Every text field and menu is painted in the ring too (a darker lapis well; the owner found their clean CSS line "a little
bit digital", 2026-11-05).

## 3. Decided (the owner, 2026-11-05)

- **The housekeeping buttons on desktop** stay painted like Undo and grow to 37 px (option A of the first draft),
  costing about 12 px of the bag's list; the flat-ringed option B was turned down.
- **Compact controls keep texture inside** even without the full gold frame (the ring above), and the owner wants the
  same tried on more of the buttons at the top of screens.
- **Selected text on gold is dark**, never white.

## 4. The sweep (2026-11-05)

Every screen at 1920×1080, 1440×900 and on a 390×844 phone (`node scripts/ui-sweep.mjs <dir>` with the dev server
running): the title, class select, Codex, Patch notes, every camp tab (Items with an item picked and compared, Skills
with a gem picked), a dialog, every stop and Respite, the map's HUD, the map summary and High scores. The check now
also follows the curve of an arch. What it found, and what changed:

- **Text plaques too short for their frame:** the Character sheet's notes under the medallions (`cs-raw`), the DPS
  plaques on Strategy (`st-plaque`), the skill's name under the Skills medallion (`sk-plaque`). Padding raised.
- **Names under an arch past its curve:** stop names on the phone ("The Quartermaster" by 27 px) and a long map name
  on an offer. A name under an arch now wraps within two thirds of the panel, balanced.
- **Rows of choices** (pick one of a row): the interface size, sound and music settings, the Codex's tabs, the HUD's
  pause and speeds, the pack and boss tabs of the DPS details, the stops' filter rows (the Gem Hoard's kinds). They
  take the ring frame, as the bag's views do. Buttons that do something keep the painted plaque.
- **A picked button** (`.btn.on`: In the cart, Chosen, the favourite star) is gold in an ink rim everywhere, never gold
  on a gold rim.
- **Checkboxes** are painted: a dark well in a whole (unchipped) ring, and when ticked, gold in an ink ring with a check
  mark (the owner: the state must read at a glance, 2026-11-05).
- **Flat CSS outlines on controls** (the title's name field, the phone's filter chips and gear toggle) became the ring;
  Strategy's menus keep their plaque and lost the second frame inside it.
- **The one-time tips** clear their frame (the Envious Dead's "Got it" sat on it), and the item name plaques give their
  capitals room (Jacquard's sit at the top of their box; the check now measures letters in their own font).
- **The rivals stops** are checked with a fallen player standing in (the sweep plays offline, so none is found). The
  Awlsmith is cut and is to be removed from the code (the owner, 2026-11-05). The Debug panel (a dev tool) is left out.

## 5. Open questions for the owner

- **Bars and HUD notices** (the XP bar, boss and inspected monster's life, the small life and mana bars, the HUD's
  notes and status plaques) still have the flat CSS outline. Paint them in the worn ring too? The HUD's are redrawn
  every frame, so their frame would be painted once around a fill that moves.
- **Rows of choices take the ring** (section 4) is inferred from the bag's views, not asked.

## 6. Steps

1. **The measuring tool** (built): `window.__dev.frames()` (`src/ui/leaf/frameAudit.ts`) lists, for every painted
   panel on the screen, the letters, icons and boxes inside it that cross onto its frame, by how much and on which side.
   Letters are measured by their capitals and baseline, with 2 px of slack, the level of Undo, which reads fine. A sweep
   is the same call on every screen at 1920×1080, 1440×900 and on a 390×844 phone (the sizes people play at; the owner, 2026-11-05).
2. **The sweep** (done, section 4).
3. **Shared fixes first.** `.btn.small` and the plaque classes in `leaf.css` get padding that clears the thin frame;
   the ring styles (unselected, selected, disabled, danger) go in `leaf.css` once, for every screen to use. This alone
   fixes most offenders.
4. **Screen by screen.** The Items toolbar (section 1; done first as the trial of the ring, and clean on the check at
   all three sizes), then the rest of the list, at all three sizes. A row of equal
   controls fills its row with an even gap (a grid) instead of `space-between`; one-glyph buttons centre their glyph.
5. **Check.** The sweep comes back empty at all three sizes (or every remaining entry is written here with why), and
   screenshots of each changed screen at those sizes, taken at the phone's real pixel density (a headless Chrome
   through `playwright-core`, not the browser pane, which shrinks large screens), go to the owner.
6. **Record the rule** in `docs/mockups/style/STYLE-GUIDE.md` (5 and 6) and in DESIGN.md Appendix A.

## 7. Space

Measured on the prototype: the bag's toolbar on desktop grows by about 30 px (views and kinds spaced so their frames do
not touch) plus 12 px for option A; the phone's Filter and sort sheet by 22 px. Elsewhere the fixes are a few pixels
of padding. Nothing else on the list needs a layout change so far; anything in the sweep that would is brought to the
owner with screenshots before it is changed.
