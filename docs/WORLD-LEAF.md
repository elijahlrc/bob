# World Leaf: bringing the map a step towards the Gold Leaf menus

A plan for a small visual pass on the map (asked for 2026-10-24): health bars and markers, lighting, item drops, enemy
colours and level sprites, judged against the Gold Leaf interface ([docs/mockups/style/STYLE-GUIDE.md](mockups/style/STYLE-GUIDE.md)).
The fiction is an afterlife, so the world stays darker and grimier than the menus. It borrows a few of their elements
rather than their whole look. Nothing here is built yet.

## 1. The idea in one line

**In the menus gold is a surface; in the world gold is light.** The world keeps its grimy iso stone, dark and cold
where nothing burns. Gold appears only where something matters: a torch, the player's lamp, a rare monster, a good drop,
a marker. It appears in the same gold, lapis, vermilion and bitumen as the menus, so the two read as one world seen
in different light.

Three elements carry the link:

1. **One palette.** Every colour the map draws for a marker, a drop or a rarity comes from the menus' ramps
   (`RAMPS`), snapped to their steps, instead of the loose ARPG hexes used now.
2. **The small-bar recipe.** On the map, bars and labels are made the way the HUD's are: a field from a ramp, a thin
   gold ring and a hard offset shadow. Unlike the menus they keep a dark outline (see 3).
3. **The same wear.** Tiles and props are aged by the menus' own wear pass (mottle, flakes, cracks). It runs darker
   here, and on stone instead of gold.

## 2. What is there now, and where it clashes

The HUD (medallions, flasks, chips) is already Gold Leaf; the map under it is not (seen in showcase,
the Hollow Vigil, a Shrine biome, 2026-10-24).

| Area           | Now                                                                                                                                                                                                                                                                                                                        | Clash with the menus                                                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bars and pips  | `MonsterMarks` (`src/render/style/marks.ts`): a flat bar, back `0x401010`, fill `RARITY_COLOR` (`src/data/monsterMarks.ts:335`: normal `0xcfcfcf`, magic `0x8888ff`, rare `0xffd860`, miniboss `0xff9040`, boss `0xff4a40`), ES strip `0x6ad0ff`, an outline plate at 0.85. Affix pips are bright primaries (`MOD_MARKS`). | Generic and flat; saturated colours that appear nowhere in the menus. The bars float over the HUD's worn gold and lapis like debug overlays.                    |
| Rarity         | Three tables that disagree: `RARITY_COLOR` (bars), `RARITY_RING` (`src/render/styles/grim/index.ts:91`, magic `0x5a7cff`, rare `0xffd040`…), `DROP_COLOR` (`src/render/dropLabel.ts`: magic `0x6a8cff`, rare `0xffd84a`, unique `0xff9a2a`, gem `0x40e0c0`, flask `0xff6090`).                                             | The menus say magic is pale sky (`#b9cbe6`), rare is gold-hi (`#e2c681`), unique orange (`#ffa040`). On the map, magic is a saturated blue and flasks are pink. |
| Drops          | A white bag or gem sprite tinted by rarity, an additive glow, a beam for magic and better, and a `px_bob7` label on a black plate at 0.72 (`createDrop`, `index.ts:974`).                                                                                                                                                  | The label is the one piece of text on the map that could be a plaque, and it is a black box.                                                                    |
| Damage numbers | `DTYPE_COLOR` (`index.ts:90`): physical `0xeadfc8`, lightning `0xc89cff`, cold `0x9ad8ff`, fire `0xff9a40`, chaos `0x9ae05a`; damage to the player `0xff5050`.                                                                                                                                                             | Close to the ramps already. They are part of the damage-type language (VISUAL_LANGUAGE.md), so they move only within it.                                        |
| Lighting       | Light2D: an ambient per biome (`BIOME_LOOKS`, `biomeLook.ts`: cool violet greys, `0x4a5878` to `0x7a7090`); a warm player light `0xffb060`; torches `0xff8a38`; braziers; a black vignette; no bloom or fog.                                                                                                               | The warm-on-cool split is right. The ambient's violet grey is the menus' "plaster" and reads flat; nothing leans towards umber or oxblood.                      |
| Enemy colours  | Painted into the sprites by faction (`FACTION_PALETTE`, `src/render/styles/grim/paint.ts:120`), with an element wash and per-boss overrides. Magic or rare monsters have no body tint: only the ring, the light and the bar.                                                                                               | Varied and readable, but chosen one by one. A rare monster looks like a normal one with a yellow disc under it.                                                 |
| Level sprites  | Procedural iso tiles (`isoPaint.ts`: flag, cobble, brick, ashlar), baked once into 8×8-tile chunks; colours per biome mixed with the theme (`biomeColors`).                                                                                                                                                                | Clean, even brick with no wear: the one surface in the game that looks new. The menus' rule is "everything textured, everything old".                           |

## 3. Proposals

### 3.1 One palette (the foundation)

- Move the ramps to a module that both `render` and `ui` may import: `src/data/palette.ts`, pure constants, exporting
  each ramp as `#rrggbb` strings (for the menus' canvas) and as numbers (for Phaser). `src/ui/leaf/ramps.ts` re-exports
  them, so no menu painting changes. (The lint rules forbid `render` from importing `ui` and the reverse; `data` is
  open to both.)
- Add **one rarity table** there for the map, used by the bars, the rings and the drops. Its colours are the drops'
  own (`DROP_COLOR`, section 4), so the drops do not change and the bars and rings agree with them.
- The ailment tints, the damage-type colours and the element lights stay where they are, snapped to the nearest ramp
  step only where the colour still reads as the same element.

### 3.2 Bars and markers

- **The bar:** a bitumen back, the life fill from the rarity table, and a thin gold ring (one dark gold step, not the
  bright rim of a menu panel). A hard offset shadow replaces the 0.85 outline plate. A **1 px ink outline stays** outside
  the ring: on a dark floor a bar without it vanishes, so the menus' "no black outline on gold" rule does not apply here.
- **Bosses and minibosses:** a thicker bar with a small gold setting at each end.
- **Rarity on the bar, not only its colour:** a magic monster's ring is lapis, a rare's gold, a unique's or boss's
  gold with a vermilion stone at its left end.
- **The ES strip:** the sky ramp, as in the medallion.
- **Affix pips:** small stones in gold settings (the menus' `sep` stone), keeping their shapes and the colours of what
  they mean. Optional: use the HUD's glyph set where an affix has one.
- **Ground rings:** recoloured from the rarity table; the boss ring turns oxblood (`blood`/`crackred`) instead of
  red-orange, so it reads as damnation rather than a fire effect.

### 3.3 Drops (dropped)

The owner kept the drops as they are (section 4): labels, beams and glows do not change.

### 3.4 Lighting

- **Ambient:** pull every biome's ambient a little from violet grey towards umber (towards `ink` and `bitumen`). This
  makes the world darker and warmer in its shadows, so the gold of the lights reads as gilding.
- **The vignette** turns from pure black to bitumen-black (`#0e0907`), so the edge of the screen matches the dark
  material of the boss banners.
- **Torches and the player light:** nudged towards the gold ramp's upper steps (`#d1b062`, `#e2c681`) at the centre,
  keeping their orange falloff.
- **Optional, later:** a light colour grade (a colour matrix on the camera) that pushes shadows to umber and
  highlights to gold. It costs a full-screen pass, so it gets a performance check (`docs/PERFORMANCE.md`).
- **The risk:** marsh and cavern have no torches, so they would go very dark. Either they get a little more ambient
  than the rest, or they keep their cool light as the "cold" biomes (decision B).

### 3.5 Enemy colours

- Check each faction's accent against a named ramp and snap it where the faction stays distinct: gilded to gold, rot
  to green, drowned to teal, hollow to sky or azure, emberborn to vermilion, choir to pearl, reliquary to porphyry.
  Bone stays the Ossuary's alone (ROSTER.md).
- **Rarity on the body:** magic and rare monsters get a faint gilded edge (one rim pixel of the rarity colour lit by
  their own light), so a rare monster is gilded, not only standing on a yellow disc. A boss gets the oxblood ring
  and a bitumen shadow under it.
- `npm run sheet` and `__dev.monsters()` are the review tools; every faction must still be told apart at a glance.

### 3.6 Level sprites

The owner added (2026-10-24): more variety in the ground and the walls, so the map looks less like flat boxes on a
grid. As built:

- **The floor is painted in world space** (`paintFloorChunk`, `isoPaint.ts`): each 8×8-tile chunk is painted pixel by
  pixel from tile space, so flagstones and cobbles are one field of stones across tiles (a jittered grid, measured in
  the view's pixels) and no tile outline shows. Over every kind: wear at two scales, damp patches, speckle; flagstones
  have a lit and a shadowed lip, a few are missing (earth) or cracked; slabs are staggered rows of one- and
  two-tile slabs; plates are staggered two-tile plates; rock has fissures; earth has pebbles and green tufts. A dark lip
  only where the floor meets the void.
- **Walls** (`isoWallCube`): courses measured from the foot and repeating every 16 px, so they run on from cube to
  cube; a cube is chosen by which of its four neighbours are walls, and has an outline and a lit lip only on the edges
  no neighbour covers (a faint joint between capstones); three heights each of tall and low cubes; grime towards the
  foot and streaks from the cap; natural rock has a ragged top where it is open. All 192 cubes are one texture.
- **The menus' wear pass is not reused:** its ramp snap would recolour every biome. The method (mottle at two
  scales, grime near edges, cracks) is redone in the biome's own colours.
- **Gold where it fits** (decision C): in the crypt and the shrine a few floor stones are worn gilded inlay (gold
  flaked to the red bole), and stretches of tall wall carry a gold and lapis frieze (`BIOME_LOOKS.gilt`).
- Cost: building a showcase map went from about 110 ms to about 230 ms (the floor's per-pixel stones).

## 4. Decisions (the owner, 2026-10-24)

- **Drops stay as they are** (3.3 is dropped): loot labels are a big part of the loop. Their colours (`DROP_COLOR`)
  are therefore the map's rarity colours, and the bars and rings take theirs from the same table, so a rare monster and
  a rare drop agree. This also settles **A** for the map: magic stays a saturated blue there (left open by the owner;
  the menus keep their pale sky).
- **B. Torchless biomes get some light:** marsh and cavern are not made very dark.
- **C. A little gold where it fits:** gold highlights in the holy biomes (3.6), used sparingly.
- **D. No colour grade to begin with:** try the pass without it and decide afterwards.
- **Enemy colours matter** (3.5), and a faction may use several ramps of the palette, not just one.

## 5. Milestones

| #   | What                                                                                        | Check                                                                                              |
| --- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| L1  | The shared palette module and the one rarity table (3.1); the three old tables read from it | the same colours where nothing was meant to change; tsc, lint                                      |
| L2  | Bars, pips and ground rings (3.2)                                                           | `__dev.monsters()` with magic, rare and boss specs; a damaged pack in showcase; phone width        |
| L4  | Lighting: ambients, vignette, light colours (3.4)                                           | showcase in three biomes (crypt, marsh, forge) via the Debug panel's biome force, before and after |
| —   | **The owner's stop:** screenshots of L2 and L4 side by side with the menus                  |                                                                                                    |
| L5  | Faction accents and the rarity edge (3.5)                                                   | `npm run sheet`, `__dev.monsters()`; every faction still distinct                                  |
| L6  | Tile wear and, if wanted, the gilded elements (3.6)                                         | every biome; load time and frame time against `npm run perf` and a showcase frame count            |

Every step keeps the map grim: if a screenshot looks like a menu, it has gone too far. When the owner's decisions land
they go in DESIGN.md Appendix A, and `docs/VISUAL_STYLES.md` gets a pointer here.

## 6. Progress

- **L1, L2, L4 built (2026-10-24).** The ramps live in `src/data/palette.ts` (`RAMPS`, `tone()` for Phaser,
  `MAP_RARITY`); `src/ui/leaf/ramps.ts` re-exports them. `DROP_COLOR`, `RARITY_COLOR` and the rings read
  `MAP_RARITY` (the drops' colours, unchanged); magic and rare bars now match their drops. The bars, pips, boss
  lozenges and the selection ring are in `src/render/style/marks.ts`, in whole world pixels. The ambients
  (`BIOME_LOOKS`) lean to umber, the torchless ones less and 10% brighter; the vignette and the camera's ground are
  bitumen-black; the player's light and the torches lean to gold (`PLAYER_LIGHT`, `TORCH_LIGHT` in the grim style).
- **L6 built (2026-10-24):** the floor and walls of 3.6.
- **L5 built (2026-10-24):** 47 body colours of the faction palettes (bone, cloth, metal, wood, skin) moved onto the
  nearest ramp step where the faction stays distinct (`step()` in `paint.ts`): the Ossuary in pearl, plaster and
  vermilion, the Hollow's robes lapis, the Choir's and the Emberborn's robes bitumen, the Drowned teal and sky, the
  Gilded gold and straw, the Reliquary sky with a gold trim. Rot's greens, the bone of the Swarm and the Kennel, eyes
  and glows keep their colours. Magic, rare and minibosses have a gilded edge: their silhouette in the rarity colour a
  pixel up and left, behind the body (`RIM_COLOR`, the `rim` sprite).
