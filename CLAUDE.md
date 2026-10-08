# Bob (repo: Auto) — notes for Claude

- The design spec is [docs/DESIGN.md](docs/DESIGN.md), and it is authoritative. Progress is tracked in
  `docs/PROGRESS.md`. Record any decision the spec doesn't cover in DESIGN.md Appendix A.
- **IP policy (DESIGN.md §3):**
  - Never copy or translate **code** from Path of Building or any other project.
  - The PoE wiki and Path of Building **data** may be consulted, and scripts may draft entries from them (revised
    with the user on 2026-10-07). Reference data lives in `docs/coverage/` and `scripts/coverage/`, never in `src/`.
  - Every player-visible name and text in `src/` is our own; `src/data/ip.test.ts` checks them against the reference
    list. No PoE art or audio.
- **Coverage plan:** [docs/COVERAGE.md](docs/COVERAGE.md) (milestones C0–C7): C0 to C6 are done (gems 93%, uniques 98% of
  the 3.9.0 list); C7 is the integration pass. `npm run coverage` prints where it stands, and `docs/coverage/README.md`
  describes the data and tools. Every new droppable gem or unique needs a line in `docs/coverage/map.json`. New content
  goes through decision files (`docs/coverage/gems/`, `docs/coverage/uniques/`; see `docs/coverage/AUTHORING.md`) and
  `npm run coverage:emit` / `coverage:emit-gems`, never by editing the generated `src/data/*Gen.ts`. Items are never
  edited in place (what an item gives is remembered by object).
- **Mobile and inventory plan:** [docs/MOBILE.md](docs/MOBILE.md) (milestones P0–P9): make every screen usable in phone and tablet
  browsers (touch rules, small-screen layouts, tree pinch zoom, HUD and map zoom), plus inventory tools (persistent New list, Clean up old items, favourites; P8–P9). P0 to P9 are built; the real-device pass is left (its section 9).
- **Architecture boundaries (§14.2):**
  - `core`, `data`, `mods`, `calc`, `gen`, `sim` and `run` are headless: no Phaser, Preact or DOM.
  - No `Math.random`, `Date.now` or `performance.now` outside `render` and `ui`.
  - Use the seeded RNG in `src/core/rng.ts`.
- **Before every commit:** `npm run check` and `npm run build` must both be green. Never weaken tests to pass.
- **Git:** commit at milestone ends. Don't push by default; push when the user asks. Never add a remote.
- **Environment:**
  - Windows, Node 24.
  - In PowerShell, refresh PATH first:
    `$env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")`
  - Dev server: `npm run dev` on http://localhost:5173 (strict port).
- **Map choice plan:** [docs/MAPS.md](docs/MAPS.md) (milestones R0–R7): three offers per level, level offsets of ±2, carry-over of life, mana, ES and flasks, Abandon, Respite and map types. R0 to R6 are built as a first pass (the numbers are not tuned; see `docs/PROGRESS.md`); R7, the phase-2 types, is not. Decisions go in DESIGN.md Appendix A.
- **Enemy variety and difficulty plan:** [docs/ENEMIES.md](docs/ENEMIES.md) (milestones E0–E7): built (section 14 says what changed and
  what the bot measured). Offer sets are drawn by weight with distinct leading factions, rooms are packs with shapes by role
  (`src/gen/packs.ts`), the camp card says who is on the map (`src/run/themeInfo.ts`), monsters have kits and palettes, behaviours
  are abilities (`src/data/abilities.ts`, `src/sim/abilities.ts`), there are eight factions, and difficulty is a run setting
  (scaling, base, variance; `src/data/difficulty.ts`; default scaling 1.75) with a Debug panel (dev builds or `?debug`).
  `scripts/simpar.sh` runs the bot sim on all cores. Decisions go in DESIGN.md Appendix A.
- **Roster plan:** [docs/ROSTER.md](docs/ROSTER.md) (milestones V0–V10): built (section 14 says what, and what changed). Bone is the
  Ossuary's alone (`BodyStyle`, `src/render/style/bodies.ts`); monsters attack in shapes with warnings on the ground
  (`src/data/shapes.ts`, `src/sim/telegraph.ts`); every type is an archetype (`src/data/archetypes.ts`) with a defence profile
  (`src/data/defence.ts`, `src/calc/matrix.ts`: a type's `lifeMult` is its toughness and its life pays for its defences), a
  movement style and senses (`src/data/movement.ts`, `src/sim/movement.ts`), maybe a rhythm and phases (`src/data/phases.ts`),
  and packs flank and rally (`src/sim/packs.ts`). There are ten factions and 48 types, including the Drowned and the Emberborn.
  `npm run sheet` draws every type (the review tool for a body), `npm run matrix` prints the build matrix.
- **Status:** M0–M7 of DESIGN.md are complete (see `docs/PROGRESS.md`). Further work is the stretch list
  or balance changes. Balance constants live in `src/data/constants.ts`. `npm run sim` (headless bot balance
  report) is useful for checking a balance change but is not required after every one; `--write-xp` regenerates
  `src/data/measuredXp.ts` if you want XP pacing re-measured.
- **Bash tool quirk:** in Bash, Node is not on PATH; use `export PATH="/c/Program Files/nodejs:$PATH"`.
  Backslash escapes in heredocs can be collapsed; write files with the Write tool instead.

## Visual style

The map is rendered as isometric Grimdark: crunchy pixel art, a diagonal 2:1 camera, real-time lights and
particles (`src/render/styles/grim/`, shared figure rig in `src/render/style/`). Three other styles were
explored and removed; see `docs/VISUAL_STYLES.md`. _Showcase_ mode on the Title screen auto-plays a demo
(N = next class). Uncaught errors are saved to `localStorage['bob.crashlog']` and shown as a copyable report
(`src/crashlog.ts`). Known bugs to revisit are in `docs/BUGS.md`.
