# Gold Leaf: the interface style guide

The interface style Bob is moving to (the owner, 2026-10-24), worked out in the style study
([index.html](index.html), Gold Leaf; [paint.js](paint.js) paints it) on the Character and Next map tabs. This guide
says what the style is, how those two pages were made, and the rules for doing the other tabs the same way. The
**Now** style in the study is the game as it was, for comparison.

## 1. The idea

Early Christian art (the mosaics and gilded panels of the fifth to fifteenth centuries) **as it looks today**, after
fifteen hundred years: worn gold, flaked paint, grime, cracks. It is not a copy of mosaic: what is taken is the gold leaf
ground, the colour scheme, and the approach to detail, lines and scale. Large calm fields of strong colour carry the
information; fine ornament lives only at their edges, so a dense screen reads as rich from afar and clear up close.
It evokes Christian art loosely so that the game's themes of damnation feel at home; it does not need to be historically
coherent.

**Crunchy like the map.** Every surface is painted at half resolution and scaled up with hard 2 px pixels (3 px was too
crunchy). The text on top is smooth.

## 2. What the owner decided (keep to these)

| Decision                                                                                   | Why                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Grenze for all text, Jacquard 24 for headings and names                                    | Clarity beats matching the pixels; pixel fonts were tried (Jacquarda Bastarda 9, Jersey 10) and rejected for long text. No Roman capitals or inscriptions. |
| No tiny text                                                                               | Small text looks bad on the crunchy ground. Change the layout instead of shrinking words (see 6).                                                          |
| Gold is the wall; information sits on lapis panels covering about two thirds of the screen | Lapis with light text stays readable over long sessions.                                                                                                   |
| Everything textured, everything old                                                        | Nothing flat and nothing new; but wear stays away from text.                                                                                               |
| No visible repetition                                                                      | The wall, the tab band and the footer are each painted once at their own size. Small border strips may repeat (ornament does).                             |
| Some red bole showing, not much                                                            | "Just a little too much" at a flaking rate of 7%; 4.5% on the wall is right.                                                                               |
| Gold rims stay nearly whole and have no black outline                                      | Rims pop from the worn wall by being whole gold that darkens at its outer edge, plus a pixel shadow. A hard ink line round gold was disliked.              |
| The open tab is clean gold                                                                 | Flaked gold made its label hard to read.                                                                                                                   |
| Pearls and gems are the least liked border                                                 | Use them sparingly; wave scrolls under section headings instead.                                                                                           |
| Arch pearls alternate white and gold                                                       | All white was too white.                                                                                                                                   |
| The life, energy shield and mana medallions                                                | Loved; the model for any "group of a few big numbers".                                                                                                     |
| Leave out text that the player does not need                                               | See 6.                                                                                                                                                     |

## 3. Palette

Every colour comes from a **ramp** of darker to lighter steps (`RAMPS` in paint.js). The painter snaps every pixel to
the nearest step, so shading always comes out as hard bands. The owner called the palette excellent; add a ramp before
adding a loose colour.

| Ramp      | Use                                                                                      |
| --------- | ---------------------------------------------------------------------------------------- |
| gold      | the wall, rims, the open tab, gold ornament, gold numbers (`--gold-hi #e2c681` for text) |
| bole      | the red clay under flaked gold (never drawn on purpose)                                  |
| plaster   | what worn paint shows (never drawn on purpose)                                           |
| ink       | thin lines inside shapes (between a rim and its field), border grout, text shadows       |
| lapis     | panels, the tab band, buttons, plaques, mana, intelligence                               |
| pearl     | pearls, light text (`--pearl #e6dfca`)                                                   |
| vermilion | life, strength, fire, warnings, the primary button                                       |
| green     | the footer ground, wreaths, dexterity, chaos damage                                      |
| teal      | cold                                                                                     |
| straw     | lightning (a pale field; its text is dark)                                               |
| porphyry  | stops, the estimates plaque, chaos resistance                                            |
| violet    | lightning damage in the damage-type bar                                                  |
| sky       | energy shield (a pale field; its text is dark)                                           |

Text colours on lapis: pearl for labels, gold-hi for values, `--muted #a8adc4` for secondary words, `--dim #7c84a4`
for values at their default (×1.00 rows), `--madder #dca196` for map modifiers and "short of the maximum", `#a3d293` for
gains. Dark text on gold is `--on-gold #1a1208`; use it only for large headings ("Camp"), never for small lines (put
those on a plaque, see 5).

## 4. The painter (paint.js)

A surface is painted in four steps; the same pipeline makes every element, so new elements look the same for free.

1. **Draw clean shapes** at art resolution (screen size / `P`, `P = 2`) with plain canvas calls: fills, arcs,
   ellipses, bezier strokes. Draw with ramp colours.
2. **Snap** each pixel to the nearest ramp step (`nearest`). Anti-aliased edges and gradients become hard steps:
   a radial gradient (`lit`) gives a field its light from the top left as pixel bands.
3. **Mottle** (`age`): move each pixel up or down its ramp by smooth noise at two scales plus pixel noise
   (`texture` scales it: 1 for the wall, 0.55 for panels so text stays clear). Grime: darker patches, and darker
   pixels within 2 of an edge (this is also what gives the gold rims their worn outer edge).
4. **Age** (`age`):
   - **Flakes** (`loss`, the share of flaking pixels): blotchy noise picks the most exposed pixels; gold flakes to
     bole, paint to plaster; a flake has a dark lip above it and a lit one below. `edgeBias` and `edgeReach` push
     flakes towards the edges of a panel (and so away from its text); `blotch` sets the flake size (7 on the wall, 4
     elsewhere). `goldLoss` scales flaking of gold inside panels (0.08: rims stay whole; 0 for the open tab and the
     damage bar).
   - **Cracks** (`cracks`, `crackLen`): short wandering walks to the darkest step, sometimes branching.
   - **Glints**: a few gold pixels at the top step.
   - **Shadow** (`shadow`): transparent pixels below and right of the shape get a dark pixel shadow, solid next to it
     and dithered one step further. Panels are drawn 2 or 3 art px inside their box to leave room for it.

The result is a PNG set as the element's background at `W*P x H*P` px with `image-rendering: pixelated` (inherited from
`.frame`). Each element is seeded by its selector and index, so it keeps its look across sizes; paintings are cached by
size, and the page repaints after fonts load and when the frame resizes.

**Element kinds** (`JOBS`, matched by selector, first match wins):

| Kind        | What it draws                                                                                                                                                                                                                                                                                     | Used for                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `wall`      | flat gold, heavily aged (loss 0.045, big blotches, cracks by area)                                                                                                                                                                                                                                | the whole screen, painted at its full size                                                                                                  |
| `field`     | a flat ramp, lightly aged, no rim                                                                                                                                                                                                                                                                 | the tab band (lapis), the footer (green)                                                                                                    |
| `panel`     | gold rim (2 steps, or 1 when `thin`), an ink line, the field lit from the top left; options `arch` (a round arch, radius up to 84 art px), `pearls` (white and gold round the arch and down the sides), `foot` (a tile row along the bottom), `wave` (wave scroll top and bottom; no longer used) | stat panels, offer niches (lapis; stops porphyry), plaques, buttons, the warning (vermilion), the estimates (porphyry), the open tab (gold) |
| `medallion` | a field disc lit from the top left, a ring of pearls, an ink line, a gold rim; `wreath` adds leaves and red fruit; `stars` adds gold stars (mana)                                                                                                                                                 | life, energy shield and mana (with wreaths, 208 px); attributes and resistances (104 px)                                                    |
| `mix`       | a gold-rimmed strip of small tiles, each run in its damage type's ramp                                                                                                                                                                                                                            | the damage-type bar of an offer                                                                                                             |

**Border strips** (`STRIPS`, painted once, set as CSS variables `--s-<name>`, repeat along x): `wave` (under every
section heading), `triangles` (green and gold, under the tab band), `tiles` (coloured tiles with ink grout, the top of the
footer and the foot of a niche), `beads` (pearls and gems; least liked, avoid). A strip's width must be a whole number of
its pattern's periods.

## 5. Components, as built

- **Tabs:** a lapis band (painted field), a row of triangles under it; tab labels in Jacquard on the band; the open tab
  is a clean gold plaque with dark text.
- **Footer:** the green ground, a tile row along its top.
- **Groups of a few big numbers** (pools, attributes, resistances): medallions in a centred row; the pools large, in
  wreaths, on a row of their own; the others small, side by side. Inside: the name and the number only. Any note (a
  multiplier, a maximum, "of 499") goes on a **plaque** hung from the medallion's foot, overlapping its rim, in light text
  at full body size.
- **Plaques:** a thin-rimmed lapis panel round one short line; use one whenever a line must sit on the gold (the next map
  line, medallion notes).
- **Stat panels:** a lapis panel per column; each section a Jacquard heading in gold over a wave strip; rows with
  faint gold hairlines; values that are at their default dimmed.
- **Offers:** arched niches of equal height in a row (one column on a phone); the map name in Jacquard in the arch; a
  stop is a porphyry niche. The warning is a vermilion plaque. Faction names are plain coloured text (no pills).
- **Buttons:** thin-rimmed lapis panels (vermilion for the primary one); hover brightens.
- **Small bars** (life, mana, XP, flasks): lapis texture, a gold ring, a hard offset shadow (CSS box-shadow, no ink
  outline).
- **Tooltips:** a dotted gold underline marks a word with a tip; the tip is a lapis box with a gold ring, shown on hover
  and on tap (focus).

## 6. Text and layout rules

- **One body size** (17 px Grenze); secondary lines differ by colour, not size. Headings 28 px Jacquard; big numbers and
  the screen title 48 px Jacquard. The only smaller text is inside small medallions on a phone (14 px), where nothing
  larger fits.
- **Never shrink words to fit; change the layout:** the offer table became a grid of two columns and three rows, each value under its label (one column of pairs left too much empty space between label and number); medallion
  notes moved to plaques; small text on the gold moved onto plaques.
- **Cut what the player does not need**, in the spirit of "in-game text is concise": on the offer cards the "hard to …
  soft to …" line and the list of monster types went (the factions stay), and a map type or density shows only its name,
  its explanation in a tip. Scrolling a little more is fine.
- **Hard drop shadows on text** (2 px, ink) on lapis and on painted fields.
- Everything centred where it is a group (medallion rows, the camp head, plaques); measures in even pixels.
- Wear never sits under text: panels have low texture and their flakes gather at the edges.

## 7. Doing another tab

1. Add the tab's markup to the study with real data (transcribe it from the live game) and make **Now** match the game.
2. Build it from the components in 5; a new kind of element gets a `JOBS` line, or a new painter if no kind fits.
3. Apply the rules in 6: cut text first, then lay out so no word shrinks.
4. Check it at desktop and phone width in the browser pane (emulate about 1100 px wide; the pane scales the page, so
   pixels look softer in screenshots than they are).

## 8. The other tabs (first pass, 2026-10-24)

Each lives in its own file beside the study ([strategy.js](strategy.js), [skills.js](skills.js), [items.js](items.js),
[tree.js](tree.js)) and is styled in [screens.css](screens.css); their painters are in [paint-more.js](paint-more.js)
(`window.leaf` in paint.js lets other files add element kinds and jobs). They are Gold Leaf only, and they work: picks,
swaps, undo, taking passives.

- **Strategy:** numbered panels, the number in a small gold medallion; menus are plaques (`.sel`); each intro is one line
  with the rest in a tip.
- **Skills:** a gem is a stone in a gold setting (round for a skill, a lozenge for a support; `azure` was added for
  intelligence, lapis on lapis did not read); linked sockets hang on a gold chain; the level sits on the stone. Pick a bag
  gem and the empty sockets say "Place it here".
- **Items:** the worn gear sits in an arched niche on the **shadow of a damned soul**, arms hanging, by body position
  (not a cross: the player is in hell, not Christ). Picking a bag item lights every slot it fits and aims at the best;
  the new and the worn item open as a **diptych** with the result on a porphyry plaque; the button names the outcome
  ("Wear in Off hand", "Spidersilk Wall goes to the bag") and a status line with Undo follows. Card headers carry the
  rarity (plaster, sky, gold, vermilion). On a phone the gear folds into one line and the comparison is a sheet.
- **Passive tree, the starry vault:** a worn lapis sky with a gold rim; taken passives are gold stars and gold lines,
  the rest enamel in the colour of what they give (colour is the family, the glyph says exactly what). Drawn each frame
  on a half-resolution canvas (sprites painted once per kind, colour, state and size; lines one art pixel, alpha snapped)
  and scaled up 2x; words on top, placed greedily where they fit, most wanted first, runs of identical small nodes
  sharing one label ("+6 Dex, +6 Int ×6"). Tap to look, tap again to take, on desktop too.

## 9. Open

- The empty stop niche wants an emblem or a figure.
- Medallion pearls are still all white (the arches alternate).
- Moving the style into the game: the painter is DOM and canvas code, so it belongs in `src/ui` (or `src/render`);
  paintings are deterministic from a seed, so they can be cached per element size.
