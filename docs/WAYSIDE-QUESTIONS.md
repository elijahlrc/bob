# Wayside: questions met while building, and what was chosen

Written while implementing [WAYSIDE.md](WAYSIDE.md) (2026-10-13 onwards), for the author to read later. Each entry says the
question, what was done in its place, and why. Nothing here blocked the work; every choice is cheap to change. Newest last.

## 2026-10-13 — build order

**Q. Y0 (measure) is first in the plan. Build it first?**
Chosen: no. The user said a wrong first guess is cheap to fix, so Y1 to Y6 are built with the plan's guessed numbers and the
measurement (lethal hits per map, Dust income per level, the `stopper` bot bound) is done in Y7, when there is something to
tune. WAYSIDE.md section 11 says so.

**Q. `RunState.wayside` required or optional?**
Chosen: optional, read through `waysideOf(run)`, which fills every missing field with a default. Old saves, test fixtures that
build a `RunState` literal and the showcase/gallery runs then need no change, and a new field never needs another save version.
`SAVE_VERSION` is 19 anyway (the doc said so), with version 18 accepted unchanged.

**Q. Where does "the level is over, roll the next offers" live?**
Chosen: one `advanceLevel(run)` in `run.ts`, called by `finishMap`, `takeRespite` and (new) the stops. There were two copies;
a third would have drifted.
