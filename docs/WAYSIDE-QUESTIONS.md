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

## Y1 — stops

**Q. May a stop and a Respite share a set?**
Chosen: yes. The plan said only "never in the slot a forced Respite takes". A set can then be [map, stop, Respite]. Moving the
stop to another level would need state (which window already has its stop), and the schedule is deliberately stateless. If it feels
thin, the fix is to let a Respite replace the stop's slot instead.

**Q. How do the three offers keep their old streams?**
Chosen: the stop's level, kind and slot come from their own RNG forks (`stopat`, `stopkind`, `stopslot`), so adding stops did not
move the themes, offsets, types or Respites of any set. A stop replaces a slot after those rolls were made, as a Respite does.

**Q. Is a stop's screen saved?**
Chosen: no. The Next map tab holds it in memory and `takeStop` applies the whole choice at once (and is final: it clears undo).
A reload mid-stop returns to camp with the stop still on offer. This also avoids a "screen: stop" save state.

**Q. Does the Awlsmith's free socket apply to any item?**
Chosen: any worn or carried item that is not sealed, has no fixed sockets and is below its socket limit. The limit follows the
item's own level, so the starting gear often has no room; the stop is then useless until better gear is found, and the bot does not
take it. (If that is too stingy, the stop could also raise the ceiling by one.)

**Q. What does the Gem Hoard lay out for a kind?**
Chosen: active gems carrying that tag, plus supports that list the tag among what they support (not the supports that fit
anything), drawn by drop weight. Tags with fewer than eight such gems lay out fewer. Gems arrive at level 1 like any gem.

**Q. Does auto-continue pause for a stop?**
Chosen: yes, whenever a stop is in the set ("The Awlsmith is on offer"), because auto-continue takes the anchor map and a player
who is not looking would never see it. The pause ends when the player takes the anchor by hand or takes the stop.

**Q. What does the default bot do at a stop?**
Chosen: it takes the Awlsmith when a worn item has room (a socket on the item that holds its gems), and never the Gem Hoard; a
`stopper` strategy takes every stop it can use. Both are first guesses; Y7 measures them.
