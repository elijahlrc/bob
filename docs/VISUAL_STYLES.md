# Visual style exploration

Four complete vertical slices (three styles plus Grim Isometric, a diagonal-camera variant of Grimdark) of the map renderer, all driven by the same simulation and the same
procedural figure rig (`src/render/style/figure.ts`). Switch live with keys **1 / 2 / 3 / 4** (map or title),
the style switcher on the title screen, or the panel in Showcase mode. The choice is remembered
(`localStorage` key `bob.style`).

**Showcase mode** (Title → _Showcase crypt_ / _Showcase boss_): an invulnerable, auto-playing demo that
cycles all six classes (level 45 on map 30, or level 100 on map 100 for the boss). **N** = next class.

|           | Grimdark                                                                           | Cel Isometric                                         | Inkwell                                               |
| --------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| Camera    | Top-down, 2×/3× integer pixel zoom                                                 | 2:1 isometric, zoom 1.3                               | Top-down, zoom 1.25                                   |
| Look      | Crunchy 24 px-tile pixel art, hard-edge id-buffer shading                          | Thick outlines, flat cel shading, rim light by rarity | Ink on parchment, hatching, 3-variant "boil" at 8 fps |
| Lighting  | Real-time Phaser lights (player, torches, braziers, elements, bosses, projectiles) | Baked palette, glow sprites                           | None (wash blooms)                                    |
| Animation | idle 4 / walk 8 / attack 6 / stun 4 / death 7 frames                               | 2 / 4 / 4 / 2 / 4 + squash & stretch                  | Same as grim, jittered ink variants                   |
| VFX       | Blood, sparks, flame, smoke, bone, ember, decals, vignette, shake                  | "Pow" bursts, outlined shapes, bouncy text            | Splats, brush slash, wash blooms, serif text          |
| UI skin   | Iron and leather, orbs                                                             | Candy outlines, hard shadows                          | Parchment, wobbly borders (SVG filter)                |

Screenshots: `docs/screenshots/styles/` (`grim-spell.jpg`, `cel-spell.jpg`, `ink-spell.jpg`).

## References

- Grimdark: Path of Exile / Diablo-style dark pixel work as seen in _Children of Morta_ (lit pixel art with dynamic lights) and _Dead Cells_ (crunchy sprite animation, hit flashes).
- Cel Isometric: _Tunic_ (isometric, outlined flat shading, chunky readable silhouettes); _Romestead_, _Wanderburg_ for tone.
- Inkwell (our own pick): _Cuphead_-style hand-drawn "boil" and parchment/engraving maps, to show a style that is cheap in assets but distinctive.

All art is procedural and original (IP policy).

## Architecture

- `MapStyle` interface; `StyleBase` owns views, `AnimTrack`, projection and camera follow; each style implements the view/VFX hooks in `src/render/styles/<id>/`.
- `figure.ts` builds a list of primitives (circle, capsule, box, triangle with roles) from a `Pose`; each style rasterises those primitives in its own manner.
- `MapScene` hosts the active style and rebuilds it on the `style` bus event.
- UI themes via CSS variables plus `src/ui/skins.css` keyed on `html[data-style]`.

## Smoothing notes

The sim ticks at a fixed rate, so a rendered frame contains 0, 1 or 2 ticks. Sprites are placed from a
per-actor smoothed position (`AnimTrack.rx/ry`), and walk/idle selection, camera follow and lights use it.
Facing changes need sustained motion and a 0.15 s gap between turns, which prevents single-frame flips.

## Constraints and recommendation

- Grimdark's lighting is GPU-bound (max 32 lights); worth profiling on low-end machines.
- No real fps was measured: the preview pane throttles frames.
- Recommendation: **Grimdark** matches the stated goal best; **Cel Isometric** has the strongest readability when screens are crowded; **Inkwell** is the cheapest to extend. Cel's isometric camera would need pathing/click-projection work if input ever becomes spatial.

## Grim Isometric (`gri`)

The Grimdark look from a 2:1 diagonal camera. It is the same class as Grimdark (`GrimIsoStyle` sets `iso`),
so lights, particles, decals, flasks, enemy marks and animation are shared. What differs:

- 32×16 px diamond tiles (vs 24 px squares) and 0.6× figure rasterisation, shown at 2× zoom (1.5× on windows under 1100 px): smaller pixels and roughly twice the map area in view.
- Pixel-art floor slabs (Voronoi flagstones) baked into 8×8 chunks; wall cubes with brick courses, a lit top, a mid-tone left face and a dark right face. Walls on the near side are cut low so they never hide the action.
- Everything sorts by screen y; lights are scaled to 80% of the top-down radii; ground effects become ellipses.
