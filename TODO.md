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
