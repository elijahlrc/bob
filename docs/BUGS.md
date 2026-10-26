# Bugs to return to

Known bugs not yet fixed. Add new entries at the bottom. Remove entries once fixed (git history has the detail).

## Channelled skills redraw their area outline on every pulse (2026-10-25)

A channelled area skill such as Blaze Stream draws its area outline again on each sub-cast (each pulse of the channel), so
the outline flickers or stacks while the channel runs. It should be drawn once when the channel starts and held until it
ends.
