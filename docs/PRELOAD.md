# Preload: make every map start and menu feel instant

A plan (asked for 2026-10-24) to paint the map in a background thread, and to prepare as much as possible ahead of time
while the player is in the menus, so that starting a map, switching tabs and returning to camp feel instant. Nothing
here is built yet. It follows [WORLD-LEAF.md](WORLD-LEAF.md), whose world-space floor doubled the cost of a map start,
and sits beside [PERFORMANCE.md](PERFORMANCE.md), which covers the calculation.

## 1. Goal and budgets

"Instant" needs numbers to be checked against. Proposed budgets (the owner's to confirm):

| Moment                               | Budget                                                                  |
| ------------------------------------ | ----------------------------------------------------------------------- |
| Pick a map → its first drawn frame   | one frame (16 ms) when it was prepared; no task over 50 ms in any case  |
| The first 10 seconds of a map        | no frame over 33 ms (no hitch when a new kind of monster first appears) |
| Any menu click or tab switch         | no task over 50 ms, painted on the next frame                           |
| Map end → the reward screen and camp | no task over 50 ms                                                      |
| The title screen → the first camp    | no task over 100 ms                                                     |

## 2. What was measured (2026-10-24)

Showcase maps in the dev server on this machine, with warm caches (the figures and wall textures of earlier maps were
already made):

| What                                                     | Time                          |
| -------------------------------------------------------- | ----------------------------- |
| A map start (the click to the map built)                 | 115–194 ms                    |
| … of which the floor (`buildIsoFloor`)                   | 100–170 ms                    |
| … of which uploading its 77 textures to the GPU          | 25–41 ms                      |
| … everything else (the world, props, emitters, actors)   | about 25 ms                   |
| Generating a map plan (`makeMapPlan`), even a late one   | about 1 ms                    |
| The wall textures, the first time a biome and theme meet | 35 ms                         |
| Monster frames drawn as they first appear, first 2 s     | 2–43 ms, in a few long frames |

The floor by kind, on a map of 1,000 floor tiles: flagstones 137 ms, cobbles 125, earth 132, rock 95, slabs 94, plates 78. Late maps reach about 1,500 floor tiles (map 90: 73 × 100 tiles), so 1.5 times this.

**Not measured yet:** the menus (tab switches, entering camp, map end to camp), the first map of a session (cold
caches: every figure frame drawn from nothing, which is worse than the figures above), phones, and the first page load
(the build warns that the main chunk is large). The menus need a saved run to measure, so M0 is a harness the owner can
run on a real save.

## 3. The key fact: the next map is known before it is picked

Offers are rolled when camp opens, and a map's plan follows from its offer alone (`planFor(run, offer)` in
`src/run/run.ts`): its labyrinth, biome, theme, seed and monster types. So while the player reads the offers, equips
gear and moves gems, everything that makes the map can already be prepared for all three offers. When one is picked,
the map only has to be shown.

What a camp action can change: arming a provision adds hidden affixes, which change the monsters but never the tiles
(the labyrinth comes from the plan's seed, map number, type and biome). So the floor is keyed on what makes the tiles,
not on the whole plan: seed, map, type, crawl segment, biome and theme colours, checked against a hash of the tiles.

## 4. The bakery: painting in a background thread

A `MapBakery` in `src/render/` prepares maps ahead and hands them to the grim style at `mapStart`.

- **Where it listens:** `render` may import `run` (the lint rules only keep it from `ui` and the headless layers keep
  out of `render`), so the bakery watches the controller's existing `state` event, sees the offers at camp, and calls
  `planFor` itself. No new bus event is needed.
- **The worker** (`src/render/bake/floor.worker.ts`, a Vite module worker): it receives a map's tiles (copied), its
  size and the floor's paint options, and paints every chunk with `paintFloorChunk`, sending each chunk's pixels back as
  a transferable buffer. `paintFloorChunk` already works on `ImageData` and imports only `data/palette`, so it runs in a
  worker unchanged. Chunks are painted nearest the map's start first.
- **What stays on the main thread, in idle slices** (a few milliseconds at a time, between frames, with
  `requestIdleCallback` where the browser has it): the wall atlas (`isoWallCube` makes canvases with
  `document.createElement`; it can return pixel buffers later and join the worker if the slices are not enough), the
  monster and hero frames (`rasterFigure`, `paint.ts`, the same), and turning the worker's buffers into canvases.
- **Uploading to the GPU** cannot leave the main thread (25–41 ms a map). Phaser's texture manager belongs to the game,
  not to the map scene, so textures can be made before the scene is built (to be checked in M2, not assumed). Two ways
  to place it: upload in camp idle time, a few textures a frame (instant at the pick, more GPU memory held), or
  upload at the pick behind a short transition (decision B).
- **At `mapStart`:** `buildIsoFloor` takes the prepared textures by key and only places images. If the bake is not
  ready (a map picked within a second of camp opening, an old browser), the floor is painted as today, nearest chunks
  first and the rest over the following frames; nothing ever waits for the worker.
- **When to bake and when to drop:** camp opening or new offers → bake the map offers (respites and stops have no
  map); a reroll, Abandon or a new level → cancel and drop what no offer needs; a crawl's next segment is baked while
  the current one is played; duels, the showcase and the trailer's stages go through `mapStart` like any map and fall
  back to the synchronous path unless they ask for a bake. At most a few maps are held (least recently offered dropped
  first).
- **Proof:** a chunk baked in the worker has the same pixels as one painted on the main thread (same code, same seed),
  checked by a test that hashes both.

## 5. Everything else, prepared ahead

Ordered by when there is idle time to use:

| When                         | What                                                                                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The title screen             | the hero's frames for the run's class, the props, the wall atlases of the commonest biomes, the fonts                                                          |
| Camp                         | for each offered map: the floor (the worker), its wall atlas, the frames of its monster types (every animation, from the plan's population), its boss's frames |
| The reward screen at map end | the same for the next offers, once they are rolled                                                                                                             |
| During a map                 | a crawl's next segment                                                                                                                                         |

The monster frames matter most to how the game feels: today they are drawn the first time a kind of monster appears,
which is a hitch in the middle of a fight, and on a session's first map every kind is new.

## 6. The menus

Two separate costs, kept apart:

- **Calculation:** the Skills tab's badges ("▲ 12% DPS") and the Items tab's hints try every gem in every socket and every
  item in every slot. They are already worked out in slices after the tab opens (PERFORMANCE.md 2). Moving that work
  earlier, into camp idle time and cached by build, would show them the moment the tab opens. Later, the calculation is
  headless code that could run in a worker of its own (a larger change, only if M0 shows it is needed).
- **Painting:** the Gold Leaf painter (`src/ui/leaf`) paints each surface the first time it appears at a size, so a tab
  opened for the first time paints all its panels then. Tabs that are not open are not mounted, so they cannot be
  painted ahead without mounting them out of sight. The other way: paintings are deterministic by key and size, so a
  persistent cache (IndexedDB) would make every session after the first paint instantly (decision C). It holds what was
  painted before, so it never paints sizes nobody uses; it costs some storage.

## 7. Decisions for the owner

- **A. How many maps to bake:** all three offers (about 5 MB of pixels each while held; more as GPU textures) or
  only the one under the pointer or finger (less memory, and a pick right after camp opens may not be ready).
- **B. When to upload:** in camp idle time (the pick is instant; GPU memory held for maps not picked) or at the pick
  behind a short transition of about 100 ms.
- **C. A persistent painting cache** for the menus: yes or no, decided by M0's numbers.
- **D. Phones:** how much to prepare at the title screen and in camp on a phone (memory and battery).

## 8. Milestones

| #   | What                                                                                                                                                                                                        | Check                                                                                         |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| M0  | A dev-only harness: a long-task observer and marks round map start, the first map frames, tab switches, camp entry and map end, printing a short report; run on a real late save and on a phone             | the table of section 2 filled in, menus and a cold first map included                         |
| M1  | The floor painter's speedups that keep the picture: visit only floor pixels, draw the dark edge per tile, look up stone positions once per chunk; then the wear computed on a coarse grid (a slight change) | the same pixel hash for the first three; the floor's time (estimated at a quarter to a third) |
| M2  | The bakery and the floor worker, with the synchronous fallback and progressive chunks                                                                                                                       | pixel-hash test; map start against the budget; on the real itch.io page                       |
| —   | **The owner's stop:** before and after numbers                                                                                                                                                              |                                                                                               |
| M3  | Monster, hero and wall textures prepared ahead (section 5)                                                                                                                                                  | no frame over 33 ms in the first 10 s of a cold first map                                     |
| M4  | The Skills and Items calculations done at camp before their tabs open                                                                                                                                       | the badges and hints shown on the frame the tab opens                                         |
| M5  | The persistent painting cache, if decision C says so                                                                                                                                                        | a second session's tab switches against the budget                                            |

## 9. Risks

- Module workers and `ImageData` in workers are standard in current browsers and supported by Vite; the itch.io page
  runs the game in an iframe on itch's own domain, which serves the worker from the same origin, but that is a check in
  M2 on the real page, not a given.
- Memory on phones, if three maps are held as textures (decision A, B).
- Work done for offers not picked is wasted, which is fine on a desktop and worth limiting on a phone's battery (D).
