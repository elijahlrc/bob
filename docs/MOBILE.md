# Bob — Mobile and Inventory Plan: touch, small screens, phones and inventory tools

Status: **P0 to P9 are built; the real-device pass (P7) is left (section 9)** · Owner: the user · Implementer: Claude

This plan makes every screen of the game usable in a phone or tablet browser (P0–P7), and adds the inventory tools a long
run needs: a persistent "new" list, a clean-up of old items, and favourites (P8–P9). It extends [DESIGN.md](DESIGN.md); the
spec never assumes a desktop window, so no spec change is needed, but the decisions in section 7 go into DESIGN.md Appendix
A when they are made. Milestones are **P0–P9** (P for phone; M, C and R are taken) and are tracked in `docs/PROGRESS.md`.

Conventions follow DESIGN.md: every number is a v1 value and tunable. P0–P7 live in `ui` and `render`; the headless modules
(`core`, `data`, `mods`, `calc`, `gen`, `sim`) do not change. **P8 is the exception: it adds run state and pure functions to
`run`** (still no DOM), so it follows the rules for `run` changes (save version, tests, bot unaffected).

---

## 0. Summary

- **Where we start.** The game is built for a mouse and a window of at least ~1100 px. The code has **no `@media` rule at
  all**, almost every size is a fixed pixel value, and several things only work with a hover, a double click, HTML5
  drag-and-drop or the mouse wheel. The viewport meta tag exists, but nothing else is mobile-aware.
- **What does not need work.** The map itself needs no input: the run plays itself, and the only map interaction is tapping
  an enemy to inspect it (`MapScene` already uses Phaser pointer events, which cover touch). The tree already uses pointer
  events with `touch-action: none`, so one-finger pan works. Save, crash log and prefs already guard `localStorage`.
- **What does.** Five problems, in order of how much they break:
  1. **Layout.** Camp is a row of a 260 px side column and a tab body whose panels are 300–380 px wide: unusable under
     ~900 px. The HUD, the inspect panel and the tooltips are fixed-size and overlap on a phone.
  2. **Hover-only information.** Item stats, gem cards, reward previews, tree node text and every `title=` tooltip need a
     hovering pointer. A phone cannot see them.
  3. **Gestures with no touch path.** Tree zoom is the wheel only; gem drag-and-drop uses HTML5 `draggable`, which does not
     fire on touch; several actions are double clicks (and a double tap zooms the page).
  4. **Size.** Most text is 10–13 px, many tap targets are 30–34 px, inputs under 16 px make iOS zoom the page on focus, and
     tree nodes are ~5 px across at the default zoom.
  5. **The map view.** The pixel zoom is picked once per map from the window width (1.5 on anything under 1100 px), so a
     375 px phone sees a very narrow slice of the map, and rotating the phone changes nothing.
- **Inventory at scale (separate from the mobile problems).** The inventory only grows: every cleared map adds drops, over
  100 maps. Today the only help is "NEW" tags for rare and unique items that vanish the moment the Items tab is opened, a
  "Last map" filter that forgets everything older, and a "Salvage junk" button for normal and magic non-upgrades. The plan
  adds three tools (section 3.8): **everything picked up since you last looked** stays listed until you see it; **clean up
  old items** salvages everything unequipped that is more than _n_ levels old; and **favourites** are starred items that
  no clean-up touches and that can be pinned to the top of the list.
- **The approach.** Fix the foundation once (viewport, units, detection, tokens), then give every screen **one touch
  rule — tap to select or preview, a second tap or a visible button to commit** — then lay out camp, tree, skills and the
  HUD for narrow screens, then verify on emulation and on a real device. Desktop must not change: every rule is scoped by
  `@media (pointer: coarse)` or a width breakpoint, and the desktop screenshots in `docs/screenshots/` are the regression
  check.

---

## 1. Goals and principles

1. **Every action available with a mouse is available with a thumb.** No feature is dropped on touch. Where a gesture has
   no equivalent (hover, double click, drag), a visible control replaces it.
2. **Never commit on the first tap of something you cannot yet read.** A hover shows what a thing is; on touch the first
   tap does that, and the commit is separate. Reward picks, item equips and tree allocations are the dangerous ones.
3. **Desktop is unchanged.** Touch rules are scoped; nothing is simplified for everyone to suit the small screen.
4. **One detection mechanism.** Layout follows width (CSS breakpoints); input follows `(pointer: coarse)`. A laptop with a
   touch screen gets the desktop layout with bigger targets, not a phone layout.
5. **Measure before optimising.** The map renders lights, filters and particles. We find out what a phone does with them
   before adding a quality setting (the user's standing rule: do not over-worry about performance).
6. **Portrait first** (section 7), with landscape working but not designed around.

---

## 2. Inventory: what breaks and where

### 2.1 Layout

| Where                                          | Today                                                                                        | On a phone                                         |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `.camp` (Camp.tsx)                             | Row: `.camp-main` + `.camp-side` at 260 px; five tabs in one row                             | Side column eats 70% of the width; tabs overflow   |
| `.camp-side`                                   | Map offers (the main decision of the run), Auto-continue, Save, Abandon                      | Must stay one tap away but cannot be a column      |
| Items (`.inv-col`, `.item-detail`, `.equip-*`) | `min-width: 300px` columns, `min-height: 340px` detail card, 5-column grids                  | Horizontal scroll or clipped                       |
| Skills (`.skill-socket-*`, `.gem-inv`)         | `flex: 1 1 420px` and `flex: 0 0 280px` columns, gem grid at `minmax(150px, 1fr)`            | Clipped; the inventory column is wider than screen |
| Workbench                                      | 380 px blocks, `grid-template-columns: 1fr 1fr`, rows of `minmax(110px,1fr) 72px 34px 150px` | Clipped                                            |
| Sheet, Codex, Summary, Title, ClassSelect      | Centred columns with `max-width`; `.title h1` is 64 px with 0.35em tracking                  | Mostly fine; the title wraps badly; needs a check  |
| `.hud-bottom`                                  | Orb 104 px + centre (charges, skill bar, flasks, speeds) + orb 104 px, wrapping              | ~210 px of orbs leave 150 px for everything else   |
| `.inspect`                                     | `position: absolute`, `width: 270px`                                                         | Covers half the map                                |
| `.hud-top`, `.hud-showcase`, `.hud-gallery`    | `top: 8px`, `bottom: 10px`; no safe-area insets                                              | Under the notch and the iOS home bar               |
| `html, body, #app` (index.html)                | `height: 100%`, `overflow: hidden`                                                           | `100%` includes the browser bar that slides away   |

### 2.2 Hover-only information

Every one of these needs a touch equivalent (P2):

- **`title=` attributes:** `Hud` orbs, charge pips, hex chips and flasks; `SkillBar` (`title={s.detail}`); `Camp` map-affix
  buttons; `Items` slot and row reasons and sort buttons; `Workbench` chips and crafting buttons; `Skills` status and
  primary-skill buttons; `Title` export button.
- **`onMouseEnter` previews:** `Items` (the card shown for the hovered row; `selected` is the fallback), `Reward` (the
  offer card), `Skills` (`GemTip`, a tooltip that follows the pointer).
- **Tree:** the node tooltip and the hover path preview (`TreeView` `onMove`).
- **Hover CSS:** `.btn:hover`, `.class-card:hover`, `.inv-row:hover`. Harmless on touch, but sticky hover after a tap should
  not leave a button looking pressed.

### 2.3 Gestures with no touch path

| Gesture                     | Where                                               | Touch replacement                                                               |
| --------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------- |
| Wheel zoom                  | `TreeView`                                          | Two-finger pinch, plus `+` / `−` / centre buttons                               |
| HTML5 drag-and-drop         | `Skills` (`draggable`, `onDragOver`, `onDragStart`) | The select-then-tap path that already exists (`sel` → `onSocketClick`)          |
| Double click                | `Items` (unequip, quick-equip), `Skills` (unsocket) | Buttons in the detail card (most exist: quick-equip, unequip, discard)          |
| Ctrl+Z                      | `Camp` undo                                         | The Undo button in `Items`; add one to the camp header so it works on every tab |
| Arrow keys, Enter, E, U, X  | `Items` `onKey`                                     | Every key already has a button in the detail card (confirm in P2)               |
| N / P                       | `App` (showcase, gallery)                           | Buttons exist in the showcase and gallery panels                                |
| Right click, text selection | Nowhere used                                        | Block long-press selection and the callout on game surfaces                     |

### 2.4 Size

- Font sizes: 10–13 px for most of the UI. **Floor on touch: 14 px body, 12 px for secondary text; 16 px for inputs.**
- Targets: `.btn.small` (4 px 10 px padding), `.skill` (34 px), `.flask` (30 px), `.tab`, inventory rows. **Floor on
  touch: 44 px** (the hit area, not necessarily the drawn size).
- Tree nodes: radius 12 (small), 10 (travel), 22 (notable) in tree units at `k = 0.22`: **about 5 px across for a small
  node**. Hit areas must be at least ~22 px across on screen whatever the zoom.

### 2.5 The map view

- `pickZoom(width)` in `grim/index.ts` returns 2 for ≥ 1100 px and 1.5 otherwise, and is read once in `buildWorld`. On
  375 px that is a 250-world-pixel-wide view. It does not follow a resize or a rotation (`Phaser.Scale.RESIZE` resizes
  the canvas but the zoom stays).
- The game config sets no resolution or device-pixel-ratio handling: the canvas is sized in CSS pixels and the browser
  scales it, so text-like fine detail is soft on a 3× screen. This is a decision (section 7), not necessarily a bug.
- Lights (`maxLights: 32`), the filters set up in `setupFilters`, and the particle and skill effects are untested on a
  mobile GPU.
- Not seen yet and worth checking in P0: what the sim does when the tab is hidden or the phone locks (`requestAnimationFrame`
  stops; does the controller's `frame` delta clamp?), and whether `visibilitychange` should pause the run.

### 2.6 The inventory at scale

What exists (`src/run/inventoryOps.ts`, `src/run/run.ts`, `src/ui/Items.tsx`):

- **`run.newLoot`** holds the uids of rare and unique _items_ (not gems, flasks or normal/magic items) picked up since the
  last camp visit, plus crafted uniques. `Items` copies it into a ref for the NEW tag and **empties it on mount**, so the tag
  is gone after one visit to the tab, whether or not the player looked at the items. It also drives the Auto-continue pause
  (`Controller` blocker "N new rare/unique items").
- **`run.lastDrops`** is the last cleared map's drops only, reset on every map: the "Last map" filter.
- **`junkItems(run)`** is every normal or magic inventory item that is not an upgrade; the "Salvage junk" button salvages them
  for Bone Dust. Rare and unique items are never junk, so a long run piles up old rares that no longer matter.
- **No acquisition record.** Items carry a uid (rising) and an item level, but not when they were found, so "older than _n_
  levels" cannot be computed today.
- **No favourites.** Sorts are single-key (`newest`, `slot`, `rarity`, `ilvl`, Δ DPS, Δ effective HP, `upgrade`, `name`).
- Salvage is **final** by design (it clears the undo stack, EXPANSION 8.4); equip, discard and socket changes are undoable.
- Crafting keeps an item's uid (`remake` in `craft.ts` copies it), which lets a favourite flag follow the item through the
  Workbench.

---

## 3. Design

### 3.1 Detection and tokens (`src/ui/device.ts`, CSS custom properties)

- **Width:** CSS breakpoints, two of them. `≤ 600 px` = phone, `≤ 960 px` = tablet or small window. Defined once as
  custom properties and documented; media queries repeat the literal numbers (CSS cannot use custom properties there).
- **Input:** `@media (pointer: coarse)` for sizes and sticky-hover fixes; `@media (hover: none)` to hide hover-only hints.
- **JS:** one small `ui`-only module: `isCoarse()`, `isPhone()` and a `useViewport()` hook (matchMedia listeners, no
  `window.innerWidth` reads scattered in components). `GemCard` and `TreeView` today read `window.innerWidth` directly;
  they switch to this.
- **Tokens:** `--tap: 44px`, `--gap`, `--font-body`, `--font-small`, `--safe-top/right/bottom/left` (from `env()`), so
  components use tokens and not literals.

### 3.2 One touch rule: preview, then commit

A single `Preview` pattern replaces hover on coarse pointers:

- **Items:** tap a row = select (the detail card, which already follows `selected`); the card has the buttons (equip,
  unequip, discard). Hover preview stays on desktop.
- **Reward:** the tap selects an offer and shows its card; a **Take** button commits; **Skip** stays. Today one tap takes
  the item with no preview; on touch this is the change with the most risk of regret, so it ships in P2 not later.
- **Skills / gems:** tap a gem = select and show the gem card in a sheet (instead of `GemTip`); tap a socket = place.
- **Tree:** tap a node = show its tooltip and the path preview docked at the bottom; a second tap on the same node, or an
  **Allocate / Refund** button in the dock, commits (section 3.4).
- **`title=` text:** a shared `Info` affordance. On coarse pointers a tap on an orb, flask, charge, hex chip, skill slot or
  chip opens a small popover with the same text and closes on the next tap. Implemented once (`useInfo(text)` returning
  props) so the ~25 call sites change by one line each.
- **Double click:** every double-click action gets a visible button; double click stays as a desktop shortcut.

### 3.3 Camp layout

- **Phone:** one column. The tab bar scrolls horizontally with scroll snap and the active tab is kept in view. The side
  panel becomes a sixth tab, **Next map** (offers, Auto-continue, Save and quit, Abandon), and a sticky bottom bar shows
  the camp header (class, level, XP) with Undo and the **Continue** button, so the main action is always one tap away.
  Notices (unspent points, pending craft) show as badges on the tabs, as they do now.
- **Tablet / small window:** tab body full width, side panel collapsible to a drawer.
- **Desktop:** unchanged.
- Inside each tab, multi-column layouts collapse by container, not by guess: `grid-template-columns: repeat(auto-fit,
minmax(min(100%, 160px), 1fr))`, columns become stacked sections (equipment, then inventory, then detail as a sheet that
  slides up on select), and fixed `min-width`s are removed on phone.

### 3.4 Tree

- **Pinch zoom** with two pointers (track both in the existing pointer handlers; no new library) and `+` / `−` / **Centre
  on start** buttons in the bar. The wheel stays.
- **Initial zoom** from the viewport: fit the allocated area plus the next ring, not a fixed 0.22; recentred on rotation.
- **Hit targets:** an invisible circle per node with a floor of ~22 px on screen (radius in tree units = 11 / k, capped so
  neighbours do not overlap at the 110-unit travel spacing). Hit test by nearest node within the radius on pointer up, so
  fat fingers do not need to land on the 5 px dot.
- **Preview, then commit:** first tap shows the dock (name, mods, path length, points needed, Allocate / Refund); the
  second tap on the same node, or the dock button, commits. Panning never commits (the existing `moved` threshold,
  raised from 4 to ~10 px on coarse pointers).
- **Tooltip:** on phone it becomes a bottom dock, not a floating box at `mx + 16` that runs off the screen.

### 3.5 Skills and gems

- Drag-and-drop stays on desktop and is hidden from the touch story. The select-then-tap flow (`sel` → `onSocketClick` /
  `place`) is the touch path; P5 checks it covers inv→socket, socket→socket, socket→inventory (unsocket) and replace, and
  fills any gap with a button ("Remove", "Make primary" already exist).
- Gem cards open in a sheet on select (same component as the item card sheet), not as a following tooltip.
- A pointer-based drag (Pointer Events with a long-press to start, so scrolling still works) is **deferred** unless the
  user wants it (section 7).

### 3.6 The map screen

- **HUD:** orbs scale with a CSS variable (104 px desktop, ~64 px phone); the skill bar, flasks and charges sit in one row
  under the orbs on phone; speed buttons (pause, speeds) become a compact column on the right edge. All use `--safe-*`.
- **Inspect:** on phone it is a bottom sheet (full width, max ~45% of the height) with a close button; tapping the map
  elsewhere closes it, as now.
- **Zoom:** `pickZoom` becomes a function of the world-view size in CSS pixels, not the raw width, and is **re-picked on
  `Phaser.Scale` resize**. A phone shows at least as many tiles around the player as the desktop's smallest supported
  window. The exact rule (candidates: snapped steps of 1, 1.5, 2; or fractional with `roundPixels`) is picked in P6 from
  screenshots; pixel art is shimmery between snaps.
- **Resolution:** try `resolution: min(devicePixelRatio, 2)` on the game config in P6; keep it only if the sprites stay
  crisp and the frame time does not regress.
- **Pointer picking:** `pick()` on `pointerdown` is fine for touch; check that a finger-sized radius is used for
  enemies, since a finger covers a ~30 px sprite.
- **Showcase and gallery:** they must not break the layout but are not touch-designed (out of scope).

### 3.7 Not changing

PWA install, offline cache, fullscreen API, wake lock, haptics, audio (the game has none yet), landscape-specific layouts.

### 3.8 Inventory tools

Three tools, one data model. "Level" below means the **map counter** (`run.map`), which advances by exactly 1 per level
(MAPS.md), so "10 levels ago" is "found 10 maps ago". This is an interpretation to confirm (section 7).

**Run state (P8, in `run`; all of it saved):**

| Field                        | What it is                                                                                                                                                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `unseen: number[]`           | Uids of every item, gem and flask picked up (map drops, reward picks, crafted or redeemed uniques) that the player has not yet looked at. Replaces `newLoot` as the record; the NEW tag now covers every kind, not only rares. |
| `acquired: Record<uid, map>` | The map counter when each item was picked up. Written wherever `unseen` is written. Items that exist in a v6 save get the map counter at load, so nothing old is cleaned up by surprise.                                       |
| `favourites: number[]`       | Uids of starred items. A uid is stable across equip, unequip and every craft, so the star follows the item.                                                                                                                    |

Stale uids (an item that was salvaged) are dropped when a camp round ends, **not** at the moment of discard, so that Undo of a
discard brings the star back. None of the three is part of the undo snapshot (starring is not an undo step).
`SAVE_VERSION` goes up by one with a migration; the MAPS plan (R-milestones) also edits `run.ts` and the save version, so the
two are ordered when work starts, never done in parallel.

**Pure functions (`inventoryOps.ts`, unit-tested):** `unseenItems`, `markSeen(uids | 'all')`, `toggleFavourite`,
`isFavourite`, `ageOf(run, uid)` and `oldItems(run, opts)`; `junkItems` now skips favourites.

**1. Everything since you last looked.**

- An item leaves `unseen` when the player **looks at it**: selects it (tap or click, not a hover), or presses **Mark all seen**.
  Leaving the tab, starting a map or hovering does not clear it.
- The Items tab gets a **New (n)** filter, the NEW tag on every unseen row (any kind), and the camp tab label shows the count.
  "Last map" stays, since it answers a different question (what did that map drop).
- Auto-continue still pauses for **unseen rares and uniques** (today's behaviour), not for every unseen normal item, which
  would stop it after every map. The pause now ends when those items are seen, not when the tab is opened.

**2. Clean up old items.**

- A **Clean up** button opens a panel (a sheet on phone, a dialog on desktop). Controls: **older than** _n_ levels (stepper,
  default 10, remembered in prefs); kinds (items, flasks, gems; default items and flasks); rarities (default normal, magic and
  rare; uniques are one tap away); **include unseen** (default off).
- The panel shows a live preview before anything happens: the count and Bone Dust yield, a breakdown by rarity, how many were
  **kept** and why ("12 favourites, 5 unseen, 3 newer than 10 levels"), and a scrollable list of what would go, each row
  inspectable. Nothing is selected for removal that is equipped, a favourite, or (by default) unseen.
- **Old** means `run.map − acquired[uid] > n` for an unequipped inventory item. Equipped gear and socketed gems are never in the
  inventory, so they cannot be affected.
- The action is the existing **salvage** (Bone Dust), in one `c.craft` call. Like every salvage it **cannot be undone**, which is
  why the preview and the confirmation carry the numbers. The existing "Salvage junk" button stays and also skips favourites.

**3. Favourites.**

- A star on every row and in the detail card (a 44 px tap target on touch; key `F` on desktop). Starred items are never offered
  by Clean up or Salvage junk. Single discard or salvage of a starred item asks first ("Unstar it first, or discard it
  anyway?").
- **Sorting:** a **Favourites** filter, and a **Pin favourites** switch (default on) that puts starred items on top of whatever
  sort is active, so "sort by Δ DPS" still works inside the starred group. (A single "favourites first" sort key would lose
  the secondary sort.)
- Starred items keep the star through crafting (uid-stable) and through equip and unequip. The bot never stars, so
  `botCraft`'s use of `junkItems` is unchanged.

**Scale.** `itemInfos(run)` scores every inventory item against the build on each change. With a few hundred items this may be
slow and the list long, so P9 measures it at 300 and 1,000 synthetic items first, memoises per `(uid, build)`, and
windows the list only if the measurement says so.

---

## 4. Milestones

Each milestone ends with `npm run check` and `npm run build` green, desktop screenshots unchanged, phone and tablet
screenshots of the screens it touched in `docs/screenshots/mobile/`, and a commit. Verification uses the in-app browser
(`preview_start`, then `resize_window` with the `mobile` preset, 375×812, then `tablet`) plus `read_page` for structure,
and `read_console_messages` for errors.

| #      | Name                    | Scope                                                                                                                                                                                                            | Done when                                                                                                                                             |
| ------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0** | Baseline and harness    | `docs/screenshots/mobile/` baseline of every screen at 360×740, 390×844, 768×1024 and 844×390; `npm run dev -- --host` note in README; a findings list per screen; sim behaviour when hidden; `device.ts`.       | Every screen in section 2 has a baseline picture and a one-line finding. `device.ts` and the breakpoint helper have unit tests.                       |
| **P1** | Foundation              | `viewport-fit=cover`; `100dvh`; safe-area insets on `.hud-*`; `touch-action: manipulation` on `#ui`; `overscroll-behavior: none`; no text selection or callout on game surfaces; tokens; text and target floors. | No horizontal page scroll on any screen at 360 px (title, class select, summary, codex). Inputs are ≥ 16 px. Desktop screenshots are pixel-identical. |
| **P2** | Input model             | `useInfo` for `title=` text; Reward preview-then-take; every double click and key has a button; Undo in the camp header; hover CSS made sticky-safe; remove direct `window.innerWidth` reads.                    | On a coarse pointer, every fact that is a tooltip today can be read, and no first tap commits an item, reward, tree node or gem.                      |
| **P3** | Camp layout             | One-column camp, scrolling tab bar, **Next map** tab and sticky bottom bar, collapse of Items, Skills, Workbench, Sheet, Codex, Summary, Title and ClassSelect, sheets for detail cards.                         | A whole camp round (read items, equip, spend a point, pick a map) can be done at 360×740 with no horizontal scroll and no clipped control.            |
| **P4** | Tree on touch           | Pinch zoom, +/−/centre buttons, initial fit, hit circles, dock with Allocate / Refund, raised drag threshold, rotation handling.                                                                                 | On a 375 px emulated phone, any node can be selected, previewed and allocated without zooming first and without misses on neighbours.                 |
| **P5** | Skills on touch         | Verify and complete the select-then-tap flow, gem card sheet, no dead hover paths; HTML5 drag stays for desktop.                                                                                                 | Every socket operation that drag does (place, move, replace, unsocket) can be done by taps alone.                                                     |
| **P6** | Map screen              | HUD for phone and tablet, inspect sheet, zoom rule and re-pick on resize, resolution test, finger-size picking, pause on hidden if P0 says it is needed.                                                         | At 375×812 the map shows enough of the surroundings to read a fight; HUD parts do not overlap; rotating keeps the view sensible; measured frame cost. |
| **P7** | Device pass and wrap-up | A real phone and tablet over the LAN; fix list; the crash-log copy fallback (clipboard needs a secure context, which an `http://` LAN address is not); quality toggle only if P6 measured stutter; docs.         | Notes of what was tried on a real device; DESIGN Appendix A and `docs/PROGRESS.md` updated; CLAUDE.md status line updated.                            |

| **P8** | Inventory data and logic | `unseen`, `acquired`, `favourites` in `RunState`; save version bump and migration; `markSeen`, `toggleFavourite`, `oldItems`, `ageOf`; `junkItems` skips favourites; `newLoot` replaced (Auto-continue pause kept for unseen rares and uniques); stale-uid pruning at round end. | Unit tests pass for: unseen across drops, reward picks, crafted and redeemed uniques; the age boundary (`> n`); favourites and unseen protected; a v6 save loads with acquisition = now; Undo of a discard restores the star. `npm run sim` shows the bot unchanged. |
| **P9** | Inventory UI | **New (n)** and **Favourites** filters, NEW tag on every unseen kind, star on rows and card, **Pin favourites**, **Mark all seen**, the **Clean up** panel with live preview and confirmation, tab badge, discard-a-favourite prompt, key `F`; list measured at 300 and 1,000 items. | A seeded 100-map fixture inventory can be cleaned in three taps: open Clean up, check the preview, confirm. Nothing starred, equipped or unseen is ever removed by default. Works at 360 px (sheet, 44 px targets). |

P1–P3 are the minimum for a playable phone game and could ship as a first release; P4 and P5 make the build screens pleasant;
P6 makes the run itself readable. P8 and P9 are independent of the phone work in purpose but share the Items screen with P2
and P3.

### Dependencies and order

P0 → P1 → P2 → P3 (P3 uses the tokens from P1 and the sheets and info popovers from P2). P4, P5 and P6 each need P1 and P2 but
not one another and can go in any order. P7 is last.

**P8 has no dependencies** (it is headless) and can go first, or right after the MAPS plan's `run.ts` work (R-milestones touch
the same file and the save version). **P9 follows P3**, so the Items screen is laid out once for phones and the Clean up
panel, the row targets and the star are built on the sheet and token work instead of being redone. If the inventory is the
pressing problem, P8 plus a desktop-only P9 can ship first and P3 then adapts them.

---

## 5. Risks

| Risk                                                                                             | Mitigation                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Touch rules leak into desktop and change its look                                                | Scope every rule by `(pointer: coarse)` or a width breakpoint; keep the desktop screenshots as the regression check                                            |
| Emulation hides real behaviour (the in-app browser throttles frames)                             | P7 is a real device; frame timing is judged there, not in emulation (DESIGN Appendix A, 2026-10-06 already notes the throttling)                               |
| Preview-then-commit slows desktop players                                                        | Desktop keeps single click for equip and allocate; the two-step flow is for `(pointer: coarse)` only                                                           |
| The tree is large (357 clusters, 27 keystones); pinch and pan on an SVG of this size may be slow | DESIGN's measure (0.16 ms per transform update) leaves room; if paint stutters, fall back to canvas as §9.2 already allows                                     |
| Fractional zoom makes pixel art shimmer                                                          | Snap to the existing 1 / 1.5 / 2 steps unless a screenshot says otherwise (P6)                                                                                 |
| iOS Safari quirks: `100vh`, input zoom, rubber-band scroll, no fullscreen API                    | `dvh`, 16 px inputs, `overscroll-behavior`, no dependence on fullscreen                                                                                        |
| A tap on a 30 px enemy sprite misses                                                             | Finger-sized pick radius in `pick()` on coarse pointers                                                                                                        |
| Clean up salvages something the player wanted (salvage cannot be undone)                         | Favourites and unseen items are excluded by default; uniques are opt-in; a live preview lists exactly what goes, with counts and Bone Dust, before the confirm |
| The age rule surprises ("older" by map, not by item level)                                       | The panel says "found more than _n_ maps ago" and shows the age of each row in the preview; the alternative is decision 10                                     |
| Old saves: no acquisition record, new fields                                                     | Migration sets acquisition to the load-time map counter, so nothing is old on day one; `unseen` starts empty; version bump with a test                         |
| P8 collides with the MAPS plan (both edit `run.ts` and the save version)                         | Order them when work starts; one migration per version, never two branches of `SAVE_VERSION`                                                                   |
| `unseen` grows unbounded if the player never looks                                               | Mark all seen; the New list is capped for display only; Clean up leaves unseen alone by default but can include it                                             |
| Long inventory slows the Items screen                                                            | P9 measures at 300 and 1,000 items first, memoises `itemInfos` per `(uid, build)`, windows the list only if needed                                             |
| Long runs on a phone: battery, heat                                                              | Speed buttons already exist; measure in P7 and add a quality toggle (fewer lights, no filters) only if it is needed                                            |

---

## 6. Testing

- **Pure logic is unit-tested** (vitest, no DOM needed): breakpoint and zoom helpers, tree hit testing (nearest node within
  a screen-space radius for a given `k`), pinch-zoom maths, the preview-then-commit state machine for Reward and the tree.
- **Screens are checked in the browser** at the four sizes in P0, with `read_page` for structure (no control outside the
  viewport, no element wider than the viewport, every button reachable) and screenshots committed under
  `docs/screenshots/mobile/`.
- **A small `scripts/` check** (optional, P1): load each screen at 360 px and report any element whose bounding box exceeds
  the viewport width, so layout regressions are caught by a command rather than by eye.
- **Inventory logic (P8) is tested without a DOM:** fixtures build a run with items found at known map counters and check
  `oldItems` at the boundary (exactly _n_ old is kept, _n_ + 1 goes), kind and rarity filters, favourites and unseen
  protection, `markSeen`, Auto-continue's pause rule, craft keeping the star, Undo of a discard keeping the star, salvage
  clearing undo, and a v6 save migrating. A property test checks that `oldItems` never returns an equipped item, a
  favourite, or (by default) an unseen one, for random runs.
- **Inventory UI (P9):** the Clean up preview and the confirmation text are built from one pure function, so what the panel
  shows is what the action removes (tested). A browser check at 360 px and desktop covers the three-tap clean-up.
- **Desktop regression:** the existing screenshots (`docs/screenshots/m*.jpg`) are retaken after P1 and P3 and compared by eye.

---

## 7. Decisions

Recommended defaults are marked; say if one should change.

1. **Orientation.** _Recommend: portrait first, landscape works but is not designed._ Camp is a list-and-forms game and
   suits portrait; the map suits landscape, so the map keeps working in both and the camp does not lock the orientation.
2. **Smallest supported width.** _Recommend: 360 px (the common Android floor), with 320 px not broken but not tuned._
3. **Drag-and-drop.** _Recommend: keep it on desktop only; touch uses select-then-tap._ A pointer-based drag with
   long-press is a stretch item if tap-to-place feels slow.
4. **Reward behaviour on touch.** _Recommend: tap to preview, button to take._ Alternative: keep one tap and add an Undo
   toast (the camp already has Undo for reward picks).
5. **Performance.** _Recommend: measure first (P6, P7); no quality toggle unless frame time on a mid-range phone is poor._
6. **Resolution.** _Recommend: try `min(devicePixelRatio, 2)` in P6 and keep it only if it looks better and does not cost
   frames._
7. **Side panel on phone.** _Recommend: a **Next map** tab plus a sticky Continue bar._ Alternative: a bottom drawer.
8. **PWA / home-screen install.** _Recommend: out of scope for this plan; easy to add afterwards (manifest + icon)._
9. **What "levels old" means.** _Recommend: maps since pickup (`run.map`), which is 1 per level._ Not the item's own level.
10. **Item level instead.** _Alternative, not recommended as the only rule:_ "item level more than _n_ below the current map".
    It needs no new data and never touches a freshly found low-level item, but it does not match "older than _n_ levels behind
    where they are now" and would junk a recent find of a low-level base. It could be added as a second option in the panel.
11. **Clean up default scope.** _Recommend: items and flasks, normal, magic and rare, favourites and unseen kept; gems and
    uniques are opt-in._ Gems do not get worse with age (their level follows the character), and uniques are rare enough
    that one extra tap is cheap next to an irreversible salvage.
12. **Action: salvage or discard.** _Recommend: salvage (Bone Dust), as "Salvage junk" does._ Discard gives nothing back.
13. **Unseen items and Clean up.** _Recommend: excluded by default, with an "include unseen" switch._ This keeps the promise
    that you can see everything acquired since you last looked.
14. **Favourites and sorting.** _Recommend: a Favourites filter and a Pin favourites switch (default on)_ over a single
    "favourites first" sort key, which would replace the secondary sort. Say if you want the sort key as well.
15. **Starring equipped gear.** _Recommend: not needed;_ the star stays on the uid, so an item unequipped later is already
    protected, but there is no star control on an equipped slot.
16. **Default _n_.** _Recommend: 10, remembered per player._

---

## 8. Not in this plan

PWA install and offline play, native wrappers, a gamepad or keyboard layer for phones, new gameplay controls on the map
(the run stays hands-off), touch-first versions of the showcase, gallery and dev tools, and any change to balance or to
the headless modules other than the inventory state in P8. Also out of scope for the inventory tools: multi-select and bulk
actions beyond Clean up, loot-filter style auto-salvage rules ("never keep normal items below item level _x_"), stash
tabs, and an item-level clean-up rule (decision 10) as the primary rule.

---

## 9. Progress

All of it is committed on `main`. The milestones were built in the order P0, P1, P2 and P3, P4, P5, P8, P9, P6 and the rest of
P3 and P7 (P8 had to wait for the MAPS plan to finish with `run.ts`).

| #      | State                  | What was built                                                                                                                                                                                                                                                                                                                                                                                             |
| ------ | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0** | done, except one item  | `src/ui/device.ts` (breakpoints 600 and 960, `layoutFor`, `isCoarse`, `useViewport`) with tests; README note on `npm run dev -- --host`; baseline and result screenshots at 360×740 in `docs/screenshots/mobile/`; the findings below. **Not done:** photographs at 390, 768 and 844×390 (the layouts were checked at 360 and 768 by script and by eye, not photographed).                                 |
| **P1** | done, except one item  | `src/ui/mobile.css`: `viewport-fit=cover`, `100dvh`, safe-area tokens, `overscroll-behavior`, `touch-action`, 44 px targets and 16 px inputs on coarse pointers, a 12–13 px text floor, no selection on the HUD, tree and canvas, phone padding and top-aligned scrolling screens. **Not done:** the optional overflow-check script.                                                                       |
| **P2** | done                   | `src/ui/info.tsx`: `infoProps(text)` is a `title` on a mouse and a tap popover on a coarse pointer, used for orbs, charges, hex chips, flasks, skill slots, chips and the arriving line; Reward previews on the first tap and a **Take** button commits; hover is ignored on touch (a tap emulates it and it never ends); sticky hover styles reset. Undo is in the camp bar.                              |
| **P3** | done                   | Camp below 960 px: a scrolling tab bar, a **Next map** tab (the side column), a bottom bar with the class, Undo and Next map; the item card is a bottom sheet with a close button and sticky buttons; Items, Skills, Workbench, Sheet, Codex, Summary, Title and Class select reflow at 360 px with no horizontal overflow.                                                                                |
| **P4** | done                   | `TreeView`: pinch zoom, +, − and Centre buttons, a view fitted to the build on small screens, taps that reach the nearest node within 22 px (`treeHit.ts`, unit-tested), first tap shows a dock with Allocate or Refund, the second tap or the button commits, a larger drag threshold, the view keeps its centre when the area resizes.                                                                   |
| **P5** | done                   | Gems by tap: tap a gem or a placed gem for a sheet with the card and **Socket in the best place**, **Remove** and **★ Make primary**; tap a socket to place or move; no HTML5 drag or hover tooltips on touch. Drag and drop is unchanged on desktop.                                                                                                                                                      |
| **P6** | done, except two items | Phone HUD (64 px orbs, one centre column, speed buttons down the right edge, Abandon under the status line), the enemy card as a sheet above the orbs, pixel zoom 2 / 1.5 / 1 by width (1 under 640 px) that follows resizes (`MapScene` and `resize()`), finger-sized picking (14 px). **Not done:** the `resolution` experiment (Phaser 4.2.1 has no such game option) and frame timing on a phone (P7). |
| **P7** | started                | `copyText` (`src/clipboard.ts`) falls back to a textarea when `navigator.clipboard` is missing, used by Copy save and the crash report. **Not done:** a real phone and tablet over the LAN, and a quality toggle (nothing measured yet says it is needed).                                                                                                                                                 |
| **P8** | done                   | `src/run/found.ts`: `unseen`, `acquired` and `favourites` in `RunState`, `noteFound`, `markSeen`, `toggleFavourite`, `ageOf`, `oldItems`, `pruneFound`; `newLoot` is gone; `SAVE_VERSION` 7 with a 6→7 carry-over (a real save was migrated in the browser); `junkItems` skips favourites; Auto-continue pauses for unseen rares and uniques.                                                              |
| **P9** | done                   | Items: **New** and **★ Favourites** filters with counts, a star on every row and in the card (key `F`), **Pin ★**, **Mark all seen**, items are seen when selected, **Clean up…** (`CleanUp.tsx`, `cleanUp.ts`) with a live preview, kept counts and a confirmation, a prompt before discarding a favourite. At 300 items opening the tab took 63 ms, at 1,000 items 114 ms.                               |

**Findings at 360×740** (the baseline, before any of this):

| Screen       | Finding                                                                                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Title        | Fits. The demo buttons touched the screen edges and the 64 px heading was wide.                                                                                   |
| Class select | The grid was 624 px wide: the screen scrolled sideways and two classes were cut off.                                                                              |
| Codex        | No horizontal overflow; every row was under 44 px tall and the search input was 13 px.                                                                            |
| Camp         | The tab body was 67 px wide: the 260 px side column took the rest.                                                                                                |
| Map          | Playable, but the orbs wrapped onto separate rows and took half the height; the Abandon button overlapped the status line.                                        |
| Hidden tab   | `onFrame` clamps a frame to 0.1 s and `requestAnimationFrame` stops while the page is hidden, so a map pauses by itself. No `visibilitychange` handler is needed. |

**Decisions made while building** (also in DESIGN.md Appendix A):

- The inventory migration is a carry-over for version 6 only. Older saves are still rejected, as the game does for every
  other version bump; version 6 was the one players have today.
- The pixel zoom is 1 under 640 px, not 1.5: at 360 px it shows about 360 world pixels across instead of 240, enough to see
  the pack ahead. The figures are small but readable (`p6-360-map-hud.jpg`).
- A coarse pointer changes how taps work (preview, then commit); a small width changes layout. A laptop with a touch screen
  keeps the desktop layout and gets the touch rules.
- `oldItems` counts an item as old when it was found MORE than _n_ levels ago, by the map counter; an item that exists in a
  version 6 save counts as found on the level the save was loaded on.
- Clean up defaults: items and flasks, normal, magic and rare; gems and uniques are opt-in; unseen items are kept unless
  asked for; favourites are never chosen.

**What is left:** the real-device pass (P7), photographs at the other widths (P0), the optional overflow-check script (P1),
frame timing on a phone (P6), and the decisions in section 7 that a real device may change.
