# Map variety plan (milestones W0–W8)

Status: **built** (2026-10-12; see section 7 for how it came out). Written from a back-and-forth with the user. None of this has to be perfect:
the aim is incremental steps that make maps look and feel different from each other.

## 1. Where we are

From a survey of `src/gen`, `src/data` and `src/render/styles/grim` (numbers to be re-checked in W0):

- **Layout.** One generator, `generateLabyrinth` (`src/gen/labyrinth.ts`): a self-avoiding random walk on an 11 x 11 grid of
  14-tile cells, one room per cell, joined by 2–3 wide corridors, plus 0–2 side branches. Special cases only: Holdout (one
  36 x 36 arena), boss maps (a circular arena attached), Quarry, Collapse, Crawl (fixed room counts). Theme does not touch layout.
- **Size.** No size knob. `roomsForMap(n) = 4 + floor(n/20)`, so 4 rooms up to map 19 and 9 at map 100. Rooms are 6–12 tiles
  a side.
- **Density.** One pack per non-start room, 3–7 monsters plus `floor(map/20)`, scaled by the `packSize` affix. The count
  ignores the room's area. Throng (2.5x crowd) is the only map-wide density style.
- **Visuals.** A theme changes only the floor and wall colours. Torches, braziers, decals and lighting are the same on every
  map. Monsters carry nearly all the variety.

**Baseline, measured by `npm run mapstats` (W0, 40 seeds, plain maps, before any change):**

| Map | Rooms | Floor tiles | Longest side | Monsters      | Per 100 tiles |
| --- | ----- | ----------- | ------------ | ------------- | ------------- |
| 1   | 4.0   | 403         | 45           | 13.9 (10–19)  | 3.5           |
| 10  | 6.6   | 1019        | 74           | 23.3 (12–37)  | 2.3           |
| 25  | 6.5   | 633         | 56           | 30.5 (15–51)  | 4.8           |
| 50  | 8.6   | 1199        | 82           | 45.5 (28–64)  | 3.8           |
| 75  | 8.7   | 834         | 66           | 55.6 (38–81)  | 6.7           |
| 100 | 11.8  | 1515        | 93           | 95.3 (71–125) | 6.3           |

Throng has 2.5x the monsters (72 at map 25, 135 at map 75); Holdout has 77 to 93 in one 36 x 36 arena; Quarry has 7 to 9.
The density per tile swings from 2.3 to 6.7 only because the number of rooms and their areas vary, not by design.

## 2. Goals

1. **Layout** differs by _biome_, not only by room count: caves, open fields, loops, hubs, as well as the room chain.
2. **Biome is independent of the theme and its factions.** A crypt and a cavern can both host any faction. (Today a theme
   fixes colours, factions, elements and bonuses; the look and layout part moves to the new biome axis.)
3. **Size scales with depth only**, with a small random spread per offer. No size-for-reward trade.
4. **Density follows area** (a big room holds more monsters than a small one), and each map has a **density style** on top:
   sparse and tense, packed, clustered, scattered.
5. **Visuals** per biome: its own tiles and walls, props and decor, and ground features. Hazards are **mostly cosmetic**: they
   look like hazards and may shape the layout, but add no damage rules and no new AI.
6. Nothing here needs new art files or careful balance work: procedural drawing like today, balance checked loosely with
   `npm run sim`, performance kept sensible but not engineered for.

Non-goals: new monsters or factions, damaging hazards, reward changes on the offer screen (beyond showing biome and density style).

## 3. Design

### 3.1 Biome

A biome is data (`src/data/biomes.ts`): `id`, name, `layout` (which generator and its parameters), `tiles` (floor and wall
variants and palette), `props` (decor with weights), `ground` (cosmetic ground features), `light` (ambient and torch colour).

A first set of 6–8: **Crypt** (tight corridors, many small rooms), **Cavern** (organic caves), **Ruins** (open rooms, broken
walls, loops), **Marsh** (open, scattered pools), **Forge** (hub rooms, vents), **Hollow** (wide open field), **Shrine**
(symmetric halls), **Warren** (dense maze of short passages). The names are placeholders and must be our own (the IP test
checks them).

Rolling: an offer rolls its biome independently of its theme, weighted by map band. Offers on one screen get different
biomes where possible, the way they already get distinct leading factions. The biome is not on the offer card: it is revealed
on entry. Special map types pin their biome. Mixed themes (from map 30) take one of the two themes' biomes. The existing per-theme floor and wall colours become a
tint on top of the biome tiles (so themes still read), or are dropped if that looks muddy (decide in W5).

### 3.2 Layout generators

Keep the room chain as one generator and add, each behind the same `generate(seed, params) -> Level` interface:

| Generator     | Shape                                             | Used by                                   |
| ------------- | ------------------------------------------------- | ----------------------------------------- |
| Chain (today) | rooms in a walk                                   | Crypt, Shrine, Forge (with a hub variant) |
| Cave          | cellular automata, smoothed, connected            | Cavern, Marsh                             |
| Field         | one large open area with scattered obstacles      | Hollow                                    |
| Loops         | chain plus 1–3 extra links between non-neighbours | Ruins                                     |
| Warren        | many small cells, short passages                  | Warren                                    |

Rules every generator keeps: start and end are connected, the end is the farthest or a named point, special map types
(Quarry, Collapse, Crawl, Holdout, boss) keep working (they may pin a generator), walls and floors use the same tile grid so the
renderer, pathing and spawning need no new concept. Map size comes from a single `sizeFor(mapLevel)` that all generators read
(an area or room budget), with ±15% spread.

### 3.3 Density

- Pack size follows the room's or region's open area: `count = round(area * density * styleMult)`, with a floor and a cap
  per pack so a tiny room is never empty and a field is not a single mob. Caves and fields have no rooms, so packs are placed by
  region (flood-filled or Poisson-disc cells) instead of one per room.
- Style per map, rolled with the offer and shown on the card: **Sparse** (about 0.6x monsters, tougher packs), **Packed**
  (about 1.5x), **Clustered** (few big packs and empty stretches), **Scattered** (many 1–3 monster groups). Throng stays as a
  map type. Styles multiply the existing `packSize` affix, they do not replace it.
- Total monsters per map should stay within a similar band to today at the same depth, so clear time stays comparable.

### 3.4 Visuals

- Per-biome tiles and walls: more than a colour swap. Different floor patterns, wall silhouettes (cave edges rounded, ruins
  broken), edge detail. Drawn procedurally and cached, per biome.
- Props and decor: per-biome sets placed by the level (rubble, roots, pillars, bone piles, crates, fungus). Decals per
  biome. Torches become a biome choice (crypt yes, cavern glowing fungus, forge vents).
- Ground features: cosmetic patches (puddles, lava cracks, moss, ash, ice). They are drawn and may be impassable in the form of
  pits or deep water _only where the generator carves them as walls_, so pathing needs nothing new.
- Lighting: ambient and torch colour per biome.

## 4. Milestones

Each is playable and committed on its own. Order puts the cheap, high-visibility steps first.

- **W0. Measure.** A script (`npm run mapstats`) prints, per map level and map type: rooms, area, total monsters, monsters per
  area, clear time from the bot. This is the baseline for W2 and W3 and is checked again at the end. Update the numbers in
  section 1.
- **W1. Biome data and roll.** `biomes.ts`, the roll, a `biome` field on the offer and the level (not shown on the card). No
  visible change yet. Tests: every biome has all fields, the roll is deterministic by seed.
- **W2. Size by depth.** `sizeFor(mapLevel)` and ±15% spread replace `roomsForMap`; the chain generator reads it. Room sides may
  grow slowly with depth. Special types keep their fixed sizes.
- **W3. Density by area and style.** Area-based pack sizing, the four styles, the card text, placement by region. Compare with
  W0.
- **W4. Biome visuals, first pass.** Per-biome tiles and walls, prop sets, decals, light colours, for the chain generator only
  (Crypt, Shrine, Forge). Compare with `npm run` pictures (add a `map:pic` script that draws a level to a PNG, like
  `tree:pic`).
- **W5. Cave and Field generators.** Cavern, Marsh, Hollow, with cave-edge wall drawing. Connectivity and start-to-end tests.
  Decide the theme-tint question here.
- **W6. Loops and Warren generators.** Ruins and Warren. Tests as in W5.
- **W7. Ground features.** Cosmetic patches and carved pits/water per biome; decor placement rules (not on the path, not
  blocking corridors).
- **W8. Integration.** All special map types over all biomes (which pin a generator, which do not), mixed themes, the
  Showcase mode, mobile layout of the offer card, `npm run check` and `npm run build`, balance spot-check with `npm run sim`,
  patch notes, DESIGN.md Appendix A entries for the decisions above, and PROGRESS.md.

## 5. Risks

- Pathing, the AI's spacing and the minimap/camera assume rooms and corridors: caves and fields test them hardest (W5).
- Pack placement by region must still give each pack a shape from `src/gen/packs.ts` and room to flank.
- A very open map makes ranged builds and kiting stronger, and a tight one favours melee: loose checks with `npm run sim`
  after W5, not a tuning project.
- Render cost of new props and per-biome tile caches: cache per biome, and cap props per screen.

## 6. Open questions

None open. Decided with the user (2026-10-12):

1. Ground features are fully cosmetic (no damage, no rules). They may change the layout (pits, water) as long as the map
   stays traversable: start to end, and every room, stays reachable on foot.
2. The biome is **revealed on entry**, not on the offer card. W1 therefore adds no card line.
3. A mixed theme (map 30+) takes **one of its two** themes' biome, unless a mix is easy and looks good.
4. Special map types **pin a biome** (Quarry is a Cavern, Holdout a Hollow, and so on), which makes them feel special.

## 7. As built (2026-10-12)

All nine milestones were built in one pass. How it differs from the plan above:

- **W5 and W6 together.** Every layout is the chain of rooms of `generateLabyrinth` with another `LayoutStyle` (`src/gen/labyrinth.ts`,
  the table in `src/gen/layouts.ts`), not five generators: a cave carves rounded blob rooms and wandering passages and smooths them;
  a field makes every room fill its cell, with wide ways and pillars in the open; ruins add two links between neighbouring halls; a
  warren has half as many rooms again, 5 to 8 tiles a side, joined by two-wide passages and two extra links. Rooms, waypoints,
  packs, chests and the boss arena work as before. The generator retries when a cave pinches a passage shut, and a test walks
  every room, the exit, the chests and every monster of every biome on foot (`src/gen/layouts.test.ts`).
- **W7: carved pits and water were not built.** Ground features are marks on the floor (pools in groups, moss, ash, roots, glowing
  cracks), and the obstacles are the pillars of a field. Real pits and water (the open question 1) can come later.
- **Density styles show on the offer card** (from map 3, never on a tenth map or a type with a crowd of its own), the biome does not.
- **The size spread** is 15% on the number of rooms, drawn from the map's own seed (`roomsForPlan`), and the smallest room side
  grows from 6 to 7 at map 40 and 8 at map 75.
- **Debug panel:** a Biome and a Density override (`forceBiome`, `forceDensity`), and `npm run map:ascii` prints a map as text.
- **Numbers, standard density, plain maps, 60 seeds, crypt layout:** monsters 12 on map 1, 26 on map 10, 29 on map 25, 52 on map 50,
  69 on map 75 and 107 on map 100 (the baseline above: 14, 23, 30, 45, 56, 95). Caves and marshes carry about 20% fewer because their
  rooms are smaller; the density per tile is the same. Sparse is 0.6 times standard and Packed 1.5 times; Clustered and Scattered
  keep the total.
- **Found on the way:** docs/BUGS.md 2, a Spitter rare can hold the bow strider dodging its pools for a minute. The stall test
  runs with the usual density until that is fixed.
- **Not checked:** how the bot's clear times and deaths move with the new layouts and styles (only that every biome clears on
  early maps), and the phone layout of the new banner and the density line. The look is a first pass, judged by eye in the
  Browser pane; the ruins cobble in particular is busy.
