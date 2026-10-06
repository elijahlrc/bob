# Bugs to return to

Collected during visual-style exploration; to be worked after an aesthetic is chosen.
Add new entries at the bottom. Remove entries once fixed (git history has the detail).

## 1. Crash after the player tried to shoot an unhittable enemy (open, needs the report)

**Symptom.** A full crash after the character kept shooting an enemy it could not hit. This may have been
the same situation as the (now fixed) ranged-standoff bug, so it may no longer happen.

**Status.** Error text unknown. Crash logging exists (`src/crashlog.ts`): a crash is stored in
`localStorage['bob.crashlog']` and shown as a copyable report with a snapshot of the player, its target
and the actor counts. Paste that report here if it recurs.

## Notes on the fixed ranged-standoff bug (for reference)

Player and ranged enemies stood shooting each other without anyone dying. One or more of these fixed it
(not isolated): even-count arrow fans now keep one arrow on the aim line (`fanAngle` in
`src/sim/actions.ts`; the cause found headlessly), enemies notice the player from 10 tiles and wake when
the player attacks nearby, the player drops a target it cannot damage for 20 s, and it closes in when
arrows keep hitting walls. A stall report is saved to the crash log with per-arrow diagnostics if a stall
ever recurs; the `stall-*` scripts in `scripts/` replay bot campaigns looking for them.
