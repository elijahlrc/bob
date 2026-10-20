# Bob (repo: Auto) — notes for Claude

- The design spec is [docs/DESIGN.md](docs/DESIGN.md), and it is authoritative. Progress is tracked in
  `docs/PROGRESS.md`. Record any decision the spec doesn't cover in DESIGN.md Appendix A.
- **IP policy (DESIGN.md §3):**
  - Never copy or translate **code** from Path of Building or any other project.
  - The PoE wiki and Path of Building **data** may be consulted, and scripts may draft entries from them (revised
    with the user on 2026-10-07). Reference data lives in `docs/coverage/` and `scripts/coverage/`, never in `src/`.
  - Every player-visible name and text in `src/` is our own; `src/data/ip.test.ts` checks them against the reference
    list. No PoE art or audio.
- **Gem spirit audit:** [docs/AUDIT-GEMS.md](docs/AUDIT-GEMS.md) (2026-10-08): which gems kept the reason to use them in the reference game and which were flattened, with the engine gaps ranked. Read it before adding or reworking a gem. The plan that repaired them is [docs/SPIRIT.md](docs/SPIRIT.md) (milestones S0–S14, all built, 2026-10-08); the ledger `docs/coverage/spirit.json` (`npm run spirit`) says per gem what its loop is and whether Bob keeps it, and `covered` in `docs/coverage/map.json` now means `faithful` there. A skill's own behaviour is a field of its gem (`SkillFx`, `src/data/gems.ts`) carried out in `src/sim/skillFx.ts` and `src/sim/supportFx.ts`, with its card text in `src/ui/gemFx.ts`.
- **Weapon affix audit** (2026-10-16): [docs/AUDIT-WEAPON-AFFIXES.md](docs/AUDIT-WEAPON-AFFIXES.md) compares every weapon affix with the 3.9 tables (Path of Building v1.4.155 `ModItem.lua`, kept outside the repo). The inconsistencies were fixed the same day; its section 10 lists the open design questions. A weapon base says whether it is a spell weapon (`ItemBase.spellWeapon`), the kind of weapon is an affix tag (`itemTags`), and `FamilyDef.weights` makes a family rarer on weapons only.
- **Armour and jewellery affix audit** (2026-10-16): [docs/AUDIT-ARMOUR-AFFIXES.md](docs/AUDIT-ARMOUR-AFFIXES.md), the same comparison for helmets, gloves, boots, body armour, shields, rings, amulets, belts and quivers. The fix pass followed the same day (its top section): the families are `src/data/armourAffixes.ts` (a family for each ladder of each mod, generated once from the 3.9 tables, then hand-edited), shields come in six defence types, and the card shows the piece after its mods. Flasks are the one item affix pool not yet audited.
- **Item base audit** (2026-10-18): [docs/AUDIT-ITEM-BASES.md](docs/AUDIT-ITEM-BASES.md): every droppable 3.9 base has a Bob base (774), at the reference numbers, weapon damage and requirements included (`WEAPON_DAMAGE_SCALE`, `REQUIREMENT_SCALE` in `src/data/bases.ts` are the levers). The rows are generated: `npm run coverage:emit-bases` writes `src/data/baseTables.ts` from `docs/coverage/pob-bases.json` and **`docs/coverage/base-names.json`** (our name for each reference base; a new base needs a line there, never a hand edit of the table); `npm run coverage:bases-audit` checks parity. Ids are level-keyed (`body_ar_l59`); the old tier ids are aliases inside `itemBase()` / `flaskBase()`, never remove them. Flask bases and the fifteen utility kinds are in `src/data/flasks.ts`.
- **Coverage plan:** [docs/COVERAGE.md](docs/COVERAGE.md) (milestones C0–C7): C0 to C6 are done (gems 93%, uniques 98% of
  the 3.9.0 list); C7 is the integration pass. `npm run coverage` prints where it stands, and `docs/coverage/README.md`
  describes the data and tools. Every new droppable gem or unique needs a line in `docs/coverage/map.json`. New content
  goes through decision files (`docs/coverage/gems/`, `docs/coverage/uniques/`; see `docs/coverage/AUTHORING.md`) and
  `npm run coverage:emit` / `coverage:emit-gems`, never by editing the generated `src/data/*Gen.ts`. Items are never
  edited in place (what an item gives is remembered by object).
- **Items and Workbench UX plan:** [docs/ITEMS.md](docs/ITEMS.md) (milestones U0–U9), built (2026-10-09): the Items tab compares an item with every slot it fits (`compareSlots` in `src/run/inventoryOps.ts`), the Workbench stages every craft in a result panel first (`planCraft` / `applyCraft` in `src/run/craftPlan.ts`, built on the real `craft.ts` code and never showing the real roll of a rolled craft), and `src/ui/Confirm.tsx` replaces `window.confirm`. New item or craft UI goes in `items.css` / `workbench.css`.
- **Equipping plan** (2026-10-16): [docs/EQUIP.md](docs/EQUIP.md) (milestones Q0–Q8), built: a swap says what it does to the gems (`SocketOutcome` from `dryEquip`, shown by `SocketsRow`, `src/run/socketText.ts`), the phone compare is a peek with the changed lines and a full view with a merged card (`DiffCard`, `itemDiff.ts`), gear slots and bag rows carry socket pips, the phone toolbar is a search plus a Filter sheet with Clear filters, a bag gem has a `SocketPicker`, and the Skills tab names what a gem replaces and asks first. Section 8 lists what was left (swipe, real-device pass).
- **Mobile and inventory plan:** [docs/MOBILE.md](docs/MOBILE.md) (milestones P0–P9): make every screen usable in phone and tablet
  browsers (touch rules, small-screen layouts, tree pinch zoom, HUD and map zoom), plus inventory tools (persistent New list, Clean up old items, favourites; P8–P9). P0 to P9 are built; the real-device pass is left (its section 9).
- **Passive tree, designed from scratch** (2026-10-18): [docs/PASSIVE-TREE.md](docs/PASSIVE-TREE.md) (phases A–F; drafts in `docs/tree/design/`). **Phase D since 2026-10-19:** the tree is hand-written, area by area, in `src/data/passives/<region>/*.ts` (every node's lines and every link carry a `why`; `docs/tree/design/D-method.md`); `npm run passives:pic|list|audit` draw, list and check it; nothing generates nodes or links. **The game loads it since 2026-10-20 (phase F):** `getTree()` reads `src/data/passives/baked.ts`; after any change to an area file, `lines.ts`, the registry or the editor's patch run `npm run passives:bake` (a test fails while the bake is stale). Saves of version 19 and older had their passives handed back once. The old generator in `src/data/tree/` (layout, `treeBaked.ts`) is no longer loaded and waits for a cleanup; `src/data/tree/keystones.ts`, `types.ts` and `index.ts` are still the live ones. Read `docs/tree/design/CONSTRAINTS.md` first. Design first, then the authoring method and the
  node count; balance is a property of the tree's supply along a few build axes (never an enumerated list of builds; the bot is only a smoke test); the user's
  stops are the design brief (C) and the finished tree (F). It does not continue TREE-REDESIGN.md, whose decisions D1–D6 are dropped. **Pause and ask the user
  whenever the work starts to feel like it is losing intent** (the user, 2026-10-19): another tree without intentionality is the one outcome to avoid.
- **Passive tree redesign** (2026-10-11, superseded by the above; no longer loaded by the game): [docs/TREE-REDESIGN.md](docs/TREE-REDESIGN.md) (milestones T0–T9; T0–T5 built): the tree is laid out from a charter of districts
  (`src/data/tree/charter.ts`) and a plan (`plan.ts`) by `layout.ts`, roads first (generic stats, `roads.ts`) with every cluster hung
  from one by a single entrance, an open middle, keystone peninsulas; notables are priced against small nodes (`power.ts`,
  `scripts/tree/balance.ts`, run by `npm run tree:emit`). How the tree looks is judged from `npm run tree:pic` pictures, `tree:audit`
  and simulated players, not by tests of numbers. `tree:explore` builds with the tree from a terminal. **The game does no layout at run time:** after any change that moves the tree (charter,
  plan, roads, shapes, clusters) run `npm run tree:bake`, which writes `src/data/tree/treeBaked.ts`; a test fails while it is stale. [docs/TREE.md](docs/TREE.md) is
  the earlier parity pass (size, clusters, vocabulary).
- **Tree editor** (2026-10-13; since 2026-10-20 `npm run passives:edit` and plain `tree-editor.html` edit the hand-written tree, and `npm run tree:edit` opens the old one at `?tree=old`): `npm run tree:edit` opens `tree-editor.html?tree=old` (move nodes, change type, add/remove nodes and links, copy stats; dev server only). Save writes `src/data/tree/treeEdits.json`, a patch `getTree()` applies on top of the baked tree (`edits.ts`). The launcher rebakes a stale bake first (not when edits are saved: a rebake renumbers nodes). See the end of docs/TREE-REDESIGN.md. `npm run passives:edit` (2026-10-19) opens the same editor on the hand-written tree (the default since 2026-10-20): it registers node numbers in `src/data/passives/ids.json` first, saves to `src/data/passives/edits.json`, and the passives tools apply that patch (the game after `npm run passives:bake`) (docs/tree/design/D-method.md, "Editing by hand"). Zoomed in, the editor shows every node's stat lines, and a selected node's lines are editable in the vocabulary of `lines.ts`. `npx tsx scripts/passives/fold.ts <region>` folds a patch back into the region's area files; fold before registering other regions' nodes (editor numbers collide with the next registered ids). The hand-written tree is a network, not a tree: **read docs/tree/design/PHILOSOPHY.md first** (the rules, the method, what went wrong, the state); D-network.md has the numbers and the wider vocabulary (2026-10-19).
- **Wayside** (2026-10-13, revised 2026-10-14): [docs/WAYSIDE.md](docs/WAYSIDE.md) (milestones Y1 to Y7, built; section 17 is the latest revision; questions met on the way in
  [docs/WAYSIDE-QUESTIONS.md](docs/WAYSIDE-QUESTIONS.md)): Bone Dust is the money, and the only currency that drops (`CURRENCY_DROPS = false` in `data/constants.ts`;
  the Workbench and the currency code stay). A **stop** is a third kind of offer (`OfferKind` `stop`, `src/data/stops.ts`, `src/run/stops.ts`: Awlsmith, Gem Hoard,
  Shrine, Quartermaster, Ferryman; it costs the level; two in every five levels from level 6 (doubled 2026-10-15), a stateless schedule, `stopAt` in `offers.ts`); the Quartermaster's wares are
  `src/run/sale.ts` (a camp Market was built and cut on 2026-10-14). **Provisions** (`src/data/provisions.ts`, `src/run/provisions.ts`) fill a pouch of three: staples and
  bets are armed at camp and burn when a map starts; **reprieves** (`src/data/reprieves.ts`, `src/sim/reprieve.ts`) are provisions of a third kind, always ready, fired
  in `applyDamage` when damage would kill, and they refill the flasks. A cleared map may leave a provision (`forage`); reward picks may hold provision and reprieve cards
  (`PouchCard`). Provisions, curses and blessings are hidden map affixes (`fixed`, `chalkOnly`), so the world, the threat preview and the rewards read them with no new
  machinery. `RunState.wayside` is optional: read it with `waysideOf(run)`. `npm run sim -- --no-wayside` and `--strategy stopper` are the measuring baselines;
  `scripts/lethal.ts` counts the deaths a reprieve could save.
- **Strategy tab** (2026-10-09): `Build.strategy` gives each skill a role, a condition and an order, plus target priority,
  spacing (hold, close in, kite) and flask thresholds (`src/data/strategy.ts`, `src/calc/strategy.ts`, `src/ui/Strategy.tsx`).
  `Character.mains` / `rotation` hold the resolved order; the sim's `chooseSkill` (`src/sim/ai.ts`) walks it. The sheet
  works out a pack and a boss rotation (`sheet().scenarios`, weighed by `sheetDps`). Player-facing explanation of the whole
  AI: [docs/PLAYER-AI.md](docs/PLAYER-AI.md); keep it current when the character's decisions change.
- **Save slots** (2026-10-10): one save per run (`bob.saves` list, `bob.save.<id>` values; DESIGN.md 5.5, `src/run/save.ts`). The
  controller keeps the current run's slot outside `RunState`; the title screen lists them. `loadRun` / `saveRun` / `clearSave`
  still work on one key (default `bob.save`, the pre-slots save).
- **Evasion and accuracy** (2026-10-10): a monster's evasion and accuracy by level are fitted to the reference game's monster
  tables (`monsterEvasion` / `monsterAccuracy`, `src/calc/formulas.ts`; the table is `docs/coverage/pob-monster-stats.json`;
  `npm run evasion` compares the two games; docs/EVASION.md), so the same rating gives about the same hit chance as there.
- **Map variety** (2026-10-12): [docs/MAP-VARIETY.md](docs/MAP-VARIETY.md) (milestones W0–W8, built): every map has a biome (`src/data/biomes.ts`:
  layout kind, tiles, light, props; rolled apart from the theme, shown on entering, pinned by the special map types), its size
  follows the map number (`roomsForMap`, `roomsForPlan`), a pack follows its room's area, and an offer has a density style
  (`src/data/density.ts`). Layouts are styles of `generateLabyrinth` (`src/gen/layouts.ts`); the look of a biome is `biomeLook.ts`. After
  a change to a layout or to density run `npm run mapstats` and `npm run map:ascii`; the Debug panel forces a biome or a style.
- **Damage preview** (2026-10-14): [docs/SHEET-AUDIT.md](docs/SHEET-AUDIT.md). The sheet's DPS (`Character.sheet`, `sheetDps`) plays out the sim's
  skill choice over a few minutes (`planRotation`, `src/calc/rotation.ts`; `Character.plan` / `planned`) and prices each skill by the uses it gets;
  what one use lands on one target is counted by small modules beside the sheet (`afterHit`, `channelFx`, `patterns`, `melee`, `deployed`,
  `minionDps`, `dot`, ...), from the gem's own fields, never a gem id. It is measured against the sim by `npm run dpsaudit` (bot builds),
  `dpsgems` (every gem alone), `dpssupports`, `dpsminions` and `dpsinspect <gem>`, and held to it by `src/calc/sheetVsSim.*.test.ts` and
  `rotationVsSim.test.ts`. **When a skill's behaviour changes in the sim, run `npm run dpsgems -- --only <gem>` and change the count in the calc to
  match.** The sheet counts one target and free mana (docs/MANA.md); the audit's open items are in its section 6.
- **Performance** (2026-10-15): [docs/PERFORMANCE.md](docs/PERFORMANCE.md). A sheet is about 1 ms, and the Skills tab tries every gem in every socket, so what is asked of it is
  counted before what it costs: `npm run perf` times it on a late run. `sheetOf` remembers sheets by build, `ModDB.extend` layers a skill's mods on the character's,
  and `planRotation` remembers its plans; none changes a number, and a change to the calc should keep it so (hash the sheets before and after).
- **Patch notes:** [docs/PATCH-NOTES.md](docs/PATCH-NOTES.md), player-facing, newest first, shown on the Patch notes screen of the title
  menu (`src/ui/PatchNotes.tsx`): every change a player would notice gets an entry. **Never write or edit patch notes while doing
  the work** (not in the same commit, not as a finishing touch): only the `/patch-notes` skill
  (`.claude/skills/patch-notes/SKILL.md`) writes them, from the commits, then files them and commits; after a confirmation it pushes (a push to main is what
  updates the game, `.github/workflows/pages.yml`) and uploads the same commit's build to itch.io with butler. It is the "publish" command. Its style rules are the standard for every entry. Record decisions in
  DESIGN.md Appendix A and the plan docs, and leave the notes to the skill. A deploy reaches an open tab only when it is reloaded
  (players keep one for days): the build writes `version.json`, and `src/update.ts` nudges the title screen and the camp to reload.
- **In-game text is concise** (2026-10-14): a screen, card or tooltip says what the player gets and what they choose, in as few
  words as it takes. Never say what a level, stop or feature does _not_ do ("no loot, no XP"), restate what the UI already
  shows, or explain the obvious. One short line beats a paragraph. Check new text against this before adding it.
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
  (scaling, base, variance; `src/data/difficulty.ts`; default scaling 1.75, base 1.8, variance 0.3) with a Debug panel (dev builds or `?debug`).
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
