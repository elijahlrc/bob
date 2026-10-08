# Bob

An in-browser, top-down auto-battler built on the core numerical rules of a classic action RPG:
one character, a full-size passive tree, gems and supports, auras, flasks, random affixes and
unique items. You build between maps, then watch the character fight its way through a randomly
generated labyrinth of skeletons. A run is **100 maps** (character level 1 → 100) ending in a
boss; death ends the run.

All names, numbers and art are original. See [docs/DESIGN.md](docs/DESIGN.md) for the design and
[docs/PROGRESS.md](docs/PROGRESS.md) for status.

Built with TypeScript, [Phaser 4](https://phaser.io) (the map), [Preact](https://preactjs.com)
(menus and the camp) and [Vite](https://vite.dev).

## Setup

Requires Node.js 24+.

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

To try it on a phone or tablet on the same network, run `npm run dev -- --host` and open `http://<this computer's address>:5173`
on the device. The page works over plain `http://`, except "Copy save" (the clipboard needs a secure context). Touch and
small-screen work is planned in [docs/MOBILE.md](docs/MOBILE.md).

## How to play

1. **New Run**, then pick one of six classes (they differ in starting attributes, gear, skill and
   tree position).
2. At **camp**, between maps:
   - **Passive tree** — click a node to allocate the whole path to it; click an allocated node to
     refund it (costs a refund point; the tree must stay connected). You earn a passive point per
     level, plus 3 bonus points after maps 10, 20 … 80.
   - **Items** — the inventory is a sortable, filterable list. Every row shows the effect of equipping it
     (▲/▼ DPS and effective HP). Click an item to see it beside what it would replace; click a highlighted slot
     to equip there, or double-click / press Enter for the best slot. Sort by slot, rarity, item level, Δ DPS,
     Δ EHP or "best upgrade"; filter by weapons, armour, jewellery, flasks, gems, upgrades or usable. **Discard
     junk** removes normal and magic items that are not upgrades. Keys: ↑/↓ browse, Enter equip, Del discard,
     U unequip. **Ctrl+Z undoes** the last camp change (equip, socket, passive point, reward pick).
   - **Skills** — click a gem to preview each socket's effect, then click a socket; or drag gems onto sockets
     (drag back onto the gem list to remove, onto another socket to swap). Double-click a gem to auto-place it.
     Every socket on an item is linked; ★ sets the primary skill.
   - **Character** — the full stat sheet, aura reservations and warnings.
   - A **reward pick** (1 of 3) appears after every 5th map.
   - Choose the next map (two themes with different bonuses), or leave **Auto-continue** on: when
     nothing needs your attention, the next map starts after a short countdown.
3. In a map the character fights **automatically**. Use the speed buttons (pause, 1×, 2×, 4×, 8×).
4. Progress is saved when you reach camp. **Continue run** on the title screen resumes it.

## Commands

| Command                                              | What it does                                                   |
| ---------------------------------------------------- | -------------------------------------------------------------- |
| `npm run dev`                                        | Dev server at http://localhost:5173 with hot reload            |
| `npm run build`                                      | Type-check, then build a static site into `dist/`              |
| `npm run preview`                                    | Serve the built `dist/` locally                                |
| `npm test`                                           | Run unit tests once (Vitest)                                   |
| `npm run lint` / `npm run format`                    | ESLint / Prettier                                              |
| `npm run check`                                      | Type-check + lint + format check + tests                       |
| `npm run sim -- --runs 10 --class all`               | Headless bot plays complete runs and prints a balance report   |
| `npm run sim -- --runs 5 --class mystic --maps 1-25` | Quick early-game check (stops after map 25)                    |
| `npm run sim -- --runs 10 --class all --write-xp`    | Re-measure mean map XP and regenerate `src/data/measuredXp.ts` |

`npm run sim` options: `--runs N` per class, `--class all|id[,id]`, `--maps a-b` (stop after map b),
`--seed N`, `--measure-xp`, `--write-xp`.

## Layout

- `src/core` — seeded RNG, hashing, math, event bus
- `src/mods` — the modifier model (`ModDB`), conditions, text rendering
- `src/data` — all authored content: classes, gems, item bases, affixes, uniques, flasks, monsters,
  themes, the passive tree spec; plus the IP deny-list and its test
- `src/calc` — the calc engine (damage pipeline, defences, ailments, character sheet)
- `src/gen` — labyrinths, monster packs, item and loot generation
- `src/sim` — the deterministic fixed-step simulation (60 ticks/s) and its AI
- `src/run` — run state, progression, saving, the camp controller and the headless bot
- `src/render` — Phaser scene and generated placeholder art
- `src/ui` — Preact screens (title, class select, camp, HUD)
- `scripts/simulate.ts` — the `npm run sim` entry point

`core`, `data`, `mods`, `calc`, `gen`, `sim` and `run` are headless (no Phaser, Preact or DOM) and
run under Node and Vitest; ESLint enforces the boundaries.

`dist/` is a plain static site (relative paths), so it can be hosted anywhere.

## Visual style

The map is rendered as isometric Grimdark: crunchy pixel art, a diagonal 2:1 camera, real-time lights and
particles (`src/render/styles/grim/`, shared figure rig in `src/render/style/`). Three other styles were
explored and removed; see `docs/VISUAL_STYLES.md`. _Showcase_ mode on the Title screen auto-plays a demo
(N = next class). Uncaught errors are saved to `localStorage['bob.crashlog']` and shown as a copyable report
(`src/crashlog.ts`). Known bugs to revisit are in `docs/BUGS.md`.
