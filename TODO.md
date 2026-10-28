# TODO

Loose ends to come back to. Plans with milestones live in `docs/`; this is the short list.

## Writing

- **Rewrite the class blurbs** (`style` in `src/data/classes.ts`). All six are plain weapon descriptions ("Two daggers, quick
  and close."). They should say how each class feels to play, in the game's voice.
- **Spread the overwrought voice.** "Duel for your damned soul's fate" (`DUEL_TITLE`, `src/ui/Rivals.tsx`) is the tone we want:
  Diablo-style hellfire silliness about souls, damnation and demons. Places it could go: screen headings, the death screen,
  the run summary, stop names and flavour, button labels at big moments (New Run, Abandon the run). Rules text stays plain
  and short (CLAUDE.md, "In-game text is concise"); the voice belongs in names, headings and flavour.
- **Unique flavour lines** (`flavour` in `src/data/uniquesGen.ts` and the hand-written unique files). Too many share one
  aphorism shape ("It does not strike; it unmakes.", "Winter, with a handle."). Read twenty in a row, they feel generated.
  Start with the uniques that drop in the first ten maps.
- **Monster advice** (`src/data/monsterInfo.ts`). Most lines follow one formula ("…: evasion, block and reach help").
  Vary it.
- **Reprieve cards** (`src/ui/Satchel.tsx`). "Always ready; used up when it saves you." under every reprieve repeats the
  card's own text and the first-use tip. Cut it, or decide it earns its place.

## Bone Dust

- **More ways to earn and spend it.** Bone Dust is the only money (docs/WAYSIDE.md), but it comes almost only from
  salvage and goes almost only to the stops. Plan more sources and sinks so it is a real economy.
- **Show how much you hold.** Outside a stop's shop the total is shown nowhere: the camp and the HUD don't show it, and
  the Workbench pouch that does is closed (`CRAFTING_OPEN = false`). It should be visible in camp at least.

## Interface

- **A palette swap setting** (asked 2026-10-26). About a day's work for a clean "swap the whole palette". What exists:
  about 25 colour variables in `src/ui/leaf/leaf.css` and the painted panels' ramps in `src/data/palette.ts`. What it
  would take: move the roughly 390 hard-coded hex colours in the CSS files (`styles.css`, `items.css`, `leaf/hud.css`,
  `leaf/leaf.css`, `leaf/items.css` and others) onto those variables; key the cached panel paintings
  (`src/ui/leaf/painter.ts`, kept between sessions) by palette; add a setting. Item rarity and damage-type colours are
  the bulk of the cleanup. The base theme (backgrounds, gold, text) swaps cheaply.

## Meta progression

- **A winner's heirloom** (asked 2026-10-26). A save that wins its run passes one item on to a future character, as a
  first step of progression from one run to the next.

## Balance

- **Thunder Rebuke and Slag Blow may be too strong early** (noted 2026-10-27). Both match the reference data (the strike
  multipliers, added damage, conversion and Slag Blow's molten balls), so it is not a translation error, but they lead the
  early melee attacks: against a stationary dummy at character level 1 Slag Blow does about 47 damage a second and Thunder
  Rebuke 30 (Crushing Blow 24); against a pack of five, 145 and 122. Slag Blow stays ahead at level 12. Thunder Rebuke's
  aura grows to 12-220 lightning at gem level 20, so it matters more later. Not yet checked: the same comparison at gem
  level 20, and the reference's Frost Sunder and Primal Strike flat damage tables, which sit well above both.
